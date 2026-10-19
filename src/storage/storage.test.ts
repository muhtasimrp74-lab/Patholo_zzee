import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MemoryBackend, LocalStorageBackend, Repository, ReadOnlyError, validateBackup, type KVBackend, type StorageLike } from './index.ts';

const FIX = JSON.parse(readFileSync(new URL('../../tools/tests/fixtures/old_user_data.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const rawOf = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));
function seeded() { const m = new MemoryBackend(); for (const [k, v] of Object.entries(FIX)) m.data.set(k, rawOf(v)); return m; }

test('old-format data reads unchanged through the repository', async () => {
  const r = new Repository(seeded());
  const s = await r.get('vivaState');
  assert.deepEqual(s.bm, ['q3', 'q25']); assert.equal(s.notes['q3'], 'fixture note: BP thresholds'); assert.deepEqual(s.learned, ['q10']);
  assert.deepEqual(await r.get('tbDone'), FIX['tbDone']); assert.deepEqual(await r.get('tbPos'), FIX['tbPos']);
  assert.equal(await r.get('tbLast'), 'ch01'); assert.equal(await r.get('zzName'), 'Fixture'); assert.equal(await r.get('vivaQuiz'), '');
});

test('migrate() from v0 stamps the version and leaves every stored byte untouched', async () => {
  const m = seeded(); const before = new Map(m.data); const r = new Repository(m);
  const rep = await r.migrate();
  assert.deepEqual([rep.from, rep.to, rep.changedKeys, rep.readOnly], [0, 1, [], false]);
  for (const [k, v] of before) assert.equal(m.data.get(k), v, k);
  assert.equal(m.data.get('zzStoreVersion'), '1');
  assert.deepEqual(await r.migrate(), { from: 1, to: 1, changedKeys: [], readOnly: false });   // idempotent
});

test('missing data yields legacy defaults and reading writes nothing', async () => {
  const m = new MemoryBackend(); const r = new Repository(m); const s = await r.get('vivaState');
  assert.deepEqual(s, { fav: [], bm: [], notes: {}, learned: [], sr: {}, streak: { n: 0, last: '' }, recent: [], pref: {} });
  assert.equal(await r.get('tbLast'), null); assert.equal(m.data.size, 0);
});

test('unknown fields in vivaState survive an update (forward compatibility)', async () => {
  const m = new MemoryBackend(); m.data.set('vivaState', JSON.stringify({ bm: ['q1'], futureThing: { a: 1 } }));
  const r = new Repository(m); await r.update('vivaState', s => ({ ...s, bm: [...s.bm, 'q2'] }));
  const out = JSON.parse(m.data.get('vivaState')!); assert.deepEqual(out.bm, ['q1', 'q2']); assert.deepEqual(out.futureThing, { a: 1 });
});

test('unreadable vivaState is kept in vivaStateCorrupt and never overwritten by a read; first copy wins', async () => {
  const m = new MemoryBackend(); m.data.set('vivaState', '{not json'); const r = new Repository(m);
  assert.equal((await r.get('vivaState')).bm.length, 0);
  assert.equal(m.data.get('vivaState'), '{not json'); assert.equal(m.data.get('vivaStateCorrupt'), '{not json');
  m.data.set('vivaState', '[1,2'); await r.get('vivaState'); assert.equal(m.data.get('vivaStateCorrupt'), '{not json');
});

test('a store stamped by a newer app opens read-only', async () => {
  const m = seeded(); m.data.set('zzStoreVersion', '99'); const r = new Repository(m);
  assert.equal((await r.migrate()).readOnly, true);
  await assert.rejects(() => r.set('tbLast', 'ch02'), ReadOnlyError); assert.equal(m.data.get('tbLast'), 'ch01');
});

test('set(null) removes; list() reports known keys only', async () => {
  const m = seeded(); m.data.set('somethingElse', 'x'); const r = new Repository(m);
  await r.set('tbLast', null); const l = await r.list(); assert.ok(!l.includes('tbLast')); assert.ok(l.includes('vivaState')); assert.ok(!(l as string[]).includes('somethingElse'));
});

test('export then import into an empty store reproduces every raw value', async () => {
  const a = new Repository(seeded()); const e = await a.exportAll(); const m = new MemoryBackend(); const b = new Repository(m);
  await b.importAll(e, 'replace');
  for (const [k, v] of Object.entries(e.keys)) assert.equal(m.data.get(k), v, k);
});

test('import keeps the previous vivaState in vivaStatePrev', async () => {
  const m = seeded(); const old = m.data.get('vivaState')!; const r = new Repository(m);
  await r.importAll({ format: 'zz-store', version: 1, keys: { vivaState: JSON.stringify({ bm: ['q9'] }) } });
  assert.equal(m.data.get('vivaStatePrev'), old); assert.deepEqual(JSON.parse(m.data.get('vivaState')!).bm, ['q9']);
});

test('invalid imports are rejected and change nothing', async () => {
  const m = seeded(); const snap = new Map(m.data); const r = new Repository(m);
  for (const bad of [null, { format: 'x', version: 1, keys: {} }, { format: 'zz-store', version: 2, keys: {} }, { format: 'zz-store', version: 1, keys: { evil: 'x' } },
    { format: 'zz-store', version: 1, keys: { vivaState: '{nope' } }, { format: 'zz-store', version: 1, keys: { tbDone: 5 } }]) {
    await assert.rejects(() => r.importAll(bad as never));
    assert.deepEqual([...m.data], [...snap]);
  }
});

test('a failing write during import rolls every touched key back', async () => {
  const m = seeded(); const snap = new Map(m.data); let n = 0;
  const flaky: KVBackend = { name: 'flaky', get: k => m.get(k), remove: k => m.remove(k), keys: () => m.keys(), set: async (k, v) => { if (++n === 3) throw new Error('quota'); await m.set(k, v); } };
  const r = new Repository(flaky);
  await assert.rejects(() => r.importAll({ format: 'zz-store', version: 1, keys: { vivaState: JSON.stringify({ bm: ['z'] }), tbLast: 'ch09', zzName: 'New' } }), /quota/);
  assert.deepEqual([...m.data].sort(), [...snap].sort());
});

test('LocalStorageBackend works against a localStorage-shaped object', async () => {
  const d = new Map<string, string>();
  const ls: StorageLike = { getItem: k => d.get(k) ?? null, setItem: (k, v) => { d.set(k, v); }, removeItem: k => { d.delete(k); }, get length() { return d.size; }, key: i => [...d.keys()][i] ?? null };
  const b = new LocalStorageBackend(ls); await b.set('a', '1'); assert.equal(await b.get('a'), '1'); assert.deepEqual(await b.keys(), ['a']); await b.remove('a'); assert.equal(await b.get('a'), null);
});

test('validateBackup matches the legacy vbk() rules', () => {
  assert.equal(validateBackup(null), null); assert.equal(validateBackup({}), null); assert.equal(validateBackup({ bm: 'x' }), null);
  assert.equal(validateBackup({ bm: [1] }), null); assert.equal(validateBackup({ bm: ['q'.repeat(41)] }), null);
  assert.deepEqual(validateBackup({ bm: ['q1'], evil: 1 }), { bm: ['q1'] });
  assert.equal(validateBackup({ bm: [], notes: { q1: 5 } }), null); assert.equal(validateBackup({ bm: [], streak: { n: 'x', last: '' } }), null);
  assert.equal(validateBackup({ bm: [], mcq: { p: [] } }), null); assert.equal(validateBackup({ bm: [], mcq: { bm: {} } }), null);
  const ok = { bm: ['q1'], fav: ['q2'], learned: [], notes: { q1: 'n' }, sr: {}, pref: {}, streak: { n: 1, last: 'd' }, recent: [], mcq: { p: {}, bm: [] } };
  assert.deepEqual(validateBackup(ok), ok);
  assert.equal(validateBackup({ bm: new Array(20001).fill('q') }), null);
});
