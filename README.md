# Patholo_zzee

Offline-capable study site: **1,310 pathology questions** (189 systemic viva, 68 written, 629 DU written, 507 box-viva; 83 questions that were on both the written and box-viva lists are merged into one questions on the A-cards A1–A10 for General Pathology and Haematology; NMC order, Robbins 11th).

Features: search, practice (spaced-repetition flashcards and timed viva), quiz mode, bookmarks, favourites, notes, learned-progress per topic and per part, focus mode, dark/light theme, text size, handwriting ink (pen, highlighter, eraser, lasso) on every answer, backup/restore of all your data (including ink), installable and works offline.

Your data stays on your device (localStorage + IndexedDB). Nothing is sent anywhere.

## Publish (GitHub Pages — free `https://<username>.github.io/<repo>/` link)
1. Create an empty repo on github.com (e.g. `pathology-viva`), no README.
2. In this folder: `git remote add origin https://github.com/<username>/pathology-viva.git && git push -u origin main`
3. Repo **Settings → Pages → Source: GitHub Actions**. The included workflow deploys on every push; the link appears in the Actions run and under Settings → Pages.
4. Own domain (optional, bought separately): Settings → Pages → Custom domain, then add the DNS record GitHub shows.

Netlify also works: import the repo, no build command, publish directory `.` (`_headers` adds security headers).

## Editing content
The 15 systemic topics live in `tools/src/index.base.html`; General Pathology (and any new topics) live in `tools/content.py`. Styling is layered: base CSS in `index.base.html`, then `tools/theme.css`, then `tools/premium.css` (palette, fonts, glass; edit the tokens at the top of `premium.css` to retheme). After editing, run `python3 tools/build.py` to regenerate `index.html`. When you change any site file, bump `VERSION` in `sw.js` so installed copies refresh.


## MCQs
The **MCQs** tab holds 884 pathology questions (234 from 12 past papers plus a 650-question practice bank, duplicates merged), mapped to 17 chapters and 66 topics.
- Home: progress, resume, Quick 10, Mock paper (20 questions, 30 minutes), missed questions, bookmarks, weak topics, browse by chapter, and the 12 past papers as timed exams.
- Custom practice: faceted filter (chapter/topic, SBA or T/F, source, past paper, your progress, text search) with live counts, plus count, order, feedback (after each question or exam) and timer.
- Reading mode: every matching question with the answers and notes shown, or hidden to self-test.
- Answers, bookmarks, history and any unfinished session are stored in the same backup as everything else.
Sources are in `tools/mcq_src/`; run `python3 tools/mcq_parse.py` to regenerate `tools/mcqs.json`, then `python3 tools/build.py` and bump `VERSION` in `sw.js`.

## Textbook
The **Textbook** tab (bottom bar) reads the cleaned Robbins chapters from `textbook/` (loaded on demand, cached for offline). Sources are in `tools/textbook_src/chNN.json`; regenerate with `python3 tools/textbook_build.py`, then bump `VERSION` in `sw.js`.

## Robbins order of the questions
Inside every chapter the questions are grouped as **heading > topic > questions**, in the order Robbins teaches them (Questions tab and each chapter page). The outline and the keyword rules that place each DU written question live in `tools/robbins_outline.py`: edit it to rename or reorder a heading/topic or to move a question, then run `python3 tools/build.py` and bump `VERSION` in `sw.js`. A "Same ..." follow-up always sits under the question before it. Question numbers never change, so saved bookmarks, notes and progress are not affected.

## Fonts
All self-hosted in `fonts/` (works offline): DM Serif Display (headings), Newsreader (question text), Hanken Grotesk (body), Caveat (handwriting accents), Inter Greek (Greek letters).

## Logo
Vector logo traced from the brand artwork: `tools/logo/` holds the paths, and `python3 tools/make_logo.py` regenerates `icons/logo.svg`, `favicon.svg`, all PNG icons (favicon, apple-touch, 192/512, maskable) and the share image `og-image.png`. It needs `fonttools`, `brotli` and `playwright`.


## Box viva (A-cards A1–A10)
General Pathology and Haematology box-viva questions live on the A-cards. Source list: `tools/box_src/General_Pathology_Box_Viva_Robbins_Index.md`; run `python3 tools/boxviva_parse.py` to regenerate `tools/box_viva.txt` (Robbins chapter > sub-chapter > topic, with the card/question numbers as printed and ⭐ = times asked), then `python3 tools/build.py` and bump `VERSION` in `sw.js`. A question asked on several cards carries all of them (it appears on each card page). Clinical cases are one question each, with their asks listed. New box-viva questions are numbered after the existing ones, so saved bookmarks and notes never move. Add answers in `ANSWERS` in `tools/content.py`, keyed by the question text.

## DU written questions
`tools/gp_written_du.txt` holds 629 past DU written questions (Robbins 11th order, chapters 3-28 plus a Clinical Biochemistry group), each tagged `(DU-…)` with its exam sittings and star count. Same line format as `gp_written.txt`. They are numbered after all existing questions so saved bookmarks and notes never move. Add answers in `ANSWERS` in `tools/content.py`, keyed by the question text. Then `python3 tools/build.py` and bump `VERSION` in `sw.js`.

### Questions on both lists are merged
If the same question is on the DU written list and the box-viva cards (same kind of question about the same subject, in the same chapter; matched by `tools/dupmerge.py`), the site shows it once: the A-card tags and the `DU-…` exam tags together, stars added, filed under both Viva and Written. Every question keeps its numbering; a card that was merged away is listed in `QMETA.alias` and notes, bookmarks and progress saved on it move to the surviving card on next load (handwriting ink does not move). To stop two questions merging, reword one in its source file.

## Adding answers (one at a time)
1. `python3 tools/find.py <words>` lists matching questions (`[ no answer ]` = still empty). `--add 3` appends a blank block for result 3 to `tools/answers.md`.
2. Write the answer under its `## <exact question>` heading in `tools/answers.md` (markdown: bold, bullets, numbered lists, tables).
3. Push. The deploy workflow rebuilds the site and refreshes the cache itself; locally run `python3 tools/build.py`. A heading that matches no question is reported in the build log.
You can also edit `tools/answers.md` directly on github.com from your phone. Quick personal notes and handwriting stay available in the app (Notes, Ink).

## Tests and deployment
`python3 -m unittest discover -s tools/tests -v` rebuilds the site and checks: build is clean/deterministic and the committed `index.html` is not stale; unique question ids; ids never move to a different question (positional ids!); duplicate merges are reviewed; MCQ/textbook/manifest schemas; service-worker files; backup import/export (malformed files rejected, failed restore rolls back, round-trip, merged-question migration of progress, notes and handwriting); corrupt saved data; hostile backup values. Browser tests need `pip install playwright && playwright install chromium`.

**Adding questions:** append new questions at the END of a topic list in `content.py`; ids are positional, so inserting in the middle shifts every later id (the test fails if that happens). After a deliberate, reviewed change run `python3 tools/build.py && python3 tools/tests/gen_manifests.py` and bump `VERSION` in `sw.js` first.

**To switch on the CI gate**, replace `.github/workflows/pages.yml` with `tools/ci/pages.yml` (edit it on github.com; a token needs the *Workflows* permission to push workflow files). That workflow builds from source, fails if the committed `index.html` is stale, runs the tests, validates the site folder, and deploys that freshly built folder only if everything passed. Pull requests run the checks without deploying.

**Safety nets for your data:** a restore is validated before anything is changed; the previous data is kept in `localStorage.vivaStatePrev`; unreadable saved data is kept in `vivaStateCorrupt` instead of being overwritten. In the browser console, `cacheDiag()` shows what is saved for offline use.
