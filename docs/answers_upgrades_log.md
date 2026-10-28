# Answer upgrades (systemic by-id cards)

Continues the answer-rewrite programme (sessions 1 to 20, private log) for the 224 systemic cards whose answers live in the
private tools/answers_by_id.json, which that programme did not cover.

**How:** tools/answers_upgrade.py runs at build time (called from tools/apply_answers_by_id.py), so no answer text is committed
and the leak checks are unchanged. It restructures the existing textbook-derived text into the programme's pattern and never adds
claims: inline glosses removed (kept in parentheses when they carry numbers), stray line breaks fixed, run-in labels turned into
sub-headings, later dense paragraphs into bullets (the first paragraph stays the direct answer, shown as "Say this first"),
near-duplicate sentences dropped, sentence starts capitalised, British spelling. Markup that would not balance falls back to a
light upgrade, never to broken HTML.

**Checking:** `python3 tools/answers_upgrade.py --html review.html` matches every sentence to the site's Robbins textbook (up to
three sentences in the card's chapters, words and numbers) and lists only the flagged sentences with their closest textbook
sentence. First run: 219 full upgrades, 5 light; 2,045 sentences verified, 399 partial, 96 unverified. Flags are a review queue,
not errors: many are standard exam facts from other sources.

**Hand corrections found while piloting (to re-apply after review):** Tetralogy of Fallot, how the right ventricle is decompressed
(textbook p490 wording); complications of rheumatic fever, the claim about cumulative valve damage is not in the textbook (p511).
