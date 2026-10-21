# Decisions (made autonomously)

| Date | Decision | Reason |
|---|---|---|
| 2026-10-22 | Greeting time bands: morning 05-12, afternoon 12-17, evening 17-22, late night 22-05 ("Studying late"). | Matches how students describe their day; late night gets a calm line instead of a joke. |
| 2026-10-22 | Name shown is the first word of the name the owner typed; otherwise the account name, but never the generated "User 1234". | A first name feels personal; the generated phone label does not. |
| 2026-10-22 | Second line priority: continue the last question studied (read from the page), else streak, else learned count, else "Start with topic 01", else a daily study tip. | The most useful next action first; no filler. |
| 2026-10-22 | Plan badge ("All access", "Pro: Questions + MCQs", "Free plan") comes from the existing `/api/me` call; signed-out visitors get no badge. | Shows value without touching access logic (read-only). |
| 2026-10-22 | Kept the once-a-day name card and the 24-hour rule; only its design and copy changed. Banner stays a fixed overlay. | Existing behaviour and tests stay valid; an overlay cannot shift the layout. |
| 2026-10-22 | English only for the greeting. | The UI and content contain no Bangla text, so a Bangla mode would have nothing to match. |
| 2026-10-22 | Branch `ui/premium-greeting` starts from the unpublished home "Topics and progress" fix. | That fix was waiting for a token; one PR keeps both front-end changes together. |
| 2026-10-22 | No push or pull request from this session. | The GitHub token was deleted after the last task and none was provided; work is committed on the local branch, ready to push and open as a PR. |
| 2026-10-22 | MCQ rebuild delivered as a plan only (`docs/MCQ_REBUILD_PLAN.md`). | As requested; keeps storage keys, ids and gating unchanged by design. |
| 2026-10-22 | "Execute the MCQ plan" done as the highest-value, lowest-risk items inside the existing module (spaced repetition, due tile, weak-spot set, swipe) instead of the full rewrite. | A full rewrite of a 40 KB module in one pass would risk progress data and annotation features; the roadmap phases stay the path for the rest. |
| 2026-10-22 | Review intervals 1, 3, 7, 21 days; mastered after the fourth correct review. | Standard expanding intervals; short enough to matter before exams. |
| 2026-10-22 | Swipe needs 70 px horizontal travel within 600 ms and is disabled while annotation mode is on or when touching a canvas, input or the palette. | Prevents accidental page changes while drawing or writing notes. |
| 2026-10-22 | New progress field `vivaState.mcq.sr` only adds data; no existing key changes. | Keeps current progress and cloud sync safe. |
| 2026-10-22 | MCQ outage root causes fixed in the client: (1) questions loaded from gated chapters were added to the list but not to the id lookup, so any session with them crashed; (2) saved sessions naming questions the visitor cannot open (locked, or saved before gating) crashed at `#/mcqs/run`; (3) 16 chapter requests per MCQ visit hit the server's 60-per-minute chunk limit after a few visits. | Reproduced on a local copy of the production Worker (D1 chunks, real rate limiter) before fixing. |
| 2026-10-22 | Repeat visits use the user's own saved copy (per-user Cache Storage from Stage 6) without a request when `/api/me` shows the plan active and the copy is under a day old; otherwise the server is asked, and a 403 still wipes the copy. A 429 waits Retry-After (max 15 s) and retries once, then falls back to the saved copy. | Fixes the limit without touching the Worker or access rules; expiry and revocation still lock on the next visit. |
| 2026-10-22 | Locked MCQ chapters open Sign in / Upgrade instead of doing nothing; stale sessions are trimmed to questions the visitor can open. | A tap must always do something visible. |
| 2026-10-22 | The once-a-day warm-up no longer requests locked textbook chapters (they are not static files any more). | Saves 28 failed requests per visit on mobile data. |
