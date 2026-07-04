<script>
  import { onMount } from 'svelte';
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
  import HeadToHead from './HeadToHead.svelte';
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
  import { getPlayerList } from '../../lib/utils';

  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let allMatches = [];
  export let mmrHistory = {};
  export let onFetchStats = () => {};

  let playerState = { name: '', tag: '', region: 'ap', mode: 'competitive' };
  
  let selectedShareMatch = null;
  let h2hOpen = false;
  let leaderboardOpen = false;
  let feedbackOpen = false;
  let statModalOpen = false;
  let statModalKey = 'kd';
  let profileShareOpen = false;
  let activeSection = 'sec-combat';

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

  player.subscribe(p => { playerState = p; });

  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupScrollTracker() {
    const sectionIds = [
      'sec-combat', 'sec-performance', 'sec-trend', 'sec-agents', 'sec-maps',
      'sec-clutch', 'sec-accuracy', 'sec-weapons', 'sec-matches',
      'sec-ai', 'sec-deep', 'sec-lab'
    ];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
        }
      }
    }, { rootMargin: '-20% 0px -60% 0px' });
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
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
    try {
      await clearPlayerMatches(playerState.name, playerState.tag, normalizeMode(playerState.mode || 'competitive'));
      if (window.showToast) window.showToast('Stored matches cleared');
    } catch(e) {
      if (window.showToast) window.showToast('Failed to clear matches');
    }
  }

  onMount(() => {
    setupScrollTracker();
  });
</script>

<Toast />

<div class="tracker-layout">
  <Topbar
    onFetchStats={onFetchStats}
    onOpenH2H={() => h2hOpen = true}
    onOpenLeaderboard={() => leaderboardOpen = true}
    onOpenFeedback={() => feedbackOpen = true}
  />

  {#if $currentView === 'tracker'}
  <HeroSection {mmrData} {accountData} matches={allMatches} />

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
    on:openBookmarks={() => {}}
    on:clearMatches={handleClearMatches}
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
    <div class="card wr-card span-4">
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
      currentRR={mmrData?.current?.rr ?? 0}
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
      {allMatches}
    />

    <!-- Q5: Map Performance -->
    <div class="section-label" id="sec-maps">
      <span class="sl-text">Map Performance</span>
      <span class="sl-line"></span>
      <span class="sl-num">05</span>
    </div>
    <MapCards mapData={stats?.mapData || {}} />

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
      matches={allMatches}
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
      allRawMatches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      onShareMatch={(m) => selectedShareMatch = m}
    />

    <!-- Q10: AI Performance Analysis -->
    <div class="section-label" id="sec-ai">
      <span class="sl-text">AI Performance Analysis</span>
      <span class="sl-line"></span>
      <span class="sl-num">10</span>
    </div>
    <ValBotCoach
      matches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      {rankName}
    />

    <!-- Q11: Deep Game Analysis -->
    <div class="section-label" id="sec-deep">
      <span class="sl-text">Deep Game Analysis</span>
      <span class="sl-line"></span>
      <span class="sl-num">11</span>
    </div>
    <DeepAnalysis
      matches={allMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      {mmrHistory}
    />

    <!-- Q12: Performance Lab -->
    <div class="section-label" id="sec-lab">
      <span class="sl-text">Performance Lab</span>
      <span class="sl-line"></span>
      <span class="sl-num">12</span>
    </div>
    <PerformanceLab
      playerName={playerState.name}
      playerTag={playerState.tag}
      currentMode={playerState.mode || 'competitive'}
      {mmrHistory}
      {rankName}
      agentMap={stats?.agentMap || {}}
      {allMatches}
    />
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

  <HeadToHead
    open={h2hOpen}
    playerName={playerState.name}
    playerTag={playerState.tag}
    region={playerState.region}
    onClose={() => h2hOpen = false}
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
    {@const rawMatch = allMatches.find(m => (m.metadata?.matchid || m.metadata?.match_id) === selectedShareMatch.matchId)}
    <ExportCard
      match={selectedShareMatch}
      playerName={playerState.name}
      playerTag={playerState.tag}
      allPlayers={rawMatch ? getPlayerList(rawMatch) : []}
      playerBannerUrl={accountData?.card?.wide || accountData?.card?.large || ''}
      playerLevel={accountData?.account_level || ''}
      onClose={() => selectedShareMatch = null}
    />
  {/if}
</div>

<style>
  .tracker-layout {
    min-height: 100vh;
  }
</style>
