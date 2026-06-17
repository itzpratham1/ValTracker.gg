// ValTracker — Asset Cache (Agents, Maps, Weapons)

import { AGENT_UUIDS, AGENT_ROLES, MAP_IMAGES_FALLBACK } from './constants';

export interface AgentAsset {
  uuid: string;
  iconUrl: string;
  portraitUrl: string;
  role: string;
}

export interface MapAsset {
  uuid: string;
  splashUrl: string | null;
  minimap: string | null;
}

export interface WeaponAsset {
  name: string;
  iconUrl: string;
}

export const assetCache = {
  agents: {} as Record<string, AgentAsset>,
  maps: {} as Record<string, MapAsset>,
  weapons: {} as Record<string, WeaponAsset>,
  ready: false,
};

export async function initAssetCache(): Promise<void> {
  try {
    const [agentRes, mapRes, wpnRes] = await Promise.all([
      fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true'),
      fetch('https://valorant-api.com/v1/maps'),
      fetch('https://valorant-api.com/v1/weapons'),
    ]);
    const [agentData, mapData, weaponData] = await Promise.all([
      agentRes.json(),
      mapRes.json(),
      wpnRes.json(),
    ]);

    // Agents
    for (const a of agentData.data || []) {
      const name = a.displayName;
      const asset: AgentAsset = {
        uuid: a.uuid,
        iconUrl: a.displayIcon,
        portraitUrl: a.fullPortrait || a.fullPortraitV2 || a.displayIcon,
        role: (a.role?.displayName || '').toLowerCase(),
      };
      assetCache.agents[name] = asset;
      assetCache.agents[name.toLowerCase()] = asset;
      if (name.toLowerCase() === 'kay/o') {
        assetCache.agents['kayo'] = asset;
      }
    }

    // Maps
    for (const m of mapData.data || []) {
      if (!m.displayName || m.displayName === 'The Range' || m.displayName === 'Shooting Range') continue;
      const splashUrl = m.splash || m.listViewIcon || m.displayIcon || null;
      const asset: MapAsset = {
        uuid: m.uuid,
        splashUrl,
        minimap: m.displayIcon,
      };
      assetCache.maps[m.displayName] = asset;
      assetCache.maps[m.displayName.toLowerCase()] = asset;
    }

    // Weapons
    for (const w of weaponData.data || []) {
      const asset: WeaponAsset = { name: w.displayName, iconUrl: w.displayIcon };
      assetCache.weapons[w.uuid.toLowerCase()] = asset;
      assetCache.weapons[w.displayName.toLowerCase()] = asset;
    }

    assetCache.ready = true;
  } catch (e) {
    console.warn('[Assets] Cache fetch failed:', (e as Error).message);
    assetCache.ready = false;
  }
}

export function getAgentIconUrl(name: string): string | null {
  if (!name) return null;
  let cleanName = name;
  if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  const cached = assetCache.agents[cleanName] || assetCache.agents[cleanName.toLowerCase()];
  if (cached?.iconUrl) return cached.iconUrl;
  const u = AGENT_UUIDS[cleanName];
  if (u) return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
  return null;
}

export function getAgentPortraitUrl(name: string): string | null {
  if (!name) return null;
  let cleanName = name;
  if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  const cached = assetCache.agents[cleanName] || assetCache.agents[cleanName.toLowerCase()];
  if (cached?.portraitUrl) return cached.portraitUrl;
  const u = AGENT_UUIDS[cleanName];
  if (u) return `https://media.valorant-api.com/agents/${u}/fullportrait.png`;
  return null;
}

export function getRoleClass(agentName: string): string {
  let cleanName = agentName || '';
  if (cleanName.toLowerCase() === 'kayo' || cleanName.toLowerCase() === 'kay/o') {
    cleanName = 'KAY/O';
  }
  const cached = assetCache.agents[cleanName] || assetCache.agents[cleanName.toLowerCase()];
  if (cached?.role) return cached.role;
  return AGENT_ROLES[cleanName.toLowerCase()] || AGENT_ROLES[cleanName] || 'unknown';
}

export function getMapImg(name: string): string | null {
  if (!name) return null;
  const cached = assetCache.maps[name] || assetCache.maps[name.toLowerCase()];
  if (cached?.splashUrl) return cached.splashUrl;
  // Fallback to hardcoded
  const fallback = MAP_IMAGES_FALLBACK[name];
  if (fallback) return fallback;
  return null;
}
