// ValTracker — AI Coaching Engine
// Pure computation: builds stats and generates coaching advice.

import { AGENT_ROLES, getRankFromRR, RANKS } from './constants';
import { getLobbyRankInfo } from './processMatches';

const RANK_BENCHMARKS: Record<string, { kd: number; wr: number; acs: number; hs: number; label: string }> = {
  'Iron':      { kd: 0.75, wr: 44, acs: 110, hs: 12, label: 'Iron' },
  'Bronze':    { kd: 0.88, wr: 46, acs: 135, hs: 14, label: 'Bronze' },
  'Silver':    { kd: 1.00, wr: 48, acs: 155, hs: 17, label: 'Silver' },
  'Gold':      { kd: 1.12, wr: 50, acs: 175, hs: 20, label: 'Gold' },
  'Platinum':  { kd: 1.22, wr: 51, acs: 195, hs: 22, label: 'Platinum' },
  'Diamond':   { kd: 1.35, wr: 52, acs: 215, hs: 24, label: 'Diamond' },
  'Ascendant': { kd: 1.50, wr: 53, acs: 240, hs: 26, label: 'Ascendant' },
  'Immortal':  { kd: 1.65, wr: 54, acs: 265, hs: 28, label: 'Immortal' },
  'Radiant':   { kd: 1.85, wr: 56, acs: 290, hs: 30, label: 'Radiant' },
};

const RANK_ORDER = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];

function getRankTier(rankName: string): string {
  if (!rankName) return 'Silver';
  const lower = rankName.toLowerCase();
  return RANK_ORDER.find(r => lower.startsWith(r.toLowerCase())) || 'Silver';
}

function findMe(match: any, playerName: string, playerTag: string): any | null {
  const all = match.players?.all_players || match.players || [];
  const tn = (playerName || '').toLowerCase().replace(/\s+/g, '');
  const tt = (playerTag || '').toLowerCase().replace(/\s+/g, '');
  return (Array.isArray(all) ? all : []).find(
    (p: any) => (p.name || '').toLowerCase().replace(/\s+/g, '') === tn &&
                (p.tag || '').toLowerCase().replace(/\s+/g, '') === tt
  ) || null;
}

function getPlayerList(match: any): any[] {
  if (!match) return [];
  if (Array.isArray(match.players)) return match.players;
  return match.players?.all_players || match.players || [];
}

export interface AIStats {
  totalMatches: number;
  wins: number;
  losses: number;
  wr: number;
  recentWR5: number;
  kd: string;
  avgKills: string;
  avgDeaths: string;
  avgAssists: string;
  avgACS: number;
  hsPct: number;
  clutchWins: number;
  firstBloodEst: number;
  multiKillEst: number;
  topAgents: { name: string; matches: number; wr: number; kd: string; acs: number }[];
  bestMap: { name: string; wr: number; matches: number } | null;
  worstMap: { name: string; wr: number; matches: number } | null;
  avgLobbyRank: string | null;
  trendDelta: number;
  trendDir: string;
  r5kd: string;
  p5kd: string;
  consistencyScore: number;
  carryPct: number;
  readinessScore: number;
  attWR: number | null;
  defWR: number | null;
}

export function buildStatsForAI(matches: any[], playerName: string, playerTag: string): AIStats {
  let tK = 0, tD = 0, tA = 0, tS = 0, tHS = 0, tShots = 0, wins = 0, losses = 0, n = 0;
  const agentMap: Record<string, { matches: number; wins: number; kills: number; deaths: number; score: number }> = {};
  const mapData: Record<string, { matches: number; wins: number; kills: number; deaths: number; score: number }> = {};
  const lobbyRanks: number[] = [];
  const sideWins = { att: 0, def: 0, attTotal: 0, defTotal: 0 };
  let clutchWins = 0, firstBloodEst = 0, multiKillEst = 0;
  const perMatchKD: number[] = [];

  for (const match of matches) {
    const me = findMe(match, playerName, playerTag);
    if (!me) continue;
    n++;
    const s = me.stats || {};
    const k = s.kills || 0, d = s.deaths || 0, a = s.assists || 0, sc = s.score || 0;
    const hs = s.headshots || 0;
    const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);
    tK += k; tD += d; tA += a; tS += sc; tHS += hs; tShots += shots;

    const myTeamId = (me.team || '').toLowerCase();
    const won = match.teams?.[myTeamId]?.has_won || false;
    if (won) wins++; else losses++;
    perMatchKD.push(d ? k / d : k);

    const agentName = me.character || 'Unknown';
    if (!agentMap[agentName]) agentMap[agentName] = { matches: 0, wins: 0, kills: 0, deaths: 0, score: 0 };
    const ag = agentMap[agentName];
    ag.matches++; if (won) ag.wins++; ag.kills += k; ag.deaths += d; ag.score += sc;

    const mapName = match.metadata?.map || 'Unknown';
    if (!mapData[mapName]) mapData[mapName] = { matches: 0, wins: 0, kills: 0, deaths: 0, score: 0 };
    const mp = mapData[mapName];
    mp.matches++; if (won) mp.wins++; mp.kills += k; mp.deaths += d; mp.score += sc;

    // Side win rates
    const rounds = match.rounds || [];
    rounds.forEach((r: any, ri: number) => {
      const rWon = (r.winning_team || '').toLowerCase() === myTeamId;
      const isAtt = ri < Math.ceil(rounds.length / 2);
      if (isAtt) { sideWins.attTotal++; if (rWon) sideWins.att++; }
      else { sideWins.defTotal++; if (rWon) sideWins.def++; }
      const myAlive = r[myTeamId]?.players_alive ?? null;
      if (myAlive === 1 && rWon) clutchWins++;
    });

    // Lobby rank
    const info = getLobbyRankInfo(getPlayerList(match), myTeamId);
    if (info?.overall?.rr != null) lobbyRanks.push(info.overall.rr);

    firstBloodEst += Math.round(k * 0.18);
    if (k >= 3) multiKillEst++;
  }

  const kd = tD ? (tK / tD) : tK;
  const wr = n ? Math.round((wins / (wins + losses)) * 100) : 0;
  const hsPct = tShots ? Math.round((tHS / tShots) * 100) : 0;
  const avgACS = n ? Math.round(tS / n / 100) : 0;
  const avgKills = (tK / n).toFixed(1);
  const avgDeaths = (tD / n).toFixed(1);
  const avgAssists = (tA / n).toFixed(1);

  // Trend: last 5 vs previous 5
  const recent5 = perMatchKD.slice(0, 5);
  const prev5 = perMatchKD.slice(5, 10);
  const r5kd = recent5.length ? (recent5.reduce((s, v) => s + v, 0) / recent5.length) : kd;
  const p5kd = prev5.length ? (prev5.reduce((s, v) => s + v, 0) / prev5.length) : kd;
  const trendDelta = parseFloat((r5kd - p5kd).toFixed(2));
  const trendDir = Math.abs(trendDelta) < 0.05 ? 'stable' : trendDelta > 0 ? 'improving' : 'declining';

  const recentMatches5 = matches.slice(0, 5);
  const recentWins5 = recentMatches5.filter(m => {
    const me2 = findMe(m, playerName, playerTag);
    if (!me2) return false;
    const tid = (me2.team || '').toLowerCase();
    return m.teams?.[tid]?.has_won || false;
  }).length;
  const recentWR5 = recentMatches5.length ? Math.round((recentWins5 / recentMatches5.length) * 100) : wr;

  // Consistency: std-dev of per-match KD
  const meanKD = kd;
  const stdDev = perMatchKD.length > 1
    ? Math.sqrt(perMatchKD.reduce((s, v) => s + Math.pow(v - meanKD, 2), 0) / perMatchKD.length)
    : 0;
  const consistencyScore = Math.max(0, Math.round(100 - stdDev * 60));

  // Carry %
  let carryCount = 0;
  for (const match of matches) {
    const me = findMe(match, playerName, playerTag);
    if (!me) continue;
    const myTeamId = (me.team || '').toLowerCase();
    const allied = getPlayerList(match).filter((p: any) => (p.team || '').toLowerCase() === myTeamId);
    const myScore = me.stats?.score || 0;
    const isTopFrag = allied.every((p: any) => (p.stats?.score || 0) <= myScore);
    if (isTopFrag) carryCount++;
  }
  const carryPct = n ? Math.round((carryCount / n) * 100) : 0;

  // Rank Readiness Score (0-100)
  const kdScore = Math.min(100, Math.round(parseFloat(kd.toFixed(2)) / 2.0 * 100));
  const wrScore = Math.min(100, Math.round(wr / 65 * 100));
  const hsScore = Math.min(100, Math.round(hsPct / 30 * 100));
  const acsScore = Math.min(100, Math.round(avgACS / 280 * 100));
  const trendBonus = trendDir === 'improving' ? 8 : trendDir === 'declining' ? -8 : 0;
  const readinessScore = Math.max(0, Math.min(100,
    Math.round(kdScore * 0.3 + wrScore * 0.3 + hsScore * 0.2 + acsScore * 0.2 + trendBonus)
  ));

  const topAgents = Object.entries(agentMap)
    .sort((a, b) => b[1].matches - a[1].matches)
    .slice(0, 5)
    .map(([name, s]) => ({
      name,
      matches: s.matches,
      wr: Math.round((s.wins / s.matches) * 100),
      kd: s.deaths ? (s.kills / s.deaths).toFixed(2) : String(s.kills),
      acs: Math.round(s.score / s.matches / 100)
    }));

  const bestMap = Object.entries(mapData).filter(([, m]) => m.matches >= 2)
    .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0];
  const worstMap = Object.entries(mapData).filter(([, m]) => m.matches >= 2)
    .sort((a, b) => (a[1].wins / a[1].matches) - (b[1].wins / b[1].matches))[0];

  const attWR = sideWins.attTotal ? Math.round((sideWins.att / sideWins.attTotal) * 100) : null;
  const defWR = sideWins.defTotal ? Math.round((sideWins.def / sideWins.defTotal) * 100) : null;

  return {
    totalMatches: n, wins, losses, wr, recentWR5,
    kd: kd.toFixed(2), avgKills, avgDeaths, avgAssists,
    avgACS, hsPct,
    clutchWins, firstBloodEst, multiKillEst,
    topAgents,
    bestMap: bestMap ? { name: bestMap[0], wr: Math.round((bestMap[1].wins / bestMap[1].matches) * 100), matches: bestMap[1].matches } : null,
    worstMap: worstMap ? { name: worstMap[0], wr: Math.round((worstMap[1].wins / worstMap[1].matches) * 100), matches: worstMap[1].matches } : null,
    avgLobbyRank: lobbyRanks.length ? getRankFromRR(Math.round(lobbyRanks.reduce((s, v) => s + v, 0) / lobbyRanks.length)).name : null,
    trendDelta, trendDir, r5kd: r5kd.toFixed(2), p5kd: p5kd.toFixed(2),
    consistencyScore, carryPct, readinessScore, attWR, defWR
  };
}

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  agentAdvice: string[];
  mental: string[];
  verdict: string;
  topFocus: { title: string; desc: string };
}

export function analyseStats(stats: AIStats, rankName: string): AnalysisResult {
  const kd = parseFloat(stats.kd);
  const wr = stats.wr;
  const hs = stats.hsPct;
  const acs = stats.avgACS;
  const avgK = parseFloat(stats.avgKills);
  const avgD = parseFloat(stats.avgDeaths);
  const avgA = parseFloat(stats.avgAssists);
  const clutchRate = stats.totalMatches ? (stats.clutchWins / stats.totalMatches) : 0;
  const top = stats.topAgents[0];
  const secondAgent = stats.topAgents[1];
  const trend = stats.trendDir || 'stable';
  const r5kd = parseFloat(stats.r5kd || String(kd));
  const p5kd = parseFloat(stats.p5kd || String(kd));
  const consistency = stats.consistencyScore || 50;
  const carry = stats.carryPct || 0;
  const attWR = stats.attWR;
  const defWR = stats.defWR;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tips: string[] = [];
  const agentAdvice: string[] = [];
  const mental: string[] = [];

  const tier = getRankTier(rankName);
  const bench = RANK_BENCHMARKS[tier] || RANK_BENCHMARKS['Silver'];

  // Strengths
  if (kd >= bench.kd) strengths.push(`Your K/D of ${kd} exceeds the ${tier} average (${bench.kd}) — you are consistently winning engagements and trading effectively.`);
  else if (kd >= 1.0) strengths.push(`Maintaining a solid K/D of ${kd} — you trade favourably in most round fights.`);
  if (wr >= bench.wr) strengths.push(`Strong ${wr}% win rate over ${stats.totalMatches} games exceeds the ${tier} standard (${bench.wr}%) — you make direct round-winning impacts.`);
  if (hs >= bench.hs) strengths.push(`Excellent ${hs}% headshot rate (avg for ${tier}: ${bench.hs}%) shows precise crosshair heights and clean aim mechanics.`);
  if (acs >= bench.acs) strengths.push(`High ACS of ${acs} (rank avg: ${bench.acs}) — you are heavily involved in combat and active round influence.`);
  if (avgA >= 5) strengths.push(`High assist count (${avgA} avg) shows strong utility enabling and team play.`);
  if (clutchRate >= 0.15) strengths.push(`Great clutch rate (${stats.clutchWins} clutch wins) — you stay exceptionally composed under pressure.`);
  if (stats.bestMap) strengths.push(`Excel on ${stats.bestMap.name} with ${stats.bestMap.wr}% win rate — a highly reliable comfort pick.`);
  if (strengths.length === 0) strengths.push(`High commitment to improvement with ${stats.totalMatches} competitive matches tracked.`);
  if (strengths.length === 1) strengths.push(`Averaging ${avgK} kills per game — a solid combat foundation.`);

  // Weaknesses
  if (kd < bench.kd) weaknesses.push(`Your K/D of ${kd} is below the average for ${tier} (${bench.kd}) — you are dying more than killing, likely taking dry peeks or over-extending.`);
  if (avgD >= 15) weaknesses.push(`Dying ${avgD} times per game is too high. Avoid peeking the same angle twice and focus on escaping after getting one kill.`);
  if (hs < bench.hs) weaknesses.push(`Your headshot rate (${hs}%) is below the ${tier} benchmark (${bench.hs}%) — you are missing clean pick opportunities by relying on body sprays.`);
  if (wr < bench.wr) weaknesses.push(`Your win rate of ${wr}% is below the ${tier} benchmark (${bench.wr}%) — you are struggling to close rounds when ahead.`);
  if (acs < bench.acs) weaknesses.push(`Your ACS of ${acs} is below the ${tier} average (${bench.acs}) — try playing more proactive angles and using damaging utility aggressively.`);
  if (stats.worstMap) weaknesses.push(`Struggling on ${stats.worstMap.name} (${stats.worstMap.wr}% WR) — study standard entry smokes or basic defense setups for this map.`);
  if (clutchRate < 0.06 && stats.totalMatches >= 8) weaknesses.push(`Struggling in clutch situations (${stats.clutchWins} wins) — isolate 1v1 fights systematically rather than panicking.`);

  // Action tips
  if (tier === 'Iron' || tier === 'Bronze') {
    tips.push(`As a ${tier} player, focus 100% on basics: keep your crosshair strictly at head height, and make a habit of stopping completely before clicking.`);
    tips.push(`Do not spray Vandal or Phantom from long ranges. Stick to 2-3 bullet bursts and let the recoil reset.`);
  } else if (tier === 'Silver' || tier === 'Gold') {
    tips.push(`To break out of ${tier}, master trading: follow your entry teammate's push immediately. If they die, you get the easy trade-kill.`);
    tips.push(`Proactive utility usage is key: cast your flashes or recon darts to clear entrance lanes at round start rather than holding them.`);
  } else if (tier === 'Platinum' || tier === 'Diamond') {
    tips.push(`At the ${tier} level, play the numbers: if your team gets a 5v4 pick advantage, slow down the pace and default instead of chasing more kills.`);
    tips.push(`Economy efficiency: coordinate purchases with teammates. Never force buy a rifle when your team is saving credits.`);
  } else {
    tips.push(`At elite ranks (${tier}), coordinate team utility setups. Never peek standard defender lines raw without a teammate's flash or scan.`);
    tips.push(`Record and review your matches: most deaths at this level are due to micro-positioning errors and timing, not raw aim.`);
  }
  if (hs < bench.hs) tips.push(`Spend 10 minutes before every session in The Range: shoot bots on medium speed using tap-fires ONLY at head-level to raise your ${hs}% HS rate.`);
  if (avgA < 4) tips.push(`Your assists (${avgA} avg) are low. Coordinate with your team and flash/smoke to support their entries. Aim for 5+ assists per match.`);
  tips.push(`Warm up for 15 minutes before queuing ranked (Deathmatch or Range). Players who warm up have 20% higher headshot accuracy on their first match.`);

  // Agent advice
  if (top) {
    const topKD = parseFloat(top.kd);
    const topWR = top.wr;
    const role = AGENT_ROLES[top.name.toLowerCase()] || 'duelist';
    if (topWR >= 55 && topKD >= 1.1) agentAdvice.push(`${top.name} is your best agent — ${topWR}% WR and ${top.kd} K/D. Keep spamming it in ranked, especially when you need a clutch win.`);
    else if (topWR < 45) agentAdvice.push(`You play ${top.name} most but only win ${topWR}% — consider if this agent fits your playstyle or if you need to study ${top.name} fundamentals more before ranking with it.`);
    else agentAdvice.push(`${top.name} is your main with a ${topWR}% WR — solid but not dominant. Focus on mastering their utility usage to push that win rate above 55%.`);
    if (role === 'duelist') agentAdvice.push(`As a ${top.name} main (Duelist), your job is to open sites — if your ACS is below 220, you may be playing too passive.`);
    else if (role === 'controller') agentAdvice.push(`As a ${top.name} main (Controller), your utility win rate matters more than kills — track whether your smokes are winning rounds.`);
    else if (role === 'sentinel') agentAdvice.push(`As a ${top.name} main (Sentinel), focus on information plays and holding flanks — your assist count should be high.`);
    else if (role === 'initiator') agentAdvice.push(`As a ${top.name} main (Initiator), you enable your team — a low ACS is acceptable if your assists are high.`);
  }
  if (secondAgent && secondAgent.wr > (top ? top.wr : 0)) {
    agentAdvice.push(`Interesting: ${secondAgent.name} has a higher win rate (${secondAgent.wr}%) than your main. Consider shifting focus to ${secondAgent.name} for a ranking streak.`);
  }

  // Mental game
  if (wr < 48) {
    mental.push(`With a sub-50% win rate, avoid playing more than 3 ranked games in a row on a losing day. Tilt compounds — taking a 30-min break resets your decision-making.`);
    mental.push(`Focus on "did I play well?" not "did we win?" — a 1.5 K/D in a loss is still good data that you are improving.`);
  } else if (wr >= 55) {
    mental.push(`You are winning consistently — protect your mental by dodging lobbies with clear toxicity early.`);
    mental.push(`Set a session goal (e.g. +2 RR or 3 wins) and log off when you hit it. Greedy sessions after hot streaks are where rank decay happens.`);
  } else {
    mental.push(`Your win rate is stable — use loss streaks (2 in a row) as a signal to switch to unrated and cool down.`);
    mental.push(`Mute toxic teammates immediately and without guilt. Research consistently shows muting does not hurt coordination.`);
  }
  mental.push(`After a loss, type one thing you would do differently in a notes app before queuing again. This 30-second habit accelerates improvement.`);

  // Trend
  if (trend === 'improving') strengths.push(`Your K/D improved from ${p5kd} → ${r5kd} over the last 5 games — this is a real upward trend, not luck.`);
  else if (trend === 'declining') {
    weaknesses.push(`Your K/D dropped from ${p5kd} → ${r5kd} over the last 5 games — this is a declining trend.`);
    tips.push(`When in a declining patch: narrow your agent pool to 1, play your best map only, and focus purely on not dying.`);
  }

  // Consistency
  if (consistency < 45) {
    weaknesses.push(`Your K/D varies a lot match-to-match (consistency score: ${consistency}/100) — focus on reducing bad games.`);
    tips.push(`To build consistency: identify 2-3 pre-match mental cues and stick to them every session.`);
  } else if (consistency >= 75) {
    strengths.push(`High consistency score (${consistency}/100) — your performance is stable and predictable.`);
  }

  // Carry
  if (carry >= 45) strengths.push(`You top-frag your team ${carry}% of the time — you're the team's primary carry.`);
  else if (carry <= 15 && stats.totalMatches >= 8) weaknesses.push(`You rarely top-frag (${carry}% of games) — focus on taking more proactive duels.`);

  // Attack/Defense
  if (attWR != null && defWR != null) {
    const sideDiff = Math.abs(attWR - defWR);
    if (sideDiff >= 15) {
      const weakSide = attWR > defWR ? 'defense' : 'attack';
      weaknesses.push(`You win ${attWR}% on attack but ${defWR}% on defense — a ${sideDiff}% gap. Prioritise studying ${weakSide}-side setups.`);
    }
  }

  // Summary
  let summary = '';
  const performanceLevel = kd >= 1.3 && wr >= 52 ? 'strong' : kd >= 1.0 && wr >= 48 ? 'average' : 'below average';
  const trendSuffix = trend === 'improving' ? ' Your recent trend is improving — keep the momentum.' : trend === 'declining' ? ' Your recent form is declining — be careful.' : '';
  if (performanceLevel === 'strong') summary = `You are performing at a <strong>strong level</strong> with a ${kd} K/D and ${wr}% win rate — ranked progress is a matter of consistency.${trendSuffix}`;
  else if (performanceLevel === 'average') summary = `You are at an <strong>average level</strong> — the fundamentals are there, but small inefficiencies are holding back your rank.${trendSuffix}`;
  else summary = `Your stats show clear room to grow — fixing core habits will have an immediate rank impact.${trendSuffix}`;

  // Priority Focus
  const focusOptions = [
    { condition: kd < 1.0, score: 100, title: 'Cut Your Death Count', desc: `You die ${avgD}x per game. Cutting just 3 avoidable deaths per match shifts your K/D positive and is the single biggest lever you have right now.` },
    { condition: hs < 15, score: 90, title: 'Fix Crosshair Placement', desc: `Your ${hs}% headshot rate is the main bottleneck. Spend 10 minutes daily in The Range on Hard Bots shooting ONLY at the head.` },
    { condition: wr < 47, score: 80, title: 'Win More Rounds (Not Just Gunfights)', desc: `${wr}% win rate means you're losing more than you win. Check your economy and late-round calls.` },
    { condition: trend === 'declining', score: 75, title: 'Break the Declining Trend', desc: `Your K/D dropped from ${p5kd} to ${r5kd} recently. Take 1 day off ranked, play deathmatch to refresh, then return with 1 clear goal.` },
    { condition: acs < 170, score: 70, title: 'Increase Your ACS', desc: `ACS of ${acs} is below average. Take more first contacts, use utility aggressively, and look for picks mid-round.` },
    { condition: consistency < 40, score: 65, title: 'Stabilise Your Performance', desc: `High variance (${consistency}/100 consistency) — reduce to 1 agent, 1 map, and 3 games max per session.` },
    { condition: avgA < 3, score: 55, title: 'Use Your Utility More', desc: `${avgA} assists per game is low. Buy at least 1 ability per round, use it before 60 seconds.` },
  ];
  const topFocus = focusOptions.filter(f => f.condition).sort((a, b) => b.score - a.score)[0] || {
    title: 'Master Your Main Agent',
    desc: `Your fundamentals are solid. Master your main agent's utility — learn 2 new lineups per map this week.`
  };

  const verdict = `Based on ${stats.totalMatches} matches, your single biggest lever right now is <strong>${topFocus.title}</strong>. ${topFocus.desc} Focus on this ONE thing — trying to fix everything at once fixes nothing.`;

  return { summary, strengths, weaknesses, tips, agentAdvice, mental, verdict, topFocus };
}
