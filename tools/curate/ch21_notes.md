# Chapter 21 curation notes (The Lower Urinary Tract and Male Genital System)
Built with the shared engine + `tools/curate/ch21.py`. Text comes from `tools/textbook_src/ch21.json`; the script sets the Robbins heading hierarchy, drops diagram/table debris, merges split sentences.

**Needs a manual look:**
1. Tables with no rows in the source (caption only): 21.3, 21.5, 21.6.
2. Chapter opening paragraph starts mid-sentence ("propria. If urine flow…"). Headings lost in extraction (individual testicular germ cell tumor types, prostate carcinoma grading) sit under the nearest heading.

**Second pass:** opening repaired: block 1 ("propria. If urine flow...") is the continuation of the urothelium paragraph in block 2; margin words moved back into their sentences (epithelium, cells, cytoplasm, ureters, creating a pouch). Split into bladder / ureters / cystocele paragraphs. A few margin words remain (e.g. "the deeper, the larger", "pelvic support layer").
