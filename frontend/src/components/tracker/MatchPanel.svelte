<script>
  import MatchScoreboard from './MatchScoreboard.svelte';
  import { getAgentIconUrl } from '../../lib/assets';
  import { getRankImgUrl, getRankColor } from '../../lib/constants';
  import { getGrade, getPlayerList, escapeHtml } from '../../lib/utils';

  export let match = {};
  export let idx = 0;
  export let rawMatch = null;
  export let playerName = '';
  export let playerTag = '';
  export let onShare = () => {};

  let activeTab = 'scoreboard';
  let detailData = null;
  let detailLoading = false;
  let detailError = null;
  let detailLoaded = false;

  $: m = match || {};
  $: acs = m.score != null ? Math.round(m.score / 100) : 0;
  $: hsPct = m.hs && m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
  $: grade = getGrade(m.kills || 0, m.deaths || 0, m.assists || 0, acs, m.won);
  $: kd = m.deaths ? ((m.kills || 0) / m.deaths).toFixed(2) : (m.kills || 0).toFixed(2);
  $: agentIcon = getAgentIconUrl(m.agentName);
  $: wl = m.won ? 'win' : 'loss';

  function switchTab(tab) {
    activeTab = tab;
    if (tab !== 'scoreboard' && tab !== 'ai' && !detailLoaded && rawMatch) {
      loadFullDetail();
    }
  }

  async function loadFullDetail() {
    if (detailLoaded || detailLoading) return;
    detailLoading = true;
    detailError = null;

    try {
      const res = await fetch(`/api/v3/match/${m.matchId}?region=${m.region || 'ap'}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          detailData = data.data;
          detailLoaded = true;
        } else {
          detailError = 'Match detail not available';
        }
      } else {
        detailError = `Fetch error ${res.status}`;
      }
    } catch (e) {
      detailError = 'Network error — click again to retry';
    } finally {
      detailLoading = false;
    }
  }

  function getMvpInfo() {
    if (!rawMatch) return { isMatchMVP: false, isTeamMVP: false };
    const allPlayers = getPlayerList(rawMatch);
    const getACS = p => Math.round((p.stats?.score || 0) / 100);
    const matchMVPPlayer = allPlayers.length
      ? allPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, allPlayers[0])
      : null;
    const alliedPlayers = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
    const teamMVPPlayer = alliedPlayers.length
      ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0])
      : null;
    const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    return { isMatchMVP, isTeamMVP };
  }

  $: mvpInfo = getMvpInfo();
  $: mvpBadge = mvpInfo.isMatchMVP
    ? 'Match MVP'
    : mvpInfo.isTeamMVP
    ? 'Team MVP'
    : '';
</script>

<div class="panel-body">
  <div class="panel-header-row">
    <div class="panel-grade-badge {grade}">{grade}</div>
    <div class="panel-match-meta">
      <div class="panel-meta-left">
        <div class="panel-match-title">
          {#if agentIcon}
            <img src={agentIcon} alt={m.agentName} style="width:28px;height:28px;object-fit:contain;" on:error={(e) => e.target.style.display='none'}>
          {/if}
          {(m.agentName || '—').toUpperCase()} · {(m.map || '—').toUpperCase()}
        </div>
        <div class="panel-match-sub">{m.won ? 'VICTORY' : 'DEFEAT'} · {m.rounds} rounds</div>
        {#if mvpBadge}
          <div class="mvp-header-badge {mvpInfo.isMatchMVP ? 'match-mvp' : 'team-mvp'}">
            {mvpInfo.isMatchMVP ? 'Match MVP' : 'Team MVP'}
          </div>
        {/if}
        <div style="margin: 8px 0 10px; display: flex; gap: 8px; align-items: center;">
          <button class="share-flex-btn" on:click|stopPropagation={onShare}>
            <span>✨ Share Flex Card</span>
          </button>
        </div>
      </div>
      <div class="panel-stat-row">
        <div class="ps-item">
          <div class="psv">{m.kills}/{m.deaths}/{m.assists}</div>
          <div class="psl">K / D / A</div>
        </div>
        <div class="ps-item">
          <div class="psv">{kd}</div>
          <div class="psl">K/D</div>
        </div>
        <div class="ps-item">
          <div class="psv">{acs}</div>
          <div class="psl">ACS</div>
        </div>
        <div class="ps-item">
          <div class="psv">{hsPct}%</div>
          <div class="psl">HS Rate</div>
        </div>
      </div>
    </div>
  </div>

  <div class="panel-tabs">
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'scoreboard'}
      on:click={() => switchTab('scoreboard')}
    >
      Scoreboard
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'performance'}
      on:click={() => switchTab('performance')}
    >
      Performance
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'duels'}
      on:click={() => switchTab('duels')}
    >
      Fights
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'timeline'}
      on:click={() => switchTab('timeline')}
    >
      Rounds
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'ai'}
      on:click={() => switchTab('ai')}
    >
      AI Analysis
    </button>
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'scoreboard'}>
    {#if rawMatch}
      <MatchScoreboard match={rawMatch} myTeamId={m.myTeamId} {playerName} />
    {:else}
      <div class="no-detail">Match data not cached — click a tab to load</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'performance'}>
    {#if detailLoading}
      <div class="detail-loading">Loading performance data...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <div class="panel-section">
        <div class="panel-section-title">Performance Details</div>
        <div class="no-detail">Performance data loaded</div>
      </div>
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'duels'}>
    {#if detailLoading}
      <div class="detail-loading">Loading fight duels...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <div class="panel-section">
        <div class="panel-section-title">Fight Duels</div>
        <div class="no-detail">Duel data loaded</div>
      </div>
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'timeline'}>
    {#if detailLoading}
      <div class="detail-loading">Loading round timelines...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <div class="panel-section">
        <div class="panel-section-title">Round Timeline</div>
        <div class="no-detail">Timeline data loaded</div>
      </div>
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'ai'}>
    <div class="match-ai-wrap" style="margin-top:0;">
      <div class="match-ai-header">
        <div class="match-ai-title">ValBot Match Analysis</div>
        <button class="match-ai-btn">
          Analyse This Match
        </button>
      </div>
      <div class="match-ai-body"></div>
    </div>
  </div>
</div>
