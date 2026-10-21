import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { sign } from '../src/jwt.ts';
import { fakeD1, fakeR2 } from './fakes.ts';

const SECRET = 'sync';
let env: { DB: ReturnType<typeof fakeD1> } & Record<string, unknown>;
beforeEach(() => { env = { DB: fakeD1(), CHUNKS: fakeR2(), JWT_SECRET: SECRET, ALLOWED_ORIGIN: 'https://x.io' }; env.DB.raw.exec(`INSERT INTO users (id, created_at) VALUES ('u1',0)`); });
const tok = () => sign({ sub: 'u1', sid: 'f', typ: 'access', exp: Math.floor(Date.now() / 1000) + 900 }, SECRET);
const up = async (upload_id: string, items: unknown[]) => worker.fetch(new Request('https://w/api/sync/upload', { method: 'POST', body: JSON.stringify({ upload_id, items }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tok() } }), env as never);
const pull = async () => ((await (await worker.fetch(new Request('https://w/api/sync', { headers: { Authorization: 'Bearer ' + await tok() } }), env as never)).json()) as { items: { kind: string; key: string; value: string; conflict: number }[] }).items;

test('upload is idempotent: a retried upload_id changes nothing and returns the first result', async () => {
  const items = [{ kind: 'note', key: 'q7', value: 'local', updated_at: 5 }, { kind: 'progress', key: 'vivaState/done', value: '[1]', updated_at: 5 }];
  const a = await (await up('upload-0001', items)).json();
  env.DB.raw.exec(`UPDATE user_notes SET value = 'edited on phone' WHERE key = 'q7'`);
  const b = await (await up('upload-0001', items)).json() as { replay: boolean };
  assert.equal(b.replay, true);
  assert.deepEqual({ ...b, replay: undefined }, { ...(a as object), replay: undefined });
  assert.equal((await pull()).filter((i) => i.kind === 'note').length, 1, 'no conflict copy from a replay');
  const [r1, r2] = await Promise.all([up('upload-0002', items), up('upload-0002', items)]);
  assert.deepEqual([r1.status, r2.status], [200, 200]);
});

test('progress and annotations: last write wins per key by timestamp', async () => {
  await up('upload-a001', [{ kind: 'progress', key: 'tbDone', value: 'new', updated_at: 200 }, { kind: 'annotation', key: 'meta/x', value: 'A', updated_at: 100 }]);
  await up('upload-a002', [{ kind: 'progress', key: 'tbDone', value: 'old', updated_at: 100 }, { kind: 'annotation', key: 'meta/x', value: 'B', updated_at: 300 }]);
  const m = Object.fromEntries((await pull()).map((i) => [i.key, i.value]));
  assert.equal(m.tbDone, 'new');
  assert.equal(m['meta/x'], 'B');
});

test('notes: on conflict both are kept and the cloud copy is flagged', async () => {
  await up('upload-n001', [{ kind: 'note', key: 'doc/q7', value: 'cloud text', updated_at: 100 }]);
  const r = await (await up('upload-n002', [{ kind: 'note', key: 'doc/q7', value: 'local text', updated_at: 50 }, { kind: 'note', key: 'doc/q8', value: 'same', updated_at: 1 }])).json() as { conflicts: number };
  assert.equal(r.conflicts, 1);
  const notes = (await pull()).filter((i) => i.kind === 'note' && i.key.startsWith('doc/q7'));
  assert.equal(notes.length, 2);
  assert.deepEqual(notes.find((n) => n.key === 'doc/q7')!.value, 'local text');
  const copy = notes.find((n) => n.key !== 'doc/q7')!;
  assert.equal(copy.value, 'cloud text'); assert.equal(copy.conflict, 1); assert.match(copy.key, /^doc\/q7#conflict-/);
  await up('upload-n003', [{ kind: 'note', key: 'doc/q8', value: 'same', updated_at: 9 }]);
  assert.equal((await pull()).filter((i) => i.key.startsWith('doc/q8')).length, 1, 'identical note is not a conflict');
});

test('limits and auth', async () => {
  assert.equal((await up('upload-big1', Array.from({ length: 21 }, (_, i) => ({ kind: 'progress', key: 'k' + i, value: 'v', updated_at: 1 })))).status, 400);
  assert.equal((await up('bad id!', [])).status, 400);
  assert.equal((await up('upload-x001', [{ kind: 'secret', key: 'k', value: 'v', updated_at: 1 }])).status, 400);
  assert.equal((await worker.fetch(new Request('https://w/api/sync'), env as never)).status, 401);
});
