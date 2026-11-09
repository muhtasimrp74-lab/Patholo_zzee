#!/bin/sh
# One command after staging and before every push. Rebuilds, then fails if the build changed a generated file that is not staged
# (index.html, _headers, content/, sw.js), runs the leak check and the fast structural tests. Prints PASS only if all is clean.
# Most CI failures so far were exactly these: an uncommitted generated file, a stale count, a forgotten step.
cd "$(dirname "$0")/.." || exit 1
python3 tools/build.py > /tmp/preflight-build.log 2>&1 || { echo "FAIL build (see /tmp/preflight-build.log)"; exit 1; }
python3 tools/tests/gen_manifests.py > /dev/null 2>&1; rm -rf dist
if ! git diff --quiet -- index.html _headers content/ sw.js; then
  echo "FAIL the build changed generated files that are not staged: git add index.html _headers content/ sw.js"; git diff --stat -- index.html _headers content/ sw.js; exit 1
fi
python3 tools/leak_check_local.py 2>&1 | tail -1 | grep -q "no verbatim" || { echo "FAIL leak check (python3 tools/leak_check_local.py)"; exit 1; }
( cd tools/tests && python3 -m unittest test_site.Build test_site.Identity test_site.Schema test_site.Pwa test_content_json > /tmp/preflight-tests.log 2>&1 ) || { echo "FAIL tests (see /tmp/preflight-tests.log)"; tail -5 /tmp/preflight-tests.log; exit 1; }
echo "PASS"
