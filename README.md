# Patholo_zee

Offline-capable study site: **189 Systemic Pathology viva questions** (NMC order, Robbins 11th).

Features: search, practice (spaced-repetition flashcards and timed viva), quiz mode, bookmarks, favourites, notes, learned-progress per topic and per part, focus mode, dark/light theme, text size, handwriting ink (pen, highlighter, eraser, lasso) on every answer, backup/restore of all your data (including ink), installable and works offline.

Your data stays on your device (localStorage + IndexedDB). Nothing is sent anywhere.

## Publish (GitHub Pages — free `https://<username>.github.io/<repo>/` link)
1. Create an empty repo on github.com (e.g. `pathology-viva`), no README.
2. In this folder: `git remote add origin https://github.com/<username>/pathology-viva.git && git push -u origin main`
3. Repo **Settings → Pages → Source: GitHub Actions**. The included workflow deploys on every push; the link appears in the Actions run and under Settings → Pages.
4. Own domain (optional, bought separately): Settings → Pages → Custom domain, then add the DNS record GitHub shows.

Netlify also works: import the repo, no build command, publish directory `.` (`_headers` adds security headers).

## Editing content
The 15 systemic topics live in `tools/src/index.base.html` (`tools/content.py` is empty; add extra topics there if needed). After editing, run `python3 tools/build.py` to regenerate `index.html`. When you change any site file, bump `VERSION` in `sw.js` so installed copies refresh.
