<script>
  import { onMount } from 'svelte';
  import Topbar from './Topbar.svelte';
  import HeroSection from './HeroSection.svelte';
  import StatCards from './StatCards.svelte';
  import RankDisplay from './RankDisplay.svelte';
  import MatchHistory from './MatchHistory.svelte';
  import RrGraph from './RrGraph.svelte';
  import PerfTrend from './PerfTrend.svelte';
  import AgentCards from './AgentCards.svelte';
  import MapCards from './MapCards.svelte';
  import WeaponLab from './WeaponLab.svelte';
  import ValBotCoach from './ValBotCoach.svelte';
  import DeepAnalysis from './DeepAnalysis.svelte';
  import { player, currentView, setPlayer, startFetch, endFetch } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { ACTS_TIMELINE, RANKS, getRankFromRR } from '../../lib/constants';
  import EsportsHub from '../esports/EsportsHub.svelte';
  import SkinsStore from '../store/SkinsStore.svelte';
  import DraftCoach from '../coach/DraftCoach.svelte';

  let stats = null;
  let mmrData = null;
  let accountData = null;
  let allMatches = [];
  let mmrHistory = {};
  let playerState = { name: '', tag: '', region: 'ap', mode: 'competitive' };

  $: rankName = mmrData?.current?.tier?.name || 'Silver 2';

  player.subscribe(p => { playerState = p; });

  onMount(() => {
    checkUrlParams();
  });

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const tag = params.get('tag');
    const region = params.get('region');
    const mode = params.get('mode');
    if (name && tag) {
      setPlayer({
        name,
        tag,
        region: region || 'ap',
        mode: mode || 'competitive'
      });
      fetchStats();
    }
  }

  async function fetchStats() {
    const p = get(player);
    if (!p.name || !p.tag) return;

    startFetch();

    const enc = encodeURIComponent(p.name);
    const isRanked = p.mode === 'competitive';
    const nc = Date.now();

    try {
      const [mmrRes, matchRes, accountRes, mmrHistRes] = await Promise.all([
        isRanked
          ? fetch(`/api/v3/mmr/${p.region}/${enc}/${p.tag}?_nocache=${nc}`)
          : Promise.resolve(null),
        fetch(`/api/v3/matches/${p.region}/${enc}/${p.tag}?mode=${p.mode}&size=20&_nocache=${nc}`),
        fetch(`/api/v1/account/${enc}/${p.tag}?_nocache=${nc}`),
        fetch(`/api/v1/stored-mmr-history/${p.region}/${enc}/${p.tag}?_nocache=${nc}`)
      ]);

      const mmrResData = mmrRes?.ok ? await mmrRes.json() : null;
      const matchResData = matchRes.ok ? await matchRes.json() : null;
      const accountResData = accountRes.ok ? await accountRes.json() : null;
      const mmrHistResData = mmrHistRes?.ok ? await mmrHistRes.json() : null;

      if (!matchResData && !accountResData) {
        throw new Error('Invalid Riot ID or player not found.');
      }

      mmrData = mmrResData?.data || null;
      accountData = accountResData || null;
      allMatches = matchResData?.data || [];

      // Build mmr history map
      mmrHistory = {};
      if (mmrHistResData?.data?.length) {
        mmrHistResData.data.forEach(e => {
          mmrHistory[e.match_id] = e.last_mmr_change;
        });
      }

      // Process matches
      stats = processMatches(allMatches, p.name, p.tag, p.act);

      endFetch(p.name, p.tag);

      // Add to recent searches
      try {
        const rankName = mmrData?.current?.tier?.name || 'UNRANKED';
        const { getRankImgUrl } = await import('../../lib/constants');
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
    }
  }

  function get(store) {
    let value;
    store.subscribe(v => value = v)();
    return value;
  }
</script>

<div class="tracker-layout">
  <Topbar onFetchStats={fetchStats} />

  {#if $currentView === 'tracker'}
  <HeroSection {mmrData} {accountData} matches={allMatches} />

  <div class="tracker-content">
    <div class="tracker-grid">
      <div class="grid-rank">
        <RankDisplay {mmrData} {stats} {mmrHistory} />
      </div>
      <div class="grid-stats">
        <StatCards {stats} />
      </div>
    </div>

    <!-- Agent Roster -->
    <div class="section-label">
      <span class="sl-text">Agent Roster</span>
      <span class="sl-line"></span>
      <span class="sl-num">03</span>
    </div>
    <AgentCards
      agentMap={stats?.agentMap || {}}
      {allMatches}
    />

    <!-- Map Performance -->
    <div class="section-label">
      <span class="sl-text">Map Performance</span>
      <span class="sl-line"></span>
      <span class="sl-num">04</span>
    </div>
    <MapCards mapData={stats?.mapData || {}} />

    <div class="section-label">
      <span class="sl-text">Match History</span>
      <span class="sl-line"></span>
      <span class="sl-num">05</span>
    </div>
    <MatchHistory
      recentMatches={stats?.recentMatches || []}
      {mmrHistory}
      allRawMatches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
    />

    <div class="section-label">
      <span class="sl-text">RR Progression</span>
      <span class="sl-line"></span>
      <span class="sl-num">06</span>
    </div>
    <RrGraph
      history={stats?.rrHistory || []}
      currentRR={mmrData?.current?.rr ?? 0}
      {mmrHistory}
    />

    <div class="section-label">
      <span class="sl-text">Performance Trend</span>
      <span class="sl-line"></span>
      <span class="sl-num">07</span>
    </div>
    <PerfTrend matches={stats?.recentMatches || []} />

    <!-- Weapon Lab -->
    <div class="section-label">
      <span class="sl-text">Weapon Lab</span>
      <span class="sl-line"></span>
      <span class="sl-num">08</span>
    </div>
    <WeaponLab
      precomputedWeapons={stats?.precomputedWeapons || {}}
      playerName={playerState.name}
      playerTag={playerState.tag}
    />

    <!-- AI Performance Analysis -->
    <div class="section-label">
      <span class="sl-text">AI Performance Analysis</span>
      <span class="sl-line"></span>
      <span class="sl-num">09</span>
    </div>
    <ValBotCoach
      matches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      {rankName}
    />

    <!-- Deep Game Analysis -->
    <div class="section-label">
      <span class="sl-text">Deep Game Analysis</span>
      <span class="sl-line"></span>
      <span class="sl-num">10</span>
    </div>
    <DeepAnalysis
      matches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      {mmrHistory}
    />
  </div>
  {/if}

  {#if $currentView === 'esports'}
    <EsportsHub />
  {/if}

  {#if $currentView === 'store'}
    <SkinsStore />
  {/if}

  {#if $currentView === 'coach'}
    <DraftCoach playerAgentPool={stats?.agentMap || {}} />
  {/if}
</div>

<style>
  .tracker-layout {
    min-height: 100vh;
  }

  .tracker-content {
    padding: 0 28px 60px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .tracker-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 10px;
    margin-bottom: 8px;
  }

  .grid-rank {
    min-width: 0;
  }

  .grid-stats {
    min-width: 0;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 2px 10px;
  }

  .sl-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .sl-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
  }

  .sl-num {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    letter-spacing: 1px;
  }

  @media (max-width: 900px) {
    .tracker-grid {
      grid-template-columns: 1fr;
    }
    .tracker-content {
      padding: 0 16px 40px;
    }
  }
</style>
