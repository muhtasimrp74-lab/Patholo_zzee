# -*- coding: utf-8 -*-
"""Replays tools/hand_edits.json onto ../index.html as the LAST build step.
These are the edits that were made directly in index.html (typo fixes, list numbering, motion layer link, home spacing)
and never reached the sources. Each hunk is anchored by the text before/after it and must match exactly once
(or by occurrence number `nth`); a mismatch stops the build so it can never silently drop an edit.
To add a new hand edit: build without it, edit index.html, then re-record the hunks (or better: fix the source)."""
import json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(H, '..', 'index.html')
s = open(P, encoding='utf8').read()
for n, h in enumerate(json.load(open(os.path.join(H, 'hand_edits.json'), encoding='utf8'))):
    key = h['pre'] + h['old'] + h['post']; hits = []; i = s.find(key)
    while i >= 0: hits.append(i); i = s.find(key, i + 1)
    k = h.get('nth', 0)
    if len(hits) <= k or (len(hits) > 1 and 'nth' not in h): sys.exit('hand_edits.json hunk %d does not anchor (%d matches): %r' % (n, len(hits), key[:90]))
    i = hits[k] + len(h['pre']); s = s[:i] + h['new'] + s[i + len(h['old']):]
open(P, 'w', encoding='utf8').write(s)
print('hand edits applied:', n + 1)
