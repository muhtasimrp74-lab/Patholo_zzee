# -*- coding: utf-8 -*-
"""Stage 5, Option A PROBE (not wired into the build, nothing shipped changes).
Reads the BUILT legacy index.html and writes build/lazy/index.html + build/lazy/zzcards/<view>.json:
  - every <article class="card">...</article> is replaced by a <!--zzc:ID--> placeholder at the same DOM position;
  - the exact outerHTML of each card goes into a per-view JSON chunk;
  - every <script> after the first placeholder is turned into an inert <script type="text/zz-defer"> and a tiny loader
    fetches all chunks, swaps placeholders for the real cards, then re-creates those scripts IN ORDER, so the boot script
    sees the same DOM as in the inline build.
Usage: python3 tools/lazy_probe.py [--site .] [--out build/lazy]
"""
import re, os, sys, json, argparse, bisect
CARD = re.compile(r'<article class="card"[^>]*?id="(q\d+)"[^>]*>.*?</article>', re.S)
VIEW = re.compile(r'<div[^>]*class="view[^"]*"[^>]*id="v-([^"]+)"|<div[^>]*id="v-([^"]+)"[^>]*class="view')
SCRIPT = re.compile(r'<script\b([^>]*)>(.*?)</script>', re.S)
LOADER = r'''<script>
(function(){
 var ph=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT),n;
 while(n=w.nextNode()) if(n.data.indexOf('zzc:')===0) ph.push(n);
 var views={};ph.forEach(function(c){var p=c.data.slice(4).split('|');(views[p[1]]=views[p[1]]||[]).push(c)});
 var run=function(){
  var q=[].slice.call(document.querySelectorAll('script[type="text/zz-defer"]')),i=0;
  (function next(){
   if(i>=q.length)return;var o=q[i++],s=document.createElement('script');
   [].forEach.call(o.attributes,function(a){if(a.name!=='type')s.setAttribute(a.name,a.value)});
   if(o.src){s.async=false;s.onload=s.onerror=next;s.src=o.getAttribute('src');o.replaceWith(s)}
   else{s.text=o.text;o.replaceWith(s);next()}
  })()
 };
 Promise.all(Object.keys(views).map(function(v){return fetch('zzcards/'+v+'.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(m){
  views[v].forEach(function(c){var id=c.data.slice(4).split('|')[0],t=document.createElement('template');t.innerHTML=m[id];c.replaceWith(t.content)})})}))
 .then(run,function(){document.documentElement.setAttribute('data-zz-lazy-failed','1');run()});
})();
</script>'''
def build(site, out):
    s = open(os.path.join(site, 'index.html'), encoding='utf8').read()
    vs = [(m.start(), m.group(1) or m.group(2)) for m in VIEW.finditer(s)]; pos = [p for p, _ in vs]
    chunks = {}; res = []; last = 0; first = None
    for m in CARD.finditer(s):
        i = bisect.bisect(pos, m.start()) - 1; view = vs[i][1] if i >= 0 else '_none'
        chunks.setdefault(view, {})[m.group(1)] = m.group(0)
        res.append(s[last:m.start()]); res.append('<!--zzc:%s|%s-->' % (m.group(1), view)); last = m.end()
        if first is None: first = sum(len(x) for x in res[:-1])
    res.append(s[last:]); t = ''.join(res)
    head, tail = t[:first], t[first:]
    cut = [0]
    def defer(m):
        a = m.group(1)
        return m.group(0) if 'type=' in a else '<script type="text/zz-defer"%s>%s</script>' % (a, m.group(2))
    # scripts after the last placeholder are the boot scripts; the loader goes before the first of them
    lastph = tail.rfind('<!--zzc:'); lastph = tail.find('-->', lastph) + 3
    mid, rest = tail[:lastph], tail[lastph:]
    rest = SCRIPT.sub(defer, rest)
    k = rest.find('<script type="text/zz-defer"'); rest = rest[:k] + LOADER + rest[k:]
    os.makedirs(os.path.join(out, 'zzcards'), exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(head + mid + rest)
    for v, d in chunks.items():
        open(os.path.join(out, 'zzcards', v + '.json'), 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, sort_keys=True, separators=(',', ':')))
    return len(res) // 2, len(chunks)
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--site', default='.'); ap.add_argument('--out', default='build/lazy'); a = ap.parse_args()
    n, v = build(a.site, a.out); print('cards moved: %d into %d view chunks -> %s' % (n, v, a.out))
