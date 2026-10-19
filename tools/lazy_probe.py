# -*- coding: utf-8 -*-
"""Stage 5, Option A PROBE (not wired into the build; nothing shipped changes).
Reads the BUILT legacy index.html and writes build/lazy/index.html + build/lazy/zzcards/all.js (+ per-view <view>.json for a later Option B):
  - every <article class="card">...</article> is replaced by a <!--zzc:ID|view--> placeholder at the same DOM position;
  - right after the last placeholder, a PARSER-BLOCKING <script src="zzcards/all.js"> (window.__zzc = {id: outerHTML}) and a synchronous
    swap script put every card back BEFORE the boot scripts run. Nothing is deferred, so execution order, `load` listeners (service worker
    registration, welcome flow, ...) and the DOM at boot are exactly as in the inline build. (A first async-loader attempt broke every
    window 'load' listener, because the scripts then ran after `load` had fired.)
Usage: python3 tools/lazy_probe.py [--site .] [--out build/lazy] [--full]
  --full copies the whole --site tree into --out first, so the result is a complete servable site (e.g. SITE_DIR=build/lazy-site for the
  existing browser tests), and adds zzcards/all.js to the copied service worker's install-time CORE list.
"""
import re, os, sys, json, argparse, bisect
CARD = re.compile(r'<article class="card"[^>]*?id="(q\d+)"[^>]*>.*?</article>', re.S)
VIEW = re.compile(r'<div[^>]*class="view[^"]*"[^>]*id="v-([^"]+)"|<div[^>]*id="v-([^"]+)"[^>]*class="view')
SWAP = '''<script src="zzcards/all.js"></script>
<script>
(function(){var m=window.__zzc,w=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT),n,ph=[];
 while(n=w.nextNode())if(n.data.indexOf('zzc:')===0)ph.push(n);
 if(!m){document.documentElement.setAttribute('data-zz-lazy-failed','1');return}
 var t=document.createElement('template');
 ph.forEach(function(c){t.innerHTML=m[c.data.slice(4).split('|')[0]];c.replaceWith(t.content)});window.__zzc=null})();
</script>'''
def build(site, out):
    s = open(os.path.join(site, 'index.html'), encoding='utf8').read()
    vs = [(m.start(), m.group(1) or m.group(2)) for m in VIEW.finditer(s)]; pos = [p for p, _ in vs]
    chunks = {}; res = []; last = 0; allc = {}
    for m in CARD.finditer(s):
        i = bisect.bisect(pos, m.start()) - 1; view = vs[i][1] if i >= 0 else '_none'
        chunks.setdefault(view, {})[m.group(1)] = m.group(0); allc[m.group(1)] = m.group(0)
        res.append(s[last:m.start()]); res.append('<!--zzc:%s|%s-->' % (m.group(1), view)); last = m.end()
    res.append(s[last:]); t = ''.join(res)
    k = t.rfind('<!--zzc:'); k = t.find('-->', k) + 3
    os.makedirs(os.path.join(out, 'zzcards'), exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(t[:k] + SWAP + t[k:])
    dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    open(os.path.join(out, 'zzcards', 'all.js'), 'w', encoding='utf8').write('window.__zzc=' + dump(allc).replace('</', '<\\/') + ';\n')
    for v, d in chunks.items(): open(os.path.join(out, 'zzcards', v + '.json'), 'w', encoding='utf8').write(dump(d))
    return len(allc), len(chunks)
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--site', default='.'); ap.add_argument('--out', default='build/lazy'); ap.add_argument('--full', action='store_true'); a = ap.parse_args()
    if a.full:
        import shutil; shutil.rmtree(a.out, ignore_errors=True); shutil.copytree(a.site, a.out)
    n, v = build(a.site, a.out)
    if a.full:
        sw = os.path.join(a.out, 'sw.js'); t = open(sw, encoding='utf8').read()
        assert 'const CORE = [\n' in t; open(sw, 'w', encoding='utf8').write(t.replace('const CORE = [\n', "const CORE = [\n  'zzcards/all.js',\n", 1))
    print('cards moved: %d (all.js + %d per-view chunks) -> %s' % (n, v, a.out))
