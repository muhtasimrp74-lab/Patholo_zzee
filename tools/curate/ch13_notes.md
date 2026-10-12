# Chapter 13 curation notes (Diseases of White Blood Cells, Lymph Nodes, Spleen, and Thymus)
Built with the shared engine + `tools/curate/ch13.py`. Text comes from `tools/textbook_src/ch13.json`. Headings were detected by rule (a heading is kept only if body text follows it; diagram labels and table-of-contents lines are dropped), then diagram/table debris is removed and split sentences are merged.

**Needs a manual look:**
1. Tables with no rows in the source (caption only): 13.12; their leftover entries may appear as text or small headings nearby.
2. Heading depth is approximate: only 2 heading levels exist in the source, so sub-topics that Robbins nests may appear as separate sections.
3. Headings lost in extraction have no label, so their Morphology/Clinical Features boxes sit under the nearest heading. A few stray diagram labels may remain as headings or short paragraphs.
4. Figure captions may start or end mid-sentence where text was split across a page.
