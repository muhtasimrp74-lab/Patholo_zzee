# Chapter 19 curation notes (The Pancreas)
Built with the shared engine + `tools/curate/ch19.py`. Text comes from `tools/textbook_src/ch19.json`; the script sets the Robbins heading hierarchy, drops diagram/table debris, merges split sentences.

**Needs a manual look:**
1. Tables with no rows in the source (caption only): 19.1.
2. Chapter opening paragraph starts mid-sentence ("extending from the C-loop…"): its first words were lost in the source. Headings lost in extraction (Pancreas divisum, ductal adenocarcinoma subtypes) sit under the nearest heading.
