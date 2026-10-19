"""Single content-check command (Python only; no npm needed). Run from anywhere:
  python3 tools/check_all.py [--size]
Runs in sequence, stops reporting nothing silently, and exits non-zero if ANY step fails:
  1. tools/integrity/check.py            legacy site self-checks (counts, ids, source links)
  2. tools/content_json.py               regenerate content JSON into build/content from the built site
  3. tools/integrity/check_content_json.py   schema + differential check of that JSON
  --size also prints the read-only index.html size breakdown (informational; never fails the run).
It does NOT rebuild the legacy site (use `python3 tools/build.py` first, ~3 min, when sources changed) and does NOT run
npm-dependent checks (tsc, vite build, unit tests, browser suites)."""
import subprocess, sys, os, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEPS = [('integrity check', ['tools/integrity/check.py']), ('generate content JSON', ['tools/content_json.py']),
         ('check content JSON', ['tools/integrity/check_content_json.py'])]
def main():
    failed = []
    for name, cmd in STEPS:
        t = time.time(); print('== %s' % name, flush=True)
        r = subprocess.run([sys.executable] + cmd, cwd=ROOT)
        print('-- %s: %s (%.1fs)\n' % (name, 'OK' if r.returncode == 0 else 'FAILED exit %d' % r.returncode, time.time() - t), flush=True)
        if r.returncode: failed.append(name)
    if '--size' in sys.argv: subprocess.run([sys.executable, 'tools/integrity/size_report.py'], cwd=ROOT)
    print('check_all: %s' % ('ALL OK' if not failed else 'FAILED: ' + ', '.join(failed))); return 1 if failed else 0
if __name__ == '__main__': sys.exit(main())
