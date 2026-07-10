// ValTracker — API Client

const API_BASE = (import.meta.env.PUBLIC_API_URL || '') + '/api';

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try { const err = await res.json(); msg = err.message || msg; } catch {}
    throw new Error(msg || `API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchPlayerData(name: string, tag: string, region: string, mode: string) {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  return apiFetch(`/v2/player?name=${encodedName}&tag=${encodedTag}&region=${region}&mode=${mode}`);
}

export async function fetchMmrData(name: string, tag: string, region: string) {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  return apiFetch(`/v2/mmr?name=${encodedName}&tag=${encodedTag}&region=${region}`);
}

export async function fetchAccountData(name: string, tag: string, region: string) {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  return apiFetch(`/v1/account?name=${encodedName}&tag=${encodedTag}&region=${region}`);
}

export async function fetchMatchDetails(matchId: string, region: string) {
  return apiFetch(`/v2/match/${matchId}?region=${region}`);
}

export async function fetchEsportsLive() {
  return apiFetch('/esports/live');
}

export async function fetchEsportsResults() {
  return apiFetch('/esports/results');
}

export async function fetchEsportsUpcoming() {
  return apiFetch('/esports/upcoming');
}

export async function fetchEsportsNews() {
  return apiFetch('/esports/news');
}

export async function fetchEsportsTeamRoster(teamId: string) {
  return apiFetch(`/esports/team-roster/${teamId}`);
}

export async function fetchEsportsStandings(region: string) {
  return apiFetch(`/esports/standings/${region}`);
}

export async function fetchEsportsEvent(eventId: string) {
  return apiFetch(`/esports/event/${eventId}`);
}

export async function fetchStoreFeatured() {
  return apiFetch('/store/featured');
}

export async function fetchMetaComps(map?: string, patch?: string) {
  const params = new URLSearchParams();
  if (map) params.set('map', map);
  if (patch) params.set('patch', patch);
  return apiFetch(`/v3/meta-comps?${params.toString()}`);
}

export async function fetchSearch(query: string) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`);
}

export async function submitFeedback(feedback: string, contact: string) {
  return apiFetch('/feedback', {
    method: 'POST',
    body: JSON.stringify({ feedback, contact }),
  });
}

export async function createShareCard(data: any) {
  return apiFetch('/share-card', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchSharedCard(id: string) {
  return apiFetch(`/share-meta/${id}`);
}

export function buildOverlayUrl(params: {
  name: string;
  tag: string;
  region: string;
  variant?: string;
  accent?: string;
  bg?: string;
  text?: string;
  border?: string;
  scale?: string;
  stats?: string;
}): string {
  const base = `${window.location.origin}/overlay`;
  const searchParams = new URLSearchParams();
  searchParams.set('name', params.name);
  searchParams.set('tag', params.tag);
  searchParams.set('region', params.region);
  if (params.variant) searchParams.set('variant', params.variant);
  if (params.accent) searchParams.set('accent', params.accent);
  if (params.bg) searchParams.set('bg', params.bg);
  if (params.text) searchParams.set('text', params.text);
  if (params.border) searchParams.set('border', params.border);
  if (params.scale && params.scale !== '1') searchParams.set('scale', params.scale);
  if (params.stats) searchParams.set('stats', params.stats);
  return `${base}?${searchParams.toString()}`;
}
