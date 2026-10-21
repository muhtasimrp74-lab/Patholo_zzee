// Runs the exact SQL from docs/admin.md against the real migrations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakeD1 } from './fakes.ts';

const md = readFileSync(join(fileURLToPath(import.meta.url), '..', '..', '..', 'docs', 'admin.md'), 'utf8');
const cmds = [...md.matchAll(/^npx wrangler d1 execute patholo-zzee-staging --remote --command "(.+)"$/gm)].map((m) => m[1]);
const fill = (s: string, v: Record<string, string>) => s.replace(/\b(USER_ID|ENTITLEMENT|NOTE|ORDER_ID|EMAIL|PHONE)\b/g, (k) => v[k]);

test('docs/admin.md has 4 working commands', () => {
  assert.equal(cmds.length, 4);
  const db = fakeD1().raw;
  db.exec(`INSERT INTO users (id, display_name, email, phone, created_at) VALUES ('u1','A','a@x.io','+8801712345678',0)`);
  db.exec(`INSERT INTO payment_orders (order_id, user_id, bundle, amount_minor, currency, status, created_at, updated_at) VALUES ('o1','u1','QNA',50000,'BDT','paid',1,1)`);
  const v = { USER_ID: 'u1', ENTITLEMENT: 'qna', NOTE: 'support ticket 7', ORDER_ID: 'o1', EMAIL: 'A@X.io', PHONE: '+8801712345678' };
  const ent = () => db.prepare(`SELECT expires_at, source, note FROM entitlements WHERE user_id='u1'`).get() as { expires_at: number; source: string; note: string };
  db.exec(fill(cmds[0], v));
  const g = ent(); assert.equal(g.source, 'admin'); assert.ok(g.expires_at > Date.now() + 364 * 86400e3);
  db.exec(fill(cmds[0], v));
  assert.ok(ent().expires_at > g.expires_at + 364 * 86400e3, 'granting again extends');
  db.exec(fill(cmds[1], v));
  const r = ent(); assert.ok(r.expires_at <= Date.now()); assert.equal(r.note, 'refund o1');
  assert.deepEqual((db.prepare(fill(cmds[2], v)).all() as { id: string }[]).map((x) => x.id), ['u1']);
  assert.deepEqual((db.prepare(fill(cmds[2], { ...v, EMAIL: 'none@x.io' })).all() as { id: string }[]).map((x) => x.id), ['u1'], 'phone match');
  assert.equal((db.prepare(fill(cmds[3], v)).all() as { order_id: string }[])[0].order_id, 'o1');
});
