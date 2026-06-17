// ValTracker — Session & Profile Persistence

const PROFILE_KEY = 'valstats_my_profile';

export interface SavedProfile {
  name: string;
  tag: string;
  region: string;
  mode: string;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Player Profile ──

export function loadMyProfile(): SavedProfile | null {
  return loadFromStorage<SavedProfile | null>(PROFILE_KEY, null);
}

export function saveMyProfile(name: string, tag: string, region: string, mode: string) {
  saveToStorage(PROFILE_KEY, { name, tag, region, mode });
}

export function clearMyProfile() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

// ── MMR Cache ──

function getMmrKey(name: string, tag: string): string {
  return `vt_mmr_${name.toLowerCase()}_${tag.toLowerCase()}`;
}

export function loadMmrCache(name: string, tag: string): any {
  return loadFromStorage(getMmrKey(name, tag), null);
}

export function saveMmrCache(name: string, tag: string, data: any) {
  saveToStorage(getMmrKey(name, tag), data);
}

export function clearMmrCache(name: string, tag: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getMmrKey(name, tag));
}

// ── Session Stats (today's games) ──

export interface SessionStats {
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  rrDelta: number;
  matchCount: number;
}

const SESSION_KEY = 'valtracker_session';

function isToday(timestamp: number | Date): boolean {
  const d = typeof timestamp === 'number'
    ? new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1))
    : new Date(timestamp);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

export function computeSessionStats(matches: any[], playerName: string, playerTag: string, mmrHistory?: Record<string, number>): SessionStats {
  const lowerName = playerName.toLowerCase();
  const lowerTag = playerTag.toLowerCase();
  const mmrH = mmrHistory || {};

  let wins = 0, losses = 0, kills = 0, deaths = 0, assists = 0, rrDelta = 0;
  let matchCount = 0;

  matches.forEach(m => {
    const gameTime = m.game_start || m.gameStart;
    if (!isToday(gameTime)) return;

    const player = m.players?.all_players?.find(
      (p: any) => p.name?.toLowerCase() === lowerName && p.tag?.toLowerCase() === lowerTag
    );
    if (!player) return;

    matchCount++;
    kills += player.stats?.kills || 0;
    deaths += player.stats?.deaths || 0;
    assists += player.stats?.assists || 0;

    const myTeam = (player.team || '').toLowerCase();
    const won = m.teams?.[myTeam]?.has_won ||
                (m.teams?.[myTeam]?.rounds_won || 0) > (m.teams?.[myTeam === 'red' ? 'blue' : 'red']?.rounds_won || 0);

    if (won) wins++; else losses++;

    const rr = mmrH[m.matchId || m.metadata?.matchid];
    if (rr !== undefined) rrDelta += rr;
  });

  return { wins, losses, kills, deaths, assists, rrDelta, matchCount };
}

// ── Recent Comps (Meta Comp Architect) ──

const COMPS_KEY = 'valtracker_comps';

export function loadRecentComps(): any[] {
  return loadFromStorage<any[]>(COMPS_KEY, []);
}

export function saveRecentComp(comp: any) {
  const comps = loadRecentComps();
  comps.unshift(comp);
  if (comps.length > 10) comps.pop();
  saveToStorage(COMPS_KEY, comps);
}

export function clearRecentComps() {
  saveToStorage(COMPS_KEY, []);
}
