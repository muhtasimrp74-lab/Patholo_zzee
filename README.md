# Patholo_zzee

Offline-capable study site: **257 pathology questions** (189 viva + 68 written; General Pathology and 15 Systemic topics, NMC order, Robbins 11th). Haematology is next.

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


## Fonts
All self-hosted in `fonts/` (works offline): DM Serif Display (headings), Newsreader (question text), Hanken Grotesk (body), Caveat (handwriting accents), Inter Greek (Greek letters).

## Logo
Vector logo traced from the brand artwork: `tools/logo/` holds the paths, and `python3 tools/make_logo.py` regenerates `icons/logo.svg`, `favicon.svg`, all PNG icons (favicon, apple-touch, 192/512, maskable) and the share image `og-image.png`. It needs `fonttools`, `brotli` and `playwright`.
