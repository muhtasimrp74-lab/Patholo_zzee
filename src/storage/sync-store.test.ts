import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LocalStateStore, ReadOnlyError, type StorageLike } from './index.ts';

const FIX = JSON.parse(readFileSync(new URL('../../tools/tests/fixtures/old_user_data.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const rawOf = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

function fakeLs(init: Record<string, string> = {}, opts: { failSet?: boolean } = {}): StorageLike & { m: Map<string, string> } {
  const m = new Map(Object.entries(init));
  return { m, getItem: k => (m.has(k) ? m.get(k)! : null), setItem: (k, v) => { if (opts.failSet) throw new Error('QuotaExceededError'); m.set(k, v); }, removeItem: k => { m.delete(k); }, get length() { return m.size; }, key: i => [...m.keys()][i] ?? null };
}
const seed = () => Object.fromEntries(Object.entries(FIX).map(([k, v]) => [k, rawOf(v)]));

test('getItem returns the exact stored bytes of old-format data', () => {
  const s = new LocalStateStore(fakeLs(seed()));
  for (const [k, v] of Object.entries(seed())) assert.equal(s.getItem(k), v, k);
  assert.equal(s.getItem('missing'), null);
});
test('typed read() applies legacy defaults and does not write', () => {
  const ls = fakeLs(); const s = new LocalStateStore(ls);
  assert.deepEqual(s.read('vivaState').bm, []); assert.equal(s.read('tbLast'), null); assert.equal(ls.m.size, 0);
  const o = new LocalStateStore(fakeLs(seed())); assert.deepEqual(o.read('vivaState').bm, ['q3', 'q25']);
});
test('setItem/removeItem write through and notify subscribers; a faulty subscriber never breaks saving', () => {
  const ls = fakeLs(); const s = new LocalStateStore(ls); const seen: Array<[string, string | null]> = [];
  s.subscribe(() => { throw new Error('bad mirror'); }); const off = s.subscribe((k, v) => seen.push([k, v]));
  s.setItem('tbLast', 'ch02'); s.removeItem('tbLast'); off(); s.setItem('tbLast', 'ch03');
  assert.deepEqual(seen, [['tbLast', 'ch02'], ['tbLast', null]]); assert.equal(ls.m.get('tbLast'), 'ch03');
});
test('quota errors propagate like localStorage so callers keep their try/catch', () => {
  const s = new LocalStateStore(fakeLs({}, { failSet: true })); assert.throws(() => s.setItem('vivaState', '{}'), /Quota/);
});
test('a store stamped by a newer app is read-only but still readable', () => {
  const ls = fakeLs({ ...seed(), zzStoreVersion: '99' }); const s = new LocalStateStore(ls);
  assert.equal(s.isReadOnly, true); assert.throws(() => s.setItem('tbLast', 'x'), ReadOnlyError); assert.throws(() => s.removeItem('tbLast'), ReadOnlyError);
  assert.equal(s.getItem('tbLast'), 'ch01'); assert.equal(ls.m.get('tbLast'), 'ch01');
});
test('repository over the same storage sees facade writes (sync and async views agree)', async () => {
  const s = new LocalStateStore(fakeLs()); s.setItem('zzName', 'Muh');
  assert.equal(await s.repository.get('zzName'), 'Muh');
  await s.repository.set('tbLast', 'ch05'); assert.equal(s.getItem('tbLast'), 'ch05');
});
