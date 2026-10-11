# Chapter 11 curation notes (Blood Vessels)
Built with the shared engine + `tools/curate/ch11.py`. Text comes from `tools/textbook_src/ch11.json`; the script sets the Robbins heading hierarchy (repeated "Pathogenesis"/"Clinical Features" headings are assigned in order), drops diagram/table debris, and merges sentences split across figures/tables.

**Added headings (not in the source extraction; from Robbins' outline):** Consequences of Atherosclerotic Disease / Atherosclerotic Stenosis; Giant Cell (Temporal) Arteritis; Polyarteritis Nodosa. Please verify their positions.

**Needs a manual look:**
1. Tables 11.2 (hypertension types), 11.3 (atherosclerosis risk factors) and 11.5 (vascular tumors) had no rows in the source: caption only; their residue was dropped.
2. Vasculitis: headings for Kawasaki disease, thromboangiitis obliterans, immune-complex/ANCA-associated vasculitides, microscopic polyangiitis and granulomatosis with polyangiitis were lost in extraction, so their Morphology/Clinical Features boxes currently sit under the nearest heading.
3. Fig 11.x captions in the atherosclerosis pathogenesis section may carry neighbouring text.
