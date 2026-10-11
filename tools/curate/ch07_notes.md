# Chapter 7 curation notes (Neoplasia)
Built with the shared engine + `tools/curate/ch07.py`. Text comes from `tools/textbook_src/ch07.json`; the script sets the Robbins heading hierarchy, drops diagram/label debris, merges sentences split across figures, splits collapsed bullets, and keeps the 11 tables from the source rows.

**Needs a manual look:**
1. Table 7.10 (Major Chemical Carcinogens) had no rows in the source: caption only. Its contents are partly in the text below it.
2. Some figure captions may still carry neighbouring body text (long, figure-heavy chapter) and some two-column paragraphs may still read oddly; check Fig 7.x captions in the Molecular Basis and Immune Evasion sections.
3. Run-in subheads inside Oncogenic DNA Viruses (HPV, EBV, HBV/HCV) were not promoted to headings.
4. Table cells were cleaned by the engine only (Greek letters, hyphen breaks); check Tables 7.5, 7.7 and 7.11 for merged cells.
