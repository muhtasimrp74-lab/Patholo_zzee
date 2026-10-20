import manifest from '../../content/manifest.json' with { type: 'json' };
import bundles from './bundles.json' with { type: 'json' };
import { auth, json, NO_STORE, type Env } from './http.ts';

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
    if (!(await entitled(env, claims.sub, KINDS[meta.kind]))) return json({ error: 'forbidden' }, 403);
    cache = NO_STORE;
  }
  const obj = await env.CHUNKS.get('chunks/' + id + '.json');
  if (!obj) return json({ error: 'not_found' }, 404);
  return new Response(obj.body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' },
  });
}
