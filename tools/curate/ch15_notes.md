# Chapter 15 curation notes (The Lung)
Built with the shared engine + `tools/curate/ch15.py`. Text comes from `tools/textbook_src/ch15.json`; the script sets the Robbins heading hierarchy (repeated "Pathogenesis"/"Clinical Features" headings are assigned in order, all as H4), drops diagram/table debris, merges split sentences.

**Added heading (not in the extraction):** Bronchiectasis (before the Pathogenesis at the end of the Asthma section). Please verify.

**Needs a manual look:**
1. Tables 15.1, 15.2, 15.5, 15.7, 15.9 and 15.12 had no rows in the source: caption-only; leftover entries may appear as plain text near them.
2. Headings lost in extraction, so their boxes sit under the nearest heading: Atelectasis/Pulmonary Edema subtypes, Pneumoconioses subtypes (coal workers' pneumoconiosis, silicosis, asbestos-related disease), Tuberculosis and other chronic pneumonias, the individual carcinoma types (adenocarcinoma, squamous cell, small cell), Pleural effusion subtypes.
3. Asthma and sarcoidosis figure captions may start mid-sentence "(A) ..." after a split.
