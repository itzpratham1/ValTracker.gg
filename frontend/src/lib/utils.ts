// ValTracker — Utility Functions

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

export function sanitizeHtml(htmlStr: unknown): string {
  if (typeof htmlStr !== 'string') return String(htmlStr);
  let clean = htmlStr.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  clean = clean.replace(/on\w+\s*=\s*(['"])(?:\\\1|.)*?\1/gi, '')
               .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
               .replace(/javascript\s*:\s*[^\s"']+/gi, '');
  return clean;
}

export function escapeJsString(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/`/g, "\\`")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)");
}

export function expandTeamName(name: string): string {
  if (!name) return 'TBD';
  const clean = name.trim();
  const lower = clean.toLowerCase();

  if (lower === '100 th' || lower === '100t' || lower === '100 thieves') return '100 Thieves';
  if (lower === 'nongshim' || lower.includes('redforce') || lower.includes('redfor')) return 'Nongshim RedForce';
  if (lower === 'paper rex' || lower === 'prx') return 'Paper Rex';
  if (lower === 'edward gaming' || lower === 'edg') return 'EDward Gaming';
  if (lower === 'gen.g' || lower === 'geng' || lower === 'gen.g esports') return 'Gen.G Esports';
  if (lower === 'sentinels' || lower === 'sen') return 'Sentinels';
  if (lower === 'leviatán' || lower === 'leviatan' || lower === 'lev') return 'Leviatán';
  if (lower === 'team heretics' || lower === 'th') return 'Team Heretics';
  if (lower === 'karmine corp' || lower === 'kc') return 'Karmine Corp';
  if (lower === 'fnatic' || lower === 'fnc') return 'Fnatic';
  if (lower === 'funplus phoenix' || lower === 'fpx') return 'FunPlus Phoenix';
  if (lower === 'trace esports' || lower === 'te') return 'Trace Esports';
  if (lower === 'bilibili gaming' || lower === 'blg') return 'Bilibili Gaming';
  if (lower === 'zeta division' || lower === 'zeta' || lower === 'zeta d') return 'ZETA DIVISION';
  if (lower === 'detonation focusme' || lower === 'dfm' || lower.startsWith('detonati')) return 'DetonatioN FocusMe';
  if (lower === 'global esports' || lower === 'ge') return 'Global Esports';
  if (lower === 'furia' || lower === 'furia esports') return 'FURIA Esports';
  if (lower === 'fut esports' || lower === 'fut') return 'FUT Esports';
  if (lower === 'team vitality' || lower === 'vit') return 'Team Vitality';
  if (lower === 'bbl esports' || lower === 'bbl') return 'BBL Esports';
  if (lower === 'xlg esports' || lower === 'xlg') return 'XLG Esports';
  if (lower === 'dragon ranger gaming' || lower === 'drg') return 'Dragon Ranger Gaming';

  return clean;
}

export function getTeamSearchName(name: string): string {
  if (!name) return '';
  const lower = name.trim().toLowerCase();

  if (lower.startsWith('100 th') || lower.includes('100t')) return '100T';
  if (lower.startsWith('nongshim') || lower.includes('redforce') || lower.includes('redfor')) return 'Nongshim RedForce';
  if (lower.startsWith('paper r') || lower === 'prx') return 'PRX';
  if (lower.startsWith('edward') || lower === 'edg') return 'EDG';
  if (lower.startsWith('gen.g') || lower === 'geng') return 'GEN';
  if (lower.startsWith('sentinel') || lower === 'sen') return 'SEN';
  if (lower.startsWith('leviat')) return 'LEV';
  if (lower.startsWith('team heret') || lower === 'th') return 'TH';
  if (lower.startsWith('karmine') || lower === 'kc') return 'KC';
  if (lower.startsWith('fnatic') || lower === 'fnc') return 'FNC';
  if (lower.startsWith('drx')) return 'DRX';
  if (lower.startsWith('zeta') || lower.startsWith('zeta d')) return 'ZETA';
  if (lower.startsWith('detonation') || lower.startsWith('dfm')) return 'DFM';
  if (lower.startsWith('global') || lower.startsWith('ge')) return 'GE';
  if (lower.startsWith('furia') || lower === 'fur') return 'FUR';
  if (lower.startsWith('fut') || lower === 'fut') return 'FUT';
  if (lower.startsWith('vitali') || lower === 'vit') return 'VIT';
  if (lower.startsWith('bbl') || lower === 'bbl') return 'BBL';
  if (lower.startsWith('xlg')) return 'XLG';
  if (lower.startsWith('dragon') || lower.startsWith('drg')) return 'DRG';
  if (lower.startsWith('kru') || lower === 'kru') return 'KRU';
  if (lower === 'loud') return 'LOUD';
  if (lower === 'mibr') return 'MIBR';

  return name.trim();
}

export function normalizeMode(rawMode: string): string {
  if (!rawMode) return '';
  const m = rawMode.toLowerCase().replace(/[\s-_]/g, '');
  if (m === 'teamdm') return 'teamdeathmatch';
  return m;
}

export function normalizePlayerName(str: string): string {
  return str.trim().replace(/^#/, '');
}

export function formatMatchDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return 'Yesterday';

  const month = d.toLocaleString('en', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const currentYear = now.getFullYear();

  if (year === currentYear) return `${month} ${day}`;
  return `${month} ${day}, ${year}`;
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

export function getDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDayLabel(ts: number): string {
  const d = new Date(ts);
  if (isToday(ts)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getGrade(kills: number, deaths: number, assists: number, acs: number, won: boolean): string {
  const kd = deaths ? kills / deaths : kills;
  if (won && kd >= 1.5 && acs >= 250) return 'S';
  if (won && kd >= 1.2 && acs >= 200) return 'A';
  if (kd >= 1.0 || (won && acs >= 150)) return 'B';
  if (kd >= 0.8) return 'C';
  return 'D';
}

export function getPlayerList(match: any): any[] {
  if (!match) return [];
  if (Array.isArray(match.players)) return match.players;
  return match.players?.all_players || match.players || [];
}
