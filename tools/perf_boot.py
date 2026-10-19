# Stage 5 Option B measurement helper: cold boot time (4x CPU throttle, no service worker, median of 3).
# Needs: npm run build; python3 tools/lazy_probe.py --site dist --out build/lazy-site --full; build/nocards = lazy-site copy with the card swap script removed (lower bound).
import sys, threading, functools, http.server, socketserver, statistics
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
def run(d):
    socketserver.ThreadingTCPServer.allow_reuse_address=True
    srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=d)); url='http://127.0.0.1:%d/'%srv.server_address[1]
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    out=[]
    with sync_playwright() as p:
        b=p.chromium.launch()
        for i in range(3):
            c=b.new_context(service_workers='block'); pg=c.new_page()
            cd=c.new_cdp_session(pg); cd.send('Emulation.setCPUThrottlingRate',{'rate':4})
            pg.goto(url,wait_until='commit')
            pg.wait_for_function("()=>document.readyState!=='loading'",timeout=120000)
            pg.wait_for_function("()=>!document.documentElement.classList.contains('zz-boot')",timeout=120000)
            m=pg.evaluate("()=>{const n=performance.getEntriesByType('navigation')[0];const f=performance.getEntriesByName('first-contentful-paint')[0];return {dcl:n.domContentLoadedEventEnd,load:n.loadEventEnd,fcp:f?f.startTime:null,now:performance.now()}}")
            out.append(m); c.close()
        b.close()
    srv.shutdown()
    for k in ('fcp','dcl','load','now'): print(' ',k, round(statistics.median([o[k] or 0 for o in out])))
for name,d in (('inline','dist'),('lazy','build/lazy-site'),('nocards','build/nocards')):
    print(name); run(d)
