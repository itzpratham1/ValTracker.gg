function evaluateDraft() {
  const selected = draftSlots.filter(s => s !== null);
  const total = selected.length;
  
  const scoreMeter = document.getElementById('dc-score-meter');
  const verdictTitle = document.getElementById('dc-verdict-title');
  const verdictDesc = document.getElementById('dc-verdict-desc');
  const insightsWrap = document.getElementById('dc-insights-wrap');

  let duelists = 0, initiators = 0, controllers = 0, sentinels = 0;
  selected.forEach(ag => {
    const role = getRoleClass(ag.charAt(0).toUpperCase() + ag.slice(1));
    if (role === 'duelist') duelists++;
    else if (role === 'initiator') initiators++;
    else if (role === 'controller') controllers++;
    else if (role === 'sentinel') sentinels++;
  });

  // Updated to show 1 duelist baseline satisfaction since 2 duelists aren't a necessity
  document.getElementById('dc-bar-duelists-txt').innerText = `${duelists} / 1`;
  document.getElementById('dc-bar-duelists').style.width = `${Math.min((duelists/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-initiators-txt').innerText = `${initiators} / 1`;
  document.getElementById('dc-bar-initiators').style.width = `${Math.min((initiators/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-controllers-txt').innerText = `${controllers} / 1`;
  document.getElementById('dc-bar-controllers').style.width = `${Math.min((controllers/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-sentinels-txt').innerText = `${sentinels} / 1`;
  document.getElementById('dc-bar-sentinels').style.width = `${Math.min((sentinels/1)*100, 100)}%`;

  if (total < 5) {
    scoreMeter.innerText = total * 10;
    scoreMeter.style.color = 'var(--muted)';
    verdictTitle.innerText = 'Drafting in progress...';
    verdictDesc.innerText = `Selected ${total} out of 5 agents. Add more to get a full tactical evaluation.`;
    insightsWrap.innerHTML = `<div style="font-size:11px; color:var(--muted); text-align:center; padding:16px;">Draft is incomplete. Fill slots to trigger composition analysis.</div>`;
    
    // Reset metrics
    document.getElementById('dc-metric-entry-txt').innerText = '0%';
    document.getElementById('dc-metric-entry').style.width = '0%';
    document.getElementById('dc-metric-defense-txt').innerText = '0%';
    document.getElementById('dc-metric-defense').style.width = '0%';
    document.getElementById('dc-metric-retake-txt').innerText = '0%';
    document.getElementById('dc-metric-retake').style.width = '0%';
    document.getElementById('dc-metric-synergy-txt').innerText = '0%';
    document.getElementById('dc-metric-synergy').style.width = '0%';
    return;
  }

  let score = 65; // base score for complete team
  const insights = [];
  const mapKey = document.getElementById('dc-map-select').value;
  const mapRecs = draftMapRecommendations[mapKey] || { preferred: [], note: '' };

  // Helper variables for metrics
  const agentKeys = selected.map(a => a.toLowerCase());
  
  // ── 1. SITE ENTRY & EXECUTION POWER ──
  let entryScore = 30;
  let entryMobility = 0;
  if (agentKeys.includes('jett')) entryMobility += 15;
  if (agentKeys.includes('neon')) entryMobility += 15;
  if (agentKeys.includes('raze')) entryMobility += 15;
  if (agentKeys.includes('yoru')) entryMobility += 15;
  entryScore += Math.min(entryMobility, 25);

  let entryFlashes = 0;
  if (agentKeys.includes('breach')) entryFlashes += 10;
  if (agentKeys.includes('skye')) entryFlashes += 10;
  if (agentKeys.includes('gekko')) entryFlashes += 10;
  if (agentKeys.includes('kay/o')) entryFlashes += 10;
  if (agentKeys.includes('reyna')) entryFlashes += 10;
  if (agentKeys.includes('phoenix')) entryFlashes += 10;
  if (agentKeys.includes('omen')) entryFlashes += 10;
  entryScore += Math.min(entryFlashes, 20);

  let entrySmokes = 0;
  if (agentKeys.includes('brimstone')) entrySmokes += 10;
  if (agentKeys.includes('omen')) entrySmokes += 10;
  if (agentKeys.includes('clove')) entrySmokes += 10;
  if (agentKeys.includes('harbor')) entrySmokes += 10;
  if (agentKeys.includes('astra')) entrySmokes += 10;
  if (agentKeys.includes('viper')) entrySmokes += 10;
  entryScore += Math.min(entrySmokes, 15);

  // Synergy bonuses
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('breach')) entryScore += 10;
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('omen')) entryScore += 10;
  entryScore = Math.min(entryScore, 100);

  // ── 2. DEFENSIVE HOLD & SITE DELAY ──
  let defenseScore = 30;
  let defSentinels = 0;
  if (agentKeys.includes('cypher')) defSentinels += 15;
  if (agentKeys.includes('killjoy')) defSentinels += 15;
  if (agentKeys.includes('deadlock')) defSentinels += 15;
  if (agentKeys.includes('vyse')) defSentinels += 15;
  if (agentKeys.includes('sage')) defSentinels += 15;
  defenseScore += Math.min(defSentinels, 30);

  let defSmokes = 0;
  if (agentKeys.includes('viper')) defSmokes += 15;
  if (agentKeys.includes('brimstone')) defSmokes += 10;
  if (agentKeys.includes('omen')) defSmokes += 10;
  if (agentKeys.includes('astra')) defSmokes += 10;
  if (agentKeys.includes('sage')) defSmokes += 10; // Sage slow/wall
  defenseScore += Math.min(defSmokes, 20);

  let defMollies = 0;
  if (agentKeys.includes('viper')) defMollies += 10;
  if (agentKeys.includes('brimstone')) defMollies += 10;
  if (agentKeys.includes('killjoy')) defMollies += 10;
  if (agentKeys.includes('gekko')) defMollies += 10;
  if (agentKeys.includes('phoenix')) defMollies += 10;
  if (agentKeys.includes('raze')) defMollies += 10;
  defenseScore += Math.min(defMollies, 15);

  // Synergy bonuses
  if (agentKeys.includes('viper') && (agentKeys.includes('brimstone') || agentKeys.includes('killjoy'))) defenseScore += 10;
  if ((agentKeys.includes('cypher') || agentKeys.includes('deadlock')) && agentKeys.includes('raze')) defenseScore += 10;
  if (agentKeys.includes('sage') && (agentKeys.includes('brimstone') || agentKeys.includes('breach'))) defenseScore += 10;
  defenseScore = Math.min(defenseScore, 100);

  // ── 3. RETAKE & SCOUTING CAPABILITY ──
  let retakeScore = 30;
  let retakeScouts = 0;
  if (agentKeys.includes('sova')) retakeScouts += 15;
  if (agentKeys.includes('fade')) retakeScouts += 15;
  if (agentKeys.includes('cypher')) retakeScouts += 10; // camera
  if (agentKeys.includes('skye')) retakeScouts += 10;
  if (agentKeys.includes('gekko')) retakeScouts += 10;
  retakeScore += Math.min(retakeScouts, 30);

  let retakeFlashes = 0;
  if (agentKeys.includes('breach')) retakeFlashes += 10;
  if (agentKeys.includes('skye')) retakeFlashes += 10;
  if (agentKeys.includes('gekko')) retakeFlashes += 10;
  if (agentKeys.includes('kay/o')) retakeFlashes += 10;
  if (agentKeys.includes('omen')) retakeFlashes += 10;
  if (agentKeys.includes('yoru')) retakeFlashes += 10;
  if (agentKeys.includes('phoenix')) retakeFlashes += 10;
  retakeScore += Math.min(retakeFlashes, 20);

  let retakeSmokes = 0;
  if (agentKeys.includes('omen')) retakeSmokes += 10;
  if (agentKeys.includes('astra')) retakeSmokes += 10;
  if (agentKeys.includes('clove')) retakeSmokes += 10;
  retakeScore += Math.min(retakeSmokes, 15);

  let retakeUlts = 0;
  if (agentKeys.includes('breach')) retakeUlts += 10;
  if (agentKeys.includes('killjoy')) retakeUlts += 10;
  if (agentKeys.includes('fade')) retakeUlts += 10;
  if (agentKeys.includes('brimstone')) retakeUlts += 10;
  if (agentKeys.includes('viper')) retakeUlts += 10;
  retakeScore += Math.min(retakeUlts, 15);

  if ((agentKeys.includes('sova') || agentKeys.includes('fade')) && agentKeys.includes('gekko')) retakeScore += 10;
  retakeScore = Math.min(retakeScore, 100);

  // ── 4. INTER-AGENT SYNERGY SCORE ──
  let synergyScore = 0;
  const synergyDetails = [];

  // Pairwise checks
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('breach')) {
    synergyScore += 25;
    synergyDetails.push('<strong>Entry Flash Combo (Breach + Jett/Neon):</strong> Breach\'s signature concuss or flash perfectly supports fast site entry dashes.');
  }
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('omen')) {
    synergyScore += 25;
    synergyDetails.push('<strong>Shrouded Entry Combo (Omen + Jett/Neon):</strong> Omen\'s Paranoia blind isolates site defenders, securing safe entry paths.');
  }
  if ((agentKeys.includes('cypher') || agentKeys.includes('deadlock')) && agentKeys.includes('raze')) {
    synergyScore += 25;
    synergyDetails.push('<strong>Trap-Grenade Execution (Cypher/Deadlock + Raze):</strong> Raze\'s paint shells deliver lethal damage on trapped targets.');
  }
  if ((agentKeys.includes('sova') || agentKeys.includes('fade')) && agentKeys.includes('gekko')) {
    synergyScore += 25;
    synergyDetails.push('<strong>Double Info-Flood (Fade/Sova + Gekko):</strong> Combines deep scout scanning with Gekko\'s targetable flashes to clear all corners.');
  }
  if (agentKeys.includes('viper') && (agentKeys.includes('brimstone') || agentKeys.includes('killjoy'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>Toxic Post-Plant Delay (Viper + Brimstone/Killjoy):</strong> Poison decay and molly lines stall defuses from long range safely.');
  }
  if (agentKeys.includes('sage') && (agentKeys.includes('brimstone') || agentKeys.includes('breach'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>Slow-Orb Blast Combo (Sage + Brimstone/Breach):</strong> Traps defenders in slow zones under lethal Orbital Strikes or Aftershocks.');
  }
  if (agentKeys.includes('yoru') && agentKeys.includes('kay/o')) {
    synergyScore += 25;
    synergyDetails.push('<strong>Suppressive Infiltration (Yoru + KAY/O):</strong> KAY/O suppresses site utilities while Yoru teleports behind defender lines.');
  }
  if (agentKeys.includes('viper') && (agentKeys.includes('harbor') || agentKeys.includes('omen') || agentKeys.includes('clove'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>Double Smokes Control:</strong> Impassable visual blocks lock down large open lanes (elite Breeze/Icebox setup).');
  }
  if (agentKeys.includes('clove') && (agentKeys.includes('sage') || agentKeys.includes('reyna'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>High Team Sustainability:</strong> Post-death smokes, heals, and resurrections maximize round durability.');
  }

  // Base co-ordination if no specific combo
  if (synergyScore === 0) {
    if (duelists >= 1 && initiators >= 1 && controllers >= 1 && sentinels >= 1) {
      synergyScore = 30;
      synergyDetails.push('<strong>Standard Role Balance:</strong> All 4 roles represented. A good stable blueprint for team play.');
    } else {
      synergyScore = 15;
      synergyDetails.push('<strong>Basic Comp Coordination:</strong> Missing core role categories. Standard default plays are highly recommended.');
    }
  }
  synergyScore = Math.min(synergyScore, 100);

  // Set the 4 progress bars
  document.getElementById('dc-metric-entry-txt').innerText = `${entryScore}%`;
  document.getElementById('dc-metric-entry').style.width = `${entryScore}%`;
  document.getElementById('dc-metric-defense-txt').innerText = `${defenseScore}%`;
  document.getElementById('dc-metric-defense').style.width = `${defenseScore}%`;
  document.getElementById('dc-metric-retake-txt').innerText = `${retakeScore}%`;
  document.getElementById('dc-metric-retake').style.width = `${retakeScore}%`;
  document.getElementById('dc-metric-synergy-txt').innerText = `${synergyScore}%`;
  document.getElementById('dc-metric-synergy').style.width = `${synergyScore}%`;

  // ── 5. DETAILED DRAWBACKS & PENALTIES ──
  // Check missing roles
  if (controllers === 0) {
    score -= 20;
    insights.push({ 
      type: 'warn', 
      icon: '⚠️', 
      text: '<strong>Critical Deficit — No Controller Smokes:</strong> Smokes are the most fundamental utility in Valorant. Without smoke cover to block sightlines (e.g. A-main defenders, passive snipers), your entry duelists will be immediately picked off by crossfires when attempting to enter site chokepoints.' 
    });
  } else if (controllers === 2) {
    score += 8;
    insights.push({ 
      type: 'good', 
      icon: '💥', 
      text: '<strong>Tactical Controller Synergy:</strong> Double smokes controller setups afford exceptional mid-round flexibility and delay utility.' 
    });
  } else if (controllers === 1) {
    score += 5;
  }

  if (sentinels === 0) {
    score -= 15;
    insights.push({ 
      type: 'warn', 
      icon: '⚠️', 
      text: '<strong>Deficit — Open Flanks (No Sentinel):</strong> Traps and visual anchors (Cypher traps, Killjoy alarms/turrets) automatically hold the flank. Without a Sentinel, your team is forced to leave a player holding backward sightlines, or face sudden mid-round flank attacks that split your team in two.' 
    });
  } else {
    score += 5;
    insights.push({ 
      type: 'good', 
      icon: '🛡️', 
      text: '<strong>Sentinel Anchor Bonus:</strong> Solid defensive site locks. Passive traps defend flanks automatically.' 
    });
  }

  if (duelists === 0) {
    score -= 10;
    insights.push({ 
      type: 'warn', 
      icon: '⚠️', 
      text: '<strong>Deficit — No Entry Mobility (No Duelist):</strong> Duelists possess movement abilities (dashes, slides, blasts) that bypass defender crosshairs and draw defensive crosshair attention. Without a mobile entry agent, your pushes through tight chokepoints will stall, allowing defender mollies and utility to chew you down.' 
    });
  } else if (duelists > 2) {
    score -= 10;
    insights.push({ 
      type: 'warn', 
      icon: '⚠️', 
      text: '<strong>Utility Deficit — Triple Duelists:</strong> Excess of entry agents trades off valuable initiator scans and control smokes. You have too much entry aggression but lack the utility to hold sites once planted.' 
    });
  } else if (duelists === 1 || duelists === 2) {
    score += 5;
  }

  if (initiators === 0) {
    score -= 15;
    insights.push({ 
      type: 'warn', 
      icon: '⚠️', 
      text: '<strong>Deficit — No Site Scouting (No Initiator Intel):</strong> Initiators scan sites to pinpoint exactly where defenders are playing. Without scanning arrows, sensor dogs, or flashes to force defenders off their angles, your team is playing completely blind, peeking directly into pre-aimed crosshairs.' 
    });
  } else if (initiators >= 1) {
    score += 5;
  }

  // Check Flash and Delay capabilities
  const hasFlash = agentKeys.some(a => ['breach','skye','gekko','kay/o','omen','yoru','phoenix','reyna'].includes(a));
  if (!hasFlash) {
    score -= 8;
    insights.push({
      type: 'warn',
      icon: '⚠️',
      text: '<strong>Drawback — Zero Flash Utility:</strong> Flashes are critical to force defenders holding tight angles or sniper lanes (such as Ascent A-main or Haven C-long) to reposition. Peeking these lanes raw without blinding defender vision yields an immediate disadvantage in duels.'
    });
  }

  const hasDelay = agentKeys.some(a => ['viper','brimstone','sage','killjoy','deadlock','vyse'].includes(a));
  if (!hasDelay) {
    score -= 8;
    insights.push({
      type: 'warn',
      icon: '⚠️',
      text: '<strong>Drawback — Zero Area Denial / Delay:</strong> If the opposing team executes a fast site rush, you have no slowing spheres, toxic grids, or mollies to halt their momentum. Defenders will be easily overrun before rotations can possibly arrive to support.'
    });
  }

  // ── 6. MAP-SPECIFIC DRAWBACKS & RECOMMENDATIONS ──
  if (mapKey === 'breeze') {
    if (!agentKeys.includes('viper')) {
      score -= 15;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Breeze Map Drawback — No Viper Screen:</strong> Breeze is exceptionally open with massive sightlines. Single-dome smokes (like Omen or Brimstone) cannot cover the wide entrances. Without Viper\'s Toxic Screen to slice sites in half, your team cannot safely plant or defend A/B sites.'
      });
    }
    if (!agentKeys.includes('sova') && !agentKeys.includes('fade')) {
      score -= 8;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Breeze Map Recommendation — Lacking Long-Range Scouting:</strong> Because Breeze has massive sites, running short-range scouts (like Gekko or Skye) makes finding defenders difficult. Sova is highly recommended for massive open-field scanning.'
      });
    }
  }

  if (mapKey === 'icebox') {
    if (!agentKeys.includes('sage')) {
      score -= 8;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Icebox Map Drawback — Lacking Sage Barrier:</strong> Icebox default B-site plant is completely exposed to sniper fire from Snowman/Top-site. Lacking Sage\'s wall means you cannot guarantee a safe plant, forcing high-risk raw executes under fire.'
      });
    }
    if (!agentKeys.includes('viper')) {
      score -= 10;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Icebox Map Drawback — Lacking Viper Wall:</strong> Icebox A-site entries require screen coverage across screens and rafters. Without Viper\'s wall, entering A-site leaves you exposed to 4+ crossfire angles simultaneously.'
      });
    }
  }

  if (mapKey === 'ascent') {
    if (!agentKeys.includes('sova')) {
      score -= 8;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Ascent Map Drawback — No Sova Wallbangs:</strong> Ascent\'s B-main and A-garden walls are paper-thin and highly wallbangable. Lacking Sova\'s Recon Bolt or Owl Drone means losing the ability to secure free wallbang kills or clear close corners safely.'
      });
    }
  }

  if (mapKey === 'bind') {
    if (!agentKeys.includes('brimstone')) {
      score -= 5;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Bind Map Recommendation — Prefer Brimstone:</strong> Bind sites are compact with tight entries (Showers, Hookah). Brimstone\'s three simultaneous sky-smokes block all defender sightlines at once, which is far superior to slow reloadable smokes here.'
      });
    }
    if (!agentKeys.includes('raze')) {
      score -= 5;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Bind Map Recommendation — Prefer Raze:</strong> Bind has extremely narrow chokepoints like Hookah and Showers. Lacking Raze\'s Paint Shells or Boom Bot makes clearing these dense defender hideouts highly dangerous.'
      });
    }
  }

  if (mapKey === 'haven') {
    if (!agentKeys.includes('cypher') && !agentKeys.includes('killjoy')) {
      score -= 10;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Haven Map Drawback — Heavy 3-Site Rotation Risk:</strong> Lacking Cypher or Killjoy traps. Because Haven features three active bomb sites, rotating defenders have massive link corridors to flank. You will be constantly exposed to deep behind-the-back pushes unless you waste active player manpower watching flanks.'
      });
    }
  }

  if (mapKey === 'sunset') {
    if (!agentKeys.includes('cypher')) {
      score -= 5;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Sunset Map Recommendation — Prefer Cypher:</strong> Sunset B-site is infamous for its narrow lane entries. Playing without Cypher means losing the ability to completely shut down B-main pushes using standard tripwire grids.'
      });
    }
  }

  if (mapKey === 'lotus') {
    const hasFlashStun = agentKeys.some(a => ['breach','skye','gekko','kay/o'].includes(a));
    if (!hasFlashStun) {
      score -= 8;
      insights.push({
        type: 'warn',
        icon: '🗺️',
        text: '<strong>Lotus Map Drawback — Weak Control Uptime:</strong> Lotus\'s three sites have compact corners and reactive breakable doors. Without high-tempo flash/stun initiators (like Breach or Gekko), site entries will be quickly countered by immediate defender re-aggression.'
      });
    }
  }

  // ── 7. MAP META MATCHES ──
  let mapMatches = 0;
  selected.forEach(ag => {
    if (mapRecs.preferred.includes(ag)) {
      mapMatches++;
    }
  });

  if (mapMatches >= 3) {
    score += 15;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Elite Map Suitability:</strong> Matches the meta layout of ${mapKey.toUpperCase()}. ${mapRecs.note}` });
  } else if (mapMatches >= 1) {
    score += 5;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Decent Map Layout Suitability.</strong> ${mapRecs.note}` });
  }

  // Inter-agent synergy score impact
  score += Math.round(synergyScore * 0.15); // max +15 pts from inter-agent co-ordination

  // Print all pairwise synergies
  synergyDetails.forEach(sd => {
    insights.push({ type: 'good', icon: '💥', text: sd });
  });

  // ── 8. ACTIONABLE TACTICAL FILL RECOMMENDATIONS ──
  if (controllers === 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Fill Controller:</strong> Add a Smokes agent (Brimstone, Omen, Clove, Harbor, Astra, Viper) to establish sightline blockages. On ' + mapKey.toUpperCase() + ', ' + (['breeze','icebox'].includes(mapKey) ? '<strong>Viper</strong>' : '<strong>Omen or Brimstone</strong>') + ' is highly recommended.'
    });
  }
  if (sentinels === 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Add Sentinel Flank Watch:</strong> Pick Cypher, Killjoy, Deadlock, or Vyse to secure your flanks automatically. On ' + mapKey.toUpperCase() + ', ' + (['ascent', 'haven', 'icebox'].includes(mapKey) ? '<strong>Killjoy or Cypher</strong>' : '<strong>Cypher</strong>') + ' is highly recommended to hold sites.'
    });
  }
  if (initiators === 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Bring an Initiator:</strong> Select Sova, Fade, Skye, Gekko, or KAY/O to scout defender setups. On ' + mapKey.toUpperCase() + ', ' + (['ascent','breeze'].includes(mapKey) ? '<strong>Sova</strong>' : '<strong>Gekko or Fade</strong>') + ' is highly recommended to gather info.'
    });
  }
  if (duelists === 0) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Consider a Mobile Entry Agent:</strong> Select Jett, Raze, Neon, or Yoru for entry mobility to break defensive crossfires. <i>Note: 1 duelist is completely sufficient!</i>'
    });
  }
  if (!hasFlash && total === 5) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Add Flashing Utility:</strong> Swap one agent for Breach, Skye, Gekko, KAY/O, or Omen to force defenders off high-ground pre-aim angles.'
    });
  }
  if (!hasDelay && total === 5) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Tactical Recommendation — Add Delay/Molly:</strong> Swap an agent for Brimstone, Viper, Sage, Killjoy, Deadlock, or Vyse to stall fast site rushes.'
    });
  }

  // Map-specific Elite Pick Swap suggestions (if map meta pick is missing)
  if (mapKey === 'breeze' && !agentKeys.includes('viper')) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Breeze Optimization Recommendation:</strong> Swap one agent for **Viper**. Her Toxic Screen wall is the single most important utility on Breeze to block long-range defender sightlines.'
    });
  }
  if (mapKey === 'icebox') {
    if (!agentKeys.includes('sage')) {
      insights.push({
        type: 'tip',
        icon: '💡',
        text: '<strong>Icebox Optimization Recommendation:</strong> Swap one agent for **Sage**. Her Barrier Orb wall is crucial for securing safe B-default plants under top-snowman sniper cover.'
      });
    }
    if (!agentKeys.includes('viper')) {
      insights.push({
        type: 'tip',
        icon: '💡',
        text: '<strong>Icebox Optimization Recommendation:</strong> Swap one agent for **Viper**. Her Toxic Screen slices rafters and screen sights for safe executes.'
      });
    }
  }
  if (mapKey === 'ascent' && !agentKeys.includes('sova')) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Ascent Wallbang Meta Pick:</strong> Swap one agent for **Sova**. His Recon Bolt is vital to scan paper-thin B-main and A-garden wallbang targets.'
    });
  }
  if (mapKey === 'bind') {
    if (!agentKeys.includes('brimstone')) {
      insights.push({
        type: 'tip',
        icon: '💡',
        text: '<strong>Bind Smoke Meta Pick:</strong> Swap one agent for **Brimstone**. Brim can drop three sky-smokes simultaneously to block Hookah, Showers, and site crossfires completely.'
      });
    }
    if (!agentKeys.includes('raze')) {
      insights.push({
        type: 'tip',
        icon: '💡',
        text: '<strong>Bind Entry Meta Pick:</strong> Swap one agent for **Raze**. Her paint shells and boom bot are unmatched for clearing compact hookey and showers corners.'
      });
    }
  }
  if (mapKey === 'haven' && !agentKeys.includes('cypher') && !agentKeys.includes('killjoy')) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Haven 3-Site Flank Security:</strong> Swap one agent for **Cypher or Killjoy** to hold linking corridors automatically.'
    });
  }
  if (mapKey === 'sunset' && !agentKeys.includes('cypher')) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: '<strong>Sunset B-Main Lockdown:</strong> Swap one agent for **Cypher** to establish standard B-main tripwire grids.'
    });
  }

  score = Math.max(0, Math.min(score, 100));
  
  scoreMeter.innerText = score;
  if (score >= 85) {
    scoreMeter.style.color = 'var(--win)';
    verdictTitle.innerText = 'Meta Composition';
    verdictTitle.style.color = 'var(--win)';
    verdictDesc.innerText = 'Exceptional draft. Balanced role allocations, strong synergies, and high suitability for this map outline.';
  } else if (score >= 70) {
    scoreMeter.style.color = 'var(--accent)';
    verdictTitle.innerText = 'Decent Composition';
    verdictTitle.style.color = 'var(--accent)';
    verdictDesc.innerText = 'Good average balance. Solid role slots filled, though minor weaknesses or card tweaks can optimize entries.';
  } else {
    scoreMeter.style.color = 'var(--loss)';
    verdictTitle.innerText = 'Sub-optimal Composition';
    verdictTitle.style.color = 'var(--loss)';
    verdictDesc.innerText = 'Weak draft stability. Missing controllers, Sentinels, or map picks makes site executes difficult.';
  }

  insightsWrap.innerHTML = insights.map(i => `
    <div class="dc-insight-card ${i.type}">
      <span class="dc-insight-card-icon">${i.icon}</span>
      <div>${i.text}</div>
    </div>
  `).join('');
}
