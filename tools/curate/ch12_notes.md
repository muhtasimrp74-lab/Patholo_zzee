# Chapter 12 curation notes (The Heart)
Built with the shared engine + `tools/curate/ch12.py`. Text comes from `tools/textbook_src/ch12.json`; the script sets the Robbins heading hierarchy (repeated "Clinical Features"/"Pathogenesis" headings are assigned in order), drops diagram/table debris, and merges sentences split across figures.

**Needs a manual look:**
1. Tables 12.1, 12.7, 12.9, 12.11, 12.12 and 12.13 had no rows in the source: caption-only. Their leftover entries appear as small-caps sub-labels (e.g. Cardiac Infections, Toxins; Major/Minor Duke criteria; Infectious Agents) with bullet lists in the text below.
2. Headings lost in extraction, so their Morphology/Clinical Features boxes sit under the nearest heading: Tetralogy of Fallot (under Right-to-Left Shunts), Patent Ductus Arteriosus, Pulmonary (Right-Sided) Hypertensive Heart Disease / Cor Pulmonale, Myxomatous Degeneration of the Mitral Valve, specific tumor names (myxoma, papillary fibroelastoma, rhabdomyoma).
3. Figure captions in the myocardial infarction and cardiomyopathy sections may carry neighbouring text; the "year—greater than the number of deaths caused by all forms of cancer combined." sentence in the opening continues the first paragraph.
