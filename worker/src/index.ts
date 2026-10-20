import { getChunk } from './chunks.ts';
import { json, preflight, withCors, type Env } from './http.ts';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    if (req.method === 'OPTIONS') return preflight(req, env);
    let res: Response;
    const m = /^\/api\/chunks\/([a-z0-9-]{1,40})\.json$/.exec(url.pathname);
    if (m && req.method === 'GET') res = await getChunk(req, env, m[1]);
    else res = json({ error: 'not_found' }, 404);
    return withCors(res, req, env);
  },
} satisfies ExportedHandler<Env>;
