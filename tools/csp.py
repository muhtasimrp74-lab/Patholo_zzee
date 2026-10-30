"""Content-security policy without 'unsafe-inline' scripts: every inline <script> is allowed by its SHA-256 hash.
Run last by build.py (after gate.py), and by lazy_probe.py for its copy. Rewrites the meta CSP of each page and, for the deployed
index.html, the script-src of _headers. Styles keep 'unsafe-inline' (style attributes are used throughout)."""
import base64, hashlib, os, re
SCRIPT = re.compile(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', re.S)
def hashes(html):
    out = set()
    for m in SCRIPT.finditer(html):
        t = re.search(r'type=["\']?([^"\'\s>]+)', m.group(1))
        if t and t.group(1) not in ('text/javascript', 'module'): continue   # data blocks are never executed
        out.add("'sha256-" + base64.b64encode(hashlib.sha256(m.group(2).encode('utf8')).digest()).decode() + "'")
    return sorted(out)
def script_src(hs): return "script-src 'self' " + ' '.join(hs)
def rehash(path):
    s = open(path, encoding='utf8').read(); hs = hashes(s)
    s2, n = re.subn(r"script-src 'self'(?: '(?:unsafe-inline|sha256-[A-Za-z0-9+/=]+)')*", script_src(hs), s, count=1)
    assert n == 1, 'no CSP meta in ' + path
    open(path, 'w', encoding='utf8').write(s2); return hs
def apply(root):
    for f in ('index.full.html', 'index.html'):
        p = os.path.join(root, f)
        if os.path.exists(p): hs = rehash(p)
    h = os.path.join(root, '_headers'); s = open(h, encoding='utf8').read()
    s2, n = re.subn(r"script-src 'self'(?: '(?:unsafe-inline|sha256-[A-Za-z0-9+/=]+)')*", script_src(hs), s, count=1); assert n == 1
    open(h, 'w', encoding='utf8').write(s2)
