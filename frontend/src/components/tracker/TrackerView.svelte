<script>
  import { onMount, onDestroy } from 'svelte';
  import Topbar from './Topbar.svelte';
  import TrackerNav from './TrackerNav.svelte';
  import HeroSection from './HeroSection.svelte';
  import StatCards from './StatCards.svelte';
  import MatchHistory from './MatchHistory.svelte';
  import Teammates from './Teammates.svelte';
  import RrGraph from './RrGraph.svelte';
  import RoleIdentityCard from './RoleIdentityCard.svelte';
  import PerformanceCalendar from './PerformanceCalendar.svelte';
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
  import ExportCardModal from './ExportCardModal.svelte';
  import ExportCard from './ExportCard.svelte';
  import ExportProfileCard from './ExportProfileCard.svelte';
  import WrappedModal from './WrappedModal.svelte';
  import HeadToHead from './HeadToHead.svelte';
  import BookmarksModal from './BookmarksModal.svelte';
  import LeaderboardModal from './LeaderboardModal.svelte';
  import FeedbackModal from './FeedbackModal.svelte';
  import OnboardingGuide from '../shared/OnboardingGuide.svelte';
  import Toast from '../shared/Toast.svelte';
  import Footer from '../shared/Footer.svelte';
  import ProfileShare from '../shared/ProfileShare.svelte';
  import BackToTop from '../shared/BackToTop.svelte';
  import { player, currentView, setPlayer, startFetch, endFetch } from '../../lib/appStore';
  import { processMatches } from '../../lib/processMatches';
  import { ACTS_TIMELINE, SEASONS_MAP, ACTS_KEY_TO_UUID, RANKS, getRankFromRR, getRankImgUrl, computeActRank } from '../../lib/constants';
  import { clearPlayerMatches } from '../../lib/indexeddb';
  import { normalizeMode } from '../../lib/utils';
  import EsportsHub from '../esports/EsportsHub.svelte';
  import SkinsStore from '../store/SkinsStore.svelte';
  import DraftCoach from '../coach/DraftCoach.svelte';
  import OverlayStudio from '../overlay/OverlayStudio.svelte';
  import LeaderboardHub from '../leaderboard/LeaderboardHub.svelte';
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
  let wrappedOpen = false;
  let tourOpen = false;
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
    const actUuid = actData?.uuid || ACTS_KEY_TO_UUID[playerState.act];
    const seasonKey = SEASONS_MAP[playerState.act];
    const matchSeasonId = m.metadata?.season_id || m.meta?.season?.id || m.metadata?.seasonId;
    if (actUuid && matchSeasonId && matchSeasonId.toLowerCase() === actUuid.toLowerCase()) {
      return true;
    }
    const matchSeasonShort = m.meta?.season?.short;
    if (seasonKey && matchSeasonShort && (matchSeasonShort === seasonKey || matchSeasonShort === playerState.act)) {
      return true;
    }
    const gameStart = m.metadata?.game_start || m.metadata?.gameStart || null;
    if (!gameStart) return false;
    const ts = gameStart * 1000;
    return ts >= actData.start && ts < actData.end;
  }) : allMatches;

  player.subscribe(p => { playerState = p; });

  let isProgrammaticScroll = false;
  let programmaticScrollTimer = null;

  function scrollToSection(sectionId) {
    activeSection = sectionId;
    const el = document.getElementById(sectionId);
    if (el) {
      isProgrammaticScroll = true;
      if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);

      // Force mark element and its next siblings in-view immediately
      el.classList.add('in-view');
      let sibling = el.nextElementSibling;
      while (sibling && !sibling.classList.contains('section-label')) {
        sibling.classList.add('in-view');
        sibling = sibling.nextElementSibling;
      }

      const nav = document.querySelector('.tracker-nav');
      const topbar = document.querySelector('.topbar');
      const isMobile = window.innerWidth <= 800;
      const isScrolledDown = document.body.classList.contains('scrolled-down');
      
      const navH = nav ? nav.offsetHeight : 50;
      const topbarH = (!isMobile && topbar && !isScrolledDown) ? topbar.offsetHeight : 0;
      const totalOffset = topbarH + navH + 8;

      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      const targetY = Math.max(0, elementTop - totalOffset);

      window.scrollTo({ top: targetY, behavior: 'smooth' });

      programmaticScrollTimer = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 750);
    }
  }

  let cleanupScroll;
  function setupScrollTracker() {
    const SECTION_IDS = [
      'sec-combat', 'sec-performance', 'sec-trend', 'sec-agents', 'sec-maps',
      'sec-weapons', 'sec-teammates', 'sec-matches', 'sec-ai-tools'
    ];
    let ticking = false;
    let cachedOffsets = [];

    function updateCachedOffsets() {
      cachedOffsets = SECTION_IDS.map(id => {
        const el = document.getElementById(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = rect.bottom + window.scrollY;
        return { id, top, bottom };
      }).filter(Boolean);
    }

    function update() {
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const atBottom = (scrollY + viewportH) >= docH - 40;

      const isMobile = window.innerWidth <= 800;
      const isScrolledDown = document.body.classList.contains('scrolled-down');
      const topbarH = (!isMobile && !isScrolledDown) ? (document.querySelector('.topbar')?.offsetHeight || 108) : 0;
      const navH = document.querySelector('.tracker-nav')?.offsetHeight || 50;
      const OFFSET = topbarH + navH + 40;

      let current = activeSection;

      if (atBottom) {
        current = SECTION_IDS[SECTION_IDS.length - 1];
      } else {
        updateCachedOffsets();
        let found = false;
        for (let i = 0; i < cachedOffsets.length; i++) {
          const item = cachedOffsets[i];
          const relativeTop = item.top - scrollY;
          const relativeBottom = item.bottom - scrollY;
          if (relativeTop <= OFFSET && relativeBottom > 0) {
            current = item.id;
            found = true;
          }
        }

        if (!found && cachedOffsets.length > 0) {
          const lastItem = cachedOffsets[cachedOffsets.length - 1];
          if (lastItem.top - scrollY <= OFFSET) {
            current = lastItem.id;
          } else {
            let minDiff = Infinity;
            for (let i = 0; i < cachedOffsets.length; i++) {
              const item = cachedOffsets[i];
              const diff = Math.abs((item.top - scrollY) - OFFSET);
              if (diff < minDiff) {
                minDiff = diff;
                current = item.id;
              }
            }
          }
        }
      }

      if (current && current !== activeSection) {
        activeSection = current;
      }
      ticking = false;
    }

    function onScroll() {
      if (isProgrammaticScroll) return;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    updateCachedOffsets();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateCachedOffsets, { passive: true });
    requestAnimationFrame(update);

    cleanupScroll = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateCachedOffsets);
    };
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

  // ── Reveal-on-scroll IntersectionObserver (section labels only) ──
  // Card-level components own their own observers (AgentCards, MapCards, MatchHistory)
  let revealObserver;
  function setupRevealObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('in-view'));
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '50px 0px 50px 0px' }
    );
    // Target section labels + any remaining .reveal-on-scroll not yet seen
    document.querySelectorAll('.reveal-on-scroll:not(.in-view)').forEach(el => revealObserver.observe(el));

    // Safety fallback: ensure all reveal elements become visible after 800ms
    setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll:not(.in-view)').forEach(el => el.classList.add('in-view'));
    }, 800);
  }

  // ── Keyboard navigation ──
  const SECTION_IDS = [
    'sec-combat', 'sec-performance', 'sec-trend', 'sec-agents', 'sec-maps',
    'sec-weapons', 'sec-teammates', 'sec-matches', 'sec-ai-tools'
  ];

  function handleKeydown(e) {
    // Arrow key section navigation
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      // Only when no input is focused
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const idx = SECTION_IDS.indexOf(activeSection);
      if (e.key === 'ArrowRight' && idx < SECTION_IDS.length - 1) {
        e.preventDefault();
        scrollToSection(SECTION_IDS[idx + 1]);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        scrollToSection(SECTION_IDS[idx - 1]);
      }
    }
    // Escape closes open modals
    if (e.key === 'Escape') {
      if (tourOpen)           tourOpen = false;
      if (h2hOpen)           h2hOpen = false;
      if (leaderboardOpen)   leaderboardOpen = false;
      if (feedbackOpen)      feedbackOpen = false;
      if (statModalOpen)     statModalOpen = false;
      if (profileShareOpen)  profileShareOpen = false;
      if (exportProfileOpen) exportProfileOpen = false;
      if (bookmarksOpen)     bookmarksOpen = false;
      if (wrappedOpen)       wrappedOpen = false;
      if (sessionSummaryOpen) sessionSummaryOpen = false;
      if (selectedShareMatch) selectedShareMatch = null;
    }
  }

  // Re-run observer when stats data arrives (section labels may have rendered)
  $: if (stats) {
    setTimeout(setupRevealObserver, 150);
  }

  onMount(() => {
    setupScrollTracker();
    setTimeout(setupRevealObserver, 120);
    window.addEventListener('keydown', handleKeydown);

    if (typeof localStorage !== 'undefined') {
      const tourDone = localStorage.getItem('valtracker_tour_completed');
      const hasVisited = localStorage.getItem('valtracker_has_visited');
      let recent = [];
      try {
        const raw = localStorage.getItem('valtracker_recent_searches');
        if (raw) recent = JSON.parse(raw);
      } catch {}

      // Auto-show ONLY for fresh/new devices that haven't searched player IDs before
      if (!hasVisited && !tourDone && (!recent || recent.length <= 1)) {
        localStorage.setItem('valtracker_has_visited', 'true');
        setTimeout(() => {
          tourOpen = true;
        }, 700);
      }
    }
  });

  onDestroy(() => {
    if (cleanupScroll) cleanupScroll();
    if (revealObserver) revealObserver.disconnect();
    window.removeEventListener('keydown', handleKeydown);
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
    onOpenTour={() => tourOpen = true}
  />

  {#if $currentView === 'tracker'}
  <HeroSection {mmrData} {accountData} matches={actFilteredMatches} on:openWrapped={() => wrappedOpen = true} />

  <TrackerNav
    {activeSection}
    {sessionActive}
    {sessionSummaryVisible}
    onToggleSession={toggleSession}
    onShowSessionSummary={showSessionSummary}
    onScrollTo={scrollToSection}
    on:openTour={() => tourOpen = true}
    on:openWrapped={() => wrappedOpen = true}
    on:openLeaderboard={() => leaderboardOpen = true}
    on:openH2H={() => h2hOpen = true}
    on:shareProfile={() => profileShareOpen = true}
    on:openBookmarks={() => bookmarksOpen = true}
    on:clearMatches={handleClearMatches}
    on:exportStats={() => exportProfileOpen = true}
  />

  <main class="main">
    <!-- Q1: Combat -->
    <div class="section-label reveal-on-scroll" id="sec-combat">
      <span class="sl-text">Combat</span>
      <span class="sl-line"></span>
      <span class="sl-num">01</span>
    </div>
    <StatCards {stats} onStatClick={openStatModal} />

    <!-- Q2: Performance (Win Rate + RR Progression) -->
    <div class="section-label reveal-on-scroll" id="sec-performance">
      <span class="sl-text">Performance</span>
      <span class="sl-line"></span>
      <span class="sl-num">02</span>
    </div>
    <div class="card wr-card span-4 visible reveal-on-scroll stagger-1">
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
      currentRR={(() => {
        const activeDisplayRank = computeActRank(mmrData, playerState.act, actFilteredMatches, playerState.name, playerState.tag);
        const activeTierIdx = RANKS.findIndex(r => r.name.toLowerCase() === activeDisplayRank.name.toLowerCase());
        return activeTierIdx >= 0 ? (activeTierIdx * 100) + activeDisplayRank.rr : (((Math.max(0, (mmrData?.current?.tier?.id || 0) - 3)) * 100) + (mmrData?.current?.rr ?? 0));
      })()}
      {mmrHistory}
    />

    <!-- Q3: Performance Trend -->
    <div class="section-label reveal-on-scroll" id="sec-trend">
      <span class="sl-text">Performance Trend</span>
      <span class="sl-line"></span>
      <span class="sl-num">03</span>
    </div>
    <PerfTrend matches={stats?.recentMatches || []} />

    <div class="perf-row span-12">
      <PerformanceCalendar
        allMatches={actFilteredMatches}
        {mmrHistory}
        playerName={playerState.name}
        playerTag={playerState.tag}
      />
      <RoleIdentityCard
        matches={actFilteredMatches}
        playerName={playerState.name}
        playerTag={playerState.tag}
      />
    </div>

    <!-- Q4: Agent Roster -->
    <div class="section-label reveal-on-scroll" id="sec-agents">
      <span class="sl-text">Agent Roster</span>
      <span class="sl-line"></span>
      <span class="sl-num">04</span>
    </div>
    <AgentCards
      agentMap={stats?.agentMap || {}}
      allMatches={actFilteredMatches}
    />

    <!-- Q5: Map Performance -->
    <div class="section-label reveal-on-scroll" id="sec-maps">
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
    <div class="section-label reveal-on-scroll" id="sec-clutch">
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
    <div class="section-label reveal-on-scroll" id="sec-accuracy">
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
    <div class="section-label reveal-on-scroll" id="sec-weapons">
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

    <!-- Q9: Teammates -->
    <div class="section-label reveal-on-scroll" id="sec-teammates">
      <span class="sl-text">Teammates</span>
      <span class="sl-line"></span>
      <span class="sl-num">09</span>
    </div>
    <Teammates
      matches={actFilteredMatches}
      playerName={playerState.name}
      playerTag={playerState.tag}
      on:viewProfile={(e) => {
        const { name, tag } = e.detail;
        setPlayer({ name, tag, region: playerState.region, mode: playerState.mode, loaded: false, fetching: true });
        
        const params = new URLSearchParams(window.location.search);
        params.set('name', name);
        params.set('tag', tag);
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        onFetchStats();
      }}
    />

    <!-- Q10: Recent Matches -->
    <div class="section-label reveal-on-scroll" id="sec-matches">
      <span class="sl-text">Recent Matches</span>
      <span class="sl-line"></span>
      <span class="sl-num">10</span>
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

    <!-- Q11: AI Tools -->
    <div class="section-label ai-premium-label reveal-on-scroll" id="sec-ai-tools">
      <span class="sl-text ai-premium-text">AI Diagnosis Lab</span>
      <span class="sl-line ai-premium-line"></span>
      <span class="sl-num">11</span>
    </div>

    <div class="ai-premium-wrapper" data-active-tab={activeAiTab}>
      <div class="ai-tools-container">
        <div class="ai-tools-nav">
          <button 
            class="ai-nav-tab nav-tab-summary" 
            class:active={activeAiTab === 'summary' || activeAiTab === 'valbot'} 
            on:click={() => activeAiTab = 'summary'}
          >
            <span class="tab-icon">⚡</span>
            <span class="tab-label">Executive Summary</span>
            <span class="tab-tag tag-summary">AI DIAGNOSTIC</span>
          </button>
          <button 
            class="ai-nav-tab nav-tab-action" 
            class:active={activeAiTab === 'action'} 
            on:click={() => activeAiTab = 'action'}
          >
            <span class="tab-icon">🎯</span>
            <span class="tab-label">3-Step Action Plan</span>
            <span class="tab-tag tag-action">3 DRILLS</span>
          </button>
          <button 
            class="ai-nav-tab nav-tab-deeplab" 
            class:active={activeAiTab === 'deeplab' || activeAiTab === 'deep' || activeAiTab === 'lab'} 
            on:click={() => activeAiTab = 'deeplab'}
          >
            <span class="tab-icon">📡</span>
            <span class="tab-label">Deep Telemetry Lab</span>
            <span class="tab-tag tag-deeplab">FULL MATRIX</span>
          </button>
        </div>

        <div class="ai-tools-content">
          {#if activeAiTab === 'summary' || activeAiTab === 'valbot'}
            <ValBotCoach
              mode="summary"
              matches={actFilteredMatches}
              playerName={playerState.name}
              playerTag={playerState.tag}
              {rankName}
              {mmrHistory}
              onShareProfile={() => profileShareOpen = true}
            />
          {:else if activeAiTab === 'action'}
            <ValBotCoach
              mode="action"
              matches={actFilteredMatches}
              playerName={playerState.name}
              playerTag={playerState.tag}
              {rankName}
              {mmrHistory}
            />
          {:else if activeAiTab === 'deeplab' || activeAiTab === 'deep' || activeAiTab === 'lab'}
            <DeepAnalysis
              matches={actFilteredMatches}
              playerName={playerState.name}
              playerTag={playerState.tag}
              {rankName}
              {mmrHistory}
              currentMode={playerState.mode || 'competitive'}
            />
          {/if}
        </div>
      </div>
    </div>
  </main>
  {/if}

  {#if $currentView === 'leaderboards'}
    <LeaderboardHub />
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

  <Footer />

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
    open={exportProfileOpen && false /* rendered via ExportCardModal for export stats, and profile share when needed */}
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

  {#if exportProfileOpen}
    <ExportCardModal
      open={true}
      cardType="profile"
      playerName={playerState.name}
      playerTag={playerState.tag}
      region={playerState.region}
      playerBannerUrl={accountData?.card?.wide || accountData?.card?.large || ''}
      playerLevel={accountData?.account_level || ''}
      {stats}
      {mmrData}
      {accountData}
      {mmrHistory}
      {actFilteredMatches}
      onClose={() => exportProfileOpen = false}
    />
  {/if}

  <WrappedModal
    matches={actFilteredMatches}
    playerName={playerState.name}
    playerTag={playerState.tag}
    {mmrData}
    {accountData}
    isOpen={wrappedOpen}
    on:close={() => wrappedOpen = false}
  />

  <OnboardingGuide bind:open={tourOpen} onClose={() => tourOpen = false} />

  <BackToTop />
</div>

<style>
  .tracker-layout {
    min-height: 100vh;
  }
</style>
