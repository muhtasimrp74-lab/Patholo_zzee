# Chapter 4 curation notes (Hemodynamic Disorders, Thromboembolic Disease, and Shock)
Built with the shared engine (`tools/curate/auto.py`) + `tools/curate/ch04.py`. All text comes from `tools/textbook_src/ch04.json`; the script only sets headings, deletes diagram/table-label debris, merges split sentences and rebuilds Table 4.2 from the source list items.

**Needs a manual look (two-column extraction could not be separated automatically):**
1. Edema and Effusions: the paragraph after the Fig 4.1 caption (reduced plasma osmotic pressure) is still interleaved with a second column; Table 4.1 has no recoverable rows (caption only).
2. Fig 4.1 caption currently also contains the Fig 4.2 caption text.
3. Thrombin activities (Normal Hemostasis): only the first bullet (fibrin conversion) was recoverable; "Platelet activation" and "Proinflammatory effects" bullets and the Fig 4.7 caption detail are missing/short.
4. Septic shock section: diagram labels (Fig 4.20) were dropped; the figure caption is intact.
5. Headings were set from Robbins' outline; check the H3/H4 nesting inside Hemostasis (Platelets, Coagulation Cascade, Endothelium) and Thrombosis.
