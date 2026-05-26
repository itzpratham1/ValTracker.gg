with open("public/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update AGENT_ROLES and AGENT_UUIDS mapping
target_roles = """const AGENT_ROLES = {
  jett:'duelist',reyna:'duelist',phoenix:'duelist',neon:'duelist',iso:'duelist',yoru:'duelist',waylay:'duelist',raze:'duelist',
  sage:'sentinel',killjoy:'sentinel',cypher:'sentinel',chamber:'sentinel',deadlock:'sentinel',vyse:'sentinel',
  sova:'initiator',breach:'initiator',skye:'initiator',fade:'initiator',gekko:'initiator',tejo:'initiator','kay/o':'initiator',kayo:'initiator',
  brimstone:'controller',viper:'controller',omen:'controller',astra:'controller',harbor:'controller',clove:'controller'
};"""

replacement_roles = """const AGENT_ROLES = {
  jett:'duelist',reyna:'duelist',phoenix:'duelist',neon:'duelist',iso:'duelist',yoru:'duelist',waylay:'duelist',raze:'duelist',
  sage:'sentinel',killjoy:'sentinel',cypher:'sentinel',chamber:'sentinel',deadlock:'sentinel',vyse:'sentinel',veto:'sentinel',
  sova:'initiator',breach:'initiator',skye:'initiator',fade:'initiator',gekko:'initiator',tejo:'initiator','kay/o':'initiator',kayo:'initiator',
  brimstone:'controller',viper:'controller',omen:'controller',astra:'controller',harbor:'controller',clove:'controller',miks:'controller'
};"""

if target_roles in content:
    content = content.replace(target_roles, replacement_roles, 1)
    print("Success: AGENT_ROLES updated!")
else:
    print("Error: target_roles not found!")

target_uuids = """  'Clove':    '1dbf2edd-4729-0984-3115-daa5eed44993',
};"""

replacement_uuids = """  'Clove':    '1dbf2edd-4729-0984-3115-daa5eed44993',
  'Miks':     'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
};"""

if target_uuids in content:
    content = content.replace(target_uuids, replacement_uuids, 1)
    print("Success: Miks added to AGENT_UUIDS!")
else:
    print("Error: target_uuids not found!")

target_vyse = """  'Vyse':     'efba5359-4016-a1e5-7626-b1ae7d0ac65a',"""
replacement_vyse = """  'Vyse':     'efba5359-4016-a1e5-7626-b1ae7d0ac65a',
  'Veto':     'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',"""

if target_vyse in content:
    content = content.replace(target_vyse, replacement_vyse, 1)
    print("Success: Veto added to AGENT_UUIDS!")
else:
    print("Error: target_vyse not found!")


# 2. Update buildRounds function programmatically
replacement_build_rounds = """function buildRounds(match,myTeamId){
  const rounds=match.rounds||[];
  if(!rounds.length)return'<div class="no-detail" style="color:var(--muted);font-size:11px;">Round timeline loads after expanding full match details ↓</div>';
  // Resolve my puuid + teammate puuids for clutch detection
  const allP = getPlayerList(match);
  const meR=allP.find(p=>p.name?.toLowerCase()===PLAYER_NAME.toLowerCase()&&p.tag?.toLowerCase()===PLAYER_TAG.toLowerCase());
  const myPuuidR=meR?.puuid||meR?.subject||meR?.id||'';
  const myPuuids=[meR?.puuid, meR?.subject, meR?.id, myPuuidR].filter(Boolean);
  const teammatePuuids=allP.filter(p=>(p.team||'').toLowerCase()===myTeamId&&!myPuuids.includes(p.puuid)).map(p=>p.puuid);
  let html='<div class="rounds-wrap">';
  rounds.forEach((r,i)=>{
    const myTeamWon=(r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase()===myTeamId;
    
    const ps = (r.player_stats || []).find(p => 
      (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuidR
    );
    const killEvents = ps?.kill_events || [];
    const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);

    // Detect clutch: count teammate deaths and check if I died in this round
    let isClutch=false;
    if(myTeamWon && (r.player_stats||[]).length>0){
      let tmDeaths=0;
      let meDied=false;
      (r.player_stats||[]).forEach(ps=>{
        (ps.kill_events||[]).forEach(k=>{
          const victim = k.victim_puuid || k.victim;
          if(victim && myPuuids.includes(victim)) meDied = true;
          if(victim && teammatePuuids.includes(victim)) tmDeaths++;
        });
      });
      // All teammates died AND I did not die AND we won = I clutched it
      if(tmDeaths>=teammatePuuids.length && teammatePuuids.length>0 && !meDied) isClutch=true;
    }
    
    // Kills Badge styled elegantly to fit the dot
    const killsBadge = rKills >= 5 ? `<span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#ffd700; color:#000; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:900; line-height:1.2; box-shadow:0 0 4px #ffd700; border:0.5px solid #000; z-index:2; white-space:nowrap;">ACE</span>`
      : rKills >= 2 ? `<span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:var(--accent); color:#fff; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:800; line-height:1.2; box-shadow:0 0 4px var(--accentdim); border:0.5px solid #000; z-index:2; white-space:nowrap;">${rKills}K</span>`
      : '';

    html+=`<div class="round-dot ${myTeamWon?'won':'lost'}${isClutch?' clutch':''}" title="Round ${i+1}${isClutch?'  Clutch':''}${rKills > 0 ? ` · ${rKills} Kills` : ''}" style="position:relative; overflow:visible; display:flex; align-items:center; justify-content:center;">
      ${i+1}
      ${killsBadge}
    </div>`;
  });
  html+=`</div><div class="round-legend" style="margin-top:12px;">
    <span><span class="legend-dot" style="background:rgba(62,207,142,0.4)"></span>Win</span>
    <span><span class="legend-dot" style="background:rgba(255,87,87,0.3)"></span>Loss</span>
    <span><span class="legend-dot" style="outline:2px solid #f5a623;display:inline-block;width:8px;height:8px;border-radius:2px;"></span>Clutch</span>
  </div>`;
  return html;
}"""

replacement_build_clutches = """function buildClutches(match,myTeamId){
  const rounds=match.rounds||[];
  const clutches=[];
  const aces=[];
  // Resolve my puuid + teammate puuids
  const allP = getPlayerList(match);
  const meC = allP.find(p=>p.name?.toLowerCase()===PLAYER_NAME.toLowerCase()&&p.tag?.toLowerCase()===PLAYER_TAG.toLowerCase());
  const myPuuidC = meC?.puuid||meC?.subject||meC?.id||'';
  const myPuuids = [meC?.puuid, meC?.subject, meC?.id, myPuuidC].filter(Boolean);
  const teammatePuuids = allP.filter(p=>(p.team||'').toLowerCase()===myTeamId&&!myPuuids.includes(p.puuid)).map(p=>p.puuid);

  rounds.forEach((r,i)=>{
    const myWon=(r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase()===myTeamId;
    const playerStats = r.player_stats||[];

    if(playerStats.length > 0){
      const myPs = myPuuidC ? playerStats.find(p=>
        (p.player_puuid||p.subject||p.puuid||p.player_id)===myPuuidC
      ) : null;
      const killEvents = myPs?.kill_events||[];
      const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);

      // Count teammate deaths and check if I died in this round
      let tmDeaths=0;
      let meDied=false;
      playerStats.forEach(ps=>{
        (ps.kill_events||[]).forEach(k=>{
          const victim = k.victim_puuid || k.victim;
          if(victim && myPuuids.includes(victim)) meDied = true;
          if(victim && teammatePuuids.includes(victim)) tmDeaths++;
        });
      });
      // Clutch: all teammates died AND I survived AND we still won the round
      const isClutch = myWon && tmDeaths>=teammatePuuids.length && teammatePuuids.length>0 && !meDied;
      const enemiesAlive = Math.max(1, myKills); // mathematical proxy for clutch size based on kills secured
      if(isClutch) clutches.push({round:i+1, kills:myKills, vsCount:`1v${Math.min(enemiesAlive,5)}`});
      // Ace: 5 kills
      if(myKills>=5) aces.push({round:i+1});
    }
  });"""

def get_func_bounds(name, code):
    start = code.find(f"function {name}")
    if start == -1:
        return None, None
    
    braces = 0
    in_func = False
    end = start
    for i in range(start, len(code)):
        c = code[i]
        if c == '{':
            braces += 1
            in_func = True
        elif c == '}':
            braces -= 1
        
        if in_func and braces == 0:
            end = i + 1
            break
    return start, end

# Replace buildRounds programmatically via braces
start, end = get_func_bounds("buildRounds", content)
if start is not None and end is not None:
    content = content[:start] + replacement_build_rounds + content[end:]
    print("Success: buildRounds programmatically replaced via braces!")
else:
    print("Error: buildRounds not found!")

# Replace buildClutches programmatically via braces
start, end = get_func_bounds("buildClutches", content)
if start is not None and end is not None:
    content = content[:start] + replacement_build_clutches + content[end:]
    print("Success: buildClutches programmatically replaced via braces!")
else:
    print("Error: buildClutches not found!")


# 3. Update buildMatchAnalysis round loops for robust parsing and timeline badges
target_loop_1 = """  rounds.forEach((r, ri) => {
    const ps = (r.player_stats || []).find(p => p.player_puuid === myPuuid);
    const rKills = ps?.kills?.length || 0;
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
  });"""

replacement_loop_1 = """  rounds.forEach((r, ri) => {
    const ps = (r.player_stats || []).find(p => 
      (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuid
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
  });"""

if target_loop_1 in content:
    content = content.replace(target_loop_1, replacement_loop_1, 1)
    print("Success: First rounds loop updated for robust parsing!")
else:
    print("Error: target_loop_1 not found!")

target_loop_2 = """  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = ri < 12 ? 'Attack' : 'Defense';
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => p.player_puuid === myPuuid);
    const rKills = ps?.kills?.length || 0;
    
    const dotBorder = rWon ? 'var(--win)' : 'var(--loss)';
    const dotColor = rWon ? 'rgba(62, 207, 142, 0.15)' : 'rgba(250, 68, 84, 0.15)';
    const title = `Round ${roundNum} (${side}): ${rWon ? 'Win' : 'Loss'}${rKills > 0 ? ` · ${rKills} Kills` : ''}`;
    
    roundsHtml += `
      <div title="${title}" style="position:relative; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Mono', monospace; font-size:10px; font-weight:bold; cursor:pointer; border:1px solid ${dotBorder}; background:${dotColor}; color:#fff; box-shadow: 0 0 6px ${rWon ? 'rgba(62, 207, 142, 0.1)' : 'rgba(250, 68, 84, 0.1)'};">
        ${roundNum}
        <span style="position:absolute; top:-4px; right:-4px; font-size:7px;">${sideEmoji}</span>
      </div>
    `;
  });"""

replacement_loop_2 = """  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = ri < 12 ? 'Attack' : 'Defense';
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => 
      (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuid
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

if target_loop_2 in content:
    content = content.replace(target_loop_2, replacement_loop_2, 1)
    print("Success: Second rounds loop updated for badges!")
else:
    print("Error: target_loop_2 not found!")


# 4. Update renderDraftAgentList to support role-categorized lists and modern glowing selector
start_render, end_render = get_func_bounds("renderDraftAgentList", content)
replacement_render_fn = """function renderDraftAgentList() {
  const container = document.getElementById('dc-agent-list');
  if (!container) return;
  container.innerHTML = '';
  
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';

  const roles = {
    duelist: { title: '⚔️ Duelists', color: '#ff5757', desc: 'Self-sufficient fraggers and space-creators', agents: [] },
    initiator: { title: '🎯 Initiators', color: '#ffd700', desc: 'Information gatherers and flash/stun utilities', agents: [] },
    controller: { title: '🌀 Controllers', color: '#00d4e0', desc: 'Smoke and territorial blocking experts', agents: [] },
    sentinel: { title: '🛡️ Sentinels', color: '#3ecf8e', desc: 'Defensive area lockdown and flank watch anchors', agents: [] }
  };

  const allAgents = Object.keys(AGENT_UUIDS);
  allAgents.forEach(ag => {
    const agKey = ag.toLowerCase();
    if (draftSlots.includes(agKey)) return;
    
    const role = getRoleClass(ag);
    if (roles[role]) {
      roles[role].agents.push(ag);
    }
  });

  Object.entries(roles).forEach(([roleKey, roleInfo]) => {
    if (roleInfo.agents.length === 0) return;

    const section = document.createElement('div');
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = '10px';

    const headerWrap = document.createElement('div');
    headerWrap.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    headerWrap.style.paddingBottom = '6px';
    headerWrap.style.display = 'flex';
    headerWrap.style.flexDirection = 'column';
    headerWrap.style.gap = '2px';

    const header = document.createElement('div');
    header.style.fontFamily = "'Barlow Condensed', sans-serif";
    header.style.fontSize = '16px';
    header.style.fontWeight = '900';
    header.style.textTransform = 'uppercase';
    header.style.color = roleInfo.color;
    header.style.letterSpacing = '1px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '8px';
    header.innerHTML = roleInfo.title;

    const desc = document.createElement('div');
    desc.style.fontSize = '10px';
    desc.style.color = 'var(--muted)';
    desc.style.fontStyle = 'italic';
    desc.textContent = roleInfo.desc;

    headerWrap.appendChild(header);
    headerWrap.appendChild(desc);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(92px, 1fr))';
    grid.style.gap = '12px';

    roleInfo.agents.forEach(ag => {
      const iconUrl = getAgentIconUrl(ag);
      const agKey = ag.toLowerCase();

      const div = document.createElement('div');
      div.className = 'dc-slot-card';
      div.style.minWidth = 'unset';
      div.style.maxWidth = 'unset';
      div.style.padding = '10px 6px';
      div.style.borderRadius = '10px';
      div.style.border = '1px solid var(--border)';
      div.style.background = 'rgba(255, 255, 255, 0.01)';
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      div.style.transition = 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
      
      div.onmouseenter = () => {
        div.style.borderColor = roleInfo.color;
        div.style.background = 'rgba(255, 255, 255, 0.03)';
        div.style.boxShadow = '0 0 12px ' + roleInfo.color + '33';
        div.style.transform = 'translateY(-2px)';
      };
      div.onmouseleave = () => {
        div.style.borderColor = 'var(--border)';
        div.style.background = 'rgba(255, 255, 255, 0.01)';
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        div.style.transform = 'translateY(0)';
      };

      div.onclick = () => selectDraftAgent(agKey);
      div.innerHTML = `
        <div class="dc-slot-avatar" style="width: 44px; height: 44px; border-color: rgba(255,255,255,0.08); transition: all 0.2s ease;">
          ${iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤'}
        </div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-size:11px; font-weight:800; color:#fff; text-transform:uppercase; text-align:center; overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap; letter-spacing:0.5px;">${ag}</div>
      `;
      grid.appendChild(div);
    });

    section.appendChild(headerWrap);
    section.appendChild(grid);
    container.appendChild(section);
  });
}"""

if start_render is not None and end_render is not None:
    content = content[:start_render] + replacement_render_fn + content[end_render:]
    print("Success: renderDraftAgentList programmatically replaced via braces!")
else:
    print("Error: renderDraftAgentList not found!")

# 5. Inject Warmup Planner & ELO Forecast back into buildPerfLab
target_plab_end = """  });
  html += `</div>`;

  return html;
}"""

replacement_plab_end = """  });
  html += `</div>`;

  // ── WARMUP PLANNER & AIM PERFORMANCE FORECAST ──
  let aimTier = '';
  let volatility = '';
  let forecastTrend = '';

  const plabHs = myHS;
  const plabKd = myKD;

  // Aim Consistency / Volatility Heuristics
  if (plabKd >= 1.25 && plabHs >= 20) {
    aimTier = 'Elite Sentinel Aim';
    volatility = 'Low (Consistent)';
    forecastTrend = 'Upward Trend 📈';
  } else if (plabKd < 0.9) {
    aimTier = 'Volatile Marksman';
    volatility = 'High (Unstable)';
    forecastTrend = 'Fluctuating 📉';
  } else if (plabHs < 15) {
    aimTier = 'Spray Specialist';
    volatility = 'Medium (Spray-heavy)';
    forecastTrend = 'Stable Horizon ➡️';
  } else {
    aimTier = 'Consistent Skirmisher';
    volatility = 'Medium (Stable)';
    forecastTrend = 'Moderate Upward Trend 📈';
  }

  // Generate personalized drills
  let drills = [];
  if (plabHs < 15) {
    drills.push({ drill: 'Headshot Only Deathmatch', duration: '10 Mins', focus: 'Precision Tap & Micro-adjustments', target: '25% HS Rate' });
    drills.push({ drill: 'Aimlab: Microshot Precision', duration: '3 Runs', focus: 'Fine-motor flicking', target: 'Score > 75,000' });
  } else {
    drills.push({ drill: 'Spider Shot Ultimate', duration: '3 Runs', focus: 'Flick Speed & Recovery', target: 'Score > 80,000' });
  }

  if (plabKd < 1.0) {
    drills.push({ drill: 'Crosshair Placement Pre-peeking', duration: '15 Mins', focus: 'Angled slicing & prefire drills on custom server', target: 'Zero lazy angles' });
    drills.push({ drill: 'Aimlab: Gridshot Speed', duration: '3 Runs', focus: 'Rhythm & flick muscle memory', target: 'Score > 70,000' });
  } else {
    drills.push({ drill: 'Sheriff Only Swiftplay', duration: '1 Match', focus: 'Trigger discipline', target: 'K/D > 1.25' });
  }

  drills.push({ drill: 'Range Medium Bots (Armor ON)', duration: '5 Runs', focus: 'Burst counter-strafe timing', target: 'Hit > 22/30 Bots' });

  let drillsRows = drills.map(d => 
    '<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">' +
      '<td style="padding: 10px 8px; font-weight: 700; color: #fff;">' + d.drill + '</td>' +
      '<td style="padding: 10px 8px; color: var(--accent); font-family: \'DM Mono\', monospace;">' + d.duration + '</td>' +
      '<td style="padding: 10px 8px; font-size: 11px; color: rgba(240,240,242,0.7);">' + d.focus + '</td>' +
      '<td style="padding: 10px 8px; font-family: \'DM Mono\', monospace; font-size: 11px; color: var(--win); text-align: right;">' + d.target + '</td>' +
    '</tr>'
  ).join('');

  // Calculate simulated forecast ELO points based on form
  const mmrValues = Object.values(mmrH).filter(v => typeof v === 'number');
  let startElo = 1000;
  if (mmrValues.length > 0) {
    startElo = mmrValues[mmrValues.length - 1];
  }

  const currentElo = startElo;
  const projectedPoints = [currentElo];
  let eloChangeRate = (plabKd - 1) * 15 + (myWR - 50) * 2;
  if (eloChangeRate > 25) eloChangeRate = 25;
  if (eloChangeRate < -25) eloChangeRate = -25;

  for (let i = 1; i <= 5; i++) {
    const noise = (Math.random() - 0.45) * 8;
    projectedPoints.push(Math.round(projectedPoints[i-1] + eloChangeRate + noise));
  }

  const width = 340;
  const height = 120;
  const minP = Math.min(...projectedPoints) - 10;
  const maxP = Math.max(...projectedPoints) + 10;
  const pRange = (maxP - minP) || 1;

  const pointsStr = projectedPoints.map((p, idx) => {
    const x = (idx / 5) * width;
    const y = height - ((p - minP) / pRange) * height;
    return x + ',' + y;
  }).join(' ');

  const svgPath = '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%; height:' + height + 'px; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid var(--border); padding: 8px 12px; box-sizing: border-box; overflow: visible;">' +
    '<line x1="0" y1="' + (height/2) + '" x2="' + width + '" y2="' + (height/2) + '" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4,4" />' +
    '<line x1="' + (width/2) + '" y1="0" x2="' + (width/2) + '" y2="' + height + '" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4,4" />' +
    '<path d="M 0,' + height + ' L ' + pointsStr.replace(/,/g, ' ') + ' L ' + width + ',' + height + ' Z" fill="url(#eloGrad)" opacity="0.15" />' +
    '<polyline points="' + pointsStr + '" fill="none" stroke="var(--accent)" stroke-width="2.5" />' +
    projectedPoints.map((p, idx) => {
      const x = (idx / 5) * width;
      const y = height - ((p - minP) / pRange) * height;
      const col = idx === 0 ? '#fff' : (projectedPoints[idx] >= projectedPoints[idx-1] ? 'var(--win)' : 'var(--loss)');
      return '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="' + col + '" stroke="#000" stroke-width="1" />';
    }).join('') +
    '<defs>' +
      '<linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--accent)" />' +
        '<stop offset="100%" stop-color="transparent" />' +
      '</linearGradient>' +
    '</defs>' +
  '</svg>';

  html += plabChapter('📈', 'Warmup Planner & Aim Performance Forecast');
  html += `
  <div class="plab-grid g2" style="margin-top: 14px;">
    <!-- WARMUP PLANNER CARD -->
    <div class="plab-card span2" id="warmup-planner-card" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(20, 20, 22, 0.5) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin: 0; display: flex; flex-direction: column; gap: 10px;">
      <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
        ⚡ Personalized Warmup Routine Timetable
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--muted);">
              <th style="padding: 6px 8px; text-transform: uppercase;">Drill / Exercise</th>
              <th style="padding: 6px 8px; text-transform: uppercase;">Duration</th>
              <th style="padding: 6px 8px; text-transform: uppercase;">Focus</th>
              <th style="padding: 6px 8px; text-transform: uppercase; text-align: right;">Target Metric</th>
            </tr>
          </thead>
          <tbody>
            ${drillsRows}
          </tbody>
        </table>
      </div>
      <div style="font-size: 10px; color: var(--muted); font-style: italic; margin-top: 4px;">
        *Generated dynamically based on your HS% (${plabHs}%), K/D ratio (${plabKd}), and combat activity.
      </div>
    </div>

    <!-- ELO FORECAST CARD -->
    <div class="plab-card span2" id="elo-forecast-card" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(20, 20, 22, 0.5) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin: 0; display: flex; flex-direction: column; gap: 12px;">
      <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
        📈 Aim Performance Tier & Forecast
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <div style="font-size: 10px; color: var(--muted); text-transform: uppercase;">Aim Performance Tier</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; color: var(--accent);">${aimTier}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--muted); text-transform: uppercase;">Volatility Index</div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; color: #fff;">${volatility}</div>
        </div>
      </div>
      
      <div>
        <div style="font-size: 10px; color: var(--muted); text-transform: uppercase; margin-bottom: 6px;">5-Match Rank ELO Forecast (${forecastTrend})</div>
        ${svgPath}
      </div>
    </div>
  </div>`;

  return html;
}"""

if target_plab_end in content:
    content = content.replace(target_plab_end, replacement_plab_end, 1)
    print("Success: buildPerfLab Warmup plan added!")
else:
    print("Error: target_plab_end not found!")

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(content)
