import manifest from '../../content/manifest.json' with { type: 'json' };
import bundles from './bundles.json' with { type: 'json' };
import { auth, json, limited, NO_STORE, type Env } from './http.ts';

type Meta = { kind: 'q' | 'mcq' | 'tb'; free: boolean };
const CHUNKS = manifest.chunks as Record<string, Meta>;
const KINDS = bundles.chunk_kinds as Record<string, string>;

/** Does the user hold an unexpired entitlement? `now` in ms. */
export async function entitled(env: Env, userId: string, entitlement: string, now = Date.now()): Promise<boolean> {
  const r = await env.DB.prepare('SELECT 1 AS ok FROM entitlements WHERE user_id = ?1 AND entitlement = ?2 AND expires_at > ?3')
    .bind(userId, entitlement, now).first();
  return !!r;
}

/** GET /api/chunks/:id — id must be in the manifest allowlist (no paths, no traversal). */
export async function getChunk(req: Request, env: Env, id: string): Promise<Response> {
  const meta = Object.hasOwn(CHUNKS, id) ? CHUNKS[id] : undefined;
  if (!meta) return json({ error: 'not_found' }, 404);
  let cache = 'public, max-age=300';
  if (!meta.free) {
    const claims = await auth(req, env);
    if (!claims) return json({ error: 'unauthorized' }, 401);
    const wait = await limited(env, 'chunk:' + claims.sub, 60, 60e3);
    if (wait) return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(wait) });
    if (!(await entitled(env, claims.sub, KINDS[meta.kind]))) return json({ error: 'forbidden' }, 403);
    cache = NO_STORE;
  }
  const key = 'chunks/' + id + '.json';
  let body: ReadableStream | string | null | undefined = env.CHUNKS ? (await env.CHUNKS.get(key))?.body : env.CHUNKS_KV ? await env.CHUNKS_KV.get(key, 'stream') : null;
  if (!env.CHUNKS && !env.CHUNKS_KV) {  // D1 storage: parts joined in order
    const r = await env.DB.prepare('SELECT body FROM chunk_parts WHERE id = ?1 ORDER BY part').bind(id).all<{ body: string }>();
    body = r.results.length ? r.results.map((x) => x.body).join('') : null;
  }
  if (!body) return json({ error: 'not_found' }, 404);
  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' },
  });
}
