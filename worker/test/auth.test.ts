import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { deps, hmac, normalizePhone } from '../src/auth.ts';
import { sign } from '../src/jwt.ts';
import { fakeD1, fakeR2 } from './fakes.ts';

const CLIENT = 'cid.apps.googleusercontent.com';
const enc = new TextEncoder();
const b64u = (b: Uint8Array) => Buffer.from(b).toString('base64url');
const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey) as JsonWebKey), kid: 'k1' } as JsonWebKey;
deps.fetchJwks = async () => ({ keys: [jwk] });
async function gtoken(o: Record<string, unknown> = {}, key = kp.privateKey) {
  const h = b64u(enc.encode(JSON.stringify({ alg: 'RS256', kid: 'k1' })));
  const b = b64u(enc.encode(JSON.stringify({ iss: 'https://accounts.google.com', aud: CLIENT, sub: 'g1', email: 'A@Example.com', email_verified: true, name: 'Ann', exp: Math.floor(Date.now() / 1000) + 600, ...o })));
  return h + '.' + b + '.' + b64u(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(h + '.' + b))));
}
const outbox: Record<string, string> = {};
deps.otp = () => ({
  async start(phone) { const code = String(100000 + Math.floor(Math.random() * 900000)); outbox[phone] = code; return { codeHash: await hmac('m', code) }; },
  async check(_p, code, h) { return !!h && (await hmac('m', code)) === h; },
});
let env: never, now = Date.now();
deps.now = () => now;
beforeEach(() => { now = Date.now(); env = { DB: fakeD1(), CHUNKS: fakeR2(), JWT_SECRET: 's' + Math.random(), ALLOWED_ORIGIN: 'https://x.github.io', GOOGLE_CLIENT_ID: CLIENT } as never; });
const post = (path: string, body: unknown, h: Record<string, string> = {}) =>
  worker.fetch(new Request('https://w.example' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...h } }), env);
const meWith = (t: string) => worker.fetch(new Request('https://w.example/api/me', { headers: { Authorization: 'Bearer ' + t } }), env);
const DEV = 'device-0001';

test('phone numbers normalise to E.164 (+880), any digit script', () => {
  for (const p of ['01712345678', '+880 1712-345678', '8801712345678', '1712345678', '০১৭১২৩৪৫৬৭৮', '00880 1712 345678']) assert.equal(normalizePhone(p), '+8801712345678', p);
  assert.equal(normalizePhone('+14155552671'), '+14155552671');
  for (const p of ['+88012345', '0123', 'abc', '+8801212345678', '']) assert.equal(normalizePhone(p), null, p);
});

test('Google sign-in: valid token signs in; forged, wrong audience, expired or unverified are rejected', async () => {
  const r = await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV });
  assert.equal(r.status, 200);
  const j = await r.json() as { access_token: string; refresh_token: string; user: { email: string } };
  assert.equal(j.user.email, 'a@example.com');
  assert.equal((await meWith(j.access_token)).status, 200);
  const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign']) as CryptoKeyPair;
  for (const t of [await gtoken({}, other.privateKey), await gtoken({ aud: 'other' }), await gtoken({ exp: 1 }), await gtoken({ email_verified: false }), 'x.y.z'])
    assert.equal((await post('/api/auth/google', { id_token: t, device_id: DEV })).status, 401);
  const again = await (await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV })).json() as { user: { id: string } };
  assert.equal(again.user.id, (j.user as unknown as { id: string }).id, 'same account on second sign-in');
});

test('Google sign-in never takes over a password account that claims the same email', async () => {
  assert.equal((await post('/api/auth/register', { login: 'a@example.com', password: 'squatter pass', device_id: DEV })).status, 200);
  const r = await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV });
  assert.equal(r.status, 409); assert.equal(((await r.json()) as { error: string }).error, 'use_password');
});

test('access tokens: forged or expired are rejected', async () => {
  const j = await (await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV })).json() as { access_token: string };
  const [h, b] = j.access_token.split('.');
  assert.equal((await meWith(h + '.' + b + '.AAAA')).status, 401);
  const S = Math.floor(Date.now() / 1000), secret = (env as unknown as { JWT_SECRET: string }).JWT_SECRET;
  assert.equal((await meWith(await sign({ sub: 'x', sid: 'f', typ: 'access', exp: S - 1 }, secret))).status, 401, 'expired');
  assert.equal((await meWith(await sign({ sub: 'x', sid: 'f', typ: 'access', exp: S + 60 }, 'other'))).status, 401, 'wrong key');
});

test('OTP: right code signs in once; wrong code, reuse and >5 attempts fail', async () => {
  const ph = '01812345678';
  assert.equal((await post('/api/auth/otp/start', { phone: ph })).status, 200);
  const code = outbox['+8801812345678'];
  assert.equal((await post('/api/auth/otp/verify', { phone: ph, code: '000000', device_id: DEV })).status, 401);
  const ok = await post('/api/auth/otp/verify', { phone: '+8801812345678', code, device_id: DEV });
  assert.equal(ok.status, 200);
  assert.equal(((await ok.json()) as { user: { phone: string } }).user.phone, '+8801812345678');
  assert.equal((await post('/api/auth/otp/verify', { phone: ph, code, device_id: DEV })).status, 401, 'single use');
  await post('/api/auth/otp/start', { phone: ph });
  const c2 = outbox['+8801812345678'];
  for (let i = 0; i < 5; i++) assert.equal((await post('/api/auth/otp/verify', { phone: ph, code: '111111', device_id: DEV })).status, 401);
  const blocked = await post('/api/auth/otp/verify', { phone: ph, code: c2, device_id: DEV });
  assert.equal(blocked.status, 429, 'attempt limit holds even for the right code');
  now += 11 * 60e3;
  await post('/api/auth/otp/start', { phone: ph });
  now += 11 * 60e3;
  assert.equal((await post('/api/auth/otp/verify', { phone: ph, code: outbox['+8801812345678'], device_id: DEV })).status, 401, 'expired');
});

test('OTP rate limits: 3 per number per 15 min, 10 per IP per hour, 429 + Retry-After', async () => {
  for (let i = 0; i < 3; i++) assert.equal((await post('/api/auth/otp/start', { phone: '01912345678' })).status, 200);
  const r = await post('/api/auth/otp/start', { phone: '01912345678' });
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('Retry-After')) > 0 && Number(r.headers.get('Retry-After')) <= 900);
  now += 15 * 60e3 + 1;
  assert.equal((await post('/api/auth/otp/start', { phone: '01912345678' })).status, 200, 'window slides');
  now = Math.ceil(now / 3600e3) * 3600e3 + 1;  // fresh hour window
  const ip = { 'CF-Connecting-IP': '203.0.113.9' };
  for (let i = 0; i < 10; i++) assert.equal((await post('/api/auth/otp/start', { phone: '0171000000' + i }, ip)).status, 200, String(i));
  const r2 = await post('/api/auth/otp/start', { phone: '01710000010' }, ip);
  assert.equal(r2.status, 429);
  assert.ok(Number(r2.headers.get('Retry-After')) > 0);
  assert.equal((await post('/api/auth/otp/start', { phone: '01710000010' }, { 'CF-Connecting-IP': '203.0.113.10' })).status, 200);
});

test('refresh rotates; reusing an old refresh token revokes the whole family; logout revokes', async () => {
  const a = await (await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV })).json() as { refresh_token: string; access_token: string };
  const b = await (await post('/api/auth/refresh', { refresh_token: a.refresh_token })).json() as { refresh_token: string; access_token: string };
  assert.ok(b.refresh_token && b.refresh_token !== a.refresh_token);
  assert.equal((await post('/api/auth/refresh', { refresh_token: a.refresh_token })).status, 401, 'reuse detected');
  assert.equal((await post('/api/auth/refresh', { refresh_token: b.refresh_token })).status, 401, 'family revoked');
  const c = await (await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV })).json() as { refresh_token: string; access_token: string };
  assert.equal((await post('/api/auth/logout', {}, { Authorization: 'Bearer ' + c.access_token })).status, 200);
  assert.equal((await post('/api/auth/refresh', { refresh_token: c.refresh_token })).status, 401);
  const d = await (await post('/api/auth/google', { id_token: await gtoken(), device_id: DEV })).json() as { refresh_token: string };
  now += 31 * 86400e3;
  assert.equal((await post('/api/auth/refresh', { refresh_token: d.refresh_token })).status, 401, 'expired refresh');
  assert.equal((await post('/api/auth/refresh', { refresh_token: 'forged' })).status, 401);
});

test('POST endpoints require JSON (forces a CORS preflight cross-origin)', async () => {
  const r = await worker.fetch(new Request('https://w.example/api/auth/otp/start', { method: 'POST', body: '{"phone":"01712345678"}', headers: { 'Content-Type': 'text/plain' } }), env);
  assert.equal(r.status, 415);
});
