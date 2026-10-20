# -*- coding: utf-8 -*-
"""Layer 1 leak check (local, needs private-chunks/). Finds VERBATIM copies of 8+ consecutive words of any gated
answer, MCQ stem/explanation or textbook paragraph in tracked files and build output (_site/, dist/).
It cannot see paraphrase, reordering, images/scans, or items under 8 words. Prints file names and counts only."""
import os, re, sys, json, html, hashlib, subprocess, unicodedata
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIV = os.path.join(ROOT, 'private-chunks')
N = 8
_cat = {}
BLOCK = re.compile(r'</?(?:p|li|td|th|tr|h[1-6]|div|section|ol|ul|table|br|figcaption|caption|blockquote)\b[^>]*>', re.I)

def keep(c):
    k = _cat.get(c)
    if k is None: k = _cat[c] = c if unicodedata.category(c)[0] in 'LNM' else ' '
    return k

def norm(t):
    """NFKC, casefold, markup stripped, every non letter/digit/mark (any script) treated as a separator."""
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    return ''.join(keep(c) for c in unicodedata.normalize('NFKC', t).casefold()).split()

def windows(words):
    return {hashlib.blake2b(' '.join(words[i:i + N]).encode('utf8'), digest_size=8).digest() for i in range(len(words) - N + 1)}

def blocks(h):
    if not isinstance(h, str): return [b for x in h for b in blocks(x)]
    return [b for b in BLOCK.split(h) if b.strip()]

def items(chunk):
    """Yield the protected text blocks of one chunk."""
    if chunk['kind'] == 'q':
        for h in chunk['cards'].values(): yield from blocks(h)
    elif chunk['kind'] == 'mcq':
        for q in chunk['q']:
            yield from blocks(q['q'])
            if q.get('e'): yield from blocks(q['e'])
    else: yield from blocks(re.sub(r'<h[1-6]\b.*?</h[1-6]>', ' ', chunk['html'], flags=re.S | re.I))  # headings = public TOC

def qmeta():
    """Question-outline headings (QMETA) in index.html are public navigation; every string must stay heading-sized."""
    m = re.search(r'const QMETA=(\{.*?\});', open(os.path.join(ROOT, 'index.html'), encoding='utf8').read())
    strs = re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)) if m else []
    assert all(len(x) <= 120 for x in strs), 'QMETA holds a long string: not heading-sized metadata'
    return ' | '.join(strs)

def protected():
    man = json.load(open(os.path.join(ROOT, 'content', 'manifest.json'), encoding='utf8'))
    gated, public, short, total = set(), set(), 0, 0
    for cid, meta in man['chunks'].items():
        c = json.load(open(os.path.join(PRIV, cid + '.json'), encoding='utf8'))
        if c['kind'] == 'tb': public |= windows(norm(' '.join(re.findall(r'<h[1-6]\b.*?</h[1-6]>', c['html'], re.S | re.I))))
        if meta['free']: public |= windows(norm(' '.join(items(c))))
        for t in items(c):
            w = norm(t)
            if meta['free']: public |= windows(w); continue
            total += 1
            if len(w) < N: short += 1
            gated |= windows(w)
    for f in ('content/titles.json', 'content/manifest.json', 'textbook/index.json'):
        public |= windows(norm(open(os.path.join(ROOT, f), encoding='utf8').read()))
    public |= windows(norm(qmeta()))
    return gated - public, short, total

def targets():
    fs = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf8').split('\0')
    fs = [f for f in fs if f]
    for d in ('_site', 'dist'):
        for b, _, names in os.walk(os.path.join(ROOT, d)): fs += [os.path.relpath(os.path.join(b, n), ROOT) for n in names]
    return fs

def main():
    errs = []
    if subprocess.run(['git', 'ls-files', 'private-chunks'], cwd=ROOT, capture_output=True, text=True).stdout.strip():
        errs.append('private-chunks/ has tracked files')
    if subprocess.run(['git', 'check-ignore', '-q', 'private-chunks/x.json'], cwd=ROOT).returncode != 0:
        errs.append('private-chunks/ is not gitignored')
    hashes = {hashlib.sha256(open(os.path.join(PRIV, f), 'rb').read()).hexdigest() for f in os.listdir(PRIV)}
    gated, short, total = protected()
    hits = {}
    for f in targets():
        p = os.path.join(ROOT, f)
        if not os.path.isfile(p): continue
        b = open(p, 'rb').read()
        if hashlib.sha256(b).hexdigest() in hashes: errs.append('chunk file copied: ' + f)
        try: t = b.decode('utf8')
        except UnicodeDecodeError: continue
        n = len(windows(norm(t)) & gated)
        if n: hits[f] = n
    for f, n in sorted(hits.items(), key=lambda x: -x[1]): errs.append('%s: %d verbatim 8-word windows' % (f, n))
    print('leak_check_local: %d protected windows, %d of %d items under %d words are NOT covered.' % (len(gated), short, total, N))
    print('Limits: finds only verbatim copies of %d+ consecutive words; not paraphrase, reordering, images or scans.' % N)
    for e in errs[:400]: print('FAIL', e)
    if len(errs) > 400: print('FAIL ... and %d more' % (len(errs) - 400))
    print('no verbatim matches found' if not errs else 'leak_check_local: FAILED (%d)' % len(errs))
    return 1 if errs else 0

if __name__ == '__main__': sys.exit(main())
