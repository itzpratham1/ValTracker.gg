import { writable } from 'svelte/store';

export const latestPatch = writable('');
export const allPatches = writable<string[]>([]);
