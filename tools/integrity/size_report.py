"""Read-only size breakdown of a built index.html (never writes to it).
  python3 tools/integrity/size_report.py [site_dir] [--json]
Segments (bytes are UTF-8; percentages of the whole file): <style> blocks, inline <script> blocks (labelled by their
content, with big `const X=` data literals measured separately inside them), question cards (<article class="card">),
and the remaining markup. Segments are disjoint and sum to 100%."""
import re, os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
B = lambda s: len(s.encode('utf8'))
TOK = re.compile(r'<style\b[^>]*>.*?</style>|<script\b[^>]*>.*?</script>|<article class="card"[^>]*>.*?</article>', re.S)
CONST = re.compile(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\[{])')

def data_literals(js):
    """(name, bytes) of top-level `const X=[...]/{...}` literals, found by bracket matching (string-aware)."""
    out = []; i = 0
    while True:
        m = CONST.search(js, i)
        if not m: return out
        start = m.start(2); depth = 0; j = start; q = None
        while j < len(js):
            c = js[j]
            if q:
                if c == '\\': j += 1
                elif c == q: q = None
            elif c in '"\'`': q = c
            elif c in '[{': depth += 1
            elif c in ']}':
                depth -= 1
                if depth == 0: break
            j += 1
        size = B(js[m.start():j + 1])
        if size >= 2048: out.append((m.group(1), size))
        i = max(j, m.end())

def report(site):
    s = open(os.path.join(site, 'index.html'), encoding='utf8').read(); total = B(s); rows = []; pos = 0; rest = 0; cards = [0, 0]
    for m in TOK.finditer(s):
        rest += B(s[pos:m.start()]); pos = m.end(); t = m.group(0)
        if t.startswith('<article'): cards[0] += 1; cards[1] += B(t)
        elif t.startswith('<style'): rows.append(('style', t[:70].replace('\n', ' '), B(t), []))
        else:
            body = re.sub(r'^<script[^>]*>|</script>$', '', t, flags=re.S)
            attrs = re.match(r'<script([^>]*)>', t).group(1).strip()
            label = (attrs + ' ' if attrs else '') + body.strip()[:60].replace('\n', ' ')
            rows.append(('script', label, B(t), data_literals(body)))
    rest += B(s[pos:])
    return total, rows, cards, rest

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; site = a[0] if a else ROOT
    total, rows, cards, rest = report(site); pct = lambda n: '%5.1f%%' % (100.0 * n / total)
    kinds = {k: sum(r[2] for r in rows if r[0] == k) for k in ('style', 'script')}
    if '--json' in sys.argv:
        print(json.dumps({'total': total, 'style': kinds['style'], 'script': kinds['script'], 'cards': cards[1], 'card_count': cards[0], 'other': rest,
                          'scripts': [{'label': r[1], 'bytes': r[2], 'data': r[3]} for r in rows if r[0] == 'script']}, indent=1)); return 0
    print('index.html total: %d bytes (%.2f MB)' % (total, total / 1048576.0))
    print('%-34s %10d  %s' % ('question cards (%d)' % cards[0], cards[1], pct(cards[1])))
    print('%-34s %10d  %s' % ('<style> blocks (%d)' % sum(1 for r in rows if r[0] == 'style'), kinds['style'], pct(kinds['style'])))
    print('%-34s %10d  %s' % ('inline <script> blocks (%d)' % sum(1 for r in rows if r[0] == 'script'), kinds['script'], pct(kinds['script'])))
    print('%-34s %10d  %s' % ('other markup (views, nav, SVG...)', rest, pct(rest)))
    print('sum check: %d' % (cards[1] + kinds['style'] + kinds['script'] + rest))
    print('\nLargest blocks:')
    for k, label, n, data in sorted(rows, key=lambda r: -r[2])[:8]:
        print('  %-6s %9d %s  %s' % (k, n, pct(n), label))
        for name, dn in sorted(data, key=lambda x: -x[1])[:4]: print('           inside: const %s = %d bytes (%s)' % (name, dn, pct(dn)))
    return 0
if __name__ == '__main__': sys.exit(main())
