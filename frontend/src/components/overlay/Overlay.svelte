<script>
  import { onMount, onDestroy } from 'svelte';
  import { apiFetch } from '../../lib/api';

  const AGENT_UUIDS = {
    'Jett':'add6443a-41bd-e414-f6ad-e58d267f4e95',
    'Reyna':'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
    'Phoenix':'eb93336a-449b-9c1b-0a54-a891f7921d69',
    'Neon':'bb2a4828-46eb-8cd1-e765-15848195d751',
    'Iso':'0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
    'Yoru':'7f94d92c-4234-0a36-9646-3a87eb8b5c89',
    'Raze':'f94c3b30-42be-e959-889c-5aa313dba261',
    'Waylay':'df1cb487-4902-002e-5c17-d28e83e78588',
    'Sage':'569fdd95-4d10-43ab-ca70-79becc718b46',
    'Killjoy':'1e58de9c-4950-5125-93e9-a0aee9f98746',
    'Cypher':'117ed9e3-49f3-6512-3ccf-0cada7e3823b',
    'Chamber':'22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
    'Deadlock':'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
    'Vyse':'efba5359-4016-a1e5-7626-b1ae76895940',
    'Veto':'92eeef5d-43b5-1d4a-8d03-b3927a09034b',
    'Sova':'320b2a48-4d9b-a075-30f1-1f93a9b638fa',
    'Breach':'5f8d3a7f-467b-97f3-062c-13acf203c006',
    'Skye':'6f2a04ca-43e0-be17-7f36-b3908627744d',
    'Fade':'dade69b4-4f5a-8528-247b-219e5a1facd6',
    'Gekko':'e370fa57-4757-3604-3648-499e1f642d3f',
    'KAY/O':'601dbbe7-43ce-be57-2a40-4abd24953621',
    'Tejo':'b444168c-4e35-8076-db47-ef9bf368f384',
    'Brimstone':'9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
    'Viper':'707eab51-4836-f488-046a-cda6bf494859',
    'Omen':'8e253930-4c05-31dd-1b6c-968525494517',
    'Astra':'41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
    'Harbor':'95b78ed7-4637-86d9-7e41-71ba8c293152',
    'Clove':'1dbf2edd-4729-0984-3115-daa5eed44993',
    'Miks':'7c8a4701-4de6-9355-b254-e09bc2a34b72',
  };

  const statLabels = {
    rank: 'Rank', peak: 'Peak Rank', winrate: 'Win Rate', kd: 'K/D Ratio',
    acs: 'Avg ACS', kills: 'Total Kills', avg_kills: 'Avg Kills', assists: 'Assists',
    daily_wl: 'Session W/L', session_winrate: 'Session Win %', session_kd: 'Session K/D', session_acs: 'Session ACS'
  };

  const statIcons = {
    rank: '\u{1F6E1}\u{FE0F}', peak: '\u{1F451}', winrate: '\u{1F4C8}', kd: '\u{2694}\u{FE0F}',
    acs: '\u{1F525}', kills: '\u{1F480}', avg_kills: '\u{1F480}', assists: '\u{1F91D}',
    daily_wl: '\u{1F4CA}', session_winrate: '\u{1F4C8}', session_kd: '\u{2694}\u{FE0F}', session_acs: '\u{1F525}'
  };

  let agentMap = {};
  let loading = true;
  let loadingMsg = 'Initializing...';
  let error = '';
  let stats = null;
  let interval;

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const playerName = escapeHtml(params.get('name') || params.get('player') || '');
  const playerTag = escapeHtml(params.get('tag') || '');
  let region = params.get('region') || '';
  const variant = (params.get('variant') || 'competitive').toLowerCase();

  const accent = params.get('accent');
  const bg = params.get('bg');
  const text = params.get('text');
  const border = params.get('border');
  const scale = params.get('scale') || '1';
  const statsParam = params.get('stats') || 'rank,winrate,kd,acs';
  const selectedStats = statsParam.split(',').map(s => s.trim().toLowerCase());

  function applyColor(cssVar, colorVal) {
    if (!colorVal) return;
    if (/^[0-9A-F]{3,8}$/i.test(colorVal)) {
      document.documentElement.style.setProperty(cssVar, `#${colorVal}`);
    } else {
      document.documentElement.style.setProperty(cssVar, decodeURIComponent(colorVal));
    }
  }

  function getAgentIcon(agentName) {
    if (!agentName) return '';
    const lowerName = agentName.toLowerCase();
    if (agentMap[lowerName]) return agentMap[lowerName];
    const matchedKey = Object.keys(AGENT_UUIDS).find(k => k.toLowerCase() === lowerName);
    if (matchedKey) {
      const u = AGENT_UUIDS[matchedKey];
      return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
    }
    return '';
  }

  function isToday(timestamp) {
    if (!timestamp) return false;
    let d;
    if (typeof timestamp === 'number') {
      d = new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1));
    } else {
      d = new Date(timestamp);
    }
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  async function loadAgentMap() {
    try {
      const res = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
      if (res.ok) {
        const json = await res.json();
        json.data.forEach(a => { agentMap[a.displayName.toLowerCase()] = a.displayIcon; });
      }
    } catch (e) {
      console.error('Failed to load agent icons', e);
    }
  }

  async function resolvePlayerAndRegion() {
    if (!playerName || !playerTag) {
      error = 'Player name and tag are required in the URL. Example: ?name=ItzPratham&tag=GEWin';
      loading = false;
      return null;
    }
    if (!region) {
      try {
        const encName = encodeURIComponent(playerName);
        const encTag = encodeURIComponent(playerTag);
        const accountRes = await apiFetch(`/v1/account/${encName}/${encTag}`);
        region = accountRes?.data?.region || 'ap';
      } catch {
        region = 'ap';
      }
    }
    return { name: playerName, tag: playerTag, region };
  }

  async function fetchPlayerData(player) {
    const encName = encodeURIComponent(player.name);
    const encTag = encodeURIComponent(player.tag);
    const [mmrRes, matchesRes] = await Promise.all([
      apiFetch(`/v3/mmr/${player.region}/pc/${encName}/${encTag}`),
      apiFetch(`/v3/matches/${player.region}/${encName}/${encTag}?mode=competitive`)
    ]);
    return { mmr: mmrRes?.data || {}, matches: matchesRes?.data || [] };
  }

  function aggregateStats(data, name, tag) {
    const mmr = data.mmr;
    const matches = data.matches;
    const lowerName = name.toLowerCase();
    const lowerTag = tag.toLowerCase();

    const currentTierName = mmr.current?.tier?.name || 'Unranked';
    const currentTierId = mmr.current?.tier?.id ?? 0;
    const currentRR = mmr.current?.rr ?? 0;
    const peakTierName = mmr.peak?.tier?.name || 'Unranked';
    const peakTierId = mmr.peak?.tier?.id ?? 0;

    let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalWins = 0, totalLosses = 0;
    let totalACS = 0, totalRounds = 0;
    let recentGames = [];
    let sessionWins = 0, sessionLosses = 0, sessionKills = 0, sessionDeaths = 0, sessionAssists = 0;
    let sessionACS = 0, sessionRounds = 0, sessionMatchesCount = 0;

    matches.forEach(match => {
      if (!match?.players?.all_players) return;
      const player = match.players.all_players.find(p =>
        p.name?.toLowerCase() === lowerName && p.tag?.toLowerCase() === lowerTag
      );
      if (!player) return;

      const stats = player.stats || {};
      const kills = stats.kills || 0;
      const deaths = stats.deaths || 0;
      const assists = stats.assists || 0;
      const score = stats.score || 0;
      const agent = player.character || player.agent?.name || 'Unknown';
      const myTeam = (player.team || '').toLowerCase();

      let won = false;
      if (match.teams?.[myTeam]) {
        won = match.teams[myTeam].has_won || false;
      } else {
        const redWon = match.teams?.red?.rounds_won || 0;
        const blueWon = match.teams?.blue?.rounds_won || 0;
        won = (myTeam === 'red' && redWon > blueWon) || (myTeam === 'blue' && blueWon > redWon);
      }

      const gameTime = match.metadata?.game_start || match.metadata?.gameStart;
      const playedToday = isToday(gameTime);

      if (playedToday) {
        if (won) sessionWins++; else sessionLosses++;
        sessionKills += kills; sessionDeaths += deaths; sessionAssists += assists;
        const roundsPlayed = match.metadata?.rounds_played || 1;
        sessionRounds += roundsPlayed; sessionACS += score; sessionMatchesCount++;
      }

      if (recentGames.length < 20) {
        totalKills += kills; totalDeaths += deaths; totalAssists += assists;
        if (won) totalWins++; else totalLosses++;
        const roundsPlayed = match.metadata?.rounds_played || 1;
        totalRounds += roundsPlayed; totalACS += score;
        recentGames.push({ agentName: agent, agentIcon: getAgentIcon(agent), won });
      }
    });

    const matchesCount = recentGames.length || 1;
    const finalKDR = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
    const finalWinRate = matchesCount > 0 ? ((totalWins / matchesCount) * 100).toFixed(1) : '0.0';
    const finalAvgACS = totalRounds > 0 ? Math.round(totalACS / totalRounds) : 0;
    const finalAvgKills = (totalKills / matchesCount).toFixed(1);

    const sessionWinrate = sessionMatchesCount > 0 ? ((sessionWins / sessionMatchesCount) * 100).toFixed(1) : '\u2014';
    const sessionKd = sessionMatchesCount > 0 ? (sessionDeaths > 0 ? (sessionKills / sessionDeaths).toFixed(2) : sessionKills.toFixed(2)) : '\u2014';
    const sessionAcs = sessionRounds > 0 ? Math.round(sessionACS / sessionRounds) : '\u2014';

    let winStreak = 0, lossStreak = 0;
    if (recentGames.length > 0) {
      const firstWon = recentGames[0].won;
      if (firstWon) { winStreak = 1; for (let i = 1; i < recentGames.length; i++) { if (recentGames[i].won) winStreak++; else break; } }
      else { lossStreak = 1; for (let i = 1; i < recentGames.length; i++) { if (!recentGames[i].won) lossStreak++; else break; } }
    }

    const kdNum = parseFloat(finalKDR) || 0;
    const wrNum = parseFloat(finalWinRate) || 0;
    let valIndex = Math.round((kdNum * 40) + (finalAvgACS * 0.15) + (wrNum * 0.25));
    valIndex = Math.max(0, Math.min(100, valIndex));

    let perfGrade = 'C', gradeColor = '#94a3b8';
    if (valIndex >= 85) { perfGrade = 'S+'; gradeColor = '#fbbf24'; }
    else if (valIndex >= 75) { perfGrade = 'S'; gradeColor = '#a78bfa'; }
    else if (valIndex >= 65) { perfGrade = 'A'; gradeColor = '#60a5fa'; }
    else if (valIndex >= 50) { perfGrade = 'B'; gradeColor = '#34d399'; }

    let sessionValIndex = '\u2014', sessionPerfGrade = '\u2014', sessionGradeColor = 'rgba(255,255,255,0.4)';
    if (sessionMatchesCount > 0) {
      const sKdNum = parseFloat(sessionKd) || 0;
      const sWrNum = parseFloat(sessionWinrate) || 0;
      const sAcsNum = parseInt(sessionAcs) || 0;
      let sValIndex = Math.round((sKdNum * 40) + (sAcsNum * 0.15) + (sWrNum * 0.25));
      sValIndex = Math.max(0, Math.min(100, sValIndex));
      sessionValIndex = sValIndex;
      if (sValIndex >= 85) { sessionPerfGrade = 'S+'; sessionGradeColor = '#fbbf24'; }
      else if (sValIndex >= 75) { sessionPerfGrade = 'S'; sessionGradeColor = '#a78bfa'; }
      else if (sValIndex >= 65) { sessionPerfGrade = 'A'; sessionGradeColor = '#60a5fa'; }
      else if (sValIndex >= 50) { sessionPerfGrade = 'B'; sessionGradeColor = '#34d399'; }
      else { sessionPerfGrade = 'C'; sessionGradeColor = '#94a3b8'; }
    }

    return {
      currentTierName, currentTierId, currentRR, peakTierName, peakTierId,
      kd: finalKDR, winrate: finalWinRate, acs: finalAvgACS, kills: totalKills,
      avg_kills: finalAvgKills, assists: totalAssists,
      daily_wl: `${sessionWins}W - ${sessionLosses}L`,
      winStreak, lossStreak, valIndex, perfGrade, gradeColor,
      sessionWinrate, sessionKd, sessionAcs, sessionValIndex, sessionPerfGrade, sessionGradeColor,
      recentGames: recentGames.slice(0, 10)
    };
  }

  async function updateLoop() {
    try {
      const player = await resolvePlayerAndRegion();
      if (!player) return;
      loadingMsg = 'Fetching live stats...';
      const data = await fetchPlayerData(player);
      stats = aggregateStats(data, player.name, player.tag);
      loading = false;
    } catch (e) {
      console.error('[STREAM OVERLAY] Error', e);
      error = 'Failed to fetch live stats. Will retry in 2 mins.';
      loading = false;
    }
  }

  onMount(async () => {
    applyColor('--accent', accent);
    applyColor('--bg', bg);
    applyColor('--text', text);
    applyColor('--border', border);
    if (scale) document.documentElement.style.setProperty('--scale', scale);

    await loadAgentMap();
    await updateLoop();
    interval = setInterval(updateLoop, 120000);
  });

  onDestroy(() => { if (interval) clearInterval(interval); });

  $: rankIconUrl = stats ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png` : '';
</script>

{#if loading}
  <div class="overlay-loading">
    <div class="spinner"></div>
    <div class="loading-text">{loadingMsg}</div>
  </div>
{:else if error}
  <div class="error-text">⚠️ Error: {error}</div>
{:else if stats}
  {#if variant === 'competitive'}
    <div class="comp-overlay">
      <div class="comp-recent-games">
        <span class="comp-player-badge">{playerName}<span class="comp-player-tag">#{playerTag}</span></span>
        <div class="comp-avatars-row">
          {#if stats.recentGames.length > 0}
            {#each stats.recentGames as g}
              <div class="comp-avatar-wrap">
                <img class="comp-avatar-img" src={g.agentIcon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"%3E%3Crect width="24" height="24" fill="%23222"/%3E%3C/svg%3E'} alt={g.agentName}>
                <div class="comp-avatar-outcome {g.won ? 'win' : 'loss'}"></div>
              </div>
            {/each}
          {:else}
            <div class="comp-recent-title">No recent matches found</div>
          {/if}
        </div>
      </div>

      <div class="comp-stats-body">
        <div class="comp-rank-icon-wrap">
          <img class="comp-rank-icon" src={rankIconUrl} alt={stats.currentTierName}>
        </div>
        <div class="comp-rank-info">
          <div style="display:flex; align-items:center;">
            <div class="comp-rank-name">{stats.currentTierName}</div>
            {#if stats.winStreak >= 2}
              <span class="streak-badge win" style="margin-left: 8px;">🔥 {stats.winStreak} STREAK</span>
            {:else if stats.lossStreak >= 2}
              <span class="streak-badge loss" style="margin-left: 8px;">❄️ {stats.lossStreak} STREAK</span>
            {/if}
          </div>
          <div class="comp-rr-bar-container">
            <div class="comp-rr-bar-fill" style="width: {Math.min(100, Math.max(0, stats.currentRR))}%"></div>
          </div>
          <div class="comp-rank-rr">{stats.currentRR} RR</div>
        </div>
        <div class="comp-stat-grid">
          <div class="comp-stat-box">
            <span class="comp-stat-val">{stats.winrate}%</span>
            <span class="comp-stat-lbl">Win %</span>
          </div>
          <div class="comp-stat-box">
            <span class="comp-stat-val">{stats.kd}</span>
            <span class="comp-stat-lbl">K/D Ratio</span>
          </div>
          <div class="comp-stat-box">
            <span class="comp-stat-val" style="color: {stats.gradeColor}; text-shadow: 0 0 8px {stats.gradeColor}40;">{stats.perfGrade}</span>
            <span class="comp-stat-lbl">VAL INDEX</span>
          </div>
        </div>
      </div>

      <div class="comp-brand-footer">
        <div class="comp-brand-logo">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>
        <div class="comp-brand-text">Valorant Live stream hud</div>
      </div>
    </div>

  {:else if variant === 'center'}
    <div class="center-overlay">
      <div class="center-brand-tag">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>

      <div class="center-left-block">
        <img class="center-rank-icon" src={rankIconUrl} alt={stats.currentTierName}>
        <div class="center-player-info">
          <span class="center-player-name" style="display:flex; align-items:center;">
            {playerName}<span class="center-player-tag">#{playerTag}</span>
            {#if stats.winStreak >= 2}
              <span class="streak-badge win" style="margin-left: 6px; font-size: 8px; padding: 1px 4px;">🔥 {stats.winStreak}W</span>
            {:else if stats.lossStreak >= 2}
              <span class="streak-badge loss" style="margin-left: 6px; font-size: 8px; padding: 1px 4px;">❄️ {stats.lossStreak}L</span>
            {/if}
          </span>
          <span class="center-player-rank">{stats.currentTierName}</span>
        </div>
      </div>

      <div class="center-divider"></div>

      <div class="center-right-block">
        <div class="center-stat-box">
          <span class="center-stat-val">{stats.sessionWinrate}{stats.sessionWinrate !== '\u2014' ? '%' : ''}</span>
          <span class="center-stat-lbl">Win %</span>
        </div>
        <div class="center-stat-box">
          <span class="center-stat-val">{stats.sessionKd}</span>
          <span class="center-stat-lbl">K/D Ratio</span>
        </div>
        <div class="center-stat-box">
          <span class="center-stat-val" style="color: {stats.sessionGradeColor}; text-shadow: 0 0 8px {stats.sessionGradeColor}40;">{stats.sessionPerfGrade}</span>
          <span class="center-stat-lbl">Val Index</span>
        </div>
        <div class="center-stat-box">
          <span class="center-stat-val">{stats.daily_wl}</span>
          <span class="center-stat-lbl">Session</span>
        </div>
      </div>
    </div>

  {:else if variant === 'flexible'}
    <div class="flex-overlay">
      <div class="flex-overlay-header">
        <img class="flex-rank-icon" src={rankIconUrl} alt={stats.currentTierName}>
        <div class="flex-header-text">
          <span class="flex-player-name">{playerName}<span class="flex-player-tag">#{playerTag}</span></span>
          <div class="flex-rr-bar-container">
            <div class="flex-rr-bar-fill" style="width: {Math.min(100, Math.max(0, stats.currentRR))}%"></div>
          </div>
          <span class="flex-player-rank">{stats.currentRR} RR</span>
        </div>
      </div>

      <div class="flex-stats-list">
        {#each selectedStats as s}
          {@const label = s === 'valindex' || s === 'val_index' ? 'VAL Index Score' : s === 'grade' || s === 'perf_grade' ? 'VAL Index Grade' : s === 'streak' || s === 'winstreak' ? (stats.winStreak >= 2 ? 'Win Streak' : stats.lossStreak >= 2 ? 'Loss Streak' : 'Streak') : s === 'session_winrate' ? 'Session Win %' : s === 'session_kd' ? 'Session K/D' : s === 'session_acs' ? 'Session ACS' : statLabels[s]}
          {@const val = s === 'valindex' || s === 'val_index' ? stats.valIndex : s === 'grade' || s === 'perf_grade' ? stats.perfGrade : s === 'streak' || s === 'winstreak' ? (stats.winStreak >= 2 ? `🔥 ${stats.winStreak} Wins` : stats.lossStreak >= 2 ? `❄️ ${stats.lossStreak} Losses` : 'None') : s === 'session_winrate' ? (stats.sessionWinrate !== '\u2014' ? `${stats.sessionWinrate}%` : '\u2014') : s === 'session_kd' ? stats.sessionKd : s === 'session_acs' ? stats.sessionAcs : s === 'winrate' ? `${stats.winrate}%` : s === 'rank' ? stats.currentTierName : s === 'peak' ? stats.peakTierName : stats[s]}
          {@const icon = s === 'valindex' || s === 'val_index' ? '\u{1F9E0}' : s === 'grade' || s === 'perf_grade' ? '\u2B50' : s === 'streak' || s === 'winstreak' ? '\u{1F525}' : statIcons[s] || '\u{1F4C8}'}
          {#if label && val !== undefined}
            <div class="flex-stat-row">
              <div class="flex-stat-lbl-block">
                <span class="flex-stat-icon">{icon}</span>
                <span class="flex-stat-lbl">{label}</span>
              </div>
              <span class="flex-stat-val" style={s === 'grade' || s === 'perf_grade' ? `color:${stats.gradeColor}` : ''}>{val}</span>
            </div>
          {/if}
        {/each}
      </div>

      <div class="flex-brand-footer">
        <div class="comp-brand-logo">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>
      </div>
    </div>
  {/if}
{/if}

<style>
  :global(html, body) {
    margin: 0; padding: 0;
    background: transparent !important;
    overflow: hidden;
    width: 100%; height: 100%;
  }
  :global(:root) {
    --accent: #e8ff47;
    --bg: rgba(15, 15, 18, 0.85);
    --text: #f4f4f7;
    --border: rgba(255, 255, 255, 0.08);
    --scale: 1;
    --win: #10b981;
    --loss: #f43f5e;
    --font-title: 'Barlow Condensed', 'Rajdhani', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'Rajdhani', sans-serif;
  }

  :global(.overlay-scaler) {
    transform: scale(var(--scale));
    transform-origin: top left;
    padding: 10px;
    box-sizing: border-box;
    display: inline-block;
  }

  .overlay-loading { position:fixed; inset:0; background:#060608; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; gap:12px; }
  .spinner { width:24px; height:24px; border:3px solid rgba(255,255,255,0.05); border-left-color:var(--accent); border-right-color:var(--accent); border-radius:50%; animation:spin 0.8s cubic-bezier(0.5,0.1,0.5,0.9) infinite; filter:drop-shadow(0 0 6px var(--accent)); }
  @keyframes spin { to { transform:rotate(360deg); } }
  .loading-text { font-family:var(--font-mono); font-size:11px; color:var(--text); text-transform:uppercase; letter-spacing:3px; }
  .error-text { font-family:var(--font-body); font-size:12px; color:var(--loss); text-align:center; padding:20px; }

  .comp-overlay { width:580px; background:var(--bg); border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.7); display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(10px); position:relative; }
  .comp-overlay::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--accent); }
  .comp-recent-games { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:rgba(0,0,0,0.2); border-bottom:1px solid var(--border); gap:6px; }
  .comp-recent-title { font-family:var(--font-mono); font-size:10px; font-weight:700; text-transform:uppercase; color:rgba(255,255,255,0.4); letter-spacing:1px; }
  .comp-avatars-row { display:flex; align-items:center; gap:6px; }
  .comp-avatar-wrap { position:relative; width:28px; height:28px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid var(--border); overflow:hidden; }
  .comp-avatar-img { width:100%; height:100%; object-fit:cover; }
  .comp-avatar-outcome { position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.3); }
  .comp-avatar-outcome.win { background:var(--win); }
  .comp-avatar-outcome.loss { background:var(--loss); }
  .comp-stats-body { display:flex; align-items:center; padding:14px 20px; gap:16px; }
  .comp-rank-icon-wrap { width:60px; height:60px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .comp-rank-icon { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 0 8px var(--accent)); }
  .comp-rank-info { display:flex; flex-direction:column; flex-grow:1; }
  .comp-rank-name { font-family:var(--font-title); font-size:26px; font-weight:800; text-transform:uppercase; color:var(--accent); line-height:1; letter-spacing:1px; text-shadow:0 0 10px rgba(232,255,71,0.2); }
  .comp-rank-rr { font-family:var(--font-mono); font-size:11px; color:rgba(255,255,255,0.5); margin-top:4px; }
  .comp-stat-grid { display:flex; gap:20px; border-left:1px solid var(--border); padding-left:20px; }
  .comp-stat-box { display:flex; flex-direction:column; min-width:70px; }
  .comp-stat-val { font-family:var(--font-title); font-size:28px; font-weight:900; line-height:1; color:#fff; }
  .comp-stat-lbl { font-family:var(--font-mono); font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-top:4px; letter-spacing:0.5px; }
  .comp-brand-footer { display:flex; align-items:center; justify-content:space-between; padding:6px 16px; background:rgba(0,0,0,0.4); border-top:1px solid var(--border); }
  .comp-brand-logo { font-family:var(--font-title); font-weight:800; font-size:12px; text-transform:uppercase; color:#fff; letter-spacing:1px; }
  .comp-brand-logo :global(span) { color:var(--accent); }
  .comp-brand-text { font-family:var(--font-mono); font-size:9px; color:rgba(255,255,255,0.3); text-transform:uppercase; }
  .comp-player-badge { font-family:var(--font-title); font-size:14px; font-weight:800; text-transform:uppercase; color:#fff; letter-spacing:0.5px; }
  .comp-player-tag { font-family:var(--font-mono); font-size:10px; color:rgba(255,255,255,0.4); font-weight:600; margin-left:2px; text-transform:uppercase; }

  .center-overlay { width:680px; height:80px; background:var(--bg); border:1px solid var(--border); box-shadow:0 10px 30px rgba(0,0,0,0.6); backdrop-filter:blur(10px); position:relative; display:flex; align-items:center; justify-content:space-between; padding:0 24px; clip-path:polygon(15px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15px); }
  .center-overlay::before { content:''; position:absolute; top:0; left:0; width:15px; height:15px; background:var(--accent); }
  .center-brand-tag { position:absolute; top:4px; right:24px; font-family:var(--font-title); font-weight:800; font-size:10px; text-transform:uppercase; color:rgba(255,255,255,0.4); letter-spacing:1px; z-index:5; }
  .center-brand-tag :global(span) { color:var(--accent); }
  .center-left-block { display:flex; align-items:center; gap:12px; }
  .center-rank-icon { width:44px; height:44px; object-fit:contain; filter:drop-shadow(0 0 6px var(--accent)); }
  .center-player-info { display:flex; flex-direction:column; }
  .center-player-name { font-family:var(--font-title); font-size:20px; font-weight:800; text-transform:uppercase; color:#fff; letter-spacing:0.5px; }
  .center-player-rank { font-family:var(--font-mono); font-size:10px; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px; }
  .center-divider { width:1px; height:36px; background:var(--border); }
  .center-right-block { display:flex; align-items:center; gap:24px; }
  .center-stat-box { display:flex; flex-direction:column; align-items:center; min-width:60px; }
  .center-stat-val { font-family:var(--font-title); font-size:24px; font-weight:900; line-height:1; color:#fff; }
  .center-stat-lbl { font-family:var(--font-mono); font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-top:3px; letter-spacing:0.5px; }
  .center-player-tag { font-family:var(--font-mono); font-size:11px; color:rgba(255,255,255,0.4); font-weight:600; margin-left:2px; text-transform:uppercase; }

  .flex-overlay { width:280px; background:var(--bg); border:1px solid var(--border); border-radius:16px; box-shadow:0 16px 40px rgba(0,0,0,0.7); display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(10px); position:relative; }
  .flex-overlay-header { padding:16px 20px; background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; position:relative; }
  .flex-overlay-header::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--accent); }
  .flex-rank-icon { width:48px; height:48px; object-fit:contain; filter:drop-shadow(0 0 6px var(--accent)); }
  .flex-header-text { display:flex; flex-direction:column; min-width:0; }
  .flex-player-name { font-family:var(--font-title); font-size:20px; font-weight:800; text-transform:uppercase; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:0.5px; }
  .flex-player-rank { font-family:var(--font-mono); font-size:10px; color:var(--accent); margin-top:2px; }
  .flex-stats-list { padding:12px 20px; display:flex; flex-direction:column; gap:10px; }
  .flex-stat-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px dashed rgba(255,255,255,0.04); }
  .flex-stat-row:last-child { border-bottom:none; }
  .flex-stat-lbl-block { display:flex; align-items:center; gap:8px; }
  .flex-stat-icon { font-size:12px; opacity:0.6; }
  .flex-stat-lbl { font-family:var(--font-mono); font-size:11px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.5px; }
  .flex-stat-val { font-family:var(--font-title); font-size:18px; font-weight:800; color:#fff; text-transform:uppercase; }
  .flex-brand-footer { padding:8px 20px; background:rgba(0,0,0,0.4); border-top:1px solid var(--border); display:flex; justify-content:center; }
  .flex-player-tag { font-family:var(--font-mono); font-size:10px; color:rgba(255,255,255,0.4); font-weight:600; margin-left:2px; text-transform:uppercase; }
  .comp-rr-bar-container { height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin-top:6px; margin-bottom:2px; width:120px; overflow:hidden; position:relative; }
  .comp-rr-bar-fill { height:100%; background:linear-gradient(90deg, var(--accent), #fff); box-shadow:0 0 8px var(--accent); border-radius:2px; transition:width 1s ease-in-out; }
  .flex-rr-bar-container { height:3px; background:rgba(255,255,255,0.08); border-radius:1.5px; margin-top:4px; margin-bottom:2px; width:100px; overflow:hidden; position:relative; }
  .flex-rr-bar-fill { height:100%; background:linear-gradient(90deg, var(--accent), #fff); box-shadow:0 0 6px var(--accent); border-radius:1.5px; transition:width 1s ease-in-out; }

  .streak-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 6px; border-radius:4px; font-family:var(--font-mono); font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 2px 6px rgba(0,0,0,0.4); }
  .streak-badge.win { background:rgba(251,191,36,0.15) !important; border:1px solid rgba(251,191,36,0.4) !important; color:#fbbf24 !important; animation:pulse-glow-win 2s infinite alternate; }
  .streak-badge.loss { background:rgba(56,189,248,0.15) !important; border:1px solid rgba(56,189,248,0.4) !important; color:#38bdf8 !important; animation:pulse-glow-loss 2s infinite alternate; }
  @keyframes pulse-glow-win { 0% { box-shadow:0 0 2px rgba(251,191,36,0.15); border-color:rgba(251,191,36,0.3); } 100% { box-shadow:0 0 10px rgba(251,191,36,0.45); border-color:rgba(251,191,36,0.7); } }
  @keyframes pulse-glow-loss { 0% { box-shadow:0 0 2px rgba(56,189,248,0.15); border-color:rgba(56,189,248,0.3); } 100% { box-shadow:0 0 10px rgba(56,189,248,0.45); border-color:rgba(56,189,248,0.7); } }

  .live-dot { display:inline-block; width:6px; height:6px; background-color:#10b981; border-radius:50%; margin-left:6px; box-shadow:0 0 8px #10b981; animation:live-blink 1.5s infinite alternate; vertical-align:middle; }
  @keyframes live-blink { 0% { opacity:0.4; box-shadow:0 0 4px rgba(16,185,129,0.4); } 100% { opacity:1; box-shadow:0 0 12px rgba(16,185,129,1); } }
</style>
