// ValTracker — IndexedDB Match Store

const DB_NAME = 'ValStatsDB';
const DB_VERSION = 1;
const STORE_NAME = 'matches';

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'matchId' });
        store.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = (e: any) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export function normalizeMode(rawMode: string): string {
  if (!rawMode) return '';
  const m = rawMode.toLowerCase().replace(/ /g, '').replace(/-/g, '').replace(/_/g, '');
  if (m === 'teamdm') return 'teamdeathmatch';
  return m;
}

export async function saveMatches(matches: any[], playerName: string, playerTag: string, currentMode: string): Promise<number> {
  const db = await openDB();

  const existingMap: Record<string, any> = {};
  try {
    const txRead = db.transaction(STORE_NAME, 'readonly');
    const storeRead = txRead.objectStore(STORE_NAME);
    const all = await new Promise<any[]>((res) => {
      const req = storeRead.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });
    all.forEach((r: any) => { existingMap[r.matchId] = r.data; });
  } catch {}

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let saved = 0;
    matches.forEach(m => {
      const id = m.metadata?.matchid || m.metadata?.match_id;
      if (!id) return;

      const actualMode = normalizeMode(m.metadata?.mode || m.metadata?.queue || currentMode || 'competitive');
      const storeKey = `${playerName.toLowerCase()}#${playerTag.toLowerCase()}|${actualMode}|${id}`;

      const existing = existingMap[storeKey];
      const newHasDetails = m.rounds && m.rounds.length > 0 && m.rounds[0].player_stats && m.rounds[0].player_stats.length > 0;
      const existingHasDetails = existing && existing.rounds && existing.rounds.length > 0 && existing.rounds[0].player_stats;

      if (existingHasDetails && !newHasDetails) return;

      store.put({ matchId: storeKey, date: m.metadata?.game_start || Date.now(), data: m });
      saved++;
    });
    tx.oncomplete = () => resolve(saved);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadAllMatches(playerName: string, playerTag: string, currentMode: string): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    let req: IDBRequest;
    if (store.indexNames.contains('date')) {
      req = store.index('date').getAll();
    } else {
      req = store.getAll();
    }
    req.onsuccess = () => {
      const activeModeNormalized = normalizeMode(currentMode);
      const prefix = `${playerName.toLowerCase()}#${playerTag.toLowerCase()}|${activeModeNormalized}|`;

      const all = (req.result || []).filter((r: any) => {
        if (!r.matchId) return false;
        const matchIdLower = r.matchId.toLowerCase();
        if (!matchIdLower.startsWith(prefix)) return false;
        const mMode = r.data?.metadata?.mode || r.data?.metadata?.queue;
        return normalizeMode(mMode) === activeModeNormalized;
      });

      const records = all.sort((a: any, b: any) => (b.date || 0) - (a.date || 0)).slice(0, 50);
      resolve(records.map((r: any) => r.data));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllMatches(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPlayerMatches(playerName: string, playerTag: string, currentMode: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const activeModeNormalized = normalizeMode(currentMode);
    const prefix = `${playerName.toLowerCase()}#${playerTag.toLowerCase()}|${activeModeNormalized}|`;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e: any) => {
      const cursor = e.target.result as IDBCursorWithValue;
      if (cursor) {
        if (cursor.key && (cursor.key as string).toLowerCase().startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMatchCount(): Promise<number> {
  const db = await openDB();
  return new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}
