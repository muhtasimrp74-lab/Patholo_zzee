# -*- coding: utf-8 -*-
"""Layer 2 leak check (CI, no private chunks). tools/leak_hashes.json holds 5-byte HMAC-SHA256(LEAK_KEY, window) values of
8-word windows of gated text, winnowed (W=5) to stay under 2 MB. Guaranteed to find a verbatim copy of 12+ consecutive
words; 8-11 word copies only sometimes. Never finds paraphrase, reordering, images/scans or items under 8 words.
  python3 tools/leak_check_ci.py              check (LEAK_KEY env var required, no unkeyed fallback)
  python3 tools/leak_check_ci.py --generate   regenerate the hash file (needs private-chunks/ and LEAK_KEY)"""
import os, re, sys, json, hmac, base64, hashlib, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import leak_check_local as L
ROOT, N, W, B = L.ROOT, L.N, 5, 5
HF = os.path.join(ROOT, 'tools', 'leak_hashes.json')
FREE_KEYS = re.compile(r'"(answer|answers|explanation|explanations)"\s*:', re.I)

def key():
    k = os.environ.get('LEAK_KEY', '').strip()
    if not k: sys.exit('leak_check_ci: LEAK_KEY is not set (no unkeyed fallback): FAILED')
    return k.encode()

def hseq(k, words):
    return [hmac.new(k, ' '.join(words[i:i + N]).encode('utf8'), hashlib.sha256).digest()[:B] for i in range(len(words) - N + 1)]

def winnow(hs):
    if len(hs) <= W: return set(hs[:1] and [min(hs)])
    return {min(hs[i:i + W]) for i in range(len(hs) - W + 1)}

def generate():
    k = key(); man = json.load(open(os.path.join(ROOT, 'content', 'manifest.json'), encoding='utf8'))
    gated, _, _ = L.protected(); keep = set()
    for cid, meta in man['chunks'].items():
        if meta['free']: continue
        c = json.load(open(os.path.join(L.PRIV, cid + '.json'), encoding='utf8'))
        for t in L.items(c):
            w = L.norm(t)
            # only windows that are still protected after removing public text
            hs = [h for i, h in enumerate(hseq(k, w)) if L.windows(w[i:i + N]) <= gated]
            keep |= winnow(hs)
    public = set()
    for f in L.targets():
        try: public |= set(hseq(k, L.norm(open(os.path.join(ROOT, f), encoding='utf8').read())))
        except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError): pass
    keep -= public  # drop truncated-hash collisions with today's tracked files
    blob = base64.b64encode(b''.join(sorted(keep))).decode()
    out = {'v': 1, 'n': N, 'winnow': W, 'bytes': B, 'count': len(keep), 'min_guaranteed_words': N + W - 1,
           'index_html_max_bytes': int(os.path.getsize(os.path.join(ROOT, 'index.html')) * 1.2), 'hashes': blob}
    open(HF, 'w').write(json.dumps(out, sort_keys=True) + '\n')
    print('leak_hashes.json:', len(keep), 'hashes,', os.path.getsize(HF), 'bytes')

def structural(meta):
    errs = []; idx = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
    if len(idx.encode('utf8')) > meta['index_html_max_bytes']: errs.append('index.html is over 120% of its Stage 1 size')
    man = json.load(open(os.path.join(ROOT, 'content', 'manifest.json'), encoding='utf8'))
    ok = {'kind', 'topic', 'title', 'items', 'free', 'bytes', 'sha256'}
    for cid, m in man['chunks'].items():
        if set(m) - ok or len(str(m.get('title', ''))) > 120: errs.append('manifest entry %s is not metadata-only' % cid)
    sums = {m['sha256'] for m in man['chunks'].values()}
    fs = [f for f in subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, check=True).stdout.decode().split('\0') if f]
    for f in fs:
        p = os.path.join(ROOT, f)
        if not os.path.isfile(p): continue
        b = open(p, 'rb').read()
        if f.startswith('private-chunks/') or hashlib.sha256(b).hexdigest() in sums: errs.append('tracked file is a chunk: ' + f)
        if f.endswith('.json') and FREE_KEYS.search(b.decode('utf8', 'replace')): errs.append('answer/explanation field in ' + f)
    free_view = man['free']['q'][2:]
    filled = re.findall(r'<div class="ans">(?!</div>)', idx)
    free_cards = man['chunks'][man['free']['q']]['items']
    if len(filled) > free_cards + 1: errs.append('index.html has %d filled answers, free sample has %d' % (len(filled), free_cards))
    i = idx.find('const MCQDATA=') + 14; j = idx.find(';\n', i); q = json.loads(idx[i:j])['q']
    fc = int(man['chunks'][man['free']['mcq']]['topic']) - 1
    if any(x['c'] != fc for x in q): errs.append('index.html MCQDATA holds non-free questions')
    if '<div class="view' in idx and 'id="v-%s"' % free_view not in idx: errs.append('free view missing')
    return errs, fs

def check():
    k = key(); meta = json.load(open(HF)); raw = base64.b64decode(meta['hashes'])
    hs = {raw[i:i + meta['bytes']] for i in range(0, len(raw), meta['bytes'])}
    errs, _ = structural(meta); hits = {}
    for f in L.targets():
        p = os.path.join(ROOT, f)
        if not os.path.isfile(p): continue
        try: t = open(p, encoding='utf8').read()
        except UnicodeDecodeError: continue
        n = len(set(hseq(k, L.norm(t))) & hs)
        if n: hits[f] = n
    errs += ['%s: %d keyed window matches' % (f, n) for f, n in sorted(hits.items())]
    print('leak_check_ci: %d keyed hashes. Finds verbatim copies of %d+ consecutive words for sure (%d-%d sometimes);'
          ' not paraphrase, reordering, images/scans, or items under %d words.' % (len(hs), meta['min_guaranteed_words'], N, meta['min_guaranteed_words'] - 1, N))
    for e in errs: print('FAIL', e)
    print('no verbatim matches found' if not errs else 'leak_check_ci: FAILED (%d)' % len(errs))
    return 1 if errs else 0

if __name__ == '__main__':
    if '--generate' in sys.argv: generate()
    else: sys.exit(check())
