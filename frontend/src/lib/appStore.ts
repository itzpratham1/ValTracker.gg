// ValTracker — App State Store

import { writable, derived } from 'svelte/store';

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
  act: 'v26a4',
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
