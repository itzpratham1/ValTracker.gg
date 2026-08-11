// ValTracker — App State Store

import { writable, derived } from 'svelte/store';
import { getCurrentActId } from './constants';

/** Active Build Version & Timestamp (embedded at build time) */
export const BUILD_TIMESTAMP = '2026-08-11T20:07:32.000Z';
export const BUILD_VERSION_KEY = 'valtracker_build_version';

/** Keys that represent user settings & saved preferences — MUST BE PRESERVED during cache invalidation */
export const PRESERVED_USER_PREFERENCES = new Set<string>([
  'valtracker_bookmarks',
  'valstats_my_profile',
  'valtracker_recent_searches',
  'valtracker_muted',
  'valtracker_comps',
  'valtracker_tour_completed',
  BUILD_VERSION_KEY
]);

/**
 * Compares stored localStorage build version against active BUILD_TIMESTAMP.
 * If a new build version is detected, purges obsolete data/cache keys while preserving user preferences.
 */
export function purgeObsoleteCacheIfNeeded(): void {
  if (typeof window === 'undefined') return;

  try {
    const storedVersion = localStorage.getItem(BUILD_VERSION_KEY);

    if (storedVersion !== BUILD_TIMESTAMP) {
      console.log(
        `[Build Versioning] New build detected (${storedVersion || 'none'} -> ${BUILD_TIMESTAMP}). Purging obsolete cache keys...`
      );

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !PRESERVED_USER_PREFERENCES.has(key)) {
          keysToRemove.push(key);
        }
      }

      let removedCount = 0;
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          removedCount++;
        } catch {}
      });

      localStorage.setItem(BUILD_VERSION_KEY, BUILD_TIMESTAMP);
      console.log(
        `[Build Versioning] Purged ${removedCount} obsolete cache key(s). Preserved user preferences (${Array.from(PRESERVED_USER_PREFERENCES).join(', ')}).`
      );
    }
  } catch (e) {
    console.warn('[Build Versioning] Failed to execute cache invalidation:', e);
  }
}

// Automatically execute invalidation check on client-side module initialization
if (typeof window !== 'undefined') {
  purgeObsoleteCacheIfNeeded();
}

export interface PlayerState {
  name: string;
  tag: string;
  region: string;
  mode: string;
  act: string;
  loaded: boolean;
  fetching: boolean;
}

export const player = writable<PlayerState>({
  name: '',
  tag: '',
  region: 'ap',
  mode: 'competitive',
  act: getCurrentActId(),
  loaded: false,
  fetching: false
});

export const playerName = derived(player, $p => $p.name);
export const playerTag = derived(player, $p => $p.tag);
export const playerLoaded = derived(player, $p => $p.loaded);
export const isFetching = derived(player, $p => $p.fetching);

export const currentView = writable<string>('tracker');

export function setPlayer(fields: Partial<PlayerState>) {
  player.update(p => ({ ...p, ...fields }));
}

export function startFetch() {
  player.update(p => ({ ...p, fetching: true }));
}

export function endFetch(name: string, tag: string) {
  player.update(p => ({
    ...p,
    name,
    tag,
    fetching: false,
    loaded: true
  }));
}

