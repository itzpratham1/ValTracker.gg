function buildMatchAnalysis(match) {
  const allPlayers = getPlayerList(match);
  const rounds     = match.rounds || [];
  const me = allPlayers.find(p =>
    p.name?.toLowerCase() === PLAYER_NAME.toLowerCase() &&
    p.tag?.toLowerCase()  === PLAYER_TAG.toLowerCase()
  );
  if (!me) return '<div class="no-detail">Player not found in match data</div>';

  const myTeamId  = (me.team || '').toLowerCase();
  const s         = me.stats || {};
  const kills     = s.kills   || 0;
  const deaths    = s.deaths  || 0;
  const assists   = s.assists || 0;
  const score     = s.score   || 0;
  const hs        = s.headshots || 0;
  const body_s    = s.bodyshots || 0;
  const legs      = s.legshots  || 0;
  const totalShots = hs + body_s + legs;
  const hsPct     = totalShots ? Math.round((hs / totalShots) * 100) : 0;
  const acs       = Math.round(score / 100);
  const kd        = deaths ? (kills / deaths) : kills;
  const myTeam    = match.teams?.[myTeamId];
  const won       = myTeam?.has_won || false;
  const agentName = me.character || 'Unknown';
  const role      = getRoleClass(agentName);
  const mapName   = match.metadata?.map || 'Unknown';
  const myRounds  = myTeam?.rounds_won ?? 0;
  const oppId     = myTeamId === 'red' ? 'blue' : 'red';
  const oppRounds = match.teams?.[oppId]?.rounds_won ?? 0;
  const totalRounds = myRounds + oppRounds;

  // Damage (from v2 detail if available, else from stats)
  const dmgDealt    = me.damage_made     || 0;
  const dmgReceived = me.damage_received || 0;
  const dmgRatio    = dmgReceived ? (dmgDealt / dmgReceived).toFixed(2) : dmgDealt;

  // Abilities
  const ab = me.ability_casts || {};

  // Round-by-round analysis
  const myPuuid = me.puuid || me.subject || me.id || '';
  const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
  let clutchWins = 0, clutchAttempts = 0;
  let killsInWonRounds = 0, killsInLostRounds = 0;
  let firstHalfKills = 0, secondHalfKills = 0;
  let multiKillRounds = 0;

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
  });

  // Lobby rank context
  const lobbyInfo = getLobbyRankInfo(allPlayers, myTeamId);

  // Allied team stats for comparison
  const allied = allPlayers.filter(p => (p.team || '').toLowerCase() === myTeamId);
  const teamAvgACS = allied.length
    ? Math.round(allied.reduce((s, p) => s + (p.stats?.score || 0), 0) / allied.length / 100)
    : 0;
  const myRankInTeam = [...allied]
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
    .findIndex(p => p.name?.toLowerCase() === PLAYER_NAME.toLowerCase()) + 1;

  // ── GENERATE ANALYSIS ──
  const strengths = [];
  const improvements = [];
  const tips = [];

  // KD assessment
  if (kd >= 1.8)       strengths.push(`Dominant K/D of ${kd.toFixed(2)} — you won almost every duel this game.`);
  else if (kd >= 1.2)  strengths.push(`Positive K/D of ${kd.toFixed(2)} — you traded favourably and created value for your team.`);
  else if (kd < 0.8)   improvements.push(`K/D of ${kd.toFixed(2)} is poor for this match — you died ${deaths} times, likely taking unfavourable duels or misreading angles.`);
  else                  improvements.push(`K/D of ${kd.toFixed(2)} is close to even — ${deaths} deaths limited your impact. Focus on only taking fights with clear angle or utility advantage.`);

  // ACS vs team avg
  if (acs >= teamAvgACS + 30) strengths.push(`ACS of ${acs} was the highest (or near-highest) on your team (team avg: ${teamAvgACS}) — you led from the front.`);
  else if (acs >= teamAvgACS) strengths.push(`ACS of ${acs} was above your team average (${teamAvgACS}) — solid contribution.`);
  else improvements.push(`ACS of ${acs} was below your team average (${teamAvgACS}) — you were ranked #${myRankInTeam} on your team for combat score. Look for more proactive engagements.`);

  // Headshots
  if (hsPct >= 30)     strengths.push(`${hsPct}% headshot rate this match — exceptional aim precision, you punished enemies efficiently.`);
  else if (hsPct >= 20) strengths.push(`${hsPct}% headshot rate is solid — your crosshair placement was consistent.`);
  else if (hsPct < 12) improvements.push(`${hsPct}% headshot rate is very low — you relied heavily on body/leg shots. Against better-ranked opponents this is punished hard. Work on head-level crosshair placement.`);
  else                  improvements.push(`${hsPct}% headshot rate has room to grow. You hit ${hs} headshots out of ${totalShots} total shots — aim for 20%+ by keeping crosshair at head height at all times.`);

  // Damage ratio
  if (dmgDealt > 0) {
    if (parseFloat(dmgRatio) >= 1.4) strengths.push(`Damage ratio of ${dmgRatio} (${dmgDealt} dealt vs ${dmgReceived} received) — you are hitting enemies more than they hit you.`);
    else if (parseFloat(dmgRatio) < 0.7) improvements.push(`Damage ratio of ${dmgRatio} (dealt ${dmgDealt} vs received ${dmgReceived}) — you took significantly more damage than you dealt. This suggests getting caught in crossfire or holding weak positions.`);
  }

  // Assists & utility
  if (assists >= 8)    strengths.push(`${assists} assists shows strong utility usage and team support — your ${agentName} abilities opened up kills for teammates.`);
  else if (assists >= 5) strengths.push(`${assists} assists — decent utility contribution from your ${agentName}.`);
  else if (assists <= 2 && (role === 'initiator' || role === 'controller'))
    improvements.push(`Only ${assists} assists as a ${role} (${agentName}) — ${role === 'initiator' ? 'your flashes and recon should be generating more assist value for teammates' : 'your smokes and utility should be enabling more team plays'}.`);

  // Clutch performance
  if (clutchAttempts > 0) {
    const clutchPct = Math.round((clutchWins / clutchAttempts) * 100);
    if (clutchWins >= 2) strengths.push(`Won ${clutchWins}/${clutchAttempts} clutch situations (${clutchPct}%) — you perform under pressure.`);
    else if (clutchAttempts >= 2 && clutchWins === 0) improvements.push(`0/${clutchAttempts} clutch situations converted — when left as last alive, focus on isolating duels one at a time instead of panicking.`);
  }

  // Multi-kill rounds
  if (multiKillRounds >= 3) strengths.push(`${multiKillRounds} rounds with 3+ kills — you had multiple high-impact rounds that swung momentum.`);

  // First/second half consistency
  if (firstHalfKills > 0 && secondHalfKills > 0) {
    const ratio = firstHalfKills / (firstHalfKills + secondHalfKills);
    if (ratio > 0.65) improvements.push(`You got ${firstHalfKills} kills in the first half but only ${secondHalfKills} in the second — your impact dropped significantly. This can indicate tilt, fatigue, or opponents adapting to your playstyle.`);
    else if (ratio < 0.35) strengths.push(`You improved in the second half (${secondHalfKills} kills vs ${firstHalfKills} first half) — good adaptation mid-game.`);
  }

  // Role-specific tips
  if (role === 'duelist') {
    tips.push(`As ${agentName} (Duelist): your job is to OPEN sites, not follow teammates in. If your kills are happening after teammates die, you are playing too reactive.`);
    if (kd < 1.0) tips.push(`Duelist with sub-1.0 K/D means you are not winning your expected duels. Use your mobility/flash to gain angle advantage BEFORE committing — never peek without an ability ready.`);
  } else if (role === 'initiator') {
    tips.push(`As ${agentName} (Initiator): use recon/flashes BEFORE your duelists push, not after. Your value is the information and opening, not kills.`);
    if (assists < 5) tips.push(`Low assists for an initiator — flash before every teammate push, even in default rounds. Each flash assist is worth more than a kill when it enables site takes.`);
  } else if (role === 'controller') {
    tips.push(`As ${agentName} (Controller): prioritise smoking default positions and chokepoints at round start, not just on site takes. Early smokes prevent info and force enemies to reposition.`);
    if (assists < 4) tips.push(`Low assist count for a controller — your utility should be generating team kills constantly. Coordinate smoke timings verbally or in chat with your duelists.`);
  } else if (role === 'sentinel') {
    tips.push(`As ${agentName} (Sentinel): flank-watching and anchor plays are your contribution. If you died to flanks repeatedly this game, your trip/cam placement needs adjusting.`);
  }

  // Map-specific tip
  tips.push(`On ${mapName}: identify 1-2 positions where you died most this game and make a mental note to either avoid or approach them differently next time.`);

  // Death count tip
  if (deaths >= 18) tips.push(`${deaths} deaths is very high — the main fix is not trading aggression for passivity, but taking better-prepared duels. Always have an exit/reposition route ready before engaging.`);
  else if (deaths >= 14) tips.push(`${deaths} deaths — review when you died: were you rotating late, holding a lonely site, or taking 50/50 duels you didn't need? Eliminating 3-4 of those deaths wins rounds.`);

  // HS tip
  if (hsPct < 18) tips.push(`To raise HS% on ${agentName}: in deathmatch, only allow yourself to shoot if your crosshair is at head height first. Refuse body shots — it builds the muscle memory quickly.`);

  // Ability tip
  const totalAbCasts = (ab.c_cast||0) + (ab.q_cast||0) + (ab.e_cast||0) + (ab.x_cast||0);
  if (totalAbCasts < totalRounds * 1.5 && totalRounds > 10) tips.push(`You cast ${totalAbCasts} abilities across ${totalRounds} rounds — that's less than 1.5 per round. Buy and use abilities every round, even on eco rounds. Free information and chip damage win rounds.`);

  // Verdict
  const outcome = won ? 'a win' : 'a loss';
  let verdict = `This was ${outcome} on ${mapName} with ${kills}/${deaths}/${assists} as ${agentName}. `;
  const biggestIssue = kd < 0.9 ? `reducing your death count (${deaths} this game)` : hsPct < 15 ? `improving your headshot rate (${hsPct}% this game)` : acs < teamAvgACS ? `increasing your ACS above the team average (yours: ${acs}, team: ${teamAvgACS})` : clutchAttempts > 1 && clutchWins === 0 ? 'converting clutch situations' : 'maintaining this performance consistently';
  verdict += `Your main focus for the next game should be <strong>${biggestIssue}</strong>. `;
  verdict += won
    ? `Good result — analyse what worked this game and replicate it.`
    : `Despite the loss, extract the positives and identify the 1-2 rounds that swung the game to learn from them.`;

  // ── PILL DATA ──
  const kdClass  = kd >= 1.2 ? 'good' : kd >= 0.9 ? 'warn' : 'bad';
  const hsClass  = hsPct >= 22 ? 'good' : hsPct >= 14 ? 'warn' : 'bad';
  const acsClass = acs >= teamAvgACS + 20 ? 'good' : acs >= teamAvgACS - 10 ? 'warn' : 'bad';

  // Summary line
  const perfLevel = kd >= 1.3 && acs >= teamAvgACS ? 'a <strong>strong individual performance</strong>' : kd >= 1.0 && acs >= teamAvgACS - 15 ? 'a <strong>solid performance</strong>' : 'a <strong>below-par performance</strong>';
  const summary = `${won ? '✅ Victory' : '❌ Defeat'} · ${agentName} on ${mapName} — ${perfLevel} with ${kills}/${deaths}/${assists} and ${acs} ACS${lobbyInfo?.overall ? ` in a <strong>${lobbyInfo.overall.name}</strong> avg lobby` : ''}.`;

  // Build sections HTML
  const renderBlock = (title, emoji, cls, dotCls, items, full=false) => {
    if (!items.length) return '';
    return `<div class="match-ai-block${full?' full':''}">
      <div class="match-ai-block-header"><span>${emoji}</span><span class="match-ai-block-title ${cls}">${title}</span></div>
      <div class="match-ai-items">${items.map(i=>`<div class="match-ai-item"><div class="match-ai-dot ${dotCls}"></div><div>${i}</div></div>`).join('')}</div>
    </div>`;
  };

  return `
    <div class="match-ai-summary">${summary}</div>
    <div class="match-ai-grid">
      <div class="match-ai-pill"><div class="match-ai-pill-label">K/D</div><div class="match-ai-pill-val ${kdClass}">${kd.toFixed(2)}</div><div class="match-ai-pill-sub">${kills}K / ${deaths}D</div></div>
      <div class="match-ai-pill"><div class="match-ai-pill-label">ACS</div><div class="match-ai-pill-val ${acsClass}">${acs}</div><div class="match-ai-pill-sub">Team avg: ${teamAvgACS}</div></div>
      <div class="match-ai-pill"><div class="match-ai-pill-label">HS Rate</div><div class="match-ai-pill-val ${hsClass}">${hsPct}%</div><div class="match-ai-pill-sub">${hs} headshots</div></div>
      ${dmgDealt ? `<div class="match-ai-pill"><div class="match-ai-pill-label">Dmg Ratio</div><div class="match-ai-pill-val ${parseFloat(dmgRatio)>=1.2?'good':parseFloat(dmgRatio)>=0.8?'warn':'bad'}">${dmgRatio}</div><div class="match-ai-pill-sub">${dmgDealt} dealt</div></div>` : ''}
      <div class="match-ai-pill"><div class="match-ai-pill-label">Clutches</div><div class="match-ai-pill-val ${clutchWins>0?'good':'warn'}">${clutchWins}/${clutchAttempts||0}</div><div class="match-ai-pill-sub">Converted</div></div>
      <div class="match-ai-pill"><div class="match-ai-pill-label">Multi-kills</div><div class="match-ai-pill-val ${multiKillRounds>=2?'good':multiKillRounds>=1?'warn':'bad'}">${multiKillRounds}</div><div class="match-ai-pill-sub">3K+ rounds</div></div>
    </div>
    <div class="match-ai-sections">
      ${renderBlock('What You Did Well', '💪', 'good', 'green', strengths)}
      ${renderBlock('Needs Improvement', '⚠️', 'warn', 'red', improvements)}
      ${renderBlock('Action Tips For Next Game', '⚡', 'tip', 'yellow', tips, true)}
    </div>
    <div class="match-ai-verdict">
      <div class="match-ai-verdict-label">⚡ Match Verdict</div>
      ${verdict}
    </div>
    
    <!-- TACTICAL ROUND TIMELINE & WEAPON PERFORMANCE -->
    <div class="match-ai-verdict" style="margin-top:16px;">
      <div class="match-ai-verdict-label" style="display:flex; align-items:center; gap:8px;">
        <span>🎮</span> Tactical Round-by-Round Progress
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid var(--border);">
        ${roundsHtml}
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-top:12px;">
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; padding:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">⚔️ Combat Consistency</div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>First Half Kills:</span> <strong style="color:#fff;">${firstHalfKills}</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Second Half Kills:</span> <strong style="color:#fff;">${secondHalfKills}</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Multi-Kill Rounds (3K+):</span> <strong style="color:var(--win);">${multiKillRounds}</strong></div>
        </div>
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; padding:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">🎯 Accuracy Breakdown</div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Headshot Rate:</span> <strong style="color:var(--win);">${hsPct}%</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Bodyshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((body_s/totalShots)*100) : 0}%</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Legshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((legs/totalShots)*100) : 0}%</strong></div>
        </div>
      </div>
    </div>`;
}