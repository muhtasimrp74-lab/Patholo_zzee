# Chapter 4 curation notes (Hemodynamic Disorders, Thromboembolic Disease, and Shock)
Source: `tools/textbook_src/ch04.json` (raw extraction). `tools/curate/ch04.py` rebuilds structure/text from it with the shared engine (`auto.py`).

**Structure** follows Robbins: Edema and Effusions → Hyperemia and Congestion → Hemostasis and Thrombosis (Normal Hemostasis: platelets, coagulation cascade, endothelium; Hemorrhagic Disorders; Thrombosis: Virchow triad, hypercoagulability, morphology, fate, clinical features; DIC) → Embolism (pulmonary, systemic, fat, air, amniotic fluid) → Infarction → Shock (septic shock pathogenesis, stages) → Selected Readings.

**Done (mechanical only; nothing retyped from memory):** heading hierarchy rebuilt; figure/diagram-label debris dropped (incl. all Fig. 4.20 labels); running page headers removed; Figs 4.4 and 4.6 captions re-joined from their split pieces; Table 4.2 rebuilt from its loose cells (blocks 143-170) and the Homocysteinemia bullet re-attached to its tail; Table 4.3 taken from the source rows ("Principle" -> "Principal"); cardiogenic-shock bullet re-joined across the table; run-in subheads split out (Factors That Limit Coagulation, Venous Thrombosis, Arterial and Cardiac Thrombosis, HIT); reference list re-joined across line breaks; typos (fibrilation, thrombo-philia, dyski-netic, release -> released).

**NOT recoverable from this extraction — please repair from the book (these are still garbled on the site):**
1. **Table 4.1** (Pathophysiologic Categories of Edema): the source has zero rows; its text is scattered through blocks 13-19. The table is omitted. The garbled paragraphs there (Increased Hydrostatic Pressure / Sodium Retention / Lymphatic Obstruction) still carry table labels mixed in.
2. **Fig. 4.2** is merged into Fig. 4.1's caption (two-column interleave, blocks 10-11).
3. **Chapter intro** (blocks 1, 3, 5, 7) and the **Increased Hydrostatic Pressure** paragraph have words missing where the columns collided (e.g. "…electrolytes into the balance is often disturbed…").
4. **Coagulation Cascade** text around Fig. 4.6/4.7 (blocks 84-86, 90-91) is interleaved with diagram labels ("Cofactor VIIIa", "IXa Xa", "Plasmin activation…"); **Fig. 4.7** caption is truncated.
5. Block 124 (Virchow triad): label debris removed, but the paragraph starts mid-sentence ("where the high rates…") because its first half was lost.
6. Block 11 (Reduced Plasma Osmotic Pressure) and Fig. 4.1 caption still have hyphen/column splits ("hy- synthesis…").
7. Antiphospholipid syndrome sub-heading is missing from the source, so the criteria bullets sit under the HIT run-in.
