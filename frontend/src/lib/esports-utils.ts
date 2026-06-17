// Esports utility functions — match card rendering, team logos, region lookup

import { expandTeamName } from './utils';

export interface EsportsMatch {
  state: string;
  date?: string;
  vod?: string;
  vlr_path?: string;
  match?: {
    teams: Array<{
      name: string;
      game_wins?: string;
      has_won?: boolean;
      logo?: string;
    }>;
  };
  league?: {
    name?: string;
    region?: string;
  };
}

export interface FranchiseTeam {
  name: string;
  tag: string;
  logo: string;
  id: string;
  description?: string;
  capsule_image?: string;
  capsule_title?: string;
  capsule_desc?: string;
  roster?: Array<{
    name: string;
    role: string;
    avatar: string;
    real_name: string;
  }>;
}

export type FranchiseData = Record<string, FranchiseTeam[]>;

let _franchiseData: FranchiseData | null = null;
let _allMatchesCache: EsportsMatch[] = [];

export function setFranchiseData(data: FranchiseData) {
  _franchiseData = data;
}

export function getFranchiseData(): FranchiseData | null {
  return _franchiseData;
}

export function setAllMatchesCache(matches: EsportsMatch[]) {
  _allMatchesCache = matches;
}

export function getAllMatchesCache(): EsportsMatch[] {
  return _allMatchesCache;
}

export function getEsportsTeamLogoHtml(name: string): string {
  const cleanName = name || 'TBD';
  const initials = cleanName.substring(0, 2).toUpperCase();
  const fallback = `<div class="team-logo-fallback" style="width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:Barlow Condensed,sans-serif; font-size:9px; font-weight:700; color:var(--accent); margin-right:8px;">${initials}</div>`;

  if (!_franchiseData) return fallback;
  for (const region in _franchiseData) {
    for (const t of _franchiseData[region]) {
      if (t.name.toLowerCase() === name.toLowerCase() || t.tag?.toLowerCase() === name.toLowerCase()) {
        const teamLogoUrl = t.logo.startsWith('/api/image') ? t.logo : `/api/image?url=${encodeURIComponent(t.logo)}`;
        return `<img class="esp-team-logo" src="${teamLogoUrl}" style="width:20px;height:20px;object-fit:contain;margin-right:8px;" onerror="this.outerHTML='${fallback.replace(/"/g, '&quot;')}'" />`;
      }
    }
  }

  const match = _allMatchesCache.find(m => m.match?.teams?.some(tm => tm.name.toLowerCase() === name.toLowerCase()))?.match?.teams?.find(tm => tm.name.toLowerCase() === name.toLowerCase());
  if (match && match.logo) {
    const teamLogoUrl = match.logo.startsWith('/api/image') ? match.logo : `/api/image?url=${encodeURIComponent(match.logo)}`;
    return `<img class="esp-team-logo" src="${teamLogoUrl}" style="width:20px;height:20px;object-fit:contain;margin-right:8px;" onerror="this.outerHTML='${fallback.replace(/"/g, '&quot;')}'" />`;
  }

  return fallback;
}

export function getTeamRegion(tId: string, localId: string, teamName: string): string {
  if (_franchiseData) {
    for (const reg in _franchiseData) {
      if (_franchiseData[reg].some(item => item.id === tId || item.id === localId || item.name.toLowerCase() === teamName.toLowerCase())) {
        return reg;
      }
    }
  }

  const nameLower = teamName.toLowerCase();
  const idLower = (localId || '').toLowerCase();

  if (idLower.includes('nongshim') || idLower.includes('redforce') || idLower.includes('ns') || nameLower.includes('nongshim') || nameLower.includes('redforce') || nameLower.includes('bleed') || nameLower.includes('talon') || nameLower.includes('rex regum') || nameLower.includes('rrq') || nameLower.includes('t1') || idLower === 't1' || idLower.includes('detonation') || idLower.includes('dfm') || idLower.includes('zeta') || idLower.includes('secret') || idLower.includes('paper') || idLower.includes('prx') || idLower.includes('gen_g') || idLower.includes('drx') || idLower.includes('global_esports') || idLower.includes('full_sense') || idLower.includes('varrel')) {
    return 'pacific';
  }
  if (idLower.includes('furia') || idLower.includes('loud') || idLower.includes('mibr') || idLower.includes('kru') || idLower.includes('100t') || idLower.includes('nrg') || idLower.includes('eg') || idLower.includes('sentinels') || idLower.includes('g2') || idLower.includes('leviatan') || nameLower.includes('100 thieves') || nameLower.includes('evil geniuses') || nameLower.includes('sen') || nameLower.includes('lev')) {
    return 'americas';
  }
  if (idLower.includes('fnatic') || idLower.includes('heretics') || idLower.includes('bbl') || idLower.includes('vitality') || idLower.includes('fut') || idLower.includes('karmine') || idLower.includes('kc') || idLower.includes('giant') || idLower.includes('koi') || nameLower.includes('gentlemen mates') || nameLower.includes('fnc') || nameLower.includes('th') || nameLower.includes('vit')) {
    return 'emea';
  }
  if (idLower.includes('edg') || idLower.includes('edward') || idLower.includes('fpx') || idLower.includes('funplus') || idLower.includes('trace') || idLower.includes('te') || idLower.includes('bilibili') || idLower.includes('blg') || idLower.includes('xlg') || idLower.includes('all gamers') || idLower.includes('ag') || nameLower.includes('dragon ranger') || nameLower.includes('tyloo') || nameLower.includes('nova')) {
    return 'china';
  }

  return 'pacific';
}

export function getEspHTML(m: EsportsMatch, type: string): string {
  const teams = m.match?.teams || [];
  const rawT1 = teams[0]?.name || 'TBD';
  const rawT2 = teams[1]?.name || 'TBD';
  const t1 = expandTeamName(rawT1);
  const t2 = expandTeamName(rawT2);
  const s1 = teams[0]?.game_wins || '0';
  const s2 = teams[1]?.game_wins || '0';
  const w1 = teams[0]?.has_won ? 'winner' : '';
  const w2 = teams[1]?.has_won ? 'winner' : '';

  let event = m.league?.name || 'VCT';
  if (m.league?.region) {
    if (m.league.region.toLowerCase().includes(event.toLowerCase())) {
      event = m.league.region;
    } else {
      event = `${m.league.region} ${event}`;
    }
  }
  const isTier2 = event.toLowerCase().includes('challengers') || event.toLowerCase().includes('game changers') || event.toLowerCase().includes('ascension') || event.toLowerCase().includes('vcl');
  const tierClass = isTier2 ? 'tier-t2' : 'tier-t1';
  const tierBadge = isTier2 ? '<span class="tier-badge t2">Tier 2</span>' : '<span class="tier-badge t1">VCT Tier 1</span>';

  let statusHtml = '';
  let mediaBtn = '';
  const vlrUrl = m.vlr_path ? `https://www.vlr.gg${m.vlr_path}` : null;
  const vlrBtn = vlrUrl ? `<a href="${vlrUrl}" target="_blank" rel="noopener noreferrer" class="esp-btn vlr" style="background:rgba(250,68,84,0.12);border:1px solid rgba(250,68,84,0.3);color:#ff4655;font-size:10px;gap:5px;letter-spacing:0.5px;">🔗 Full Details</a>` : '';

  if (m.state === 'in_progress' || m.state === 'inProgress') {
    statusHtml = `<div class="esp-status live">LIVE</div>`;
    mediaBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;">${vlrBtn}</div>`;
  } else if (m.state === 'completed') {
    statusHtml = `<div class="esp-status">FINAL</div>`;
    if (m.vod) {
      mediaBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;"><a href="${m.vod}" target="_blank" class="esp-btn vod">📺 Watch VOD</a>${vlrBtn}</div>`;
    } else {
      let datePart = '';
      if (m.date) {
        if (m.date.includes('T') && m.date.includes('-')) {
          datePart = m.date.split('T')[0];
        } else {
          const hasToday = /today/i.test(m.date);
          const hasYesterday = /yesterday/i.test(m.date);
          let temp = m.date.replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?/gi, '').trim();
          temp = temp.replace(/(Today|Yesterday|Tomorrow|Recent)/i, '').trim();
          temp = temp.replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/gi, '').trim();
          temp = temp.replace(/^[,\s]+|[,\s]+$/g, '').trim();

          if (hasToday || hasYesterday) {
            const d = new Date();
            if (hasYesterday) d.setDate(d.getDate() - 1);
            const y = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            datePart = `${y}-${mo}-${day}`;
          } else if (!temp) {
            datePart = new Date().toISOString().split('T')[0];
          } else {
            const d = new Date(m.date);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const mo = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              datePart = `${y}-${mo}-${day}`;
            } else {
              datePart = new Date().toISOString().split('T')[0];
            }
          }
        }
      } else {
        datePart = new Date().toISOString().split('T')[0];
      }

      let cleanEvent = event;
      const evLower = event.toLowerCase();
      if (evLower.includes('masters')) cleanEvent = 'VCT Masters';
      else if (evLower.includes('champions')) cleanEvent = 'VCT Champions';
      else if (evLower.includes('pacific')) cleanEvent = 'VCT Pacific';
      else if (evLower.includes('emea')) cleanEvent = 'VCT EMEA';
      else if (evLower.includes('americas')) cleanEvent = 'VCT Americas';
      else if (evLower.includes('china') || evLower.includes('cn')) cleanEvent = 'VCT China';

      const searchQ = `${cleanEvent} ${t1} vs ${t2} highlights ${datePart}`.trim();
      mediaBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(searchQ)}" target="_blank" class="esp-btn vod">📺 View Highlights</a>${vlrBtn}</div>`;
    }
  } else {
    statusHtml = `<div class="esp-status">UPCOMING</div>`;
    mediaBtn = vlrBtn ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${vlrBtn}</div>` : '';
  }

  let displayDate = m.date || 'TBD';
  try {
    const d = new Date(displayDate);
    if (!isNaN(d.getTime())) {
      displayDate = d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  } catch (e) { /* keep original */ }

  const score1 = m.state === 'unstarted' ? '' : s1;
  const score2 = m.state === 'unstarted' ? '' : s2;

  return `
    <div class="esp-match-card ${tierClass} ${m.state || ''}">
      <div class="esp-match-head">
        <span class="esp-tourney">${tierBadge} ${event}</span>
        ${statusHtml}
      </div>
      <div class="esp-match-teams">
        <div class="esp-team esp-team-l">
          <div class="esp-tlogo-wrap">${getEsportsTeamLogoHtml(t1).replace('margin-right:8px;', '')}</div>
          <div class="esp-tname">${t1}</div>
          <div class="esp-tscore ${w1}">${score1}</div>
        </div>
        <div class="esp-match-vs">
          <span class="esp-vs-score ${w1}">${score1}</span>
          <span class="esp-vs-sep">vs</span>
          <span class="esp-vs-score ${w2}">${score2}</span>
        </div>
        <div class="esp-team esp-team-r">
          <div class="esp-tname">${t2}</div>
          <div class="esp-tlogo-wrap">${getEsportsTeamLogoHtml(t2).replace('margin-right:8px;', '')}</div>
          <div class="esp-tscore ${w2}">${score2}</div>
        </div>
      </div>
      <div class="esp-match-foot">
        <div class="esp-meta">${displayDate}</div>
        ${mediaBtn}
      </div>
    </div>
  `;
}

export function getMatchCardHtml(team1: string, team2: string, score1: string | number, score2: string | number, date: string, status: string, isLive = false, matchId = ""): string {
  const logo1Html = getEsportsTeamLogoHtml(team1);
  const logo2Html = getEsportsTeamLogoHtml(team2);
  const statusClass = isLive ? 'live' : (status === 'FINAL' ? 'final' : 'upcoming');
  const hrefAttr = matchId ? `href="https://www.vlr.gg/${matchId}" target="_blank" rel="noopener noreferrer"` : 'href="#" onclick="event.preventDefault()"';

  return `
    <a class="bracket-match ${statusClass}" ${hrefAttr} style="text-decoration:none; display:flex; flex-direction:column; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:10px; gap:8px; width:220px; transition:var(--transition); box-shadow:0 4px 12px rgba(0,0,0,0.15); box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; font-family:'DM Mono',monospace; color:var(--muted)">
        <span>${date}</span>
        <span class="match-badge ${statusClass}">${status}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:700;">
          <div style="display:flex; align-items:center; gap:6px; color:#fff;">
            ${logo1Html}
            <span>${team1}</span>
          </div>
          <span style="font-family:'DM Mono',monospace; color:${Number(score1) > Number(score2) ? 'var(--win)' : '#fff'}">${score1}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:700;">
          <div style="display:flex; align-items:center; gap:6px; color:#fff;">
            ${logo2Html}
            <span>${team2}</span>
          </div>
          <span style="font-family:'DM Mono',monospace; color:${Number(score2) > Number(score1) ? 'var(--win)' : '#fff'}">${score2}</span>
        </div>
      </div>
    </a>
  `;
}
