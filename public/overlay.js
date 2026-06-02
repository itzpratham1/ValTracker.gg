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
    daily_wl: 'Session W/L'
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
    daily_wl: '📊'
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

    // Process up to 20 matches (standard history size)
    const matchesToAnalyze = matches.slice(0, 20);
    matchesToAnalyze.forEach(match => {
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
        // Fallback round count comparison
        const redWon = match.teams?.red?.rounds_won || 0;
        const blueWon = match.teams?.blue?.rounds_won || 0;
        won = (myTeam === 'red' && redWon > blueWon) || (myTeam === 'blue' && blueWon > redWon);
      }

      totalKills += kills;
      totalDeaths += deaths;
      totalAssists += assists;
      if (won) totalWins++; else totalLosses++;

      // ACS computation
      const roundsPlayed = match.metadata?.rounds_played || 1;
      totalRounds += roundsPlayed;
      totalACS += score;

      // Add to recent list
      recentGames.push({
        agentName: agent,
        agentIcon: agentMap[agent.toLowerCase()] || '',
        won: won
      });
    });

    // Compute averages
    const matchesCount = matchesToAnalyze.length || 1;
    const finalKDR = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
    const finalWinRate = matchesCount > 0 ? ((totalWins / matchesCount) * 100).toFixed(1) : '0.0';
    const finalAvgACS = totalRounds > 0 ? Math.round(totalACS / totalRounds) : 0;
    const finalAvgKills = (totalKills / matchesCount).toFixed(1);

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
      daily_wl: `${totalWins}W - ${totalLosses}L`,
      recentGames: recentGames.slice(0, 10) // standard 10 avatars
    };
  }

  // 8. Renders the Selected Layout template
  function renderOverlay(stats) {
    const container = document.getElementById('overlay-container');
    if (!container) return;

    let html = '';

    if (variant === 'competitive') {
      // Render Jett/Reyna avatars row with win/loss underline
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

      // Rank Icon
      const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png`;

      html = `
        <div class="comp-overlay">
          <!-- Top Row: Recent Form -->
          <div class="comp-recent-games">
            <span class="comp-recent-title">Recent Form</span>
            <div class="comp-avatars-row">${avatarsHtml}</div>
          </div>

          <!-- Middle Row: Stats & Rank -->
          <div class="comp-stats-body">
            <div class="comp-rank-icon-wrap">
              <img class="comp-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            </div>
            <div class="comp-rank-info">
              <div class="comp-rank-name">${stats.currentTierName}</div>
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
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="comp-brand-footer">
            <div class="comp-brand-logo">Val<span>Tracker</span>.gg</div>
            <div class="comp-brand-text">Valorant Live stream hud</div>
          </div>
        </div>
      `;

    } else if (variant === 'center') {
      const rankIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${stats.currentTierId}/smallicon.png`;

      html = `
        <div class="center-overlay">
          <!-- Left: Rank & Player info -->
          <div class="center-left-block">
            <img class="center-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            <div class="center-player-info">
              <span class="center-player-name">${playerName}</span>
              <span class="center-player-rank">${stats.currentTierName}</span>
            </div>
          </div>

          <div class="center-divider"></div>

          <!-- Right: Grid of Stats -->
          <div class="center-right-block">
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.winrate}%</span>
              <span class="center-stat-lbl">Win %</span>
            </div>
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.kd}</span>
              <span class="center-stat-lbl">K/D Ratio</span>
            </div>
            <div class="center-stat-box">
              <span class="center-stat-val">${stats.acs}</span>
              <span class="center-stat-lbl">Avg ACS</span>
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
        if (!statLabels[s] || stats[s] === undefined) return;
        const icon = statIcons[s] || '📈';
        const label = statLabels[s];
        let val = stats[s];
        if (s === 'winrate') val = `${val}%`;
        if (s === 'rank') val = stats.currentTierName;
        if (s === 'peak') val = stats.peakTierName;

        rowsHtml += `
          <div class="flex-stat-row">
            <div class="flex-stat-lbl-block">
              <span class="flex-stat-icon">${icon}</span>
              <span class="flex-stat-lbl">${label}</span>
            </div>
            <span class="flex-stat-val">${val}</span>
          </div>
        `;
      });

      html = `
        <div class="flex-overlay">
          <!-- Header -->
          <div class="flex-overlay-header">
            <img class="flex-rank-icon" src="${rankIcon}" alt="${stats.currentTierName}">
            <div class="flex-header-text">
              <span class="flex-player-name">${playerName}</span>
              <span class="flex-player-rank">${stats.currentRR} RR</span>
            </div>
          </div>

          <!-- Stats List -->
          <div class="flex-stats-list">${rowsHtml}</div>

          <!-- Footer -->
          <div class="flex-brand-footer">
            <div class="comp-brand-logo">Val<span>Tracker</span>.gg</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // 9. Utility Functions
  function showLoading(msg = 'Fetching data...') {
    const container = document.getElementById('overlay-container');
    if (container) {
      container.innerHTML = `
        <div class="overlay-loading">
          <div class="spinner"></div>
          <div class="loading-text">${msg}</div>
        </div>
      `;
    }
  }

  function showError(msg) {
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
