<script>
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { player, currentView, setPlayer, startFetch, endFetch, purgeObsoleteCacheIfNeeded } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { saveMatches } from '../../lib/indexeddb';
  import { getRankImgUrl } from '../../lib/constants';
  import { initAssetCache } from '../../lib/assets';
  import { loadMyProfile, saveMyProfile } from '../../lib/session';
  import LookupView from './LookupView.svelte';
  import TrackerView from './TrackerView.svelte';
  import LoadingCard from '../landing/LoadingCard.svelte';
  import NetworkStatus from '../shared/NetworkStatus.svelte';
  import { trackEvent } from '../../lib/analytics';

  export let initialView = 'landing';
  let redirecting = false;

  function sanitizeTag(raw) {
    if (!raw) return raw;
    let tag = raw;
    // Reverse HTML entity corruption: ® = decoded &reg; from &region param
    tag = tag.replace(/\u00AE/g, '&');
    // If tag got merged with other URL params, extract just the tag portion
    const sepIdx = tag.search(/[=&]/);
    if (sepIdx !== -1) tag = tag.substring(0, sepIdx);
    // Strip any remaining non-alphanumeric chars (valid: _, -)
    return tag.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  let stats = null;
  let mmrData = null;
  let accountData = null;
  let allMatches = [];
  let mmrHistory = {};

  const API_BASE = import.meta.env.PUBLIC_API_URL || '';

  // Active in-flight request tracking & cancellation
  let activeAbortController = null;
  let activeFetchPromise = null;
  let activeFetchKey = '';

  onMount(() => {
    purgeObsoleteCacheIfNeeded();
    console.log('[AppShell] mounted. API_BASE:', API_BASE || '(relative /api)');
    console.log('[AppShell] URL:', window.location.href);

    // Warm up Render backend immediately to minimize cold start latency
    fetch(`${API_BASE}/api/health`).catch(() => {});

    initAssetCache().then(() => {
      console.log('[AppShell] Asset cache initialized');
    });

    window.addEventListener('popstate', handlePopState);
    checkUrlParams();

    const safetyTimeout = setTimeout(() => {
      let p;
      player.subscribe(v => p = v)();
      if (p.fetching && !p.loaded) {
        console.warn('[AppShell] Safety timeout: fetch took longer than 60s, resetting state');
        if (activeAbortController) activeAbortController.abort();
        setPlayer({ fetching: false, loaded: false });
        if (window.showToast) window.showToast('Connection timed out. Please check your network and try again.');
      }
    }, 60000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(safetyTimeout);
      if (activeAbortController) activeAbortController.abort();
    };
  });

  function handleCancelFetch() {
    if (activeAbortController) activeAbortController.abort();
    setPlayer({ name: '', tag: '', fetching: false, loaded: false });
    if (typeof navigate === 'function') {
      navigate('/app');
    } else {
      window.location.href = '/app';
    }
  }

  function handlePopState() {
    checkUrlParams();
  }

  function applyPlayerData(targetName, targetTag, targetRegion, targetMode) {
    const r = (targetRegion || 'ap').toLowerCase();
    const m = (targetMode || 'competitive').toLowerCase();
    const profileCacheKey = `valtracker_cached_profile_${targetName.toLowerCase()}_${targetTag.toLowerCase()}_${r}_${m}`;
    let cachedProfile = null;
    try {
      const raw = sessionStorage.getItem(profileCacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - parsed.timestamp < 600000) {
          cachedProfile = parsed;
        }
      }
    } catch {}

    if (cachedProfile) {
      stats = cachedProfile.stats;
      mmrData = cachedProfile.mmrData;
      accountData = cachedProfile.accountData;
      allMatches = cachedProfile.allMatches;
      mmrHistory = cachedProfile.mmrHistory;
      setPlayer({
        name: targetName,
        tag: targetTag,
        region: r,
        mode: m,
        fetching: false,
        loaded: true
      });
      currentView.set('tracker');
    } else {
      setPlayer({
        name: targetName,
        tag: targetTag,
        region: r,
        mode: m,
        fetching: true,
        loaded: false
      });
      currentView.set('tracker');
    }
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    // /leaderboards page: always show leaderboard view (LeaderboardHub works standalone)
    if (window.location.pathname === '/leaderboards' || window.location.pathname === '/leaderboard' || initialView === 'leaderboards') {
      currentView.set('leaderboards');
      setPlayer({ loaded: true, fetching: false });
      return;
    }
    // /comp page: always show coach view (DraftCoach works standalone even without player data)
    if (window.location.pathname === '/comp') {
      currentView.set('coach');
      setPlayer({ loaded: true, fetching: false });
      return;
    }
    // /store page: always show skins store view (SkinsStore works standalone)
    if (window.location.pathname === '/store' || initialView === 'store') {
      currentView.set('store');
      setPlayer({ loaded: true, fetching: false });
      return;
    }
    // /esports page: always show esports hub view (EsportsHub works standalone)
    if (window.location.pathname === '/esports' || initialView === 'esports') {
      currentView.set('esports');
      setPlayer({ loaded: true, fetching: false });
      return;
    }
    const rawName = params.get('name');
    const rawTag = params.get('tag');
    const rawRegion = params.get('region');
    const rawMode = params.get('mode');
    const hash = window.location.hash;

    if (hash === '#leaderboards' || hash === '#leaderboard') {
      currentView.set('leaderboards');
      setPlayer({ loaded: true, fetching: false });
      return;
    } else if (hash === '#esports') {
      currentView.set('esports');
      setPlayer({ loaded: true, fetching: false });
      return;
    } else if (hash === '#skins' || hash === '#store') {
      currentView.set('store');
      setPlayer({ loaded: true, fetching: false });
      return;
    } else if (hash === '#meta') {
      currentView.set('coach');
      setPlayer({ loaded: true, fetching: false });
      return;
    } else if (hash === '#overlay') {
      currentView.set('overlay');
      setPlayer({ loaded: true, fetching: false });
      return;
    }

    const name = rawName;
    const tag = sanitizeTag(rawTag);
    let region = rawRegion;
    let mode = rawMode;

    // If region was swallowed into tag (e.g. tag=khel®ion=ap), try to recover it
    if (!region && rawTag) {
      const rawTagClean = rawTag.replace(/\u00AE/g, '&');
      const regionMatch = rawTagClean.match(/[=&](ap|na|eu|kr)\b/i);
      if (regionMatch) {
        region = regionMatch[1].toLowerCase();
      }
    }

    if (name && tag) {
      applyPlayerData(name, tag, region, mode);

      // Clean up corrupted URL so future refreshes work
      const cleanParams = new URLSearchParams();
      cleanParams.set('name', name);
      cleanParams.set('tag', tag);
      cleanParams.set('region', region || 'ap');
      cleanParams.set('mode', mode || 'competitive');
      window.history.replaceState({}, '', `/app?${cleanParams.toString()}`);
    } else {
      // No name/tag in URL (e.g. clicked "Track Now" on landing page) — render LookupView
      setPlayer({ name: '', tag: '', fetching: false, loaded: false });
      currentView.set('tracker');
      redirecting = false;
      return;
    }
  }

  function fetchWithTimeout(url, opts = {}, timeoutMs = 45000, signal = null) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    // If an external signal was passed, propagate its abort
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    return fetch(`${API_BASE}${url}`, { ...opts, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  async function fetchWithRetry(url, opts = {}, timeoutMs = 45000, retries = 2, signal = null) {
    for (let i = 0; i <= retries; i++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        const res = await fetchWithTimeout(url, opts, timeoutMs, signal);
        if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
          if (i === retries) return res;
          const delay = Math.pow(2, i) * 1500 + Math.floor(Math.random() * 500);
          console.warn(`[AppShell] HTTP ${res.status} for ${url}, retrying in ${delay}ms (attempt ${i + 1}/${retries})...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return res;
      } catch (e) {
        if (signal?.aborted || e.name === 'AbortError') throw e;
        if (i === retries) throw e;
        const delay = (i + 1) * 2000;
        console.warn(`[AppShell] Fetch attempt ${i + 1} failed for ${url}, retrying in ${delay}ms...`, e.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  async function fetchStats(explicitPlayer = null) {
    let p;
    player.subscribe(v => p = v)();
    if (explicitPlayer) p = explicitPlayer;
    if (!p.name || !p.tag) {
      console.warn('[AppShell] fetchStats: no name/tag, returning early');
      return;
    }

    const currentKey = `${p.name.toLowerCase()}#${p.tag.toLowerCase()}#${p.region}#${p.mode}`;

    // Return existing in-flight request if identical to avoid duplicate network load
    if (activeFetchPromise && activeFetchKey === currentKey) {
      return activeFetchPromise;
    }

    // Cancel any previous in-flight request for different target
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const abortSignal = activeAbortController.signal;
    activeFetchKey = currentKey;

    activeFetchPromise = (async () => {
      console.log('[AppShell] fetchStats starting for', p.name, '#', p.tag, 'region:', p.region, 'mode:', p.mode);
      trackEvent('player_search', { name: p.name, region: p.region, mode: p.mode });
      startFetch();

      if (typeof window !== 'undefined') {
        document.body.classList.remove('scrolled-down', 'scrolled-up');
        window.scrollTo({ top: 0 });
      }

      const enc = encodeURIComponent(p.name);
      const encTag = encodeURIComponent(p.tag);
      const isRanked = p.mode === 'competitive';

      try {
        console.log('[AppShell] Fetching API data in parallel...');
        
        // Fetch all profile details concurrently with resilience
        const results = await Promise.allSettled([
          fetchWithRetry(`/api/v1/account/${enc}/${encTag}`, {}, 45000, 2, abortSignal),
          isRanked
            ? fetchWithRetry(`/api/v3/mmr/${p.region}/pc/${enc}/${encTag}`, {}, 45000, 2, abortSignal)
            : Promise.resolve(null),
          fetchWithRetry(`/api/v3/matches/${p.region}/${enc}/${encTag}?mode=${p.mode}&size=20`, {}, 45000, 2, abortSignal),
          fetchWithRetry(`/api/v1/stored-mmr-history/${p.region}/${enc}/${encTag}`, {}, 30000, 1, abortSignal)
        ]);

        if (abortSignal.aborted) return;

        const accountRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const mmrRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const matchRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const mmrHistRes = results[3].status === 'fulfilled' ? results[3].value : null;

        console.log('[AppShell] API responses:', { 
          account: accountRes?.status, 
          mmr: mmrRes?.status, 
          match: matchRes?.status, 
          hist: mmrHistRes?.status 
        });

        const accountResData = accountRes?.ok ? await accountRes.json().catch(() => null) : null;
        const mmrResData = mmrRes?.ok ? await mmrRes.json().catch(() => null) : null;
        let matchResData = matchRes?.ok ? await matchRes.json().catch(() => null) : null;
        const mmrHistResData = mmrHistRes?.ok ? await mmrHistRes.json().catch(() => null) : null;

        if ((!matchResData || !matchResData.data) && accountResData?.data) {
          matchResData = { status: 200, data: [] };
        }
        if (!matchResData && !accountResData) {
          throw new Error('Player profile not found. Please verify the Riot ID and Tag.');
        }

        const resolvedMmrData = mmrResData?.data || null;
        const resolvedAccountData = accountResData?.data || null;
        const resolvedAllMatches = matchResData?.data || [];

        // Save matches to IndexedDB for Performance Lab and other local features
        saveMatches(resolvedAllMatches, p.name, p.tag, p.mode).catch(e => {
          console.warn('[AppShell] Failed to save matches to IndexedDB:', e);
        });

        const hist = {};
        if (mmrHistResData?.data?.length) {
          mmrHistResData.data.forEach(e => {
            const rrVal = e.last_mmr_change !== undefined && e.last_mmr_change !== null
              ? e.last_mmr_change
              : e.mmr_change_to_last_game;
            if (e.match_id && rrVal !== undefined && rrVal !== null) {
              hist[e.match_id] = rrVal;
            }
          });
        }

        let computedStats = null;
        try {
          computedStats = processMatches(resolvedAllMatches, p.name, p.tag, p.act);
        } catch (e) {
          console.error('processMatches error:', e);
          computedStats = { matchesCount: 0, kd: 0, avgKills: 0, avgDeaths: 0, avgAssists: 0, avgACS: 0, hsRate: 0, winRate: 0, wins: 0, losses: 0, agentMap: {}, mapData: {}, rrHistory: [], recentMatches: [], precomputedWeapons: {} };
        }

        // Atomically assign all data before switching loaded state
        mmrData = resolvedMmrData;
        accountData = resolvedAccountData;
        allMatches = resolvedAllMatches;
        mmrHistory = hist;
        stats = computedStats;

        console.log('[AppShell] Data loaded successfully. Calling endFetch. matches:', allMatches.length);
        endFetch(p.name, p.tag);

        const searchParams = new URLSearchParams();
        searchParams.set('name', p.name);
        searchParams.set('tag', p.tag);
        searchParams.set('region', p.region);
        searchParams.set('mode', p.mode);
        window.history.pushState({}, '', `/app?${searchParams.toString()}`);

        try {
          const rankName = mmrData?.current?.tier?.name || 'UNRANKED';
          const entry = {
            name: p.name,
            tag: p.tag,
            region: p.region,
            mode: p.mode,
            rankName,
            rankImg: getRankImgUrl(rankName),
            timestamp: Date.now()
          };
          const raw = localStorage.getItem('valtracker_recent_searches');
          let recent = raw ? JSON.parse(raw) : [];
          recent = recent.filter(r => !(r.name.toLowerCase() === p.name.toLowerCase() && r.tag.toLowerCase() === p.tag.toLowerCase()));
          recent.unshift(entry);
          recent = recent.slice(0, 6);
          localStorage.setItem('valtracker_recent_searches', JSON.stringify(recent));
          saveMyProfile(p.name, p.tag, p.region, p.mode);

          const profileCacheKey = `valtracker_cached_profile_${p.name.toLowerCase()}_${p.tag.toLowerCase()}_${(p.region || 'ap').toLowerCase()}_${(p.mode || 'competitive').toLowerCase()}`;
          sessionStorage.setItem(profileCacheKey, JSON.stringify({
            stats: computedStats,
            mmrData: resolvedMmrData,
            accountData: resolvedAccountData,
            allMatches: resolvedAllMatches,
            mmrHistory: hist,
            timestamp: Date.now()
          }));
        } catch {}

      } catch (err) {
        if (abortSignal.aborted || err.name === 'AbortError') {
          console.log('[AppShell] Fetch was aborted.');
          return;
        }
        console.error('Fetch error:', err);
        setPlayer({ fetching: false, loaded: false });
        if (window.showToast) {
          window.showToast(err.message || 'Failed to fetch stats. Check the Riot ID.');
        }
      } finally {
        activeFetchPromise = null;
      }
    })();

    return activeFetchPromise;
  }

  $: if ($player.fetching && !$player.loaded && $player.name && $player.tag) {
    const currentKey = `${$player.name.toLowerCase()}#${$player.tag.toLowerCase()}#${$player.region}#${$player.mode}`;
    if (!activeFetchPromise || activeFetchKey !== currentKey) {
      fetchStats();
    }
  }


</script>

{#if $player.fetching && !$player.loaded}
  <div class="appshell-loading-container">
    <div class="loading-brand">
      <img src="/logo.png" class="loading-logo" alt="ValTracker Logo">
      <span class="loading-brand-name">ValTracker</span>
    </div>
    <LoadingCard
      playerName={$player.name}
      playerTag={$player.tag}
      region={$player.region}
      mode={$player.mode}
      visible={true}
      onCancel={handleCancelFetch}
    />
  </div>
{:else if !redirecting}
  {#if $player.loaded}
    <TrackerView
      {stats}
      {mmrData}
      {accountData}
      {allMatches}
      {mmrHistory}
      onFetchStats={() => fetchStats()}
    />
  {:else}
    <LookupView />
  {/if}
{/if}

<NetworkStatus />

<style>
  .appshell-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 24px 16px;
    box-sizing: border-box;
    width: 100%;
    background: #030304;
  }
  .appshell-loading-container :global(.loading-card) {
    width: 100%;
    max-width: 420px;
  }
  .loading-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .loading-logo {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    flex-shrink: 0;
  }
  .loading-brand-name {
    font-family: 'Barlow Condensed', 'Rajdhani', sans-serif;
    font-weight: 900;
    font-size: 34px;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 3px;
    line-height: 1;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 480px) {
    .appshell-loading-container {
      padding: 16px 12px;
    }
    .loading-brand {
      gap: 8px;
      margin-bottom: 14px;
    }
    .loading-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
    .loading-brand-name {
      font-size: 24px;
      letter-spacing: 1.5px;
    }
  }
</style>
