"""Annotation engine tests (Phase 1: engine, store, migration, backup, Answers host).
Synthetic PointerEvents stand in for real devices; nothing here proves behaviour on a real iPad / Apple Pencil / S Pen."""
import os, json, re, unittest
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
URL = 'file://' + os.path.join(ROOT, 'index.html')

DRAW = """([sel, pts, o])=>{const h=document.querySelector(sel),r=h.getBoundingClientRect(),id=o.id||1,t=o.type||'pen';
 const mk=(n,q,b)=>new PointerEvent(n,{pointerId:id,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+q[0],clientY:r.top+q[1],pressure:t==='pen'?(q[2]==null?.5:q[2]):(b?.5:0),tiltX:o.tiltX||0,tiltY:0,buttons:b,button:0});
 h.dispatchEvent(mk('pointerdown',pts[0],1));pts.slice(1).forEach(q=>document.dispatchEvent(mk('pointermove',q,1)));document.dispatchEvent(mk('pointerup',pts[pts.length-1],0))}"""

def wave(n=40, x0=30, y0=60, dx=6, amp=14): return [[x0 + i * dx, y0 + (amp if i % 2 else -amp) * .5 + i * .3, .3 + (i % 7) / 10] for i in range(n)]

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class AnnotBrowser(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop()
    def page(self, w=1024, h=800, ctx=None):
        pg = ctx.new_page() if ctx else self.b.new_page(viewport={'width': w, 'height': h}); self.errs = []; self.dialogs = []
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.goto(URL + '#/05'); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(300); return pg
    def open_card(self, pg, n=0):
        cid = pg.evaluate("n=>{const c=[...document.querySelectorAll('article.card')].filter(c=>c.offsetParent)[n];c.querySelector('header').click();c.id.length;return c.id}", n)
        pg.wait_for_function("id=>document.querySelector('#'+id+' .ans').clientWidth>0", arg=cid); pg.wait_for_timeout(200)
        pg.evaluate("()=>Annot._debug.setOn(true)"); return cid, '#%s .ans' % cid
    def objs(self, pg, cid): return pg.evaluate("k=>{const d=Annot._debug.docs()[k];return d?d.objs.length:0}", 'q:' + cid)
    def draw(self, pg, sel, pts=None, **o): pg.evaluate(DRAW, [sel, pts or wave(), o]); pg.wait_for_timeout(120)

    def test_new_system_loaded_and_old_one_gone(self):
        pg = self.page(); self.assertEqual(pg.evaluate("()=>[typeof Annot,typeof Ink,typeof Ink.dump,typeof Ink.load,!!document.querySelector('#tools [data-t=ink]'),!!document.querySelector('canvas.ink')]"), ['object', 'object', 'function', 'function', True, False])
        self.assertFalse(os.path.exists(os.path.join(ROOT, 'ink.js'))); self.assertEqual(self.errs, [])
    def test_every_tool_with_pen_touch_and_mouse(self):
        for typ in ('pen', 'touch', 'mouse'):
            pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{Annot.state().mode='pf'}")
            for tool, pen in (('pen', 'ball'), ('pen', 'fnt'), ('pen', 'pencil'), ('hl', 'ball')):
                pg.evaluate("([t,p])=>{Object.assign(Annot.state(),{tool:t,pen:p})}", [tool, pen]); before = self.objs(pg, cid); self.draw(pg, sel, type=typ, tiltX=30)
                self.assertEqual(self.objs(pg, cid), before + 1, (typ, tool, pen))
            kinds = pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>o.k)", 'q:' + cid); self.assertEqual(kinds, ['ball', 'fnt', 'pen', 'hl'])
            before = self.objs(pg, cid); pg.evaluate("()=>{Annot.state().tool='er'}"); self.draw(pg, sel, [[30, 60], [250, 60]], type=typ); self.assertLess(self.objs(pg, cid), before, typ)
            self.assertEqual(self.errs, [], typ); pg.close()
    def test_pen_only_mode_lets_the_finger_scroll_and_pen_still_draws(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{Object.assign(Annot.state(),{mode:'po',tool:'pen'});document.body.classList.replace('an-pf','an-po')}"); pg.wait_for_timeout(50)
        ta = pg.evaluate("s=>getComputedStyle(document.querySelector(s)).touchAction", sel); self.assertEqual(ta, 'manipulation')   # = pan-x pan-y pinch-zoom: the finger scrolls and pinches
        self.draw(pg, sel, type='touch'); self.assertEqual(self.objs(pg, cid), 0)
        self.draw(pg, sel, type='pen'); self.assertEqual(self.objs(pg, cid), 1)
        pg.evaluate("()=>{Annot.state().mode='pf';document.body.classList.replace('an-po','an-pf')}"); self.assertNotEqual(pg.evaluate("s=>getComputedStyle(document.querySelector(s)).touchAction", sel), 'pan-y')
    def test_nothing_draws_when_annotate_is_off_and_text_stays_selectable(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>Annot._debug.setOn(false)"); self.draw(pg, sel); self.assertEqual(self.objs(pg, cid), 0)
        self.assertNotEqual(pg.evaluate("s=>getComputedStyle(document.querySelector(s)).userSelect", sel), 'none')
    def test_undo_redo_covers_add_erase_and_clear(self):
        pg = self.page(); cid, sel = self.open_card(pg)
        for _ in range(3): self.draw(pg, sel)
        self.assertEqual(self.objs(pg, cid), 3)
        pg.keyboard.press('Control+z'); self.assertEqual(self.objs(pg, cid), 2); pg.keyboard.press('Control+Shift+z'); self.assertEqual(self.objs(pg, cid), 3)
        pg.evaluate("()=>{Annot.state().tool='er'}"); ids = pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>o.i)", 'q:' + cid)
        self.draw(pg, sel, [[0, 0], [400, 150]], type='mouse')   # sweeps the first strokes
        after = self.objs(pg, cid); self.assertLess(after, 3); pg.keyboard.press('Control+z')
        self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>o.i)", 'q:' + cid), ids, 'undo of a multi-stroke erase restores order exactly')
        pg.click('#an-bar [data-a=clear]'); self.assertEqual(self.objs(pg, cid), 0); pg.keyboard.press('Control+z')
        self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>o.i)", 'q:' + cid), ids)
        pg.evaluate("()=>{Annot.state().tool='pen'}")
        pg.evaluate("""([s,d])=>{const h=document.querySelector(s),r=h.getBoundingClientRect(),mk=(nm,q,b)=>new PointerEvent(nm,{pointerId:1,pointerType:'pen',isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+q[0],clientY:r.top+q[1],pressure:.5,buttons:b});
            for(let n=0;n<230;n++){h.dispatchEvent(mk('pointerdown',d[0],1));document.dispatchEvent(mk('pointermove',d[1],1));document.dispatchEvent(mk('pointermove',d[2],1));document.dispatchEvent(mk('pointerup',d[2],0))}}""", [sel, [[20, 20], [60, 40], [90, 30]]])
        pg.wait_for_timeout(200)
        self.assertGreaterEqual(pg.evaluate("k=>Annot._debug.undoDepth(k)", 'q:' + cid), 200); self.assertEqual(self.errs, [])
    def test_saved_across_reload_and_flushed_on_pagehide(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}); pg = self.page(ctx=ctx); cid, sel = self.open_card(pg); self.draw(pg, sel)
        pg.evaluate("()=>dispatchEvent(new Event('pagehide'))"); pg.wait_for_timeout(500); self.assertEqual(pg.evaluate("()=>Annot._debug.dirty().length"), 0)
        pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); self.assertEqual(self.objs(pg, cid), 1)
        pg.evaluate("id=>{document.getElementById(id).querySelector('header').click()}", cid); pg.wait_for_timeout(500)
        self.assertTrue(pg.evaluate("id=>!!document.querySelector('#'+id+' canvas.an-c.ink')", cid)); ctx.close()
    def test_ink_stays_on_the_same_text_after_text_size_and_width_changes(self):
        for w in (390, 768, 1024):
            pg = self.page(w); cid, sel = self.open_card(pg)
            pg.evaluate("k=>{const L=Annot._debug.layer(k);}", 'q:' + cid)
            # draw on the 2nd text block, remembering where the stroke starts relative to that block
            blk = pg.evaluate("s=>{const h=document.querySelector(s),b=[...h.querySelectorAll('p,li')][1]||h.firstElementChild,hr=h.getBoundingClientRect(),r=b.getBoundingClientRect();return [r.left-hr.left,r.top-hr.top]}", sel)
            self.draw(pg, sel, [[blk[0] + 20, blk[1] + 8], [blk[0] + 80, blk[1] + 14], [blk[0] + 140, blk[1] + 8]])
            def rel():
                return pg.evaluate("""([s,k])=>{const h=document.querySelector(s),a=Annot._debug.docs()[k].objs[0].a.b,i=Annot._debug.blocks(k).indexOf(a),el=[...h.querySelectorAll('p,li,table,figure,aside,blockquote,h1,h2,h3,h4,h5,pre')].filter(e=>!(e.closest('table')&&e.closest('table')!==e)&&!(e.tagName==='P'&&e.closest('li')))[i],hr=h.getBoundingClientRect(),r=el.getBoundingClientRect(),p=Annot._debug.px(k,0)[0];return [p[0]-(r.left-hr.left),p[1]-(r.top-hr.top)]}""", [sel, 'q:' + cid])
            x0, y0 = rel(); self.assertAlmostEqual(y0, 8, delta=1.5)
            for fs in (1.3, 0.85, 1):
                pg.evaluate("f=>{document.documentElement.style.setProperty('--fs',f);S.pref=S.pref||{};S.pref.fs=f}", fs); pg.wait_for_timeout(250)
                x, y = rel(); self.assertLess(abs(y - y0), 6 * fs + 1, (w, fs)); self.assertLess(abs(x - x0), 6 + 20 * abs(fs - 1) * 4, (w, fs))
            pg.set_viewport_size({'width': h2(w), 'height': 800}); pg.wait_for_timeout(300); x, y = rel(); self.assertLess(abs(y - y0), 6, w)
            self.assertEqual(self.errs, [], w); pg.close()
    def test_legacy_ink_migrates_non_destructively_and_follows_aliases(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()).group(1)); a, b = next(iter(al.items()))
        ctx = self.b.new_context(); pg = ctx.new_page(); pg.goto(URL + '#/'); pg.wait_for_function("()=>window.Annot&&Annot.isReady()")
        pts = []
        for i in range(300): pts += [round(.05 + i * .002 + (i % 5) * .0007, 4), round(40 + i * .9 + (i % 7) * 1.3, 1)]
        pg.evaluate("""([ids,pts])=>new Promise(r=>{const q=indexedDB.open('pathviva-ink',1);q.onupgradeneeded=()=>q.result.createObjectStore('ink',{keyPath:'id'});q.onsuccess=()=>{const t=q.result.transaction('ink','readwrite');ids.forEach(id=>t.objectStore('ink').put({id,w:600,fs:1,strokes:[{t:'p',c:'#C4573A',s:2,p:pts},{t:'h',c:'#F0C75E',s:16,p:[.1,300,.6,300]}]}));t.oncomplete=r}})""", [[a, 'q7'], pts])
        # new origin state: wipe the v2 database so migration runs again
        pg.evaluate("()=>new Promise(r=>{const q=indexedDB.deleteDatabase('pathviva-annot');q.onsuccess=q.onerror=q.onblocked=r})"); pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(600)
        docs = pg.evaluate("()=>Object.fromEntries(Object.entries(Annot._debug.docs()).map(([k,d])=>[k,d.objs.length]))"); self.assertEqual(docs, {'q:' + b: 2, 'q:q7': 2})
        legacy = pg.evaluate("()=>Annot._debug.legacy()"); self.assertEqual(sorted(r['id'] for r in legacy), sorted([a, 'q7']), 'legacy store untouched')
        new_size = len(json.dumps([o for o in pg.evaluate("k=>Annot.dump().docs[k].objs", 'q:q7') if o['k'] != 'hl'])); old_size = len(json.dumps(next(r for r in legacy if r['id'] == 'q7')['strokes'][:1]))
        self.assertLess(new_size, old_size * .4, (new_size, old_size))
        pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs.length", 'q:q7'), 2, 'migration is idempotent (no duplicates on reload)'); ctx.close()
    def test_backup_round_trip_speed_and_hostile_input(self):
        pg = self.page(); big = pg.evaluate("""()=>{const objs=[];for(let i=0;i<5000;i++){const pts=[];for(let j=0;j<30;j++)pts.push(String.fromCharCode(0));objs.push({i:'s'+i,t:'stroke',k:'ball',c:'k',w:2,a:{b:null},g:btoa(String.fromCharCode(...Array.from({length:90},(_,n)=>(n*7+i)&63)))})}return {v:1,docs:{'q:q9':{rev:1,upd:1,objs}}}}""")
        t = pg.evaluate("async b=>{const t0=performance.now();await Annot.load(b);const d=Annot.dump();const e=JSON.stringify(d);await Annot.load(JSON.parse(e));return [performance.now()-t0,Annot.dump().docs['q:q9'].objs.length]}", big); self.assertEqual(t[1], 5000); self.assertLess(t[0], 2000, t)
        for bad in ({'v': 2, 'docs': {}}, {'v': 1, 'docs': []}, {'v': 1, 'docs': {'__proto__': {'objs': []}}}, {'v': 1, 'docs': {'q:q1': {'objs': [{'i': 'a', 't': 'stroke', 'k': 'ball', 'c': 'k', 'w': 2, 'a': {'b': '<img src=x onerror=1>'}}]}}},
                    {'v': 1, 'docs': {'q:q1': {'objs': [{'i': 'a', 't': 'evil', 'k': 'ball', 'c': 'k', 'w': 2, 'a': {'b': None}}]}}}, {'v': 1, 'docs': {'q:q1': {'objs': [{'i': 'a', 't': 'stroke', 'k': 'ball', 'c': 'k', 'w': 1e9, 'a': {'b': None}}]}}},
                    {'v': 1, 'docs': {'q:q1': {'objs': [{'i': 'a', 't': 'stroke', 'k': 'ball', 'c': 'k', 'w': 2, 'a': {'b': None}, 'g': '<script>'}]}}}, {'v': 1, 'docs': {'nope': {'objs': []}}}, {'v': 1, 'docs': {'q:q1': {'objs': [None]}}}):
            self.assertIsNone(pg.evaluate("s=>Annot.validate(JSON.parse(s))", json.dumps(bad).replace('"__proto__"', '"__proto__"')), bad)
        self.assertEqual(self.errs, [])
    def test_failed_annotation_restore_rolls_back_and_changes_nothing(self):
        pg = self.page(); pg.evaluate("()=>{S.bm=['q1'];save()}"); before = pg.evaluate("()=>localStorage.vivaState"); cid, sel = self.open_card(pg); self.draw(pg, sel)
        pg.evaluate("()=>{Annot.load=async()=>{throw new Error('boom')}}")
        pg.evaluate("t=>imp(new File([t],'b.json'))", json.dumps({'bm': ['q9'], 'annot': {'v': 1, 'docs': {}}})); pg.wait_for_timeout(900)
        self.assertEqual(pg.evaluate("()=>localStorage.vivaState"), before); self.assertTrue(any('could not be restored' in d for d in self.dialogs)); self.assertEqual(self.objs(pg, cid), 1)
    def test_hostile_annot_in_backup_is_rejected_before_any_change(self):
        pg = self.page(); pg.evaluate("()=>{S.bm=['q1'];save()}"); before = pg.evaluate("()=>localStorage.vivaState")
        for bad in ({'v': 1, 'docs': {'q:q1': {'objs': [{'i': 'a', 't': 'stroke', 'k': 'ball', 'c': 'k', 'w': 2, 'a': {'b': '"><img src=x onerror=window.__x=1>'}}]}}}, {'v': 9}, [], 'x'):
            pg.evaluate("t=>imp(new File([t],'b.json'))", json.dumps({'bm': ['q2'], 'annot': bad})); pg.wait_for_timeout(500); self.assertEqual(pg.evaluate("()=>localStorage.vivaState"), before)
        self.assertIsNone(pg.evaluate("()=>window.__x")); self.assertEqual(len(self.dialogs), 4)
    def test_theme_remaps_black_ink_and_toolbar_is_accessible(self):
        pg = self.page(); cid, sel = self.open_card(pg)
        self.assertEqual(pg.get_attribute('#an-bar', 'role'), 'toolbar'); self.assertTrue(pg.evaluate("()=>[...document.querySelectorAll('#an-bar button')].every(b=>b.getAttribute('aria-label')&&b.type==='button')"))
        self.assertTrue(pg.evaluate("()=>[...document.querySelectorAll('#an-bar>button:not([disabled])')].every(b=>{const r=b.getBoundingClientRect();return r.width>=43.5&&r.height>=43.5})"))
        pg.evaluate("()=>{document.documentElement.dataset.theme='dark'}"); pg.wait_for_timeout(100)
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('.an-pop,#an-bar')].length>0"), True)
        self.assertNotEqual(pg.evaluate("()=>Annot._debug.color('k')"), pg.evaluate("()=>{document.documentElement.dataset.theme='light';return Annot._debug.color('k')}"))
        bb = pg.evaluate("()=>{const b=document.querySelector('#an-bar').getBoundingClientRect(),n=document.querySelector('#bnav');return [b.bottom,n&&n.offsetParent?n.getBoundingClientRect().top:9999]}"); self.assertLessEqual(bb[0], bb[1] + 1, 'toolbar never overlaps #bnav')
    def test_shapes_draw_snap_erase_undo_and_survive_backup(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{Annot.state().tool='shape'}")
        for k in ('line', 'arrow', 'rect', 'ellipse'):
            pg.evaluate("k=>{Annot.state().shape=k}", k); n = self.objs(pg, cid); self.draw(pg, sel, [[40, 40], [120, 100], [200, 103]], type='mouse'); self.assertEqual(self.objs(pg, cid), n + 1, k)
        got = pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>[o.t,o.k,Object.keys(o.q).sort().join()])", 'q:' + cid)
        self.assertEqual(got, [['shape', k, 'x1,x2,y1,y2'] for k in ('line', 'arrow', 'rect', 'ellipse')])
        pg.evaluate("()=>{Annot.state().shape='line'}"); self.draw(pg, sel, [[300, 40], [420, 43]], type='mouse')   # ~1.4 degrees: snaps flat
        q = pg.evaluate("k=>{const o=Annot._debug.docs()[k].objs.at(-1);return o.q}", 'q:' + cid); self.assertEqual(q['y1'], q['y2'])
        self.draw(pg, sel, [[10, 10], [12, 11]], type='mouse'); self.assertEqual(self.objs(pg, cid), 5, 'a tiny drag is not a shape')
        d = pg.evaluate("()=>Annot.dump()"); self.assertEqual(pg.evaluate("d=>!!Annot.validate(d)", d), True)
        pg.evaluate("async d=>{await Annot.load(d)}", d); self.assertEqual(self.objs(pg, cid), 5)
        pg.evaluate("()=>{Annot.state().tool='er'}"); self.draw(pg, sel, [[300, 20], [300, 60]], type='mouse'); self.assertEqual(self.objs(pg, cid), 4, 'eraser removes a shape it crosses')
        pg.keyboard.press('Control+z'); self.assertEqual(self.objs(pg, cid), 5); self.assertEqual(self.errs, [])
    def test_text_highlight_follows_text_erases_undoes_and_survives_backup(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{Annot.state().tool='hi'}")
        pick = """s=>{const h=document.querySelector(s),bs=[...h.querySelectorAll('p,li')].filter(b=>!b.querySelector('p,li')&&b.textContent.trim().length>40);const a=bs[0],b=bs[1],w=el=>{const t=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n=t.nextNode();while(n&&n.nodeValue.trim().length<12)n=t.nextNode();return n};
          const n1=w(a),n2=w(b);getSelection().setBaseAndExtent(n1,0,n2,Math.min(10,n2.nodeValue.length));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))}"""
        pg.evaluate(pick, sel); pg.wait_for_timeout(300)
        marks = pg.evaluate("k=>Annot._debug.docs()[k].objs.map(o=>[o.t,o.k,o.q.s,o.q.e])", 'q:' + cid); self.assertGreaterEqual(len(marks), 2); self.assertTrue(all(m[0] == 'mark' and m[3] > m[2] for m in marks))
        self.assertTrue(pg.evaluate("()=>getSelection().isCollapsed"), 'selection is cleared after highlighting')
        rects = lambda: pg.evaluate("k=>{const L=Annot._debug.layer(k),d=Annot._debug.docs()[k];return d.objs.map(o=>Annot._debug.markRects(L,o))}", 'q:' + cid)
        r0 = rects(); self.assertTrue(all(len(r) > 0 for r in r0))
        for fs in (1.3, 1):
            pg.evaluate("f=>{document.documentElement.style.setProperty('--fs',f);S.pref=S.pref||{};S.pref.fs=f}", fs); pg.wait_for_timeout(250)
            ok = pg.evaluate("""k=>{const L=Annot._debug.layer(k),d=Annot._debug.docs()[k],hr=L.host.getBoundingClientRect();return d.objs.every(o=>{const el=[...L.host.querySelectorAll('p,li')].find(()=>true),rs=Annot._debug.markRects(L,o);return rs&&rs.length>0&&rs.every(r=>r[2]>0&&r[3]>0)})}""", 'q:' + cid); self.assertTrue(ok, fs)
        pg.keyboard.press('Control+z'); self.assertEqual(self.objs(pg, cid), 0, 'one undo removes the whole multi-block highlight'); pg.keyboard.press('Control+Shift+z'); self.assertEqual(self.objs(pg, cid), len(marks))
        d = pg.evaluate("()=>Annot.dump()"); self.assertTrue(pg.evaluate("d=>!!Annot.validate(d)", d)); pg.evaluate("async d=>{await Annot.load(d)}", d); self.assertEqual(self.objs(pg, cid), len(marks))
        r = rects()[0][0]; pg.evaluate("()=>{Annot.state().tool='er'}"); self.draw(pg, sel, [[r[0] + 3, r[1] + r[3] / 2], [r[0] + 20, r[1] + r[3] / 2]], type='mouse')
        self.assertEqual(self.objs(pg, cid), len(marks) - 1, 'eraser removes a highlighted span it touches'); self.assertEqual(self.errs, [])
    def test_wet_stroke_benchmark_has_no_long_frames(self):
        pg = self.page(); cid, sel = self.open_card(pg)
        r = pg.evaluate("""async s=>{const h=document.querySelector(s),b=h.getBoundingClientRect(),mk=(n,x,y)=>new PointerEvent(n,{pointerId:3,pointerType:'pen',isPrimary:true,bubbles:true,clientX:b.left+x,clientY:b.top+y,pressure:.5,buttons:1});
          h.dispatchEvent(mk('pointerdown',20,60));const d=[];let last=performance.now();for(let i=1;i<=240;i++){document.dispatchEvent(mk('pointermove',20+i*2.5,60+Math.sin(i/9)*30));if(i%2===0){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();d.push(n-last);last=n}}
          document.dispatchEvent(mk('pointerup',620,60));d.sort((a,b)=>a-b);return [d[Math.floor(d.length*.95)],d[d.length-1]]}""", sel)
        # headless CI is noisy: judge the 95th percentile frame; the single worst frame only has to stay sane
        self.assertLess(r[0], 50, 'p95 frame %.0f ms' % r[0]); self.assertLess(r[1], 400, 'worst frame %.0f ms' % r[1]); self.assertEqual(self.objs(pg, cid), 1)

def h2(w): return {390: 340, 768: 640, 1024: 900}[w]

if __name__ == '__main__': unittest.main()
