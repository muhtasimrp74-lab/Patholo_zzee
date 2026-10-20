"""Annotation tests, polish pass: sharp canvases on high-density screens, themed colour picker, writing space,
toolbar docking, pencil tilt, marker snapping to the text line. Synthetic PointerEvents in desktop Chromium stand in for real
devices; nothing here proves behaviour on a real iPad / Apple Pencil / S Pen / phone."""
import os, unittest
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
URL = 'file://' + os.path.join(ROOT, 'index.html')
DRAW = """([sel, pts, o])=>{const h=document.querySelector(sel),r=h.getBoundingClientRect(),id=o.id||1,t=o.type||'pen';
 const mk=(n,q,b)=>new PointerEvent(n,{pointerId:id,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+q[0],clientY:r.top+q[1],pressure:t==='pen'?(q[2]==null?.5:q[2]):(b?.5:0),tiltX:o.tiltX||0,tiltY:0,buttons:b,button:0});
 h.dispatchEvent(mk('pointerdown',pts[0],1));pts.slice(1).forEach(q=>document.dispatchEvent(mk('pointermove',q,1)));document.dispatchEvent(mk('pointerup',pts[pts.length-1],0))}"""
def wave(n=40, x0=30, y0=60, dx=6, amp=14): return [[x0 + i * dx, y0 + (amp if i % 2 else -amp) * .5 + i * .3, .5] for i in range(n)]

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class Polish(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop()
    def page(self, w=1024, h=800, dpr=1):
        ctx = self.b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr); self.ctx = ctx
        pg = ctx.new_page(); self.errs = []; self.dialogs = []
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.goto(URL + '#/05'); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(300); return pg
    def open_card(self, pg):
        cid = pg.evaluate("()=>{const c=[...document.querySelectorAll('article.card')].filter(c=>c.offsetParent)[0];c.querySelector('header').click();return c.id}")
        pg.wait_for_function("id=>document.querySelector('#'+id+' .ans').clientWidth>0", arg=cid); pg.wait_for_timeout(200)
        pg.evaluate("()=>Annot._debug.setOn(true)"); return cid, '#%s .ans' % cid
    def draw(self, pg, sel, pts=None, **o): pg.evaluate(DRAW, [sel, pts or wave(), o]); pg.wait_for_timeout(120)

    def test_canvases_use_the_full_pixel_ratio_up_to_3x(self):
        for dpr in (1, 2, 3):
            pg = self.page(dpr=dpr); cid, sel = self.open_card(pg); self.draw(pg, sel)
            # the app deliberately caps the ratio by a pixel budget (16 MP) and a 4096 px edge so tall cards do not exhaust memory
            r, cap = pg.evaluate("s=>{const c=document.querySelector(s+' canvas.ink'),w=c.clientWidth,h=c.clientHeight;return [c.width/w,Math.min(Math.sqrt(16e6/(w*h)),4096/Math.max(w,h))]}", sel)
            self.assertAlmostEqual(r, min(dpr, cap), delta=.05, msg=dpr); self.assertEqual(self.errs, []); self.ctx.close()
    def test_colour_picker_is_the_apps_own_and_sets_saves_and_remembers_colours(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{Annot.state().tool='pen'}")
        pg.click('#an-bar [data-a=pen]'); pg.wait_for_selector('.an-pop'); self.assertEqual(pg.locator('.an-pop input[type=color]').count(), 0)
        pg.click('.an-pop .an-cu'); pg.wait_for_selector('.an-pop .an-cp canvas')
        pg.fill('.an-pop .an-hex', '#1a8f6b'); pg.dispatch_event('.an-pop .an-hex', 'change'); pg.wait_for_timeout(100)
        self.assertEqual(pg.evaluate("()=>[Annot.state().col,Annot.state().recent]"), ['#1a8f6b', ['#1a8f6b']])
        b = pg.locator('.an-pop .an-cp canvas').bounding_box(); pg.mouse.click(b['x'] + b['width'] * .5, b['y'] + b['height'] * .5); pg.wait_for_timeout(100)
        self.assertRegex(pg.evaluate("()=>Annot.state().col"), r'^#[0-9a-f]{6}$'); self.assertEqual(len(pg.evaluate("()=>Annot.state().recent")), 2)
        self.draw(pg, sel); self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs[0].c", 'q:' + cid), pg.evaluate("()=>Annot.state().col"))
        self.assertEqual(self.errs, [])
    def test_writing_space_add_switch_resize_fold_remove_persist_and_backup(self):
        pg = self.page(); cid, sel = self.open_card(pg); self.assertEqual(pg.locator(sel + ' > .an-ws').count(), 0)
        pg.evaluate("s=>document.querySelector(s).scrollIntoView({block:'center'})", sel); pg.wait_for_timeout(150)
        pg.click('#an-bar [data-a=ws]'); pg.wait_for_selector(sel + ' > .an-ws'); self.assertEqual(pg.get_attribute(sel + ' > .an-ws', 'data-t'), 'ruled')
        h0 = pg.evaluate("s=>document.querySelector(s+' > .an-ws .an-wsa').clientHeight", sel)
        pg.click(sel + ' > .an-ws .an-seg button[data-t=grid]'); self.assertEqual(pg.get_attribute(sel + ' > .an-ws', 'data-t'), 'grid')
        pg.click(sel + ' > .an-ws .an-wsh >> nth=1'); pg.wait_for_timeout(100)
        self.assertEqual(pg.evaluate("s=>document.querySelector(s+' > .an-ws .an-wsa').clientHeight", sel), h0 + 60)
        # writing in the space is drawn and kept
        r = pg.evaluate("s=>{const a=document.querySelector(s+' > .an-ws .an-wsa').getBoundingClientRect(),h=document.querySelector(s).getBoundingClientRect();return a.top-h.top+40}", sel)
        self.draw(pg, sel, [[40, r], [120, r + 10], [200, r], [260, r + 12]]); self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs.length", 'q:' + cid), 1)
        dump = pg.evaluate("()=>Annot.dump()"); self.assertEqual(dump['docs']['q:' + cid]['ws']['t'], 'grid')
        pg.evaluate("()=>Annot.flush()"); pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(400)
        self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].ws.t", 'q:' + cid), 'grid')
        pg.evaluate("c=>{const e=document.getElementById(c);e.querySelector('header').click()}", cid); pg.evaluate("()=>Annot._debug.setOn(true)"); pg.wait_for_timeout(300)
        pg.click(sel + ' > .an-ws .an-wsf'); self.assertIn('shut', pg.get_attribute(sel + ' > .an-ws', 'class'))
        # backup round trip keeps the space; a hostile one is rejected and changes nothing
        d = pg.evaluate("()=>Annot.dump()"); self.assertEqual(pg.evaluate("d=>Annot.validate(d)!==null&&Annot.validate(d).docs['q:%s'].ws.h>0" % cid, d), True)
        d['docs']['q:' + cid]['ws'] = {'t': '<img onerror=1>', 'h': 99999, 'c': 0}; self.assertIsNone(pg.evaluate("d=>Annot.validate(d)", d))
        pg.evaluate("c=>document.querySelector('#'+c+' .an-ws .an-wsx').click()", cid); pg.wait_for_timeout(150)
        self.assertEqual(pg.locator(sel + ' > .an-ws').count(), 0); self.assertEqual(pg.evaluate("k=>Annot._debug.docs()[k].objs.length", 'q:' + cid), 1)
        self.assertEqual(self.errs, [])
    def test_toolbar_snaps_to_a_dock_near_an_edge_and_remembers_it(self):
        pg = self.page(); self.open_card(pg); g = pg.locator('#an-bar .an-grip').bounding_box()
        pg.mouse.move(g['x'] + 8, g['y'] + 8); pg.mouse.down(); pg.mouse.move(1000, 30, steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate("()=>[Annot.state().dock,Annot.state().pos]"), ['tr', None])
        bb = pg.locator('#an-bar').bounding_box(); self.assertLess(bb['y'], 40); self.assertGreater(bb['x'] + bb['width'], 1024 - 40)
        pg.evaluate("()=>Annot.flush()"); pg.wait_for_timeout(600); pg.reload(); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(300)
        self.assertEqual(pg.evaluate("()=>Annot.state().dock"), 'tr'); self.assertEqual(self.errs, [])
    def test_pencil_widens_with_tilt_and_marker_snaps_to_the_text_line(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>Object.assign(Annot.state(),{tool:'pen',pen:'pencil'})")
        self.draw(pg, sel, wave(), tiltX=0); self.draw(pg, sel, wave(y0=140), tiltX=60)
        p = pg.evaluate("k=>{const L=Annot._debug.layer(k),o=Annot._debug.docs()[k].objs;return o.map((_,i)=>{const px=Annot._debug.px(k,i);return px.reduce((a,q)=>a+q[2],0)/px.length})}", 'q:' + cid)
        self.assertGreater(p[1], p[0] + .15, p)
        # marker: hold still on a text line, slightly off-centre, then release
        y = pg.evaluate("s=>{const e=document.querySelector(s+' p'),rg=document.createRange();rg.selectNodeContents(e);const r=rg.getClientRects()[0],h=document.querySelector(s).getBoundingClientRect();return [r.top-h.top+r.height/2,r.height]}", sel)
        pg.evaluate("()=>Object.assign(Annot.state(),{tool:'hl'})")
        pg.evaluate("""([s,y])=>{const h=document.querySelector(s),r=h.getBoundingClientRect(),mk=(n,x,b)=>new PointerEvent(n,{pointerId:3,pointerType:'pen',isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+x,clientY:r.top+y,pressure:.5,buttons:b});
          h.dispatchEvent(mk('pointerdown',30,1));[60,120,180,240].forEach(x=>document.dispatchEvent(mk('pointermove',x,1)))}""", [sel, y[0] + 3])
        pg.wait_for_timeout(800); pg.evaluate("s=>{const h=document.querySelector(s),r=h.getBoundingClientRect();document.dispatchEvent(new PointerEvent('pointerup',{pointerId:3,pointerType:'pen',isPrimary:true,bubbles:true,clientX:r.left+240,clientY:r.top+%f,buttons:0}))}" % (y[0] + 3), sel)
        pg.wait_for_timeout(200)
        ys = pg.evaluate("k=>{const o=Annot._debug.docs()[k].objs,i=o.length-1;return Annot._debug.px(k,i).map(q=>q[1])}", 'q:' + cid)
        self.assertEqual(len(ys), 2); self.assertAlmostEqual(ys[0], y[0], delta=1.5); self.assertAlmostEqual(ys[0], ys[1], delta=.01); self.assertEqual(self.errs, [])

if __name__ == '__main__': unittest.main()
