import { verify, type Claims } from './jwt.ts';

export interface Env {
  DB: D1Database;
  CHUNKS?: R2Bucket;        // R2 when available
  CHUNKS_KV?: KVNamespace;  // KV otherwise (no card needed)
  ADMIN_KEY?: string;
  PAY_MODE?: string;         // 'manual' (bKash, owner approves) or 'gateway'
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string; // allowed site origins, exact (scheme://host), comma separated
  GOOGLE_CLIENT_ID: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SID?: string;
  SSLCOMMERZ_STORE_ID?: string;
  SSLCOMMERZ_STORE_PASSWORD?: string;
  SSLCOMMERZ_BASE?: string;
  APP_URL?: string; // where the gateway return sends the browser
}

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const NO_STORE = 'private, no-store';

/** The request Origin if it is allowed (Pages origin or localhost), else null. Never '*'. */
export function allowedOrigin(req: Request, env: Env): string | null {
  const o = req.headers.get('Origin');
  return o && (env.ALLOWED_ORIGIN.split(',').map((x) => x.trim()).includes(o) || LOCAL.test(o)) ? o : null;
}

export function withCors(res: Response, req: Request, env: Env): Response {
  const o = allowedOrigin(req, env);
  const h = new Headers(res.headers);
  h.append('Vary', 'Origin');
  if (o) {
    h.set('Access-Control-Allow-Origin', o);
    h.set('Access-Control-Expose-Headers', 'Retry-After');
  }
  return new Response(res.body, { status: res.status, headers: h });
}

export function preflight(req: Request, env: Env): Response {
  if (!allowedOrigin(req, env)) return new Response(null, { status: 403, headers: { Vary: 'Origin' } });
  return withCors(new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' },
  }), req, env);
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': NO_STORE, 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
}

/** Verified access-token claims from `Authorization: Bearer`, or null. */
export async function auth(req: Request, env: Env): Promise<Claims | null> {
  const m = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(req.headers.get('Authorization') ?? '');
  return m && env.JWT_SECRET ? verify(m[1], env.JWT_SECRET, 'access') : null;
}

/** Fixed-window counter. Returns 0 when allowed, else the seconds until the window resets (for Retry-After). */
export async function limited(env: Env, key: string, max: number, windowMs: number, now = Date.now()): Promise<number> {
  const ws = Math.floor(now / windowMs) * windowMs;
  const r = await env.DB.prepare('INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1) ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, ws).first<{ count: number }>();
  if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?1').bind(now - 86400e3).run();
  return r && r.count > max ? Math.max(1, Math.ceil((ws + windowMs - now) / 1000)) : 0;
}

export { NO_STORE };
