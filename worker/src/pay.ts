import bundles from './bundles.json' with { type: 'json' };
import { auth, json, type Env } from './http.ts';

const DAY = 86400e3, YEAR = (bundles.days as number) * DAY;
type Bundle = { price: number; entitlements: string[] };
const BUNDLES = bundles.bundles as Record<string, Bundle>;
/** What the gateway's own server-side API says about a payment. Never built from browser/IPN form fields. */
export type Validation = { status: string; tran_id: string; amount: string; currency: string; val_id: string };
export type Gateway = {
  init(o: { order_id: string; amount: string; currency: string; bundle: string; name: string; email: string; phone: string; urls: Record<string, string> }): Promise<string>;
  validate(valId: string): Promise<Validation | null>;
  query(orderId: string): Promise<Validation | null>;
  verifySign(form: Record<string, string>): Promise<boolean>;
};
export const payDeps = { now: () => Date.now(), gateway: (env: Env): Gateway => sslcommerz(env) };

/** "1200.00" -> 120000 (exact, no floats). */
export function toMinor(s: string): number | null {
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(String(s).trim());
  return m ? Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0')) : null;
}
const fmt = (minor: number) => (minor / 100).toFixed(2);

function sslcommerz(env: Env): Gateway {
  const base = env.SSLCOMMERZ_BASE || 'https://sandbox.sslcommerz.com';
  const cred = { store_id: env.SSLCOMMERZ_STORE_ID ?? '', store_passwd: env.SSLCOMMERZ_STORE_PASSWORD ?? '' };
  const pick = (e: Record<string, string>): Validation => ({ status: e.status, tran_id: e.tran_id, val_id: e.val_id,
    amount: e.currency_amount || e.amount, currency: e.currency_type || e.currency });
  const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  const md5 = async (s: string) => hex(await crypto.subtle.digest('MD5', new TextEncoder().encode(s)));
  return {
    async init(o) {
      const r = await fetch(base + '/gwprocess/v4/api.php', { method: 'POST', body: new URLSearchParams({ ...cred,
        total_amount: o.amount, currency: o.currency, tran_id: o.order_id, success_url: o.urls.success, fail_url: o.urls.fail,
        cancel_url: o.urls.cancel, ipn_url: o.urls.ipn, cus_name: o.name || 'Customer', cus_email: o.email || 'noreply@example.com',
        cus_phone: o.phone || '01700000000', cus_add1: 'N/A', cus_city: 'N/A', cus_country: 'Bangladesh', shipping_method: 'NO',
        product_name: o.bundle, product_category: 'education', product_profile: 'non-physical-goods', num_of_item: '1' }) });
      const j = (await r.json()) as { status?: string; GatewayPageURL?: string };
      if (j.status !== 'SUCCESS' || !j.GatewayPageURL) throw new Error('gateway_init');
      return j.GatewayPageURL;
    },
    async validate(valId) {
      const r = await fetch(base + '/validator/api/validationserverAPI.php?' + new URLSearchParams({ ...cred, val_id: valId, format: 'json', v: '1' }));
      return r.ok ? pick((await r.json()) as Record<string, string>) : null;
    },
    async query(orderId) {
      const r = await fetch(base + '/validator/api/merchantTransIDvalidationAPI.php?' + new URLSearchParams({ ...cred, tran_id: orderId, format: 'json' }));
      if (!r.ok) return null;
      const el = (((await r.json()) as { element?: Record<string, string>[] }).element ?? []);
      const e = el.find((x) => x.status === 'VALID' || x.status === 'VALIDATED') ?? el[0];
      return e ? pick(e) : null;
    },
    async verifySign(f) {
      if (!f.verify_sign || !f.verify_key) return false;
      const keys = [...f.verify_key.split(','), 'store_passwd'].sort();
      const data: Record<string, string> = { ...f, store_passwd: await md5(cred.store_passwd) };
      return (await md5(keys.map((k) => k + '=' + (data[k] ?? '')).join('&'))) === f.verify_sign;
    },
  };
}

/** Apply a gateway-verified result. Idempotent: payment_events.event_id is unique and the grant only runs while the order is unpaid. */
export async function settle(env: Env, v: Validation): Promise<'paid' | 'duplicate' | 'mismatch' | 'failed' | 'pending' | 'unknown'> {
  const now = payDeps.now();
  const o = await env.DB.prepare('SELECT order_id, bundle, amount_minor, currency, status FROM payment_orders WHERE order_id = ?1').bind(v.tran_id).first<{ order_id: string; bundle: string; amount_minor: number; currency: string; status: string }>();
  if (!o) return 'unknown';
  if (v.status === 'FAILED' || v.status === 'CANCELLED' || v.status === 'EXPIRED') {
    await env.DB.prepare("UPDATE payment_orders SET status = ?2, updated_at = ?3 WHERE order_id = ?1 AND status = 'pending'")
      .bind(o.order_id, v.status === 'FAILED' ? 'failed' : 'cancelled', now).run();
    return 'failed';
  }
  if (v.status !== 'VALID' && v.status !== 'VALIDATED') return 'pending';
  if (v.currency !== o.currency || toMinor(v.amount) !== o.amount_minor || !v.val_id) return 'mismatch';
  if (o.status === 'paid') return 'duplicate';
  const unpaid = "FROM payment_orders o WHERE o.order_id = ?1 AND o.status != 'paid'";
  const stmts = [env.DB.prepare('INSERT INTO payment_events (event_id, order_id, status, created_at) VALUES (?1, ?2, ?3, ?4)').bind(v.val_id, o.order_id, v.status, now)];
  for (const e of BUNDLES[o.bundle].entitlements)
    stmts.push(env.DB.prepare(`INSERT INTO entitlements (user_id, entitlement, expires_at, source, note, created_at, updated_at)
      SELECT o.user_id, ?2, ?3 + ?4, 'payment', o.order_id, ?3, ?3 ${unpaid}
      ON CONFLICT (user_id, entitlement) DO UPDATE SET expires_at = MAX(entitlements.expires_at, ?3) + ?4, source = 'payment', note = excluded.note, updated_at = ?3`)
      .bind(o.order_id, e, now, YEAR));
  stmts.push(env.DB.prepare(`INSERT INTO receipts (order_id, receipt_no, user_id, bundle, amount_minor, currency, issued_at)
    SELECT o.order_id, 'R' || printf('%07d', o.id), o.user_id, o.bundle, o.amount_minor, o.currency, ?2 ${unpaid}`).bind(o.order_id, now));
  stmts.push(env.DB.prepare("UPDATE payment_orders SET status = 'paid', gateway_ref = ?2, paid_at = ?3, updated_at = ?3 WHERE order_id = ?1 AND status != 'paid'")
    .bind(o.order_id, v.val_id, now));
  try { await env.DB.batch(stmts); } catch (e) {
    if (/UNIQUE/i.test(String(e))) return 'duplicate';
    throw e;
  }
  return 'paid';
}

const form = async (req: Request) => Object.fromEntries(new URLSearchParams(req.method === 'POST' ? (await req.text()).slice(0, 8192) : new URL(req.url).search)) as Record<string, string>;
const validId = (s: unknown) => typeof s === 'string' && /^[\w-]{1,64}$/.test(s);

export async function checkout(req: Request, env: Env): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const b = (await req.json().catch(() => ({}))) as { bundle?: string };
  if (!b.bundle || !Object.hasOwn(BUNDLES, b.bundle)) return json({ error: 'bad_bundle' }, 400);
  const u = await env.DB.prepare('SELECT display_name, email, phone FROM users WHERE id = ?1').bind(c.sub).first<{ display_name: string; email: string | null; phone: string | null }>();
  if (!u) return json({ error: 'unauthorized' }, 401);
  const now = payDeps.now(), id = 'o' + crypto.randomUUID().replace(/-/g, '').slice(0, 24), minor = BUNDLES[b.bundle].price * 100;
  await env.DB.prepare("INSERT INTO payment_orders (order_id, user_id, bundle, amount_minor, currency, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?6)")
    .bind(id, c.sub, b.bundle, minor, bundles.currency, now).run();
  const api = new URL(req.url).origin + '/api/pay/';
  try {
    const redirect = await payDeps.gateway(env).init({ order_id: id, amount: fmt(minor), currency: bundles.currency, bundle: b.bundle,
      name: u.display_name, email: u.email ?? '', phone: u.phone ?? '',
      urls: { success: api + 'return?order_id=' + id, fail: api + 'return?order_id=' + id, cancel: api + 'return?order_id=' + id, ipn: api + 'ipn' } });
    return json({ order_id: id, redirect_url: redirect, amount: fmt(minor), currency: bundles.currency });
  } catch { return json({ error: 'gateway_unavailable', order_id: id }, 502); }
}

/** Gateway server-to-server notification. The form is only a hint: the result comes from the gateway's validation API. */
export async function ipn(req: Request, env: Env): Promise<Response> {
  const f = await form(req), gw = payDeps.gateway(env);
  if (!validId(f.val_id) || !(await gw.verifySign(f))) return json({ error: 'bad_ipn' }, 400);
  const v = await gw.validate(f.val_id);
  if (!v || v.tran_id !== f.tran_id) return json({ error: 'not_verified' }, 400);
  return json({ result: await settle(env, v) });
}

/** Browser return from the gateway (success/fail/cancel). Re-verifies server-side, then sends the user to the order page. */
export async function payReturn(req: Request, env: Env): Promise<Response> {
  const q = new URL(req.url).searchParams, f = await form(req), id = q.get('order_id') ?? '';
  if (validId(f.val_id)) { const v = await payDeps.gateway(env).validate(f.val_id); if (v && v.tran_id === id) await settle(env, v); }
  const app = env.APP_URL || '/';
  return new Response(null, { status: 303, headers: { Location: app + '#/account/order/' + (validId(id) ? id : ''), 'Cache-Control': 'no-store' } });
}

/** Order status for its owner. A pending order is re-checked with the gateway, so late confirmations resolve without an IPN. */
export async function order(req: Request, env: Env, id: string): Promise<Response> {
  const c = await auth(req, env);
  if (!c) return json({ error: 'unauthorized' }, 401);
  const sel = 'SELECT order_id, bundle, amount_minor, currency, status, created_at, paid_at FROM payment_orders WHERE order_id = ?1 AND user_id = ?2';
  let o = await env.DB.prepare(sel).bind(id, c.sub).first<{ status: string; created_at: number }>();
  if (!o) return json({ error: 'not_found' }, 404);
  if (o.status === 'pending') {
    const v = await payDeps.gateway(env).query(id).catch(() => null);
    if (v && v.tran_id === id) await settle(env, v);
    else if (!v && payDeps.now() - o.created_at > 2 * 3600e3)  // abandoned: nothing at the gateway after 2 h
      await env.DB.prepare("UPDATE payment_orders SET status = 'cancelled', updated_at = ?2 WHERE order_id = ?1 AND status = 'pending'").bind(id, payDeps.now()).run();
    o = await env.DB.prepare(sel).bind(id, c.sub).first();
  }
  const receipt = await env.DB.prepare('SELECT receipt_no, bundle, amount_minor, currency, issued_at FROM receipts WHERE order_id = ?1').bind(id).first();
  return json({ order: o, receipt });
}

/** Public price list for the upgrade dialog (prices are only ever read from here, never from the client). */
export function bundleList() {
  const names = bundles.names as Record<string, string>;
  return { currency: bundles.currency, bundles: Object.entries(BUNDLES).map(([id, b]) => ({ id, name: names[id], price: b.price.toFixed(2), currency: bundles.currency })) };
}
