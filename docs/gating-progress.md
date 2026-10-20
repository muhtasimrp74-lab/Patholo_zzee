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
