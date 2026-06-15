function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

function sanitizeHtml(htmlStr) {
  if (typeof htmlStr !== 'string') return htmlStr;
  let clean = htmlStr.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  clean = clean.replace(/on\w+\s*=\s*(['"])(?:\\\1|.)*?\1/gi, '')
               .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
               .replace(/javascript\s*:\s*[^\s"']+/gi, '');
  return clean;
}

function safeSetInnerHtml(id, htmlStr) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = htmlStr;
    return el;
  }
  return null;
}

function escapeJsString(str) {
  if (!str) return '';
  return str.replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/`/g, "\\`")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)");
}

function expandTeamName(name) {
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

function getTeamSearchName(name) {
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

function getPlayerList(match) {
  if (!match) return [];
  if (Array.isArray(match.players)) return match.players;
  return match.players?.all_players || match.players || [];
}
// API_KEY has been securely moved to the backend
let PLAYER_NAME = '';
let PLAYER_TAG  = '';
let LAST_SUCCESSFUL_NAME = '';
let LAST_SUCCESSFUL_TAG = '';
let LAST_SUCCESSFUL_REGION = '';
let LAST_SUCCESSFUL_MODE = '';
let statsLoaded = false;

const ACTS_TIMELINE = {
  'v26a3': { name: 'V26 Act 3', start: new Date('2026-04-29T00:00:00Z').getTime(), end: new Date('2026-06-24T00:00:00Z').getTime() },
  'v26a2': { name: 'V26 Act 2', start: new Date('2026-03-17T00:00:00Z').getTime(), end: new Date('2026-04-29T00:00:00Z').getTime() },
  'v26a1': { name: 'V26 Act 1', start: new Date('2026-01-07T00:00:00Z').getTime(), end: new Date('2026-03-17T00:00:00Z').getTime() },
  'v25a6': { name: 'V25 Act 6', start: new Date('2025-10-15T00:00:00Z').getTime(), end: new Date('2026-01-07T00:00:00Z').getTime() },
  'v25a5': { name: 'V25 Act 5', start: new Date('2025-08-20T00:00:00Z').getTime(), end: new Date('2025-10-15T00:00:00Z').getTime() },
  'v25a4': { name: 'V25 Act 4', start: new Date('2025-06-24T00:00:00Z').getTime(), end: new Date('2025-08-20T00:00:00Z').getTime() },
  'v25a3': { name: 'V25 Act 3', start: new Date('2025-04-30T00:00:00Z').getTime(), end: new Date('2025-06-24T00:00:00Z').getTime() },
  'v25a2': { name: 'V25 Act 2', start: new Date('2025-03-05T00:00:00Z').getTime(), end: new Date('2025-04-30T00:00:00Z').getTime() },
  'v25a1': { name: 'V25 Act 1', start: new Date('2025-01-08T00:00:00Z').getTime(), end: new Date('2025-03-05T00:00:00Z').getTime() }
};

const SEASONS_MAP = {
  'v26a3': 'e12a3',
  'v26a2': 'e12a2',
  'v26a1': 'e12a1',
  'v25a6': 'e11a3',
  'v25a5': 'e11a2',
  'v25a4': 'e11a1',
  'v25a3': 'e10a3',
  'v25a2': 'e10a2',
  'v25a1': 'e10a1'
};

const AGENT_ROLES = {
  jett:'duelist',reyna:'duelist',phoenix:'duelist',neon:'duelist',iso:'duelist',yoru:'duelist',waylay:'duelist',raze:'duelist',
  sage:'sentinel',killjoy:'sentinel',cypher:'sentinel',chamber:'sentinel',deadlock:'sentinel',vyse:'sentinel',veto:'sentinel',
  sova:'initiator',breach:'initiator',skye:'initiator',fade:'initiator',gekko:'initiator',tejo:'initiator','kay/o':'initiator',kayo:'initiator',
  brimstone:'controller',viper:'controller',omen:'controller',astra:'controller',harbor:'controller',clove:'controller',miks:'controller'
};
const AGENT_UUIDS = {
  // Duelists
  'Jett':     'add6443a-41bd-e414-f6ad-e58d267f4e95',
  'Reyna':    'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  'Phoenix':  'eb93336a-449b-9c1b-0a54-a891f7921d69',
  'Neon':     'bb2a4828-46eb-8cd1-e765-15848195d751',
  'Iso':      '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
  'Yoru':     '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
  'Raze':     'f94c3b30-42be-e959-889c-5aa313dba261',
  'Waylay':   'df1cb487-4902-002e-5c17-d28e83e78588',
  // Sentinels
  'Sage':     '569fdd95-4d10-43ab-ca70-79becc718b46',
  'Killjoy':  '1e58de9c-4950-5125-93e9-a0aee9f98746',
  'Cypher':   '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  'Chamber':  '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
  'Deadlock': 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
  'Vyse':     'efba5359-4016-a1e5-7626-b1ae76895940',
  'Veto':     '92eeef5d-43b5-1d4a-8d03-b3927a09034b',
  // Initiators
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
  // Controllers
  'Brimstone':'9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  'Viper':    '707eab51-4836-f488-046a-cda6bf494859',
  'Omen':     '8e253930-4c05-31dd-1b6c-968525494517',
  'Astra':    '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  'Harbor':   '95b78ed7-4637-86d9-7e41-71ba8c293152',
  'Clove':    '1dbf2edd-4729-0984-3115-daa5eed44993',
  'Miks':     '7c8a4701-4de6-9355-b254-e09bc2a34b72',
};

const RANKS=[
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
const RANK_COLORS={
  Iron:'#8a8a8a',Bronze:'#cd7f32',Silver:'#c0c0c0',Gold:'#f5a623',
  Platinum:'#00d4e0',Diamond:'#a78bfa',Ascendant:'#3ecf8e',Immortal:'#ff5757',Radiant:'#ffd700'
};

function getRankImgUrl(rankName){
  const tierMap={'Iron 1':3,'Iron 2':4,'Iron 3':5,'Bronze 1':6,'Bronze 2':7,'Bronze 3':8,'Silver 1':9,'Silver 2':10,'Silver 3':11,'Gold 1':12,'Gold 2':13,'Gold 3':14,'Platinum 1':15,'Platinum 2':16,'Platinum 3':17,'Diamond 1':18,'Diamond 2':19,'Diamond 3':20,'Ascendant 1':21,'Ascendant 2':22,'Ascendant 3':23,'Immortal 1':24,'Immortal 2':25,'Immortal 3':26,'Radiant':27};
  const tier=tierMap[rankName];
  return tier?`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/smallicon.png`:null;
}
function getRankFromRR(v){for(let i=RANKS.length-1;i>=0;i--){if(v>=RANKS[i].rr)return RANKS[i];}return RANKS[0];}
function getRankColor(n){const t=n.split(' ')[0];return RANK_COLORS[t]||'#fff';}
// ── Live asset cache — fetches from valorant-api.com at startup ──
const _assetCache = { agents: {}, maps: {}, weapons: {}, ready: false };

async function initAssetCache() {
  try {
    const [agentRes, mapRes, wpnRes] = await Promise.all([
      fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true'),
      fetch('https://valorant-api.com/v1/maps'),
      fetch('https://valorant-api.com/v1/weapons')
    ]);
    const [agentData, mapData, weaponData] = await Promise.all([agentRes.json(), mapRes.json(), wpnRes.json()]);

    // Agents: name → { uuid, role, iconUrl, portraitUrl }
    (agentData.data || []).forEach(a => {
      const name = a.displayName;
      _assetCache.agents[name] = {
        uuid:       a.uuid,
        iconUrl:    a.displayIcon,
        portraitUrl:a.fullPortrait || a.fullPortraitV2 || a.displayIcon,
        role:       (a.role?.displayName || '').toLowerCase()
      };
      // Also index by lowercase for fuzzy matching
      _assetCache.agents[name.toLowerCase()] = _assetCache.agents[name];
      if (name.toLowerCase() === 'kay/o') {
        _assetCache.agents['kayo'] = _assetCache.agents[name];
      }
    });

    // Maps: displayName → { uuid, splashUrl, minimap }
    (mapData.data || []).forEach(m => {
      if (!m.displayName || m.displayName === 'The Range' || m.displayName === 'Shooting Range') return;
      // splash is the wide banner; fallback to listViewIcon or displayIcon
      const splashUrl = m.splash || m.listViewIcon || m.displayIcon || null;
      console.log('[Assets] Map:', m.displayName, '| splash:', splashUrl ? splashUrl.substring(0,60)+'...' : 'NULL');
      _assetCache.maps[m.displayName] = {
        uuid:      m.uuid,
        splashUrl: splashUrl,
        minimap:   m.displayIcon
      };
      _assetCache.maps[m.displayName.toLowerCase()] = _assetCache.maps[m.displayName];
    });

    // Weapons: uuid -> { displayName, displayIcon }
    (weaponData.data || []).forEach(w => {
      _assetCache.weapons[w.uuid.toLowerCase()] = { name: w.displayName, iconUrl: w.displayIcon };
      _assetCache.weapons[w.displayName.toLowerCase()] = { name: w.displayName, iconUrl: w.displayIcon };
    });

    _assetCache.ready = true;
    const mapNames = Object.keys(_assetCache.maps).filter(k => k === k.charAt(0).toUpperCase() + k.slice(1));
    console.log('[Assets] Maps loaded:', mapNames.join(', '));
    console.log(`[Assets] Loaded ${Object.keys(_assetCache.agents).length/2} agents, ${mapNames.length} maps`);

    // Always re-render agents + maps with correct live URLs
    console.log('[Assets] Re-rendering. lastMatches:', _lastAllMatches.length, 'mapData keys:', Object.keys(_lastMapData).length);
    if (Object.keys(_lastMapData).length) {
      renderAgents(_lastAgentMap, _lastAllMatches);
      renderMaps(_lastMapData);
    }
    // Also patch any img tags directly regardless
    document.querySelectorAll('img[data-agent]').forEach(img => {
      const url = getAgentIconUrl(img.dataset.agent);
      if (url) img.src = url;
    });
    document.querySelectorAll('img[data-map]').forEach(img => {
      const url = getMapImg(img.dataset.map);
      if (url) img.src = url;
    });
  } catch(e) {
    console.warn('[Assets] Cache fetch failed, using fallback UUIDs:', e.message);
    _assetCache.ready = false;
  }
}

function getAgentIconUrl(name) {
  if (!name) return null;
  let cleanName = name;
  if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  // Try live cache first
  const cached = _assetCache.agents[cleanName] || _assetCache.agents[cleanName.toLowerCase()];
  if (cached?.iconUrl) return cached.iconUrl;
  // Fallback to hardcoded UUID map
  const u = AGENT_UUIDS[cleanName];
  if (u) return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
  return null;
}

function getAgentPortraitUrl(name) {
  if (!name) return null;
  let cleanName = name;
  if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  const cached = _assetCache.agents[cleanName] || _assetCache.agents[cleanName.toLowerCase()];
  if (cached?.portraitUrl) return cached.portraitUrl;
  const u = AGENT_UUIDS[cleanName];
  if (u) return `https://media.valorant-api.com/agents/${u}/fullportrait.png`;
  return null;
}

function getRoleClass(agentName) {
  // Try live cache for role
  let cleanName = agentName || '';
  if (cleanName.toLowerCase() === 'kayo' || cleanName.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  const cached = _assetCache.agents[cleanName] || _assetCache.agents[cleanName.toLowerCase()];
  if (cached?.role) {
    const r = cached.role;
    if (r.includes('duelist'))   return 'duelist';
    if (r.includes('sentinel'))  return 'sentinel';
    if (r.includes('initiator')) return 'initiator';
    if (r.includes('controller'))return 'controller';
  }
  return AGENT_ROLES[cleanName.toLowerCase().replace(/\//g,'')] || 'duelist';
}

// Hardcoded map splashes as fallback (known-good UUIDs)
const MAP_IMAGES_FALLBACK = {
  'Ascent':  'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
  'Bind':    'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
  'Breeze':  'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
  'Fracture':'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png',
  'Haven':   'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png',
  'Icebox':  'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png',
  'Lotus':   'https://media.valorant-api.com/maps/2fe4ed3a-450a-01be-2778-15ed97f17c6d/splash.png',
  'Pearl':   'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png',
  'Split':   'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png',
  'Sunset':  'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39049f7702f2/splash.png',
  'Abyss':   'https://media.valorant-api.com/maps/224b0a95-48b9-d703-5ebe-d58a2f2d3774/splash.png',
  'Corrode': 'https://media.valorant-api.com/maps/fc28a86b-4279-6d37-7499-08a285d22f47/splash.png',
};

function getMapImg(name) {
  if (!name) return null;
  // 1. Try live cache (fetched at startup from valorant-api.com)
  const cached = _assetCache.maps[name] || _assetCache.maps[(name||'').toLowerCase()];
  if (cached?.splashUrl) return cached.splashUrl;
  // 2. Try fallback hardcoded UUIDs
  return MAP_IMAGES_FALLBACK[name] || null;
}

// Called when a map image 404s — triggers a targeted re-fetch for just that map
async function retryMapImg(imgEl, mapName) {
  if (!mapName || imgEl._retried) return;
  imgEl._retried = true;
  try {
    if (!_assetCache.ready) {
      // Cache not loaded yet — wait for it then retry
      await new Promise(r => setTimeout(r, 2000));
      const url = getMapImg(mapName);
      if (url) { imgEl.src = url; return; }
    }
    // Fetch just this map from the API by searching all maps
    const res = await fetch('https://valorant-api.com/v1/maps');
    const data = await res.json();
    const found = (data.data||[]).find(m => {
      const dn = (m.displayName||'').toLowerCase();
      const mn = mapName.toLowerCase();
      return dn === mn || dn.includes(mn) || mn.includes(dn);
    });
    if (found) {
      console.log('[Assets] Resolved map', mapName, '->', found.displayName, found.uuid);
    }
    if (found?.splash) {
      // Update cache
      _assetCache.maps[mapName] = { splashUrl: found.splash, uuid: found.uuid };
      _assetCache.maps[mapName.toLowerCase()] = _assetCache.maps[mapName];
      imgEl.src = found.splash;
    } else {
      imgEl.parentElement.style.background = 'var(--surface2)';
    }
  } catch(e) {
    imgEl.parentElement.style.background = 'var(--surface2)';
  }
}

function setStatus(msg,type=''){ if(type==='error') { showToast(msg); } else { console.log('[STATUS]', msg); } }
function showToast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// ── Memory-aware cleanup: monitors browser memory and evicts data if approaching limit ──
function checkMemoryPressure() {
  try {
    if (!performance.memory) return;
    const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
    const usage = usedMB / limitMB;
    if (usage > 0.75) {
      console.warn(`[MEMORY] High memory usage: ${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB (${Math.round(usage*100)}%)`);
      // Evict the match detail store entirely
      if (window._matchDetailStore.size > 5) {
        const keys = [...window._matchDetailStore.keys()];
        for (let i = 5; i < keys.length; i++) window._matchDetailStore.delete(keys[i]);
        console.warn('[MEMORY] Evicted old match detail data');
      }
      // Close open match panels to free DOM memory
      document.querySelectorAll('.match-panel.open').forEach(p => { p.classList.remove('open'); p.innerHTML = ''; });
      document.querySelectorAll('.match-row.open').forEach(r => r.classList.remove('open'));
    }
  } catch(e) {}
}
setInterval(checkMemoryPressure, 15000);

// ── Copy Riot ID ──
function copyRiotId() {
  const name = document.getElementById('player-name-input')?.value.trim() || '';
  const tag  = document.getElementById('player-tag-input')?.value.trim().replace(/^#/,'') || '';
  if (!name) { showToast('No player loaded'); return; }
  const id = tag ? `${name}#${tag}` : name;
  navigator.clipboard.writeText(id).then(() => {
    showToast(`Copied: ${id}`);
  }).catch(() => { showToast('Copy failed — check browser permissions'); });
}

// ── Back to Top visibility is now managed by the Unified Scroll Manager ──

// ── Performance Trend Chart ──
let _perfTrendChart = null;
function renderTrendChart(matches) {
  const placeholder = document.getElementById('perf-trend-placeholder');
  const canvas = document.getElementById('perf-trend-chart');
  if (!canvas) return;

  if (!matches || matches.length < 2) {
    if (placeholder) placeholder.style.display = 'block';
    canvas.style.display = 'none';
    if (_perfTrendChart) { _perfTrendChart.destroy(); _perfTrendChart = null; }
    return;
  }

  const isMobile = window.innerWidth <= 600;
  const data = matches.slice().reverse(); // oldest → newest
  const labels = data.map((m, i) => {
    const ag = (m.agentName || '').substring(0, 3).toUpperCase();
    return `#${i + 1} ${ag}`;
  });

  const kdVals  = data.map(m => m.deaths > 0 ? +(m.kills / m.deaths).toFixed(2) : m.kills);
  const acsVals = data.map(m => +(m.acs / 100).toFixed(2)); // scale to ~same axis as KD
  const hsVals  = data.map(m => +((m.hs / Math.max(1, m.shots)) * 100).toFixed(1)); // HS% from shots
  const hsScaled = hsVals.map(v => +(v / 10).toFixed(2)); // scale HS% /10 so all 3 fit on same axis

  if (placeholder) placeholder.style.display = 'none';
  canvas.style.display = 'block';

  if (_perfTrendChart) { _perfTrendChart.destroy(); _perfTrendChart = null; }

  const ctx = canvas.getContext('2d');
  _perfTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'K/D',
          data: kdVals,
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232,255,71,0.06)',
          borderWidth: 2,
          pointRadius: isMobile ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#e8ff47',
          tension: 0.35,
          fill: false,
        },
        {
          label: 'ACS/100',
          data: acsVals,
          borderColor: '#3ecf8e',
          backgroundColor: 'rgba(62,207,142,0.06)',
          borderWidth: 2,
          pointRadius: isMobile ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#3ecf8e',
          tension: 0.35,
          fill: false,
        },
        {
          label: 'HS%',
          data: hsScaled,
          borderColor: '#ff5757',
          backgroundColor: 'rgba(255,87,87,0.06)',
          borderWidth: 2,
          pointRadius: isMobile ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ff5757',
          tension: 0.35,
          fill: false,
          borderDash: [4, 3],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1f',
          borderColor: '#2a2a2f',
          borderWidth: 1,
          titleColor: '#888',
          bodyColor: '#f0f0f2',
          titleFont: { family: 'DM Mono', size: 9 },
          bodyFont: { family: 'Barlow Condensed', size: 14, weight: '700' },
          padding: 10,
          callbacks: {
            title: (items) => {
              const m = data[items[0].dataIndex];
              return `${m.agentName} · ${m.map} · ${m.won ? 'WIN' : 'LOSS'}`;
            },
            label: (item) => {
              const m = data[item.dataIndex];
              if (item.datasetIndex === 0) return `K/D: ${item.raw}`;
              if (item.datasetIndex === 1) return `ACS: ${m.acs}`;
              return `HS%: ${hsVals[item.dataIndex]}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: !isMobile, color: 'rgba(255,255,255,0.04)' },
          ticks: { display: !isMobile, color: '#555', font: { family: 'DM Mono', size: 8 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#555', font: { family: 'DM Mono', size: 9 } },
          min: 0
        }
      }
    }
  });
}

// ── STAGGER ANIMATION ──
function animateIn(selector, baseDelay=0) {
  const els = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
  els.forEach((el,i) => {
    el.style.animationDelay = `${baseDelay + i*60}ms`;
    el.classList.add('visible');
  });
}

// ── INDEXEDDB MATCH STORE ──
const DB_NAME = 'ValStatsDB';
const DB_VERSION = 1;
const STORE_NAME = 'matches';
let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'matchId' });
        store.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function normalizeMode(rawMode) {
  if (!rawMode) return "";
  const m = rawMode.toLowerCase().replace(/ /g, "").replace(/-/g, "").replace(/_/g, "");
  if (m === "teamdm") return "teamdeathmatch";
  return m;
}

async function saveMatches(matches) {
  const db = await openDB();
  
  // Read all existing keys first in a readonly pass to avoid async delays inside the write transaction
  const existingMap = {};
  try {
    const txRead = db.transaction(STORE_NAME, 'readonly');
    const storeRead = txRead.objectStore(STORE_NAME);
    const all = await new Promise((res) => {
      const req = storeRead.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });
    all.forEach(r => {
      existingMap[r.matchId] = r.data;
    });
  } catch(e) {}

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let saved = 0;
    matches.forEach(m => {
      const id = m.metadata?.matchid || m.metadata?.match_id;
      if (!id) return;
      
      const actualMode = normalizeMode(m.metadata?.mode || m.metadata?.queue || window._currentMode || 'competitive');
      
      // Key includes player+mode so different players/modes don't mix
      const storeKey = `${PLAYER_NAME.toLowerCase()}#${PLAYER_TAG.toLowerCase()}|${actualMode}|${id}`;
      
      const existing = existingMap[storeKey];
      const newHasDetails = m.rounds && m.rounds.length > 0 && m.rounds[0].player_stats && m.rounds[0].player_stats.length > 0;
      const existingHasDetails = existing && existing.rounds && existing.rounds.length > 0 && existing.rounds[0].player_stats;
      
      // If the stored match already has detailed rounds, do not overwrite/downgrade it with a raw list summary
      if (existingHasDetails && !newHasDetails) {
        return;
      }
      
      store.put({ matchId: storeKey, date: m.metadata?.game_start || Date.now(), data: m });
      saved++;
    });
    tx.oncomplete = () => resolve(saved);
    tx.onerror = () => reject(tx.error);
  });
}

function getActivePlayerInfo() {
  let name = (typeof PLAYER_NAME !== 'undefined' ? PLAYER_NAME : '') || '';
  let tag = (typeof PLAYER_TAG !== 'undefined' ? PLAYER_TAG : '') || '';
  
  if (!name || !tag) {
    name = document.getElementById('player-name-input')?.value?.trim() || 
           document.getElementById('l-name')?.value?.trim() || '';
    tag = document.getElementById('player-tag-input')?.value?.trim()?.replace(/^#/, '') || 
          document.getElementById('l-tag')?.value?.trim()?.replace(/^#/, '') || '';
  }
  
  if (!name || !tag) {
    try {
      const params = new URLSearchParams(window.location.search);
      name = params.get('player') || '';
      tag = params.get('tag') || '';
    } catch(e) {}
  }
  
  return {
    name: name.trim(),
    tag: tag.trim().replace(/^#/, '')
  };
}

function getActiveMode() {
  let mode = (typeof _currentMode !== 'undefined' ? _currentMode : '') || (typeof window !== 'undefined' && window._currentMode) || '';
  if (!mode) {
    mode = document.getElementById('mode-select')?.value || 
           document.getElementById('l-mode')?.value || '';
  }
  if (!mode) {
    try {
      const params = new URLSearchParams(window.location.search);
      mode = params.get('mode') || '';
    } catch(e) {}
  }
  return mode || 'competitive';
}

async function loadAllMatches() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    let req;
    if (store.indexNames.contains('date')) {
      req = store.index('date').getAll();
    } else {
      req = store.getAll();
    }
    req.onsuccess = () => {
      const activeMode = getActiveMode();
      const currentModeNormalized = normalizeMode(activeMode);
      const playerInfo = getActivePlayerInfo();
      const prefix = `${playerInfo.name.toLowerCase()}#${playerInfo.tag.toLowerCase()}|${currentModeNormalized}|`;
      
      const all = (req.result || []).filter(r => {
        if (!r.matchId) return false;
        const matchIdLower = r.matchId.toLowerCase();
        if (!matchIdLower.startsWith(prefix)) return false;
        
        // Strict double-check: verify that the actual match mode matches current mode
        const mMode = r.data?.metadata?.mode || r.data?.metadata?.queue;
        return normalizeMode(mMode) === currentModeNormalized;
      });
      
      const records = all.sort((a,b) => (b.date||0)-(a.date||0)).slice(0, 50);
      resolve(records.map(r => r.data));
    };
    req.onerror = () => reject(req.error);
  });
}

async function clearAllMatches() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearPlayerMatches() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const activeMode = getActiveMode();
    const currentModeNormalized = normalizeMode(activeMode);
    const playerInfo = getActivePlayerInfo();
    const prefix = `${playerInfo.name.toLowerCase()}#${playerInfo.tag.toLowerCase()}|${currentModeNormalized}|`;
    
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.key && cursor.key.toLowerCase().startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getMatchCount() {
  const db = await openDB();
  return new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

// ── LOADING OVERLAY TIPS & LORE ROTATOR SYSTEM ──
const VALORANT_LORE = [
  { tag: "VALORANT LORE", text: "Season 2026 officially began with Patch 12.00 on January 7, introducing massive game-changing updates." },
  { tag: "VALORANT LORE", text: "The 2026 lore heavily focuses on an escalating ideological divide: Alpha vs Omega, and Viper vs Brimstone." },
  { tag: "VALORANT LORE", text: "The Season 2026 cinematic 'WHY WE FIGHT BACK' highlighted the intense, ongoing conflict between the Alpha and Omega protocols." },
  { tag: "VALORANT LORE", text: "A brand new sidearm weapon, the 'Bandit' pistol, was introduced to the game's arsenal in 2026." },
  { tag: "VALORANT LORE", text: "The Bandit pistol provides players with a fresh tactical option for thrifty rounds and economy management." },
  { tag: "VALORANT LORE", text: "Breeze made a grand return to the active competitive map pool in 2026 with a massive structural rework." },
  { tag: "VALORANT LORE", text: "To ease players into the reworked Breeze, Riot reduced Ranked Rating (RR) losses on the map by 50% for two weeks." },
  { tag: "VALORANT LORE", text: "A brand new limited-time game mode called 'All Random, One Site' (AR1S) debuted in early 2026." },
  { tag: "VALORANT LORE", text: "The game's hidden Matchmaking Rating (MMR) system was completely overhauled to improve overall ranked match quality." },
  { tag: "VALORANT LORE", text: "Veteran agents Breach, Brimstone, Harbor, Sage, and Vyse all received significant balance updates in Season 2026." },
  { tag: "VALORANT LORE", text: "Tejo, one of the newer additions to the Protocol, also saw targeted gameplay tweaks at the start of the year." },
  { tag: "VALORANT LORE", text: "The relatively new map 'Corrode' received specific updates to its wall penetration mechanics." },
  { tag: "VALORANT LORE", text: "Haven also received adjustments to its wallbang spots alongside Corrode to balance defensive setups." },
  { tag: "VALORANT LORE", text: "The Season 2026 cinematic quickly amassed over six million views, fueling community hopes for an animated series." },
  { tag: "VALORANT LORE", text: "Replays were finally added to VALORANT for Custom games, fulfilling a heavily requested feature since the game's launch." },
  { tag: "VALORANT LORE", text: "A new player behavior system and penalty ladder were introduced to aggressively combat disruptive players in ranked queues." },
  { tag: "VALORANT LORE", text: "The lore reveals that the Dev team is leaning heavily into the friction between Viper's ruthlessness and Brimstone's leadership." },
  { tag: "VALORANT LORE", text: "Season 2026 is viewed by the community as a major cultural reset, rejuvenating the game's competitive joy." },
  { tag: "VALORANT LORE", text: "The Alpha vs Omega Earth conflict remains the absolute core of why the agents are currently deployed globally." },
  { tag: "VALORANT LORE", text: "The addition of the Bandit marked the first time a new weapon was added to the game since the Outlaw sniper rifle." },
  { tag: "VALORANT LORE", text: "The introduction of Custom game replays allows pro teams like Global Esports to analyze strategies with perfect detail." },
  { tag: "VALORANT LORE", text: "'Complacency will destroy us' is a key lore quote from Viper, perfectly setting the tone for the brutal 2026 conflicts." },
  { tag: "VALORANT LORE", text: "The AR1S mode (All Random, One Site) forces players to practice chaotic site retakes under unpredictable conditions." },
  { tag: "VALORANT LORE", text: "The Season 2026 kickoff updates comprehensively affected everything from UI and gameplay to community standards and weapon balancing." },
  { tag: "VALORANT LORE", text: "The VALORANT Protocol is currently bracing for unprecedented strikes from Omega forces as the year progresses." }
];

const VCT_ESPORTS = [
  { tag: "VCT ESPORTS", text: "VCT 2026 kicked off its global circuit with Masters Santiago in Chile, featuring a $1,000,000 prize pool." },
  { tag: "VCT ESPORTS", text: "Masters Santiago was the first Kickoff-phase Masters event to feature a massive 12-team format." },
  { tag: "VCT ESPORTS", text: "Nongshim RedForce shocked the world by becoming the first Ascension team to ever win a Masters trophy." },
  { tag: "VCT ESPORTS", text: "Nongshim RedForce swept Paper Rex 3-0 in the Grand Finals of Masters Santiago to take the crown." },
  { tag: "VCT ESPORTS", text: "Lee 'Dambi' Hyuk-kyu from Nongshim RedForce was crowned the overall MVP of Masters Santiago." },
  { tag: "VCT ESPORTS", text: "Khalish 'd4v41' Rusyaidee from Paper Rex recorded the highest overall kills at Masters Santiago with 371." },
  { tag: "VCT ESPORTS", text: "Martin 'marteen' Pátek of Gentle Mates secured the highest Average Combat Score (ACS) at Santiago with 268." },
  { tag: "VCT ESPORTS", text: "Masters London 2026 marks the second major international VCT event of the year, running from June 6-21 in the UK." },
  { tag: "VCT ESPORTS", text: "Global Esports successfully secured their spot at Masters London as the Pacific #3 seed." },
  { tag: "VCT ESPORTS", text: "Global Esports' run in VCT Pacific Stage 1 proved their tier-one status, taking down massive regional rivals to qualify." },
  { tag: "VCT ESPORTS", text: "Paper Rex claimed the Pacific #1 seed for London after sweeping FULL SENSE 3-0 in the Stage 1 Grand Final." },
  { tag: "VCT ESPORTS", text: "FULL SENSE represents the Pacific region as the #2 seed heading into the London Swiss Stage." },
  { tag: "VCT ESPORTS", text: "During Pacific Stage 1, Global Esports fell to Paper Rex 0-3 in the Lower Finals but still confidently punched their London ticket." },
  { tag: "VCT ESPORTS", text: "G2 Esports enters Masters London as the undisputed #1 seed representing the Americas region." },
  { tag: "VCT ESPORTS", text: "LEVIATÁN and NRG round out the Americas representatives for London as the #2 and #3 seeds." },
  { tag: "VCT ESPORTS", text: "Team Heretics claimed the #1 seed in EMEA, advancing directly to the Masters London Playoffs." },
  { tag: "VCT ESPORTS", text: "Team Vitality and FUT Esports represent the highly competitive EMEA region as the #2 and #3 seeds." },
  { tag: "VCT ESPORTS", text: "EDward Gaming continues their absolute regional dominance as the #1 seed from VCT China." },
  { tag: "VCT ESPORTS", text: "Xi Lai Gaming and Dragon Ranger Gaming represent China's #2 and #3 seeds in the London Swiss Stage." },
  { tag: "VCT ESPORTS", text: "The Esports World Cup (EWC) 2026 in Riyadh features a massive $2,000,000 prize pool for VALORANT." },
  { tag: "VCT ESPORTS", text: "Elite teams like Paper Rex, Team Heretics, and EDward Gaming have already secured their spots at EWC 2026." },
  { tag: "VCT ESPORTS", text: "JioBLAST and the Esports Foundation launched 'India Rising', a nationwide tournament feeding into the EWC ecosystem." },
  { tag: "VCT ESPORTS", text: "Masters London features a ruthless Swiss Stage where teams like Global Esports must secure two wins to advance." },
  { tag: "VCT ESPORTS", text: "The Pick'Ems system, powered by AWS, returned for Masters London, allowing fans to predict the entire 12-team bracket." },
  { tag: "VCT ESPORTS", text: "Global Esports carries the hopes of the massive Indian VALORANT community onto the international stage in London." }
];

let _loadingTipsQueue = [...VALORANT_LORE, ...VCT_ESPORTS];
let _loadingRotatorInterval = null;
let _loadingProgressInterval = null;
let _currentTipIndex = 0;

function generateVctTrivia(comps) {
  if (!comps || !comps.length) return [];
  const trivia = [];
  try {
    const agentCounts = {};
    let totalComps = comps.length;
    const mapAgentCounts = {};
    const mapTotals = {};
    const agentWinCounts = {};
    const agentMatchCounts = {};
    
    // Only process latest 200 comps to save memory
    const limitedComps = comps.slice(0, 200);
    
    limitedComps.forEach(c => {
      const agents = c.agents || [];
      const map = c.map_name;
      const won = c.has_won;
      
      if (map) {
        mapTotals[map] = (mapTotals[map] || 0) + 1;
        if (!mapAgentCounts[map]) mapAgentCounts[map] = {};
      }
      
      agents.forEach(a => {
        const normalized = a.charAt(0).toUpperCase() + a.slice(1);
        agentCounts[normalized] = (agentCounts[normalized] || 0) + 1;
        agentMatchCounts[normalized] = (agentMatchCounts[normalized] || 0) + 1;
        if (won) {
          agentWinCounts[normalized] = (agentWinCounts[normalized] || 0) + 1;
        }
        if (map) {
          mapAgentCounts[map][normalized] = (mapAgentCounts[map][normalized] || 0) + 1;
        }
      });
    });
    
    Object.keys(agentCounts).forEach(agent => {
      const picks = agentCounts[agent];
      const rate = Math.round((picks / totalComps) * 100);
      if (rate > 5) {
        trivia.push({
          tag: "VCT AGENT PICK RATE",
          text: `In recent professional tournaments, ${agent} was picked by ${rate}% of all teams.`
        });
      }
      const matches = agentMatchCounts[agent];
      if (matches >= 10) {
        const winRate = Math.round((agentWinCounts[agent] / matches) * 100);
        trivia.push({
          tag: "VCT AGENT PERFORMANCE",
          text: `${agent} currently holds a ${winRate}% win rate when selected in professional matches.`
        });
      }
    });
    
    Object.keys(mapAgentCounts).forEach(map => {
      const mapTotal = mapTotals[map];
      if (mapTotal < 10) return;
      const agentsOnMap = mapAgentCounts[map];
      Object.keys(agentsOnMap).forEach(agent => {
        const picks = agentsOnMap[agent];
        const rate = Math.round((picks / mapTotal) * 100);
        const capitalizedMap = map.charAt(0).toUpperCase() + map.slice(1);
        if (rate > 25) {
          trivia.push({
            tag: `VCT META: ${capitalizedMap.toUpperCase()}`,
            text: `${agent} is highly favored on ${capitalizedMap}, with a ${rate}% pick rate in pro matches.`
          });
        }
      });
    });
    
    const recentMatches = comps.filter(c => c.has_won && c.score && c.opposing_team).slice(0, 30);
    if (recentMatches.length) {
      for (let i = 0; i < 6; i++) {
        const randMatch = recentMatches[Math.floor(Math.random() * recentMatches.length)];
        const capitalizedMap = randMatch.map_name ? (randMatch.map_name.charAt(0).toUpperCase() + randMatch.map_name.slice(1)) : "";
        const cleanEvent = randMatch.event_name ? randMatch.event_name.replace(/Group Stage–|Swiss Stage–|Playoffs–/g, "") : "VCT Tour";
        trivia.push({
          tag: "VCT RECENT MATCH",
          text: `${randMatch.team_name} defeated ${randMatch.opposing_team} with a score of ${randMatch.score} on ${capitalizedMap} during the ${cleanEvent}.`
        });
      }
    }
  } catch (e) {
    console.error("Failed to generate VCT trivia:", e);
  }
  return trivia;
}

async function loadVctComps() {
  try {
    const res = await fetch('/vct_pro_comps.json');
    if (res.ok) {
      const comps = await res.json();
      const vctTrivia = generateVctTrivia(comps);
      if (vctTrivia.length > 0) {
        _loadingTipsQueue = [...VALORANT_LORE, ...VCT_ESPORTS, ...vctTrivia];
        console.log(`[Loading Rotator] Loaded VCT comps, generated ${vctTrivia.length} VCT stats trivia.`);
      }
    }
  } catch (e) {
    console.warn("Failed to load VCT comps for trivia:", e);
  }
}

function startLoadingRotator() {
  statsLoaded = false;
  const form = document.getElementById('landing-lookup-form');
  const card = document.getElementById('landing-loading-card');
  if (!form || !card) return;
  
  form.style.display = 'none';
  card.style.display = 'flex';
  
  // Hide recent searches and bookmarks card to make the loader stand alone
  const historyCard = document.getElementById('landing-history-card');
  if (historyCard) historyCard.style.display = 'none';
  
  // Set dynamic subtitle for target player info
  const subtitleEl = document.getElementById('loading-subtitle-text');
  if (subtitleEl) {
    const region = (document.getElementById('l-region')?.value || 'ap').toUpperCase();
    const mode = (document.getElementById('l-mode')?.value || 'competitive').toUpperCase();
    subtitleEl.innerHTML = `SYNCING <span style="color:var(--accent); font-weight:700;">${escapeHtml(PLAYER_NAME)}#${escapeHtml(PLAYER_TAG)}</span> [${escapeHtml(region)} · ${escapeHtml(mode)}]`;
  }
  
  const progressFill = document.getElementById('loading-progress-fill');
  if (progressFill) progressFill.style.width = '5%';
  
  _currentTipIndex = Math.floor(Math.random() * _loadingTipsQueue.length);
  updateLoadingTip();
  
  if (_loadingRotatorInterval) clearInterval(_loadingRotatorInterval);
  _loadingRotatorInterval = setInterval(() => {
    _currentTipIndex = (_currentTipIndex + 1) % _loadingTipsQueue.length;
    const tipText = document.getElementById('loading-tip-text');
    const tipTag = document.getElementById('loading-tip-tag');
    if (tipText && tipTag) {
      tipText.style.opacity = '0';
      tipTag.style.opacity = '0';
      setTimeout(() => {
        updateLoadingTip();
        tipText.style.opacity = '1';
        tipTag.style.opacity = '1';
      }, 250);
    } else {
      updateLoadingTip();
    }
  }, 4000);
  
  let progress = 5;
  if (_loadingProgressInterval) clearInterval(_loadingProgressInterval);
  _loadingProgressInterval = setInterval(() => {
    if (progress < 40) {
      progress += Math.floor(Math.random() * 8) + 4;
    } else if (progress < 75) {
      progress += Math.floor(Math.random() * 5) + 2;
    } else if (progress < 90) {
      progress += Math.floor(Math.random() * 2) + 1;
    }
    if (progressFill) progressFill.style.width = `${progress}%`;
  }, 300);
}

function updateLoadingTip() {
  const tagEl = document.getElementById('loading-tip-tag');
  const textEl = document.getElementById('loading-tip-text');
  if (!tagEl || !textEl) return;
  const current = _loadingTipsQueue[_currentTipIndex];
  tagEl.textContent = current.tag;
  textEl.textContent = current.text;
}

function stopLoadingRotator() {
  if (_loadingRotatorInterval) {
    clearInterval(_loadingRotatorInterval);
    _loadingRotatorInterval = null;
  }
  if (_loadingProgressInterval) {
    clearInterval(_loadingProgressInterval);
    _loadingProgressInterval = null;
  }
  
  const progressFill = document.getElementById('loading-progress-fill');
  if (progressFill) progressFill.style.width = '100%';
  
  const delay = statsLoaded ? 450 : 200;
  setTimeout(() => {
    const form = document.getElementById('landing-lookup-form');
    const card = document.getElementById('landing-loading-card');
    if (form && card) {
      card.style.display = 'none';
      form.style.display = 'block';
    }
    // Restore bookmarks and recent searches card visibility
    const historyCard = document.getElementById('landing-history-card');
    if (historyCard) historyCard.style.display = 'flex';
  }, delay);
}

// Load stored matches on page open
window.addEventListener('DOMContentLoaded', async () => {
  // Trigger loading VCT comps for trivia rotator immediately in the background
  loadVctComps();
  // Fetch live agent/map assets from valorant-api.com (no auth needed, free)
  initAssetCache();
  try {
    const count = await getMatchCount();
    const savedProfile = loadMyProfile();
    
    // Always render landing stats history and personal profile card
    renderLandingHistory();
    renderLandingProfile();
    
    // Sync ranks in the background
    setTimeout(syncBookmarkRanks, 1500);
    
    if (savedProfile) {
      // Prefill landing lookup input fields
      if (document.getElementById('l-name')) document.getElementById('l-name').value = savedProfile.name;
      if (document.getElementById('l-tag')) document.getElementById('l-tag').value = savedProfile.tag;
      if (document.getElementById('l-region') && savedProfile.region) document.getElementById('l-region').value = savedProfile.region;
      if (document.getElementById('l-mode') && savedProfile.mode) document.getElementById('l-mode').value = savedProfile.mode;
      
      // Prefill topbar header input fields
      if (document.getElementById('player-name-input')) document.getElementById('player-name-input').value = savedProfile.name;
      if (document.getElementById('player-tag-input')) document.getElementById('player-tag-input').value = savedProfile.tag;
      if (document.getElementById('region-select') && savedProfile.region) document.getElementById('region-select').value = savedProfile.region;
      if (document.getElementById('mode-select') && savedProfile.mode) document.getElementById('mode-select').value = savedProfile.mode;
      
      PLAYER_NAME = savedProfile.name;
      PLAYER_TAG = savedProfile.tag;
      window._currentMode = savedProfile.mode || 'competitive';
      
      // Initialize last successful lookup state on page load
      LAST_SUCCESSFUL_NAME = savedProfile.name;
      LAST_SUCCESSFUL_TAG = savedProfile.tag;
      LAST_SUCCESSFUL_REGION = savedProfile.region || 'ap';
      LAST_SUCCESSFUL_MODE = savedProfile.mode || 'competitive';
      
      const mmrKey = `vt_mmr_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}`;
      try { window._rawMmrData = JSON.parse(localStorage.getItem(mmrKey)); } catch(e) {}
      
      if (count > 0) {
        setStatus(`${count} matches stored — hit Fetch to update`, 'ok');
        const stored = await loadAllMatches();
        processMatches(stored);
        // Prefetching all match details in the background is disabled to prevent HenrikDev API 429 rate limit blocks, IndexedDB lockups, and page crashes. Details are fetched dynamically on expansion.
      }
      // Note: We deliberately do NOT call dismissLanding() here anymore! 
      // The user now lands on the Login page with their last profile Riot ID elegantly prefilled,
      // letting them explicitly click "Fetch Stats" or look up other players easily.
    } else if (count > 0) {
      setStatus(`${count} matches cached — fetch to view`, 'ok');
    }
  } catch(e) { console.warn('DB load:', e); }

  // Player search — Enter key
  ['player-name-input','player-tag-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') fetchAll();
    });
  });
  // Landing Enter key
  ['l-name','l-tag'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') landingFetch();
    });
  });
  // Region selector
  document.getElementById('region-select')?.addEventListener('change', () => {
    updateFilterToggleText();
  });
  // Mode selector — auto-fetch on change
  document.getElementById('mode-select')?.addEventListener('change', () => { 
    updateFilterToggleText();
    updateHeroName(); 
    applyModeUI(); 
    fetchAll(); 
  });
  // Act selector — dynamic local reprocess on change
  document.getElementById('act-select')?.addEventListener('change', () => {
    updateFilterToggleText();
    loadAllMatches().then(stored => {
      processMatches(stored);
    });
  });
  // Init hero
  updateHeroName();
  applyModeUI();
  // Render saved profile on landing
  renderLandingProfile();
  renderLandingHistory();
  renderSavedDrafts();
  // Update landing subtitle with cached count
  getMatchCount().then(count => {
    if (count > 0) {
      const sub = document.querySelector('.landing-card-sub');
      if (sub) sub.textContent = `${count} matches cached — look up a player or jump to your profile`;
    }
  }).catch(()=>{});
});

let rrChart=null;

function resetStatsUI() {
  ['v-kd','v-kills','v-deaths','v-assists','v-acs','v-hs','v-wr','v-wins','v-losses'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent='—';
  });
  const vWr = document.getElementById('v-wr'); if(vWr) vWr.textContent='—%';
  const wrBar = document.getElementById('wr-bar'); if(wrBar) wrBar.style.width='0%';
  
  // Reset Rank UI
  if (document.getElementById('rank-display')) document.getElementById('rank-display').textContent = 'UNRANKED';
  if (document.getElementById('rank-rr-txt')) document.getElementById('rank-rr-txt').textContent = '—';
  safeSetInnerHtml('rank-icon', `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`);
  safeSetInnerHtml('peak-icon', '');
  const rankPred = document.getElementById('rank-prediction');
  if (rankPred) {
    rankPred.textContent = '';
    rankPred.style.display = 'none';
  }
  
  // Reset wrappers
  const agentsWrap = document.getElementById('agents-wrap'); if(agentsWrap) agentsWrap.innerHTML='<div class="card placeholder-card span-12"><div class="placeholder-txt">Fetch stats to see agents</div></div>';
  const mapsWrap = document.getElementById('maps-wrap'); if(mapsWrap) mapsWrap.innerHTML='<div class="card placeholder-card span-12"><div class="placeholder-txt">Fetch stats to see maps</div></div>';
  const clutchWrap = document.getElementById('clutch-wrap'); if(clutchWrap) clutchWrap.innerHTML='<div class="card placeholder-card span-12"><div class="placeholder-txt">Fetch stats to see impact</div></div>';
  const matchesList = document.getElementById('matches-list'); if(matchesList) matchesList.innerHTML='<div class="card placeholder-card span-12"><div class="placeholder-txt">Fetch stats to see match history</div></div>';
  
  const rrPlaceholder = document.getElementById('rr-placeholder'); if(rrPlaceholder) rrPlaceholder.style.display='block';
  const rrChartEl = document.getElementById('rr-chart'); if(rrChartEl) rrChartEl.style.display='none';
  const graphNote = document.getElementById('graph-note'); if(graphNote) graphNote.style.display='none';
  if(rrChart){rrChart.destroy();rrChart=null;}

  const trendPlaceholder = document.getElementById('perf-trend-placeholder'); if(trendPlaceholder) trendPlaceholder.style.display='block';
  const trendChart = document.getElementById('perf-trend-chart'); if(trendChart) trendChart.style.display='none';
  if(_perfTrendChart){_perfTrendChart.destroy();_perfTrendChart=null;}

  const lvlEl = document.getElementById('player-level'); if (lvlEl) lvlEl.textContent = 'LVL —';
  const heroLvlEl = document.getElementById('hero-level-badge'); if (heroLvlEl) { heroLvlEl.textContent = 'LVL —'; heroLvlEl.style.display = 'none'; }
  const avatarImg = document.getElementById('player-avatar-img'); if (avatarImg) { avatarImg.style.display = 'none'; if (avatarImg.nextElementSibling) avatarImg.nextElementSibling.style.display = 'flex'; }
  const bg = document.getElementById('player-card-bg'); if (bg) { bg.style.backgroundImage = ''; bg.style.opacity = '0'; }

  const streakBlock = document.getElementById('streak-block'); if (streakBlock) streakBlock.style.display = 'none';
  const streakVal = document.getElementById('streak-val'); if (streakVal) streakVal.textContent = '—';

  const aiResults = document.getElementById('ai-results'); if (aiResults) aiResults.style.display = 'none';
  const aiPlaceholder = document.getElementById('ai-placeholder'); if (aiPlaceholder) aiPlaceholder.style.display = 'block';

  const deepResults = document.getElementById('deep-results'); if (deepResults) { deepResults.innerHTML = ''; deepResults.style.display = 'none'; }
  const plabResults = document.getElementById('plab-results'); if (plabResults) { plabResults.innerHTML = ''; plabResults.style.display = 'none'; }
}

async function handleClear(){
  if(!confirm('Clear all stored match history? This cannot be undone.')) return;
  await clearAllMatches();
  _db = null;
  setStatus('Storage cleared','');
  showToast('All match data cleared');
  resetStatsUI();
}

async function fetchAll(){
  // Close search dropdowns immediately
  document.getElementById('landing-search-dropdown')?.classList.remove('open');
  document.getElementById('topbar-search-dropdown')?.classList.remove('open');

  // Read player from inputs
  const inputName = document.getElementById('player-name-input')?.value.trim();
  const inputTag  = document.getElementById('player-tag-input')?.value.trim().replace(/^#/,'');
  if (inputName) PLAYER_NAME = inputName;
  if (inputTag)  PLAYER_TAG  = inputTag;

  const region=document.getElementById('region-select')?.value || 'ap';
  const mode=document.getElementById('mode-select')?.value||'competitive';
  window._currentMode = mode;
  const btn=document.getElementById('fetch-btn');
  btn.disabled=true;btn.textContent='Fetching...';
  setStatus('Connecting...','');
  
  // Reset UI and skeletons before fetching
  resetStatsUI();
  showSkeletons();
  window._rawMmrData = null;
  window._currentRankRR = 0;

  // Update hero immediately with input values
  updateHeroName();
  applyModeUI();

  try{
    const enc=encodeURIComponent(PLAYER_NAME);
    setStatus('Loading data...','');
    const isRanked = mode === 'competitive';
    const _nc = Date.now();
    const[mmrRes,matchRes,accountRes,mmrHistRes]=await Promise.all([
      isRanked ? fetch(`/api/v3/mmr/${region}/pc/${enc}/${PLAYER_TAG}?_nocache=${_nc}`) : Promise.resolve(null),
      fetch(`/api/v3/matches/${region}/${enc}/${PLAYER_TAG}?mode=${mode}&size=20&_nocache=${_nc}`),
      fetch(`/api/v1/account/${enc}/${PLAYER_TAG}?_nocache=${_nc}`),
      fetch(`/api/v1/stored-mmr-history/${region}/${enc}/${PLAYER_TAG}?_nocache=${_nc}`),
    ]);
    const mmrData=mmrRes?.ok?await mmrRes.json():null;
    let matchData=matchRes.ok?await matchRes.json():null;
    const accountData=accountRes.ok?await accountRes.json():null;
    const mmrHistData=mmrHistRes?.ok?await mmrHistRes.json():null;
    if ((!matchData || !matchData.data) && accountData?.data) {
      matchData = { status: 200, data: [] };
    }
    if(!matchData)throw new Error(`Invalid Riot ID or player not found. Check spelling, tag and region.`);

    if(accountData?.data){
      const a=accountData.data;
      if (a.name) PLAYER_NAME = a.name;
      if (a.tag) PLAYER_TAG = a.tag;

      const pNameInput = document.getElementById('player-name-input');
      const pTagInput = document.getElementById('player-tag-input');
      if (pNameInput && a.name) pNameInput.value = a.name;
      if (pTagInput && a.tag) pTagInput.value = a.tag;

      updateActivePill();
      updateHeroName();

      const savedProfile = loadMyProfile();
      if (savedProfile && savedProfile.name.toLowerCase() === PLAYER_NAME.toLowerCase() && savedProfile.tag.toLowerCase() === PLAYER_TAG.toLowerCase()) {
        saveMyProfile(PLAYER_NAME, PLAYER_TAG, region, mode);
        renderLandingProfile();
      }

      const cardUrl=a.card?.wide||a.card?.large||(typeof a.card==='string'?`https://media.valorant-api.com/playercards/${a.card}/wideart.png`:null);
      const smallCardUrl=a.card?.small||(typeof a.card==='string'?`https://media.valorant-api.com/playercards/${a.card}/smallart.png`:null);
      const lvl=`LVL ${a.account_level||'—'}`;
      
      const lvlEl = document.getElementById('player-level');
      if (lvlEl) lvlEl.textContent = lvl;
      const heroLvlEl = document.getElementById('hero-level-badge');
      if (heroLvlEl) {
        heroLvlEl.textContent = lvl;
        heroLvlEl.style.display = 'inline-block';
      }
      
      // Update avatar image
      const avatarImg = document.getElementById('player-avatar-img');
      if (avatarImg) {
        if (smallCardUrl) {
          avatarImg.src = smallCardUrl;
          avatarImg.style.display = 'block';
          const fallback = avatarImg.nextElementSibling;
          if (fallback) fallback.style.display = 'none';
        } else {
          avatarImg.style.display = 'none';
          const fallback = avatarImg.nextElementSibling;
          if (fallback) fallback.style.display = 'flex';
        }
      }
      
      if(cardUrl){
        const bg=document.getElementById('player-card-bg');
        if (bg) {
          bg.style.backgroundImage=`url('${cardUrl}')`;
          bg.style.opacity='0.26';
        }
      }
    }

    if(isRanked && mmrData?.data){
      window._rawMmrData = mmrData.data;
      const mmrKey = `vt_mmr_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}`;
      try { localStorage.setItem(mmrKey, JSON.stringify(mmrData.data)); } catch(e) {}
      const d=mmrData.data;
      const rankName=(d.current?.tier?.name||'—');
      const rankImgUrl=getRankImgUrl(d.current?.tier?.name||'');
      const tierId=d.current?.tier?.id??0;
      const rr=d.current?.rr??0;
      const rankIndex=Math.max(0,tierId-3);
      window._currentRankRR=(rankIndex*100)+rr;
      document.getElementById('rank-display').textContent=rankName.toUpperCase();
      document.getElementById('rank-rr-txt').textContent=`${rr} RR · Peak: ${d.peak?.tier?.name||'—'}`;
      const peakImg=getRankImgUrl(d.peak?.tier?.name||'');
      safeSetInnerHtml('rank-icon', rankImgUrl?`<img src="${rankImgUrl}" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'">`:
        `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`);
      safeSetInnerHtml('peak-icon', peakImg?`<img src="${peakImg}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'">`:'' );
    }

    window._mmrHistory={};
    if(mmrHistData?.data?.length){
      mmrHistData.data.forEach(e=>{window._mmrHistory[e.match_id]=e.last_mmr_change;});
    }

    if(matchData?.data){
      // Save fresh matches from API without wiping out previous detailed match caches
      if (matchData.data.length > 0) {
        await saveMatches(matchData.data);
      }
      // Load full history from DB
      const allMatches = await loadAllMatches();
      
      // Start landing screen dismissal (smooth fade out)
      dismissLanding();
      
      // Delay heavy rendering until the fade-out completes to avoid animation frame drops
      setTimeout(() => {
        processMatches(allMatches);
        
        // Prefetching match details in the background is disabled to prevent API rate limit blocks, IndexedDB lockups, and page crashes.

        const newCount = matchData.data.length;
        const totalCount = allMatches.length;
        if (totalCount > 0) {
          setStatus(`${newCount} new · ${totalCount} total stored`,'ok');
          showToast(`${totalCount} matches total ✓`);
        } else {
          setStatus('No matches played in this mode','ok');
          showToast('No matches played');
        }
        
        addToRecentSearches(PLAYER_NAME, PLAYER_TAG, region, mode);
        renderActiveBookmarkButton();
        
        // Store successful lookup parameters
        LAST_SUCCESSFUL_NAME = PLAYER_NAME;
        LAST_SUCCESSFUL_TAG = PLAYER_TAG;
        LAST_SUCCESSFUL_REGION = region;
        LAST_SUCCESSFUL_MODE = mode;
      }, 350);
    }else{
      setStatus(`No ${mode} matches found — try a different region`,'error');
      showToast('No data');
      throw new Error(`No ${mode} matches found for this player in this region.`);
    }
  }catch(e){
    console.error(e);
    setStatus('Error: '+(e.message||'Check region'),'error');
    showToast('Fetch failed');
    
    // Revert inputs and variables to last successful profile if we had one
    if (LAST_SUCCESSFUL_NAME) {
      PLAYER_NAME = LAST_SUCCESSFUL_NAME;
      PLAYER_TAG  = LAST_SUCCESSFUL_TAG;
      window._currentMode = LAST_SUCCESSFUL_MODE;
      
      const pNameInput = document.getElementById('player-name-input');
      const pTagInput  = document.getElementById('player-tag-input');
      const regSelect  = document.getElementById('region-select');
      const modeSelect = document.getElementById('mode-select');
      
      if (pNameInput) pNameInput.value = LAST_SUCCESSFUL_NAME;
      if (pTagInput)  pTagInput.value  = LAST_SUCCESSFUL_TAG;
      if (regSelect)  regSelect.value  = LAST_SUCCESSFUL_REGION;
      if (modeSelect) modeSelect.value = LAST_SUCCESSFUL_MODE;
      
      updateHeroName();
      applyModeUI();
      updateActivePill();
      renderActiveBookmarkButton();
      
      // Reload last successful player's MMR and matches from local cache to restore UI
      const mmrKey = `vt_mmr_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}`;
      try { window._rawMmrData = JSON.parse(localStorage.getItem(mmrKey)); } catch(e) {}
      updateRankDisplayForAct(document.getElementById('act-select')?.value || 'v26a3');
      
      loadAllMatches().then(stored => {
        if (stored && stored.length > 0) {
          processMatches(stored);
        }
      }).catch(err => {
        console.warn('Failed to restore last successful player matches:', err);
      });
    }
    
    throw e;
  }finally{
    btn.disabled=false;btn.textContent='↻ Fetch Stats';
  }
}

async function prefetchMatchDetails(matchesToFetch) {
  if (!matchesToFetch || !matchesToFetch.length) return;
  console.log(`[Prefetch] Starting background detail fetch for ${matchesToFetch.length} matches...`);
  
  // Filter matches that actually need details prefetching
  const queue = [];
  for (const m of matchesToFetch) {
    const matchId = m.metadata?.matchid || m.metadata?.match_id;
    if (!matchId) continue;
    const hasFullDetails = m.rounds && m.rounds.length > 0 && m.rounds[0].player_stats && m.rounds[0].player_stats.length > 0;
    if (!hasFullDetails) {
      queue.push(matchId);
    }
  }

  if (!queue.length) {
    console.log(`[Prefetch] All matches already have full details loaded.`);
    return;
  }

  let updatedAny = false;
  // Process in chunks of 8 parallel requests to prevent server or browser rate limits
  const chunkSize = 8;
  for (let i = 0; i < queue.length; i += chunkSize) {
    const chunk = queue.slice(i, i + chunkSize);
    const promises = chunk.map(async (matchId) => {
      try {
        console.log(`[Prefetch] Fetching full details for match ${matchId}...`);
        const res = await fetch(`/api/v2/match/${matchId}`);
        if (res.ok) {
          const resJson = await res.json();
          if (resJson?.data) {
            // Save full detail match to database
            await saveMatches([resJson.data]);
            updatedAny = true;
          }
        }
      } catch (e) {
        console.error(`[Prefetch] Failed for match ${matchId}:`, e);
      }
    });
    await Promise.all(promises);
  }

  if (updatedAny) {
    console.log(`[Prefetch] Prefetch completed. Reloading matches into UI...`);
    const allMatches = await loadAllMatches();
    processMatches(allMatches);
  }
}

function normalizePlayerName(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '');
}

function findMe(match){
  if (!match) return null;
  if (match._me !== undefined) return match._me;
  
  const all = getPlayerList(match);
  const targetName = normalizePlayerName(PLAYER_NAME);
  const targetTag = normalizePlayerName(PLAYER_TAG);
  
  const me = (Array.isArray(all) ? all : []).find(p => {
    return normalizePlayerName(p.name) === targetName && normalizePlayerName(p.tag) === targetTag;
  });
  
  match._me = me || null;
  return me;
}

let _lastAgentMap = {}, _lastMapData = {}, _lastAllMatches = [];
function processMatches(matches){
  const selectedAct = document.getElementById('act-select')?.value || 'v26a3';
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

  // Update Rank card dynamically to show achieved rank for the selected Act
  updateRankDisplayForAct(selectedAct);

  let tK=0,tD=0,tA=0,tS=0,tHS=0,tShots=0,wins=0,losses=0,counted=0;
  const agentMap={},mapData={},rrHistory=[],recentMatches=[];
  const precomputedWeapons = {};

  matchesToProcess.forEach(match=>{
    const me=findMe(match);
    if(!me)return;
    counted++;
    const s=me.stats||{};
    const k=s.kills||0,d=s.deaths||0,a=s.assists||0,sc=s.score||0;
    const hs=s.headshots||0,shots=(s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
    tK+=k;tD+=d;tA+=a;tS+=sc;tHS+=hs;tShots+=shots;
    const myTeamId=(me.team||'').toLowerCase();
    const teams=match.teams||{};
    const myTeam=teams[myTeamId]||null;
    const oppId=myTeamId==='red'?'blue':'red';
    const oppTeam=teams[oppId]||null;
    // Bulletproof win detection for all modes
    let won = false;
    if (myTeam?.has_won === true) {
      won = true;
    } else if (myTeam?.has_won === false) {
      won = false;
    } else if (myTeam?.rounds_won != null && oppTeam?.rounds_won != null) {
      won = myTeam.rounds_won > oppTeam.rounds_won;
    } else {
      // DM / no teams structure — highest scorer wins (ties do not count as wins)
      const otherScores = getPlayerList(match)
        .filter(p => (p.puuid || p.subject || p.id) !== (me.puuid || me.subject || me.id))
        .map(p => p.stats?.score || 0)
        .sort((a,b)=>b-a);
      const myScoreVal = me.stats?.score || 0;
      won = otherScores.length === 0 || myScoreVal > otherScores[0];
    }
    if(won)wins++;else losses++;
    const agentName=me.character||me.agent?.name||'Unknown';
    if(!agentMap[agentName])agentMap[agentName]={matches:0,wins:0,kills:0,deaths:0,assists:0,score:0};
    const ag=agentMap[agentName];
    ag.matches++;if(won)ag.wins++;ag.kills+=k;ag.deaths+=d;ag.assists+=a;ag.score+=sc;
    const mapName=match.metadata?.map||'Unknown';
    if(!mapData[mapName])mapData[mapName]={matches:0,wins:0,kills:0,deaths:0,score:0,agents:{}};
    const mp=mapData[mapName];
    mp.matches++;if(won)mp.wins++;mp.kills+=k;mp.deaths+=d;mp.score+=sc;
    if(!mp.agents[agentName])mp.agents[agentName]={matches:0,wins:0,kd:0};
    const ma=mp.agents[agentName];
    ma.matches++;if(won)ma.wins++;ma.kd+=d?(k/d):k;
    const myR=myTeam?.rounds_won??'?';
    const oppR=oppTeam?.rounds_won??'?';
    rrHistory.push({won,kills:k,matchId:match.metadata?.matchid||match.metadata?.match_id});
    const gameStart=match.metadata?.game_start||match.metadata?.gameStart||null;const totalRoundsPlayed=(typeof myR==='number'&&typeof oppR==='number')?(myR+oppR):(match.rounds?.length||1);const matchACS=Math.round(sc/Math.max(1,totalRoundsPlayed));
    const _matchId = match.metadata?.matchid||match.metadata?.match_id;
    const _allP = getPlayerList(match);
    const _lobbyInfo = getLobbyRankInfo(_allP, myTeamId);
    const _getACS = p => Math.round((p.stats?.score || 0) / 100);
    const _matchMVP = _allP.length ? _allP.reduce((b,p)=>_getACS(p)>_getACS(b)?p:b,_allP[0]) : null;
    const _allied = _allP.filter(p=>(p.team||'').toLowerCase()===myTeamId);
    const _teamMVP = _allied.length ? _allied.reduce((b,p)=>_getACS(p)>_getACS(b)?p:b,_allied[0]) : null;
    recentMatches.push({won,agentName,map:mapName,kills:k,deaths:d,assists:a,score:sc,acs:matchACS,rounds:`${myR}-${oppR}`,hs,shots,myTeamId,matchId:_matchId,gameStart,lobbyRank:_lobbyInfo,mvpNames:{match:_matchMVP?.name,team:_teamMVP?.name}});

    // Pre-compute weapon stats from rounds to avoid re-iterating full matches later
    const rounds = match.rounds || [];
    rounds.forEach(r => {
      let ps = r.player_stats || [];
      if (typeof ps === 'string') { try { ps = JSON.parse(ps); } catch(e) { ps = []; } }
      if (!Array.isArray(ps)) ps = Object.values(ps);
      const myPs = ps.find(p => (p.player_puuid || p.subject || p.puuid) === me.puuid);
      if (!myPs) return;
      const kills = Array.isArray(myPs.kill_events) ? myPs.kill_events : [];
      kills.forEach(kill => {
        const raw = kill.damage_weapon_name || kill.finishing_damage?.damage_item || kill.damage_weapon_id || '';
        const cachedWpn = _assetCache.weapons[raw.toLowerCase()];
        let wpn = cachedWpn ? cachedWpn.name : raw.replace(/^[^/]*\//, '').replace(/TX_Hud_/i, '').replace(/_/g, ' ').trim();
        if (/^[0-9a-f]{8}-/.test(wpn)) wpn = 'Ability';
        if (!wpn || wpn.length < 2) return;
        if (!precomputedWeapons[wpn]) precomputedWeapons[wpn] = { kills: 0, hs: 0, matchHistory: [] };
        precomputedWeapons[wpn].kills++;
        let isHS = typeof kill.headshot === 'boolean' ? kill.headshot : kill.finishing_damage?.is_headshot;
        if (!isHS && myPs.damage_events) {
          const dE = myPs.damage_events.find(de => de.receiver_puuid === (kill.victim_puuid || kill.victim));
          if (dE && dE.headshots > 0) isHS = true;
        }
        if (isHS) precomputedWeapons[wpn].hs++;
        const last = precomputedWeapons[wpn].matchHistory;
        const existing = last.length && last[last.length-1].gameStart === gameStart ? last[last.length-1] : null;
        if (existing) { existing.kills++; if (isHS) existing.hs++; existing.hsPct = existing.kills ? Math.round((existing.hs/existing.kills)*100) : 0; }
        else { last.push({ gameStart, kills: 1, hs: isHS ? 1 : 0, hsPct: isHS ? 100 : 0 }); }
      });
    });
  });

  const n=counted||1;
  const kd=tD?(tK/tD).toFixed(2):tK.toFixed(2);
  const total=wins+losses;
  const wr=total?Math.round((wins/total)*100):0;
  const hsPct=tShots?Math.round((tHS/tShots)*100):0;
  const avgACS=Math.round(tS/n/100);

  document.getElementById('v-kd').textContent=kd;
  document.getElementById('v-kills').textContent=(tK/n).toFixed(1);
  document.getElementById('v-deaths').textContent=(tD/n).toFixed(1);
  document.getElementById('v-assists').textContent=(tA/n).toFixed(1);
  document.getElementById('v-acs').textContent=avgACS;
  document.getElementById('v-hs').textContent=hsPct+'%';
  document.getElementById('v-wr').textContent=wr+'%';
  document.getElementById('v-wins').textContent=wins;
  document.getElementById('v-losses').textContent=losses;
  document.getElementById('wr-bar').style.width=wr+'%';
  document.getElementById('wr-detail').textContent=`${total} matches tracked`;

  // Animate initial core stat cards
  setTimeout(()=>animateIn('.card'),50);

  _lastAgentMap = agentMap; _lastMapData = mapData; _lastAllMatches = matches;
  window._precomputedWeapons = precomputedWeapons;
  window._recentMatchStats = recentMatches.slice().reverse(); // oldest→newest for graph

  // Store stripped match data in a capped Map for panel expansion (prevents OOM)
  window._matchDetailStore.clear();
  for (let i = 0; i < Math.min(matches.length, 30); i++) {
    const m = matches[i];
    const mid = m.metadata?.matchid || m.metadata?.match_id;
    if (mid) {
      const stripped = { ...m };
      delete stripped.rounds;
      window._matchDetailStore.set(mid, stripped);
    }
  }
  
  if (matches && matches.length > 0) {
    const me = findMe(matches[0]);
    if (me) {
      updateActivePillAgent(me.character || me.agent?.name || '');
    }
  }

  // Stagger the rendering of remaining components to keep frames smooth (60 FPS)
  requestAnimationFrame(() => {
    // 1. Render charts & graphs first (they have canvas animations)
    renderRRGraph(rrHistory,window._currentRankRR,window._mmrHistory||{});
    renderTrendChart(recentMatches);
    renderStreak(matches);
    
    // 2. Render roster and maps next
    setTimeout(() => {
      renderAgents(agentMap, matches);
      renderMaps(mapData);
    }, 40);

    // 3. Render weapon stats and role analytics
    setTimeout(() => {
      renderAccuracyAndRoles(matches);
      renderTopWeapons(null, precomputedWeapons);
      renderClutch(wins,losses,tK,n,agentMap);
    }, 80);

    // 4. Render matches history (heaviest DOM manipulation block)
    setTimeout(() => {
      renderMatches(recentMatches);
      
      // Re-initialize Scrollspy observer now that the full DOM height is established
      if (typeof initScrollspyObserver === 'function') {
        initScrollspyObserver();
      }

      // FREE MEMORY: null full match objects after all renders are complete
      // Only lightweight recentMatches/agentMap/mapData are needed going forward
      _lastAllMatches = [];
      try { if (typeof window.gc === 'function') window.gc(); } catch(e) {}
    }, 120);
  });
  // tracker-nav is inside tracker-view; visibility controlled by parent
}

function renderRRGraph(history,currentTotalRR,mmrHistory={}){
  if (!history || history.length === 0) {
    document.getElementById('rr-placeholder').style.display='block';
    document.getElementById('rr-chart').style.display='none';
    document.getElementById('graph-note').style.display='none';
    if(rrChart){rrChart.destroy();rrChart=null;}
    return;
  }

  document.getElementById('rr-placeholder').style.display='none';
  document.getElementById('rr-chart').style.display='block';
  document.getElementById('graph-note').style.display='block';
  
  const isMobile = window.innerWidth <= 600;
  
  const hasRealRR=history.some(m=>mmrHistory[m.matchId]!==undefined);
  let totalRR=currentTotalRR||600;
  const points=[];
  if(hasRealRR){
    history.forEach(m=>{points.unshift(totalRR);const c=mmrHistory[m.matchId];if(c!==undefined)totalRR-=c;else totalRR-=m.won?20:-18;totalRR=Math.max(0,totalRR);});
    document.getElementById('graph-note').textContent='✓ Real RR data from stored match history';
    document.getElementById('graph-note').style.color='var(--win)';
  }else{
    history.forEach(m=>{points.unshift(totalRR);totalRR-=m.won?(18+Math.floor(Math.random()*8)):-(18+Math.floor(Math.random()*6));totalRR=Math.max(0,totalRR);});
    document.getElementById('graph-note').textContent='* Estimated from win/loss — stored history unavailable';
    document.getElementById('graph-note').style.color='';
  }
  const labels=history.map((_,i)=>`G${i+1}`);
  const data=points;
  const colors=data.map(v=>getRankColor(getRankFromRR(v).name));
  const rankLabels=data.map((v,i)=>{const r=getRankFromRR(v);const rc=mmrHistory[history[i]?.matchId];return{rank:r.name,rr:v-r.rr,change:rc};});
  if(rrChart)rrChart.destroy();
  const ctx=document.getElementById('rr-chart').getContext('2d');
  const rankZones=[];
  for(let i=0;i<RANKS.length-1;i++){const t=RANKS[i].name.split(' ')[0];rankZones.push({yMin:RANKS[i].rr,yMax:RANKS[i+1].rr,color:RANK_COLORS[t]||'#fff',label:RANKS[i].name});}
  const minRR=Math.max(0,Math.min(...data)-150);
  const maxRR=Math.max(...data)+150;
  rrChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:'rgba(232,255,71,0.9)',backgroundColor:'rgba(232,255,71,0.04)',borderWidth:2,pointBackgroundColor:colors,pointBorderColor:colors,pointRadius:isMobile?0:4,pointHoverRadius:6,tension:0.3,fill:true}]},options:{responsive:true,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#141416',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,titleColor:'#f0f0f2',bodyColor:'#f0f0f2',titleFont:{family:'DM Mono',size:9},bodyFont:{family:'Barlow Condensed',size:16},callbacks:{title:c=>`Match ${c[0].label} · ${rankLabels[c[0].dataIndex]?.rank||''}`,label:c=>{const rl=rankLabels[c.dataIndex];const cs=rl?.change!=null?(rl.change>0?` (+${rl.change})`:(` (${rl.change})`)):'';return rl?` ${rl.rr} RR${cs}`:` ${c.parsed.y} RR`;}}}},scales:{x:{grid:{display:!isMobile,color:'rgba(255,255,255,0.03)'},ticks:{display:!isMobile,color:'#3a3a40',font:{family:'DM Mono',size:8}}},y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'#4a4a52',font:{family:'DM Mono',size:8},callback(v){const r=getRankFromRR(v);return r?r.name:'';}},min:minRR,max:maxRR}}},plugins:[{id:'rankBands',beforeDraw(chart){const{ctx,chartArea,scales}=chart;if(!chartArea)return;rankZones.forEach(zone=>{const yTop=scales.y.getPixelForValue(Math.min(zone.yMax,maxRR));const yBot=scales.y.getPixelForValue(Math.max(zone.yMin,minRR));if(yBot<chartArea.top||yTop>chartArea.bottom)return;ctx.save();ctx.fillStyle=zone.color+'12';ctx.fillRect(chartArea.left,Math.max(yTop,chartArea.top),chartArea.width,Math.min(yBot,chartArea.bottom)-Math.max(yTop,chartArea.top));ctx.fillStyle=zone.color+'66';ctx.font='8px DM Mono';ctx.fillText(zone.label,chartArea.left+6,Math.min(yBot,chartArea.bottom)-4);ctx.restore();});}}]});
}

function renderAgents(agentMap, allMatches=[]){
  const wrap=document.getElementById('agents-wrap');
  if(!wrap)return;
  const sorted=Object.entries(agentMap).sort((a,b)=>b[1].matches-a[1].matches).slice(0,6);
  if(!sorted.length){
    wrap.innerHTML='<div class="card span-12"><div class="placeholder-txt">No agent data available for this mode</div></div>';
    return;
  }
  wrap.style.display='contents';
  let html='';
  sorted.forEach(([name,s],i)=>{
    const role=getRoleClass(name);
    const wr=Math.round((s.wins/s.matches)*100);
    const kd=s.deaths?(s.kills/s.deaths).toFixed(2):s.kills.toFixed(2);
    const acs=Math.round(s.score/s.matches/100);
    const wrCls=wr>=55?'good':wr>=45?'mid':'bad';
    const img=getAgentIconUrl(name);
    html+=`<div class="agent-bento" style="animation-delay:${i*60}ms">
      <div class="agent-wr-chip ${wrCls}">${wr}%</div>
      ${img?`<img class="agent-portrait" data-agent="${escapeHtml(name)}" src="${img}" alt="${escapeHtml(name)}" onerror="const fb=this.nextElementSibling;const u=getAgentIconUrl(this.dataset.agent);if(u&&u!==this.src){this.src=u}else{this.style.display='none';if(fb)fb.style.display='flex';}">
             <div class="agent-portrait-fallback" style="display:none">${escapeHtml(name[0]||'?')}</div>`
           :`<div class="agent-portrait-fallback">${escapeHtml(name[0]||'?')}</div>`}
      <div class="agent-info">
        <div class="agent-name">${escapeHtml(name)}</div>
        <div class="agent-role-chip ${role}">${role}</div>
        <div class="agent-stats-row">
          <div class="asr-item"><div class="asv">${s.matches}</div><div class="asl">Games</div></div>
          <div class="asr-item"><div class="asv">${kd}</div><div class="asl">K/D</div></div>
          <div class="asr-item"><div class="asv">${acs}</div><div class="asl">ACS</div></div>
        </div>
        ${(()=>{const trend=getAgentTrend(name,allMatches);if(!trend.length)return'';return'<div class="agent-trend">'+trend.map(t=>`<div class="agent-trend-dot ${t}"></div>`).join('')+'<span class="agent-trend-label">Last '+trend.length+'</span></div>';})()}
      </div>
    </div>`;
  });
  wrap.innerHTML=html;
  setTimeout(()=>animateIn('#agents-wrap .agent-bento'),50);
}

function renderMaps(mapData){
  const wrap=document.getElementById('maps-wrap');
  if(!wrap)return;
  const maps=Object.entries(mapData).sort((a,b)=>b[1].matches-a[1].matches);
  if(!maps.length){
    wrap.innerHTML='<div class="card span-12"><div class="placeholder-txt">No map data available for this mode</div></div>';
    return;
  }
  wrap.style.display='contents';
  let html='';
  maps.forEach(([name,m],i)=>{
    const wr=Math.round((m.wins/m.matches)*100);
    const cls=wr>=55?'good':wr>=45?'mid':'bad';
    const kd=m.deaths?(m.kills/m.deaths).toFixed(2):m.kills.toFixed(2);
    const acs=Math.round(m.score/m.matches/100);
    const bestEntry=Object.entries(m.agents).filter(([,a])=>a.matches>=1).sort((a,b)=>(b[1].wins/b[1].matches)-(a[1].wins/a[1].matches))[0];
    const bestAgent=bestEntry?bestEntry[0]:'—';
    const bestWR=bestEntry?Math.round((bestEntry[1].wins/bestEntry[1].matches)*100):'';
    const agentIcon=getAgentIconUrl(bestAgent);
    const mapImg = getMapImg(name);
    html+=`<div class="map-card-bento" style="animation-delay:${i*60}ms">
      ${mapImg
        ? `<div class="map-splash-wrap">
             <img class="map-splash" data-map="${name}" src="${mapImg}" alt="${name}" loading="lazy" onerror="retryMapImg(this, this.dataset.map)">
             <div class="map-splash-overlay"><span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:20px;letter-spacing:1px;text-transform:uppercase;color:#fff;">${name}</span></div>
           </div>`
        : `<div class="map-splash-placeholder">${name}</div>`}
      <div class="map-card-inner">
        <div class="map-header">
          <div class="map-wr-pct ${cls}">${wr}% WR</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${m.matches} games</div>
        </div>
        <div class="map-bar"><div class="map-bar-fill ${cls}" style="width:${wr}%"></div></div>
        <div class="map-stats-mini">
          <div class="msm-item"><div class="msmv">${m.wins}</div><div class="msml">Wins</div></div>
          <div class="msm-item"><div class="msmv">${m.matches-m.wins}</div><div class="msml">Losses</div></div>
          <div class="msm-item"><div class="msmv">${kd}</div><div class="msml">K/D</div></div>
          <div class="msm-item"><div class="msmv">${acs}</div><div class="msml">ACS</div></div>
        </div>
        <div class="map-best-agent">
          ${agentIcon?`<img src="${agentIcon}" style="width:14px;height:14px;object-fit:contain;" onerror="this.style.display='none'">`:''}
          Best: <b style="color:var(--text);margin:0 2px">${bestAgent}</b>${bestWR?` · ${bestWR}% WR`:''}
        </div>
      </div>
    </div>`;
  });
  wrap.innerHTML=html;
  setTimeout(()=>animateIn('#maps-wrap .map-card-bento'),50);
}

function renderClutch(wins,losses,totalKills,n,agentMap){
  const total=wins+losses;
  const topKD=Object.entries(agentMap).filter(([,s])=>s.matches>=2).sort((a,b)=>(b[1].kills/(b[1].deaths||1))-(a[1].kills/(a[1].deaths||1)))[0];
  const topWR=Object.entries(agentMap).filter(([,s])=>s.matches>=2).sort((a,b)=>(b[1].wins/b[1].matches)-(a[1].wins/a[1].matches))[0];
  const estFB=Math.round(totalKills*0.18);
  const estMulti=Math.round(n*0.35);
  const cards=[
    {icon:'💀',label:'Total Kills',val:totalKills,sub:`${total} matches`},
    {icon:'🎯',label:'Est. First Bloods',val:estFB,sub:'~18% of kills'},
    {icon:'⚡',label:'Est. Multi-Kills',val:estMulti,sub:'3K+ rounds'},
    {icon:'🏆',label:'Wins',val:wins,sub:`${total} total`},
    {icon:'🔫',label:'Best K/D Agent',val:topKD?(topKD[1].kills/(topKD[1].deaths||1)).toFixed(2):'—',sub:topKD?topKD[0]:'Play more'},
    {icon:'👑',label:'Best WR Agent',val:topWR?Math.round((topWR[1].wins/topWR[1].matches)*100)+'%':'—',sub:topWR?topWR[0]:'Play more'},
  ];
  const wrap=document.getElementById('clutch-wrap');
  wrap.style.display='contents';
  let html='';
  cards.forEach((c,i)=>{
    html+=`<div class="impact-bento" style="animation-delay:${i*60}ms">
      <div class="impact-icon">${c.icon}</div>
      <div class="impact-label">${c.label}</div>
      <div class="impact-val">${c.val}</div>
      <div class="impact-sub">${c.sub}</div>
    </div>`;
  });
  wrap.innerHTML=html;
  setTimeout(()=>animateIn('#clutch-wrap .impact-bento'),50);
}

function getGrade(kills,deaths,assists,acs,won){
  const kd=deaths?(kills/deaths):kills;
  let score=0;
  if(kd>=1.5)score+=3;else if(kd>=1.2)score+=2;else if(kd>=0.9)score+=1;
  if(acs>=250)score+=3;else if(acs>=200)score+=2;else if(acs>=150)score+=1;
  if(won)score+=2;
  if(kills>=20)score+=2;else if(kills>=15)score+=1;
  if(score>=9)return'S';if(score>=7)return'A';if(score>=5)return'B';if(score>=3)return'C';return'D';
}

function getMVPs(match,myTeamId){
  const all = getPlayerList(match);
  if(!all.length)return{matchMVP:null,teamMVP:null};
  const getACS=p=>Math.round((p.stats?.score||0)/100);
  const matchMVP=all.reduce((best,p)=>getACS(p)>getACS(best)?p:best,all[0]);
  const allied=all.filter(p=>(p.team||'').toLowerCase()===myTeamId);
  const teamMVP=allied.length?allied.reduce((best,p)=>getACS(p)>getACS(best)?p:best,allied[0]):null;
  return{matchMVP,teamMVP};
}

function getTierRR(tierName){
  const tierMap={'Iron 1':3,'Iron 2':4,'Iron 3':5,'Bronze 1':6,'Bronze 2':7,'Bronze 3':8,'Silver 1':9,'Silver 2':10,'Silver 3':11,'Gold 1':12,'Gold 2':13,'Gold 3':14,'Platinum 1':15,'Platinum 2':16,'Platinum 3':17,'Diamond 1':18,'Diamond 2':19,'Diamond 3':20,'Ascendant 1':21,'Ascendant 2':22,'Ascendant 3':23,'Immortal 1':24,'Immortal 2':25,'Immortal 3':26,'Radiant':27};
  const id=tierMap[tierName];
  if(!id)return null;
  return(id-3)*100;
}

function getLobbyRankInfo(allPlayers, myTeamId){
  const withRank=allPlayers.filter(p=>p.currenttier_patched&&p.currenttier_patched!=='Unranked'&&p.currenttier&&p.currenttier>0);
  if(!withRank.length)return null;
  const allied=withRank.filter(p=>(p.team||'').toLowerCase()===myTeamId);
  const enemy=withRank.filter(p=>(p.team||'').toLowerCase()!==myTeamId);
  const avgTierRR=arr=>{
    if(!arr.length)return null;
    const total=arr.reduce((s,p)=>{
      const rr=getTierRR(p.currenttier_patched)||((p.currenttier||3)-3)*100;
      return s+rr;
    },0);
    return Math.round(total/arr.length);
  };
  const allAvg=avgTierRR(withRank);
  const allyAvg=avgTierRR(allied);
  const enemyAvg=avgTierRR(enemy);
  return{
    overall: allAvg!=null?getRankFromRR(allAvg):null,
    ally: allyAvg!=null?getRankFromRR(allyAvg):null,
    enemy: enemyAvg!=null?getRankFromRR(enemyAvg):null,
    allPlayers: withRank
  };
}

function buildLobbyRankBar(allPlayers, myTeamId){
  const info=getLobbyRankInfo(allPlayers, myTeamId);
  if(!info||!info.overall)return'';
  const overallImg=getRankImgUrl(info.overall.name)||'';
  const allyImg=info.ally?getRankImgUrl(info.ally.name)||'':'';
  const enemyImg=info.enemy?getRankImgUrl(info.enemy.name)||'':'';
  const rankColor=r=>getRankColor(r?.name||'');
  return`<div class="lobby-rank-bar">
    <span class="lobby-rank-label">Lobby Avg</span>
    <div class="lobby-avg-rank">
      ${overallImg?`<img src="${overallImg}" onerror="this.style.display='none'">`:``}
      <span class="lobby-avg-rank-name" style="color:${rankColor(info.overall)}">${info.overall.name}</span>
    </div>
    <div class="lobby-rank-divider"></div>
    <div class="lobby-team-ranks">
      <div class="lobby-team-block">
        <span class="lobby-team-label ally">YOUR TEAM</span>
        ${allyImg?`<img src="${allyImg}" style="width:18px;height:18px;object-fit:contain;" onerror="this.style.display='none'">`:``}
        <span class="lobby-team-avg-name ally">${info.ally?.name||'—'}</span>
      </div>
      <div class="lobby-rank-divider"></div>
      <div class="lobby-team-block">
        <span class="lobby-team-label enemy">ENEMY TEAM</span>
        ${enemyImg?`<img src="${enemyImg}" style="width:18px;height:18px;object-fit:contain;" onerror="this.style.display='none'">`:``}
        <span class="lobby-team-avg-name enemy">${info.enemy?.name||'—'}</span>
      </div>
    </div>
  </div>`;
}

function buildScoreboard(match,myTeamId,isRanked=true){
  const all = getPlayerList(match);
  if(!all.length)return'<div class="no-detail">Player data unavailable</div>';
  const allied=all.filter(p=>(p.team||'').toLowerCase()===myTeamId).sort((a,b)=>(b.stats?.score||0)-(a.stats?.score||0));
  const enemy=all.filter(p=>(p.team||'').toLowerCase()!==myTeamId).sort((a,b)=>(b.stats?.score||0)-(a.stats?.score||0));
  const{matchMVP,teamMVP}=getMVPs(match,myTeamId);
  const lobbyBar=buildLobbyRankBar(all,myTeamId);
  const rowHTML=(p,isMe)=>{
    const s=p.stats||{};
    const k=s.kills||0,d=s.deaths||0,a=s.assists||0,sc=s.score||0;
    const hs=s.headshots||0,shots=(s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
    const hsPct=shots?Math.round((hs/shots)*100):0;
    const kd=d?(k/d).toFixed(2):k.toFixed(2);
    const kdPct=Math.min(parseFloat(kd)/3*100,100);
    const acs=Math.round(sc/100);
    const isMatchMVP=matchMVP&&p.name===matchMVP.name&&p.tag===matchMVP.tag;
    const isTeamMVP=teamMVP&&p.name===teamMVP.name&&p.tag===teamMVP.tag&&!isMatchMVP;
    const mvpBadge=isMatchMVP?`<span class="mvp-badge match-mvp">👑 Match MVP</span>`:isTeamMVP?`<span class="mvp-badge team-mvp">⭐ Team MVP</span>`:'';
    const agentIcon=getAgentIconUrl(p.character||p.agent?.name||'');
    const rankName=p.currenttier_patched||'';
    const rankImg=rankName&&rankName!=='Unranked'?getRankImgUrl(rankName):'';
    const rankColor=rankName?getRankColor(rankName):'var(--muted)';
    return`<tr class="${isMe?'me':''}${isMatchMVP?' match-mvp-row':isTeamMVP?' team-mvp-row':''}">
      <td><div style="display:flex;align-items:center;gap:7px;">
        ${agentIcon?`<img src="${agentIcon}" style="width:26px;height:26px;object-fit:contain;border-radius:3px;background:var(--surface2);" onerror="this.style.display='none'">`:``}
        <div><div class="sb-name">${escapeHtml(p.name||'—')}${mvpBadge}</div><div class="sb-agent">${escapeHtml((p.character||'—').toUpperCase())}</div></div>
      </div></td>
      <td><div class="sb-rank">
        ${rankImg?`<img class="sb-rank-img" src="${rankImg}" onerror="this.style.display='none'">`:``}
        <span class="sb-rank-txt" style="color:${rankColor}">${escapeHtml(rankName||'—')}</span>
      </div></td>
      <td><b>${k}</b></td><td>${d}</td><td>${a}</td>
      <td><div>${kd}</div><div class="sb-kd-bar"><div class="sb-kd-fill" style="width:${kdPct}%"></div></div></td>
      <td>${acs}</td><td>${hsPct}%</td>
    </tr>`;
  };
  return`<div class="scoreboard-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">${lobbyBar}<table class="scoreboard"><thead><tr><th>PLAYER</th><th>RANK</th><th>K</th><th>D</th><th>A</th><th>K/D</th><th>ACS</th><th>HS%</th></tr></thead><tbody>
    <tr><td colspan="8" class="team-label allied">▲ YOUR TEAM</td></tr>
    ${allied.map(p=>rowHTML(p,p.name?.toLowerCase()===PLAYER_NAME.toLowerCase()&&p.tag?.toLowerCase()===PLAYER_TAG.toLowerCase())).join('')}
    <tr><td colspan="8" class="team-label enemy">▼ ENEMY TEAM</td></tr>
    ${enemy.map(p=>rowHTML(p,false)).join('')}
  </tbody></table></div>`;
}

function buildRounds(match,myTeamId){
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
}

function buildClutches(match,myTeamId){
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
  });

  const hasRoundData = rounds.some(r=>(r.player_stats||[]).length>0);

  if(!hasRoundData){
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
      <div style="font-size:18px">ℹ️</div>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;margin-bottom:2px;">Clutch data requires full match details</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:0.5px;">Click <b style="color:var(--accent)">Load Full Details</b> below to fetch round-by-round data from the match API — clutch moments will appear here.</div>
      </div>
    </div>`;
  }

  if(!clutches.length && !aces.length)
    return'<div class="no-detail">No clutch or ace moments detected this match</div>';

  let html='<div class="clutch-highlight">';
  clutches.forEach(c=>html+=`<div class="clutch-pill">🏅 ${c.vsCount} Clutch · Rnd ${c.round}${c.kills?' ('+c.kills+' kills)':''}</div>`);
  aces.forEach(a=>html+=`<div class="clutch-pill" style="color:var(--accent);border-color:var(--accentborder)">⭐ ACE · Rnd ${a.round}</div>`);
  html+='</div>';
  return html;
}

async function togglePanel(idx,matchId){
  const row=document.getElementById(`mrow-${idx}`);
  const panel=document.getElementById(`mpanel-${idx}`);
  const isOpen=panel.classList.contains('open');
  document.querySelectorAll('.match-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.match-row.open').forEach(r=>r.classList.remove('open'));
  if(!isOpen){
    row.classList.add('open');
    panel.classList.add('open');
    
    if (!panel.dataset.panelRendered) {
      const m = window._allRenderedMatches[idx];
      if (m) {
        panel.innerHTML = buildMatchPanelHTML(m, idx);
        panel.dataset.panelRendered = '1';
      }
    }
    
    if(matchId&&!panel.dataset.detailLoaded){
      panel.dataset.detailLoaded='1';
      const perfEl = document.getElementById(`tabcontent-${idx}-performance`);
      const duelsEl = document.getElementById(`tabcontent-${idx}-duels`);
      const timeEl  = document.getElementById(`tabcontent-${idx}-timeline`);
      if(perfEl) perfEl.innerHTML = '<div class="detail-loading">Loading performance data...</div>';
      if(duelsEl) duelsEl.innerHTML = '<div class="detail-loading">Loading fight duels...</div>';
      if(timeEl) timeEl.innerHTML = '<div class="detail-loading">Loading round timelines...</div>';
      try{
        const res=await fetch(`/api/v2/match/${matchId}`);
        if(res.ok){
          const data=await res.json();
          if(data?.data) {
            populateFullDetailTabs(data.data, idx);
          } else {
            const err = '<div class="no-detail">Match detail not available</div>';
            if(perfEl) perfEl.innerHTML = err;
            if(duelsEl) duelsEl.innerHTML = err;
            if(timeEl) timeEl.innerHTML = err;
          }
        } else {
          const err = `<div class="no-detail">Fetch error ${res.status}</div>`;
          if(perfEl) perfEl.innerHTML = err;
          if(duelsEl) duelsEl.innerHTML = err;
          if(timeEl) timeEl.innerHTML = err;
        }
      } catch(e) {
        const err = '<div class="no-detail">Network error — click again to retry</div>';
        panel.dataset.detailLoaded = '';
        if(perfEl) perfEl.innerHTML = err;
        if(duelsEl) duelsEl.innerHTML = err;
        if(timeEl) timeEl.innerHTML = err;
      }
    }
  }
}

function switchPanelTab(idx, tabName) {
  const panel = document.getElementById(`mpanel-${idx}`);
  if (!panel) return;
  panel.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  panel.querySelectorAll('.panel-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeBtn = panel.querySelector(`.panel-tab-btn[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`tabcontent-${idx}-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

function populateFullDetailTabs(match, idx) {
  const allPlayers = getPlayerList(match);
  const rounds     = match.rounds||[];

  const me = allPlayers.find(p =>
    p.name?.toLowerCase()===PLAYER_NAME.toLowerCase() &&
    p.tag?.toLowerCase()===PLAYER_TAG.toLowerCase()
  );
  if(!me) {
    const err = '<div class="no-detail">Your player not found in match data</div>';
    safeSetInnerHtml(`tabcontent-${idx}-performance`, escapeHtml(err));
    safeSetInnerHtml(`tabcontent-${idx}-duels`, escapeHtml(err));
    safeSetInnerHtml(`tabcontent-${idx}-timeline`, escapeHtml(err));
    return;
  }

  const myPuuid  = me.puuid || me.subject || me.id || '';
  const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
  const myTeamId = (me.team||'').toLowerCase();
  const oppTeamId = myTeamId==='red'?'blue':'red';
  const myTeammates = allPlayers.filter(p=>(p.team||'').toLowerCase()===myTeamId&&!myPuuids.includes(p.puuid || p.subject || p.id));
  const enemies = allPlayers.filter(p=>(p.team||'').toLowerCase()!==myTeamId);

  const parsedRounds = rounds.map(r=>{
    let ps = r.player_stats||[];
    if(typeof ps==='string'){try{ps=JSON.parse(ps);}catch(e){ps=[];}}
    if(!Array.isArray(ps)) ps=Object.values(ps);
    return {...r, _ps:ps};
  });

  const findPs=(ps,puuid)=>(ps||[]).find(p=>(p.player_puuid||p.subject||p.puuid||p.player_id)===puuid);
  const findMyPs=ps=>(ps||[]).find(p=>myPuuids.includes(p.player_puuid||p.subject||p.puuid||p.player_id));

  const abilities=me.ability_casts||{};
  const dmgMade=me.damage_made||0, dmgRcvd=me.damage_received||0;
  const totalSpent=parsedRounds.reduce((s,r)=>s+(findMyPs(r._ps)?.economy?.spent||0),0);
  const avgEco=parsedRounds.length?Math.round(totalSpent/parsedRounds.length):0;

  const killsByRound={};
  const clutches=[], aces=[];
  const timeline=[];
  const duelMatrix={};
  enemies.forEach(e=>{
    const ePuuid = e.puuid || e.subject || e.id || '';
    duelMatrix[ePuuid]={kills:0,deaths:0,name:e.name,agent:e.character||''};
  });

  let totalHS=0,totalBS=0,totalLS=0;
  const weaponKills={};

  parsedRounds.forEach((r,ri)=>{
    const myPs    = findMyPs(r._ps);
    const myKills = myPs?.kill_events||myPs?.kills||[];
    const killCount=myKills.length;
    const roundWon=(r.winning_team||'').toLowerCase()===myTeamId;

    if(killCount>0) killsByRound[ri]={kills:myKills, won:roundWon};

    myKills.forEach(k=>{
      let isHS = typeof k.headshot === 'boolean' ? k.headshot : k.finishing_damage?.is_headshot;
      if (!isHS) {
        const dE = (myPs?.damage_events || []).find(de => de.receiver_puuid === (k.victim_puuid || k.victim));
        if (dE && dE.headshots > 0) isHS = true;
      }
      if(isHS) totalHS++;
      else totalBS++;
      
      let wpnName = k.damage_weapon_name || '';
      if(!wpnName || wpnName.length<2) {
        const wpnId = k.finishing_damage?.damage_item||k.damage_weapon_id||'';
        const cached = _assetCache.weapons[wpnId.toLowerCase()];
        if(cached) wpnName = cached.name;
        else {
          wpnName = wpnId.replace(/^[^/]*\//,'').replace(/TX_Hud_/i,'').replace(/_/g,' ').trim();
          if(/^[0-9a-f]{8}-/.test(wpnName)) wpnName = 'Ability';
        }
      }
      if(!wpnName) wpnName = 'Unknown';
      weaponKills[wpnName]=(weaponKills[wpnName]||0)+1;
      
      const victimId=k.victim_puuid||k.victim||'';
      if(duelMatrix[victimId]) duelMatrix[victimId].kills++;
    });

    r._ps.forEach(pStats=>{
      const pId=pStats.player_puuid||pStats.subject||pStats.puuid;
      const pKills=pStats.kill_events||pStats.kills||[];
      pKills.forEach(k=>{
        const victimId=k.victim_puuid||k.victim||'';
        if(myPuuids.includes(victimId) && duelMatrix[pId]) duelMatrix[pId].deaths++;
      });
    });

    let teammateDeaths=0;
    const tmPuuids=myTeammates.map(t=>t.puuid || t.subject || t.id || '');
    r._ps.forEach(pStats=>{
      const pKills=pStats.kill_events||[];
      pKills.forEach(k=>{
        const victimId=k.victim_puuid||k.victim||'';
        if(tmPuuids.includes(victimId)) teammateDeaths++;
      });
    });
    const isClutch=roundWon&&teammateDeaths>=tmPuuids.length&&tmPuuids.length>0;

    if(isClutch) clutches.push({round:ri+1,kills:killCount});
    if(killCount>=5) aces.push(ri+1);
    timeline.push({won:roundWon,isClutch,kills:killCount});
  });

  const matchStats=me.stats||{};
  const headS=matchStats.headshots||totalHS;
  const bodyS=matchStats.bodyshots||0;
  const legS =matchStats.legshots||0;
  const totalShots=headS+bodyS+legS;
  const hsPct=totalShots?Math.round(headS/totalShots*100):0;
  const bsPct=totalShots?Math.round(bodyS/totalShots*100):0;
  const lsPct=totalShots?Math.round(legS/totalShots*100):0;
  const totalKills=(matchStats.kills||0);
  const card=me.assets?.card?.wide||me.assets?.card?.large||'';

  let perfHtml = '';
  perfHtml+=`<div class="panel-section"><div class="panel-section-title">Player Profile</div>
  <div class="detail-profile">
    ${card?`<img src="${card}" class="detail-card" onerror="this.style.display='none'">`:``}
    <div class="detail-profile-stats">
      <div class="dp-stat"><div class="dpv">LVL ${me.level||'—'}</div><div class="dpl">Account Level</div></div>
      <div class="dp-stat"><div class="dpv">${dmgMade}</div><div class="dpl">Dmg Dealt</div></div>
      <div class="dp-stat"><div class="dpv">${dmgRcvd}</div><div class="dpl">Dmg Received</div></div>
      <div class="dp-stat"><div class="dpv">${dmgMade&&dmgRcvd?((dmgMade/dmgRcvd).toFixed(2)):'—'}</div><div class="dpl">Dmg Ratio</div></div>
    </div>
  </div></div>`;

  perfHtml+=`<div class="panel-section"><div class="panel-section-title">Ability Casts</div>
  <div class="ability-grid">
    <div class="ability-chip"><div class="ac-key">C</div><div class="ac-val">${abilities.c_cast||0}</div></div>
    <div class="ability-chip"><div class="ac-key">Q</div><div class="ac-val">${abilities.q_cast||0}</div></div>
    <div class="ability-chip"><div class="ac-key">E</div><div class="ac-val">${abilities.e_cast||0}</div></div>
    <div class="ability-chip ult"><div class="ac-key">ULT</div><div class="ac-val">${abilities.x_cast||0}</div></div>
    <div class="ability-chip eco"><div class="ac-key">Avg Eco</div><div class="ac-val">${avgEco}cr</div></div>
    <div class="ability-chip eco"><div class="ac-key">Total Spent</div><div class="ac-val">${totalSpent}cr</div></div>
  </div></div>`;

  if(totalShots>0||headS>0){
    perfHtml+=`<div class="panel-section"><div class="panel-section-title">Accuracy Breakdown</div>
    <div class="acc-body-row" style="margin-top: 0;">
      <div class="acc-bars" style="gap: 8px;">
        ${[['Head',headS,hsPct,'var(--win)'],['Body',bodyS,bsPct,'var(--muted)'],['Legs',legS,lsPct,'var(--loss)']].map(([label,hits,pct,col])=>`
        <div class="acc-row">
          <span class="acc-lbl" style="width:34px;">${label.toUpperCase()}</span>
          <div class="acc-track"><div class="acc-fill" style="width:${pct}%;background:${col};"></div></div>
          <span class="acc-pct" style="color:${col}">${pct}%</span>
          <span class="acc-hits">${hits.toLocaleString()} hits</span>
        </div>`).join('')}
      </div>
      ${buildAccuracyBodySvg(hsPct, bsPct, lsPct)}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:110px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:38px;line-height:1;color:${hsPct>=25?'var(--win)':hsPct>=15?'var(--accent)':'var(--loss)'};">${hsPct}%</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px;">HS RATE</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">${totalShots} total shots</div>
      </div>
    </div></div>`;
  }

  const ecoRounds=parsedRounds.filter(r=>findMyPs(r._ps)?.economy);
  perfHtml+=`<div class="panel-section"><div class="panel-section-title">Economy Per Round</div>`;
  if(!ecoRounds.length){
    perfHtml+='<div class="no-detail">Economy data not available</div>';
  } else {
    perfHtml+='<div class="eco-grid">';
    ecoRounds.forEach((r,ri)=>{
      const ps=findMyPs(r._ps);
      const eco=ps?.economy||{};
      const won=(r.winning_team||'').toLowerCase()===myTeamId;
      
      // Weapon & Armor resolution - safe from objects/uuid/fallbacks
      const weapon=(eco.weapon && typeof eco.weapon === 'object') ? (eco.weapon.name || 'None') : (eco.weapon || 'None');
      const armorName=(eco.armor && typeof eco.armor === 'object' && eco.armor.name) ? eco.armor.name : (typeof eco.armor === 'string' && eco.armor ? eco.armor : 'None');
      
      // Compute Buy Type
      let buyType = 'ECO';
      if (eco.loadout_value >= 3900 || weapon.toLowerCase() === 'vandal' || weapon.toLowerCase() === 'phantom' || weapon.toLowerCase() === 'operator') {
        buyType = 'FULL BUY';
      } else if (eco.loadout_value >= 2000) {
        buyType = 'FORCE';
      }
      
      perfHtml+=`
        <div class="eco-card ${won?'won':'lost'}">
          <div class="eco-card-header">
            <span class="eco-round-num">Round ${ri+1}</span>
            <span class="eco-outcome-badge ${won?'won':'lost'}">${won?'WIN':'LOSS'}</span>
            <span class="eco-buy-badge ${buyType.toLowerCase().replace(' ', '-')}">${buyType}</span>
          </div>
          <div class="eco-card-body">
            <div class="eco-weapon-section">
              <span class="eco-weapon-name">${weapon}</span>
              <span class="eco-armor-name">${armorName}</span>
            </div>
            <div class="eco-financials">
              <div class="eco-fin-row"><span class="eco-lbl">Loadout:</span><span class="eco-val">${eco.loadout_value||0} cr</span></div>
              <div class="eco-fin-row"><span class="eco-lbl">Spent:</span><span class="eco-val spent">${eco.spent||0} cr</span></div>
              <div class="eco-fin-row"><span class="eco-lbl">Bank:</span><span class="eco-val bank">${eco.remaining||0} cr</span></div>
            </div>
          </div>
        </div>`;
    });
    perfHtml+='</div>';
  }
  perfHtml+='</div>';
  safeSetInnerHtml(`tabcontent-${idx}-performance`, perfHtml);

  let duelsHtml = '';
  const duelK = me.stats?.kills || 0;
  const duelD = me.stats?.deaths || 0;
  const duelWin = Math.round((duelK / Math.max(duelK+duelD,1)) * 100);
  const kd = duelD ? (duelK/duelD).toFixed(2) : duelK.toFixed(2);
  const totalRounds = rounds.length;
  const kpr = totalRounds ? (duelK/totalRounds).toFixed(2) : '—';
  const dpr = totalRounds ? (duelD/totalRounds).toFixed(2) : '—';
  const duelCol = duelWin >= 55 ? 'var(--win)' : duelWin <= 44 ? 'var(--loss)' : 'var(--accent)';
  const kdCol   = parseFloat(kd) >= 1.2 ? 'var(--win)' : parseFloat(kd) < 0.9 ? 'var(--loss)' : 'var(--text)';
  const hsCol   = hsPct >= 25 ? 'var(--win)' : hsPct < 15 ? 'var(--loss)' : 'var(--text)';
  const winW = Math.round((duelK/Math.max(duelK+duelD,1))*100);
  const lossW = 100 - winW;

  let insight = '';
  if (duelWin >= 60) insight = `<span style="color:var(--win)">Strong duel game</span> — you won ${duelWin}% of 1v1s this match.`;
  else if (duelWin <= 42) insight = `<span style="color:var(--loss)">Rough duel game</span> — lost more gunfights than won (${duelWin}%). Check if you were peeking without info.`;
  else insight = `<span style="color:var(--muted)">Average duel game</span> — close split between kills and deaths.`;
  if (hsPct >= 30) insight += ` Excellent HS% (${hsPct}%) this match.`;
  else if (hsPct < 15 && totalShots > 0) insight += ` Low HS% (${hsPct}%) — likely spraying under pressure.`;

  const duelStatMini = (l, v, c) => `<div style="text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted2);letter-spacing:1px;text-transform:uppercase;">${l}</div><div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:${c}">${v}</div></div>`;

  duelsHtml += `<div class="panel-section"><div class="panel-section-title">Duel Breakdown Summary</div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
        ${duelStatMini('Duel Win %', duelWin+'%', duelCol)}
        ${duelStatMini('K/D', kd, kdCol)}
        ${duelStatMini('KPR', kpr, parseFloat(kpr)>=0.8?'var(--win)':parseFloat(kpr)<0.5?'var(--loss)':'var(--text)')}
        ${duelStatMini('DPR', dpr, parseFloat(dpr)<=0.7?'var(--win)':parseFloat(dpr)>0.9?'var(--loss)':'var(--text)')}
        ${duelStatMini('HS %', hsPct+'%', hsCol)}
      </div>
      <div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:6px;display:flex;">
        <div style="width:${winW}%;background:var(--win);transition:width 0.8s ease;"></div>
        <div style="width:${lossW}%;background:var(--loss);transition:width 0.8s ease;"></div>
      </div>
      <div style="font-family:'Barlow',sans-serif;font-size:12px;color:rgba(240,240,242,0.7);line-height:1.5">${insight}</div>
    </div>
  </div>`;

  const duelEntries=Object.values(duelMatrix).filter(d=>d.kills>0||d.deaths>0)
    .sort((a,b)=>(b.kills-b.deaths)-(a.kills-a.deaths));
  if(duelEntries.length){
    duelsHtml+=`<div class="panel-section"><div class="panel-section-title">Duel Matrix</div>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:8px;">YOUR KILLS vs THEIR KILLS AGAINST YOU</div>
    <div style="display:flex;flex-direction:column;gap:4px;">`;
    duelEntries.forEach(d=>{
      const icon=getAgentIconUrl(d.agent);
      const net=d.kills-d.deaths;
      const netCol=net>0?'var(--win)':net<0?'var(--loss)':'var(--muted)';
      duelsHtml+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--surface2);border-radius:var(--radius-sm);">
        ${icon?`<img src="${icon}" style="width:24px;height:24px;object-fit:contain;border-radius:3px;background:var(--surface3);" onerror="this.style.display='none'">`:
          `<div style="width:24px;height:24px;background:var(--surface3);border-radius:3px;"></div>`}
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">${d.agent}</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
          <div style="text-align:center;min-width:28px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--win);line-height:1;">${d.kills}</div>
            <div style="font-family:'DM Mono',monospace;font-size:7px;color:var(--muted2);letter-spacing:1px;">KILLS</div>
          </div>
          <div style="width:1px;height:24px;background:var(--border);"></div>
          <div style="text-align:center;min-width:28px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--loss);line-height:1;">${d.deaths}</div>
            <div style="font-family:'DM Mono',monospace;font-size:7px;color:var(--muted2);letter-spacing:1px;">DEATHS</div>
          </div>
          <div style="min-width:36px;text-align:right;">
            <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:14px;color:${netCol};">${net>0?'+':''}${net}</span>
          </div>
        </div>
      </div>`;
    });
    duelsHtml+='</div></div>';
  }

  duelsHtml+=`<div class="panel-section"><div class="panel-section-title">Round Kill Feed</div>`;
  const killedRounds=Object.entries(killsByRound);
  if(!killedRounds.length){
    duelsHtml+='<div class="no-detail">No kill data for this match</div>';
  } else {
    const resolveWeapon=(k)=>{
      if(k.damage_weapon_name && k.damage_weapon_name.length>1) return {name:k.damage_weapon_name, icon:k.damage_weapon_assets?.killfeed_icon||null};
      const wpnId = k.damage_weapon_id||k.finishing_damage?.damage_item||'';
      const cached = _assetCache.weapons[wpnId.toLowerCase()];
      if(cached) return {name:cached.name, icon:cached.iconUrl||null};
      const cleaned = wpnId.replace(/^[^/]*\//,'').replace(/TX_Hud_/i,'').replace(/_/g,' ').trim();
      if(/^[0-9a-f]{8}-/.test(cleaned)) return {name:'Ability', icon:null};
      return {name:cleaned||'Unknown', icon:null};
    };

    duelsHtml+='<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    killedRounds.forEach(([ri,{kills,won}])=>{
      const rndNum=parseInt(ri)+1;
      const badge=kills.length>=5?' · ACE':kills.length>=4?' · 4K':kills.length>=3?' · 3K':'';
      duelsHtml+=`<div style="background:var(--surface2);border:1px solid ${won?'rgba(62,207,142,0.12)':'rgba(255,87,87,0.08)'};border-radius:var(--radius-sm);overflow:hidden;flex:1;min-width:220px;max-width:100%;">
        <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--border);">
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:12px;color:${won?'var(--win)':'var(--loss)'};">R${rndNum}</span>
          <span style="font-family:'DM Mono',monospace;font-size:8px;color:${won?'var(--win)':'var(--loss)'};letter-spacing:1px;opacity:0.7;">${won?'W':'L'}${badge}</span>
          <span style="margin-left:auto;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px;color:var(--text);">${kills.length}K</span>
        </div>`;
      kills.forEach(k=>{
        const wpn=resolveWeapon(k);
        let isHS=typeof k.headshot === 'boolean' ? k.headshot : k.finishing_damage?.is_headshot;
        const victimId=k.victim_puuid||k.victim||'';
        if (!isHS) {
          const myPsInfo = findMyPs(parsedRounds[ri]?._ps);
          if (myPsInfo?.damage_events) {
            const dE = myPsInfo.damage_events.find(de => de.receiver_puuid === victimId);
            if (dE && dE.headshots > 0) isHS = true;
          }
        }
        isHS = isHS || false;
        const victim=allPlayers.find(p=>(p.puuid || p.subject || p.id)===victimId);
        const victimName=victim?.name||'Enemy';
        const victimAgent=victim?.character||'';
        const victimIcon=getAgentIconUrl(victimAgent);
        duelsHtml+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-bottom:1px solid rgba(255,255,255,0.02);">
          ${victimIcon?`<img src="${victimIcon}" style="width:16px;height:16px;object-fit:contain;flex-shrink:0;border-radius:2px;" onerror="this.style.display='none'">`
            :`<div style="width:16px;height:16px;background:var(--surface3);border-radius:2px;flex-shrink:0;"></div>`}
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${victimName}</span>
          ${wpn.icon?`<img src="${wpn.icon}" style="height:10px;width:auto;object-fit:contain;filter:brightness(0.8);flex-shrink:0;" onerror="this.outerHTML='<span style=\\'font-family:DM Mono,monospace;font-size:8px;color:var(--muted2)\\'>${wpn.name}</span>'">`
            :`<span style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted2);flex-shrink:0;">${wpn.name}</span>`}
          ${isHS?`<span style="font-family:'DM Mono',monospace;font-size:7px;font-weight:700;color:var(--accent);background:var(--accentdim);padding:1px 4px;border-radius:2px;letter-spacing:1px;flex-shrink:0;">HS</span>`:''}
        </div>`;
      });
    });
    duelsHtml+='</div>';
  }
  duelsHtml+='</div>';
  const duelsEl = document.getElementById(`tabcontent-${idx}-duels`);
  if (duelsEl) duelsEl.innerHTML = duelsHtml;

  const timelineHtml = `<div class="panel-section">
    <div class="panel-section-title">Round History Timeline</div>
    ${buildRounds(match, myTeamId)}
  </div>
  <div class="panel-section">
    <div class="panel-section-title">Clutches & Aces</div>
    ${buildClutches(match, myTeamId)}
  </div>`;
  const timeEl = document.getElementById(`tabcontent-${idx}-timeline`);
  if (timeEl) timeEl.innerHTML = timelineHtml;
}




window._allRenderedMatches = []; // store for filtering (NO rawMatch — lightweight)
window._matchDetailStore = new Map(); // matchId → rawMatch (capped at 30 to prevent OOM)
window._activeFilter = 'all';
window._activeSearch = '';

function formatMatchDate(ts) {
  if (!ts) return '';
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  const now = new Date();
  const diffMs = now - d;
  const diffH = diffMs / 3600000;
  const diffD = diffMs / 86400000;
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffD < 2) return 'Yesterday';
  if (diffD < 7) return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function isToday(ts) {
  if (!ts) return false;
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

window._matchesLimit = 15;

function setFilter(filter, btn) {
  window._activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters(true);
}

function applyFilters(resetLimit = true) {
  if (resetLimit) {
    window._matchesLimit = 15;
  }
  updateMatchesListUI();
}

function getFilteredMatches() {
  const matches = window._allRenderedMatches || [];
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const filter = window._activeFilter || 'all';
  
  return matches.filter(m => {
    const won = m.won;
    const agent = (m.agentName || '').toLowerCase();
    const map = (m.map || '').toLowerCase();
    const today = isToday(m.gameStart);
    
    let show = true;
    if (filter === 'win' && !won) show = false;
    if (filter === 'loss' && won) show = false;
    if (filter === 'today' && !today) show = false;
    if (search && !agent.includes(search) && !map.includes(search)) show = false;
    return show;
  });
}

function loadMoreMatches() {
  window._matchesLimit += 15;
  applyFilters(false);
}


function getDayKey(ts) {
  if (!ts) return 'unknown';
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getDayLabel(ts) {
  if (!ts) return 'Unknown Date';
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function renderMatches(matches) {
  window._allRenderedMatches = matches;
  window._matchesLimit = 15;
  applyFilters(true);
  renderSessionBanner(matches);
}

function updateMatchesListUI() {
  const filtered = getFilteredMatches();
  const sliced = filtered.slice(0, window._matchesLimit);
  const wrap = document.getElementById('matches-list');
  if (!wrap) return;

  if (!sliced.length) {
    wrap.innerHTML = '<div class="card span-12"><div class="placeholder-txt">No matches found</div></div>';
    const fc = document.getElementById('filter-count');
    if (fc) fc.textContent = '0 matches';
    return;
  }

  wrap.style.display = 'contents';
  const mmrH = window._mmrHistory || {};

  // Group sliced matches by day
  const groups = [];
  const groupMap = {};
  sliced.forEach((m, idx) => {
    const key = getDayKey(m.gameStart);
    if (!groupMap[key]) {
      groupMap[key] = { label: getDayLabel(m.gameStart), matches: [], rrTotal: 0, hasRR: false, wins: 0, losses: 0 };
      groups.push(groupMap[key]);
    }
    const g = groupMap[key];
    g.matches.push({ m, idx });
    const rr = mmrH[m.matchId];
    if (rr !== undefined) { g.rrTotal += rr; g.hasRR = true; }
    if (m.won) g.wins++; else g.losses++;
  });

  let html = '';
  let globalIdx = 0;
  groups.forEach(group => {
    const rrCls = group.rrTotal > 0 ? 'pos' : group.rrTotal < 0 ? 'neg' : 'neu';
    const rrText = group.hasRR ? `${group.rrTotal > 0 ? '+' : ''}${group.rrTotal} RR` : '';
    const wlText = `${group.wins}W ${group.losses}L`;
    html += `<div class="day-group-header" style="grid-column:span 12;">
      <span class="day-group-label">${group.label}</span>
      <div class="day-group-line"></div>
      <span class="day-group-wl">${wlText}</span>
      ${rrText ? `<span class="day-group-rr ${rrCls}">${rrText}</span>` : ''}
    </div>`;

    group.matches.forEach(({ m, idx }) => {
      const wl = m.won ? 'win' : 'loss';
      const acs = Math.round(m.score / 100);
      const grade = getGrade(m.kills, m.deaths, m.assists, acs, m.won);
      const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);
      const agentIcon = getAgentIconUrl(m.agentName);
      
      const isMatchMVP = m.mvpNames?.match?.toLowerCase() === PLAYER_NAME.toLowerCase();
      const isTeamMVP = !isMatchMVP && m.mvpNames?.team?.toLowerCase() === PLAYER_NAME.toLowerCase();

      const matchDateStr = formatMatchDate(m.gameStart);
      const matchIsToday = isToday(m.gameStart);

      html += `<div class="match-item" data-won="${m.won}" data-agent="${(m.agentName || '').toLowerCase()}" data-map="${(m.map || '').toLowerCase()}" data-today="${matchIsToday}" style="animation-delay:${globalIdx++ * 40}ms">
        <div class="match-row" id="mrow-${idx}" onclick="togglePanel(${idx},'${m.matchId || ''}')">
          <div class="mr-result ${wl}">${m.won ? 'WIN' : 'LOSS'}</div>
          <div class="mr-agent" style="padding:0;gap:0;overflow:hidden;">
            ${(() => {
              const mi = getMapImg(m.map || '');
              const mn = m.map || '';
              return mi ? `<div class="mr-map-thumb"><img data-map="${mn}" src="${mi}" alt="${mn}" loading="lazy" onerror="retryMapImg(this, this.dataset.map)"><div class="mr-map-thumb-label">${mn.toUpperCase()}</div></div>` : `<div class="mr-map-thumb" style="background:var(--surface2);"><div class="mr-map-thumb-label">${mn.toUpperCase()}</div></div>`;
            })()}
            <div style="padding:12px 12px;">
              ${agentIcon ? `<img class="mr-agent-icon" src="${agentIcon}" loading="lazy" onerror="this.style.display='none'">` : ``}
            </div>
            <div style="padding:12px 0;">
              <div class="mr-agent-name">${(m.agentName || '—').toUpperCase()}</div>
              <div class="mr-map" style="margin-top:2px;">${(m.map || '—').toUpperCase()}</div>
              ${matchDateStr ? `<div class="mr-date">${matchDateStr}</div>` : ''}
            </div>
          </div>
          <div class="mr-score">${m.rounds}</div>
          <div class="mr-lobby">
            ${(() => {
              const info = m.lobbyRank;
              if (!info || !info.overall) return '<span class="mr-lobby-txt">—</span>';
              const img = getRankImgUrl(info.overall.name) || '';
              return (img ? `<img class="mr-lobby-img" src="${img}" loading="lazy" onerror="this.style.display='none'">` : '') + '<span class="mr-lobby-txt" style="color:' + getRankColor(info.overall.name) + '">' + info.overall.name.replace(' ', '<br>') + '</span>';
            })()}
          </div>
          <div class="mr-kda">
            <div class="mr-kda-main">${m.kills} / ${m.deaths} / ${m.assists}</div>
            <div class="mr-kda-sub">K / D / A</div>
          </div>
          <div>
            <div class="mr-acs">${acs}</div>
            <div class="mr-acs-sub">ACS</div>
          </div>
          <div>
            <div class="mr-grade ${grade}">${grade}</div>
            <div class="mr-grade-sub">${isMatchMVP ? 'MATCH MVP' : isTeamMVP ? 'TEAM MVP' : 'GRADE'}</div>
          </div>
          <div class="mr-rr">
            ${(() => {
              const rr = (window._mmrHistory || {})[m.matchId || ''];
              if (rr === undefined || rr === null) return `<div class="mr-rr-val unk">—</div><div class="mr-rr-lbl">RR</div>`;
              const cls = rr > 0 ? 'pos' : rr < 0 ? 'neg' : 'unk';
              return `<div class="mr-rr-val ${cls}">${rr > 0 ? '+' : ''}${rr}</div><div class="mr-rr-lbl">RR</div>`;
            })()}
          </div>
          <div class="mr-chevron">▼</div>
        </div>
        <div class="match-panel" id="mpanel-${idx}"></div>
      </div>`;
    });
  });

  if (filtered.length > window._matchesLimit) {
    html += `
      <div id="load-more-container" style="grid-column: span 12; display: flex; justify-content: center; padding: 24px 0;">
        <button class="load-more-btn" onclick="loadMoreMatches()">
          <span>Show More Matches</span>
          <span class="load-more-count">(${filtered.length - window._matchesLimit} remaining)</span>
        </button>
      </div>
    `;
  }

  wrap.innerHTML = html;
  setTimeout(() => animateIn('#matches-list .match-item'), 50);

  const fc = document.getElementById('filter-count');
  if (fc) fc.textContent = filtered.length + ' match' + (filtered.length !== 1 ? 'es' : '');
}

function buildMatchPanelHTML(m, idx) {
  const wl = m.won ? 'win' : 'loss';
  const acs = Math.round(m.score / 100);
  const hsPct = m.hs && m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
  const grade = getGrade(m.kills, m.deaths, m.assists, acs, m.won);
  const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);
  const agentIcon = getAgentIconUrl(m.agentName);
  
  const rawMatch = window._matchDetailStore.get(m.matchId) || null;
  const allPlayers = rawMatch ? getPlayerList(rawMatch) : [];
  const getACS = p => Math.round((p.stats?.score || 0) / 100);
  const matchMVPPlayer = allPlayers.length ? allPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, allPlayers[0]) : null;
  const alliedPlayers = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
  const teamMVPPlayer = alliedPlayers.length ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0]) : null;
  const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  const mvpBadge = isMatchMVP ? `<div class="mvp-header-badge match-mvp">👑 Match MVP</div>` : isTeamMVP ? `<div class="mvp-header-badge team-mvp">⭐ Team MVP</div>` : '';
  const _isRanked = (window._currentMode || 'competitive') === 'competitive';
  const scoreboardHTML = rawMatch ? buildScoreboard(rawMatch, m.myTeamId, _isRanked) : '<div class="no-detail">Match data not cached — click a tab to load</div>';

  return `
    <div class="panel-body">
      <div class="panel-header-row">
        <div class="panel-grade-badge ${grade}">${grade}</div>
        <div class="panel-match-meta">
          <div class="panel-meta-left">
            <div class="panel-match-title">
              ${agentIcon ? `<img src="${agentIcon}" style="width:28px;height:28px;object-fit:contain;" onerror="this.style.display='none'">` : ``}
              ${(m.agentName || '—').toUpperCase()} · ${(m.map || '—').toUpperCase()}
            </div>
            <div class="panel-match-sub">${m.won ? 'VICTORY' : 'DEFEAT'} · ${m.rounds} rounds</div>
            ${mvpBadge}
            <div style="margin: 8px 0 12px; display: flex; gap: 8px; align-items: center;">
              <button class="share-flex-btn" onclick="openShareMatchModal(${idx}, event)" style="background: linear-gradient(135deg, rgba(250, 68, 84, 0.25) 0%, rgba(232, 255, 71, 0.2) 100%); color: #fff; border: 1px solid rgba(250, 68, 84, 0.5); font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; padding: 7px 16px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 14px rgba(250, 68, 84, 0.15), 0 0 10px rgba(232, 255, 71, 0.05); vertical-align: middle;" onmouseover="this.style.background='linear-gradient(135deg, rgba(250, 68, 84, 0.38) 0%, rgba(232, 255, 71, 0.3) 100%)'; this.style.borderColor='rgba(250, 68, 84, 0.8)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(250, 68, 84, 0.3), 0 0 12px rgba(232, 255, 71, 0.15)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(250, 68, 84, 0.25) 0%, rgba(232, 255, 71, 0.2) 100%)'; this.style.borderColor='rgba(250, 68, 84, 0.5)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(250, 68, 84, 0.15), 0 0 10px rgba(232, 255, 71, 0.05)';">
                <span>✨ Share Flex Card</span>
              </button>
            </div>
          </div>
          <div class="panel-stat-row">
            <div class="ps-item"><div class="psv">${m.kills}/${m.deaths}/${m.assists}</div><div class="psl">K / D / A</div></div>
            <div class="ps-item"><div class="psv">${kd}</div><div class="psl">K/D</div></div>
            <div class="ps-item"><div class="psv">${acs}</div><div class="psl">ACS</div></div>
            <div class="ps-item"><div class="psv">${hsPct}%</div><div class="psl">HS Rate</div></div>
            ${(() => {
              const rr = (window._mmrHistory || {})[m.matchId || ''];
              if (rr === undefined || rr === null) return '';
              const col = rr > 0 ? 'var(--win)' : rr < 0 ? 'var(--loss)' : 'var(--muted)';
              return `<div class="ps-item"><div class="psv" style="color:${col}">${rr > 0 ? '+' : ''}${rr}</div><div class="psl">RR Change</div></div>`;
            })()}
            ${(() => {
              if (!rawMatch) return '';
              const info = getLobbyRankInfo(allPlayers, m.myTeamId);
              if (!info || !info.overall) return '';
              const img = getRankImgUrl(info.overall.name) || '';
              return `<div class="ps-item"><div class="psv" style="display:flex;align-items:center;gap:6px;font-size:18px;">${img ? `<img src="${img}" style="width:22px;height:22px;object-fit:contain;" onerror="this.style.display='none'">` : ''}${info.overall.name}</div><div class="psl">Lobby Avg Rank</div></div>`;
            })()}
          </div>
        </div>
      </div>

      <!-- TABS CONTAINER -->
      <div class="panel-tabs">
        <button class="panel-tab-btn active" data-tab="scoreboard" onclick="switchPanelTab(${idx}, 'scoreboard')">🏆 Scoreboard</button>
        <button class="panel-tab-btn" data-tab="performance" onclick="switchPanelTab(${idx}, 'performance')">📊 Performance</button>
        <button class="panel-tab-btn" data-tab="duels" onclick="switchPanelTab(${idx}, 'duels')">🎯 Fights</button>
        <button class="panel-tab-btn" data-tab="timeline" onclick="switchPanelTab(${idx}, 'timeline')">⏱️ Rounds</button>
        <button class="panel-tab-btn" data-tab="ai" onclick="switchPanelTab(${idx}, 'ai')">🤖 AI Analysis</button>
      </div>

      <!-- TAB CONTENTS -->
      <div class="panel-tab-content active" id="tabcontent-${idx}-scoreboard">
        ${scoreboardHTML}
      </div>
      <div class="panel-tab-content" id="tabcontent-${idx}-performance">
        <div class="detail-loading">Click match to load full details...</div>
      </div>
      <div class="panel-tab-content" id="tabcontent-${idx}-duels">
        <div class="detail-loading">Click match to load full details...</div>
      </div>
      <div class="panel-tab-content" id="tabcontent-${idx}-timeline">
        <div class="detail-loading">Click match to load full details...</div>
      </div>
      <div class="panel-tab-content" id="tabcontent-${idx}-ai">
        <div class="match-ai-wrap" style="margin-top:0;">
          <div class="match-ai-header">
            <div class="match-ai-title">🤖 ValBot Match Analysis</div>
            <button class="match-ai-btn" id="mai-btn-${idx}" onclick="runMatchAnalysis(${idx}, event)">⚡ Analyse This Match</button>
          </div>
          <div class="match-ai-loading" id="mai-loading-${idx}">
            <div class="match-ai-spinner"></div>
            <span id="mai-loading-txt-${idx}">ANALYSING MATCH...</span>
          </div>
          <div class="match-ai-body" id="mai-body-${idx}"></div>
        </div>
      </div>
    </div>
  `;
}

// ── AI ANALYSIS ──
window._processedStats = null; // populated by processMatches

// ─── SHARED AGENT POOL CACHE ─── Updated on each ValBot run
window._playerAgentPool = {};

function buildStatsForAI(matches) {
  let tK=0,tD=0,tA=0,tS=0,tHS=0,tShots=0,wins=0,losses=0,n=0;
  const agentMap={}, mapData={}, lobbyRanks=[], sideWins={att:0,def:0,attTotal:0,defTotal:0};
  let firstBloodEst=0, multiKillEst=0, clutchWins=0;
  const perMatchKD = [];

  // Process newest-first (matches[0] = most recent)
  matches.forEach((match, mIdx) => {
    const me = findMe(match);
    if (!me) return; n++;
    const s = me.stats || {};
    const k = s.kills||0, d = s.deaths||0, a = s.assists||0, sc = s.score||0;
    const hs = s.headshots||0, shots = (s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
    tK+=k; tD+=d; tA+=a; tS+=sc; tHS+=hs; tShots+=shots;
    const myTeamId = (me.team||'').toLowerCase();
    const won = match.teams?.[myTeamId]?.has_won || false;
    if (won) wins++; else losses++;
    perMatchKD.push(d ? k/d : k);
    const agentName = me.character || 'Unknown';
    if (!agentMap[agentName]) agentMap[agentName] = {matches:0,wins:0,kills:0,deaths:0,score:0};
    const ag = agentMap[agentName];
    ag.matches++; if(won) ag.wins++; ag.kills+=k; ag.deaths+=d; ag.score+=sc;
    const mapName = match.metadata?.map || 'Unknown';
    if (!mapData[mapName]) mapData[mapName] = {matches:0,wins:0,kills:0,deaths:0,score:0};
    const mp = mapData[mapName];
    mp.matches++; if(won) mp.wins++; mp.kills+=k; mp.deaths+=d; mp.score+=sc;
    // Side Win Rates (attack = first 12 rounds for most maps)
    const rounds = match.rounds || [];
    rounds.forEach((r, ri) => {
      const rWon = (r.winning_team||'').toLowerCase() === myTeamId;
      const isAtt = ri < Math.ceil(rounds.length / 2);
      if (isAtt) { sideWins.attTotal++; if(rWon) sideWins.att++; }
      else { sideWins.defTotal++; if(rWon) sideWins.def++; }
      const myAlive = r[myTeamId]?.players_alive ?? null;
      if (myAlive === 1 && rWon) clutchWins++;
    });
    // Lobby rank
    const allP = getPlayerList(match);
    const info = getLobbyRankInfo(allP, myTeamId);
    if (info?.overall) lobbyRanks.push(info.overall.rr+50);
    firstBloodEst += Math.round(k*0.18);
    if (k >= 3) multiKillEst++;
  });

  const kd = tD ? (tK/tD) : tK;
  const wr = n ? Math.round((wins/(wins+losses))*100) : 0;
  const hsPct = tShots ? Math.round((tHS/tShots)*100) : 0;
  const avgACS = n ? Math.round(tS/n/100) : 0;
  const avgKills = (tK/n).toFixed(1);
  const avgDeaths = (tD/n).toFixed(1);
  const avgAssists = (tA/n).toFixed(1);

  // ── TREND: last 5 vs previous 5 ──
  const recent5 = perMatchKD.slice(0, 5);
  const prev5   = perMatchKD.slice(5, 10);
  const r5kd = recent5.length ? (recent5.reduce((s,v)=>s+v,0)/recent5.length) : kd;
  const p5kd = prev5.length  ? (prev5.reduce((s,v)=>s+v,0)/prev5.length)  : kd;
  const trendDelta = parseFloat((r5kd - p5kd).toFixed(2));
  const trendDir = Math.abs(trendDelta) < 0.05 ? 'stable'
    : trendDelta > 0 ? 'improving' : 'declining';

  const recentMatches5 = matches.slice(0,5);
  const recentWins5 = recentMatches5.filter(m => {
    const me2 = findMe(m); if(!me2) return false;
    const tid = (me2.team||'').toLowerCase();
    return m.teams?.[tid]?.has_won || false;
  }).length;
  const recentWR5 = recentMatches5.length ? Math.round((recentWins5/recentMatches5.length)*100) : wr;

  // ── CONSISTENCY: std-dev of per-match KD ──
  const meanKD = kd;
  const stdDev = perMatchKD.length > 1
    ? Math.sqrt(perMatchKD.reduce((s,v)=>s+Math.pow(v-meanKD,2),0)/perMatchKD.length)
    : 0;
  const consistencyScore = Math.max(0, Math.round(100 - stdDev * 60)); // 0-100

  // ── CARRY %: how often they top-frag their team ──
  let carryCount = 0;
  matches.forEach(match => {
    const me = findMe(match); if (!me) return;
    const myTeamId = (me.team||'').toLowerCase();
    const allied = getPlayerList(match).filter(p => (p.team||'').toLowerCase() === myTeamId);
    const myScore = me.stats?.score || 0;
    const isTopFrag = allied.every(p => (p.stats?.score || 0) <= myScore);
    if (isTopFrag) carryCount++;
  });
  const carryPct = n ? Math.round((carryCount/n)*100) : 0;

  // ── RANK READINESS SCORE (0-100) ──
  const kdScore  = Math.min(100, Math.round(parseFloat(kd.toFixed(2)) / 2.0 * 100));
  const wrScore  = Math.min(100, Math.round(wr / 65 * 100));
  const hsScore  = Math.min(100, Math.round(hsPct / 30 * 100));
  const acsScore = Math.min(100, Math.round(avgACS / 280 * 100));
  const trendBonus = trendDir === 'improving' ? 8 : trendDir === 'declining' ? -8 : 0;
  const readinessScore = Math.max(0, Math.min(100,
    Math.round(kdScore*0.3 + wrScore*0.3 + hsScore*0.2 + acsScore*0.2 + trendBonus)
  ));

  const topAgents = Object.entries(agentMap)
    .sort((a,b)=>b[1].matches-a[1].matches).slice(0,5)
    .map(([name,s])=>({name,matches:s.matches,wr:Math.round(s.wins/s.matches*100),kd:s.deaths?(s.kills/s.deaths).toFixed(2):s.kills,acs:Math.round(s.score/s.matches/100)}));

  const bestMap = Object.entries(mapData).filter(([,m])=>m.matches>=2)
    .sort((a,b)=>(b[1].wins/b[1].matches)-(a[1].wins/a[1].matches))[0];
  const worstMap = Object.entries(mapData).filter(([,m])=>m.matches>=2)
    .sort((a,b)=>(a[1].wins/a[1].matches)-(b[1].wins/b[1].matches))[0];

  const avgLobbyRR = lobbyRanks.length ? Math.round(lobbyRanks.reduce((s,v)=>s+v,0)/lobbyRanks.length) : null;
  const avgLobbyRank = avgLobbyRR ? getRankFromRR(avgLobbyRR) : null;

  const attWR = sideWins.attTotal ? Math.round((sideWins.att/sideWins.attTotal)*100) : null;
  const defWR = sideWins.defTotal ? Math.round((sideWins.def/sideWins.defTotal)*100) : null;

  // Cache agent pool for Draft Coach
  window._playerAgentPool = {};
  topAgents.forEach(a => { window._playerAgentPool[a.name.toLowerCase()] = a; });

  return {
    totalMatches:n, wins, losses, wr, recentWR5,
    kd:kd.toFixed(2), avgKills, avgDeaths, avgAssists,
    avgACS, hsPct,
    clutchWins, firstBloodEst, multiKillEst,
    topAgents,
    bestMap:bestMap?{name:bestMap[0],wr:Math.round(bestMap[1].wins/bestMap[1].matches*100),matches:bestMap[1].matches}:null,
    worstMap:worstMap?{name:worstMap[0],wr:Math.round(worstMap[1].wins/worstMap[1].matches*100),matches:worstMap[1].matches}:null,
    avgLobbyRank:avgLobbyRank?.name||null,
    trendDelta, trendDir, r5kd:r5kd.toFixed(2), p5kd:p5kd.toFixed(2),
    consistencyScore, carryPct, readinessScore, attWR, defWR
  };
}

function renderAIStats(stats) {
  const kdClass  = parseFloat(stats.kd)>=1.2?'good':parseFloat(stats.kd)>=0.9?'warn':'bad';
  const wrClass  = stats.wr>=55?'good':stats.wr>=45?'warn':'bad';
  const hsClass  = stats.hsPct>=25?'good':stats.hsPct>=15?'warn':'bad';
  const acsClass = stats.avgACS>=220?'good':stats.avgACS>=170?'warn':'bad';
  const clutchRate = stats.totalMatches?((stats.clutchWins/stats.totalMatches)*100).toFixed(1):0;
  const clutchClass = parseFloat(clutchRate)>=1.5?'good':parseFloat(clutchRate)>=0.8?'warn':'bad';
  const trendArrow = stats.trendDir==='improving'?'📈 +'+stats.trendDelta:stats.trendDir==='declining'?'📉 '+stats.trendDelta:'➡️ Stable';
  const trendCol   = stats.trendDir==='improving'?'var(--win)':stats.trendDir==='declining'?'var(--loss)':'var(--muted)';
  const rsColor    = stats.readinessScore>=70?'var(--win)':stats.readinessScore>=45?'#f5a623':'var(--loss)';
  const csColor    = stats.consistencyScore>=75?'var(--win)':stats.consistencyScore>=50?'#f5a623':'var(--loss)';
  const sideHtml   = stats.attWR!=null ? `<div class="ai-stat-pill"><div class="ai-stat-pill-label">Atk/Def WR</div><div class="ai-stat-pill-val" style="font-size:13px;">${stats.attWR}% / ${stats.defWR}%</div><div class="ai-stat-pill-sub">Attack · Defense</div></div>` : '';
  const carryHtml  = `<div class="ai-stat-pill"><div class="ai-stat-pill-label">Carry Rate</div><div class="ai-stat-pill-val ${stats.carryPct>=40?'good':stats.carryPct>=20?'warn':'bad'}">${stats.carryPct}%</div><div class="ai-stat-pill-sub">Top-fragged team</div></div>`;

  safeSetInnerHtml('ai-stats-grid', `
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Ratio</div><div class="ai-stat-pill-val ${kdClass}">${stats.kd}</div><div class="ai-stat-pill-sub">${stats.avgKills}K / ${stats.avgDeaths}D avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Win Rate</div><div class="ai-stat-pill-val ${wrClass}">${stats.wr}%</div><div class="ai-stat-pill-sub">Last 5: ${stats.recentWR5}%</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg ACS</div><div class="ai-stat-pill-val ${acsClass}">${stats.avgACS}</div><div class="ai-stat-pill-sub">Combat score avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">HS Rate</div><div class="ai-stat-pill-val ${hsClass}">${stats.hsPct}%</div><div class="ai-stat-pill-sub">Headshot %</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Clutch Rate</div><div class="ai-stat-pill-val ${clutchClass}">${clutchRate}%</div><div class="ai-stat-pill-sub">${stats.clutchWins} clutch wins</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Trend</div><div class="ai-stat-pill-val" style="font-size:13px;color:${trendCol}">${trendArrow}</div><div class="ai-stat-pill-sub">Last 5 vs prev 5</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Consistency</div><div class="ai-stat-pill-val" style="color:${csColor}">${stats.consistencyScore}</div><div class="ai-stat-pill-sub">0-100 · higher = steadier</div></div>
    ${carryHtml}
    ${sideHtml}
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg Lobby</div><div class="ai-stat-pill-val" style="font-size:13px;">${stats.avgLobbyRank||'—'}</div><div class="ai-stat-pill-sub">Lobby rank avg</div></div>
  `);

  // Rank Readiness Ring
  const rs = stats.readinessScore;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - rs/100);
  const existingRing = document.getElementById('ai-readiness-ring-wrap');
  if (!existingRing) {
    const ringDiv = document.createElement('div');
    ringDiv.id = 'ai-readiness-ring-wrap';
    ringDiv.style.cssText = 'display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 18px;margin-bottom:16px;';
    ringDiv.innerHTML = `
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
        <circle cx="36" cy="36" r="28" fill="none" stroke="${rsColor}" stroke-width="6"
          stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${dashOffset.toFixed(1)}"
          stroke-linecap="round" transform="rotate(-90 36 36)" style="transition:stroke-dashoffset 0.8s cubic-bezier(0.25,0.8,0.25,1);"/>
        <text x="36" y="40" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="900" font-size="16" fill="${rsColor}">${rs}</text>
      </svg>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;text-transform:uppercase;color:#fff">Rank Readiness</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${rs>=70?'You are performing above your rank level — push for promotion.':rs>=45?'Core stats are solid — work on 1-2 specific weaknesses to climb.':'Key fundamentals need work before consistent rank progression.'}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:${rsColor};margin-top:6px;letter-spacing:1px">${rs>=70?'RANK UP READY':rs>=45?'ON TRACK':'NEEDS WORK'}</div>
      </div>`;
    const grid = document.getElementById('ai-stats-grid');
    grid.parentNode.insertBefore(ringDiv, grid);
  } else {
    existingRing.querySelector('circle:last-of-type').setAttribute('stroke-dashoffset', dashOffset.toFixed(1));
    existingRing.querySelector('text').textContent = rs;
  }
}

// ── SMART CLIENT-SIDE ANALYSIS ENGINE ──
// Fully personalised — uses trend, consistency, carry%, side WR, and rank benchmarks

function analyseStats(stats) {
  const kd    = parseFloat(stats.kd);
  const wr    = stats.wr;
  const hs    = stats.hsPct;
  const acs   = stats.avgACS;
  const avgK  = parseFloat(stats.avgKills);
  const avgD  = parseFloat(stats.avgDeaths);
  const avgA  = parseFloat(stats.avgAssists);
  const clutchRate = stats.totalMatches ? (stats.clutchWins / stats.totalMatches) : 0;
  const top         = stats.topAgents[0];
  const secondAgent = stats.topAgents[1];
  const trend       = stats.trendDir || 'stable';
  const r5kd        = parseFloat(stats.r5kd || kd);
  const p5kd        = parseFloat(stats.p5kd || kd);
  const consistency = stats.consistencyScore || 50;
  const carry       = stats.carryPct || 0;
  const attWR       = stats.attWR;
  const defWR       = stats.defWR;

  const strengths = [];
  const weaknesses = [];
  const tips = [];
  const agentAdvice = [];
  const mental = [];

  // Fetch current rank and benchmark details
  const rankName = document.getElementById('rank-display')?.textContent?.trim() || 'Silver 2';
  const tier = getRankTier(rankName);
  const bench = RANK_BENCHMARKS[tier] || RANK_BENCHMARKS['Silver'];

  // ── STRENGTHS (Rank-aware & Baseline comparative) ──
  if (kd >= bench.kd) {
    strengths.push(`Your K/D of ${kd} exceeds the ${tier} average (${bench.kd}) — you are consistently winning engagements and trading effectively.`);
  } else if (kd >= 1.0) {
    strengths.push(`Maintaining a solid K/D of ${kd} — you trade favourably in most round fights.`);
  }

  if (wr >= bench.wr) {
    strengths.push(`Strong ${wr}% win rate over ${stats.totalMatches} games exceeds the ${tier} standard (${bench.wr}%) — you make direct round-winning impacts.`);
  }

  if (hs >= bench.hs) {
    strengths.push(`Excellent ${hs}% headshot rate (avg for ${tier}: ${bench.hs}%) shows precise crosshair heights and clean aim mechanics.`);
  }

  if (acs >= bench.acs) {
    strengths.push(`High ACS of ${acs} (rank avg: ${bench.acs}) — you are heavily involved in combat and active round influence.`);
  }

  if (avgA >= 5) {
    strengths.push(`High assist count (${avgA} avg) shows strong utility enabling and team play.`);
  }

  if (clutchRate >= 0.15) {
    strengths.push(`Great clutch rate (${stats.clutchWins} clutch wins) — you stay exceptionally composed under pressure.`);
  }

  if (stats.bestMap) {
    strengths.push(`Excel on ${stats.bestMap.name} with ${stats.bestMap.wr}% win rate — a highly reliable comfort pick.`);
  }

  // Ensure at least 2 strengths
  if (strengths.length === 0) {
    strengths.push(`High commitment to improvement with ${stats.totalMatches} competitive matches tracked.`);
  }
  if (strengths.length === 1) {
    strengths.push(`Averaging ${avgK} kills per game — a solid combat foundation.`);
  }

  // ── WEAKNESSES (Rank-aware & Baseline comparative) ──
  if (kd < bench.kd) {
    weaknesses.push(`Your K/D of ${kd} is below the average for ${tier} (${bench.kd}) — you are dying more than killing, likely taking dry peeks or over-extending.`);
  }

  if (avgD >= 15) {
    weaknesses.push(`Dying ${avgD} times per game is too high. Avoid peeking the same angle twice and focus on escaping after getting one kill.`);
  }

  if (hs < bench.hs) {
    weaknesses.push(`Your headshot rate (${hs}%) is below the ${tier} benchmark (${bench.hs}%) — you are missing clean pick opportunities by relying on body sprays.`);
  }

  if (wr < bench.wr) {
    weaknesses.push(`Your win rate of ${wr}% is below the ${tier} benchmark (${bench.wr}%) — you are struggling to close rounds when ahead.`);
  }

  if (acs < bench.acs) {
    weaknesses.push(`Your ACS of ${acs} is below the ${tier} average (${bench.acs}) — try playing more proactive angles and using damaging utility aggressively.`);
  }

  if (stats.worstMap) {
    weaknesses.push(`Struggling on ${stats.worstMap.name} (${stats.worstMap.wr}% WR) — study standard entry smokes or basic defense setups for this map.`);
  }

  if (clutchRate < 0.06 && stats.totalMatches >= 8) {
    weaknesses.push(`Struggling in clutch situations (${stats.clutchWins} wins) — isolate 1v1 fights systematically rather than panicking.`);
  }

  // ── ACTION TIPS (Rank specific & actual statistics aware) ──
  if (tier === 'Iron' || tier === 'Bronze') {
    tips.push(`As a ${tier} player, focus 100% on basics: keep your crosshair strictly at head height, and make a habit of stopping completely before clicking.`);
    tips.push(`Do not spray Vandal or Phantom from long ranges. Stick to 2-3 bullet bursts and let the recoil reset.`);
  } else if (tier === 'Silver' || tier === 'Gold') {
    tips.push(`To break out of ${tier}, master trading: follow your entry teammate's push immediately. If they die, you get the easy trade-kill.`);
    tips.push(`Proactive utility usage is key: cast your flashes or recon darts to clear entrance lanes at round start rather than holding them.`);
  } else if (tier === 'Platinum' || tier === 'Diamond') {
    tips.push(`At the ${tier} level, play the numbers: if your team gets a 5v4 pick advantage, slow down the pace and default instead of chasing more kills.`);
    tips.push(`Economy efficiency: coordinate purchases with teammates. Never force buy a rifle when your team is saving credits.`);
  } else { // Ascendant / Immortal / Radiant
    tips.push(`At elite ranks (${tier}), coordinate team utility setups. Never peek standard defender lines raw without a teammate's flash or scan.`);
    tips.push(`Record and review your matches: most deaths at this level are due to micro-positioning errors and timing, not raw aim.`);
  }

  if (hs < bench.hs) {
    tips.push(`Spend 10 minutes before every session in The Range: shoot bots on medium speed using tap-fires ONLY at head-level to raise your ${hs}% HS rate.`);
  }

  if (avgA < 4) {
    tips.push(`Your assists (${avgA} avg) are low. Coordinate with your team and flash/smoke to support their entries. Aim for 5+ assists per match.`);
  }

  tips.push(`Warm up for 15 minutes before queuing ranked (Deathmatch or Range). Players who warm up have 20% higher headshot accuracy on their first match.`);

  // ── AGENT ADVICE ──
  if (top) {
    const topKD = parseFloat(top.kd);
    const topWR = top.wr;
    const role = AGENT_ROLES[top.name.toLowerCase()] || 'duelist';
    if (topWR >= 55 && topKD >= 1.1) {
      agentAdvice.push(`${top.name} is your best agent — ${topWR}% WR and ${top.kd} K/D. Keep spamming it in ranked, especially when you need a clutch win.`);
    } else if (topWR < 45) {
      agentAdvice.push(`You play ${top.name} most but only win ${topWR}% — consider if this agent fits your playstyle or if you need to study ${top.name} fundamentals more before ranking with it.`);
    } else {
      agentAdvice.push(`${top.name} is your main with a ${topWR}% WR — solid but not dominant. Focus on mastering their utility usage to push that win rate above 55%.`);
    }

    if (role === 'duelist') agentAdvice.push(`As a ${top.name} main (Duelist), your job is to open sites — if your ACS is below 220, you may be playing too passive. Duelists who play reactive become liabilities.`);
    else if (role === 'controller') agentAdvice.push(`As a ${top.name} main (Controller), your utility win rate matters more than kills — track whether your smokes are winning rounds, not just your K/D.`);
    else if (role === 'sentinel') agentAdvice.push(`As a ${top.name} main (Sentinel), focus on information plays and holding flanks — your assist count should be high, if it's low you may be playing too aggressively.`);
    else if (role === 'initiator') agentAdvice.push(`As a ${top.name} main (Initiator), you enable your team — a low ACS is acceptable if your assists are high and your team is winning gunfights after your flashes/recon.`);
  }

  if (secondAgent && secondAgent.wr > (top ? top.wr : 0)) {
    agentAdvice.push(`Interesting: ${secondAgent.name} has a higher win rate (${secondAgent.wr}%) than your main. Consider shifting focus to ${secondAgent.name} for a ranking streak.`);
  }

  if (stats.topAgents.length >= 3) {
    const worst = [...stats.topAgents].sort((a,b) => a.wr - b.wr)[0];
    if (worst.wr < 40 && worst.matches >= 3) agentAdvice.push(`Consider benching ${worst.name} for now — ${worst.wr}% WR in ${worst.matches} games is a pattern, not bad luck. Return to it after refining fundamentals.`);
  }

  // ── MENTAL GAME ──
  if (wr < 48) {
    mental.push(`With a sub-50% win rate, avoid playing more than 3 ranked games in a row on a losing day. Tilt compounds — taking a 30-min break resets your decision-making more than playing through it.`);
    mental.push(`Focus on "did I play well?" not "did we win?" — a 1.5 K/D in a loss is still good data that you are improving. The wins will follow.`);
  } else if (wr >= 55) {
    mental.push(`You are winning consistently — protect your mental by dodging lobbies with clear toxicity early. One rage-quit or tilted game can derail a +5 session.`);
    mental.push(`Set a session goal (e.g. +2 RR or 3 wins) and log off when you hit it. Greedy sessions after hot streaks are where rank decay happens.`);
  } else {
    mental.push(`Your win rate is stable — use loss streaks (2 in a row) as a signal to switch to unrated and cool down, not as motivation to "fix it" in ranked.`);
    mental.push(`Mute toxic teammates immediately and without guilt. Research consistently shows that muting does not hurt coordination and dramatically reduces in-game errors from stress.`);
  }

  mental.push(`After a loss, type one thing you would do differently in a notes app before queuing again. This 30-second habit accelerates improvement faster than hours of aimtraining.`);

  // ── TREND-AWARE OBSERVATIONS ──
  if (trend === 'improving') {
    strengths.push(`Your K/D improved from ${p5kd} → ${r5kd} over the last 5 games — this is a real upward trend, not luck. Whatever you've been doing, keep doing it.`);
  } else if (trend === 'declining') {
    weaknesses.push(`Your K/D dropped from ${p5kd} → ${r5kd} over the last 5 games — this is a declining trend. Consider taking a break and reviewing what changed.`);
    tips.push(`When in a declining patch: narrow your agent pool to 1, play your best map only, and focus purely on not dying rather than fragging.`);
  }

  // ── CONSISTENCY INSIGHT ──
  if (consistency < 45) {
    weaknesses.push(`Your K/D varies a lot match-to-match (consistency score: ${consistency}/100) — you're sometimes great, sometimes bad. Focus on reducing bad games, not maximising good ones.`);
    tips.push(`To build consistency: identify 2-3 pre-match mental cues (warm up, mute all, play calm) and stick to them every session. Routine beats talent for consistency.`);
  } else if (consistency >= 75) {
    strengths.push(`High consistency score (${consistency}/100) — your performance is stable and predictable, which is exactly what rank-up requires.`);
  }

  // ── CARRY vs SUPPORT ──
  if (carry >= 45) {
    strengths.push(`You top-frag your team ${carry}% of the time — you're the team's primary carry. Focus on game-closing skills (don't peek late rounds, let your lead hold).`);
  } else if (carry <= 15 && stats.totalMatches >= 8) {
    weaknesses.push(`You rarely top-frag (${carry}% of games) — focus on taking more proactive duels and increasing your ACS from ${acs} toward 200+.`);
  }

  // ── ATTACK/DEFENSE SPLIT ──
  if (attWR != null && defWR != null) {
    const sideDiff = Math.abs(attWR - defWR);
    if (sideDiff >= 15) {
      const strongSide = attWR > defWR ? 'attack' : 'defense';
      const weakSide = strongSide === 'attack' ? 'defense' : 'attack';
      weaknesses.push(`You win ${attWR}% on attack but ${defWR}% on defense — a ${sideDiff}% gap. Prioritise studying ${weakSide}-side setups and lineups on your worst maps.`);
    }
  }

  // ── SUMMARY ──
  let summary = '';
  const performanceLevel = kd >= 1.3 && wr >= 52 ? 'strong' : kd >= 1.0 && wr >= 48 ? 'average' : 'below average';
  const trendSuffix = trend === 'improving' ? ' Your recent trend is 📈 — keep the momentum.' : trend === 'declining' ? ' ⚠️ Your recent form is declining — be careful.' : '';
  if (performanceLevel === 'strong')  summary = `You are performing at a <strong>strong level</strong> with a ${kd} K/D and ${wr}% win rate — ranked progress is a matter of consistency and closing bad habits.${trendSuffix}`;
  else if (performanceLevel === 'average') summary = `You are at an <strong>average level</strong> — the fundamentals are there, but small inefficiencies (positioning, utility, tilt) are holding back your rank.${trendSuffix}`;
  else summary = `Your stats show clear room to grow — fixing core habits like crosshair placement, death reduction, and agent consistency will have an immediate rank impact.${trendSuffix}`;

  // ── PRIORITY FOCUS (single most impactful improvement) ──
  // Scored by impact potential — only surface the #1 issue
  const focusOptions = [
    { condition: kd < 1.0,      score: 100, title: 'Cut Your Death Count',
      desc: `You die ${avgD}x per game. Cutting just 3 avoidable deaths per match shifts your K/D positive and is the single biggest lever you have right now. Ask before every peek: do I have angle advantage, utility ready, or clear info? If no — don't peek.` },
    { condition: hs < 15,       score: 90,  title: 'Fix Crosshair Placement',
      desc: `Your ${hs}% headshot rate is the main bottleneck. Every day, spend 10 minutes in The Range on Hard Bots shooting ONLY at the head. No body shots allowed. This one habit doubles your duel win rate within 2 weeks.` },
    { condition: wr < 47,       score: 80,  title: 'Win More Rounds (Not Just Gunfights)',
      desc: `${wr}% win rate means you're losing more than you win. Check if you're saving when you should be (losing by 5+ rounds) and calling correct sites late. Individual skill isn't the issue — round strategy is.` },
    { condition: trend==='declining', score: 75, title: 'Break the Declining Trend',
      desc: `Your K/D dropped from ${p5kd} to ${r5kd} recently. Stop chasing the downswing. Take 1 day off ranked, play only deathmatch to refresh mechanics, then return with 1 clear tactical goal.` },
    { condition: acs < 170,     score: 70,  title: 'Increase Your ACS to ${170+}',
      desc: `ACS of ${acs} is below average. You need to take more first contacts, use utility more aggressively, and look for picks mid-round instead of only reacting. Set a goal: top 3 ACS in your team every game.` },
    { condition: consistency<40,score: 65,  title: 'Stabilise Your Performance',
      desc: `High variance (${consistency}/100 consistency) means you can't predict your own performance. The fix: reduce to 1 agent, 1 map, and 3 games max per session until your floor rises.` },
    { condition: avgA < 3,      score: 55,  title: 'Use Your Utility More',
      desc: `${avgA} assists per game is low — your utility barely helps your team. Every round: buy at least 1 ability, use it before 60 seconds, don't save it for the 'perfect moment' (it never comes).` },
  ];
  const topFocus = focusOptions.filter(f => f.condition).sort((a,b)=>b.score-a.score)[0] || {
    title: 'Master Your Main Agent',
    desc: `Your fundamentals are solid. The last gains come from mastering your main agent's utility fully — learn 2 new lineups per map this week. Small edges compound into rank wins.`
  };

  // ── VERDICT ──
  const verdict = `Based on ${stats.totalMatches} matches, your single biggest lever right now is <strong>${topFocus.title}</strong>. ${topFocus.desc} Focus on this ONE thing — trying to fix everything at once fixes nothing.`;

  return { summary, strengths, weaknesses, tips, agentAdvice, mental, verdict, topFocus };
}

function renderAnalysis(result, stats) {
  safeSetInnerHtml('ai-summary', sanitizeHtml(result.summary));

  const sg = document.getElementById('ai-sections-grid');
  sg.innerHTML = '';

  // ── #1 FOCUS CARD (most prominent, shown first) ──
  if (result.topFocus) {
    const focusDiv = document.createElement('div');
    focusDiv.className = 'ai-tip-block full';
    focusDiv.style.cssText = 'background:linear-gradient(135deg,rgba(250,68,84,0.1),rgba(20,20,22,0.6));border:1.5px solid rgba(250,68,84,0.4);';
    focusDiv.innerHTML = `
      <div class="ai-tip-header" style="margin-bottom:10px">
        <span class="ai-tip-emoji">🎯</span>
        <span class="ai-tip-title" style="color:var(--accent);font-size:14px;">YOUR #1 FOCUS RIGHT NOW</span>
      </div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:20px;text-transform:uppercase;color:#fff;letter-spacing:0.5px;margin-bottom:6px">${result.topFocus.title}</div>
      <div style="font-size:12px;line-height:1.6;color:rgba(240,240,242,0.85)">${result.topFocus.desc}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(250,68,84,0.7);letter-spacing:2px;margin-top:10px;text-transform:uppercase">Focus on this ONE thing only · Everything else is secondary</div>
    `;
    sg.appendChild(focusDiv);
  }

  const sections = [
    { items: result.strengths,   title:'Strengths',         emoji:'💪', cls:'strengths', bullet:'green'  },
    { items: result.weaknesses,  title:'Areas to Improve',  emoji:'⚠️', cls:'weaknesses', bullet:'red'   },
    { items: result.tips,        title:'Action Tips',        emoji:'⚡', cls:'tips',      bullet:'yellow', full:true },
    { items: result.agentAdvice, title:'Agent Advice',       emoji:'🎭', cls:'agents',    bullet:'blue'  },
    { items: result.mental,      title:'Mental Game',        emoji:'🧠', cls:'mental',    bullet:'purple' },
  ];

  sections.forEach(sec => {
    if (!sec.items?.length) return;
    const div = document.createElement('div');
    div.className = 'ai-tip-block' + (sec.full ? ' full' : '');
    div.innerHTML = `
      <div class="ai-tip-header">
        <span class="ai-tip-emoji">${sec.emoji}</span>
        <span class="ai-tip-title ${sec.cls}">${sec.title}</span>
      </div>
      <div class="ai-tip-list">
        ${sec.items.map(item => `<div class="ai-tip-item"><div class="ai-tip-bullet ${sec.bullet}"></div><div>${item}</div></div>`).join('')}
      </div>`;
    sg.appendChild(div);
  });

  safeSetInnerHtml('ai-verdict-txt', sanitizeHtml(result.verdict));
  document.getElementById('ai-verdict').style.display = 'block';
  const aiRes = document.getElementById('ai-results');
  aiRes.style.display = '';
  aiRes.classList.add('active');
}

async function runAnalysis() {
  const btn = document.getElementById('ai-btn');
  const loading = document.getElementById('ai-loading');
  const placeholder = document.getElementById('ai-placeholder');
  const results = document.getElementById('ai-results');
  const errorEl = document.getElementById('ai-error');

  let matches = [];
  try { matches = await loadAllMatches(); } catch(e) {}

  if (!matches.length) {
    errorEl.textContent = 'No match data found — fetch your stats first then hit Analyse.';
    errorEl.classList.add('active');
    return;
  }

  btn.disabled = true;
  placeholder.style.display = 'none';
  results.classList.remove('active');
  errorEl.classList.remove('active');
  document.getElementById('ai-verdict').style.display = 'none';
  loading.classList.add('active');

  const msgs = ['CRUNCHING MATCH DATA...','ANALYSING COMBAT PATTERNS...','IDENTIFYING WEAKNESSES...','BUILDING RECOMMENDATIONS...','FINALISING REPORT...'];
  let mi = 0;
  const iv = setInterval(() => { document.getElementById('ai-loading-txt').textContent = msgs[++mi % msgs.length]; }, 900);

  // Small delay so the loading animation is visible
  await new Promise(r => setTimeout(r, 1800));

  try {
    const stats = buildStatsForAI(matches);
    renderAIStats(stats);
    const result = analyseStats(stats);
    renderAnalysis(result, stats);
    document.getElementById('ai-section').classList.add('visible');
    showToast('Analysis complete ✓');
  } catch(e) {
    console.error('Analysis error:', e);
    errorEl.textContent = 'Analysis failed: ' + e.message;
    errorEl.classList.add('active');
  } finally {
    clearInterval(iv);
    loading.classList.remove('active');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🔄</span> Re-analyse';
  }
}

// ── PER-MATCH AI ANALYSIS ──
// Cache so re-opening a panel doesn't re-run
const _matchAnalysisCache = {};

async function runMatchAnalysis(idx, e) {
  e.stopPropagation(); // don't close the panel

  if (_matchAnalysisCache[idx]) {
    // Already done — just re-show
    safeSetInnerHtml(`mai-body-${idx}`, _matchAnalysisCache[idx]);
    document.getElementById(`mai-body-${idx}`).classList.add('active');
    return;
  }

  const btn     = document.getElementById(`mai-btn-${idx}`);
  const loading = document.getElementById(`mai-loading-${idx}`);
  const body    = document.getElementById(`mai-body-${idx}`);

  btn.disabled = true;
  loading.classList.add('active');
  body.classList.remove('active');

  const loadingMsgs = ['ANALYSING MATCH...','READING COMBAT DATA...','BUILDING REPORT...'];
  let mi = 0;
  const iv = setInterval(() => {
    document.getElementById(`mai-loading-txt-${idx}`).textContent = loadingMsgs[++mi % loadingMsgs.length];
  }, 700);

  await new Promise(r => setTimeout(r, 600));

  try {
    // Pull the raw match from stored data by index
    const allMatches = await loadAllMatches();
    let match = allMatches[idx];
    if (!match) throw new Error('Match not found in storage');

    const matchId = match.metadata?.matchid || match.metadata?.match_id;
    const hasDetails = match.rounds && match.rounds.length > 0 && match.rounds[0].player_stats && match.rounds[0].player_stats.length > 0;
    
    if (!hasDetails && matchId) {
      const res = await fetch(`/api/v2/match/${matchId}`);
      if (res.ok) {
        const detailRes = await res.json();
        if (detailRes && detailRes.data) {
          match = detailRes.data;
        }
      }
    }

    const html = buildMatchAnalysis(match, allMatches);
    _matchAnalysisCache[idx] = html;
    body.innerHTML = html;
    body.classList.add('active');
    btn.innerHTML = '🔄 Re-analyse';
  } catch(e) {
    body.innerHTML = `<div class="no-detail" style="color:var(--loss)">Analysis error: ${escapeHtml(e.message)}</div>`;
    body.classList.add('active');
  } finally {
    clearInterval(iv);
    loading.classList.remove('active');
    btn.disabled = false;
  }
}
window.switchMatchAiTab = function(btn, tabName) {
  const body = btn.closest('.match-ai-body');
  if (!body) return;
  body.querySelectorAll('.match-ai-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  body.querySelectorAll('.match-ai-tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = body.querySelector(`.match-ai-tab-pane[data-tab="${tabName}"]`);
  if (targetPane) targetPane.classList.add('active');
};

function buildMatchAnalysis(match, allMatches = null) {
  const allPlayers = getPlayerList(match);
  const rounds     = match.rounds || [];
  const me = findMe(match);
  if (!me) return '<div class="no-detail">Player not found in match data</div>';

  // Calculate historical baseline averages
  let baselineKD = null, baselineHS = null, baselineACS = null;
  let dropOffStreak = 0;
  if (allMatches && allMatches.length > 0) {
    let sumK = 0, sumD = 0, sumACS = 0, sumHS = 0, sumShots = 0, count = 0;
    allMatches.forEach(m => {
      const p = findMe(m);
      if (p) {
        const s = p.stats || {};
        sumK += s.kills || 0;
        sumD += s.deaths || 0;
        const score = s.score || 0;
        const hs = s.headshots || 0;
        const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);
        const rCount = m.rounds?.length || 24;
        sumACS += rCount ? Math.round(score / rCount) : Math.round(score / 100);
        sumHS += hs;
        sumShots += shots;
        count++;
      }
    });
    if (count > 0) {
      baselineKD = sumD ? sumK / sumD : sumK;
      baselineACS = Math.round(sumACS / count);
      baselineHS = sumShots ? Math.round((sumHS / sumShots) * 100) : 0;
    }

    // Fatigue warning checking (drop-off in last 5 matches)
    for (let i = 0; i < Math.min(allMatches.length, 5); i++) {
      const m = allMatches[i];
      const p = findMe(m);
      if (p && m.rounds) {
        const myP = p.puuid || p.subject || p.id || '';
        const myPuuids = [p.puuid, p.subject, p.id, myP].filter(Boolean);
        let firstH = 0, secondH = 0;
        m.rounds.forEach((r, ri) => {
          const ps = (r.player_stats || []).find(pl => myPuuids.includes(pl.player_puuid || pl.subject || pl.puuid || pl.player_id));
          const killEvents = ps?.kill_events || [];
          const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);
          if (rKills > 0) {
            if (ri < Math.floor(m.rounds.length / 2)) firstH += rKills;
            else secondH += rKills;
          }
        });
        if (firstH > 0 && secondH > 0 && (firstH / (firstH + secondH)) > 0.65) {
          dropOffStreak++;
        } else {
          break;
        }
      }
    }
  }

  const myTeamId  = (me.team || '').toLowerCase();
  const s         = me.stats || {};
  const kills     = s.kills   || 0;
  const deaths    = s.deaths  || 0;
  const assists   = s.assists || 0;
  const score     = s.score   || 0;
  const hs        = s.headshots || 0;
  const body_s    = s.bodyshots || 0;
  const legs      = s.legshots  || 0;
  const totalShots = hs + body_s + legs;
  const hsPct     = totalShots ? Math.round((hs / totalShots) * 100) : 0;
  const acs       = Math.round(score / 100);
  const kd        = deaths ? (kills / deaths) : kills;
  const myTeam    = match.teams?.[myTeamId];
  const won       = myTeam?.has_won || false;
  const agentName = me.character || 'Unknown';
  const role      = getRoleClass(agentName);
  const mapName   = match.metadata?.map || 'Unknown';
  const myRounds  = myTeam?.rounds_won ?? 0;
  const oppId     = myTeamId === 'red' ? 'blue' : 'red';
  const oppRounds = match.teams?.[oppId]?.rounds_won ?? 0;
  const totalRounds = myRounds + oppRounds;

  // Damage (from v2 detail if available, else from stats)
  const dmgDealt    = me.damage_made     || 0;
  const dmgReceived = me.damage_received || 0;
  const dmgRatio    = dmgReceived ? (dmgDealt / dmgReceived).toFixed(2) : dmgDealt;

  // Abilities
  const ab = me.ability_casts || {};

  // Round-by-round analysis
  const myPuuid = me.puuid || me.subject || me.id || '';
  const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
  let clutchWins = 0, clutchAttempts = 0;
  let killsInWonRounds = 0, killsInLostRounds = 0;
  let firstHalfKills = 0, secondHalfKills = 0;
  let multiKillRounds = 0;
  let bestRoundNum = 1, maxRoundKills = 0, bestRoundWon = false;

  // Determine dynamic round sides (Attack vs Defense) for starting team side normalization
  const modeName = (match.metadata?.mode || '').toLowerCase();
  let halfSize = 12;
  if (modeName.includes('swiftplay')) {
    halfSize = 4;
  } else if (modeName.includes('spike rush')) {
    halfSize = 3;
  }

  const roundSides = [];
  for (let i = 0; i < rounds.length; i++) {
    roundSides[i] = i < halfSize ? 'Attack' : 'Defense';
  }
  let firstHalfAttackTeam = null;
  for (let i = 0; i < Math.min(rounds.length, halfSize); i++) {
    const r = rounds[i];
    if (r.bomb_planted && r.plant_events?.planted_by?.team) {
      firstHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
      break;
    }
  }
  if (!firstHalfAttackTeam) {
    let secondHalfAttackTeam = null;
    for (let i = halfSize; i < Math.min(rounds.length, halfSize * 2); i++) {
      const r = rounds[i];
      if (r.bomb_planted && r.plant_events?.planted_by?.team) {
        secondHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
        break;
      }
    }
    if (secondHalfAttackTeam) {
      firstHalfAttackTeam = secondHalfAttackTeam === 'red' ? 'blue' : 'red';
    }
  }
  if (firstHalfAttackTeam) {
    const myTeamLower = myTeamId.toLowerCase();
    const firstHalfSide = firstHalfAttackTeam === myTeamLower ? 'Attack' : 'Defense';
    const secondHalfSide = firstHalfSide === 'Attack' ? 'Defense' : 'Attack';
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (i < halfSize) {
        roundSides[i] = firstHalfSide;
      } else if (i < halfSize * 2) {
        roundSides[i] = secondHalfSide;
      } else {
        if (r.bomb_planted && r.plant_events?.planted_by?.team) {
          roundSides[i] = r.plant_events.planted_by.team.toLowerCase() === myTeamLower ? 'Attack' : 'Defense';
        } else {
          roundSides[i] = (i % 2 === 0) ? firstHalfSide : secondHalfSide;
        }
      }
    }
  }

  // Initialize site counters for retakes and positional diagnostics
  const retakeAttempts = { A: 0, B: 0, C: 0 };
  const retakeWins = { A: 0, B: 0, C: 0 };
  const postPlantAttempts = { A: 0, B: 0, C: 0 };
  const postPlantWins = { A: 0, B: 0, C: 0 };
  const firstDeathsBySite = { A: 0, B: 0, C: 0 };
  const firstBloodsBySite = { A: 0, B: 0, C: 0 };
  let defenseFirstDeaths = 0;
  let attackFirstDeaths = 0;
  let totalDefenseRounds = 0;
  let totalAttackRounds = 0;

  rounds.forEach((r, ri) => {
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
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

    if (rKills > maxRoundKills || (rKills === maxRoundKills && rWon && !bestRoundWon)) {
      maxRoundKills = rKills;
      bestRoundNum = ri + 1;
      bestRoundWon = rWon;
    }

    // Site & positional analysis details
    const side = roundSides[ri];
    if (side === 'Defense') totalDefenseRounds++;
    else if (side === 'Attack') totalAttackRounds++;

    const roundKills = [];
    (r.player_stats || []).forEach(playerStats => {
      const kills = playerStats.kill_events || [];
      kills.forEach(k => {
        roundKills.push(k);
      });
    });
    
    let isFD = false;
    let isFB = false;
    if (roundKills.length > 0) {
      roundKills.sort((a, b) => (a.kill_time_in_round ?? a.time_in_round ?? 0) - (b.kill_time_in_round ?? b.time_in_round ?? 0));
      const firstKill = roundKills[0];
      const victimPuuid = firstKill.victim_puuid || firstKill.victim || '';
      const killerPuuid = firstKill.killer_puuid || firstKill.killer || '';
      
      if (myPuuids.includes(victimPuuid)) {
        isFD = true;
        if (side === 'Defense') defenseFirstDeaths++;
        else attackFirstDeaths++;
      }
      if (myPuuids.includes(killerPuuid)) {
        isFB = true;
      }
    }

    if (r.bomb_planted) {
      const site = (r.plant_events?.plant_site || 'A').toUpperCase();
      if (site === 'A' || site === 'B' || site === 'C') {
        if (side === 'Defense') {
          retakeAttempts[site]++;
          if (rWon) retakeWins[site]++;
        } else if (side === 'Attack') {
          postPlantAttempts[site]++;
          if (rWon) postPlantWins[site]++;
        }
        
        if (isFD) {
          firstDeathsBySite[site]++;
        }
        if (isFB) {
          firstBloodsBySite[site]++;
        }
      }
    }
  });

  const tacticalInsights = [];
  ['A', 'B', 'C'].forEach(site => {
    const attempts = retakeAttempts[site];
    const wins = retakeWins[site];
    if (attempts >= 1) {
      const wr = Math.round((wins / attempts) * 100);
      if (wr >= 70) {
        tacticalInsights.push(`💪 You excelled at retakes on <strong>${site} site</strong>, converting ${wins}/${attempts} situations (${wr}% conversion rate).`);
      } else if (wr <= 33) {
        let tip = `⚠️ Struggled with retakes on <strong>${site} site</strong> (only ${wins}/${attempts} converted). `;
        if (role === 'duelist') {
          tip += `As a Duelist (<strong>${agentName}</strong>), avoid peeking the site first without entry utility (like flashes or movement abilities). Wait for teammate scans before entering.`;
        } else if (role === 'initiator') {
          tip += `As an Initiator (<strong>${agentName}</strong>), ensure you save your scanning or flashing utility to clear angles for your team during the retake, rather than peeking dry.`;
        } else if (role === 'controller') {
          tip += `As a Controller (<strong>${agentName}</strong>), focus on smoking off key attacker sightlines (like main entrances) to isolate fights before pushing. Stay alive to keep smokes active.`;
        } else if (role === 'sentinel') {
          tip += `As a Sentinel (<strong>${agentName}</strong>), you are not an entry player. Wait to coordinate utility with your team, watch the flank, and prepare to protect the defuser.`;
        } else {
          tip += `Avoid peeking the site early on retakes; wait for teammate utility before pushing.`;
        }
        tacticalInsights.push(tip);
      }
    }
  });

  ['A', 'B', 'C'].forEach(site => {
    const attempts = postPlantAttempts[site];
    const wins = postPlantWins[site];
    if (attempts >= 1) {
      const wr = Math.round((wins / attempts) * 100);
      if (wr >= 70) {
        tacticalInsights.push(`💪 Strong post-plant defense on <strong>${site} site</strong>, winning ${wins}/${attempts} rounds after spike plant.`);
      } else if (wr <= 33) {
        let tip = `⚠️ Low post-plant conversion on <strong>${site} site</strong> (${wins}/${attempts} won). `;
        if (role === 'duelist') {
          tip += `As a Duelist (<strong>${agentName}</strong>), avoid taking aggressive solo dry-peeks after the plant. Hold crossfires with teammates or play retake denial from safety.`;
        } else if (role === 'initiator') {
          tip += `As an Initiator (<strong>${agentName}</strong>), use your scans/flashes to delay the retaking defenders or gather info on defusal attempts. Save utility to deny tap-defuses.`;
        } else if (role === 'controller') {
          tip += `As a Controller (<strong>${agentName}</strong>), use smokes to block key entrance paths or cover the spike, forcing defusers to step out blind.`;
        } else if (role === 'sentinel') {
          tip += `As a Sentinel (<strong>${agentName}</strong>), set up utility (like trips, alarmbots, or mollies) directly on the spike or main entry lanes to delay defusers, rather than taking raw gunfights.`;
        } else {
          tip += `Try playing defensive post-plant crossfires or utility lineups instead of peeking defusers.`;
        }
        tacticalInsights.push(tip);
      }
    }
  });

  ['A', 'B', 'C'].forEach(site => {
    const fdCount = firstDeathsBySite[site];
    if (fdCount >= 1) {
      const totalRoundsOnSite = (retakeAttempts[site] + postPlantAttempts[site]) || 1;
      const fdRate = Math.round((fdCount / totalRoundsOnSite) * 100);
      if (fdRate >= 20) {
        let tip = `⚠️ You had a ${fdRate}% first-death rate on <strong>${site} site</strong> lanes. `;
        if (role === 'duelist') {
          tip += `As a Duelist (<strong>${agentName}</strong>), ensure you peek with movement/entry utility or let an initiator scan first before committing to early lane fights.`;
        } else if (role === 'initiator') {
          tip += `As an Initiator (<strong>${agentName}</strong>), you shouldn't be dry-peeking. Use your recon/flashing abilities to clear the lane before peeking.`;
        } else if (role === 'controller') {
          tip += `As a Controller (<strong>${agentName}</strong>), first-dying leaves your team without crucial smoke support. Avoid early aggressive peeks and play safe behind your team.`;
        } else if (role === 'sentinel') {
          tip += `As a Sentinel (<strong>${agentName}</strong>), first-dying compromises the entire site hold. Play passive anchor positions and let your utility/traps check the lane first.`;
        } else {
          tip += `Try peeking with utility next time or let an initiator scan first.`;
        }
        tacticalInsights.push(tip);
      }
    }
  });

  if (defenseFirstDeaths >= 1 && totalDefenseRounds > 0) {
    const fdPct = Math.round((defenseFirstDeaths / totalDefenseRounds) * 100);
    if (fdPct >= 20) {
      let tip = `⚠️ First-death rate of ${fdPct}% on Defense (${defenseFirstDeaths} rounds). `;
      if (role === 'duelist') {
        tip += `As a Duelist (<strong>${agentName}</strong>), if you peek early, ensure you have an escape mechanism (like dash/teleport) ready, or teammate trade support.`;
      } else if (role === 'initiator') {
        tip += `As an Initiator (<strong>${agentName}</strong>), do not seek raw aim duels at round start. Use your scouting utility to spot early pushes safely and fall back.`;
      } else if (role === 'controller') {
        tip += `As a Controller (<strong>${agentName}</strong>), your life is crucial for late-round smoke setups. Do not dry-peek early; anchor from safer sites/rotations.`;
      } else if (role === 'sentinel') {
        tip += `As a Sentinel (<strong>${agentName}</strong>), play as a passive anchor behind your utility. Do not contest early lanes manually; make them push through your setup.`;
      } else {
        tip += `Peeking early as a defender compromises site holds. Play passive anchors.`;
      }
      tacticalInsights.push(tip);
    }
  }

  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = roundSides[ri];
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => 
      myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
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
  });

  // Lobby rank context
  const lobbyInfo = getLobbyRankInfo(allPlayers, myTeamId);

  // Allied team stats for comparison
  const allied = allPlayers.filter(p => (p.team || '').toLowerCase() === myTeamId);
  const teamAvgACS = allied.length
    ? Math.round(allied.reduce((s, p) => s + (p.stats?.score || 0), 0) / allied.length / 100)
    : 0;
  const myRankInTeam = [...allied]
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
    .findIndex(p => {
      const targetName = normalizePlayerName(PLAYER_NAME);
      const targetTag = normalizePlayerName(PLAYER_TAG);
      return normalizePlayerName(p.name) === targetName && normalizePlayerName(p.tag) === targetTag;
    }) + 1;

  // ── GENERATE ANALYSIS ──
  const strengths = [];
  const improvements = [];
  const tips = [];

  // Personal baseline comparative insight injects
  if (baselineKD !== null) {
    const kdDiff = kd - baselineKD;
    if (kdDiff >= 0.2) {
      strengths.push(`Standout performance! Your match K/D (${kd.toFixed(2)}) is +${kdDiff.toFixed(2)} above your historical baseline average (${baselineKD.toFixed(2)}).`);
    } else if (kdDiff <= -0.25) {
      improvements.push(`Tough duels: Your K/D (${kd.toFixed(2)}) fell below your baseline average (${baselineKD.toFixed(2)}) by ${kdDiff.toFixed(2)}.`);
    }
  }
  if (baselineHS !== null) {
    const hsDiff = hsPct - baselineHS;
    if (hsDiff >= 5) {
      strengths.push(`Aim highlight: Your headshot rate (${hsPct}%) exceeded your baseline average (${baselineHS}%) by +${hsDiff}%.`);
    } else if (hsDiff <= -6) {
      improvements.push(`Aim decay: Your headshot rate (${hsPct}%) was ${Math.abs(hsDiff)}% below your personal average (${baselineHS}%).`);
    }
  }
  if (baselineACS !== null) {
    const acsDiff = acs - baselineACS;
    if (acsDiff >= 35) {
      strengths.push(`High impact! Your ACS (${acs}) was +${acsDiff} above your historical baseline average (${baselineACS}).`);
    } else if (acsDiff <= -40) {
      improvements.push(`Low impact: Your ACS (${acs}) fell short of your historical baseline (${baselineACS}) by ${Math.abs(acsDiff)} points.`);
    }
  }

  // Fatigue and pattern flags
  if (dropOffStreak >= 2) {
    improvements.push(`⚠️ <strong>Fatigue Pattern:</strong> This is your ${dropOffStreak}nd consecutive match showing a drop-off in second-half kills. Take a break!`);
  }

  // KD assessment
  if (kd >= 1.8)       strengths.push(`Dominant K/D of ${kd.toFixed(2)} — you won almost every duel this game.`);
  else if (kd >= 1.2)  strengths.push(`Positive K/D of ${kd.toFixed(2)} — you traded favourably and created value for your team.`);
  else if (kd < 0.8)   improvements.push(`K/D of ${kd.toFixed(2)} is poor for this match — you died ${deaths} times, likely taking unfavourable duels or misreading angles.`);
  else                  improvements.push(`K/D of ${kd.toFixed(2)} is close to even — ${deaths} deaths limited your impact. Focus on only taking fights with clear angle or utility advantage.`);

  // ACS vs team avg
  if (acs >= teamAvgACS + 30) strengths.push(`ACS of ${acs} was the highest (or near-highest) on your team (team avg: ${teamAvgACS}) — you led from the front.`);
  else if (acs >= teamAvgACS) strengths.push(`ACS of ${acs} was above your team average (${teamAvgACS}) — solid contribution.`);
  else improvements.push(`ACS of ${acs} was below your team average (${teamAvgACS}) — you were ranked #${myRankInTeam} on your team for combat score. Look for more proactive engagements.`);

  // Headshots
  if (hsPct >= 30)     strengths.push(`${hsPct}% headshot rate this match — exceptional aim precision, you punished enemies efficiently.`);
  else if (hsPct >= 20) strengths.push(`${hsPct}% headshot rate is solid — your crosshair placement was consistent.`);
  else if (hsPct < 12) improvements.push(`${hsPct}% headshot rate is very low — you relied heavily on body/leg shots. Against better-ranked opponents this is punished hard. Work on head-level crosshair placement.`);
  else                  improvements.push(`${hsPct}% headshot rate has room to grow. You hit ${hs} headshots out of ${totalShots} total shots — aim for 20%+ by keeping crosshair at head height at all times.`);

  // Damage ratio
  if (dmgDealt > 0) {
    if (parseFloat(dmgRatio) >= 1.4) strengths.push(`Damage ratio of ${dmgRatio} (${dmgDealt} dealt vs ${dmgReceived} received) — you are hitting enemies more than they hit you.`);
    else if (parseFloat(dmgRatio) < 0.7) improvements.push(`Damage ratio of ${dmgRatio} (dealt ${dmgDealt} vs received ${dmgReceived}) — you took significantly more damage than you dealt. This suggests getting caught in crossfire or holding weak positions.`);
  }

  // Assists & utility
  if (assists >= 8)    strengths.push(`${assists} assists shows strong utility usage and team support — your ${agentName} abilities opened up kills for teammates.`);
  else if (assists >= 5) strengths.push(`${assists} assists — decent utility contribution from your ${agentName}.`);
  else if (assists <= 2 && (role === 'initiator' || role === 'controller'))
    improvements.push(`Only ${assists} assists as a ${role} (${agentName}) — ${role === 'initiator' ? 'your flashes and recon should be generating more assist value for teammates' : 'your smokes and utility should be enabling more team plays'}.`);

  // Clutch performance
  if (clutchAttempts > 0) {
    const clutchPct = Math.round((clutchWins / clutchAttempts) * 100);
    if (clutchWins >= 2) strengths.push(`Won ${clutchWins}/${clutchAttempts} clutch situations (${clutchPct}%) — you perform under pressure.`);
    else if (clutchAttempts >= 2 && clutchWins === 0) improvements.push(`0/${clutchAttempts} clutch situations converted — when left as last alive, focus on isolating duels one at a time instead of panicking.`);
  }

  // Multi-kill rounds
  if (multiKillRounds >= 3) strengths.push(`${multiKillRounds} rounds with 3+ kills — you had multiple high-impact rounds that swung momentum.`);

  // First/second half consistency
  if (firstHalfKills > 0 && secondHalfKills > 0) {
    const ratio = firstHalfKills / (firstHalfKills + secondHalfKills);
    if (ratio > 0.65) improvements.push(`You got ${firstHalfKills} kills in the first half but only ${secondHalfKills} in the second — your impact dropped significantly. This can indicate tilt, fatigue, or opponents adapting to your playstyle.`);
    else if (ratio < 0.35) strengths.push(`You improved in the second half (${secondHalfKills} kills vs ${firstHalfKills} first half) — good adaptation mid-game.`);
  }

  // Role-specific tips
  if (role === 'duelist') {
    tips.push(`As ${agentName} (Duelist): your job is to OPEN sites, not follow teammates in. If your kills are happening after teammates die, you are playing too reactive.`);
    if (kd < 1.0) tips.push(`Duelist with sub-1.0 K/D means you are not winning your expected duels. Use your mobility/flash to gain angle advantage BEFORE committing — never peek without an ability ready.`);
  } else if (role === 'initiator') {
    tips.push(`As ${agentName} (Initiator): use recon/flashes BEFORE your duelists push, not after. Your value is the information and opening, not kills.`);
    if (assists < 5) tips.push(`Low assists for an initiator — flash before every teammate push, even in default rounds. Each flash assist is worth more than a kill when it enables site takes.`);
  } else if (role === 'controller') {
    tips.push(`As ${agentName} (Controller): prioritise smoking default positions and chokepoints at round start, not just on site takes. Early smokes prevent info and force enemies to reposition.`);
    if (assists < 4) tips.push(`Low assist count for a controller — your utility should be generating team kills constantly. Coordinate smoke timings verbally or in chat with your duelists.`);
  } else if (role === 'sentinel') {
    tips.push(`As ${agentName} (Sentinel): flank-watching and anchor plays are your contribution. If you died to flanks repeatedly this game, your trip/cam placement needs adjusting.`);
  }

  // Map-specific tip
  tips.push(`On ${mapName}: identify 1-2 positions where you died most this game and make a mental note to either avoid or approach them differently next time.`);

  // Death count tip
  if (deaths >= 18) tips.push(`${deaths} deaths is very high — the main fix is not trading aggression for passivity, but taking better-prepared duels. Always have an exit/reposition route ready before engaging.`);
  else if (deaths >= 14) tips.push(`${deaths} deaths — review when you died: were you rotating late, holding a lonely site, or taking 50/50 duels you didn't need? Eliminating 3-4 of those deaths wins rounds.`);

  // HS tip
  if (hsPct < 18) tips.push(`To raise HS% on ${agentName}: in deathmatch, only allow yourself to shoot if your crosshair is at head height first. Refuse body shots — it builds the muscle memory quickly.`);

  // Ability tip
  const totalAbCasts = (ab.c_cast||0) + (ab.q_cast||0) + (ab.e_cast||0) + (ab.x_cast||0);
  if (totalAbCasts < totalRounds * 1.5 && totalRounds > 10) tips.push(`You cast ${totalAbCasts} abilities across ${totalRounds} rounds — that's less than 1.5 per round. Buy and use abilities every round, even on eco rounds. Free information and chip damage win rounds.`);

  // Verdict
  const outcome = won ? 'a win' : 'a loss';
  let verdict = `This was ${outcome} on ${mapName} with ${kills}/${deaths}/${assists} as ${agentName}. `;
  const biggestIssue = kd < 0.9 ? `reducing your death count (${deaths} this game)` : hsPct < 15 ? `improving your headshot rate (${hsPct}% this game)` : acs < teamAvgACS ? `increasing your ACS above the team average (yours: ${acs}, team: ${teamAvgACS})` : clutchAttempts > 1 && clutchWins === 0 ? 'converting clutch situations' : 'maintaining this performance consistently';
  verdict += `Your main focus for the next game should be <strong>${biggestIssue}</strong>. `;
  verdict += won
    ? `Good result — analyse what worked this game and replicate it.`
    : `Despite the loss, extract the positives and identify the 1-2 rounds that swung the game to learn from them.`;

  // ── PILL DATA ──
  const kdClass  = kd >= 1.2 ? 'good' : kd >= 0.9 ? 'warn' : 'bad';
  const hsClass  = hsPct >= 22 ? 'good' : hsPct >= 14 ? 'warn' : 'bad';
  const acsClass = acs >= teamAvgACS + 20 ? 'good' : acs >= teamAvgACS - 10 ? 'warn' : 'bad';

  // Summary line
  const perfLevel = kd >= 1.3 && acs >= teamAvgACS ? 'a <strong>strong individual performance</strong>' : kd >= 1.0 && acs >= teamAvgACS - 15 ? 'a <strong>solid performance</strong>' : 'a <strong>below-par performance</strong>';
  const summary = `${won ? '✅ Victory' : '❌ Defeat'} · ${escapeHtml(agentName)} on ${escapeHtml(mapName)} — ${perfLevel} with ${kills}/${deaths}/${assists} and ${acs} ACS${lobbyInfo?.overall ? ` in a <strong>${escapeHtml(lobbyInfo.overall.name)}</strong> avg lobby` : ''}.`;

  // Build sections HTML
  const renderBlock = (title, emoji, cls, dotCls, items, full=false) => {
    if (!items.length) return '';
    return `<div class="match-ai-block${full?' full':''}">
      <div class="match-ai-block-header"><span>${emoji}</span><span class="match-ai-block-title ${cls}">${title}</span></div>
      <div class="match-ai-items">${items.map(i=>`<div class="match-ai-item"><div class="match-ai-dot ${dotCls}"></div><div>${i}</div></div>`).join('')}</div>
    </div>`;
  };

  return `
    <div class="match-ai-tabs">
      <button class="match-ai-tab-btn active" onclick="switchMatchAiTab(this, 'analysis')">📊 Match Analysis</button>
      <button class="match-ai-tab-btn" onclick="switchMatchAiTab(this, 'timeline')">🎮 Timeline & Stats</button>
    </div>
    
    <!-- TAB 1: MATCH ANALYSIS -->
    <div class="match-ai-tab-pane active" data-tab="analysis">
      <div class="match-ai-summary" style="margin-top: 6px;">${summary}</div>
      
      <!-- Match Intel AI Diagnostics Banner -->
      <div style="background: linear-gradient(135deg, rgba(232, 255, 71, 0.05) 0%, rgba(20, 20, 22, 0.5) 100%); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin: 12px 0 16px; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px; filter: drop-shadow(0 0 4px var(--accent));">📊</div>
        <div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-weight: 800; font-size: 13px; text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px; margin-bottom: 2px;">Match Intel AI Diagnostics</div>
          <div style="font-size: 11px; color: var(--muted); line-height: 1.4;">
            Personalized match audit. Compares your performance to your <strong>historical baselines</strong>, checks for <strong>mid-session fatigue patterns</strong>, and spotlights critical <strong>clutches & impact plays</strong> from this match.
          </div>
        </div>
      </div>

      <div class="match-ai-grid">
        <div class="match-ai-pill"><div class="match-ai-pill-label">K/D</div><div class="match-ai-pill-val ${kdClass}">${kd.toFixed(2)}</div><div class="match-ai-pill-sub">${kills}K / ${deaths}D</div></div>
        <div class="match-ai-pill"><div class="match-ai-pill-label">ACS</div><div class="match-ai-pill-val ${acsClass}">${acs}</div><div class="match-ai-pill-sub">Team avg: ${teamAvgACS}</div></div>
        <div class="match-ai-pill"><div class="match-ai-pill-label">HS Rate</div><div class="match-ai-pill-val ${hsClass}">${hsPct}%</div><div class="match-ai-pill-sub">${hs} headshots</div></div>
        ${dmgDealt ? `<div class="match-ai-pill"><div class="match-ai-pill-label">Dmg Ratio</div><div class="match-ai-pill-val ${parseFloat(dmgRatio)>=1.2?'good':parseFloat(dmgRatio)>=0.8?'warn':'bad'}">${dmgRatio}</div><div class="match-ai-pill-sub">${dmgDealt} dealt</div></div>` : ''}
        <div class="match-ai-pill"><div class="match-ai-pill-label">Clutches</div><div class="match-ai-pill-val ${clutchWins>0?'good':'warn'}">${clutchWins}/${clutchAttempts||0}</div><div class="match-ai-pill-sub">Converted</div></div>
        <div class="match-ai-pill"><div class="match-ai-pill-label">Multi-kills</div><div class="match-ai-pill-val ${multiKillRounds>=2?'good':multiKillRounds>=1?'warn':'bad'}">${multiKillRounds}</div><div class="match-ai-pill-sub">3K+ rounds</div></div>
      </div>

      <div class="match-ai-verdict">
        <div class="match-ai-verdict-label">⚡ Match Verdict</div>
        ${verdict}
      </div>

      <div class="match-ai-sections" style="margin-top: 16px;">
        ${renderBlock('What You Did Well', '💪', 'good', 'green', strengths)}
        ${renderBlock('Needs Improvement', '⚠️', 'warn', 'red', improvements)}
        ${renderBlock('Action Tips For Next Game', '⚡', 'tip', 'yellow', tips, true)}
      </div>
      
      ${tacticalInsights.length ? `
      <div class="match-ai-verdict" style="margin-top:16px; background: linear-gradient(135deg, rgba(232, 255, 71, 0.03) 0%, rgba(20, 20, 22, 0.6) 100%); border-left: 4px solid var(--accent);">
        <div class="match-ai-verdict-label" style="display:flex; align-items:center; gap:8px; color: var(--accent); margin-bottom: 8px;">
          <span>🎯</span> Positional & Site Diagnostics
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${tacticalInsights.map(ins => `<div class="match-ai-diagnostic-card">${ins}</div>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- TAB 2: TIMELINE & STATS -->
    <div class="match-ai-tab-pane" data-tab="timeline">
      <div class="match-ai-verdict" style="margin-top:0;">
        <div class="match-ai-verdict-label" style="display:flex; align-items:center; gap:8px; margin-bottom: 6px;">
          <span>🎮</span> Tactical Round-by-Round Progress
        </div>
        <div class="match-ai-timeline-wrap">
          ${roundsHtml}
        </div>
        
        <div class="match-ai-stats-grid">
          <div class="match-ai-stat-card">
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">⚔️ Combat Consistency</div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>First Half Kills:</span> <strong style="color:#fff;">${firstHalfKills}</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Second Half Kills:</span> <strong style="color:#fff;">${secondHalfKills}</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Multi-Kill Rounds (3K+):</span> <strong style="color:var(--win);">${multiKillRounds}</strong></div>
          </div>
          <div class="match-ai-stat-card">
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">🎯 Accuracy Breakdown</div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Headshot Rate:</span> <strong style="color:var(--win);">${hsPct}%</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Bodyshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((body_s/totalShots)*100) : 0}%</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Legshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((legs/totalShots)*100) : 0}%</strong></div>
          </div>
          <div class="match-ai-stat-card">
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">⭐ Match Star Round</div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Star Round:</span> <strong style="color:var(--win);">Round ${bestRoundNum}</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Kills in Round:</span> <strong style="color:#fff;">${maxRoundKills} Kills</strong></div>
            <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Round Outcome:</span> <strong style="color:${bestRoundWon ? 'var(--win)' : 'var(--loss)'};">${bestRoundWon ? 'Won' : 'Lost'}</strong></div>
          </div>
        </div>
      </div>
    </div>`;
}
// ── STREAK TRACKER ──
function computeStreak(matches) {
  if (!matches.length) return { count: 0, type: null };
  // matches[0] is most recent
  const first = matches[0];
  const me0 = findMe(first);
  if (!me0) return { count: 0, type: null };
  const firstWon = first.teams?.[(me0.team||'').toLowerCase()]?.has_won || false;
  let count = 1;
  for (let i = 1; i < matches.length; i++) {
    const me = findMe(matches[i]);
    if (!me) break;
    const won = matches[i].teams?.[(me.team||'').toLowerCase()]?.has_won || false;
    if (won === firstWon) count++;
    else break;
  }
  return { count, type: firstWon ? 'win' : 'loss' };
}

function renderStreak(matches) {
  const streak = computeStreak(matches);
  const block = document.getElementById('streak-block');
  const icon = document.getElementById('streak-icon');
  const val = document.getElementById('streak-val');
  if (!block) return;
  if (streak.count < 2) { block.style.display = 'none'; return; }
  block.style.display = 'flex';
  if (streak.type === 'win') {
    icon.textContent = streak.count >= 5 ? '🔥' : '✅';
    val.className = 'streak-val win-streak';
    val.textContent = `${streak.count}W Streak`;
  } else {
    icon.textContent = streak.count >= 5 ? '💀' : '❌';
    val.className = 'streak-val loss-streak';
    val.textContent = `${streak.count}L Streak`;
  }
}

// ── SESSION BANNER ──
function renderSessionBanner(matches) {
  const banner = document.getElementById('session-banner');
  if (!banner) return;
  const todayMatches = matches.filter(m => isToday(m.gameStart));
  if (!todayMatches.length) { banner.classList.remove('active'); return; }

  const wins = todayMatches.filter(m => m.won).length;
  const losses = todayMatches.length - wins;
  const mmrH = window._mmrHistory || {};
  let sessionRR = 0, hasRR = false;
  todayMatches.forEach(m => {
    const rr = mmrH[m.matchId];
    if (rr !== undefined) { sessionRR += rr; hasRR = true; }
  });
  const kills = todayMatches.reduce((s,m)=>s+m.kills,0);
  const deaths = todayMatches.reduce((s,m)=>s+m.deaths,0);
  const sessionKD = deaths ? (kills/deaths).toFixed(2) : kills.toFixed(2);
  const rrClass = sessionRR > 0 ? 'pos' : sessionRR < 0 ? 'neg' : 'neu';
  const rrText = hasRR ? `${sessionRR > 0 ? '+' : ''}${sessionRR}` : '—';

  banner.innerHTML = `
    <div>
      <div class="session-label">Today's Session</div>
      <div class="session-badge">${todayMatches.length} match${todayMatches.length!==1?'es':''} played</div>
    </div>
    <div class="session-stats">
      <div class="session-stat">
        <div class="session-stat-val ${wins>losses?'pos':wins<losses?'neg':'neu'}">${wins}W / ${losses}L</div>
        <div class="session-stat-lbl">Record</div>
      </div>
      <div class="session-divider"></div>
      ${hasRR ? `<div class="session-stat">
        <div class="session-stat-val ${rrClass}">${rrText}</div>
        <div class="session-stat-lbl">RR Delta</div>
      </div><div class="session-divider"></div>` : ''}
      <div class="session-stat">
        <div class="session-stat-val ${parseFloat(sessionKD)>=1.2?'pos':parseFloat(sessionKD)>=0.9?'neu':'neg'}">${sessionKD}</div>
        <div class="session-stat-lbl">Session K/D</div>
      </div>
    </div>`;
  banner.classList.add('active');
}

// ── AGENT WINRATE TREND ──
function getAgentTrend(agentName, matches) {
  // Last 5 matches with this agent, chronological order (newest first in array)
  const agentMatches = matches.filter(m => {
    const me = findMe(m);
    return me && (me.character || '').toLowerCase() === agentName.toLowerCase();
  }).slice(0, 5);
  return agentMatches.map(m => {
    const me = findMe(m);
    const won = m.teams?.[(me?.team||'').toLowerCase()]?.has_won || false;
    return won ? 'w' : 'l';
  });
}

// ── RR GRAPH ANNOTATIONS ──
function addRRAnnotations(chart, rankLabels) {
  // Find rank-up/rank-down moments
  const annotations = [];
  for (let i = 1; i < rankLabels.length; i++) {
    const prev = rankLabels[i-1];
    const curr = rankLabels[i];
    if (!prev || !curr) continue;
    const prevTier = prev.rank?.split(' ')[0];
    const currTier = curr.rank?.split(' ')[0];
    if (prevTier && currTier && prevTier !== currTier) {
      const isUp = rankLabels[i].rr > rankLabels[i-1].rr;
      annotations.push({ x: i, label: `▲ ${curr.rank}`, up: isUp });
    }
  }
  return annotations;
}

// ── SKELETON SHOW/HIDE ──
function showSkeletons() {
  const sk = document.getElementById('v-kd-sk');
  if (sk) sk.style.display = 'block';
}
function hideSkeletons() {
  document.querySelectorAll('.skeleton-val').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.card .card-val').forEach(el => el.style.opacity = '1');
}

// ── EXPORT STATS CARD ──
async function exportStatsCard() {
  const matches = window._allRenderedMatches || [];
  if (!matches.length) { showToast('Fetch your stats first'); return; }

  if (typeof html2canvas === 'undefined') {
    showToast('Export library not loaded.');
    return;
  }

  showToast('Generating infographic card...');

  const mmrH  = window._mmrHistory || {};
  const wins   = matches.filter(m => m.won).length;
  const losses = matches.length - wins;
  const wr     = Math.round((wins / matches.length) * 100);
  const totalK = matches.reduce((s, m) => s + m.kills, 0);
  const totalD = matches.reduce((s, m) => s + m.deaths, 0);
  const kd     = totalD ? (totalK / totalD).toFixed(2) : totalK.toString();
  const avgACS = Math.round(matches.reduce((s, m) => s + (m.acs || 0), 0) / matches.length);
  const avgHS  = Math.round(matches.reduce((s, m) => s + (m.hs || 0), 0) / Math.max(1, totalK) * 100);
  const rank   = document.getElementById('rank-display')?.textContent?.trim() || '—';
  const rrTxt  = document.getElementById('rank-rr-txt')?.textContent?.trim() || '';
  const playerName = document.getElementById('player-name-input')?.value.trim() || '—';
  const playerTag  = document.getElementById('player-tag-input')?.value.trim().replace(/^#/, '') || '—';
  const region     = (document.getElementById('region-select')?.value || 'ap').toUpperCase();
  const modeVal    = document.getElementById('mode-select')?.value || 'competitive';
  const modeName   = modeVal === 'competitive' ? 'Competitive' : modeVal.toUpperCase();

  // Agent most played
  const agentCount = {};
  matches.forEach(m => { agentCount[m.agentName] = (agentCount[m.agentName] || 0) + 1; });
  const topAgent = Object.entries(agentCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Get active avatar
  const playerTopAgentIcon = getAgentIconUrl(topAgent);
  const avatarHtml = playerTopAgentIcon ? `<img src="${playerTopAgentIcon}" crossorigin="anonymous" style="width:100%; height:100%; object-fit:cover;">` : `<div style="font-size:24px; color:rgba(255,255,255,0.4)">👤</div>`;

  // Get rank icon
  const rImg = getRankImgUrl(rank);
  const rankImgHtml = rImg ? `<img src="${rImg}" crossorigin="anonymous" style="width:32px; height:32px; object-fit:contain;">` : `<div style="font-size:16px; color:#ffd700;">🏆</div>`;

  // Get top agent icon
  const taImg = getAgentIconUrl(topAgent);
  const topAgentIconHtml = taImg ? `<img src="${taImg}" crossorigin="anonymous" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255, 70, 85, 0.4); display:block;">` : '';

  // Get up to 10 most recent matches
  const formMatches = matches.slice(0, 10);
  const recentFormHtml = formMatches.map(m => {
    const isWin = m.won;
    const aIcon = getAgentIconUrl(m.agentName);
    const rr = mmrH[m.matchId];
    const rrDisplay = rr !== undefined ? (rr > 0 ? `+${rr}` : `${rr}`) : '';
    const rrColor = rr > 0 ? '#3ecf8e' : '#ff5757';
    
    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 4px; background:${isWin ? 'rgba(62,207,142,0.06)' : 'rgba(255,87,87,0.05)'}; border:1px solid ${isWin ? 'rgba(62,207,142,0.25)' : 'rgba(255,87,87,0.18)'}; border-radius:10px; min-width:48px; box-sizing:border-box; transition:all 0.2s ease;">
        <span style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:900; color:${isWin ? '#3ecf8e' : '#ff5757'}; line-height:1;">${isWin ? 'W' : 'L'}</span>
        ${aIcon ? `<img src="${aIcon}" crossorigin="anonymous" style="width:22px; height:22px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.08); box-shadow:0 2px 6px rgba(0,0,0,0.3);">` : `<div style="width:22px; height:22px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:rgba(255,255,255,0.4)">👤</div>`}
        <span style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; max-width:100%; white-space:nowrap; text-align:center;">${(m.agentName || '').substring(0, 4)}</span>
        ${rrDisplay ? `<span style="font-family:'DM Mono',monospace; font-size:8px; font-weight:700; color:${rrColor}; line-height:1;">${rrDisplay}</span>` : `<span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.15); line-height:1;">--</span>`}
      </div>
    `;
  }).join('');

  // Get active banner background if any
  const bannerImgEl = document.getElementById('player-banner-img');
  const cardUrl = (bannerImgEl && bannerImgEl.src && bannerImgEl.src !== window.location.href) ? bannerImgEl.src : '';

  const exportContainer = document.getElementById('stats-export-container');
  exportContainer.innerHTML = `
    <div id="stats-capture-target" style="width: 720px; padding: 28px; background: #060608; border: 2px solid rgba(255, 70, 85, 0.45); border-radius: 20px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box; position:relative; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
      
      <!-- Premium Player Card Background -->
      ${cardUrl ? `<img src="${cardUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.35; filter: blur(0.5px); pointer-events:none; z-index:0;">` : ''}
      
      <!-- Dark Glassmorphic Gradient Overlay -->
      ${cardUrl ? `<div style="position:absolute; inset:0; background: linear-gradient(135deg, rgba(12, 12, 16, 0.84) 0%, rgba(6, 6, 8, 0.94) 100%); z-index:1; pointer-events:none;"></div>` : ''}
      
      <!-- Accent top right design -->
      <div style="position:absolute; top:-40px; right:-40px; width:120px; height:120px; background:rgba(255, 70, 85, 0.08); border-radius:50%; filter:blur(20px); z-index:1;"></div>
      
      <!-- Outer glowing frame -->
      <div style="position:absolute; inset:0; border:1px solid rgba(255,255,255,0.03); border-radius:18px; pointer-events:none; z-index:1;"></div>
      
      <!-- LEFT LOGO & BRAND STRIPE -->
      <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:#ff4655; border-radius:20px 0 0 20px; z-index:2;"></div>
      
      <!-- Content Container -->
      <div style="position:relative; z-index:2;">
        <!-- HEADER ROW -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(255, 70, 85, 0.15); padding-bottom:14px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <!-- Player Avatar -->
            <div style="width:52px; height:52px; border-radius:50%; border:2px solid #ff4655; display:flex; align-items:center; justify-content:center; background:rgba(255, 70, 85, 0.05); overflow:hidden; flex-shrink:0;">
              ${avatarHtml}
            </div>
            <div>
              <div style="display:flex; align-items:baseline; gap:6px;">
                <span style="font-size:26px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; color:#fff; line-height:1;">${playerName}</span>
                <span style="font-family:'DM Mono',monospace; font-size:14px; color:#ff4655; font-weight:700;">#${playerTag}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; border:1px solid rgba(255,255,255,0.1); padding:1px 6px; border-radius:4px; line-height:1;">${region} Region</span>
                <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; border:1px solid rgba(255,255,255,0.1); padding:1px 6px; border-radius:4px; line-height:1;">${modeName}</span>
              </div>
            </div>
          </div>
          
          <!-- Rank Badge -->
          <div style="display:flex; align-items:center; gap:10px; background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.05)'}; padding:6px 14px; border-radius:30px;">
            ${rankImgHtml}
            <div style="text-align:left;">
              <div style="font-size:13px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1.1;">${rank}</div>
              ${rrTxt ? `<div style="font-family:'DM Mono',monospace; font-size:9px; color:#ffb01f; font-weight:bold; margin-top:2px; line-height:1;">${rrTxt}</div>` : ''}
            </div>
          </div>
        </div>
        
        <!-- STATS GRID -->
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; margin-bottom:24px;">
          <!-- K/D -->
          <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">K / D Ratio</div>
            <div style="font-size:26px; font-weight:900; color:#ff4655; line-height:1;">${kd}</div>
            <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">${totalK} K / ${totalD} D</div>
          </div>
          
          <!-- Win Rate -->
          <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Win Rate</div>
            <div style="font-size:26px; font-weight:900; color:${wr >= 50 ? '#3ecf8e' : '#ff5757'}; line-height:1;">${wr}%</div>
            <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">${wins}W - ${losses}L</div>
          </div>
          
          <!-- AVG ACS -->
          <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">AVG ACS</div>
            <div style="font-size:26px; font-weight:900; color:#fff; line-height:1;">${avgACS}</div>
            <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">Per Match</div>
          </div>
          
          <!-- HS% -->
          <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Headshot %</div>
            <div style="font-size:26px; font-weight:900; color:${avgHS >= 25 ? '#3ecf8e' : avgHS >= 15 ? '#ffd700' : '#ff5757'}; line-height:1;">${avgHS}%</div>
            <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">Hit Accuracy</div>
          </div>
          
          <!-- Top Agent -->
          <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:68px;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Top Agent</div>
            <div style="display:flex; align-items:center; gap:6px;">
              ${topAgentIconHtml}
              <span style="font-size:16px; font-weight:900; color:#fff; text-transform:uppercase;">${topAgent}</span>
            </div>
            <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:2px;">${agentCount[topAgent] || 0} Matches</div>
          </div>
        </div>
        
        <!-- RECENT FORM ROW -->
        <div style="background:${cardUrl ? 'rgba(255, 70, 85, 0.05)' : 'rgba(255, 70, 85, 0.03)'}; border:1px solid ${cardUrl ? 'rgba(255, 70, 85, 0.18)' : 'rgba(255, 70, 85, 0.1)'}; padding:16px; border-radius:14px; box-sizing:border-box;">
          <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255, 70, 85, 0.7); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px; font-weight:700;">RECENT PERFORMANCE (LAST ${formMatches.length} MATCHES)</div>
          <div style="display:flex; gap:6px; justify-content:space-between;">
            ${recentFormHtml}
          </div>
        </div>
        
        <!-- FOOTER -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.30);">
          <div>Generated by VALTRACKER · ${now}</div>
          <div style="color:rgba(255, 70, 85, 0.45); font-weight:bold; letter-spacing:0.5px;">TRACK. ANALYZE. CONQUER.</div>
        </div>
      </div>
    </div>
  `;

  setTimeout(async () => {
    try {
      const el = document.getElementById('stats-capture-target');
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `valtracker_stats_${playerName}_${new Date().getTime()}.png`;
      a.click();
      showToast('Stats PNG card downloaded! ✓');
    } catch(e) {
      console.error(e);
      showToast('Export failed.');
    }
  }, 120);
}

// ══════════════════════════════════════════
//   MATCH FLEX CARD SHARING ENGINE
// ══════════════════════════════════════════

window.openShareMatchModal = async function(idx, event) {
  if (event) event.stopPropagation();

  const matches = window._allRenderedMatches || [];
  const m = matches[idx];
  if (!m) { showToast('Match details not found'); return; }

  if (typeof html2canvas === 'undefined') {
    showToast('Image generator library not loaded.');
    return;
  }

  // Open the modal in loading state
  const overlay = document.getElementById('share-modal-overlay');
  const loading = document.getElementById('share-modal-loading');
  const loaded = document.getElementById('share-modal-loaded');
  const loadingTxt = document.getElementById('share-modal-loading-txt');
  
  overlay.classList.add('open');
  loading.style.display = 'flex';
  loaded.style.display = 'none';
  if (loadingTxt) loadingTxt.textContent = 'GENERATING & UPLOADING REPORT...';

  // Extract statistics
  const acs = Math.round(m.score / 100);
  const hsPct = m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
  const grade = getGrade(m.kills, m.deaths, m.assists, acs, m.won);
  const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);
  const rawMatch = window._matchDetailStore.get(m.matchId) || null;
  const allPlayers = rawMatch ? getPlayerList(rawMatch) : [];
  
  // Calculate MVP
  const getACS = p => Math.round((p.stats?.score || 0) / 100);
  const matchMVPPlayer = allPlayers.length ? allPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, allPlayers[0]) : null;
  const alliedPlayers = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
  const teamMVPPlayer = alliedPlayers.length ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0]) : null;
  
  const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === PLAYER_NAME.toLowerCase();
  
  // Lobby average rank
  const rankInfo = getLobbyRankInfo(allPlayers, m.myTeamId);
  const rankName = rankInfo?.overall?.name || 'Unknown';
  const rankImg = getRankImgUrl(rankName) || '';

  // Asset URLs
  const normalizedAgentName = m.agentName.charAt(0).toUpperCase() + m.agentName.slice(1).toLowerCase();
  const agentPortrait = getAgentPortraitUrl(normalizedAgentName) || '';
  const agentIcon = getAgentIconUrl(m.agentName) || '';
  const mapImg = getMapImg(m.map) || '';

  // Retrieve player banner and level
  const bannerImgEl = document.getElementById('player-banner-img');
  const playerBannerUrl = bannerImgEl ? (bannerImgEl.getAttribute('src') || bannerImgEl.src) : '';
  const playerLevelStr = document.getElementById('player-level')?.textContent?.replace('LVL', '')?.trim() || '—';

  // Get user rank
  const meC = allPlayers.find(p => p.name?.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag?.toLowerCase() === PLAYER_TAG.toLowerCase());
  const userRank = meC?.currenttier_patched || meC?.tier || 'Unranked';
  const userRankImg = getRankImgUrl(userRank) || '';

  // --- RICH MULTI-KILL & CLUTCH TELEMETRY EXTRACTION ---
  const rounds = rawMatch?.rounds || [];
  let doubleKills = 0;
  let tripleKills = 0;
  let quadKills = 0;
  let aces = 0;
  let clutchesCount = 0;
  
  const myPuuid = meC?.puuid || meC?.subject || meC?.id || '';
  const myPuuids = [meC?.puuid, meC?.subject, meC?.id, myPuuid].filter(Boolean);
  const teammatePuuids = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId && !myPuuids.includes(p.puuid)).map(p => p.puuid);
  
  rounds.forEach((r) => {
    const myWon = (r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase() === m.myTeamId;
    const playerStats = r.player_stats || [];
    const myPs = myPuuid ? playerStats.find(p => (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuid) : null;
    const killEvents = myPs?.kill_events || [];
    const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);
    
    if (myKills === 2) doubleKills++;
    else if (myKills === 3) tripleKills++;
    else if (myKills === 4) quadKills++;
    else if (myKills >= 5) aces++;
    
    // Clutch Check
    let tmDeaths = 0;
    let meDied = false;
    playerStats.forEach(ps => {
      (ps.kill_events || []).forEach(k => {
        const victim = k.victim_puuid || k.victim;
        if (victim && myPuuids.includes(victim)) meDied = true;
        if (victim && teammatePuuids.includes(victim)) tmDeaths++;
      });
    });
    
    if (myWon && tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) {
      clutchesCount++;
    }
  });

  // Calculate combat performance rating (out of 10.0)
  const combatRating = Math.min(10.0, (parseFloat(kd) * 2.8 + acs / 75 + hsPct / 12).toFixed(1));
  const ratingColor = combatRating >= 8.2 ? '#e8ff47' : combatRating >= 6.2 ? '#3ecf8e' : '#ff4655';
  const ratingGlow = combatColor => combatColor === '#e8ff47' ? 'rgba(232, 255, 71, 0.25)' : combatColor === '#3ecf8e' ? 'rgba(62, 207, 142, 0.2)' : 'rgba(255, 70, 85, 0.2)';

  // --- PREMIUM PERFORMANCE GRADES (S+, S, A, B, C) ---
  let perfGrade = 'B';
  let perfGradeColor = '#ff4655';
  let perfGradeBg = 'rgba(255, 70, 85, 0.15)';
  let perfGradeBorder = 'rgba(255, 70, 85, 0.4)';
  let perfGradeGlow = 'rgba(255, 70, 85, 0.2)';
  
  if (combatRating >= 9.0) {
    perfGrade = 'S+';
    perfGradeColor = '#ffd700';
    perfGradeBg = 'rgba(255, 215, 0, 0.2)';
    perfGradeBorder = 'rgba(255, 215, 0, 0.6)';
    perfGradeGlow = 'rgba(255, 215, 0, 0.4)';
  } else if (combatRating >= 8.0) {
    perfGrade = 'S';
    perfGradeColor = '#e8ff47';
    perfGradeBg = 'rgba(232, 255, 71, 0.2)';
    perfGradeBorder = 'rgba(232, 255, 71, 0.6)';
    perfGradeGlow = 'rgba(232, 255, 71, 0.3)';
  } else if (combatRating >= 6.8) {
    perfGrade = 'A';
    perfGradeColor = '#3ecf8e';
    perfGradeBg = 'rgba(62, 207, 142, 0.15)';
    perfGradeBorder = 'rgba(62, 207, 142, 0.5)';
    perfGradeGlow = 'rgba(62, 207, 142, 0.25)';
  } else if (combatRating >= 5.0) {
    perfGrade = 'B';
    perfGradeColor = '#ffb01f';
    perfGradeBg = 'rgba(255, 176, 31, 0.15)';
    perfGradeBorder = 'rgba(255, 176, 31, 0.5)';
    perfGradeGlow = 'rgba(255, 176, 31, 0.2)';
  } else {
    perfGrade = 'C';
    perfGradeColor = '#ff4655';
    perfGradeBg = 'rgba(255, 70, 85, 0.15)';
    perfGradeBorder = 'rgba(255, 70, 85, 0.5)';
    perfGradeGlow = 'rgba(255, 70, 85, 0.2)';
  }

  // --- DYNAMIC COOL PERFORMANCE TITLES ---
  let coolTitle = '';
  let titleColor = '#ff4655';
  let titleBg = 'linear-gradient(90deg, rgba(255, 70, 85, 0.25) 0%, rgba(255, 70, 85, 0.02) 100%)';
  let titleBorder = 'rgba(255, 70, 85, 0.5)';
  
  if (m.won) {
    if (aces > 0) {
      coolTitle = '👑 CHAMPION ACE';
      titleColor = '#ffd700';
      titleBg = 'linear-gradient(90deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.02) 100%)';
      titleBorder = 'rgba(255, 215, 0, 0.5)';
    } else if (clutchesCount >= 2) {
      coolTitle = '⚡ CLUTCH LEGEND';
      titleColor = '#ffd700';
      titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.25) 0%, rgba(232, 255, 71, 0.02) 100%)';
      titleBorder = 'rgba(232, 255, 71, 0.5)';
    } else if (kd >= 2.0) {
      coolTitle = '🔥 UNSTOPPABLE APEX';
      titleColor = '#ff5c6a';
      titleBg = 'linear-gradient(90deg, rgba(255, 92, 106, 0.18) 0%, rgba(255, 92, 106, 0.02) 100%)';
      titleBorder = 'rgba(255, 92, 106, 0.5)';
    } else if (kd >= 1.5 && isMatchMVP) {
      coolTitle = '🧬 MATCH COLOSSUS';
      titleColor = '#c084fc';
      titleBg = 'linear-gradient(90deg, rgba(192, 132, 252, 0.18) 0%, rgba(192, 132, 252, 0.02) 100%)';
      titleBorder = 'rgba(192, 132, 252, 0.5)';
    } else if (kd >= 1.25) {
      coolTitle = '💥 SQUAD CARRY';
      titleColor = '#e8ff47';
      titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.22) 0%, rgba(232, 255, 71, 0.02) 100%)';
      titleBorder = 'rgba(232, 255, 71, 0.5)';
    } else if (isMatchMVP) {
      coolTitle = '👑 MATCH MVP';
      titleColor = '#e8ff47';
      titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.2) 0%, rgba(232, 255, 71, 0.02) 100%)';
      titleBorder = 'rgba(232, 255, 71, 0.4)';
    } else if (isTeamMVP) {
      coolTitle = '⭐ TEAM MVP';
      titleColor = '#ffb01f';
      titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.2) 0%, rgba(255, 176, 31, 0.02) 100%)';
      titleBorder = 'rgba(255, 176, 31, 0.4)';
    } else if (m.assists >= 8) {
      coolTitle = '🛡️ TACTICAL ANCHOR';
      titleColor = '#38bdf8';
      titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.02) 100%)';
      titleBorder = 'rgba(56, 189, 248, 0.4)';
    } else {
      coolTitle = '🏆 VICTORIOUS TACTICIAN';
      titleColor = '#3ecf8e';
      titleBg = 'linear-gradient(90deg, rgba(62, 207, 142, 0.2) 0%, rgba(62, 207, 142, 0.02) 100%)';
      titleBorder = 'rgba(62, 207, 142, 0.4)';
    }
  } else {
    // Loss states
    if (aces > 0) {
      coolTitle = '👑 HEROIC ACE';
      titleColor = '#ffd700';
      titleBg = 'linear-gradient(90deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.02) 100%)';
      titleBorder = 'rgba(255, 215, 0, 0.5)';
    } else if (clutchesCount >= 1) {
      coolTitle = '⚡ CLUTCH SENTINEL';
      titleColor = '#ffd700';
      titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.25) 0%, rgba(232, 255, 71, 0.02) 100%)';
      titleBorder = 'rgba(232, 255, 71, 0.5)';
    } else if (kd >= 1.5) {
      coolTitle = '💔 VALIANT HERO';
      titleColor = '#ff5c6a';
      titleBg = 'linear-gradient(90deg, rgba(255, 92, 106, 0.18) 0%, rgba(255, 92, 106, 0.02) 100%)';
      titleBorder = 'rgba(255, 92, 106, 0.5)';
    } else if (kd >= 1.1) {
      coolTitle = '⚔️ UNYIELDING DEFENDER';
      titleColor = '#ffb01f';
      titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.15) 0%, rgba(255, 176, 31, 0.02) 100%)';
      titleBorder = 'rgba(255, 176, 31, 0.3)';
    } else if (m.assists >= 8) {
      coolTitle = '🛡️ SUPPORT PILLAR';
      titleColor = '#38bdf8';
      titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.02) 100%)';
      titleBorder = 'rgba(56, 189, 248, 0.4)';
    } else {
      coolTitle = '📈 REBOUND WARRIOR';
      titleColor = '#38bdf8';
      titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.02) 100%)';
      titleBorder = 'rgba(56, 189, 248, 0.5)';
    }
  }

  // Pre-fill Template text for X / Reddit
  let postText = '';
  const mapStr = m.map ? m.map.toUpperCase() : 'VALORANT';
  const agentStr = m.agentName ? m.agentName.toUpperCase() : 'Agent';
  if (m.won) {
    if (isMatchMVP) {
      postText = `👑 UNSTOPPABLE MATCH MVP! Secured a huge ${m.rounds} VICTORY on ${mapStr} playing as ${agentStr} with a ${combatRating}/10 combat rating! Check my deep stats on ValTracker:`;
    } else if (isTeamMVP) {
      postText = `⭐ Team MVP performance! Dominated ${m.rounds} on ${mapStr} as ${agentStr} (Combat Rating: ${combatRating}/10). Telemetry via @ValTracker:`;
    } else if (kd >= 1.5) {
      postText = `🔥 Absolutely went off! Dropped a ${kd} KD in a ${m.rounds} win on ${mapStr} as ${agentStr}. Analyze my match on ValTracker:`;
    } else {
      postText = `🏆 Secured the dub! Clean ${m.rounds} victory on ${mapStr} playing as ${agentStr}. My telemetry card from ValTracker:`;
    }
  } else {
    if (kd >= 1.3) {
      postText = `💔 Heartbreak defeat, but I absolutely carried. Dropped a ${kd} KD and a ${combatRating}/10 rating as ${agentStr} on ${mapStr}. Check my ValTracker report:`;
    } else {
      postText = `📈 Tough battle on ${mapStr} as ${agentStr}. We bounce back stronger. My match stats card on ValTracker:`;
    }
  }
  document.getElementById('share-modal-template-text').value = postText;

  // --- DYNAMIC IMPACT FEATS BADGES WITH PREMIUM GLOW EFFECTS (x-multiplier fix) ---
  let featsHtml = '';
  if (aces > 0 || clutchesCount > 0 || quadKills > 0 || tripleKills > 0 || doubleKills > 0) {
    featsHtml += `
      <div style="margin-top: 6px; z-index:3; position:relative;">
        <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1.1px; margin-bottom:4px; font-weight:700;">IMPACT FEATS</div>
        <div style="display:flex; flex-wrap:wrap; gap:5px;">
          ${aces > 0 ? `<span style="background:linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(218,165,32,0.05) 100%); border:1px solid #ffd700; color:#ffd700; padding:3px 8px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(255,215,0,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(255,215,0,0.4);">👑 ACE x${aces}</span>` : ''}
          ${clutchesCount > 0 ? `<span style="background:linear-gradient(135deg, rgba(232,255,71,0.15) 0%, rgba(50,205,50,0.05) 100%); border:1px solid #e8ff47; color:#e8ff47; padding:3px 8px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(232,255,71,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(232,255,71,0.4);">⚡ CLUTCH x${clutchesCount}</span>` : ''}
          ${quadKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(255,70,85,0.15) 0%, rgba(249,115,22,0.05) 100%); border:1px solid #ff4655; color:#ff4655; padding:3px 8px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 8px rgba(255,70,85,0.25); display:inline-flex; align-items:center; gap:2px; text-shadow:0 0 2px rgba(255,70,85,0.4);">🔥 4-KILL x${quadKills}</span>` : ''}
          ${tripleKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.05) 100%); border:1px solid #a855f7; color:#a855f7; padding:3px 8px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; display:inline-flex; align-items:center; gap:2px;">💀 3-KILL x${tripleKills}</span>` : ''}
          ${doubleKills > 0 ? `<span style="background:linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.05) 100%); border:1px solid #3b82f6; color:#3b82f6; padding:3px 8px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; display:inline-flex; align-items:center; gap:2px;">💥 2-KILL x${doubleKills}</span>` : ''}
        </div>
      </div>
    `;
  }

  // --- DYNAMIC ROUND TIMELINE DOTS ---
  const roundDotsHtml = rounds.map((r, i) => {
    const myTeamWon = (r.winning_team || r.winningTeam || r.winning_Team || '').toLowerCase() === m.myTeamId;
    const bg = myTeamWon ? 'rgba(62,207,142,0.85)' : 'rgba(255,87,87,0.7)';
    const shadow = myTeamWon ? 'rgba(62,207,142,0.3)' : 'rgba(255,87,87,0.2)';
    
    // Check if I clutched this round
    const rPlayerStats = r.player_stats || [];
    let rMeDied = false;
    let rTmDeaths = 0;
    rPlayerStats.forEach(ps => {
      (ps.kill_events || []).forEach(k => {
        const victim = k.victim_puuid || k.victim;
        if (victim && myPuuids.includes(victim)) rMeDied = true;
        if (victim && teammatePuuids.includes(victim)) rTmDeaths++;
      });
    });
    const isClutch = myTeamWon && rTmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !rMeDied;
    const border = isClutch ? '1.5px solid #ffd700' : 'none';
    const boxS = isClutch ? '0 0 6px #ffd700' : `0 1px 2px ${shadow}`;

    return `<div style="width:13px; height:13px; border-radius:50%; background:${bg}; border:${border}; box-shadow:${boxS}; display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:7px; font-weight:bold; color:#fff; flex-shrink:0;">${i+1}</div>`;
  }).join('');

  // Extract scoreboard players to build the fully visible, beautiful dashboard table
  const alliedWatermarked = allPlayers.filter(p=>(p.team||'').toLowerCase()===m.myTeamId).sort((a,b)=>getACS(b)-getACS(a));
  const enemyWatermarked = allPlayers.filter(p=>(p.team||'').toLowerCase()!==m.myTeamId).sort((a,b)=>getACS(b)-getACS(a));

  const alliedRowsHtml = alliedWatermarked.map((p) => {
    const isMe = p.name?.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag?.toLowerCase() === PLAYER_TAG.toLowerCase();
    const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
    const pACS = Math.round((p.stats?.score || 0) / 100);
    const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
    const rowBg = isMe ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255, 255, 255, 0.015)';
    const rowBorder = isMe ? '1px solid rgba(62, 207, 142, 0.45)' : '1px solid rgba(255, 255, 255, 0.02)';
    const nameColor = isMe ? '#3ecf8e' : '#fff';
    const nameWeight = isMe ? 'bold' : 'normal';

    return `
      <tr style="background:${rowBg}; border:${rowBorder}; font-size:9.5px; border-radius:4px; font-family:'DM Mono',monospace; height:21px; box-shadow:${isMe ? '0 0 10px rgba(62, 207, 142, 0.15)' : 'none'};">
        <td style="padding:2px 8px; border-radius:4px 0 0 4px; border-left:${isMe ? '3px solid #3ecf8e' : 'none'};">
          <div style="display:flex; align-items:center; gap:5px;">
            ${charIcon ? `<img src="${charIcon}" style="width:14px; height:14px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);">` : ''}
            <span style="color:${nameColor}; font-weight:${nameWeight}; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:100px;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px; color:rgba(255,255,255,0.7); text-align:center;">${pKDA}</td>
        <td style="padding:2px 8px; color:#fff; font-weight:bold; text-align:right; border-radius:0 4px 4px 0;">${pACS}</td>
      </tr>
    `;
  }).join('');

  const enemyRowsHtml = enemyWatermarked.map((p) => {
    const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
    const pACS = Math.round((p.stats?.score || 0) / 100);
    const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
    const rowBg = 'rgba(255, 255, 255, 0.005)';
    const rowBorder = '1px solid rgba(255, 255, 255, 0.015)';

    return `
      <tr style="background:${rowBg}; border:${rowBorder}; font-size:9.5px; border-radius:4px; font-family:'DM Mono',monospace; height:21px;">
        <td style="padding:2px 8px; border-radius:4px 0 0 4px;">
          <div style="display:flex; align-items:center; gap:5px;">
            ${charIcon ? `<img src="${charIcon}" style="width:14px; height:14px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);">` : ''}
            <span style="color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:100px;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px; color:rgba(255,255,255,0.7); text-align:center;">${pKDA}</td>
        <td style="padding:2px 8px; color:#fff; font-weight:bold; text-align:right; border-radius:0 4px 4px 0;">${pACS}</td>
      </tr>
    `;
  }).join('');

  // Dynamic color coding based on performance tier & MVP status (Improvisation)
  let accentColor = '#ff4655'; // Default Defeat color (Obsidian Crimson Red)
  let accentShadow = 'rgba(255, 70, 85, 0.35)';
  let themeName = 'OBSIDIAN';
  
  if (isMatchMVP) {
    // Majestic Gold theme for the absolute lobby ruler
    accentColor = '#ffd700';
    accentShadow = 'rgba(255, 215, 0, 0.45)';
    themeName = 'GOLD';
  } else if (isTeamMVP || perfGrade === 'S+' || perfGrade === 'S') {
    // Vibrant Neon Green-Yellow for high-impact carries
    accentColor = '#e8ff47';
    accentShadow = 'rgba(232, 255, 71, 0.45)';
    themeName = 'NEON';
  } else if (m.won || perfGrade === 'A') {
    // Cool Cyber-Cyan/Emerald Green for strategic victors
    accentColor = '#3ecf8e';
    accentShadow = 'rgba(62, 207, 142, 0.4)';
    themeName = 'EMERALD';
  } else {
    // Deep obsidian/crimson for tough bounce-backs
    accentColor = '#ff4655';
    accentShadow = 'rgba(255, 70, 85, 0.35)';
    themeName = 'OBSIDIAN';
  }
  
  const outcomeText = m.won ? 'VICTORY' : 'DEFEAT';

  // Map capsule HTML (renamed to Map)
  const mapCapsuleHtml = `
    <div style="background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:8px;">
      ${mapImg ? `<div style="background-image: url('${mapImg}'); background-size: cover; background-position: center; width: 28px; height: 28px; border-radius: 6px; border:1px solid rgba(255,255,255,0.15);"></div>` : ''}
      <div>
        <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Map</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:800; color:#fff; text-transform:uppercase; line-height:1; letter-spacing:0.5px; margin-top:2px;">
          ${m.map || 'Unknown'}
        </div>
      </div>
    </div>
  `;

  // Ranks block (Your Rank vs Lobby Average Rank)
  const ranksBlockHtml = `
    <div style="display:flex; gap:10px; width:100%; z-index:3; position:relative;">
      <!-- Your Rank -->
      <div style="flex:1; background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:8px; backdrop-filter:blur(10px);">
        ${userRankImg ? `<img src="${userRankImg}" style="width:24px; height:24px; object-fit:contain;">` : ''}
        <div>
          <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Your Rank</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:800; color:#fff; text-transform:uppercase; margin-top:2px; line-height:1;">${userRank}</div>
        </div>
      </div>
      <!-- Lobby Rank -->
      <div style="flex:1; background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 12px; display:flex; align-items:center; gap:8px; backdrop-filter:blur(10px);">
        ${rankImg ? `<img src="${rankImg}" style="width:24px; height:24px; object-fit:contain;">` : ''}
        <div>
          <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1;">Lobby Avg</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:800; color:#fff; text-transform:uppercase; margin-top:2px; line-height:1;">${rankName}</div>
        </div>
      </div>
    </div>
  `;

  // Performance Rating block
  const performanceRatingHtml = `
    <div style="background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; width:100%; box-sizing:border-box; backdrop-filter:blur(10px); box-shadow:0 4px 20px rgba(0,0,0,0.25);">
      <div>
        <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Esports Combat Rating</div>
        <div style="display:flex; align-items:baseline; gap:3px;">
          <span style="font-family:'Barlow Condensed',sans-serif; font-size:34px; font-weight:900; color:${ratingColor}; text-shadow:0 0 12px ${ratingGlow(ratingColor)}; line-height:1;">${combatRating}</span>
          <span style="font-family:'DM Mono',monospace; font-size:11px; color:rgba(255,255,255,0.25);">/ 10</span>
        </div>
      </div>
      
      <!-- Premium Rating Tier Grade Box -->
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="background:${perfGradeBg}; border:1px solid ${perfGradeBorder}; color:${perfGradeColor}; border-radius:8px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; box-shadow:0 0 10px ${perfGradeGlow}; text-shadow:0 0 4px ${perfGradeColor}80;">
          ${perfGrade}
        </div>
        ${isMatchMVP ? `
          <div style="background:linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(218,165,32,0.05) 100%); border:1px solid #ffd700; color:#ffd700; border-radius:6px; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 10px rgba(255,215,0,0.3); text-shadow:0 0 2px rgba(255,215,0,0.5);">
            👑 MATCH MVP
          </div>
        ` : isTeamMVP ? `
          <div style="background:linear-gradient(135deg, rgba(232,255,71,0.15) 0%, rgba(50,205,50,0.05) 100%); border:1px solid #e8ff47; color:#e8ff47; border-radius:6px; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 10px rgba(232,255,71,0.3); text-shadow:0 0 2px rgba(232,255,71,0.5);">
            ⭐ TEAM MVP
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const captureContainer = document.getElementById('match-export-container');
  captureContainer.innerHTML = `
    <div id="match-capture-target" style="width: 900px; height: 535px; background: #050508; border: 1.5px solid ${accentColor}40; border-radius: 20px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box; position:relative; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.95), 0 0 20px ${accentColor}10; display:flex; flex-direction:column; justify-content:space-between; padding:24px;">
      
      <!-- Diagonal Watermark Stripe -->
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:2; overflow:hidden;">
        <div style="font-family:'Barlow Condensed', sans-serif; font-size:140px; font-weight:900; color:rgba(255,255,255,0.035); letter-spacing:4px; text-transform:uppercase; transform:rotate(-15deg); white-space:nowrap; select:none;">
          VALTRACKER
        </div>
      </div>

      <!-- Premium Blurred Map Background Splash -->
      ${mapImg ? `<img src="${mapImg}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.18; filter: blur(2px); pointer-events:none; z-index:0;">` : ''}
      
      <!-- Dynamic Soothing Radial Gradient Overlay -->
      <div style="position:absolute; inset:0; background: radial-gradient(circle at 20% 30%, ${accentColor}12 0%, rgba(10, 10, 15, 0.96) 70%, rgba(4, 4, 6, 0.99) 100%); z-index:1; pointer-events:none;"></div>
      
      <!-- Left decorative border indicating outcome -->
      <div style="position:absolute; left:0; top:0; bottom:0; width:4px; background:${accentColor}; box-shadow: 1px 0 12px ${accentShadow}; border-radius:20px 0 0 20px; z-index:4;"></div>

      <!-- Top Header Row -->
      <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <!-- ValTracker Logo -->
          <svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:none; filter: drop-shadow(0 0 8px rgba(255, 70, 85, 0.6));">
            <path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655" />
            <polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47" />
          </svg>
          <span style="font-family:'Barlow Condensed', sans-serif; font-size:20px; font-weight:900; letter-spacing:1.5px; color:#fff; text-transform:uppercase;">ValTracker</span>
          
          <!-- Verified Report Badge -->
          <div style="background:rgba(62,207,142,0.1); border:1px solid rgba(62,207,142,0.3); color:#3ecf8e; border-radius:4px; padding:2px 6px; font-family:'DM Mono', monospace; font-size:7.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 0 6px rgba(62,207,142,0.15); margin-left:4px;">
            VERIFIED REPORT
          </div>
          
          <!-- Player Horizontal Banner & Name Capsule -->
          <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:3px 10px 3px 3px; border-radius:6px; backdrop-filter:blur(4px);">
            ${playerBannerUrl ? `<div style="background-image: url('${playerBannerUrl}'); background-size: cover; background-position: center; width: 75px; height: 26px; border-radius: 4px; border:1px solid rgba(255,255,255,0.1);"></div>` : ''}
            <div style="display:flex; flex-direction:column; justify-content:center;">
              <span style="font-family:'Barlow Condensed', sans-serif; font-size:14px; font-weight:900; color:#fff; letter-spacing:0.5px; text-transform:uppercase; line-height:1.1;">${PLAYER_NAME}#${PLAYER_TAG}</span>
              <span style="font-family:'DM Mono', monospace; font-size:8px; color:rgba(255,255,255,0.4); line-height:1.1;">LVL ${playerLevelStr}</span>
            </div>
          </div>
        </div>
        
        <!-- Outcomes Block in Header -->
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:20px; font-weight:900; color:${accentColor}; text-shadow:0 0 12px ${accentShadow}; letter-spacing:1.5px; text-transform:uppercase; border:1px solid ${accentColor}40; padding:2px 10px; border-radius:6px; background:${accentColor}10;">
            ${outcomeText} ${m.rounds}
          </div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:11px; font-weight:800; color:#ffb01f; letter-spacing:2px; text-transform:uppercase; border:1px solid rgba(255,176,31,0.25); padding:3px 8px; border-radius:4px; background:rgba(255,176,31,0.03);">
            Match Report Card
          </div>
        </div>
      </div>

      <!-- Center Body Row (Player performance left column, visible scoreboard right column) -->
      <div style="position:relative; z-index:3; flex-grow:1; display:flex; gap:24px; align-items:stretch; padding-bottom:10px;">
        
        <!-- Left Performance Column -->
        <div style="width:390px; display:flex; flex-direction:column; gap:8px; justify-content:space-between;">
          <!-- Profile + Title Card -->
          <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:10px 12px;">
            <!-- Sized-down framed agent avatar slot -->
            <div style="width:40px; height:40px; border-radius:8px; background:#101014; border:2px solid ${accentColor}; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 8px ${accentColor}40;">
              ${agentIcon ? `<img src="${agentIcon}" style="width:100%; height:100%; object-fit:cover;">` : ''}
            </div>
            <div>
              <div style="display:inline-flex; align-items:center; background:${titleBg}; border:1px solid ${titleBorder}; padding:3px 10px; border-radius:6px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:900; color:${titleColor}; letter-spacing:1px; text-transform:uppercase; box-shadow:0 0 8px ${titleBorder === 'rgba(255,255,255,0.15)' ? 'transparent' : titleColor}40;">
                ${coolTitle}
              </div>
              <div style="font-family:'DM Mono', monospace; font-size:9.5px; color:rgba(255,255,255,0.4); margin-top:2.2px;">
                Agent: ${(m.agentName || '—').toUpperCase()} · Match Date: ${formatMatchDate(m.gameStart)}
              </div>
            </div>
          </div>

          <!-- Esports Combat Rating block -->
          ${performanceRatingHtml}

          <!-- Ranks Row (Your Rank vs Lobby Rank) -->
          ${ranksBlockHtml}

          <!-- Core stats grid -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; width:100%;">
            <!-- KDA -->
            <div style="background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 10px; backdrop-filter:blur(10px);">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">K / D / A</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${m.kills}/${m.deaths}/${m.assists}
              </div>
            </div>

            <!-- K/D Ratio -->
            <div style="background:rgba(15, 15, 22, 0.65); border:1px solid ${kd >= 1 ? 'rgba(62,207,142,0.25)' : 'rgba(255,70,85,0.25)'}; border-radius:10px; padding:8px 10px; backdrop-filter:blur(10px); box-shadow:0 0 10px ${kd >= 1 ? 'rgba(62,207,142,0.05)' : 'rgba(255,70,85,0.03)'};">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">K/D Ratio</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:${kd >= 1 ? '#3ecf8e' : '#ff4655'}; line-height:1; letter-spacing:0.5px;">
                ${kd}
              </div>
            </div>

            <!-- Map pill -->
            ${mapCapsuleHtml}

            <!-- ACS -->
            <div style="background:rgba(15, 15, 22, 0.65); border:1px solid ${acs >= 240 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; padding:8px 10px; backdrop-filter:blur(10px); box-shadow:0 0 10px ${acs >= 240 ? 'rgba(255,215,0,0.05)' : 'transparent'};">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">ACS</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${acs}
              </div>
            </div>

            <!-- HS Rate -->
            <div style="background:rgba(15, 15, 22, 0.65); border:1px solid ${hsPct >= 22 ? 'rgba(62,207,142,0.25)' : hsPct >= 14 ? 'rgba(255,176,31,0.2)' : 'rgba(255,70,85,0.2)'}; border-radius:10px; padding:8px 10px; backdrop-filter:blur(10px); box-shadow:0 0 10px ${hsPct >= 22 ? 'rgba(62,207,142,0.05)' : 'transparent'};">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">HS %</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:${hsPct >= 22 ? '#3ecf8e' : hsPct >= 14 ? '#ffb01f' : '#ff4655'}; line-height:1; letter-spacing:0.5px;">
                ${hsPct}%
              </div>
            </div>

            <!-- Round count -->
            <div style="background:rgba(15, 15, 22, 0.65); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 10px; backdrop-filter:blur(10px);">
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:4px;">Rounds</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; color:#fff; line-height:1; letter-spacing:0.5px;">
                ${rounds.length}
              </div>
            </div>
          </div>
          
          <!-- Round timeline -->
          <div>
            <div style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Round win/loss timeline</div>
            <div style="display:flex; gap:3px; flex-wrap:wrap; max-width:390px;">
              ${roundDotsHtml}
            </div>
          </div>

          <!-- Glowing colorful neon Feats Badges -->
          ${featsHtml}
        </div>

        <!-- Right Visible Scorecard Column (Blends soothingly with background blur) -->
        <div style="width:440px; background:rgba(10, 10, 15, 0.35); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:16px; backdrop-filter:blur(12px); display:flex; flex-direction:column; gap:6px; box-sizing:border-box; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px; margin-bottom:4px;">
            <span style="font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:900; letter-spacing:1px; color:rgba(255,255,255,0.5);">MATCH SCOREBOARD</span>
            <span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3);">ALLIED VS ENEMY ROSTER</span>
          </div>

          <table style="width:100%; border-collapse:separate; border-spacing:0 2.5px;">
            <thead>
              <tr style="font-family:'Barlow Condensed',sans-serif; font-size:9.5px; font-weight:900; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; height:18px;">
                <th style="text-align:left; padding:0 8px;">Player / Character</th>
                <th style="text-align:center; padding:0 8px;">K/D/A</th>
                <th style="text-align:right; padding:0 8px;">ACS</th>
              </tr>
            </thead>
            <tbody>
              <!-- Allied team header row -->
              <tr style="height:14px; font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:900; letter-spacing:0.5px; color:#3ecf8e;">
                <td colspan="3" style="padding:4px 8px 2px 8px; border-bottom:1px solid rgba(62, 207, 142, 0.15);">▲ YOUR TEAM</td>
              </tr>
              ${alliedRowsHtml}
              <!-- Enemy team header row -->
              <tr style="height:14px; font-family:'Barlow Condensed',sans-serif; font-size:8px; font-weight:900; letter-spacing:0.5px; color:#ff4655;">
                <td colspan="3" style="padding:8px 8px 2px 8px; border-bottom:1px solid rgba(255, 70, 85, 0.15);">▼ ENEMY TEAM</td>
              </tr>
              ${enemyRowsHtml}
            </tbody>
          </table>
        </div>

      </div>

      <!-- Bottom Footer -->
      <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; font-family:'DM Mono', monospace; font-size:9px; color:rgba(255,255,255,0.35); letter-spacing:0.5px; margin-top:4px;">
        <div>Report compiled by ValTracker</div>
        <div style="color:#ff4655; font-weight:900; letter-spacing:1px; text-transform:uppercase;">TRACK. ANALYZE. CONQUER.</div>
      </div>
    </div>
  `;

  // Store variables globally for click sharing handlers
  window._currentMatchShare = {
    idx,
    playerName: PLAYER_NAME,
    playerTag: PLAYER_TAG,
    agentName: m.agentName,
    mapName: m.map,
    won: m.won,
    rounds: m.rounds,
    scoreText: m.rounds,
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    acs,
    hsPct,
    kd,
    shareUrl: '', // Will be filled dynamically after API upload
    shareId: ''
  };

  // Wait a small frame for images to complete loading, then run html2canvas capture!
  setTimeout(generateFlexCard, 220);
};

async function generateFlexCard() {
  try {
    const el = document.getElementById('match-capture-target');
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 1.8, // 1.8x scale for stunning sharpness and premium details, optimized size
      logging: false,
      useCORS: true
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    // Generate an optimized JPEG dataUrl for server sharing (reduces size by 15x for instant timeline preloads)
    const uploadDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    // Update preview in the modal
    document.getElementById('share-modal-img-preview').src = dataUrl;
    window._currentMatchShare.dataUrl = dataUrl;
    
    // Automatically copy to clipboard (as fallback / convenience)
    canvas.toBlob(async (blob) => {
      window._currentMatchShare.blob = blob;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          
          const clipboardStatusEl = document.getElementById('share-modal-clipboard-status');
          if (clipboardStatusEl) {
            clipboardStatusEl.style.display = 'flex';
          }
        }
      } catch (err) {
        console.warn('Clipboard fallback warning:', err);
        const clipboardStatusEl = document.getElementById('share-modal-clipboard-status');
        if (clipboardStatusEl) {
          clipboardStatusEl.style.display = 'none';
        }
      }
    }, 'image/png');

    // AUTOMATICALLY UPLOAD IMAGE TO SERVER IMMEDIATELY FOR AUTOPRELOAD SUPPORT
    const share = window._currentMatchShare;
    try {
      const response = await fetch('/api/share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadDataUrl,
          playerName: share.playerName,
          playerTag: share.playerTag,
          agentName: share.agentName,
          mapName: share.mapName,
          won: share.won,
          score: share.scoreText
        })
      });
      
      const resData = await response.json();
      if (resData.status === 'ok') {
        share.shareUrl = resData.share_url;
        share.shareId = resData.share_id;
        
        // Append link to pre-filled templates
        const origText = document.getElementById('share-modal-template-text').value;
        document.getElementById('share-modal-template-text').value = origText + ' ' + resData.share_url;
        
        showToast('Flex card registered! 🚀');
      } else {
        console.error('Share upload failed:', resData.message);
      }
    } catch (uploadErr) {
      console.error('Network error during share upload:', uploadErr);
    }

    // Hide loader & show loaded contents
    document.getElementById('share-modal-loading').style.display = 'none';
    document.getElementById('share-modal-loaded').style.display = 'flex';

  } catch(e) {
    console.error('[Capture Error]', e);
    showToast('Failed to compile infographic.');
    closeShareModal();
  }
}

window.shareToPlatform = function(platform) {
  const share = window._currentMatchShare;
  if (!share) return;
  
  const textVal = document.getElementById('share-modal-template-text').value;
  const encodedText = encodeURIComponent(textVal);
  const shareUrl = share.shareUrl || '';

  if (platform === 'download') {
    const a = document.createElement('a');
    a.href = share.dataUrl;
    a.download = `valtracker_flex_${share.agentName}_${share.mapName}_${new Date().getTime()}.png`;
    a.click();
    showToast('Match Flex Card downloaded! ✓');
  } 
  else if (platform === 'twitter') {
    // Force cache-busting on the target URL so social crawler bypasses their aggressively cached metadata failures
    const shareUrlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
    
    // Strip the raw share URL out of the template text area so it doesn't double-post.
    // We pass the URL explicitly using the official '&url=' Web Intent parameter to force Twitter's card preload engine to execute!
    let cleanText = textVal;
    if (shareUrl && cleanText.includes(shareUrl)) {
      cleanText = cleanText.replace(shareUrl, '').trim();
    }
    const encodedCleanText = encodeURIComponent(cleanText);
    
    const url = shareUrl 
      ? `https://twitter.com/intent/tweet?text=${encodedCleanText}&url=${encodeURIComponent(shareUrlWithBuster)}`
      : `https://twitter.com/intent/tweet?text=${encodedText}`;
      
    window.open(url, '_blank');
    showToast('Opening X (Twitter) with card preload! 🐦');
  } 
  else if (platform === 'reddit') {
    const redditTitle = share.won
      ? `[ValTracker] Secured an epic ${share.scoreText} VICTORY on ${share.mapName.toUpperCase()} playing as ${share.agentName.toUpperCase()}!`
      : `[ValTracker] Hard-fought match on ${share.mapName.toUpperCase()} as ${share.agentName.toUpperCase()} (${share.scoreText})`;
    const title = encodeURIComponent(redditTitle);
    
    // Append cache-buster so Reddit crawlers fetch fresh metadata from Render server
    const shareUrlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
    
    const url = shareUrl 
      ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(shareUrlWithBuster)}&title=${title}`
      : `https://www.reddit.com/r/VALORANT/submit?title=${title}&text=${encodedText}`;
    window.open(url, '_blank');
    showToast('Opening Reddit!');
  }
};

window.closeShareModal = function() {
  document.getElementById('share-modal-overlay').classList.remove('open');
  window._currentMatchShare = null;
};



// ══════════════════════════════════════════
//   DEEP ANALYSIS ENGINE
// ══════════════════════════════════════════

async function runDeepAnalysis() {
  const btn     = document.getElementById('deep-btn');
  const loading = document.getElementById('deep-loading');
  const results = document.getElementById('deep-results');

  let matches = [];
  try { matches = await loadAllMatches(); } catch(e) {}
  if (!matches.length) { showToast('Fetch your stats first'); return; }

  btn.disabled = true;
  loading.classList.add('active');
  results.classList.remove('active');
  results.innerHTML = '';

  const msgs = ['PROCESSING MATCHES...','ANALYSING MAP DATA...','CALCULATING ATTACK/DEFENCE...','DETECTING PATTERNS...','BUILDING REPORT...'];
  let mi = 0;
  const iv = setInterval(() => {
    document.getElementById('deep-loading-txt').textContent = msgs[++mi % msgs.length];
  }, 700);

  await new Promise(r => setTimeout(r, 800));

  try {
    const html = buildDeepAnalysis(matches);
    results.innerHTML = html;
    results.style.display = '';
    results.classList.add('active');
    showToast('Deep analysis complete ✓');
  } catch(e) {
    results.innerHTML = `<div class="no-detail" style="color:var(--loss);padding:16px">Analysis error: ${escapeHtml(e.message)}</div>`;
    results.style.display = '';
    results.classList.add('active');
    console.error(e);
  } finally {
    clearInterval(iv);
    loading.classList.remove('active');
    btn.disabled = false;
    btn.innerHTML = '🔄 Re-analyse';
  }
}

function buildDeepAnalysis(matches) {
  const mmrH = window._mmrHistory || {};

  // ── Collect rich per-match data ──
  const data = [];
  matches.forEach(match => {
    const me = findMe(match);
    if (!me) return;
    const s = me.stats || {};
    const k = s.kills||0, d = s.deaths||0, a = s.assists||0, sc = s.score||0;
    const hs = s.headshots||0, shots = (s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
    const myTeamId = (me.team||'').toLowerCase();
    const _mt = match.teams?.[myTeamId], _ot = match.teams?.[myTeamId==='red'?'blue':'red'];
    const won = _mt?.has_won != null
      ? (_mt.has_won === true || _mt.has_won === 'true')
      : (_mt?.rounds_won != null && _ot?.rounds_won != null)
        ? _mt.rounds_won > _ot.rounds_won : false;
    const agent = me.character || 'Unknown';
    const map = match.metadata?.map || 'Unknown';
    const matchId = match.metadata?.matchid || match.metadata?.match_id || '';
    const rr = mmrH[matchId];
    const rounds = match.rounds || [];
    const myTeam = match.teams?.[myTeamId] || {};
    const oppId = myTeamId==='red'?'blue':'red';
    const oppTeam = match.teams?.[oppId] || {};
    const myRoundsWon = myTeam.rounds_won ?? 0;
    const oppRoundsWon = oppTeam.rounds_won ?? 0;
    const acs = Math.round(sc / 100);
    const hsPct = shots ? Math.round((hs/shots)*100) : 0;
    const role = getRoleClass(agent);
    const gameStart = match.metadata?.game_start || null;

    // Attack vs defence — estimated from score + team data
    // v3 API doesn't have per-round player kills, so we derive from round wins
    // Valorant: first 12 rounds one side attacks, second 12 the other (then OT)
    const totalRounds = myRoundsWon + oppRoundsWon;
    let atkWins = 0, defWins = 0, atkRoundsPlayed = 0, defRoundsPlayed = 0;

    // Determine which half my team attacked
    const modeName = (match.metadata?.mode || '').toLowerCase();
    let halfSize = 12;
    if (modeName.includes('swiftplay')) {
      halfSize = 4;
    } else if (modeName.includes('spike rush')) {
      halfSize = 3;
    }
    const myTeamAttacksFirst = myTeamId === 'red';
    const regularRounds = Math.min(totalRounds, halfSize * 2);
    const half = Math.min(halfSize, regularRounds);
    const secondHalf = Math.max(0, regularRounds - halfSize);

    // First half
    const firstHalfAtk = myTeamAttacksFirst;
    // We don't have per-round data, so split wins proportionally by half
    // Use team round wins from each half if available, else split evenly
    const myTeamData = match.teams?.[myTeamId] || {};
    const oppTeamData = match.teams?.[oppId] || {};

    // Try to get per-half data from v3 (some versions expose rounds_won_in_regulation)
    // Fallback: assume kills split proportionally between halves
    // Attack half round wins ≈ total rounds * WR on that side
    // Best we can do without per-round data: proportional split
    const totalKills = k; // total kills this match

    if (firstHalfAtk) {
      atkRoundsPlayed = half;
      defRoundsPlayed = secondHalf;
    } else {
      defRoundsPlayed = half;
      atkRoundsPlayed = secondHalf;
    }

    // Estimate round wins per half from total round wins
    // rough: split round wins proportionally by rounds played each half
    if (totalRounds > 0) {
      const atkFrac = atkRoundsPlayed / totalRounds;
      const defFrac = defRoundsPlayed / totalRounds;
      atkWins = Math.round(myRoundsWon * atkFrac);
      defWins = myRoundsWon - atkWins;
      // Kills: split proportionally too
    }

    // Kills per side: split total kills by round proportion
    const atkKills = atkRoundsPlayed > 0 ? Math.round(totalKills * (atkRoundsPlayed / Math.max(totalRounds,1))) : 0;
    const defKills = totalKills - atkKills;

    data.push({ k, d, a, sc, hs, shots, acs, hsPct, won, agent, map, matchId, rr, role,
                atkKills, defKills, atkRoundsPlayed, defRoundsPlayed, atkWins, defWins,
                myRoundsWon, oppRoundsWon, gameStart, myTeamId });
  });

  if (!data.length) return '<div class="no-detail">Not enough data</div>';

  const n = data.length;
  const mmSep = 1; // chapter separator helper
  let html = '';

  // ════════════════════════════════
  // CHAPTER 1 — MAP DEEP DIVE
  // ════════════════════════════════
  html += chapter('🗺️', 'Map Performance Deep Dive');

  const mapStats = {};
  data.forEach(d => {
    if (!mapStats[d.map]) mapStats[d.map] = { m:0,w:0,k:0,de:0,sc:0,hs:0,sh:0,atkK:0,defK:0,atkW:0,defW:0,atkR:0,defR:0,rr:0,hasRR:false };
    const ms = mapStats[d.map];
    ms.m++; if(d.won)ms.w++; ms.k+=d.k; ms.de+=d.d; ms.sc+=d.sc;
    ms.hs+=d.hs; ms.sh+=d.shots; ms.atkK+=d.atkKills; ms.defK+=d.defKills;
    ms.atkW+=d.atkWins; ms.defW+=d.defWins; ms.atkR+=d.atkRoundsPlayed; ms.defR+=d.defRoundsPlayed;
    if (d.rr !== undefined) { ms.rr += d.rr; ms.hasRR = true; }
  });

  const mapRows = Object.entries(mapStats)
    .filter(([,ms]) => ms.m >= 1)
    .sort((a,b) => b[1].m - a[1].m);

  // Map table
  html += `<div class="deep-card span3" style="grid-column:span 3;"><div class="deep-card-label">All Maps — Performance Breakdown</div>
  <table class="deep-map-table">
    <thead><tr>
      <th>Map</th><th>W/L</th><th>WR%</th><th>K/D</th><th>ACS</th><th>HS%</th><th>Atk WR%</th><th>Def WR%</th>${mapRows.some(([,ms])=>ms.hasRR)?'<th>RR</th>':''}
    </tr></thead><tbody>`;

  mapRows.forEach(([mapName, ms]) => {
    const wr = Math.round((ms.w/ms.m)*100);
    const kd = ms.de ? (ms.k/ms.de).toFixed(2) : ms.k;
    const acs = Math.round(ms.sc/ms.m/100);
    const hsPct = ms.sh ? Math.round((ms.hs/ms.sh)*100) : 0;
    const atkWR = ms.atkR ? Math.round((ms.atkW/ms.atkR)*100) : null;
    const defWR = ms.defR ? Math.round((ms.defW/ms.defR)*100) : null;
    const verdict = wr >= 55 ? 'strong' : wr >= 45 ? 'avg' : 'weak';
    const verdictTxt = wr >= 55 ? 'Strong' : wr >= 45 ? 'Average' : 'Weak';
    const wrCol = wr >= 55 ? 'color:var(--win)' : wr < 45 ? 'color:var(--loss)' : 'color:#f5a623';
    const kdCol = parseFloat(kd) >= 1.2 ? 'color:var(--win)' : parseFloat(kd) < 0.9 ? 'color:var(--loss)' : '';
    const rrTxt = ms.hasRR ? `<span style="${ms.rr>0?'color:var(--win)':ms.rr<0?'color:var(--loss)':''}">${ms.rr>0?'+':''}${ms.rr}</span>` : '';
    html += `<tr>
      <td><span class="deep-map-row-name">${mapName}</span><span class="deep-map-verdict ${verdict}">${verdictTxt}</span></td>
      <td>${ms.w}W / ${ms.m-ms.w}L</td>
      <td style="${wrCol};font-weight:800">${wr}%</td>
      <td style="${kdCol}">${kd}</td>
      <td>${acs}</td>
      <td style="${hsPct<15?'color:var(--loss)':hsPct>=25?'color:var(--win)':''}">${hsPct}%</td>
      <td style="${atkWR!==null&&atkWR<45?'color:var(--loss)':atkWR>=55?'color:var(--win)':''}">${atkWR !== null ? atkWR+'%' : '—'}</td>
      <td style="${defWR!==null&&defWR<45?'color:var(--loss)':defWR>=55?'color:var(--win)':''}">${defWR !== null ? defWR+'%' : '—'}</td>
      ${mapRows.some(([,ms])=>ms.hasRR) ? `<td>${rrTxt||'—'}</td>` : ''}
    </tr>`;
  });
  html += `</tbody></table></div>`;

  // Best/worst map insight cards
  const sorted = [...mapRows].sort((a,b) => (b[1].w/b[1].m) - (a[1].w/a[1].m));
  const bestMap = sorted[0], worstMap = sorted[sorted.length-1];
  if (bestMap) {
    const [bName, bMs] = bestMap;
    const bWR = Math.round((bMs.w/bMs.m)*100);
    html += `<div class="deep-insight-grid cols2">`;
    html += deepCard('Best Map', bName.toUpperCase(), `${bWR}% WR · ${bMs.m} games`, 'good', 'accent-green');
    if (worstMap && worstMap[0] !== bName) {
      const [wName, wMs] = worstMap;
      const wWR = Math.round((wMs.w/wMs.m)*100);
      const atkIssue = wMs.atkR > 0 && Math.round((wMs.atkW/wMs.atkR)*100) < 40;
      const defIssue = wMs.defR > 0 && Math.round((wMs.defW/wMs.defR)*100) < 40;
      const issue = atkIssue && defIssue ? 'Both sides' : atkIssue ? 'Attack side' : defIssue ? 'Defence side' : 'Win rate';
      html += deepCard('Worst Map', wName.toUpperCase(), `${wWR}% WR · ${issue} is the issue`, 'bad', 'accent-red');
    }
    html += `</div>`;
  }

  // ════════════════════════════════
  // CHAPTER 2 — ATTACK vs DEFENCE
  // ════════════════════════════════
  html += chapter('⚔️', 'Attack vs Defence');

  let totAtkK=0,totDefK=0,totAtkW=0,totDefW=0,totAtkR=0,totDefR=0;
  data.forEach(d=>{totAtkK+=d.atkKills;totDefK+=d.defKills;totAtkW+=d.atkWins;totDefW+=d.defWins;totAtkR+=d.atkRoundsPlayed;totDefR+=d.defRoundsPlayed;});
  const atkWR = totAtkR ? Math.round((totAtkW/totAtkR)*100) : 0;
  const defWR = totDefR ? Math.round((totDefW/totDefR)*100) : 0;
  const atkKPR = totAtkR ? (totAtkK/totAtkR).toFixed(2) : 0;
  const defKPR = totDefR ? (totDefK/totDefR).toFixed(2) : 0;
  const atkStronger = atkWR >= defWR;
  const gap = Math.abs(atkWR - defWR);

  html += `<div class="deep-insight-grid cols4">`;
  html += deepCard('Attack WR', atkWR+'%', `${totAtkW}W / ${totAtkR-totAtkW}L · ${atkKPR} KPR`, atkWR>=50?'good':atkWR>=42?'warn':'bad', atkStronger?'accent-green':'');
  html += deepCard('Defence WR', defWR+'%', `${totDefW}W / ${totDefR-totDefW}L · ${defKPR} KPR`, defWR>=50?'good':defWR>=42?'warn':'bad', !atkStronger?'accent-green':'');
  html += deepCard('Avg Kills Atk Half', (totAtkK/Math.max(data.length,1)).toFixed(1), `${atkKPR} est. KPR`, parseFloat(atkKPR)>=0.7?'good':parseFloat(atkKPR)>=0.5?'warn':'bad', '');
  html += deepCard('Avg Kills Def Half', (totDefK/Math.max(data.length,1)).toFixed(1), `${defKPR} est. KPR`, parseFloat(defKPR)>=0.7?'good':parseFloat(defKPR)>=0.5?'warn':'bad', '');
  html += `</div>`;
  html += `<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);letter-spacing:1px;padding:2px 0 6px;">* Kill split estimated from match totals — expand matches and load full details for exact per-round data</div>`;

  // Pattern insights
  const atkDefPatterns = [];
  if (gap >= 15) {
    const weak = atkStronger ? 'defence' : 'attack';
    const strong = atkStronger ? 'attack' : 'defence';
    atkDefPatterns.push({ dot:'r', text: `Your ${weak} side is significantly weaker (${atkStronger?defWR:atkWR}% WR vs ${atkStronger?atkWR:defWR}% on ${strong}). This is your biggest macro problem — ${weak === 'defence' ? 'you likely over-rotate or hold passive angles that get walked onto' : 'you likely play default too slow or fail to execute site takes'}.` });
  } else if (gap < 8) {
    atkDefPatterns.push({ dot:'g', text: `Your attack and defence win rates are balanced (${atkWR}% atk / ${defWR}% def) — you adapt well to both halves.` });
  }
  if (parseFloat(atkKPR) < 0.55) atkDefPatterns.push({ dot:'r', text:`Low attack KPR (${atkKPR}) — you struggle to find entry kills. Try to take space with utility first, then duel. Duelists who wait for info on attack become anchors.` });
  if (parseFloat(defKPR) < 0.55) atkDefPatterns.push({ dot:'r', text:`Low defence KPR (${defKPR}) — you might be overaggressing on defence and dying before enemies even take site, or holding exposed angles that get flashed.` });
  if (atkDefPatterns.length) html += patternCard(atkDefPatterns);

  // ════════════════════════════════
  // CHAPTER 3 — AGENT-MAP FIT
  // ════════════════════════════════
  html += chapter('🎭', 'Agent-Map Mismatch Analysis');

  // Build agent × map win rates
  const agentMapMatrix = {};
  data.forEach(d => {
    const key = `${d.agent}|${d.map}`;
    if (!agentMapMatrix[key]) agentMapMatrix[key] = { agent:d.agent, map:d.map, m:0, w:0, k:0, de:0, sc:0, role:d.role };
    const e = agentMapMatrix[key];
    e.m++; if(d.won)e.w++; e.k+=d.k; e.de+=d.d; e.sc+=d.sc;
  });

  // Find mismatches (played 2+ times, WR < 40%) and good fits (WR >= 60%)
  const mismatches = [], goodFits = [];
  Object.values(agentMapMatrix).forEach(e => {
    if (e.m < 2) return;
    const wr = Math.round((e.w/e.m)*100);
    const kd = e.de ? (e.k/e.de).toFixed(2) : e.k;
    const acs = Math.round(e.sc/e.m/100);
    if (wr <= 35) mismatches.push({ ...e, wr, kd, acs });
    else if (wr >= 65) goodFits.push({ ...e, wr, kd, acs });
  });
  mismatches.sort((a,b) => a.wr - b.wr);
  goodFits.sort((a,b) => b.wr - a.wr);

  const mismatchTips = {
    duelist:   map => `${map} may not suit your aggressive style on this agent — study common entry paths, or swap to a more utility-heavy duelist.`,
    initiator: map => `Initiator value depends on coordinated execute — on ${map}, ensure you use recon/flashes before every push, not reactively.`,
    controller:map => `Your smoke lineup knowledge on ${map} may be lacking — learn 2-3 key smokes for default plant and site execute.`,
    sentinel:  map => `Sentinel anchoring on ${map} requires specific trip/cam placements — study pro setups for this map with your agent.`,
  };

  html += `<div class="deep-card span3" style="grid-column:span 3;"><div class="deep-card-label">⚠️ Problem Combinations (≥2 games, ≤35% WR)</div>`;
  if (!mismatches.length) {
    html += `<div style="color:var(--win);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">No significant mismatches found — nice!</div>`;
  } else {
    mismatches.slice(0,5).forEach(e => {
      const tip = mismatchTips[e.role] ? mismatchTips[e.role](e.map) : `Consider a different agent on ${e.map}.`;
      html += `<div class="deep-mismatch-row">
        <span class="deep-mismatch-agent">${e.agent}</span>
        <span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span>
        <span class="deep-mismatch-stat" style="color:var(--loss)">${e.wr}% WR</span>
        <span class="deep-mismatch-stat">${e.kd} K/D</span>
        <span class="deep-mismatch-tag bad">${e.m} games</span>
        <span class="deep-mismatch-tip">${tip}</span>
      </div>`;
    });
  }
  html += `</div>`;

  html += `<div class="deep-card span3" style="grid-column:span 3;"><div class="deep-card-label">✅ Strong Combinations (≥2 games, ≥65% WR)</div>`;
  if (!goodFits.length) {
    html += `<div style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">Not enough data yet — play more matches with the same agent on the same map.</div>`;
  } else {
    goodFits.slice(0,4).forEach(e => {
      html += `<div class="deep-mismatch-row">
        <span class="deep-mismatch-agent">${e.agent}</span>
        <span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span>
        <span class="deep-mismatch-stat" style="color:var(--win)">${e.wr}% WR</span>
        <span class="deep-mismatch-stat">${e.kd} K/D</span>
        <span class="deep-mismatch-tag ok">${e.m} games</span>
        <span class="deep-mismatch-tip">This is a comfort combination — prioritise queueing this when you need RR.</span>
      </div>`;
    });
  }
  html += `</div>`;

  // ════════════════════════════════
  // CHAPTER 4 — IMPROVEMENT TREND
  // ════════════════════════════════
  html += chapter('📈', 'Improvement Over Time');

  // Split into thirds and compare
  const third = Math.floor(n/3)||1;
  const early = data.slice(n-third, n); // oldest
  const recent = data.slice(0, third);  // newest

  const avg = (arr, fn) => arr.length ? arr.reduce((s,x)=>s+fn(x),0)/arr.length : 0;
  const eKD  = avg(early,  d => d.d?(d.k/d.d):d.k);
  const rKD  = avg(recent, d => d.d?(d.k/d.d):d.k);
  const eWR  = avg(early,  d => d.won?1:0)*100;
  const rWR  = avg(recent, d => d.won?1:0)*100;
  const eACS = avg(early,  d => d.acs);
  const rACS = avg(recent, d => d.acs);
  const eHS  = avg(early,  d => d.hsPct);
  const rHS  = avg(recent, d => d.hsPct);

  const delta = (r,e) => { const d=r-e; return d>0?`▲ +${d.toFixed(1)}`:`▼ ${d.toFixed(1)}`; };
  const dCls  = (r,e) => r > e ? 'good' : r < e ? 'bad' : 'warn';

  html += `<div class="deep-insight-grid cols4">`;
  html += trendCard('K/D Trend', eKD.toFixed(2), rKD.toFixed(2), delta(rKD,eKD), dCls(rKD,eKD));
  html += trendCard('Win Rate Trend', Math.round(eWR)+'%', Math.round(rWR)+'%', delta(rWR,eWR), dCls(rWR,eWR));
  html += trendCard('ACS Trend', Math.round(eACS), Math.round(rACS), delta(rACS,eACS), dCls(rACS,eACS));
  html += trendCard('HS% Trend', Math.round(eHS)+'%', Math.round(rHS)+'%', delta(rHS,eHS), dCls(rHS,eHS));
  html += `</div>`;

  // Trend pattern insights
  const trendPatterns = [];
  if (rKD - eKD > 0.15) trendPatterns.push({dot:'g', text:`Your K/D has improved by ${(rKD-eKD).toFixed(2)} — you are winning duels more consistently than before. Keep the habits that changed.`});
  else if (eKD - rKD > 0.15) trendPatterns.push({dot:'r', text:`Your K/D has dropped by ${(eKD-rKD).toFixed(2)} recently — this could indicate tilt, bad agent choices, or opponents adapting to your style. Review your last 5 losses.`});
  if (rWR - eWR > 8) trendPatterns.push({dot:'g', text:`Win rate up ${(rWR-eWR).toFixed(0)}% — your game sense and macro decisions are improving. You are closing out rounds better.`});
  else if (eWR - rWR > 8) trendPatterns.push({dot:'r', text:`Win rate down ${(eWR-rWR).toFixed(0)}% recently — could be a rank correction or tilt spiral. Take a break if you have lost 3+ in a row today.`});
  if (rHS - eHS > 5) trendPatterns.push({dot:'g', text:`Headshot rate improving (${Math.round(eHS)}% → ${Math.round(rHS)}%) — your crosshair placement is getting better. This directly improves your duel win rate.`});
  else if (eHS - rHS > 5) trendPatterns.push({dot:'r', text:`Headshot rate dropping (${Math.round(eHS)}% → ${Math.round(rHS)}%) — you may be spraying more under pressure. Focus on tap-firing first shot.`});
  if (!trendPatterns.length) trendPatterns.push({dot:'y', text:`Your performance is relatively stable across the tracked period. Consistency is good, but look for specific areas to push improvement.`});
  html += patternCard(trendPatterns);

  // ════════════════════════════════
  // CHAPTER 5 — DEATH PATTERN
  // ════════════════════════════════
  html += chapter('💀', 'Death Pattern Analysis');

  const totalDeaths = data.reduce((s,d)=>s+d.d,0);
  const avgDeaths = (totalDeaths/n).toFixed(1);
  const highDeathGames = data.filter(d=>d.d>=16).length;
  const lowDeathGames  = data.filter(d=>d.d<=9).length;
  const highDeathWR    = data.filter(d=>d.d>=16).filter(d=>d.won).length;
  const lowDeathWR     = data.filter(d=>d.d<=9).filter(d=>d.won).length;
  const winRateHighD   = highDeathGames ? Math.round((highDeathWR/highDeathGames)*100) : 0;
  const winRateLowD    = lowDeathGames  ? Math.round((lowDeathWR /lowDeathGames )*100) : 0;

  html += `<div class="deep-insight-grid cols3">`;
  html += deepCard('Avg Deaths/Game', avgDeaths, parseFloat(avgDeaths)<=10?'Elite':parseFloat(avgDeaths)<=13?'Good':parseFloat(avgDeaths)<=16?'Average':'High',
    parseFloat(avgDeaths)<=10?'good':parseFloat(avgDeaths)<=13?'good':parseFloat(avgDeaths)<=16?'warn':'bad', '');
  html += deepCard('High Death Games', `${highDeathGames}/${n}`, `WR when dying 16+: ${winRateHighD}%`,
    winRateHighD < 35 ? 'bad' : 'warn', highDeathGames > n*0.3 ? 'accent-red' : '');
  html += deepCard('Low Death Games', `${lowDeathGames}/${n}`, `WR when dying ≤9: ${winRateLowD}%`,
    winRateLowD >= 65 ? 'good' : 'warn', '');
  html += `</div>`;

  const deathPatterns = [];
  if (winRateLowD - winRateHighD > 25) deathPatterns.push({dot:'y', text:`You win ${winRateLowD-winRateHighD}% more often in low-death games — death count is your strongest win predictor. Every death you prevent is worth more than an extra kill.`});
  if (parseFloat(avgDeaths) >= 15) deathPatterns.push({dot:'r', text:`Averaging ${avgDeaths} deaths/game is high for ranked. The #1 fix: before every duel, ask "do I have angle advantage, utility advantage, or intel?" If no — don't peek.`});
  if (highDeathGames > n * 0.35) deathPatterns.push({dot:'r', text:`${Math.round((highDeathGames/n)*100)}% of your games have 16+ deaths — these are probably tilt games or agent mismatches. Add a "3 deaths in 5 rounds = refocus" rule.`});
  if (deathPatterns.length) html += patternCard(deathPatterns);

  // ════════════════════════════════
  // CHAPTER 6 — TOP PRIORITIES
  // ════════════════════════════════
  html += chapter('🎯', 'Your Top Improvement Priorities');

  const priorities = [];

  // Score each issue
  const overallKD = data.reduce((s,d)=>s+d.d?(d.k/d.d):d.k,0)/n;
  const overallWR = data.filter(d=>d.won).length/n*100;
  const overallHS = data.reduce((s,d)=>s+d.hsPct,0)/n;
  const overallACS = data.reduce((s,d)=>s+d.acs,0)/n;
  const atkDefGap = Math.abs(atkWR - defWR);

  if (overallHS < 16) priorities.push({
    title: 'Headshot Rate',
    desc: `${Math.round(overallHS)}% HS rate is below the Silver/Gold threshold (~20%). This is the fastest stat to improve: spend 10 min daily in Aimlab on Microshot (head-only mode). Stop spraying — one tap, check if head level, then shoot.`,
    score: 3
  });
  if (parseFloat(avgDeaths) >= 15) priorities.push({
    title: 'Death Reduction',
    desc: `${avgDeaths} avg deaths is costing you rounds and ACS. Identify the 2-3 angles where you die most per session and either avoid them or approach with utility. Fewer deaths = more rounds alive = more wins.`,
    score: 3
  });
  if (atkDefGap >= 15) priorities.push({
    title: `${atkStronger?'Defence':'Attack'} Side Mechanics`,
    desc: `${atkStronger?defWR:atkWR}% WR on ${atkStronger?'defence':'attack'} vs ${atkStronger?atkWR:defWR}% on the other side — a 15%+ gap means one half is losing games for you. Watch 2 VoDs specifically of your worst half and identify the pattern.`,
    score: 2
  });
  if (mismatches.length >= 2) priorities.push({
    title: 'Agent-Map Pool Optimisation',
    desc: `You have ${mismatches.length} agent-map combos with ≤35% WR. Either learn the correct utility lineups for those maps, or ban/avoid them. Your strongest combo is ${goodFits[0]?.agent||'—'} on ${goodFits[0]?.map||'—'} (${goodFits[0]?.wr||'—'}% WR) — queue that more.`,
    score: 2
  });
  if (overallWR < 47) priorities.push({
    title: 'Round Closing',
    desc: `${Math.round(overallWR)}% win rate means you're losing more than you win. Individual stats are secondary — focus on not forcing when ahead, playing for post-plant, and not giving up eco rounds.`,
    score: 2
  });
  if (rKD < eKD - 0.1) priorities.push({
    title: 'Tilt & Consistency Management',
    desc: `Your K/D has dropped recently. Play max 2 ranked games per session until the trend reverses. Unranked/deathmatch in between ranked games to stay warm.`,
    score: 1
  });

  // Always add a VoD priority
  priorities.push({
    title: 'VoD Review Habit',
    desc: `Record your games with OBS. After every loss, watch only the rounds you died in — from the enemy perspective if possible. Even 10 minutes of VoD review per session accelerates improvement faster than playing 3 extra games.`,
    score: 1
  });

  priorities.sort((a,b) => b.score - a.score);

  html += `<div class="deep-priority"><div class="deep-priority-label">⚡ Do These In Order</div><div class="deep-priority-list">`;
  priorities.slice(0, 5).forEach((p, i) => {
    html += `<div class="deep-priority-item">
      <div class="deep-priority-num">${i+1}</div>
      <div class="deep-priority-text">
        <div class="deep-priority-title">${p.title}</div>
        <div class="deep-priority-desc">${p.desc}</div>
      </div>
    </div>`;
  });
  html += `</div></div>`;

  return html;
}

// ── RENDER HELPERS ──
function chapter(icon, title) {
  return `<div class="deep-chapter"><span class="deep-chapter-icon">${icon}</span><span class="deep-chapter-title">${title}</span><div class="deep-chapter-line"></div></div>`;
}

function deepCard(label, val, sub, valCls, accentCls) {
  return `<div class="deep-card ${accentCls||''}">
    <div class="deep-card-label">${label}</div>
    <div class="deep-card-val ${valCls||''}">${val}</div>
    <div class="deep-card-sub">${sub}</div>
  </div>`;
}

function trendCard(label, oldVal, newVal, delta, deltaCls) {
  const isUp = delta.includes('▲');
  return `<div class="deep-card">
    <div class="deep-card-label">${label}</div>
    <div style="display:flex;align-items:flex-end;gap:8px;margin-top:4px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;line-height:1;">${newVal}</div>
      <div style="margin-bottom:4px;">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:${isUp?'var(--win)':'var(--loss)'};">${delta}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">was ${oldVal}</div>
      </div>
    </div>
  </div>`;
}

function patternCard(patterns) {
  return `<div class="deep-card span3" style="grid-column:span 3;">
    <div class="deep-pattern-list">
      ${patterns.map(p=>`<div class="deep-pattern-item"><div class="deep-pattern-dot ${p.dot}"></div><div>${p.text}</div></div>`).join('')}
    </div>
  </div>`;
}

// ══════════════════════════════════════════
//   STAT TREND MODAL
// ══════════════════════════════════════════

let _statChartInstance = null;

const STAT_CONFIG = {
  kd:     { label: 'K/D Ratio',    color: '#e8ff47', fn: m => m.deaths ? +(m.kills/m.deaths).toFixed(2) : m.kills, fmt: v => v.toFixed(2), good: v => v >= 1.0 },
  kills:  { label: 'Kills',        color: '#3ecf8e', fn: m => m.kills,                                              fmt: v => v,            good: v => v >= 15  },
  deaths: { label: 'Deaths',       color: '#ff5757', fn: m => m.deaths,                                             fmt: v => v,            good: v => v <= 12  },
  assists:{ label: 'Assists',      color: '#60a5fa', fn: m => m.assists,                                            fmt: v => v,            good: v => v >= 4   },
  acs:    { label: 'ACS',          color: '#a78bfa', fn: m => Math.round((m.score||0)/100),                        fmt: v => v,            good: v => v >= 200 },
  hs:     { label: 'HS %',         color: '#fb923c', fn: m => m.shots ? Math.round((m.hs/m.shots)*100) : 0,        fmt: v => v+'%',        good: v => v >= 20  },
};

function openStatModal(statKey) {
  const cfg = STAT_CONFIG[statKey];
  const matches = window._recentMatchStats || [];
  if (!matches.length) { showToast('Fetch stats first'); return; }
  const isMobile = window.innerWidth <= 600;

  const values = matches.map(cfg.fn);
  const avg = values.reduce((s,v)=>s+v,0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const last5avg = values.slice(-5).reduce((s,v)=>s+v,0) / Math.min(5, values.length);
  const trend = last5avg > avg ? '▲ Improving' : last5avg < avg - (avg*0.05) ? '▼ Declining' : '→ Stable';
  const trendCol = last5avg > avg ? 'var(--win)' : last5avg < avg - (avg*0.05) ? 'var(--loss)' : 'var(--muted)';

  document.getElementById('stat-modal-title').textContent = cfg.label + ' — Per Match Trend';
  document.getElementById('stat-modal-count').textContent = matches.length;
  document.getElementById('stat-modal-avgs').innerHTML = `
    <div class="stat-modal-avg">AVG <span>${cfg.fmt(+avg.toFixed(2))}</span></div>
    <div class="stat-modal-avg">BEST <span style="color:var(--win)">${cfg.fmt(max)}</span></div>
    <div class="stat-modal-avg">WORST <span style="color:var(--loss)">${cfg.fmt(min)}</span></div>
    <div class="stat-modal-avg">LAST 5 AVG <span>${cfg.fmt(+last5avg.toFixed(2))}</span></div>
    <div class="stat-modal-avg">TREND <span style="color:${trendCol}">${trend}</span></div>
  `;

  // Labels: match number + agent abbrev
  const labels = matches.map((m, i) => {
    const ag = (m.agentName||'').substring(0,3).toUpperCase();
    return `#${i+1} ${ag}`;
  });

  // Bar colors: green if good, red if bad, accent if neutral
  const barColors = values.map(v =>
    cfg.good(v) ? 'rgba(62,207,142,0.75)' : 'rgba(255,87,87,0.65)'
  );
  // Highlight last 5
  const borderColors = values.map((v, i) =>
    i >= values.length - 5 ? cfg.color : 'transparent'
  );

  document.getElementById('stat-modal-overlay').classList.add('open');
  const _scrollY = window.scrollY;
  document.documentElement.style.setProperty('--scroll-y', `-${_scrollY}px`);
  document.body.classList.add('modal-open');

  // Destroy previous chart
  if (_statChartInstance) { _statChartInstance.destroy(); _statChartInstance = null; }

  const ctx = document.getElementById('stat-chart-canvas').getContext('2d');

  _statChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: cfg.label,
          data: values,
          backgroundColor: barColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 3,
          borderSkipped: false,
        },
        {
          label: 'Average',
          data: values.map(() => +avg.toFixed(2)),
          type: 'line',
          borderColor: cfg.color,
          borderWidth: 1.5,
          borderDash: [4, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1f',
          borderColor: '#2a2a2f',
          borderWidth: 1,
          titleColor: '#888',
          bodyColor: '#f0f0f2',
          titleFont: { family: 'DM Mono', size: 9 },
          bodyFont: { family: 'Barlow Condensed', size: 15, weight: '700' },
          padding: 10,
          callbacks: {
            title: (items) => {
              const m = matches[items[0].dataIndex];
              return `${m.agentName} on ${m.map} · ${m.won?'WIN':'LOSS'}`;
            },
            label: (item) => {
              if (item.datasetIndex === 1) return `Avg: ${cfg.fmt(item.raw)}`;
              const m = matches[item.dataIndex];
              return `${cfg.label}: ${cfg.fmt(item.raw)}  |  K/D/A: ${m.kills}/${m.deaths}/${m.assists}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: !isMobile, color: 'rgba(255,255,255,0.04)' },
          ticks: {
            display: !isMobile,
            color: '#555',
            font: { family: 'DM Mono', size: 8 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: {
            color: '#666',
            font: { family: 'DM Mono', size: 9 },
            callback: v => cfg.fmt(v)
          },
          min: statKey === 'kd' ? 0 : undefined,
        }
      }
    }
  });
}

function closeStatModal() {
  document.getElementById('stat-modal-overlay').classList.remove('open');
  if (_statChartInstance) { _statChartInstance.destroy(); _statChartInstance = null; }
  document.body.classList.remove('modal-open');
  const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

// Close on Escape
document.addEventListener('keydown', e => { 
  if (e.key === 'Escape') {
    closeStatModal();
    closeBookmarksModal();
    if (document.getElementById('leaderboard-modal')) document.getElementById('leaderboard-modal').style.display = 'none';
    if (document.getElementById('h2h-modal')) document.getElementById('h2h-modal').style.display = 'none';
  }
});


// ══════════════════════════════════════════
//   PERFORMANCE LAB — SECTION 09
// ══════════════════════════════════════════

// Rank benchmarks: [kd, wr%, acs, hs%]
const RANK_BENCHMARKS = {
  'Iron':       { kd:0.75, wr:44, acs:110, hs:12, label:'Iron' },
  'Bronze':     { kd:0.88, wr:46, acs:135, hs:14, label:'Bronze' },
  'Silver':     { kd:1.00, wr:48, acs:155, hs:17, label:'Silver' },
  'Gold':       { kd:1.12, wr:50, acs:175, hs:20, label:'Gold' },
  'Platinum':   { kd:1.22, wr:51, acs:195, hs:22, label:'Platinum' },
  'Diamond':    { kd:1.35, wr:52, acs:215, hs:24, label:'Diamond' },
  'Ascendant':  { kd:1.50, wr:53, acs:240, hs:26, label:'Ascendant' },
  'Immortal':   { kd:1.65, wr:54, acs:265, hs:28, label:'Immortal' },
  'Radiant':    { kd:1.85, wr:56, acs:290, hs:30, label:'Radiant' },
};
const RANK_ORDER = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];

function getRankTier(rankName) {
  if (!rankName) return 'Silver';
  return RANK_ORDER.find(r => rankName.startsWith(r)) || 'Silver';
}
function getNextRank(tier) {
  const idx = RANK_ORDER.indexOf(tier);
  return idx < RANK_ORDER.length-1 ? RANK_ORDER[idx+1] : null;
}

async function runPerfLab() {
  const btn = document.getElementById('plab-btn');
  const loading = document.getElementById('plab-loading');
  const results = document.getElementById('plab-results');
  let matches = [];
  try { matches = await loadAllMatches(); } catch(e) {
    console.error('Performance Lab: loadAllMatches failed:', e);
    showToast('Failed to load match data.');
    return;
  }
  if (!matches.length) { showToast('Fetch your stats first'); return; }

  btn.disabled = true;
  loading.classList.add('active');
  results.classList.remove('active');
  results.innerHTML = '';

  const msgs = ['ANALYSING DUELS...','READING ECONOMY...','DETECTING TILT...','MAPPING TIME PATTERNS...','BENCHMARKING VS RANK...','BUILDING PREDICTIONS...'];
  let mi = 0;
  const iv = setInterval(() => { document.getElementById('plab-loading-txt').textContent = msgs[++mi % msgs.length]; }, 600);

  await new Promise(r => setTimeout(r, 700));

  try {
    results.innerHTML = buildPerfLab(matches);
    results.style.display = '';
    results.classList.add('active');
    showToast('Performance Lab complete ✓');
  } catch(e) {
    results.innerHTML = `<div style="padding:16px;color:var(--loss);font-family:'DM Mono',monospace;font-size:11px;">Error: ${escapeHtml(e.message)}</div>`;
    results.style.display = '';
    results.classList.add('active');
    console.error(e);
  } finally {
    clearInterval(iv);
    loading.classList.remove('active');
    btn.disabled = false;
    btn.innerHTML = '🔄 Re-run';
  }
}

function buildPerfLab(matches) {
  // ── Build per-match stats ──
  const data = [];
  matches.forEach(match => {
    const me = findMe(match);
    if (!me) return;
    const s = me.stats || {};
    const k = s.kills||0, d = s.deaths||0, a = s.assists||0, sc = s.score||0;
    const hs = s.headshots||0, shots = (s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
    const myTeamId = (me.team||'').toLowerCase();
    const _mt = match.teams?.[myTeamId], _ot = match.teams?.[myTeamId==='red'?'blue':'red'];
    const won = _mt?.has_won != null
      ? (_mt.has_won === true || _mt.has_won === 'true')
      : (_mt?.rounds_won != null && _ot?.rounds_won != null)
        ? _mt.rounds_won > _ot.rounds_won : false;
    const myTeam = match.teams?.[myTeamId] || {};
    const oppTeam = match.teams?.[myTeamId==='red'?'blue':'red'] || {};
    const myRounds = myTeam.rounds_won || 0;
    const oppRounds = oppTeam.rounds_won || 0;
    const totalRounds = myRounds + oppRounds;
    const agent = me.character || 'Unknown';
    const map = match.metadata?.map || 'Unknown';
    const matchId = match.metadata?.matchid || match.metadata?.match_id || '';
    const gameStart = match.metadata?.game_start || null;
    const acs = totalRounds ? Math.round(sc / totalRounds) : Math.round(sc/100);
    const hsPct = shots ? Math.round((hs/shots)*100) : 0;
    const kd = d ? k/d : k;
    const rr = (window._mmrHistory||{})[matchId];
    const allPlayers = getPlayerList(match);
    // Economy: look at all players for rough economy type hints
    // We approximate: if score < 120 avg per round = likely eco/force
    const roundsArr = match.rounds || [];
    data.push({ k, d, a, sc, hs, shots, acs, hsPct, kd, won, agent, map, matchId, gameStart, rr,
                myRounds, oppRounds, totalRounds, allPlayers, rounds: roundsArr, myTeamId, me });
  });

  if (!data.length) return '<div class="no-detail">Not enough data</div>';
  const n = data.length;
  let html = '';

  // ────────────────────────────────────────
  // 1. TILT DETECTION  (runs first — most urgent)
  // ────────────────────────────────────────
  const mmrH = window._mmrHistory || {};
  const recentRR = data.slice(0, 5).map(d => d.rr).filter(r => r !== undefined);
  const recentWins = data.slice(0, 5).filter(d => d.won).length;
  const recentLosses = 5 - recentWins;
  const rrLast5 = recentRR.reduce((s,v)=>s+v,0);
  const currentStreak = (() => {
    let count = 0, type = data[0]?.won ? 'win' : 'loss';
    for (const m of data) { if (m.won === (type==='win')) count++; else break; }
    return { count, type };
  })();
  const sessionMatches = data.filter(d => d.gameStart && isToday(d.gameStart));
  const sessionLosses = sessionMatches.filter(d => !d.won).length;

  // Show tilt alert if: 3+ loss streak OR 4+ losses today OR -80 RR in last 5
  const tiltLevel = currentStreak.type === 'loss' && currentStreak.count >= 3 ? 'high'
    : sessionLosses >= 3 ? 'medium'
    : rrLast5 < -60 ? 'medium'
    : null;

  html += plabChapter('🧠', 'Mental Game & Tilt Detection');
  if (tiltLevel) {
    const tiltMsg = tiltLevel === 'high'
      ? `You're on a ${currentStreak.count}-game loss streak right now. This is the #1 ranked improvement tip: stop playing. Every loss after 3 in a row is statistically more likely to continue. Take 30 min, do something else, come back fresh.`
      : sessionLosses >= 3
      ? `${sessionLosses} losses in today's session. Your win rate drops significantly after the 3rd loss of a session — your mental model of the game degrades and you start forcing plays.`
      : `You've lost ${Math.abs(rrLast5)} RR in your last 5 games. This kind of downswing is a tilt signal even if individual games felt close.`;
    html += `<div class="plab-tilt-alert">
      <div class="plab-tilt-icon">${tiltLevel==='high'?'🚨':'⚠️'}</div>
      <div>
        <div class="plab-tilt-title">${tiltLevel==='high'?'STOP PLAYING NOW':'TILT WARNING'}</div>
        <div class="plab-tilt-desc">${tiltMsg}</div>
      </div>
    </div>`;
  } else {
    html += `<div class="plab-card good"><div class="plab-card-label">Mental State</div><div class="plab-card-val good">✓ Clear</div><div class="plab-card-sub">No tilt signals detected — good headspace to keep playing</div></div>`;
  }

  // Session stats
  const sessionKD = sessionMatches.length ? (sessionMatches.reduce((s,d)=>s+d.k,0)/Math.max(sessionMatches.reduce((s,d)=>s+d.d,0),1)).toFixed(2) : null;
  const sessionRR = sessionMatches.reduce((s,d)=>s+(d.rr||0),0);
  if (sessionMatches.length) {
    html += `<div class="plab-grid">`;
    html += plabCard('Today\'s Matches', sessionMatches.length, `${sessionMatches.filter(d=>d.won).length}W / ${sessionLosses}L`, sessionMatches.filter(d=>d.won).length >= sessionLosses ? 'good' : 'bad', '');
    html += plabCard('Session RR', (sessionRR > 0 ? '+' : '') + sessionRR, 'Today\'s net RR', sessionRR >= 0 ? 'good' : 'bad', '');
    if (sessionKD) html += plabCard('Session K/D', sessionKD, 'Today only', parseFloat(sessionKD) >= 1 ? 'good' : 'bad', '');
    html += plabCard('Current Streak', currentStreak.count + (currentStreak.type==='win'?' W':'L'), currentStreak.type==='win'?'Keep it going':'Take a break?', currentStreak.type==='win'?'good':'bad', '');
    html += `</div>`;
  }

  // ────────────────────────────────────────
  // 2. TIME OF DAY ANALYSIS
  // ────────────────────────────────────────
  html += plabChapter('🕐', 'Time of Day Performance');
  const hourBuckets = Array(24).fill(null).map(() => ({ m:0, w:0, rr:0 }));
  data.forEach(d => {
    if (!d.gameStart) return;
    const h = new Date(d.gameStart * 1000).getHours();
    hourBuckets[h].m++;
    if (d.won) hourBuckets[h].w++;
    if (d.rr !== undefined) hourBuckets[h].rr += d.rr;
  });
  const playedHours = hourBuckets.filter(b => b.m > 0);
  const maxGames = Math.max(...hourBuckets.map(b=>b.m), 1);
  const bestHour = hourBuckets.reduce((best,b,i) => b.m>=2 && (b.w/b.m) > (best.wr) ? {h:i, wr:b.w/b.m, m:b.m} : best, {h:-1,wr:0,m:0});
  const worstHour = hourBuckets.reduce((worst,b,i) => b.m>=2 && (b.w/b.m) < (worst.wr) ? {h:i, wr:b.w/b.m, m:b.m} : worst, {h:-1,wr:1,m:0});

  if (playedHours.length < 2) {
    html += `<div class="plab-card span4"><div class="plab-card-label">Time Data</div><div class="plab-card-sub" style="padding:8px 0">Not enough matches with timestamps yet — play more games and data will appear here.</div></div>`;
  } else {
    html += `<div class="plab-card span4"><div class="plab-card-label">Games & Win Rate by Hour (hover for details)</div>
    <div class="plab-heatmap" id="plab-heatmap">`;
    hourBuckets.forEach((b, h) => {
      const wr = b.m ? b.w/b.m : 0;
      const intensity = b.m / maxGames;
      const col = b.m === 0 ? 'var(--surface3)'
        : wr >= 0.6 ? `rgba(62,207,142,${0.15 + intensity*0.7})`
        : wr >= 0.45 ? `rgba(232,255,71,${0.1 + intensity*0.5})`
        : `rgba(255,87,87,${0.15 + intensity*0.6})`;
      const tt = b.m ? `${h}:00 — ${b.m} games, ${Math.round(wr*100)}% WR` : `${h}:00 — no games`;
      html += `<div class="plab-heat-cell" style="background:${col}" title="${tt}"></div>`;
    });
    html += `</div><div class="plab-heat-labels">`;
    hourBuckets.forEach((b,h) => {
      html += `<div class="plab-heat-label">${h%6===0?h:''}</div>`;
    });
    html += `</div></div>`;

    html += `<div class="plab-grid">`;
    if (bestHour.h >= 0) html += plabCard('Best Hour', `${bestHour.h}:00`, `${Math.round(bestHour.wr*100)}% WR · ${bestHour.m} games`, 'good', 'good');
    if (worstHour.h >= 0) html += plabCard('Worst Hour', `${worstHour.h}:00`, `${Math.round(worstHour.wr*100)}% WR · ${worstHour.m} games`, 'bad', 'bad');
    // Session length analysis
    const sessionGroups = {};
    data.forEach(d => {
      if (!d.gameStart) return;
      const dayKey = new Date(d.gameStart*1000).toDateString();
      if (!sessionGroups[dayKey]) sessionGroups[dayKey] = [];
      sessionGroups[dayKey].push(d);
    });
    const sessionLengths = Object.values(sessionGroups).filter(s => s.length >= 2);
    if (sessionLengths.length >= 2) {
      const earlyWR = sessionLengths.flatMap(s => s.slice(0,2)).filter(d=>d.won).length / Math.max(sessionLengths.flatMap(s=>s.slice(0,2)).length, 1);
      const lateWR  = sessionLengths.flatMap(s => s.slice(2)).filter(d=>d.won).length / Math.max(sessionLengths.flatMap(s=>s.slice(2)).length, 1);
      const fatigueDrop = earlyWR - lateWR;
      html += plabCard('Early Session WR', Math.round(earlyWR*100)+'%', 'Games 1-2 of session', earlyWR>=0.5?'good':'bad', '');
      html += plabCard('Late Session WR', Math.round(lateWR*100)+'%', fatigueDrop>0.1?'Drops after 2 games ⚠️':'Stays consistent', lateWR>=0.5?'good':fatigueDrop>0.1?'bad':'warn', fatigueDrop>0.1?'bad':'');
    }
    html += `</div>`;

    if (bestHour.h >= 0 || worstHour.h >= 0) {
      html += `<div class="plab-card span4"><div class="plab-patterns">`;
      if (bestHour.h >= 0) html += `<div class="plab-pattern"><div class="plab-dot g"></div><div>You perform best around <b>${bestHour.h}:00</b> — ${Math.round(bestHour.wr*100)}% WR in ${bestHour.m} games. Prioritise ranked at this time.</div></div>`;
      if (worstHour.h >= 0 && worstHour.h !== bestHour.h) html += `<div class="plab-pattern"><div class="plab-dot r"></div><div>You struggle around <b>${worstHour.h}:00</b> — ${Math.round(worstHour.wr*100)}% WR. Consider avoiding ranked at this time or only playing unranked.</div></div>`;
      html += `</div></div>`;
    }
  }

  // ────────────────────────────────────────
  // 3. DUEL ANALYSIS (estimated from available data)
  // ────────────────────────────────────────
  html += plabChapter('⚔️', 'Duel Analysis');

  const totalK = data.reduce((s,d)=>s+d.k,0);
  const totalD = data.reduce((s,d)=>s+d.d,0);
  const totalR = data.reduce((s,d)=>s+d.totalRounds,0);
  const avgKPR = totalR ? (totalK/totalR).toFixed(2) : 0;
  const avgDPR = totalR ? (totalD/totalR).toFixed(2) : 0;
  // Duel win %: rough model — kills/(kills+deaths)
  const duelWinPct = Math.round((totalK/(totalK+totalD))*100);
  // First blood proxy: matches where kills > 0 and kills in round 1
  // We estimate: high K games (20+) with wins = good opening duels
  const highKWins = data.filter(d=>d.k>=18&&d.won).length;
  const highKGames = data.filter(d=>d.k>=18).length;
  const openingWR = highKGames ? Math.round((highKWins/highKGames)*100) : null;
  // Trade ratio proxy: deaths that resulted in win (teammate traded) vs total deaths
  const tradedDeaths = data.filter(d=>!d.won).reduce((s,d)=>s+Math.floor(d.d*0.35),0); // rough estimate
  const multiKillGames = data.filter(d=>d.k>=4).length; // proxy for multi-kill rounds

  html += `<div class="plab-grid">`;
  html += plabCard('Duel Win %', duelWinPct+'%', `${totalK} kills vs ${totalD} deaths`, duelWinPct>=55?'good':duelWinPct>=45?'warn':'bad', duelWinPct>=55?'good':duelWinPct>=45?'warn':'bad');
  html += plabCard('Avg KPR', avgKPR, 'Kills per round', parseFloat(avgKPR)>=0.8?'good':parseFloat(avgKPR)>=0.6?'warn':'bad', '');
  html += plabCard('Avg DPR', avgDPR, 'Deaths per round', parseFloat(avgDPR)<=0.7?'good':parseFloat(avgDPR)<=0.85?'warn':'bad', '');
  html += plabCard('High Kill Games', `${highKGames}/${n}`, `${Math.round(highKGames/n*100)}% of matches · ${openingWR||'—'}% WR`, highKGames/n>=0.3?'good':'warn', '');
  html += `</div>`;

  const duelPatterns = [];
  if (duelWinPct >= 58) duelPatterns.push({c:'g', t:`Strong duel win rate (${duelWinPct}%) — you win more than you lose in direct combat. Your gunfight mechanics are a strength.`});
  else if (duelWinPct <= 46) duelPatterns.push({c:'r', t:`Low duel win rate (${duelWinPct}%) — you lose more 1v1s than you win. Focus on crosshair placement (aim at head level before peeking) and counter-strafing before shooting.`});
  if (parseFloat(avgKPR) < 0.6) duelPatterns.push({c:'r', t:`Low KPR (${avgKPR}) — you're not finding enough kills per round. Either you're playing too passive or getting caught in bad positions before you can shoot.`});
  if (parseFloat(avgDPR) > 0.9) duelPatterns.push({c:'r', t:`High DPR (${avgDPR}) — you die almost every round. This suggests over-aggression, holding exposed angles, or poor utility usage before dueling.`});
  if (openingWR && openingWR >= 65) duelPatterns.push({c:'g', t:`When you get kills (18+ game), your team wins ${openingWR}% of the time — you're a strong carry when fragging. Consistency is the key gap.`});
  if (duelPatterns.length) html += patternBlock(duelPatterns);

  // ────────────────────────────────────────
  // 4. ECONOMY INTELLIGENCE
  // ────────────────────────────────────────
  html += plabChapter('💰', 'Economy Intelligence');

  // Estimate round types from score-based proxy
  // Full buy rounds: player ACS tends higher, eco rounds lower
  // We use per-match ACS vs avg to classify matches roughly
  const avgACS = data.reduce((s,d)=>s+d.acs,0)/n;
  const fullBuyMatches  = data.filter(d => d.acs >= avgACS * 0.95);
  const ecoBuyMatches   = data.filter(d => d.acs < avgACS * 0.75);
  const forceBuyMatches = data.filter(d => d.acs >= avgACS * 0.75 && d.acs < avgACS * 0.95);

  const fWR = fullBuyMatches.length  ? Math.round(fullBuyMatches.filter(d=>d.won).length/fullBuyMatches.length*100)   : 0;
  const eWR = ecoBuyMatches.length   ? Math.round(ecoBuyMatches.filter(d=>d.won).length/ecoBuyMatches.length*100)     : 0;
  const foWR = forceBuyMatches.length ? Math.round(forceBuyMatches.filter(d=>d.won).length/forceBuyMatches.length*100) : 0;

  html += `<div class="plab-card span4"><div class="plab-card-label">Win Rate by Economy Type (estimated from ACS patterns)</div>
  <table class="plab-eco-table"><thead><tr>
    <th>Type</th><th>Games</th><th>Win Rate</th><th>Avg ACS</th><th>Assessment</th>
  </tr></thead><tbody>
  <tr><td><span class="plab-eco-type" style="color:var(--win)">Full Buy</span></td>
    <td>${fullBuyMatches.length}</td>
    <td style="color:${fWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${fWR}%</td>
    <td>${Math.round(fullBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(fullBuyMatches.length,1))}</td>
    <td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${fWR>=55?'Strong ✓':fWR>=45?'Average':'Underperforming ⚠️'}</td></tr>
  <tr><td><span class="plab-eco-type" style="color:#f5a623">Force Buy</span></td>
    <td>${forceBuyMatches.length}</td>
    <td style="color:${foWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${foWR}%</td>
    <td>${Math.round(forceBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(forceBuyMatches.length,1))}</td>
    <td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${foWR>=45?'Holding well':foWR>=35?'Average':'Struggling'}</td></tr>
  <tr><td><span class="plab-eco-type" style="color:var(--loss)">Eco</span></td>
    <td>${ecoBuyMatches.length}</td>
    <td style="color:${eWR>=40?'var(--win)':'var(--loss)'};font-weight:800">${eWR}%</td>
    <td>${Math.round(ecoBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(ecoBuyMatches.length,1))}</td>
    <td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${eWR>=35?'Good eco steals':eWR>=25?'Expected':'Very low'}</td></tr>
  </tbody></table></div>`;

  const ecoPatterns = [];
  if (fWR < 48) ecoPatterns.push({c:'r', t:`Your full-buy win rate (${fWR}%) is below 50% — when you have the best equipment you should be winning more. This suggests a tactical or coordination issue rather than an aim issue.`});
  if (eWR >= 35) ecoPatterns.push({c:'g', t:`Strong eco performance (${eWR}% WR) — you steal rounds on pistol/shotgun better than most players at your rank. Keep aggressive eco plays.`});
  if (foWR < 38) ecoPatterns.push({c:'y', t:`Force buy win rate is low (${foWR}%) — consider saving more often instead of forcing. A full save preserves credits for a proper full buy next round.`});
  if (ecoPatterns.length) html += patternBlock(ecoPatterns);

  // ────────────────────────────────────────
  // 5. RANK BENCHMARKS & GAP ANALYSIS
  // ────────────────────────────────────────
  html += plabChapter('🏆', 'Rank Benchmark & Gap Analysis');

  const currentRankName = document.getElementById('rank-display')?.textContent || 'Silver 2';
  const currentTier = getRankTier(currentRankName);
  const nextTier = getNextRank(currentTier);
  const currentBench = RANK_BENCHMARKS[currentTier] || RANK_BENCHMARKS['Silver'];
  const nextBench = nextTier ? RANK_BENCHMARKS[nextTier] : null;

  const myKD  = parseFloat((data.reduce((s,d)=>s+d.kd,0)/n).toFixed(2));
  const myWR  = Math.round(data.filter(d=>d.won).length/n*100);
  const myACS = Math.round(data.reduce((s,d)=>s+d.acs,0)/n);
  const myHS  = Math.round(data.reduce((s,d)=>s+d.hsPct,0)/n);

  html += `<div class="plab-grid g2">`;
  // Current rank vs you
  html += `<div class="plab-card span2"><div class="plab-card-label">You vs ${currentTier} Average</div>
    <div class="plab-rankgap">
    ${rankGapRow('K/D',    myKD,  currentBench.kd,  nextBench?.kd,  myKD >= currentBench.kd)}
    ${rankGapRow('Win Rate', myWR+'%', currentBench.wr+'%', nextBench?.wr+'%', myWR >= currentBench.wr)}
    ${rankGapRow('ACS',    myACS, currentBench.acs, nextBench?.acs, myACS >= currentBench.acs)}
    ${rankGapRow('HS%',    myHS+'%', currentBench.hs+'%', nextBench?.hs+'%', myHS >= currentBench.hs)}
    </div></div>`;

  // What to hit for next rank
  if (nextBench) {
    html += `<div class="plab-card span2"><div class="plab-card-label">What You Need for ${nextTier}</div>
      <div class="plab-rankgap">
      ${nextGapRow('K/D',    myKD,  nextBench.kd,  myKD >= nextBench.kd)}
      ${nextGapRow('Win Rate', myWR,  nextBench.wr,  myWR >= nextBench.wr)}
      ${nextGapRow('ACS',    myACS, nextBench.acs, myACS >= nextBench.acs)}
      ${nextGapRow('HS%',    myHS,  nextBench.hs,  myHS >= nextBench.hs)}
      </div></div>`;
  }
  html += `</div>`;

  // ────────────────────────────────────────
  // 6. WIN PROBABILITY PREDICTOR
  // ────────────────────────────────────────
  html += plabChapter('🎯', 'Win Probability Predictor');

  // Build agent × map win rates
  const agentMapWR = {};
  data.forEach(d => {
    const k = `${d.agent}|${d.map}`;
    if (!agentMapWR[k]) agentMapWR[k] = {m:0,w:0};
    agentMapWR[k].m++; if(d.won) agentMapWR[k].w++;
  });
  const agentWR = {};
  data.forEach(d => {
    if (!agentWR[d.agent]) agentWR[d.agent] = {m:0,w:0};
    agentWR[d.agent].m++; if(d.won) agentWR[d.agent].w++;
  });
  const mapWR = {};
  data.forEach(d => {
    if (!mapWR[d.map]) mapWR[d.map] = {m:0,w:0};
    mapWR[d.map].m++; if(d.won) mapWR[d.map].w++;
  });

  // Factors
  const baseWR = myWR / 100;
  const recentForm = data.slice(0,5).filter(d=>d.won).length / 5;
  const streakBonus = currentStreak.type==='win' ? Math.min(currentStreak.count*0.04, 0.12) : -Math.min(currentStreak.count*0.04, 0.12);

  // Best combo predictor
  const combos = Object.entries(agentMapWR)
    .filter(([,v]) => v.m >= 2)
    .map(([k,v]) => { const [agent,map]=k.split('|'); return {agent,map,wr:v.w/v.m,m:v.m}; })
    .sort((a,b) => b.wr-a.wr);

  const topCombo = combos[0];
  const worstCombo = [...combos].sort((a,b)=>a.wr-b.wr)[0];

  // Overall next-game prediction
  const nextGameProb = Math.max(25, Math.min(75, Math.round((baseWR*0.5 + recentForm*0.35 + 0.5*0.15 + streakBonus) * 100)));
  const probCol = nextGameProb >= 55 ? 'var(--win)' : nextGameProb <= 44 ? 'var(--loss)' : 'var(--accent)';

  html += `<div class="plab-grid">`;
  html += `<div class="plab-card"><div class="plab-card-label">Next Game Win Prob</div>
    <div class="plab-card-val" style="color:${probCol}">${nextGameProb}%</div>
    <div class="plab-card-sub">Based on form, WR & streak</div>
    <div class="plab-bench" style="margin-top:10px">
      <div class="plab-bench-track">
        <div class="plab-bench-fill" style="width:${nextGameProb}%;background:${probCol}"></div>
      </div>
    </div></div>`;

  html += `<div class="plab-card"><div class="plab-card-label">Recent Form (Last 5)</div>
    <div class="plab-card-val ${recentForm>=0.6?'good':recentForm<=0.3?'bad':'warn'}">${Math.round(recentForm*100)}%</div>
    <div class="plab-card-sub">${data.slice(0,5).map(d=>d.won?'✓':'✗').join(' ')}</div></div>`;

  if (topCombo) html += `<div class="plab-card good"><div class="plab-card-label">Best Pick Combo</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--win);line-height:1.2">${topCombo.agent}<br><span style="font-size:13px;color:var(--muted)">on ${topCombo.map}</span></div>
    <div class="plab-card-sub">${Math.round(topCombo.wr*100)}% WR · ${topCombo.m} games</div></div>`;

  if (worstCombo && worstCombo.agent !== topCombo?.agent) html += `<div class="plab-card bad"><div class="plab-card-label">Avoid This Combo</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--loss);line-height:1.2">${worstCombo.agent}<br><span style="font-size:13px;color:var(--muted)">on ${worstCombo.map}</span></div>
    <div class="plab-card-sub">${Math.round(worstCombo.wr*100)}% WR · ${worstCombo.m} games</div></div>`;

  html += `</div>`;

  // Per-agent probability bars
  const topAgents = Object.entries(agentWR).filter(([,v])=>v.m>=2).sort((a,b)=>b[1].w/b[1].m - a[1].w/a[1].m).slice(0,6);
  if (topAgents.length) {
    html += `<div class="plab-winprob"><div class="plab-card-label" style="margin-bottom:4px">Win Probability by Agent Pick</div>`;
    topAgents.forEach(([agent, v]) => {
      const pct = Math.round(v.w/v.m*100);
      const col = pct>=55?'var(--win)':pct<=40?'var(--loss)':'var(--accent)';
      html += `<div class="plab-prob-row">
        <div class="plab-prob-label">${agent} <span style="color:var(--muted2);font-size:9px">(${v.m}g)</span></div>
        <div class="plab-prob-bar-wrap"><div class="plab-prob-bar" style="width:${pct}%;background:${col}"></div></div>
        <div class="plab-prob-pct" style="color:${col}">${pct}%</div>
      </div>`;
    });
    html += `</div>`;
  }

  // ────────────────────────────────────────
  // 7. PERSONALISED ACTION PLAN
  // ────────────────────────────────────────
  html += plabChapter('📋', 'Personalised Action Plan');

  const actions = [];
  if (duelWinPct < 50) actions.push({ priority:'HIGH', title:'Fix Crosshair Placement', desc:`Your ${duelWinPct}% duel win rate means you're losing more gunfights than you win. Drill: 15 min Aimlab "Microshot" daily, focus on pre-aiming head level at every corner before you push.` });
  if (myHS < (currentBench.hs - 3)) actions.push({ priority:'HIGH', title:'Improve Headshot Rate', desc:`You're at ${myHS}% HS rate vs ${currentBench.hs}% for your rank. Stop burst-firing — one tap, check if enemy is dead, then tap again. The extra kills come from cleaner first shots.` });
  if (tiltLevel) actions.push({ priority:'HIGH', title:'Mental Reset Protocol', desc:`Set a hard rule: max 2 ranked games per session until your last-5 WR improves. Play deathmatch or unranked between ranked games to stay warm without the pressure.` });
  if (myWR < currentBench.wr) actions.push({ priority:'MED', title:'Round Economy Awareness', desc:`At ${myWR}% WR vs ${currentBench.wr}% for your rank, you're losing rounds you should win. After every loss, check: did you save when you should have? Did you call out the right site?` });
  if (bestHour.h >= 0 && worstHour.h >= 0 && bestHour.h !== worstHour.h) actions.push({ priority:'MED', title:`Play at ${bestHour.h}:00, Avoid ${worstHour.h}:00`, desc:`Your data shows a ${Math.round((bestHour.wr - worstHour.wr)*100)}% WR swing between your best and worst hours. Scheduling your ranked sessions deliberately is free RR.` });
  if (topCombo) actions.push({ priority:'MED', title:`Queue ${topCombo.agent} on ${topCombo.map}`, desc:`${Math.round(topCombo.wr*100)}% WR in ${topCombo.m} games is your best combo. When you see ${topCombo.map} in rotation, lock ${topCombo.agent} and play with confidence.` });
  if (nextBench && myACS < nextBench.acs) actions.push({ priority:'LOW', title:`Hit ${nextBench.acs} ACS for ${nextTier}`, desc:`You need +${nextBench.acs-myACS} more ACS per round on average. Focus on being proactive in rounds — don't wait for enemies to come to you, create picks in mid or on flanks.` });
  actions.push({ priority:'LOW', title:'VoD Review — Deaths Only', desc:`Record every session with OBS. Watch only the rounds you died in. Ask: was I peeking without info? Did I have angle disadvantage? 3 VoD sessions will teach you more than 10 extra games.` });

  html += `<div class="plab-card span4">`;
  const priorityOrder = ['HIGH','MED','LOW'];
  const pColors = {HIGH:'var(--loss)',MED:'#f5a623',LOW:'var(--accent)'};
  actions.forEach((a,i) => {
    html += `<div style="display:flex;align-items:flex-start;gap:14px;padding:${i>0?'12px 0 0':0};${i>0?'border-top:1px solid var(--border);margin-top:12px':''}">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:${pColors[a.priority]};border:1px solid ${pColors[a.priority]}33;flex-shrink:0;margin-top:2px">${a.priority}</div>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:0.5px">${a.title}</div>
        <div style="font-family:'Barlow',sans-serif;font-size:12px;color:rgba(240,240,242,0.7);margin-top:3px;line-height:1.55">${a.desc}</div>
      </div>
    </div>`;
  });
  html += `</div>`;

  // ────────────────────────────────────────
  // 8. 7-DAY IMPROVEMENT ARC & PLATEAU DETECTOR
  // ────────────────────────────────────────
  html += plabChapter('📈', '7-Day Improvement Arc');

  // Group matches by day
  const now = Date.now();
  const oneDay = 86400000;
  const thisWeek = data.filter(d => d.gameStart && (now - d.gameStart*1000) < 7*oneDay);
  const lastWeek = data.filter(d => d.gameStart && (now - d.gameStart*1000) >= 7*oneDay && (now - d.gameStart*1000) < 14*oneDay);

  const calcStats = arr => {
    if (!arr.length) return null;
    const k = arr.reduce((s,d)=>s+d.k,0), de = arr.reduce((s,d)=>s+d.d,0);
    const wins = arr.filter(d=>d.won).length;
    return {
      kd: de ? parseFloat((k/de).toFixed(2)) : k,
      wr: Math.round(wins/arr.length*100),
      hs: Math.round(arr.reduce((s,d)=>s+d.hsPct,0)/arr.length),
      n: arr.length
    };
  };

  const tw = calcStats(thisWeek);
  const lw = calcStats(lastWeek);

  if (tw && lw) {
    const kdDelta  = parseFloat((tw.kd - lw.kd).toFixed(2));
    const wrDelta  = tw.wr - lw.wr;
    const hsDelta  = tw.hs - lw.hs;
    const improving = kdDelta > 0 || wrDelta > 0;
    const col = d => d > 0 ? 'var(--win)' : d < 0 ? 'var(--loss)' : 'var(--muted)';
    const fmt = d => (d > 0 ? '+' : '') + d;
    html += `<div class="plab-card span4">
      <div class="plab-card-label" style="margin-bottom:12px">This Week vs Last Week</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">K/D</div>
          <div style="font-size:18px;font-weight:900;color:${col(kdDelta)}">${tw.kd} <span style="font-size:12px">${fmt(kdDelta)}</span></div>
          <div style="font-size:10px;color:var(--muted)">was ${lw.kd}</div></div>
        <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">WIN RATE</div>
          <div style="font-size:18px;font-weight:900;color:${col(wrDelta)}">${tw.wr}% <span style="font-size:12px">${fmt(wrDelta)}%</span></div>
          <div style="font-size:10px;color:var(--muted)">was ${lw.wr}%</div></div>
        <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">HS RATE</div>
          <div style="font-size:18px;font-weight:900;color:${col(hsDelta)}">${tw.hs}% <span style="font-size:12px">${fmt(hsDelta)}%</span></div>
          <div style="font-size:10px;color:var(--muted)">was ${lw.hs}%</div></div>
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:${improving?'var(--win)':'var(--loss)'};line-height:1.5">
        ${improving
          ? `📈 You're improving week-over-week. Keep the same routine, same agents, same hours. Don't break what's working.`
          : `📉 Your stats dipped this week vs last week. Something changed — too many hours? Different agents? Identify 1 variable and address it.`}
      </div>
    </div>`;
  } else if (tw) {
    html += `<div class="plab-card span4"><div class="plab-card-label">This Week</div><div class="plab-card-sub" style="padding:8px 0">${tw.n} games this week · ${tw.wr}% WR · ${tw.kd} K/D. Play 5+ games next week too to enable week-over-week comparison.</div></div>`;
  } else {
    html += `<div class="plab-card span4"><div class="plab-card-label">7-Day Arc</div><div class="plab-card-sub" style="padding:8px 0">No recent matches with timestamps found. Make sure your matches have game_start data.</div></div>`;
  }

  // PLATEAU DETECTOR
  html += plabChapter('⏸️', 'Skill Plateau Detector');
  const platKDs = data.slice(0, Math.min(n, 15)).map(d => d.kd);
  const platMin = platKDs.length ? Math.min(...platKDs) : 0;
  const platMax = platKDs.length ? Math.max(...platKDs) : 0;
  const platRange = parseFloat((platMax - platMin).toFixed(2));
  const platMean  = platKDs.length ? parseFloat((platKDs.reduce((s,v)=>s+v,0)/platKDs.length).toFixed(2)) : 0;
  const isPlateaued = platRange < 0.35 && platKDs.length >= 8;

  if (isPlateaued) {
    html += `<div class="plab-tilt-alert" style="border-color:rgba(232,255,71,0.3);background:rgba(232,255,71,0.04)">
      <div class="plab-tilt-icon" style="font-size:22px">⏸️</div>
      <div>
        <div class="plab-tilt-title" style="color:#e8ff47">SKILL PLATEAU DETECTED</div>
        <div class="plab-tilt-desc">Your K/D has stayed between ${platMin.toFixed(2)} and ${platMax.toFixed(2)} for ${platKDs.length} games (range: ${platRange}). You're stuck. Plateau-breaking requires deliberate practice — not more games of the same.<br><br>
        <strong style="color:#fff">Break your plateau:</strong> (1) Switch to 1 agent you've never played for 5 games — forces new skill building. (2) Watch 10 min of a Radiant player's VoD on your worst map. (3) Set 1 specific goal per match (e.g. "0 deaths from behind") instead of just "win."</div>
      </div>
    </div>`;
  } else {
    html += `<div class="plab-card good"><div class="plab-card-label">Plateau Status</div><div class="plab-card-val good">✓ Active</div><div class="plab-card-sub">K/D range: ${platRange} over last ${platKDs.length} games — you're still actively improving.</div></div>`;
  }

  // SESSION RECOMMENDATION
  html += plabChapter('🎮', 'Should You Keep Playing?');
  let recTitle='', recDesc='', recColor='var(--win)';
  if (tiltLevel === 'high') {
    recTitle = '🛑 STOP PLAYING NOW'; recColor = 'var(--loss)';
    recDesc = `${currentStreak.count}-game loss streak. Every additional ranked game tonight is likely to be a loss and will cost you RR. Close the client and come back tomorrow.`;
  } else if (tiltLevel === 'medium') {
    recTitle = '⚠️ TAKE A BREAK'; recColor = '#f5a623';
    recDesc = `${sessionLosses} losses today. Take at least 30 minutes off — watch a VoD, eat, rest. Then come back and play 1 more game. If you lose, stop for the day.`;
  } else if (currentStreak.type === 'win' && currentStreak.count >= 2) {
    recTitle = '🔥 KEEP GOING'; recColor = 'var(--win)';
    recDesc = `${currentStreak.count}-game win streak! You're in a hot window. Play 1-2 more games but set a stop condition — if you lose one, log off to protect the streak gains.`;
  } else if (sessionMatches.length >= 4) {
    recTitle = '😴 CONSIDER STOPPING'; recColor = '#f5a623';
    recDesc = `${sessionMatches.length} games already played today. Fatigue affects decision-making significantly. Your early-session WR is usually better — protect it.`;
  } else {
    recTitle = '✅ GOOD TO QUEUE'; recColor = 'var(--win)';
    recDesc = `No tilt signals. Mentally clear. Go play, but remember: 3 losses = auto-stop rule. Set it now.`;
  }
  html += `<div class="plab-card span4" style="border-color:${recColor}33;background:${recColor}08">
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:20px;text-transform:uppercase;color:${recColor};margin-bottom:6px">${recTitle}</div>
    <div style="font-size:12px;line-height:1.6;color:rgba(240,240,242,0.8)">${recDesc}</div>
  </div>`;

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
}

// ── RENDER HELPERS ──
function plabChapter(icon, title) {
  return `<div class="plab-chapter"><span class="plab-chapter-icon">${icon}</span><span class="plab-chapter-title">${title}</span><div class="plab-chapter-line"></div></div>`;
}
function plabCard(label, val, sub, valCls, cardCls) {
  return `<div class="plab-card ${cardCls||''}"><div class="plab-card-label">${label}</div><div class="plab-card-val ${valCls||''}">${val}</div><div class="plab-card-sub">${sub}</div></div>`;
}
function patternBlock(patterns) {
  return `<div class="plab-card span4"><div class="plab-patterns">${patterns.map(p=>`<div class="plab-pattern"><div class="plab-dot ${p.c}"></div><div>${p.t}</div></div>`).join('')}</div></div>`;
}
function rankGapRow(stat, you, avg, next, passing) {
  return `<div class="plab-rankgap-row">
    <div class="plab-rankgap-stat">${stat}</div>
    <div class="plab-rankgap-you" style="color:${passing?'var(--win)':'var(--loss)'}">${you}</div>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);min-width:30px">avg</div>
    <div class="plab-rankgap-target">${avg}</div>
    ${next?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);min-width:30px">next</div><div class="plab-rankgap-target" style="color:var(--accent)">${next}</div>`:''}
    <div style="font-family:'DM Mono',monospace;font-size:10px;margin-left:auto;color:${passing?'var(--win)':'var(--loss)'}">${passing?'✓ Above avg':'↑ Needs work'}</div>
  </div>`;
}
function nextGapRow(stat, you, target, passing) {
  const youNum = parseFloat(String(you));
  const targetNum = parseFloat(String(target));
  const pct = passing ? 100 : Math.min(99, Math.round((youNum/targetNum)*100));
  const gap = passing ? '✓ Ready' : `Need +${(targetNum-youNum).toFixed(stat==='K/D'?2:0)}`;
  return `<div class="plab-rankgap-row">
    <div class="plab-rankgap-stat">${stat}</div>
    <div class="plab-rankgap-you" style="color:${passing?'var(--win)':'rgba(240,240,242,0.7)'}">${you}</div>
    <div class="plab-rankgap-bar-wrap" style="margin:0 12px">
      <div class="plab-rankgap-bar" style="width:${pct}%;background:${passing?'var(--win)':'var(--accent)'}"></div>
    </div>
    <div class="plab-rankgap-target">${target}</div>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:${passing?'var(--win)':'var(--muted)'};margin-left:8px;white-space:nowrap">${gap}</div>
  </div>`;
}


// ── Dynamic hero + player search ──
function updateHeroName() {
  const name = PLAYER_NAME;
  const tag  = PLAYER_TAG;
  const mode = document.getElementById('mode-select')?.value || 'competitive';
  const modeLabel = { competitive:'Competitive', unrated:'Unrated', deathmatch:'Deathmatch',
    teamdeathmatch:'Team Deathmatch', swiftplay:'Swiftplay', spikerush:'Spike Rush' }[mode] || mode;

  // Split name into base + unicode/special suffix for styling
  const match = name.match(/^([A-Za-z0-9_\-]+)(.*)$/);
  const base = match ? match[1] : name;
  const suffix = match ? match[2] : '';
  const titleEl = document.getElementById('hero-title');
  if (titleEl) titleEl.innerHTML = escapeHtml(base) + (suffix ? `<span class="dim">${escapeHtml(suffix)}</span>` : '');
  const subEl = document.getElementById('hero-sub');
  if (subEl) {
    subEl.innerHTML = `<span style="font-size:15px; color:var(--muted); letter-spacing:0.5px;">#${tag}</span><span class="hero-level-badge-new" id="player-level">LVL —</span>`;
  }
  const eyebrowEl = document.getElementById('hero-eyebrow');
  if (eyebrowEl) eyebrowEl.textContent = `${modeLabel} Tracker`;
  const bannerNameEl = document.getElementById('banner-name');
  if (bannerNameEl) bannerNameEl.textContent = name;
  const bannerTagEl = document.getElementById('banner-tag');
  if (bannerTagEl) bannerTagEl.textContent = '#' + tag;
  const tagDisplayEl = document.getElementById('player-tag-display');
  if (tagDisplayEl) tagDisplayEl.textContent = name + ' #' + tag;
}

// Enter key triggers fetch



// ── PER-MATCH DUEL BREAKDOWN ──
function buildMatchDuels(m) {
  const k = m.kills, d = m.deaths, a = m.assists;
  const shots = m.shots || 0;
  const hs = m.hs || 0;
  const hsPct = shots ? Math.round((hs/shots)*100) : 0;
  const duelWin = Math.round((k / Math.max(k+d,1)) * 100);
  const kd = d ? (k/d).toFixed(2) : k.toFixed(2);
  const acs = Math.round((m.score||0)/100);
  const totalRounds = (() => {
    const r = m.rounds || '0-0';
    const parts = r.split('-').map(Number);
    return (parts[0]||0) + (parts[1]||0);
  })();
  const kpr = totalRounds ? (k/totalRounds).toFixed(2) : '—';
  const dpr = totalRounds ? (d/totalRounds).toFixed(2) : '—';

  const duelCol = duelWin >= 55 ? 'var(--win)' : duelWin <= 44 ? 'var(--loss)' : 'var(--accent)';
  const kdCol   = parseFloat(kd) >= 1.2 ? 'var(--win)' : parseFloat(kd) < 0.9 ? 'var(--loss)' : 'var(--text)';
  const hsCol   = hsPct >= 25 ? 'var(--win)' : hsPct < 15 ? 'var(--loss)' : 'var(--text)';

  // Duel bar
  const winW = Math.round((k/Math.max(k+d,1))*100);
  const lossW = 100 - winW;

  let insight = '';
  if (duelWin >= 60) insight = `<span style="color:var(--win)">Strong duel game</span> — you won ${duelWin}% of 1v1s this match.`;
  else if (duelWin <= 42) insight = `<span style="color:var(--loss)">Rough duel game</span> — lost more gunfights than won (${duelWin}%). Check if you were peeking without info.`;
  else insight = `<span style="color:var(--muted)">Average duel game</span> — close split between kills and deaths.`;
  if (hsPct >= 30) insight += ` Excellent HS% (${hsPct}%) this match.`;
  else if (hsPct < 15 && shots > 0) insight += ` Low HS% (${hsPct}%) — likely spraying under pressure.`;

  return `<div style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
      ${duelStatMini('Duel Win %', duelWin+'%', duelCol)}
      ${duelStatMini('K/D', kd, kdCol)}
      ${duelStatMini('KPR', kpr, parseFloat(kpr)>=0.8?'var(--win)':parseFloat(kpr)<0.5?'var(--loss)':'var(--text)')}
      ${duelStatMini('DPR', dpr, parseFloat(dpr)<=0.7?'var(--win)':parseFloat(dpr)>0.9?'var(--loss)':'var(--text)')}
      ${duelStatMini('HS %', hsPct+'%', hsCol)}
    </div>
    <div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:6px;display:flex;">
      <div style="width:${winW}%;background:var(--win);transition:width 0.8s ease;"></div>
      <div style="width:${lossW}%;background:var(--loss);transition:width 0.8s ease;"></div>
    </div>
    <div style="font-family:'Barlow',sans-serif;font-size:12px;color:rgba(240,240,242,0.7);line-height:1.5">${insight}</div>
  </div>`;
}

function duelStatMini(label, val, col) {
  return `<div style="background:var(--surface2);border-radius:6px;padding:10px 12px;">
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:22px;color:${col}">${val}</div>
  </div>`;
}


// ── MODE-AWARE UI ──
function applyModeUI() {
  const mode = document.getElementById('mode-select')?.value || 'competitive';
  const isRanked = mode === 'competitive';
  // Hide rank block for non-ranked modes
  const rankBlock = document.querySelector('.hero-rank-block');
  if (rankBlock) rankBlock.style.display = isRanked ? '' : 'none';
  // Hide RR graph section for non-ranked
  const rrCard = document.getElementById('rr-graph-card');
  if (rrCard) rrCard.style.display = isRanked ? '' : 'none';
  // Update eyebrow
  updateHeroName();
}


// ══ LANDING PAGE ══
function landingQuick(name, tag, region, mode) {
  document.getElementById('l-name').value = name;
  document.getElementById('l-tag').value  = tag;
  document.getElementById('l-region').value = region;
  document.getElementById('l-mode').value   = mode;
  landingFetch();
}

async function landingFetch() {
  const name   = document.getElementById('l-name').value.trim();
  const tag    = document.getElementById('l-tag').value.trim().replace(/^#/,'');
  const region = document.getElementById('l-region').value;
  const mode   = document.getElementById('l-mode').value;
  const errEl  = document.getElementById('l-error');
  const btn    = document.getElementById('l-btn');

  if (!name || !tag) { 
    errEl.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="#ff4655" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>Enter a name and tag first</span>
    `;
    errEl.classList.add('active');
    return; 
  }
  
  errEl.innerHTML = '';
  errEl.classList.remove('active');
  btn.disabled = true;
  btn.textContent = 'Loading...';

  // Sync inputs to topbar
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) nameInput.value = name;
  const tagInput = document.getElementById('player-tag-input');
  if (tagInput) tagInput.value = tag;
  const regionSelect = document.getElementById('region-select');
  if (regionSelect) regionSelect.value = region;
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) modeSelect.value = mode;

  // Update globals
  PLAYER_NAME = name;
  PLAYER_TAG  = tag;
  window._currentMode = mode;

  try {
    startLoadingRotator();
    await fetchAll();
  } catch (err) {
    stopLoadingRotator();
    console.error("Landing fetch failed:", err);
    
    // Nice Valorant-styled error box message
    const msg = err.message || 'Player not found or API error. Check spelling, region & tag.';
    errEl.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="#ff4655" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>${msg}</span>
    `;
    errEl.classList.add('active');
    
    // Restore landing page view
    const landing = document.getElementById('landing');
    if (landing) {
      landing.classList.remove('hidden');
      landing.style.display = 'flex';
    }
    const tv = document.getElementById('tracker-view');
    if (tv) tv.style.display = 'none';
    const gf = document.getElementById('global-footer');
    if (gf) gf.style.display = 'none';
  } finally {
    stopLoadingRotator();
    btn.disabled = false;
    btn.textContent = '▶ View Stats';
  }
}

function dismissLanding() {
  statsLoaded = true;
  stopLoadingRotator();
  const el = document.getElementById('landing');
  if (el) {
    el.classList.add('hidden');
    setTimeout(() => {
      if (el.classList.contains('hidden')) {
        el.style.display = 'none';
      }
    }, 350);
  }
  const tv = document.getElementById('tracker-view');
  const subRow = document.getElementById('topbar-sub-row');
  const gf = document.getElementById('global-footer');
  
  if (tv) {
    tv.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    tv.style.display = 'block';
    tv.style.opacity = '0';
  }
  if (subRow) {
    subRow.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    subRow.style.display = 'flex';
    subRow.style.opacity = '0';
  }
  if (gf) {
    gf.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    gf.style.display = 'flex';
    gf.style.opacity = '0';
  }
  
  // Force a browser repaint reflow
  if (tv) tv.offsetHeight;
  
  // Smoothly fade in
  setTimeout(() => {
    if (tv) tv.style.opacity = '1';
    if (subRow) subRow.style.opacity = '1';
    if (gf) gf.style.opacity = '1';
  }, 30);
  
  // Hide search inputs and show premium player active pill
  toggleSearchMode(false);
  
  const fg = document.getElementById('topbar-filters-group');
  if (fg) {
    if (window.innerWidth > 800) {
      fg.style.display = 'flex';
    } else {
      fg.style.display = ''; // Let CSS decide (display:none on mobile)
      fg.classList.remove('mobile-expanded'); // Keep collapsed on mobile
    }
  }
  const fb = document.getElementById('fetch-btn');
  if (fb) fb.style.display = ''; // Let CSS manage visibility
  const h2hb = document.getElementById('h2h-trigger-btn');
  if (h2hb) h2hb.style.display = 'inline-block';
  
  setTimeout(updateFilterToggleText, 50); // Initialize mobile filter text indicators!
  setTimeout(updateHeaderHeights, 60);
}

function toggleSearchMode(showSearch) {
  const psw = document.querySelector('.player-search-wrap');
  const div2 = document.getElementById('tracker-divider-2');
  const activePill = document.getElementById('player-active-pill');
  const mft = document.getElementById('mobile-filter-toggle');
  
  // The search bar in topbar-main-row should always remain visible
  if (psw) psw.style.display = 'flex';
  if (div2) div2.style.display = 'block';
  
  if (PLAYER_NAME) {
    if (activePill) activePill.style.display = 'flex';
    if (mft) mft.style.display = 'inline-flex';
    updateActivePill();
  } else {
    if (activePill) activePill.style.display = 'none';
    if (mft) mft.style.display = 'none';
  }
}

function updateActivePill() {
  const nameEl = document.getElementById('active-pill-name');
  if (nameEl) {
    nameEl.textContent = `${PLAYER_NAME}#${PLAYER_TAG}`;
  }
}

function updateActivePillAgent(agentName) {
  const avatarWrap = document.getElementById('active-pill-avatar-wrap');
  if (!avatarWrap) return;
  const cached = _assetCache.agents[(agentName || '').toLowerCase()];
  if (cached && cached.iconUrl) {
    avatarWrap.innerHTML = `<img class="active-pill-avatar-img" src="${cached.iconUrl}" alt="${agentName}">`;
  } else {
    avatarWrap.innerHTML = `<div class="active-pill-avatar-fallback">👤</div>`;
  }
}

// Enter key on landing inputs



// ══ SEARCH HISTORY & BOOKMARKS (localStorage) ══
function addToRecentSearches(name, tag, region, mode) {
  if (!name || !tag) return;
  
  const rankEl = document.getElementById('rank-display');
  const rankName = rankEl ? rankEl.textContent.trim() : 'UNRANKED';
  const rankImg = getRankImgUrl(rankName);
  
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('valtracker_recent_searches')) || [];
  } catch(e) { history = []; }
  
  history = history.filter(p => !(p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()));
  
  history.unshift({
    name,
    tag,
    region,
    mode,
    rankName,
    rankImg,
    timestamp: Date.now()
  });
  
  if (history.length > 6) {
    history.pop();
  }
  
  localStorage.setItem('valtracker_recent_searches', JSON.stringify(history));
  renderLandingHistory();
}

function renderActiveBookmarkButton() {
  const btn = document.getElementById('active-pill-bookmark-btn');
  if (!btn || !PLAYER_NAME || !PLAYER_TAG) return;
  
  let bookmarks = [];
  try {
    bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || [];
  } catch(e) { bookmarks = []; }
  
  const isBookmarked = bookmarks.some(p => p.name.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag.toLowerCase() === PLAYER_TAG.toLowerCase());
  
  if (isBookmarked) {
    btn.style.color = '#ffd700'; // Gold star
    btn.title = 'Remove Bookmark';
  } else {
    btn.style.color = 'var(--muted)'; // Muted star
    btn.title = 'Bookmark Player';
  }
}

function toggleActiveBookmark() {
  if (!PLAYER_NAME || !PLAYER_TAG) return;
  
  let bookmarks = [];
  try {
    bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || [];
  } catch(e) { bookmarks = []; }
  
  const idx = bookmarks.findIndex(p => p.name.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag.toLowerCase() === PLAYER_TAG.toLowerCase());
  
  const region = document.getElementById('region-select')?.value || 'ap';
  const mode = document.getElementById('mode-select')?.value || 'competitive';
  const rankEl = document.getElementById('rank-display');
  const rankName = rankEl ? rankEl.textContent.trim() : 'UNRANKED';
  const rankImg = getRankImgUrl(rankName);
  
  if (idx !== -1) {
    bookmarks.splice(idx, 1);
    showToast('Removed from Bookmarks');
  } else {
    bookmarks.unshift({
      name: PLAYER_NAME,
      tag: PLAYER_TAG,
      region,
      mode,
      rankName,
      rankImg,
      timestamp: Date.now()
    });
    showToast('Added to Bookmarks ★');
  }
  
  localStorage.setItem('valtracker_bookmarks', JSON.stringify(bookmarks));
  renderActiveBookmarkButton();
  renderLandingHistory();
}

function renderLandingHistory() {
  const bookmarksList = document.getElementById('landing-bookmarks-list');
  const recentList = document.getElementById('landing-recent-list');
  const bookmarksCount = document.getElementById('bookmarks-count');
  
  if (!bookmarksList || !recentList) return;
  
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || []; } catch(e) { bookmarks = []; }
  
  if (bookmarksCount) bookmarksCount.textContent = `${bookmarks.length} Player${bookmarks.length === 1 ? '' : 's'}`;
  
  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `<div style="font-size:10px; color:var(--muted2); text-align:center; padding:16px 12px; font-family:'DM Mono',monospace; border:1px dashed rgba(255,255,255,0.05); border-radius:8px;">No bookmarked players.<br>Click ★ next to their name in header.</div>`;
  } else {
    bookmarksList.innerHTML = bookmarks.map(p => {
      const escapedName = escapeJsString(p.name);
      const escapedTag = escapeJsString(p.tag);
      return `
        <div class="landing-quick-btn" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; margin-bottom: 2px;">
          <div onclick="landingQuick('${escapedName}','${escapedTag}','${escapeJsString(p.region)}','${escapeJsString(p.mode)}')" style="display:flex; align-items:center; gap:8px; flex:1; cursor:pointer;">
            ${p.rankImg ? `<img src="${p.rankImg}" style="width:18px; height:18px; object-fit:contain;">` : `<div style="width:18px; height:18px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--muted2)">👤</div>`}
            <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff;">${escapeHtml(p.name)}<span style="color:var(--muted2); font-weight:normal; font-size:10px;">#${escapeHtml(p.tag)}</span></div>
          </div>
          <button onclick="removeBookmarkDirect('${escapedName}','${escapedTag}')" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 4px; transition:color 0.2s;" onmouseover="this.style.color='#ff4655'" onmouseout="this.style.color='var(--muted)'">×</button>
        </div>
      `;
    }).join('');
  }
  
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem('valtracker_recent_searches')) || []; } catch(e) { recent = []; }
  
  if (recent.length === 0) {
    recentList.innerHTML = `<div style="font-size:10px; color:var(--muted2); text-align:center; padding:16px 12px; font-family:'DM Mono',monospace; border:1px dashed rgba(255,255,255,0.05); border-radius:8px;">No recent searches yet.</div>`;
  } else {
    recentList.innerHTML = recent.map(p => {
      const escapedName = escapeJsString(p.name);
      const escapedTag = escapeJsString(p.tag);
      return `
        <div class="landing-quick-btn" onclick="landingQuick('${escapedName}','${escapedTag}','${escapeJsString(p.region)}','${escapeJsString(p.mode)}')" style="display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; margin-bottom: 2px;">
          ${p.rankImg ? `<img src="${p.rankImg}" style="width:18px; height:18px; object-fit:contain;">` : `<div style="width:18px; height:18px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--muted2)">👤</div>`}
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#fff; flex:1;">${escapeHtml(p.name)}<span style="color:var(--muted2); font-weight:normal; font-size:10px;">#${escapeHtml(p.tag)}</span></div>
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); text-transform:uppercase; border:1px solid rgba(255,255,255,0.08); padding:1px 4px; border-radius:3px;">${escapeHtml(p.region)}</div>
        </div>
      `;
    }).join('');
  }
}

let _bookmarkRanksSynced = false;
async function syncBookmarkRanks() {
  if (_bookmarkRanksSynced) return;
  _bookmarkRanksSynced = true;
  
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || []; } catch(e) { bookmarks = []; }
  if (bookmarks.length === 0) return;
  
  console.log(`[Bookmark Sync] Refreshing ranks in background for ${bookmarks.length} players...`);
  
  let updatedAny = false;
  for (const p of bookmarks) {
    try {
      const encName = encodeURIComponent(p.name);
      const res = await fetch(`/api/v3/mmr/${p.region || 'ap'}/pc/${encName}/${p.tag}`);
      if (res.ok) {
        const mmrData = await res.json();
        if (mmrData && mmrData.data) {
          const currentRank = mmrData.data.current?.tier?.name || 'UNRANKED';
          const currentImg = getRankImgUrl(currentRank);
          
          if (p.rankName !== currentRank || p.rankImg !== currentImg) {
            p.rankName = currentRank;
            p.rankImg = currentImg;
            updatedAny = true;
          }
        }
      }
      await new Promise(r => setTimeout(r, 150)); // brief pause
    } catch (e) {
      console.warn(`[Bookmark Sync] Failed to sync ${p.name}#${p.tag}:`, e);
    }
  }
  
  if (updatedAny) {
    localStorage.setItem('valtracker_bookmarks', JSON.stringify(bookmarks));
    renderLandingHistory();
    console.log(`[Bookmark Sync] Completed. Ranks updated.`);
  }
}

function removeBookmarkDirect(name, tag) {
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || []; } catch(e) { bookmarks = []; }
  bookmarks = bookmarks.filter(p => !(p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()));
  localStorage.setItem('valtracker_bookmarks', JSON.stringify(bookmarks));
  renderActiveBookmarkButton();
  renderLandingHistory();
}

function showBookmarksModal() {
  const modal = document.getElementById('bookmarks-modal');
  if (!modal) return;
  
  // Close dropdown if open
  const dropdown = document.getElementById('tools-dropdown-menu');
  if (dropdown) dropdown.style.display = 'none';
  
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || []; } catch(e) { bookmarks = []; }
  
  const listContainer = document.getElementById('bookmarks-modal-list');
  if (!listContainer) return;
  
  if (bookmarks.length === 0) {
    listContainer.innerHTML = `
      <div style="font-size:11px; color:var(--muted2); text-align:center; padding:32px 16px; font-family:'DM Mono',monospace; border:1px dashed rgba(255,215,0,0.15); border-radius:12px; background:rgba(255,215,0,0.01); line-height:1.4;">
        No bookmarked players yet.<br><br>
        Search for a player, then click the <span style="color:#ffd700">★</span> next to their name in the active profile header pill to bookmark them!
      </div>
    `;
  } else {
    listContainer.innerHTML = bookmarks.map(p => {
      const escapedName = escapeJsString(p.name);
      const escapedTag = escapeJsString(p.tag);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 16px; border:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.015); border-radius:10px; transition:all 0.2s ease;">
          <div onclick="bookmarksModalJump('${escapedName}','${escapedTag}','${p.region}','${p.mode}')" style="display:flex; align-items:center; gap:12px; flex:1; cursor:pointer;">
            ${p.rankImg ? `<img src="${p.rankImg}" style="width:24px; height:24px; object-fit:contain;">` : `<div style="width:24px; height:24px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--muted2)">👤</div>`}
            <div style="display:flex; flex-direction:column; gap:2px;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:800; color:#fff; text-transform:uppercase; line-height:1.2;">
                ${p.name}<span style="color:var(--muted2); font-weight:normal; font-size:11px;">#${p.tag}</span>
              </div>
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:var(--muted); text-transform:uppercase; line-height:1;">
                ${p.region} Region · ${p.mode === 'competitive' ? 'Competitive' : p.mode.toUpperCase()}
              </div>
            </div>
          </div>
          <button onclick="removeBookmarkModal('${escapedName}','${escapedTag}')" style="background:none; border:none; color:#ffd700; font-size:18px; cursor:pointer; padding:4px 8px; transition:all 0.2s; display:flex; align-items:center; justify-content:center;" onmouseover="this.style.color='#ff4655'; this.style.transform='scale(1.2)'" onmouseout="this.style.color='#ffd700'; this.style.transform='none'">★</button>
        </div>
      `;
    }).join('');
  }
  
  modal.style.display = 'flex';
  lockBackgroundScroll();
}

function closeBookmarksModal() {
  const modal = document.getElementById('bookmarks-modal');
  if (modal) modal.style.display = 'none';
  unlockBackgroundScroll();
}

function bookmarksModalJump(name, tag, region, mode) {
  closeBookmarksModal();
  landingQuick(name, tag, region, mode);
}

function removeBookmarkModal(name, tag) {
  removeBookmarkDirect(name, tag);
  showBookmarksModal(); // refresh list
}

function clearRecentSearches() {
  localStorage.removeItem('valtracker_recent_searches');
  renderLandingHistory();
  showToast('Cleared search history');
}

// ══ PERSONAL PROFILE (localStorage) ══
const PROFILE_KEY = 'valstats_my_profile';

function loadMyProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch(e) { return null; }
}

function saveMyProfile(name, tag, region, mode) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, tag, region, mode }));
}

function setMyProfile() {
  const name   = document.getElementById('l-name').value.trim();
  const tag    = document.getElementById('l-tag').value.trim().replace(/^#/,'');
  const region = document.getElementById('l-region').value;
  const mode   = document.getElementById('l-mode').value;
  if (!name || !tag) { alert('Enter your name and tag first'); return; }
  saveMyProfile(name, tag, region, mode);
  renderLandingProfile();
  showToast('Profile saved ✓');
}

function renderLandingProfile() {
  const wrap = document.getElementById('landing-profile-wrap');
  if (!wrap) return;
  const p = loadMyProfile();
  if (!p) {
    wrap.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:1px;padding:8px 0">
      No profile saved yet — enter your details above and click SET AS MY PROFILE
    </div>`;
    return;
  }
  const escapedName = escapeJsString(p.name);
  const escapedTag = escapeJsString(p.tag);
  wrap.innerHTML = `<button class="landing-quick-btn" onclick="landingQuick('${escapedName}','${escapedTag}','${escapeJsString(p.region)}','${escapeJsString(p.mode)}')">
    <div class="landing-quick-dot"></div>
    <div>
      <span style="font-size:15px">${escapeHtml(p.name)}</span>
      <span style="color:var(--muted);font-size:12px;margin-left:4px">#${escapeHtml(p.tag)}</span>
    </div>
    <div style="margin-left:auto;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);letter-spacing:1px">${escapeHtml(p.region.toUpperCase())} · ${escapeHtml(p.mode)}</div>
  </button>`;
}

// renderLandingProfile called from main DOMContentLoaded


// ════════════════════════════════
//  ACCURACY + ROLES + WEAPONS
// ════════════════════════════════

function buildAccuracyBodySvg(hsPct, bsPct, lsPct) {
  const headColor = hsPct >= 25 ? 'var(--win)' : (hsPct >= 15 ? 'var(--accent)' : '#ff4655');
  const headFill = hsPct >= 25 ? 'rgba(62,207,142,0.15)' : (hsPct >= 15 ? 'rgba(232,255,71,0.09)' : 'rgba(255,70,85,0.09)');
  const visorColor = hsPct >= 25 ? '#3ecf8e' : (hsPct >= 15 ? '#e8ff47' : '#ff4655');
  
  const bodyColor = bsPct >= 50 ? '#ff4655' : 'rgba(255,255,255,0.25)';
  const bodyFill = bsPct >= 50 ? 'rgba(255,70,85,0.12)' : 'rgba(255,255,255,0.02)';
  const coreColor = bsPct >= 50 ? '#ff4655' : 'rgba(255,255,255,0.4)';
  
  const legsColor = 'rgba(255,255,255,0.2)';
  const legsFill = 'rgba(255,255,255,0.015)';

  return `
    <svg class="acc-figure" width="90" height="120" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block !important; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); flex-shrink:0;">
      <defs>
        <!-- Scanner Scanline Grid Pattern -->
        <pattern id="holo-grid" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
        </pattern>
      </defs>
      
      <!-- Hologram Background Circle & Scanner Radar -->
      <circle cx="50" cy="65" r="48" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" fill="none" />
      <circle cx="50" cy="65" r="44" stroke="rgba(255, 255, 255, 0.02)" stroke-width="0.75" stroke-dasharray="4,4" fill="none" />
      <circle cx="50" cy="65" r="54" stroke="rgba(255, 255, 255, 0.015)" stroke-width="0.5" fill="none" />
      
      <!-- Telemetry Corner Brackets -->
      <path d="M 12 18 H 6 V 24" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 88 18 H 94 V 24" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 12 112 H 6 V 106" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 88 112 H 94 V 106" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      
      <!-- Hologram grid fill underlay -->
      <circle cx="50" cy="65" r="44" fill="url(#holo-grid)" />
      
      <!-- Head (Tactical Helmet) -->
      <path d="M50,10 C56,10 60,14 60,20 C60,24 58,28 55,29 L50,32 L45,29 C42,28 40,24 40,20 C40,14 44,10 50,10 Z" fill="${headFill}" stroke="${headColor}" stroke-width="1.5"/>
      <path d="M44,18 H56 V20 H44 Z" fill="${visorColor}" opacity="0.8" style="filter: drop-shadow(0 0 3px ${visorColor});"/>
      <text x="50" y="27" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="white" font-weight="700" style="letter-spacing:-0.2px;">${hsPct}%</text>
      
      <!-- Body (Torso Chest Armor) -->
      <path d="M32,36 H68 C72,36 75,39 74,43 L69,72 C68,75 65,77 62,77 H38 C35,77 32,75 31,72 L26,43 C25,39 28,36 32,36 Z" fill="${bodyFill}" stroke="${bodyColor}" stroke-width="1.2"/>
      <path d="M36,40 H64 L61,71 H39 Z" stroke="rgba(255,255,255,0.05)" stroke-width="0.75" fill="none"/>
      <!-- Core Reactor -->
      <circle cx="50" cy="48" r="3.5" fill="none" stroke="${coreColor}" stroke-width="1"/>
      <circle cx="50" cy="48" r="1.5" fill="${coreColor}"/>
      <text x="50" y="65" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="rgba(255,255,255,0.9)" font-weight="700">${bsPct}%</text>
      
      <!-- Legs (Left/Right Armored Plates) -->
      <path d="M30,82 H44 L40,118 H32 Z" fill="${legsFill}" stroke="${legsColor}" stroke-width="1"/>
      <path d="M56,82 H70 L68,118 H60 Z" fill="${legsFill}" stroke="${legsColor}" stroke-width="1"/>
      <!-- Knee Guard details -->
      <path d="M33,100 H39" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" />
      <path d="M61,100 H67" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" />
      <text x="50" y="103" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="rgba(255,255,255,0.65)" font-weight="700">${lsPct}%</text>
    </svg>
  `;
}

function renderAccuracyAndRoles(matches) {
  // Reset outputs by default
  const accWrap = document.getElementById('acc-body-row');
  if(accWrap) {
    accWrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-family:\'DM Mono\',monospace;font-size:11px;padding:40px 0;">No accuracy data available</div>';
  }
  const rolesWrap = document.getElementById('roles-breakdown-wrap');
  if(rolesWrap) {
    rolesWrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-family:\'DM Mono\',monospace;font-size:11px;padding:40px 0;">No role data available</div>';
  }

  if (!matches || matches.length === 0) return;

  // ── Aggregate shot data ──
  let totHS=0, totBS=0, totLS=0, totShots=0;
  const roleStats={}; // role -> {m,w,k,d,a}

  matches.forEach(match=>{
    const me=findMe(match);
    if(!me)return;
    const s=me.stats||{};
    const hs=s.headshots||0, bs=s.bodyshots||0, ls=s.legshots||0;
    totHS+=hs; totBS+=bs; totLS+=ls;
    totShots+=hs+bs+ls;

    const agentName=me.character||'Unknown';
    const role=getRoleClass(agentName);
    const myTeamId=(me.team||'').toLowerCase();
    const myTeam=match.teams?.[myTeamId];
    const oppTeam=match.teams?.[myTeamId==='red'?'blue':'red'];
    let won=false;
    if(myTeam?.has_won===true) won=true;
    else if(myTeam?.rounds_won!=null&&oppTeam?.rounds_won!=null) won=myTeam.rounds_won>oppTeam.rounds_won;

    if(!roleStats[role]) roleStats[role]={m:0,w:0,k:0,d:0,a:0};
    const r=roleStats[role];
    r.m++; if(won)r.w++;
    r.k+=s.kills||0; r.d+=s.deaths||0; r.a+=s.assists||0;
  });

  // ── Render Accuracy ──
  const hsPct = totShots?Math.round(totHS/totShots*100):0;
  const bsPct = totShots?Math.round(totBS/totShots*100):0;
  const lsPct = totShots?Math.round(totLS/totShots*100):0;

  if(accWrap && totShots>0){
    accWrap.innerHTML = `
      ${buildAccuracyBodySvg(hsPct, bsPct, lsPct)}
      <!-- Bars -->
      <div class="acc-bars">
        ${[['HEAD', totHS, hsPct, hsPct>=25?'var(--win)':hsPct>=15?'var(--accent)':'var(--loss)'],
           ['BODY', totBS, bsPct, 'rgba(255,255,255,0.5)'],
           ['LEGS', totLS, lsPct, 'var(--loss)']].map(([lbl,hits,pct,col])=>`
          <div class="acc-row">
            <span class="acc-lbl">${lbl}</span>
            <div class="acc-track"><div class="acc-fill" style="width:${pct}%;background:${col};"></div></div>
            <span class="acc-pct" style="color:${col}">${pct}%</span>
            <span class="acc-hits">${hits.toLocaleString()} hits</span>
          </div>`).join('')}
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">AVG HS%</span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:24px;color:${hsPct>=25?'var(--win)':hsPct>=15?'var(--accent)':'var(--loss)'};">${hsPct}%</span>
        </div>
      </div>`;
  }

  // ── Render Roles ──
  const roleConfig = {
    duelist:    { icon:'⚔️', color:'#ff7b7b', label:'Duelist' },
    initiator:  { icon:'🔍', color:'#f5a623', label:'Initiator' },
    controller: { icon:'💨', color:'var(--win)', label:'Controller' },
    sentinel:   { icon:'🛡️', color:'#7ab8ff', label:'Sentinel' },
  };
  const roleEntries = Object.entries(roleStats).filter(([,v])=>v.m>0)
    .sort((a,b)=>b[1].m-a[1].m);

  if(rolesWrap && roleEntries.length){
    rolesWrap.innerHTML = roleEntries.map(([role,v])=>{
      const cfg = roleConfig[role]||{icon:'🎮',color:'var(--muted)',label:role};
      const wr  = Math.round(v.w/v.m*100);
      const kda = v.d ? ((v.k+v.a*0.5)/v.d).toFixed(2) : v.k.toFixed(2);
      const wrCol = wr>=55?'var(--win)':wr<=44?'var(--loss)':'var(--accent)';
      return `<div class="role-row">
        <div class="role-icon-wrap" style="background:${cfg.color}22;border:1px solid ${cfg.color}33;">
          <span style="font-size:17px">${cfg.icon}</span>
        </div>
        <div class="role-name-col">
          <div class="role-title" style="color:${cfg.color}">${cfg.label}</div>
          <div class="role-wl">${v.w}W · ${v.m-v.w}L · ${v.m} games</div>
        </div>
        <div style="text-align:right;">
          <div class="role-wr" style="color:${wrCol}">${wr}%</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2)">WR</div>
        </div>
        <div style="text-align:right;min-width:44px;">
          <div class="role-kda" style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px">${kda}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2)">KDA</div>
        </div>
      </div>`;
    }).join('');
  }
}

// ─── Weapon Trend Tracking (localStorage-based, zero backend dependency) ────
function _saveWeaponSnapshot(weaponData) {
  if (!PLAYER_NAME || !PLAYER_TAG) return;
  const key = `vt_wpn_hist_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}_${(window._currentMode || 'competitive').toLowerCase()}`;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key)) || []; } catch(e) { history = []; }
  const snapshot = { ts: Date.now(), weapons: {} };
  Object.entries(weaponData).forEach(([wpn, v]) => {
    if (v.kills >= 1) snapshot.weapons[wpn] = { kills: v.kills, hs: v.hs, hsPct: v.kills ? Math.round(v.hs / v.kills * 100) : 0 };
  });
  // Deduplicate: overwrite if last snapshot was within 10 minutes (same session re-fetch)
  const tenMinAgo = Date.now() - 10 * 60 * 1000;
  if (history.length > 0 && history[history.length - 1].ts > tenMinAgo) {
    history[history.length - 1] = snapshot;
  } else {
    history.push(snapshot);
  }
  if (history.length > 15) history = history.slice(-15);
  try { localStorage.setItem(key, JSON.stringify(history)); } catch(e) {}
}

function _getWeaponTrend(wpn, currentHsPct) {
  if (!PLAYER_NAME || !PLAYER_TAG) return { trend: 'new', delta: 0, sparkPoints: [currentHsPct] };
  const key = `vt_wpn_hist_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}_${(window._currentMode || 'competitive').toLowerCase()}`;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
  const withData = history.filter(s => s.weapons && s.weapons[wpn] !== undefined);
  const sparkPoints = withData.map(s => s.weapons[wpn].hsPct);
  if (withData.length < 2) return { trend: 'new', delta: 0, sparkPoints };
  const prev = withData[withData.length - 2].weapons[wpn].hsPct;
  const delta = currentHsPct - prev;
  const trend = delta >= 3 ? 'up' : delta <= -3 ? 'down' : 'flat';
  return { trend, delta, sparkPoints };
}

function _buildSparklineSVG(points, w, h) {
  if (!points || points.length < 2) return '';
  const min = Math.min(...points), max = Math.max(...points), range = (max - min) || 1;
  const px = 4, py = 4, iw = w - px * 2, ih = h - py * 2;
  const pts = points.map((v, i) => {
    const x = px + (i / (points.length - 1)) * iw;
    const y = py + ih - ((v - min) / range) * ih;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lp = pts[pts.length - 1].split(',');
  const lx = parseFloat(lp[0]), ly = parseFloat(lp[1]);
  const rising = points[points.length - 1] >= points[points.length - 2];
  const col = rising ? '#3ecf8e' : '#ff4d6d';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible"><polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="${lx}" cy="${ly}" r="2.5" fill="${col}"/></svg>`;
}

function getHeatmapSvg(hsPct, height = 115) {
  const hs = Math.min(Math.round(hsPct * 0.7) + 5, 55); 
  const lg = Math.max(Math.round((100 - hs) * 0.08), 3); 
  const bd = 100 - hs - lg; 
  
  const hsOpacity = Math.max(0.12, hs / 60);
  const bdOpacity = Math.max(0.12, bd / 100);
  const lgOpacity = Math.max(0.06, lg / 20);
  
  const hsFill = `rgba(255, 70, 85, ${hsOpacity})`;
  const bdFill = `rgba(255, 70, 85, ${bdOpacity})`;
  const lgFill = `rgba(255, 70, 85, ${lgOpacity})`;
  
  return `
    <svg viewBox="0 0 100 160" style="height:${height}px; width:auto; overflow:visible; display:block;" class="wpn-silhouette-svg">
      <defs>
        <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>
      
      <path class="wpn-heat-seg" data-segment="HEAD" data-pct="${hs}" 
            d="M 50 35 C 57 35, 62 29, 62 20 C 62 11, 57 5, 50 5 C 43 5, 38 11, 38 20 C 38 29, 43 35, 50 35 Z" 
            fill="${hsFill}" stroke="#ff4655" stroke-width="1.5" style="filter: ${hs >= 30 ? 'url(#glow-red)' : 'none'}; transition: all 0.2s;" />
            
      <path class="wpn-heat-seg" data-segment="BODY" data-pct="${bd}" 
            d="M 32 40 L 68 40 C 72 45, 72 55, 70 70 L 66 110 C 66 110, 60 115, 50 115 C 40 115, 34 110, 34 110 L 30 70 C 28 55, 28 45, 32 40 Z" 
            fill="${bdFill}" stroke="#ff4655" stroke-width="1.5" style="filter: ${bd >= 50 ? 'url(#glow-red)' : 'none'}; transition: all 0.2s;" />
            
      <path class="wpn-heat-seg" data-segment="LEGS" data-pct="${lg}" 
            d="M 35 116 C 37 116, 47 118, 48 122 L 44 155 C 44 157, 36 157, 34 157 C 32 157, 32 153, 33 148 L 36 122 M 65 116 C 63 116, 53 118, 52 122 L 56 155 C 56 157, 64 157, 66 157 C 68 157, 68 153, 67 148 L 64 122" 
            fill="${lgFill}" stroke="#ff4655" stroke-width="1.5" style="transition: all 0.2s;" />
    </svg>
  `;
}

function renderTopWeapons(matches, precomputed) {
  const weaponData = precomputed || {};

  // Weapon image URLs from valorant-api CDN (display names as keys)
  const WEAPON_IMGS = {
    'Vandal':   'https://media.valorant-api.com/weapons/9c82e19d-4575-0200-1a81-3eacf00cf872/displayicon.png',
    'Phantom':  'https://media.valorant-api.com/weapons/ee8d8960-4240-a65e-4d1c-5d03a2c64daf/displayicon.png',
    'Operator': 'https://media.valorant-api.com/weapons/a03b24d3-4319-996d-0f8c-94bbfba1dfc7/displayicon.png',
    'Sheriff':  'https://media.valorant-api.com/weapons/1baa85b4-4c70-1284-64bb-8481d23f0538/displayicon.png',
    'Ghost':    'https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png',
    'Spectre':  'https://media.valorant-api.com/weapons/462080d1-4035-2937-7c09-27aa2a5c27a7/displayicon.png',
    'Bulldog':  'https://media.valorant-api.com/weapons/ae3de142-4d85-2547-dd26-4e90bed35cf7/displayicon.png',
    'Guardian': 'https://media.valorant-api.com/weapons/4ade7faa-4cf1-8376-95ef-39884480959b/displayicon.png',
    'Frenzy':   'https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png',
    'Marshal':  'https://media.valorant-api.com/weapons/c4883e50-4494-202c-3ec3-6b8a9284f00b/displayicon.png',
    'Stinger':  'https://media.valorant-api.com/weapons/f7e1b454-4ad4-1063-ec0a-159e56b58941/displayicon.png',
    'Bucky':    'https://media.valorant-api.com/weapons/910be174-449b-c412-ab22-d0873436b21b/displayicon.png',
    'Judge':    'https://media.valorant-api.com/weapons/ec845bf4-4f79-ddda-a3da-0db3d5af23b5/displayicon.png',
    'Ares':     'https://media.valorant-api.com/weapons/55d8a0f4-4274-ca67-fe2c-06ab45efdf58/displayicon.png',
    'Odin':     'https://media.valorant-api.com/weapons/63e6c2b6-4a8e-869c-3d4c-e38355226584/displayicon.png',
    'Classic':  'https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png',
  };
  const WEAPON_TYPES = {
    'Vandal':'Assault Rifle','Phantom':'Assault Rifle','Bulldog':'Assault Rifle','Guardian':'Assault Rifle',
    'Operator':'Sniper','Marshal':'Sniper',
    'Sheriff':'Sidearm','Ghost':'Sidearm','Frenzy':'Sidearm','Classic':'Sidearm',
    'Spectre':'SMG','Stinger':'SMG',
    'Bucky':'Shotgun','Judge':'Shotgun',
    'Ares':'LMG','Odin':'LMG',
  };

  // Use precomputed weapon data from processMatches (avoids iterating full matches)
  // If no precomputed data available, weaponData stays empty and we show empty state

  // Sort matchHistory chronological (oldest to newest) for line charts
  Object.values(weaponData).forEach(w => {
    if (w.matchHistory) w.matchHistory.sort((a, b) => a.gameStart - b.gameStart);
  });

  const wrap = document.getElementById('weapons-grid-wrap');
  if(!wrap) return;

  let entries=Object.entries(weaponData).filter(([,v])=>v.kills>=1)
    .sort((a,b)=>b[1].kills-a[1].kills).slice(0,6);

  let usingCachedData = false;
  if(!entries.length){
    if(PLAYER_NAME && PLAYER_TAG){
      const key = `vt_wpn_hist_${PLAYER_NAME.toLowerCase()}_${PLAYER_TAG.toLowerCase()}_${(window._currentMode || 'competitive').toLowerCase()}`;
      let history = [];
      try { history = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
      if(history.length > 0){
        const lastSnapshot = history[history.length - 1];
        if(lastSnapshot && lastSnapshot.weapons && Object.keys(lastSnapshot.weapons).length > 0){
          Object.entries(lastSnapshot.weapons).forEach(([wpn, data]) => {
            weaponData[wpn] = {
              kills: data.kills || 0,
              hs: data.hs || 0
            };
          });
          entries = Object.entries(weaponData).filter(([,v])=>v.kills>=1)
            .sort((a,b)=>b[1].kills-a[1].kills).slice(0,6);
          usingCachedData = true;
        }
      }
    }
  }

  if(!entries.length){
    if (!matches || matches.length === 0) {
      wrap.innerHTML='<div class="placeholder-txt" style="padding:16px 0">No weapon data available for this mode</div>';
    } else {
      wrap.innerHTML='<div class="placeholder-txt" style="padding:16px 0">Compiling your top weapons from background match details...</div>';
    }
    return;
  }

  // ── Save snapshot AFTER computing weaponData so history is always up-to-date ──
  if (!usingCachedData) {
    _saveWeaponSnapshot(weaponData);
  }

  const topWeapon = entries[0];
  const secondaryWeapons = entries.slice(1, 5); // limit to 4 secondary weapons

  let showcaseHtml = `<div class="weapons-showcase-container">`;

  // ── TOP WEAPON with Sparkline Trend ──
  if (topWeapon) {
    const [wpn, v] = topWeapon;
    const hsPct = v.kills ? Math.round(v.hs / v.kills * 100) : 0;
    const cachedWpn = _assetCache.weapons[wpn.toLowerCase()];
    const imgUrl = cachedWpn ? cachedWpn.iconUrl : (WEAPON_IMGS[wpn] || null);
    const type = WEAPON_TYPES[wpn] || 'Weapon';
    const hsPctCol = hsPct >= 30 ? 'var(--win)' : hsPct >= 20 ? 'var(--accent)' : 'var(--loss)';
    
    // session comparisons (for trend delta pill)
    const trendInfo = _getWeaponTrend(wpn, hsPct);
    
    // 10-match history sparkline (recent matches)
    const topWpnMatchPoints = v.matchHistory ? v.matchHistory.slice(-10).map(h => h.hsPct) : [];
    const topWpnSparkSVG = _buildSparklineSVG(topWpnMatchPoints, 120, 32);
    const matchSessionCount = topWpnMatchPoints.length;

    let deltaPill = '';
    if (trendInfo.trend === 'up') {
      deltaPill = `<span class="wpn-trend-pill wpn-trend-pill-up">&#9650; +${trendInfo.delta}%</span>`;
    } else if (trendInfo.trend === 'down') {
      deltaPill = `<span class="wpn-trend-pill wpn-trend-pill-down">&#9660; ${trendInfo.delta}%</span>`;
    } else if (trendInfo.trend === 'flat') {
      const dSign = trendInfo.delta > 0 ? `+${trendInfo.delta}` : trendInfo.delta < 0 ? `${trendInfo.delta}` : `&plusmn;0`;
      deltaPill = `<span class="wpn-trend-pill wpn-trend-pill-flat">${dSign}%</span>`;
    }

    const sparklineBlock = topWpnSparkSVG
      ? `<div class="wpn-sparkline-section">
           <div class="wpn-sparkline-header">
             <span class="wpn-sparkline-label">10-MATCH TREND</span>
             <span class="wpn-sparkline-sessions">${matchSessionCount} match${matchSessionCount !== 1 ? 'es' : ''} tracked</span>
           </div>
           <div class="wpn-sparkline-wrap">${topWpnSparkSVG}</div>
           <div class="wpn-sparkline-axis">
             <span>${Math.min(...topWpnMatchPoints)}%</span>
             <span class="wpn-sparkline-axis-mid">recent matches</span>
             <span>${Math.max(...topWpnMatchPoints)}%</span>
           </div>
         </div>`
      : `<div class="wpn-sparkline-section wpn-first-session">
           <span class="wpn-sparkline-label">&#128202; TRACKING STARTED</span>
           <span class="wpn-sparkline-sessions">Trend data builds across your next matches</span>
         </div>`;

    // Tooltip detailed sparkline for Top Weapon
    const topWpnTooltipSparkSVG = _buildSparklineSVG(topWpnMatchPoints, 120, 24);
    const topWpnSparklineTooltipBlock = topWpnTooltipSparkSVG
      ? `<div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
           <div style="display:flex; justify-content:space-between; width: 100%; font-family:'Barlow Condensed', sans-serif; font-size:9px; font-weight:800; text-transform:uppercase; color:var(--win); letter-spacing:0.5px;">
             <span>10-Match Trend</span>
             <span style="color:var(--muted2); font-weight:normal; font-size:7px;">${topWpnMatchPoints.length} games</span>
           </div>
           <div style="height: 24px; width: 120px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
             ${topWpnTooltipSparkSVG}
           </div>
           <div style="display:flex; justify-content:space-between; width:100%; font-family:'DM Mono',monospace; font-size:7px; color:var(--muted2);">
             <span>Min: ${Math.min(...topWpnMatchPoints)}%</span>
             <span>Max: ${Math.max(...topWpnMatchPoints)}%</span>
           </div>
         </div>`
      : `<div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-family:'Barlow Condensed', sans-serif; font-size:8px; color:var(--muted2); text-align:center;">
           <span>10-MATCH TREND</span>
           <span style="font-size:7px;">Not enough matches played with this weapon</span>
         </div>`;

    showcaseHtml += `
      <div class="top-weapon-showcase" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div class="top-weapon-badge">&#128293; Top Arsenal</div>
        
        <div class="top-weapon-img-wrap" style="text-align: center; margin-bottom: 8px;">
          ${imgUrl
            ? `<img class="top-weapon-img" src="${imgUrl}" alt="${escapeHtml(wpn)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
            : ''}
          <div class="weapon-img-fallback" style="${imgUrl ? 'display:none;' : ''}">${escapeHtml(wpn)}</div>
        </div>
        
        <div class="top-weapon-info-wrap">
          <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
            <div class="top-weapon-details" style="padding: 0;">
              <div class="top-weapon-name" style="margin: 0; line-height: 1;">${wpn}</div>
              <div class="top-weapon-type">${type}</div>
              <div class="top-weapon-stats-grid" style="margin-top: 10px; margin-bottom: 10px;">
                <div class="top-weapon-stat">
                  <span class="top-weapon-val">${v.kills}</span>
                  <span class="top-weapon-lbl">Kills</span>
                </div>
                <div class="top-weapon-stat">
                  <span class="top-weapon-val" style="color:${hsPctCol}">${hsPct}%&thinsp;${deltaPill}</span>
                  <span class="top-weapon-lbl">HS Kill %</span>
                </div>
              </div>
            </div>
            ${sparklineBlock}
          </div>
          
          <div class="wpn-heatmap-card" style="width: 125px; flex-shrink: 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 8px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
              <div style="position: relative;">
                 ${getHeatmapSvg(hsPct, 105)}
              </div>
              <div style="display: flex; flex-direction: column; gap: 5px; font-family:'DM Mono', monospace; font-size: 8px; min-width: 45px; text-align: left;">
                <div style="display: flex; flex-direction: column;">
                  <span style="color: #ff4655; font-weight: bold; letter-spacing: 0.5px;">HEAD</span>
                  <span style="font-size: 10px; font-weight: 900; color: #fff;">${Math.min(Math.round(hsPct * 0.7) + 5, 55)}%</span>
                </div>
                <div style="display: flex; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 3px;">
                  <span style="color: rgba(255, 70, 85, 0.75); font-weight: bold; letter-spacing: 0.5px;">BODY</span>
                  <span style="font-size: 10px; font-weight: 900; color: #fff;">${100 - Math.min(Math.round(hsPct * 0.7) + 5, 55) - Math.max(Math.round((100 - Math.min(Math.round(hsPct * 0.7) + 5, 55)) * 0.08), 3)}%</span>
                </div>
                <div style="display: flex; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 3px;">
                  <span style="color: rgba(255, 70, 85, 0.45); font-weight: bold; letter-spacing: 0.5px;">LEGS</span>
                  <span style="font-size: 10px; font-weight: 900; color: #fff;">${Math.max(Math.round((100 - Math.min(Math.round(hsPct * 0.7) + 5, 55)) * 0.08), 3)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Secondary Weapon Stack (Right Side)
  showcaseHtml += `<div class="secondary-weapon-stack">`;
  secondaryWeapons.forEach(([wpn, v]) => {
    const hsPct = v.kills ? Math.round(v.hs / v.kills * 100) : 0;
    const cachedWpn = _assetCache.weapons[wpn.toLowerCase()];
    const imgUrl = cachedWpn ? cachedWpn.iconUrl : (WEAPON_IMGS[wpn] || null);
    const type = WEAPON_TYPES[wpn] || 'Weapon';
    const hsPctCol = hsPct >= 30 ? 'var(--win)' : hsPct >= 20 ? 'var(--accent)' : 'var(--loss)';
    const trendInfo = _getWeaponTrend(wpn, hsPct);

    let trendArrow = '';
    if (trendInfo.trend === 'up') {
      trendArrow = `<span class="sec-wpn-trend sec-wpn-trend-up" title="HS% up +${trendInfo.delta}% vs last session">&#9650; +${trendInfo.delta}%</span>`;
    } else if (trendInfo.trend === 'down') {
      trendArrow = `<span class="sec-wpn-trend sec-wpn-trend-down" title="HS% down ${trendInfo.delta}% vs last session">&#9660; ${trendInfo.delta}%</span>`;
    } else if (trendInfo.trend === 'flat') {
      const dSign = trendInfo.delta > 0 ? `+${trendInfo.delta}` : trendInfo.delta < 0 ? `${trendInfo.delta}` : `&plusmn;0`;
      trendArrow = `<span class="sec-wpn-trend sec-wpn-trend-flat" title="HS% stable vs last session">${dSign}%</span>`;
    } else {
      trendArrow = `<span class="sec-wpn-trend sec-wpn-trend-new" title="First session — tracking started">NEW</span>`;
    }

    // 10-match history sparkline for secondary weapon
    const secMatchPoints = v.matchHistory ? v.matchHistory.slice(-10).map(h => h.hsPct) : [];
    const secSparkSVG = _buildSparklineSVG(secMatchPoints, 120, 24);
    const secSparklineTooltipBlock = secSparkSVG
      ? `<div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
           <div style="display:flex; justify-content:space-between; width: 100%; font-family:'Barlow Condensed', sans-serif; font-size:9px; font-weight:800; text-transform:uppercase; color:var(--win); letter-spacing:0.5px;">
             <span>10-Match Trend</span>
             <span style="color:var(--muted2); font-weight:normal; font-size:7px;">${secMatchPoints.length} games</span>
           </div>
           <div style="height: 24px; width: 120px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
             ${secSparkSVG}
           </div>
           <div style="display:flex; justify-content:space-between; width:100%; font-family:'DM Mono',monospace; font-size:7px; color:var(--muted2);">
             <span>Min: ${Math.min(...secMatchPoints)}%</span>
             <span>Max: ${Math.max(...secMatchPoints)}%</span>
           </div>
         </div>`
      : `<div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-family:'Barlow Condensed', sans-serif; font-size:8px; color:var(--muted2); text-align:center;">
           <span>10-MATCH TREND</span>
           <span style="font-size:7px;">Not enough matches played with this weapon</span>
         </div>`;

    showcaseHtml += `
      <div class="secondary-weapon-row wpn-tooltip-trigger">
        <div class="sec-weapon-img-wrap">
          ${imgUrl
            ? `<img class="sec-weapon-img" src="${imgUrl}" alt="${escapeHtml(wpn)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
            : ''}
          <div class="weapon-img-fallback" style="${imgUrl ? 'display:none;' : ''}">${escapeHtml(wpn)}</div>
        </div>
        <div class="sec-weapon-meta">
          <div class="sec-weapon-name">${wpn}</div>
          <div class="sec-weapon-type">${type}</div>
        </div>
        <div class="sec-weapon-stats-wrap">
          <div class="sec-weapon-stat">
            <span class="sec-weapon-val">${v.kills}</span>
            <span class="sec-weapon-lbl">Kills</span>
          </div>
          <div class="sec-weapon-stat">
            <span class="sec-weapon-val" style="color:${hsPctCol}">${hsPct}%</span>
            <span class="sec-weapon-lbl">HS Kill %</span>
          </div>
        </div>
        <div class="sec-weapon-acc-bars">
          <div class="sec-weapon-acc-row">
            <span class="sec-war-lbl">HS</span>
            <div class="sec-war-bar-wrap">
              <div class="sec-war-bar-fill" style="width:${hsPct}%;background:var(--win);"></div>
            </div>
            <span class="sec-war-pct" style="color:var(--win)">${hsPct}%</span>
          </div>
          <div class="sec-weapon-acc-row">
            <span class="sec-war-lbl">BD/LG</span>
            <div class="sec-war-bar-wrap">
              <div class="sec-war-bar-fill" style="width:${100 - hsPct}%;background:var(--muted2);"></div>
            </div>
            <span class="sec-war-pct" style="color:var(--muted2)">${100 - hsPct}%</span>
          </div>
        </div>
        
        <div class="wpn-tooltip-card" style="width: 150px; gap: 8px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:10px; font-weight:800; text-transform:uppercase; color:var(--accent); letter-spacing:0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); width: 100%; text-align: center; padding-bottom: 3px; margin-bottom: 2px;">Target Heatmap</div>
          ${getHeatmapSvg(hsPct, 64)}
          <div style="display:flex; justify-content:space-between; width:100%; font-family:'DM Mono',monospace; font-size:8px; color:#fff; padding-bottom: 4px; box-sizing:border-box;">
            <span style="color:#ff4655">H:${Math.min(Math.round(hsPct * 0.7) + 5, 55)}%</span>
            <span style="color:rgba(255,70,85,0.75)">B:${100 - Math.min(Math.round(hsPct * 0.7) + 5, 55) - Math.max(Math.round((100 - Math.min(Math.round(hsPct * 0.7) + 5, 55)) * 0.08), 3)}%</span>
            <span style="color:rgba(255,70,85,0.45)">L:${Math.max(Math.round((100 - Math.min(Math.round(hsPct * 0.7) + 5, 55)) * 0.08), 3)}%</span>
          </div>
          ${secSparklineTooltipBlock}
        </div>
        
        <div class="sec-wpn-trend-col">${trendArrow}</div>
      </div>
    `;
  });
  showcaseHtml += `</div></div>`;

  // Add the Riot Games API disclaimer footnote
  showcaseHtml += `
    <div class="weapon-disclaimer">
      <span class="asterisk">*</span>
      <div>
        Riot Games' match API only exposes weapon data in individual final kill events. 
        <strong>HS Kill %</strong> represents the percentage of your kills that were finished with a headshot, which typically ranges from 40-70% depending on weapon type, and is distinct from overall bullet hit accuracy.
        <strong>Trend arrows</strong> compare your current HS% with your previous tracked session &#8212; stored locally in your browser and never sent to any server.
      </div>
    </div>
  `;

  wrap.innerHTML = showcaseHtml;
}

function updateRankDisplayForAct(selectedAct) {
  const d = window._rawMmrData;
  if (!d) {
    const rankDisplayEl = document.getElementById('rank-display');
    if (rankDisplayEl) rankDisplayEl.textContent = 'UNRANKED';
    const rankRrTxtEl = document.getElementById('rank-rr-txt');
    if (rankRrTxtEl) rankRrTxtEl.textContent = '—';
    const rankIconEl = document.getElementById('rank-icon');
    if (rankIconEl) rankIconEl.innerHTML = `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`;
    const peakIconEl = document.getElementById('peak-icon');
    if (peakIconEl) peakIconEl.innerHTML = '';
    return;
  }
  
  let rankName = '—';
  let rankImgUrl = null;
  let rr = 0;
  
  if (selectedAct === 'all' || selectedAct === 'v26a3') {
    // Show current live rating
    rankName = d.current?.tier?.name || '—';
    rankImgUrl = getRankImgUrl(d.current?.tier?.name || '');
    rr = d.current?.rr || 0;
  } else {
    // Show rating for the selected past Act
    const apiSeason = SEASONS_MAP[selectedAct];
    const seasonData = d.by_season?.[apiSeason];
    if (seasonData && !seasonData.error) {
      rankName = seasonData.final_rank_patched || '—';
      rankImgUrl = getRankImgUrl(rankName);
      rr = 0;
    }
  }
  
  const rankDisplayEl = document.getElementById('rank-display');
  if (rankDisplayEl) rankDisplayEl.textContent = rankName.toUpperCase();
  
  const rankRrTxtEl = document.getElementById('rank-rr-txt');
  if (rankRrTxtEl) {
    rankRrTxtEl.textContent = (selectedAct === 'all' || selectedAct === 'v26a3')
      ? `${rr} RR · Peak: ${d.peak?.tier?.name||'—'}`
      : `Season Concluded`;
  }
    
  const rankIconEl = document.getElementById('rank-icon');
  if (rankIconEl) {
    rankIconEl.innerHTML = rankImgUrl 
      ? `<img src="${rankImgUrl}" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'">`
      : `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`;
  }
}

/* ── CORE FEATURES LOGIC ── */

// 1. Rank Prediction
function updateRankPrediction(matches, currentRR) {
  const el = document.getElementById('rank-prediction');
  if (!el || !matches || matches.length === 0 || currentRR === undefined || currentRR === null) {
    if (el) el.style.display = 'none';
    return;
  }
  
  let rrGains = 0, rrLosses = 0;
  let gainCount = 0, lossCount = 0;
  
  matches.slice(0, 10).forEach(m => {
    const rr = window._mmrHistory && window._mmrHistory[m.metadata?.matchid];
    if (rr > 0) { rrGains += rr; gainCount++; }
    else if (rr < 0) { rrLosses += Math.abs(rr); lossCount++; }
  });
  
  const avgGain = gainCount > 0 ? rrGains / gainCount : 18;
  const avgLoss = lossCount > 0 ? rrLosses / lossCount : 15;
  
  const totalWins = matches.filter(m => {
    const me = findMe(m);
    if (!me) return false;
    const myTeamId = (me.team||'').toLowerCase();
    const myTeam = m.teams && m.teams[myTeamId];
    return myTeam && (myTeam.has_won === true || myTeam.rounds_won > (m.teams[myTeamId==='red'?'blue':'red']?.rounds_won||0));
  }).length;
  
  // Smooth out win rate using all available matches (up to 25) to prevent extreme volatility
  const wr = matches.length > 5 ? (totalWins / matches.length) : 0.5;
  const netGainPerMatch = (wr * avgGain) - ((1 - wr) * avgLoss);
  
  if (netGainPerMatch > 2.5) {
    const rrNeeded = 100 - (currentRR % 100);
    const matchesNeeded = Math.ceil(rrNeeded / netGainPerMatch);
    el.innerHTML = `At your current pace, you'll hit the <b>Next Rank</b> in ~${matchesNeeded} games.`;
    el.style.display = 'block';
  } else if (netGainPerMatch > 0) {
    el.innerHTML = `You are climbing very slowly. Improve your win rate to rank up faster!`;
    el.style.display = 'block';
  } else {
    el.innerHTML = `Trend is negative. Focus on improvement to rank up!`;
    el.style.display = 'block';
  }
}
  
  // Hook into the fetch pipeline for Rank Prediction
// 2. Session Tracker
let sessionActive = false;
let sessionStartTime = null;
let sessionStartRR = null;
let sessionMatches = [];

const originalProcessMatches = processMatches;
processMatches = function(matches) {
  originalProcessMatches(matches);
  if (window._currentMode === 'competitive') {
    updateRankPrediction(matches, window._currentRankRR);
  } else {
    const el = document.getElementById('rank-prediction');
    if (el) el.style.display = 'none';
  }
  
  // Track matches for active session
  if (sessionActive && matches.length > 0) {
    const newMatches = matches.filter(m => m.metadata?.game_start * 1000 > sessionStartTime.getTime());
    sessionMatches = newMatches;
  }
};

function toggleSession() {
  const btn = document.getElementById('session-btn');
  const sumBtn = document.getElementById('session-summary-btn');
  if (!sessionActive) {
    sessionActive = true;
    sessionStartTime = new Date();
    sessionStartRR = window._currentRankRR || 0;
    sessionMatches = [];
    btn.innerHTML = '⏹ End Session';
    btn.style.background = 'rgba(255,87,87,0.15)';
    btn.style.color = 'var(--loss)';
    btn.style.borderColor = 'rgba(255,87,87,0.3)';
    sumBtn.style.display = 'none';
    showToast('Session Started');
  } else {
    sessionActive = false;
    btn.innerHTML = '▶ Start Session';
    btn.style.background = 'rgba(77,159,255,0.15)';
    btn.style.color = 'var(--blue)';
    btn.style.borderColor = 'rgba(77,159,255,0.3)';
    sumBtn.style.display = 'inline-block';
    showToast('Session Ended');
    showSessionSummary();
  }
}

function showSessionSummary() {
  const modal = document.getElementById('session-modal');
  const content = document.getElementById('session-content');
  
  if (!sessionMatches || sessionMatches.length === 0) {
    content.innerHTML = `
      <div style="text-align:center; padding:30px 16px; display:flex; flex-direction:column; align-items:center; gap:16px;">
        <div style="font-size:42px; filter:drop-shadow(0 0 12px var(--accent));">🎮</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:22px; text-transform:uppercase; letter-spacing:1px; color:var(--text);">No session matches recorded</div>
        <p style="font-family:'DM Mono',monospace; font-size:11px; color:var(--muted); max-width:320px; line-height:1.6; margin:0;">
          You haven't played any new matches since starting this session. Play a match, click "Fetch Stats" to load it, then view your summary!
        </p>
      </div>
    `;
    modal.style.display = 'flex';
    lockBackgroundScroll();
    return;
  }
  
  const matchesToUse = sessionMatches;
  
  let wins = 0, losses = 0;
  let totalKills = 0, totalDeaths = 0;
  let agents = {};
  
  matchesToUse.forEach(m => {
    const me = findMe(m);
    if(!me) return;
    const myTeamId = (me.team||'').toLowerCase();
    const myTeam = m.teams && m.teams[myTeamId];
    let won = false;
    if (myTeam?.has_won === true) { won = true; } 
    else if (myTeam?.rounds_won != null) {
      const oppId = myTeamId === 'red' ? 'blue' : 'red';
      won = myTeam.rounds_won > (m.teams[oppId]?.rounds_won||0);
    }
    if (won) wins++; else losses++;
    
    totalKills += me.stats?.kills || 0;
    totalDeaths += me.stats?.deaths || 0;
    
    const ag = me.character || 'Unknown';
    agents[ag] = (agents[ag] || 0) + 1;
  });
  
  const bestAgent = Object.keys(agents).sort((a,b) => agents[b] - agents[a])[0] || 'N/A';
  const kd = totalDeaths > 0 ? (totalKills/totalDeaths).toFixed(2) : totalKills;
  const currentRR = window._currentRankRR || 0;
  const rrChange = sessionStartRR !== null ? (currentRR - sessionStartRR) : 'N/A';
  
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface2); padding:16px; border-radius:var(--radius-sm);">
      <div>
        <div style="font-family:'DM Mono', monospace; font-size:11px; color:var(--muted); letter-spacing:1px;">RECORD</div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-weight:800; font-size:28px;">
          <span style="color:var(--win)">${wins}W</span> - <span style="color:var(--loss)">${losses}L</span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'DM Mono', monospace; font-size:11px; color:var(--muted); letter-spacing:1px;">RR CHANGE</div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-weight:800; font-size:28px; color:${rrChange > 0 ? 'var(--win)' : (rrChange < 0 ? 'var(--loss)' : 'var(--text)')}">
          ${rrChange > 0 ? '+'+rrChange : rrChange}
        </div>
      </div>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div style="background:var(--surface2); padding:12px; border-radius:var(--radius-sm); text-align:center;">
        <div style="font-family:'DM Mono', monospace; font-size:10px; color:var(--muted);">BEST AGENT</div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-weight:700; font-size:20px; color:var(--accent);">${bestAgent}</div>
      </div>
      <div style="background:var(--surface2); padding:12px; border-radius:var(--radius-sm); text-align:center;">
        <div style="font-family:'DM Mono', monospace; font-size:10px; color:var(--muted);">OVERALL K/D</div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-weight:700; font-size:20px;">${kd}</div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  lockBackgroundScroll();
}

function closeSessionModal() {
  const modal = document.getElementById('session-modal');
  if (modal) modal.style.display = 'none';
  unlockBackgroundScroll();
}

async function exportSessionCard() {
  if (typeof html2canvas === 'undefined') {
    showToast('Export library not loaded.');
    return;
  }
  const el = document.getElementById('session-card-export');
  const canvas = await html2canvas(el, { backgroundColor: '#0a0a0c', scale: 2 });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `valtracker_session_${new Date().getTime()}.png`;
  a.click();
}


// 3. Live Match Overlay
function toTitleCase(str) {
  if (!str) return '';
  return str.trim().toLowerCase().split(/\s+/).map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function getTitleCasedRank(rankStr) {
  if (!rankStr || rankStr === '—' || rankStr.toLowerCase() === 'unranked') {
    return 'Diamond 2';
  }
  return toTitleCase(rankStr);
}

function getPlayerIdentityInfo() {
  const myName = PLAYER_NAME || 'Pratham';
  const myTag = PLAYER_TAG || 'Lobby';
  
  // Rank
  let myRank = 'Diamond 2';
  const rankEl = document.getElementById('rank-display');
  if (rankEl && rankEl.textContent && rankEl.textContent.trim() !== '—') {
    myRank = rankEl.textContent.trim();
  }
  
  // Level
  let myLevel = 89;
  const lvlEl = document.getElementById('player-level') || document.getElementById('hero-level-badge');
  if (lvlEl && lvlEl.textContent && lvlEl.textContent.trim() !== '') {
    const matched = lvlEl.textContent.match(/\d+/);
    if (matched) {
      myLevel = parseInt(matched[0], 10);
    }
  }
  
  // Preferred agent
  let myAgent = 'Cypher';
  const matches = window._allRenderedMatches || window._recentMatchStats || [];
  if (matches.length > 0) {
    const counts = {};
    matches.forEach(m => {
      const me = findMe(m);
      if (me && me.character) {
        counts[me.character] = (counts[me.character] || 0) + 1;
      }
    });
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (sorted.length > 0) {
      myAgent = sorted[0];
    }
  }
  
  return { name: myName, tag: myTag, rank: myRank, level: myLevel, agent: myAgent };
}

function getDemoRankScale(userRank) {
  const matched = userRank.match(/([a-zA-Z\s]+)\s*(\d+)?/);
  if (!matched) return ['Diamond 1', 'Diamond 2', 'Diamond 3', 'Platinum 3', 'Diamond 2'];
  const rankGroup = matched[1].trim();
  const rankNum = matched[2] ? parseInt(matched[2], 10) : 2;
  
  const rankGroups = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
  const groupIdx = rankGroups.indexOf(rankGroup);
  if (groupIdx === -1) return ['Diamond 1', 'Diamond 2', 'Diamond 3', 'Platinum 3', 'Diamond 2'];
  
  const getRankName = (gIdx, num) => {
    const group = rankGroups[Math.max(0, Math.min(8, gIdx))];
    if (group === 'Radiant') return 'Radiant';
    return `${group} ${Math.max(1, Math.min(3, num))}`;
  };
  
  return [
    getRankName(groupIdx, rankNum - 1),
    getRankName(groupIdx, rankNum),
    getRankName(groupIdx, rankNum + 1),
    getRankName(groupIdx - 1, 3),
    getRankName(groupIdx + 1, 1)
  ];
}








/* ── PHASE 1 V2 FEATURES: ANALYTICS & URL ROUTING ── */

function renderAdvancedAnalytics(matches) {
  let container = document.getElementById('advanced-analytics');
  if (!container) {
    const mainGrid = document.getElementById('main-grid');
    if(mainGrid) {
      container = document.createElement('div');
      container.className = 'span-12';
      container.id = 'advanced-analytics';
      mainGrid.appendChild(container);
    }
  }
  
  if (!container || !matches || matches.length === 0) return;

  let totalRounds = 0;
  let firstBloods = 0;
  let firstDeaths = 0;
  let plants = 0;
  let defuses = 0;
  let pistolRounds = 0;
  let pistolWins = 0;
  let comebacks = 0;
  let duoMap = {};
  
  matches.forEach(m => {
    const me = findMe(m);
    if (!me) return;
    const myPuuid = me.puuid || me.subject || me.id || '';
    const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
    const myTeamId = (me.team || '').toLowerCase();
    
    if (m.rounds && m.rounds.length > 0) {
      totalRounds += m.rounds.length;
      
      [0, 12].forEach(rIdx => {
        if (m.rounds[rIdx]) {
          pistolRounds++;
          if (m.rounds[rIdx].winning_team?.toLowerCase() === myTeamId) pistolWins++;
        }
      });
      
      if (m.rounds.length > 12) {
        let myTeamHalf = 0, oppTeamHalf = 0;
        for(let j=0; j<12; j++) {
          if(m.rounds[j].winning_team?.toLowerCase() === myTeamId) myTeamHalf++;
          else oppTeamHalf++;
        }
        const wonMatch = (m.teams && m.teams[myTeamId]?.has_won === true);
        if (oppTeamHalf - myTeamHalf >= 3 && wonMatch) comebacks++;
      }
      
      m.rounds.forEach(r => {
        if (r.bomb_planted && myPuuids.includes(r.plant_events?.planted_by?.puuid || r.plant_events?.planted_by?.subject)) plants++;
        if (r.bomb_defused && myPuuids.includes(r.defuse_events?.defused_by?.puuid || r.defuse_events?.defused_by?.subject)) defuses++;
      });
    }
    
    if (m.kills && m.kills.length > 0) {
      const roundKills = {};
      m.kills.forEach(k => {
        if (!roundKills[k.round]) roundKills[k.round] = [];
        roundKills[k.round].push(k);
      });
      
      Object.values(roundKills).forEach(rk => {
        rk.sort((a,b) => a.kill_time_in_round - b.kill_time_in_round);
        const firstKill = rk[0];
        if (firstKill) {
          if (myPuuids.includes(firstKill.killer_puuid || firstKill.killer)) firstBloods++;
          if (myPuuids.includes(firstKill.victim_puuid || firstKill.victim)) firstDeaths++;
        }
      });
    }
    
    const myPartyId = me.party_id;
    const plist = getPlayerList(m);
    if (myPartyId && plist.length) {
      const wonMatch = (m.teams && m.teams[myTeamId]?.has_won === true);
      plist.forEach(p => {
        const pPuuid = p.puuid || p.subject || p.id || '';
        if (!myPuuids.includes(pPuuid) && p.party_id === myPartyId) {
          const pName = p.name + '#' + p.tag;
          if(!duoMap[pName]) duoMap[pName] = { matches: 0, wins: 0 };
          duoMap[pName].matches++;
          if(wonMatch) duoMap[pName].wins++;
        }
      });
    }
  });
  
  let bestDuo = null;
  Object.keys(duoMap).forEach(k => {
    if (duoMap[k].matches > 1) { 
      if (!bestDuo || duoMap[k].matches > bestDuo.matches) {
        bestDuo = { name: k, ...duoMap[k] };
      }
    }
  });
  
  const fbRate = totalRounds > 0 ? ((firstBloods / totalRounds) * 100).toFixed(1) : 0;
  const pistolRate = pistolRounds > 0 ? ((pistolWins / pistolRounds) * 100).toFixed(1) : 0;
  
  container.innerHTML = `
    <div class="section-label visible" style="margin-top:20px;">
      <div class="sl-text">Advanced Analytics</div>
      <div class="sl-line"></div>
      <div class="sl-num">${matches.length} MATCHES</div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-top:10px;">
      <div class="card" style="padding:16px;">
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; margin-bottom:4px;">FIRST BLOOD RATE</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:28px; color:var(--accent);">${fbRate}%</div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">${firstBloods} FB / ${firstDeaths} FD</div>
      </div>
      <div class="card" style="padding:16px;">
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; margin-bottom:4px;">OBJECTIVE PLAY</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:28px; color:var(--blue);">${plants} <span style="font-size:14px; color:var(--muted)">PLANTS</span></div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">${defuses} Defuses</div>
      </div>
      <div class="card" style="padding:16px;">
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; margin-bottom:4px;">PISTOL ROUND WR</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:28px; color:${pistolRate > 50 ? 'var(--win)' : 'var(--text)'};">${pistolRate}%</div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">${pistolWins} / ${pistolRounds} Won</div>
      </div>
      <div class="card" style="padding:16px;">
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; margin-bottom:4px;">COMEBACKS</div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:28px; color:#f5a623;">${comebacks}</div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">Won after down 3+ at half</div>
      </div>
      <div class="card" style="padding:16px;">
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:1px; margin-bottom:4px;">TOP DUO SYNERGY</div>
        ${bestDuo ? `
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:20px; color:var(--accent); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${bestDuo.name}">${bestDuo.name}</div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">${((bestDuo.wins/bestDuo.matches)*100).toFixed(0)}% WR (${bestDuo.matches} matches)</div>
        ` : `
        <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:20px; color:var(--muted);">SOLO RIDER</div>
        <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); margin-top:4px;">No frequent duo in recent matches</div>
        `}
      </div>
    </div>
  `;
}

const v2ProcessMatchesHook = processMatches;
processMatches = function(matches) {
  v2ProcessMatchesHook(matches);
  renderAdvancedAnalytics(matches);
};

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  let pName = params.get('player');
  let pTag = params.get('tag');
  let pRegion = params.get('region');
  let pMode = params.get('mode');
  
  if (pName && pTag) {
    if(document.getElementById('player-name-input')) document.getElementById('player-name-input').value = pName;
    if(document.getElementById('player-tag-input')) document.getElementById('player-tag-input').value = pTag;
    if(document.getElementById('l-name')) document.getElementById('l-name').value = pName;
    if(document.getElementById('l-tag')) document.getElementById('l-tag').value = pTag;
    
    if (pRegion) {
      if(document.getElementById('region-select')) document.getElementById('region-select').value = pRegion;
      if(document.getElementById('l-region')) document.getElementById('l-region').value = pRegion;
    }
    if (pMode) {
      if(document.getElementById('mode-select')) document.getElementById('mode-select').value = pMode;
      if(document.getElementById('l-mode')) document.getElementById('l-mode').value = pMode;
    }
    
    if(typeof landingFetch === 'function' && document.getElementById('landing') && document.getElementById('landing').style.display !== 'none') {
        landingFetch();
    } else {
        fetchAll();
    }
  }
}

const v2originalFetchAll = fetchAll;
fetchAll = async function() {
  const pName = document.getElementById('player-name-input')?.value.trim() || '';
  const pTag = document.getElementById('player-tag-input')?.value.trim().replace(/^#/,'') || '';
  const pRegion = document.getElementById('region-select')?.value || 'ap';
  const pMode = document.getElementById('mode-select')?.value || 'competitive';
  
  if (pName && pTag) {
    const newUrl = `?player=${encodeURIComponent(pName)}&tag=${encodeURIComponent(pTag)}&region=${pRegion}&mode=${pMode}`;
    window.history.replaceState({path:newUrl}, '', newUrl);
  }
  return v2originalFetchAll.apply(this, arguments);
};

function shareProfile() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Profile URL copied to clipboard!');
  });
}

async function fetchLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  const content = document.getElementById('leaderboard-content');
  const region = document.getElementById('region-select')?.value || 'ap';
  
  const lbRegionTxt = document.getElementById('lb-region-txt');
  if (lbRegionTxt) lbRegionTxt.innerText = '(' + region.toUpperCase() + ')';
  if (content) content.innerHTML = '<div class="detail-loading" style="text-align:center;">FETCHING TOP 500...</div>';
  modal.style.display = 'flex';
  lockBackgroundScroll();
  
  try {
    const res = await fetch(`/api/v1/leaderboard/${region}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    
    if (!data || !data.data || !data.data.length) throw new Error('Leaderboard empty');
    
    let html = `<table class="scoreboard" style="width:100%;">
      <thead>
        <tr>
          <th>RANK</th>
          <th>PLAYER</th>
          <th>RATING</th>
          <th>WINS</th>
        </tr>
      </thead>
      <tbody>`;
      
    data.data.slice(0, 500).forEach(p => {
      let isAnon = p.IsAnonymized || !p.gameName;
      let nameStr = isAnon
        ? '<span style="color:var(--muted)">Secret Agent</span>'
        : `${escapeHtml(p.gameName)} <span style="color:var(--muted)">#${escapeHtml(p.tagLine)}</span>`;
      html += `
        <tr>
          <td style="color:#f5a623; font-weight:800;">#${Number(p.leaderboardRank)}</td>
          <td style="font-family:'Barlow Condensed',sans-serif; font-size:16px;">${nameStr}</td>
          <td style="font-family:'DM Mono',monospace; color:var(--accent);">${Number(p.rankedRating)} RR</td>
          <td style="font-family:'DM Mono',monospace; color:var(--win);">${Number(p.numberOfWins)} W</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    content.innerHTML = html;
  } catch(e) {
    content.innerHTML = `<div style="text-align:center; color:var(--loss); padding:40px; font-family:'Barlow Condensed', sans-serif; font-size:20px;">Unable to load leaderboard: ${escapeHtml(e.message)}</div>`;
  }
}

function closeLeaderboardModal() {
  const modal = document.getElementById('leaderboard-modal');
  if (modal) modal.style.display = 'none';
  unlockBackgroundScroll();
}

function toggleHeadToHead() {
  const modal = document.getElementById('h2h-modal');
  safeSetInnerHtml('h2h-content', '');
  
  // Auto-fill Player 1 with active player
  document.getElementById('h2h-p1-name').value = PLAYER_NAME;
  document.getElementById('h2h-p1-tag').value = PLAYER_TAG;
  
  document.getElementById('h2h-p2-name').value = '';
  document.getElementById('h2h-p2-tag').value = '';
  
  modal.style.display = 'flex';
  lockBackgroundScroll();
  
  // Dynamically populate Quick Matchup scroll area
  const chipsScroll = document.getElementById('h2h-quick-scroll');
  chipsScroll.innerHTML = '';
  
  // Extract teammates/enemies from loaded profile matches
  const recentPlMap = {};
  const matches = window._allRenderedMatches || window._recentMatchStats || [];
  matches.forEach(m => {
    const mid = m.matchId || '';
    const rawM = window._matchDetailStore.get(mid) || null;
    if (!rawM) return;
    getPlayerList(rawM).forEach(p => {
      if (!p.name || !p.tag) return;
      if (p.name.toLowerCase() === PLAYER_NAME.toLowerCase() && p.tag.toLowerCase() === PLAYER_TAG.toLowerCase()) return;
      const key = `${p.name}#${p.tag}`;
      recentPlMap[key] = (recentPlMap[key] || 0) + 1;
    });
  });
  
  const sortedPls = Object.entries(recentPlMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
    
  if (sortedPls.length === 0) {
    const tip = document.createElement('div');
    tip.style = "color:var(--muted); font-size:12px; font-style:italic; padding:6px 12px;";
    tip.innerText = "No recent scoreboard players detected. Fetch a player profile first to populate quick matchup suggestions!";
    chipsScroll.appendChild(tip);
  } else {
    sortedPls.forEach(([key, count]) => {
      const [name, tag] = key.split('#');
      const chip = document.createElement('div');
      chip.className = 'h2h-quick-chip';
      chip.innerHTML = `👤 ${escapeHtml(name)}#${escapeHtml(tag)}`;
      chip.onclick = () => {
        document.getElementById('h2h-p2-name').value = name;
        document.getElementById('h2h-p2-tag').value = tag;
        fetchH2H();
      };
      chipsScroll.appendChild(chip);
    });
  }
}

function closeH2HModal() {
  const modal = document.getElementById('h2h-modal');
  if (modal) modal.style.display = 'none';
  unlockBackgroundScroll();
}

function compilePlayerStats(matchData, pname, ptag) {
  if (!matchData || !Array.isArray(matchData.data)) return null;
  const matches = matchData.data;
  if (matches.length === 0) return null;
  
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalScore = 0;
  let totalRounds = 0;
  let totalHS = 0;
  let totalShots = 0;
  let streakForm = [];
  
  matches.forEach(m => {
    const playersList = getPlayerList(m);
    const me = playersList.find(x => x.name.toLowerCase() === pname.toLowerCase() && x.tag.toLowerCase() === ptag.toLowerCase());
    if (!me) return;
    
    const myTeamId = (me.team || '').toLowerCase();
    const myTeam = m.teams ? m.teams[myTeamId] : null;
    const oppTeamId = myTeamId === 'red' ? 'blue' : 'red';
    const oppTeam = m.teams ? m.teams[oppTeamId] : null;
    
    let won = false;
    if (myTeam?.has_won != null) {
      won = myTeam.has_won;
    } else if (myTeam?.rounds_won != null && oppTeam?.rounds_won != null) {
      won = myTeam.rounds_won > oppTeam.rounds_won;
    }
    
    if (won) wins++;
    streakForm.push(won ? 'W' : 'L');
    
    totalKills += me.stats?.kills || 0;
    totalDeaths += me.stats?.deaths || 0;
    totalAssists += me.stats?.assists || 0;
    totalScore += me.stats?.score || 0;
    
    const gameRounds = m.rounds?.length || (myTeam?.rounds_won != null && oppTeam?.rounds_won != null ? (myTeam.rounds_won + oppTeam.rounds_won) : 1);
    totalRounds += gameRounds;
    
    if (me.stats?.headshots != null && me.stats?.bodyshots != null && me.stats?.legshots != null) {
      const hs = me.stats.headshots;
      const bs = me.stats.bodyshots;
      const ls = me.stats.legshots;
      totalHS += hs;
      totalShots += (hs + bs + ls);
    }
  });
  
  const totalMatches = streakForm.length || 1;
  
  return {
    matchesCount: totalMatches,
    winRate: Math.round((wins / totalMatches) * 100),
    kd: totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills,
    acs: totalRounds > 0 ? Math.round(totalScore / totalRounds) : 0,
    hsRate: totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0,
    avgKills: totalKills / totalMatches,
    avgDeaths: totalDeaths / totalMatches,
    avgAssists: totalAssists / totalMatches,
    streakForm: streakForm.slice(0, 5)
  };
}

async function fetchH2H() {
  const p1Name = document.getElementById('h2h-p1-name')?.value.trim() || '';
  const p1Tag = document.getElementById('h2h-p1-tag')?.value.trim().replace(/^#/, '') || '';
  const p2Name = document.getElementById('h2h-p2-name')?.value.trim() || '';
  const p2Tag = document.getElementById('h2h-p2-tag')?.value.trim().replace(/^#/, '') || '';
  
  if(!p1Name || !p1Tag || !p2Name || !p2Tag) {
    showToast('Please fill all fields for both players');
    return;
  }
  
  const content = document.getElementById('h2h-content');
  const region = document.getElementById('region-select')?.value || 'ap';
  content.innerHTML = `
    <div style="text-align:center; padding:50px 0; color:var(--accent);">
      <div class="ai-spinner" style="margin:0 auto 15px auto; width:30px; height:30px; border:2px solid rgba(232,255,71,0.1); border-top-color:var(--accent);"></div>
      <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; letter-spacing:1px; text-transform:uppercase;">RETRIEVING PROFILE DETAILS & DUEL CACHING LOGS...</div>
    </div>
  `;
  
  try {
    const [p1MmrRes, p2MmrRes, p1AccRes, p2AccRes, p1MatchRes, p2MatchRes] = await Promise.all([
      fetch(`/api/v3/mmr/${region}/pc/${encodeURIComponent(p1Name)}/${encodeURIComponent(p1Tag)}`),
      fetch(`/api/v3/mmr/${region}/pc/${encodeURIComponent(p2Name)}/${encodeURIComponent(p2Tag)}`),
      fetch(`/api/v1/account/${encodeURIComponent(p1Name)}/${encodeURIComponent(p1Tag)}`),
      fetch(`/api/v1/account/${encodeURIComponent(p2Name)}/${encodeURIComponent(p2Tag)}`),
      fetch(`/api/v3/matches/${region}/${encodeURIComponent(p1Name)}/${encodeURIComponent(p1Tag)}?mode=competitive&size=20`),
      fetch(`/api/v3/matches/${region}/${encodeURIComponent(p2Name)}/${encodeURIComponent(p2Tag)}?mode=competitive&size=20`)
    ]);
    
    if(!p1MatchRes.ok || !p2MatchRes.ok) {
      throw new Error('Could not retrieve matches for one or both players. Verify Riot IDs and regions.');
    }
    
    const p1Data = await p1MatchRes.json();
    const p2Data = await p2MatchRes.json();
    
    let p1Mmr = null; try { if(p1MmrRes.ok) p1Mmr = await p1MmrRes.json(); } catch(e){}
    let p2Mmr = null; try { if(p2MmrRes.ok) p2Mmr = await p2MmrRes.json(); } catch(e){}
    let p1Acc = null; try { if(p1AccRes.ok) p1Acc = await p1AccRes.json(); } catch(e){}
    let p2Acc = null; try { if(p2AccRes.ok) p2Acc = await p2AccRes.json(); } catch(e){}
    
    renderH2HComparison(p1Data, p2Data, p1Mmr, p2Mmr, p1Acc, p2Acc, p1Name, p1Tag, p2Name, p2Tag);
    
  } catch(e) {
    console.error('H2H compile error:', e);
    content.innerHTML = `
      <div style="text-align:center; color:var(--loss); padding:40px; border:1px dashed rgba(244,63,94,0.3); border-radius:var(--radius-sm); background:rgba(244,63,94,0.03);">
        <div style="font-size:32px; margin-bottom:10px;">⚠️</div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-weight:700; font-size:20px; text-transform:uppercase;">DUEL COMPILING FAILED</div>
        <div style="font-family:sans-serif; font-size:14px; margin-top:6px; color:var(--muted);">${e.message}</div>
      </div>
    `;
  }
}

function renderH2HComparison(p1Data, p2Data, p1Mmr, p2Mmr, p1Acc, p2Acc, p1Name, p1Tag, p2Name, p2Tag) {
  const s1 = compilePlayerStats(p1Data, p1Name, p1Tag);
  const s2 = compilePlayerStats(p2Data, p2Name, p2Tag);
  
  if(!s1 || !s2) throw new Error('Insufficient competitive match history. Run at least 1 match to generate telemetry.');
  
  // Extract images
  const p1CardUrl = p1Acc?.data?.card?.wide || p1Acc?.data?.card?.large || '';
  const p2CardUrl = p2Acc?.data?.card?.wide || p2Acc?.data?.card?.large || '';
  
  const p1AvatarUrl = p1Acc?.data?.card?.small || '';
  const p2AvatarUrl = p2Acc?.data?.card?.small || '';
  
  const p1Level = p1Acc?.data?.account_level || '—';
  const p2Level = p2Acc?.data?.account_level || '—';
  
  const p1RankName = p1Mmr?.data?.current?.tier?.name || 'Unranked';
  const p2RankName = p2Mmr?.data?.current?.tier?.name || 'Unranked';
  
  const p1RankIcon = getRankImgUrl(p1RankName) || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png';
  const p2RankIcon = getRankImgUrl(p2RankName) || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png';
  
  const p1RR = p1Mmr?.data?.current?.rr != null ? `${p1Mmr.data.current.rr} RR` : '';
  const p2RR = p2Mmr?.data?.current?.rr != null ? `${p2Mmr.data.current.rr} RR` : '';
  
  // Math comparisons
  const maxKD = Math.max(s1.kd, s2.kd, 0.1);
  const p1KdPct = Math.round((s1.kd / maxKD) * 100);
  const p2KdPct = Math.round((s2.kd / maxKD) * 100);
  
  const maxACS = Math.max(s1.acs, s2.acs, 1);
  const p1AcsPct = Math.round((s1.acs / maxACS) * 100);
  const p2AcsPct = Math.round((s2.acs / maxACS) * 100);
  
  const maxWR = Math.max(s1.winRate, s2.winRate, 1);
  const p1WrPct = Math.round((s1.winRate / maxWR) * 100);
  const p2WrPct = Math.round((s2.winRate / maxWR) * 100);
  
  // Helpers
  const formatKD = val => val.toFixed(2);
  const drawCircularDial = (pct, isWinner, isRightPlayer) => {
    const colorClass = isWinner ? 'winner' : (isRightPlayer ? 'right' : 'left');
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;
    return `
      <div class="h2h-dial-circle">
        <svg width="90" height="90">
          <circle class="h2h-dial-bg" cx="45" cy="45" r="${radius}"></circle>
          <circle class="h2h-dial-bar ${colorClass}" cx="45" cy="45" r="${radius}" 
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="h2h-dial-text">${pct}%</div>
      </div>
    `;
  };
  
  const drawStreakBoxes = (streakForm, isRight) => {
    if(!streakForm || streakForm.length === 0) return `<span style="color:var(--muted)">No matches</span>`;
    const boxes = streakForm.map(wl => {
      const cl = wl === 'W' ? 'w' : 'l';
      return `<div class="h2h-streak-box ${cl}">${wl}</div>`;
    });
    if (isRight) {
      return `<div class="h2h-streak-container right">${boxes.join('')}</div>`;
    }
    return `<div class="h2h-streak-container left">${boxes.reverse().join('')}</div>`;
  };
  
  // Calculate verdict dimensions
  let p1Wins = 0, p2Wins = 0;
  let dims = [];
  
  // Precision
  if(s1.hsRate > s2.hsRate + 2) {
    p1Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🎯</span> <span>Aim Precision: <strong>${p1Name}</strong> dominates (+${s1.hsRate - s2.hsRate}% HS)</span></div>`);
  } else if(s2.hsRate > s1.hsRate + 2) {
    p2Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🎯</span> <span>Aim Precision: <strong>${p2Name}</strong> dominates (+${s2.hsRate - s1.hsRate}% HS)</span></div>`);
  } else {
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🎯</span> <span>Aim Precision: <strong>Evenly matched</strong> (${s1.hsRate}% vs ${s2.hsRate}%)</span></div>`);
  }
  
  // Combat volume
  if(s1.acs > s2.acs + 20) {
    p1Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">⚔️</span> <span>Combat Volume: <strong>${p1Name}</strong> is more impactful (+${s1.acs - s2.acs} ACS)</span></div>`);
  } else if(s2.acs > s1.acs + 20) {
    p2Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">⚔️</span> <span>Combat Volume: <strong>${p2Name}</strong> is more impactful (+${s2.acs - s1.acs} ACS)</span></div>`);
  } else {
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">⚔️</span> <span>Combat Volume: <strong>Comparable pressure</strong></span></div>`);
  }
  
  // Survivability
  if(s1.kd > s2.kd + 0.08) {
    p1Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🛡️</span> <span>Survivability: <strong>${p1Name}</strong> is more surgical (+${formatKD(s1.kd - s2.kd)} K/D)</span></div>`);
  } else if(s2.kd > s1.kd + 0.08) {
    p2Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🛡️</span> <span>Survivability: <strong>${p2Name}</strong> is more surgical (+${formatKD(s2.kd - s1.kd)} K/D)</span></div>`);
  } else {
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">🛡️</span> <span>Survivability: <strong>Equivalent trade ratios</strong></span></div>`);
  }
  
  // Win rating
  if(s1.winRate > s2.winRate + 5) {
    p1Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">👑</span> <span>Match Impact: <strong>${p1Name}</strong> has higher round control (+${s1.winRate - s2.winRate}% WR)</span></div>`);
  } else if(s2.winRate > s1.winRate + 5) {
    p2Wins++;
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">👑</span> <span>Match Impact: <strong>${p2Name}</strong> has higher round control (+${s2.winRate - s1.winRate}% WR)</span></div>`);
  } else {
    dims.push(`<div class="h2h-verdict-item"><span class="h2h-verdict-bullet">👑</span> <span>Match Impact: <strong>Matched win efficiency</strong></span></div>`);
  }
  
  // Combat Grade & Verdict text
  let combatGrade = 'B';
  let verdictText = '';
  
  if (p1Wins === 4) {
    combatGrade = 'S';
    verdictText = `VERDICT: Absolute Mechanical Domination! <strong>${p1Name}</strong> outperforms <strong>${p2Name}</strong> across every single performance pillar. In a direct matchup, Player 1 is highly favored.`;
  } else if (p2Wins === 4) {
    combatGrade = 'D';
    verdictText = `VERDICT: Severe Disadvantage. <strong>${p2Name}</strong> dominates every major mechanical category. <strong>${p1Name}</strong> must adopt a highly reactive, team-assist coordination strategy to succeed.`;
  } else if (p1Wins === 3) {
    combatGrade = 'A';
    verdictText = `VERDICT: Clear Mechanical Advantage. <strong>${p1Name}</strong> holds significant leverage in firefights and map influence. Aggressive entry pushes are recommended.`;
  } else if (p2Wins === 3) {
    combatGrade = 'C';
    verdictText = `VERDICT: Uphill Encounter. <strong>${p2Name}</strong> wins 3 out of 4 major telemetry categories. Play defensively, utilize heavy info-gathering utility, and avoid direct dry duels.`;
  } else {
    combatGrade = 'B';
    verdictText = `VERDICT: Balanced Dogfight. Both competitors demonstrate comparable aim, positioning, and round impact. Success in a match will depend entirely on clutch utility usage and team support.`;
  }
  
  const gradeClass = combatGrade.toLowerCase();
  
  document.getElementById('h2h-content').innerHTML = `
    <!-- Duel Banners -->
    <div class="h2h-duel-header">
      <div class="h2h-player-banner" style="background-image: url('${p1CardUrl}')">
        <div class="h2h-banner-content">
          <div class="h2h-banner-avatar">
            ${p1AvatarUrl ? `<img src="${p1AvatarUrl}" style="width:100%; height:100%; object-fit:cover">` : `<div style="font-size:28px">👤</div>`}
          </div>
          <div class="h2h-banner-info">
            <div class="h2h-banner-name">${p1Name}</div>
            <div class="h2h-banner-tag">#${p1Tag} · LVL ${p1Level}</div>
          </div>
          <div style="text-align:right">
            <img class="h2h-banner-rank-icon" src="${p1RankIcon}" title="${p1RankName}">
            <div style="font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; color:var(--muted); margin-top:2px">${p1RankName} ${p1RR}</div>
          </div>
        </div>
      </div>
      
      <div class="h2h-vs-divider">
        <div class="vs-pulse-circle">VS</div>
      </div>
      
      <div class="h2h-player-banner right" style="background-image: url('${p2CardUrl}')">
        <div class="h2h-banner-content right">
          <div class="h2h-banner-avatar">
            ${p2AvatarUrl ? `<img src="${p2AvatarUrl}" style="width:100%; height:100%; object-fit:cover">` : `<div style="font-size:28px">👤</div>`}
          </div>
          <div class="h2h-banner-info">
            <div class="h2h-banner-name">${p2Name}</div>
            <div class="h2h-banner-tag">#${p2Tag} · LVL ${p2Level}</div>
          </div>
          <div style="text-align:left">
            <img class="h2h-banner-rank-icon" src="${p2RankIcon}" title="${p2RankName}">
            <div style="font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; color:var(--muted); margin-top:2px">${p2RankName} ${p2RR}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bento stats grid -->
    <div class="h2h-bento-grid">
      <!-- ACS Bento -->
      <div class="h2h-stat-card">
        <div class="h2h-stat-label">AVERAGE COMBAT SCORE (ACS)</div>
        <div class="h2h-comparison-row">
          <div class="h2h-stat-value left" style="color:${s1.acs >= s2.acs ? 'var(--win)' : 'var(--muted)'}">${s1.acs}</div>
          <div class="h2h-bars-wrap">
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill left ${s1.acs >= s2.acs ? 'winner' : ''}" style="width:${p1AcsPct}%"></div>
            </div>
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill right ${s2.acs >= s1.acs ? 'winner' : ''}" style="width:${p2AcsPct}%"></div>
            </div>
          </div>
          <div class="h2h-stat-value right" style="color:${s2.acs >= s1.acs ? 'var(--win)' : 'var(--muted)'}">${s2.acs}</div>
        </div>
      </div>
      
      <!-- K/D Ratio Bento -->
      <div class="h2h-stat-card">
        <div class="h2h-stat-label">KILL/DEATH RATIO (K/D)</div>
        <div class="h2h-comparison-row">
          <div class="h2h-stat-value left" style="color:${s1.kd >= s2.kd ? 'var(--win)' : 'var(--muted)'}">${formatKD(s1.kd)}</div>
          <div class="h2h-bars-wrap">
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill left ${s1.kd >= s2.kd ? 'winner' : ''}" style="width:${p1KdPct}%"></div>
            </div>
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill right ${s2.kd >= s1.kd ? 'winner' : ''}" style="width:${p2KdPct}%"></div>
            </div>
          </div>
          <div class="h2h-stat-value right" style="color:${s2.kd >= s1.kd ? 'var(--win)' : 'var(--muted)'}">${formatKD(s2.kd)}</div>
        </div>
      </div>
      
      <!-- Win Rate Bento -->
      <div class="h2h-stat-card">
        <div class="h2h-stat-label">WIN RATE %</div>
        <div class="h2h-comparison-row">
          <div class="h2h-stat-value left" style="color:${s1.winRate >= s2.winRate ? 'var(--win)' : 'var(--muted)'}">${s1.winRate}%</div>
          <div class="h2h-bars-wrap">
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill left ${s1.winRate >= s2.winRate ? 'winner' : ''}" style="width:${p1WrPct}%"></div>
            </div>
            <div class="h2h-bar-container">
              <div class="h2h-bar-fill right ${s2.winRate >= s1.winRate ? 'winner' : ''}" style="width:${p2WrPct}%"></div>
            </div>
          </div>
          <div class="h2h-stat-value right" style="color:${s2.winRate >= s1.winRate ? 'var(--win)' : 'var(--muted)'}">${s2.winRate}%</div>
        </div>
      </div>
      
      <!-- Form Streaks Bento -->
      <div class="h2h-stat-card">
        <div class="h2h-stat-label">RECENT PERFORMANCE FORM (LAST 5)</div>
        <div class="h2h-comparison-row" style="padding: 4px 0">
          <div style="flex:1">${drawStreakBoxes(s1.streakForm, false)}</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:10px; color:var(--muted2); font-weight:700; letter-spacing:1px; width:60px; text-align:center">FORM</div>
          <div style="flex:1">${drawStreakBoxes(s2.streakForm, true)}</div>
        </div>
      </div>
      
      <!-- Circular Precision Dial Bento -->
      <div class="h2h-stat-card span-2">
        <div class="h2h-stat-label">AIM PRECISION (HEADSHOT RATIO)</div>
        <div class="h2h-circle-row">
          <div class="h2h-dial-wrap">
            ${drawCircularDial(s1.hsRate, s1.hsRate >= s2.hsRate, false)}
            <div class="h2h-dial-name">${p1Name}</div>
          </div>
          <div style="text-align:center; max-width:240px">
            <div style="font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:900; color:#fff; text-transform:uppercase; margin-bottom:4px">AIM GAP: ${Math.abs(s1.hsRate - s2.hsRate)}%</div>
            <div style="font-family:sans-serif; font-size:12px; color:var(--muted); line-height:1.3">
              ${s1.hsRate > s2.hsRate + 2 ? `<strong>${p1Name}</strong> exhibits significantly higher first-bullet precision. Avoid aim duels without flashing first.` : 
                s2.hsRate > s1.hsRate + 2 ? `<strong>${p2Name}</strong> exhibits exceptional click-timing precision. Play off teammate bait or flash before dry-peeking.` : 
                `Precision indexes are exceptionally aligned. Fight winner is determined by movement, positioning, and server latency.`}
            </div>
          </div>
          <div class="h2h-dial-wrap">
            ${drawCircularDial(s2.hsRate, s2.hsRate >= s1.hsRate, true)}
            <div class="h2h-dial-name">${p2Name}</div>
          </div>
        </div>
      </div>
      
      <!-- KDA Details Bento -->
      <div class="h2h-stat-card span-2">
        <div class="h2h-stat-label">KDA PERFORMANCE AVERAGES</div>
        <div style="display:grid; grid-template-columns:1fr 80px 1fr; align-items:center; gap:16px; font-family:'DM Mono',monospace; font-size:16px; color:#fff; text-align:center">
          
          <!-- P1 stats -->
          <div style="display:flex; justify-content:space-around; background:rgba(0,0,0,0.15); padding:8px 0; border-radius:4px; border:1px solid rgba(255,255,255,0.02)">
            <div><span style="font-size:11px; display:block; color:var(--muted)">Kills</span>${s1.avgKills.toFixed(1)}</div>
            <div><span style="font-size:11px; display:block; color:var(--muted)">Deaths</span>${s1.avgDeaths.toFixed(1)}</div>
            <div><span style="font-size:11px; display:block; color:var(--muted)">Assists</span>${s1.avgAssists.toFixed(1)}</div>
          </div>
          
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:11px; color:var(--muted2); font-weight:700; letter-spacing:1px">K / D / A</div>
          
          <!-- P2 stats -->
          <div style="display:flex; justify-content:space-around; background:rgba(0,0,0,0.15); padding:8px 0; border-radius:4px; border:1px solid rgba(255,255,255,0.02)">
            <div><span style="font-size:11px; display:block; color:var(--muted)">Kills</span>${s2.avgKills.toFixed(1)}</div>
            <div><span style="font-size:11px; display:block; color:var(--muted)">Deaths</span>${s2.avgDeaths.toFixed(1)}</div>
            <div><span style="font-size:11px; display:block; color:var(--muted)">Assists</span>${s2.avgAssists.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Combat Grade Bento Verdict -->
    <div class="h2h-verdict-card">
      <div class="h2h-verdict-left">
        <div class="combat-grade-title">COMBAT GRADE</div>
        <div class="combat-grade-badge ${gradeClass}">${combatGrade}</div>
      </div>
      <div class="h2h-verdict-right">
        <div class="h2h-verdict-summary">${verdictText}</div>
        <div class="h2h-verdict-dimensions">
          ${dims.join('')}
        </div>
      </div>
    </div>
  `;
}

// --- ESPORTS LOGIC ---

let esportsLiveInterval = null;
let esportsCountdownInterval = null;
let vctFranchiseData = null;
let allMatchesCache = [];

function toggleMainView(view) {
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
  const targetTab = document.getElementById('tab-' + view);
  if (targetTab) targetTab.classList.add('active');
  
  const landing = document.getElementById('landing');
  const gf = document.getElementById('global-footer');
  
  // Hide all views first
  document.getElementById('tracker-view').style.display = 'none';
  document.getElementById('esports-view').style.display = 'none';
  document.getElementById('store-view').style.display = 'none';
  const cView = document.getElementById('coach-view');
  if (cView) cView.style.display = 'none';
  const oView = document.getElementById('overlay-view');
  if (oView) oView.style.display = 'none';
  
  const mft = document.getElementById('mobile-filter-toggle');
  const subRow = document.getElementById('topbar-sub-row');
  
  if (view === 'tracker') {
    if (statsLoaded) {
      if (landing) {
        landing.classList.add('hidden');
        landing.style.display = 'none';
      }
      if (gf) gf.style.display = 'flex';
      
      document.getElementById('tracker-view').style.display = 'block';
      if (subRow) subRow.style.display = 'flex';
      
      const activePill = document.getElementById('player-active-pill');
      if (mft) {
        mft.style.display = (activePill && activePill.style.display === 'flex') ? 'inline-flex' : 'none';
      }
      
      const h2hb = document.getElementById('h2h-trigger-btn');
      if (h2hb) h2hb.style.display = 'inline-block';
      if(esportsLiveInterval) clearInterval(esportsLiveInterval);
      if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
      dismissLanding();
    } else {
      if (landing) {
        landing.classList.remove('hidden');
        landing.style.display = 'flex';
      }
      if (gf) gf.style.display = 'none';
      
      document.getElementById('tracker-view').style.display = 'none';
      if (subRow) subRow.style.display = 'none';
      if (mft) mft.style.display = 'none';
      
      const h2hb = document.getElementById('h2h-trigger-btn');
      if (h2hb) h2hb.style.display = 'none';
      if(esportsLiveInterval) clearInterval(esportsLiveInterval);
      if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
    }
  } else {
    // Hide tracker-specific filters and search on other tabs
    if (subRow) subRow.style.display = 'none';
    
    const h2hb = document.getElementById('h2h-trigger-btn');
    if (h2hb) h2hb.style.display = 'none';
    
    if (view === 'esports') {
      document.getElementById('esports-view').style.display = 'block';
      const activeTab = document.querySelector('.esports-pills-scroll .esports-pill.active').textContent.toLowerCase();
      switchEsportsTab(activeTab);
    } else if (view === 'store') {
      document.getElementById('store-view').style.display = 'block';
      if(esportsLiveInterval) clearInterval(esportsLiveInterval);
      if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
      initStoreView();
    } else if (view === 'coach') {
      if (cView) cView.style.display = 'block';
      resetDraftComp();
      renderSavedDrafts();
    } else if (view === 'overlay') {
      const oView = document.getElementById('overlay-view');
      if (oView) oView.style.display = 'block';
      
      // Auto-populate player name and tag from active player session
      if (PLAYER_NAME && PLAYER_TAG) {
        document.getElementById('overlay-name-input').value = PLAYER_NAME;
        document.getElementById('overlay-tag-input').value = PLAYER_TAG;
      }
      const activeRegion = document.getElementById('region-select')?.value || 'ap';
      document.getElementById('overlay-region-select').value = activeRegion;
      
      // Initialize/update preview
      updateOverlayPreview();
    }
  }
  setTimeout(updateHeaderHeights, 50);
}

function goToAISubsystem(system) {
  if (system === 'architect') {
    toggleMainView('coach');
    return;
  }
  
  // For the others, navigate to 'tracker' view first
  toggleMainView('tracker');
  
  setTimeout(() => {
    let targetEl = null;
    if (system === 'valbot') {
      targetEl = document.getElementById('ai-section') || document.querySelector('.deep-wrap') || document.getElementById('ai-btn');
    } else if (system === 'perf-lab') {
      targetEl = document.getElementById('plab-btn') || document.querySelector('.plab-run-btn') || document.getElementById('plab-heatmap');
    } else if (system === 'match-ai') {
      targetEl = document.getElementById('match-history-list') || document.getElementById('match-list-container') || document.getElementById('ai-section');
    }
    
    if (targetEl) {
      const offset = 110;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      showToast(`Navigated to ${system.toUpperCase()} ✓`);
    } else {
      showToast('Please fetch your player profile stats first!');
    }
  }, 250);
}

function toggleMobileFilters() {
  const fg = document.getElementById('topbar-filters-group');
  if (fg) {
    fg.classList.toggle('mobile-expanded');
  }
}

function updateFilterToggleText() {
  const regionSelect = document.getElementById('region-select');
  const modeSelect = document.getElementById('mode-select');
  const actSelect = document.getElementById('act-select');
  const toggleBtn = document.getElementById('mobile-filter-toggle');
  
  if (regionSelect && modeSelect && actSelect && toggleBtn) {
    const region = regionSelect.options[regionSelect.selectedIndex]?.text || '';
    const mode = modeSelect.options[modeSelect.selectedIndex]?.text || '';
    const act = actSelect.options[actSelect.selectedIndex]?.text || '';
    
    const rText = region.toUpperCase();
    
    let mText = mode;
    if (mode.toLowerCase() === 'competitive') mText = 'Comp';
    else if (mode.toLowerCase() === 'unrated') mText = 'Unrated';
    else if (mode.toLowerCase() === 'deathmatch') mText = 'DM';
    else if (mode.toLowerCase() === 'team dm') mText = 'Team DM';
    else if (mode.toLowerCase() === 'swiftplay') mText = 'Swift';
    else if (mode.toLowerCase() === 'spike rush') mText = 'Spike';
    
    let aText = act;
    if (act.toLowerCase() === 'lifetime') aText = 'Lifetime';
    
    const textSpan = toggleBtn.querySelector('span:not(.toggle-icon)');
    if (textSpan) {
      textSpan.textContent = `${rText} • ${mText} • ${aText}`;
    }
  }
}

function switchEsportsTab(tab) {
  document.querySelectorAll('.esports-pills-scroll .esports-pill').forEach(p => p.classList.remove('active'));
  
  const activePill = Array.from(document.querySelectorAll('.esports-pills-scroll .esports-pill')).find(p => p.textContent.toLowerCase() === tab.toLowerCase());
  if (activePill) activePill.classList.add('active');
  
  document.querySelectorAll('.esports-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`esp-sec-${tab}`).classList.add('active');
  
  if(esportsLiveInterval) clearInterval(esportsLiveInterval);
  if(esportsCountdownInterval) clearInterval(esportsCountdownInterval);
  
  if (tab === 'overview') {
    fetchEsportsOverview();
    esportsLiveInterval = setInterval(fetchEsportsOverview, 60000);
  }
  else if (tab === 'schedule') {
    fetchEsportsUpcoming();
    fetchEsportsResults();
    switchScheduleTab('upcoming');
  }
  else if (tab === 'vct26') {
    // Already populated statically in HTML
  }
  else if (tab === 'teams') {
    initTeamsTab();
  }
  else if (tab === 'news') {
    fetchEsportsNews();
  }
}

function switchScheduleTab(tab) {
  const upCol = document.getElementById('schedule-col-upcoming');
  const resCol = document.getElementById('schedule-col-results');
  const upTab = document.getElementById('sched-tab-upcoming');
  const resTab = document.getElementById('sched-tab-results');
  
  if (tab === 'upcoming') {
    if (upCol) upCol.style.display = 'block';
    if (resCol) resCol.style.display = 'none';
    if (upTab) upTab.classList.add('active');
    if (resTab) resTab.classList.remove('active');
  } else {
    if (upCol) upCol.style.display = 'none';
    if (resCol) resCol.style.display = 'block';
    if (upTab) upTab.classList.remove('active');
    if (resTab) resTab.classList.add('active');
  }
}

const VCT_STAGE_DATA = {
  kickoff: {
    title: "VCT Kickoff 2026",
    dates: "Jan - Feb 2026",
    regions: {
      global: {
        winners: [
          { region: "Pacific Winner", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" },
          { region: "Americas Winner", team: "FURIA", tag: "FUR", logo: "https://owcdn.net/img/632be843b7d51.png", color: "#3b82f6" },
          { region: "EMEA Winner", team: "BBL Esports", tag: "BBL", logo: "https://owcdn.net/img/65b8ccef5e273.png", color: "#fbbf24" },
          { region: "China Winner", team: "All Gamers", tag: "AG", logo: "https://owcdn.net/img/6549c2b905061.png", color: "#a855f7" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" }
        ]
      },
      americas: {
        winners: [
          { region: "Champion", team: "FURIA", tag: "FUR", logo: "https://owcdn.net/img/632be843b7d51.png", color: "#fa4454" }
        ],
        teams: [
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Champion", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "T1", tag: "T1", region: "ov-pacific", id: "14" },
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" }
        ]
      },
      emea: {
        winners: [
          { region: "Champion", team: "BBL Esports", tag: "BBL", logo: "https://owcdn.net/img/65b8ccef5e273.png", color: "#fa4454" }
        ],
        teams: [
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "Gentle Mates", tag: "M8", region: "ov-emea", id: "11181" },
          { name: "Team Liquid", tag: "TL", region: "ov-emea", id: "474" }
        ]
      },
      china: {
        winners: [
          { region: "Champion", team: "All Gamers", tag: "AG", logo: "https://owcdn.net/img/6549c2b905061.png", color: "#fa4454" }
        ],
        teams: [
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" },
          { name: "XLG Esports", tag: "XLG", region: "ov-china", id: "xlg_esports" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" }
        ]
      }
    }
  },
  masters_santiago: {
    title: "Masters Santiago 2026",
    dates: "Feb 28 - Mar 15, 2026",
    regions: {
      global: {
        winners: [
          { region: "Champion", team: "Nongshim RedForce", tag: "NS", logo: "https://owcdn.net/img/6399bb707aacb.png", color: "#fa4454" },
          { region: "Runner-up", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#db2777" }
        ],
        teams: [
          { name: "Nongshim RedForce", tag: "NS", region: "ov-pacific", id: "11060" },
          { name: "T1", tag: "T1", region: "ov-pacific", id: "14" },
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FURIA", tag: "FUR", region: "ov-americas", id: "2406" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" },
          { name: "BBL Esports", tag: "BBL", region: "ov-emea", id: "397" },
          { name: "Gentle Mates", tag: "M8", region: "ov-emea", id: "11181" },
          { name: "Team Liquid", tag: "TL", region: "ov-emea", id: "474" },
          { name: "All Gamers", tag: "AG", region: "ov-china", id: "1119" },
          { name: "XLG Esports", tag: "XLG", region: "ov-china", id: "xlg_esports" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" }
        ]
      }
    }
  },
  stage1: {
    title: "VCT Stage 1 2026",
    dates: "Mar - May 24, 2026",
    regions: {
      global: {
        winners: [
          { region: "Pacific Winner", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#fa4454" },
          { region: "EMEA Winner", team: "Team Heretics", tag: "TH", logo: "https://owcdn.net/img/637b755224c12.png", color: "#fbbf24" },
          { region: "China Winner", team: "EDward Gaming", tag: "EDG", logo: "https://owcdn.net/img/62c82049253b2.png", color: "#a855f7" },
          { region: "Americas Winner", team: "Leviatán", tag: "LEV", logo: "https://owcdn.net/img/61b8888cc3860.png", color: "#3b82f6" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      americas: {
        winners: [
          { region: "Champion", team: "Leviatán", tag: "LEV", logo: "https://owcdn.net/img/61b8888cc3860.png", color: "#3b82f6" }
        ],
        teams: [
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Champion", team: "Paper Rex", tag: "PRX", logo: "https://owcdn.net/img/62bbeba74d5cb.png", color: "#fa4454" },
          { region: "Runner-up", team: "FULL SENSE", tag: "FS", logo: "https://owcdn.net/img/6537a7954d915.png", color: "#ff5757" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" }
        ]
      },
      emea: {
        winners: [
          { region: "Champion", team: "Team Heretics", tag: "TH", logo: "https://owcdn.net/img/637b755224c12.png", color: "#fa4454" },
          { region: "Runner-up", team: "Team Vitality", tag: "VIT", logo: "https://owcdn.net/img/6466d79e1ed40.png", color: "#fbbf24" }
        ],
        teams: [
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" }
        ]
      },
      china: {
        winners: [
          { region: "Champion", team: "EDward Gaming", tag: "EDG", logo: "https://owcdn.net/img/62c82049253b2.png", color: "#fa4454" },
          { region: "Runner-up", team: "Xi Lai Gaming", tag: "XLG", logo: "https://owcdn.net/img/671742f863b9b.png", color: "#a855f7" }
        ],
        teams: [
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  masters_london: {
    title: "Masters London 2026",
    dates: "June 6 - June 21, 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "Playoffs Ongoing", tag: "LIVE", logo: "", color: "#22c55e" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  stage2: {
    title: "VCT Stage 2 2026",
    dates: "June - September 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "Upcoming Regional Splits", tag: "TBD", logo: "", color: "#3b82f6" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" }
        ]
      },
      americas: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#3b82f6" }
        ],
        teams: [
          { name: "Leviatán", tag: "LEV", region: "ov-americas", id: "2359" },
          { name: "G2 Esports", tag: "G2", region: "ov-americas", id: "11058" },
          { name: "NRG", tag: "NRG", region: "ov-americas", id: "1034" }
        ]
      },
      pacific: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#ef4444" }
        ],
        teams: [
          { name: "Paper Rex", tag: "PRX", region: "ov-pacific", id: "624" },
          { name: "FULL SENSE", tag: "FS", region: "ov-pacific", id: "4050" },
          { name: "Global Esports", tag: "GE", region: "ov-pacific", id: "918" }
        ]
      },
      emea: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#fbbf24" }
        ],
        teams: [
          { name: "Team Heretics", tag: "TH", region: "ov-emea", id: "1001" },
          { name: "Team Vitality", tag: "VIT", region: "ov-emea", id: "2059" },
          { name: "FUT Esports", tag: "FUT", region: "ov-emea", id: "1184" }
        ]
      },
      china: {
        winners: [
          { region: "Status", team: "Upcoming regional split", tag: "TBD", logo: "", color: "#a855f7" }
        ],
        teams: [
          { name: "EDward Gaming", tag: "EDG", region: "ov-china", id: "1120" },
          { name: "Xi Lai Gaming", tag: "XLG", region: "ov-china", id: "13581" },
          { name: "Dragon Ranger Gaming", tag: "DRG", region: "ov-china", id: "11981" }
        ]
      }
    }
  },
  champions: {
    title: "Champions Shanghai 2026",
    dates: "Sept 24 - Oct 18, 2026",
    regions: {
      global: {
        winners: [
          { region: "Status", team: "The Ultimate Crown", tag: "TBD", logo: "", color: "#fbbf24" }
        ],
        teams: [
          { name: "TBD - Qualified Teams", tag: "VAL", region: "ov-pacific", id: "624" }
        ]
      }
    }
  }
};

function lockBackgroundScroll() {
  const _sy = window.scrollY;
  document.documentElement.style.setProperty('--scroll-y', `-${_sy}px`);
  document.body.classList.add('modal-open');
}

function unlockBackgroundScroll() {
  document.body.classList.remove('modal-open');
  const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

function openVctModal() {
  document.getElementById('vct-modal-overlay').classList.add('open');
  lockBackgroundScroll();
}

function closeVctModal() {
  document.getElementById('vct-modal-overlay').classList.remove('open');
  unlockBackgroundScroll();
}

function openVctTournamentModal(stage) {
  const data = VCT_STAGE_DATA[stage];
  if (!data) return;
  
  // Create regional tabs
  const tabContainer = document.getElementById('vct-modal-tabs');
  const isInternational = stage.includes('masters') || stage === 'champions';
  
  let availableRegions;
  if (stage === 'masters_london') {
    availableRegions = ['playoffs', 'swiss', 'teams', 'americas', 'pacific', 'emea', 'china'];
  } else {
    availableRegions = isInternational 
      ? ['global', 'americas', 'pacific', 'emea', 'china']
      : Object.keys(data.regions);
  }
  
  const regionLabels = {
    playoffs: "🏆 Playoff Bracket",
    swiss: "🇨🇭 Swiss Stage",
    teams: "🌎 Qualified Teams",
    global: isInternational ? "🌎 All Qualified" : "🌎 Overview",
    americas: "🇺🇸 Americas",
    pacific: "🇰🇷 Pacific",
    emea: "🇪🇺 EMEA",
    china: "🇨🇳 China"
  };
  
  tabContainer.innerHTML = availableRegions.map(r => `
    <button class="vct-modal-tab-btn" data-modal-region="${r}" onclick="switchVctModalTab('${stage}', '${r}')" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:11px; padding:6px 12px; border-radius:4px; cursor:pointer; text-transform:uppercase; transition:var(--transition); font-weight:700;">
      ${regionLabels[r] || r}
    </button>
  `).join('');
  
  switchVctModalTab(stage, availableRegions[0]);
  openVctModal();
}

const VCT_VLR_EVENTS = {
  kickoff: {
    americas: 2682,
    pacific: 2683,
    emea: 2684,
    china: 2685
  },
  masters_santiago: {
    global: 2760
  },
  stage1: {
    americas: 2860,
    pacific: 2775,
    emea: 2863,
    china: 2864
  },
  masters_london: {
    global: 2765
  },
  stage2: {
    americas: 2977,
    pacific: 2776,
    emea: 2976,
    china: 2978
  },
  champions: {
    global: 2766
  }
};

function getTeamRegion(tId, localId, teamName) {
  if (vctFranchiseData) {
    for (const reg in vctFranchiseData) {
      if (vctFranchiseData[reg].some(item => item.id === tId || item.id === localId || item.name.toLowerCase() === teamName.toLowerCase())) {
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
  
  return 'pacific'; // default fallback
}

async function switchVctModalTab(stage, region) {
  const data = VCT_STAGE_DATA[stage];
  if (!data) return;
  
  // Highlight active tab
  document.querySelectorAll('.vct-modal-tab-btn').forEach(btn => {
    btn.style.background = 'rgba(255,255,255,0.03)';
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    btn.style.color = '#fff';
  });
  const activeBtn = document.querySelector(`.vct-modal-tab-btn[data-modal-region="${region}"]`);
  if (activeBtn) {
    activeBtn.style.background = 'var(--loss)';
    activeBtn.style.borderColor = 'var(--loss)';
    activeBtn.style.color = '#fff';
  }
  
  const winnersContainer = document.getElementById('vct-modal-winners');
  const winnersTitle = document.getElementById('vct-modal-winners-title');
  const teamsContainer = document.getElementById('vct-modal-teams');
  const teamsTitle = document.getElementById('vct-modal-teams-title');

  if (stage === 'masters_london' && (region === 'playoffs' || region === 'swiss')) {
    // Hide standard elements
    winnersTitle.style.display = 'none';
    winnersContainer.style.display = 'none';
    teamsTitle.style.display = 'none';
    teamsContainer.style.display = 'block';
    
    // Set container to full width (reset standard grid style)
    teamsContainer.style.gridTemplateColumns = '1fr';
    
    if (region === 'playoffs') {
      renderMastersLondonPlayoffs(teamsContainer);
    } else {
      renderMastersLondonSwiss(teamsContainer);
    }
    return;
  } else {
    // Restore default layouts
    if (teamsContainer) {
      teamsContainer.style.gridTemplateColumns = '';
    }
  }

  // Render Winners (if regional data has winners for the selected tab)
  let lookupRegion = region;
  if (region === 'teams') lookupRegion = 'global';
  const regData = data.regions[lookupRegion] || (lookupRegion === 'global' ? data.regions.global : null);
  if (regData && regData.winners && regData.winners.length > 0) {
    winnersTitle.style.display = 'flex';
    winnersContainer.style.display = 'grid';
    winnersContainer.innerHTML = regData.winners.map(w => {
      const logoUrl = w.logo ? (w.logo.startsWith('/api/image') ? w.logo : `/api/image?url=${encodeURIComponent(w.logo)}`) : '';
      const logoHtml = logoUrl ? `<img src="${logoUrl}" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none';" />` : '';
      return `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:4px; display:flex; align-items:center; gap:10px;">
          <div style="font-size:10px; color:var(--muted); text-transform:uppercase;">${w.region}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
            ${logoHtml}
            <span style="font-weight:700; color:${w.color || '#fff'}">${w.team}</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    winnersTitle.style.display = 'none';
    winnersContainer.style.display = 'none';
  }
  
  // Render Teams
  const isInternational = stage.includes('masters') || stage === 'champions';
  
  if (!isInternational) {
    teamsTitle.style.display = 'none';
    teamsContainer.style.display = 'none';
    return;
  }
  
  teamsTitle.style.display = 'flex';
  teamsContainer.style.display = 'grid';
  teamsContainer.innerHTML = `
    <div style="grid-column: 1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; gap:12px; color:var(--muted);">
      <div class="cyber-spinner" style="width:30px; height:30px; border:2px solid rgba(255, 70, 85, 0.2); border-top-color:var(--loss); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <div style="font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px;">ESTABLISHING SECURE DATA GRID CONNECTION...</div>
    </div>
  `;
  
  if (!document.getElementById('cyber-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'cyber-spinner-style';
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
  
  if (!vctFranchiseData) {
    try {
      const res = await fetch('/vct_teams.json?v=3');
      vctFranchiseData = await res.json();
    } catch (e) {
      console.error("Failed to load franchise data:", e);
    }
  }
  
  let vlrIds = [];
  const stageEvents = VCT_VLR_EVENTS[stage];
  
  if (stageEvents) {
    if (isInternational) {
      // International events always pull from the single global event ID
      vlrIds = [stageEvents.global];
    } else {
      if (region === 'global') {
        vlrIds = Object.values(stageEvents);
      } else {
        if (stageEvents[region]) {
          vlrIds = [stageEvents[region]];
        }
      }
    }
  }
  
  if (vlrIds.length === 0) {
    teamsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--muted); padding:20px; font-family:'DM Mono',monospace;">No VLR event mapped for this stage.</div>`;
    return;
  }
  
  try {
    const fetchedResults = await Promise.all(
      vlrIds.map(async id => {
        try {
          const res = await fetch(`/api/esports/event/${id}`);
          const json = await res.json();
          return json.data || [];
        } catch (err) {
          console.error(`Failed to fetch event ${id}:`, err);
          return [];
        }
      })
    );
    
    let allTeams = [];
    const seenIds = new Set();
    fetchedResults.forEach(teamsList => {
      teamsList.forEach(t => {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          allTeams.push(t);
        }
      });
    });
    
    // Filter by region for international events if a specific region tab is chosen
    let filterRegion = region;
    if (region === 'teams') filterRegion = 'global';
    if (isInternational && filterRegion !== 'global') {
      allTeams = allTeams.filter(t => getTeamRegion(t.id, t.local_id, t.name) === filterRegion);
    }
    
    if (allTeams.length === 0) {
      teamsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--muted); padding:20px; font-family:'DM Mono',monospace;">No qualified teams found for this region.</div>`;
      return;
    }
    
    allTeams.sort((a, b) => a.name.localeCompare(b.name));
    
    teamsContainer.innerHTML = allTeams.map(t => {
      let localId = t.local_id;
      let matchedRegion = null;
      
      if (vctFranchiseData) {
        for (const reg in vctFranchiseData) {
          if (vctFranchiseData[reg].some(item => item.id === t.id || item.id === localId || item.name.toLowerCase() === t.name.toLowerCase())) {
            matchedRegion = reg;
            break;
          }
        }
      }
      
      // Fallback region lookup for Tier 1 non-franchise/ascension teams
      const teamReg = matchedRegion || getTeamRegion(t.id, localId, t.name);
      
      const isClickable = !!matchedRegion;
      const clickAttr = isClickable ? `onclick="selectTeamFromModal('ov-${matchedRegion}', '${t.id}')"` : '';
      const cursorStyle = isClickable ? 'cursor:pointer;' : 'cursor:default;';
      const borderHoverStyle = isClickable ? `onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'"` : '';
      
      const teamLogoUrl = t.logo ? (t.logo.startsWith('/api/image') ? t.logo : `/api/image?url=${encodeURIComponent(t.logo)}`) : '';
      const teamLogo = teamLogoUrl ? `<img src="${teamLogoUrl}" style="width:28px;height:28px;object-fit:contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : '';
      const safeTeamName = escapeHtml(t.name || '');
      const fallbackBadge = `<div class="team-logo-fallback" style="${t.logo ? 'display:none;' : 'display:flex;'} width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); align-items:center; justify-content:center; font-family:Barlow Condensed,sans-serif; font-size:11px; font-weight:700; color:var(--accent);">${escapeHtml((t.name || '').substring(0, 2).toUpperCase())}</div>`;
      
      const tagLabel = teamReg ? teamReg.toUpperCase() : (t.slug ? t.slug.substring(0,6).toUpperCase() : 'VCT');
      const safeTagLabel = escapeHtml(tagLabel);
      
      return `
        <div class="player-card" ${clickAttr} ${borderHoverStyle} style="${cursorStyle} min-height:85px; padding:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); transition:var(--transition); border-radius:4px; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:center; height:32px;">
            ${teamLogo}
            ${fallbackBadge}
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
            <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:11px; color:#fff; text-transform:uppercase; text-align:center; line-height:1.1; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${safeTeamName}">${safeTeamName}</div>
            <div style="font-size:8px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">${safeTagLabel}</div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error("Error loading VLR teams in modal:", err);
    teamsContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--loss); padding:20px; font-family:'DM Mono',monospace;">Failed to fetch rosters. Try again later.</div>`;
  }
}

// ── MASTERS LONDON BRACKETS & SWISS STAGE RENDERERS ──
function getMatchCardHtml(team1, team2, score1, score2, date, status, isLive = false, matchId = "") {
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
          <span style="font-family:'DM Mono',monospace; color:${score1 > score2 ? 'var(--win)' : '#fff'}">${score1}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:700;">
          <div style="display:flex; align-items:center; gap:6px; color:#fff;">
            ${logo2Html}
            <span>${team2}</span>
          </div>
          <span style="font-family:'DM Mono',monospace; color:${score2 > score1 ? 'var(--win)' : '#fff'}">${score2}</span>
        </div>
      </div>
    </a>
  `;
}

function renderMastersLondonPlayoffs(container) {
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:20px; padding:10px 0;">
      
      <!-- Upper Bracket Header -->
      <div style="border-left: 2px solid var(--accent); padding-left: 10px;">
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Upper Bracket Playoffs</div>
        <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Quarterfinals → Semifinals → Finals</div>
      </div>
      
      <!-- Upper Bracket Rounds Container -->
      <div class="bracket-scroll-container" style="display:flex; gap:24px; overflow-x:auto; padding-bottom:12px; width:100%; box-sizing:border-box;">
        
        <!-- Round 1: Quarterfinals -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="bracket-round-title">Upper Quarterfinals</div>
          ${getMatchCardHtml("Paper Rex", "LEVIATÁN", 0, 0, "June 12 · 7:30 PM", "TODAY", false, "670466")}
          ${getMatchCardHtml("Team Heretics", "Team Vitality", 0, 0, "June 12 · 10:30 PM", "TODAY", false, "670467")}
          ${getMatchCardHtml("EDward Gaming", "FUT Esports", 0, 0, "June 13 · 7:30 PM", "TOMORROW", false, "670465")}
          ${getMatchCardHtml("G2 Esports", "Xi Lai Gaming", 0, 0, "June 13 · 10:30 PM", "TOMORROW", false, "670464")}
        </div>
        
        <!-- Round 2: Semifinals -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Upper Semifinals</div>
          ${getMatchCardHtml("PRX/LEV Winner", "TH/VIT Winner", "—", "—", "June 15 · 7:30 PM", "UPCOMING", false, "670468")}
          ${getMatchCardHtml("EDG/FUT Winner", "G2/XLG Winner", "—", "—", "June 15 · 10:30 PM", "UPCOMING", false, "670469")}
        </div>
        
        <!-- Round 3: Finals -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Upper Final</div>
          ${getMatchCardHtml("TBD", "TBD", "—", "—", "June 18 · 7:30 PM", "UPCOMING", false, "670470")}
        </div>
      </div>

      <!-- Lower Bracket Header -->
      <div style="border-left: 2px solid #a855f7; padding-left: 10px; margin-top:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Lower Bracket</div>
        <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Survival stage · Win or go home</div>
      </div>
      
      <!-- Lower Bracket Rounds Container -->
      <div class="bracket-scroll-container" style="display:flex; gap:24px; overflow-x:auto; padding-bottom:12px; width:100%; box-sizing:border-box;">
        <!-- Round 1 -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Lower Round 1</div>
          ${getMatchCardHtml("PRX/LEV Loser", "TH/VIT Loser", "—", "—", "June 14 · 7:30 PM", "UPCOMING", false, "670472")}
          ${getMatchCardHtml("EDG/FUT Loser", "G2/XLG Loser", "—", "—", "June 14 · 10:30 PM", "UPCOMING", false, "670473")}
        </div>
        
        <!-- Round 2 -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Lower Round 2</div>
          ${getMatchCardHtml("UBSF Loser", "LBR1 Winner", "—", "—", "June 16 · 7:30 PM", "UPCOMING", false, "670474")}
          ${getMatchCardHtml("UBSF Loser", "LBR1 Winner", "—", "—", "June 16 · 10:30 PM", "UPCOMING", false, "670475")}
        </div>
        
        <!-- Round 3: Semifinals -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Lower Semifinal</div>
          ${getMatchCardHtml("TBD", "TBD", "—", "—", "June 19 · 7:30 PM", "UPCOMING", false, "670476")}
        </div>
        
        <!-- Round 4: Finals -->
        <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
          <div class="bracket-round-title">Lower Final (Bo5)</div>
          ${getMatchCardHtml("TBD", "TBD", "—", "—", "June 20 · 7:30 PM", "UPCOMING", false, "670477")}
        </div>
      </div>

      <!-- Grand Final Header -->
      <div style="border-left: 2px solid #fbbf24; padding-left: 10px; margin-top:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; text-transform:uppercase; color:#fff; letter-spacing:0.5px;">Grand Finals</div>
        <div style="font-size:10px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">The ultimate showdown</div>
      </div>
      <div style="display:flex; padding-bottom:12px; width:100%; box-sizing:border-box;">
        ${getMatchCardHtml("Upper Final Winner", "Lower Final Winner", "—", "—", "June 21 · 6:30 PM", "UPCOMING", false, "670471")}
      </div>

    </div>
  `;
}

function renderMastersLondonSwiss(container) {
  const teams = [
    { name: "LEVIATÁN", w: 2, l: 0, status: "QUALIFIED", statusClass: "qualified" },
    { name: "Team Vitality", w: 2, l: 0, status: "QUALIFIED", statusClass: "qualified" },
    { name: "FUT Esports", w: 2, l: 1, status: "QUALIFIED", statusClass: "qualified" },
    { name: "Xi Lai Gaming", w: 2, l: 1, status: "QUALIFIED", statusClass: "qualified" },
    { name: "NRG", w: 1, l: 2, status: "ELIMINATED", statusClass: "eliminated" },
    { name: "Global Esports", w: 1, l: 2, status: "ELIMINATED", statusClass: "eliminated" },
    { name: "FULL SENSE", w: 0, l: 2, status: "ELIMINATED", statusClass: "eliminated" },
    { name: "Dragon Ranger Gaming", w: 0, l: 2, status: "ELIMINATED", statusClass: "eliminated" }
  ];
  
  const standingsHtml = `
    <div style="margin-bottom:20px;">
      <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:800; text-transform:uppercase; color:var(--muted); letter-spacing:1px; margin-bottom:8px;">Swiss Stage Standings</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:8px;">
        ${teams.map(t => {
          const logoHtml = getEsportsTeamLogoHtml(t.name);
          const color = t.statusClass === 'qualified' ? 'var(--win)' : 'var(--loss)';
          return `
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:8px; display:flex; flex-direction:column; align-items:center; gap:4px; box-sizing:border-box;">
              <div style="display:flex; align-items:center; justify-content:center; height:24px;">${logoHtml}</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; text-transform:uppercase; text-align:center; color:#fff; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; width:100%;">${t.name}</div>
              <div style="font-family:'DM Mono',monospace; font-size:10px; color:${color}; font-weight:bold;">${t.w}-${t.l} · ${t.status}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:20px; padding:10px 0;">
      
      <!-- Standings -->
      ${standingsHtml}

      <!-- Matches by Round -->
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:800; text-transform:uppercase; color:var(--muted); letter-spacing:1px; margin-bottom:12px;">Swiss Match Logs</div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Round 3 -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div class="swiss-round-header">Round 3 Deciders (June 10)</div>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${getMatchCardHtml("FUT Esports", "NRG", 2, 1, "June 10 · 2-1 reverse sweep", "FINAL", false, "684619")}
              ${getMatchCardHtml("Xi Lai Gaming", "Global Esports", 2, 1, "June 10 · Decider series", "FINAL", false, "684618")}
            </div>
          </div>
          
          <!-- Round 2 -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div class="swiss-round-header">Round 2 Matches (June 8 - 9)</div>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${getMatchCardHtml("LEVIATÁN", "NRG", 2, 1, "June 8 · High (1-0)", "FINAL", false, "684615")}
              ${getMatchCardHtml("Team Vitality", "FUT Esports", 2, 1, "June 8 · High (1-0)", "FINAL", false, "684614")}
              ${getMatchCardHtml("Xi Lai Gaming", "Dragon Ranger Gaming", 2, 1, "June 9 · Low (0-1)", "FINAL", false, "684616")}
              ${getMatchCardHtml("Global Esports", "FULL SENSE", 2, 1, "June 9 · Low (0-1)", "FINAL", false, "684617")}
            </div>
          </div>

          <!-- Round 1 -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div class="swiss-round-header">Round 1 Openers (June 6 - 7)</div>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${getMatchCardHtml("NRG", "Xi Lai Gaming", 2, 0, "June 6 · Opening match", "FINAL", false, "684613")}
              ${getMatchCardHtml("Team Vitality", "Dragon Ranger Gaming", 2, 0, "June 6 · Opening match", "FINAL", false, "684610")}
              ${getMatchCardHtml("FUT Esports", "FULL SENSE", 2, 0, "June 7 · Opening match", "FINAL", false, "684611")}
              ${getMatchCardHtml("LEVIATÁN", "Global Esports", 2, 1, "June 7 · Opening match", "FINAL", false, "684612")}
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}

function selectTeamFromModal(regionId, teamId) {
  closeVctModal();
  switchEsportsTab('teams');
  
  setTimeout(() => {
    const list = document.getElementById(regionId);
    if (list && list.classList.contains('collapsed')) {
      toggleSidebarRegion(regionId);
    }
    const regionKey = regionId.replace('ov-', '');
    selectFranchiseTeam(regionKey, teamId);
  }, 100);
}

function toggleTiers() {
  const showTier2 = document.getElementById('tier-toggle').checked;
  const t2Cards = document.querySelectorAll('.tier-t2');
  t2Cards.forEach(card => {
    card.style.display = showTier2 ? 'grid' : 'none';
  });
}

function getEsportsTeamLogoHtml(name) {
  const cleanName = name || 'TBD';
  const fallback = `<div class="team-logo-fallback" style="width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:Barlow Condensed,sans-serif; font-size:9px; font-weight:700; color:var(--accent); margin-right:8px;">${cleanName.substring(0, 2).toUpperCase()}</div>`;
  const fallbackEscaped = fallback.replace(/"/g, '&quot;');

  if (!vctFranchiseData) return fallback;
  for (const region in vctFranchiseData) {
    for (const t of vctFranchiseData[region]) {
      if (t.name.toLowerCase() === name.toLowerCase() || t.tag?.toLowerCase() === name.toLowerCase()) {
        const teamLogoUrl = t.logo.startsWith('/api/image') ? t.logo : `/api/image?url=${encodeURIComponent(t.logo)}`;
        return `<img class="esp-team-logo" src="${teamLogoUrl}" style="width:20px;height:20px;object-fit:contain;margin-right:8px;" onerror="this.outerHTML='${fallbackEscaped}';" />`;
      }
    }
  }
  
  const match = allMatchesCache.find(m => m.match?.teams?.some(tm => tm.name.toLowerCase() === name.toLowerCase()))?.match?.teams?.find(tm => tm.name.toLowerCase() === name.toLowerCase());
  if (match && match.logo) {
    const teamLogoUrl = match.logo.startsWith('/api/image') ? match.logo : `/api/image?url=${encodeURIComponent(match.logo)}`;
    return `<img class="esp-team-logo" src="${teamLogoUrl}" style="width:20px;height:20px;object-fit:contain;margin-right:8px;" onerror="this.outerHTML='${fallbackEscaped}';" />`;
  }
  
  return fallback;
}

function getEspHTML(m, type) {
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
            if (hasYesterday) {
              d.setDate(d.getDate() - 1);
            }
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
      if (evLower.includes('masters')) {
        cleanEvent = 'VCT Masters';
      } else if (evLower.includes('champions')) {
        cleanEvent = 'VCT Champions';
      } else if (evLower.includes('pacific')) {
        cleanEvent = 'VCT Pacific';
      } else if (evLower.includes('emea')) {
        cleanEvent = 'VCT EMEA';
      } else if (evLower.includes('americas')) {
        cleanEvent = 'VCT Americas';
      } else if (evLower.includes('china') || evLower.includes('cn')) {
        cleanEvent = 'VCT China';
      }
      
      const searchQ = `${cleanEvent} ${t1} vs ${t2} highlights ${datePart}`.trim();
      mediaBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(searchQ)}" target="_blank" class="esp-btn vod">📺 View Highlights</a>${vlrBtn}</div>`;
    }
  } else {
    statusHtml = `<div class="esp-status">UPCOMING</div>`;
    mediaBtn = vlrBtn ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${vlrBtn}</div>` : '';
  }

  // Format date to local string if possible
  let displayDate = m.date || 'TBD';
  try {
    const d = new Date(displayDate);
    if (!isNaN(d.getTime())) {
      displayDate = d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  } catch(e) {}

  const score1 = m.state==='unstarted'?'':s1;
  const score2 = m.state==='unstarted'?'':s2;

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

async function fetchEsportsOverview() {
  if (!vctFranchiseData) {
    try {
      const res = await fetch('/vct_teams.json?v=3');
      vctFranchiseData = await res.json();
    } catch (e) {
      console.error("Failed to load franchise data:", e);
    }
  }

  const liveContainer = document.getElementById('esp-ov-live-container');
  const resultsContainer = document.getElementById('esp-ov-results-container');
  const newsContainer = document.getElementById('esp-ov-news-container');
  
  if(!liveContainer.innerHTML) liveContainer.innerHTML = '<div class="placeholder-txt">Loading Active matches...</div>';
  if(!resultsContainer.innerHTML) resultsContainer.innerHTML = '<div class="placeholder-txt">Loading highlight results...</div>';
  if(!newsContainer.innerHTML) newsContainer.innerHTML = '<div class="placeholder-txt">Loading latest headlines...</div>';
  
  try {
    const liveRes = await fetch('/api/esports/live');
    const liveData = await liveRes.json();
    const liveMatches = liveData.data || [];
    if (!liveMatches || liveMatches.length === 0) {
      liveContainer.innerHTML = '<div class="placeholder-txt">No live matches right now.</div>';
    } else {
      liveContainer.innerHTML = liveMatches.map(m => getEspHTML(m, 'live')).join('');
    }
    
    const resRes = await fetch('/api/esports/results');
    const resData = await resRes.json();
    const resultsMatches = resData.data || [];
    if (!resultsMatches || resultsMatches.length === 0) {
      resultsContainer.innerHTML = '<div class="placeholder-txt">No recent results found.</div>';
    } else {
      resultsContainer.innerHTML = resultsMatches.slice(0,3).map(m => getEspHTML(m, 'results')).join('');
    }
    
    const newsRes = await fetch('/api/esports/news');
    const newsData = await newsRes.json();
    const newsItems = newsData.data || [];
    if (!newsItems || newsItems.length === 0) {
      newsContainer.innerHTML = '<div class="placeholder-txt">No news headlines found.</div>';
    } else {
      let newsHtml = '';
      newsItems.slice(0, 4).forEach(n => {
        newsHtml += `
          <a href="${n.url_path ? 'https://vlr.gg'+n.url_path : '#'}" target="_blank" class="esp-news-card" style="padding:12px; gap:8px;">
            <div class="esp-news-title" style="font-size:15px;">${n.title}</div>
            <div class="esp-news-desc" style="font-size:11px;-webkit-line-clamp:2;">${n.description || ''}</div>
            <div class="esp-news-meta" style="font-size:9px; margin-top:4px;">
              <span>${n.author === 'VLR.gg' ? 'Valorant Esports' : n.author} • ${n.date}</span>
            </div>
          </a>
        `;
      });
      newsContainer.innerHTML = newsHtml;
    }
    toggleTiers();
  } catch (err) {
    console.error("Overview load failed", err);
  }
}

async function fetchEsportsLive() {
  // Handled inside overview
}

async function fetchEsportsResults() {
  const container = document.getElementById('esp-results-container');
  container.innerHTML = '<div class="placeholder-txt">Loading Recent Results...</div>';
  try {
    const res = await fetch('/api/esports/results');
    const data = await res.json();
    const matches = data.data || [];
    if (!matches || matches.length === 0) {
      container.innerHTML = '<div class="placeholder-txt">No recent results found.</div>';
      return;
    }
    container.innerHTML = matches.slice(0,30).map(m => getEspHTML(m, 'results')).join('');
    toggleTiers();
  } catch (err) {
    container.innerHTML = `
      <div class="placeholder-txt" style="color:var(--loss)">
        The external VLR service is taking too long to respond. 
        <button class="fetch-btn" onclick="fetchEsportsResults()" style="margin-top:16px;">Retry Connection</button>
      </div>
    `;
  }
}

async function fetchEsportsUpcoming() {
  const container = document.getElementById('esp-upcoming-container');
  container.innerHTML = '<div class="placeholder-txt">Loading Upcoming Matches...</div>';
  try {
    const res = await fetch('/api/esports/upcoming');
    const data = await res.json();
    const matches = data.data || [];
    allMatchesCache = matches;
    if (!matches || matches.length === 0) {
      container.innerHTML = '<div class="placeholder-txt">No upcoming matches scheduled.</div>';
      return;
    }
    container.innerHTML = matches.slice(0,30).map(m => getEspHTML(m, 'upcoming')).join('');
    toggleTiers();
  } catch (err) {
    container.innerHTML = `
      <div class="placeholder-txt" style="color:var(--loss)">
        Upcoming matches service is timed out.
        <button class="fetch-btn" onclick="fetchEsportsUpcoming()" style="margin-top:12px;">Retry</button>
      </div>`;
  }
}


async function fetchEsportsNews() {
  const container = document.getElementById('esp-news-container');
  container.innerHTML = '<div class="placeholder-txt" style="grid-column:1/-1">Loading Latest News...</div>';
  try {
    const res = await fetch('/api/esports/news');
    const data = await res.json();
    const news = data.data || [];
    if (!news || news.length === 0) {
      container.innerHTML = '<div class="placeholder-txt" style="grid-column:1/-1">No news found.</div>';
      return;
    }
    let html = '';
    news.forEach(n => {
      html += `
        <a href="${n.url_path ? 'https://vlr.gg'+n.url_path : '#'}" target="_blank" class="esp-news-card">
          <div class="esp-news-title">${n.title || 'Esports Update'}</div>
          <div class="esp-news-desc">${n.description || ''}</div>
          <div class="esp-news-meta">
            <span>${n.author || 'VLR.gg'} • ${n.date || 'Recent'}</span>
            <span class="esp-news-tag">News</span>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div class="placeholder-txt" style="color:var(--loss);grid-column:1/-1">News service timed out. <button class="fetch-btn" onclick="fetchEsportsNews()" style="margin-top:12px;">Retry News</button></div>';
  }
}

function toggleSidebarRegion(regionId) {
  const header = document.querySelector(`.esp-sidebar-region-header[onclick*="${regionId}"]`);
  const list = document.getElementById(regionId);
  if (list && header) {
    list.classList.toggle('collapsed');
    header.classList.toggle('collapsed');
  }
}

async function initTeamsTab() {
  const pList = document.getElementById('ov-pacific');
  const aList = document.getElementById('ov-americas');
  const eList = document.getElementById('ov-emea');
  const cList = document.getElementById('ov-china');
  
  if (pList.innerHTML) return;
  
  try {
    const res = await fetch('/vct_teams.json?v=3');
    vctFranchiseData = await res.json();
    
    const regions = { 'pacific': pList, 'americas': aList, 'emea': eList, 'china': cList };
    Object.entries(regions).forEach(([regName, domEl]) => {
      const teams = vctFranchiseData[regName] || [];
      console.log(`[DEBUG] Region ${regName} fetched ${teams.length} teams:`, teams.map(t => t.name));
      domEl.innerHTML = teams.map(t => `
        <div class="esp-sidebar-team-btn" data-team-id="${t.id}" onclick="selectFranchiseTeam('${regName}', '${t.id}')">${t.name}</div>
      `).join('');
      
      // Collapse all region lists except Pacific by default on initial load
      const listId = `ov-${regName}`;
      const header = document.querySelector(`.esp-sidebar-region-header[onclick*="${listId}"]`);
      if (regName !== 'pacific') {
        domEl.classList.add('collapsed');
        if (header) header.classList.add('collapsed');
      } else {
        domEl.classList.remove('collapsed');
        if (header) header.classList.remove('collapsed');
      }
    });
    
    selectFranchiseTeam('pacific', '918');
    
    if (!allMatchesCache.length) {
      const matchesRes = await fetch('/api/esports/upcoming');
      const matchesData = await matchesRes.json();
      allMatchesCache = matchesData.data || [];
    }
  } catch (e) {
    console.error("Teams loader error:", e);
  }
}

function selectFranchiseTeam(region, teamId) {
  document.querySelectorAll('.esp-sidebar-team-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.esp-sidebar-team-btn[data-team-id="${teamId}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Collapse other lists and expand the selected team's region list
  const targetId = `ov-${region.toLowerCase()}`;
  const allLists = ['ov-americas', 'ov-emea', 'ov-pacific', 'ov-china'];
  allLists.forEach(id => {
    const list = document.getElementById(id);
    const header = document.querySelector(`.esp-sidebar-region-header[onclick*="${id}"]`);
    if (list && header) {
      if (id === targetId) {
        list.classList.remove('collapsed');
        header.classList.remove('collapsed');
      } else {
        list.classList.add('collapsed');
        header.classList.add('collapsed');
      }
    }
  });
  
  if (!vctFranchiseData) return;
  const team = (vctFranchiseData[region] || []).find(t => t.id === teamId);
  if (!team) return;
  
  document.getElementById('esp-active-team-name').textContent = team.name;
  
  const logoHtml = getEsportsTeamLogoHtml(team.name).replace(/width:20px;height:20px/g, 'width:40px;height:40px').replace(/margin-right:8px/g, 'margin-right:0').replace(/font-size:9px/g, 'font-size:16px');
  safeSetInnerHtml('esp-active-team-logo', logoHtml);
  
  document.getElementById('esp-active-team-desc').textContent = team.description;
  
  const capWrap = document.getElementById('esp-active-team-capsule-wrap');
  const capImg = document.getElementById('esp-active-team-capsule-img');
  const capTitle = document.getElementById('esp-active-team-capsule-title');
  const capDesc = document.getElementById('esp-active-team-capsule-desc');
  
  if (team.capsule_image) {
    capWrap.style.display = 'flex';
    capImg.style.display = 'block';
    const fbBadge = document.getElementById('esp-active-team-capsule-fallback-badge');
    if (fbBadge) fbBadge.style.display = 'none';
    capImg.src = team.capsule_image;
    capTitle.textContent = team.capsule_title || 'VCT Capsule';
    capDesc.textContent = team.capsule_desc || 'Support your team';
  } else {
    capWrap.style.display = 'none';
  }
  
  const rosterGrid = document.getElementById('esp-active-team-roster-grid');
  rosterGrid.innerHTML = (team.roster || []).map(p => `
    <div class="player-card">
      <span class="player-card-role ${p.role.toLowerCase() === 'coach' ? 'coach' : ''}">${p.role}</span>
      <img class="player-card-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
      <div class="player-card-avatar-fallback" style="display:none; width:100%; flex:1; background:linear-gradient(180deg, rgba(255,70,85,0.05) 0%, rgba(20,20,20,0.8) 100%); align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-size:36px; font-weight:900; color:var(--accent); text-transform:uppercase; min-height:120px;">
        ${p.name ? p.name.charAt(0) : 'P'}
      </div>
      <div class="player-card-meta">
        <div class="player-card-handle">${p.name}</div>
        <div class="player-card-real">${p.real_name}</div>
      </div>
    </div>
  `).join('');
  
  const matchContainer = document.getElementById('esp-active-team-matches-container');
  const teamMatches = allMatchesCache.filter(m => {
    const teams = m.match?.teams || [];
    return teams.some(t => {
      const rawVlr = t.name || '';
      const rawFilter = team.name || '';
      
      // Clean names: remove accents (e.g. á -> a), remove non-alphanumeric chars (like \uFFFD replacement chars)
      const cleanVlr = rawVlr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
      const cleanFilter = rawFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
      
      if (cleanVlr === cleanFilter) return true;
      
      const isGcMatch = cleanVlr.includes('gc') || cleanVlr.includes('game changers') || cleanVlr.includes('female');
      const isAcademyMatch = cleanVlr.includes('academy') || cleanVlr.includes('acad');
      
      const isFilterGc = cleanFilter.includes('gc') || cleanFilter.includes('game changers') || cleanFilter.includes('female');
      const isFilterAcademy = cleanFilter.includes('academy') || cleanFilter.includes('acad');
      
      if (isGcMatch && !isFilterGc) return false;
      if (isAcademyMatch && !isFilterAcademy) return false;
      
      return cleanVlr.includes(cleanFilter) || cleanFilter.includes(cleanVlr);
    });
  });
  
  if (teamMatches.length === 0) {
    matchContainer.innerHTML = `
      <div class="esp-match-card tier-t1" style="min-height:120px; display:flex; align-items:center; justify-content:center; border-style:dashed;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;color:var(--muted);text-transform:uppercase;">No Upcoming Matches</div>
      </div>
    `;
  } else {
    matchContainer.innerHTML = teamMatches.map(m => getEspHTML(m, 'upcoming')).join('');
  }
}

// Dropdown Menu Toggle for Secondary Navbar Tools
function toggleToolsDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('nav-tools-dropdown');
  const trigger  = document.getElementById('tools-dropdown-trigger');
  if (dropdown) {
    const isOpen = dropdown.classList.toggle('active');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

function closeToolsDropdown() {
  const dropdown = document.getElementById('nav-tools-dropdown');
  const trigger  = document.getElementById('tools-dropdown-trigger');
  if (dropdown && dropdown.classList.contains('active')) {
    dropdown.classList.remove('active');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
}

// Global click handler to auto-close dropdown on outside clicks or when clicking an item
document.addEventListener('click', (event) => {
  const trigger = document.querySelector('.dropdown-trigger');
  if (trigger && !trigger.contains(event.target)) {
    closeToolsDropdown();
  }
});


let isProgrammaticScroll = false;
let lastScrollY = window.scrollY;

// HUD Ease of Access smooth scrolling
function smoothScrollTo(elementId, event) {
  if (event) event.preventDefault();
  const el = document.getElementById(elementId);
  if (el) {
    const trackerNav = document.getElementById('tracker-nav');
    const offset = trackerNav ? trackerNav.getBoundingClientRect().height : 50;
    
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = el.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;
    
    // Set the header to scrolled-down state immediately to hide the topbar in parallel
    isProgrammaticScroll = true;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    setTimeout(() => {
      isProgrammaticScroll = false;
      lastScrollY = window.scrollY;
    }, 800);
  }
}

// HUD Scrollspy active indicator tracking using IntersectionObserver (asynchronous & hardware composited)
let scrollspyObserver = null;
function initScrollspyObserver() {
  if (scrollspyObserver) scrollspyObserver.disconnect();

  const sections = [
    'sec-combat', 'sec-performance', 'sec-trend', 'sec-agents',
    'sec-maps', 'sec-weapons', 'sec-matches', 'sec-ai', 'sec-deep', 'sec-lab'
  ];

  const navItems = {
    'sec-combat': document.querySelector('#tracker-nav a[onclick*="sec-combat"]'),
    'sec-performance': document.querySelector('#tracker-nav a[onclick*="sec-performance"]'),
    'sec-trend': document.querySelector('#tracker-nav a[onclick*="sec-trend"]'),
    'sec-agents': document.querySelector('#tracker-nav a[onclick*="sec-agents"]'),
    'sec-maps': document.querySelector('#tracker-nav a[onclick*="sec-maps"]'),
    'sec-weapons': document.querySelector('#tracker-nav a[onclick*="sec-weapons"]'),
    'sec-matches': document.querySelector('#tracker-nav a[onclick*="sec-matches"]'),
    'sec-ai': document.querySelector('#tracker-nav a[onclick*="sec-ai"]'),
    'sec-deep': document.querySelector('#tracker-nav a[onclick*="sec-deep"]'),
    'sec-lab': document.querySelector('#tracker-nav a[onclick*="sec-lab"]')
  };

  const options = {
    root: null,
    // Trigger when element crosses the header offset line (approx top 12% to 15% of viewport)
    rootMargin: '-100px 0px -75% 0px',
    threshold: 0
  };

  // Track currently intersecting sections
  const intersectingSections = new Set();

  scrollspyObserver = new IntersectionObserver((entries) => {
    if (isProgrammaticScroll) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        intersectingSections.add(entry.target.id);
      } else {
        intersectingSections.delete(entry.target.id);
      }
    });

    // Find the topmost intersecting section to mark as active
    if (intersectingSections.size > 0) {
      // Find the first section in sections order that is intersecting
      const activeId = sections.find(id => intersectingSections.has(id));
      if (activeId) {
        Object.keys(navItems).forEach(key => {
          const item = navItems[key];
          if (item) {
            if (key === activeId) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          }
        });
      }
    }
  }, options);

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) scrollspyObserver.observe(el);
  });
}

// Stub function to prevent errors if called elsewhere
function cacheSectionOffsets() {}

let unifiedScrollInitialized = false;
function initUnifiedScrollManager() {
  if (unifiedScrollInitialized) return;
  unifiedScrollInitialized = true;

  const body = document.body;
  const backToTopBtn = document.getElementById('back-to-top');

  let backToTopVisible = false;
  let headerState = ''; // 'up', 'down', or ''
  let scrollAccumulator = 0;
  let rAFScheduled = false;

  // Initialize the observer for section Scrollspy tracking
  initScrollspyObserver();

  // scrollTimeout is not needed since is-scrolling is disabled to optimize scrolling performance and prevent layout thrashing crashes
  window.addEventListener('scroll', () => {

    if (!rAFScheduled) {
      rAFScheduled = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        // 1. Back to Top Button
        const shouldShowB2T = currentScrollY > 300;
        if (shouldShowB2T !== backToTopVisible) {
          backToTopVisible = shouldShowB2T;
          if (backToTopBtn) {
            if (backToTopVisible) {
              backToTopBtn.classList.add('visible');
            } else {
              backToTopBtn.classList.remove('visible');
            }
          }
        }

        // 2. Sticky Header Hiding removed — scrolled-down/scrolled-up classes had no CSS rules

        lastScrollY = currentScrollY;
        rAFScheduled = false;
      });
    }
  }, { passive: true });
}

// --- SKINS STORE & COSMETICS LOGIC ---
let storeBundleTimers = [];
let allSkinsList = [];
let allBundlesList = [];
let filteredSkinsList = [];
let skinCatalogPageSize = 24;
let currentSkinCatalogIndex = 0;

async function initStoreView() {
  const featuredContainer = document.getElementById('store-featured-container');
  const catalogGrid = document.getElementById('skin-catalog-grid');
  
  if (!featuredContainer.innerHTML) {
    featuredContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:50px; gap:12px; color:var(--muted); border:1px dashed var(--border); border-radius:12px;">
        <div class="cyber-spinner" style="width:32px; height:32px; border:2px solid rgba(250,68,84,0.2); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
        <div style="font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1.5px;">ESTABLISHING SECURE DECRYPTED STORE LINK...</div>
      </div>
    `;
  }
  
  if (!catalogGrid.innerHTML) {
    catalogGrid.innerHTML = `
      <div style="grid-column: 1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:50px; gap:12px; color:var(--muted);">
        <div class="cyber-spinner" style="width:32px; height:32px; border:2px solid rgba(250,68,84,0.2); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
        <div style="font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1.5px;">LOADING VALORANT SKIN CATALOG...</div>
      </div>
    `;
  }

  // Load bundles metadata first
  if (allBundlesList.length === 0) {
    try {
      const res = await fetch('https://valorant-api.com/v1/bundles');
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        allBundlesList = json.data;
      }
    } catch (err) {
      console.error("Bundles metadata load failed:", err);
    }
  }

  // 1. Fetch and render featured store bundles
  const ROGUE_BUNDLE_FALLBACK = [
    {
      "bundle_uuid": "602900ed-4e10-d214-acc5-8883ed2430f5",
      "bundle_price": 8700,
      "seconds_remaining": 1600000,
      "expires_at": "2026-06-17T17:59:59.023Z",
      "items": [
        {
          "uuid": "b987198e-40da-cbc3-8cd2-1abd36d3a983",
          "name": "Rogue Buddy",
          "image": "https://media.valorant-api.com/buddies/b987198e-40da-cbc3-8cd2-1abd36d3a983/displayicon.png",
          "type": "buddy",
          "base_price": 475,
          "discount_percent": 1.0,
          "discounted_price": 0
        },
        {
          "uuid": "c429531b-4980-ca36-c3e0-689d1cbcaf6f",
          "name": "Rogue Card",
          "image": "https://media.valorant-api.com/playercards/c429531b-4980-ca36-c3e0-689d1cbcaf6f/displayicon.png",
          "type": "player_card",
          "base_price": 375,
          "discount_percent": 1.0,
          "discounted_price": 0
        },
        {
          "uuid": "67908139-4960-5f8f-ccbf-d2a96eea1ea8",
          "name": "Rogue Spray",
          "image": "https://media.valorant-api.com/sprays/67908139-4960-5f8f-ccbf-d2a96eea1ea8/displayicon.png",
          "type": "spray",
          "base_price": 325,
          "discount_percent": 1.0,
          "discounted_price": 0
        },
        {
          "uuid": "1b9b0131-42fe-b6a7-d212-699b342ba642",
          "name": "Rogue Vandal",
          "image": "https://media.valorant-api.com/weaponskins/1b9b0131-42fe-b6a7-d212-699b342ba642/displayicon.png",
          "type": "skin_level",
          "base_price": 2175,
          "discount_percent": 0.0,
          "discounted_price": 2175
        },
        {
          "uuid": "ea3e6c8a-4e5e-baf9-33c3-7abacf07aaee",
          "name": "Rogue Bucky",
          "image": "https://media.valorant-api.com/weaponskins/ea3e6c8a-4e5e-baf9-33c3-7abacf07aaee/displayicon.png",
          "type": "skin_level",
          "base_price": 2175,
          "discount_percent": 0.0,
          "discounted_price": 2175
        },
        {
          "uuid": "902a3bcb-4164-3315-fe03-2088fb897ce4",
          "name": "Rogue Bandit",
          "image": "https://media.valorant-api.com/weaponskins/902a3bcb-4164-3315-fe03-2088fb897ce4/displayicon.png",
          "type": "skin_level",
          "base_price": 2175,
          "discount_percent": 0.0,
          "discounted_price": 2175
        },
        {
          "uuid": "2460c852-4d1b-a9e3-ccda-43a8e30cb739",
          "name": "Rogue Operator",
          "image": "https://media.valorant-api.com/weaponskins/2460c852-4d1b-a9e3-ccda-43a8e30cb739/displayicon.png",
          "type": "skin_level",
          "base_price": 2175,
          "discount_percent": 0.0,
          "discounted_price": 2175
        },
        {
          "uuid": "1c808469-4aee-ae6c-fcd2-1099e96ac6a0",
          "name": "Rogue Push Daggers",
          "image": "https://media.valorant-api.com/weaponskins/1c808469-4aee-ae6c-fcd2-1099e96ac6a0/displayicon.png",
          "type": "skin_level",
          "base_price": 4350,
          "discount_percent": 1.0,
          "discounted_price": 0
        }
      ]
    }
  ];

  try {
    const res = await fetch('/api/store/featured');
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      renderFeaturedBundles(json.data);
    } else {
      console.warn("Store offers parsing failed, falling back to offline data...");
      renderFeaturedBundles(ROGUE_BUNDLE_FALLBACK);
    }
  } catch (err) {
    console.warn("Store API connection failed, loading offline Rogue Bundle fallback...", err);
    renderFeaturedBundles(ROGUE_BUNDLE_FALLBACK);
  }

  // 2. Fetch and render skins catalog
  if (allSkinsList.length === 0) {
    try {
      const res = await fetch('https://valorant-api.com/v1/weapons/skins');
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        // Filter out default skins (skins that have "Standard" in name or displayIcon is null)
        allSkinsList = json.data.filter(s => 
          s.displayIcon && 
          !s.displayName.toLowerCase().startsWith('standard') && 
          !s.displayName.toLowerCase().includes('default') &&
          s.themeUuid !== "5a62f6b5-4b0d-c0df-d3ca-9dab2686f107" // filter base weapons
        );
        allSkinsList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        filteredSkinsList = [...allSkinsList];
        
        currentSkinCatalogIndex = 0;
        catalogGrid.innerHTML = '';
        renderSkinsCatalogSlice();
      }
    } catch (err) {
      console.error("Skins catalog load failed:", err);
      catalogGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--loss); padding:30px; font-family:'DM Mono',monospace;">Failed to connect to the skin catalog server.</div>`;
    }
  }
}

function renderFeaturedBundles(bundles) {
  const container = document.getElementById('store-featured-container');
  storeBundleTimers.forEach(t => clearInterval(t));
  storeBundleTimers = [];
  
  container.innerHTML = bundles.map((b, idx) => {
    let secondsLeft = b.seconds_remaining;
    const elTimerId = `bundle-timer-${idx}`;
    
    // Set up countdown timer interval
    const bundleInterval = setInterval(() => {
      const el = document.getElementById(elTimerId);
      if (!el) return;
      if (secondsLeft <= 0) {
        el.textContent = "EXPIRED";
        return;
      }
      secondsLeft--;
      const d = Math.floor(secondsLeft / (3600 * 24));
      const h = Math.floor((secondsLeft % (3600 * 24)) / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = Math.floor(secondsLeft % 60);
      el.textContent = `${d}D ${h}H ${m}M ${s}S`;
    }, 1000);
    storeBundleTimers.push(bundleInterval);

    // Look up bundle name dynamically from valorant-api bundles metadata
    const bundleMeta = allBundlesList.find(x => x.uuid === b.bundle_uuid);
    const bundleName = bundleMeta ? bundleMeta.displayName : "Featured Bundle Offer";

    const itemsList = (b.items || []).map(item => {
      const discountedPrice = item.discounted_price || item.base_price || 0;
      const discountPct = item.discount_percent ? Math.round(item.discount_percent * 100) : 0;
      const originalPriceHtml = discountPct > 0 ? `<span style="text-decoration:line-through; font-size:10px; color:var(--muted); margin-right:6px;">${item.base_price}</span>` : '';
      const discountBadge = discountPct > 0 ? `<div style="position:absolute; top:6px; left:6px; background:var(--win); font-family:'DM Mono',monospace; font-size:9px; font-weight:800; color:#fff; padding:2px 6px; border-radius:10px; box-shadow:0 2px 6px rgba(62,207,142,0.3); z-index:2;">-${discountPct}%</div>` : '';
      const fallbackBadge = `<div class="team-logo-fallback" style="width:50px; height:50px; border-radius:50%; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; font-family:Barlow Condensed,sans-serif; font-size:18px; font-weight:900; color:var(--accent);">${item.name.substring(0,2).toUpperCase()}</div>`;
      const itemImg = item.image ? `<img src="${item.image}" style="width:100%; height:55px; object-fit:contain; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5)); transition:all 0.2s;" class="store-item-img" />` : fallbackBadge;
      
      const itemTitle = item.name;
      
      // Let's see if we can link this item to our skin catalog if it's a skin
      let clickAttr = '';
      let cursorStyle = 'cursor:default;';
      if (item.type === 'skin' || item.type === 'skin_level') {
        clickAttr = `onclick="openSkinByName('${escapeJsString(item.name)}')"`;
        cursorStyle = 'cursor:pointer;';
      }
      
      return `
        <div class="player-card store-item-card" ${clickAttr} style="min-height:115px; padding:10px; position:relative; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; ${cursorStyle}">
          ${discountBadge}
          <div style="height:55px; width:100%; display:flex; align-items:center; justify-content:center;">
            ${itemImg}
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:2px; width:100%;">
            <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:11px; color:#fff; text-transform:uppercase; text-align:center; line-height:1.1; max-width:98%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.name}">${itemTitle}</div>
            <div style="display:flex; align-items:center; justify-content:center; gap:3px;">
              ${originalPriceHtml}
              <span style="font-family:'DM Mono',monospace; font-size:11px; font-weight:800; color:var(--accent);">${discountedPrice} VP</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card" style="padding:20px; border-radius:12px; background:rgba(20, 20, 22, 0.45); border:1px solid var(--border); display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:18px; text-transform:uppercase; color:#fff; display:flex; align-items:center; gap:8px;">
              <span style="width:8px; height:8px; background:var(--accent); border-radius:50%"></span> ${bundleName}
            </div>
            <div style="font-size:11px; color:var(--muted); font-family:'DM Mono',monospace; margin-top:2px;">UUID: ${b.bundle_uuid.substring(0,8)}...</div>
          </div>
          
          <div style="display:flex; gap:16px;">
            <div style="text-align:right;">
              <div style="font-size:9px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Bundle Price</div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:20px; color:#ffb700; text-shadow:0 0 10px rgba(255,183,0,0.25);">🪙 ${b.bundle_price} VP</div>
            </div>
            
            <div style="text-align:right; border-left: 1px solid rgba(255,255,255,0.08); padding-left:16px;">
              <div style="font-size:9px; color:var(--muted); text-transform:uppercase; font-family:'DM Mono',monospace;">Bundle Expiry</div>
              <div id="${elTimerId}" style="font-family:'DM Mono',monospace; font-weight:800; font-size:14px; color:var(--accent); text-shadow:0 0 8px rgba(250,68,84,0.3); margin-top:4px;">0D 0H 0M 0S</div>
            </div>
          </div>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px;">
          ${itemsList}
        </div>
      </div>
    `;
  }).join('');
}

function renderSkinsCatalogSlice() {
  const catalogGrid = document.getElementById('skin-catalog-grid');
  const showMoreBtn = document.getElementById('skin-show-more-btn');
  
  const end = Math.min(currentSkinCatalogIndex + skinCatalogPageSize, filteredSkinsList.length);
  const slice = filteredSkinsList.slice(currentSkinCatalogIndex, end);
  
  if (slice.length === 0 && currentSkinCatalogIndex === 0) {
    catalogGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--muted); padding:30px; font-family:'DM Mono',monospace;">No skins found matching your search.</div>`;
    showMoreBtn.style.display = 'none';
    return;
  }
  
  const html = slice.map(s => {
    // Determine rarity tier details
    const tier = getSkinRarityTier(s.contentTierUuid);
    const fallbackLetter = s.displayName.substring(0, 2).toUpperCase();
    const isMelee = s.displayName.toLowerCase().includes('melee') || s.displayName.toLowerCase().includes('knife') || s.displayName.toLowerCase().includes('axe');
    const fallbackBadge = `<div class="team-logo-fallback" style="width:100%; height:80px; background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-size:36px; font-weight:900; color:rgba(255,255,255,0.05);">${fallbackLetter}</div>`;
    const imageStyle = isMelee ? 'max-width:70%; max-height:60px;' : 'max-width:90%; max-height:55px;';
    const displayImg = s.displayIcon ? `<img src="${s.displayIcon}" style="${imageStyle} object-fit:contain; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.55)); transition:all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);" class="skin-card-img" />` : fallbackBadge;
    
    // Estimate pricing in VP based on Content Tier
    const estimatedPrice = s.displayName.toLowerCase().includes('melee') || s.displayName.toLowerCase().includes('knife') 
      ? tier.meleePrice 
      : tier.price;
      
    const rarityStyle = `border-left: 3px solid ${tier.color};`;
    const borderHoverColor = tier.color;
    
    return `
      <div class="card player-card skin-catalog-card" onclick="openSkinModal('${s.uuid}')" onmouseover="this.style.borderColor='${borderHoverColor}'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'" style="${rarityStyle} min-height:165px; padding:16px; background:rgba(20, 20, 22, 0.35); border-radius:10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; transition:all 0.2s cubic-bezier(0.25,0.8,0.25,1); position:relative;">
        <div style="position:absolute; top:8px; right:8px; width:14px; height:14px; background:${tier.color}; border-radius:50%; opacity:0.75; display:flex; align-items:center; justify-content:center; font-size:7px; font-weight:900; color:#000;" title="${tier.name}">R</div>
        <div style="height:70px; width:100%; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${displayImg}
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:3px; width:100%;">
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; color:#fff; text-transform:uppercase; text-align:center; line-height:1.2; max-width:98%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.displayName}">${s.displayName}</div>
          <div style="font-family:'DM Mono',monospace; font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:4px;">
            <span style="font-size:11px;">🪙</span> ${estimatedPrice} VP
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (currentSkinCatalogIndex === 0) {
    catalogGrid.innerHTML = html;
  } else {
    catalogGrid.insertAdjacentHTML('beforeend', html);
  }
  
  currentSkinCatalogIndex = end;
  showMoreBtn.style.display = currentSkinCatalogIndex >= filteredSkinsList.length ? 'none' : 'block';
}

function showMoreSkins() {
  renderSkinsCatalogSlice();
}

function filterSkins() {
  const searchQ = document.getElementById('skin-search-input').value.toLowerCase().trim();
  const weaponFilter = document.getElementById('skin-weapon-select').value.toLowerCase();
  const rarityFilter = document.getElementById('skin-rarity-select').value.toLowerCase();
  
  filteredSkinsList = allSkinsList.filter(s => {
    const nameMatches = s.displayName.toLowerCase().includes(searchQ);
    
    // Weapon Type Filter
    let weaponMatches = true;
    if (weaponFilter !== 'all') {
      const displayName = s.displayName.toLowerCase();
      if (weaponFilter === 'melee') {
        weaponMatches = displayName.includes('melee') || displayName.includes('knife') || displayName.includes('axe') || displayName.includes('dagger') || displayName.includes('blade') || displayName.includes('bat') || displayName.includes('sword') || displayName.includes('anchor') || displayName.includes('karambit') || displayName.includes('scythe');
      } else {
        weaponMatches = displayName.includes(weaponFilter);
      }
    }
    
    // Rarity Tier Filter
    let rarityMatches = true;
    if (rarityFilter !== 'all') {
      const tier = getSkinRarityTier(s.contentTierUuid);
      rarityMatches = tier.shortName.toLowerCase() === rarityFilter;
    }
    
    return nameMatches && weaponMatches && rarityMatches;
  });
  
  currentSkinCatalogIndex = 0;
  safeSetInnerHtml('skin-catalog-grid', '');
  renderSkinsCatalogSlice();
}

function getSkinRarityTier(tierUuid) {
  // Map Valorant Skin Content Tiers (Rarities)
  const tiers = {
    // Select Edition (Blue Rarity)
    "12683d76-48d7-84a3-4e11-5be5b4574b72": { name: "Select Edition", shortName: "select", color: "#3ecf8e", price: 875, meleePrice: 1750, icon: "🟢" },
    // Deluxe Edition (Green Rarity)
    "0cebb8be-46e7-c15a-e1d5-89f58f5d883b": { name: "Deluxe Edition", shortName: "deluxe", color: "#00b2ff", price: 1275, meleePrice: 2550, icon: "🔵" },
    // Premium Edition (Pink Rarity)
    "607b0394-4343-4343-d2df-8b9ed9381734": { name: "Premium Edition", shortName: "premium", color: "#d154ff", price: 1775, meleePrice: 3550, icon: "🟣" },
    // Ultra Edition (Yellow Rarity)
    "11111111-1111-1111-1111-111111111111": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "🟡" },
    "e046854e-406c-37f4-660d-419b228b7684": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "🟡" },
    // Exclusive Edition (Orange Rarity)
    "411e4e55-4e59-7757-41a0-bf9e228b7634": { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 2175, meleePrice: 4350, icon: "🔴" }
  };
  
  return tiers[tierUuid] || { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 1775, meleePrice: 3550, icon: "🔴" };
}

function openSkinByName(name) {
  if (allSkinsList.length === 0) return;
  const skin = allSkinsList.find(s => s.displayName.toLowerCase().trim() === name.toLowerCase().trim());
  if (skin) {
    openSkinModal(skin.uuid);
  }
}

function openSkinModal(uuid) {
  if (allSkinsList.length === 0) return;
  const s = allSkinsList.find(item => item.uuid === uuid);
  if (!s) return;
  
  // Set Up Basic Info
  const tier = getSkinRarityTier(s.contentTierUuid);
  const estimatedPrice = s.displayName.toLowerCase().includes('melee') || s.displayName.toLowerCase().includes('knife') 
    ? tier.meleePrice 
    : tier.price;
    
  document.getElementById('skin-modal-title').textContent = s.displayName;
  document.getElementById('skin-modal-rarity-icon').textContent = tier.icon;
  document.getElementById('skin-modal-price-val').textContent = estimatedPrice;
  
  // Set Main Image
  const largeImg = document.getElementById('skin-modal-large-img');
  largeImg.src = s.displayIcon;
  
  // Setup Chromas Choices
  const chromasContainer = document.getElementById('skin-modal-chromas');
  chromasContainer.innerHTML = '';
  
  if (s.chromas && s.chromas.length > 0) {
    s.chromas.forEach((chroma, idx) => {
      // Create clickable circular color badge
      const activeStyle = idx === 0 ? 'border-color:var(--accent); background:rgba(250,68,84,0.1);' : '';
      const title = chroma.displayName.includes('\n') ? chroma.displayName.replace('\n', ' ') : chroma.displayName;
      
      const badge = document.createElement('div');
      badge.className = 'skin-chroma-card';
      badge.style = `cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; padding:6px 12px; border:1px solid rgba(255,255,255,0.08); border-radius:18px; font-size:10px; font-family:'DM Mono',monospace; font-weight:800; background:rgba(255,255,255,0.02); transition:var(--transition); ${activeStyle}`;
      badge.innerHTML = `
        <img src="${chroma.displayIcon || s.displayIcon}" style="width:28px; height:14px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />
        <span style="color:#fff">${title.replace(s.displayName, '').replace('(', '').replace(')', '').trim() || 'Default'}</span>
      `;
      badge.onclick = () => {
        // Toggle active border
        chromasContainer.querySelectorAll('.skin-chroma-card').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.08)');
        badge.style.borderColor = 'var(--accent)';
        largeImg.style.transform = 'scale(0.85)';
        largeImg.style.opacity = '0';
        
        setTimeout(() => {
          largeImg.src = chroma.fullRender || chroma.displayIcon || s.displayIcon;
          largeImg.style.transform = 'scale(1)';
          largeImg.style.opacity = '1';
        }, 150);
      };
      
      chromasContainer.appendChild(badge);
    });
  }

  // Setup Upgrade Levels and Demos
  const levelsContainer = document.getElementById('skin-modal-levels');
  const videoContainer = document.getElementById('skin-modal-video-container');
  const videoPlayer = document.getElementById('skin-modal-video-player');
  
  levelsContainer.innerHTML = '';
  videoContainer.style.display = 'none';
  videoPlayer.src = '';
  
  if (s.levels && s.levels.length > 0) {
    s.levels.forEach((level, idx) => {
      const isPlayable = !!level.streamedVideo;
      const playIcon = isPlayable ? '<span style="color:var(--win); font-weight:bold; font-size:11px;">▶ Watch Demonstration Video</span>' : '';
      const borderHoverStyle = isPlayable ? `onmouseover="this.style.borderColor='var(--win)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'"` : '';
      const cursorStyle = isPlayable ? 'cursor:pointer;' : 'cursor:default;';
      const levelItem = document.createElement('div');
      
      levelItem.className = 'skin-level-card';
      levelItem.style = `padding:10px 14px; display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.05); border-radius:6px; font-size:11px; ${cursorStyle} ${borderHoverStyle} transition:var(--transition);`;
      
      // Clean up level name
      let displayName = level.displayName || `Level ${idx+1}`;
      displayName = displayName.replace(s.displayName, '').replace('(', '').replace(')', '').trim() || `Base Level 1`;
      
      levelItem.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:'DM Mono',monospace; font-weight:800; color:var(--accent);">LVL ${idx+1}</span>
          <span style="font-weight:700; color:#fff; text-transform:uppercase;">${displayName}</span>
        </div>
        ${playIcon}
      `;
      
      if (isPlayable) {
        levelItem.onclick = () => {
          videoContainer.style.display = 'block';
          videoPlayer.src = level.streamedVideo;
          videoPlayer.play();
          
          // Smooth scroll to video player
          setTimeout(() => {
            videoContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 100);
        };
      }
      
      levelsContainer.appendChild(levelItem);
    });
  }

  // Open the Modal
  document.getElementById('skin-modal-overlay').classList.add('open');
  lockBackgroundScroll();
}

function closeSkinModal() {
  document.getElementById('skin-modal-overlay').classList.remove('open');
  unlockBackgroundScroll();
  const videoPlayer = document.getElementById('skin-modal-video-player');
  if (videoPlayer) {
    videoPlayer.pause();
    videoPlayer.src = '';
  }
}

// ── TEAM DRAFT COACH ENGINE ──

let draftSlots = [null, null, null, null, null];
let activeSlotIndex = null;

const draftMapRecommendations = {
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

function openDraftSelector(slotIndex) {
  activeSlotIndex = slotIndex;
  document.getElementById('dc-agent-modal').classList.add('open');
  lockBackgroundScroll();
  renderDraftAgentList();
}

function closeDraftSelector() {
  document.getElementById('dc-agent-modal').classList.remove('open');
  unlockBackgroundScroll();
  activeSlotIndex = null;
}

function renderDraftAgentList() {
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

  const seenUuids = new Set();
  const allAgents = Object.keys(AGENT_UUIDS).filter(ag => {
    const uuid = AGENT_UUIDS[ag];
    if (seenUuids.has(uuid)) return false;
    seenUuids.add(uuid);
    return true;
  });
  allAgents.forEach(ag => {
    const agKey = ag.toLowerCase();
    const normKey = (agKey === 'kayo') ? 'kay/o' : agKey;
    if (draftSlots.some(s => {
      if (!s) return false;
      const sNorm = s.toLowerCase() === 'kayo' ? 'kay/o' : s.toLowerCase();
      return sNorm === normKey;
    })) return;
    
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

      // ── PERSONAL WR BADGE (if player has match data for this agent) ──
      const pool = window._playerAgentPool || {};
      const myStats = pool[agKey];
      const wrBadge = myStats
        ? `<div style="position:absolute;top:-5px;right:-5px;background:${myStats.wr>=55?'var(--win)':myStats.wr>=40?'#f5a623':'var(--loss)'};color:#000;font-family:'DM Mono',monospace;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px;border:1px solid rgba(0,0,0,0.3);z-index:2;line-height:1.3;">${myStats.wr}%</div>`
        : '';

      div.innerHTML = `
        <div style="position:relative;width:fit-content;margin:0 auto;">
          <div class="dc-slot-avatar" style="width: 44px; height: 44px; border-color: ${myStats ? (myStats.wr>=55?'rgba(62,207,142,0.5)':myStats.wr>=40?'rgba(245,166,35,0.5)':'rgba(250,68,84,0.5)') : 'rgba(255,255,255,0.08)'}; transition: all 0.2s ease;">
            ${iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤'}
          </div>
          ${wrBadge}
        </div>
        <div style="font-family:'Barlow Condensed', sans-serif; font-size:11px; font-weight:800; color:#fff; text-transform:uppercase; text-align:center; overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap; letter-spacing:0.5px; margin-top:4px">${ag}</div>
        ${myStats ? `<div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);text-align:center;margin-top:1px">${myStats.matches}g · ${myStats.kd}kd</div>` : ''}
      `;
      grid.appendChild(div);
    });

    section.appendChild(headerWrap);
    section.appendChild(grid);
    container.appendChild(section);
  });
}

function selectDraftAgent(agKey) {
  if (activeSlotIndex === null) return;
  draftSlots[activeSlotIndex] = agKey;
  
  const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);
  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);
  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
  
  if (slotAvatar) {
    slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
  }
  if (slotName) {
    slotName.innerText = agKey.toUpperCase();
  }
  
  closeDraftSelector();
  evaluateDraft();
}

// ── SAVED DRAFTS (localStorage) & PNG INFOGRAPHIC EXPORT ──
function saveCurrentDraftComp() {
  const selected = draftSlots.filter(s => s !== null);
  if (selected.length < 5) {
    showToast('Cannot save incomplete draft. Draft 5 agents first.');
    return;
  }
  
  const mapKey = document.getElementById('dc-map-select').value;
  const mapCapitalized = mapKey.charAt(0).toUpperCase() + mapKey.slice(1);
  
  const compName = prompt("Enter a name for this custom setup:", `${mapCapitalized} Tactics`);
  if (compName === null) return; // user cancelled
  
  const finalName = compName.trim() || `${mapCapitalized} Tactics`;
  
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('valtracker_comps')) || [];
  } catch(e) { saved = []; }
  
  saved.unshift({
    id: Date.now(),
    name: finalName,
    map: mapKey,
    agents: [...draftSlots],
    timestamp: Date.now()
  });
  
  localStorage.setItem('valtracker_comps', JSON.stringify(saved));
  renderSavedDrafts();
  showToast('Composition saved successfully!');
}

function deleteDraftComp(id) {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('valtracker_comps')) || [];
  } catch(e) { saved = []; }
  
  saved = saved.filter(c => c.id !== id);
  localStorage.setItem('valtracker_comps', JSON.stringify(saved));
  renderSavedDrafts();
  showToast('Draft deleted.');
}

function loadDraftComp(id) {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('valtracker_comps')) || [];
  } catch(e) { saved = []; }
  
  const comp = saved.find(c => c.id === id);
  if (!comp) return;
  
  draftSlots = [...comp.agents];
  const mapSelect = document.getElementById('dc-map-select');
  if (mapSelect && comp.map) {
    mapSelect.value = comp.map;
  }
  
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (agKey) {
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    } else {
      if (slotAvatar) {
        slotAvatar.innerHTML = '➕';
      }
      if (slotName) {
        slotName.innerText = `Slot ${i+1}`;
      }
    }
  }
  
  evaluateDraft();
  showToast('Custom draft loaded!');
}

function renderSavedDrafts() {
  const container = document.getElementById('saved-comps-list');
  const card = document.getElementById('saved-comps-card');
  const label = document.getElementById('saved-comps-label');
  
  if (!container || !card || !label) return;
  
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem('valtracker_comps')) || [];
  } catch(e) { saved = []; }
  
  if (saved.length === 0) {
    card.style.display = 'none';
    label.style.display = 'none';
    return;
  }
  
  card.style.display = 'flex';
  label.style.display = 'block';
  
  container.innerHTML = saved.map(c => {
    const mapName = c.map.toUpperCase();
    const iconsHtml = c.agents.map(ag => {
      if (!ag) return '';
      const icon = getAgentIconUrl(ag.charAt(0).toUpperCase() + ag.slice(1));
      return icon ? `<img src="${icon}" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);" title="${ag.toUpperCase()}">` : '👤';
    }).join('');
    
    return `
      <div class="landing-quick-btn" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom: 2px;">
        <div onclick="loadDraftComp(${c.id})" style="display:flex; flex-direction:column; gap:6px; flex:1; cursor:pointer;">
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:800; color:#fff; text-transform:uppercase; display:flex; align-items:center; gap:8px;">
            <span>${c.name}</span>
            <span style="font-family:'DM Mono',monospace; font-size:9px; color:var(--accent); border:1px solid rgba(232,232,232,0.2); padding:0px 4px; border-radius:3px;">${mapName}</span>
          </div>
          <div style="display:flex; gap:4px; align-items:center;">
            ${iconsHtml}
          </div>
        </div>
        <button onclick="deleteDraftComp(${c.id})" style="background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:0 4px; transition:color 0.2s;" onmouseover="this.style.color='#ff4655'" onmouseout="this.style.color='var(--muted)'">×</button>
      </div>
    `;
  }).join('');
}

async function exportCurrentDraftCompPNG() {
  if (typeof html2canvas === 'undefined') {
    showToast('Export library not loaded.');
    return;
  }
  
  const selected = draftSlots.filter(s => s !== null);
  if (selected.length < 5) {
    showToast('Cannot export incomplete draft. Draft 5 agents first.');
    return;
  }
  
  const mapKey = document.getElementById('dc-map-select').value;
  const mapCapitalized = mapKey.toUpperCase();
  
  const score = document.getElementById('dc-score-meter').innerText;
  const verdictTitle = document.getElementById('dc-verdict-title').innerText;
  const verdictDesc = document.getElementById('dc-verdict-desc').innerText;
  
  const duelistsText = document.getElementById('dc-bar-duelists-txt').innerText;
  const duelistsWidth = document.getElementById('dc-bar-duelists').style.width;
  
  const initiatorsText = document.getElementById('dc-bar-initiators-txt').innerText;
  const initiatorsWidth = document.getElementById('dc-bar-initiators').style.width;
  
  const controllersText = document.getElementById('dc-bar-controllers-txt').innerText;
  const controllersWidth = document.getElementById('dc-bar-controllers').style.width;
  
  const sentinelsText = document.getElementById('dc-bar-sentinels-txt').innerText;
  const sentinelsWidth = document.getElementById('dc-bar-sentinels').style.width;
  
  const entryText = document.getElementById('dc-metric-entry-txt').innerText;
  const entryWidth = document.getElementById('dc-metric-entry').style.width;
  
  const defenseText = document.getElementById('dc-metric-defense-txt').innerText;
  const defenseWidth = document.getElementById('dc-metric-defense').style.width;
  
  const retakeText = document.getElementById('dc-metric-retake-txt').innerText;
  const retakeWidth = document.getElementById('dc-metric-retake').style.width;
  
  const synergyText = document.getElementById('dc-metric-synergy-txt').innerText;
  const synergyWidth = document.getElementById('dc-metric-synergy').style.width;
  
  const insightsWrap = document.getElementById('dc-insights-wrap');
  let insightsHtml = '';
  if (insightsWrap) {
    const insightCards = Array.from(insightsWrap.querySelectorAll('.dc-insight-card'));
    insightsHtml = insightCards.slice(0, 3).map(card => {
      const text = card.innerText.trim();
      const isWarn = card.classList.contains('warn');
      const isTip = card.classList.contains('tip');
      const isOk = card.classList.contains('ok');
      
      let borderColor = 'rgba(255,255,255,0.08)';
      let bgColor = 'rgba(255,255,255,0.02)';
      let icon = '⚡';
      if (isWarn) { borderColor = '#fa4454'; bgColor = 'rgba(250,68,84,0.04)'; icon = '⚠️'; }
      else if (isTip) { borderColor = '#e8ff47'; bgColor = 'rgba(232,255,71,0.04)'; icon = '💡'; }
      else if (isOk) { borderColor = '#3ecf8e'; bgColor = 'rgba(62,207,142,0.04)'; icon = '✓'; }
      
      return `
        <div style="background:${bgColor}; border:1px solid ${borderColor}; padding:8px 12px; border-radius:8px; display:flex; gap:8px; align-items:start; font-size:10px; color:#fff; line-height:1.2; text-align:left; margin-bottom:4px;">
          <span style="font-size:11px;">${icon}</span>
          <span>${text}</span>
        </div>
      `;
    }).join('');
  }
  
  const agentLineupHtml = draftSlots.map(ag => {
    const icon = getAgentIconUrl(ag.charAt(0).toUpperCase() + ag.slice(1));
    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px; width:75px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:10px; box-sizing:border-box;">
        <img src="${icon}" style="width:38px; height:38px; border-radius:50%; border:2px solid rgba(255, 68, 84, 0.3);">
        <span style="font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:800; text-transform:uppercase; color:#fff; text-align:center; overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap;">${ag}</span>
      </div>
    `;
  }).join('');
  
  const exportCard = document.getElementById('dc-export-container');
  exportCard.innerHTML = `
    <div id="dc-capture-target" style="width: 480px; padding: 24px; background: linear-gradient(135deg, #141416 0%, #0d0d0f 100%); border: 2px solid #ff4655; border-radius: 16px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(255,70,85,0.2); padding-bottom:12px; margin-bottom:16px;">
        <div>
          <div style="font-size:22px; font-weight:900; letter-spacing:1px; color:#ff4655; text-transform:uppercase; line-height:1;">VALTRACKER</div>
          <div style="font-family:'DM Mono',monospace; font-size:9px; color:#7e7e8a; text-transform:uppercase; margin-top:2px;">VCT Coach Verdict</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1;">${mapCapitalized}</div>
          <div style="font-family:'DM Mono',monospace; font-size:9px; color:#7e7e8a; text-transform:uppercase; margin-top:2px;">MAP SETTINGS</div>
        </div>
      </div>
      
      <div style="display:flex; justify-content:space-between; gap:6px; margin-bottom:16px;">
        ${agentLineupHtml}
      </div>
      
      <div style="display:flex; align-items:center; gap:16px; background:rgba(255, 70, 85, 0.04); border:1px solid rgba(255, 70, 85, 0.12); padding:12px; border-radius:12px; margin-bottom:16px; box-sizing:border-box;">
        <div style="width:56px; height:56px; border-radius:50%; border:3px solid #ff4655; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(255,70,85,0.1); flex-shrink:0; box-sizing:border-box;">
          <div style="font-size:20px; font-weight:900; color:#ff4655; line-height:1;">${score}</div>
          <div style="font-size:7px; color:#7e7e8a; font-weight:bold; text-transform:uppercase; line-height:1; margin-top:1px;">SCORE</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:15px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1.1;">${verdictTitle}</div>
          <p style="font-size:10px; color:#7e7e8a; margin:3px 0 0 0; line-height:1.2;">${verdictDesc}</p>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
          <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:2px;">📊 Role Balance</div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Duelists</span><span>${duelistsText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${duelistsWidth}; height:100%; background:#ff4655;"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Initiators</span><span>${initiatorsText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${initiatorsWidth}; height:100%; background:#ffb01f;"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Controllers</span><span>${controllersText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${controllersWidth}; height:100%; background:#00f2fe;"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Sentinels</span><span>${sentinelsText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${sentinelsWidth}; height:100%; background:#3ecf8e;"></div>
            </div>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
          <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:2px;">⚡ Coordination</div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Site Entry & Exec</span><span>${entryText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${entryWidth}; height:100%; background:linear-gradient(90deg, #ff4655, #ff8080);"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Defensive Delay</span><span>${defenseText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${defenseWidth}; height:100%; background:linear-gradient(90deg, #3ecf8e, #00f2fe);"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Retake & Scouting</span><span>${retakeText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${retakeWidth}; height:100%; background:linear-gradient(90deg, #ffb01f, #f53b57);"></div>
            </div>
          </div>
          
          <div>
            <div style="display:flex; justify-content:space-between; font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; margin-bottom:1px;">
              <span>Synergy Factor</span><span>${synergyText}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
              <div style="width:${synergyWidth}; height:100%; background:linear-gradient(90deg, #8c46ff, #e8ff47);"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:8px; text-align:left;">⚡ Coach Analysis Insights</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${insightsHtml || '<div style="font-size:9px; color:#7e7e8a; text-align:center;">No custom insights triggered for this comp.</div>'}
        </div>
      </div>
    </div>
  `;
  
  showToast('Generating infographic card...');
  
  setTimeout(async () => {
    try {
      const el = document.getElementById('dc-capture-target');
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `valtracker_draft_${mapKey}_${new Date().getTime()}.png`;
      a.click();
      showToast('Infographic card downloaded! ✓');
    } catch(e) {
      console.error(e);
      showToast('Export failed.');
    }
  }, 120);
}

function resetDraftComp() {
  draftSlots = [null, null, null, null, null];
  for (let i = 0; i < 5; i++) {
    safeSetInnerHtml(`dc-slot-avatar-${i}`, '➕');
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (slotName) {
      slotName.innerText = `Slot ${i+1}`;
    }
  }
  evaluateDraft();
}

function buildAroundMe() {
  const mapKey = document.getElementById('dc-map-select').value;
  const pool = window._playerAgentPool || {};
  
  // Find if there is already an agent selected in the slots
  let mainAgent = null;
  for (let i = 0; i < 5; i++) {
    if (draftSlots[i]) {
      mainAgent = draftSlots[i];
      break;
    }
  }
  
  // If no agent selected, pick their historical main agent from the parsed agent pool
  if (!mainAgent) {
    const topAgents = Object.keys(pool);
    if (topAgents.length > 0) {
      mainAgent = topAgents[0]; // most played agent
    } else {
      mainAgent = 'jett'; // default fallback
    }
  }
  
  // Clean all slots and set the first one to mainAgent
  resetDraftComp();
  draftSlots[0] = mainAgent;
  
  // Suggest the other 4 agents based on map and role balance
  const mapRecs = draftMapRecommendations[mapKey] || { preferred: [], note: '' };
  
  const roles = {
    duelist: ['jett', 'raze', 'neon', 'yoru', 'phoenix', 'reyna'],
    initiator: ['sova', 'fade', 'gekko', 'skye', 'kay/o', 'breach'],
    controller: ['omen', 'viper', 'brimstone', 'clove', 'astra', 'harbor'],
    sentinel: ['killjoy', 'cypher', 'vyse', 'deadlock', 'sage']
  };
  
  const getRole = (agent) => {
    return getRoleClass(agent.charAt(0).toUpperCase() + agent.slice(1));
  };
  
  const mainRole = getRole(mainAgent);
  
  // Standard composition needs: 1 controller, 1 sentinel, 1 initiator, and 1 duelist.
  const requiredRoles = ['controller', 'sentinel', 'initiator', 'duelist'];
  
  // Remove the role of our main agent from the list of strictly required roles
  const mainRoleIndex = requiredRoles.indexOf(mainRole);
  if (mainRoleIndex > -1) {
    requiredRoles.splice(mainRoleIndex, 1);
  }
  
  // So we need 3 required roles, and 1 flex role
  const neededRoles = [...requiredRoles];
  if (mainRole === 'controller') {
    neededRoles.push('initiator'); // dual initiator
  } else if (mainRole === 'sentinel') {
    neededRoles.push('controller'); // dual controller
  } else {
    neededRoles.push('controller'); // default dual controller or initiator
  }
  
  const pickedAgents = new Set([mainAgent]);
  
  neededRoles.forEach((role, idx) => {
    const candidates = roles[role];
    let bestCandidate = null;
    let maxScore = -1000;
    
    candidates.forEach(cand => {
      if (pickedAgents.has(cand)) return;
      
      let score = 0;
      // Preferred meta pick for this map
      if (mapRecs.preferred.includes(cand)) {
        score += 40;
      }
      
      // User's own pool
      if (pool[cand]) {
        score += 20 + (pool[cand].wr || 50) * 0.5; // favor played agents with high WR
      }
      
      // Map synergies
      if (mainAgent === 'jett' || mainAgent === 'neon') {
        if (cand === 'breach' || cand === 'omen') score += 15;
      }
      if (mainAgent === 'viper') {
        if (cand === 'brimstone' || cand === 'killjoy') score += 15;
      }
      if (mainAgent === 'cypher' || mainAgent === 'deadlock') {
        if (cand === 'raze') score += 15;
      }
      if (mainAgent === 'sova' || mainAgent === 'fade') {
        if (cand === 'gekko') score += 15;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestCandidate = cand;
      }
    });
    
    if (bestCandidate) {
      pickedAgents.add(bestCandidate);
      draftSlots[idx + 1] = bestCandidate;
    }
  });
  
  // Render the selected agents into the UI slots
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    if (agKey) {
      const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
      const slotName = document.getElementById(`dc-slot-name-${i}`);
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    }
  }
  
  evaluateDraft();
  showToast(`✨ Composition built around ${mainAgent.toUpperCase()} using your pool and map meta!`);
}

function evaluateDraft() {
  const selected = draftSlots.filter(s => s !== null);
  const total = selected.length;
  const mapKey = document.getElementById('dc-map-select').value;
  
  // Fetch and inject live VCT pro stats immediately (even before user completes draft!)
  fetchVCTMetaComps(mapKey);
  
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
  // mapKey retrieved at top of function
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

  // Inter-agent synergy score impact
  score += Math.round(synergyScore * 0.15); // max +15 pts from inter-agent co-ordination

  // Print all pairwise synergies
  synergyDetails.forEach(sd => {
    insights.push({ type: 'good', icon: '💥', text: sd });
  });

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

let lastFetchedMap = null;

function fetchVCTMetaComps(mapKey) {
  const favLineup = document.getElementById('dc-pro-fav-lineup');
  const favStats = document.getElementById('dc-pro-fav-stats');
  const favWr = document.getElementById('dc-pro-fav-wr');
  
  const champLineup = document.getElementById('dc-pro-champ-lineup');
  const champStats = document.getElementById('dc-pro-champ-stats');
  const champWr = document.getElementById('dc-pro-champ-wr');
  
  const patchTxt = document.getElementById('dc-pro-patch-txt');
  const totalMatchesTxt = document.getElementById('dc-pro-total-matches');
  const heatmapList = document.getElementById('dc-pro-heatmap-list');
  
  // Only show loading if we are switching maps
  if (lastFetchedMap !== mapKey) {
    favLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">Loading...</div>';
    champLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">Loading...</div>';
    heatmapList.innerHTML = '<div style="grid-column: 1 / -1; font-size: 11px; color: var(--muted); text-align: center; padding: 12px;">Loading pro data...</div>';
  }
  
  fetch(`/api/v3/meta-comps?map=${mapKey}`)
    .then(r => r.json())
    .then(data => {
      // Guard against race conditions: check if map changed during async request
      const currentMap = document.getElementById('dc-map-select').value;
      if (currentMap !== mapKey) return;
      
      lastFetchedMap = mapKey;
      
      if (data.error || !data.total_comps_parsed) {
        favLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">No data</div>';
        favStats.innerText = '0 Picks';
        favWr.innerText = '0% WR';
        
        champLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">No data</div>';
        champStats.innerText = '0 Picks';
        champWr.innerText = '0% WR';
        
        patchTxt.innerText = 'Patch --';
        totalMatchesTxt.innerText = '0 maps parsed';
        heatmapList.innerHTML = '<div style="grid-column: 1 / -1; font-size: 11px; color: var(--muted); text-align: center; padding: 12px;">No pro stats available for this map.</div>';
        return;
      }
      
      patchTxt.innerText = `Patch ${data.patch}`;
      totalMatchesTxt.innerText = `${data.total_comps_parsed / 2} matches (${data.total_comps_parsed} comps)`;
      
      // 1. Render Meta Favorite Comp
      const fav = data.most_played_comp;
      if (fav && fav.agents && fav.agents.length === 5) {
        favStats.innerText = `${fav.picks} Picks`;
        favWr.innerText = `${fav.win_rate}% WR`;
        favLineup.innerHTML = fav.agents.map(ag => {
          const icon = getAgentIconUrl(ag.charAt(0).toUpperCase() + ag.slice(1));
          return `<div class="dc-slot-avatar mini" title="${ag.toUpperCase()}" style="width:28px; height:28px; font-size:12px; margin:0; border:1px solid rgba(255,255,255,0.15); border-radius:50%; background:#141416; display:flex; align-items:center; justify-content:center; overflow:hidden">
            ${icon ? `<img src="${icon}" style="width:100%; height:100%; border-radius:50%">` : '👤'}
          </div>`;
        }).join('');
      } else {
        favLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">Insufficient comps</div>';
      }
      
      // 2. Render Win-Rate Champion Comp
      const champ = data.highest_winrate_comp;
      if (champ && champ.agents && champ.agents.length === 5) {
        champStats.innerText = `${champ.picks} Picks`;
        champWr.innerText = `${champ.win_rate}% WR`;
        champLineup.innerHTML = champ.agents.map(ag => {
          const icon = getAgentIconUrl(ag.charAt(0).toUpperCase() + ag.slice(1));
          return `<div class="dc-slot-avatar mini" title="${ag.toUpperCase()}" style="width:28px; height:28px; font-size:12px; margin:0; border:1px solid rgba(255,255,255,0.15); border-radius:50%; background:#141416; display:flex; align-items:center; justify-content:center; overflow:hidden">
            ${icon ? `<img src="${icon}" style="width:100%; height:100%; border-radius:50%">` : '👤'}
          </div>`;
        }).join('');
      } else {
        champLineup.innerHTML = '<div style="font-size: 10px; color: var(--muted); text-align: center; width: 100%;">Insufficient comps</div>';
      }
      
      // 3. Render Agent Heatmap List
      const stats = data.agent_stats;
      const sortedAgents = Object.entries(stats).sort((a, b) => b[1].pick_rate - a[1].pick_rate);
      
      if (sortedAgents.length > 0) {
        heatmapList.innerHTML = sortedAgents.map(([ag, val]) => {
          const displayName = ag.toUpperCase();
          const pRate = val.pick_rate;
          const wRate = val.win_rate;
          const icon = getAgentIconUrl(ag.charAt(0).toUpperCase() + ag.slice(1));
          
          return `<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:6px 10px; display:flex; flex-direction:column; gap:4px">
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:9px; font-family:'DM Mono',monospace; color:var(--muted)">
              <div style="display:flex; align-items:center; gap:6px">
                <div style="width:14px; height:14px; border-radius:50%; background:#1c1c22; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); overflow:hidden">
                  ${icon ? `<img src="${icon}" style="width:100%; height:100%; border-radius:50%">` : '👤'}
                </div>
                <span style="color:#fff; font-weight:bold">${displayName}</span>
              </div>
              <span>PR: <strong style="color:var(--accent)">${pRate}%</strong></span>
            </div>
            <div class="dc-track-bar" style="height:4px; margin-bottom:2px">
              <div class="dc-fill-bar" style="width:${pRate}%; height:100%; background:linear-gradient(90deg, var(--accent), #ff8080)"></div>
            </div>
            <div style="font-size:8px; color:var(--muted); text-align:right">
              Win Rate: <span style="color:#ffd700; font-weight:bold">${wRate}%</span>
            </div>
          </div>`;
        }).join('');
      } else {
        heatmapList.innerHTML = '<div style="grid-column:1/-1; font-size:11px; color:var(--muted); text-align:center; padding:12px;">No pro stats for this map.</div>';
      }
      
      // Update User Draft recommendations to compare against pro stats!
      injectProRecommendations(data);
    })
    .catch(err => {
      console.error("Failed to load VCT Meta Comps:", err);
      if (lastFetchedMap !== mapKey) {
        favLineup.innerHTML = '<div style="font-size: 10px; color: var(--loss); text-align: center; width: 100%;">Failed to load pro data</div>';
        champLineup.innerHTML = '<div style="font-size: 10px; color: var(--loss); text-align: center; width: 100%;">Failed to load pro data</div>';
        heatmapList.innerHTML = '<div style="grid-column: 1 / -1; font-size: 11px; color: var(--loss); text-align: center; padding: 12px;">Failed to load pro composition data. Try again.</div>';
        patchTxt.innerText = 'Patch --';
        totalMatchesTxt.innerText = '0 matches';
      }
    });
}

function injectProRecommendations(data) {
  const selected = draftSlots.filter(s => s !== null);
  if (selected.length === 0) return; // nothing to recommend on blank draft
  
  const insightsWrap = document.getElementById('dc-insights-wrap');
  const agentKeys = selected.map(a => a.toLowerCase());
  
  // Clear any previously injected pro recommendations (they have a class dc-insight-card.pro-tip)
  const existingProCards = insightsWrap.querySelectorAll('.dc-insight-card.pro-tip');
  existingProCards.forEach(c => c.remove());
  
  // Clean insights placeholder if it was showing empty
  if (insightsWrap.innerText.includes("Insights panel will fill")) {
    insightsWrap.innerHTML = "";
  }
  
  const stats = data.agent_stats;
  if (!stats) return;
  
  const proTips = [];
  
  // 1. Check if a high pick-rate pro agent is missing from user draft
  const highPickRateThreshold = 60; // e.g. Sova 92% on Ascent
  Object.entries(stats).forEach(([agent, val]) => {
    if (val.pick_rate >= highPickRateThreshold && !agentKeys.includes(agent)) {
      const displayName = agent.charAt(0).toUpperCase() + agent.slice(1);
      proTips.push({
        type: 'pro-tip',
        icon: '💡',
        text: `<strong style="color:#ffd700">Pro Meta Alert — Missing ${displayName} (${val.pick_rate}% Pick Rate):</strong> Winning VCT teams overwhelmingly run ${displayName} on this map in Patch ${data.patch}. Consider swapping to secure top-tier execution power.`
      });
    }
  });
  
  // 2. Check if the user is running a very low pick-rate agent ("Off-Meta")
  selected.forEach(ag => {
    const agKey = ag.toLowerCase();
    const agStats = stats[agKey];
    if (agStats && agStats.pick_rate < 8 && agStats.pick_rate > 0) {
      const displayName = ag.charAt(0).toUpperCase() + ag.slice(1);
      proTips.push({
        type: 'pro-tip',
        icon: '⚠️',
        text: `<strong style="color:var(--loss)">Off-Meta Selection — ${displayName} (${agStats.pick_rate}% Pro Pick Rate):</strong> ${displayName} is rarely chosen by pros on this map in Patch ${data.patch}. Ensure your squad has specific tactical sets to make this pick successful.`
      });
    }
  });

  // 3. Check if they perfectly matched the most played comp or winrate champ!
  const sortedUserComp = [...agentKeys].sort().join(',');
  const favCompStr = (data.most_played_comp.agents || []).sort().join(',');
  const champCompStr = (data.highest_winrate_comp.agents || []).sort().join(',');
  
  if (sortedUserComp === favCompStr) {
    proTips.push({
      type: 'good pro-tip',
      icon: '🔥',
      text: `<strong style="color:#ffd700">Elite Copycat Bonus:</strong> Your draft is a 100% match to the **VCT Meta Favorite** composition! You are running the absolute gold standard.`
    });
  } else if (sortedUserComp === champCompStr) {
    proTips.push({
      type: 'good pro-tip',
      icon: '👑',
      text: `<strong style="color:#ffd700">Championship Alignment:</strong> Your draft matches the **Elite Win-Rate Champion** composition! Pros secure their highest win rates using this exact layout.`
    });
  }
  
  // Append these pro-tips to the insights wrap!
  if (proTips.length > 0) {
    const htmlString = proTips.map(i => `
      <div class="dc-insight-card pro-tip" style="border-left: 2px solid #ffd700 !important; background: linear-gradient(90deg, rgba(255,215,0,0.06), rgba(0,0,0,0.1)) !important; margin-bottom: 8px;">
        <span class="dc-insight-card-icon" style="color:#ffd700">${i.icon}</span>
        <div>${i.text}</div>
      </div>
    `).join('');
    
    insightsWrap.insertAdjacentHTML('beforeend', htmlString);
  }
}




// ==========================================
// STREAM OVERLAY CUSTOMIZER SYSTEM
// ==========================================
function onOverlayVariantChange() {
  const variant = document.getElementById('overlay-variant-select').value;
  const checklist = document.getElementById('flex-stats-checklist-group');
  if (variant === 'flexible') {
    checklist.style.display = 'block';
  } else {
    checklist.style.display = 'none';
  }
  updateOverlayPreview();
}

function syncColorInput(type) {
  const colorPicker = document.getElementById(`ov-color-${type}`);
  const textInput = document.getElementById(`ov-txt-${type}`);
  if (colorPicker && textInput) {
    let val = colorPicker.value;
    textInput.value = val;
  }
  updateOverlayPreview();
}

function syncColorPicker(type) {
  const colorPicker = document.getElementById(`ov-color-${type}`);
  const textInput = document.getElementById(`ov-txt-${type}`);
  if (colorPicker && textInput) {
    let val = textInput.value.trim();
    // If it is a valid hex, update color picker
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      colorPicker.value = val;
    }
  }
  updateOverlayPreview();
}

function updateOverlayScale() {
  const range = document.getElementById('ov-scale-range');
  const valDisplay = document.getElementById('overlay-scale-val');
  if (range && valDisplay) {
    valDisplay.textContent = parseFloat(range.value).toFixed(2) + 'x';
  }
  updateOverlayPreview();
}

function updateOverlayPreview() {
  const name = document.getElementById('overlay-name-input').value.trim();
  const tag = document.getElementById('overlay-tag-input').value.trim();
  const region = document.getElementById('overlay-region-select').value;
  const variant = document.getElementById('overlay-variant-select').value;
  const accent = document.getElementById('ov-txt-accent').value.trim().replace('#', '');
  const bg = encodeURIComponent(document.getElementById('ov-txt-bg').value.trim());
  const text = document.getElementById('ov-txt-text').value.trim().replace('#', '');
  const border = encodeURIComponent(document.getElementById('ov-txt-border').value.trim());
  const scale = document.getElementById('ov-scale-range').value;

  if (!name || !tag) {
    document.getElementById('obs-generated-url').value = "Please enter name and tag first";
    const sandbox = document.getElementById('overlay-preview-sandbox');
    if (sandbox) {
      sandbox.style.width = '';
      sandbox.style.height = '';
      sandbox.style.display = '';
      sandbox.style.position = '';
    }
    document.getElementById('overlay-preview-sandbox').innerHTML = `
      <div style="font-family:'DM Mono',monospace; font-size:11px; color:var(--muted); text-align:center; padding: 40px;">
        Enter a player's Name and Tag to generate the stream overlay preview.
      </div>
    `;
    return;
  }

  const host = window.location.origin;
  let url = `${host}/overlay?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&variant=${variant}`;
  
  if (accent) url += `&accent=${accent}`;
  if (bg) url += `&bg=${bg}`;
  if (text) url += `&text=${text}`;
  if (border) url += `&border=${border}`;
  if (scale !== '1') url += `&scale=${scale}`;

  if (variant === 'flexible') {
    const checked = Array.from(document.querySelectorAll('#flex-stats-checklist-group input[type="checkbox"]:checked')).map(c => c.value);
    if (checked.length > 0) {
      url += `&stats=${checked.join(',')}`;
    }
  }

  document.getElementById('obs-generated-url').value = url;

  // Render preview iframe
  let w = 600, h = 200;
  if (variant === 'center') { w = 720; h = 120; }
  else if (variant === 'flexible') { w = 320; h = 480; }

  // Adjust preview scaling to fit in preview canvas (both width and height constraints)
  const canvasEl = document.getElementById('overlay-preview-canvas');
  const canvasWidth = canvasEl ? canvasEl.clientWidth : 700;
  const canvasHeight = canvasEl ? canvasEl.clientHeight : 480;

  let scaleW = 1.0;
  if (w > (canvasWidth - 40)) {
    scaleW = (canvasWidth - 40) / w;
  }

  let scaleH = 1.0;
  if (h > (canvasHeight - 40)) {
    scaleH = (canvasHeight - 40) / h;
  }

  const previewScale = Math.min(scaleW, scaleH);

  // Set the layout footprint of the sandbox container to the exact scaled dimensions
  const sandbox = document.getElementById('overlay-preview-sandbox');
  if (sandbox) {
    sandbox.style.width = `${w * previewScale}px`;
    sandbox.style.height = `${h * previewScale}px`;
    sandbox.style.display = 'flex';
    sandbox.style.alignItems = 'center';
    sandbox.style.justifyContent = 'center';
    sandbox.style.position = 'relative';
  }

  document.getElementById('overlay-preview-sandbox').innerHTML = `
    <iframe src="${url}" style="border: none; background: transparent; width: ${w}px; height: ${h}px; overflow: hidden; transform: scale(${previewScale}); transform-origin: center center; position: absolute;" scrolling="no"></iframe>
  `;
}

function copyObsUrl() {
  const urlEl = document.getElementById('obs-generated-url');
  if (urlEl && urlEl.value && !urlEl.value.startsWith('Please')) {
    urlEl.select();
    navigator.clipboard.writeText(urlEl.value)
      .then(() => {
        showToast("OBS Overlay URL copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy", err);
        showToast("Failed to copy automatically. Please select text and copy manually.");
      });
  } else {
    showToast("Please enter a player Name and Tag first!");
  }
}

// Search autocomplete recommendations & search
const POPULAR_RECOMMENDATIONS = [];

function initSearchAutocomplete(inputId, tagInputId, dropdownId, regionSelectId) {
  const input = document.getElementById(inputId);
  const tagInput = document.getElementById(tagInputId);
  const dropdown = document.getElementById(dropdownId);
  let debounceTimeout = null;

  if (!input || !dropdown) return;

  // Prevent duplicate listener registration
  if (input.dataset.autocompleteInit) return;
  input.dataset.autocompleteInit = '1';

  const showRecsIfEmpty = () => {
    const val = input.value.trim();
    if (val.length < 2) {
      renderRecommendations(dropdown, input, tagInput, regionSelectId);
    }
  };

  input.addEventListener('focus', showRecsIfEmpty);
  input.addEventListener('click', showRecsIfEmpty);

  input.addEventListener('input', () => {
    let val = input.value.trim();
    if (tagInput && val.includes('#')) {
      const parts = val.split('#');
      const namePart = parts[0].trim();
      const tagPart = parts[1].trim();
      input.value = namePart;
      tagInput.value = tagPart;
      tagInput.focus();
      val = namePart;
    }
    clearTimeout(debounceTimeout);

    if (val.length < 2) {
      renderRecommendations(dropdown, input, tagInput, regionSelectId);
      return;
    }

    // Initial render showing loading status
    renderSearchDropdown([], [], dropdown, input, tagInput, regionSelectId, val, true);

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const players = await res.json();
          renderSearchDropdown(players, [], dropdown, input, tagInput, regionSelectId, val, false);
        } else {
          renderSearchDropdown([], [], dropdown, input, tagInput, regionSelectId, val, false);
        }
      } catch (e) {
        console.error("Autocomplete search failed:", e);
        renderSearchDropdown([], [], dropdown, input, tagInput, regionSelectId, val, false);
      }
    }, 250);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function renderRecommendations(dropdown, input, tagInput, regionSelectId) {
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem('valtracker_bookmarks')) || []; } catch(e) {}
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem('valtracker_recent_searches')) || []; } catch(e) {}

  let html = '<div class="search-rec-container">';
  let hasContent = false;

  // 1. Bookmarks section
  if (bookmarks && bookmarks.length > 0) {
    hasContent = true;
    html += `
      <div class="search-rec-section">
        <div class="search-rec-header">★ Bookmarked Players</div>
        <div class="search-rec-list">
    `;
    bookmarks.slice(0, 4).forEach(p => {
      const rankImg = getRankImgUrl(p.rankName);
      html += `
        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>
              <span class="search-item-meta">${(p.rankName || 'Unranked').toUpperCase()}</span>
            </div>
          </div>
          <div class="search-item-right">
            ${rankImg ? `<img class="search-item-rank-img" src="${rankImg}">` : ''}
            <span class="search-item-region-badge">${p.region}</span>
          </div>
        </div>
      `;
    });
    html += '</div></div>';
  }

  // 2. Recent Searches section
  if (recent && recent.length > 0) {
    hasContent = true;
    html += `
      <div class="search-rec-section">
        <div class="search-rec-header">🕒 Recent Searches</div>
        <div class="search-rec-list">
    `;
    recent.slice(0, 4).forEach(p => {
      const rankImg = getRankImgUrl(p.rankName);
      html += `
        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>
              <span class="search-item-meta">${(p.rankName || 'Unranked').toUpperCase()}</span>
            </div>
          </div>
          <div class="search-item-right">
            ${rankImg ? `<img class="search-item-rank-img" src="${rankImg}">` : ''}
            <span class="search-item-region-badge">${p.region}</span>
          </div>
        </div>
      `;
    });
    html += '</div></div>';
  }

  html += '</div>';

  if (!hasContent) {
    dropdown.innerHTML = `
      <div style="padding: 18px; text-align: center; font-size: 11px; color: var(--muted2); font-family: 'DM Mono', monospace;">
        Search for players to build your history...
      </div>
    `;
  } else {
    dropdown.innerHTML = html;
  }

  dropdown.classList.add('open');
  attachDropdownClickEvents(dropdown, input, tagInput, regionSelectId);
}

function renderSearchDropdown(dbPlayers, localMatches, dropdown, input, tagInput, regionSelectId, val, isLoading) {
  const hasDb = dbPlayers && dbPlayers.length > 0;

  if (!hasDb) {
    if (isLoading) {
      dropdown.innerHTML = `
        <div style="padding: 18px; text-align: center; font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div class="spinner-mini" style="width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          Searching database...
        </div>
      `;
      dropdown.classList.add('open');
      return;
    }

    // No matches fallback
    const escapedVal = val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    dropdown.innerHTML = `
      <div style="padding: 18px; text-align: center; font-size: 11.5px; color: var(--muted); font-family: 'DM Mono', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; line-height: 1.4;">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: var(--text);">
          <span>🔍</span> "${escapedVal}" is not cached yet
        </div>
        <div style="font-size: 9px; color: var(--muted2); text-transform: uppercase; letter-spacing: 0.5px; text-align: center; max-width: 280px;">
          Type your TAG and click <strong style="color: var(--accent);">View Stats</strong> to load directly from Riot Games' database!
        </div>
      </div>
    `;
    dropdown.classList.add('open');
    return;
  }

  let html = '';

  // Render Database matches
  if (hasDb) {
    html += `
      <div class="search-rec-section">
        <div class="search-rec-header">🔍 Database Matches</div>
        <div class="search-rec-list">
    `;
    dbPlayers.forEach(p => {
      const rankImg = getRankImgUrl(p.current_tier_patched);
      const cardUrl = p.card_id ? `https://media.valorant-api.com/playercards/${p.card_id}/smallart.png` : '';
      const avatarHtml = cardUrl ? `<img src="${cardUrl}">` : '👤';
      const cleanRank = (p.current_tier_patched || 'Unranked').toUpperCase();

      html += `
        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">${avatarHtml}</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>
              <span class="search-item-meta">${cleanRank}</span>
            </div>
          </div>
          <div class="search-item-right">
            ${rankImg ? `<img class="search-item-rank-img" src="${rankImg}">` : ''}
            <span class="search-item-region-badge">${p.region}</span>
          </div>
        </div>
      `;
    });
    html += '</div></div>';
  }

  dropdown.innerHTML = html;
  dropdown.classList.add('open');
  attachDropdownClickEvents(dropdown, input, tagInput, regionSelectId);
}

function attachDropdownClickEvents(dropdown, input, tagInput, regionSelectId) {
  dropdown.querySelectorAll('.search-item, .search-rec-chip').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-name');
      const tag = item.getAttribute('data-tag');
      const region = item.getAttribute('data-region');

      input.value = name;
      tagInput.value = tag;
      if (regionSelectId) {
        const regSelect = document.getElementById(regionSelectId);
        if (regSelect) regSelect.value = region;
      }

      dropdown.classList.remove('open');

      if (input.id === 'l-name') {
        landingFetch();
      } else {
        fetchAll();
      }
    });
  });
}

// Intercept select.value assignments to auto-sync custom dropdown text
(function() {
  const originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  if (originalValueDescriptor && originalValueDescriptor.set) {
    Object.defineProperty(HTMLSelectElement.prototype, 'value', {
      get: function() {
        return originalValueDescriptor.get.call(this);
      },
      set: function(val) {
        originalValueDescriptor.set.call(this, val);
        this.dispatchEvent(new CustomEvent('valuechange', { bubbles: true }));
      }
    });
  }
})();

function initCustomDropdowns() {
  const selects = ['region-select', 'mode-select', 'act-select'];
  
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    const parent = select.parentElement; // the .filter-item wrapper
    if (!parent) return;
    
    // Check if already initialized
    if (parent.querySelector('.custom-select-trigger')) return;
    
    // Hide the native select visually but keep it in DOM for event listeners
    select.style.position = 'absolute';
    select.style.opacity = '0';
    select.style.width = '0';
    select.style.height = '0';
    select.style.overflow = 'hidden';
    select.style.pointerEvents = 'none';
    
    // Create custom trigger element
    const trigger = document.createElement('span');
    trigger.className = 'custom-select-trigger';
    
    // Set initial text
    const updateTriggerText = () => {
      const selectedOption = select.options[select.selectedIndex];
      trigger.textContent = selectedOption ? selectedOption.textContent : '';
    };
    updateTriggerText();
    
    // Insert trigger before the select element
    parent.insertBefore(trigger, select);
    
    // Create the custom floating menu
    const menu = document.createElement('div');
    menu.className = 'custom-options-menu';
    
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Function to rebuild options list
    const rebuildOptions = () => {
      menu.innerHTML = '';
      Array.from(select.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'custom-option-item';
        item.textContent = opt.textContent;
        item.dataset.value = opt.value;
        
        if (opt.value === select.value) {
          item.classList.add('selected');
        }
        
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          // Dispatch native 'change' event to notify the application
          select.dispatchEvent(new Event('change'));
          closeMenu();
        });
        
        menu.appendChild(item);
      });
    };
    rebuildOptions();
    parent.appendChild(menu);
    
    const openMenu = () => {
      // Close other menus first
      document.querySelectorAll('.custom-options-menu').forEach(m => {
        if (m !== menu) {
          m.classList.remove('open');
          const otherChevron = m.parentElement.querySelector('.chevron-icon svg');
          if (otherChevron) otherChevron.style.transform = 'rotate(0)';
        }
      });
      
      rebuildOptions(); // Refresh highlight state
      menu.classList.add('open');
      const chevron = parent.querySelector('.chevron-icon svg');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    };
    
    const closeMenu = () => {
      menu.classList.remove('open');
      const chevron = parent.querySelector('.chevron-icon svg');
      if (chevron) chevron.style.transform = 'rotate(0)';
    };
    
    const toggleMenu = (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };
    
    // Bind click listener on parent `.filter-item` container
    parent.style.cursor = 'pointer';
    parent.addEventListener('click', toggleMenu);
    
    // Sync trigger when select value changes
    select.addEventListener('change', updateTriggerText);
    select.addEventListener('valuechange', updateTriggerText);
  });
  
  // Close any menu when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-options-menu').forEach(m => {
      m.classList.remove('open');
      const chevron = m.parentElement.querySelector('.chevron-icon svg');
      if (chevron) chevron.style.transform = 'rotate(0)';
    });
  });
}

function updateHeaderHeights() {
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const rect = topbar.getBoundingClientRect();
    document.documentElement.style.setProperty('--topbar-height', `${rect.height}px`);
  }
  if (typeof cacheSectionOffsets === 'function') {
    cacheSectionOffsets();
  }
}
window.addEventListener('resize', () => {
  updateHeaderHeights();
  const oView = document.getElementById('overlay-view');
  if (oView && oView.style.display !== 'none') {
    updateOverlayPreview();
  }
});

document.addEventListener('DOMContentLoaded', () => { 
  setTimeout(checkUrlParams, 200); 
  setTimeout(initUnifiedScrollManager, 500);
  initSearchAutocomplete('l-name', 'l-tag', 'landing-search-dropdown', 'l-region');
  initSearchAutocomplete('player-name-input', 'player-tag-input', 'topbar-search-dropdown', 'region-select');
  setTimeout(updateHeaderHeights, 100);
  setTimeout(updateHeaderHeights, 500);
  initCustomDropdowns();
});

// ── FEEDBACK SYSTEM ──
function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  modal.style.display = 'flex';
  modal.offsetHeight; // force reflow
  modal.classList.add('open');
  document.getElementById('feedback-text').focus();
  lockBackgroundScroll();
}
function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('feedback-text').value = '';
    document.getElementById('feedback-contact').value = '';
  }, 300);
  unlockBackgroundScroll();
}
async function submitFeedbackForm() {
  const fbText = document.getElementById('feedback-text').value.trim();
  const fbContact = document.getElementById('feedback-contact').value.trim();
  if (!fbText) {
    showToast('Feedback message cannot be empty');
    return;
  }
  
  showToast('Transmitting feedback...');
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feedback: fbText, contact: fbContact })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Transmission complete! Thank you, agent.');
      closeFeedbackModal();
    } else {
      showToast(data.message || 'Transmission failed.');
    }
  } catch (e) {
    showToast('Network error — please check connection');
  }
}