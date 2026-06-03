import re

file_path = 'public/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'window.openShareMatchModal = async function(idx, event) {'
start_idx = content.find(start_marker)

# Let's find the closing brace of closeShareModal
end_marker = 'window._currentMatchShare = null;\n};'
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Failed to find boundaries in the file!")
else:
    end_idx += len(end_marker)
    print(f"Found engine block: start_idx={start_idx}, end_idx={end_idx}")

    upgraded_js = """window.openShareMatchModal = async function(idx, event) {
  if (event) event.stopPropagation();

  const matches = window._allRenderedMatches || [];
  const m = matches[idx];
  if (!m) { showToast('Match details not found'); return; }

  if (typeof html2canvas === 'undefined') {
    showToast('Image generator library not loaded.');
    return;
  }

  // Open the modal in loading state
  const overlay = document.getElementById('share-modal-overlay');
  const loading = document.getElementById('share-modal-loading');
  const loaded = document.getElementById('share-modal-loaded');
  const loadingTxt = document.getElementById('share-modal-loading-txt');
  
  overlay.classList.add('open');
  loading.style.display = 'flex';
  loaded.style.display = 'none';
  if (loadingTxt) loadingTxt.textContent = 'GENERATING & UPLOADING REPORT...';

  // Extract statistics
  const acs = Math.round(m.score / 100);
  const hsPct = m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
  const grade = getGrade(m.kills, m.deaths, m.assists, acs, m.won);
  const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);
  const allPlayers = getPlayerList(m.rawMatch);
  
  // Calculate MVP
  const getACS = p => Math.round((p.stats?.score || 0) / 100);
  const matchMVPPlayer = allPlayers.length ? allPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, allPlayers[0]) : null;
  const alliedPlayers = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
  const teamMVPPlayer = alliedPlayers.length ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0]) : null;
  
  const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  
  // Lobby average rank
  const rankInfo = getLobbyRankInfo(allPlayers, m.myTeamId);
  const rankName = rankInfo?.overall?.name || 'Unknown';
  const rankImg = getRankImgUrl(rankName) || '';

  // Asset URLs
  const normalizedAgentName = m.agentName.charAt(0).toUpperCase() + m.agentName.slice(1).toLowerCase();
  const agentPortrait = getAgentPortraitUrl(normalizedAgentName) || '';
  const agentIcon = getAgentIconUrl(m.agentName) || '';
  const mapImg = getMapImg(m.map) || '';

  // Retrieve player banner and level
  const bannerImgEl = document.getElementById('player-banner-img');
  const playerBannerUrl = bannerImgEl ? (bannerImgEl.getAttribute('src') || bannerImgEl.src) : '';
  const playerLevelStr = document.getElementById('player-level')?.textContent?.replace('LVL', '')?.trim() || '—';

  // Get user rank
  const meC = allPlayers.find(p => p.name?.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag?.toLowerCase() === PLAYER_TAG.toLowerCase());
  const userRank = meC?.currenttier_patched || meC?.tier || 'Unranked';
  const userRankImg = getRankImgUrl(userRank) || '';

  // --- RICH MULTI-KILL & CLUTCH TELEMETRY EXTRACTION ---
  const rounds = m.rawMatch.rounds || [];
  let doubleKills = 0;
  let tripleKills = 0;
  let quadKills = 0;
  let aces = 0;
  let clutchesCount = 0;
  
  const myPuuid = meC?.puuid || meC?.subject || meC?.id || '';
  const myPuuids = [meC?.puuid, meC?.subject, meC?.id, myPuuid].filter(Boolean);
  const teammatePuuids = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId && !myPuuids.includes(p.puuid)).map(p => p.puuid);
  
  rounds.forEach((r) => {
    const myWon = (r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase() === m.myTeamId;
    const playerStats = r.player_stats || [];
    const myPs = myPuuid ? playerStats.find(p => (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuid) : null;
    const killEvents = myPs?.kill_events || [];
    const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);
    
    if (myKills === 2) doubleKills++;
    else if (myKills === 3) tripleKills++;
    else if (myKills === 4) quadKills++;
    else if (myKills >= 5) aces++;
    
    // Clutch Check
    let tmDeaths = 0;
    let meDied = false;
    playerStats.forEach(ps => {
      (ps.kill_events || []).forEach(k => {
        const victim = k.victim_puuid || k.victim;
        if (victim && myPuuids.includes(victim)) meDied = true;
        if (victim && teammatePuuids.includes(victim)) tmDeaths++;
      });
    });
    
    if (myWon && tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) {
      clutchesCount++;
    }
  });

  // Calculate combat performance rating (out of 10.0)
  const combatRating = Math.min(10.0, (parseFloat(kd) * 2.8 + acs / 75 + hsPct / 12).toFixed(1));
  const ratingColor = combatRating >= 8.2 ? '#e8ff47' : combatRating >= 6.2 ? '#3ecf8e' : '#ff4655';
  const ratingGlow = combatColor => combatColor === '#e8ff47' ? 'rgba(232, 255, 71, 0.25)' : combatColor === '#3ecf8e' ? 'rgba(62, 207, 142, 0.2)' : 'rgba(255, 70, 85, 0.2)';

  // --- DYNAMIC COOL PERFORMANCE TITLES ---
  let coolTitle = '';
  let titleColor = '#ff4655';
  let titleBg = 'linear-gradient(90deg, rgba(255, 70, 85, 0.25) 0%, rgba(255, 70, 85, 0.02) 100%)';
  let titleBorder = 'rgba(255, 70, 85, 0.5)';
  
  if (aces > 0) {
    coolTitle = '👑 LOBBY ANNIHILATOR';
    titleColor = '#ffd700';
    titleBg = 'linear-gradient(90deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.02) 100%)';
    titleBorder = 'rgba(255, 215, 0, 0.5)';
  } else if (clutchesCount >= 2) {
    coolTitle = '⚡ CLUTCH MASTER';
    titleColor = '#ffd700';
    titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.25) 0%, rgba(232, 255, 71, 0.02) 100%)';
    titleBorder = 'rgba(232, 255, 71, 0.5)';
  } else if (kd >= 2.0) {
    coolTitle = '🔥 UNSTOPPABLE BEAST';
    titleColor = '#ff4655';
    titleBg = 'linear-gradient(90deg, rgba(255, 70, 85, 0.28) 0%, rgba(255, 70, 85, 0.02) 100%)';
    titleBorder = 'rgba(255, 70, 85, 0.6)';
  } else if (kd >= 1.5 && isMatchMVP) {
    coolTitle = '🧬 APEX PREDATOR';
    titleColor = '#ff4655';
    titleBg = 'linear-gradient(90deg, rgba(255, 70, 85, 0.28) 0%, rgba(255, 70, 85, 0.02) 100%)';
    titleBorder = 'rgba(255, 70, 85, 0.6)';
  } else if (kd >= 1.2 && m.won) {
    coolTitle = '💥 CARRY MACHINE';
    titleColor = '#e8ff47';
    titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.22) 0%, rgba(232, 255, 71, 0.02) 100%)';
    titleBorder = 'rgba(232, 255, 71, 0.5)';
  } else if (isMatchMVP) {
    coolTitle = '👑 MATCH MVP';
    titleColor = '#e8ff47';
    titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.2) 0%, rgba(232, 255, 71, 0.02) 100%)';
    titleBorder = 'rgba(232, 255, 71, 0.4)';
  } else if (isTeamMVP) {
    coolTitle = '⭐ TEAM MVP';
    titleColor = '#ffb01f';
    titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.2) 0%, rgba(255, 176, 31, 0.02) 100%)';
    titleBorder = 'rgba(255, 176, 31, 0.4)';
  } else if (m.won && m.assists >= 8) {
    coolTitle = '🛡️ TACTICAL ANCHOR';
    titleColor = '#38bdf8';
    titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.02) 100%)';
    titleBorder = 'rgba(56, 189, 248, 0.4)';
  } else if (m.won) {
    coolTitle = '🏆 VICTORIOUS STRATEGIST';
    titleColor = '#3ecf8e';
    titleBg = 'linear-gradient(90deg, rgba(62, 207, 142, 0.2) 0%, rgba(62, 207, 142, 0.02) 100%)';
    titleBorder = 'rgba(62, 207, 142, 0.4)';
  } else if (kd >= 1.2) {
    coolTitle = '💪 VALIANT EFFORT';
    titleColor = '#ffb01f';
    titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.15) 0%, rgba(255, 176, 31, 0.02) 100%)';
    titleBorder = 'rgba(255, 176, 31, 0.3)';
  } else {
    coolTitle = '📈 READY FOR NEXT';
    titleColor = '#a1a1aa';
    titleBg = 'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)';
    titleBorder = 'rgba(255, 255, 255, 0.15)';
  }

  // --- DYNAMIC IMPACT FEATS BADGES WITH PREMIUM GLOW EFFECTS ---
  let featsHtml = '';
  if (aces > 0 || clutchesCount > 0 || quadKills > 0 || tripleKills > 0 || doubleKills > 0) {
    featsHtml += `
      <div style="margin-top: 6px; z-index:3; position:relative;">
        <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; font-weight:700;">IMPACT FEATS</div>
        <div style="display:flex; flex-wrap:wrap; gap:5px;">
          ${aces > 0 ? `<span style="background:linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(218,165,32,0.05) 100%); border:1px solid #ffd700; color:#ffd700; padding:2px 6px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(255,215,0,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(255,215,0,0.4);">👑 ${aces} ACE${aces > 1 ? 'S' : ''}</span>` : ''}
          ${clutchesCount > 0 ? `<span style="background:linear-gradient(135deg, rgba(232,255,71,0.15) 0%, rgba(50,205,50,0.05) 100%); border:1px solid #e8ff47; color:#e8ff47; padding:2px 6px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(232,255,71,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(232,255,71,0.4);">⚡ ${clutchesCount} CLUTCH${clutchesCount > 1 ? 'ES' : ''}</span>` : ''}
          ${quadKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(255,70,85,0.15) 0%, rgba(249,115,22,0.05) 100%); border:1px solid #ff4655; color:#ff4655; padding:2px 6px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(255,70,85,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(255,70,85,0.4);">🔥 ${quadKills} 4K${quadKills > 1 ? 'S' : ''}</span>` : ''}
          ${tripleKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.05) 100%); border:1px solid #a855f7; color:#a855f7; padding:2px 6px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; display:inline-flex; align-items:center; gap:2px;">💀 ${tripleKills} 3K</span>` : ''}
          ${doubleKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.05) 100%); border:1px solid #3b82f6; color:#3b82f6; padding:2px 6px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; display:inline-flex; align-items:center; gap:2px;">💥 ${doubleKills} 2K</span>` : ''}
        </div>
      </div>
    `;
  }

  // --- DYNAMIC ROUND TIMELINE DOTS ---
  const roundDotsHtml = rounds.map((r, i) => {
    const myTeamWon = (r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase() === m.myTeamId;
    const bg = myTeamWon ? 'rgba(62,207,142,0.85)' : 'rgba(255,87,87,0.7)';
    const shadow = myTeamWon ? 'rgba(62,207,142,0.3)' : 'rgba(255,87,87,0.2)';
    
    // Check if I clutched this round
    const rPlayerStats = r.player_stats || [];
    let rMeDied = false;
    let rTmDeaths = 0;
    rPlayerStats.forEach(ps => {
      (ps.kill_events || []).forEach(k => {
        const victim = k.victim_puuid || k.victim;
        if (victim && myPuuids.includes(victim)) rMeDied = true;
        if (victim && teammatePuuids.includes(victim)) rTmDeaths++;
      });
    });
    const isClutch = myTeamWon && rTmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !rMeDied;
    const border = isClutch ? '1.5px solid #ffd700' : 'none';
    const boxS = isClutch ? '0 0 6px #ffd700' : `0 1px 2px ${shadow}`;

    return `<div style="width:13px; height:13px; border-radius:50%; background:${bg}; border:${border}; box-shadow:${boxS}; display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:7px; font-weight:bold; color:#fff; flex-shrink:0;">${i+1}</div>`;
  }).join('');

  // Extract scoreboard players to build the fully visible, beautiful dashboard table
  const alliedWatermarked = allPlayers.filter(p=>(p.team||'').toLowerCase()===m.myTeamId).sort((a,b)=>getACS(b)-getACS(a));
  const enemyWatermarked = allPlayers.filter(p=>(p.team||'').toLowerCase()!==m.myTeamId).sort((a,b)=>getACS(b)-getACS(a));

  const alliedRowsHtml = alliedWatermarked.map((p) => {
    const isMe = p.name?.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag?.toLowerCase() === PLAYER_TAG.toLowerCase();
    const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
    const pACS = Math.round((p.stats?.score || 0) / 100);
    const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
    const rowBg = isMe ? 'rgba(62, 207, 142, 0.12)' : 'rgba(255, 255, 255, 0.01)';
    const rowBorder = isMe ? '1px solid rgba(62, 207, 142, 0.45)' : '1px solid rgba(255, 255, 255, 0.02)';
    const nameColor = isMe ? '#3ecf8e' : '#fff';
    const nameWeight = isMe ? 'bold' : 'normal';

    return `
      <tr style="background:${rowBg}; border:${rowBorder}; font-size:9.5px; border-radius:4px; font-family:'DM Mono',monospace; height:24px;">
        <td style="padding:2px 8px; border-radius:4px 0 0 4px; border-left:${isMe ? '2px solid #3ecf8e' : 'none'};">
          <div style="display:flex; align-items:center; gap:5px;">
            ${charIcon ? `<img src="${charIcon}" style="width:14px; height:14px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);">` : ''}
            <span style="color:${nameColor}; font-weight:${nameWeight}; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:100px;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px; color:rgba(255,255,255,0.7); text-align:center;">${pKDA}</td>
        <td style="padding:2px 8px; color:#fff; font-weight:bold; text-align:right; border-radius:0 4px 4px 0;">${pACS}</td>
      </tr>
    `;
  }).join('');

  const enemyRowsHtml = enemyWatermarked.map((p) => {
    const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
    const pACS = Math.round((p.stats?.score || 0) / 100);
    const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
    const rowBg = 'rgba(255, 255, 255, 0.005)';
    const rowBorder = '1px solid rgba(255, 255, 255, 0.015)';

    return `
      <tr style="background:${rowBg}; border:${rowBorder}; font-size:9.5px; border-radius:4px; font-family:'DM Mono',monospace; height:24px;">
        <td style="padding:2px 8px; border-radius:4px 0 0 4px;">
          <div style="display:flex; align-items:center; gap:5px;">
            ${charIcon ? `<img src="${charIcon}" style="width:14px; height:14px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);">` : ''}
            <span style="color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:100px;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px; color:rgba(255,255,255,0.7); text-align:center;">${pKDA}</td>
        <td style="padding:2px 8px; color:#fff; font-weight:bold; text-align:right; border-radius:0 4px 4px 0;">${pACS}</td>
      </tr>
    `;
  }).join('');

  // Dynamic color coding
  const accentColor = m.won ? '#3ecf8e' : '#ff4655';
  const accentShadow = m.won ? 'rgba(62,207,142,0.35)' : 'rgba(255,70,85,0.35)';
  const outcomeText = m.won ? 'VICTORY' : 'DEFEAT';

  // Battlefield map capsule HTML
  const mapCapsuleHtml = `
    <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:6px 12px; display:flex; align-items:center; gap:8px;">
      ${mapImg ? `<div style="background-image: url('${mapImg}'); background-size: cover; background-position: center; width: 28px; height: 28px; border-radius: 4px; border:1px solid rgba(255,255,255,0.15);"></div>` : ''}
      <div>
        <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Battlefield</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:800; color:#fff; text-transform:uppercase; line-height:1; letter-spacing:0.5px; margin-top:2px;">
          ${m.map || 'Unknown'}
        </div>
      </div>
    </div>
  `;

  // Ranks block (Your Rank vs Lobby Average Rank)
  const ranksBlockHtml = `
    <div style="display:flex; gap:10px; width:100%; z-index:3; position:relative;">
      <!-- Your Rank -->
      <div style="flex:1; background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:8px;">
        ${userRankImg ? `<img src="${userRankImg}" style="width:24px; height:24px; object-fit:contain;">` : ''}
        <div>
          <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Your Rank</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:800; color:#fff; text-transform:uppercase; margin-top:2px; line-height:1;">${userRank}</div>
        </div>
      </div>
      <!-- Lobby Rank -->
      <div style="flex:1; background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:8px;">
        ${rankImg ? `<img src="${rankImg}" style="width:24px; height:24px; object-fit:contain;">` : ''}
        <div>
          <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Lobby Avg</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:800; color:#fff; text-transform:uppercase; margin-top:2px; line-height:1;">${rankName}</div>
        </div>
      </div>
    </div>
  `;

  // Performance Rating block
  const performanceRatingHtml = `
    <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; width:100%; box-sizing:border-box;">
      <div>
        <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Esports Combat Rating</div>
        <div style="display:flex; align-items:baseline; gap:3px;">
          <span style="font-family:'Barlow Condensed',sans-serif; font-size:32px; font-weight:900; color:${ratingColor}; text-shadow:0 0 12px ${ratingGlow(ratingColor)}; line-height:1;">${combatRating}</span>
          <span style="font-family:'DM Mono',monospace; font-size:11px; color:rgba(255,255,255,0.25);">/ 10</span>
        </div>
      </div>
      ${isMatchMVP ? `
        <div style="background:linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(218,165,32,0.05) 100%); border:1px solid #ffd700; color:#ffd700; border-radius:6px; padding:4px 8px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(255,215,0,0.25); text-shadow:0 0 2px rgba(255,215,0,0.4);">
          👑 MATCH MVP
        </div>
      ` : isTeamMVP ? `
        <div style="background:linear-gradient(135deg, rgba(232,255,71,0.15) 0%, rgba(50,205,50,0.05) 100%); border:1px solid #e8ff47; color:#e8ff47; border-radius:6px; padding:4px 8px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(232,255,71,0.25); text-shadow:0 0 2px rgba(232,255,71,0.4);">
          ⭐ TEAM MVP
        </div>
      ` : ''}
    </div>
  `;

  captureContainer.innerHTML = `
    <div id="match-capture-target" style="width: 900px; height: 520px; background: #060608; border: 2px solid rgba(255, 70, 85, 0.45); border-radius: 20px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box; position:relative; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.8); display:flex; flex-direction:column; justify-content:space-between; padding:24px;">
      
      <!-- Premium Blurred Map Background Splash -->
      ${mapImg ? `<img src="${mapImg}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.08; filter: blur(2.5px); pointer-events:none; z-index:0;">` : ''}
      
      <!-- Linear Gradient Dark Overlay -->
      <div style="position:absolute; inset:0; background: linear-gradient(135deg, rgba(12, 12, 16, 0.96) 0%, rgba(6, 6, 8, 0.98) 100%); z-index:1; pointer-events:none;"></div>
      
      <!-- Left decorative border indicating outcome -->
      <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:${accentColor}; box-shadow: 2px 0 16px ${accentShadow}; border-radius:20px 0 0 20px; z-index:4;"></div>

      <!-- Top Header Row -->
      <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <!-- ValTracker Logo -->
          <svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:none; filter: drop-shadow(0 0 8px rgba(255, 70, 85, 0.6));">
            <path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655" />
            <polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47" />
          </svg>
          <span style="font-family:'Barlow Condensed', sans-serif; font-size:20px; font-weight:900; letter-spacing:1.5px; color:#fff; text-transform:uppercase; margin-right:12px;">ValTracker<span style="color:#ff4655">.gg</span></span>
          
          <!-- Player Horizontal Banner & Name Capsule -->
          <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:3px 10px 3px 3px; border-radius:6px; backdrop-filter:blur(4px);">
            ${playerBannerUrl ? `<div style="background-image: url('${playerBannerUrl}'); background-size: cover; background-position: center; width: 75px; height: 26px; border-radius: 4px; border:1px solid rgba(255,255,255,0.1);"></div>` : ''}
            <div style="display:flex; flex-direction:column; justify-content:center;">
              <span style="font-family:'Barlow Condensed', sans-serif; font-size:14px; font-weight:900; color:#fff; letter-spacing:0.5px; text-transform:uppercase; line-height:1.1;">${PLAYER_NAME}#${PLAYER_TAG}</span>
              <span style="font-family:'DM Mono', monospace; font-size:8px; color:rgba(255,255,255,0.4); line-height:1.1;">LVL ${playerLevelStr}</span>
            </div>
          </div>
        </div>
        
        <!-- Outcomes Block in Header -->
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:20px; font-weight:900; color:${accentColor}; text-shadow:0 0 12px ${accentShadow}; letter-spacing:1.5px; text-transform:uppercase; border:1px solid ${accentColor}40; padding:2px 10px; border-radius:6px; background:${accentColor}10;">
            ${outcomeText} ${m.rounds}
          </div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:11px; font-weight:800; color:#ffb01f; letter-spacing:2px; text-transform:uppercase; border:1px solid rgba(255,176,31,0.25); padding:3px 8px; border-radius:4px; background:rgba(255,176,31,0.03);">
            Match Report Card
          </div>
        </div>
      </div>

      <!-- Center Body Row (Player performance left column, visible scoreboard right column) -->
      <div style="position:relative; z-index:3; flex-grow:1; display:flex; gap:24px; align-items:stretch; padding-bottom:10px;">
        
        <!-- Left Performance Column -->
        <div style="width:390px; display:flex; flex-direction:column; gap:10px; justify-content:space-between;">
          <!-- Profile + Title Card -->
          <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:10px 12px;">
            <!-- Sized-down framed agent avatar slot -->
            <div style="width:40px; height:40px; border-radius:8px; background:#101014; border:2px solid ${accentColor}; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${agentIcon ? `<img src="${agentIcon}" style="width:100%; height:100%; object-fit:cover;">` : ''}
            </div>
            <div>
              <div style="display:inline-flex; align-items:center; background:${titleBg}; border:1px solid ${titleBorder}; padding:2px 8px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:10.5px; font-weight:900; color:${titleColor}; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 6px ${titleBorder === 'rgba(255,255,255,0.15)' ? 'transparent' : titleColor}50;">
                ${coolTitle}
              </div>
              <div style="font-family:'DM Mono', monospace; font-size:9.5px; color:rgba(255,255,255,0.4); margin-top:2px;">
                Agent: ${(m.agentName || '—').toUpperCase()} · Match Date: ${formatMatchDate(m.gameStart)}
              </div>
            </div>
          </div>

          <!-- Esports Combat Rating block -->
          ${performanceRatingHtml}

          <!-- Ranks Row (Your Rank vs Lobby Rank) -->
          ${ranksBlockHtml}

          <!-- Core stats grid -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; width:100%;">
            <!-- KDA -->
            <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">K / D / A</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${m.kills}/${m.deaths}/${m.assists}
              </div>
            </div>

            <!-- K/D Ratio -->
            <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">K/D Ratio</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:${kd >= 1 ? '#3ecf8e' : '#ff4655'}; line-height:1; letter-spacing:0.5px;">
                ${kd}
              </div>
            </div>

            <!-- Battlefield pill -->
            ${mapCapsuleHtml}

            <!-- ACS -->
            <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">ACS</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${acs}
              </div>
            </div>

            <!-- HS Rate -->
            <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">HS %</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:${hsPct >= 22 ? '#3ecf8e' : hsPct >= 14 ? '#ffd700' : '#ff4655'}; line-height:1; letter-spacing:0.5px;">
                ${hsPct}%
              </div>
            </div>

            <!-- Round count -->
            <div style="background:rgba(10, 10, 14, 0.82); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px;">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">Rounds</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${rounds.length}
              </div>
            </div>
          </div>
          
          <!-- Round timeline -->
          <div>
            <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Round win/loss timeline</div>
            <div style="display:flex; gap:3px; flex-wrap:wrap; max-width:390px;">
              ${roundDotsHtml}
            </div>
          </div>

          <!-- Glowing colorful neon Feats Badges -->
          ${featsHtml}
        </div>

        <!-- Right Visible Scorecard Column -->
        <div style="width:440px; background:rgba(10, 10, 14, 0.65); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px; backdrop-filter:blur(10px); display:flex; flex-direction:column; gap:6px; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px; margin-bottom:4px;">
            <span style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:900; letter-spacing:1px; color:rgba(255,255,255,0.5);">MATCH SCOREBOARD</span>
            <span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3);">ALLIED VS ENEMY ROSTER</span>
          </div>

          <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
            <thead>
              <tr style="font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:900; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; height:18px;">
                <th style="text-align:left; padding:0 8px;">Player / Character</th>
                <th style="text-align:center; padding:0 8px;">K/D/A</th>
                <th style="text-align:right; padding:0 8px;">ACS</th>
              </tr>
            </thead>
            <tbody>
              <!-- Allied team header row -->
              <tr style="height:14px; font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:900; letter-spacing:0.5px; color:#3ecf8e;">
                <td colspan="3" style="padding:4px 8px 2px 8px; border-bottom:1px solid rgba(62, 207, 142, 0.15);">▲ YOUR TEAM</td>
              </tr>
              ${alliedRowsHtml}
              <!-- Enemy team header row -->
              <tr style="height:14px; font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:900; letter-spacing:0.5px; color:#ff4655;">
                <td colspan="3" style="padding:8px 8px 2px 8px; border-bottom:1px solid rgba(255, 70, 85, 0.15);">▼ ENEMY TEAM</td>
              </tr>
              ${enemyRowsHtml}
            </tbody>
          </table>
        </div>

      </div>

      <!-- Bottom Footer -->
      <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px; font-family:'DM Mono', monospace; font-size:8.5px; color:rgba(255,255,255,0.32); letter-spacing:0.5px;">
        <div>Telemetry Diagnosed by VALTRACKER.GG</div>
        <div style="color:#ff4655; font-weight:700; letter-spacing:1px; text-transform:uppercase;">TRACK. ANALYZE. CONQUER.</div>
      </div>
    </div>
  `;

  // Store variables globally for click sharing handlers
  window._currentMatchShare = {
    idx,
    playerName: PLAYER_NAME,
    playerTag: PLAYER_TAG,
    agentName: m.agentName,
    mapName: m.map,
    won: m.won,
    rounds: m.rounds,
    scoreText: m.rounds,
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    acs,
    hsPct,
    kd,
    shareUrl: '', // Will be filled dynamically after API upload
    shareId: ''
  };

  // Wait a small frame for images to complete loading, then run html2canvas capture!
  setTimeout(generateFlexCard, 220);
};

async function generateFlexCard() {
  try {
    const el = document.getElementById('match-capture-target');
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 2.5, // 2.5x scale for stunning sharpness and premium details
      logging: false,
      useCORS: true
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // Update preview in the modal
    document.getElementById('share-modal-img-preview').src = dataUrl;
    window._currentMatchShare.dataUrl = dataUrl;
    
    // Automatically copy to clipboard (as fallback / convenience)
    canvas.toBlob(async (blob) => {
      window._currentMatchShare.blob = blob;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          
          const clipboardStatusEl = document.getElementById('share-modal-clipboard-status');
          if (clipboardStatusEl) {
            clipboardStatusEl.style.display = 'flex';
          }
        }
      } catch (err) {
        console.warn('Clipboard fallback warning:', err);
        const clipboardStatusEl = document.getElementById('share-modal-clipboard-status');
        if (clipboardStatusEl) {
          clipboardStatusEl.style.display = 'none';
        }
      }
    }, 'image/png');

    // AUTOMATICALLY UPLOAD IMAGE TO SERVER IMMEDIATELY FOR AUTOPRELOAD SUPPORT
    const share = window._currentMatchShare;
    try {
      const response = await fetch('/api/share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          playerName: share.playerName,
          playerTag: share.playerTag,
          agentName: share.agentName,
          mapName: share.mapName,
          won: share.won,
          score: share.scoreText
        })
      });
      
      const resData = await response.json();
      if (resData.status === 'ok') {
        share.shareUrl = resData.share_url;
        share.shareId = resData.share_id;
        
        // Append link to pre-filled templates
        const origText = document.getElementById('share-modal-template-text').value;
        document.getElementById('share-modal-template-text').value = origText + ' ' + resData.share_url;
        
        showToast('Flex card registered! 🚀');
      } else {
        console.error('Share upload failed:', resData.message);
      }
    } catch (uploadErr) {
      console.error('Network error during share upload:', uploadErr);
    }

    // Hide loader & show loaded contents
    document.getElementById('share-modal-loading').style.display = 'none';
    document.getElementById('share-modal-loaded').style.display = 'flex';

  } catch(e) {
    console.error('[Capture Error]', e);
    showToast('Failed to compile infographic.');
    closeShareModal();
  }
}

window.shareToPlatform = function(platform) {
  const share = window._currentMatchShare;
  if (!share) return;
  
  const textVal = document.getElementById('share-modal-template-text').value;
  const encodedText = encodeURIComponent(textVal);
  const shareUrl = share.shareUrl || '';

  if (platform === 'download') {
    const a = document.createElement('a');
    a.href = share.dataUrl;
    a.download = `valtracker_flex_${share.agentName}_${share.mapName}_${new Date().getTime()}.png`;
    a.click();
    showToast('Match Flex Card downloaded! ✓');
  } 
  else if (platform === 'twitter') {
    // If we have a shareUrl, we append it directly as the url parameter. Twitter will load the preview card!
    const url = `https://twitter.com/intent/tweet?text=${encodedText}${shareUrl ? `&url=${encodeURIComponent(shareUrl)}` : ''}`;
    window.open(url, '_blank');
    showToast('Opening X (Twitter)!');
  } 
  else if (platform === 'reddit') {
    const title = encodeURIComponent(`[ValTracker Flex] Secured a huge ${share.rounds} victory on ${share.mapName.toUpperCase()} as ${share.agentName.toUpperCase()}!`);
    // If we have a shareUrl, we share it as a direct link post on Reddit. Reddit will show the preview card perfectly!
    const url = shareUrl 
      ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(shareUrl)}&title=${title}`
      : `https://www.reddit.com/r/VALORANT/submit?title=${title}&text=${encodedText}`;
    window.open(url, '_blank');
    showToast('Opening Reddit!');
  }
};

window.closeShareModal = function() {
  document.getElementById('share-modal-overlay').classList.remove('open');
  window._currentMatchShare = null;
};"""

    new_content = content[:start_idx] + upgraded_js + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success! Javascript sharing engine has been successfully replaced!")
