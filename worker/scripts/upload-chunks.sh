#!/bin/sh
# Stage 2B: upload every chunk in content/manifest.json to the STAGING R2 bucket after checking its sha256.
# Run from the repo root after tools/restore_private.sh. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
set -eu
BUCKET=${R2_BUCKET:-patholo-zzee-staging-chunks}
case "$BUCKET" in *-staging*) ;; *) echo "refusing: not a staging bucket" >&2; exit 1 ;; esac
python3 - <<'PY'
import json, hashlib, sys
m = json.load(open('content/manifest.json'))['chunks']
bad = [k for k, v in m.items() if hashlib.sha256(open('private-chunks/%s.json' % k, 'rb').read()).hexdigest() != v['sha256']]
sys.exit('chunk hash mismatch: %s' % bad if bad else 0)
PY
for id in $(python3 -c "import json;print(' '.join(sorted(json.load(open('content/manifest.json'))['chunks'])))"); do
  npx --prefix worker wrangler r2 object put "$BUCKET/chunks/$id.json" --file "private-chunks/$id.json" \
    --content-type application/json --remote >/tmp/up.log 2>&1 || { tail -n 8 /tmp/up.log | sed 's/^/::error::/'; exit 1; }
done
echo "uploaded $(python3 -c "import json;print(len(json.load(open('content/manifest.json'))['chunks']))") chunks to $BUCKET"
