// ValTracker — Match Processing Engine
// Pure computation: returns stats objects instead of writing to DOM.

import { ACTS_TIMELINE, SEASONS_MAP, getRankImgUrl, getRankFromRR, AGENT_UUIDS, RANKS } from './constants';
import { assetCache } from './assets';

const TIER_RR_MAP: Record<string, number> = {
  'Iron 1': 3, 'Iron 2': 4, 'Iron 3': 5,
  'Bronze 1': 6, 'Bronze 2': 7, 'Bronze 3': 8,
  'Silver 1': 9, 'Silver 2': 10, 'Silver 3': 11,
  'Gold 1': 12, 'Gold 2': 13, 'Gold 3': 14,
  'Platinum 1': 15, 'Platinum 2': 16, 'Platinum 3': 17,
  'Diamond 1': 18, 'Diamond 2': 19, 'Diamond 3': 20,
  'Ascendant 1': 21, 'Ascendant 2': 22, 'Ascendant 3': 23,
  'Immortal 1': 24, 'Immortal 2': 25, 'Immortal 3': 26,
  'Radiant': 27
};

function getTierRR(tierName: string): number | null {
  const id = TIER_RR_MAP[tierName];
  return id != null ? (id - 3) * 100 : null;
}

export function getLobbyRankInfo(allPlayers: any[], myTeamId: string): any | null {
  const withRank = allPlayers.filter((p: any) =>
    p.currenttier_patched && p.currenttier_patched !== 'Unranked' && p.currenttier && p.currenttier > 0
  );
  if (!withRank.length) return null;
  const allied = withRank.filter((p: any) => (p.team || '').toLowerCase() === myTeamId);
  const enemy = withRank.filter((p: any) => (p.team || '').toLowerCase() !== myTeamId);
  const avgTierRR = (arr: any[]) => {
    if (!arr.length) return null;
    const total = arr.reduce((s: number, p: any) => {
      const rr = getTierRR(p.currenttier_patched) || ((p.currenttier || 3) - 3) * 100;
      return s + rr;
    }, 0);
    return Math.round(total / arr.length);
  };
  const allAvg = avgTierRR(withRank);
  const allyAvg = avgTierRR(allied);
  const enemyAvg = avgTierRR(enemy);
  return {
    overall: allAvg != null ? getRankFromRR(allAvg) : null,
    ally: allyAvg != null ? getRankFromRR(allyAvg) : null,
    enemy: enemyAvg != null ? getRankFromRR(enemyAvg) : null,
    allPlayers: withRank
  };
}

function normalizeName(str: string): string {
  return (str || '').toLowerCase().replace(/\s+/g, '');
}

function getPlayerList(match: any): any[] {
  if (!match) return [];
  if (Array.isArray(match.players)) return match.players;
  return match.players?.all_players || match.players || [];
}

function findMe(match: any, playerName: string, playerTag: string): any | null {
  const all = getPlayerList(match);
  const tn = normalizeName(playerName);
  const tt = normalizeName(playerTag);
  return (Array.isArray(all) ? all : []).find(
    p => normalizeName(p.name) === tn && normalizeName(p.tag) === tt
  ) || null;
}

function detectWon(match: any, me: any): boolean {
  const myTeamId = (me.team || '').toLowerCase();
  const teams = match.teams || {};
  const myTeam = teams[myTeamId] || null;
  const oppId = myTeamId === 'red' ? 'blue' : 'red';
  const oppTeam = teams[oppId] || null;

  if (myTeam?.has_won === true) return true;
  if (myTeam?.has_won === false) return false;
  if (myTeam?.rounds_won != null && oppTeam?.rounds_won != null) {
    return myTeam.rounds_won > oppTeam.rounds_won;
  }
  // DM fallback: highest scorer wins
  const otherScores = getPlayerList(match)
    .filter(p => (p.puuid || p.subject || p.id) !== (me.puuid || me.subject || me.id))
    .map(p => p.stats?.score || 0)
    .sort((a, b) => b - a);
  const myScore = me.stats?.score || 0;
  return otherScores.length === 0 || myScore > otherScores[0];
}

export interface AgentStats {
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
}

export interface MapAgentStats {
  matches: number;
  wins: number;
  kd: number;
}

export interface MapStats {
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  score: number;
  agents: Record<string, MapAgentStats>;
}

export interface WeaponStats {
  kills: number;
  hs: number;
  matchHistory: { gameStart: number; kills: number; hs: number; hsPct: number }[];
}

export interface LobbyRankInfo {
  overall: { name: string; rr: number } | null;
  ally: { name: string; rr: number } | null;
  enemy: { name: string; rr: number } | null;
}

export interface RecentMatch {
  won: boolean;
  agentName: string;
  map: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  acs: number;
  rounds: string;
  hs: number;
  shots: number;
  myTeamId: string;
  matchId: string;
  gameStart: number;
  lobbyRank: LobbyRankInfo | null;
}

export interface ProcessedStats {
  matchesCount: number;
  kd: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgACS: number;
  hsRate: number;
  winRate: number;
  wins: number;
  losses: number;
  agentMap: Record<string, AgentStats>;
  mapData: Record<string, MapStats>;
  rrHistory: { won: boolean; kills: number; matchId: string }[];
  recentMatches: RecentMatch[];
  precomputedWeapons: Record<string, WeaponStats>;
}

export function processMatches(
  matches: any[],
  playerName: string,
  playerTag: string,
  selectedAct: string = 'v26a3'
): ProcessedStats {
  let matchesToProcess = matches;

  if (selectedAct !== 'all') {
    const actData = ACTS_TIMELINE[selectedAct];
    if (actData) {
      matchesToProcess = matches.filter(m => {
        const gameStart = m.metadata?.game_start || m.metadata?.gameStart || null;
        if (!gameStart) return false;
        const ts = gameStart * 1000;
        return ts >= actData.start && ts < actData.end;
      });
    }
  }

  let tK = 0, tD = 0, tA = 0, tS = 0, tHS = 0, tShots = 0, wins = 0, losses = 0, counted = 0;
  const agentMap: Record<string, AgentStats> = {};
  const mapData: Record<string, MapStats> = {};
  const rrHistory: { won: boolean; kills: number; matchId: string }[] = [];
  const recentMatches: RecentMatch[] = [];
  const precomputedWeapons: Record<string, WeaponStats> = {};

  for (const match of matchesToProcess) {
    const me = findMe(match, playerName, playerTag);
    if (!me) continue;
    counted++;

    const s = me.stats || {};
    const k = s.kills || 0, d = s.deaths || 0, a = s.assists || 0, sc = s.score || 0;
    const hs = s.headshots || 0;
    const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);
    tK += k; tD += d; tA += a; tS += sc; tHS += hs; tShots += shots;

    const won = detectWon(match, me);
    if (won) wins++; else losses++;

    const agentName = me.character || me.agent?.name || 'Unknown';
    if (!agentMap[agentName]) agentMap[agentName] = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, score: 0 };
    const ag = agentMap[agentName];
    ag.matches++; if (won) ag.wins++; ag.kills += k; ag.deaths += d; ag.assists += a; ag.score += sc;

    const mapName = match.metadata?.map || 'Unknown';
    if (!mapData[mapName]) mapData[mapName] = { matches: 0, wins: 0, kills: 0, deaths: 0, score: 0, agents: {} };
    const mp = mapData[mapName];
    mp.matches++; if (won) mp.wins++; mp.kills += k; mp.deaths += d; mp.score += sc;
    if (!mp.agents[agentName]) mp.agents[agentName] = { matches: 0, wins: 0, kd: 0 };
    const ma = mp.agents[agentName];
    ma.matches++; if (won) ma.wins++; ma.kd += d ? (k / d) : k;

    const myTeamId = (me.team || '').toLowerCase();
    const myTeam = match.teams?.[myTeamId] || null;
    const oppId = myTeamId === 'red' ? 'blue' : 'red';
    const oppTeam = match.teams?.[oppId] || null;
    const myR = myTeam?.rounds_won ?? '?';
    const oppR = oppTeam?.rounds_won ?? '?';

    rrHistory.push({ won, kills: k, matchId: match.metadata?.matchid || match.metadata?.match_id });

    const rawGameStart = match.metadata?.game_start || match.metadata?.gameStart || null;
    const gameStart = rawGameStart ? rawGameStart * 1000 : null;
    const totalRoundsPlayed = (typeof myR === 'number' && typeof oppR === 'number') ? (myR + oppR) : (match.rounds?.length || 1);
    const matchACS = Math.round(sc / Math.max(1, totalRoundsPlayed));

    const allP = getPlayerList(match);
    const lobbyRank = getLobbyRankInfo(allP, myTeamId);

    recentMatches.push({
      won, agentName, map: mapName,
      kills: k, deaths: d, assists: a, score: sc, acs: matchACS,
      rounds: `${myR}-${oppR}`, hs, shots, myTeamId,
      matchId: match.metadata?.matchid || match.metadata?.match_id,
      gameStart, lobbyRank
    });

    // Pre-compute weapon stats
    const rounds = match.rounds || [];
    for (const r of rounds) {
      let ps = r.player_stats || [];
      if (typeof ps === 'string') { try { ps = JSON.parse(ps); } catch { ps = []; } }
      if (!Array.isArray(ps)) ps = Object.values(ps);
      const myPs = ps.find((p: any) => (p.player_puuid || p.subject || p.puuid) === me.puuid);
      if (!myPs) continue;
      const kills = Array.isArray(myPs.kill_events) ? myPs.kill_events : [];
      for (const kill of kills) {
        const raw = kill.damage_weapon_name || kill.finishing_damage?.damage_item || kill.damage_weapon_id || '';
        const cachedWpn = assetCache.weapons[raw.toLowerCase()];
        let wpn = cachedWpn ? cachedWpn.name : raw.replace(/^[^/]*\//, '').replace(/TX_Hud_/i, '').replace(/_/g, ' ').trim();
        if (/^[0-9a-f]{8}-/.test(wpn)) wpn = 'Ability';
        if (!wpn || wpn.length < 2) continue;
        if (!precomputedWeapons[wpn]) precomputedWeapons[wpn] = { kills: 0, hs: 0, matchHistory: [] };
        precomputedWeapons[wpn].kills++;
        let isHS = typeof kill.headshot === 'boolean' ? kill.headshot : kill.finishing_damage?.is_headshot;
        if (!isHS && myPs.damage_events) {
          const dE = myPs.damage_events.find((de: any) => de.receiver_puuid === (kill.victim_puuid || kill.victim));
          if (dE && dE.headshots > 0) isHS = true;
        }
        if (isHS) precomputedWeapons[wpn].hs++;
        const last = precomputedWeapons[wpn].matchHistory;
        const existing = last.length && last[last.length - 1].gameStart === gameStart ? last[last.length - 1] : null;
        if (existing) { existing.kills++; if (isHS) existing.hs++; existing.hsPct = existing.kills ? Math.round((existing.hs / existing.kills) * 100) : 0; }
        else { last.push({ gameStart, kills: 1, hs: isHS ? 1 : 0, hsPct: isHS ? 100 : 0 }); }
      }
    }
  }

  const n = counted || 1;
  const total = wins + losses;

  return {
    matchesCount: counted,
    kd: tD ? +(tK / tD).toFixed(2) : +tK.toFixed(2),
    avgKills: +(tK / n).toFixed(1),
    avgDeaths: +(tD / n).toFixed(1),
    avgAssists: +(tA / n).toFixed(1),
    avgACS: Math.round(tS / n / 100),
    hsRate: tShots ? Math.round((tHS / tShots) * 100) : 0,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    wins,
    losses,
    agentMap,
    mapData,
    rrHistory,
    recentMatches,
    precomputedWeapons
  };
}

export function getGrade(kills: number, deaths: number, assists: number, acs: number, won: boolean): string {
  const kd = deaths ? kills / deaths : kills;
  let score = 0;
  if (kd >= 1.5) score += 3; else if (kd >= 1.2) score += 2; else if (kd >= 0.9) score += 1;
  if (acs >= 250) score += 3; else if (acs >= 200) score += 2; else if (acs >= 150) score += 1;
  if (won) score += 2;
  if (kills >= 20) score += 2; else if (kills >= 15) score += 1;
  if (score >= 9) return 'S';
  if (score >= 7) return 'A';
  if (score >= 5) return 'B';
  if (score >= 3) return 'C';
  return 'D';
}

export function computeStreak(
  matches: any[],
  playerName: string,
  playerTag: string
): { count: number; type: 'win' | 'loss' | null } {
  if (!matches.length) return { count: 0, type: null };
  const first = matches[0];
  const me0 = findMe(first, playerName, playerTag);
  if (!me0) return { count: 0, type: null };
  const firstWon = first.teams?.[(me0.team || '').toLowerCase()]?.has_won || false;
  let count = 1;
  for (let i = 1; i < matches.length; i++) {
    const me = findMe(matches[i], playerName, playerTag);
    if (!me) break;
    const won = matches[i].teams?.[(me.team || '').toLowerCase()]?.has_won || false;
    if (won === firstWon) count++;
    else break;
  }
  return { count, type: firstWon ? 'win' : 'loss' };
}

export function getRankPrediction(
  matches: any[],
  playerName: string,
  playerTag: string,
  mmrHistory: Record<string, number>,
  currentRR: number
): string | null {
  if (!matches || matches.length === 0 || currentRR == null) return null;

  let rrGains = 0, rrLosses = 0, gainCount = 0, lossCount = 0;

  matches.slice(0, 10).forEach(m => {
    const rr = mmrHistory[m.metadata?.matchid];
    if (rr > 0) { rrGains += rr; gainCount++; }
    else if (rr < 0) { rrLosses += Math.abs(rr); lossCount++; }
  });

  const avgGain = gainCount > 0 ? rrGains / gainCount : 18;
  const avgLoss = lossCount > 0 ? rrLosses / lossCount : 15;

  let totalWins = 0;
  for (const m of matches) {
    const me = findMe(m, playerName, playerTag);
    if (!me) continue;
    const myTeamId = (me.team || '').toLowerCase();
    const myTeam = m.teams?.[myTeamId];
    if (myTeam?.has_won === true || (myTeam?.rounds_won != null && m.teams?.[myTeamId === 'red' ? 'blue' : 'red']?.rounds_won != null && myTeam.rounds_won > m.teams[myTeamId === 'red' ? 'blue' : 'red'].rounds_won)) {
      totalWins++;
    }
  }

  const wr = matches.length > 5 ? totalWins / matches.length : 0.5;
  const netGainPerMatch = (wr * avgGain) - ((1 - wr) * avgLoss);

  if (netGainPerMatch > 2.5) {
    const rrNeeded = 100 - (currentRR % 100);
    const matchesNeeded = Math.ceil(rrNeeded / netGainPerMatch);
    return `At your current pace, you'll hit the Next Rank in ~${matchesNeeded} games.`;
  } else if (netGainPerMatch > 0) {
    return 'You are climbing very slowly. Improve your win rate to rank up faster!';
  } else {
    return 'Trend is negative. Focus on improvement to rank up!';
  }
}
