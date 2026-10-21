/* Daily welcome + idle warm-up + pre-draw + personal touch. TypeScript port of the legacy welcome.js (Stage 4); behaviour unchanged.
   The welcome shows at most once per 24 hours (and never on a first-ever visit, where the tour greets you). */
import { WELCOME_CSS } from './welcome-css.ts';

declare global { interface Window { zzPersonalise?: () => void } }   // window.zzStore is declared in src/storage/browser.ts (always set: bundle or inline shim)
interface ViewState { streak?: { n?: number }; learned?: unknown[]; mcq?: { p?: Record<string, { n?: number; k?: number } | undefined> } }
type IdleFn = (d?: IdleDeadline) => void;
interface NetInfo { saveData?: boolean; effectiveType?: string }
const netInfo = (): NetInfo | undefined => (navigator as Navigator & { connection?: NetInfo }).connection;

const K = 'zzWelcomeAt', DAY = 864e5, now = Date.now();
const get = (k: string): string | null => { try { return window.zzStore!.getItem(k); } catch { return null; } };
const set = (k: string, v: string): void => { try { window.zzStore!.setItem(k, v); } catch { /* storage unavailable: skip */ } };
const state = (): ViewState => { try { return (JSON.parse(get('vivaState') || '{}') as ViewState | null) || {}; } catch { return {}; } };
type Part = 'morning' | 'afternoon' | 'evening' | 'night';
const part = (h = new Date().getHours()): Part => (h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night');
const greet = (): string => { const p = part(); return p === 'night' ? 'Studying late' : 'Good ' + p; };
const nm = (): string => (get('zzName') || '').trim().slice(0, 40);
interface Acct { signedIn?: () => boolean; user?: () => { display_name?: string } | null; me?: () => Promise<{ entitlements?: { entitlement: string; expires_at: number }[]; now?: number } | null> }
const acct = (): Acct | undefined => (window as unknown as { zzAccount?: Acct }).zzAccount;
/** First name only: the name the owner typed, else the account name (but not the generated "User 1234"). */
const first = (): string => {
  const a = acct(), u = a && a.signedIn && a.signedIn() && a.user ? a.user() : null, d = (u && u.display_name) || '';
  return (nm() || (/^User \d{4}$/.test(d) ? '' : d)).trim().split(/\s+/)[0]!.slice(0, 24);
};
const ICON: Record<Part, string> = {
  morning: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  afternoon: '<circle cx="12" cy="12" r="4.5"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21"/>',
  evening: '<path d="M3 17h18M6.5 17a5.5 5.5 0 0 1 11 0M12 6.5V9M5.2 9.7l1.4 1.4M18.8 9.7l-1.4 1.4"/>',
  night: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
};
const TIPS = ['Say the answer out loud before you open it; recall beats rereading.', 'Ten focused minutes a day beats one long cram on the weekend.',
  'Mark a card as learned only when you could explain it to a friend.', 'Mix chapters in Practice: switching topics makes memory stick.', 'Revisit your bookmarks the day after you save them.'];
const idle = (f: IdleFn, timeout = 4000): void => { (window.requestIdleCallback || ((c: IdleFn) => setTimeout(c, 1500)))(f, { timeout }); };
const raf2 = (f: () => void): void => { requestAnimationFrame(() => { requestAnimationFrame(f); }); };

function css(): void {
  if (document.getElementById('zz-w-css')) return;
  const st = document.createElement('style'); st.id = 'zz-w-css'; st.textContent = WELCOME_CSS; document.head.appendChild(st);
}
function stats(): { n: number; l: number } { const s = state(); return { n: (s.streak && s.streak.n) || 0, l: (s.learned || []).length }; }
/** The last question studied on this device, read from the page itself (title and where it lives). */
function lastCard(): { t: string; href: string } | null {
  const r = (state() as { recent?: unknown[] }).recent, id = Array.isArray(r) && typeof r[0] === 'string' ? r[0] : '';
  const c = id ? document.getElementById(id) : null, v = c && c.closest('.view'), h = c && c.querySelector('h4');
  return c && v && h ? { t: (h.textContent || '').trim(), href: '#/' + v.id.slice(2) + '/' + id } : null;
}
/** One useful line: continue where you left off, else streak or progress, else a first step, else a short tip. */
function usefulLine(sp: HTMLElement): void {
  const st = stats(), last = lastCard(), streak = st.n > 1 ? st.n + '-day streak' : '';
  sp.textContent = '';
  if (last) {
    const a = document.createElement('a'); a.href = last.href; a.textContent = last.t.length > 48 ? last.t.slice(0, 46).trimEnd() + '\u2026' : last.t;
    sp.append('Continue: ', a); if (streak) sp.append(' \u00b7 ' + streak);
  } else if (streak) sp.textContent = 'You\u2019re on a ' + streak + '. ' + (st.l ? st.l + ' questions learned so far.' : 'Keep it going today.');
  else if (st.l) sp.textContent = st.l + ' questions learned so far. One short session builds on that.';
  else { const a = document.createElement('a'); a.href = '#/01'; a.textContent = 'Start with topic 01'; sp.append(a, ' \u2014 it\u2019s free, and ten minutes is enough.'); }
  if (!sp.textContent) sp.textContent = TIPS[new Date().getDate() % TIPS.length]!;
}
/** Plan badge (free or paid), filled in once the account is known; the banner is an overlay, so nothing shifts. */
function planBadge(el: HTMLElement): void {
  const a = acct(); const ready = (window as unknown as { zzAuthReady?: Promise<unknown> }).zzAuthReady || Promise.resolve();
  ready.then(() => {
    if (!a || !a.signedIn || !a.signedIn() || !a.me) return null;
    return a.me();
  }).then((m) => {
    if (!m) return;
    const t = m.now || Date.now(), on = (m.entitlements || []).filter((e) => e.expires_at > t).map((e) => e.entitlement);
    el.textContent = on.length >= 3 ? 'All access' : on.length ? 'Pro: ' + on.map((e) => ({ qna: 'Questions', mcq: 'MCQs', textbook: 'Textbook' } as Record<string, string>)[e] || e).join(' + ') : 'Free plan';
    el.className = 'zw-plan ' + (on.length ? 'zw-paid' : 'zw-free'); el.hidden = false;
  }).catch(() => {});
}

/* every open: a quiet card at the top (an overlay, so the page never shifts) */
function banner(): void {
  css(); const p = part(), f = first();
  const d = document.createElement('div'); d.className = 'zz-welcome zw-' + p; d.setAttribute('role', 'status');
  d.innerHTML = '<div class="zw-i" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICON[p] + '</svg></div><div class="zw-t"><b></b><i class="zw-plan" hidden></i><span></span></div>' +
    '<button type="button" aria-label="Dismiss"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
  d.querySelector('b')!.textContent = greet() + (f ? ', ' + f : '');
  usefulLine(d.querySelector('span')!); planBadge(d.querySelector('.zw-plan')!);
  document.body.appendChild(d);
  let t: ReturnType<typeof setTimeout>;
  const close = (): void => { clearTimeout(t); d.classList.remove('on'); setTimeout(() => { d.remove(); }, 400); };
  const arm = (): void => { clearTimeout(t); t = setTimeout(close, 7000); };
  d.querySelector('button')!.onclick = close;
  d.addEventListener('pointerenter', () => { clearTimeout(t); }); d.addEventListener('pointerleave', arm);
  d.addEventListener('focusin', () => { clearTimeout(t); }); d.addEventListener('focusout', arm);
  d.querySelector('span a')?.addEventListener('click', close);
  raf2(() => { d.classList.add('on'); }); arm();
}

/* once a day: a centred card, which also asks for the owner's name */
function daily(away: boolean): void {
  css(); const st = stats(), o = document.createElement('div');
  o.className = 'zz-wd'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'zz-wh');
  o.innerHTML = '<div class="zc zw-' + part() + '"><div class="zi" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICON[part()] + '</svg></div><h2 id="zz-wh"></h2><p></p><label for="zz-wn">What should we call you?</label><input id="zz-wn" type="text" maxlength="40" autocomplete="given-name" placeholder="First name"><button type="button">Start studying</button></div>';
  o.querySelector('h2')!.textContent = greet() + (first() ? ', ' + first() : '');
  o.querySelector('p')!.textContent = away ? 'Welcome back — it’s been a little while. Even ten minutes today counts.' : st.n > 1 ? 'Welcome back! You’re on a ' + st.n + '-day revision streak.' : 'Welcome to your daily revision. A little every day goes a long way.';
  const inp = o.querySelector('input')!; inp.value = nm(); document.body.appendChild(o);
  const done = (): void => { const v = inp.value.trim().slice(0, 40); if (v) set('zzName', v); o.classList.remove('on'); setTimeout(() => { o.remove(); if (v) banner(); }, 350); };
  o.querySelector('button')!.onclick = done; inp.onkeydown = (e) => { if (e.key === 'Enter') done(); };
  o.addEventListener('click', (e) => { if (e.target === o) done(); });
  raf2(() => { o.classList.add('on'); });
}
function maybe(): void {
  const last = get(K), first = last === null && get('vivaState') === null;
  if (first) { set(K, String(now)); return; }
  if (document.querySelector('.tour,.tut,[data-tour]')) return;
  if (last === null || now - (+last) >= DAY) { const away = last !== null && now - (+last) > 2 * DAY; daily(away); set(K, String(now)); } else banner();
}
window.addEventListener('load', () => { setTimeout(maybe, 900); });

/* warm-up: once the page is idle, fetch the textbook chapters and decode hero images so later taps feel instant */
window.addEventListener('load', () => { idle(() => {
  try { const c = netInfo(); if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return; } catch { /* ignore */ }
  const gated = ((window as unknown as { ZZ_MANIFEST?: { gated?: string[] } | null }).ZZ_MANIFEST || {}).gated || [];  // locked chapters are not static files
  for (let n = 1; n <= 29; n++) { const id = 'ch' + (n < 10 ? '0' : '') + n; if (gated.indexOf('tb-' + id) >= 0) continue; const u = 'textbook/' + id + '.html'; idle(() => { fetch(u, { cache: 'force-cache' }).catch(() => {}); }); }
  document.querySelectorAll('img').forEach((im) => { if (im.decode) im.decode().catch(() => {}); });
}); });

/* pre-draw: on wide screens, once idle, switch the current page's off-screen sections to "fully rendered" in small time-boxed batches */
{
  const SEL = '.card,.qi,.row,.topic,.nh-ch,.nh-mr'; let gen = 0;
  const run = (): void => {
    const g = ++gen;
    if (innerWidth < 700) return;
    try { if (netInfo()?.saveData) return; } catch { /* ignore */ }
    const v = document.querySelector('.view:not([hidden])'); if (!v) return;
    const list = Array.prototype.slice.call(v.querySelectorAll<HTMLElement>(SEL)).filter((e: HTMLElement) => !e.dataset['zzp']) as HTMLElement[];
    let i = 0;
    const step = (dl?: IdleDeadline): void => {
      if (g !== gen) return;
      while (i < list.length && (dl && dl.timeRemaining ? dl.timeRemaining() > 6 : true)) {
        for (let k = 0; k < 12 && i < list.length; k++, i++) { const el = list[i]!; el.style.contentVisibility = 'visible'; el.dataset['zzp'] = '1'; }
        if (!dl || !dl.timeRemaining) break;
      }
      if (i < list.length) idle(step, 800);
    };
    (window.requestIdleCallback || ((c: IdleFn) => setTimeout(c, 300)))(step, { timeout: 1500 });
  };
  window.addEventListener('load', () => { setTimeout(run, 1800); });
  window.addEventListener('hashchange', () => { setTimeout(run, 900); });
}

/* personal touch: once a name is saved, each page's header gets a short line addressed to the owner */
{
  const acc = (S: ViewState): { n: number; a: number } => {
    const P = (S.mcq && S.mcq.p) || {}; let n = 0, k = 0;
    Object.keys(P).forEach((h) => { const x = P[h]; if (x && x.n) { n += x.n; k += x.k || 0; } });
    return { n, a: n ? Math.round(100 * k / n) : 0 };
  };
  const line = (id: string, N: string, S: ViewState): string => {
    const l = (S.learned || []).length, n = (S.streak && S.streak.n) || 0, m = acc(S);
    if (id === 'v-home') return n > 1 ? N + ', you’re on a ' + n + '-day streak. Let’s keep it going.' : l ? N + ', ' + l + ' questions learned so far. Let’s add more.' : N + ', let’s start your first revision.';
    if (id === 'v-menu') return N + ', everything of yours lives here.';
    if (id === 'v-mcqs') return m.n ? N + ', your accuracy is ' + m.a + '% over ' + m.n + ' answers. ' + (m.a >= 70 ? 'Strong work!' : 'Every attempt makes it stronger.') : N + ', answer a few MCQs and I’ll track your accuracy.';
    if (id === 'v-practice') return N + ', ready to test yourself?';
    if (id === 'v-textbook') return N + ', pick up your reading wherever you like.';
    if (id === 'v-questions') return N + ', 1,310 questions are ready when you are.';
    if (id === 'v-bookmarks') return N + ', these are the questions you wanted to come back to.';
    if (id === 'v-favourites') return N + ', your favourites, all in one place.';
    if (id === 'v-notes') return N + ', your own words, saved on this device.';
    if (/^v-(c?\d+)$/.test(id)) return N + ', one question at a time — you’ve got this.';
    return '';
  };
  const hiCss = (): void => { if (document.getElementById('zz-hi-css')) return; const t = document.createElement('style'); t.id = 'zz-hi-css'; t.textContent = '.zz-hi{margin:8px 0 0;font:600 .95rem/1.4 var(--body,system-ui,sans-serif);color:var(--burgundy2,#93304A)}'; document.head.appendChild(t); };
  const apply = (): void => {
    document.querySelectorAll('.zz-hi').forEach((e) => { e.remove(); });
    const N = nm(); if (!N) return;
    const v = document.querySelector('.view:not([hidden])'); if (!v) return;
    const t = line(v.id, N, state()); if (!t) return;
    const a = v.querySelector('.lede') || v.querySelector('h1'); if (!a) return;
    hiCss(); const p = document.createElement('p'); p.className = 'zz-hi'; p.textContent = t; a.insertAdjacentElement('afterend', p);
  };
  window.zzPersonalise = apply;
  const later = (): void => { apply(); setTimeout(apply, 400); setTimeout(apply, 1500); };
  window.addEventListener('load', later); window.addEventListener('hashchange', later);
  document.addEventListener('click', (e) => { const t = e.target as Element | null; if (t && t.closest && t.closest('.zz-wd button')) setTimeout(apply, 500); }, true);
}
export {};
