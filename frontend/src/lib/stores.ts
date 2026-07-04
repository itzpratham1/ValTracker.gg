// ValTracker — Svelte Stores for Landing Page State

import { writable, derived } from 'svelte/store';
import { getRankImgUrl } from './constants';

export interface SavedPlayer {
  name: string;
  tag: string;
  region: string;
  mode: string;
  rankName: string;
  rankImg: string | null;
  timestamp: number;
}

const BOOKMARKS_KEY = 'valtracker_bookmarks';
const RECENT_KEY = 'valtracker_recent_searches';

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

// ── Bookmarks Store ──

function createBookmarksStore() {
  const { subscribe, set, update } = writable<SavedPlayer[]>(
    loadFromStorage<SavedPlayer[]>(BOOKMARKS_KEY, [])
  );

  return {
    subscribe,
    add(player: Omit<SavedPlayer, 'rankImg' | 'timestamp'>) {
      update(bookmarks => {
        const exists = bookmarks.some(
          b => b.name.toLowerCase() === player.name.toLowerCase() &&
               b.tag.toLowerCase() === player.tag.toLowerCase()
        );
        if (exists) return bookmarks;
        const updated = [
          { ...player, rankImg: getRankImgUrl(player.rankName), timestamp: Date.now() },
          ...bookmarks
        ];
        saveToStorage(BOOKMARKS_KEY, updated);
        return updated;
      });
    },
    remove(name: string, tag: string) {
      update(bookmarks => {
        const updated = bookmarks.filter(
          b => !(b.name.toLowerCase() === name.toLowerCase() &&
                 b.tag.toLowerCase() === tag.toLowerCase())
        );
        saveToStorage(BOOKMARKS_KEY, updated);
        return updated;
      });
    },
    has(name: string, tag: string): boolean {
      let found = false;
      subscribe(bookmarks => {
        found = bookmarks.some(
          b => b.name.toLowerCase() === name.toLowerCase() &&
               b.tag.toLowerCase() === tag.toLowerCase()
        );
      })();
      return found;
    },
    clear() {
      set([]);
      saveToStorage(BOOKMARKS_KEY, []);
    },
    toggle(player: Omit<SavedPlayer, 'rankImg' | 'timestamp'>) {
      let isBookmarked = false;
      const unsub = subscribe(bookmarks => {
        isBookmarked = bookmarks.some(
          b => b.name.toLowerCase() === player.name.toLowerCase() &&
               b.tag.toLowerCase() === player.tag.toLowerCase()
        );
      });
      unsub();
      if (isBookmarked) {
        update(bookmarks => {
          const updated = bookmarks.filter(
            b => !(b.name.toLowerCase() === player.name.toLowerCase() &&
                   b.tag.toLowerCase() === player.tag.toLowerCase())
          );
          saveToStorage(BOOKMARKS_KEY, updated);
          return updated;
        });
      } else {
        update(bookmarks => {
          const updated = [
            { ...player, rankImg: getRankImgUrl(player.rankName), timestamp: Date.now() },
            ...bookmarks
          ];
          saveToStorage(BOOKMARKS_KEY, updated);
          return updated;
        });
      }
    }
  };
}

export const bookmarks = createBookmarksStore();

// ── Recent Searches Store ──

function createRecentStore() {
  const { subscribe, set, update } = writable<SavedPlayer[]>(
    loadFromStorage<SavedPlayer[]>(RECENT_KEY, [])
  );

  return {
    subscribe,
    add(player: Omit<SavedPlayer, 'rankImg' | 'timestamp'>) {
      update(recent => {
        const filtered = recent.filter(
          r => !(r.name.toLowerCase() === player.name.toLowerCase() &&
                 r.tag.toLowerCase() === player.tag.toLowerCase())
        );
        const updated = [
          { ...player, rankImg: getRankImgUrl(player.rankName), timestamp: Date.now() },
          ...filtered
        ].slice(0, 6);
        saveToStorage(RECENT_KEY, updated);
        return updated;
      });
    },
    clear() {
      set([]);
      saveToStorage(RECENT_KEY, []);
    }
  };
}

export const recentSearches = createRecentStore();

// ── Derived counts ──

export const bookmarksCount = derived(bookmarks, $b => $b.length);
export const recentCount = derived(recentSearches, $r => $r.length);
