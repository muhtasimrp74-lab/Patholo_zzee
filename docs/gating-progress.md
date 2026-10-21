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

## Stage 2: OK
- worker/ (TypeScript): GET /api/chunks/<id>.json. Manifest allowlist (404 unknown, no paths), free chunks public (max-age=300), gated: 401 no/forged/expired/refresh token, 403 no/wrong/expired entitlement, 200 with Cache-Control private, no-store + Vary Authorization. CORS: exact Pages origin + localhost only, never *.
- worker/wrangler.jsonc: STAGING ONLY (patholo-zzee-staging, D1 patholo-zzee-staging, R2 patholo-zzee-staging-chunks; database_id placeholder set in 2B). Root wrangler.jsonc (production Workers Builds) untouched.
- D1 migration 0001 (users, entitlements: unique user+entitlement, source payment|admin, note). worker/src/bundles.json: QNA, MCQ, TEXTBOOK, ALL, 365 days, BDT, placeholder prices. worker/scripts/upload-chunks.sh (sha256 check, refuses non-staging bucket), for 2B.
- Pinned: wrangler 4.148.0, @cloudflare/workers-types 5.20261006.1 (lockfile committed). JWT HS256 via WebCrypto, access tokens typ=access.
- Tests: full suite 142: 140 pass, 0 fail, 2 skipped; node 19/19; worker 5/5 with node:sqlite D1 (real migrations) + in-memory R2; also smoke-tested with wrangler dev --local (free 200, no session 401, unknown 404, no entitlement 403, valid 200 + no-store, expired 403). CI runs worker tests. Gate A: pages.yml step added, triggers/deploy unchanged, SAFE.
- Note: checking out a pre-Stage-1 branch and fast-forwarding past Stage 1 deletes the ignored private sources from the working tree; after any branch switch or sandbox reset run tools/restore_private.sh.

## Stage 3: OK
- Worker: POST /api/auth/google (RS256 vs Google JWKS, aud, iss, exp, verified email), /api/auth/otp/start|verify (provider adapter: Twilio Verify, mock in tests), /api/auth/refresh (rotate every time; reuse of a rotated token revokes the family), /api/auth/logout (revokes family), GET /api/me, GET /api/config. POSTs require JSON (forces CORS preflight).
- Migration 0002: devices, sessions (hashed refresh token, family, device, expires/rotated/revoked), otp_challenges (hashed phone + code, attempts, expiry, consumed), rate_limits. OTP: 10 min, single use, 5 attempts; 3 per number per 15 min (sliding), 10 per IP per hour (IP stored only as HMAC); 429 + Retry-After.
- Tokens: access JWT 15 min (stateless, memory only); refresh 30 days in localStorage 'zz-rt' (trade-off: readable by scripts on the origin; no custom domain for an HttpOnly cookie). Cross-tab refresh serialized with navigator.locks so tabs never reuse a token.
- Done: Python 142 pass, 0 fail, 2 skipped; worker 19/19 (incl. early Stage 5 server code); gating client tests 9/9. Real Google/SMS on staging: PENDING (2B + credentials). Gate A: no workflow change.
- Client tools/account.js: device id, refresh on load (chunk loads wait for it), sign-in dialog (Google button via GIS when /api/config has a client id; phone OTP), logout. Phones normalized to E.164 (+880), Bangla/Arabic/Devanagari digits accepted.

## Stage 4: OK (full suite ran on the Stage 5 commit, see below)
- Locked topics: 401 shows "Sign in", 403 shows "Upgrade" (calls zzUpgrade) in the answer slot, textbook chapter and MCQ banner; network errors show Retry. MCQs keep the free chapter usable when the rest is locked. After sign-in/payment (zz:auth) everything reloads; logout reloads the page so no unlocked content stays in it.
- Tests: locked view DOM holds no answer text and every chunk response is a bare {"error":"forbidden"}; expiry keeps all local data (localStorage snapshot), renewal unlocks with the same data; MCQ/textbook locked prompts. Progress/notes/bookmarks stay local (keyed by stable question ids) until Stage 7 sync.

## Stage 5: OK
- Worker: POST /api/pay/checkout (auth; price from worker/src/bundles.json only), POST /api/pay/ipn (verify_sign + gateway validation API), GET|POST /api/pay/return (re-verifies, 303 to #/account/order/<id>), GET /api/pay/orders/<id> (owner only; pending orders re-checked with the gateway; nothing at the gateway after 2 h = cancelled), GET /api/bundles. Gateway adapter: SSLCommerz sandbox default, mock in tests.
- Settlement in one D1 batch: payment_events insert (unique gateway id) + entitlement upserts + receipt + order paid, all conditional on the order being unpaid; amount (exact minor units), currency, order id and status must match the gateway's own record. Renewal extends from the current expiry. payment_orders doubles as the purchases table (no separate purchases table).
- Client tools/pay.js: upgrade dialog (bundle choice only), pending state with automatic re-check, receipt view; legal links in checkout and the footer. terms.html, privacy.html, refund.html marked DRAFT; added to the Pages site. docs/admin.md: 4 commands, tested against the real migrations. Gate A: pages.yml only copies 3 more files; SAFE.
- Done (stages 4+5, one run): Python 148: 146 pass, 0 fail, 2 skipped; worker 26/26 (incl. stage 7-8 server code); tags gating-stage-4-ok and -5-ok on the same commit. Real SSLCommerz sandbox payment: PENDING (2B + store credentials).

## Stage 6: OK (tests: OfflineCache 2/2)
- Opened gated chunks are saved in Cache Storage 'zz-chunks-<user id>' (the last signed-in user id is kept as 'zz-uid' so offline reads work before a refresh); offline, loadChunk reads only that user's cache. Wiped: logout (awaited before the page reloads), a 403 (expired entitlement), a failed refresh (session gone), and every other user's cache whenever someone signs in. The service worker still never touches /api/.

## Stage 7: OK
- Server: migration 0004 (user_progress, user_notes, user_annotations with updated_at/deleted, notes conflict flag; migration_uploads). POST /api/sync/upload (max 20 items, idempotent per upload_id incl. concurrent retries), GET /api/sync.
- Policy: progress = zzStore keys (vivaState split per top-level field, vivaQuiz, tbLast, tbDone, tbPos, tbSet, zz-fs, zz-flat) and annotations = pathviva-annot/meta: last write wins per key by timestamp. Notes = pathviva-annot/docs (highlights + text notes): keep both; the existing cloud copy is renamed '<key>#conflict-<ts>' and flagged.
- Client tools/sync.js: on first sign-in per user, upload in batches with stable upload ids (kept in 'zz-mig-id' until done), then pull and replace the local copies with the merged server copy; nothing local changes unless every batch is confirmed; 'zz-migrated:<uid>' marks it done. Tests: worker sync 4/4, client Migration 1/1.

## Stage 8: OK
- Chunk endpoint 60/min per user, OTP limits (Stage 3), all 429 + Retry-After. 3 devices per user: a 4th sign-in gets 409 with the device list and a 10-minute removal token; DELETE /api/devices/<id> revokes the device and its sessions; Account page (#/account, footer link) lists devices with Remove.
- Watermark: display name + first 8 chars of the user id, faint rotated SVG text over filled gated answers and gated textbook chapters. Tests: worker abuse 2/2, client AbuseClient 2/2.
- Note: sync.js/acctui.js are injected at the end of <body>; at the start their text collided with an anchor used by a build post-processing step and changed 10 answers' textbook links (caught by the content diff; fixed).

## Stage 9: OK (mock gateway; real checks pending)
- Abandoned payment: order stays pending; with nothing at the gateway after 2 h the order check marks it cancelled; no entitlement, no receipt (worker/test/pay.test.ts).
- Double callback: the same gateway id sent twice in a row and 3 times at once grants once with one receipt; a second gateway id for a paid order grants nothing (unique payment_events + unpaid-only grant in one batch).
- Late confirmation: a pending order is confirmed by the gateway query on the next order check (pending -> paid + receipt); money confirmed after a cancel still grants.
- Phone checklist: docs/phone-checklist.md. PENDING: needs Stage 2B staging URL + Google, Twilio and SSLCommerz sandbox credentials. Results: not yet reported.
- Load test (~200 requests, p50/p95/error rate): PENDING, no staging deployment.
- Final run (stages 6-9, one run): Python 153: 151 pass, 0 fail, 2 skipped (1 flaky toolbar test passed on 2 reruns); worker 26/26; node 19/19; both leak checks: no verbatim matches found. Gate A: pages.yml unchanged since Stage 5, SAFE. PR opened, not merged.

## CI follow-up (after PR #3)
- First PR run failed. Probe of the pre-Stage-1 code showed 7 of those failures already existed in CI (why Stage 0 found continue-on-error). Causes: CI fetched the newest vite (bundle check) and the newest Playwright/Chromium (viewport protocol errors and timing). Fix: CI runs npm ci and pins playwright==1.56.0 (the verified version); failing test names + error lines become annotations (tools/ci_failures.py). No test changed.
- Result: full CI green on 5bdc9d2 (tests, worker tests, assemble, validate, both leak checks with the LEAK_KEY secret); deploy skipped (not main). Gate A: triggers and main-only deploy unchanged, SAFE. gating/wip was force-pushed once to a probe commit and restored.

## Stage 2B: IN PROGRESS
- Gate A: new .github/workflows/staging.yml: push to gating/freemium (worker/app paths) + workflow_dispatch; job runs only on refs/heads/gating/*; never main, tags or pull_request; targets only patholo-zzee-staging Worker, D1 patholo-zzee-staging, R2 patholo-zzee-staging-chunks; secrets only via env (masked), JWT_SECRET generated in the runner. pages.yml unchanged. SAFE.
- CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID stored as Actions secrets via the API at the owner's request (token was pasted in chat: owner should roll it later). The sandbox cannot reach Cloudflare; everything runs in Actions.
- Run 2: D1 list/create OK; R2 bucket create failed: "Please enable R2 through the Cloudflare Dashboard" (code 10042). Blocked on the account owner enabling R2 (or approving chunks in D1 instead).

## Front-end pass (owner request)
- Found by screenshot review (phone 390x844): sign-in, plan and account dialogs were unstyled browser defaults; locked topics gave no sign until a card was opened; MCQ lock banner sat under the fixed top bar; internal ids ('qna') and US dates on the account screen; legal and account links missing from the visible footer and menu; an "or" divider with no Google button.
- Fixed: tools/zz.css (app theme variables only, light and dark), labelled dialogs with a close button and focus on the title, notice above locked questions, clearer copy per bundle, plan list with BDT prices, Account as a real page (#/account) with plan names, dates and devices (this device cannot remove itself), footer Legal column + Account link, menu Account button. Tests: gating 20/20 (2 new).

## Launch (owner: "deploy the Worker to production and merge PR 3 to main")
- No card, SMS provider or gateway: sign-in by phone/email + password (PBKDF2-SHA256, 20k iterations for the free-plan CPU limit, stored per hash; 10 tries/15 min per login, 30/h per IP); SMS codes and Google stay behind /api/config flags.
- Payments: manual bKash Send Money to 01792529076; buyer submits the TrxID (unique across orders); owner approves in GitHub Actions ("Admin: bKash orders"), which runs the same idempotent settlement as a gateway. Admin API key = HMAC(LEAK_KEY) (token could not write secrets); logs show no personal data, TrxIDs masked.
- Prices (owner): Question bank 500, MCQ 5,000, Textbook 10,000, Everything 14,000 BDT. Chunks in KV (no card), data in D1, both on the free plan.
- Production Worker patholo-zzee-app.muhtasimrp74.workers.dev serves app + API; GitHub Pages and patholo-zzee.muhtasimrp74.workers.dev call it cross-origin (CORS allow-list). Deployed only by production.yml (manual, main only). Not done: password reset (owner contact for now), staging.
