"""Welcome flow (first visit silent, daily dialog asks name, same-day banner, personal line). Same expectations must hold for the legacy welcome.js and the TS port."""
import os, json, threading, functools, http.server, socketserver, unittest, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIR = os.path.join(ROOT, os.environ.get('SITE_DIR', '.'))
STATE = json.dumps({"fav": [], "bm": [], "notes": {}, "learned": ["q1", "q2"], "sr": {}, "streak": {"n": 3, "last": "2026-10-18"}, "recent": [], "pref": {}})

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

class Welcome(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        h = functools.partial(Quiet, directory=DIR); socketserver.ThreadingTCPServer.allow_reuse_address = True; socketserver.ThreadingTCPServer.daemon_threads = True
        c.srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); c.url = 'http://127.0.0.1:%d/' % c.srv.server_address[1]
        threading.Thread(target=c.srv.serve_forever, daemon=True).start(); c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch()
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop(); c.srv.shutdown()

    def open(self, seed):
        ctx = self.b.new_context(service_workers='block'); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(self.url, wait_until='domcontentloaded')
        p.evaluate("d=>{for(const [k,v] of Object.entries(d))localStorage.setItem(k,v)}", seed); p.reload(wait_until='load'); p.wait_for_timeout(2600)
        return ctx, p, errs

    def test_first_ever_visit_is_silent_and_stamps_the_day(self):
        ctx, p, errs = self.open({})
        try:
            self.assertEqual(p.locator('.zz-wd, .zz-welcome').count(), 0); self.assertIsNotNone(p.evaluate("localStorage.getItem('zzWelcomeAt')")); self.assertEqual(errs, [])
        finally: ctx.close()

    def test_daily_dialog_saves_name_then_shows_banner_and_personal_line(self):
        ctx, p, errs = self.open({'vivaState': STATE, 'zzWelcomeAt': str(int(time.time() * 1000) - 3 * 864000000 // 1)})
        try:
            self.assertEqual(p.locator('.zz-wd').count(), 1)
            p.locator('.zz-wd input').fill('Muh'); p.locator('.zz-wd button').click(); p.wait_for_timeout(1500)
            self.assertEqual(p.evaluate("localStorage.getItem('zzName')"), 'Muh')
            self.assertEqual(p.locator('.zz-welcome').count(), 1); self.assertIn('Muh', p.locator('.zz-welcome b').inner_text())
            self.assertIn('Muh', p.locator('.zz-hi').first.inner_text()); self.assertEqual(errs, [])
        finally: ctx.close()

    def test_same_day_shows_banner_with_streak(self):
        ctx, p, errs = self.open({'vivaState': STATE, 'zzWelcomeAt': str(int(time.time() * 1000) - 3600000), 'zzName': 'Muh'})
        try:
            self.assertEqual(p.locator('.zz-wd').count(), 0); self.assertEqual(p.locator('.zz-welcome').count(), 1)
            self.assertIn('3-day', p.locator('.zz-welcome span').inner_text()); self.assertIn('Muh', p.locator('.zz-welcome b').inner_text()); self.assertEqual(errs, [])
        finally: ctx.close()

if __name__ == '__main__': unittest.main()
