import { LocalStorageBackend, type StorageLike } from './backends.ts';
import { CODECS } from './codecs.ts';
import { CURRENT_VERSION, VERSION_KEY } from './migrations.ts';
import { ReadOnlyError, Repository } from './repository.ts';
import type { Key, Schema } from './types.ts';

export type ChangeListener = (key: string, value: string | null) => void;

/** Synchronous facade for screens that must read state at boot and save immediately (the legacy app does `S=JSON.parse(...)` and `save()`).
 *  It has the same getItem/setItem/removeItem contract as localStorage and stores exactly the same bytes, so existing data and old builds are unaffected.
 *  - setItem/removeItem throw like localStorage on quota/blocked storage (callers keep their existing try/catch + alert).
 *  - A store stamped by a newer app version is read-only here too (writes throw ReadOnlyError).
 *  - `subscribe` is the extension point for sync/accounts: a remote or IndexedDB mirror hears every write without screens changing.
 *  - `repository` is the async typed view over the same storage (export/import/migrate/typed get). */
export class LocalStateStore {
  readonly repository: Repository;
  private readonly ls: StorageLike;
  private readonly listeners = new Set<ChangeListener>();

  constructor(ls: StorageLike) { this.ls = ls; this.repository = new Repository(new LocalStorageBackend(ls)); }

  get isReadOnly(): boolean {
    let raw: string | null = null; try { raw = this.ls.getItem(VERSION_KEY); } catch { return false; }
    const v = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(v) && v > CURRENT_VERSION;
  }

  getItem(k: string): string | null { return this.ls.getItem(k); }
  setItem(k: string, v: string): void { if (this.isReadOnly) throw new ReadOnlyError(); this.ls.setItem(k, v); this.emit(k, v); }
  removeItem(k: string): void { if (this.isReadOnly) throw new ReadOnlyError(); this.ls.removeItem(k); this.emit(k, null); }

  /** Typed synchronous read with legacy defaults. Never writes. */
  read<K extends Key>(k: K): Schema[K] {
    const d = CODECS[k].decode(this.getItem(k));
    if (d.ok) return d.value;
    const def = CODECS[k].decode(null);
    if (!def.ok) throw new Error('No default for ' + k);
    return def.value;
  }

  subscribe(l: ChangeListener): () => void { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private emit(k: string, v: string | null) { for (const l of this.listeners) { try { l(k, v); } catch { /* a faulty mirror must never break saving */ } } }
}
