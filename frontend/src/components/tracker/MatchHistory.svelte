<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import MatchPanel from './MatchPanel.svelte';
  import { player } from '../../lib/appStore';
  import { getGrade } from '../../lib/processMatches';
  import { getAgentIconUrl, getMapImg } from '../../lib/assets';
  import { getRankImgUrl, getRankColor } from '../../lib/constants';
  import { formatMatchDate, isToday, getDayKey, getDayLabel } from '../../lib/utils';

  export let recentMatches = [];
  export let mmrHistory = {};
  export let allRawMatches = [];
  export let playerName = '';
  export let playerTag = '';
  export let currentMode = 'competitive';
  export let onShareMatch = () => {};

  let matchesLimit = 10;
  let filterResult = 'all'; // 'all', 'win', 'loss', 'today'
  let searchQuery = '';
  let openIdx = null;

  $: filtered = recentMatches.filter(m => {
    if (filterResult === 'win' && !m.won) return false;
    if (filterResult === 'loss' && m.won) return false;
    if (filterResult === 'today') {
      if (!isToday(m.gameStart)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const agent = (m.agentName || '').toLowerCase();
      const map = (m.map || '').toLowerCase();
      if (!agent.includes(q) && !map.includes(q)) return false;
    }
    return true;
  });

  $: displayed = filtered.slice(0, matchesLimit);

  function groupByDay(matches) {
    const groups = [];
    const groupMap = {};
    matches.forEach((m, idx) => {
      const key = getDayKey(m.gameStart);
      if (!groupMap[key]) {
        groupMap[key] = { label: getDayLabel(m.gameStart), matches: [], rrTotal: 0, hasRR: false, wins: 0, losses: 0 };
        groups.push(groupMap[key]);
      }
      const g = groupMap[key];
      g.matches.push({ m, idx });
      const rr = mmrHistory[m.matchId];
      if (rr !== undefined) { g.rrTotal += rr; g.hasRR = true; }
      if (m.won) g.wins++; else g.losses++;
    });
    return groups;
  }

  $: groups = groupByDay(displayed);

  function togglePanel(idx) {
    if (openIdx === idx) {
      openIdx = null;
    } else {
      openIdx = idx;
    }
  }

  function loadMore() {
    matchesLimit += 10;
  }

  function getRawMatch(matchId) {
    return allRawMatches.find(m => {
      const id = m.metadata?.matchid || m.metadata?.match_id;
      return id === matchId;
    }) || null;
  }

  // Local observer — fires after match rows are in DOM
  let matchObserver;
  function observeMatchRows() {
    if (typeof IntersectionObserver === 'undefined') return;
    if (matchObserver) matchObserver.disconnect();
    matchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            matchObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -10px 0px' }
    );
    document.querySelectorAll('.match-item.reveal-on-scroll:not(.in-view)').forEach(el => matchObserver.observe(el));
  }

  onMount(() => {
    setTimeout(observeMatchRows, 80);
    return () => { if (matchObserver) matchObserver.disconnect(); };
  });

  // Re-observe when matches arrive or "Load More" adds new rows
  $: if (recentMatches.length > 0 || matchesLimit) {
    setTimeout(observeMatchRows, 100);
  }
</script>

{#if recentMatches.length > 0}
  <div class="filter-bar" id="filter-bar" style="grid-column:1 / -1;">
    <button class="filter-btn" class:active={filterResult === 'all'} on:click={() => filterResult = 'all'}>All</button>
    <button class="filter-btn" class:active={filterResult === 'win'} on:click={() => filterResult = 'win'}>Wins</button>
    <button class="filter-btn" class:active={filterResult === 'loss'} on:click={() => filterResult = 'loss'}>Losses</button>
    <button class="filter-btn" class:active={filterResult === 'today'} on:click={() => filterResult = 'today'}>Today</button>
    <input class="filter-search" bind:value={searchQuery} placeholder="Search agent or map...">
    <span class="filter-count" id="filter-count">{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</span>
  </div>

  <div style="display:contents;">
    {#if filtered.length === 0}
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <div class="empty-state-title">No Matches Found</div>
        <div class="empty-state-sub">
          No matches match your current filter.<br>
          Try a different result type or clear the search.
        </div>
        <button class="empty-state-action" on:click={() => { filterResult = 'all'; searchQuery = ''; }}>
          Clear Filters
        </button>
      </div>
    {:else}

      {#each groups as group}
        <div class="day-group-header">
          <span class="day-group-title">{group.label}</span>
          <div class="day-group-line"></div>
          <span class="day-group-record">{group.wins}W {group.losses}L</span>
          {#if group.hasRR}
            <span class="day-group-rr {group.rrTotal > 0 ? 'pos' : group.rrTotal < 0 ? 'neg' : 'neu'}">
              {group.rrTotal > 0 ? '+' : ''}{group.rrTotal} RR
            </span>
          {/if}
        </div>

        {#each group.matches as { m, idx }}
          {@const wl = m.won ? 'win' : 'loss'}
          {@const totalRounds = String(m.rounds || '1-1').split('-').reduce((a, b) => Number(a) + Number(b), 0)}
          {@const acs = m.acs != null ? m.acs : Math.round(m.score / Math.max(1, totalRounds))}
          {@const grade = getGrade(m.kills, m.deaths, m.assists, acs, m.won)}
          {@const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2)}
          {@const agentIcon = getAgentIconUrl(m.agentName)}
          {@const matchDateStr = formatMatchDate(m.gameStart)}
          {@const matchIsToday = isToday(m.gameStart)}
          {@const rr = mmrHistory[m.matchId]}

          <div class="match-item reveal-on-scroll stagger-{idx % 6}" style="transition-delay:{Math.min(idx * 45, 480)}ms">
            <div
              class="match-row"
              class:open={openIdx === idx}
              on:click={() => togglePanel(idx)}
              on:keydown={(e) => e.key === 'Enter' && togglePanel(idx)}
              role="button"
              tabindex="0"
            >
              <div class="mr-result {wl}">{m.won ? 'WIN' : 'LOSS'}</div>
              <div class="mr-agent" style="padding:0;gap:0;overflow:hidden;">
                {#if getMapImg(m.map)}
                  <div class="mr-map-thumb">
                    <img src={getMapImg(m.map)} alt={m.map} loading="lazy">
                    <div class="mr-map-thumb-label">{(m.map || '').toUpperCase()}</div>
                  </div>
                {:else}
                  <div class="mr-map-thumb" style="background:var(--surface2);">
                    <div class="mr-map-thumb-label">{(m.map || '').toUpperCase()}</div>
                  </div>
                {/if}
                <div style="padding:12px 12px;">
                  {#if agentIcon}
                    <img class="mr-agent-icon" src={agentIcon} alt={m.agentName} loading="lazy">
                  {/if}
                </div>
                <div style="padding:12px 0;">
                  <div class="mr-agent-name">{(m.agentName || '—').toUpperCase()}</div>
                  <div class="mr-map" style="margin-top:2px;">{(m.map || '—').toUpperCase()}</div>
                  {#if matchDateStr}
                    <div class="mr-date">{matchDateStr}</div>
                  {/if}
                </div>
              </div>
              <div class="mr-score">{m.rounds}</div>
              <div class="mr-lobby">
                {#if m.lobbyRank && m.lobbyRank.overall}
                  {@const rank = m.lobbyRank.overall}
                  {@const rankImg = getRankImgUrl(rank.name)}
                  {#if rankImg}
                    <img class="mr-lobby-img" src={rankImg} alt={rank.name} loading="lazy" on:error={(e) => e.target.style.display='none'}>
                  {/if}
                  <span class="mr-lobby-txt" style="color:{getRankColor(rank.name)}">
                    {#each rank.name.split(' ') as part, pi}
                      {#if pi > 0}<br>{/if}{part}
                    {/each}
                  </span>
                {:else}
                  <span class="mr-lobby-txt">—</span>
                {/if}
              </div>
              <div class="mr-kda">
                <div class="mr-kda-main">{m.kills} / {m.deaths} / {m.assists}</div>
                <div class="mr-kda-sub">K / D / A</div>
              </div>
              <div class="mr-acs-wrap">
                <div class="mr-acs">{acs}</div>
                <div class="mr-acs-sub">ACS</div>
              </div>
              <div class="mr-grade-wrap">
                <div class="mr-grade {grade}">{grade}</div>
                <div class="mr-grade-sub">GRADE</div>
              </div>
              <div class="mr-rr">
                {#if rr !== undefined && rr !== null}
                  {@const cls = rr > 0 ? 'pos' : rr < 0 ? 'neg' : 'unk'}
                  <div class="mr-rr-val {cls}">{rr > 0 ? '+' : ''}{rr}</div>
                {:else}
                  <div class="mr-rr-val unk">—</div>
                {/if}
                <div class="mr-rr-lbl">RR</div>
              </div>
              <div class="mr-chevron">▼</div>
            </div>

            {#if openIdx === idx}
              <div class="match-panel open" transition:slide={{ duration: 300 }}>
                <MatchPanel
                  match={m}
                  {idx}
                  rawMatch={getRawMatch(m.matchId)}
                  {playerName}
                  {playerTag}
                  {currentMode}
                  {mmrHistory}
                  onShare={() => onShareMatch(m)}
                />
              </div>
            {/if}
          </div>
        {/each}
      {/each}

      {#if filtered.length > matchesLimit}
        <div class="load-more-container">
          <button class="load-more-btn" on:click={loadMore}>
            <span>Show More Matches</span>
            <span class="load-more-count">({filtered.length - matchesLimit} remaining)</span>
          </button>
        </div>
      {/if}
    {/if}
  </div>

{:else}
  <div class="empty-state">
    <div class="empty-state-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    </div>
    <div class="empty-state-title">No Matches Found</div>
    <div class="empty-state-sub">
      No matches match your current filters.<br>
      Try clearing the search or switching the result filter.
    </div>
  </div>
{/if}

<style>
</style>
