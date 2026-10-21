# MCQ section rebuild plan

Plan only: nothing in this document is built yet. Audited on branch `ui/premium-greeting` (tools/mcq.js, 332 lines, 40.8 KB).

## 1. Inventory (nothing here may be lost)

**Files and data flow**
- `tools/mcq.js`: the whole MCQ module (view `#/mcqs`, created with `mkView('mcqs', ...)`), inlined into `index.html` by `tools/build.py`.
- `tools/mcqs.json` + `tools/mcq_src/*` (private sources, restored by `tools/restore_private.sh`) → `const MCQDATA = {ch, q}` in the full page. Each question: `h` stable hash id, `c` chapter, `t` topic, `q` stem, `o` options, `a` answer, `e` explanation (214 of 884), `y` true/false statements flag, `s` source, `g`/`w` relevance and paper tags.
- `tools/gate.py`: free chapter 1 stays inline; chapters 2-17 become private chunks `mcq-02 … mcq-17`.
- `tools/chunks.js` → `zzMcqLoad(Q, done, V, mount)`: loads all gated chapters when `#/mcqs` opens, appends to `Q`, shows the lock banner (Sign in / Upgrade) and keeps chapter 1 usable when locked; `zzMcqReset` after sign-in or payment.
- Worker: `worker/src/chunks.ts` serves `mcq-*` chunks to holders of the `mcq` entitlement (bundles `MCQ` and `ALL`).
- `tools/home.js`: MCQ track card on Home (attempted / total, accuracy, weakest topics via `MCQDATA.ch`).
- `src/legacy/welcome.ts`: personal line on `v-mcqs` (accuracy over N answers).

**Routes (hash)**: `#/mcqs` home, `/run` live session, `/review`, `/result`, `/custom` builder, `/read` reading mode.

**Home screen**: resume card ("Pick up where you left off", scope and question n of N), "Suggested next" card (e.g. Start with Quick 10), Quick 10, Mock paper, Custom practice, Browse by chapter (whole chapter or per topic, practise or read), Weak spots (topics below target), Past papers (20-question sittings by year), Recent sessions (last 5), Your progress / Your accuracy (SBA right, True/False right, today, goal), Reset MCQ progress.

**Builder (`#/custom`)**: filters by chapter and topic, question type (SBA / True-False with 5 statements), Relevant / DU tags, past paper / source, status (answered, not answered, flagged, with notes), how many, order (syllabus or shuffled), timer, feedback "After each question" (practice) or "At the end" (exam), clear all filters, "No questions match" empty state.

**Live session**: one question at a time, SBA a-e or 5 true/false statements, Check answer, Next, Previous, Skip, Flag, bookmark (`bm`), "My note" per question (`nt`), palette grid (answered / not answered / flagged, jump), timer with auto-finish, Finish exam with confirmation (`tryFinish`), persistence every 10 s and on leave (`persist`), keyboard: ← → move, a-e answer, Enter = primary action.

**After**: results (score, per-type breakdown, time), Review answers (explanations, source), retry wrong, back to MCQs; reading mode with answers shown, notes visible.

**Stored progress** (inside `vivaState.mcq`, via `zzStore`): `p` per-question attempts `{n, k}`, `sess` saved session, `last`, `f` filters, `o` options, `bm` bookmarks, `nt` notes, `ms` milestones/goal, `rv` review state, `hist` recent sessions. Synced to the cloud by `tools/sync.js` as part of `vivaState` (progress, last write wins).

## 2. Problems today
- **Structure:** one 40 KB file of template strings and a single `mq()` router; HTML built with string concatenation and manual escaping; state is a mutable global (`sess`, `ST()`); no tests of its own apart from site-level ones.
- **Fragility:** the gated chapters arrive asynchronously and are pushed into a shared `Q` array; a saved session that points at locked questions depends on load order; data shape uses one-letter keys with mixed meanings (`y`, `g`, `w`).
- **Performance:** the full re-render of the view (`M.innerHTML`) on every action; all 16 locked chapters (about 290 KB) load at once when `#/mcqs` opens, even for a 10-question quiz.
- **UX:** no swipe on phones; the palette and the builder are dense on 390 px screens; explanations exist for only 214 of 884 questions and have no images; results do not say what to study next in chapter terms; true/false scoring rules are not explained in the UI.
- **Gating UX:** a locked user sees the free chapter only after a banner; there is no preview of what a locked chapter contains.

## 3. New features

| # | Feature | Benefit | Effort | Priority |
|---|---|---|---|---|
| 1 | Clear Practice vs Timed exam entry | One tap to the right mode; fewer builder steps | S | P1 |
| 2 | Spaced repetition for wrong answers | Mistakes come back at 1, 3, 7, 21 days until mastered | M | P1 |
| 3 | Per-chapter analytics page | See accuracy, attempts and time per chapter and topic | M | P1 |
| 4 | Weak-area detection with a "Fix it" set | Builds a 10-question set from the weakest topics automatically | S | P1 |
| 5 | Resume anywhere (cloud) | Continue the same session on another device after sign-in | M | P2 |
| 6 | Swipe and full keyboard navigation | Faster on phones; accessible on desktop | S | P2 |
| 7 | Review mode with filters | Review only wrong, flagged or noted questions after a session | S | P2 |
| 8 | Search across stems and options | Find a question you remember in seconds | M | P2 |
| 9 | Explanations with images | Morphology questions finally get pictures (needs content) | L | P3 |
| 10 | Bookmarks and notes hub | All saved MCQs and notes in one place, exportable | S | P3 |
| 11 | Offline per chapter | Chapters a paid user opened keep working offline (reuses the per-user chunk cache) | S | P2 |
| 12 | Streak and daily goal for MCQs | Small daily target shown on Home and in the greeting | S | P3 |

## 4. Premium design direction
- **Layout:** phone-first single column; question card with generous padding; options as 56 px full-width rows; sticky bottom action bar (Previous / Check or Next) inside the thumb zone; palette as a bottom sheet. Desktop: two columns (question, then side panel with palette and notes).
- **Typography:** stems in the body sans at 1.0625 rem / 1.6; chapter and result headings in the display serif (DM Serif Display) at real weight; tabular numbers for scores and timers.
- **Colour:** existing tokens (`--zz-*` in `tools/zz.css`): one accent (burgundy) for primary actions and the selected option; correct = sage, wrong = muted rose, never pure red/green; accent text switches to rose in dark mode.
- **Animation:** 150-220 ms: option press, card change (cross-fade + 8 px slide), result count-up once; all off under prefers-reduced-motion.
- **States:** skeleton question card while a chapter loads; empty states that offer the next action ("No flagged questions yet: flag one during practice"); errors with a retry button and the free chapter still usable.
- **Dark mode:** same components through the app variables; checked against WCAG AA for option text and score colours.

## 5. Free vs paid (existing gating)
- Free: chapter 1 (inline sample, about 59 questions), Quick 10 from chapter 1, practice mode, basic results.
- Paid (`mcq` entitlement via the MCQ or Everything bundle): all chapters, timed exams and past papers, analytics, spaced repetition, cloud resume, offline chapters.
- Locked chapters show their title, count and a 3-question preview list (titles only, no options or answers) with the existing Upgrade button. No change to entitlements, prices or the worker's access checks.

## 6. Technical approach
- **Data:** keep `MCQDATA` and the `mcq-NN` chunks unchanged on the wire. Add a small index (chapter, topic, type, tags, id) to the free page so filters and counts work before chunks load; load only the chapters a session needs (`loadChunk` per chapter).
- **State:** one small store module (plain JS, no framework) with explicit actions (`start`, `answer`, `check`, `move`, `finish`) and a render function per screen; keyed DOM updates instead of full `innerHTML` replaces.
- **Hosting:** stays a static page on GitHub Pages and the app Worker; no build-tool change beyond the existing Vite step for TypeScript modules (`src/legacy/*.ts` → `tools/*.js`).
- **Keeping progress safe:** same storage keys inside `vivaState.mcq` (`p`, `sess`, `bm`, `nt`, `hist`, …) and the same question ids (`h`); a one-time, versioned migration only adds fields; sync stays on `tools/sync.js`. Access stays on the worker (`/api/chunks/mcq-*`) and the entitlement table; the client never decides access.

## 7. Roadmap (each phase ships)
1. **Phase 1 — Foundations without visible change.** Store module, per-chapter loading, tests for every inventory item above. *Checklist:* all existing MCQ tests pass; a saved session from the current version resumes; locked user still gets chapter 1; no new network requests on Home.
2. **Phase 2 — New session screen.** Practice/Exam entry, new question card, sticky actions, swipe and keys, skeletons. *Checklist:* 390 px and 1280 px screenshots; keyboard-only run; reduced motion; dark mode contrast; timer accuracy over 10 minutes.
3. **Phase 3 — Learning features.** Spaced repetition, weak-area "Fix it" set, review filters. *Checklist:* repetition dates computed in local time; wrong answers resurface; review filters match counts.
4. **Phase 4 — Analytics and search.** Per-chapter analytics page, search. *Checklist:* numbers match `vivaState.mcq.p`; search finds stems with Unicode text; works offline for opened chapters.
5. **Phase 5 — Content and cloud.** Explanations with images (content work), cloud resume, bookmarks hub. *Checklist:* images lazy-load and fit 390 px; resume on a second device; leak checks still pass for new content.
