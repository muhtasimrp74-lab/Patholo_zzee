# CLAUDE.md

Working notes for an AI assistant (or a new engineer). Read this first; it replaces reading the long docs.

## What this is
Patholo_zzee: an offline-capable, single-page pathology revision site (questions with answers, MCQs, the Robbins textbook, handwriting
annotations). The page is **generated**: `tools/build.py` assembles `index.html` from a template, content sources and the CSS/JS layers.

## Never do
- **Never read or hand-edit `index.html`** (1.9 MB, generated, very long lines). Find things with `grep -o '.{0,80}needle.{0,80}' index.html | head`.
- Never bump the service-worker `VERSION` by hand: the build stamps it from the content it caches.
- Never commit gated content. Paths in `tools/private_paths.txt` are untracked on purpose (answers, MCQs, textbook sources, the page template).
- Do not change answer or textbook line pitch or block spacing inside `.ans` / `#tbbody` (27.2px paragraphs and 25.6px list lines in answers; 29.4px and 26.4px in the textbook): saved annotations sit on those lines. The family changed once, on the owner's instruction (2026-11-13), to Times New Roman at a size that keeps the old pitch.
- Many source files have very long lines. Read with `cut -c1-200` or `grep -o`, not `cat`.

## Layout
| Path | What it holds |
|---|---|
| `index.html`, `sw.js`, `_headers`, `manifest.json`, `welcome.js`, `zz-store.js` | Deployed as-is. `index.html`, `_headers`, the `sw.js` VERSION and the two bundles are build outputs, committed. |
| `annot/` | Annotation engine (`annot.js`, `annot.css`), served directly, not inlined. |
| `icons/`, `fonts/`, `textbook/`, `content/` | Static assets and generated textbook / content manifests. |
| `src/legacy/*.ts`, `src/storage/` | TypeScript sources for Home, Textbook, Welcome and the storage layer. `npm run build:classic` writes `tools/js/home.js`, `tools/js/textbook.js`, `welcome.js`, `zz-store.js` (committed). |
| `tools/build.py` | The build. Everything else in `tools/` is called by it or is a one-off content tool. See `tools/README.md`. |
| `tools/css/`, `tools/js/` | The page's CSS and JS layers, inlined by the build. Load order is set in `build.py`. **`tools/css/plain.css` loads last** and holds the palette, the type system and the look overrides. |
| `tools/src/index.base.html` | The page template. **Untracked.** Edits that belong in it are anchored replacements in `build.py`. |
| `tools/tests/` | Playwright + unittest suites. |
| `worker/` | Cloudflare Worker: accounts, payments, gated chunks. |
| `docs/` | Decisions and history. `MIGRATION_STATUS.md` (root) is the chronological log; you rarely need it. |

## Commands
```sh
sh tools/restore_private.sh        # fresh clone: restore untracked private sources from history, then build
python3 tools/build.py             # rebuild index.html, index.full.html, _headers, sw.js VERSION (about 2 minutes)
npm run build:classic              # only after editing src/**/*.ts
sh tools/preflight.sh              # before a push: rebuild and fail if a generated file is stale
cd tools/tests && python3 -m unittest test_site      # one suite; the whole set takes about 40 minutes
```
The build is deterministic. After a refactor, `git status` must show no change to `index.html`, `sw.js` or `_headers`.

## Where to change things
| To change | Edit |
|---|---|
| Colours, fonts, type scale, radii, shadows, button look | `tools/css/plain.css` |
| Page banners (Questions, Chapters, MCQs, Textbook, Menu) | `tools/js/pagebanner.js`, `tools/css/pagebanner.css` |
| Home | `src/legacy/home.ts`, `tools/css/home.css` |
| Questions list, filters, Chapters header | `tools/js/questions.js`; chapter cards and Sort are in `tools/build.py` |
| MCQs | `tools/js/mcq.js`, `tools/css/mcq.css`, `tools/css/mcq_glass.css` |
| Textbook reader | `src/legacy/textbook.ts`, `tools/css/textbook.css`, `tools/textbook_build.py` |
| Annotations (pen, highlighter, pen-only mode) | `annot/annot.js`, `annot/annot.css` |
| Footer | `tools/js/sitefooter.js`, `tools/css/sitefooter.css` |
| Visual-effects levels (Full / Minimal / Off) | `tools/js/fx.js` |
| Sign-in, payments, gated chunks (client) | `tools/js/account.js`, `tools/js/pay.js`, `tools/js/chunks.js`, `tools/gate.py` |
| What is cached offline | `CORE` list in `sw.js` (add every new font or image there) |
| Answer formatting passes | `tools/format_answers*.py`, `tools/source_links.py` |

## Things that bite
- "Related questions" rows are scored from each card's plain text at idle time. Changing text inside cards (even a separator) changes them.
- `tools/hand_edits.json` replays anchored edits last in the build; if you change the text an anchor sits on, the build stops and names the hunk.
- `tools/tests/test_lazy_probe.py` compares two builds of the page; anything that changes the DOM on a timer can make it flaky.
- CSS in the older layers uses ids and `!important` freely. `plain.css` wins with `:is(*,#zzp#zzp)` (matches everything, counts as two ids).
- In some sandboxes, tests that call `set_viewport_size` fail with a Playwright protocol error; that is environmental.


## Design system (2026-11-13)

`tools/css/plain.css` (loaded last) is the design layer; its header comment explains the idea. Four typefaces only, one job each: TAN Buster (wordmark, top-level page titles), Anton (headings, numerals), Oswald (interface), Times New Roman (everything read; Tinos is the metric-compatible fallback where it is not installed). `test_only_the_four_typefaces_are_used` enforces this. Palette is H&E: haematoxylin ink `#23153A`, eosin `#F4B9CA` (titles on the dark bands, selection), burgundy `#7A1F36` for actions. Page title bands are compact and dark (plate + gradient) and all the same height: `--band-h` (300px from 1000px wide, 280px below). `--rule` is the soft line colour (equal to `--line2`), drawn at `--rule-w` (1px); ink-coloured 2px rules are gone. One type ladder: page title, section heading (`--t-xl`), feature title 1.3125rem, item title 1.1875rem, 12px floor for list tags. The fluorescence mode was removed (2026-11-14). Corners are square (build.py rewrites radii: panels 0, controls 2px). Banner artwork is reprinted as two-colour plates by `tools/make_duotone.py`; the share card by `tools/make_og.py`.
