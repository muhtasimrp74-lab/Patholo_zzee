# Chapter 4 curation notes (Hemodynamic Disorders, Thromboembolic Disease, and Shock)
Built with the shared engine (`tools/curate/auto.py`) + `tools/curate/ch04.py`. All text comes from `tools/textbook_src/ch04.json`; the script only sets headings, deletes diagram/table-label debris, merges split sentences and rebuilds Table 4.2 from the source list items.

**Needs a manual look (two-column extraction could not be separated automatically):**
1. Edema and Effusions: the paragraph after the Fig 4.1 caption (reduced plasma osmotic pressure) is still interleaved with a second column; Table 4.1 has no recoverable rows (caption only).
2. Fig 4.1 caption currently also contains the Fig 4.2 caption text.
3. Thrombin activities (Normal Hemostasis): only the first bullet (fibrin conversion) was recoverable; "Platelet activation" and "Proinflammatory effects" bullets and the Fig 4.7 caption detail are missing/short.
4. Septic shock section: diagram labels (Fig 4.20) were dropped; the figure caption is intact.
5. Headings were set from Robbins' outline; check the H3/H4 nesting inside Hemostasis (Platelets, Coagulation Cascade, Endothelium) and Thrombosis.

**Second pass (done with new helpers `tools/curate/colsplit.py` / `tabfix.py`; text only cut and joined):**
- Fig 4.1 and Fig 4.2 captions separated (they were interleaved in block 10/11); the Fig 4.1 caption tail no longer sits in the albumin paragraph.
- "Reduced Plasma Osmotic Pressure" paragraph rebuilt as one continuous paragraph (blocks 8 -> right column of 11 -> caption tail in 12 -> 13). One word is missing in the source ("leads … turn results"): marked with an ellipsis. Added headings "Reduced Plasma Osmotic Pressure", "Sodium and Water Retention", "Lymphatic Obstruction" (wording from the Robbins outline / source fragments).
- Table 4.1 rebuilt from the cell fragments that survive in blocks 13-19 (each cell is checked against the source text). The row label "Venous obstruction or compression" was lost, noted in the table.
- Thrombin: bullets "Platelet activation" and "Proinflammatory effects" recovered, Fig 4.7 caption now complete (its tail was interleaved in block 86); the hand-typed Fig 4.7 caption was removed.
- Still open: the first paragraphs of Edema and Effusions and the chapter intro still contain stray margin-glossary words (blocks 1, 3, 5, 7); septic-shock diagram labels (Fig 4.20) remain dropped.
