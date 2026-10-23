import { sign, verify } from './jwt.ts';
import { auth, json, limited, type Env } from './http.ts';

const MIN = 60e3, DAY = 86400e3;
const ACCESS_S = 900, REFRESH_MS = 30 * DAY, OTP_TTL = 10 * MIN, OTP_TRIES = 5;
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
export async function hmac(secret: string, s: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(s)));
}
const rand = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));

/** E.164. Accepts Bangla/Arabic/Devanagari digits and Bangladesh local forms (01XXXXXXXXX -> +8801XXXXXXXXX). */
export function normalizePhone(input: string): string | null {
  let s = String(input ?? '').normalize('NFKC').replace(/[\u09E6-\u09EF\u0660-\u0669\u06F0-\u06F9\u0966-\u096F]/g, (c) => {
    const cp = c.codePointAt(0)!; return String(cp - (cp >= 0x09E6 ? 0x09E6 : cp >= 0x0966 ? 0x0966 : cp >= 0x06F0 ? 0x06F0 : 0x0660));
  }).replace(/[\s().-]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^01\d{9}$/.test(s)) s = '+88' + s;
  else if (/^8801\d{9}$/.test(s)) s = '+' + s;
  else if (/^1[3-9]\d{8}$/.test(s)) s = '+880' + s;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  if (s.startsWith('+880') && !/^\+8801[3-9]\d{8}$/.test(s)) return null;
  return s;
}

// ---- provider adapters (tests replace these) ----
export type GoogleUser = { sub: string; email: string; name: string };
export type OtpProvider = { start(phone: string): Promise<{ codeHash?: string }>; check(phone: string, code: string, codeHash: string | null): Promise<boolean> };
let jwks: { keys: JsonWebKey[]; until: number } | null = null;
export const deps = {
  now: () => Date.now(),
  fetchJwks: async (): Promise<{ keys: JsonWebKey[] }> => {
    if (jwks && jwks.until > Date.now()) return jwks;
    const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!r.ok) throw new Error('jwks');
    jwks = { ...(await r.json() as { keys: JsonWebKey[] }), until: Date.now() + 3600e3 };
    return jwks;
  },
  otp: (env: Env): OtpProvider => twilio(env),
};

const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
/** Verify a Google ID token (RS256, Google JWKS, aud = our client id, verified email). */
export async function verifyGoogle(idToken: string, clientId: string, now = deps.now()): Promise<GoogleUser | null> {
  try {
    const [h, b, s] = idToken.split('.');
    const head = JSON.parse(new TextDecoder().decode(unb64u(h)));
    if (head.alg !== 'RS256' || !clientId) return null;
    const jwk = (await deps.fetchJwks()).keys.find((k) => (k as { kid?: string }).kid === head.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64u(s), enc.encode(h + '.' + b)))) return null;
    const c = JSON.parse(new TextDecoder().decode(unb64u(b)));
    if (c.aud !== clientId || !['accounts.google.com', 'https://accounts.google.com'].includes(c.iss)) return null;
    if (typeof c.exp !== 'number' || c.exp * 1000 <= now || c.email_verified !== true || typeof c.email !== 'string') return null;
    return { sub: String(c.sub), email: c.email.toLowerCase(), name: String(c.name ?? '').slice(0, 80) };
  } catch {
    return null;
  }
}

function twilio(env: Env): OtpProvider {
  const call = async (path: string, body: Record<string, string>) => fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SID}/${path}`, {
    method: 'POST', body: new URLSearchParams(body),
    headers: { Authorization: 'Basic ' + btoa(env.TWILIO_ACCOUNT_SID + ':' + env.TWILIO_AUTH_TOKEN), 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return {
    async start(phone) { if (!(await call('Verifications', { To: phone, Channel: 'sms' })).ok) throw new Error('otp_send'); return {}; },
    async check(phone, code) {
      const r = await call('VerificationCheck', { To: phone, Code: code });
      return r.ok && ((await r.json()) as { status?: string }).status === 'approved';
    },
  };
}

// ---- sessions ----
export const MAX_DEVICES = 3;
/** A fresh sign-in on a 4th device is refused with the device list and a 10-minute token that can remove one. */
async function deviceLimit(env: Env, userId: string, deviceId: string): Promise<Response | null> {
  const r = await env.DB.prepare('SELECT device_id, name, last_seen_at FROM devices WHERE user_id = ?1 AND revoked_at IS NULL AND device_id != ?2 ORDER BY last_seen_at DESC')
    .bind(userId, deviceId).all<{ device_id: string; name: string; last_seen_at: number }>();
  if (r.results.length < MAX_DEVICES) return null;
  const s = Math.floor(deps.now() / 1000);
  const removal_token = await sign({ sub: userId, typ: 'devrm', iat: s, exp: s + 600 }, env.JWT_SECRET);
  return json({ error: 'device_limit', max: MAX_DEVICES, devices: r.results, removal_token }, 409);
}

async function upsertDevice(env: Env, userId: string, deviceId: string, now: number, name: string | null) {
  // a new sign-in re-enables a removed device; a refresh (name === null) never does
  await env.DB.prepare(`INSERT INTO devices (user_id, device_id, name, created_at, last_seen_at) VALUES (?1, ?2, ?4, ?3, ?3)
    ON CONFLICT (user_id, device_id) DO UPDATE SET last_seen_at = ?3, name = COALESCE(?5, name), revoked_at = CASE WHEN ?5 IS NULL THEN revoked_at ELSE NULL END`)
    .bind(userId, deviceId, now, name ?? '', name).run();
}

async function issue(env: Env, userId: string, deviceId: string, family = rand(16), name: string | null = null) {
  const now = deps.now(), refresh = rand();
  await env.DB.prepare('INSERT INTO sessions (token_hash, family_id, user_id, device_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(await sha256(refresh), family, userId, deviceId, now, now + REFRESH_MS).run();
  await upsertDevice(env, userId, deviceId, now, name);
  const s = Math.floor(now / 1000);
  const access = await sign({ sub: userId, sid: family, did: deviceId, typ: 'access', iat: s, exp: s + ACCESS_S }, env.JWT_SECRET);
  return { access_token: access, refresh_token: refresh, expires_in: ACCESS_S };
}

export const revokeFamily = (env: Env, family: string, now = deps.now()) =>
  env.DB.prepare('UPDATE sessions SET revoked_at = ?2 WHERE family_id = ?1 AND revoked_at IS NULL').bind(family, now).run();

async function profile(env: Env, id: string) {
  return env.DB.prepare('SELECT id, display_name, email, phone, college, session, trial_used_at, created_at FROM users WHERE id = ?1').bind(id).first();
}

async function body(req: Request): Promise<Record<string, unknown>> {
  const t = await req.text();
  if (t.length > 4096) return {};
  try { const v = JSON.parse(t); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
const deviceOf = (b: Record<string, unknown>) => (typeof b.device_id === 'string' && /^[\w-]{8,64}$/.test(b.device_id) ? b.device_id : null);
const nameOf = (b: Record<string, unknown>) => String(b.device_name ?? 'Device').replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 60) || 'Device';

async function userBy(env: Env, field: 'email' | 'phone', value: string, name: string): Promise<string> {
  const row = await env.DB.prepare(`SELECT id FROM users WHERE ${field} = ?1`).bind(value).first<{ id: string }>();
  if (row) return row.id;
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO users (id, display_name, ${field}, created_at) VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT (${field}) DO NOTHING`).bind(id, name, value, deps.now()).run();
  return (await env.DB.prepare(`SELECT id FROM users WHERE ${field} = ?1`).bind(value).first<{ id: string }>())!.id;
}

// ---- routes ----
export async function google(req: Request, env: Env): Promise<Response> {
  const b = await body(req), dev = deviceOf(b);
  if (typeof b.id_token !== 'string' || !dev) return json({ error: 'bad_request' }, 400);
  const g = await verifyGoogle(b.id_token, env.GOOGLE_CLIENT_ID);
  if (!g) return json({ error: 'invalid_token' }, 401);
  const id = await userBy(env, 'email', g.email, g.name || g.email.split('@')[0]);
  const lim = await deviceLimit(env, id, dev);
  if (lim) return lim;
  return json({ ...(await issue(env, id, dev, undefined, nameOf(b))), user: await profile(env, id) });
}

const ipKey = async (req: Request, env: Env) => 'otp:ip:' + (await hmac(env.JWT_SECRET, 'ip:' + (req.headers.get('CF-Connecting-IP') ?? 'unknown'))).slice(0, 32);

export async function otpStart(req: Request, env: Env): Promise<Response> {
  const b = await body(req), phone = normalizePhone(String(b.phone ?? ''));
  if (!phone) return json({ error: 'bad_phone' }, 400);
  const now = deps.now(), ph = await hmac(env.JWT_SECRET, 'phone:' + phone);
  const recent = await env.DB.prepare('SELECT created_at FROM otp_challenges WHERE phone_hash = ?1 AND created_at > ?2 ORDER BY created_at')
    .bind(ph, now - 15 * MIN).all<{ created_at: number }>();
  if (recent.results.length >= 3)
    return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(Math.ceil((recent.results[0].created_at + 15 * MIN - now) / 1000)) });
  const ip = await ipKey(req, env), win = Math.floor(now / 3600e3) * 3600e3;
  await env.DB.prepare('INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1) ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1').bind(ip, win).run();
  const c = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ?1 AND window_start = ?2').bind(ip, win).first<{ count: number }>();
  if (c && c.count > 10) return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(Math.ceil((win + 3600e3 - now) / 1000)) });
  let sent: { codeHash?: string };
  try { sent = await deps.otp(env).start(phone); } catch { return json({ error: 'otp_unavailable' }, 502); }
  await env.DB.prepare('INSERT INTO otp_challenges (phone_hash, code_hash, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(ph, sent.codeHash ?? null, now, now + OTP_TTL).run();
  return json({ ok: true, expires_in: OTP_TTL / 1000 });
}

export async function otpVerify(req: Request, env: Env): Promise<Response> {
  const b = await body(req), phone = normalizePhone(String(b.phone ?? '')), dev = deviceOf(b), code = String(b.code ?? '');
  if (!phone || !dev || !/^\d{4,8}$/.test(code)) return json({ error: 'bad_request' }, 400);
  const now = deps.now(), ph = await hmac(env.JWT_SECRET, 'phone:' + phone);
  const ch = await env.DB.prepare('SELECT id, code_hash, attempts, expires_at, consumed_at FROM otp_challenges WHERE phone_hash = ?1 ORDER BY id DESC LIMIT 1')
    .bind(ph).first<{ id: number; code_hash: string | null; attempts: number; expires_at: number; consumed_at: number | null }>();
  if (!ch || ch.consumed_at || ch.expires_at <= now) return json({ error: 'invalid_code' }, 401);
  if (ch.attempts >= OTP_TRIES) return json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(Math.ceil((ch.expires_at - now) / 1000)) });
  // count the attempt first, guarded so parallel guesses cannot exceed the limit
  const upd = await env.DB.prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?1 AND attempts < ?2 AND consumed_at IS NULL').bind(ch.id, OTP_TRIES).run();
  if (!upd.meta.changes) return json({ error: 'invalid_code' }, 401);
  if (!(await deps.otp(env).check(phone, code, ch.code_hash))) return json({ error: 'invalid_code' }, 401);
  const used = await env.DB.prepare('UPDATE otp_challenges SET consumed_at = ?2 WHERE id = ?1 AND consumed_at IS NULL').bind(ch.id, now).run();
  if (!used.meta.changes) return json({ error: 'invalid_code' }, 401);
  const id = await userBy(env, 'phone', phone, 'User ' + phone.slice(-4));
  const lim = await deviceLimit(env, id, dev);
  if (lim) return lim;
  return json({ ...(await issue(env, id, dev, undefined, nameOf(b))), user: await profile(env, id) });
}

export async function refresh(req: Request, env: Env): Promise<Response> {
  const b = await body(req);
  if (typeof b.refresh_token !== 'string') return json({ error: 'bad_request' }, 400);
  const now = deps.now();
  const s = await env.DB.prepare(`SELECT s.id, s.family_id, s.user_id, s.device_id, s.expires_at, s.rotated_at, s.revoked_at, d.revoked_at AS dev_revoked
    FROM sessions s LEFT JOIN devices d ON d.user_id = s.user_id AND d.device_id = s.device_id WHERE s.token_hash = ?1`).bind(await sha256(b.refresh_token))
    .first<{ id: number; family_id: string; user_id: string; device_id: string; expires_at: number; rotated_at: number | null; revoked_at: number | null; dev_revoked: number | null }>();
  if (!s || s.revoked_at || s.dev_revoked || s.expires_at <= now) return json({ error: 'invalid_refresh' }, 401);
  const rot = s.rotated_at ? { meta: { changes: 0 } } :
    await env.DB.prepare('UPDATE sessions SET rotated_at = ?2 WHERE id = ?1 AND rotated_at IS NULL AND revoked_at IS NULL').bind(s.id, now).run();
  if (!rot.meta.changes) { await revokeFamily(env, s.family_id, now); return json({ error: 'refresh_reused' }, 401); }
  return json(await issue(env, s.user_id, s.device_id, s.family_id));
}

export async function logout(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c || typeof c.sid !== 'string') return json({ error: 'unauthorized' }, 401);
  await revokeFamily(env, c.sid);
  return json({ ok: true });
}

export async function me(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const user = await profile(env, c.sub);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const ents = await env.DB.prepare('SELECT entitlement, expires_at FROM entitlements WHERE user_id = ?1 ORDER BY entitlement').bind(c.sub).all();
  return json({ user, entitlements: ents.results, now: deps.now() });
}

/** GET /api/devices (access token). */
export async function devices(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const r = await env.DB.prepare('SELECT device_id, name, last_seen_at FROM devices WHERE user_id = ?1 AND revoked_at IS NULL ORDER BY last_seen_at DESC').bind(c.sub).all();
  return json({ devices: r.results, current: c.did ?? null, max: MAX_DEVICES });
}

/** DELETE /api/devices/:id with an access token or a device-limit removal token: revokes the device and its sessions. */
export async function removeDevice(req: Request, env: Env, deviceId: string): Promise<Response> {
  const m = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(req.headers.get('Authorization') ?? '');
  const c = (await auth(req, env)) ?? (m ? await verify(m[1], env.JWT_SECRET, 'devrm') : null);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const now = deps.now();
  const r = await env.DB.prepare('UPDATE devices SET revoked_at = ?3 WHERE user_id = ?1 AND device_id = ?2 AND revoked_at IS NULL').bind(c.sub, deviceId, now).run();
  if (!r.meta.changes) return json({ error: 'not_found' }, 404);
  await env.DB.prepare('UPDATE sessions SET revoked_at = ?3 WHERE user_id = ?1 AND device_id = ?2 AND revoked_at IS NULL').bind(c.sub, deviceId, now).run();
  return json({ ok: true });
}

// ---- password sign-in (until SMS codes are available) ----
// PBKDF2-SHA256. 20k iterations keeps a login inside the Workers free plan's 10 ms CPU budget; the count is stored
// with each hash so it can be raised later without breaking existing passwords.
export const PBKDF2_ITER = 20000;
async function pbkdf2(password: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, k, 256));
}
export async function hashPassword(password: string, iter = PBKDF2_ITER): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return 'pbkdf2$' + iter + '$' + b64u(salt) + '$' + b64u(await pbkdf2(password, salt, iter));
}
export async function checkPassword(password: string, stored: string | null): Promise<boolean> {
  const [kind, it, salt, hash] = String(stored ?? '').split('$');
  if (kind !== 'pbkdf2' || !salt || !hash) { await pbkdf2(password, new Uint8Array(16), PBKDF2_ITER); return false; }  // same work either way
  const got = b64u(await pbkdf2(password, unb64u(salt), Number(it)));
  let diff = got.length ^ hash.length;
  for (let i = 0; i < Math.min(got.length, hash.length); i++) diff |= got.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}
/** Email (lower-cased) or Bangladesh/E.164 phone. */
export function normalizeLogin(input: unknown): { field: 'email' | 'phone'; value: string } | null {
  const s = String(input ?? '').trim();
  if (s.includes('@')) return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(s) ? { field: 'email', value: s.toLowerCase() } : null;
  const p = normalizePhone(s);
  return p ? { field: 'phone', value: p } : null;
}

async function loginLimited(req: Request, env: Env, login: string): Promise<Response | null> {
  const now = deps.now();
  const who = await limited(env, 'pw:' + (await hmac(env.JWT_SECRET, 'login:' + login)).slice(0, 32), 10, 15 * MIN, now);
  const ip = await limited(env, 'pwip:' + (await ipKey(req, env)).slice(7), 30, 3600e3, now);
  const wait = Math.max(who, ip);
  return wait ? json({ error: 'rate_limited' }, 429, { 'Retry-After': String(wait) }) : null;
}

/** POST /api/auth/register {name, phone, email, college, session, password, device_id, device_name?}
 *  (an older client may still send {login, password}: that keeps working). */
export async function register(req: Request, env: Env): Promise<Response> {
  const b = await body(req), dev = deviceOf(b), pw = String(b.password ?? '');
  if (!dev) return json({ error: 'bad_login' }, 400);
  if (b.login !== undefined && b.email === undefined && b.phone === undefined) {   // the old one-field form
    const l = normalizeLogin(b.login);
    if (!l) return json({ error: 'bad_login' }, 400);
    if (pw.length < 8 || pw.length > 128) return json({ error: 'weak_password' }, 400);
    const lim = await loginLimited(req, env, l.value);
    if (lim) return lim;
    if (await env.DB.prepare(`SELECT 1 FROM users WHERE ${l.field} = ?1`).bind(l.value).first()) return json({ error: 'account_exists' }, 409);
    const id = crypto.randomUUID(), name = l.field === 'email' ? l.value.split('@')[0].slice(0, 40) : 'User ' + l.value.slice(-4);
    const r = await env.DB.prepare(`INSERT INTO users (id, display_name, ${l.field}, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (${l.field}) DO NOTHING`)
      .bind(id, name, l.value, await hashPassword(pw), deps.now()).run();
    if (!r.meta.changes) return json({ error: 'account_exists' }, 409);
    return json({ ...(await issue(env, id, dev, undefined, nameOf(b))), user: await profile(env, id) });
  }
  const txt = (k: string, max: number) => String(b[k] ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const name = txt('name', 60), college = txt('college', 80), session = txt('session', 20);
  const phone = normalizePhone(String(b.phone ?? '')), em = normalizeLogin(String(b.email ?? '').trim());
  if (name.length < 2) return json({ error: 'bad_name' }, 400);
  if (!phone) return json({ error: 'bad_phone' }, 400);
  if (!em || em.field !== 'email') return json({ error: 'bad_email' }, 400);
  if (college.length < 2) return json({ error: 'bad_college' }, 400);
  if (session.length < 4) return json({ error: 'bad_session' }, 400);
  if (pw.length < 8 || pw.length > 128) return json({ error: 'weak_password' }, 400);
  const lim = await loginLimited(req, env, em.value);
  if (lim) return lim;
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?1 OR phone = ?2').bind(em.value, phone).first()) return json({ error: 'account_exists' }, 409);
  const id = crypto.randomUUID();
  const r = await env.DB.prepare('INSERT INTO users (id, display_name, email, phone, college, session, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT DO NOTHING')
    .bind(id, name, em.value, phone, college, session, await hashPassword(pw), deps.now()).run();
  if (!r.meta.changes) return json({ error: 'account_exists' }, 409);
  return json({ ...(await issue(env, id, dev, undefined, nameOf(b))), user: await profile(env, id) });
}

/** POST /api/trial {code}: one free month of everything per account. 5 wrong codes an hour per user and per IP. */
export async function trial(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const b = await body(req), code = String(b.code ?? '').trim(), want = env.TRIAL_CODE ?? 'MFree_zze', now = deps.now();
  const uk = 'trial:u:' + c.sub, ik = 'trial:ip:' + (await ipKey(req, env)).slice(7), HOUR = 3600e3, ws = Math.floor(now / HOUR) * HOUR;
  const tries = async (k: string) => (await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ?1 AND window_start = ?2').bind(k, ws).first<{ count: number }>())?.count ?? 0;
  if ((await tries(uk)) >= 5 || (await tries(ik)) >= 5) return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(Math.ceil((ws + HOUR - now) / 1000)) });
  const [x, y] = [await sha256(code), await sha256(want)];   // equal-length digests, compared without an early exit
  let d = 0; for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  if (d !== 0) { await limited(env, uk, 5, HOUR, now); await limited(env, ik, 5, HOUR, now); return json({ error: 'bad_code' }, 400); }
  const u = await env.DB.prepare('UPDATE users SET trial_used_at = ?1 WHERE id = ?2 AND trial_used_at IS NULL').bind(now, c.sub).run();
  if (!u.meta.changes) return json({ error: 'trial_used' }, 409);
  const exp = now + 30 * DAY;
  await env.DB.batch(['qna', 'mcq', 'textbook'].map((e) => env.DB.prepare(
    `INSERT INTO entitlements (user_id, entitlement, expires_at, source, note, created_at, updated_at) VALUES (?1, ?2, ?3, 'admin', 'trial', ?4, ?4)
     ON CONFLICT (user_id, entitlement) DO UPDATE SET
       source = CASE WHEN excluded.expires_at > entitlements.expires_at THEN 'admin' ELSE entitlements.source END,
       note = CASE WHEN excluded.expires_at > entitlements.expires_at THEN 'trial' ELSE entitlements.note END,
       expires_at = MAX(entitlements.expires_at, excluded.expires_at), updated_at = excluded.updated_at`).bind(c.sub, e, exp, now)));
  return json({ ok: true, expires_at: exp });
}

/** POST /api/auth/login {login, password, device_id, device_name?} — the same answer for a wrong login or password. */
export async function passwordLogin(req: Request, env: Env): Promise<Response> {
  const b = await body(req), dev = deviceOf(b), l = normalizeLogin(b.login), pw = String(b.password ?? '');
  if (!dev || !l || !pw) return json({ error: 'bad_request' }, 400);
  const lim = await loginLimited(req, env, l.value);
  if (lim) return lim;
  const u = await env.DB.prepare(`SELECT id, password_hash FROM users WHERE ${l.field} = ?1`).bind(l.value).first<{ id: string; password_hash: string | null }>();
  if (!(await checkPassword(pw, u?.password_hash ?? null)) || !u) return json({ error: 'wrong_login' }, 401);
  const dl = await deviceLimit(env, u.id, dev);
  if (dl) return dl;
  return json({ ...(await issue(env, u.id, dev, undefined, nameOf(b))), user: await profile(env, u.id) });
}
