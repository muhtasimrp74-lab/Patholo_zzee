// HS256 JWT with WebCrypto. Only HS256 is accepted; exp is required.
const enc = new TextEncoder();
const b64u = (b: Uint8Array): string => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string): Uint8Array => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const key = (secret: string) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export type Claims = { sub: string; exp: number; iat?: number; typ?: string; sid?: string; [k: string]: unknown };

export async function sign(claims: Claims, secret: string): Promise<string> {
  const head = b64u(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64u(enc.encode(JSON.stringify(claims)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(head + '.' + body)));
  return head + '.' + body + '.' + b64u(sig);
}

/** Returns the claims, or null for any malformed, forged, wrong-type or expired token. `now` is in seconds. */
export async function verify(token: string, secret: string, typ: string, now = Math.floor(Date.now() / 1000)): Promise<Claims | null> {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s || token.split('.').length !== 3) return null;
    if (JSON.parse(new TextDecoder().decode(unb64u(h))).alg !== 'HS256') return null;
    if (!(await crypto.subtle.verify('HMAC', await key(secret), unb64u(s), enc.encode(h + '.' + b)))) return null;
    const c = JSON.parse(new TextDecoder().decode(unb64u(b))) as Claims;
    if (typeof c.sub !== 'string' || typeof c.exp !== 'number' || c.exp <= now || c.typ !== typ) return null;
    return c;
  } catch {
    return null;
  }
}
