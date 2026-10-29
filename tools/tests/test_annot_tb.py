"""Annotation tests, Phase 4: the Textbook adapter (stable block ids, anchoring, re-anchoring, detached marks, margin notes, virtualised layers).
Chapters are fetched over HTTP, so a tiny local static server is started for the browser tests.
Synthetic PointerEvents stand in for real devices; nothing here proves behaviour on a real iPad / Apple Pencil / S Pen."""
import os, re, json, hashlib, subprocess, sys, threading, functools, http.server, unittest
from html.parser import HTMLParser
from pathlib import Path
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CH = 'ch05'; KEY = 't:' + CH
BLOCKS = {'p', 'li', 'table', 'figure', 'aside', 'h3', 'h4', 'h5'}

DRAW = """([pts, o])=>{const id=o.id||1,t=o.type||'pen';
 const mk=(n,q,b)=>new PointerEvent(n,{pointerId:id,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:q[0],clientY:q[1],pressure:t==='pen'?(q[2]==null?.5:q[2]):(b?.5:0),buttons:b,button:0});
 const el=document.elementFromPoint(pts[0][0],pts[0][1])||document.body;el.dispatchEvent(mk('pointerdown',pts[0],1));pts.slice(1).forEach(q=>document.dispatchEvent(mk('pointermove',q,1)));document.dispatchEvent(mk('pointerup',pts[pts.length-1],0))}"""
TAP = """([x,y,t])=>{const mk=n=>new PointerEvent(n,{pointerId:7,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:x,clientY:y,buttons:n==='pointerdown'?1:0,button:0});
 (document.elementFromPoint(x,y)||document.body).dispatchEvent(mk('pointerdown'));document.dispatchEvent(mk('pointerup'))}"""
VIS = """([minH])=>{const hb=innerHeight,es=[...document.querySelectorAll('#tbbody p[data-b],#tbbody li[data-b]')].filter(e=>{const r=e.getBoundingClientRect();return r.top>70&&r.bottom<hb-30&&r.height>=minH&&r.width>150&&e.textContent.trim().length>=60});
 return es.map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.b,l:r.left,t:r.top,w:r.width,h:r.height}})}"""
SELECT = """([id,a,b])=>{const el=document.querySelector('#tbbody [data-b="'+id+'"]'),w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n=w.nextNode();while(n&&!n.nodeValue.trim())n=w.nextNode();
 getSelection().setBaseAndExtent(n,Math.min(a,n.nodeValue.length),n,Math.min(b,n.nodeValue.length));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))}"""

def fnv(s):
    h = 2166136261; b = s.encode('utf-16-le')
    for i in range(0, len(b), 2): h = ((h ^ int.from_bytes(b[i:i + 2], 'little')) * 16777619) & 0xFFFFFFFF
    return '%08x' % h
def norm(t): return re.sub(r'\s+', ' ', t).strip().lower()

class Ids(HTMLParser):
    """Walks a chapter and records every block that should carry a data-b id (same skip rules as the build and the runtime)."""
    def __init__(self): super().__init__(convert_charrefs=True); self.st = []; self.miss = []; self.ids = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('br', 'hr', 'img', 'input', 'meta', 'link'): return
        intable = any(t == 'table' for t in self.st); inli = any(t == 'li' for t in self.st)
        if tag in BLOCKS and not intable and not (tag == 'p' and inli):
            if 'data-b' in a: self.ids.append(a['data-b'])
            else: self.miss.append((tag, self.getpos()))
        elif tag in BLOCKS and 'data-b' in a: self.ids.append(a['data-b'])   # nested ones (e.g. a p inside a table cell) must not have been given one, but never fail on an extra
        self.st.append(tag)
    def handle_startendtag(self, tag, attrs): pass
    def handle_endtag(self, tag):
        while self.st:
            if self.st.pop() == tag: break

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class TextbookAnnot(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop(); cls.srv.shutdown()
    def url(self, ch=CH): return 'http://127.0.0.1:%d/index.full.html#/textbook/%s' % (self.port, ch)
    def page(self, w=1024, h=800, ch=CH, ctx=None, route=None):
        ctx = ctx or self.b.new_context(viewport={'width': w, 'height': h}, service_workers='block'); self.ctx = ctx
        pg = ctx.new_page(); self.errs = []; self.dialogs = []
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        if route: pg.route('**/textbook/%s.html' % ch, route)
        pg.goto(self.url(ch)); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_selector('#tbbody[data-ch] [data-b]'); pg.wait_for_timeout(350); return pg
    def test_ink_buttons_step_aside_while_reading_and_return_on_scroll_up(self):   # phones: they covered the ends of text lines
        pg = self.page(w=412, h=860); pg.wait_for_timeout(900); pg.mouse.move(200, 480)
        FAB = "()=>{const f=document.getElementById('an-fab');if(!f||getComputedStyle(f).display==='none')return null;const r=f.getBoundingClientRect();return r.left<innerWidth&&r.right>0}"
        self.assertTrue(pg.evaluate(FAB), 'the ink buttons show in the reader')
        for _ in range(3):   # the reader may restore its own scroll position once after opening: scroll again if that undid the gesture
            for _ in range(6): pg.mouse.wheel(0, 120); pg.wait_for_timeout(60)
            pg.wait_for_timeout(500)
            if pg.evaluate("()=>document.documentElement.classList.contains('zz-hide')"): break
        self.assertFalse(pg.evaluate(FAB), 'scrolling down slides them off the text')
        pg.mouse.wheel(0, -60); pg.wait_for_timeout(500); self.assertTrue(pg.evaluate(FAB), 'any scroll up brings them back'); self.assertEqual(self.errs, []); self.ctx.close()
    def at(self, pg, y, minH=22):
        for k in range(12):
            pg.evaluate("y=>window.scrollTo({top:y,behavior:'instant'})", y + k * 260); pg.wait_for_timeout(380)
            v = pg.evaluate(VIS, [minH])
            if v: return v
        return v
    def objs(self, pg): return pg.evaluate("k=>{const d=Annot._debug.docs()[k];return d?d.objs.length:0}", KEY)
    def doc(self, pg): return pg.evaluate("k=>Annot._debug.docs()[k]", KEY)
    def draw(self, pg, pts, **o): pg.evaluate(DRAW, [pts, o]); pg.wait_for_timeout(140)
    def tap(self, pg, x, y, typ='mouse'): pg.evaluate(TAP, [x, y, typ]); pg.wait_for_timeout(160)
    def on(self, pg, tool='pen'): pg.evaluate("t=>{Annot._debug.setOn(true);Annot.state().tool=t}", tool)
    def stroke_on(self, v): return [[v['l'] + 20 + i * 6, v['t'] + 8 + (6 if i % 2 else -2) + i * .1, .5] for i in range(30)]
    def rel(self, pg, bid, i=0):
        return pg.evaluate("""([id,i])=>{const el=document.querySelector('#tbbody [data-b="'+id+'"]'),r=el.getBoundingClientRect(),px=Annot._debug.px('t:ch05',i);if(!px)return null;const hr=document.querySelector('#tbbody').getBoundingClientRect();return [px[0][0]-(r.left-hr.left),px[0][1]-(r.top-hr.top)]}""", [bid, i])

    # ---------------------------------------------------------------- build: stable block ids
    def test_block_ids_cover_every_block_are_unique_and_the_build_is_deterministic(self):
        for ch in ('ch01', 'ch05', 'ch12', 'ch29'):
            t = Path(os.path.join(ROOT, 'textbook', ch + '.html')).read_text(encoding='utf8'); w = Ids(); w.feed(t)
            self.assertEqual(w.miss, [], ch); self.assertGreater(len(w.ids), 50, ch)
            self.assertEqual(len(w.ids), len(set(w.ids)), ch + ': ids are unique inside a chapter')
            self.assertTrue(all(re.fullmatch(r'[0-9a-f]{8}(\.\d{1,5})?', i) for i in w.ids), ch)
        files = sorted(f for f in os.listdir(os.path.join(ROOT, 'textbook')) if f.endswith('.html'))
        before = {f: hashlib.md5(Path(os.path.join(ROOT, 'textbook', f)).read_bytes()).hexdigest() for f in files}
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'textbook_build.py')], check=True, stdout=subprocess.DEVNULL)
        after = {f: hashlib.md5(Path(os.path.join(ROOT, 'textbook', f)).read_bytes()).hexdigest() for f in files}
        self.assertEqual(before, after, 'rebuilding must give byte-identical chapters')
        self.assertEqual(len(files), 29)

    def test_build_ids_equal_the_runtime_formula_and_ignore_markup_and_spacing(self):
        pg = self.page(); r = pg.evaluate("""()=>{const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
          const seen={};let bad=0,tot=0;document.querySelectorAll('#tbbody [data-b]').forEach(el=>{const t=(el.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase()||('<'+el.tagName+'>'),h=fnv(t),k=seen[h]=(seen[h]||0)+1,id=k>1?h+'.'+(k-1):h;tot++;if(id!==el.getAttribute('data-b'))bad++});return [bad,tot]}""")
        self.assertEqual(r[0], 0); self.assertGreater(r[1], 300); self.assertEqual(self.errs, [])
        self.assertEqual(fnv('hello'), '4f9f2cab'); self.assertEqual(fnv(norm('  Hello \n  World ')), fnv('hello world'))

    # ---------------------------------------------------------------- ink anchoring, windowed canvases, layout stability
    def test_ink_anchors_to_blocks_canvases_are_windowed_and_ink_stays_put_after_text_size_width_and_rotation(self):
        for w in (390, 768, 1024):
            pg = self.page(w); self.on(pg)
            v = self.at(pg, 12000)[0]; self.draw(pg, self.stroke_on(v))
            o = self.doc(pg)['objs'][0]; self.assertEqual((o['t'], o['a']['b']), ('stroke', v['id'])); self.assertTrue(o['a'].get('t'), 'the block opening words are remembered for re-anchoring')
            win = pg.evaluate("k=>Annot._debug.win(k)", KEY); vh = pg.evaluate("()=>innerHeight"); top = pg.evaluate("()=>document.querySelector('#tbbody').getBoundingClientRect().top")
            self.assertLessEqual(win['y'], -top, w); self.assertGreaterEqual(win['y'] + win['h'], -top + vh, w); self.assertLess(win['h'], 3.6 * vh, w)
            self.assertLess(win['h'], win['H'] / 4, 'a long chapter never gets a canvas as tall as the chapter')
            self.assertLessEqual(pg.evaluate("()=>Annot._debug.canvases()"), 3)
            x0, y0 = self.rel(pg, v['id']); self.assertAlmostEqual(y0, 6, delta=2)
            for fs in (1.3, 0.85, 1):
                pg.evaluate("f=>{document.documentElement.style.setProperty('--fs',f);S.pref=S.pref||{};S.pref.fs=f}", fs); pg.wait_for_timeout(300)
                x, y = self.rel(pg, v['id']); self.assertLess(abs(y - y0), 6 * fs + 1, (w, fs)); self.assertLess(abs(x - x0), 6 + 20 * abs(fs - 1) * 4, (w, fs))
            pg.set_viewport_size({'width': {390: 340, 768: 640, 1024: 900}[w], 'height': 800}); pg.wait_for_timeout(350)
            x, y = self.rel(pg, v['id']); self.assertLess(abs(y - y0), 6, w); self.assertEqual(self.errs, [], w); pg.context.close()

    def test_the_canvas_window_follows_scrolling_and_is_freed_with_the_chapter(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 9000)[0]; self.draw(pg, self.stroke_on(v)); w0 = pg.evaluate("k=>Annot._debug.win(k)", KEY)
        for y in (9300, 14000, 30000, 52000):
            self.at(pg, y); w = pg.evaluate("k=>Annot._debug.win(k)", KEY); top = pg.evaluate("()=>document.querySelector('#tbbody').getBoundingClientRect().top")
            self.assertLessEqual(w['y'], -top); self.assertGreaterEqual(w['y'] + w['h'], -top + 800); self.assertLessEqual(pg.evaluate("()=>Annot._debug.canvases()"), 3)
        self.at(pg, 9000); self.assertEqual(self.rel(pg, v['id'])[1] > 0, True)
        pg.goto(self.url('ch06')); pg.wait_for_selector('#tbbody[data-ch=ch06] [data-b]'); pg.wait_for_timeout(500)
        self.assertEqual(pg.evaluate("()=>Annot._debug.layer('t:ch05')?1:0"), 0, 'the old chapter layer is released'); self.assertEqual(pg.evaluate("()=>Annot._debug.canvases()"), 0)
        self.assertEqual(pg.evaluate("()=>Object.keys(Annot._debug.docs()).sort().join()"), KEY, 'the other chapter has no document of its own, the first keeps its ink'); self.assertEqual(self.errs, [])

    def test_pen_touch_and_mouse_all_draw_in_the_textbook_and_undo_redo_cover_them(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 8000)[0]
        for i, typ in enumerate(('pen', 'touch', 'mouse')):
            pg.wait_for_timeout(1400)   # palm rejection ignores a finger right after the pen
            self.draw(pg, [[q[0], q[1] + i * 4, q[2]] for q in self.stroke_on(v)], type=typ, id=3 + i); self.assertEqual(self.objs(pg), i + 1, typ)
        for n in (2, 1, 0): pg.keyboard.press('Control+z'); self.assertEqual(self.objs(pg), n)
        for n in (1, 2, 3): pg.keyboard.press('Control+Shift+z'); self.assertEqual(self.objs(pg), n)
        self.assertEqual(self.errs, [])

    # ---------------------------------------------------------------- text marks: quote selectors
    def test_text_marks_carry_a_quote_selector_and_stay_on_the_same_words(self):
        for w in (390, 1024):
            pg = self.page(w); self.on(pg, 'hi'); v = self.at(pg, 15000)[0]
            pg.evaluate(SELECT, [v['id'], 4, 34]); pg.wait_for_timeout(300); self.assertEqual(pg.locator('#an-selpop:visible').count(), 1)
            pg.click('#an-selpop [aria-label=Highlight]'); pg.wait_for_timeout(200)
            o = self.doc(pg)['objs'][0]; q = o['q']; self.assertEqual((o['t'], o['a']['b']), ('mark', v['id']))
            same = lambda: pg.evaluate("""([id,s,e,t])=>document.querySelector('#tbbody [data-b="'+id+'"]').textContent.slice(s,e)===t""", [v['id'], q['s'], q['e'], q['t']])
            self.assertTrue(q['t'] and same()); self.assertEqual(q['e'] - q['s'], len(q['t'])); self.assertIn('p', q); self.assertIn('n', q)
            def inside():
                return pg.evaluate("""([id,k])=>{const L=Annot._debug.layer(k),o=Annot._debug.docs()[k].objs[0],rs=Annot._debug.markRects(L,o),el=document.querySelector('#tbbody [data-b="'+id+'"]'),b=el.getBoundingClientRect(),hr=L.host.getBoundingClientRect();
                  return !!rs&&rs.length>0&&rs.every(r=>r[0]>=b.left-hr.left-3&&r[0]+r[2]<=b.right-hr.left+3&&r[1]>=b.top-hr.top-3&&r[1]+r[3]<=b.bottom-hr.top+3)}""", [v['id'], KEY])
            self.assertTrue(inside())
            for fs in (1.3, 0.85, 1):
                pg.evaluate("f=>{document.documentElement.style.setProperty('--fs',f);S.pref=S.pref||{};S.pref.fs=f}", fs); pg.wait_for_timeout(300); self.assertTrue(inside(), (w, fs)); self.assertTrue(same())
            pg.set_viewport_size({'width': 340 if w == 390 else 900, 'height': 800}); pg.wait_for_timeout(350); self.assertTrue(inside()); self.assertTrue(same())
            pg.keyboard.press('Control+z'); self.assertEqual(self.objs(pg), 0); pg.keyboard.press('Control+Shift+z'); self.assertEqual(self.objs(pg), 1); self.assertEqual(self.errs, [], w); pg.context.close()

    def test_selecting_and_copying_text_still_works_with_annotate_off_and_nothing_is_painted(self):
        pg = self.page(); v = self.at(pg, 7000)[0]
        pg.evaluate(SELECT, [v['id'], 0, 30]); self.assertGreater(pg.evaluate("()=>getSelection().toString().length"), 10)
        self.draw(pg, self.stroke_on(v)); self.assertEqual(self.objs(pg), 0, 'annotate is off: pointer input does nothing'); self.assertEqual(pg.evaluate("()=>Annot._debug.canvases()"), 0)
        n = pg.evaluate("()=>document.querySelectorAll('#tbbody mark.tbhl').length"); self.on(pg); self.draw(pg, self.stroke_on(v)); pg.evaluate("()=>Annot._debug.setOn(false)")
        self.assertEqual(pg.evaluate("()=>document.querySelectorAll('#tbbody mark.tbhl').length"), n, 'the book\'s own key-term highlighting is untouched'); self.assertEqual(self.errs, [])

    def test_section_headers_still_collapse_when_annotate_is_off_and_are_not_toggled_by_a_drawing_tool(self):
        pg = self.page(); sec = pg.locator('#tbbody .tbs').nth(1); hd = sec.locator('.tbs-h'); hd.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        hd.click(); self.assertIn('shut', sec.get_attribute('class')); hd.click(); self.assertNotIn('shut', sec.get_attribute('class'))
        self.on(pg, 'pen'); hd.click(); self.assertNotIn('shut', sec.get_attribute('class'), 'with a drawing tool a tap on the header does not collapse the section')
        pg.evaluate("()=>{Annot.state().tool='hand'}"); hd.click(); self.assertIn('shut', sec.get_attribute('class'), 'the hand tool leaves the page interactive'); self.assertEqual(self.errs, [])

    # ---------------------------------------------------------------- collapse, re-anchoring, detached
    def test_collapsed_sections_hide_their_marks_but_keep_them(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 6000)[0]; self.draw(pg, self.stroke_on(v)); self.assertIsNotNone(self.rel(pg, v['id']))
        pg.evaluate("()=>{Annot.state().tool='hand'}")
        pg.evaluate("id=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').closest('.tbs').querySelector('.tbs-h').click()", v['id']); pg.wait_for_timeout(300)
        self.assertIsNone(self.rel(pg, v['id']), 'a collapsed block has nothing to draw on'); self.assertEqual(self.objs(pg), 1, 'but the annotation is kept')
        self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 0, 'hidden is not detached')
        pg.evaluate("id=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').closest('.tbs').querySelector('.tbs-h').click()", v['id']); pg.wait_for_timeout(300)
        self.assertIsNotNone(self.rel(pg, v['id'])); self.assertEqual(self.errs, [])

    def test_edited_text_reanchors_by_quote_and_by_opening_words_and_unmatched_marks_stay_detached_and_can_be_reattached(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 1500}, service_workers='block'); pg = self.page(ctx=ctx); self.on(pg, 'hi')
        vs = self.at(pg, 10000); self.assertGreaterEqual(len(vs), 3); v1, v2, v3 = vs[0], vs[1], vs[2]
        txt = lambda i: pg.evaluate("id=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').textContent", i)
        t1, t2, t3 = txt(v1['id']), txt(v2['id']), txt(v3['id'])
        pg.evaluate(SELECT, [v1['id'], 0, 28]); pg.wait_for_timeout(300); pg.click('#an-selpop [aria-label=Highlight]'); pg.wait_for_timeout(150)
        pg.evaluate("()=>{Annot.state().tool='pen'}"); self.draw(pg, self.stroke_on(v2))
        pg.evaluate("()=>{Annot.state().tool='hi'}"); pg.evaluate(SELECT, [v3['id'], 0, 28]); pg.wait_for_timeout(300); pg.click('#an-selpop [aria-label=Highlight]'); pg.wait_for_timeout(150)
        self.assertEqual(self.objs(pg), 3); pg.evaluate("async()=>{await Annot.flush()}"); pg.close()
        html = Path(os.path.join(ROOT, 'textbook', CH + '.html')).read_text(encoding='utf8')
        def edit(bid, fn):
            nonlocal html
            m = re.search(r'<(p|li) data-b="%s">(.*?)</\1>' % re.escape(bid), html, re.S); self.assertTrue(m, bid)
            inner = fn(m.group(2)); full = txt_of(inner)
            html = html[:m.start()] + '<%s data-b="%s">%s</%s>' % (m.group(1), fnv(norm(full)), inner, m.group(1)) + html[m.end():]; return fnv(norm(full))
        txt_of = lambda inner: re.sub(r'<[^>]+>', '', __import__('html').unescape(inner))
        n1 = edit(v1['id'], lambda s: 'A brand new opening sentence was added here. ' + s)
        n2 = edit(v2['id'], lambda s: s + ' (revised in the second edition)')
        n3 = edit(v3['id'], lambda s: 'Nothing like the previous paragraph, which was replaced wholesale.')
        def route(r): r.fulfill(body=html, content_type='text/html; charset=utf-8')
        pg = self.page(ctx=ctx, route=route); self.on(pg, 'hi'); pg.wait_for_timeout(300)
        d = self.doc(pg); self.assertEqual(len(d['objs']), 3, 'nothing is ever dropped')
        m1 = next(o for o in d['objs'] if o['t'] == 'mark' and o['a']['b'] == n1); self.assertTrue(pg.evaluate("([id,s,e,t])=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').textContent.slice(s,e)===t", [n1, m1['q']['s'], m1['q']['e'], m1['q']['t']]), 'the quote was found again at its new offsets')
        self.assertEqual([o['a']['b'] for o in d['objs'] if o['t'] == 'stroke'], [n2], 'ink follows the block whose opening words match')
        o3 = next(o for o in d['objs'] if o['t'] == 'mark' and o['a']['b'] == v3['id']); self.assertEqual(o3['a']['b'], v3['id'])
        pg.evaluate("()=>Annot.reanchor('t:ch05')"); pg.wait_for_timeout(300)
        orph = pg.evaluate("k=>Annot.orphans(k)", KEY); self.assertEqual(len(orph), 1); self.assertEqual(orph[0]['i'], o3['i']); self.assertEqual(orph[0]['quote'], o3['q']['t'], 'the saved quote is shown for a detached mark')
        self.assertTrue(pg.evaluate("([k,i,b])=>Annot.reattach(k,i,b)", [KEY, o3['i'], n3])); self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 0); self.assertEqual(self.objs(pg), 3)
        pg.keyboard.press('Control+z'); self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 1, 'reattaching is undoable'); self.assertEqual(self.objs(pg), 3)
        self.assertFalse(pg.evaluate("([k,i])=>Annot.reattach(k,i,'deadbeef')", [KEY, o3['i']]), 'cannot attach to a block that does not exist'); self.assertEqual(self.errs, []); ctx.close()

    # ---------------------------------------------------------------- margin notes / stickies
    def test_margin_notes_in_the_gutter_on_wide_screens_and_stickies_on_phones(self):
        pg = self.page(1024); self.on(pg, 'nt'); v = self.at(pg, 11000)[0]
        evil = 'Mnemonic <img src=x onerror=window.__x=1>'
        self.tap(pg, v['l'] + 60, v['t'] + 10); pg.fill('.an-sticky textarea', evil); pg.click('.an-sticky button:has-text("Done")'); pg.wait_for_timeout(250)
        o = self.doc(pg)['objs'][0]; self.assertEqual((o['t'], o['q'].get('m'), o['a']['b']), ('note', 1, v['id']))
        self.assertEqual(pg.locator('#tbbody.an-gut').count(), 1); self.assertEqual(pg.locator('.an-mn').count(), 1); self.assertEqual(pg.locator('.an-pin').count(), 0)
        self.assertEqual(pg.locator('.an-mn').text_content(), evil); self.assertIsNone(pg.evaluate("()=>window.__x ?? null"))
        r = pg.evaluate("()=>{const m=document.querySelector('.an-mn').getBoundingClientRect(),h=document.querySelector('#tbbody').getBoundingClientRect();return [m.left>=h.right,m.right<=innerWidth,m.width]}"); self.assertEqual(r[:2], [True, True]); self.assertGreater(r[2], 120)
        v2 = [x for x in self.at(pg, pg.evaluate('()=>scrollY') + 500, 22) if x['id'] != v['id']][0]; self.tap(pg, v2['l'] + 60, v2['t'] + 8); pg.fill('.an-sticky textarea', 'second'); pg.click('.an-sticky button:has-text("Done")'); pg.wait_for_timeout(250)
        rs = pg.evaluate("()=>[...document.querySelectorAll('.an-mn')].map(e=>{const r=e.getBoundingClientRect();return [r.top,r.bottom]}).sort((a,b)=>a[0]-b[0])"); self.assertEqual(len(rs), 2)
        self.assertLessEqual(rs[0][1], rs[1][0] + .5, 'margin notes never overlap each other')
        pg.click('.an-mn >> nth=0'); self.assertEqual(pg.locator('.an-sticky').count(), 1, 'a margin note opens for editing'); pg.keyboard.press('Escape')
        pg.set_viewport_size({'width': 390, 'height': 800}); pg.wait_for_timeout(400)
        for bid in (v['id'], v2['id']):
            pg.evaluate("id=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').scrollIntoView({block:'center',behavior:'instant'})", bid); pg.wait_for_timeout(400)
            self.assertGreaterEqual(pg.locator('.an-pin').count(), 1, 'on a phone the same notes appear as stickies'); self.assertEqual(pg.locator('.an-mn').count(), 0)
        self.assertEqual(pg.locator('#tbbody.an-gut').count(), 0)
        pg.set_viewport_size({'width': 1024, 'height': 800}); pg.wait_for_timeout(400)
        for bid in (v['id'], v2['id']):
            pg.evaluate("id=>document.querySelector('#tbbody [data-b=\"'+id+'\"]').scrollIntoView({block:'center',behavior:'instant'})", bid); pg.wait_for_timeout(400)
        self.assertEqual(pg.locator('.an-mn').count(), 2)
        depth = pg.evaluate("k=>Annot._debug.undoDepth(k)", KEY); self.assertLessEqual(depth, 3)
        for _ in range(depth): pg.keyboard.press('Control+z'); pg.wait_for_timeout(120)
        self.assertEqual(self.objs(pg), 0); self.assertEqual(pg.locator('.an-mn').count(), 0); self.assertEqual(self.errs, [])
        pg2 = self.page(390); self.on(pg2, 'nt'); w = self.at(pg2, 11000)[0]; self.tap(pg2, w['l'] + 40, w['t'] + 10); pg2.fill('.an-sticky textarea', 'phone'); pg2.click('.an-sticky button:has-text("Done")'); pg2.wait_for_timeout(250)
        self.assertIsNone(self.doc(pg2)['objs'][0]['q'].get('m')); self.assertEqual(pg2.locator('.an-pin').count(), 1); self.assertEqual(pg2.locator('.an-mn').count(), 0)

    # ---------------------------------------------------------------- entry, reading position, progress
    def test_entry_button_is_reachable_and_reading_position_scrollbar_and_progress_are_untouched(self):
        pg = self.page(); self.assertTrue(pg.evaluate("()=>document.body.classList.contains('an-tb')"))
        self.assertTrue(pg.locator('#an-fab-on').is_visible()); pg.click('#an-fab-on'); self.assertTrue(pg.evaluate("()=>!!Annot.state().on")); self.assertTrue(pg.locator('#an-bar').is_visible())
        pg.click('#an-fab-on'); self.assertFalse(pg.evaluate("()=>!!Annot.state().on"))
        pg.evaluate("()=>localStorage.setItem('tbPos',JSON.stringify({ch05:.4}))"); pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_selector('#tbbody[data-ch] [data-b]'); pg.wait_for_timeout(900)
        r = pg.evaluate("()=>{const sp=document.documentElement.scrollHeight-innerHeight;return [scrollY/sp,parseFloat(document.querySelector('#tbprog i').style.width)/100]}")
        self.assertAlmostEqual(r[0], .4, delta=.02); self.assertAlmostEqual(r[1], r[0], delta=.02)
        pg.mouse.wheel(0, 300); pg.wait_for_timeout(250); self.assertTrue(pg.locator('#tbsc').is_visible()); pg.goto(self.url('ch04')); pg.wait_for_selector('#tbbody[data-ch=ch04] [data-b]')
        self.assertTrue(pg.evaluate("()=>document.body.classList.contains('an-tb')")); pg.goto('http://127.0.0.1:%d/index.full.html#/menu' % self.port)
        try: pg.wait_for_function("()=>!document.body.classList.contains('an-tb')", timeout=4000)   # was a fixed 400 ms: the class clears after the menu renders, which raced on CI
        except Exception: pass
        self.assertFalse(pg.evaluate("()=>document.body.classList.contains('an-tb')"), 'the textbook button goes away outside the textbook'); self.assertEqual(self.errs, [])

    # ---------------------------------------------------------------- scale and speed
    def test_two_thousand_strokes_and_three_hundred_marks_scroll_smoothly_with_only_visible_layers_mounted(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 9000)[0]; self.draw(pg, self.stroke_on(v)); g = self.doc(pg)['objs'][0]['g']
        r = pg.evaluate("""async g=>{const ids=[...document.querySelectorAll('#tbbody p[data-b]')].filter(e=>e.textContent.length>40).map(e=>e.dataset.b);const objs=[];let n=0;
          for(let i=0;i<2000;i++)objs.push({i:'s'+i,t:'stroke',k:'ball',c:'k',w:2.2,a:{b:ids[i%ids.length]},g});
          for(let i=0;i<300;i++)objs.push({i:'m'+i,t:'mark',k:'hi',c:'y',w:1,a:{b:ids[(i*2)%ids.length]},q:{s:0,e:20}});
          for(let i=0;i<40;i++)objs.push({i:'n'+i,t:'note',k:'pin',c:'k',w:1,a:{b:ids[(i*13)%ids.length]},x:'note '+i,q:{x:5000,y:20}});
          await Annot.load({v:1,docs:{'t:ch05':{rev:1,upd:1,objs}}});return [ids.length,objs.length]}""", g)
        self.assertEqual(r[1], 2340); self.assertEqual(self.objs(pg), 2340)
        times = []; seen = {'canv': 0, 'pins': 0, 'win': 0}
        for i in range(50):
            y = 3000 + i * 1350
            t = pg.evaluate("""async y=>{const t0=performance.now();window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-t0}""", y); times.append(t)
            s = pg.evaluate("()=>({c:Annot._debug.canvases(),p:document.querySelectorAll('#tbbody>.an-pin,#tbbody>.an-mn').length,w:Annot._debug.win('t:ch05').h/innerHeight})")
            seen['canv'] = max(seen['canv'], s['c']); seen['pins'] = max(seen['pins'], s['p']); seen['win'] = max(seen['win'], s['w'])
        times.sort(); self.assertLessEqual(seen['canv'], 3); self.assertLess(seen['win'], 3.6); self.assertLess(seen['pins'], 25, 'only notes near the screen are mounted')
        self.assertLess(times[int(len(times) * .95)], 400, 'p95 jump-and-settle %.0f ms' % times[int(len(times) * .95)])
        frames = pg.evaluate("""async()=>{const d=[];let last=performance.now(),y=20000;for(let i=0;i<120;i++){y+=24;window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(r));const n=performance.now();d.push(n-last);last=n}d.sort((a,b)=>a-b);return [d[Math.floor(d.length*.95)],d[d.length-1]]}""")
        self.assertLess(frames[0], 150, 'p95 frame during scrolling %.0f ms' % frames[0]); self.assertLess(frames[1], 500)
        paint = sorted(pg.evaluate("k=>Array.from({length:12},()=>Annot._debug.paintMs(k))", KEY)); self.assertLess(paint[-2], 60, 'one full repaint of the window %.0f ms' % paint[-2])
        self.assertEqual(self.errs, [])

    def test_a_wet_stroke_of_120_plus_pointer_events_has_no_long_frames_in_the_textbook(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 13000)[0]
        r = pg.evaluate("""async v=>{const mk=(n,x,y)=>new PointerEvent(n,{pointerId:3,pointerType:'pen',isPrimary:true,bubbles:true,clientX:x,clientY:y,pressure:.5,buttons:1});
          document.elementFromPoint(v.l+20,v.t+10).dispatchEvent(mk('pointerdown',v.l+20,v.t+10));const d=[];let last=performance.now();for(let i=1;i<=240;i++){document.dispatchEvent(mk('pointermove',v.l+20+i*2,v.t+10+Math.sin(i/9)*8));if(i%2===0){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();d.push(n-last);last=n}}
          document.dispatchEvent(mk('pointerup',v.l+500,v.t+10));d.sort((a,b)=>a-b);return [d[Math.floor(d.length*.95)],d[d.length-1]]}""", v)
        self.assertLess(r[0], 90, 'p95 %.0f ms' % r[0]); self.assertLess(r[1], 400); self.assertEqual(self.objs(pg), 1)

    # ---------------------------------------------------------------- backup and hostile data
    def test_textbook_annotations_survive_backup_round_trip_and_hostile_ones_are_rejected(self):
        pg = self.page(); self.on(pg); v = self.at(pg, 9500)[0]; self.draw(pg, self.stroke_on(v))
        pg.evaluate("()=>{Annot.state().tool='hi'}"); pg.evaluate(SELECT, [v['id'], 0, 25]); pg.wait_for_timeout(300); pg.click('#an-selpop [aria-label=Highlight]'); pg.wait_for_timeout(150)
        d = pg.evaluate("()=>Annot.dump()"); self.assertIn(KEY, d['docs']); self.assertEqual(len(d['docs'][KEY]['objs']), 2)
        self.assertTrue(all(o['a'].get('t') for o in d['docs'][KEY]['objs'])); self.assertTrue(pg.evaluate("d=>!!Annot.validate(d)", d))
        def bad(f):
            import copy; x = copy.deepcopy(d); f(x); return pg.evaluate("d=>Annot.validate(d)", x)
        self.assertIsNone(bad(lambda x: x['docs'][KEY]['objs'][0]['a'].update(t='x' * 500)))
        self.assertIsNone(bad(lambda x: x['docs'][KEY]['objs'][0]['a'].update(t=5)))
        self.assertIsNone(bad(lambda x: x['docs'][KEY]['objs'][0]['a'].update(b='nothex!!')))
        self.assertIsNone(bad(lambda x: x['docs'].update({'t:ch5': x['docs'][KEY]})))
        self.assertIsNone(bad(lambda x: x['docs'].update({'t:ch05/../x': x['docs'][KEY]})))
        self.assertIsNone(bad(lambda x: x['docs'][KEY]['objs'][1]['q'].update(t='y' * 6000)))
        pg.evaluate("async d=>{await Annot.load(d)}", d); self.assertEqual(self.objs(pg), 2); pg.evaluate("async()=>{await Annot.flush()}")
        pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_selector('#tbbody[data-ch] [data-b]'); pg.wait_for_timeout(500)
        self.assertEqual(self.objs(pg), 2, 'saved across reload'); self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 0); self.assertEqual(self.errs, [])

if __name__ == '__main__': unittest.main()
