#!/usr/bin/env python3
"""Merge numbered lists that were split into one <ol> per item (so every item showed '1.').
Idempotent. Bullets sitting between numbered items become nested under the preceding item.
Usage: python3 tools/fix_numbering.py   (rewrites index.html + tools/answers_by_id.json)"""
import re, json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
UL = r'<ul>(?:(?!</?ul>).)*</ul>'          # a flat <ul> block
NEST = re.compile(r'</li></ol>(%s)<ol>' % UL, re.S)
JOIN = re.compile(r'</ol><ol>')

def fix(h):
    prev = None
    while prev != h:
        prev = h
        h = NEST.sub(lambda m: m.group(1) + '</li>', h)   # ...item</li></ol><ul>..</ul><ol><li>  ->  ...item<ul>..</ul></li><li>
        h = JOIN.sub('', h)
    return h

if __name__ == '__main__':
    p = os.path.join(R, 'index.html'); s = open(p, encoding='utf8').read(); n = fix(s)
    open(p, 'w', encoding='utf8').write(n); print('index.html', len(s), '->', len(n))
    p = os.path.join(R, 'tools/answers_by_id.json'); d = json.load(open(p, encoding='utf8'))
    c = 0
    for k, v in d.items():
        if isinstance(v, str) and fix(v) != v: d[k] = fix(v); c += 1
    open(p, "w", encoding="utf8").write(json.dumps(d, ensure_ascii=False)) if c else None
    print('answers_by_id changed', c)
