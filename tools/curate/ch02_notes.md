# Chapter 2 curation notes
Source: `tools/textbook_src/ch02.json` (raw extraction). `tools/curate/ch02.py` rebuilds structure/text from it.

**Structure** follows Robbins: Introduction → Overview of Cellular Responses (Causes of Cell Injury) → Pathways of Cellular Response (ISR, UPR/ER stress, Autophagy) → Progression of Cell Injury and Death (Reversible injury, Cell death, Necrosis + patterns, Apoptosis, Other mechanisms) → Mechanisms of Cell Injury → Clinicopathologic Correlations → Cellular Adaptations → Intracellular Accumulations → Pathologic Calcification → Cellular Aging → Summary/Readings.

**Removed:** figure-label debris promoted to headings/paragraphs (e.g. "MPTP", "FADD", "LC3", "Cel 7"), running page headers, hyphenation breaks, diagram text mixed into paragraphs and key-concept boxes.
**Repaired:** sentences split across page/figure boundaries; body text swallowed inside figure captions (Figs 2.2, 2.4, 2.7, 2.16, 2.22, 2.24, 2.26, 2.33, 2.34); "KEY CONCEPTS" boxes re-attached; Greek letters/subscripts/arrows (α, β, ₂, →); typos (intergrated, epitheloid, prostrate, heathy, micells…).

**Please double-check (reconstructed from context/knowledge, not verbatim):**
1. Table 2.3 rebuilt cell by cell (source was garbled).
2. Fig 2.29 caption written from the diagram labels (1 abnormal metabolism, 2 protein folding/transport defect, 3 enzyme lack, 4 indigestible material).
3. Fig 2.18 caption: first sentence bridged ("innate immune sensors"); the body paragraph on pyroptosis keeps only its first sentence because the rest duplicated the caption.
4. Mitochondrial damage list: bold lead-ins "Formation of reactive oxygen species" and "Leakage of mitochondrial proteins" added; ATP-depletion consequences grouped as one list.
5. Necroptosis: stray label "TNF" removed from "associated with cell death in … steatohepatitis".

**Second pass (items 1-4 of the "double-check" list are now cut from the source instead of retyped):**
1. Table 2.3 is built from the source table rows; only garbled sub/superscripts were repaired (HO 2 2 -> H2O2 etc.). Column headers are the formulas from the source (the species names that were typed earlier are gone). The stray source text "No enzymatic means of inactivation" is dropped (the table already says "None").
2. Fig 2.29 has no caption in the source (only diagram labels). The hand-written caption was removed; a short title with a note remains. The four mechanisms in the numbered list above it are now the source text with diagram-label words deleted (they had been retyped before).
3. Fig 2.18: caption = source blocks 231 + 232 + legend; the two blocks do not join in the source ("by innate immune" / "infected cells are..."), marked with an ellipsis instead of invented words. The pyroptosis body paragraph is complete again (the caption legend DAMPs/IL-1β/PAMPs had been glued to it). "gasdermin D receptors" is kept as in the source.
4. The bold lead-ins added to the mitochondrial list were removed; the two bullets are now plain source text.
