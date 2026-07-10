// ValTracker — Draft Composition Engine
import { AGENT_ROLES, AGENT_UUIDS, type AgentRole } from './constants';

export interface DraftInsight {
  type: 'good' | 'warn' | 'tip';
  icon: string;
  text: string;
}

export interface DraftEvaluation {
  score: number;
  verdictTitle: string;
  verdictDesc: string;
  roleCounts: { duelists: number; initiators: number; controllers: number; sentinels: number };
  roleBars: { id: string; current: number; target: number }[];
  metrics: { entry: number; defense: number; retake: number; synergy: number };
  insights: DraftInsight[];
}

export interface AgentPoolStats {
  name: string;
  matches: number;
  kd: string;
  wr: number;
}

export interface MapRecommendation {
  preferred: string[];
  note: string;
}

export const MAPS = ['ascent', 'bind', 'haven', 'split', 'breeze', 'sunset', 'lotus', 'icebox', 'abyss'] as const;

export const MAP_DISPLAY: Record<string, string> = {
  ascent: 'Ascent', bind: 'Bind', haven: 'Haven', split: 'Split',
  breeze: 'Breeze', sunset: 'Sunset', lotus: 'Lotus', icebox: 'Icebox', abyss: 'Abyss'
};

export const DRAFT_MAP_RECOMMENDATIONS: Record<string, MapRecommendation> = {
  ascent: { preferred: ['sova', 'killjoy', 'jett', 'omen'], note: 'Sova & Killjoy are top tier on Ascent due to wallbangable areas and clear lane angles.' },
  bind: { preferred: ['brimstone', 'viper', 'raze', 'cypher'], note: 'Brimstone & Viper double controller provides excellent map control. Raze is phenomenal in hookey/showers.' },
  haven: { preferred: ['killjoy', 'sova', 'jett', 'omen'], note: 'Cypher or Killjoy are essential to hold Haven three-site setup. Omen is highly favored for garage plays.' },
  split: { preferred: ['raze', 'viper', 'cypher', 'omen'], note: 'Viper + Omen double controller excels at locking down mid.' },
  breeze: { preferred: ['viper', 'sova', 'jett', 'cypher'], note: 'Viper is an absolute must-pick on Breeze. Sova is essential for open sites information.' },
  sunset: { preferred: ['cypher', 'gekko', 'clove', 'breach'], note: 'Sunset favors heavy initiator utility setups. Gekko is incredibly strong for default plant coverage.' },
  lotus: { preferred: ['killjoy', 'viper', 'omen', 'fade'], note: 'Double controller or heavy initiator pressure dominates Lotus three-site layout.' },
  icebox: { preferred: ['viper', 'killjoy', 'jett', 'sova'], note: 'Viper is essential on Icebox A-screen control. Killjoy secures B yellow default anchors.' },
  abyss: { preferred: ['omen', 'cypher', 'jett', 'sova'], note: 'Cypher traps excel on flank bridges. Omen teleports cross gaps easily.' }
};

const ROLE_POOLS: Record<AgentRole, string[]> = {
  duelist: ['jett', 'raze', 'neon', 'yoru', 'phoenix', 'reyna'],
  initiator: ['sova', 'fade', 'gekko', 'skye', 'kay/o', 'breach'],
  controller: ['omen', 'viper', 'brimstone', 'clove', 'astra', 'harbor'],
  sentinel: ['killjoy', 'cypher', 'vyse', 'deadlock', 'sage']
};

const FLASH_AGENTS = ['breach', 'skye', 'gekko', 'kay/o', 'omen', 'yoru', 'phoenix', 'reyna'];
const DELAY_AGENTS = ['viper', 'brimstone', 'sage', 'killjoy', 'deadlock', 'vyse'];

export function getAgentIconUrl(name: string): string | null {
  if (!name) return null;
  const u = AGENT_UUIDS[name] || AGENT_UUIDS[name.charAt(0).toUpperCase() + name.slice(1)];
  if (u) return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
  return null;
}

export function getRoleClass(agentName: string): AgentRole {
  const key = agentName.toLowerCase().replace(/\//g, '');
  return AGENT_ROLES[key] || 'duelist';
}

export function normalizeAgentKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'kayo') return 'kay/o';
  return lower;
}

export function evaluateDraft(draftSlots: (string | null)[], mapKey: string): DraftEvaluation {
  const selected = draftSlots.filter((s): s is string => s !== null);
  const total = selected.length;

  let duelists = 0, initiators = 0, controllers = 0, sentinels = 0;
  selected.forEach(ag => {
    const role = getRoleClass(ag);
    if (role === 'duelist') duelists++;
    else if (role === 'initiator') initiators++;
    else if (role === 'controller') controllers++;
    else if (role === 'sentinel') sentinels++;
  });

  if (total < 5) {
    return {
      score: total * 10,
      verdictTitle: 'Drafting in progress...',
      verdictDesc: `Selected ${total} out of 5 agents. Add more to get a full tactical evaluation.`,
      roleCounts: { duelists, initiators, controllers, sentinels },
      roleBars: [
        { id: 'duelists', current: duelists, target: 1 },
        { id: 'initiators', current: initiators, target: 1 },
        { id: 'controllers', current: controllers, target: 1 },
        { id: 'sentinels', current: sentinels, target: 1 }
      ],
      metrics: { entry: 0, defense: 0, retake: 0, synergy: 0 },
      insights: []
    };
  }

  let score = 65;
  const insights: DraftInsight[] = [];
  const mapRecs = DRAFT_MAP_RECOMMENDATIONS[mapKey] || { preferred: [], note: '' };
  const agentKeys = selected.map(a => a.toLowerCase());

  // 1. SITE ENTRY & EXECUTION POWER
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

  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('breach')) entryScore += 10;
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('omen')) entryScore += 10;
  entryScore = Math.min(entryScore, 100);

  // 2. DEFENSIVE HOLD & SITE DELAY
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
  if (agentKeys.includes('sage')) defSmokes += 10;
  defenseScore += Math.min(defSmokes, 20);

  let defMollies = 0;
  if (agentKeys.includes('viper')) defMollies += 10;
  if (agentKeys.includes('brimstone')) defMollies += 10;
  if (agentKeys.includes('killjoy')) defMollies += 10;
  if (agentKeys.includes('gekko')) defMollies += 10;
  if (agentKeys.includes('phoenix')) defMollies += 10;
  if (agentKeys.includes('raze')) defMollies += 10;
  defenseScore += Math.min(defMollies, 15);

  if (agentKeys.includes('viper') && (agentKeys.includes('brimstone') || agentKeys.includes('killjoy'))) defenseScore += 10;
  if ((agentKeys.includes('cypher') || agentKeys.includes('deadlock')) && agentKeys.includes('raze')) defenseScore += 10;
  if (agentKeys.includes('sage') && (agentKeys.includes('brimstone') || agentKeys.includes('breach'))) defenseScore += 10;
  defenseScore = Math.min(defenseScore, 100);

  // 3. RETAKE & SCOUTING CAPABILITY
  let retakeScore = 30;
  let retakeScouts = 0;
  if (agentKeys.includes('sova')) retakeScouts += 15;
  if (agentKeys.includes('fade')) retakeScouts += 15;
  if (agentKeys.includes('cypher')) retakeScouts += 10;
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

  // 4. INTER-AGENT SYNERGY SCORE
  let synergyScore = 0;
  const synergyDetails: string[] = [];

  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('breach')) {
    synergyScore += 25;
    synergyDetails.push("<strong>Entry Flash Combo (Breach + Jett/Neon):</strong> Breach's signature concuss or flash perfectly supports fast site entry dashes.");
  }
  if ((agentKeys.includes('jett') || agentKeys.includes('neon')) && agentKeys.includes('omen')) {
    synergyScore += 25;
    synergyDetails.push("<strong>Shrouded Entry Combo (Omen + Jett/Neon):</strong> Omen's Paranoia blind isolates site defenders, securing safe entry paths.");
  }
  if ((agentKeys.includes('cypher') || agentKeys.includes('deadlock')) && agentKeys.includes('raze')) {
    synergyScore += 25;
    synergyDetails.push("<strong>Trap-Grenade Execution (Cypher/Deadlock + Raze):</strong> Raze's paint shells deliver lethal damage on trapped targets.");
  }
  if ((agentKeys.includes('sova') || agentKeys.includes('fade')) && agentKeys.includes('gekko')) {
    synergyScore += 25;
    synergyDetails.push("<strong>Double Info-Flood (Fade/Sova + Gekko):</strong> Combines deep scout scanning with Gekko's targetable flashes to clear all corners.");
  }
  if (agentKeys.includes('viper') && (agentKeys.includes('brimstone') || agentKeys.includes('killjoy'))) {
    synergyScore += 25;
    synergyDetails.push("<strong>Toxic Post-Plant Delay (Viper + Brimstone/Killjoy):</strong> Poison decay and molly lines stall defuses from long range safely.");
  }
  if (agentKeys.includes('sage') && (agentKeys.includes('brimstone') || agentKeys.includes('breach'))) {
    synergyScore += 25;
    synergyDetails.push("<strong>Slow-Orb Blast Combo (Sage + Brimstone/Breach):</strong> Traps defenders in slow zones under lethal Orbital Strikes or Aftershocks.");
  }
  if (agentKeys.includes('yoru') && agentKeys.includes('kay/o')) {
    synergyScore += 25;
    synergyDetails.push("<strong>Suppressive Infiltration (Yoru + KAY/O):</strong> KAY/O suppresses site utilities while Yoru teleports behind defender lines.");
  }
  if (agentKeys.includes('viper') && (agentKeys.includes('harbor') || agentKeys.includes('omen') || agentKeys.includes('clove'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>Double Smokes Control:</strong> Impassable visual blocks lock down large open lanes (elite Breeze/Icebox setup).');
  }
  if (agentKeys.includes('clove') && (agentKeys.includes('sage') || agentKeys.includes('reyna'))) {
    synergyScore += 25;
    synergyDetails.push('<strong>High Team Sustainability:</strong> Post-death smokes, heals, and resurrections maximize round durability.');
  }

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

  // 5. DETAILED DRAWBACKS & PENALTIES
  if (controllers === 0) {
    score -= 20;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Critical Deficit \u2014 No Controller Smokes:</strong> Smokes are the most fundamental utility in Valorant. Without smoke cover to block sightlines, your entry duelists will be immediately picked off by crossfires when attempting to enter site chokepoints.' });
  } else if (controllers === 2) {
    score += 8;
    insights.push({ type: 'good', icon: '\uD83D\uDCA5', text: '<strong>Tactical Controller Synergy:</strong> Double smokes controller setups afford exceptional mid-round flexibility and delay utility.' });
  } else if (controllers === 1) {
    score += 5;
  }

  if (sentinels === 0) {
    score -= 15;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Deficit \u2014 Open Flanks (No Sentinel):</strong> Traps and visual anchors automatically hold the flank. Without a Sentinel, your team is forced to leave a player holding backward sightlines, or face sudden mid-round flank attacks.' });
  } else {
    score += 5;
    insights.push({ type: 'good', icon: '\uD83D\uDEE1\uFE0F', text: '<strong>Sentinel Anchor Bonus:</strong> Solid defensive site locks. Passive traps defend flanks automatically.' });
  }

  if (duelists === 0) {
    score -= 10;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Deficit \u2014 No Entry Mobility (No Duelist):</strong> Duelists possess movement abilities that bypass defender crosshairs. Without a mobile entry agent, your pushes through tight chokepoints will stall.' });
  } else if (duelists > 2) {
    score -= 10;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Utility Deficit \u2014 Triple Duelists:</strong> Excess of entry agents trades off valuable initiator scans and control smokes. You have too much entry aggression but lack utility to hold sites once planted.' });
  } else {
    score += 5;
  }

  if (initiators === 0) {
    score -= 15;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Deficit \u2014 No Site Scouting (No Initiator Intel):</strong> Without scanning arrows, sensor dogs, or flashes to force defenders off their angles, your team is playing completely blind.' });
  } else {
    score += 5;
  }

  const hasFlash = agentKeys.some(a => FLASH_AGENTS.includes(a));
  if (!hasFlash) {
    score -= 8;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Drawback \u2014 Zero Flash Utility:</strong> Flashes are critical to force defenders holding tight angles to reposition. Peeking these lanes raw yields an immediate disadvantage in duels.' });
  }

  const hasDelay = agentKeys.some(a => DELAY_AGENTS.includes(a));
  if (!hasDelay) {
    score -= 8;
    insights.push({ type: 'warn', icon: '\u26A0\uFE0F', text: '<strong>Drawback \u2014 Zero Area Denial / Delay:</strong> No slowing spheres, toxic grids, or mollies to halt fast site rushes. Defenders will be easily overrun.' });
  }

  // 6. MAP-SPECIFIC DRAWBACKS
  if (mapKey === 'breeze') {
    if (!agentKeys.includes('viper')) {
      score -= 15;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Breeze Map Drawback \u2014 No Viper Screen:</strong> Breeze is exceptionally open. Without Viper's Toxic Screen to slice sites in half, your team cannot safely plant or defend." });
    }
    if (!agentKeys.includes('sova') && !agentKeys.includes('fade')) {
      score -= 8;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: '<strong>Breeze Map Recommendation \u2014 Lacking Long-Range Scouting:</strong> Sova is highly recommended for massive open-field scanning.' });
    }
  }

  if (mapKey === 'icebox') {
    if (!agentKeys.includes('sage')) {
      score -= 8;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Icebox Map Drawback \u2014 Lacking Sage Barrier:</strong> Lacking Sage's wall means you cannot guarantee a safe plant under top-snowman sniper cover." });
    }
    if (!agentKeys.includes('viper')) {
      score -= 10;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Icebox Map Drawback \u2014 Lacking Viper Wall:</strong> Without Viper's wall, entering A-site leaves you exposed to 4+ crossfire angles simultaneously." });
    }
  }

  if (mapKey === 'ascent' && !agentKeys.includes('sova')) {
    score -= 8;
    insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Ascent Map Drawback \u2014 No Sova Wallbangs:</strong> Ascent's B-main and A-garden walls are paper-thin. Lacking Sova's Recon Bolt means losing free wallbang kills." });
  }

  if (mapKey === 'bind') {
    if (!agentKeys.includes('brimstone')) {
      score -= 5;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Bind Map Recommendation \u2014 Prefer Brimstone:</strong> Brimstone's three simultaneous sky-smokes block all defender sightlines at once." });
    }
    if (!agentKeys.includes('raze')) {
      score -= 5;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Bind Map Recommendation \u2014 Prefer Raze:</strong> Raze's Paint Shells or Boom Bot make clearing dense hookey and showers corners safer." });
    }
  }

  if (mapKey === 'haven' && !agentKeys.includes('cypher') && !agentKeys.includes('killjoy')) {
    score -= 10;
    insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Haven Map Drawback \u2014 Heavy 3-Site Rotation Risk:</strong> Lacking Cypher or Killjoy traps. Haven's three sites create massive flank corridors." });
  }

  if (mapKey === 'sunset' && !agentKeys.includes('cypher')) {
    score -= 5;
    insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Sunset Map Recommendation \u2014 Prefer Cypher:</strong> Sunset B-site is infamous for narrow lane entries. Cypher completely shuts down B-main pushes." });
  }

  if (mapKey === 'lotus') {
    const hasFlashStun = agentKeys.some(a => ['breach', 'skye', 'gekko', 'kay/o'].includes(a));
    if (!hasFlashStun) {
      score -= 8;
      insights.push({ type: 'warn', icon: '\uD83D\uDDFA\uFE0F', text: "<strong>Lotus Map Drawback \u2014 Weak Control Uptime:</strong> Without high-tempo flash/stun initiators, site entries will be quickly countered." });
    }
  }

  // 7. MAP META MATCHES
  let mapMatches = 0;
  selected.forEach(ag => { if (mapRecs.preferred.includes(ag.toLowerCase())) mapMatches++; });

  if (mapMatches >= 3) {
    score += 15;
    insights.push({ type: 'good', icon: '\uD83D\uDDFA\uFE0F', text: `<strong>Elite Map Suitability:</strong> Matches the meta layout of ${mapKey.toUpperCase()}. ${mapRecs.note}` });
  } else if (mapMatches >= 1) {
    score += 5;
    insights.push({ type: 'good', icon: '\uD83D\uDDFA\uFE0F', text: `<strong>Decent Map Layout Suitability.</strong> ${mapRecs.note}` });
  }

  // 8. TACTICAL FILL RECOMMENDATIONS
  if (controllers === 0) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: `<strong>Tactical Recommendation \u2014 Fill Controller:</strong> Add a Smokes agent. On ${mapKey.toUpperCase()}, ${['breeze', 'icebox'].includes(mapKey) ? '<strong>Viper</strong>' : '<strong>Omen or Brimstone</strong>'} is highly recommended.` });
  }
  if (sentinels === 0) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: `<strong>Tactical Recommendation \u2014 Add Sentinel Flank Watch:</strong> On ${mapKey.toUpperCase()}, ${['ascent', 'haven', 'icebox'].includes(mapKey) ? '<strong>Killjoy or Cypher</strong>' : '<strong>Cypher</strong>'} is highly recommended.` });
  }
  if (initiators === 0) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: `<strong>Tactical Recommendation \u2014 Bring an Initiator:</strong> On ${mapKey.toUpperCase()}, ${['ascent', 'breeze'].includes(mapKey) ? '<strong>Sova</strong>' : '<strong>Gekko or Fade</strong>'} is highly recommended.` });
  }
  if (duelists === 0) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Tactical Recommendation \u2014 Consider a Mobile Entry Agent:</strong> Select Jett, Raze, Neon, or Yoru for entry mobility to break defensive crossfires.' });
  }
  if (!hasFlash && total === 5) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Tactical Recommendation \u2014 Add Flashing Utility:</strong> Swap one agent for Breach, Skye, Gekko, KAY/O, or Omen to force defenders off pre-aim angles.' });
  }
  if (!hasDelay && total === 5) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Tactical Recommendation \u2014 Add Delay/Molly:</strong> Swap an agent for Brimstone, Viper, Sage, Killjoy, Deadlock, or Vyse to stall fast site rushes.' });
  }

  // Map-specific swap suggestions
  if (mapKey === 'breeze' && !agentKeys.includes('viper')) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Breeze Optimization:</strong> Swap one agent for <strong>Viper</strong>. Her Toxic Screen wall is the single most important utility on Breeze.' });
  }
  if (mapKey === 'icebox') {
    if (!agentKeys.includes('sage')) insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Icebox Optimization:</strong> Swap one agent for <strong>Sage</strong>. Her Barrier Orb wall is crucial for safe B-default plants.' });
    if (!agentKeys.includes('viper')) insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Icebox Optimization:</strong> Swap one agent for <strong>Viper</strong>. Her Toxic Screen slices rafters and screen sights.' });
  }
  if (mapKey === 'ascent' && !agentKeys.includes('sova')) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Ascent Wallbang Meta Pick:</strong> Swap one agent for <strong>Sova</strong>. His Recon Bolt is vital to scan paper-thin wallbang targets.' });
  }
  if (mapKey === 'bind') {
    if (!agentKeys.includes('brimstone')) insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Bind Smoke Meta Pick:</strong> Swap one agent for <strong>Brimstone</strong>. Three simultaneous sky-smokes block all sightlines.' });
    if (!agentKeys.includes('raze')) insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Bind Entry Meta Pick:</strong> Swap one agent for <strong>Raze</strong>. Her paint shells are unmatched for clearing compact corners.' });
  }
  if (mapKey === 'haven' && !agentKeys.includes('cypher') && !agentKeys.includes('killjoy')) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Haven 3-Site Flank Security:</strong> Swap one agent for <strong>Cypher or Killjoy</strong> to hold linking corridors automatically.' });
  }
  if (mapKey === 'sunset' && !agentKeys.includes('cypher')) {
    insights.push({ type: 'tip', icon: '\uD83D\uDCA1', text: '<strong>Sunset B-Main Lockdown:</strong> Swap one agent for <strong>Cypher</strong> to establish standard B-main tripwire grids.' });
  }

  // Synergy bonus
  score += Math.round(synergyScore * 0.15);
  synergyDetails.forEach(sd => { insights.push({ type: 'good', icon: '\uD83D\uDCA5', text: sd }); });

  score = Math.max(0, Math.min(score, 100));

  let verdictTitle: string, verdictDesc: string;
  if (score >= 85) {
    verdictTitle = 'Meta Composition';
    verdictDesc = 'Exceptional draft. Balanced role allocations, strong synergies, and high suitability for this map outline.';
  } else if (score >= 70) {
    verdictTitle = 'Decent Composition';
    verdictDesc = 'Good average balance. Solid role slots filled, though minor weaknesses can optimize entries.';
  } else {
    verdictTitle = 'Sub-optimal Composition';
    verdictDesc = 'Weak draft stability. Missing controllers, Sentinels, or map picks makes site executes difficult.';
  }

  return {
    score,
    verdictTitle,
    verdictDesc,
    roleCounts: { duelists, initiators, controllers, sentinels },
    roleBars: [
      { id: 'duelists', current: duelists, target: 1 },
      { id: 'initiators', current: initiators, target: 1 },
      { id: 'controllers', current: controllers, target: 1 },
      { id: 'sentinels', current: sentinels, target: 1 }
    ],
    metrics: { entry: entryScore, defense: defenseScore, retake: retakeScore, synergy: synergyScore },
    insights
  };
}

export function buildAroundMe(
  draftSlots: (string | null)[],
  mapKey: string,
  playerAgentPool: Record<string, AgentPoolStats>
): (string | null)[] {
  let mainAgent: string | null = null;
  for (let i = 0; i < 5; i++) {
    if (draftSlots[i]) { mainAgent = draftSlots[i]; break; }
  }

  if (!mainAgent) {
    const topAgents = Object.keys(playerAgentPool);
    mainAgent = topAgents.length > 0 ? topAgents[0] : 'jett';
  }

  const newSlots: (string | null)[] = [mainAgent, null, null, null, null];
  const mapRecs = DRAFT_MAP_RECOMMENDATIONS[mapKey] || { preferred: [], note: '' };

  const requiredRoles: AgentRole[] = ['controller', 'sentinel', 'initiator', 'duelist'];
  const mainRole = getRoleClass(mainAgent);
  const mainRoleIdx = requiredRoles.indexOf(mainRole);
  if (mainRoleIdx > -1) requiredRoles.splice(mainRoleIdx, 1);

  const neededRoles = [...requiredRoles];
  neededRoles.push(mainRole);

  const pickedAgents = new Set([mainAgent]);

  neededRoles.forEach((role, idx) => {
    const candidates = ROLE_POOLS[role];
    let bestCandidate: string | null = null;
    let maxScore = -1000;

    candidates.forEach(cand => {
      if (pickedAgents.has(cand)) return;
      let s = 0;
      if (mapRecs.preferred.includes(cand)) s += 40;
      if (playerAgentPool[cand]) s += 20 + (playerAgentPool[cand].wr || 50) * 0.5;
      if (mainAgent === 'jett' || mainAgent === 'neon') {
        if (cand === 'breach' || cand === 'omen') s += 15;
      }
      if (mainAgent === 'viper') {
        if (cand === 'brimstone' || cand === 'killjoy') s += 15;
      }
      if (mainAgent === 'cypher' || mainAgent === 'deadlock') {
        if (cand === 'raze') s += 15;
      }
      if (mainAgent === 'sova' || mainAgent === 'fade') {
        if (cand === 'gekko') s += 15;
      }
      if (s > maxScore) { maxScore = s; bestCandidate = cand; }
    });

    if (bestCandidate) {
      pickedAgents.add(bestCandidate);
      newSlots[idx + 1] = bestCandidate;
    }
  });

  return newSlots;
}

export function getAgentDisplayName(agentKey: string): string {
  if (!agentKey) return '';
  return agentKey.charAt(0).toUpperCase() + agentKey.slice(1);
}
