<script>
  import { onMount } from 'svelte';
  import { player, currentView, setPlayer, startFetch, endFetch } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { getRankImgUrl } from '../../lib/constants';
  import LookupView from './LookupView.svelte';
  import TrackerView from './TrackerView.svelte';
  import LoadingCard from '../landing/LoadingCard.svelte';

  export let initialView = 'landing';

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

  function handlePopState() {
    checkUrlParams();
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const rawName = params.get('name');
    const rawTag = params.get('tag');
    const rawRegion = params.get('region');
    const rawMode = params.get('mode');
    const hash = window.location.hash;

    if (hash === '#esports') {
      currentView.set('esports');
      setPlayer({ name: '', tag: '', loaded: true, fetching: false });
      return;
    } else if (hash === '#skins') {
      currentView.set('store');
      setPlayer({ name: '', tag: '', loaded: true, fetching: false });
      return;
    } else if (hash === '#meta') {
      currentView.set('coach');
      setPlayer({ name: '', tag: '', loaded: true, fetching: false });
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
      // No name/tag in URL — show LookupView, don't redirect
      setPlayer({ name: '', tag: '', region: region || 'ap', mode: mode || 'competitive', loaded: false, fetching: false });
    }
  }

  function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(`${API_BASE}${url}`, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
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

    const enc = encodeURIComponent(p.name);
    const encTag = encodeURIComponent(p.tag);
    const isRanked = p.mode === 'competitive';
    const nc = Date.now();

    try {
      console.log('[AppShell] Fetching API data...');
      const [mmrRes, matchRes, accountRes, mmrHistRes] = await Promise.all([
        isRanked
          ? fetchWithTimeout(`/api/v3/mmr/${p.region}/pc/${enc}/${encTag}?_nocache=${nc}`)
          : Promise.resolve(null),
        fetchWithTimeout(`/api/v3/matches/${p.region}/${enc}/${encTag}?mode=${p.mode}&size=20&_nocache=${nc}`),
        fetchWithTimeout(`/api/v1/account/${enc}/${encTag}?_nocache=${nc}`),
        fetchWithTimeout(`/api/v1/stored-mmr-history/${p.region}/${enc}/${encTag}?_nocache=${nc}`)
      ]);

      console.log('[AppShell] API responses:', { mmr: mmrRes?.status, match: matchRes?.status, account: accountRes?.status, hist: mmrHistRes?.status });

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

      mmrHistory = {};
      if (mmrHistResData?.data?.length) {
        mmrHistResData.data.forEach(e => {
          mmrHistory[e.match_id] = e.last_mmr_change;
        });
      }

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

  $: if ($player.fetching && !$player.loaded) {
    if (!fetchLock) {
      fetchLock = true;
      fetchStats().finally(() => {
        fetchLock = false;
      });
    }
  }


</script>

{#if $player.fetching && !$player.loaded}
  <div class="appshell-loading-container">
    <LoadingCard
      playerName={$player.name}
      playerTag={$player.tag}
      region={$player.region}
      mode={$player.mode}
      visible={true}
    />
  </div>
{:else}
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
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    background: #030304;
  }
  .appshell-loading-container :global(.loading-card) {
    width: 100%;
    max-width: 420px;
  }
</style>
