# Chapter 11 curation notes (Blood Vessels)
Built with the shared engine + `tools/curate/ch11.py`. Text comes from `tools/textbook_src/ch11.json`; the script sets the Robbins heading hierarchy (repeated "Pathogenesis"/"Clinical Features" headings are assigned in order), drops diagram/table debris, and merges sentences split across figures/tables.

**Added headings (from Robbins' outline) - verified against source text:**
- "Consequences of Atherosclerotic Disease" (h3) before the source heading "Atherosclerotic Stenosis" (block 212): position OK (block 211 is its intro).
- "Giant Cell (Temporal) Arteritis" (block 330): position OK; its intro paragraph is inside the interleaved block 321.
- "Polyarteritis Nodosa" was WRONG (it sat above the Buerger-disease text at block 348). Removed; PAN now starts at its real run-in (block 355).
**Fixed (second pass):** run-in subheads promoted to headings by cutting the source text: Thromboangiitis Obliterans (Buerger Disease), Polyarteritis Nodosa, Kawasaki Disease (h3); Microscopic Polyangiitis, Granulomatosis With Polyangiitis (h4). Fig 11.24 caption tail was inside the Buerger paragraph (block 353): moved back to the caption. Duplicate Fig 11.26 (a paragraph continuation misread as a figure) joined back into the PAN morphology paragraph.

**Needs a manual look:**
1. Tables 11.2 (hypertension types), 11.3 (atherosclerosis risk factors) and 11.5 (vascular tumors) had no rows in the source: caption only; their residue was dropped.
2. Vasculitis: headings for Kawasaki disease, thromboangiitis obliterans, immune-complex/ANCA-associated vasculitides, microscopic polyangiitis and granulomatosis with polyangiitis were lost in extraction, so their Morphology/Clinical Features boxes currently sit under the nearest heading.
3. Fig 11.x captions in the atherosclerosis pathogenesis section may carry neighbouring text.

4. Block 321 interleaves the end of Infectious Vasculitis, the Noninfectious/Large-vessel intro and the giant cell arteritis intro line by line; it cannot be untangled without retyping, so it is left as is.
5. Tables 11.2/11.3/11.5: only partial, interleaved fragments survive (most rows missing), so they stay caption-only. Nothing was invented.
