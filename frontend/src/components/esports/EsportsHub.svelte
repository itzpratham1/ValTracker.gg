<script>
  import { onMount, onDestroy } from 'svelte';
  import { currentView } from '../../lib/appStore';
  import { fetchEsportsLive, fetchEsportsResults, fetchEsportsUpcoming, fetchEsportsNews, fetchEsportsEvent } from '../../lib/api';
  import { setFranchiseData, getFranchiseData, setAllMatchesCache, getAllMatchesCache, getEspHTML, getEsportsTeamLogoHtml, getTeamRegion, getMatchCardHtml } from '../../lib/esports-utils';
  import { VCT_STAGE_DATA, VCT_VLR_EVENTS } from '../../lib/esports-vct';
  import { escapeHtml } from '../../lib/utils';

  let activeTab = 'overview';
  let showTier2 = true;
  let liveInterval = null;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'vct26', label: 'VCT26' },
    { id: 'teams', label: 'Teams' },
    { id: 'news', label: 'News' }
  ];

  let liveMatches = [];
  let resultsMatches = [];
  let upcomingMatches = [];
  let newsItems = [];
  let loading = { overview: false, schedule: false, teams: false, news: false };

  let scheduleTab = 'upcoming';

  // Teams tab state
  let franchiseData = null;
  let selectedRegion = 'pacific';
  let selectedTeamId = null;
  let selectedTeam = null;
  let teamMatches = [];
  let collapsedRegions = { americas: true, emea: true, pacific: false, china: true };

  // VCT modal state
  let vctModalOpen = false;
  let vctModalStage = null;
  let vctModalRegion = null;
  let vctModalTabList = [];
  let vctModalWinners = [];
  let vctModalTeams = [];
  let vctModalLoading = false;

  $: isVisible = $currentView === 'esports';

  $: if (isVisible && activeTab === 'overview') {
    loadOverview();
  }

  $: if (isVisible && activeTab === 'schedule') {
    loadSchedule();
  }

  $: if (isVisible && activeTab === 'teams' && !franchiseData) {
    loadTeams();
  }

  $: if (isVisible && activeTab === 'news') {
    loadNews();
  }

  onMount(() => {
    return () => {
      if (liveInterval) clearInterval(liveInterval);
    };
  });

  function switchTab(tab) {
    activeTab = tab;
    if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }
  }

  function switchScheduleTab(tab) {
    scheduleTab = tab;
  }

  function toggleTier2() {
    showTier2 = !showTier2;
  }

  async function loadOverview() {
    loading.overview = true;
    try {
      if (!getFranchiseData()) {
        try {
          const res = await fetch('/vct_teams.json?v=3');
          const data = await res.json();
          setFranchiseData(data);
          franchiseData = data;
        } catch (e) {
          console.error("Failed to load franchise data:", e);
        }
      }

      const [liveRes, resultsRes, newsRes] = await Promise.all([
        fetchEsportsLive(),
        fetchEsportsResults(),
        fetchEsportsNews()
      ]);

      liveMatches = liveRes?.data || [];
      resultsMatches = (resultsRes?.data || []).slice(0, 3);
      newsItems = (newsRes?.data || []).slice(0, 4);

      if (liveInterval) clearInterval(liveInterval);
      liveInterval = setInterval(loadOverview, 60000);
    } catch (err) {
      console.error("Overview load failed", err);
    }
    loading.overview = false;
  }

  async function loadSchedule() {
    loading.schedule = true;
    try {
      const [upRes, resRes] = await Promise.all([
        fetchEsportsUpcoming(),
        fetchEsportsResults()
      ]);
      upcomingMatches = upRes?.data || [];
      resultsMatches = resRes?.data || [];
      setAllMatchesCache(upcomingMatches);
    } catch (err) {
      console.error("Schedule load failed", err);
    }
    loading.schedule = false;
  }

  async function loadNews() {
    loading.news = true;
    try {
      const res = await fetchEsportsNews();
      newsItems = res?.data || [];
    } catch (err) {
      console.error("News load failed", err);
    }
    loading.news = false;
  }

  async function loadTeams() {
    loading.teams = true;
    try {
      const res = await fetch('/vct_teams.json?v=3');
      franchiseData = await res.json();
      setFranchiseData(franchiseData);

      if (!getAllMatchesCache().length) {
        const matchesRes = await fetchEsportsUpcoming();
        setAllMatchesCache(matchesRes?.data || []);
      }

      selectFranchiseTeam('pacific', '918');
    } catch (e) {
      console.error("Teams loader error:", e);
    }
    loading.teams = false;
  }

  function toggleRegion(region) {
    collapsedRegions[region] = !collapsedRegions[region];
    collapsedRegions = collapsedRegions;
  }

  function selectFranchiseTeam(region, teamId) {
    selectedRegion = region;
    selectedTeamId = teamId;

    // Collapse other regions, expand selected
    for (const r in collapsedRegions) {
      collapsedRegions[r] = r !== region;
    }
    collapsedRegions = collapsedRegions;

    if (!franchiseData) return;
    const team = (franchiseData[region] || []).find(t => t.id === teamId);
    if (!team) return;
    selectedTeam = team;

    const allMatches = getAllMatchesCache();
    teamMatches = allMatches.filter(m => {
      const teams = m.match?.teams || [];
      return teams.some(t => {
        const rawVlr = t.name || '';
        const rawFilter = team.name || '';
        const cleanVlr = rawVlr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
        const cleanFilter = rawFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
        if (cleanVlr === cleanFilter) return true;
        const isGcMatch = cleanVlr.includes('gc') || cleanVlr.includes('game changers') || cleanVlr.includes('female');
        const isAcademyMatch = cleanVlr.includes('academy') || cleanVlr.includes('acad');
        const isFilterGc = cleanFilter.includes('gc') || cleanFilter.includes('game changers') || cleanFilter.includes('female');
        const isFilterAcademy = cleanFilter.includes('academy') || cleanFilter.includes('acad');
        if (isGcMatch && !isFilterGc) return false;
        if (isAcademyMatch && !isFilterAcademy) return false;
        return cleanVlr.includes(cleanFilter) || cleanFilter.includes(cleanVlr);
      });
    });
  }

  // VCT Modal
  function openVctTournamentModal(stage) {
    const data = VCT_STAGE_DATA[stage];
    if (!data) return;
    vctModalStage = stage;
    const isInternational = stage.includes('masters') || stage === 'champions';

    if (stage === 'masters_london') {
      vctModalTabList = ['playoffs', 'swiss', 'teams', 'americas', 'pacific', 'emea', 'china'];
    } else {
      vctModalTabList = isInternational
        ? ['global', 'americas', 'pacific', 'emea', 'china']
        : Object.keys(data.regions);
    }

    switchVctModalTab(stage, vctModalTabList[0]);
    vctModalOpen = true;
    document.body.classList.add('modal-open');
  }

  function closeVctModalFn() {
    vctModalOpen = false;
    document.body.classList.remove('modal-open');
  }

  async function switchVctModalTab(stage, region) {
    vctModalRegion = region;
    const data = VCT_STAGE_DATA[stage];
    if (!data) return;

    if (stage === 'masters_london' && (region === 'playoffs' || region === 'swiss')) {
      vctModalWinners = [];
      vctModalTeams = [];
      vctModalLoading = false;
      return;
    }

    let lookupRegion = region;
    if (region === 'teams') lookupRegion = 'global';
    const regData = data.regions[lookupRegion] || (lookupRegion === 'global' ? data.regions.global : null);
    vctModalWinners = regData?.winners || [];

    const isInternational = stage.includes('masters') || stage === 'champions';
    if (!isInternational) {
      vctModalTeams = [];
      return;
    }

    vctModalLoading = true;
    vctModalTeams = [];

    let vlrIds = [];
    const stageEvents = VCT_VLR_EVENTS[stage];
    if (stageEvents) {
      if (isInternational) {
        vlrIds = [stageEvents.global];
      } else {
        if (region === 'global') vlrIds = Object.values(stageEvents);
        else if (stageEvents[region]) vlrIds = [stageEvents[region]];
      }
    }

    if (vlrIds.length === 0) {
      vctModalLoading = false;
      return;
    }

    try {
      const fetchedResults = await Promise.all(
        vlrIds.map(async id => {
          try {
            const res = await fetchEsportsEvent(String(id));
            return res?.data || [];
          } catch { return []; }
        })
      );

      let allTeams = [];
      const seenIds = new Set();
      fetchedResults.forEach(teamsList => {
        teamsList.forEach(t => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            allTeams.push(t);
          }
        });
      });

      let filterRegion = region;
      if (region === 'teams') filterRegion = 'global';
      if (isInternational && filterRegion !== 'global') {
        allTeams = allTeams.filter(t => getTeamRegion(t.id, t.local_id, t.name) === filterRegion);
      }

      allTeams.sort((a, b) => a.name.localeCompare(b.name));
      vctModalTeams = allTeams;
    } catch (err) {
      console.error("Error loading VLR teams in modal:", err);
    }
    vctModalLoading = false;
  }

  function getTeamRegionForModal(t) {
    if (franchiseData) {
      for (const reg in franchiseData) {
        if (franchiseData[reg].some(item => item.id === t.id || item.id === t.local_id || item.name.toLowerCase() === t.name.toLowerCase())) {
          return reg;
        }
      }
    }
    return getTeamRegion(t.id, t.local_id, t.name);
  }

  function isTeamClickable(t) {
    if (franchiseData) {
      for (const reg in franchiseData) {
        if (franchiseData[reg].some(item => item.id === t.id || item.id === t.local_id || item.name.toLowerCase() === t.name.toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  }

  function getTeamMatchedRegion(t) {
    if (franchiseData) {
      for (const reg in franchiseData) {
        if (franchiseData[reg].some(item => item.id === t.id || item.id === t.local_id || item.name.toLowerCase() === t.name.toLowerCase())) {
          return reg;
        }
      }
    }
    return null;
  }

  function selectTeamFromModal(t) {
    const matchedRegion = getTeamMatchedRegion(t);
    if (!matchedRegion) return;
    closeVctModalFn();
    switchTab('teams');
    setTimeout(() => {
      selectFranchiseTeam(matchedRegion, t.id);
    }, 100);
  }

  function getRegionLabel(region) {
    const labels = {
      playoffs: "\u{1F3C6} Playoff Bracket",
      swiss: "\u{1F1E8}\u{1F1ED} Swiss Stage",
      teams: "\u{1F30E} Qualified Teams",
      global: "\u{1F30E} All Qualified",
      americas: "\u{1F1FA}\u{1F1F8} Americas",
      pacific: "\u{1F1F0}\u{1F1F7} Pacific",
      emea: "\u{1F1EA}\u{1F1FA} EMEA",
      china: "\u{1F1E8}\u{1F1F3} China"
    };
    return labels[region] || region;
  }

  function getVlrTeamLogo(t) {
    const teamLogoUrl = t.logo ? (t.logo.startsWith('/api/image') ? t.logo : `/api/image?url=${encodeURIComponent(t.logo)}`) : '';
    return teamLogoUrl;
  }
</script>

{#if isVisible}
<div class="esports-view">
  <div class="esports-subnav">
    <div class="esports-pills-scroll">
      {#each TABS as tab}
        <button
          class="esports-pill"
          class:active={activeTab === tab.id}
          on:click={() => switchTab(tab.id)}
        >{tab.label}</button>
      {/each}
    </div>
    <div class="tier-toggle-wrapper">
      <span style="font-family:'DM Mono',monospace; font-size:11px; color:var(--muted); text-transform:uppercase;">Tier 2/3</span>
      <label class="switch">
        <input type="checkbox" checked={showTier2} on:change={toggleTier2}>
        <span class="slider round"></span>
      </label>
    </div>
  </div>

  <div class="esports-content">

    <!-- OVERVIEW SECTION -->
    {#if activeTab === 'overview'}
      <div class="esports-section active">
        <div class="section-label visible" style="margin-bottom:16px;">
          <span class="sl-text">Live Action & Highlight Updates</span>
          <div class="sl-line"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; margin-bottom: 24px;">
          <div>
            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:16px; text-transform:uppercase; margin-bottom:12px; color:var(--accent);">🔴 Active Matches</h4>
            {#if loading.overview && !liveMatches.length}
              <div class="placeholder-txt">Loading Active matches...</div>
            {:else if liveMatches.length === 0}
              <div class="placeholder-txt">No live matches right now.</div>
            {:else}
              {#each liveMatches as m}
                <div class:tier-t2={getEspHTML(m, 'live').includes('tier-t2')} style={showTier2 ? '' : 'display:none'}>
                  {@html getEspHTML(m, 'live')}
                </div>
              {/each}
            {/if}

            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:16px; text-transform:uppercase; margin-top:24px; margin-bottom:12px; color:var(--accent);">🏆 Highlight Matches</h4>
            {#if loading.overview && !resultsMatches.length}
              <div class="placeholder-txt">Loading highlight results...</div>
            {:else if resultsMatches.length === 0}
              <div class="placeholder-txt">No recent results found.</div>
            {:else}
              {#each resultsMatches as m}
                <div class:tier-t2={getEspHTML(m, 'results').includes('tier-t2')} style={showTier2 ? '' : 'display:none'}>
                  {@html getEspHTML(m, 'results')}
                </div>
              {/each}
            {/if}
          </div>
          <div>
            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:16px; text-transform:uppercase; margin-bottom:12px; color:var(--accent);">📰 Latest headlines</h4>
            <div style="display:flex; flex-direction:column; gap:12px;">
              {#if loading.overview && !newsItems.length}
                <div class="placeholder-txt">Loading latest headlines...</div>
              {:else if newsItems.length === 0}
                <div class="placeholder-txt">No news headlines found.</div>
              {:else}
                {#each newsItems as n}
                  <a href={n.url_path ? 'https://vlr.gg' + n.url_path : '#'} target="_blank" class="esp-news-card" style="padding:12px; gap:8px;">
                    <div class="esp-news-title" style="font-size:15px;">{n.title}</div>
                    <div class="esp-news-desc" style="font-size:11px;-webkit-line-clamp:2;">{n.description || ''}</div>
                    <div class="esp-news-meta" style="font-size:9px; margin-top:4px;">
                      <span>{n.author === 'VLR.gg' ? 'Valorant Esports' : n.author} • {n.date}</span>
                    </div>
                  </a>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- SCHEDULE SECTION -->
    {#if activeTab === 'schedule'}
      <div class="esports-section active">
        <div class="schedule-tabs" style="display: flex; justify-content: center; gap: 8px; margin-bottom: 20px;">
          <button class="esports-pill" class:active={scheduleTab === 'upcoming'} on:click={() => switchScheduleTab('upcoming')}>Upcoming</button>
          <button class="esports-pill" class:active={scheduleTab === 'results'} on:click={() => switchScheduleTab('results')}>Results</button>
        </div>

        <div class="esp-schedule-grid">
          {#if scheduleTab === 'upcoming'}
            <div id="schedule-col-upcoming">
              <div class="section-label visible" style="margin-bottom:16px;">
                <span class="sl-text">Upcoming Matches</span>
                <div class="sl-line"></div>
              </div>
              {#if loading.schedule}
                <div class="placeholder-txt">Loading Upcoming Matches...</div>
              {:else if upcomingMatches.length === 0}
                <div class="placeholder-txt">No upcoming matches scheduled.</div>
              {:else}
                {#each upcomingMatches.slice(0, 30) as m}
                  <div class:tier-t2={getEspHTML(m, 'upcoming').includes('tier-t2')} style={showTier2 ? '' : 'display:none'}>
                    {@html getEspHTML(m, 'upcoming')}
                  </div>
                {/each}
              {/if}
            </div>
          {:else}
            <div id="schedule-col-results">
              <div class="section-label visible" style="margin-bottom:16px;">
                <span class="sl-text">Recent Results</span>
                <div class="sl-line"></div>
              </div>
              {#if loading.schedule}
                <div class="placeholder-txt">Loading Recent Results...</div>
              {:else if resultsMatches.length === 0}
                <div class="placeholder-txt">No recent results found.</div>
              {:else}
                {#each resultsMatches.slice(0, 30) as m}
                  <div class:tier-t2={getEspHTML(m, 'results').includes('tier-t2')} style={showTier2 ? '' : 'display:none'}>
                    {@html getEspHTML(m, 'results')}
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- VCT26 ROADMAP SECTION -->
    {#if activeTab === 'vct26'}
      <div class="esports-section active">
        <div class="section-label visible" style="margin-bottom:16px;">
          <span class="sl-text">VCT 2026 Season roadmap</span>
          <div class="sl-line"></div>
        </div>

        <div class="vct-roadmap-wrap">
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header concluded">International League</div>
            <button class="vct-roadmap-card concluded" on:click={() => openVctTournamentModal('kickoff')}>
              <div class="vct-roadmap-title">VCT Kickoff</div>
              <div class="vct-roadmap-subtitle" style="color:var(--loss)">Concluded</div>
              <div class="vct-roadmap-subtitle" style="font-size: 9px; margin-top: 4px; line-height: 1.3;">
                AMER: SEN | PAC: GEN<br>EMEA: KC | CN: EDG
              </div>
            </button>
          </div>
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header concluded">Global Event</div>
            <button class="vct-roadmap-card concluded tall" on:click={() => openVctTournamentModal('masters_santiago')}>
              <div class="vct-roadmap-title" style="color: #c084fc;">Masters Santiago</div>
              <div class="vct-roadmap-subtitle" style="color:var(--loss)">Concluded</div>
              <div class="vct-roadmap-dates">Feb 28 - Mar 16, 2026</div>
              <div class="vct-roadmap-subtitle" style="font-size: 9px; margin-top: 12px; color:#c084fc;">Winner: Nongshim RedForce</div>
            </button>
          </div>
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header concluded">International League</div>
            <button class="vct-roadmap-card concluded" on:click={() => openVctTournamentModal('stage1')}>
              <div class="vct-roadmap-title">VCT Stage 1</div>
              <div class="vct-roadmap-subtitle" style="color:var(--loss)">Concluded</div>
              <div class="vct-roadmap-dates">Apr 11 - May 25, 2026</div>
              <div class="vct-roadmap-subtitle" style="font-size: 9px; margin-top: 4px; line-height: 1.3;">
                AMER: LEV | PAC: PRX<br>EMEA: TH | CN: EDG
              </div>
            </button>
          </div>
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header ongoing">Global Event</div>
            <button class="vct-roadmap-card ongoing tall" on:click={() => openVctTournamentModal('masters_london')}>
              <div class="vct-roadmap-title" style="color: #a855f7;">Masters London</div>
              <div class="vct-roadmap-subtitle" style="color:var(--win)">Ongoing</div>
              <div class="vct-roadmap-dates">June 6 - June 21, 2026</div>
            </button>
          </div>
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header">International League</div>
            <button class="vct-roadmap-card" on:click={() => openVctTournamentModal('stage2')}>
              <div class="vct-roadmap-title">VCT Stage 2</div>
              <div class="vct-roadmap-subtitle" style="color:var(--muted)">Upcoming</div>
              <div class="vct-roadmap-dates">July 2026</div>
            </button>
          </div>
          <div class="vct-roadmap-col">
            <div class="vct-roadmap-header">Global Event</div>
            <button class="vct-roadmap-card tall champions" on:click={() => openVctTournamentModal('champions')}>
              <div class="vct-roadmap-title" style="color: #fbbf24;">Champions Shanghai</div>
              <div class="vct-roadmap-subtitle" style="color:var(--muted)">Upcoming</div>
              <div class="vct-roadmap-dates">September 2026</div>
            </button>
          </div>
        </div>

        <div class="vct-roadmap-tracker">
          <div class="vct-roadmap-node active" title="Kickoff - Concluded"></div>
          <div class="vct-roadmap-node active" title="Masters Santiago - Concluded"></div>
          <div class="vct-roadmap-node active" title="Stage 1 - Concluded"></div>
          <div class="vct-roadmap-node active" title="Masters London - Ongoing"></div>
          <div class="vct-roadmap-node" title="Stage 2 - Upcoming"></div>
          <div class="vct-roadmap-node" title="Champions Shanghai - Upcoming"></div>
        </div>
      </div>
    {/if}

    <!-- TEAMS SECTION -->
    {#if activeTab === 'teams'}
      <div class="esports-section active">
        <div class="esp-teams-layout">
          <div class="esp-sidebar">
            {#each ['americas', 'emea', 'pacific', 'china'] as region}
              <button class="esp-sidebar-region-header" class:collapsed={collapsedRegions[region]} on:click={() => toggleRegion(region)}>
                VCT {region === 'china' ? 'CN' : region.charAt(0).toUpperCase() + region.slice(1)}
              </button>
              <div class="esp-sidebar-team-list" class:collapsed={collapsedRegions[region]}>
                {#each (franchiseData?.[region] || []) as team}
                  <button
                    class="esp-sidebar-team-btn"
                    class:active={selectedTeamId === team.id}
                    on:click={() => selectFranchiseTeam(region, team.id)}
                  >{team.name}</button>
                {/each}
              </div>
            {/each}
          </div>

          <div class="esp-team-dashboard">
            <div id="esp-team-main-area">
              <div class="esp-team-hero">
                <div class="esp-team-title-row">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    {#if selectedTeam}
                      {@const logoHtml = getEsportsTeamLogoHtml(selectedTeam.name)}
                      <div style="margin-right: 16px; font-size: 24px;">{@html logoHtml}</div>
                    {/if}
                    <div class="esp-team-name-lg" style="margin-bottom: 0;">
                      {selectedTeam?.name || 'Select a Team'}
                    </div>
                  </div>
                </div>
                <div class="esp-team-desc">
                  {selectedTeam?.description || 'Select a VCT Franchise team from the left sidebar to explore their full roster players, coach staff, and capsule skin details.'}
                </div>

                {#if selectedTeam?.capsule_image}
                  <div class="capsule-promo-card">
                    <img class="capsule-promo-img" src={selectedTeam.capsule_image} alt="VCT Capsule" />
                    <div class="capsule-promo-info">
                      <div class="capsule-promo-title">{selectedTeam.capsule_title || 'VCT Capsule'}</div>
                      <div class="capsule-promo-desc">{selectedTeam.capsule_desc || 'Support your team'}</div>
                    </div>
                  </div>
                {/if}
              </div>

              <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:18px; text-transform:uppercase; margin-top:20px; color:#fff;">Team Roster</h4>
              <div class="player-card-grid">
                {#each (selectedTeam?.roster || []) as p}
                  <div class="player-card">
                    <span class="player-card-role" class:coach={p.role.toLowerCase() === 'coach'}>{p.role}</span>
                    <img class="player-card-avatar" src={p.avatar} alt={p.name} />
                    <div class="player-card-meta">
                      <div class="player-card-handle">{p.name}</div>
                      <div class="player-card-real">{p.real_name}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div>
              <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:16px; text-transform:uppercase; color:var(--accent); margin-bottom:12px;">Upcoming Matches</h4>
              {#if teamMatches.length === 0}
                <div class="esp-match-card tier-t1" style="min-height:120px; display:flex; align-items:center; justify-content:center; border-style:dashed;">
                  <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;color:var(--muted);text-transform:uppercase;">No Upcoming Matches</div>
                </div>
              {:else}
                {#each teamMatches as m}
                  {@html getEspHTML(m, 'upcoming')}
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- NEWS SECTION -->
    {#if activeTab === 'news'}
      <div class="esports-section active">
        <div class="section-label visible" style="margin-bottom:16px;">
          <span class="sl-text">Latest News</span>
          <div class="sl-line"></div>
        </div>
        <div class="esp-news-grid">
          {#if loading.news}
            <div class="placeholder-txt">Loading news...</div>
          {:else if newsItems.length === 0}
            <div class="placeholder-txt">No news found.</div>
          {:else}
            {#each newsItems as n}
              <a href={n.url_path ? 'https://vlr.gg' + n.url_path : '#'} target="_blank" class="esp-news-card" style="padding:12px; gap:8px;">
                <div class="esp-news-title" style="font-size:15px;">{n.title}</div>
                <div class="esp-news-desc" style="font-size:11px;-webkit-line-clamp:2;">{n.description || ''}</div>
                <div class="esp-news-meta" style="font-size:9px; margin-top:4px;">
                  <span>{n.author === 'VLR.gg' ? 'Valorant Esports' : n.author} • {n.date}</span>
                </div>
              </a>
            {/each}
          {/if}
        </div>
      </div>
    {/if}

  </div>
</div>

<!-- VCT Tournament Modal -->
{#if vctModalOpen}
  <div class="stat-modal-overlay open" on:click|self={closeVctModalFn}>
    <div class="stat-modal" style="max-width: 640px; border-color: rgba(255, 70, 85, 0.4); background: linear-gradient(180deg, var(--surface) 0%, rgba(20,20,20,0.95) 100%);">
      <div class="stat-modal-header" style="border-bottom: 1px solid rgba(255, 70, 85, 0.2); padding-bottom: 12px;">
        <div class="stat-modal-title" style="color: var(--loss); font-size: 20px; font-family:'Barlow Condensed',sans-serif; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">
          {VCT_STAGE_DATA[vctModalStage]?.title || 'VCT Tournament details'}
        </div>
        <button class="stat-modal-close" on:click={closeVctModalFn}>✕</button>
      </div>
      <div class="stat-modal-body" style="padding: 20px 0; max-height: 480px; overflow-y: auto;">
        <!-- Regional Tabs -->
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
          {#each vctModalTabList as r}
            <button
              class="vct-modal-tab-btn"
              style="background:{vctModalRegion === r ? 'var(--loss)' : 'rgba(255,255,255,0.03)'}; border:1px solid {vctModalRegion === r ? 'var(--loss)' : 'rgba(255,255,255,0.1)'}; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:11px; padding:6px 12px; border-radius:4px; cursor:pointer; text-transform:uppercase; transition:var(--transition); font-weight:700;"
              on:click={() => switchVctModalTab(vctModalStage, r)}
            >{getRegionLabel(r)}</button>
          {/each}
        </div>

        <!-- Regional Winners -->
        {#if vctModalWinners.length > 0 && !(vctModalStage === 'masters_london' && (vctModalRegion === 'playoffs' || vctModalRegion === 'swiss'))}
          <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:14px; text-transform:uppercase; color:var(--accent); margin-bottom:12px; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">🏆 Regional Winners</h4>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:24px;">
            {#each vctModalWinners as w}
              <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:4px; display:flex; align-items:center; gap:10px;">
                <div style="font-size:10px; color:var(--muted); text-transform:uppercase;">{w.region}</div>
                <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
                  {#if w.logo}
                    <img src={w.logo.startsWith('/api/image') ? w.logo : `/api/image?url=${encodeURIComponent(w.logo)}`} style="width:20px;height:20px;object-fit:contain;" alt="" />
                  {/if}
                  <span style="font-weight:700; color:{w.color || '#fff'}">{w.team}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Masters London Bracket/Swiss -->
        {#if vctModalStage === 'masters_london' && vctModalRegion === 'playoffs'}
          <div style="display:flex; flex-direction:column; gap:20px; padding:10px 0;">
            <div style="border-left: 2px solid var(--accent); padding-left: 10px;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Upper Bracket Playoffs</div>
              <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Quarterfinals → Semifinals → Finals</div>
            </div>
            <div class="bracket-scroll-container" style="display:flex; gap:24px; overflow-x:auto; padding-bottom:12px; width:100%; box-sizing:border-box;">
              <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="bracket-round-title">Upper Quarterfinals</div>
                {@html getMatchCardHtml("Paper Rex", "LEVIATÁN", 0, 0, "June 12 · 7:30 PM", "TODAY", false, "670466")}
                {@html getMatchCardHtml("Team Heretics", "Team Vitality", 0, 0, "June 12 · 10:30 PM", "TODAY", false, "670467")}
                {@html getMatchCardHtml("EDward Gaming", "FUT Esports", 0, 0, "June 13 · 7:30 PM", "TOMORROW", false, "670465")}
                {@html getMatchCardHtml("G2 Esports", "Xi Lai Gaming", 0, 0, "June 13 · 10:30 PM", "TOMORROW", false, "670464")}
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Upper Semifinals</div>
                {@html getMatchCardHtml("PRX/LEV Winner", "TH/VIT Winner", "—", "—", "June 15 · 7:30 PM", "UPCOMING", false, "670468")}
                {@html getMatchCardHtml("EDG/FUT Winner", "G2/XLG Winner", "—", "—", "June 15 · 10:30 PM", "UPCOMING", false, "670469")}
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Upper Final</div>
                {@html getMatchCardHtml("TBD", "TBD", "—", "—", "June 18 · 7:30 PM", "UPCOMING", false, "670470")}
              </div>
            </div>
            <div style="border-left: 2px solid #a855f7; padding-left: 10px; margin-top:10px;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Lower Bracket</div>
              <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Survival stage · Win or go home</div>
            </div>
            <div class="bracket-scroll-container" style="display:flex; gap:24px; overflow-x:auto; padding-bottom:12px; width:100%; box-sizing:border-box;">
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Lower Round 1</div>
                {@html getMatchCardHtml("PRX/LEV Loser", "TH/VIT Loser", "—", "—", "June 14 · 7:30 PM", "UPCOMING", false, "670472")}
                {@html getMatchCardHtml("EDG/FUT Loser", "G2/XLG Loser", "—", "—", "June 14 · 10:30 PM", "UPCOMING", false, "670473")}
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Lower Round 2</div>
                {@html getMatchCardHtml("UBSF Loser", "LBR1 Winner", "—", "—", "June 16 · 7:30 PM", "UPCOMING", false, "670474")}
                {@html getMatchCardHtml("UBSF Loser", "LBR1 Winner", "—", "—", "June 16 · 10:30 PM", "UPCOMING", false, "670475")}
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Lower Semifinal</div>
                {@html getMatchCardHtml("TBD", "TBD", "—", "—", "June 19 · 7:30 PM", "UPCOMING", false, "670476")}
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
                <div class="bracket-round-title">Lower Final (Bo5)</div>
                {@html getMatchCardHtml("TBD", "TBD", "—", "—", "June 20 · 7:30 PM", "UPCOMING", false, "670477")}
              </div>
            </div>
            <div style="border-left: 2px solid #fbbf24; padding-left: 10px; margin-top:10px;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Grand Finals</div>
              <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">The ultimate showdown</div>
            </div>
            <div style="display:flex; padding-bottom:12px; width:100%; box-sizing:border-box;">
              {@html getMatchCardHtml("Upper Final Winner", "Lower Final Winner", "—", "—", "June 21 · 6:30 PM", "UPCOMING", false, "670471")}
            </div>
          </div>
        {:else if vctModalStage === 'masters_london' && vctModalRegion === 'swiss'}
          <div style="display:flex; flex-direction:column; gap:20px; padding:10px 0;">
            <div style="margin-bottom:20px;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:800; text-transform:uppercase; color:var(--muted); letter-spacing:1px; margin-bottom:8px;">Swiss Stage Standings</div>
              <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:8px;">
                {#each [
                  { name: "LEVIATÁN", w: 2, l: 0, status: "QUALIFIED", color: "var(--win)" },
                  { name: "Team Vitality", w: 2, l: 0, status: "QUALIFIED", color: "var(--win)" },
                  { name: "FUT Esports", w: 2, l: 1, status: "QUALIFIED", color: "var(--win)" },
                  { name: "Xi Lai Gaming", w: 2, l: 1, status: "QUALIFIED", color: "var(--win)" },
                  { name: "NRG", w: 1, l: 2, status: "ELIMINATED", color: "var(--loss)" },
                  { name: "Global Esports", w: 1, l: 2, status: "ELIMINATED", color: "var(--loss)" },
                  { name: "FULL SENSE", w: 0, l: 2, status: "ELIMINATED", color: "var(--loss)" },
                  { name: "Dragon Ranger Gaming", w: 0, l: 2, status: "ELIMINATED", color: "var(--loss)" }
                ] as t}
                  <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:8px; display:flex; flex-direction:column; align-items:center; gap:4px; box-sizing:border-box;">
                    <div style="display:flex; align-items:center; justify-content:center; height:24px;">{@html getEsportsTeamLogoHtml(t.name)}</div>
                    <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; text-transform:uppercase; text-align:center; color:#fff; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; width:100%;">{t.name}</div>
                    <div style="font-family:'DM Mono',monospace; font-size:10px; color:{t.color}; font-weight:bold;">{t.w}-{t.l} · {t.status}</div>
                  </div>
                {/each}
              </div>
            </div>
            <div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:800; text-transform:uppercase; color:var(--muted); letter-spacing:1px; margin-bottom:12px;">Swiss Match Logs</div>
              <div style="display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div class="swiss-round-header">Round 3 Deciders (June 10)</div>
                  <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    {@html getMatchCardHtml("FUT Esports", "NRG", 2, 1, "June 10 · 2-1 reverse sweep", "FINAL", false, "684619")}
                    {@html getMatchCardHtml("Xi Lai Gaming", "Global Esports", 2, 1, "June 10 · Decider series", "FINAL", false, "684618")}
                  </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div class="swiss-round-header">Round 2 Matches (June 8 - 9)</div>
                  <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    {@html getMatchCardHtml("LEVIATÁN", "NRG", 2, 1, "June 8 · High (1-0)", "FINAL", false, "684615")}
                    {@html getMatchCardHtml("Team Vitality", "FUT Esports", 2, 1, "June 8 · High (1-0)", "FINAL", false, "684614")}
                    {@html getMatchCardHtml("Xi Lai Gaming", "Dragon Ranger Gaming", 2, 1, "June 9 · Low (0-1)", "FINAL", false, "684616")}
                    {@html getMatchCardHtml("Global Esports", "FULL SENSE", 2, 1, "June 9 · Low (0-1)", "FINAL", false, "684617")}
                  </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div class="swiss-round-header">Round 1 Openers (June 6 - 7)</div>
                  <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    {@html getMatchCardHtml("NRG", "Xi Lai Gaming", 2, 0, "June 6 · Opening match", "FINAL", false, "684613")}
                    {@html getMatchCardHtml("Team Vitality", "Dragon Ranger Gaming", 2, 0, "June 6 · Opening match", "FINAL", false, "684610")}
                    {@html getMatchCardHtml("FUT Esports", "FULL SENSE", 2, 0, "June 7 · Opening match", "FINAL", false, "684611")}
                    {@html getMatchCardHtml("LEVIATÁN", "Global Esports", 2, 1, "June 7 · Opening match", "FINAL", false, "684612")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- Participating Teams -->
          {#if vctModalTeams.length > 0 || vctModalLoading}
            <h4 style="font-family:'Barlow Condensed', sans-serif; font-size:14px; text-transform:uppercase; color:#fff; margin-bottom:12px; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">👥 Participating Teams</h4>
          {/if}
          {#if vctModalLoading}
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; gap:12px; color:var(--muted);">
              <div class="cyber-spinner" style="width:30px; height:30px; border:2px solid rgba(255, 70, 85, 0.2); border-top-color:var(--loss); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
              <div style="font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px;">ESTABLISHING SECURE DATA GRID CONNECTION...</div>
            </div>
          {:else if vctModalTeams.length > 0}
            <div class="player-card-grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
              {#each vctModalTeams as t}
                {@const teamReg = getTeamRegionForModal(t)}
                {@const clickable = isTeamClickable(t)}
                {@const logoUrl = getVlrTeamLogo(t)}
                {@const tagLabel = teamReg ? teamReg.toUpperCase() : (t.slug ? t.slug.substring(0,6).toUpperCase() : 'VCT')}
                <button
                  class="player-card"
                  style="min-height:85px; padding:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); transition:var(--transition); border-radius:4px; gap:8px; cursor:{clickable ? 'pointer' : 'default'};"
                  on:click={() => clickable && selectTeamFromModal(t)}
                >
                  <div style="display:flex; align-items:center; justify-content:center; height:32px;">
                    {#if logoUrl}
                      <img src={logoUrl} style="width:28px;height:28px;object-fit:contain;" alt={t.name} />
                    {:else}
                      <div class="team-logo-fallback" style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:Barlow Condensed,sans-serif; font-size:11px; font-weight:700; color:var(--accent);">
                        {(t.name || '').substring(0, 2).toUpperCase()}
                      </div>
                    {/if}
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:11px; color:#fff; text-transform:uppercase; text-align:center; line-height:1.1; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title={t.name}>{t.name}</div>
                    <div style="font-size:8px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">{tagLabel}</div>
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <div style="text-align:center; color:var(--muted); padding:20px; font-family:'DM Mono',monospace;">No qualified teams found for this region.</div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
{/if}
