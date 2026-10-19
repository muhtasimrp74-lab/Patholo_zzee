import type { KVBackend } from './types.ts';

export class MemoryBackend implements KVBackend {
  readonly name = 'memory';
  readonly data: Map<string, string>;
  constructor(data: Map<string, string> = new Map()) { this.data = data; }
  async get(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  async set(k: string, v: string) { this.data.set(k, v); }
  async remove(k: string) { this.data.delete(k); }
  async keys() { return [...this.data.keys()]; }
}

/** Minimal shape of window.localStorage so tests can inject a fake. */
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; readonly length: number; key(i: number): string | null }

export class LocalStorageBackend implements KVBackend {
  readonly name = 'localStorage';
  private readonly ls: StorageLike;
  constructor(ls: StorageLike) { this.ls = ls; }
  async get(k: string) { return this.ls.getItem(k); }
  async set(k: string, v: string) { this.ls.setItem(k, v); }          // throws on quota/blocked: caller decides
  async remove(k: string) { this.ls.removeItem(k); }
  async keys() { const o: string[] = []; for (let i = 0; i < this.ls.length; i++) { const k = this.ls.key(i); if (k !== null) o.push(k); } return o; }
}

/** IndexedDB key-value store: database `dbName`, object store `store` with out-of-line string keys.
 *  Own database name by default, so it never collides with the legacy `pathviva-annot` / `pathviva-ink` databases. */
export class IndexedDbBackend implements KVBackend {
  readonly name = 'indexedDB';
  private dbp: Promise<IDBDatabase> | null = null;
  private readonly factory: IDBFactory; private readonly dbName: string; private readonly store: string;
  constructor(factory: IDBFactory, dbName = 'zz-kv', store = 'kv') { this.factory = factory; this.dbName = dbName; this.store = store; }
  private db(): Promise<IDBDatabase> {
    return (this.dbp ??= new Promise((res, rej) => {
      const r = this.factory.open(this.dbName, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(this.store)) r.result.createObjectStore(this.store); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
  }
  private async run<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db();
    return new Promise((res, rej) => { const tx = db.transaction(this.store, mode); const rq = f(tx.objectStore(this.store)); tx.oncomplete = () => res(rq.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  }
  async get(k: string) { const v = await this.run('readonly', s => s.get(k)); return typeof v === 'string' ? v : null; }
  async set(k: string, v: string) { await this.run('readwrite', s => s.put(v, k)); }
  async remove(k: string) { await this.run('readwrite', s => s.delete(k)); }
  async keys() { return (await this.run('readonly', s => s.getAllKeys())).map(String); }
}
