import { verify, type Claims } from './jwt.ts';

export interface Env {
  DB: D1Database;
  CHUNKS: R2Bucket;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string; // the Pages origin, exact (scheme://host)
}

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const NO_STORE = 'private, no-store';

/** The request Origin if it is allowed (Pages origin or localhost), else null. Never '*'. */
export function allowedOrigin(req: Request, env: Env): string | null {
  const o = req.headers.get('Origin');
  return o && (o === env.ALLOWED_ORIGIN || LOCAL.test(o)) ? o : null;
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

export { NO_STORE };
