# Chapter 16 curation notes (Head and Neck)
Built with the shared engine + `tools/curate/ch16.py`. Text comes from `tools/textbook_src/ch16.json`; the script sets the Robbins heading hierarchy, drops diagram/table debris, merges split sentences. The end of the chapter (Key Concepts for Salivary Glands + Selected Readings) was tangled in the source and was separated by cutting/joining the source's own pieces.

**Added headings (from Robbins' outline, not in the extraction):** "Oral Cavity" (before Inflammatory/Reactive Lesions) and "Tumors of the Nose and Nasopharynx". Please verify.

**Needs a manual look:**
1. Tables 16.3 and 16.4 (odontogenic cysts/tumors classification) had no rows in the source: caption-only.
2. The Key Concepts for Salivary Glands: the Acinic cell carcinoma bullet starts with "…" because its first words were lost; no key-concept bullet exists in the source for Adenoid cystic carcinoma.
3. Headings lost in extraction (their boxes sit under the nearest heading): Dental caries, aphthous ulcers, leukoplakia/erythroplakia, Pleomorphic adenoma, oral cancer subtypes.
4. Fig 16.x "(A) Nasal polyps..." caption starts as its own paragraph.
