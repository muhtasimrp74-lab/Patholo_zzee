"""Re-applies tools/answers_by_id.json (answers for the original systemic viva cards and the box-viva case cards,
keyed by question id) to ../index.html. Run AFTER tools/build.py, because those cards are not fed by answers.md."""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(H, '..', 'index.html')
h = open(P, encoding='utf8').read()
for n, html in json.load(open(os.path.join(H, 'answers_by_id.json'), encoding='utf8')).items():
    m = re.search(r'(<article class="card" id="q%s">.*?<div class="ans">)(.*?)(</div></article>)' % n, h, re.S)
    if m: h = h[:m.start(2)] + html + h[m.end(2):]
open(P, 'w', encoding='utf8').write(h)
