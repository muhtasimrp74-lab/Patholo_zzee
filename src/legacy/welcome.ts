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
const greet = (): string => { const h = new Date().getHours(); return h < 5 ? 'Burning the midnight oil' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const nm = (): string => (get('zzName') || '').trim().slice(0, 40);
const idle = (f: IdleFn, timeout = 4000): void => { (window.requestIdleCallback || ((c: IdleFn) => setTimeout(c, 1500)))(f, { timeout }); };
const raf2 = (f: () => void): void => { requestAnimationFrame(() => { requestAnimationFrame(f); }); };

function css(): void {
  if (document.getElementById('zz-w-css')) return;
  const st = document.createElement('style'); st.id = 'zz-w-css'; st.textContent = WELCOME_CSS; document.head.appendChild(st);
}
function stats(): { n: number; l: number } { const s = state(); return { n: (s.streak && s.streak.n) || 0, l: (s.learned || []).length }; }

/* every open: the small banner at the top */
function banner(): void {
  css(); const st = stats();
  const sub = st.n > 1 ? 'You’re on a ' + st.n + '-day revision streak. Keep it glowing!' : st.l ? st.l + ' questions learned so far. One more session builds on that.' : 'A few questions a day adds up faster than you think.';
  const d = document.createElement('div'); d.className = 'zz-welcome'; d.setAttribute('role', 'status');
  d.innerHTML = '<div class="zw-i" aria-hidden="true">✨</div><div class="zw-t"><b></b><span></span></div><button type="button" aria-label="Dismiss">×</button>';
  d.querySelector('b')!.textContent = greet() + (nm() ? ', ' + nm() : '') + ', welcome back!'; d.querySelector('span')!.textContent = sub; document.body.appendChild(d);
  let t: ReturnType<typeof setTimeout>;
  const close = (): void => { clearTimeout(t); d.classList.remove('on'); setTimeout(() => { d.remove(); }, 600); };
  d.querySelector('button')!.onclick = close;
  raf2(() => { d.classList.add('on'); }); t = setTimeout(close, 6000);
}

/* once a day: a centred card, which also asks for the owner's name */
function daily(away: boolean): void {
  css(); const st = stats(), o = document.createElement('div');
  o.className = 'zz-wd'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'zz-wh');
  o.innerHTML = '<div class="zc"><div class="zi" aria-hidden="true">✨</div><h2 id="zz-wh"></h2><p></p><label for="zz-wn">Your name</label><input id="zz-wn" type="text" maxlength="40" autocomplete="given-name" placeholder="Type your name"><button type="button">Let’s study</button></div>';
  o.querySelector('h2')!.textContent = greet() + '!';
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
  for (let n = 1; n <= 29; n++) { const u = 'textbook/ch' + (n < 10 ? '0' : '') + n + '.html'; idle(() => { fetch(u, { cache: 'force-cache' }).catch(() => {}); }); }
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
