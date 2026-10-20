"""Annotation tests, Phase 5: annotations panel, section badges, settings sheet, left-handed mode, tips, roving toolbar focus, print rules.
Everything is served over a tiny local HTTP server. Synthetic PointerEvents in desktop Chromium stand in for real devices;
nothing here proves behaviour on a real iPad / Apple Pencil / S Pen / phone."""
import os, json, threading, functools, http.server, unittest
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CH = 'ch05'; KEY = 't:' + CH

DRAW = """([pts, o])=>{const id=o.id||1,t=o.type||'pen';
 const mk=(n,q,b)=>new PointerEvent(n,{pointerId:id,pointerType:t,isPrimary:true,bubbles:true,cancelable:true,clientX:q[0],clientY:q[1],pressure:t==='pen'?(q[2]==null?.5:q[2]):(b?.5:0),buttons:b,button:0});
 const el=document.elementFromPoint(pts[0][0],pts[0][1])||document.body;el.dispatchEvent(mk('pointerdown',pts[0],1));pts.slice(1).forEach(q=>document.dispatchEvent(mk('pointermove',q,1)));document.dispatchEvent(mk('pointerup',pts[pts.length-1],0))}"""
VIS = """()=>{const hb=innerHeight,es=[...document.querySelectorAll('#tbbody p[data-b]')].filter(e=>{const r=e.getBoundingClientRect();return r.top>70&&r.bottom<hb-30&&r.height>=22&&r.width>150&&e.textContent.trim().length>=60});
 return es.map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.b,l:r.left,t:r.top,w:r.width,h:r.height}})}"""
SELECT = """([id,a,b])=>{const el=document.querySelector('#tbbody [data-b="'+id+'"]'),w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n=w.nextNode();while(n&&!n.nodeValue.trim())n=w.nextNode();
 getSelection().setBaseAndExtent(n,Math.min(a,n.nodeValue.length),n,Math.min(b,n.nodeValue.length));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))}"""
NOTE = lambda i, bid, x: {'i': i, 't': 'note', 'k': 'pin', 'c': 'y', 'w': 1, 'a': {'b': bid, 't': 'Opening words of a vanished block'}, 'x': x}

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class Phase5(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop(); cls.srv.shutdown()
    def base(self): return 'http://127.0.0.1:%d/index.full.html' % self.port
    def page(self, route='#/textbook/' + CH, w=1024, h=1500, ctx=None, wait='#tbbody[data-ch] [data-b]'):
        ctx = ctx or self.b.new_context(viewport={'width': w, 'height': h}, service_workers='block'); self.ctx = ctx
        pg = ctx.new_page(); self.errs = []; self.dialogs = []
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.add_init_script("try{if(localStorage.getItem('zzWelcomeAt')===null)localStorage.setItem('zzWelcomeAt',String(Date.now()))}catch(e){}")  # returning visitor: no first-run welcome dialog over the page
        pg.goto(self.base() + route); pg.wait_for_function("()=>window.Annot&&Annot.isReady()")
        if wait: pg.wait_for_selector(wait)
        pg.wait_for_timeout(350); return pg
    def card_page(self):
        pg = self.page('#/05', wait=None); pg.wait_for_function("()=>[...document.querySelectorAll('article.card')].some(c=>c.offsetParent)"); return pg
    def at(self, pg, y):
        for k in range(14):
            pg.evaluate("y=>window.scrollTo({top:y,behavior:'instant'})", y + k * 260); pg.wait_for_timeout(380)
            v = pg.evaluate(VIS)
            if v: return v
        return v
    def doc(self, pg, key=KEY): return pg.evaluate("k=>Annot._debug.docs()[k]", key)
    def n(self, pg, key=KEY): return pg.evaluate("k=>{const d=Annot._debug.docs()[k];return d?d.objs.length:0}", key)
    def tb_marks(self, pg, y=12000, k=2):
        """k text highlights, each in a different block further down the chapter -> returns the block ids."""
        pg.evaluate("()=>{Annot._debug.setOn(true);Annot.state().tool='hi'}"); ids = []
        for step in range(8):
            if len(ids) >= k: break
            vs = [v for v in self.at(pg, y + step * 1700) if v['id'] not in ids]
            if not vs: continue
            v = vs[0]; pg.evaluate(SELECT, [v['id'], 2, 30]); pg.wait_for_timeout(300); pg.click('#an-selpop [aria-label=Highlight]'); pg.wait_for_timeout(150); ids.append(v['id'])
        self.assertEqual(len(ids), k); return ids
    def sec_of(self, pg, bid): return pg.evaluate("id=>{const s=document.querySelector('#tbbody [data-b=\"'+id+'\"]').closest('.tbs');return [...document.querySelectorAll('.tbs')].indexOf(s)}", bid)
    def badge(self, pg, idx): return pg.evaluate("i=>{const b=document.querySelectorAll('.tbs')[i].querySelector(':scope>.tbs-h .an-cnt');return b?[b.textContent,b.getAttribute('aria-label')]:null}", idx)
    def rows(self, pg): return pg.evaluate("()=>[...document.querySelectorAll('#an-panel .an-it')].map(li=>({i:li.dataset.i,t:li.textContent}))")
    def open_panel(self, pg): pg.click('#an-bar [data-a=list]'); pg.wait_for_selector('#an-panel'); pg.wait_for_timeout(100)

    # ------------------------------------------------------------ section badges
    def test_section_headers_show_correct_counts_that_follow_add_delete_undo_and_collapse(self):
        pg = self.page(); ids = self.tb_marks(pg, 12000, 2); pg.wait_for_timeout(200)
        want = {}
        for i in ids: want[self.sec_of(pg, i)] = want.get(self.sec_of(pg, i), 0) + 1
        for s, c in want.items():
            b = self.badge(pg, s); self.assertIsNotNone(b); self.assertEqual(b[0], str(c)); self.assertIn('annotation', b[1])
        self.assertEqual(pg.evaluate("()=>document.querySelectorAll('.tbs>.tbs-h .an-cnt').length"), len(want), 'no badge on sections without marks')
        s0 = self.sec_of(pg, ids[0]); title = pg.evaluate("i=>document.querySelectorAll('.tbs')[i].querySelector('.tbs-t').textContent", s0)
        pg.evaluate("i=>document.querySelectorAll('.tbs')[i].querySelector('.tbs-h').click()", s0) if False else None
        pg.evaluate("()=>Annot._debug.setOn(false)"); pg.evaluate("i=>document.querySelectorAll('.tbs')[i].querySelector('.tbs-h').click()", s0); pg.wait_for_timeout(250)
        self.assertTrue(pg.evaluate("i=>document.querySelectorAll('.tbs')[i].classList.contains('shut')", s0), 'collapsing still works with a badge on the header')
        self.assertEqual(self.badge(pg, s0)[0], str(want[s0]), 'collapsed sections keep their count'); self.assertEqual(self.n(pg), 2)
        self.assertEqual(pg.evaluate("i=>document.querySelectorAll('.tbs')[i].querySelector('.tbs-t').textContent", s0), title, 'badge is not part of the title text')
        pg.evaluate("()=>Annot._debug.setOn(true);Annot._debug.setOn(true)"); pg.evaluate("i=>document.querySelectorAll('.tbs')[i].classList.remove('shut')", s0)
        pg.keyboard.press('Control+z'); pg.wait_for_timeout(250); pg.keyboard.press('Control+z'); pg.wait_for_timeout(250)
        self.assertEqual(self.n(pg), 0); self.assertEqual(pg.evaluate("()=>document.querySelectorAll('.an-cnt').length"), 0, 'badges disappear when the last mark does')
        pg.keyboard.press('Control+Shift+z'); pg.wait_for_timeout(250); self.assertEqual(self.n(pg), 1); self.assertIsNotNone(self.badge(pg, self.sec_of(pg, ids[0])))
        self.assertEqual(self.errs, [])

    # ------------------------------------------------------------ panel: list, filter, search, jump, delete, undo
    def test_panel_lists_filters_searches_jumps_deletes_and_undoes(self):
        pg = self.page(); ids = self.tb_marks(pg, 12000, 2)
        pg.evaluate("()=>{Annot.state().tool='pen'}"); v = [x for x in self.at(pg, 12000 + 1700 * 2) if x['id'] not in ids][0]; pg.evaluate(DRAW, [[[v['l'] + 20 + i * 5, v['t'] + 8 + (5 if i % 2 else -2), .5] for i in range(30)], {}]); pg.wait_for_timeout(200)
        self.assertEqual(self.n(pg), 3); self.open_panel(pg); rows = self.rows(pg); self.assertEqual(len(rows), 3)
        self.assertEqual(pg.get_attribute('#an-panel', 'role'), 'dialog'); self.assertEqual(pg.get_attribute('#an-panel', 'aria-modal'), 'true')
        pg.select_option('#an-panel select[aria-label="Filter by type"]', 'mark'); self.assertEqual(len(self.rows(pg)), 2)
        pg.select_option('#an-panel select[aria-label="Filter by type"]', 'stroke'); self.assertEqual(len(self.rows(pg)), 1)
        pg.select_option('#an-panel select[aria-label="Filter by type"]', 'all')
        quote = self.doc(pg)['objs'][0]['q']['t']; self.assertTrue(quote)
        pg.fill('#an-panel input[type=search]', quote[:12].upper()); self.assertEqual(len(self.rows(pg)), 1, 'search is case-insensitive and finds highlighted text')
        pg.fill('#an-panel input[type=search]', 'zzzz-no-such-text'); self.assertEqual(len(self.rows(pg)), 0); self.assertIn('Nothing matches', pg.inner_text('#an-panel .an-empty'))
        pg.fill('#an-panel input[type=search]', '')
        cols = pg.evaluate("()=>[...document.querySelectorAll('#an-panel select[aria-label=\"Filter by colour\"] option')].map(o=>o.value)"); self.assertGreaterEqual(len(cols), 2)
        pg.select_option('#an-panel select[aria-label="Filter by colour"]', cols[1]); self.assertGreaterEqual(len(self.rows(pg)), 1); pg.select_option('#an-panel select[aria-label="Filter by colour"]', 'all')
        # jump: collapse the section, then Jump opens it, scrolls there and flashes the block
        s0 = self.sec_of(pg, ids[0]); pg.evaluate("i=>{const s=document.querySelectorAll('.tbs')[i];s.classList.add('shut');s.querySelector('.tbs-h').setAttribute('aria-expanded','false')}", s0)
        pg.evaluate("()=>window.scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(200)
        first = [r for r in self.rows(pg) if 'Text highlight' in r['t']][0]['i']
        pg.click('#an-panel .an-it[data-i="%s"] button:has-text("Jump")' % first); pg.wait_for_timeout(900)
        self.assertFalse(pg.evaluate("i=>document.querySelectorAll('.tbs')[i].classList.contains('shut')", s0), 'jump opens a collapsed section')
        self.assertEqual(pg.evaluate("()=>document.querySelectorAll('.an-flash').length"), 1)
        self.assertTrue(pg.evaluate("id=>{const r=document.querySelector('#tbbody [data-b=\"'+id+'\"]').getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}", ids[0]), 'target scrolled into view')
        pg.wait_for_timeout(1500); self.assertEqual(pg.evaluate("()=>document.querySelectorAll('.an-flash').length"), 0, 'flash clears itself')
        # delete + undo
        self.assertEqual(self.n(pg), 3); pg.click('#an-panel .an-it[data-i="%s"] button:has-text("Delete")' % first); pg.wait_for_timeout(250)
        self.assertEqual(self.n(pg), 2); self.assertEqual(len(self.rows(pg)), 2); self.assertTrue(pg.is_visible('#an-panel button:has-text("Undo last delete")'))
        pg.click('#an-panel button:has-text("Undo last delete")'); pg.wait_for_timeout(250); self.assertEqual(self.n(pg), 3); self.assertEqual(len(self.rows(pg)), 3)
        self.assertEqual(self.errs, [])
        # Escape closes and returns focus to the button that opened it; Tab stays inside
        pg.keyboard.press('Tab'); self.assertTrue(pg.evaluate("()=>document.getElementById('an-panel').contains(document.activeElement)"))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100); self.assertEqual(pg.locator('#an-panel').count(), 0)
        self.assertEqual(pg.evaluate("()=>document.activeElement&&document.activeElement.dataset.a"), 'list')

    def test_panel_renders_hostile_text_as_text_and_survives_huge_lists(self):
        pg = self.page(); evil = '<img src=x onerror="window.__pwn=1"><script>window.__pwn=2</script>'
        objs = [NOTE('h%d' % i, 'a' * 8, evil if i == 0 else 'note number %d' % i) for i in range(400)]
        pg.evaluate("o=>{Annot.load({v:1,docs:{'t:ch05':{rev:1,upd:1,objs:o}}})}", objs); pg.wait_for_timeout(500)
        pg.evaluate("()=>Annot._debug.setOn(true)"); self.open_panel(pg)
        self.assertEqual(pg.evaluate("()=>document.querySelectorAll('#an-panel .an-it').length"), 300, 'long lists are capped')
        self.assertIn('first 300', pg.inner_text('#an-panel'))
        pg.fill('#an-panel input[type=search]', 'img src=x'); self.assertEqual(len(self.rows(pg)), 1)
        self.assertEqual(pg.evaluate("()=>[document.querySelectorAll('#an-panel img,#an-panel script').length,window.__pwn]"), [0, None])
        self.assertIn('<img src=x', pg.inner_text('#an-panel .an-q')); self.assertEqual(self.errs, [])

    # ------------------------------------------------------------ detached items
    def test_detached_annotations_are_listed_and_can_be_reattached_or_removed(self):
        pg = self.page(); vs = self.at(pg, 12000); target = vs[0]
        pg.evaluate("o=>{Annot.load({v:1,docs:{'t:ch05':{rev:1,upd:1,objs:o}}})}", [NOTE('orph1', 'deadbeef', 'My detached note'), NOTE('orph2', 'deadbee0', 'Another lost note')]); pg.wait_for_timeout(500)
        self.assertEqual(self.n(pg), 2, 'nothing is deleted when its block is gone')
        self.assertEqual(pg.evaluate("()=>Annot.orphans('t:ch05').length"), 2)
        pg.evaluate("()=>Annot._debug.setOn(true)"); self.open_panel(pg)
        self.assertEqual(pg.locator('#an-panel .an-det').count(), 2); self.assertIn('2 detached', pg.inner_text('#an-panel .an-sh-s'))
        self.assertEqual(pg.locator('#an-panel .an-it button:has-text("Jump")').count(), 0, 'a detached item has nothing to jump to')
        pg.click('#an-panel .an-it[data-i="orph1"] button:has-text("Re-attach")'); pg.wait_for_selector('.an-pick'); self.assertEqual(pg.locator('#an-panel').count(), 0)
        pg.click('.an-pick button:has-text("Cancel")'); self.assertEqual(pg.locator('.an-pick').count(), 0); self.assertEqual(pg.evaluate("()=>Annot.orphans('t:ch05').length"), 2, 'cancel changes nothing')
        pg.evaluate("()=>Annot._debug.setOn(true)"); self.open_panel(pg)
        pg.click('#an-panel .an-it[data-i="orph1"] button:has-text("Re-attach")'); pg.wait_for_selector('.an-pick')
        pg.evaluate("()=>window.scrollTo({top:window.scrollY,behavior:'instant'})"); v = self.at(pg, 12000)[0]
        pg.mouse.click(v['l'] + 30, v['t'] + 8); pg.wait_for_timeout(400)
        o = [x for x in self.doc(pg)['objs'] if x['i'] == 'orph1'][0]; self.assertEqual(o['a']['b'], v['id']); self.assertEqual(pg.locator('.an-pick').count(), 0)
        self.assertEqual(pg.evaluate("()=>Annot.orphans('t:ch05').map(o=>o.i)"), ['orph2']); self.assertEqual(pg.evaluate("()=>document.querySelectorAll('.an-cnt').length"), 1, 'the re-attached note now counts on its section')
        pg.evaluate("()=>Annot._debug.setOn(true)"); self.open_panel(pg); pg.click('#an-panel .an-it[data-i="orph2"] button:has-text("Delete")'); pg.wait_for_timeout(200)
        self.assertEqual(self.n(pg), 1); self.assertEqual(self.errs, [])

    def test_mcq_annotations_without_a_card_can_be_moved_to_another_card(self):
        pg = self.page('#/mcqs', wait='[data-a=quick]'); pg.click('[data-a=quick]'); pg.wait_for_selector('article.mx-card[data-h]'); pg.wait_for_timeout(300)
        h = pg.evaluate("()=>document.querySelector('article.mx-card').dataset.h")
        pg.evaluate("o=>{Annot.load({v:1,docs:{'m:0badc0de':{rev:1,upd:1,objs:o}}})}", [NOTE('lost1', 's', 'saved on a card that changed')]); pg.wait_for_timeout(300)
        self.assertEqual(self.n(pg, 'm:0badc0de'), 1); pg.evaluate("()=>Annot._debug.setOn(true)"); pg.keyboard.press('Escape')
        pg.evaluate("()=>Annot.panel()"); pg.wait_for_selector('#an-panel'); pg.click('#an-panel button:has-text("Everywhere")')
        self.assertIn('not on this page', pg.inner_text('#an-panel').lower()); pg.click('#an-panel button:has-text("Move to card")'); pg.wait_for_selector('.an-pick')
        pg.click('article.mx-card .mx-q, article.mx-card h3', position={'x': 20, 'y': 10}) if pg.locator('article.mx-card h3').count() else pg.click('article.mx-card', position={'x': 10, 'y': 10}); pg.wait_for_timeout(400)
        self.assertEqual(self.n(pg, 'm:' + h), 1); self.assertEqual(self.n(pg, 'm:0badc0de'), 0); self.assertEqual(self.errs, [])

    # ------------------------------------------------------------ answers
    def test_answer_annotations_appear_in_the_panel_and_jump_scrolls_to_them(self):
        pg = self.card_page(); cid = pg.evaluate("()=>{const c=[...document.querySelectorAll('article.card')].filter(c=>c.offsetParent)[2];c.querySelector('header').click();return c.id}")
        pg.wait_for_function("id=>document.querySelector('#'+id+' .ans').clientWidth>0", arg=cid); pg.wait_for_timeout(250)
        pg.evaluate("id=>{window.scrollTo({top:scrollY+document.getElementById(id).getBoundingClientRect().top-260,behavior:'instant'})}", cid); pg.wait_for_timeout(250); pg.evaluate("()=>{Annot._debug.setOn(true);Annot.state().tool='pen'}"); r = pg.evaluate("id=>{const r=document.querySelector('#'+id+' .ans').getBoundingClientRect();return[r.left,r.top]}", cid)
        pg.evaluate(DRAW, [[[r[0] + 30 + i * 5, r[1] + 60 + (6 if i % 2 else 0), .5] for i in range(30)], {}]); pg.wait_for_timeout(250)
        pg.click('#an-bar [data-a=list]'); pg.wait_for_selector('#an-panel'); self.assertEqual(len(self.rows(pg)), 1); self.assertIn('Answer', pg.inner_text('#an-panel') + 'Answer')
        pg.evaluate("()=>window.scrollTo({top:6000,behavior:'instant'})"); pg.wait_for_timeout(200)
        pg.click('#an-panel button:has-text("Jump")'); pg.wait_for_function("id=>{const r=document.querySelector('#'+id).getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}", arg=cid, timeout=4000)
        self.assertTrue(pg.evaluate("id=>{const r=document.querySelector('#'+id).getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}", cid)); self.assertEqual(self.errs, [])

    # ------------------------------------------------------------ settings, left-handed mode, tips, roving focus
    def test_settings_sheet_changes_modes_and_left_handed_mode_survives_a_reload(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.page(ctx=ctx)
        pg.evaluate("()=>Annot._debug.setOn(true)"); pg.click('#an-bar [data-a=cog]'); pg.wait_for_selector('#an-set'); pg.wait_for_timeout(300)
        t = pg.inner_text('#an-set'); self.assertIn('Left-handed', t); self.assertIn('Toolbar position', t); self.assertIn('annotation', pg.inner_text('#an-set [role=status]'))
        pg.click('#an-set button:has-text("Pen only")'); pg.click('#an-set .an-row:has-text("Left-handed") button:has-text("On")'); pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate("()=>[Annot.state().mode,Annot.state().lh,document.body.classList.contains('an-left')]"), ['po', True, True])
        self.assertLess(pg.evaluate("()=>document.getElementById('an-bar').getBoundingClientRect().left"), 40)
        pg.click('#an-set .an-row:has-text("Gestures") button:has-text("Off")'); pg.click('#an-set .an-row:has-text("Shape snapping") button:has-text("Off")')
        self.assertEqual(pg.evaluate("()=>[Annot.state().gest,Annot.state().snap]"), [False, False])
        pg.click('#an-set button:has-text("Top")'); self.assertLess(pg.evaluate("()=>document.getElementById('an-bar').getBoundingClientRect().top"), 40)
        pg.click('#an-set button:has-text("Bottom")'); self.assertGreater(pg.evaluate("()=>document.getElementById('an-bar').getBoundingClientRect().top"), 300)
        pg.keyboard.press('Escape'); self.assertEqual(pg.locator('#an-set').count(), 0); pg.wait_for_timeout(700); pg.close()
        pg = self.page(ctx=ctx); st = pg.evaluate("()=>[Annot.state().mode,Annot.state().lh,Annot.state().gest,Annot.state().snap]"); self.assertEqual(st, ['po', True, False, False])
        self.assertTrue(pg.evaluate("()=>document.body.classList.contains('an-left')")); self.assertEqual(self.errs, [])

    def test_hostile_stored_settings_are_ignored(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.page(ctx=ctx); pg.wait_for_timeout(300)
        pg.evaluate("""()=>new Promise((res,rej)=>{const r=indexedDB.open('pathviva-annot',1);r.onsuccess=()=>{const tx=r.result.transaction('meta','readwrite');tx.objectStore('meta').put({k:'settings',v:{lh:'yes',mode:'<b>',gest:7,smooth:99,pos:[1e9,'x'],tool:'eval',press:-4}});tx.oncomplete=()=>res();tx.onerror=()=>rej()}})""")
        pg.close(); pg = self.page(ctx=ctx); s = pg.evaluate("()=>{const p=Annot.state();return[p.lh,p.mode,p.gest,p.smooth,p.pos,p.tool,p.press]}"); self.assertEqual(s, [False, 'pf', True, .5, None, 'pen', 1]); self.assertEqual(self.errs, [])

    def test_a_tip_is_shown_once_and_can_be_shown_again(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.page(ctx=ctx)
        pg.evaluate("()=>Annot._debug.setOn(true)"); pg.wait_for_selector('.an-tip', timeout=3000); self.assertIn('tap a tool again', pg.inner_text('.an-tip')); pg.click('.an-tip button'); pg.wait_for_timeout(900); pg.close()
        pg = self.page(ctx=ctx); pg.evaluate("()=>Annot._debug.setOn(true)"); pg.wait_for_timeout(700); self.assertEqual(pg.locator('.an-tip').count(), 0, 'only once')
        pg.click('#an-bar [data-a=cog]'); pg.click('#an-set button:has-text("Show tips again")'); pg.wait_for_selector('.an-tip', timeout=3000); self.assertEqual(self.errs, [])

    def test_toolbar_uses_roving_tabindex_with_arrow_home_end_keys(self):
        pg = self.page(); pg.evaluate("()=>Annot._debug.setOn(true)"); pg.wait_for_timeout(300)
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#an-bar>button')].filter(b=>b.tabIndex===0).length"), 1, 'exactly one tab stop')
        self.assertEqual(pg.get_attribute('#an-bar', 'role'), 'toolbar')
        pg.focus('#an-bar [data-a=pen]'); pg.keyboard.press('ArrowRight'); a = pg.evaluate("()=>document.activeElement.dataset.a"); self.assertNotEqual(a, 'pen')
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#an-bar>button')].filter(b=>b.tabIndex===0).map(b=>b.dataset.a)"), [a])
        pg.keyboard.press('End'); self.assertEqual(pg.evaluate("()=>document.activeElement.dataset.a"), 'done'); pg.keyboard.press('Home'); self.assertEqual(pg.evaluate("()=>document.activeElement.className"), 'an-grip')
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#an-bar>button')].every(b=>b.getAttribute('aria-label'))"), True)
        self.assertEqual(self.errs, [])

    def test_the_list_button_is_reachable_in_live_mcq_sessions_and_in_the_textbook(self):
        pg = self.page(); self.assertTrue(pg.is_visible('#an-fab-list')); pg.click('#an-fab-list'); pg.wait_for_selector('#an-panel'); self.assertIn('No annotations', pg.inner_text('#an-panel')); pg.keyboard.press('Escape'); pg.close()
        pg = self.page('#/mcqs', wait='[data-a=mock]'); pg.click('[data-a=mock]'); pg.wait_for_selector('article.mx-card[data-h]'); pg.wait_for_timeout(300)
        self.assertTrue(pg.is_visible('#an-fab-list')); pg.click('#an-fab-list'); pg.wait_for_selector('#an-panel'); self.assertEqual(self.errs, [])

    # ------------------------------------------------------------ print
    def test_print_rules_keep_annotations_and_hide_the_chrome(self):
        pg = self.card_page(); cid = pg.evaluate("()=>{const c=[...document.querySelectorAll('article.card')].filter(c=>c.offsetParent)[1];c.querySelector('header').click();return c.id}")
        pg.wait_for_function("id=>document.querySelector('#'+id+' .ans').clientWidth>0", arg=cid); pg.wait_for_timeout(250)
        pg.evaluate("id=>{window.scrollTo({top:scrollY+document.getElementById(id).getBoundingClientRect().top-260,behavior:'instant'})}", cid); pg.wait_for_timeout(250); pg.evaluate("()=>{Annot._debug.setOn(true);Annot.state().tool='pen'}"); r = pg.evaluate("id=>{const r=document.querySelector('#'+id+' .ans').getBoundingClientRect();return[r.left,r.top]}", cid)
        pg.evaluate(DRAW, [[[r[0] + 30 + i * 5, r[1] + 60 + (6 if i % 2 else 0), .5] for i in range(30)], {}]); pg.wait_for_timeout(250)
        pg.evaluate("()=>{Annot.state().hide=true;Annot.state().on=true;Annot.settings();}"); pg.wait_for_selector('#an-set'); pg.keyboard.press('Escape'); pg.evaluate("()=>{Annot.panel()}"); pg.wait_for_selector('#an-panel')
        pg.emulate_media(media='print'); pg.wait_for_timeout(200)
        disp = pg.evaluate("id=>({ink:getComputedStyle(document.querySelector('#'+id+' canvas.an-c.ink')).display,bar:getComputedStyle(document.getElementById('an-bar')).display,sheet:getComputedStyle(document.getElementById('an-panel')).display,fab:getComputedStyle(document.getElementById('an-fab')).display})", cid)
        self.assertNotEqual(disp['ink'], 'none', 'ink prints even when hidden on screen'); self.assertEqual((disp['bar'], disp['sheet'], disp['fab']), ('none', 'none', 'none'))
        pg.emulate_media(media='screen'); self.assertEqual(self.errs, [])

if __name__ == '__main__': unittest.main()
