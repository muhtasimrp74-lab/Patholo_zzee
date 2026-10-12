# Chapter 28 curation notes (The Central Nervous System)
Built with the shared engine + `tools/curate/ch28.py`. Text comes from `tools/textbook_src/ch28.json`. Headings were detected by rule (a heading is kept only if body text follows it; diagram labels and table-of-contents lines are dropped), then diagram/table debris is removed and split sentences are merged.

**Needs a manual look:**
1. Tables with no rows in the source (caption only): none; their leftover entries may appear as text or small headings nearby.
2. Heading depth is approximate: sub-topics that Robbins nests (e.g. congenital anomalies under a section) may appear as separate top-level sections; the real hierarchy was not recoverable from the source (only 2 heading levels exist).
3. Headings lost in extraction have no label, so their Morphology/Clinical Features boxes sit under the nearest heading. A few stray diagram labels may remain as headings or short paragraphs.
4. Figure captions may start or end mid-sentence where text was split across a page.
