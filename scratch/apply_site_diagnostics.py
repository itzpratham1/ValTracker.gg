import os

file_path = "public/index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Target block for the round stats loop
target_round_loop = """  // Round-by-round analysis
  const myPuuid = me.puuid || me.subject || me.id || '';
  const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
  let clutchWins = 0, clutchAttempts = 0;
  let killsInWonRounds = 0, killsInLostRounds = 0;
  let firstHalfKills = 0, secondHalfKills = 0;
  let multiKillRounds = 0;
  let bestRoundNum = 1, maxRoundKills = 0, bestRoundWon = false;

  rounds.forEach((r, ri) => {
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
    );
    const killEvents = ps?.kill_events || [];
    const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);

    const myAlive = r[myTeamId]?.players_alive ?? null;
    const rWon = (r.winning_team || '').toLowerCase() === myTeamId;
    if (rKills > 0) {
      if (rWon) killsInWonRounds += rKills; else killsInLostRounds += rKills;
      if (ri < Math.floor(totalRounds / 2)) firstHalfKills += rKills;
      else secondHalfKills += rKills;
      if (rKills >= 3) multiKillRounds++;
    }
    if (myAlive === 1) {
      clutchAttempts++;
      if (rWon) clutchWins++;
    }

    if (rKills > maxRoundKills || (rKills === maxRoundKills && rWon && !bestRoundWon)) {
      maxRoundKills = rKills;
      bestRoundNum = ri + 1;
      bestRoundWon = rWon;
    }
  });

  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = ri < 12 ? 'Attack' : 'Defense';
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
    );
    const killEvents = ps?.kill_events || [];
    const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);
    
    const dotBorder = rWon ? 'var(--win)' : 'var(--loss)';
    const dotColor = rWon ? 'rgba(62, 207, 142, 0.15)' : 'rgba(250, 68, 84, 0.15)';
    const title = `Round ${roundNum} (${side}): ${rWon ? 'Win' : 'Loss'}${rKills > 0 ? ` · ${rKills} Kills` : ''}`;
    
    const killsBadge = rKills >= 5 ? `<span style="position:absolute; bottom:-7px; background:#ffd700; color:#000; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:900; line-height:1.2; box-shadow:0 0 4px #ffd700; border:0.5px solid #000; z-index:2;">ACE</span>`
      : rKills >= 2 ? `<span style="position:absolute; bottom:-7px; background:var(--accent); color:#fff; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:800; line-height:1.2; box-shadow:0 0 4px var(--accentdim); border:0.5px solid #000; z-index:2;">${rKills}K</span>`
      : '';

    roundsHtml += `
      <div title="${title}" style="position:relative; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Mono', monospace; font-size:10px; font-weight:bold; cursor:pointer; border:1px solid ${dotBorder}; background:${dotColor}; color:#fff; box-shadow: 0 0 6px ${rWon ? 'rgba(62, 207, 142, 0.1)' : 'rgba(250, 68, 84, 0.1)'};">
        ${roundNum}
        <span style="position:absolute; top:-4px; right:-4px; font-size:7px;">${sideEmoji}</span>
        ${killsBadge}
      </div>
    `;
  });"""

replacement_round_loop = """  // Round-by-round analysis
  const myPuuid = me.puuid || me.subject || me.id || '';
  const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
  let clutchWins = 0, clutchAttempts = 0;
  let killsInWonRounds = 0, killsInLostRounds = 0;
  let firstHalfKills = 0, secondHalfKills = 0;
  let multiKillRounds = 0;
  let bestRoundNum = 1, maxRoundKills = 0, bestRoundWon = false;

  // Determine dynamic round sides (Attack vs Defense) for starting team side normalization
  const roundSides = [];
  for (let i = 0; i < rounds.length; i++) {
    roundSides[i] = i < 12 ? 'Attack' : 'Defense';
  }
  let firstHalfAttackTeam = null;
  for (let i = 0; i < Math.min(rounds.length, 12); i++) {
    const r = rounds[i];
    if (r.bomb_planted && r.plant_events?.planted_by?.team) {
      firstHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
      break;
    }
  }
  if (!firstHalfAttackTeam) {
    let secondHalfAttackTeam = null;
    for (let i = 12; i < rounds.length; i++) {
      const r = rounds[i];
      if (r.bomb_planted && r.plant_events?.planted_by?.team) {
        secondHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
        break;
      }
    }
    if (secondHalfAttackTeam) {
      firstHalfAttackTeam = secondHalfAttackTeam === 'red' ? 'blue' : 'red';
    }
  }
  if (firstHalfAttackTeam) {
    const myTeamLower = myTeamId.toLowerCase();
    const firstHalfSide = firstHalfAttackTeam === myTeamLower ? 'Attack' : 'Defense';
    const secondHalfSide = firstHalfSide === 'Attack' ? 'Defense' : 'Attack';
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (i < 12) {
        roundSides[i] = firstHalfSide;
      } else if (i < 24) {
        roundSides[i] = secondHalfSide;
      } else {
        if (r.bomb_planted && r.plant_events?.planted_by?.team) {
          roundSides[i] = r.plant_events.planted_by.team.toLowerCase() === myTeamLower ? 'Attack' : 'Defense';
        } else {
          roundSides[i] = (i % 2 === 0) ? firstHalfSide : secondHalfSide;
        }
      }
    }
  }

  // Initialize site counters for retakes and positional diagnostics
  const retakeAttempts = { A: 0, B: 0, C: 0 };
  const retakeWins = { A: 0, B: 0, C: 0 };
  const postPlantAttempts = { A: 0, B: 0, C: 0 };
  const postPlantWins = { A: 0, B: 0, C: 0 };
  const firstDeathsBySite = { A: 0, B: 0, C: 0 };
  const firstBloodsBySite = { A: 0, B: 0, C: 0 };
  let defenseFirstDeaths = 0;
  let attackFirstDeaths = 0;
  let totalDefenseRounds = 0;
  let totalAttackRounds = 0;

  rounds.forEach((r, ri) => {
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
    );
    const killEvents = ps?.kill_events || [];
    const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);

    const myAlive = r[myTeamId]?.players_alive ?? null;
    const rWon = (r.winning_team || '').toLowerCase() === myTeamId;
    if (rKills > 0) {
      if (rWon) killsInWonRounds += rKills; else killsInLostRounds += rKills;
      if (ri < Math.floor(totalRounds / 2)) firstHalfKills += rKills;
      else secondHalfKills += rKills;
      if (rKills >= 3) multiKillRounds++;
    }
    if (myAlive === 1) {
      clutchAttempts++;
      if (rWon) clutchWins++;
    }

    if (rKills > maxRoundKills || (rKills === maxRoundKills && rWon && !bestRoundWon)) {
      maxRoundKills = rKills;
      bestRoundNum = ri + 1;
      bestRoundWon = rWon;
    }

    // Site & positional analysis details
    const side = roundSides[ri];
    if (side === 'Defense') totalDefenseRounds++;
    else if (side === 'Attack') totalAttackRounds++;

    const roundKills = [];
    (r.player_stats || []).forEach(playerStats => {
      const kills = playerStats.kill_events || [];
      kills.forEach(k => {
        roundKills.push(k);
      });
    });
    
    let isFD = false;
    let isFB = false;
    if (roundKills.length > 0) {
      roundKills.sort((a, b) => (a.kill_time_in_round ?? a.time_in_round ?? 0) - (b.kill_time_in_round ?? b.time_in_round ?? 0));
      const firstKill = roundKills[0];
      const victimPuuid = firstKill.victim_puuid || firstKill.victim || '';
      const killerPuuid = firstKill.killer_puuid || firstKill.killer || '';
      
      if (myPuuids.includes(victimPuuid)) {
        isFD = true;
        if (side === 'Defense') defenseFirstDeaths++;
        else attackFirstDeaths++;
      }
      if (myPuuids.includes(killerPuuid)) {
        isFB = true;
      }
    }

    if (r.bomb_planted) {
      const site = (r.plant_events?.plant_site || 'A').toUpperCase();
      if (site === 'A' || site === 'B' || site === 'C') {
        if (side === 'Defense') {
          retakeAttempts[site]++;
          if (rWon) retakeWins[site]++;
        } else if (side === 'Attack') {
          postPlantAttempts[site]++;
          if (rWon) postPlantWins[site]++;
        }
        
        if (isFD) {
          firstDeathsBySite[site]++;
        }
        if (isFB) {
          firstBloodsBySite[site]++;
        }
      }
    }
  });

  const tacticalInsights = [];
  ['A', 'B', 'C'].forEach(site => {
    const attempts = retakeAttempts[site];
    const wins = retakeWins[site];
    if (attempts >= 1) {
      const wr = Math.round((wins / attempts) * 100);
      if (wr >= 70) {
        tacticalInsights.push(`💪 You excelled at retakes on <strong>${site} site</strong>, converting ${wins}/${attempts} situations (${wr}% conversion rate).`);
      } else if (wr <= 33) {
        tacticalInsights.push(`⚠️ Struggled with retakes on <strong>${site} site</strong> (only ${wins}/${attempts} converted). Avoid peeking the site early on retakes; wait for teammate utility before pushing.`);
      }
    }
  });

  ['A', 'B', 'C'].forEach(site => {
    const attempts = postPlantAttempts[site];
    const wins = postPlantWins[site];
    if (attempts >= 1) {
      const wr = Math.round((wins / attempts) * 100);
      if (wr >= 70) {
        tacticalInsights.push(`💪 Strong post-plant defense on <strong>${site} site</strong>, winning ${wins}/${attempts} rounds after spike plant.`);
      } else if (wr <= 33) {
        tacticalInsights.push(`⚠️ Low post-plant conversion on <strong>${site} site</strong> (${wins}/${attempts} won). Try playing defensive post-plant crossfires or utility lineups instead of peeking defusers.`);
      }
    }
  });

  ['A', 'B', 'C'].forEach(site => {
    const fdCount = firstDeathsBySite[site];
    if (fdCount >= 1) {
      const totalRoundsOnSite = (retakeAttempts[site] + postPlantAttempts[site]) || 1;
      const fdRate = Math.round((fdCount / totalRoundsOnSite) * 100);
      if (fdRate >= 20) {
        tacticalInsights.push(`⚠️ You had a ${fdRate}% first-death rate on <strong>${site} site</strong> lanes. Try peeking with utility next time or let an initiator scan first.`);
      }
    }
  });

  if (defenseFirstDeaths >= 1 && totalDefenseRounds > 0) {
    const fdPct = Math.round((defenseFirstDeaths / totalDefenseRounds) * 100);
    if (fdPct >= 20) {
      tacticalInsights.push(`⚠️ First-death rate of ${fdPct}% on Defense (${defenseFirstDeaths} rounds). Peeking early as a defender compromises site holds. Play passive anchors.`);
    }
  }

  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = roundSides[ri];
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
    );
    const killEvents = ps?.kill_events || [];
    const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);
    
    const dotBorder = rWon ? 'var(--win)' : 'var(--loss)';
    const dotColor = rWon ? 'rgba(62, 207, 142, 0.15)' : 'rgba(250, 68, 84, 0.15)';
    const title = `Round ${roundNum} (${side}): ${rWon ? 'Win' : 'Loss'}${rKills > 0 ? ` · ${rKills} Kills` : ''}`;
    
    const killsBadge = rKills >= 5 ? `<span style="position:absolute; bottom:-7px; background:#ffd700; color:#000; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:900; line-height:1.2; box-shadow:0 0 4px #ffd700; border:0.5px solid #000; z-index:2;">ACE</span>`
      : rKills >= 2 ? `<span style="position:absolute; bottom:-7px; background:var(--accent); color:#fff; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:800; line-height:1.2; box-shadow:0 0 4px var(--accentdim); border:0.5px solid #000; z-index:2;">${rKills}K</span>`
      : '';

    roundsHtml += `
      <div title="${title}" style="position:relative; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Mono', monospace; font-size:10px; font-weight:bold; cursor:pointer; border:1px solid ${dotBorder}; background:${dotColor}; color:#fff; box-shadow: 0 0 6px ${rWon ? 'rgba(62, 207, 142, 0.1)' : 'rgba(250, 68, 84, 0.1)'};">
        ${roundNum}
        <span style="position:absolute; top:-4px; right:-4px; font-size:7px;">${sideEmoji}</span>
        ${killsBadge}
      </div>
    `;
  });"""

# 2. Target block for returned HTML diagnostics insertion
target_html_insertion = """    <div class="match-ai-verdict">
      <div class="match-ai-verdict-label">⚡ Match Verdict</div>
      ${verdict}
    </div>
    
    <!-- TACTICAL ROUND TIMELINE & WEAPON PERFORMANCE -->"""

replacement_html_insertion = """    <div class="match-ai-verdict">
      <div class="match-ai-verdict-label">⚡ Match Verdict</div>
      ${verdict}
    </div>
    
    <!-- TACTICAL SITE & RETAKE AUDITS -->
    ${tacticalInsights.length ? `
    <div class="match-ai-verdict" style="margin-top:16px; background: linear-gradient(135deg, rgba(232, 255, 71, 0.03) 0%, rgba(20, 20, 22, 0.6) 100%);">
      <div class="match-ai-verdict-label" style="display:flex; align-items:center; gap:8px; color: var(--accent);">
        <span>🎯</span> Positional & Site Diagnostics
      </div>
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
        ${tacticalInsights.map(ins => `<div style="font-size: 11px; line-height: 1.5; color: #fff; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; border: 1.5px solid var(--border);">${ins}</div>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- TACTICAL ROUND TIMELINE & WEAPON PERFORMANCE -->"""

# Standardize line endings of targets to match the file
content_normalized = content.replace("\\r\\n", "\\n")
target_round_loop_lf = target_round_loop.replace("\\r\\n", "\\n")
target_html_insertion_lf = target_html_insertion.replace("\\r\\n", "\\n")

# Try to do direct replace
if target_round_loop_lf in content_normalized:
    content_normalized = content_normalized.replace(target_round_loop_lf, replacement_round_loop)
    print("Success: Replaced round loop block!")
else:
    # Try with crlf
    target_round_loop_crlf = target_round_loop.replace("\\n", "\\r\\n")
    if target_round_loop_crlf in content:
        content = content.replace(target_round_loop_crlf, replacement_round_loop.replace("\\n", "\\r\\n"))
        print("Success: Replaced round loop block with CRLF!")
    else:
        # Try generic string matching
        print("Error: Could not match target_round_loop block!")

if target_html_insertion_lf in content_normalized:
    content_normalized = content_normalized.replace(target_html_insertion_lf, replacement_html_insertion)
    print("Success: Replaced html insertion block!")
else:
    target_html_insertion_crlf = target_html_insertion.replace("\\n", "\\r\\n")
    if target_html_insertion_crlf in content:
        content = content.replace(target_html_insertion_crlf, replacement_html_insertion.replace("\\n", "\\r\\n"))
        print("Success: Replaced html insertion block with CRLF!")
    else:
        print("Error: Could not match target_html_insertion block!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content_normalized)
print("Finished writing public/index.html")
