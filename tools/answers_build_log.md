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

## Session 2 (work-list questions 56 to 130, 75 written; Chapter 2 plus the first four Chapter 3 questions)

Questions: pancreatitis case and fat necrosis, apoptosis (note, definition, causes, significance, examples, morphology, nuclear changes), pathologic, dystrophic and metastatic calcification, cellular adaptation (types, examples, atrophy, hyperplasia, metaplasia, dysplasia), cellular ageing, cell injury (define, classify, causes, responses, reversible and irreversible features, ATP depletion, free radicals, antioxidants, calcium enzymes), necrosis (types, coagulative, liquefactive, caseous, gangrenous), intracellular accumulations (fatty change, hyaline change), alcohol-associated fatty liver case, and inflammation overview (define, types, examples, causes).

Previously empty and now written (19): "What do you mean by apoptosis?", "Types / classification of cellular adaptation.", "What is atrophy?", "Causes of atrophy with examples.", "Differences between hypertrophy and hyperplasia.", "Define metaplasia.", "What do you mean by cellular aging?", "How does cellular aging occur?", "Define cell injury.", "Classify cell injury.", "Causes of cell injury.", "Types of reversible cell injury.", "Morphological types of cell injury.", "Differences between coagulative and liquefactive necrosis.", "Define apoptosis.", "Causes of apoptosis.", "Differences between necrosis and apoptosis.", the alcohol fatty liver case, "Differences between dystrophic and metastatic calcification."

Sources: all from the site textbook. Chapter 2 (tools/textbook_src/ch02.json) for most answers; Chapter 7 (Metaplasia, Dysplasia, and Carcinoma In Situ) for the two dysplasia answers; Chapter 19 (Acute Pancreatitis: pathogenesis, clinical features) for the pancreatitis case; Chapter 18 (Alcohol-Associated Liver Disease, and the hepatocellular carcinoma paragraph) for the fatty liver case; Chapter 3 (General Features, Causes of Inflammation) for the four inflammation answers. **No outside sources were used in any answer.** One web search was made only to cross-check the inflammation definition; it returned lecture slides quoting earlier Robbins editions, which were not used.

Answers copied from earlier batches because the textbook passage is identical (same wording on purpose): "Define cell injury." (from "What do you mean by cell injury?"), "Classify cell injury." (types of cell injury), "Causes of cell injury.", "Types of reversible cell injury.", "Features of reversible cell injury." (morphological changes in reversible injury), "Morphological types of cell injury.", "Morphological changes that occur in a necrosed cell.", "Examples of each type of necrosis.", "Differences between coagulative and liquefactive necrosis.", "Differences between hypertrophy and hyperplasia.", "Bad consequence / clinical importance of metaplasia.", "Differences between necrosis and apoptosis.", and the apoptosis define and causes pairs. "What do you mean by apoptosis?" and "Define apoptosis." share one text; "Write down the difference..." and "Differences between dystrophic and metastatic calcification." share one table.

### Points left out (not in the textbook, or outside what the question asks)
- Short note on apoptosis: the textbook gives no clinical features or complications for apoptosis, so that section is absent.
- Pathologic calcification short note: less common causes of hypercalcaemia (aluminium intoxication in dialysis, milk-alkali syndrome) left out.
- Significance of apoptosis: BCL2 overexpression in B cell lymphoma left out (the textbook does not link it to reduced apoptosis); old "urethral compression" and similar clinical lines were not in the textbook.
- Clinical importance of hyperplasia: urinary obstruction in benign prostatic hyperplasia (not in the textbook) and the physiologic marrow and liver examples (not clinical importance) left out.
- Important sites of epithelial metaplasia: old extra sites (endocervix, bladder, stomach intestinal metaplasia) not in chapter 2 or 7, left out.
- Gangrenous necrosis: definition only; the wet gangrene sentence is not part of the definition. Old "dry gangrene" and "gas gangrene" types are not in the textbook.
- Definitions (cellular adaptation, atrophy, hyperplasia, metaplasia, fatty change, hyaline change, pathologic and dystrophic calcification, dysplasia, apoptosis, ageing, intracellular accumulation): the sentences after the definition were left out (for example the hyaline change "descriptive term" sentence, the dysplasia "recognised based on morphologic changes" sentence, the four mechanisms of intracellular accumulation).
- Hypertrophy mechanism details, ATP depletion figures beyond the stated 5% to 10%, and the lipofuscin, melanin and haemosiderin descriptions were not asked and are left out.
- Pancreatitis case: the textbook gives no value for normal amylase and no figure for amylase of 12000, so the answer rests on the clinical features and the alcohol and biliary causes; fat necrosis of that case is covered under the next question.
- Inflammation definition: the textbook block (chapter 3, page 64) is garbled in the source file (words displaced, for example "delivers and molecules of host defense"). The word "leukocytes" is restored from the displaced word in the same paragraph. Please check this one against the printed book.
- Types and examples of inflammation: Table 3.1 (features of acute and chronic inflammation) has no cell text in the source file, so the wording comes from the paragraphs on page 65. Local and systemic inflammation are included because the textbook lists them with acute and chronic.

### Hand edits dropped
tools/hand_edits.json hunks that anchored on the old text of rewritten answers no longer match and were removed (as in batch 1): 7 hunks in total. They fixed list numbering and nesting in old answers (apoptosis note, apoptotic morphology, intracellular accumulation, dysplasia italic), and one added a note that the question wording "compression/peritoneum" is garbled and is read as "pancreas/peritoneum". The note is gone from the answer; the question text itself is unchanged.

### Judgement calls to confirm
- The case question "Alcohol abuse with massive hepatomegaly; liver biopsy shows fat droplets in hepatocytes ..." takes its visible answer from tools/answers_by_id.json (card id 314), which was not touched. The rewrite is in answers.md but will not show on the page until that file is updated in its own pass.
- The build still runs the automatic emphasis passes (format_answers 1 to 3), which add some bold and italic (for example italics on words such as "often") on top of the markdown. This conflicts with "no italics"; not changed here.
- Eponyms: Paget disease, Williams syndrome, Werner syndrome, Barrett oesophagus, Russell bodies, Niemann-Pick disease type C, Alzheimer disease and Laennec cirrhosis are each given with a meaning in brackets where the textbook supports one.
- "H&E" kept as the textbook writes it (as in earlier batches).
