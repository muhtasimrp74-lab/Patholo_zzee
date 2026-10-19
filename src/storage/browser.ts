// Entry for the classic-script bundle `zz-store.js` (IIFE). Loaded before the app scripts; exposes window.zzStore.
// If localStorage is blocked this does nothing and the inline shim in index.html (a passthrough to localStorage) takes over,
// so every caller keeps its legacy try/catch behaviour.
import { LocalStateStore } from './sync-store.ts';

declare global { interface Window { zzStore?: LocalStateStore } }

try {
  const store = new LocalStateStore(window.localStorage);
  window.zzStore = store;
  store.repository.migrate().catch(() => { /* never block the app on a migration problem; data stays untouched */ });
} catch { /* storage unavailable: shim takes over */ }
