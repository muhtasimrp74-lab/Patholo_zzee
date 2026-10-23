#!/bin/sh
# Restore the untracked private content sources (tools/private_paths.txt) from the pre-Stage-1 commit recorded in
# docs/gating-progress.md, then rebuild: index.full.html (full, gitignored), gated index.html and private-chunks/.
# Needs full git history (actions/checkout with fetch-depth: 0). Deterministic.
set -eu
cd "$(dirname "$0")/.."
SHA=$(grep -m1 -oE 'Pre-Stage-1 source SHA: [0-9a-f]+' docs/gating-progress.md | awk '{print $4}')
git archive "$SHA" $(cat tools/private_paths.txt) | tar -x
python3 tools/content_crypt.py unpack   # answers edited since Stage 1 (encrypted overlay; needs CONTENT_KEY)
python3 tools/build.py
