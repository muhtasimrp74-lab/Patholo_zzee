# Gating progress log

## Facts
- Pages origin: https://muhtasimrp74-lab.github.io/Patholo_zzee/ (no CNAME). Second prod target: Cloudflare Workers Builds, Worker `patholo-zzee` (root wrangler.jsonc, assets ".").
- Test command (CI): `python -m unittest discover -s tools/tests -v` (Playwright/Chromium works in sandbox). Also `npm run test:unit` (node, 19 tests, not in CI).
- Private content is ALSO tracked as build sources: tools/answers_by_id.json, tools/mcqs.json, tools/*_src, tools/*.txt, textbook/ch01-29.html. Stage 1 must handle (open item).

## Gate A (2026-10-21)
- pages.yml: triggers push[main], pull_request, workflow_dispatch. deploy job -> GitHub Pages (env github-pages, branch policy: main only). Was: deploy on any non-PR event (workflow_dispatch on any branch). Fix: deploy `if` adds `github.ref == 'refs/heads/main'`. Secrets: none. SAFE.
- Cloudflare Workers Builds (GitHub app, not a workflow): runs on every branch push. Probe: pushed gating/wip = main's commit 19754b9 (worst case identical redeploy). Production build of that commit = success; the branch build of the SAME commit = failure, so branches run the non-production (preview) command and deploy nothing. Historic branch builds: all failed. SAFE by evidence; keep root wrangler.jsonc unchanged; after each push check that the branch build is not `success` (if so, stop). Recommended: disable non-production branch builds in the dashboard.

## Test baseline (2026-10-21, commit 19754b9)
- unittest: 135 tests, 133 pass, 0 fail, 2 skipped (test_dist_offline x2: need a built dist/). Node test:unit: 19/19 pass.
- Sandbox (1 CPU, 4 GB) cannot run the suite in one process: browser tests leak pages, memory runs out, tests error. Ran each test in its own process: 2343 s. CI runs the normal single command.

## Stage 0: OK
- Branches gating/freemium, gating/wip created. Removed continue-on-error from the pages.yml test step; deploy job limited to main.
- git rm index.html.orig. Temporary failing test made `python -m unittest discover -s tools/tests` exit 1; test removed.
- Connectivity: github, npm, pypi OK; api.cloudflare.com, oauth2.googleapis.com, verify.twilio.com, sandbox.sslcommerz.com blocked (mocks, real checks pending).
- Post-push check: no Workers Builds run on 0f47835 after 4.5 min (non-production builds appear disabled). Credentials guide: docs/credentials.md. Token lacks Secrets permission (403): needed for Stage 1.

## Stage 1: OK
- Pre-Stage-1 source SHA: 3aee5cf0eaa5 (full content; private-chunks/ and private sources are regenerated from it).
- Build: tools/build.py writes index.full.html (full, gitignored, used by the old tests) then tools/gate.py writes the gated index.html, content/manifest.json, content/titles.json and private-chunks/ (72 chunks: 26 q, 17 mcq, 29 tb; largest 446 KB, none over 1 MB). Free: topic 01, MCQ ch 1, textbook ch01. index.html 3,523,471 -> 1,717,857 bytes (CI max 120%). Deterministic.
- 96 tracked source files held gated text (tools/answers*.md/json, mcqs.json, mcq_src, curate, textbook_src ch02-29, src/index.base.html, textbook/ch02-29.html): untracked, listed in tools/private_paths.txt, restored by tools/restore_private.sh from the SHA above. Decision: CI restores them too (they are in public history anyway) so build, stale check and full-content tests still run. Future content edits need a private home for these sources (open item).
- Leak limits: both layers find only verbatim copies of 8+ consecutive words; CI (keyed, winnowed W=5, 265,136 x 5-byte HMACs, 1.77 MB) is guaranteed only for 12+ words. Neither detects paraphrase, reordering, images/scans or items under 8 words: 22,027 of 42,410 text blocks (mostly list items and table cells) are under 8 words. Textbook headings and QMETA outline are treated as public.
- History: removing content from index.html does NOT remove it from git history or the already-deployed Pages/Cloudflare site. Options: history rewrite, rotate/reorder content, or accept exposure. Nothing destructive done.
- Client state (names only): zzStore/localStorage keys vivaState, vivaStatePrev, vivaStateCorrupt, vivaQuiz, tbLast, tbDone, tbPos, tbSet, zz-fs, zz-flat (MCQ progress lives inside vivaState.mcq); IndexedDB pathviva-annot, pathviva-ink, zz-kv; service worker sw.js (caches VERSION; now skips /chunks/ and /api/, precaches free ch01 only).
- LEAK_KEY: random, in /tmp/.leak_key and .dev.vars, stored as GitHub Actions secret LEAK_KEY via the API (2026-10-21). If lost: new key, regenerate tools/leak_hashes.json, update the secret, one commit.
- Done: 142 tests (incl. 7 new gating tests): 140 pass, 0 fail, 2 skipped (dist); node 19/19; typecheck OK; both leak checks: no verbatim matches found. Gate A: pages.yml triggers unchanged (push main, PR, dispatch), deploy main-only; new steps build/test/check only. SAFE.

## Stage 2: IN PROGRESS
