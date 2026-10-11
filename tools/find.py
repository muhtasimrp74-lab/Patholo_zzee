"""python3 tools/find.py tuberculosis  -> lists matching questions and whether they already have an answer;
with --add, appends an empty '## <exact question>' block for the chosen number to tools/answers.md."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import content
args = [a for a in sys.argv[1:] if not a.startswith('--')]; add = '--add' in sys.argv
words = [w.lower() for w in args if not w.isdigit()]; pick = [int(w) for w in args if w.isdigit()]
rows = [(t[0], it[1]) for t in content.TOPICS for it in t[3] if all(w in it[1].lower() for w in words)]
for i, (tid, q) in enumerate(rows[:40], 1): print('%2d. %s %s' % (i, '[has answer]' if q in content.ANSWERS else '[ no answer ]', q))
if add and pick:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'answers.md'), 'a', encoding='utf8') as f:
        for n in pick: f.write('\n## %s\n\n' % rows[n - 1][1])
    print('added', pick, 'to tools/answers.md')
