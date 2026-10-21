"""Print each failing test of a unittest -v log as a GitHub annotation, with its last error line."""
import re, sys
log = open(sys.argv[1], encoding='utf8', errors='replace').read()
for b in re.split(r'\n={50,}\n', log)[1:]:
    head = b.split('\n', 1)[0]
    if not head.startswith(('FAIL:', 'ERROR:')): continue
    lines = [l for l in b.split('-' * 70)[1].strip().split('\n') if l.strip()] if '-' * 70 in b else []
    err = next((l for l in reversed(lines) if re.match(r'\w*(Error|Exception)\b|AssertionError', l.strip())), lines[-1] if lines else '')
    why = next((l.strip() for l in lines if 'intercepts pointer events' in l or 'not visible' in l or 'not stable' in l), '')
    print('::error::%s | %s%s' % (head[:150], err.strip()[:300], (' | ' + why[:200]) if why else ''))
