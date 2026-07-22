<script>
  import { onMount } from 'svelte';
  import { player, currentView, setPlayer, startFetch, endFetch } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { saveMatches } from '../../lib/indexeddb';
  import { getRankImgUrl } from '../../lib/constants';
  import { initAssetCache } from '../../lib/assets';
  import LookupView from './LookupView.svelte';
  import TrackerView from './TrackerView.svelte';
  import LoadingCard from '../landing/LoadingCard.svelte';

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

  onMount(() => {
    console.log('[AppShell] mounted. API_BASE:', API_BASE || '(relative /api)');
    console.log('[AppShell] URL:', window.location.href);

    initAssetCache().then(() => {
      console.log('[AppShell] Asset cache initialized');
    });

    window.addEventListener('popstate', handlePopState);
    checkUrlParams();

    const safetyTimeout = setTimeout(() => {
      let p;
      player.subscribe(v => p = v)();
      if (p.fetching && !p.loaded) {
        console.warn('[AppShell] Safety timeout: forcing endFetch after 60s');
        endFetch(p.name, p.tag);
      }
    }, 60000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(safetyTimeout);
    };
  });

  function handleCancelFetch() {
    endFetch($player.name, $player.tag);
    setPlayer({ name: '', tag: '', fetching: false, loaded: false });
    window.location.href = '/login';
  }

  function handlePopState() {
    checkUrlParams();
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    // /comp page: always show coach view (DraftCoach works standalone even without player data)
    if (window.location.pathname === '/comp') {
      currentView.set('coach');
      setPlayer({ loaded: true, fetching: false });
      return;
    }
    const rawName = params.get('name');
    const rawTag = params.get('tag');
    const rawRegion = params.get('region');
    const rawMode = params.get('mode');
    const hash = window.location.hash;

    if (hash === '#esports') {
      currentView.set('esports');
      setPlayer({ loaded: true, fetching: false });
      return;
    } else if (hash === '#skins') {
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
      const playerData = {
        name,
        tag,
        region: region || 'ap',
        mode: mode || 'competitive',
        fetching: true,
        loaded: false
      };
      setPlayer(playerData);

      // Clean up corrupted URL so future refreshes work
      const cleanParams = new URLSearchParams();
      cleanParams.set('name', name);
      cleanParams.set('tag', tag);
      cleanParams.set('region', region || 'ap');
      cleanParams.set('mode', mode || 'competitive');
      window.history.replaceState({}, '', `/app?${cleanParams.toString()}`);
    } else {
      // No name/tag in URL — redirect to /login (the standalone lookup page)
      redirecting = true;
      window.location.href = '/login';
      return;
    }
  }

  function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(`${API_BASE}${url}`, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  async function fetchWithRetry(url, opts = {}, timeoutMs = 30000, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fetchWithTimeout(url, opts, timeoutMs);
      } catch (e) {
        if (i === retries) throw e;
        console.warn(`[AppShell] Fetch attempt ${i + 1} failed, retrying...`, e.message);
        await new Promise(r => setTimeout(r, 3000 * (i + 1)));
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

    console.log('[AppShell] fetchStats starting for', p.name, '#', p.tag, 'region:', p.region, 'mode:', p.mode);
    startFetch();

    if (typeof window !== 'undefined') {
      document.body.classList.remove('scrolled-down', 'scrolled-up');
      window.scrollTo({ top: 0 });
    }

    const enc = encodeURIComponent(p.name);
    const encTag = encodeURIComponent(p.tag);
    const isRanked = p.mode === 'competitive';
    const nc = Date.now();

    try {
      console.log('[AppShell] Fetching API data...');
      const [mmrRes, matchRes, accountRes, mmrHistRes] = await Promise.all([
        isRanked
          ? fetchWithRetry(`/api/v3/mmr/${p.region}/pc/${enc}/${encTag}?_nocache=${nc}`)
          : Promise.resolve(null),
        fetchWithRetry(`/api/v3/matches/${p.region}/${enc}/${encTag}?mode=${p.mode}&size=20&_nocache=${nc}`),
        fetchWithRetry(`/api/v1/account/${enc}/${encTag}?_nocache=${nc}`),
        fetchWithRetry(`/api/v1/stored-mmr-history/${p.region}/${enc}/${encTag}?_nocache=${nc}`)
      ]);

      console.log('[AppShell] API responses:', { mmr: mmrRes?.status, match: matchRes?.status, account: accountRes?.status, hist: mmrHistRes?.status });
      console.log('[AppShell] matchRes.ok:', matchRes?.ok, 'status:', matchRes?.status);

      const mmrResData = mmrRes?.ok ? await mmrRes.json() : null;
      let matchResData = matchRes?.ok ? await matchRes.json() : null;
      const accountResData = accountRes?.ok ? await accountRes.json() : null;
      const mmrHistResData = mmrHistRes?.ok ? await mmrHistRes.json() : null;

      if ((!matchResData || !matchResData.data) && accountResData?.data) {
        matchResData = { status: 200, data: [] };
      }
      if (!matchResData && !accountResData) {
        throw new Error('Invalid Riot ID or player not found.');
      }

      mmrData = mmrResData?.data || null;
      accountData = accountResData?.data || null;
      allMatches = matchResData?.data || [];

      // Save matches to IndexedDB for Performance Lab and other local features
      saveMatches(allMatches, p.name, p.tag, p.mode).catch(e => {
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
      mmrHistory = hist;

      try {
        stats = processMatches(allMatches, p.name, p.tag, p.act);
      } catch (e) {
        console.error('processMatches error:', e);
        stats = { matchesCount: 0, kd: 0, avgKills: 0, avgDeaths: 0, avgAssists: 0, avgACS: 0, hsRate: 0, winRate: 0, wins: 0, losses: 0, agentMap: {}, mapData: {}, rrHistory: [], recentMatches: [], precomputedWeapons: {} };
      }

      console.log('[AppShell] Data loaded. Calling endFetch. matches:', allMatches.length);
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
      } catch {}

    } catch (err) {
      console.error('Fetch error:', err);
      endFetch(p.name, p.tag);
      if (window.showToast) {
        window.showToast(err.message || 'Failed to fetch stats. Check the Riot ID.');
      }
    }
  }

  // Use a module-level lock to prevent any concurrent fetches regardless of reactivity batching
  let fetchLock = false;
  let lastFetchKey = '';

  $: if ($player.fetching && !$player.loaded) {
    const currentKey = `${$player.name}|${$player.tag}|${$player.region}|${$player.mode}`;
    if (currentKey === lastFetchKey) {
      // Already have cached data for this exact player/config, no re-fetch needed
      endFetch($player.name, $player.tag);
    } else if (!fetchLock) {
      fetchLock = true;
      fetchStats().finally(() => {
        lastFetchKey = currentKey;
        fetchLock = false;
      });
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
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 28px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    line-height: 1;
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
