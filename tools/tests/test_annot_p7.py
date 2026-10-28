"""Annotation tests, pro-tools pass: precise eraser with clean cut ends and shape cutting, lasso handles, laser, highlighter,
study tape, ruler, export. Synthetic PointerEvents in desktop Chromium stand in for real devices; nothing here proves behaviour
on a real iPad / Apple Pencil / S Pen / phone."""
import json, math, os, unittest
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
URL = 'file://' + os.path.join(ROOT, 'index.full.html')
DRAW = """([sel, pts, o])=>{const h=document.querySelector(sel),r=h.getBoundingClientRect(),id=o.id||1,t=o.type||'pen';
 const mk=(n,q,b)=>new PointerEvent(n,{pointerId:id,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+q[0],clientY:r.top+q[1],pressure:t==='pen'?(q[2]==null?.5:q[2]):(b?.5:0),tiltX:0,tiltY:0,buttons:b,button:0});
 h.dispatchEvent(mk('pointerdown',pts[0],1));pts.slice(1).forEach(q=>document.dispatchEvent(mk('pointermove',q,1)));document.dispatchEvent(mk('pointerup',pts[pts.length-1],0))}"""
# thickness of the ink in one canvas column (host px), counting rows whose alpha clears the threshold, between y0 and y1
THICK = """([sel, x, y0, y1, cls])=>{const c=document.querySelector(sel+' canvas.'+(cls||'ink')),k=c.width/c.clientWidth,g=c.getContext('2d');
 const d=g.getImageData(Math.round(x*k),Math.round(y0*k),1,Math.round((y1-y0)*k)).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>110)n++;return n/k}"""

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class ProTools(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop()
    def page(self, w=1024, h=800):
        pg = self.b.new_page(viewport={'width': w, 'height': h}); self.errs = []; self.dialogs = []
        pg.add_init_script("try{if(localStorage.getItem('zzWelcomeAt')===null)localStorage.setItem('zzWelcomeAt',String(Date.now()))}catch(e){}")  # returning visitor: no welcome dialog
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.goto(URL + '#/05'); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(300); return pg
    def open_card(self, pg, n=0):
        cid = pg.evaluate("n=>{const c=[...document.querySelectorAll('article.card')].filter(c=>c.offsetParent)[n];c.querySelector('header').click();return c.id}", n)
        pg.wait_for_function("id=>document.querySelector('#'+id+' .ans').clientWidth>0", arg=cid); pg.wait_for_timeout(200)
        pg.evaluate("()=>Annot._debug.setOn(true)"); pg.evaluate("()=>{Annot.state().mode='pf'}"); return cid, '#%s .ans' % cid
    def docobjs(self, pg, cid): return pg.evaluate("k=>{const d=Annot._debug.docs()[k];return d?JSON.parse(JSON.stringify(d.objs.map(o=>{const c=Object.assign({},o);delete c.orphan;return c}))):[]}", 'q:' + cid)
    def kinds(self, pg, cid): return [o['t'] + ':' + o['k'] for o in self.docobjs(pg, cid)]
    def draw(self, pg, sel, pts, **o): pg.evaluate(DRAW, [sel, pts, o]); pg.wait_for_timeout(120)
    def thick(self, pg, sel, x, y0, y1, cls='ink'):   # wait until the layer exists and is painted (a fixed wait raced on CI)
        pg.wait_for_function("([s,c])=>{const v=document.querySelector(s+' canvas.'+c);if(!v||!v.width)return false;const d=v.getContext('2d').getImageData(0,0,v.width,v.height).data;for(let i=3;i<d.length;i+=4)if(d[i])return true;return false}", arg=[sel, cls], timeout=5000)
        return pg.evaluate(THICK, [sel, x, y0, y1, cls])

    # ---------- A1: eraser ----------
    def test_precise_eraser_leaves_clean_cut_ends_not_tapered_points(self):
        pg = self.page(); cid, sel = self.open_card(pg); k = 'q:' + cid
        pg.evaluate("()=>{const P=Annot.state();Object.assign(P,{tool:'pen',pen:'ball'});P.sizes.ball=12;P.sizes.er=14}")
        # a gentle wave: a dead-straight line is simplified to two points, and two-point strokes never taper
        self.draw(pg, sel, [[30 + i * 6, 60 + 2 * math.sin(i * .75), .5] for i in range(41)])
        pg.evaluate("()=>{Object.assign(Annot.state(),{tool:'er',erm:'precise'})}"); self.draw(pg, sel, [[150, 35], [150, 85]], type='mouse')
        o = self.docobjs(pg, cid); self.assertEqual(len(o), 2, 'rubbing the middle leaves two pieces')
        self.assertEqual([x.get('e') for x in o], [2, 1], 'the left piece is cut at its end, the right piece at its start')
        left_end = pg.evaluate("k=>{const p=Annot._debug.px(k,0);return p[p.length-1][0]}", k)
        right_start = pg.evaluate("k=>Annot._debug.px(k,1)[0][0]", k)
        mid = self.thick(pg, sel, 60, 35, 85)
        self.assertGreater(mid, 8, 'the stroke is drawn at its size')
        # a cut end is as wide as the rest of the stroke (the old code tapered every end to about a third of the width)
        self.assertGreater(self.thick(pg, sel, left_end - 3, 35, 85), mid * .8)
        self.assertGreater(self.thick(pg, sel, right_start + 3, 35, 85), mid * .8)
        # the original (uncut) ends still taper, like before
        self.assertLess(self.thick(pg, sel, 31, 35, 85), mid * .7)
        # the flag survives a backup round trip and a reload of the saved data
        d = pg.evaluate("()=>Annot.dump()"); v = pg.evaluate("d=>Annot.validate(d)", d)
        self.assertEqual(sorted(x.get('e') for x in v['docs'][k]['objs']), [1, 2]); self.assertEqual(self.errs, [])

    def test_precise_eraser_cuts_shapes_and_one_undo_restores_them_exactly(self):
        pg = self.page(); cid, sel = self.open_card(pg)
        pg.evaluate("()=>{const P=Annot.state();Object.assign(P,{tool:'shape',shape:'rect',col:'b'});P.sizes.shape=4;P.sizes.er=14}")
        self.draw(pg, sel, [[40, 30], [140, 70], [240, 110]], type='mouse'); before = self.docobjs(pg, cid)
        self.assertEqual(self.kinds(pg, cid), ['shape:rect'])
        pg.evaluate("()=>{Object.assign(Annot.state(),{tool:'er',erm:'precise'})}"); self.draw(pg, sel, [[140, 18], [140, 42]], type='mouse')
        after = self.docobjs(pg, cid)
        self.assertEqual([x['t'] + ':' + x['k'] for x in after], ['stroke:ball', 'stroke:ball'], 'the box is cut where it was rubbed, not deleted')
        self.assertTrue(all(x['c'] == before[0]['c'] and x['w'] == before[0]['w'] for x in after), 'pieces keep the colour and width')
        self.assertTrue(all(x.get('e') == 3 for x in after), 'shape pieces keep square ends')
        pg.keyboard.press('Control+z'); self.assertEqual(self.docobjs(pg, cid), before, 'one undo brings back the identical box')
        pg.keyboard.press('Control+Shift+z'); self.assertEqual(len(self.docobjs(pg, cid)), 2)
        pg.keyboard.press('Control+z'); self.assertEqual(self.docobjs(pg, cid), before)
        # stroke mode still removes the whole shape
        pg.evaluate("()=>{Annot.state().erm='stroke'}"); self.draw(pg, sel, [[140, 18], [140, 42]], type='mouse'); self.assertEqual(self.docobjs(pg, cid), [])
        pg.evaluate("()=>{Annot.state().erm='stroke'}"); self.assertEqual(self.errs, [])

    def test_shapes_keep_their_width_where_the_outline_starts_and_ends(self):
        pg = self.page(); cid, sel = self.open_card(pg)
        pg.evaluate("()=>{const P=Annot.state();Object.assign(P,{tool:'shape',shape:'rect',col:'k'});P.sizes.shape=10}")
        self.draw(pg, sel, [[40, 40], [140, 80], [240, 120]], type='mouse')
        # the outline starts and ends at the top-left corner: the top edge next to it is drawn at the full 10 px (the taper gave about 3.5)
        self.assertGreater(self.thick(pg, sel, 54, 25, 55), 10 * .85); self.assertEqual(self.errs, [])

    # ---------- A2: lasso ----------
    def lasso_wave(self, pg, cid, sel):
        pg.evaluate("()=>{const P=Annot.state();Object.assign(P,{tool:'pen',pen:'ball'});P.sizes.ball=4}")
        self.draw(pg, sel, [[60 + i * 5, 80 + 6 * math.sin(i * .6), .5] for i in range(30)])
        pg.evaluate("()=>{Annot.state().tool='sel'}"); self.draw(pg, sel, [[30, 40], [260, 40], [260, 130], [30, 130], [30, 41]], type='mouse')
        self.assertEqual(len(pg.evaluate("()=>Annot._debug.sel()")), 1); return self.docobjs(pg, cid)[0]
    def bb(self, pg): return pg.evaluate("()=>Annot._debug.selBB()")
    def test_resizing_a_selection_from_a_corner_scales_the_ink_width_too(self):
        pg = self.page(); cid, sel = self.open_card(pg); o0 = self.lasso_wave(pg, cid, sel); b = self.bb(pg)
        c, a = [b[2] + 4, b[3] + 4], [b[0] - 4, b[1] - 4]   # drag the bottom-right handle halfway towards the opposite corner
        self.draw(pg, sel, [c, [(c[0] + a[0]) / 2 + 2, (c[1] + a[1]) / 2 + 2], [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]], type='mouse')
        o1 = self.docobjs(pg, cid)[0]; b1 = self.bb(pg)
        self.assertAlmostEqual((b1[2] - b1[0]) / (b[2] - b[0]), .5, delta=.08, msg='the selection is half the size')
        self.assertAlmostEqual(o1['w'] / o0['w'], .5, delta=.05, msg='and its line is half as thick, like Notability and GoodNotes')
        self.assertEqual(pg.evaluate("k=>Annot._debug.undoDepth(k)", 'q:' + cid), 2, 'one undo step for the resize')
        pg.keyboard.press('Control+z'); self.assertEqual(self.docobjs(pg, cid)[0], o0); self.assertEqual(self.errs, [])
    def test_selection_moves_with_arrow_keys_and_resizes_from_the_bar(self):
        pg = self.page(); cid, sel = self.open_card(pg); o0 = self.lasso_wave(pg, cid, sel); b = self.bb(pg)
        pg.keyboard.press('Shift+ArrowRight'); b1 = self.bb(pg); self.assertAlmostEqual(b1[0] - b[0], 10, delta=1.2, msg='Shift+arrow moves 10 px')
        pg.keyboard.press('ArrowDown'); b2 = self.bb(pg); self.assertAlmostEqual(b2[1] - b1[1], 1, delta=.8, msg='arrow moves 1 px')
        self.assertEqual(pg.evaluate("k=>Annot._debug.undoDepth(k)", 'q:' + cid), 3, 'one undo step per nudge')
        pg.keyboard.press('Control+z'); self.assertAlmostEqual(self.bb(pg)[1], b1[1], delta=.8)
        pg.keyboard.press('Control+z'); self.assertEqual(self.docobjs(pg, cid)[0], o0)
        big = pg.locator('#an-selbar [data-a=selbig]'); small = pg.locator('#an-selbar [data-a=selsmall]')
        self.assertEqual((big.count(), small.count()), (1, 1), 'Larger and Smaller buttons on the selection bar')
        for btn in (big, small):
            self.assertTrue(btn.is_visible()); self.assertTrue(btn.get_attribute('aria-label'))
            r = btn.bounding_box(); self.assertGreaterEqual(min(r['width'], r['height']), 44)
        self.assertEqual(big.evaluate("b=>getComputedStyle(b).textTransform"), 'uppercase'); self.assertGreaterEqual(int(big.evaluate("b=>getComputedStyle(b).fontWeight")), 700)
        w0 = self.bb(pg); big.focus(); pg.keyboard.press('Enter'); w1 = self.bb(pg)
        self.assertAlmostEqual((w1[2] - w1[0]) / (w0[2] - w0[0]), 1.25, delta=.06); self.assertAlmostEqual(self.docobjs(pg, cid)[0]['w'] / o0['w'], 1.25, delta=.03)
        pg.keyboard.press('Control+z'); self.assertEqual(self.docobjs(pg, cid)[0], o0)
        small.click(); self.assertAlmostEqual(self.docobjs(pg, cid)[0]['w'] / o0['w'], .8, delta=.03); self.assertEqual(self.errs, [])

    # ---------- A3: laser ----------
    LZ = """([s,id])=>{const h=document.querySelector(s),r=h.getBoundingClientRect(),mk=(n,x,y,b)=>new PointerEvent(n,{pointerId:id,pointerType:'pen',isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+x,clientY:r.top+y,pressure:.5,buttons:b});
        window.__lz=()=>{h.dispatchEvent(mk('pointerdown',40,50,1));for(let i=1;i<30;i++)document.dispatchEvent(mk('pointermove',40+i*8,50+Math.sin(i/3)*20,1))};window.__lzUp=()=>document.dispatchEvent(mk('pointerup',272,50,0))}"""
    # one wet-canvas pixel as [r,g,b,a], at host px
    WETPX = """([k,x,y])=>{const L=Annot._debug.layer(k),c=L&&L.wet;if(!c)return [0,0,0,0];const s=c.width/c.clientWidth;return [...c.getContext('2d').getImageData(Math.round(x*s),Math.round(y*s),1,1).data]}"""
    WETN = "k=>{const L=Annot._debug.layer(k);if(!L||!L.wet)return 0;const d=L.wet.getContext('2d').getImageData(0,0,L.wet.width,L.wet.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n}"
    def laser(self, fx):
        pg = self.page(); cid, sel = self.open_card(pg); k = 'q:' + cid
        pg.evaluate("v=>{S.pref.fx=v}", fx); pg.evaluate("()=>{Annot.state().tool='ls'}"); pg.evaluate(self.LZ, [sel, 9])
        pg.evaluate("()=>window.__lz()"); pg.wait_for_function("k=>(" + self.WETN + ")(k)>0", arg=k, timeout=3000)   # first frame painted (a fixed wait races on a busy machine)
        y = 50 + math.sin(5) * 20; return pg, cid, k, pg.evaluate(self.WETPX, [k, 160, y]), pg.evaluate(self.WETPX, [k, 160, y - 9])
    def test_laser_glows_with_a_white_hot_core_and_saves_nothing(self):
        pg, cid, k, core, off = self.laser('full')
        self.assertGreater(core[1], 150, 'the middle of the trail is white-hot, not flat red: %r' % core)
        self.assertGreater(off[3], 0, 'a soft glow reaches 9 px beside the trail')
        pg.evaluate("()=>window.__lzUp()"); pg.wait_for_timeout(1300); self.assertEqual(pg.evaluate(self.WETN, k), 0, 'gone after it fades')
        self.assertEqual(self.docobjs(pg, cid), []); self.assertEqual(pg.evaluate("()=>Annot._debug.dirty().length"), 0)
        self.assertEqual(pg.evaluate("k=>Annot._debug.undoDepth(k)", k), 0); self.assertEqual(self.errs, [])
    def test_laser_is_calm_on_minimal_effects(self):
        pg, cid, k, core, off = self.laser('min')
        self.assertGreater(core[3], 0, 'the trail is drawn'); self.assertEqual(off[3], 0, 'no glow on Minimal effects (cheap phones, reduced motion)')
        pg.evaluate("()=>window.__lzUp()"); pg.wait_for_timeout(650); self.assertEqual(pg.evaluate(self.WETN, k), 0, 'and it fades sooner')
        self.assertEqual(self.errs, [])

    # ---------- A4: highlighter ----------
    HOLD = """async ([s, pts, hold, tail])=>{const h=document.querySelector(s),r=h.getBoundingClientRect(),mk=(n,x,y,b)=>new PointerEvent(n,{pointerId:4,pointerType:'pen',isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+x,clientY:r.top+y,pressure:.5,buttons:b});
        h.dispatchEvent(mk('pointerdown',pts[0][0],pts[0][1],1));for(const q of pts.slice(1))document.dispatchEvent(mk('pointermove',q[0],q[1],1));
        const e=pts[pts.length-1],t0=performance.now();let i=0;   /* a resting pen keeps reporting sub-pixel moves */
        while(performance.now()-t0<hold){await new Promise(z=>setTimeout(z,40));i++;document.dispatchEvent(mk('pointermove',e[0]+(i%2?.4:-.4),e[1]+(i%3?.3:-.3),1))}
        for(const q of tail)document.dispatchEvent(mk('pointermove',q[0],q[1],1));const z=tail.length?tail[tail.length-1]:e;document.dispatchEvent(mk('pointerup',z[0],z[1],0))}"""
    def hl_page(self):
        pg = self.page(); cid, sel = self.open_card(pg); pg.evaluate("()=>{const P=Annot.state();Object.assign(P,{tool:'hl',hlc:'y'});P.sizes.hl=14}"); return pg, cid, sel, 'q:' + cid
    def test_held_marker_straightens_even_when_the_pen_trembles_and_its_end_follows_the_pen(self):
        pg, cid, sel, k = self.hl_page(); wave = [[30 + i * 5, 60 + 5 * math.sin(i * .5)] for i in range(41)]
        pg.evaluate(self.HOLD, [sel, wave, 750, []]); pg.wait_for_timeout(120)
        self.assertEqual(len(pg.evaluate("k=>Annot._debug.px(k,0)", k)), 2, 'holding still (with tremor) turns the wavy stroke into a straight line')
        pg.evaluate(self.HOLD, [sel, [[30, 150], [80, 152], [130, 149], [180, 151]], 750, [[220, 152], [260, 154], [300, 156]]]); pg.wait_for_timeout(120)
        p = pg.evaluate("k=>Annot._debug.px(k,1)", k)
        self.assertEqual(len(p), 2, 'after it straightens, moving on keeps it straight'); self.assertAlmostEqual(p[1][0], 300, delta=4, msg='and the end follows the pen')
        self.assertEqual(self.errs, [])
    EDGE = """([s, x0, x1, y0, y1])=>{const c=document.querySelector(s+' canvas.hl'),k=c.width/c.clientWidth,g=c.getContext('2d'),out=[];
        for(let x=x0;x<=x1;x+=4){const d=g.getImageData(Math.round(x*k),Math.round(y0*k),1,Math.round((y1-y0)*k)).data;let top=-1;for(let i=0;i<d.length/4;i++)if(d[i*4+3]>60){top=i/k;break}out.push(top)}return out}"""
    def test_marker_edges_are_smooth_despite_a_shaky_hand(self):
        pg, cid, sel, k = self.hl_page()
        self.draw(pg, sel, [[30 + i * 5, 60 + (2 if i % 2 else -2), .5] for i in range(61)])
        tops = pg.evaluate(self.EDGE, [sel, 100, 260, 40, 80]); self.assertTrue(all(t >= 0 for t in tops), tops)
        m = sum(tops) / len(tops); sd = (sum((t - m) ** 2 for t in tops) / len(tops)) ** .5
        self.assertLess(sd, .2, 'the top edge of the highlight is straight, not wavy (sd %.2f px)' % sd); self.assertEqual(self.errs, [])
    @staticmethod
    def png_rgb(b):   # minimal PNG decoder (8-bit RGB/RGBA, no interlace): CI has no Pillow
        import struct, zlib
        pos, idat, w = 8, b'', 0
        while pos < len(b):
            n, t = struct.unpack('>I4s', b[pos:pos + 8]); d = b[pos + 8:pos + 8 + n]; pos += 12 + n
            if t == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', d[:10]); ch = 4 if ct == 6 else 3
            elif t == b'IDAT': idat += d
        raw, rows, prev, i = zlib.decompress(idat), [], bytearray(w * ch), 0
        for _ in range(h):
            f, line = raw[i], bytearray(raw[i + 1:i + 1 + w * ch]); i += 1 + w * ch
            for x in range(len(line)):
                a = line[x - ch] if x >= ch else 0; up = prev[x]; c = prev[x - ch] if x >= ch else 0
                if f == 1: line[x] = (line[x] + a) & 255
                elif f == 2: line[x] = (line[x] + up) & 255
                elif f == 3: line[x] = (line[x] + (a + up) // 2) & 255
                elif f == 4:
                    p = a + up - c; pa, pb, pc = abs(p - a), abs(p - up), abs(p - c)
                    line[x] = (line[x] + (a if pa <= pb and pa <= pc else up if pb <= pc else c)) & 255
            rows.append([tuple(line[x * ch:x * ch + 3]) for x in range(w)]); prev = line
        return rows
    def test_highlights_stay_behind_light_text_on_dark_pages(self):   # regression guard: already true before this pass
        for theme in ('dark', 'fluo'):
            pg, cid, sel, k = self.hl_page()
            pg.evaluate("t=>{const d=document.documentElement;if(t==='dark')d.dataset.theme='dark';else{d.dataset.theme='light';d.classList.add('zz-pol')}}", theme); pg.wait_for_timeout(200)
            pg.evaluate("s=>document.querySelector(s).querySelector('p,li').scrollIntoView({block:'center',behavior:'instant'})", sel); pg.wait_for_timeout(700)   # the pager pane scrolls, not the window
            r = pg.evaluate("s=>{const h=document.querySelector(s),hr=h.getBoundingClientRect(),p=h.querySelector('p,li');const rg=document.createRange();rg.selectNodeContents(p);const c=[...rg.getClientRects()].find(c=>c.width>120);return {x:c.left,y:c.top,w:Math.min(c.width,300),h:c.height,hx:c.left-hr.left,hy:c.top-hr.top}}", sel)
            clip = {'x': r['x'] + 4, 'y': r['y'], 'width': r['w'] - 8, 'height': r['h']}
            light = lambda rows: sorted(min(px) for row in rows for px in row)[-12:]   # the lightest text pixels
            before = light(self.png_rgb(pg.screenshot(clip=clip)))
            self.draw(pg, sel, [[r['hx'], r['hy'] + r['h'] / 2], [r['hx'] + r['w'], r['hy'] + r['h'] / 2]]); pg.wait_for_timeout(150)
            after_rows = self.png_rgb(pg.screenshot(clip=clip)); after = light(after_rows)
            self.assertEqual(len(pg.evaluate("k=>Annot._debug.docs()[k].objs", k)), 1)
            self.assertGreater(sum(after) / len(after), sum(before) / len(before) - 12, '%s: light text keeps its colour under the highlight (%r -> %r)' % (theme, before[-3:], after[-3:]))
            tint = sum(1 for row in after_rows for px in row if px[0] - px[2] > 25)
            self.assertGreater(tint, 50, '%s: the highlight colour shows behind the text' % theme); self.assertEqual(self.errs, [])

    # ---------- MCQ sessions on phones: ink buttons live in the footer, not over the answers ----------
    COVER = """()=>{const f=document.getElementById('an-fab').getBoundingClientRect();return [...document.querySelectorAll('#v-mcqs button,#v-mcqs a')].filter(e=>{if(!e.offsetParent)return false;const a=e.getBoundingClientRect();return a.right>f.left&&a.left<f.right&&a.bottom>f.top&&a.top<f.bottom}).map(e=>e.textContent.trim().slice(0,16))}"""
    def test_mcq_ink_buttons_never_cover_answers_on_phones(self):
        pg = self.b.new_page(viewport={'width': 412, 'height': 860}, has_touch=True, is_mobile=True); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + '#/mcqs'); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_timeout(500)
        pg.locator('#v-mcqs [data-a=quick] >> visible=true').first.click(); pg.wait_for_function("()=>document.body.classList.contains('mx-live')"); pg.wait_for_timeout(600)
        for on in (False, True):
            self.assertEqual(pg.evaluate(self.COVER), [], 'pen %s: no answer or session control is covered' % ('on' if on else 'off'))
            g = pg.evaluate("()=>{const R=s=>document.querySelector(s).getBoundingClientRect(),p=R('#an-fab-on'),f=R('.mx-act');return {inFooter:p.top>=f.top&&p.bottom<=f.bottom&&p.right<=f.right,eye:getComputedStyle(document.getElementById('an-fab-eye')).display!=='none',w:Math.min(p.width,p.height)}}")
            self.assertEqual((g['inFooter'], g['eye']), (True, on), 'the pen sits in the session footer; eye and list appear only while it is on')
            self.assertGreaterEqual(g['w'], 44)
            if not on: pg.click('#an-fab-on'); pg.wait_for_timeout(300)
        self.assertTrue(pg.get_attribute('#an-fab-on', 'aria-label')); self.assertEqual(errs, []); pg.close()

if __name__ == '__main__': unittest.main()
