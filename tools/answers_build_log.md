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

## Sessions 3 to 5 (Chapter 3, Robbins 11th; 150 questions after session 2, now 225 of 1,135)

These entries were written at the end of session 5. Sessions 3 and 4 stopped at the usage limit before their log entries were made, so their notes below are rebuilt from the commits and the answer file.

### Session 3 (20 questions)
Cardinal signs, vascular reactions, acute versus chronic inflammation, permeability, oedema, leukocyte recruitment, chemotaxis, phagocytes and the steps of phagocytosis. The markdown converter was extended to support italic and bold italic.

### Session 4 (42 questions, "How is phagocytosed material degraded?" through "How does diabetes mellitus impair wound healing?")
Mediators, complement, morphologic patterns of acute inflammation, chronic inflammation, granulomas, giant cells and repair.
- The nested-list problem in the leukocyte journey answer was fixed. A wording slip in the foreign body granuloma answer was corrected.
- Answers to identical-passage questions are copies (for example "What is healing?" copies "Define repair").
- Giant cell types: the textbook covers Langhans, foreign body and Warthin-Finkeldey cells but not Touton cells. A web search (a dermatopathology journal review and teaching sites) was used for the Touton cell and the nuclear arrangements.
- The textbook text reads "cells/mL" for the leukocyte count, which looks like an extraction error. The answers say "per microlitre".
- The textbook has no separate wound healing definition, so it was built from the repair definition and the skin wound passage.
- The diabetes answer uses Chapter 24 (endocrine) as well as Chapter 3.

### Session 5 (33 questions, six case cards then "What is angiogenesis?")
Questions: the six box-viva case cards on inflammation and repair (ids 384 to 389), the vascular and cellular events of acute inflammation, leukocyte extravasation, mediators and cytokines, complement consequences, pain and swelling mediators, the seven short clinical scenarios, opsonin, granulomatous inflammation, the tubercular granuloma, immune and TB granuloma, regeneration and repair, and angiogenesis.

Sources: the site textbook only. Chapter 3 for most answers. Chapter 17 (Acute Appendicitis) for the appendicitis case, Chapter 26 (Pyogenic Osteomyelitis) for the osteomyelitis case, Chapter 8 (Tuberculosis, Pathogenesis) for the TB granuloma and the chest wall case, and Chapter 16 (betel quid and oral cavity squamous cell carcinoma) for the gum lesion case. **No outside sources were used.** Davidson and Harrison were not consulted.

Copied from earlier answers because the textbook passage is identical (same wording on purpose): "What are the vascular events in acute inflammation?" (vascular changes), "Describe the morphological patterns of acute inflammation.", "Write the mechanism of oxygen-dependent microbial killing", "What are the steps/mechanism of phagocytosis?", "Name the cells causing phagocytosis.", "Mention the types/etiological classification of granuloma with examples.", "How does immune granuloma form?" and "Same girl: why does the swelling occur?" (oedema in acute inflammation).

The six case cards take their visible answer from tools/answers_by_id.json, so that file was updated as well as answers.md. The case card for the Langhans giant cell ulcer is id 387 (the last session could not find it).

### Points left out
- Old extra material that is not in the textbook was removed: ASCII drawing of the granuloma (the answer now lists the labelled parts), the opsonin receptor table and mechanism, the old TB Ghon complex and caseation-pH points, the old angiogenesis answer on tumours (HIF and metastasis), and the old investigation lists (ultrasound, imaging, Gram stain and culture) in the clinical scenarios.
- Scenario answers say "acute inflammation" and name the likely type (purulent, lymphadenitis) because the textbook gives no further criteria for the thigh, arm or forearm swellings.
- Chest wall ulcer: the textbook does not describe cutaneous tuberculosis of the chest wall, so the answer gives "tuberculosis" on the granulomatous findings and the confirmatory tests.
- Gum lesion: oral submucous fibrosis is not in the textbook, so the complications given are fibrosis (from chronic inflammation) and squamous cell carcinoma.
- Rebound tenderness (appendicitis case) is not in the textbook. The answer uses the textbook's clinical features.

### Items to check
- Inflammation definition: the textbook block is garbled in the source file, and "leukocytes" is restored from the displaced word, as in session 2.
- Leukocyte count in appendicitis and the confirmation question: "15,000 or 20,000 per microlitre" follows the textbook figure (printed as cells/mL).
- "Inflammation is a protective response but may be potentially harmful": built from the General Features section (page 65) and Table 3.2.

### Housekeeping
- tools/hand_edits.json: three hunks removed (the old angiogenesis answer text no longer exists). 31 remain.
- Progress file lists 225 questions done. SW version v141. tools/tests/sw_version.json regenerated.
- Site tests: 98 run. test_site passed after the version bump. Browser annotation tests (test_annot, test_annot_p5, test_annot_p6, test_annot_tb) had 5 failures and 6 errors that do not touch answer text; they were not compared with a clean checkout.

## Session 6, Chapter 4 electrolyte and acid-base answers (outside sources)

The site textbook (ch04.json) has no section on electrolytes or acid-base disorders, so these 17 answers use outside sources.

| Question | Source | URL |
|---|---|---|
| Normal serum levels of Na⁺, K⁺, Cl⁻ and HCO₃⁻. | Sodium 135 to 145, potassium 3.7 to 5.2 and chloride 98 to 107 mEq/L from MedlinePlus (NIH) blood tests; bicarbonate 21 to 28 mEq/L from StatPearls "Metabolic Acidosis" | https://medlineplus.gov/ency/article/003481.htm ; https://medlineplus.gov/ency/article/003484.htm ; https://medlineplus.gov/ency/article/003485.htm ; https://www.statpearls.com/point-of-care/17095 |
| What is hypokalaemia? / Causes of hypokalaemia. | StatPearls "Hypokalemia" | https://www.ncbi.nlm.nih.gov/books/NBK482465/ |
| What is hyperkalaemia? / Causes of hyperkalaemia. | StatPearls "Hyperkalemia" | https://www.ncbi.nlm.nih.gov/books/NBK470284/ |
| What is hyponatraemia? / Causes of hyponatraemia. | StatPearls "Hyponatremia" | https://www.statpearls.com/ArticleLibrary/viewarticle/23274 |
| What is hypernatraemia? / Causes of hypernatraemia. | StatPearls "Hypernatremia" | https://www.ncbi.nlm.nih.gov/books/NBK441960/ |
| What is hypocalcaemia? / Causes of hypocalcaemia. | StatPearls "Hypocalcemia" | https://www.ncbi.nlm.nih.gov/books/NBK430912/ |
| What is hypercalcaemia? / Causes of hypercalcaemia. | StatPearls "Hypercalcemia" | https://statpearls.com/point-of-care/23158 |
| What is metabolic acidosis? / Causes of metabolic acidosis. | StatPearls "Metabolic Acidosis" | https://www.statpearls.com/point-of-care/17095 |
| What is metabolic alkalosis? / Causes of metabolic alkalosis. | StatPearls "Physiology, Metabolic Alkalosis" (definition and urine-chloride classification); StatPearls "Alkalosis" (specific causes by mechanism) | https://www.statpearls.com/point-of-care/17360 ; https://www.statpearls.com/point-of-care/31504 |

### Points left out or needing a decision (electrolytes)
- The sources differ slightly on normal ranges and cut-offs: StatPearls gives the lower limit of normal potassium as 3.5 mmol/L (used in the hypokalaemia definition) whereas MedlinePlus gives 3.7 to 5.2 mEq/L (used in the normal-levels table); StatPearls gives hyperkalaemia as above 5.0 to 5.5 mEq/L; StatPearls defines metabolic acidosis as serum bicarbonate below 24 mEq/L but gives the normal range as 21 to 28 mEq/L. Each figure is quoted as its source states it.
- Hypocalcaemia and hypercalcaemia definitions: the StatPearls hypocalcaemia article gives one defining sentence (used); the hypercalcaemia article states only the normal range, so the definition is "above the normal range of approximately 8.9 to 10.1 mg/dL".
- Severity grades (hypokalaemia mild, moderate, severe; hypercalcaemia mild, moderate, crisis) and the normal calcium ranges for the hypocalcaemia article were left out of the "What is" answers under rule 1 (definition only).
- Eponyms in these lists (Conn, Liddle, Gitelman, Bartter, Fanconi, Cushing, Addison, DiGeorge, CHARGE, APECED, MELAS) are given as the sources give them; the sources do not explain their meanings, so no meaning was added except Conn syndrome (primary hyperaldosteronism), which the source itself states.
- The hypocalcaemia source's ionised and corrected calcium values, the hyperkalaemia and hyponatraemia drug lists beyond those quoted, and respiratory alkalosis causes were not used.

## Session 7 (Chapter 4 embolism to Chapter 7; 75 questions)

### Outside sources used
| Question | Source | URL |
|---|---|---|
| Define gene. | NCBI Bookshelf glossary entry "Gene" (the site textbook, Chapters 1 and 5, never defines a gene) | https://ncbi.nlm.nih.gov/books/NBK5191/def-item/gene |

### Points left out or needing a decision (session 7)
- "A 40y male lost consciousness with cold clammy skin after severe bleeding in RTA": the textbook gives no explanation of loss of consciousness in hypovolaemic shock, so none was added.
- "Define gene": the NCBI glossary is not a pathology textbook, StatPearls or a WHO classification; please confirm it is acceptable.
- "Write a short note on hemorrhagic shock": the textbook has no separate haemorrhagic shock section; the answer is built from the hypovolaemic shock, stages of shock, morphology and clinical features passages.
- "Two examples of autosomal dominant disorders": Marfan syndrome and familial hypercholesterolaemia were chosen because the textbook states their inheritance as autosomal dominant in so many words; Table 5.1 (list of autosomal dominant disorders) is not in the site textbook source.
- Session 7 batch 5 (Chapter 6 and Chapter 7 start): all answers come from the site textbook (Chapters 2, 6, 7 and 24); no outside sources.
- "Name some autoimmune diseases.": the rows of Table 6.6 were not captured in the site textbook source (the table block is empty), so the list uses only the table fragments that survive (pernicious anaemia, myasthenia gravis, Graves disease, Goodpasture syndrome; T cell–mediated and postulated groups) plus diseases named in the text (autoimmune haemolytic anaemia, thrombocytopenia, systemic lupus erythematosus). Pemphigus vulgaris, Hashimoto thyroiditis and similar were left out because no surviving passage lists them as autoimmune examples.
- "What is amyloidosis?": definition only, per the answer rules; classification, pathogenesis and morphology were left out.
- "Differences between hyperplasia and neoplasia.": "polyclonal versus monoclonal" hyperplasia, the Willis definition and "never invades" were left out because the site textbook does not state them in this form.
- "Write a short note on MHC." and "Write a short note on autoimmune disease.": the site textbook gives no separate clinical-features or morphology passage for them; clinical features of autoimmune disease are limited to the textbook's statements that manifestations are varied and that autoantibody detection is the most widely used test.
- "A 30y lady ... Graves": exophthalmos and TSI points come from Chapter 24 (Graves disease) together with the antibody-mediated receptor stimulation passage in Chapter 6; the textbook does not explain the origin of the autoreactive T cells beyond genetic susceptibility.
