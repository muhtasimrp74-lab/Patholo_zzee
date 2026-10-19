"""Playwright smoke suite served over http (service worker eligible). Works against the legacy site (repo root) and,
via SITE_DIR=dist, against the Vite build. Covers: home, topic page, card answer, textbook deep link, search, quiz, offline reload."""
import os, threading, functools, http.server, socketserver, unittest
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIR = os.path.join(ROOT, os.environ.get('SITE_DIR', '.'))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

class Smoke(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        h = functools.partial(Quiet, directory=DIR); socketserver.ThreadingTCPServer.allow_reuse_address = True; socketserver.ThreadingTCPServer.daemon_threads = True
        c.srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); c.url = 'http://127.0.0.1:%d/' % c.srv.server_address[1]
        threading.Thread(target=c.srv.serve_forever, daemon=True).start()
        c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch(); c.ctx = c.b.new_context(service_workers='allow'); c.errs = []
        c.p = c.ctx.new_page(); c.p.on('pageerror', lambda e: c.errs.append(str(e)))
        c.p.goto(c.url, wait_until='domcontentloaded', timeout=90000); c.p.wait_for_timeout(2000)
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop(); c.srv.shutdown()
    def go(self, h): self.p.goto(self.url + h, wait_until='domcontentloaded'); self.p.wait_for_timeout(600)

    def test_1_home(self):
        self.assertTrue(self.p.locator('#v-home').is_visible())
    def test_2_topic_and_card_answer(self):
        self.go('#/01'); self.assertTrue(self.p.locator('#v-01').is_visible())
        self.assertGreater(self.p.locator('#v-01 article.card').count(), 5)
        self.assertTrue(self.p.locator('#v-01 article.card').first.locator('.ans').is_visible())   # answers are shown by default outside quiz mode
    def test_3_card_deep_link(self):
        self.go('#/01/q3'); self.assertTrue(self.p.locator('#q3').count() == 1)
    def test_4_textbook_deep_link(self):
        self.go('#/textbook/ch11/82a064d3/q910'); self.p.wait_for_timeout(1500)
        self.assertTrue(self.p.locator('#v-textbook').is_visible()); self.assertGreater(len(self.p.locator('#v-textbook').inner_text()), 500)
    def test_5_search(self):
        self.go('#/01'); self.p.locator('#v-01 input.tq').first.fill('hypertension'); self.p.wait_for_timeout(700)
        n = self.p.evaluate("[...document.querySelectorAll('#v-01 article.card')].filter(c=>c.offsetParent).length")
        self.assertTrue(0 < n < self.p.locator('#v-01 article.card').count())
        self.p.locator('#v-01 input.tq').first.fill(''); self.p.wait_for_timeout(300)
        self.go('#/questions'); self.p.locator('#qfilter').fill('tuberculosis'); self.p.wait_for_timeout(900)
        self.assertGreater(self.p.evaluate("document.querySelector('#v-questions').innerText.toLowerCase().split('tuberculosis').length-1"), 0)
        self.p.locator('#qfilter').fill(''); self.p.wait_for_timeout(500)   # legacy: the Questions filter also hides cards on topic pages until cleared
    def test_5b_global_search_route(self):
        # '#/search' is a legacy route: the router keeps the home view and fills #res (the #gq box is hidden by the new home layout; pre-existing)
        self.go('#/search'); self.assertTrue(self.p.locator('#v-home').is_visible())
    def test_6_quiz(self):
        self.go('#/01'); self.p.evaluate('window.scrollTo(0,0)'); self.p.wait_for_timeout(500); self.p.locator('#v-01 .quizbtn').first.click(); self.p.wait_for_timeout(300)
        self.assertTrue(self.p.evaluate("document.body.classList.contains('quiz')"))
        c = self.p.locator('#v-01 article.card').first; self.assertFalse(c.locator('.ans').is_visible())
        c.locator('header').first.click(); self.p.wait_for_timeout(300); self.assertTrue(c.locator('.ans').is_visible())
        self.p.locator('#v-01 .quizbtn').first.click(); self.p.wait_for_timeout(200)
    def test_7_offline_reload(self):
        self.go('#/'); self.p.evaluate("navigator.serviceWorker.ready.then(()=>1)"); self.p.wait_for_timeout(4000)
        self.ctx.set_offline(True)
        try:
            self.p.reload(); self.p.wait_for_timeout(1500)
            self.assertTrue(self.p.locator('#v-home').is_visible()); self.assertGreater(self.p.locator('article.card').count(), 1000)
        finally: self.ctx.set_offline(False)
    def test_9_no_page_errors(self): self.assertEqual(self.errs, [])
if __name__ == '__main__': unittest.main()
