import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { checkPassword, hashPassword } from '../src/auth.ts';
import { fakeD1 } from './fakes.ts';

const KEY = 'k'.repeat(40);
let env: { DB: ReturnType<typeof fakeD1> } & Record<string, unknown>;
const kv = (m: Record<string, string>) => ({ async get(k: string) { return k in m ? new Blob([m[k]]).stream() : null; } });
beforeEach(() => { env = { DB: fakeD1(), CHUNKS_KV: kv({ 'chunks/q-02.json': '{"kv":1}' }), JWT_SECRET: 's', ALLOWED_ORIGIN: 'https://a.io, https://b.io', ADMIN_KEY: KEY, PAY_MODE: 'manual' }; });
const call = (path: string, body?: unknown, h: Record<string, string> = {}) => worker.fetch(new Request('https://w' + path, body === undefined ? { headers: h } : { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...h } }), env as never);
const reg = (login: string, password = 'correct horse') => call('/api/auth/register', { login, password, device_id: 'device-0001' });

test('password accounts: register, duplicate, wrong password, case-insensitive email, phone forms', async () => {
  const r = await reg('Ann@Example.com');
  assert.equal(r.status, 200);
  assert.equal(((await r.json()) as { user: { email: string } }).user.email, 'ann@example.com');
  assert.equal((await reg('ann@example.com')).status, 409);
  assert.equal((await call('/api/auth/login', { login: 'ANN@example.com', password: 'wrong pass', device_id: 'device-0001' })).status, 401);
  assert.equal((await call('/api/auth/login', { login: 'ANN@example.com', password: 'correct horse', device_id: 'device-0001' })).status, 200);
  assert.equal((await reg('01712345678')).status, 200);
  assert.equal((await call('/api/auth/login', { login: '+880 1712-345678', password: 'correct horse', device_id: 'device-0001' })).status, 200);
  assert.equal((await reg('x@y.io', 'short')).status, 400);
  assert.equal((await call('/api/auth/login', { login: 'nobody@x.io', password: 'whatever1', device_id: 'device-0001' })).status, 401);
  const h = await hashPassword('pw-12345678');
  assert.match(h, /^pbkdf2\$20000\$/); assert.ok(await checkPassword('pw-12345678', h)); assert.ok(!(await checkPassword('pw-12345679', h)));
});

test('password login is rate limited (10 per login per 15 min) with Retry-After', async () => {
  await reg('r@x.io');
  let last: Response | null = null;
  for (let i = 0; i < 11; i++) last = await call('/api/auth/login', { login: 'r@x.io', password: 'nope-nope', device_id: 'device-0001' });
  assert.equal(last!.status, 429); assert.ok(Number(last!.headers.get('Retry-After')) > 0);
});

test('bKash manual: instructions, TrxID once only, owner approval grants once, masked admin list', async () => {
  const tok = ((await (await reg('buyer@x.io')).json()) as { access_token: string }).access_token, A = { Authorization: 'Bearer ' + tok };
  const co = await (await call('/api/pay/checkout', { bundle: 'ALL' }, A)).json() as { order_id: string; amount: string; manual: { number: string }; redirect_url?: string };
  assert.equal(co.amount, '14000.00'); assert.equal(co.manual.number, '01792529076'); assert.equal(co.redirect_url, undefined);
  assert.equal((await call('/api/pay/manual', { order_id: co.order_id, trx_id: 'bad id!' }, A)).status, 400);
  assert.equal((await call('/api/pay/manual', { order_id: co.order_id, trx_id: 'ab12cd34ef' }, A)).status, 200);
  const co2 = await (await call('/api/pay/checkout', { bundle: 'QNA' }, A)).json() as { order_id: string };
  assert.equal((await call('/api/pay/manual', { order_id: co2.order_id, trx_id: 'AB12CD34EF' }, A)).status, 409, 'same TrxID twice');
  assert.equal((await call('/api/admin/orders')).status, 404, 'no key, no admin');
  assert.equal((await call('/api/admin/orders', undefined, { Authorization: 'Bearer ' + 'x'.repeat(40) })).status, 404);
  const list = await (await call('/api/admin/orders', undefined, { Authorization: 'Bearer ' + KEY })).json() as { orders: { order_id: string; trx_id: string | null }[] };
  assert.deepEqual(list.orders.map((o) => o.trx_id).sort(), [null, 'AB…34EF'].sort() as never);
  assert.equal(JSON.stringify(list).includes('buyer@x.io'), false, 'no personal data');
  assert.equal(((await (await call('/api/admin/orders/' + co2.order_id + '/approve', {}, { Authorization: 'Bearer ' + KEY })).json()) as { error: string }).error, 'no_trx_submitted');
  const ap = await (await call('/api/admin/orders/' + co.order_id + '/approve', {}, { Authorization: 'Bearer ' + KEY })).json();
  assert.deepEqual(ap, { result: 'paid' });
  assert.deepEqual(await (await call('/api/admin/orders/' + co.order_id + '/approve', {}, { Authorization: 'Bearer ' + KEY })).json(), { result: 'duplicate' });
  assert.equal((env.DB.raw.prepare('SELECT COUNT(*) AS n FROM entitlements').get() as { n: number }).n, 3);
  const mine = await (await call('/api/pay/orders', undefined, A)).json() as { orders: { status: string }[] };
  assert.deepEqual(mine.orders.map((o) => o.status).sort(), ['paid', 'pending']);
  assert.deepEqual(await (await call('/api/admin/orders/' + co2.order_id + '/reject', {}, { Authorization: 'Bearer ' + KEY })).json(), { result: 'rejected' });
  const r = await call('/api/chunks/q-02.json', undefined, A);
  assert.equal(r.status, 200); assert.equal(await r.text(), '{"kv":1}', 'chunks served from KV');
  const cors = await call('/api/chunks/q-01.json', undefined, { Origin: 'https://b.io' });
  assert.equal(cors.headers.get('Access-Control-Allow-Origin'), 'https://b.io', 'several site origins allowed');
});
