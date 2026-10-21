// In-memory stand-ins for D1 (real SQLite via node:sqlite, real migrations) and R2. Test-only.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIG = join(fileURLToPath(import.meta.url), '..', '..', 'migrations');

class Stmt {
  db: DatabaseSync; sql: string; args: unknown[] = [];
  constructor(db: DatabaseSync, sql: string) { this.db = db; this.sql = sql; }
  bind(...a: unknown[]) { const s = new Stmt(this.db, this.sql); s.args = a; return s; }
  async first<T = Record<string, unknown>>(): Promise<T | null> { return (this.db.prepare(this.sql).get(...(this.args as never[])) as T) ?? null; }
  async all<T = Record<string, unknown>>() { return { results: this.db.prepare(this.sql).all(...(this.args as never[])) as T[], success: true }; }
  async run() { const r = this.db.prepare(this.sql).run(...(this.args as never[])); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
  runSync() { return this.db.prepare(this.sql).run(...(this.args as never[])); }
}

export function fakeD1() {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(MIG).filter((x) => x.endsWith('.sql')).sort()) db.exec(readFileSync(join(MIG, f), 'utf8'));
  return {
    raw: db,
    prepare: (sql: string) => new Stmt(db, sql),
    // D1 batch is atomic: all statements commit or none do.
    async batch(stmts: Stmt[]) {
      db.exec('BEGIN');
      try { const out = stmts.map((s) => /^\s*SELECT/i.test(s.sql) ? { success: true, results: s.db.prepare(s.sql).all(...(s.args as never[])) } : { success: true, meta: { changes: Number(s.runSync().changes) } }); db.exec('COMMIT'); return out; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

export function fakeR2(objects: Record<string, string> = {}) {
  const m = new Map(Object.entries(objects));
  return {
    map: m,
    async get(k: string) { const v = m.get(k); return v === undefined ? null : { body: new Blob([v]).stream(), text: async () => v }; },
    async put(k: string, v: string) { m.set(k, v); },
    async delete(k: string) { m.delete(k); },
  };
}
