# Answer rewrite build log

## Pilot (Chapter 2, Robbins 11th, site textbook/ch02)

All five answers come from the site's own textbook (tools/textbook_src/ch02.json). **No outside sources were used.**

| Question | Textbook passage |
|---|---|
| Define necrosis. | Key Points box "Cell Injury and Necrosis" (p39), definition sentence |
| Classify necrosis. | "Patterns of Tissue Necrosis" (p38-39) |
| Morphology of coagulative necrosis. | Coagulative necrosis paragraph (p38) and Fig. 2.10 legend (p40) |
| Write down the differences between necrosis and apoptosis. | Table 2.2 (p37); two extra rows (Regulation, Cytoplasm) from the text on p36 and p41 and the necrosis morphology on p38 |
| Give the pathogenesis of apoptosis. | "Mechanisms of Apoptosis" through "Removal of Dead Cells" (p42-44) |

### Points left out (not in the textbook, or judged outside the question)
- Necrosis vs apoptosis: the old rows "Mechanism", "Clearance", "Examples" and the "Role of regulation" wording were not in Table 2.2 and were dropped (clearance is covered under pathogenesis of apoptosis).
- Define necrosis: old "Complete explanation" block removed (rule 1: definition only).
- Classify necrosis: the old line "regulated forms: necroptosis, pyroptosis, ferroptosis" removed; necroptosis is not a tissue pattern, and the textbook does not name pyroptosis or ferroptosis in this chapter's necrosis section.
- Pathogenesis of apoptosis: the old "Cross-talk" and "FasL" wording kept; the BCL2 lymphoma gene note was left out as not asked.
- Coagulative necrosis: old "possible dystrophic calcification" dropped from this answer (the textbook gives it for necrosis in general, not coagulative necrosis specifically).

### Judgement calls to confirm
- Eponyms: none occur in these five answers.
- "pathologic" kept as the textbook's own wording; other spellings are British.
- Arrows and symbols (the old answers used them) were replaced with words so every line reads aloud as written.

## Batch 1 (work-list questions 6 to 55, all Chapter 2, written 50)

Questions: cellular adaptation (hypertrophy, hyperplasia, atrophy, metaplasia), cell injury (causes, types, reversible changes, membrane damage, calcium, ischaemia, reperfusion, free radicals), and necrosis (inflammation, types, naked eye features, nuclear and cytoplasmic changes, ischaemic necrosis, coagulative vs liquefactive, caseous morphology).

Sources: all from the site textbook, chapter 2 (tools/textbook_src/ch02.json). Chapter 7 (neoplasm definition, precursor lesions) was used for the two "hyperplasia vs neoplasia" answers. **No outside web sources were used.**

Previously empty and now written: "Define atrophy."

Answers shared by several questions (same text on purpose): "Give the difference between hyperplasia and neoplasia." and "Discuss how hyperplasia differs from neoplasia."; the three coagulative vs liquefactive necrosis questions.

### Points left out
- "Define and classify cellular adaptation": old "Concept" block, cell-stress pathways and the endocervix example for squamous metaplasia dropped (the endocervix example is not in chapter 2). The metaplasia row therefore shows "None given" for a physiologic example.
- "Define necrosis" style extras, "Key point" lines and clinical lines in old answers were removed wherever the question did not ask for them.
- Mechanism of hypertrophy (signalling pathways, GATA4, NFAT, MEF2, alpha to beta myosin switch, ANF) left out of the hypertrophy answers: the questions ask for causes and clinical importance, not mechanism.
- "Fibrinoid" naked eye features: the textbook gives no gross description, so the table says so.
- "Types of cell injury": the textbook has no heading with that title, so the answer gives reversible and irreversible injury as defined on page 35.
- Free radical short note: only the hydroxyl radical statement from Table 2.3 is used; the full property table is not reproduced.

### Items to check
- Calcium: the extracted textbook text reads ",0.1 mmol" for cytosolic free calcium, which is an extraction error. The answer says "less than 0.1 μmol" (standard Robbins value) against 1.3 mmol outside the cell. Please confirm against the printed page.
- Fenton reaction is the only eponym used; its meaning is given in brackets.
- Barrett oesophagus is explained in each answer where it appears.

### Housekeeping
- tools/hand_edits.json: hunks 6 to 10 removed. They only repaired list markup inside the old answers for necrosis types, ischaemia and reperfusion, which were rewritten; they no longer anchor and stopped the build.
- Progress file tools/answers_progress.json now lists 55 questions done (5 pilot plus 50).
