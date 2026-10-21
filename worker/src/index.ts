import { getChunk } from './chunks.ts';
import { google, otpStart, otpVerify, refresh, logout, me, devices, removeDevice } from './auth.ts';
import { checkout, ipn, payReturn, order, bundleList } from './pay.ts';
import { upload, pull } from './sync.ts';
import { json, preflight, withCors, type Env } from './http.ts';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    if (req.method === 'OPTIONS') return preflight(req, env);
    let res: Response;
    const m = /^\/api\/chunks\/([a-z0-9-]{1,40})\.json$/.exec(url.pathname);
    const post: Record<string, (r: Request, e: Env) => Promise<Response>> = {
      '/api/auth/google': google, '/api/auth/otp/start': otpStart, '/api/auth/otp/verify': otpVerify,
      '/api/auth/refresh': refresh, '/api/auth/logout': logout, '/api/pay/checkout': checkout, '/api/sync/upload': upload,
    };
    const o = /^\/api\/pay\/orders\/([\w-]{1,64})$/.exec(url.pathname);
    if (url.pathname === '/api/pay/ipn' && req.method === 'POST') return ipn(req, env); // gateway server: no CORS, form body
    if (url.pathname === '/api/pay/return' && (req.method === 'POST' || req.method === 'GET')) return payReturn(req, env);
    if (m && req.method === 'GET') res = await getChunk(req, env, m[1]);
    else if (o && req.method === 'GET') res = await order(req, env, o[1]);
    else if (url.pathname === '/api/me' && req.method === 'GET') res = await me(req, env);
    else if (url.pathname === '/api/devices' && req.method === 'GET') res = await devices(req, env);
    else if (url.pathname.startsWith('/api/devices/') && req.method === 'DELETE' && /^[\w-]{8,64}$/.test(url.pathname.slice(13))) res = await removeDevice(req, env, url.pathname.slice(13));
    else if (url.pathname === '/api/sync' && req.method === 'GET') res = await pull(req, env);
    else if (url.pathname === '/api/bundles' && req.method === 'GET') res = json(bundleList(), 200, { 'Cache-Control': 'public, max-age=300' });
    else if (url.pathname === '/api/config' && req.method === 'GET') res = json({ google_client_id: env.GOOGLE_CLIENT_ID || null }, 200, { 'Cache-Control': 'public, max-age=300' });
    else if (req.method === 'POST' && Object.hasOwn(post, url.pathname))
      res = /^application\/json\b/.test(req.headers.get('Content-Type') ?? '') ? await post[url.pathname](req, env) : json({ error: 'json_required' }, 415);
    else res = json({ error: 'not_found' }, 404);
    return withCors(res, req, env);
  },
} satisfies ExportedHandler<Env>;
