import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import { sign } from '../src/jwt.ts';
import { fakeD1, fakeR2 } from './fakes.ts';

const SECRET = 'test-secret-' + Math.random();
const PAGES = 'https://muhtasimrp74-lab.github.io';
const NOW = Date.now(), S = Math.floor(NOW / 1000);
function setup() {
  const DB = fakeD1();
  DB.raw.exec(`INSERT INTO users (id, display_name, created_at) VALUES ('u1','A',0),('u2','B',0),('u3','C',0)`);
  const ins = DB.raw.prepare(`INSERT INTO entitlements (user_id, entitlement, expires_at, source, note, created_at, updated_at) VALUES (?,?,?,?,?,0,0)`);
  ins.run('u1', 'qna', NOW + 86400e3, 'admin', 'test');     // valid
  ins.run('u2', 'qna', NOW - 1000, 'payment', 'expired');   // expired
  ins.run('u3', 'mcq', NOW + 86400e3, 'admin', 'other');    // wrong kind
  const R2 = fakeR2({ 'chunks/q-02.json': '{"id":"q-02","gated":true}\n', 'chunks/q-01.json': '{"id":"q-01","free":true}\n' });
  return { DB, CHUNKS: R2, JWT_SECRET: SECRET, ALLOWED_ORIGIN: PAGES } as never;
}
const tok = (sub: string, o: Record<string, unknown> = {}, secret = SECRET) => sign({ sub, exp: S + 900, iat: S, typ: 'access', ...o }, secret);
async function get(env: never, id: string, token?: string, origin?: string) {
  const h: Record<string, string> = {};
  if (token) h.Authorization = 'Bearer ' + token;
  if (origin) h.Origin = origin;
  return worker.fetch(new Request('https://w.example/api/chunks/' + id + '.json', { headers: h }), env);
}

test('valid session + entitlement gets the gated chunk with no-store', async () => {
  const r = await get(setup(), 'q-02', await tok('u1'));
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '{"id":"q-02","gated":true}\n');
  assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
  assert.match(r.headers.get('Vary') ?? '', /Authorization/);
});

test('no session -> 401; forged, expired and refresh-type tokens -> 401', async () => {
  const env = setup();
  assert.equal((await get(env, 'q-02')).status, 401);
  assert.equal((await get(env, 'q-02', await tok('u1', {}, 'wrong-secret'))).status, 401);
  assert.equal((await get(env, 'q-02', await tok('u1', { exp: S - 1 }))).status, 401);
  assert.equal((await get(env, 'q-02', await tok('u1', { typ: 'refresh' }))).status, 401);
  const t = await tok('u1'); const [h, , s] = t.split('.');
  const evil = h + '.' + btoa(JSON.stringify({ sub: 'u1', exp: S + 900, typ: 'access', admin: true })).replace(/=+$/, '') + '.' + s;
  assert.equal((await get(env, 'q-02', evil)).status, 401);
});

test('no entitlement, wrong entitlement and expired entitlement -> 403', async () => {
  const env = setup();
  assert.equal((await get(env, 'q-02', await tok('nobody'))).status, 403);
  assert.equal((await get(env, 'q-02', await tok('u3'))).status, 403);
  const r = await get(env, 'q-02', await tok('u2'));
  assert.equal(r.status, 403);
  assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
});

test('free chunk is public; unknown and traversal ids -> 404', async () => {
  const env = setup();
  const r = await get(env, 'q-01');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '{"id":"q-01","free":true}\n');
  for (const id of ['q-99', '..%2Fsecret', '..%2F..%2Fetc%2Fpasswd', 'Q-02', 'constructor', '__proto__'])
    assert.equal((await get(env, id, await tok('u1'))).status, 404, id);
  const r2 = await worker.fetch(new Request('https://w.example/api/chunks/../q-02.json'), env);
  assert.equal(r2.status, 404);
});

test('CORS: only the Pages origin and localhost, never *', async () => {
  const env = setup();
  for (const o of [PAGES, 'http://localhost:8000', 'http://127.0.0.1:5173'])
    assert.equal((await get(env, 'q-01', undefined, o)).headers.get('Access-Control-Allow-Origin'), o);
  for (const o of ['https://evil.example', 'https://muhtasimrp74-lab.github.io.evil.example', 'null', 'http://localhost.evil.example'])
    assert.equal((await get(env, 'q-01', undefined, o)).headers.get('Access-Control-Allow-Origin'), null, o);
  const pre = (o: string) => worker.fetch(new Request('https://w.example/api/chunks/q-02.json', { method: 'OPTIONS', headers: { Origin: o } }), env);
  const ok = await pre(PAGES);
  assert.equal(ok.status, 204);
  assert.match(ok.headers.get('Access-Control-Allow-Headers') ?? '', /Authorization/);
  assert.equal((await pre('https://evil.example')).status, 403);
});
