import type { KVBackend, Schema, Key, StoreExport, MigrationReport } from './types.ts';
import { CODECS, KNOWN_KEYS } from './codecs.ts';
import { MIGRATIONS, CURRENT_VERSION, VERSION_KEY } from './migrations.ts';

export class ReadOnlyError extends Error { constructor() { super('Store was written by a newer version of the app; refusing to write.'); } }

export class Repository {
  private readOnly = false;
  readonly backend: KVBackend;
  constructor(backend: KVBackend) { this.backend = backend; }

  get isReadOnly() { return this.readOnly; }

  /** Typed read. Missing key -> default. Unreadable vivaState -> default, and the raw text is kept in vivaStateCorrupt
   *  (never overwritten if already present) so nothing is lost. Reading never writes anything except that safety copy. */
  async get<K extends Key>(k: K): Promise<Schema[K]> {
    const raw = await this.backend.get(k);
    const r = CODECS[k].decode(raw);
    if (r.ok) return r.value;
    if (k === 'vivaState' && raw !== null && (await this.backend.get('vivaStateCorrupt')) === null && !this.readOnly) await this.backend.set('vivaStateCorrupt', raw);
    const d = CODECS[k].decode(null);
    if (!d.ok) throw new Error('No default for ' + k);
    return d.value;
  }
  async getRaw(k: Key) { return this.backend.get(k); }

  async set<K extends Key>(k: K, v: Schema[K]): Promise<void> {
    if (this.readOnly) throw new ReadOnlyError();
    if (v === null) return this.backend.remove(k);
    await this.backend.set(k, CODECS[k].encode(v));
  }
  /** Read-modify-write helper for the common `S.x = ...; save()` pattern. */
  async update<K extends Key>(k: K, f: (cur: Schema[K]) => Schema[K]): Promise<Schema[K]> { const n = f(await this.get(k)); await this.set(k, n); return n; }
  async remove(k: Key): Promise<void> { if (this.readOnly) throw new ReadOnlyError(); await this.backend.remove(k); }

  /** Known keys currently present in the backend. */
  async list(): Promise<Key[]> { const have = new Set(await this.backend.keys()); return KNOWN_KEYS.filter(k => have.has(k)); }

  /** Apply pending migrations in order. Never deletes or reshapes user keys unless a migration step says so (the v0->v1 step only stamps the version).
   *  A store stamped newer than this build is opened read-only. */
  async migrate(): Promise<MigrationReport> {
    const raw = await this.backend.get(VERSION_KEY);
    const from = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(from) || from < 0) throw new Error('Unreadable store version: ' + raw);
    if (from > CURRENT_VERSION) { this.readOnly = true; return { from, to: from, changedKeys: [], readOnly: true }; }
    const changed = new Set<string>(); let v = from;
    for (const m of MIGRATIONS) if (m.from === v) {
      for (const k of await m.run(this.backend)) changed.add(k);
      v = m.to; await this.backend.set(VERSION_KEY, String(v));
    }
    return { from, to: v, changedKeys: [...changed], readOnly: false };
  }

  /** Whole-store export of known keys as raw strings (lossless). */
  async exportAll(): Promise<StoreExport> {
    const keys: Record<string, string> = {};
    for (const k of await this.list()) { const r = await this.backend.get(k); if (r !== null) keys[k] = r; }
    return { format: 'zz-store', version: CURRENT_VERSION, keys };
  }
  /** Validate first, snapshot vivaState into vivaStatePrev, write, and roll every touched key back if any write fails. */
  async importAll(e: StoreExport, mode: 'replace' | 'merge' = 'merge'): Promise<void> {
    if (this.readOnly) throw new ReadOnlyError();
    if (!e || e.format !== 'zz-store' || typeof e.version !== 'number' || e.version > CURRENT_VERSION || !e.keys || typeof e.keys !== 'object') throw new Error('Not a valid store export.');
    for (const [k, v] of Object.entries(e.keys)) {
      if (!(KNOWN_KEYS as string[]).includes(k) || typeof v !== 'string') throw new Error('Unknown or invalid key in export: ' + k);
      if (!CODECS[k as Key].decode(v).ok) throw new Error('Unreadable value for ' + k);
    }
    const touched = mode === 'replace' ? KNOWN_KEYS.slice() : Object.keys(e.keys) as Key[];
    const before = new Map<string, string | null>(); for (const k of [...touched, 'vivaStatePrev']) before.set(k, await this.backend.get(k));
    try {
      const prev = before.get('vivaState'); if (prev !== null && prev !== undefined) await this.backend.set('vivaStatePrev', prev);
      for (const k of touched) { if (k === 'vivaStatePrev') continue; if (k in e.keys) await this.backend.set(k, e.keys[k]!); else await this.backend.remove(k); }
    } catch (err) {
      for (const [k, v] of before) { if (v === null) await this.backend.remove(k).catch(() => {}); else await this.backend.set(k, v).catch(() => {}); }
      throw err;
    }
  }
}
