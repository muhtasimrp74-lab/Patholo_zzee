"""Extract a content manifest from a built site directory (legacy index.html now; Vite output later).
Usage: python3 tools/integrity/extract_content.py <site_dir> [out.json]
The manifest is what the differential integrity check compares; it deliberately captures content,
not markup chrome: question ids/codes/titles, answer-text hashes, source links, textbook chapters, MCQs.
"""
import re, json, os, sys, hashlib, html as H

def sha(t): return hashlib.sha1(t.encode('utf8')).hexdigest()[:12]
def text(h): return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

CARD = re.compile(r'<article class="card"[^>]*?id="(q\d+)"[^>]*>(.*?)</article>', re.S)

def read(p):
    with open(p, encoding='utf8') as f: return f.read()

def cards(s):
    out = {}
    for qid, body in CARD.findall(s):
        code = re.search(r'<span class="code">(.*?)</span>', body, re.S)
        title = re.search(r'<h4>(.*?)</h4>', body, re.S)
        ans = re.search(r'<div class="ans">(.*)', body, re.S)
        a = ans.group(1) if ans else ''
        src = re.findall(r'<a href="(#/textbook/[^"]+)"', a)
        a_nosrc = re.sub(r'<div class="srcbar">.*?</div>', '', a, flags=re.S)
        out[qid] = {'code': text(code.group(1)) if code else '', 'title': text(title.group(1)) if title else '',
                    'ans_text_sha': sha(text(a_nosrc)), 'ans_html_sha': sha(a_nosrc), 'src': src}
    return out

def js_const(s, name):
    m = re.search(r'const %s=(.*?);\s*(?:const|let|var|function|/\*|\n)' % name, s, re.S)
    return m.group(1) if m else None

def manifest(site):
    idx = read(os.path.join(site, 'index.html'))
    m = {'cards': cards(idx)}
    d = js_const(idx, 'DATA')
    try: m['data_rows'] = len(json.loads(d)) if d else None
    except Exception: m['data_rows'] = None
    for k in ('QMETA', 'QALIAS'):
        v = js_const(idx, k)
        try: m[k.lower() + '_sha'] = sha(json.dumps(json.loads(v), sort_keys=True)) if v else None
        except Exception: m[k.lower() + '_sha'] = sha(v or '')
    m['views'] = sorted(set(re.findall(r'<div class="view"[^>]*?id="v-([^"]+)"', idx)) | set(re.findall(r'<div[^>]*?id="v-([^"]+)"[^>]*?class="view', idx)))
    tb = os.path.join(site, 'textbook'); m['textbook'] = {}
    if os.path.isdir(tb):
        for fn in sorted(os.listdir(tb)):
            p = os.path.join(tb, fn)
            if fn.endswith('.html'):
                t = read(p); m['textbook'][fn] = {'sha': sha(t), 'blocks': len(re.findall(r'id="[^"]*"', t))}
            elif fn.endswith('.json'):
                m['textbook'][fn] = {'sha': sha(read(p))}
    for name, rel in (('source_map', 'tools/source_map.json'), ('mcqs', 'tools/mcqs.json')):
        p = os.path.join(site, rel)
        if os.path.exists(p): m[name + '_sha'] = sha(read(p))
    return m

if __name__ == '__main__':
    site = sys.argv[1] if len(sys.argv) > 1 else '.'
    mf = manifest(site)
    out = sys.argv[2] if len(sys.argv) > 2 else None
    s = json.dumps(mf, sort_keys=True, indent=0)
    if out: open(out, 'w', encoding='utf8').write(s)
    print('cards', len(mf['cards']), 'data_rows', mf['data_rows'], 'views', len(mf['views']), 'textbook files', len(mf['textbook']))
