import { auth, json, limited, type Env } from './http.ts';

const TABLE = { progress: 'user_progress', note: 'user_notes', annotation: 'user_annotations' } as const;
type Kind = keyof typeof TABLE;
type Item = { kind: Kind; key: string; value: string; updated_at: number; deleted?: boolean };
export const MAX_UPLOADS_PER_HOUR = 120; // per user: room for busy study sessions, a ceiling on storage abuse (each request <= 2.5 MB)
export const MAX_ITEMS = 20; // keeps every request well under D1's per-invocation query limit
export const syncDeps = { now: () => Date.now() };

function valid(x: unknown): x is Item {
  const i = x as Item;
  return !!i && Object.hasOwn(TABLE, i.kind) && typeof i.key === 'string' && i.key.length > 0 && i.key.length <= 200 && !i.key.includes('#conflict-')
    && typeof i.value === 'string' && i.value.length <= 200_000 && Number.isSafeInteger(i.updated_at) && i.updated_at > 0;
}

/** POST /api/sync/upload {upload_id, items}. Idempotent per upload_id: a retry returns the first result and changes nothing. */
export async function upload(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const wait = await limited(env, 'sync:' + c.sub, MAX_UPLOADS_PER_HOUR, 3600e3);
  if (wait) return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(wait) });
  const t = await req.text();
  if (t.length > 2_500_000) return json({ error: 'too_large' }, 413);
  let b: { upload_id?: unknown; items?: unknown };
  try { b = JSON.parse(t); } catch { return json({ error: 'bad_request' }, 400); }
  if (typeof b.upload_id !== 'string' || !/^[\w-]{8,80}$/.test(b.upload_id) || !Array.isArray(b.items) || b.items.length > MAX_ITEMS || !b.items.every(valid))
    return json({ error: 'bad_request' }, 400);
  const items = b.items as Item[], uid = c.sub, now = syncDeps.now();
  const prev = await env.DB.prepare('SELECT result FROM migration_uploads WHERE user_id = ?1 AND upload_id = ?2').bind(uid, b.upload_id).first<{ result: string }>();
  if (prev) return json({ ...JSON.parse(prev.result), replay: true });
  const noteKeys = items.filter((i) => i.kind === 'note').map((i) => i.key);
  const cloud = new Map<string, string>();
  if (noteKeys.length) {
    const r = await env.DB.prepare('SELECT key, value FROM user_notes WHERE user_id = ?1 AND conflict = 0 AND key IN (SELECT value FROM json_each(?2))')
      .bind(uid, JSON.stringify(noteKeys)).all<{ key: string; value: string }>();
    for (const x of r.results) cloud.set(x.key, x.value);
  }
  let conflicts = 0;
  const stmts: D1PreparedStatement[] = [];
  for (const [n, i] of items.entries()) {
    const del = i.deleted ? 1 : 0;
    if (i.kind === 'note' && cloud.has(i.key) && cloud.get(i.key) !== i.value) {
      conflicts++;  // keep both: the cloud copy moves to a flagged conflict key, the upload becomes the main copy
      stmts.push(env.DB.prepare("UPDATE user_notes SET key = key || '#conflict-' || ?3, conflict = 1 WHERE user_id = ?1 AND key = ?2 AND conflict = 0")
        .bind(uid, i.key, now + '-' + n));
      stmts.push(env.DB.prepare('INSERT INTO user_notes (user_id, key, value, updated_at, deleted) VALUES (?1, ?2, ?3, ?4, ?5)').bind(uid, i.key, i.value, i.updated_at, del));
    } else if (i.kind === 'note') {
      stmts.push(env.DB.prepare('INSERT INTO user_notes (user_id, key, value, updated_at, deleted) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (user_id, key) DO NOTHING')
        .bind(uid, i.key, i.value, i.updated_at, del));
    } else {
      stmts.push(env.DB.prepare(`INSERT INTO ${TABLE[i.kind]} (user_id, key, value, updated_at, deleted) VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, deleted = excluded.deleted
        WHERE excluded.updated_at > ${TABLE[i.kind]}.updated_at`).bind(uid, i.key, i.value, i.updated_at, del));
    }
  }
  const result = { ok: true, received: items.length, conflicts };
  stmts.unshift(env.DB.prepare('INSERT INTO migration_uploads (user_id, upload_id, result, created_at) VALUES (?1, ?2, ?3, ?4)').bind(uid, b.upload_id, JSON.stringify(result), now));
  try { await env.DB.batch(stmts); } catch (e) {
    if (!/UNIQUE/i.test(String(e))) throw e;
    const again = await env.DB.prepare('SELECT result FROM migration_uploads WHERE user_id = ?1 AND upload_id = ?2').bind(uid, b.upload_id).first<{ result: string }>();
    if (!again) throw e;
    return json({ ...JSON.parse(again.result), replay: true });
  }
  return json(result);
}

/** GET /api/sync: everything stored for the user (conflict copies included and flagged). */
export async function pull(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const q = (k: Kind, extra = '0 AS conflict') => env.DB.prepare(`SELECT '${k}' AS kind, key, value, updated_at, deleted, ${extra} FROM ${TABLE[k]} WHERE user_id = ?1`).bind(c.sub);
  const r = await env.DB.batch([q('progress'), q('note', 'conflict'), q('annotation')]) as unknown as { results: unknown[] }[];
  return json({ items: r.flatMap((x) => x.results) });
}
