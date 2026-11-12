# tools/

Everything that builds, checks or prepares the site. The site itself is the generated `../index.html`.
Run scripts from the repo root, e.g. `python3 tools/build.py`. Each script's docstring has the details.

## Build pipeline (run by `build.py`, in this order)
| Script | Job |
|---|---|
| `build.py` | Assembles the page from `src/index.base.html`, `content.py`, `css/` and `js/`, then runs the steps below. |
| `apply_answers_by_id.py` | Applies `answers_by_id.json` (answers keyed by question id). |
| `format_answers.py`, `format_answers2.py`, `format_answers3.py` | Emphasis and structure passes on answer HTML. Wording never changes. |
| `fix_numbering.py`, `split_semicolons.py` | List and table tidy-ups. Idempotent. |
| `source_links.py` | "From the textbook" links under answers. |
| `mcq_enrich.py` | MCQ explanations and chapter mapping. |
| `apply_hand_edits.py` | Replays `hand_edits.json` (anchored manual edits) last. |
| `gate.py` | Splits the full build into the public `index.html` and private chunks. |
| `strip_comments.py` | Strips CSS/JS comments from the generated pages only. |
| `csp.py` | Writes script hashes into `_headers`. |
| `sw_stamp.py` | Stamps the service-worker `VERSION` from what it caches. |

## Page layers
| Folder | Contents |
|---|---|
| `css/` | Stylesheets inlined into the page. `plain.css` is loaded last (palette, type system, look). |
| `js/` | Scripts inlined into the page. `home.js` and `textbook.js` are bundles built from `../src/legacy/*.ts`; do not edit them by hand. |

## Content sources and tools
| Script | Job |
|---|---|
| `content.py` | General Pathology and Haematology topics. |
| `robbins_outline.py`, `robbins_map.py` | Where each question sits in Robbins (chapter, heading, topic). Edit to move a question. |
| `textbook_build.py`, `textbook_notes.py`, `textbook_semicolons.py` | Build `../textbook/` from `textbook_src/`. |
| `mcq_parse.py` | Parse `mcq_src/` into `mcqs.json`. |
| `boxviva_parse.py`, `dupmerge.py` | Box-viva list and duplicate merging across lists. |
| `answers_upgrade.py`, `find.py` | Batch answer upgrades; find a question and add an answer stub. |
| `content_json.py` | Schema-validated content JSON from the built site. |
| `curate/` | Per-chapter textbook curation scripts and notes (`auto.py` is the shared engine). |

## Assets
| Script | Writes |
|---|---|
| `make_logo.py` | Logo SVG and PNG icons from `logo/`. |
| `make_og.py` | Share card `../icons/og-card.png`. |
| `make_tb_banner.py` | Textbook banner `../icons/pb-textbook.svg`. |
| `gen_chapter_art.py` | Chapter artwork `../icons/ch/*.svg`. |

## Checks
| Script | Job |
|---|---|
| `preflight.sh` | Rebuild and fail if a generated file is stale. Run before every push. |
| `check_all.py` | Content checks without npm. |
| `integrity/` | Differential content checks and size report. |
| `leak_check_local.py`, `leak_check_ci.py` | Make sure gated text is not in public files. |
| `tests/` | Playwright + unittest suites (`test_site`, `test_gating`, `test_annot*`, ...). `gen_manifests.py` regenerates golden files. |
| `ci_failures.py` | Turns a failing test log into GitHub annotations. |
| `lazy_probe.py`, `perf_boot.py` | Lazy-loading probe build and boot-time measurement. |

## Deployment helpers
| Script | Job |
|---|---|
| `restore_private.sh` | Restore untracked private sources from history, then build. |
| `chunks_sql.py` | SQL that loads private chunks into the Worker's D1 database. |

## Data files
`answers_by_id.json`, `mcqs.json`, `source_map.json`, `hand_edits.json`, `textbook_block_alias.json`, `leak_hashes.json`, `schemas/` and the
`*_src/` folders are inputs to the scripts above. Those listed in `private_paths.txt` are untracked.
