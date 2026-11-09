"""Service worker VERSION from the site's content: a hash of index.html and every file sw.js precaches (its CORE list).
Run last by build.py. Any change to a cached file gives a new VERSION, so installed copies always refresh, and nobody bumps it
by hand: parallel pull requests no longer collide on sw.js / sw_version.json, and 'forgot to bump' cannot happen."""
import hashlib, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def digest(root=ROOT):
    sw = open(os.path.join(root, 'sw.js'), encoding='utf8').read()
    core = re.findall(r"'([^']+)'", re.search(r'const CORE = \[(.*?)\];', sw, re.S).group(1))
    h = hashlib.sha1()
    for f in ['index.html'] + sorted(set(core) - {'./', 'index.html', 'sw.js'}):
        p = os.path.join(root, f)
        if os.path.isfile(p): h.update(f.encode() + b'\0'); h.update(open(p, 'rb').read())
    h.update(re.sub(r"const VERSION = '[^']*';", '', sw).encode())   # the worker's own code, without its VERSION line
    return 'pathviva-zzee-' + h.hexdigest()[:10]
def stamp(root=ROOT):
    p = os.path.join(root, 'sw.js'); s = open(p, encoding='utf8').read(); v = digest(root)
    s2 = re.sub(r"const VERSION = '[^']*';", "const VERSION = '%s';" % v, s, count=1)
    if s2 != s: open(p, 'w', encoding='utf8').write(s2)
    return v
if __name__ == '__main__': print(stamp())
