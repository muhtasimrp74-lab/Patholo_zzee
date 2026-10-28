"""Re-applies tools/answers_by_id.json (answers for the original systemic viva cards and the box-viva case cards,
keyed by question id) to ../index.html. Run AFTER tools/build.py, because those cards are not fed by answers.md.

Drift guard: if a card's question text is identical to an answers.md heading but the stored by-id answer says something
different, a warning is printed (non-fatal). Fix by re-rendering that entry from answers.md (content.ANSWERS)."""
import json, os, re, html, sys
H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, H)
P = os.path.join(H, '..', 'index.html')
h = open(P, encoding='utf8').read()
try:
    import content
    _n = lambda s: re.sub(r'[^a-z0-9]+', '', html.unescape(re.sub(r'<[^>]+>', '', s)).lower())
    _tok = lambda s: re.findall(r'[a-z0-9]+', html.unescape(re.sub(r'<[^>]+>', ' ', s)).lower())
    _AL = {_n(k): k for k in content.ANSWERS}
except Exception:
    content = None
import answers_upgrade   # build-time upgrade of every by-id answer (docs/answers_upgrades_log.md); no answer text is committed
for n, ans in ((k, answers_upgrade.upgraded(v)) for k, v in json.load(open(os.path.join(H, 'answers_by_id.json'), encoding='utf8')).items()):
    m = re.search(r'(<article class="card" id="q%s">)(.*?<div class="ans">)(.*?)(</div></article>)' % n, h, re.S)
    if m:
        if content:
            q = re.search(r'<h4>(.*?)</h4>', m.group(2), re.S)
            k = _AL.get(_n(q.group(1))) if q else None
            if k and _tok(content.ANSWERS[k]) != _tok(ans):
                print('answers_by_id drift: q%s differs from answers.md heading -> %s' % (n, k[:70]))
        h = h[:m.start(3)] + ans + h[m.end(3):]
open(P, 'w', encoding='utf8').write(h)
