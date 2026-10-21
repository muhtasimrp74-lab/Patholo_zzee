import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { sign } from '../src/jwt.ts';
import { payDeps, type Validation } from '../src/pay.ts';
import { fakeD1, fakeR2 } from './fakes.ts';

const SECRET = 'pay-secret', DAY = 86400e3;
let env: { DB: ReturnType<typeof fakeD1> } & Record<string, unknown>, now = Date.now();
const vals = new Map<string, Validation>(), byOrder = new Map<string, Validation>();
let goodSign = true;
payDeps.now = () => now;
payDeps.gateway = () => ({
  async init(o) { return 'https://sandbox.example/pay/' + o.order_id + '?amt=' + o.amount; },
  async validate(id) { return vals.get(id) ?? null; },
  async query(id) { return byOrder.get(id) ?? null; },
  async verifySign() { return goodSign; },
});
beforeEach(() => {
  now = Date.now(); vals.clear(); byOrder.clear(); goodSign = true;
  env = { DB: fakeD1(), CHUNKS: fakeR2(), JWT_SECRET: SECRET, ALLOWED_ORIGIN: 'https://x.github.io', APP_URL: 'https://app.example/' };
  env.DB.raw.exec(`INSERT INTO users (id, display_name, email, created_at) VALUES ('u1','A','a@x.io',0),('u2','B','b@x.io',0)`);
});
const tok = (sub: string) => sign({ sub, sid: 'f', typ: 'access', exp: Math.floor(Date.now() / 1000) + 900 }, SECRET);
const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request('https://w.example' + path, init), env as never);
async function buy(user = 'u1', bundle = 'ALL', extra = {}) {
  const r = await call('/api/pay/checkout', { method: 'POST', body: JSON.stringify({ bundle, ...extra }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tok(user) } });
  return { status: r.status, j: await r.json() as { order_id: string; redirect_url: string; amount: string } };
}
const ipn = (val_id: string, tran_id: string) => call('/api/pay/ipn', { method: 'POST', body: new URLSearchParams({ val_id, tran_id, status: 'VALID', verify_sign: 'x', verify_key: 'val_id' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
const paid = (order: string, val: string, amount = '1200.00', status = 'VALID'): Validation => { const v = { status, tran_id: order, amount, currency: 'BDT', val_id: val }; vals.set(val, v); return v; };
const ents = (u = 'u1') => env.DB.raw.prepare('SELECT entitlement, expires_at, source, note FROM entitlements WHERE user_id = ? ORDER BY entitlement').all(u) as { entitlement: string; expires_at: number; note: string }[];
const count = (t: string) => (env.DB.raw.prepare('SELECT COUNT(*) AS n FROM ' + t).get() as { n: number }).n;
const getOrder = async (id: string, user = 'u1') => call('/api/pay/orders/' + id, { headers: { Authorization: 'Bearer ' + await tok(user) } });

test('checkout: auth required, server-side price, unknown bundle rejected', async () => {
  assert.equal((await call('/api/pay/checkout', { method: 'POST', body: '{"bundle":"ALL"}', headers: { 'Content-Type': 'application/json' } })).status, 401);
  assert.equal((await buy('u1', 'GOLD')).status, 400);
  const { status, j } = await buy('u1', 'ALL', { amount: 1, price: 1 });
  assert.equal(status, 200);
  assert.equal(j.amount, '1200.00');
  assert.match(j.redirect_url, /amt=1200\.00$/);
});

test('verified IPN grants once; duplicate callbacks (sequential and concurrent) never grant twice', async () => {
  const { j } = await buy();
  paid(j.order_id, 'V1');
  assert.deepEqual(await (await ipn('V1', j.order_id)).json(), { result: 'paid' });
  const e1 = ents();
  assert.deepEqual(e1.map((e) => e.entitlement), ['mcq', 'qna', 'textbook']);
  assert.ok(e1.every((e) => Math.abs(e.expires_at - (now + 365 * DAY)) < 5 && e.note === j.order_id));
  now += 1000;
  assert.deepEqual(await (await ipn('V1', j.order_id)).json(), { result: 'duplicate' });
  paid(j.order_id, 'V1b');
  assert.deepEqual(await (await ipn('V1b', j.order_id)).json(), { result: 'duplicate' });
  assert.deepEqual(ents(), e1);
  assert.equal(count('receipts'), 1);
  const { j: j2 } = await buy('u2', 'QNA');
  paid(j2.order_id, 'V2', '500.00');
  const rs = await Promise.all([ipn('V2', j2.order_id), ipn('V2', j2.order_id), ipn('V2', j2.order_id)]);
  const results = (await Promise.all(rs.map((r) => r.json()))).map((x) => (x as { result: string }).result).sort();
  assert.deepEqual(results, ['duplicate', 'duplicate', 'paid']);
  assert.equal(ents('u2').length, 1);
  assert.equal(count('receipts'), 2);
});

test('no grant without server verification: bad signature, wrong amount/currency, mismatched order, failed status', async () => {
  const { j } = await buy();
  paid(j.order_id, 'V1');
  goodSign = false;
  assert.equal((await ipn('V1', j.order_id)).status, 400);
  goodSign = true;
  assert.equal((await ipn('V1', 'other-order')).status, 400);
  paid(j.order_id, 'V2', '12.00');
  assert.deepEqual(await (await ipn('V2', j.order_id)).json(), { result: 'mismatch' });
  vals.set('V3', { status: 'VALID', tran_id: j.order_id, amount: '1200.00', currency: 'USD', val_id: 'V3' });
  assert.deepEqual(await (await ipn('V3', j.order_id)).json(), { result: 'mismatch' });
  paid(j.order_id, 'V4', '1200.00', 'FAILED');
  assert.deepEqual(await (await ipn('V4', j.order_id)).json(), { result: 'failed' });
  assert.equal((await ipn('NOPE', j.order_id)).status, 400, 'unknown val_id');
  assert.equal(ents().length, 0);
  assert.equal(count('receipts'), 0);
});

test('browser return re-verifies, then redirects to the order page; receipt viewable by owner only', async () => {
  const { j } = await buy('u1', 'MCQ');
  paid(j.order_id, 'V9', '500.00');
  const r = await call('/api/pay/return?order_id=' + j.order_id, { method: 'POST', body: new URLSearchParams({ val_id: 'V9', tran_id: j.order_id }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('Location'), 'https://app.example/#/account/order/' + j.order_id);
  const o = await (await getOrder(j.order_id)).json() as { order: { status: string }; receipt: { receipt_no: string; amount_minor: number } };
  assert.equal(o.order.status, 'paid');
  assert.match(o.receipt.receipt_no, /^R\d{7}$/);
  assert.equal(o.receipt.amount_minor, 50000);
  assert.equal((await getOrder(j.order_id, 'u2')).status, 404);
});

test('pending resolves automatically: late confirmation via gateway query; abandoned order is cancelled, no grant', async () => {
  const { j } = await buy('u1', 'TEXTBOOK');
  assert.equal(((await (await getOrder(j.order_id)).json()) as { order: { status: string } }).order.status, 'pending');
  byOrder.set(j.order_id, paid(j.order_id, 'VL', '500.00'));
  assert.equal(((await (await getOrder(j.order_id)).json()) as { order: { status: string } }).order.status, 'paid');
  assert.deepEqual(ents().map((e) => e.entitlement), ['textbook']);
  const { j: a } = await buy('u2', 'QNA');
  now += 3 * 3600e3;
  assert.equal(((await (await getOrder(a.order_id, 'u2')).json()) as { order: { status: string } }).order.status, 'cancelled');
  assert.equal(ents('u2').length, 0);
  byOrder.set(a.order_id, paid(a.order_id, 'VLate', '500.00'));
  assert.deepEqual(await (await ipn('VLate', a.order_id)).json(), { result: 'paid' }, 'money taken after cancel still grants');
  assert.equal(ents('u2').length, 1);
});

test('renewal extends from the current expiry', async () => {
  const { j } = await buy('u1', 'QNA');
  paid(j.order_id, 'R1', '500.00'); await ipn('R1', j.order_id);
  const first = ents()[0].expires_at;
  now += 100 * DAY;
  const { j: j2 } = await buy('u1', 'QNA');
  paid(j2.order_id, 'R2', '500.00'); await ipn('R2', j2.order_id);
  assert.equal(ents()[0].expires_at, first + 365 * DAY);
});

test('public bundle list comes from the server config', async () => {
  const j = await (await call('/api/bundles')).json() as { bundles: { id: string; price: string; currency: string }[] };
  assert.deepEqual(j.bundles.map((b) => b.id), ['QNA', 'MCQ', 'TEXTBOOK', 'ALL']);
  assert.equal(j.bundles[3].price, '1200.00');
});
