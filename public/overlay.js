// Stream Overlay Controller - ValTracker.gg

(async function () {
  // 1. Parse URL Parameters
  const params = new URLSearchParams(window.location.search);
  const playerName = params.get('name') || params.get('player') || '';
  const playerTag = params.get('tag') || '';
  let region = params.get('region') || '';
  const variant = (params.get('variant') || 'competitive').toLowerCase();
  
  // Theme Parameters
  const accent = params.get('accent');
  const bg = params.get('bg');
  const text = params.get('text');
  const border = params.get('border');
  const scale = params.get('scale') || '1';
  
  // Custom stats list (for flexible layout)
  const statsParam = params.get('stats') || 'rank,winrate,kd,acs';
  const selectedStats = statsParam.split(',').map(s => s.trim().toLowerCase());

  // 2. Setup DOM and Apply Styles
  const root = document.documentElement;
  
  function applyColor(cssVar, colorVal) {
    if (!colorVal) return;
    // If it's a valid hex without #, prepend it
    if (/^[0-9A-F]{3,8}$/i.test(colorVal)) {
      root.style.setProperty(cssVar, `#${colorVal}`);
    } else {
      root.style.setProperty(cssVar, decodeURIComponent(colorVal));
    }
  }

  applyColor('--accent', accent);
  applyColor('--bg', bg);
  applyColor('--text', text);
  applyColor('--border', border);
  
  if (scale) {
    root.style.setProperty('--scale', scale);
  }

  // Set scaler wrapper class
  const scaler = document.getElementById('overlay-scaler');
  if (scaler) {
    scaler.classList.add('loaded');
  }

  // 3. Helper to format stats values
  const statLabels = {
    rank: 'Rank',
    peak: 'Peak Rank',
    winrate: 'Win Rate',
    kd: 'K/D Ratio',
    acs: 'Avg ACS',
    kills: 'Total Kills',
    avg_kills: 'Avg Kills',
    assists: 'Assists',
    daily_wl: 'Session W/L',
    session_winrate: 'Session Win %',
    session_kd: 'Session K/D',
    session_acs: 'Session ACS'
  };

  const statIcons = {
    rank: '🛡️',
    peak: '👑',
    winrate: '📈',
    kd: '⚔️',
    acs: '🔥',
    kills: '💀',
    avg_kills: '💀',
    assists: '🤝',
    daily_wl: '📊',
    session_winrate: '📈',
    session_kd: '⚔️',
    session_acs: '🔥'
  };

  // State
  let agentMap = {};
  
  // 4. Fetch Agent Map once on load
  async function loadAgentMap() {
    try {
      const res = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
      if (res.ok) {
        const json = await res.json();
        json.data.forEach(a => {
          agentMap[a.displayName.toLowerCase()] = a.displayIcon;
        });
      }
    } catch (e) {
      console.error("Failed to load agent icons from Valorant API", e);
    }
  }

  // 5. Query account/region if missing
  async function resolvePlayerAndRegion() {
    if (!playerName || !playerTag) {
      showError("Player name and tag are required in the URL.<br>Example: ?name=ItzPratham&tag=GEWin");
      return null;
    }

    const encName = encodeURIComponent(playerName);
    const encTag = encodeURIComponent(playerTag);

    // If region is missing, fetch from account API
    if (!region) {
      try {
        const accountRes = await fetch(`/api/v1/account/${encName}/${encTag}`);
        if (!accountRes.ok) throw new Error("Could not resolve player account");
        const accountJson = await accountRes.ok ? await accountRes.json() : null;
        if (accountJson && accountJson.data && accountJson.data.region) {
          region = accountJson.data.region;
        } else {
          region = 'ap'; // Default fallback
        }
      } catch (err) {
        console.warn("Region resolve failed, falling back to AP", err);
        region = 'ap';
      }
    }
    return { name: playerName, tag: playerTag, region };
  }

  // 6. Main Data Fetching and Aggregation
  async function fetchPlayerData(player) {
    const encName = encodeURIComponent(player.name);
    const encTag = encodeURIComponent(player.tag);
    
    // Fetch MMR and Matches in parallel
    const mmrUrl = `/api/v3/mmr/${player.region}/pc/${encName}/${encTag}`;
    const matchesUrl = `/api/v3/matches/${player.region}/${encName}/${encTag}?mode=competitive`;

    try {
      const [mmrRes, matchesRes] = await Promise.all([
        fetch(mmrUrl),
        fetch(matchesUrl)
      ]);

      if (!mmrRes.ok) {
        throw new Error(`MMR fetch failed with status: ${mmrRes.status}`);
      }
      if (!matchesRes.ok) {
        throw new Error(`Matches fetch failed with status: ${matchesRes.status}`);
      }

      const mmrJson = await mmrRes.json();
      const matchesJson = await matchesRes.json();

      return {
        mmr: mmrJson.data || {},
        matches: matchesJson.data || []
      };
    } catch (e) {
      console.error("API Fetch Error:", e);
      throw e;
    }
  }

  // Timezone-safe calendar-day check
  function isToday(timestamp) {
    if (!timestamp) return false;
    let d;
    if (typeof timestamp === 'number') {
      // If epoch seconds, convert to milliseconds
      d = new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1));
    } else {
      d = new Date(timestamp);
    }
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  // 7. Aggregate Stats Logic
  function aggregateStats(data, name, tag) {
    const mmr = data.mmr;
    const matches = data.matches;
    const lowerName = name.toLowerCase();
    const lowerTag = tag.toLowerCase();

    // Base Profile
    const currentTierName = mmr.current?.tier?.name || 'Unranked';
    const currentTierId = mmr.current?.tier?.id ?? 0;
    const currentRR = mmr.current?.rr ?? 0;
    const peakTierName = mmr.peak?.tier?.name || 'Unranked';
    const peakTierId = mmr.peak?.tier?.id ?? 0;

    // Aggregate match details
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalACS = 0;
    let totalRounds = 0;
    let recentGames = [];

    // Today's Session tracking
    let sessionWins = 0;
    let sessionLosses = 0;
    let sessionKills = 0;
    let sessionDeaths = 0;
    let sessionAssists = 0;
    let sessionACS = 0;
    let sessionRounds = 0;
    let sessionMatchesCount = 0;

    // Process matches
    matches.forEach(match => {
      if (!match || !match.players || !match.players.all_players) return;

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

      // Find round results
      let won = false;
      if (match.teams && match.teams[myTeam]) {
        won = match.teams[myTeam].has_won || false;
      } else {
        const redWon = match.teams?.red?.rounds_won || 0;
        const blueWon = match.teams?.blue?.rounds_won || 0;
        won = (myTeam === 'red' && redWon > blueWon) || (myTeam === 'blue' && blueWon > redWon);
      }

      // Check if match was played today
      const gameTime = match.metadata?.game_start || match.metadata?.gameStart;
      const playedToday = isToday(gameTime);

      if (playedToday) {
        if (won) sessionWins++; else sessionLosses++;
        sessionKills += kills;
        sessionDeaths += deaths;
        sessionAssists += assists;
        const roundsPlayed = match.metadata?.rounds_played || 1;
        sessionRounds += roundsPlayed;
        sessionACS += score;
        sessionMatchesCount++;
      }

      // Aggregate for averages (last 20 matches)
      if (recentGames.length < 20) {
        totalKills += kills;
        totalDeaths += deaths;
        totalAssists += assists;
        if (won) totalWins++; else totalLosses++;

        const roundsPlayed = match.metadata?.rounds_played || 1;
        totalRounds += roundsPlayed;
        totalACS += score;

        recentGames.push({
          agentName: agent,
          agentIcon: agentMap[agent.toLowerCase()] || '',
          won: won
        });
      }
    });

    // Compute averages
    const matchesCount = recentGames.length || 1;
    const finalKDR = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
    const finalWinRate = matchesCount > 0 ? ((totalWins / matchesCount) * 100).toFixed(1) : '0.0';
    const finalAvgACS = totalRounds > 0 ? Math.round(totalACS / totalRounds) : 0;
    const finalAvgKills = (totalKills / matchesCount).toFixed(1);

    // Calculate session averages
    const sessionWinrate = sessionMatchesCount > 0 ? ((sessionWins / sessionMatchesCount) * 100).toFixed(1) : '—';
    const sessionKd = sessionMatchesCount > 0 ? (sessionDeaths > 0 ? (sessionKills / sessionDeaths).toFixed(2) : sessionKills.toFixed(2)) : '—';
    const sessionAcs = sessionRounds > 0 ? Math.round(sessionACS / sessionRounds) : '—';
    const sessionAvgKills = sessionMatchesCount > 0 ? (sessionKills / sessionMatchesCount).toFixed(1) : '—';

    // Calculate Win / Loss Streak
    let winStreak = 0;
    let lossStreak = 0;
    if (recentGames.length > 0) {
      const firstWon = recentGames[0].won;
      if (firstWon) {
        winStreak = 1;
        for (let i = 1; i < recentGames.length; i++) {
          if (recentGames[i].won) winStreak++; else break;
        }
      } else {
        lossStreak = 1;
        for (let i = 1; i < recentGames.length; i++) {
          if (!recentGames[i].won) lossStreak++; else break;
        }
      }
    }

    // Unique ValTracker Performance Index (0-100 Rating)
    const kdNum = parseFloat(finalKDR) || 0.0;
    const wrNum = parseFloat(finalWinRate) || 0.0;
    let valIndex = Math.round((kdNum * 40) + (finalAvgACS * 0.15) + (wrNum * 0.25));
    valIndex = Math.max(0, Math.min(100, valIndex));

    let perfGrade = 'C';
    let gradeColor = '#94a3b8';
    if (valIndex >= 85) { perfGrade = 'S+'; gradeColor = '#fbbf24'; }
    else if (valIndex >= 75) { perfGrade = 'S'; gradeColor = '#a78bfa'; }
    else if (valIndex >= 65) { perfGrade = 'A'; gradeColor = '#60a5fa'; }
    else if (valIndex >= 50) { perfGrade = 'B'; gradeColor = '#34d399'; }

    // Session Performance Index
    let sessionValIndex = '—';
    let sessionPerfGrade = '—';
    let sessionGradeColor = 'rgba(255, 255, 255, 0.4)';
    if (sessionMatchesCount > 0) {
      const sKdNum = parseFloat(sessionKd) || 0.0;
      const sWrNum = parseFloat(sessionWinrate) || 0.0;
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
      currentTierName,
      currentTierId,
      currentRR,
      peakTierName,
      peakTierId,
      kd: finalKDR,
      winrate: finalWinRate,
      acs: finalAvgACS,
      kills: totalKills,
      avg_kills: finalAvgKills,
      assists: totalAssists,
      daily_wl: `${sessionWins}W - ${sessionLosses}L`,
      winStreak,
      lossStreak,
      valIndex,
      perfGrade,
      gradeColor,
      sessionWinrate,
      sessionKd,
      sessionAcs,
      sessionAvgKills,
      sessionAssists,
      sessionValIndex,
      sessionPerfGrade,
      sessionGradeColor,
      recentGames: recentGames.slice(0, 10) // 10 avatars
    };
  }

  // 8. Renders the Selected Layout template
  function renderOverlay(stats) {
    hideLoading();
    const container = document.getElementById('overlay-container');
    if (!container) return;

    let html = '';

    if (variant === 'competitive') {
      let avatarsHtml = '';
      if (stats.recentGames && stats.recentGames.length > 0) {
        stats.recentGames.forEach(g => {
          const outcomeClass = g.won ? 'win' : 'loss';
          const iconUrl = g.agentIcon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"%3E%3Crect width="24" height="24" fill="%23222"/%3E%3C/svg%3E';
          avatarsHtml += `
            <div class="comp-avatar-wrap">
              <img class="comp-avatar-img" src="${iconUrl}" alt="${g.agentName}">
              <div class="comp-avatar-outcome ${outcomeClass}"></div>
            </div>
          `;
        });
      } else {
        avatarsHtml = '<div class="comp-recent-title">No recent matches found</div>';
      }

      const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png`;

      // Streak badge HTML
      let streakHtml = '';
      if (stats.winStreak >= 2) {
        streakHtml = `<span class="streak-badge win" style="margin-left: 8px;">🔥 ${stats.winStreak} STREAK</span>`;
      } else if (stats.lossStreak >= 2) {
        streakHtml = `<span class="streak-badge loss" style="margin-left: 8px;">❄️ ${stats.lossStreak} STREAK</span>`;
      }

      html = `
        <div class="comp-overlay">
          <!-- Top Row: Recent Form -->
          <div class="comp-recent-games">
            <span class="comp-player-badge">${playerName}<span class="comp-player-tag">#${playerTag}</span></span>
            <div class="comp-avatars-row">${avatarsHtml}</div>
          </div>

          <!-- Middle Row: Stats & Rank -->
          <div class="comp-stats-body">
            <div class="comp-rank-icon-wrap">
              <img class="comp-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            </div>
            <div class="comp-rank-info">
              <div style="display:flex; align-items:center;">
                <div class="comp-rank-name">${stats.currentTierName}</div>
                ${streakHtml}
              </div>
              <div class="comp-rr-bar-container">
                <div class="comp-rr-bar-fill" style="width: ${Math.min(100, Math.max(0, stats.currentRR))}%"></div>
              </div>
              <div class="comp-rank-rr">${stats.currentRR} RR</div>
            </div>
            <div class="comp-stat-grid">
              <div class="comp-stat-box">
                <span class="comp-stat-val">${stats.winrate}%</span>
                <span class="comp-stat-lbl">Win %</span>
              </div>
              <div class="comp-stat-box">
                <span class="comp-stat-val">${stats.kd}</span>
                <span class="comp-stat-lbl">K/D Ratio</span>
              </div>
              <div class="comp-stat-box">
                <span class="comp-stat-val" style="color: ${stats.gradeColor}; text-shadow: 0 0 8px ${stats.gradeColor}40;">${stats.perfGrade}</span>
                <span class="comp-stat-lbl">VAL INDEX</span>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="comp-brand-footer">
            <div class="comp-brand-logo">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>
            <div class="comp-brand-text">Valorant Live stream hud</div>
          </div>
        </div>
      `;

    } else if (variant === 'center') {
      const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png`;

      // Streak badge HTML
      let streakHtml = '';
      if (stats.winStreak >= 2) {
        streakHtml = `<span class="streak-badge win" style="margin-left: 6px; font-size: 8px; padding: 1px 4px;">🔥 ${stats.winStreak}W</span>`;
      } else if (stats.lossStreak >= 2) {
        streakHtml = `<span class="streak-badge loss" style="margin-left: 6px; font-size: 8px; padding: 1px 4px;">❄️ ${stats.lossStreak}L</span>`;
      }

      html = `
        <div class="center-overlay">
          <!-- Subtle top brand watermark -->
          <div class="center-brand-tag">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>

          <!-- Left: Rank & Player info -->
          <div class="center-left-block">
            <img class="center-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            <div class="center-player-info">
              <span class="center-player-name" style="display:flex; align-items:center;">${playerName}<span class="center-player-tag">#${playerTag}</span>${streakHtml}</span>
              <span class="center-player-rank">${stats.currentTierName}</span>
            </div>
          </div>

          <div class="center-divider"></div>

          <!-- Right: Grid of Stats -->
          <div class="center-right-block">
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.sessionWinrate}${stats.sessionWinrate !== '—' ? '%' : ''}</span>
              <span class="center-stat-lbl">Win %</span>
            </div>
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.sessionKd}</span>
              <span class="center-stat-lbl">K/D Ratio</span>
            </div>
            <div class="center-stat-box">
              <span class="center-stat-val" style="color: ${stats.sessionGradeColor}; text-shadow: 0 0 8px ${stats.sessionGradeColor}40;">${stats.sessionPerfGrade}</span>
              <span class="center-stat-lbl">Val Index</span>
            </div>
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.daily_wl}</span>
              <span class="center-stat-lbl">Session</span>
            </div>
          </div>
        </div>
      `;

    } else if (variant === 'flexible') {
      const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png`;

      // Render custom list of stats dynamically
      let rowsHtml = '';
      selectedStats.forEach(s => {
        let label = statLabels[s];
        let val = stats[s];
        let icon = statIcons[s] || '📈';

        // Add support for custom index stats keys
        if (s === 'valindex' || s === 'val_index') {
          label = 'VAL Index Score';
          val = stats.valIndex;
          icon = '🧠';
        } else if (s === 'grade' || s === 'perf_grade') {
          label = 'VAL Index Grade';
          val = stats.perfGrade;
          icon = '⭐';
        } else if (s === 'streak' || s === 'winstreak') {
          if (stats.winStreak >= 2) {
            label = 'Win Streak';
            val = `🔥 ${stats.winStreak} Wins`;
            icon = '🔥';
          } else if (stats.lossStreak >= 2) {
            label = 'Loss Streak';
            val = `❄️ ${stats.lossStreak} Losses`;
            icon = '❄️';
          } else {
            label = 'Streak';
            val = 'None';
            icon = '🔥';
          }
        } else if (s === 'session_winrate') {
          label = 'Session Win %';
          val = stats.sessionWinrate !== '—' ? `${stats.sessionWinrate}%` : '—';
          icon = '📈';
        } else if (s === 'session_kd') {
          label = 'Session K/D';
          val = stats.sessionKd;
          icon = '⚔️';
        } else if (s === 'session_acs') {
          label = 'Session ACS';
          val = stats.sessionAcs;
          icon = '🔥';
        }

        if (!label || val === undefined) return;
        
        if (s === 'winrate') val = `${val}%`;
        if (s === 'rank') val = stats.currentTierName;
        if (s === 'peak') val = stats.peakTierName;

        rowsHtml += `
          <div class="flex-stat-row">
            <div class="flex-stat-lbl-block">
              <span class="flex-stat-icon">${icon}</span>
              <span class="flex-stat-lbl">${label}</span>
            </div>
            <span class="flex-stat-val" ${s==='grade'||s==='perf_grade'?`style="color:${stats.gradeColor}"`:''}>${val}</span>
          </div>
        `;
      });

      html = `
        <div class="flex-overlay">
          <!-- Header -->
          <div class="flex-overlay-header">
            <img class="flex-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            <div class="flex-header-text">
              <span class="flex-player-name">${playerName}<span class="flex-player-tag">#${playerTag}</span></span>
              <div class="flex-rr-bar-container">
                <div class="flex-rr-bar-fill" style="width: ${Math.min(100, Math.max(0, stats.currentRR))}%"></div>
              </div>
              <span class="flex-player-rank">${stats.currentRR} RR</span>
            </div>
          </div>

          <!-- Stats List -->
          <div class="flex-stats-list">${rowsHtml}</div>

          <!-- Footer -->
          <div class="flex-brand-footer">
            <div class="comp-brand-logo">Val<span>Tracker</span> <span class="live-dot" title="Live Synced"></span></div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // 9. Utility Functions
  function showLoading(msg = 'Fetching data...') {
    let loader = document.getElementById('overlay-loading-screen');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'overlay-loading-screen';
      loader.className = 'overlay-loading';
      document.body.appendChild(loader);
    }
    loader.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-text">${msg}</div>
    `;
  }

  function hideLoading() {
    const loader = document.getElementById('overlay-loading-screen');
    if (loader) {
      loader.remove();
    }
  }

  function showError(msg) {
    hideLoading();
    const container = document.getElementById('overlay-container');
    if (container) {
      container.innerHTML = `
        <div class="error-text">⚠️ Error: ${msg}</div>
      `;
    }
  }

  // 10. Initialization loop
  showLoading('Initializing...');
  await loadAgentMap();
  
  const player = await resolvePlayerAndRegion();
  if (!player) return; // Resolving failed, error already shown.

  async function updateLoop() {
    try {
      console.log(`[STREAM OVERLAY] Fetching player stats for ${player.name}#${player.tag}...`);
      const data = await fetchPlayerData(player);
      const stats = aggregateStats(data, player.name, player.tag);
      renderOverlay(stats);
    } catch (e) {
      console.error("[STREAM OVERLAY LOOP ERROR] Failed to fetch/render stats", e);
      showError("Failed to fetch live stats. Will retry in 2 mins.");
    }
  }

  // Initial trigger
  await updateLoop();

  // Setup interval: Polling every 2 minutes
  setInterval(updateLoop, 120000);

})();
