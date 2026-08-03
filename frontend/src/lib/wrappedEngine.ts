// ValTracker — Valorant Wrapped & Monthly Recap Stats Engine

export interface WrappedSlideData {
  playerName: string;
  playerTag: string;
  rankName: string;
  rankImg: string | null;
  accountLevel: number | string;
  cardUrl: string | null;
  
  periodTitle: string;
  totalGames: number;
  isLimitedData: boolean;
  wins: number;
  losses: number;
  winRate: number;
  
  topAgent: string;
  topAgentCount: number;
  topAgentWinRate: number;
  topMap: string;
  topMapGames: number;
  topMapHours: number;
  totalHoursPlayed: number;
  topMaps: Array<{ map: string; games: number; winRate: number }>;
  
  peakHour: number;
  peakDayName: string;
  egoHourText: string;
  personaTitle: string;
  hourDistribution: number[];
  
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  kdRatio: number;
  headshotPct: number;
  bodyshotPct: number;
  legshotPct: number;
  damageDealt: number;
  vandalShieldEquiv: number;
  radiantsEliminated: number;
  avgCombatScore: number;
  
  highestKillGame: number;
  longestWinStreak: number;
  clutchCount: number;
  
  topVictimAgent: string;
  topVictimCount: number;
  topTeammateName: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Checks if Wrapped recap season is active (e.g. last 7 days of month / act end, or dev force param)
 */
export function isWrappedSeasonActive(matches: any[] = []): boolean {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('wrapped') || urlParams.has('test') || urlParams.has('recap')) return true;
  }
  if (!matches || matches.length < 3) return false;
  
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  // Active in the last 7 days of the month (or dev preview)
  return dayOfMonth >= (daysInMonth - 7) || matches.length >= 5;
}

export function generateWrappedData(
  matches: any[],
  playerName: string,
  playerTag: string,
  mmrData: any = null,
  accountData: any = null
): WrappedSlideData {
  const safeName = playerName || 'Agent';
  const safeTag = playerTag || '0000';
  const rankName = mmrData?.current?.tier?.name || 'UNRANKED';
  const accountLevel = accountData?.account_level || '—';
  
  const cardId = (typeof accountData?.card === 'string') ? accountData.card : (accountData?.card?.id || null);
  const cardUrl = accountData?.card?.wide || accountData?.card?.large || (cardId ? `https://media.valorant-api.com/playercards/${cardId}/wideart.png` : null);

  const totalGames = matches.length;
  const isLimitedData = totalGames < 15;

  let periodTitle = 'Valorant Act Wrapped';
  if (totalGames >= 20) {
    const date = new Date();
    const monthName = date.toLocaleString('default', { month: 'long' });
    periodTitle = `${monthName} Wrapped`;
  } else if (isLimitedData) {
    periodTitle = 'Starter Pack Wrapped';
  }

  if (!matches || totalGames === 0) {
    return {
      playerName: safeName, playerTag: safeTag, rankName, rankImg: null, accountLevel, cardUrl,
      periodTitle, totalGames: 0, isLimitedData: true, wins: 0, losses: 0, winRate: 0,
      topAgent: 'Jett', topAgentCount: 0, topAgentWinRate: 0, topMap: 'Ascent', topMapGames: 0, topMapHours: 0, totalHoursPlayed: 0,
      topMaps: [],
      peakHour: 22, peakDayName: 'Saturday', egoHourText: '10 PM on Saturdays', personaTitle: 'Recruit',
      hourDistribution: new Array(24).fill(0),
      totalKills: 0, totalDeaths: 0, totalAssists: 0, kdRatio: 0, headshotPct: 0, bodyshotPct: 0, legshotPct: 0,
      damageDealt: 0, vandalShieldEquiv: 0, radiantsEliminated: 0, avgCombatScore: 0,
      highestKillGame: 0, longestWinStreak: 0, clutchCount: 0, topVictimAgent: 'Reyna', topVictimCount: 0, topTeammateName: 'Duo Partner'
    };
  }

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let highestKillGame = 0;
  let headshotHits = 0;
  let bodyshotHits = 0;
  let legshotHits = 0;
  let totalShots = 0;

  const agentStats: Record<string, { count: number; wins: number }> = {};
  const mapStats: Record<string, { count: number; wins: number }> = {};
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  const victimAgents: Record<string, number> = {};
  const teammates: Record<string, number> = {};

  let currentStreak = 0;
  let longestWinStreak = 0;
  let clutchCount = 0;

  matches.forEach(m => {
    const rawPlayers = m.players?.all_players || m.players || [];
    const playersArr = Array.isArray(rawPlayers) ? rawPlayers : [];
    const me = playersArr.find((p: any) =>
      p.name?.toLowerCase() === safeName.toLowerCase() &&
      p.tag?.toLowerCase() === safeTag.toLowerCase()
    ) || playersArr[0];

    const team = (me?.team || 'Red').toLowerCase();
    const won = m.teams?.[team]?.has_won || false;

    if (won) {
      wins++;
      currentStreak++;
      if (currentStreak > longestWinStreak) longestWinStreak = currentStreak;
    } else {
      losses++;
      currentStreak = 0;
    }

    const stats = me?.stats || {};
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    const assists = stats.assists || 0;

    totalKills += kills;
    totalDeaths += deaths;
    totalAssists += assists;
    if (kills > highestKillGame) highestKillGame = kills;
    if (kills >= 20) clutchCount++;

    const hs = stats.headshots || 0;
    const bs = stats.bodyshots || 0;
    const ls = stats.legshots || 0;
    headshotHits += hs;
    bodyshotHits += bs;
    legshotHits += ls;
    totalShots += (hs + bs + ls);

    const agent = me?.character || me?.agent?.name || 'Unknown';
    if (agent && agent !== 'Unknown') {
      if (!agentStats[agent]) agentStats[agent] = { count: 0, wins: 0 };
      agentStats[agent].count++;
      if (won) agentStats[agent].wins++;
    }

    const mapName = m.metadata?.map || 'Ascent';
    if (!mapStats[mapName]) mapStats[mapName] = { count: 0, wins: 0 };
    mapStats[mapName].count++;
    if (won) mapStats[mapName].wins++;

    const gameStart = m.metadata?.game_start || m.metadata?.gameStart;
    if (gameStart) {
      const d = new Date(gameStart * 1000);
      hourCounts[d.getHours()]++;
      dayCounts[d.getDay()]++;
    }

    playersArr.forEach((p: any) => {
      const pTeam = (p.team || '').toLowerCase();
      const pName = p.name || '';
      if (pName && (pName.toLowerCase() !== safeName.toLowerCase())) {
        if (pTeam === team) {
          teammates[pName] = (teammates[pName] || 0) + 1;
        } else {
          const oppAgent = p.character || p.agent?.name || 'Enemy';
          victimAgents[oppAgent] = (victimAgents[oppAgent] || 0) + 1;
        }
      }
    });
  });

  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const kdRatio = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills;
  
  const headshotPct = totalShots > 0 ? Math.round((headshotHits / totalShots) * 100) : 28;
  const bodyshotPct = totalShots > 0 ? Math.round((bodyshotHits / totalShots) * 100) : 62;
  const legshotPct = totalShots > 0 ? (100 - headshotPct - bodyshotPct) : 10;

  // Top Agent
  let topAgent = 'Jett';
  let topAgentCount = 0;
  let topAgentWins = 0;
  Object.entries(agentStats).forEach(([agent, data]) => {
    if (data.count > topAgentCount) {
      topAgent = agent;
      topAgentCount = data.count;
      topAgentWins = data.wins;
    }
  });
  const topAgentWinRate = topAgentCount > 0 ? Math.round((topAgentWins / topAgentCount) * 100) : 0;

  // Maps Array
  const sortedMaps = Object.entries(mapStats)
    .map(([map, d]) => ({ map, games: d.count, winRate: Math.round((d.wins / d.count) * 100) }))
    .sort((a, b) => b.games - a.games);

  const topMapObj = sortedMaps[0] || { map: 'Ascent', games: totalGames, winRate: 50 };
  const topMap = topMapObj.map;
  const topMapGames = topMapObj.games;
  const topMapHours = Math.round((topMapGames * 35) / 60);
  const totalHoursPlayed = Math.round((totalGames * 35) / 60);

  // Peak Hour
  let maxHourCount = -1;
  let peakHour = 22;
  hourCounts.forEach((cnt, hr) => {
    if (cnt > maxHourCount) {
      maxHourCount = cnt;
      peakHour = hr;
    }
  });

  let maxDayCount = -1;
  let peakDayIdx = 6;
  dayCounts.forEach((cnt, idx) => {
    if (cnt > maxDayCount) {
      maxDayCount = cnt;
      peakDayIdx = idx;
    }
  });

  const peakDayName = DAYS[peakDayIdx];
  const ampm = peakHour >= 12 ? 'PM' : 'AM';
  const displayHour = peakHour % 12 === 0 ? 12 : peakHour % 12;
  const egoHourText = `${displayHour} ${ampm} on ${peakDayName}s`;

  let personaTitle = 'Night Owl Duelist';
  if (peakHour >= 5 && peakHour < 12) personaTitle = 'Early Bird Sentinel';
  else if (peakHour >= 12 && peakHour < 17) personaTitle = 'Afternoon Fragger';
  else if (peakHour >= 17 && peakHour < 22) personaTitle = 'Prime Time Specialist';
  else personaTitle = '2 AM Ego Fragger';

  const damageDealt = totalKills * 150 + totalAssists * 50;
  const vandalShieldEquiv = Math.round(totalGames * 1.8);
  const radiantsEliminated = totalKills;
  const avgCombatScore = Math.round((totalKills * 180 + totalAssists * 40) / Math.max(1, totalGames));

  // Top Victim & Teammate
  let topVictimAgent = 'Reyna';
  let topVictimCount = 0;
  Object.entries(victimAgents).forEach(([agent, cnt]) => {
    if (cnt > topVictimCount) {
      topVictimAgent = agent;
      topVictimCount = cnt;
    }
  });

  let topTeammateName = 'Duo Partner';
  let topTeammateCnt = 0;
  Object.entries(teammates).forEach(([tName, cnt]) => {
    if (cnt > topTeammateCnt) {
      topTeammateName = tName;
      topTeammateCnt = cnt;
    }
  });

  return {
    playerName: safeName,
    playerTag: safeTag,
    rankName,
    rankImg: null,
    accountLevel,
    cardUrl,
    periodTitle,
    totalGames,
    isLimitedData,
    wins,
    losses,
    winRate,
    topAgent,
    topAgentCount,
    topAgentWinRate,
    topMap,
    topMapGames,
    topMapHours,
    totalHoursPlayed,
    topMaps: sortedMaps.slice(0, 3),
    peakHour,
    peakDayName,
    egoHourText,
    personaTitle,
    hourDistribution: hourCounts,
    totalKills,
    totalDeaths,
    totalAssists,
    kdRatio,
    headshotPct,
    bodyshotPct,
    legshotPct,
    damageDealt,
    vandalShieldEquiv,
    radiantsEliminated,
    avgCombatScore,
    highestKillGame,
    longestWinStreak,
    clutchCount,
    topVictimAgent,
    topVictimCount,
    topTeammateName
  };
}
