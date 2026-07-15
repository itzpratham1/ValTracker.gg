<script>
  import { onMount, onDestroy } from 'svelte';
  import Topbar from './Topbar.svelte';
  import TrackerNav from './TrackerNav.svelte';
  import HeroSection from './HeroSection.svelte';
  import StatCards from './StatCards.svelte';
  import MatchHistory from './MatchHistory.svelte';
  import RrGraph from './RrGraph.svelte';
  import PerfTrend from './PerfTrend.svelte';
  import AgentCards from './AgentCards.svelte';
  import MapCards from './MapCards.svelte';
  import WeaponLab from './WeaponLab.svelte';
  import ClutchImpact from './ClutchImpact.svelte';
  import AccuracyRoles from './AccuracyRoles.svelte';
  import ValBotCoach from './ValBotCoach.svelte';
  import DeepAnalysis from './DeepAnalysis.svelte';
  import PerformanceLab from './PerformanceLab.svelte';
  import StatModal from './StatModal.svelte';
  import SessionSummary from './SessionSummary.svelte';
  import ExportCard from './ExportCard.svelte';
  import ExportProfileCard from './ExportProfileCard.svelte';
  import HeadToHead from './HeadToHead.svelte';
  import BookmarksModal from './BookmarksModal.svelte';
  import LeaderboardModal from './LeaderboardModal.svelte';
  import FeedbackModal from './FeedbackModal.svelte';
  import Toast from '../shared/Toast.svelte';
  import Footer from '../shared/Footer.svelte';
  import ProfileShare from '../shared/ProfileShare.svelte';
  import { player, currentView, setPlayer, startFetch, endFetch } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { ACTS_TIMELINE, RANKS, getRankFromRR, getRankImgUrl } from '../../lib/constants';
  import { clearPlayerMatches } from '../../lib/indexeddb';
  import { normalizeMode } from '../../lib/utils';
  import EsportsHub from '../esports/EsportsHub.svelte';
  import SkinsStore from '../store/SkinsStore.svelte';
  import DraftCoach from '../coach/DraftCoach.svelte';
  import OverlayStudio from '../overlay/OverlayStudio.svelte';
  import { getPlayerList } from '../../lib/utils';

  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let allMatches = [];
  export let mmrHistory = {};
  export let onFetchStats = () => {};

  let playerState = { name: '', tag: '', region: 'ap', mode: 'competitive' };
  
  $: currentAgentName = (() => {
    if (!actFilteredMatches || !actFilteredMatches.length || !playerState.name) return '';
    const first = actFilteredMatches[0];
    const rawPlayers = first.players?.all_players || first.players || [];
    const players = Array.isArray(rawPlayers) ? rawPlayers : [];
    const me = players.find(p =>
      p.name?.toLowerCase() === playerState.name?.toLowerCase() &&
      p.tag?.toLowerCase() === playerState.tag?.toLowerCase()
    );
    return me?.character || me?.agent?.name || '';
  })();
  
  let selectedShareMatch = null;
  let h2hOpen = false;
  let leaderboardOpen = false;
  let feedbackOpen = false;
  let statModalOpen = false;
  let statModalKey = 'kd';
  let profileShareOpen = false;
  let exportProfileOpen = false;
  let bookmarksOpen = false;
  let activeSection = 'sec-combat';
  let activeAiTab = 'valbot';

  // Session management
  let sessionActive = false;
  let sessionStartTime = null;
  let sessionStartRR = 0;
  let sessionMatchesList = [];
  let sessionSummaryOpen = false;
  let sessionSummaryVisible = false;

  $: rankName = mmrData?.current?.tier?.name || 'Silver 2';
  $: winRate = stats?.winRate ?? 0;
  $: wins = stats?.wins ?? 0;
  $: losses = stats?.losses ?? 0;
  $: totalMatches = wins + losses;

  $: totalKills = (stats?.recentMatches || []).reduce((s, m) => s + (m.kills || 0), 0);

  // Act-filtered matches for consistent data across all sections
  $: actData = ACTS_TIMELINE[playerState.act];
  $: actFilteredMatches = actData ? allMatches.filter(m => {
    const gameStart = m.metadata?.game_start || m.metadata?.gameStart || null;
    if (!gameStart) return false;
    const ts = gameStart * 1000;
    return ts >= actData.start && ts < actData.end;
  }) : allMatches;

  player.subscribe(p => { playerState = p; });

  function scrollToSection(sectionId) {
    activeSection = sectionId;
    const el = document.getElementById(sectionId);
    if (el) {
      const topbar = document.querySelector('.topbar');
      const nav = document.querySelector('.tracker-nav');
      const topbarH = topbar ? topbar.offsetHeight : 108;
      const navH = nav ? nav.offsetHeight : 52;
      const top = el.getBoundingClientRect().top + window.scrollY - topbarH - navH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  let cleanupScroll;
  function setupScrollTracker() {
    const SECTION_IDS = [
      'sec-combat', 'sec-performance', 'sec-trend', 'sec-agents', 'sec-maps',
      'sec-weapons', 'sec-matches', 'sec-ai-tools'
    ];
    let ticking = false;
    const OFFSET = 180;
    function update() {
      let current = SECTION_IDS[0];
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const maxScroll = docH - viewportH;
      const atBottom = window.scrollY >= maxScroll - 5;

      if (!atBottom) {
        for (let i = 0; i < SECTION_IDS.length; i++) {
          const el = document.getElementById(SECTION_IDS[i]);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= OFFSET) {
            current = SECTION_IDS[i];
          }
        }
      } else {
        let bestDist = Infinity;
        const centerY = viewportH / 2;
        for (let i = 0; i < SECTION_IDS.length; i++) {
          const el = document.getElementById(SECTION_IDS[i]);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < viewportH) {
            const dist = Math.abs(rect.top - centerY);
            if (dist < bestDist) {
              bestDist = dist;
              current = SECTION_IDS[i];
            }
          }
        }
      }

      activeSection = current;
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(update);
    cleanupScroll = () => window.removeEventListener('scroll', onScroll);
  }

  function toggleSession() {
    if (!sessionActive) {
      sessionActive = true;
      sessionStartTime = new Date();
      sessionStartRR = mmrData?.current?.rr ?? 0;
      sessionMatchesList = [];
      sessionSummaryVisible = false;
      if (window.showToast) window.showToast('Session Started');
    } else {
      sessionActive = false;
      sessionSummaryVisible = true;
      if (window.showToast) window.showToast('Session Ended');
    }
  }

  function showSessionSummary() {
    sessionSummaryOpen = true;
  }

  function openStatModal(key) {
    statModalKey = key;
    statModalOpen = true;
  }

  async function handleClearMatches() {
    if (!playerState.name || !playerState.tag) {
      if (window.showToast) window.showToast('No player loaded');
      return;
    }
    try {
      await clearPlayerMatches(playerState.name, playerState.tag, normalizeMode(playerState.mode || 'competitive'));
      if (window.showToast) window.showToast('Stored matches cleared');
      onFetchStats();
    } catch(e) {
      if (window.showToast) window.showToast('Failed to clear matches');
    }
  }

  onMount(() => {
    setupScrollTracker();
  });

  onDestroy(() => {
    if (cleanupScroll) cleanupScroll();
  });
</script>

<Toast />

<div class="tracker-layout">
  <Topbar
    {currentAgentName}
    onFetchStats={onFetchStats}
    onOpenH2H={() => h2hOpen = true}
    onOpenLeaderboard={() => leaderboardOpen = true}
    onOpenFeedback={() => feedbackOpen = true}
  />

  {#if $currentView === 'tracker'}
  <HeroSection {mmrData} {accountData} matches={actFilteredMatches} />

  <TrackerNav
    {activeSection}
    {sessionActive}
    {sessionSummaryVisible}
    onToggleSession={toggleSession}
    onShowSessionSummary={showSessionSummary}
    onScrollTo={scrollToSection}
    on:openLeaderboard={() => leaderboardOpen = true}
    on:openH2H={() => h2hOpen = true}
    on:shareProfile={() => profileShareOpen = true}
    on:openBookmarks={() => bookmarksOpen = true}
    on:clearMatches={handleClearMatches}
    on:exportStats={() => exportProfileOpen = true}
  />

  <main class="main">
    <!-- Q1: Combat -->
    <div class="section-label" id="sec-combat">
      <span class="sl-text">Combat</span>
      <span class="sl-line"></span>
      <span class="sl-num">01</span>
    </div>
    <StatCards {stats} onStatClick={openStatModal} />

    <!-- Q2: Performance (Win Rate + RR Progression) -->
    <div class="section-label" id="sec-performance">
      <span class="sl-text">Performance</span>
      <span class="sl-line"></span>
      <span class="sl-num">02</span>
    </div>
    <div class="card wr-card span-4 visible">
      <div class="card-accent-line"></div>
      <div class="card-label">Win Rate</div>
      <div class="wr-big">{winRate}%</div>
      <div class="wr-bar-wrap">
        <div class="wr-track">
          <div class="wr-fill" style="width: {winRate}%"></div>
        </div>
      </div>
      <div class="wl-grid">
        <div class="wl-block wins">
          <div class="wlv">{wins}</div>
          <div class="wll">Wins</div>
        </div>
        <div class="wl-block losses">
          <div class="wlv">{losses}</div>
          <div class="wll">Losses</div>
        </div>
      </div>
      <div class="card-sub wr-detail">Last 20 competitive</div>
    </div>
    <RrGraph
      history={stats?.rrHistory || []}
      currentRR={((Math.max(0, (mmrData?.current?.tier?.id || 0) - 3)) * 100) + (mmrData?.current?.rr ?? 0)}
      {mmrHistory}
    />

    <!-- Q3: Performance Trend -->
    <div class="section-label" id="sec-trend">
      <span class="sl-text">Performance Trend</span>
      <span class="sl-line"></span>
      <span class="sl-num">03</span>
    </div>
    <PerfTrend matches={stats?.recentMatches || []} />

    <!-- Q4: Agent Roster -->
    <div class="section-label" id="sec-agents">
      <span class="sl-text">Agent Roster</span>
      <span class="sl-line"></span>
      <span class="sl-num">04</span>
    </div>
    <AgentCards
      agentMap={stats?.agentMap || {}}
      allMatches={actFilteredMatches}
    />

    <!-- Q5: Map Performance -->
    <div class="section-label" id="sec-maps">
      <span class="sl-text">Map Performance</span>
      <span class="sl-line"></span>
      <span class="sl-num">05</span>
    </div>
    <MapCards
      mapData={stats?.mapData || {}}
      {mmrHistory}
      allMatches={actFilteredMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
    />

    <!-- Q6: Clutch & Impact -->
    <div class="section-label" id="sec-clutch">
      <span class="sl-text">Clutch & Impact</span>
      <span class="sl-line"></span>
      <span class="sl-num">06</span>
    </div>
    <ClutchImpact
      {wins}
      {losses}
      {totalKills}
      matchCount={stats?.recentMatches?.length || 0}
      agentMap={stats?.agentMap || {}}
    />

    <!-- Q7: Accuracy & Roles -->
    <div class="section-label" id="sec-accuracy">
      <span class="sl-text">Accuracy & Roles</span>
      <span class="sl-line"></span>
      <span class="sl-num">07</span>
    </div>
    <AccuracyRoles
      matches={actFilteredMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
    />

    <!-- Q8: Top Weapons -->
    <div class="section-label" id="sec-weapons">
      <span class="sl-text">Top Weapons</span>
      <span class="sl-line"></span>
      <span class="sl-num">08</span>
    </div>
    <WeaponLab
      precomputedWeapons={stats?.precomputedWeapons || {}}
      playerName={playerState.name}
      playerTag={playerState.tag}
      mode={playerState.mode}
    />

    <!-- Q9: Recent Matches -->
    <div class="section-label" id="sec-matches">
      <span class="sl-text">Recent Matches</span>
      <span class="sl-line"></span>
      <span class="sl-num">09</span>
    </div>
    <MatchHistory
      recentMatches={stats?.recentMatches || []}
      {mmrHistory}
      allRawMatches={actFilteredMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      currentMode={playerState.mode || 'competitive'}
      onShareMatch={(m) => selectedShareMatch = m}
    />

    <!-- Q10: AI Tools -->
    <div class="section-label ai-premium-label" id="sec-ai-tools">
      <span class="sl-text ai-premium-text">AI Diagnostic Suite</span>
      <span class="sl-badge">Exclusive</span>
      <span class="sl-line ai-premium-line"></span>
      <span class="sl-num">10</span>
    </div>

    <div class="ai-premium-wrapper">
      <div class="ai-tools-container">
        <div class="ai-tools-nav">
          <button class="ai-nav-tab" class:active={activeAiTab === 'valbot'} on:click={() => activeAiTab = 'valbot'}>
            <span class="tab-icon">🤖</span> ValBot AI
          </button>
          <button class="ai-nav-tab" class:active={activeAiTab === 'deep'} on:click={() => activeAiTab = 'deep'}>
            <span class="tab-icon">🔬</span> Deep Analysis
          </button>
          <button class="ai-nav-tab" class:active={activeAiTab === 'lab'} on:click={() => activeAiTab = 'lab'}>
            <span class="tab-icon">🧪</span> Perf Lab
          </button>
        </div>

        <div class="ai-tools-content">
          {#if activeAiTab === 'valbot'}
            <ValBotCoach
              matches={actFilteredMatches}
              playerName={playerState.name}
              playerTag={playerState.tag}
              {rankName}
            />
          {:else if activeAiTab === 'deep'}
            <DeepAnalysis
              matches={actFilteredMatches}
              playerName={playerState.name}
              playerTag={playerState.tag}
              {mmrHistory}
            />
          {:else if activeAiTab === 'lab'}
            <PerformanceLab
              playerName={playerState.name}
              playerTag={playerState.tag}
              currentMode={playerState.mode || 'competitive'}
              {mmrHistory}
              {rankName}
            />
          {/if}
        </div>
      </div>
    </div>
  </main>

  <Footer />
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

  {#if $currentView === 'overlay'}
    <OverlayStudio />
  {/if}

  <HeadToHead
    open={h2hOpen}
    playerName={playerState.name}
    playerTag={playerState.tag}
    region={playerState.region}
    onClose={() => h2hOpen = false}
  />

  <BookmarksModal
    open={bookmarksOpen}
    onClose={() => bookmarksOpen = false}
  />

  <LeaderboardModal
    open={leaderboardOpen}
    region={playerState.region}
    onClose={() => leaderboardOpen = false}
  />

  <FeedbackModal
    open={feedbackOpen}
    onClose={() => feedbackOpen = false}
  />

  <StatModal
    open={statModalOpen}
    statKey={statModalKey}
    matches={stats?.recentMatches || []}
    onClose={() => statModalOpen = false}
  />

  <SessionSummary
    open={sessionSummaryOpen}
    sessionMatches={sessionMatchesList}
    startRR={sessionStartRR}
    currentRR={mmrData?.current?.rr ?? 0}
    onClose={() => sessionSummaryOpen = false}
  />

  <ProfileShare
    open={profileShareOpen}
    playerName={playerState.name}
    playerTag={playerState.tag}
    region={playerState.region}
    onClose={() => profileShareOpen = false}
  />

  {#if selectedShareMatch}
    {@const rawMatch = actFilteredMatches.find(m => (m.metadata?.matchid || m.metadata?.match_id) === selectedShareMatch.matchId)}
    <ExportCard
      match={selectedShareMatch}
      playerName={playerState.name}
      playerTag={playerState.tag}
      allPlayers={rawMatch ? getPlayerList(rawMatch) : []}
      rawMatch={rawMatch}
      playerBannerUrl={accountData?.card?.wide || accountData?.card?.large || ''}
      playerLevel={accountData?.account_level || ''}
      onClose={() => selectedShareMatch = null}
    />
  {/if}

  <ExportProfileCard
    open={exportProfileOpen}
    {stats}
    {mmrData}
    {accountData}
    {mmrHistory}
    {actFilteredMatches}
    playerName={playerState.name}
    playerTag={playerState.tag}
    region={playerState.region}
    mode={playerState.mode}
    onClose={() => exportProfileOpen = false}
  />
</div>

<style>
  .tracker-layout {
    min-height: 100vh;
  }
</style>
