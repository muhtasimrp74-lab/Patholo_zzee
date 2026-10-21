import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { sign } from '../src/jwt.ts';
import { deps, hmac } from '../src/auth.ts';
import { fakeD1, fakeR2 } from './fakes.ts';

const SECRET = 'abuse', NOW = Date.now();
const outbox: Record<string, string> = {};
deps.otp = () => ({ async start(p) { outbox[p] = '123456'; return { codeHash: await hmac('m', '123456') }; }, async check(_p, c, h) { return (await hmac('m', c)) === h; } });
const mk = () => { const DB = fakeD1(); return { DB, CHUNKS: fakeR2({ 'chunks/q-02.json': '{}' }), JWT_SECRET: SECRET, ALLOWED_ORIGIN: 'https://x.io' } as never; };
const post = (env: never, path: string, body: unknown, h: Record<string, string> = {}) => worker.fetch(new Request('https://w' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...h } }), env);
let clock = NOW;
deps.now = () => clock;
async function signIn(env: never, dev: string) {
  clock += 6 * 60e3;  // stay under 3 OTP sends per number per 15 min
  await post(env, '/api/auth/otp/start', { phone: '01712345678' }, { 'CF-Connecting-IP': dev });
  return post(env, '/api/auth/otp/verify', { phone: '01712345678', code: '123456', device_id: dev, device_name: 'Phone ' + dev });
}

test('chunk endpoint: 60 requests/min per user, then 429 with Retry-After', async () => {
  const env = mk() as { DB: ReturnType<typeof fakeD1> };
  env.DB.raw.exec(`INSERT INTO users (id, created_at) VALUES ('u1',0); INSERT INTO entitlements (user_id, entitlement, expires_at, source, created_at, updated_at) VALUES ('u1','qna',${NOW + 1e9},'admin',0,0)`);
  const t = await sign({ sub: 'u1', typ: 'access', exp: Math.floor(NOW / 1000) + 900 }, SECRET);
  const get = () => worker.fetch(new Request('https://w/api/chunks/q-02.json', { headers: { Authorization: 'Bearer ' + t } }), env as never);
  const codes: number[] = [];
  for (let i = 0; i < 61; i++) codes.push((await get()).status);
  assert.equal(codes.filter((c) => c === 200).length, 60);
  const r = await get();
  assert.equal(r.status, 429);
  const ra = Number(r.headers.get('Retry-After')); assert.ok(ra >= 1 && ra <= 60);
});

test('3 devices per user; a 4th is refused with a removal token; removing one frees a slot and revokes its sessions', async () => {
  const env = mk();
  const toks: { refresh_token: string; access_token: string }[] = [];
  for (const d of ['device-aaa1', 'device-bbb2', 'device-ccc3']) { const r = await signIn(env, d); assert.equal(r.status, 200, d); toks.push(await r.json() as never); }
  const r4 = await signIn(env, 'device-ddd4');
  assert.equal(r4.status, 409);
  const j = await r4.json() as { devices: { device_id: string }[]; removal_token: string };
  assert.equal(j.devices.length, 3);
  assert.equal((await post(env, '/api/auth/refresh', { refresh_token: toks[0].refresh_token })).status, 200, 'existing devices keep working');
  const del = await worker.fetch(new Request('https://w/api/devices/device-aaa1', { method: 'DELETE', headers: { Authorization: 'Bearer ' + j.removal_token } }), env);
  assert.equal(del.status, 200);
  assert.equal((await signIn(env, 'device-ddd4')).status, 200);
  const list = await (await worker.fetch(new Request('https://w/api/devices', { headers: { Authorization: 'Bearer ' + toks[1].access_token } }), env)).json() as { devices: { device_id: string }[] };
  assert.deepEqual(list.devices.map((d) => d.device_id).sort(), ['device-bbb2', 'device-ccc3', 'device-ddd4']);
  const r5 = await worker.fetch(new Request('https://w/api/devices/device-ddd4', { method: 'DELETE', headers: { Authorization: 'Bearer ' + toks[1].access_token } }), env);
  assert.equal(r5.status, 200, 'remove-device from a signed-in device');
  assert.equal((await worker.fetch(new Request('https://w/api/devices/device-bbb2', { method: 'DELETE', headers: { Authorization: 'Bearer forged.x.y' } }), env)).status, 401);
});
