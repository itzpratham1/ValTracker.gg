// ValTracker — Constants & Game Data
import { writable } from 'svelte/store';

export interface ActMeta {
  name: string;
  start: number;
  end: number;
  uuid?: string;
}

export const ACTS_TIMELINE: Record<string, ActMeta> = {
  'v26a6': { name: 'V26 Act 6', start: new Date('2026-10-14T00:00:00Z').getTime(), end: new Date('2027-01-06T00:00:00Z').getTime() },
  'v26a5': { name: 'V26 Act 5', start: new Date('2026-08-19T00:00:00Z').getTime(), end: new Date('2026-10-14T00:00:00Z').getTime() },
  'v26a4': { name: 'V26 Act 4', start: new Date('2026-06-24T00:00:00Z').getTime(), end: new Date('2026-08-19T00:00:00Z').getTime() },
  'v26a3': { name: 'V26 Act 3', start: new Date('2026-04-29T00:00:00Z').getTime(), end: new Date('2026-06-24T00:00:00Z').getTime() },
  'v26a2': { name: 'V26 Act 2', start: new Date('2026-03-18T00:00:00Z').getTime(), end: new Date('2026-04-29T00:00:00Z').getTime() },
  'v26a1': { name: 'V26 Act 1', start: new Date('2026-01-07T00:00:00Z').getTime(), end: new Date('2026-03-18T00:00:00Z').getTime() },
  'v25a6': { name: 'V25 Act 6', start: new Date('2025-10-15T00:00:00Z').getTime(), end: new Date('2026-01-07T00:00:00Z').getTime() },
  'v25a5': { name: 'V25 Act 5', start: new Date('2025-08-20T00:00:00Z').getTime(), end: new Date('2025-10-15T00:00:00Z').getTime() },
  'v25a4': { name: 'V25 Act 4', start: new Date('2025-06-25T00:00:00Z').getTime(), end: new Date('2025-08-20T00:00:00Z').getTime() },
  'v25a3': { name: 'V25 Act 3', start: new Date('2025-04-30T00:00:00Z').getTime(), end: new Date('2025-06-25T00:00:00Z').getTime() },
  'v25a2': { name: 'V25 Act 2', start: new Date('2025-03-05T00:00:00Z').getTime(), end: new Date('2025-04-30T00:00:00Z').getTime() },
  'v25a1': { name: 'V25 Act 1', start: new Date('2025-01-08T00:00:00Z').getTime(), end: new Date('2025-03-05T00:00:00Z').getTime() }
};

export const SEASONS_MAP: Record<string, string> = {
  'v26a6': 'e12a6', 'v26a5': 'e12a5', 'v26a4': 'e12a4', 'v26a3': 'e12a3', 'v26a2': 'e12a2', 'v26a1': 'e12a1',
  'v25a6': 'e11a3', 'v25a5': 'e11a2', 'v25a4': 'e11a1',
  'v25a3': 'e10a3', 'v25a2': 'e10a2', 'v25a1': 'e10a1'
};

export const ACTS_UUID_MAP: Record<string, string> = {
  'd816f426-48ea-f052-117f-9697a155b319': 'v26a6',
  '8102cd81-43a0-d0d7-bd59-47b8fe9bed1b': 'v26a5',
  '4f0864e2-40af-28a4-de2c-0e9e64e75f23': 'v26a4',
  'ce2783e8-44fc-dd48-3da3-33b5ba6c4a22': 'v26a3',
  '9d85c932-4820-c060-09c3-668636d4df1b': 'v26a2',
  '3ea2b318-423b-cf86-25da-7cbb0eefbe2d': 'v26a1',
  '4c4b8cff-43eb-13d3-8f14-96b783c90cd2': 'v25a6',
  '5adc33fa-4f30-2899-f131-6fba64c5dd3a': 'v25a5',
  'ac12e9b3-47e6-9599-8fa1-0bb473e5efc7': 'v25a4',
  'aef237a0-494d-3a14-a1c8-ec8de84e309c': 'v25a3',
  '16118998-4705-5813-86dd-0292a2439d90': 'v25a2',
  '476b0893-4c2e-abd6-c5fe-708facff0772': 'v25a1'
};

export const ACTS_KEY_TO_UUID: Record<string, string> = Object.fromEntries(
  Object.entries(ACTS_UUID_MAP).map(([uuid, key]) => [key, uuid])
);

export function detectActFromMatches(matches: any[]): string | null {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  for (const m of matches) {
    const seasonId = m.metadata?.season_id || m.meta?.season?.id || m.metadata?.seasonId;
    if (seasonId && ACTS_UUID_MAP[seasonId]) {
      return ACTS_UUID_MAP[seasonId];
    }
    const seasonShort = m.meta?.season?.short;
    if (seasonShort) {
      const matchKey = Object.entries(SEASONS_MAP).find(([k, v]) => v === seasonShort || k === seasonShort);
      if (matchKey) return matchKey[0];
    }
  }
  return null;
}

export function getSortedActsList(): { value: string; label: string }[] {
  const now = Date.now();
  return Object.entries(ACTS_TIMELINE)
    .filter(([key, val]) => val.start <= now)
    .sort((a, b) => b[1].start - a[1].start)
    .map(([key, val]) => ({
      value: key,
      label: val.name
    }));
}

export const actsListStore = writable<{ value: string; label: string }[]>(getSortedActsList());

function computeProjectedAct(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const yearShort = String(year).slice(-2);
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  let actNum = 1;
  let startMonth = 0, startDay = 7, endMonth = 2, endDay = 18;

  if (month < 2 || (month === 2 && day < 18)) {
    actNum = 1;
    startMonth = 0; startDay = 7; endMonth = 2; endDay = 18;
  } else if (month < 3 || (month === 3 && day < 29)) {
    actNum = 2;
    startMonth = 2; startDay = 18; endMonth = 3; endDay = 29;
  } else if (month < 5 || (month === 5 && day < 24)) {
    actNum = 3;
    startMonth = 3; startDay = 29; endMonth = 5; endDay = 24;
  } else if (month < 7 || (month === 7 && day < 19)) {
    actNum = 4;
    startMonth = 5; startDay = 24; endMonth = 7; endDay = 19;
  } else if (month < 9 || (month === 9 && day < 14)) {
    actNum = 5;
    startMonth = 7; startDay = 19; endMonth = 9; endDay = 14;
  } else {
    actNum = 6;
    startMonth = 9; startDay = 14; endMonth = 0; endDay = 7;
  }

  const key = `v${yearShort}a${actNum}`;
  if (!ACTS_TIMELINE[key]) {
    const startMs = Date.UTC(year, startMonth, startDay);
    const endYear = actNum === 6 ? year + 1 : year;
    const endMs = Date.UTC(endYear, endMonth, endDay);
    ACTS_TIMELINE[key] = {
      name: `V${yearShort} Act ${actNum}`,
      start: startMs,
      end: endMs
    };
    if (!SEASONS_MAP[key]) {
      const epOffset = (year - 2026) + 12;
      SEASONS_MAP[key] = `e${epOffset}a${actNum}`;
    }
    actsListStore.set(getSortedActsList());
  }
  return key;
}

export function getCurrentActId(timestamp = Date.now()): string {
  for (const [id, meta] of Object.entries(ACTS_TIMELINE)) {
    if (timestamp >= meta.start && timestamp < meta.end) {
      return id;
    }
  }
  return computeProjectedAct(timestamp);
}

export function isCurrentAct(actKey?: string): boolean {
  if (!actKey || actKey === 'all') return true;
  return actKey === getCurrentActId();
}

const ROMAN_MAP: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6
};

export function parseAndMergeSeasons(seasonsData: any[]): void {
  if (!Array.isArray(seasonsData) || seasonsData.length === 0) return;

  const parentMap: Record<string, string> = {};
  for (const s of seasonsData) {
    if (s && !s.type && s.uuid && s.displayName) {
      parentMap[s.uuid] = s.displayName;
    }
  }

  let hasNew = false;
  for (const s of seasonsData) {
    if (s && s.type === 'EAresSeasonType::Act' && s.startTime && s.endTime) {
      const parent = parentMap[s.parentUuid] || '';
      const disp = s.displayName || '';
      const roman = disp.replace('ACT', '').trim();
      const actNum = ROMAN_MAP[roman] || 1;

      let key = '';
      let name = '';

      if (parent.toUpperCase().startsWith('V')) {
        const yearNum = parent.toUpperCase().replace('V', '').trim();
        key = `v${yearNum}a${actNum}`;
        name = `${parent} Act ${actNum}`;
        if (!SEASONS_MAP[key]) {
          if (yearNum === '25') {
            SEASONS_MAP[key] = actNum <= 3 ? `e10a${actNum}` : `e11a${actNum - 3}`;
          } else if (yearNum === '26') {
            SEASONS_MAP[key] = `e12a${actNum}`;
          } else {
            const y = parseInt(yearNum, 10);
            const ep = !isNaN(y) ? (y - 26) + 12 : 12;
            SEASONS_MAP[key] = `e${ep}a${actNum}`;
          }
        }
      } else if (parent.toUpperCase().includes('EPISODE')) {
        const epNum = parent.toUpperCase().replace('EPISODE', '').trim();
        key = `e${epNum}a${actNum}`;
        name = `Episode ${epNum} Act ${actNum}`;
        if (!SEASONS_MAP[key]) {
          SEASONS_MAP[key] = key;
        }
      } else {
        key = `act_${(s.uuid || '').slice(0, 8)}`;
        name = disp;
        if (!SEASONS_MAP[key]) {
          SEASONS_MAP[key] = key;
        }
      }

      if (s.uuid) {
        ACTS_UUID_MAP[s.uuid] = key;
        ACTS_KEY_TO_UUID[key] = s.uuid;
      }

      const startMs = new Date(s.startTime).getTime();
      const endMs = new Date(s.endTime).getTime();

      if (!isNaN(startMs) && !isNaN(endMs)) {
        if (!ACTS_TIMELINE[key] || ACTS_TIMELINE[key].start !== startMs || ACTS_TIMELINE[key].end !== endMs) {
          ACTS_TIMELINE[key] = {
            name,
            start: startMs,
            end: endMs,
            uuid: s.uuid
          };
          hasNew = true;
        }
      }
    }
  }

  if (hasNew) {
    actsListStore.set(getSortedActsList());
  }
}

let hasSyncedSeasons = false;
export async function syncSeasonsFromApi(): Promise<void> {
  if (hasSyncedSeasons) return;
  try {
    let seasonsData: any = null;
    try {
      const res = await fetch('https://valorant-api.com/v1/seasons');
      if (res.ok) {
        const json = await res.json();
        seasonsData = json.data;
      }
    } catch {}

    if (!seasonsData) {
      try {
        const res = await fetch('/api/v1/seasons');
        if (res.ok) {
          const json = await res.json();
          seasonsData = json.data;
        }
      } catch {}
    }

    if (Array.isArray(seasonsData) && seasonsData.length > 0) {
      parseAndMergeSeasons(seasonsData);
      hasSyncedSeasons = true;
    }
  } catch (e) {
    console.warn('[Seasons Sync] Auto-sync skipped:', e);
  }
}

export type AgentRole = 'duelist' | 'sentinel' | 'initiator' | 'controller';

export const AGENT_ROLES: Record<string, AgentRole> = {
  jett:'duelist',reyna:'duelist',phoenix:'duelist',neon:'duelist',iso:'duelist',yoru:'duelist',waylay:'duelist',raze:'duelist',
  sage:'sentinel',killjoy:'sentinel',cypher:'sentinel',chamber:'sentinel',deadlock:'sentinel',vyse:'sentinel',veto:'sentinel',
  sova:'initiator',breach:'initiator',skye:'initiator',fade:'initiator',gekko:'initiator',tejo:'initiator','kay/o':'initiator',kayo:'initiator',
  brimstone:'controller',viper:'controller',omen:'controller',astra:'controller',harbor:'controller',clove:'controller',miks:'controller'
};

export const AGENT_UUIDS: Record<string, string> = {
  'Jett':     'add6443a-41bd-e414-f6ad-e58d267f4e95',
  'Reyna':    'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  'Phoenix':  'eb93336a-449b-9c1b-0a54-a891f7921d69',
  'Neon':     'bb2a4828-46eb-8cd1-e765-15848195d751',
  'Iso':      '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
  'Yoru':     '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
  'Raze':     'f94c3b30-42be-e959-889c-5aa313dba261',
  'Waylay':   'df1cb487-4902-002e-5c17-d28e83e78588',
  'Sage':     '569fdd95-4d10-43ab-ca70-79becc718b46',
  'Killjoy':  '1e58de9c-4950-5125-93e9-a0aee9f98746',
  'Cypher':   '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  'Chamber':  '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
  'Deadlock': 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
  'Vyse':     'efba5359-4016-a1e5-7626-b1ae76895940',
  'Veto':     '92eeef5d-43b5-1d4a-8d03-b3927a09034b',
  'Sova':     '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  'Breach':   '5f8d3a7f-467b-97f3-062c-13acf203c006',
  'Skye':     '6f2a04ca-43e0-be17-7f36-b3908627744d',
  'Fade':     'dade69b4-4f5a-8528-247b-219e5a1facd6',
  'Gekko':    'e370fa57-4757-3604-3648-499e1f642d3f',
  'KAY/O':    '601dbbe7-43ce-be57-2a40-4abd24953621',
  'Kayo':     '601dbbe7-43ce-be57-2a40-4abd24953621',
  'kay/o':    '601dbbe7-43ce-be57-2a40-4abd24953621',
  'kayo':     '601dbbe7-43ce-be57-2a40-4abd24953621',
  'Tejo':     'b444168c-4e35-8076-db47-ef9bf368f384',
  'Brimstone':'9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  'Viper':    '707eab51-4836-f488-046a-cda6bf494859',
  'Omen':     '8e253930-4c05-31dd-1b6c-968525494517',
  'Astra':    '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  'Harbor':   '95b78ed7-4637-86d9-7e41-71ba8c293152',
  'Clove':    '1dbf2edd-4729-0984-3115-daa5eed44993',
  'Miks':     '7c8a4701-4de6-9355-b254-e09bc2a34b72',
};

export interface Rank {
  name: string;
  rr: number;
}

export const RANKS: Rank[] = [
  {name:'Iron 1',rr:0},{name:'Iron 2',rr:100},{name:'Iron 3',rr:200},
  {name:'Bronze 1',rr:300},{name:'Bronze 2',rr:400},{name:'Bronze 3',rr:500},
  {name:'Silver 1',rr:600},{name:'Silver 2',rr:700},{name:'Silver 3',rr:800},
  {name:'Gold 1',rr:900},{name:'Gold 2',rr:1000},{name:'Gold 3',rr:1100},
  {name:'Platinum 1',rr:1200},{name:'Platinum 2',rr:1300},{name:'Platinum 3',rr:1400},
  {name:'Diamond 1',rr:1500},{name:'Diamond 2',rr:1600},{name:'Diamond 3',rr:1700},
  {name:'Ascendant 1',rr:1800},{name:'Ascendant 2',rr:1900},{name:'Ascendant 3',rr:2000},
  {name:'Immortal 1',rr:2100},{name:'Immortal 2',rr:2200},{name:'Immortal 3',rr:2300},
  {name:'Radiant',rr:2400}
];

export const RANK_COLORS: Record<string, string> = {
  UNRANKED:'#8a8a8a',Unranked:'#8a8a8a',unranked:'#8a8a8a',
  Iron:'#8a8a8a',Bronze:'#cd7f32',Silver:'#c0c0c0',Gold:'#f5a623',
  Platinum:'#00d4e0',Diamond:'#a78bfa',Ascendant:'#3ecf8e',Immortal:'#ff5757',Radiant:'#ffd700'
};

const TIER_MAP: Record<string, number> = {
  'UNRANKED':0,'Unranked':0,'unranked':0,
  'Iron 1':3,'Iron 2':4,'Iron 3':5,'Bronze 1':6,'Bronze 2':7,'Bronze 3':8,
  'Silver 1':9,'Silver 2':10,'Silver 3':11,'Gold 1':12,'Gold 2':13,'Gold 3':14,
  'Platinum 1':15,'Platinum 2':16,'Platinum 3':17,'Diamond 1':18,'Diamond 2':19,
  'Diamond 3':20,'Ascendant 1':21,'Ascendant 2':22,'Ascendant 3':23,
  'Immortal 1':24,'Immortal 2':25,'Immortal 3':26,'Radiant':27
};

export function getRankImgUrl(rankName: string): string | null {
  if (!rankName) return 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png';
  const tier = TIER_MAP[rankName] ?? (rankName.toLowerCase().includes('unranked') ? 0 : null);
  return tier !== null && tier !== undefined ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/smallicon.png` : 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png';
}

export function getLargeRankImgUrl(rankName: string): string | null {
  if (!rankName) return 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
  const tier = TIER_MAP[rankName] ?? (rankName.toLowerCase().includes('unranked') ? 0 : null);
  return tier !== null && tier !== undefined ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png` : 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
}

export function getAgentIconUrl(name: string): string {
  const uuid = AGENT_UUIDS[name] || AGENT_UUIDS['Jett'];
  return `https://media.valorant-api.com/agents/${uuid}/displayicon.png`;
}

export function getAgentFullPortraitUrl(name: string): string {
  const uuid = AGENT_UUIDS[name] || AGENT_UUIDS['Jett'];
  return `https://media.valorant-api.com/agents/${uuid}/fullportrait.png`;
}

export function getAgentBackgroundUrl(name: string): string {
  const uuid = AGENT_UUIDS[name] || AGENT_UUIDS['Jett'];
  return `https://media.valorant-api.com/agents/${uuid}/background.png`;
}

export const AGENT_THEME_COLORS: Record<string, { primary: string; accent: string }> = {
  jett: { primary: '#00f2fe', accent: '#4facfe' },
  reyna: { primary: '#b92b27', accent: '#1565C0' },
  phoenix: { primary: '#f12711', accent: '#f5af19' },
  neon: { primary: '#00c6ff', accent: '#0072ff' },
  iso: { primary: '#7F00FF', accent: '#E100FF' },
  yoru: { primary: '#1A2980', accent: '#26D0CE' },
  raze: { primary: '#FF416C', accent: '#FF4B2B' },
  sage: { primary: '#11998e', accent: '#38ef7d' },
  killjoy: { primary: '#FFD100', accent: '#FF6A00' },
  cypher: { primary: '#ece9e6', accent: '#8e9eab' },
  chamber: { primary: '#F7971E', accent: '#FFD200' },
  deadlock: { primary: '#4B79A1', accent: '#283E51' },
  sova: { primary: '#13547a', accent: '#80d0c7' },
  breach: { primary: '#d35400', accent: '#e67e22' },
  skye: { primary: '#56ab2f', accent: '#a8e063' },
  fade: { primary: '#232526', accent: '#414345' },
  gekko: { primary: '#A8FF78', accent: '#78FFD6' },
  kayo: { primary: '#00c6ff', accent: '#0072ff' },
  brimstone: { primary: '#f857a6', accent: '#ff5858' },
  viper: { primary: '#11998e', accent: '#38ef7d' },
  omen: { primary: '#141E30', accent: '#243B55' },
  astra: { primary: '#654ea3', accent: '#eaafc8' },
  harbor: { primary: '#00c6ff', accent: '#0072ff' },
  vyse: { primary: '#a78bfa', accent: '#3ecf8e' },
  veto: { primary: '#f5a623', accent: '#ff5757' },
  waylay: { primary: '#ff5757', accent: '#ffd700' },
  tejo: { primary: '#3ecf8e', accent: '#00d4e0' },
  miks: { primary: '#e8ff47', accent: '#fa4454' }
};

export function getRankFromRR(v: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (v >= RANKS[i].rr) return RANKS[i];
  }
  return RANKS[0];
}

export function getRankColor(name: string): string {
  const tier = name.split(' ')[0];
  return RANK_COLORS[tier] || '#fff';
}

export const MAP_IMAGES_FALLBACK: Record<string, string> = {
  'Ascent':   'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
  'Bind':     'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
  'Haven':    'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png',
  'Split':    'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png',
  'Icebox':   'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png',
  'Breeze':   'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
  'Fracture': 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png',
  'Pearl':    'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png',
  'Lotus':    'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
  'Sunset':   'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
  'Abyss':    'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png',
  'District': 'https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/splash.png',
  'Kasbah':   'https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/splash.png',
  'Drift':    'https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/splash.png',
  'Glitch':   'https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/splash.png',
  'Piazza':   'https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/splash.png',
  'Summit':   'https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/splash.png',
};

export const WEAPON_TYPES: Record<string, string> = {
  'Classic':'Sidearm','Shorty':'Sidearm','Frenzy':'Sidearm','Ghost':'Sidearm','Sheriff':'Sidearm',
  'Stinger':'SMG','Spectre':'SMG',
  'Bucky':'Shotgun','Judge':'Shotgun',
  'Bulldog':'Rifle','Guardian':'Rifle','Phantom':'Rifle','Vandal':'Rifle',
  'Marshal':'Sniper','Operator':'Sniper','Outlaw':'Sniper',
  'Ares':'LMG','Odin':'LMG'
};

export const WEAPON_IMGS: Record<string, string> = {
  'Classic':'https://media.valorant-api.com/weapons/29a0cfab-485b-4d31-b7b2-3f899339a6ef/displayicon.png',
  'Shorty':'https://media.valorant-api.com/weapons/42fd8672-4024-4293-80df-348c480397a3/displayicon.png',
  'Frenzy':'https://media.valorant-api.com/weapons/44d4e95c-4157-4045-bb1d-5a7c41f71b05/displayicon.png',
  'Ghost':'https://media.valorant-api.com/weapons/1baa8564-4f45-4f99-b433-c4d1c8fad736/displayicon.png',
  'Sheriff':'https://media.valorant-api.com/weapons/e336c24c-41a4-41bf-8fb8-8af56ef7a30a/displayicon.png',
  'Stinger':'https://media.valorant-api.com/weapons/f9ae647f-49ad-48c1-8c2b-02b9843ea012/displayicon.png',
  'Spectre':'https://media.valorant-api.com/weapons/42fb8273-4afd-889a-ae46-eb9c6f8f02f3/displayicon.png',
  'Bucky':'https://media.valorant-api.com/weapons/910ac910-41df-448f-9386-9cc42fd47b1d/displayicon.png',
  'Judge':'https://media.valorant-api.com/weapons/65bc664c-4821-482f-af61-43f52edfdb9f/displayicon.png',
  'Bulldog':'https://media.valorant-api.com/weapons/ee308d48-45db-4149-9222-d05e54962971/displayicon.png',
  'Guardian':'https://media.valorant-api.com/weapons/4ade7926-4e4f-4454-93ff-137fc1b62635/displayicon.png',
  'Phantom':'https://media.valorant-api.com/weapons/ee308d48-45db-4149-9222-d05e54962971/displayicon.png',
  'Vandal':'https://media.valorant-api.com/weapons/9c82e202-4852-4cfb-bded-a59ccf684565/displayicon.png',
  'Marshal':'https://media.valorant-api.com/weapons/c689eb01-4110-c4cc-5640-20124a8a29aa/displayicon.png',
  'Operator':'https://media.valorant-api.com/weapons/a03b24d3-4319-47c6-abf4-43a00648fddb/displayicon.png',
  'Outlaw':'https://media.valorant-api.com/weapons/6f15a5c7-4332-3f39-9945-c3123d578280/displayicon.png',
  'Ares':'https://media.valorant-api.com/weapons/5f0daf0a-4757-4538-b3af-2a906506f062/displayicon.png',
  'Odin':'https://media.valorant-api.com/weapons/63e6c2b8-4a6b-1b2b-6b36-bec8977f3f91/displayicon.png',
};
