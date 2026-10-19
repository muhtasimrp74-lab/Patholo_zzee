# Answer rewrite build log

**Reading the outside-source tables.** From session 16 each outside-source table carries a *Claims extracted* column so a claim in an answer can be traced to a logged URL. Entries marked VERIFIED were checked against the fetched page in session 16. Entries marked "Auto-extracted" list the numeric and table claims found in the current answer text; they have not yet been checked line by line against the URLs and are the review queue. "Topic-level entry" means the logged label covers several answers or no longer matches an answers.md heading exactly, so its claims are not itemised yet.

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

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Normal serum levels of Na⁺, K⁺, Cl⁻ and HCO₃⁻. | Sodium 135 to 145, potassium 3.7 to 5.2 and chloride 98 to 107 mEq/L from MedlinePlus (NIH) blood tests; bicarbonate 21 to 28 mEq/L from StatPearls "Metabolic Acidosis" | https://medlineplus.gov/ency/article/003481.htm ; https://medlineplus.gov/ency/article/003484.htm ; https://medlineplus.gov/ency/article/003485.htm ; https://www.statpearls.com/point-of-care/17095 | Auto-extracted figures, not yet checked line by line against the URLs: Sodium (Na⁺): 135 to 145 mEq/L; Potassium (K⁺): 3.7 to 5.2 mEq/L; Chloride (Cl⁻): 98 to 107 mEq/L; Bicarbonate (HCO₃⁻): 21 to 28 mEq/L |
| What is hypokalaemia? / Causes of hypokalaemia. | StatPearls "Hypokalemia" | https://www.ncbi.nlm.nih.gov/books/NBK482465/ | Auto-extracted figures, not yet checked line by line against the URLs: Hypokalaemia is a serum potassium level below the acceptable lower limit of normal, which is 3.5 mmol/L.; Chloride-resistant metabolic alkalosis from mineralocorticoid excess: Conn syndrome , congenital adrenal…; Other renal conditions: Fanconi syndrome , renal tubular acidosis (especially type 1), hypomagnesaemia, u… |
| What is hyperkalaemia? / Causes of hyperkalaemia. | StatPearls "Hyperkalemia" | https://www.ncbi.nlm.nih.gov/books/NBK470284/ | Auto-extracted figures, not yet checked line by line against the URLs: Hyperkalaemia is a serum or plasma potassium level exceeding the upper limit of normal, typically greater… |
| What is hyponatraemia? / Causes of hyponatraemia. | StatPearls "Hyponatremia" | https://www.statpearls.com/ArticleLibrary/viewarticle/23274 | Auto-extracted figures, not yet checked line by line against the URLs: Hyponatraemia is a serum sodium concentration of less than 135 mEq/L. The cut-off can vary to a small ext… |
| What is hypernatraemia? / Causes of hypernatraemia. | StatPearls "Hypernatremia" | https://www.ncbi.nlm.nih.gov/books/NBK441960/ | Auto-extracted figures, not yet checked line by line against the URLs: Hypernatraemia is a serum sodium concentration of greater than 145 mEq/L. |
| What is hypocalcaemia? / Causes of hypocalcaemia. | StatPearls "Hypocalcemia" | https://www.ncbi.nlm.nih.gov/books/NBK430912/ | Auto-extracted figures, not yet checked line by line against the URLs: Destruction of the parathyroid glands, postsurgical or autoimmune; postsurgical hypoparathyroidism accoun…; Abnormal parathyroid development, including DiGeorge syndrome , CHARGE syndrome, gracile bone dysplasia…; Rare gland destruction from granulomatous disease, haemochromatosis, Wilson disease , amyloidosis, alumin…; Severe sepsis, critical illness and trauma, including COVID-19 |
| What is hypercalcaemia? / Causes of hypercalcaemia. | StatPearls "Hypercalcemia" | https://statpearls.com/point-of-care/23158 | Auto-extracted figures, not yet checked line by line against the URLs: Hypercalcaemia is a serum calcium level above the normal range, which is approximately 8.9 to 10.1 mg/dL… |
| What is metabolic acidosis? / Causes of metabolic acidosis. | StatPearls "Metabolic Acidosis" | https://www.statpearls.com/point-of-care/17095 | Auto-extracted figures, not yet checked line by line against the URLs: Metabolic acidosis is characterised by an increase in the hydrogen ion concentration in the systemic circ… |
| What is metabolic alkalosis? / Causes of metabolic alkalosis. | StatPearls "Physiology, Metabolic Alkalosis" (definition and urine-chloride classification); StatPearls "Alkalosis" (specific causes by mechanism) | https://www.statpearls.com/point-of-care/17360 ; https://www.statpearls.com/point-of-care/31504 | Auto-extracted figures, not yet checked line by line against the URLs: Metabolic alkalosis is a state in which the pH is elevated to greater than 7.45 because of a metabolic pr…; Chloride-responsive (urine chloride less than 10 mEq/L); Chloride-resistant (urine chloride greater than 20 mEq/L) |

### Points left out or needing a decision (electrolytes)
- The sources differ slightly on normal ranges and cut-offs: StatPearls gives the lower limit of normal potassium as 3.5 mmol/L (used in the hypokalaemia definition) whereas MedlinePlus gives 3.7 to 5.2 mEq/L (used in the normal-levels table); StatPearls gives hyperkalaemia as above 5.0 to 5.5 mEq/L; StatPearls defines metabolic acidosis as serum bicarbonate below 24 mEq/L but gives the normal range as 21 to 28 mEq/L. Each figure is quoted as its source states it.
- Hypocalcaemia and hypercalcaemia definitions: the StatPearls hypocalcaemia article gives one defining sentence (used); the hypercalcaemia article states only the normal range, so the definition is "above the normal range of approximately 8.9 to 10.1 mg/dL".
- Severity grades (hypokalaemia mild, moderate, severe; hypercalcaemia mild, moderate, crisis) and the normal calcium ranges for the hypocalcaemia article were left out of the "What is" answers under rule 1 (definition only).
- Eponyms in these lists (Conn, Liddle, Gitelman, Bartter, Fanconi, Cushing, Addison, DiGeorge, CHARGE, APECED, MELAS) are given as the sources give them; the sources do not explain their meanings, so no meaning was added except Conn syndrome (primary hyperaldosteronism), which the source itself states.
- The hypocalcaemia source's ionised and corrected calcium values, the hyperkalaemia and hyponatraemia drug lists beyond those quoted, and respiratory alkalosis causes were not used.

## Session 7 (Chapter 4 embolism to Chapter 7; 75 questions)

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Define gene. | NCBI Bookshelf glossary entry "Gene" (the site textbook, Chapters 1 and 5, never defines a gene) | https://ncbi.nlm.nih.gov/books/NBK5191/def-item/gene | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |

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

## Session 8, batch 3 (13 answers: Chapter 7 grading and staging through tumour markers; round total 50)

Questions: grading, staging, TNM, childhood tumours, grading and staging (basis and importance), Bangladesh common cancers, laboratory diagnosis (two questions, same text on purpose), FNAC organs, biopsy, types of biopsy, five tumour markers, tumour markers short note.

Sources: the site textbook (Chapter 7 "Grading and Staging of Tumors" and "Laboratory Diagnosis of Cancer"; Chapter 10 "Tumors and Tumor-like Lesions of Infancy and Childhood", Table 10.5).

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Enumerate common cancers in males and females of the Bangladeshi population. | IARC GLOBOCAN 2022 estimates as reported: Daily Star World Cancer Day supplement (3 Feb 2026); Financial Express report of the Health Minister's statement to Parliament (June 2026); WHO Bangladesh (2017, 2012 estimates) | https://epfs.thedailystar.net/TDS/2026/02/03/Bangladesh/MAI/5_13/0eb4d59a15c1e7dd_13.pdf ; https://thefinancialexpress.com.bd/health/over-100000-people-die-from-cancer-related-causes-each-year-in-bangladesh ; https://www.who.int/bangladesh/news/detail/06-02-2017-yearly-8.8-million-people-die-from-cancer | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| What do you mean by biopsy? / Types of biopsy. | CancerQuest (Emory), "Tissue Biopsies" | https://cancerquest.org/node/4186 | Auto-extracted figures, not yet checked line by line against the URLs: Excisional biopsy. The entire tumour is removed with some surrounding tissue.; Incisional biopsy. Only a portion of the lesion is removed.; Punch biopsy. Collects a deep sample of skin.; Needle biopsy. Used for internal organs, lymph nodes or deep skin areas. It is of two kinds |

### Points left out or needing a decision
- Bangladesh: the exact rank order is not given in any source I could open, so the answer lists sites without ranking. The old extra sites (stomach, hypopharynx and larynx, lip and oral cavity ranks) and the risk-factor paragraph were dropped as unverified. Please confirm you accept GLOBOCAN as reported.
- Biopsy: the textbook has no definition of biopsy and no classification of types. The definition and the types (excisional, incisional, punch, needle: FNA and core) come from the outside source. The Greek derivation and the old table (Tru-Cut, endoscopic examples) were dropped.
- TNM: Tis and Tx from the old answer are not in the textbook and were removed; the textbook says T0 marks an in situ lesion.
- FNAC organs: only breast, thyroid, lymph nodes (palpable) and pelvic lymph nodes and pancreas (image-guided) are given, as the textbook states. The old list (salivary gland, lung, liver, kidney, prostate and others) was dropped.
- Tumour markers: Table 7.12 has no rows in the site textbook source. The five markers come from the text. HCG is given for testicular tumours as the text says (the old answer said choriocarcinoma). The old definition (enzymes, hormones, oncofoetal antigens) was replaced with the textbook's Key Concepts wording.
- Childhood tumours: built from Chapter 10; the old statistics (10% of deaths, 60% of deaths, US figures from another passage) were replaced with the Chapter 10 figures (2% of malignant tumours, 16% of deaths at 5 to 14 years, about 25% each for leukaemia and brain tumours).
- Grading and staging answers: old "Staging is of greater value" kept, now from Key Concepts; the old AJCC molecular sentence kept from the text.

### Housekeeping
- Progress file lists 430 questions done (380 at the start of the round plus 50). 705 remain.
- Site tests were not run this batch; the service-worker version was not bumped.

## Session 8, batch 4 (50 answers recovered from the saved chat page; Chapter 7 neoplasia through Chapter 9 vitamin A)

These 50 answers had been written in an earlier session (files b10, b11 and b12) but were never pushed, because that session ended mid-run. They were recovered word for word from the saved chat page and applied here, so the "Answer more 50 questions" round is now complete.

Questions: neoplasia, benign and malignant tumours, dysplasia, oncogenes and tumour suppressor genes, environmental and viral carcinogenesis, angiogenesis, heterogeneity, precancerous lesions, cytology techniques, FNAC, frozen section, fixatives, IHC, three clinical case scenarios (thyroid, skin, melanoma), environmental hazards (lead, arsenic, pollution, tobacco, alcohol, radiation, burns), malnutrition, PEM, marasmus and kwashiorkor, vitamin A.

Sources: the site textbook (Chapters 7, 9, 24 and 25).

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What are the common fixatives used for histo- and cytopathological examination? | Web search results (Leica Biosystems "Fixation and fixatives: 4 popular fixative solutions", plus a PubMed Central article comparing tissue fixation methods) as seen on the saved chat page | exact URLs not recoverable from the saved page; please re-check | Auto-extracted figures, not yet checked line by line against the URLs: % neutral buffered formalin: The most widely used fixative for routine histopathology; Ethanol (95%): A denaturing alcohol fixative; specimens can be placed directly into it |
| Common nutritional disorders of Bangladesh. | Web search results (UN Nutrition, GAIN, Thrive Global, Education Commission country case study, Daily Observer Bangladesh, BVS) as seen on the saved chat page | exact URLs not recoverable from the saved page; please re-check | Auto-extracted figures, not yet checked line by line against the URLs: Protein-energy malnutrition. Stunting, wasting and underweight in children, with marasmus and kwashiorkor…; Vitamin A deficiency. Night blindness and xerophthalmia in children.; Iron deficiency anaemia. Common in children and in women, including pregnant and lactating women.; Iodine deficiency disorders. Goitre and hypothyroidism.; (+1 more) |

### Points needing a decision
- The two outside-source answers above are the only ones in this batch that go beyond the textbook. Please confirm or replace them.
- This batch was recovered from page text, so please skim a few answers on the site for any stray characters.

## Session 8, batch 5 (25 answers: Chapter 9 vitamin D through Chapter 12 angina)

Questions: rickets, effects of vitamin D deficiency, zinc (importance, development, clinical features, short note), obesity consequences, PEM, kwashiorkor, beriberi, vitamin A sources and manifestations, diet and cancer, arteriosclerosis (definition, types), atherosclerosis (definition, risk factors, pathogenesis, morphology, common sites, complications, diet), ischaemic heart disease (definition, types), angina pectoris.

Sources: the site textbook only (Chapter 9 Environmental and Nutritional Diseases, Chapter 11 Blood Vessels, Chapter 12 The Heart). **No outside sources were used.**

### Points left out or needing a decision
- Zinc: the textbook gives zinc only in Table 9.10 (function, causes, deficiency features). The old answers added ZIP4, phytates, alcohol, burns and similar details; these were dropped as not in the textbook.
- Beriberi: the textbook gives thiamine pyrophosphate as a coenzyme, "dry and wet beriberi" as the syndromes, polished rice and alcohol as causes, and "beriberi heart disease" in the cardiomyopathy chapter. It does not describe the features of dry or wet beriberi, so the answer says so. The old biochemistry (pyruvate dehydrogenase and similar enzymes) and clinical details were dropped.
- Rickets (What is rickets?): definition only, per the answer rules. Pathogenesis moved to the "Effects of vitamin D deficiency" answer.
- Define ischaemic heart disease, Define arteriosclerosis: definition only.
- Draw and label an atheroma: the old text diagram was replaced by a numbered labelled description, so every line reads aloud.
- Diet and atherosclerosis: the textbook's Chapter 9 passage (reducing saturated fat lowers cholesterol by 10% to 15%) and its Chapter 11 statement (the contribution of most dietary fats is now viewed as minimal) differ in emphasis; both are given.
- Eponyms: Mönckeberg medial sclerosis is described by its feature; Prinzmetal variant angina is explained as angina caused by spasm.
- Same text on purpose: dietary sources of vitamin A and vitamin A manifestations reuse the "Sources of vitamin A" and "Effects of vitamin A deficiency" answers from batch 4; the zinc short note repeats the zinc clinical features.

### Housekeeping
- Progress file lists 505 questions done (430 before batch 4, plus 50, plus 25). 630 remain.
- Site tests were not run. VERSION in sw.js was bumped.

## Session 8, batch 6 (25 answers: Chapter 12 myocardial infarction through infective endocarditis)

Questions: myocardial infarction (definition, risk factors, pathogenesis, morphology, complications, laboratory diagnosis, markers, troponin, three case scenarios), hypertensive heart disease (two questions), rheumatic fever (criteria, pathogenesis, valves, complications, Aschoff body, case scenario in two parts), vegetation, subacute infective endocarditis, classification, pathogenesis, complications of infective endocarditis.

Sources: the site textbook only (Chapter 12 The Heart, Chapter 11 for risk factors, Chapter 2 for physiological hypertrophy). **No outside sources were used.**

### Points left out or needing a decision
- Cardiac markers: the textbook names only troponins T and I with their timing. The old CK-MB, myoglobin, LDH and AST rows were dropped as not in the textbook, and the answer says so.
- Aschoff nodule: the textbook describes Anitschkow cells (caterpillar cells) but no giant cells; the answer says so.
- IE complications: the textbook passage is cut by a page break after "sepsis, arrhythmias"; the answer uses what is readable and the later paragraph on ring abscess, embolisation and outcome.
- "What is vegetation?": the textbook has no stand-alone definition; the wording is built from its infective endocarditis passage and the rheumatic fever vegetation description.
- "What is myocardial infarction?": definition only.
- Hypertensive heart disease answers rely on the Chapter 12 morphology passage; the physiological hypertrophy examples come from Chapter 2 as in earlier batches.
- Not done this batch: "What is granulopoiesis?" (next in the list).

### Housekeeping
- Progress file lists 530 questions done. 605 remain.
- Site tests were not run. VERSION in sw.js was bumped to v145.

## Session 9, batch 1 (26 answers: Chapter 13 granulopoiesis through laboratory diagnosis of AML)

Questions: granulopoiesis, stages of the granulocytic series, leucocytosis, neutrophilia, eosinophilia, Loeffler syndrome, lymphocytosis (define, causes), leukopenia, neutropenia, agranulocytosis, causes of leucopenia/neutropenia/agranulocytosis, leukaemoid reaction (short note, two comparison tables), subleukaemic leukaemia, leukoerythroblastic blood picture (two questions), define and classify leukaemia, FAB and WHO classification of AML, clinical presentation, laboratory diagnosis of acute leukaemia, AML versus ALL, laboratory diagnosis of AML. None of these was previously empty.

Sources: the site textbook (Chapter 13; Chapter 15 and Chapter 8 for Loeffler syndrome).

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What is granulopoiesis? | Inflammation Research review, figure legend on granulopoiesis (PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC7829132/figure/f0001 | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| Stages of the granulocytic series. | Pathology Outlines, Bone marrow nonneoplastic: neutrophil maturation; Open Education Alberta, Granulocytes and Granulocyte Maturation; Cancer Metastasis Reviews, neutrophil granulopoiesis figure (PMC) | https://www.pathologyoutlines.com/topic/bonemarrowneutrophilmaturation.html ; https://pressbooks.openeducationalberta.ca/mlsci/chapter/granulocyte-maturation/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7802614/figure/Fig1 | Auto-extracted figures, not yet checked line by line against the URLs: Myeloblast: the earliest precursor recognisable by morphology; delicate nuclear chromatin, two to four nu…; Promyelocyte: larger cell with more basophilic cytoplasm and coarse primary (azurophilic) granules; round…; Myelocyte: specific (secondary) granules start to form; this is the stage at which the cell becomes a neu…; Metamyelocyte: specific granules are fully present; the nucleus is indented.; (+2 more) |
| Define leukaemoid reaction / short note | Radiopaedia, Leukemoid reaction; Taylor and Francis, Leukemoid reaction (haematology reference); Hematopathology chapter, Table 26.5 (PMC) | https://radiopaedia.org/articles/leukemoid-reaction ; https://taylorandfrancis.com/knowledge/Medicine_and_healthcare/Hematology/Leukemoid_reaction ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7151933/table/t0050 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Differences between leukaemoid reaction and leukaemia; and subleukaemic acute leukaemia | same three sources as above | as above | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| What is subleukaemic leukaemia? | Disease Ontology DOID:12965 | https://informatics.jax.org/disease/DOID:12965 | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| FAB classification of AML. | IntechOpen chapter on FAB classification; SEER Training Modules, AML morphology | https://www.intechopen.com/chapters/25114 ; https://training.seer.cancer.gov/leukemia/abstract-code-stage/morphology/aml.html | Auto-extracted figures, not yet checked line by line against the URLs: M0: Acute myeloblastic leukaemia with minimal differentiation; M1: Myeloblastic leukaemia without maturation; M2: Myeloblastic leukaemia with maturation; M3: Acute promyelocytic leukaemia; (+4 more) |

### Points left out or needing a decision
- The textbook has no definition of granulopoiesis, no stages of the granulocytic series, no FAB classification and no definition of subleukaemic leukaemia; those come from the outside sources above. The textbook gives only the lone term aleukaemic leukaemia (Chapter 13 AML morphology), which is added to the subleukaemic answer.
- Define lymphocytosis: the textbook has no stand-alone definition; the wording is built from its list of the five principal types of leukocytosis.
- Loeffler syndrome: Chapter 15 gives the cause and Chapter 8 the symptoms of the pulmonary form. Loeffler endomyocarditis (Chapter 12) is a different condition and was left out.
- Units: the textbook text shows white cell counts as "/mL" (for example "100/mL", "100,000 cells/mL"). These are read as per microlitre, the clinical unit, and the figures are unchanged. The neutrophil threshold "500/mL3" is written as 500 per cubic millimetre.
- WHO Table 13.10 text: the extraction shows ".3%", ".50%", ".20%" and ".80%"; these are read as "more than".
- Leukaemoid reaction: the textbook only names it. The outside sources do not agree on the white cell threshold (Radiopaedia and the Taylor and Francis entry say more than 50,000 per microlitre; a Bern teaching page says more than 20 x 10^9 per litre). The 50,000 figure was used. Clinical features of leukaemoid reaction were left out because no standard source consulted gave them.
- Comparison with leukaemia uses chronic myeloid leukaemia as the leukaemia, as the source table does; the leukaemic hiatus row refers to acute leukaemia.
- Differences between leukaemoid reaction and subleukaemic acute leukaemia: no source gives a ready-made table, so it was assembled from the sources above; the Auer rod and blast percentage rows come from the textbook.
- Eponyms: Kostmann syndrome is given by its feature (severe congenital neutropenia); Loeffler syndrome is explained in brackets; Dohle bodies are explained as patches of dilated endoplasmic reticulum.
- Define leukaemia: the textbook sentence is used as printed in Chapter 13 (leukaemias are neoplasms that present with widespread involvement of the bone marrow and usually the blood).
- AML versus ALL: the periodic acid-Schiff and Auer rod entries for the opposite cell are marked "not described" or "not a feature" where the textbook is silent.

## Session 9, batch 2 (24 answers: Chapter 13 infection in acute leukaemia through causes of splenomegaly)

Questions: infection in acute leukaemia, myeloblast versus lymphoblast, Philadelphia chromosome (what is, importance), blast crisis, laboratory diagnosis of CML and of CLL, why blast crisis has a worse prognosis, myelodysplastic syndrome, myeloproliferative disorders (what are, classify, non-CML), polycythaemia (define, clinical features, polycythaemia vera versus secondary, laboratory diagnosis, WHO criteria), myelofibrosis (define, laboratory diagnosis, types, conditions with secondary myelofibrosis), essential thrombocythaemia, causes of hypersplenism, causes of splenomegaly. None was previously empty.

Sources: the site textbook (Chapter 13; Chapter 14 for the definition and classification of polycythaemia).

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| WHO diagnostic criteria for polycythaemia vera. | WHO 2016 criteria as tabulated in Clinical Lymphoma, Myeloma and Leukemia 2018 (PMC) and in Annals of Hematology 2020 (PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5915302/table/T1 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7782364/table/Tab2 | Auto-extracted figures, not yet checked line by line against the URLs: The WHO 2016 criteria. The diagnosis requires either all three major criteria, or the first two major cri…; Haemoglobin more than 16.5 g/dL in men or more than 16.0 g/dL in women, or haematocrit more than 49% in m…; Bone marrow biopsy showing hypercellularity for age with trilineage growth (panmyelosis), including promi…; Presence of a JAK2 V617F or JAK2 exon 12 mutation.; (+1 more) |
| Causes of hypersplenism. / Causes of splenomegaly. (infiltrative group only: sarcoidosis, amyloidosis, glycogen and lipid storage diseases, metastases) | StatPearls, Splenomegaly | https://www.statpearls.com/point-of-care/29386 | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |

### Points left out or needing a decision
- WHO polycythaemia vera criteria: the textbook gives none, so the WHO 2016 criteria are given. These were not checked against the 2022 (fifth edition) WHO classification; the page gives the 2016 criteria as published in the sources above. Please confirm which edition your examiners use.
- Table 13.12 (disorders associated with splenomegaly) is empty in the textbook source file; only fragments (infections, infectious mononucleosis, non-Hodgkin lymphomas and lymphocytic leukaemias, multiple myeloma, myeloproliferative neoplasms, haemolytic anaemias) are readable. The splenomegaly and hypersplenism answers use these fragments, the congestive splenomegaly passage, the rupture passage (malaria, typhoid fever), the extramedullary haematopoiesis passage (thalassaemia) and the StatPearls infiltrative group.
- Causes of hypersplenism: the textbook gives no separate list of causes; the answer states its definition and mechanism and lists the splenomegaly disorders.
- Table 14.8 (classification of polycythaemia) is also mostly empty in the source file; the secondary causes are taken from its readable lines and the Chapter 14 paragraph.
- Types of myelofibrosis and conditions with secondary myelofibrosis: the textbook names primary myelofibrosis and the spent phase of polycythaemia vera, essential thrombocythaemia and other myeloproliferative neoplasms; it does not list other causes of secondary marrow fibrosis, so none are given.
- Why blast crisis has a worse prognosis: the textbook gives no comparative survival figures or stated reasons; the answer lists what it says about blast crisis (greatest threat to the patient, resembles acute leukaemia, new cytogenetic abnormalities, Ikaros mutations).
- Laboratory diagnosis of CML: leukocyte alkaline phosphatase is not in the textbook for CML, so it is not listed (it is given in the leukaemoid reaction comparison table from the outside source).
- Differences between polycythaemia vera and secondary polycythaemia: rows were kept only where the textbook gives both sides.
- Philadelphia chromosome: the textbook does not explain the eponym; it is described by what it is (the 9;22 translocation).
- Units: the white cell counts "/mL" in the textbook text are read as per microlitre (see batch 1).
- Hand edits: tools/hand_edits.json hunks 7 and 8 were anchored to the old polycythaemia classification answer, which the rewrite of "What do you mean by polycythaemia?" replaced; the two stale hunks were dropped (as in earlier sessions).
- Same text on purpose: the splenomegaly and hypersplenism answers share the congestive splenomegaly and infiltrative lists.

### Housekeeping
- Progress file lists 580 questions done (530 before this session, plus 26 in batch 1, plus 24 in batch 2). 555 remain.

### Session 9 end checks
- build.py run twice: index.html byte-identical (md5 387f8c77dd947b9522097424cb491ff6).
- VERSION in sw.js bumped from v145 to v146; build.py, gen_manifests.py and build.py run again.
- tools/tests/test_site.py: 34 tests, all passed.

### Session 10, batch 1 (indices 0 to 17)
Questions: hypersplenism criteria, paraproteinaemia, causes of paraproteinaemia, myeloma, pathophysiology, laboratory diagnosis and diagnosis of myeloma, Bence Jones protein, immunoproliferative disorders, Waldenström, lymphadenopathy (define, causes), lymphadenitis (causes, morphology), classification of lymphoma, Hodgkin vs non-Hodgkin, Reed-Sternberg cells, classification of Hodgkin lymphoma, diagnosis of lymphoma, myeloma vignettes.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What do you mean by lymphadenopathy? / Common causes of lymphadenopathy. | StatPearls, Lymphadenopathy; StatPearls, Adenopathy (generalized, localised, causes); Merck Manual, Lymphadenopathy | https://www.ncbi.nlm.nih.gov/books/NBK513250 ; https://www.ncbi.nlm.nih.gov/books/NBK558918/ ; https://www.merckmanuals.com/en-ca/professional/cardiovascular-disorders/lymphatic-disorders/lymphadenopathy | Auto-extracted figures, not yet checked line by line against the URLs: Lymphadenopathy is enlargement of lymph nodes. It occurs in 2 patterns; Generalised: nodes in 2 or more non-contiguous regions. |

- Textbook gives no definition of lymphadenopathy; the two patterns are taken from the StatPearls and Merck pages above.
- Table 13.7 (Hodgkin vs non-Hodgkin) is truncated in the source file (four rows); extra rows come from the Hodgkin lymphoma and general lymphoid neoplasm text.
- Diagnostic criteria of hypersplenism: correction after splenectomy and isotope sequestration studies left out, as the textbook does not give them.
- Bence Jones: heat test and other urine methods left out (not in textbook); the eponym is not explained in the textbook.
- Myeloma vignette (index 45): the textbook does not mention ESR; it states that high M protein makes red cells form rouleaux, which is what the answer uses.
- Lymphadenopathy causes: the StatPearls list was only partly readable; items beyond it come from the textbook lymphadenitis text.

### Session 10, batch 2 (indices 19 to 41)
Questions: CML and acute leukaemia vignettes, neutrophilia, eosinophilia, aetiology of leukaemia, AML (FAB), acute leukaemia presentation and laboratory diagnosis, lymphoma vignettes, blast crisis, chronic leukaemia, CML clinical features, leukaemoid reaction types, subleukaemic leukaemia versus aplastic anaemia, polycythaemia rubra vera.
- Several answers reuse the text already written for the same topic in session 9 (neutrophilia causes, FAB classification, acute leukaemia presentation, acute leukaemia and AML laboratory diagnosis, blast crisis, CML laboratory diagnosis, subleukaemic leukaemia); ALL clinical presentation and ALL blood and marrow picture use the shared acute leukaemia answers, as the textbook gives them together.
- Neutrophilia: the textbook has no separate definition; the answer defines it from the leukocytosis text and gives the reference range from Table 13.1.
- Aetiology of leukaemia: radiation, benzene and other environmental agents are not named in the textbook, so they are left out.
- Chronic leukaemia: the textbook has no separate definition; the answer uses the leukaemia definition and names the two chronic types.
- Types of leukaemoid reaction: the textbook mentions only the neutrophilic and the lymphoid (viral) pictures.
- Subleukaemic versus aplastic anaemia: rows kept only where the textbook gives both sides.

### Session 10, batch 3 (remaining Chapter 13 and Chapter 14 questions)
Questions: myeloma bone marrow and ESR, Bence Jones short note, generalised and cervical lymphadenopathy, Hodgkin morphology, Reed-Sternberg cell variants, Hodgkin short note, nodular sclerosis, haemopoiesis (define, sites, extramedullary), peripheral blood film, red cell indices (what, importance), normal haemoglobin, bone marrow indications, trephine biopsy, blood tap and dry tap, anaemia (define, morphological types, examples, pathophysiological categories, causes).

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Indications of bone marrow biopsy / aspiration / examination. | EBM Guidelines, Bone Marrow Examination (Duodecim) | https://download.skyscape.com/download/ota/lonestar/B4562E59-87F6-47FA-8F09-D67E1FE536CA/ebmgcvd.ed18/content/HTML/4/tn149.htm | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| How is trephine biopsy done? | Hong Kong Medical Journal, bone marrow aspiration and biopsy (hkmj.org, vol 23 no 4); EBM Guidelines (above) | https://www.hkmj.org/system/files/hkmj-v23n4-hkmms.pdf | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| What do you mean by blood tap and dry tap? | Indian J Pathol (Springer), dry tap study; Ayub Med Coll, dry tap | https://link.springer.com/article/10.1007/s12308-021-00450-y ; https://jamc.ayubmed.edu.pk/index.php/jamc/article/view/1083 | Auto-extracted figures, not yet checked line by line against the URLs: Dry tap or blood tap: failure to obtain marrow particles on bone marrow aspiration; reported in 2.7% to 1…; It is a red flag for underlying marrow pathology rather than only a failed procedure; in one series 93.7%… |
| Common causes of lymphadenopathy / generalised / cervical. | StatPearls, Lymphadenopathy and Adenopathy; Am Fam Physician 2016 | https://www.ncbi.nlm.nih.gov/books/NBK558918/ ; https://pubmed.ncbi.nlm.nih.gov/27929264/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

- Normal haemoglobin by age: the textbook gives only the adult male and female ranges; values for newborns and children are left out.
- Haemopoiesis: the textbook has no separate definition; the answer uses its normal haematopoiesis text.
- Peripheral blood film: the textbook has no list of what a film shows; the answer collects the findings it describes in different chapters.
- Trephine biopsy: no step-by-step technique (positioning, needle size, anaesthesia, procedure) is given in a source found, so those steps are left out.
- Bone marrow indications: the textbook names only some; the rest come from the EBM Guidelines page, which was only partly readable.
- Blood tap: no source separates it from a dry tap, so both are described together.
- ESR in myeloma: see batch 1; ESR itself is not in the textbook.
- Examples of morphological types of anaemia: only those the textbook states are given.

### Session 10 housekeeping
- Batch 1 rewrote 23 answers (indices 0 to 18 plus the shared texts for 42, 45, 49 and 54), not 18 as its heading says; batch 2 rewrote 23; batch 3 rewrote 24. Total 70, all from Chapter 13 (to the end of its list) and the start of Chapter 14 (anaemia introduction).
- All 70 questions already had an answer, so none were previously empty.
- Progress file lists 650 questions done (580 before this session, plus 70). 485 remain.

### Session 10 end checks
- build.py run twice: index.html byte-identical.
- VERSION in sw.js bumped from v146 to v148 (v147 after batch 3, v148 after batch 4); build.py, gen_manifests.py and build.py run again.
- tools/tests/test_site.py not run this session, at the owner's request.

### Session 10, batch 4 (five further questions)
Questions: investigation of anaemia, causes of iron deficiency anaemia (general, by age group, adult males, postmenopausal women).
- All from the textbook (Chapter 14 iron deficiency anaemia, anaemia introduction and blood loss text); no outside source.
- Investigation of anaemia: the textbook has no single investigation protocol; the answer collects the tests it names in different places.
- Causes by age group: the textbook gives no table by age; the answer arranges its statements by group.
- Progress file lists 655 questions done; 480 remain.
- tools/tests/test_site.py: 34 tests, all passed after the final bump.

### Session 10, batch 5 (ten further questions)
Questions: causes of IDA in infants and children, laboratory findings and biochemical tests in IDA, susceptibility to IDA, prognosis of aplastic anaemia versus IDA, differential diagnosis of microcytic hypochromic anaemia (two), macrocytic anaemia (define, classify, nonmegaloblastic causes).
- All from the textbook (Chapter 14); no outside source.
- Macrocytic anaemia: the textbook has no separate definition; the answer uses the mean cell volume reference range from Table 14.2.
- Prognosis of aplastic anaemia versus IDA: the textbook gives no direct comparison; the table sets side by side only what it states for each.
- Differentiating microcytic hypochromic anaemias: the textbook gives no iron indices for thalassaemia trait, shown as "not stated".
- Normoblastic (nonmegaloblastic) macrocytic causes: only liver disease, aplastic anaemia and reticulocytosis are named; alcohol, hypothyroidism and drugs are left out.
- Progress file lists 665 questions done; 470 remain.
- sw.js VERSION bumped to v149 after batch 5; build and manifests regenerated; tests not run, at the owner's request.

### Session 11 (70 answers: Chapter 14 megaloblastic anaemia through blood groups)
Questions: megaloblastic anaemia (short note, differentiation, diagnosis, folate and vitamin B12 causes), pernicious anaemia; haemolytic anaemia (definition, classification, evidence of haemolysis, jaundice), AIHA, haemoglobinopathies, thalassaemia, sickle cell anaemia; pancytopenia, aplastic anaemia; haemorrhagic and coagulation disorders, bleeding tests, von Willebrand factor, haemophilia, DIC, ITP, thrombocytopenia, blood groups.
- Almost all from the textbook (Chapter 14; Chapter 13 for acute leukaemia and hypersplenism; Chapter 10 for Rh disease). Tables 14.4, 14.5, 14.7 and 14.8 are mostly empty in the source JSON, so the narrative text was used.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What is bleeding time? | StatPearls, Bleeding Time (definition, Ivy and Duke methods) | https://www.ncbi.nlm.nih.gov/books/NBK537233/ | Auto-extracted figures, not yet checked line by line against the URLs: Ivy method : the most common; a cuff on the arm is inflated to 40 mm of mercury, a standardised device ma… |
| Normal limits of bleeding time and clotting time. (bleeding time part) | StatPearls, Bleeding Time | https://www.ncbi.nlm.nih.gov/books/NBK537233/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| What is clotting time? / Normal limits of bleeding time and clotting time. (clotting time part) | FPnotebook, Whole Blood Clotting Time (definition, 9 to 15 minutes) | https://mobile.fpnotebook.com/HemeOnc/Lab/WhlBldCltngTm.htm | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| Why are both bleeding time and clotting time prolonged in von Willebrand disease? | Definitions of bleeding time and clotting time from the two sources above; the rest from the textbook | as above | Auto-extracted figures, not yet checked line by line against the URLs: Clotting time (intrinsic pathway): vWF stabilises factor VIII in the circulation, so a deficiency of vWF… |
| Classify blood groups. / Name the ABO and Rh blood groups with their agglutinins. | Dean L. Blood Groups and Red Cell Antigens, NCBI Bookshelf (ABO and Rh chapters) | https://www.ncbi.nlm.nih.gov/books/NBK2267/ ; https://www.ncbi.nlm.nih.gov/books/NBK2269/ | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |

### Session 11 points left out or needing a decision
- Clotting time: FPnotebook is not a standard textbook, StatPearls or WHO source; no StatPearls page on whole blood clotting time was found. Owner to decide whether to keep it. Normal ranges for bleeding and clotting time differ between sources and methods.
- Macrocytic anaemias other than megaloblastic: the textbook describes only aplastic anaemia as slightly macrocytic; liver disease, alcohol, hypothyroidism and drugs are left out of the differentiation table.
- Normal findings in ITP, haemophilia and DIC: the textbook gives no bleeding time or clotting time for them, no platelet count for haemophilia, and no normal test for DIC; shown as "None stated" or left out. The direction of change of the DIC tests (low platelets and fibrinogen, prolonged PT and PTT, raised D-dimer) is not stated by the textbook and is left out.
- Leg ulcer in sickle cell anaemia: the textbook gives only the statement about vascular stagnation; the general mechanism of microvascular occlusion is added from its pathogenesis section.
- Laboratory diagnosis of sickle cell anaemia: the textbook names no solubility test or electrophoresis, only "various tests for sickle haemoglobin"; those tests are left out.
- Confirmatory test for thalassaemia: the textbook names no single confirmatory test; the answer says so and lists electrophoresis and DNA analysis.
- Haemolytic anaemias due to extracorpuscular defect: the textbook does not use the term; the answer groups the non-inherited causes in its Table 14.1 and says so.
- Pancytopenia investigation: no protocol in the textbook; the answer collects the steps it names.
- Normal types of haemoglobin: only HbA, HbA2 and HbF are given by the textbook; embryonic haemoglobins are left out.

### Session 11 housekeeping
- Eight stale hunks dropped from tools/hand_edits.json (27 down to 19), all anchored in old answers that were rewritten: haemoglobinopathies list (batch 3); four in batch 4 (thrombocytopenia classification, haemophilia and coagulation classification, and two insertions or list closings); the platelet count line (batch 5); and two in batch 6 (marrow failure causes and immunologic causes of thrombocytopenia).
- All 70 questions already had an answer, so none were previously empty.
- Progress file lists 735 questions done (665 before this session, plus 70). 400 remain in the work list.
- tools/tests/test_site.py not run this session, at the owner's request.

### Session 11 end checks
- build.py run twice: index.html byte-identical (same md5sum).
- VERSION in sw.js bumped from v149 to v150; build.py, gen_manifests.py and build.py run again.
- tools/tests/test_site.py not run, at the owner's request.

## Session 12, batch 1 (15 answers: Chapter 14 cross matching through anticoagulants)

### Outside sources used (the site textbook, Robbins Chapter 14, does not cover these)
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What do you mean by cross matching? / How is cross matching performed? / Why is cross matching essential for blood transfusion? | ASCP BB study guide, Crossmatch; The Blood Project, Crossmatch; textbook p610 (acute haemolytic reaction wording) | https://open-exam-prep.com/study-guides/ascp-bb/routine-serology/crossmatch ; https://www.thebloodproject.com/wp-content/uploads/2022/07/CROSSMATCH_2.pdf | Auto-extracted figures, not yet checked line by line against the URLs: Major crossmatch (standard test): donor red cells are mixed with recipient serum or plasma.; Immediate spin phase: donor red cells in saline are added to the patient serum, mixed and centrifuged for…; °C incubation phase: donor red cells in a potentiating agent are added to the patient serum and incubated…; Antiglobulin phase: the cells are washed, antihuman globulin (Coombs reagent) is added, the mixture is ce…; (+3 more) |
| Mention 4 important hematological changes of stored blood. | J Lab Physicians, changes in packed red cell units during storage (pH, potassium, haemolysis, CPDA-1); Frontiers in Physiology, red cell storage lesion (ATP, potassium); Deranged Physiology, stored blood; Blood Collection and Storage notes (2,3-BPG, factors V and VIII, 75% survival) | https://jlabphy.org/changes-in-hematological-and-biochemical-parameters-and-rate-of-hemolysis-during-the-storage-of-packed-rbc-units-a-prospective-study/ ; https://www.frontiersin.org/articles/10.3389/fphys.2014.00214/full ; https://derangedphysiology.com/main/node/2337 ; https://ltac.medtraining.org/ltac/docs/custom/3231/77800_Blood%20Collection%20and%20Storage.pdf | VERIFIED against the J Lab Physicians paper (first URL): pH 7.2 on day 0 to 6.54 on day 35, supernatant potassium 4.33 to 33.05 mmol/L (about eight-fold), haemolysis 0.09% to 0.68% (all CPDA units, day 0 to 35), sodium falls; shelf life 21 days (ACD, CPD, CP2D), 35 days (CPDA), 42 days (additive solutions). NOT re-verified this session (attributed to Frontiers, Deranged Physiology and the LTAC notes): 2,3-DPG falling to zero in about 2 weeks and regenerating within 24 hours of transfusion; ATP rising over days 1 to 7 then falling; loss of platelet function and of factors V and VIII; at least 75% red cell survival at 24 hours. |
| What are the indications of blood transfusion? | Wikianesthesia, packed red blood cells; LITFL, blood products; Royal Children's Hospital Melbourne, blood product prescription (FFP and cryoprecipitate) | https://wikianesthesia.org/wiki/Packed_red_blood_cells ; https://litfl.com/?p=192309 ; https://www.rch.org.au/clinicalguide/guideline_Index/Blood_product_prescription/ | Auto-extracted figures, not yet checked line by line against the URLs: Red cells: Haemoglobin below 7.0 g/dL (target 8.0 g/dL in cardiac disease); haemoglobin below 100 g/L wit…; Platelets: Count below 10,000 per microlitre; below 20,000 with fever, neutropenia or risk of intracrania…; Fresh frozen plasma: INR above 1.5 with an invasive procedure or with active bleeding; DIC with bleeding…; Cryoprecipitate: Active bleeding with fibrinogen below 1.5 g/L; DIC with significant bleeding and fibrino… |
| Blood components used in transfusion. | Fondation Merieux job aid, blood components; SBMU, maintaining viability and function of blood components; LITFL | https://moodle.fondation-merieux.org/pluginfile.php/5018/mod_resource/content/1/Jobaid_Blood%20Components_Transfusion%20Medicine.pdf ; https://treatment.sbmu.ac.ir/uploads/oldfile/6-Maintain_viability_and_function.pdf ; https://litfl.com/?p=192309 | Auto-extracted figures, not yet checked line by line against the URLs: Packed red cells: Symptomatic anaemia and surgical blood loss: 1 to 6°C; 35 days (CPDA-1), 42 days (addit…; Platelet concentrate: Prevent or treat bleeding in thrombocytopenia: 20 to 24°C with constant agitation…; Fresh frozen plasma: Replaces labile and stable clotting factors: At or below minus 18°C for 12 months; a…; Cryoprecipitate: Source of factor VIII, fibrinogen and von Willebrand factor ; haemophilia, von Willebran…; (+1 more) |
| Screening tests for safe blood transfusion. / Mention the diseases transmitted by blood transfusion. | WHO 2009, Screening donated blood for transfusion-transmissible infections (Section 4); textbook p611 for the three viral rates | https://www.ncbi.nlm.nih.gov/books/NBK142989/ | Auto-extracted figures, not yet checked line by line against the URLs: Viruses: HIV, hepatitis C and hepatitis B; estimated rates are 1 in 1.5 million, 1 in 1.2 million and 1 i…; Bacteria: mostly skin flora contaminating the unit at collection; symptomatic contamination is much more…; Protozoa: malaria, Chagas disease (trypanosomes) and babesia.; Emerging agents: variant CJD, dengue, chikungunya. |
| Contraindications of blood transfusion. | Wikianesthesia (refusal); Hematology and Oncology 2020 (refusal, haemoglobin 7 to 8); Horizon Health Network transfusion information (iron therapy, plasma and INR); MSD Manual, complications of transfusion (IgA deficiency, circulatory overload, post-transfusion purpura) | https://wikianesthesia.org/wiki/Packed_red_blood_cells ; https://www.hematologyandoncology.net/archives/december-2020/transfusion-replacement-strategies-in-jehovahs-witnesses-and-others-who-decline-blood-products/ ; https://horizonnb.ca/wp-content/uploads/2025/02/Transfusion-Medicine-Information.pdf ; https://www.msdmanuals.com/uk/professional/hematology-and-oncology/transfusion-medicine/complications-of-transfusion | Auto-extracted figures, not yet checked line by line against the URLs: Transfusion should be avoided in a stable patient with haemoglobin 7 to 8 g/dL, who is not expected to be…; Plasma is not given for a mildly raised INR (below 1.8) or routine non-emergent warfarin reversal; vitami… |
| Hazards of blood transfusion. / Complications of mismatched blood transfusion. | Textbook p610-611 (main source); StatPearls, Hemolytic Transfusion Reaction (timing of delayed reaction, acute kidney injury and DIC); StatPearls, Noninfectious Complications of Blood Transfusion (circulatory overload, graft-versus-host disease, post-transfusion purpura, iron overload) | https://www.ncbi.nlm.nih.gov/books/NBK448158/ ; https://pubmed.ncbi.nlm.nih.gov/34662050/ | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| What is an anticoagulant? / Enumerate anticoagulants used in the laboratory. / Merits and demerits of anticoagulants. | University of Mosul lecture notes on anticoagulants; King Saud University, blood collection and anticoagulants; Bioscience, guide to anticoagulants; Efficacy and Clinical Utility of Sodium Fluoride Tubes Versus Serum Tubes for Blood Glucose Estimation (PMC); Center for Phlebotomy Education, Order of Draw Part Six (potassium oxalate and sodium fluoride tubes); CLSI-based order-of-draw guide (gray tube mechanism) | https://www.uomus.edu.iq/uploads/lectures/27/89605129ffb4471b996edbbad8e571a1.pdf ; https://fac.ksu.edu.sa/sites/default/files/1-%20Blood%20collection%20and%20anticoagulants.pdf ; https://www.bioscience.co.uk/blog/guide-to-anticoagulants ; https://pmc.ncbi.nlm.nih.gov/articles/PMC11604175 ; https://centerforphlebotomyeducation.substack.com/p/the-order-of-draw-series-part-six ; https://open-exam-prep.com/study-guides/amca-ptc/collection/order-of-draw | Claims taken from the three lecture-note and supplier sources (tube colours, EDTA, citrate, heparin merits and demerits, double oxalate 2:3 at 2 mg/mL). TRACEABILITY GAP closed in session 16: the oxalate mechanism (oxalate precipitates calcium as insoluble calcium oxalate; potassium oxalate shrinks and ammonium oxalate swells red cells) and the fluoride mechanism (sodium fluoride inhibits enolase, so glycolysis stops and glucose is preserved; used with oxalate in gray-cap tubes) were NOT stated in the original three sources (see the note under this table). Added sources below; their support is the PMC article (fluoride and enolase) and the phlebotomy guides (oxalate and calcium). |

Note (session 16, oxalate and fluoride mechanisms). The original sources for the anticoagulant answers did not state why oxalate and fluoride work, yet the answer says oxalate precipitates calcium and fluoride is used for glucose estimation. Checked later: potassium oxalate removes calcium by forming insoluble calcium oxalate (Center for Phlebotomy Education; CLSI-based order-of-draw guide), and sodium fluoride inhibits enolase, stopping glycolysis (PMC11604175, the CLSI-based guide). Caveat from the PMC article: fluoride's effect begins only about four hours after collection, so glucose can still fall in the first hours; the answer does not state this timing. Tube colour: gray cap for fluoride-oxalate (stated in the same sources).

Short note on Rh-incompatibility came wholly from the site textbook (Chapter 10, Immune Hydrops, p419-422); no outside source.

### Points left out or needing a decision
- Owner to decide: several of the sources above are university lecture notes, a slide-sharing page (SBMU/Fondation Merieux/LTAC handouts were used in preference) or a supplier blog, not StatPearls, WHO or a standard textbook: Mosul and KSU lecture notes and Bioscience (anticoagulants), Wikianesthesia and Horizon Health Network (contraindications). StatPearls pages on anticoagulants, storage lesion and crossmatch were captcha-blocked, so no StatPearls page was available.
- Blood components: albumin and factor concentrates left out (no page read gave storage or use).
- Contraindications: none of the sources gives a formal list of absolute and relative contraindications; only refusal is stated as absolute, the rest are "avoid or modify" situations.
- Stored blood: sources differ on 2,3-DPG recovery and give no numeric ATP values; no numeric platelet or factor V and VIII losses found, so none is given. The old answer's figures (pH 7.1 to 6.5, potassium 20 to 30 mmol/L at 3 weeks, factors V and VIII at 50%) were dropped.
- Cross matching: the 37 degree incubation time was not found and is left out.
- Anticoagulants: tube colour for oxalate/fluoride and ACD/CPD not found; oxalate and fluoride mechanism not stated in the sources.
- Hand-edit hunk 13 of tools/hand_edits.json (cross-matching phases) dropped because its anchor text was rewritten (19 down to 18).

## Session 15, batches 1 and 2 (34 answers: Chapter 17 congenital anomalies through pleocytosis)

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| A patient with long-standing PUD has repeated/prolonged vomiting. What will be his electrolyte and acid-base status? / Same (40y): what test confirms it in the laboratory? | EB Medicine FOAMed, Persistent Vomiting case (quotes StatPearls, Gastric Outlet Obstruction); K. Ravindranath, Laparoscopy in Gastric Outlet Obstruction due to PUD (dehydration, chloride response, endoscopy and barium); MRCEM Success review (electrolyte panel findings) | https://foamed.ebmedicine.net/general-emergency-medicine/clinical-cases/persistent-vomiting/ ; https://www.laparoscopyhospital.com/bookiages/chapter%2018.doc ; https://intermediate.mrcemsuccess.com/review/30506540/246488 | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| Write a short note on occult blood test. | StatPearls, Fecal Occult Blood Test (definition, haem or haemoglobin detection, FIT, indications, 1.5 mL per day); FPnotebook (guaiac pseudoperoxidase turns blue, vitamin C); Microbe Online (causes, red meat) | https://ncbi.nlm.nih.gov/books/NBK537138/ ; https://fpnotebook.com/GI/Lab/FclOcltBld.htm ; https://microbeonline.com/fecal-occult-blood-test-principle-procedure-results/ | Auto-extracted figures, not yet checked line by line against the URLs: Normal faecal blood loss can approach 1.5 mL per day |
| What is pleocytosis? | Standard medical dictionaries as quoted on Wikipedia (increased cell count, particularly white cells, in a body fluid such as CSF); Altmeyers Encyclopedia and F1000 poster (more than 5 cells per microlitre in CSF); site textbook Chapters 27 and 28 for the lymphocytic and neutrophilic examples | https://en.wikipedia.org/wiki/Pleocytosis ; https://www.altmeyers.org/en/internal-medicine/pleocytosis-159120 | Auto-extracted figures, not yet checked line by line against the URLs: In CSF it means more than 5 white cells per microlitre |

### Points left out or needing a decision
- Owner to decide: the sources for vomiting alkalosis, occult blood and pleocytosis are not Robbins or StatPearls pages read in full (StatPearls was seen only as search snippet or quoted by another site); the pleocytosis definition rests on dictionary text quoted by Wikipedia.
- Table 17.4 (complications of PUD) lost its row labels in the textbook JSON; haemorrhage, perforation and obstruction were assigned from the clinical-features paragraph and the row text (two-thirds of ulcer deaths and rarely first indication given to perforation; pyloric channel and crampy pain given to obstruction). The haemorrhage row text is missing, so no frequency is given. Please check against the printed book.
- Define polyp: the textbook gives no formal definition; only its opening description (small elevations of the mucosa, sessile, pedunculated) is used.
- Different ulcers of GIT: only ulcers named in Chapter 17 (peptic, stress, Curling, Cushing, viral oesophageal, Crohn, ulcerative colitis) are listed; typhoid and tuberculous ulcers were not verified in the chapter and are left out.
- Hirschsprung enterocolitis frequency: the textbook figure lost its symbol (could be "about" or "less than" 25%), so it is left out.
- Table 17.8 (Crohn versus ulcerative colitis) is missing from the textbook JSON; the differences table was built from the Crohn and ulcerative colitis text. Long-segment Barrett length (3 cm) also lost its sign and is written as "3 cm or more".
- Short note on villous adenoma: the textbook treats villous adenoma only within colorectal adenomas, so no separate villous-specific data (for example the hypersecretory syndrome) are given.
- Occult blood: sensitivity and specificity figures not given (sources vary).

## Session 15, batch 3 (15 answers: Chapter 18 cirrhosis through liver function tests in viral hepatitis)

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Name common pathological conditions of hepatomegaly. | MedlinePlus, Enlarged liver (list of causes); cross-checked against site textbook Chapter 18 | https://medlineplus.gov/ency/article/003275.htm | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |

Ascites causes combine Chapter 18 (portal hypertension table text, 85% cirrhosis) with the site textbook Chapters 4 and 12 (hypoalbuminaemia, heart failure).

### Points left out or needing a decision
- Table 18.2 (portal hypertension) lost its row labels in the textbook JSON; the causes are taken from the paragraph above it, not the table.
- Fig. 18.10 (outcomes of HBV infection with frequencies) is an image; frequencies are taken from the text only (two-thirds subclinical, 5% to 10% chronic, about 90% perinatal, 0.1% to 0.5% acute liver failure). No percentage for cirrhosis or hepatocellular carcinoma after chronic infection is given.
- Etiology of cirrhosis: the textbook gives no single list; autoimmune, biliary and specific metabolic causes (Wilson disease, haemochromatosis) are left out because the chapter says these are often not accompanied by established cirrhosis or does not tie them to cirrhosis in the passage used.
- Male case with gynaecomastia: the textbook does not link this to a specific cause (for example alcohol), so none is stated.
- Liver function tests: the textbook (Table 18.1) gives direction of change only, no normal values.
- Hand-edit hunk 3 of tools/hand_edits.json (numbering fix before the Hepatic encephalopathy item in the old cirrhosis complications answer) dropped because its anchor text was rewritten (11 down to 10). Hunk 3 of the remaining 10 (numbering fix before the Hepatocellular carcinoma item in the same answer) also dropped (10 down to 9).

## Session 16, Chapters 18 and 20 (work list items 1 to 75)

### Batch 1 (Chapter 18: hepatocellular carcinoma to physiological jaundice)

Sources: the site textbook (tools/textbook_src/ch18.json) for all answers. No answer in this batch was previously empty.

Outside sources used:

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What are the liver function tests (names, normal values; short note)? | StatPearls, Liver Function Tests (reference ranges, test notes) | https://www.ncbi.nlm.nih.gov/books/NBK482489/ | Auto-extracted figures, not yet checked line by line against the URLs: Hepatocellular injury: ALT (alanine aminotransferase): 4 to 36 IU/L: More liver-specific than AST. In alc…; AST (aspartate aminotransferase): 5 to 30 IU/L: Less specific; also found in muscle, heart, kidney, brain…; Cholestasis: Alkaline phosphatase: 30 to 120 IU/L: Not liver-specific; also from bone, placenta and intes…; GGT (gamma-glutamyl transpeptidase): 6 to 50 IU/L: Raised together with alkaline phosphatase in cholestat…; (+6 more) |
| Name synthetic liver function tests. | StatPearls, Liver Function Tests (albumin and prothrombin time as synthetic tests) | https://www.ncbi.nlm.nih.gov/books/NBK482489/ | Auto-extracted figures, not yet checked line by line against the URLs: Prothrombin time, which reflects synthesis of the clotting factors (II, V, VII, IX, X, XI, XII and fibrin…; Serum albumin |
| Name two causes of raised prothrombin time. | Textbook for liver failure and cholestasis with vitamin K malabsorption; StatPearls (above) for vitamin K deficiency as a cause of prolonged prothrombin time | https://www.ncbi.nlm.nih.gov/books/NBK482489/ | Auto-extracted figures, not yet checked line by line against the URLs: Liver failure (hepatocellular disease): hepatocytes synthesise clotting factors II, V, VII, IX, X, XI and…; Vitamin K deficiency, as in cholestasis, where malabsorption causes deficiency of the fat-soluble vitamin… |
| Why is prothrombin time more specific than total protein estimation? | StatPearls (above) for albumin being slow to change and nonspecific; textbook for hyperglobulinaemia in chronic hepatitis | https://www.ncbi.nlm.nih.gov/books/NBK482489/ | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| Give the differences between hemolytic and obstructive jaundice. | MSD Manual Professional, Jaundice (laboratory pattern table: urine bilirubin, aminotransferases, alkaline phosphatase, GGT, bilirubin level) | https://www.msdmanuals.com/professional/hepatic-and-biliary-disorders/approach-to-the-patient-with-liver-disease/jaundice | Auto-extracted figures, not yet checked line by line against the URLs: Bilirubin raised: Unconjugated, usually below 3.5 mg/dL: Conjugated; Aminotransferases: Normal: Below 200 U/L; Other findings: Anaemia, ecchymoses; peripheral blood smear confirms: Raised alkaline phosphatase and GGT… |

Points left out:

- Liver function tests: the textbook table of liver function tests (Table 18.1) has no cell text in the source file, so the reference ranges come from StatPearls only; the textbook adds the bilirubin range (0.3 to 1.2 mg/dL).
- Half-lives of albumin and of clotting factors (for the prothrombin time question): not in the textbook or in the StatPearls page, so left out.
- Hepatocellular carcinoma work-up: the textbook does not mention liver biopsy, so biopsy is left out.
- Hepatocellular carcinoma etiology: HBx protein and driver mutations are left out as mechanism rather than etiology.
- Haemolytic versus obstructive jaundice: urine urobilinogen and stool colour for haemolytic jaundice are not given in the textbook or in the MSD table, so these rows are left out.
- Provisional diagnosis case: hepatitis A and E are not mentioned as differentials because the textbook ties the case to parenteral spread.

### Batch 2 (Chapter 18 jaundice questions; Chapter 20 glomerular disease and nephrotic syndrome)

Sources: the site textbook, Chapter 18 (tools/textbook_src/ch18.json), Chapter 14 (haemolytic anaemia, for the haemolytic jaundice work-up), Chapter 10 (kernicterus, hydrops fetalis) and Chapter 20 (tools/textbook_src/ch20.json). No answer in this batch was previously empty.

Outside sources used:

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What enzymes are elevated in hepatocellular and obstructive jaundice (AST, ALT, ALP interpretation)? | MSD Manual Professional, Jaundice (numerical cut-offs for aminotransferases and alkaline phosphatase) | https://www.msdmanuals.com/professional/hepatic-and-biliary-disorders/approach-to-the-patient-with-liver-disease/jaundice | Auto-extracted figures, not yet checked line by line against the URLs: Hepatocellular jaundice: AST and ALT (aminotransferases): Above 500 U/L; alkaline phosphatase is below 3…; Obstructive (cholestatic) jaundice: Alkaline phosphatase and GGT (gamma-glutamyl transpeptidase): Both mo… |
| Give the urinary findings of obstructive jaundice. | MSD Manual Professional, Jaundice (urine bilirubin present, dark urine) | same as above | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| How will you differentiate hemolytic, hepatocellular and obstructive jaundice biochemically? | MSD Manual Professional, Jaundice (table of laboratory patterns); AAFP, Evaluation of Jaundice in Adults (peripheral smear for haemolysis; pale stools and dark urine in cholestasis) | https://www.aafp.org/pubs/afp/issues/2017/0201/p164.html | Auto-extracted figures, not yet checked line by line against the URLs: Aminotransferases: Normal: Above 500 U/L: Below 200 U/L; Alkaline phosphatase is below 3 times normal in hepatocellular jaundice; Alkaline phosphatase and GGT are both more than 3 times normal in obstructive jaundice |
| Write a short note on obstructive jaundice. | AAFP (dark urine and pale stools) for the clinical features | https://www.aafp.org/pubs/afp/issues/2017/0201/p164.html | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| A patient has jaundice, pruritus, bulky pale stool ... What type of jaundice is this? | AAFP (pale stools and dark urine in cholestatic jaundice) | https://www.aafp.org/pubs/afp/issues/2017/0201/p164.html | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

Points left out:

- Acholuric jaundice: the term is not used in the textbook; the answer is built from the textbook statement that unconjugated bilirubin is insoluble and cannot be excreted in urine, and that the excess bilirubin in haemolytic anaemia is unconjugated.
- Urinary findings of obstructive jaundice: urine urobilinogen and bile salts are not given in the textbook, the MSD Manual or the AAFP article, so they are left out.
- Haemolytic versus obstructive jaundice and the biochemical differentiation: urine and stool urobilinogen are not in any of the sources; alkaline phosphatase for haemolytic jaundice is not given in the MSD table, so no value is stated.
- Investigation of haemolytic jaundice: the MSD and AAFP pages give only the peripheral smear for haemolysis; reticulocytosis, haptoglobin, lactate dehydrogenase and Coombs test come from the textbook (Chapter 14, haemolytic anaemias and haemolytic transfusion reactions). The textbook gives no numerical values for these.
- Case with palpable gallbladder: the textbook does not describe a palpable gallbladder sign, so only the jaundice type and the cholestatic features are stated.
- Names of the primary glomerular diseases: the list follows Table 20.5 (the table cells are partly garbled in the source file) plus C3 glomerulonephritis and fibrillary glomerulonephritis from the text.
- Classification of glomerular disease: Table 20.2 (histologic classification) has no usable cell text in the source file, so the answer follows the text (primary and secondary) and Table 20.5.

### Batch 3 (Chapter 20: nephrotic and nephritic syndromes, acute renal failure, kidney tumours)

Sources: the site textbook only (Chapter 20, tools/textbook_src/ch20.json; Wilms tumour from Chapter 10). **No outside sources were used.** No answer in this batch was previously empty.

Points left out:

- Investigation of nephrotic syndrome: the textbook has no dedicated investigation passage; the answer is assembled from the pathophysiology, the exclusion of secondary causes, and the morphology of minimal change disease, membranous nephropathy and focal segmental glomerulosclerosis.
- Xp11 translocation renal cell carcinoma: no frequency is given in the textbook.
- Causes of acute renal failure: no list of prerenal causes is given in the textbook, so none is stated.
- Hand-edit hunk 2 of tools/hand_edits.json (a typo edit on the old Wilms tumour answer) dropped because its anchor text was rewritten.
- Session stopped after item 45 of 75 at the user's request; the session end checks (idempotent build, VERSION bump, manifests, unit tests) were not run.

## Session 17, batches 1 and 2 (work-list questions 1 to 35 attempted; 25 written so far, Chapter 20)

Sources: site textbook chapter 20 (tools/textbook_src/ch20.json) for pyelonephritis, renal cell carcinoma, nephrotic syndrome, uraemia and oliguria. Outside sources were needed for the laboratory questions (no textbook coverage).

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What is recurrent UTI? (and the relapse and reinfection wording, prostatitis in men) | StatPearls, Recurrent Urinary Tract Infections | https://ncbi.nlm.nih.gov/books/NBK557479 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Write the importance of recurrent UTI. (prostatitis point only) | StatPearls, Recurrent Urinary Tract Infections | https://ncbi.nlm.nih.gov/books/NBK557479 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Give the normal serum concentration of uric acid. | Desideri et al., Eur Rev Med Pharmacol Sci, "Is it time to revise the normal range of serum uric acid levels?" | https://www.europeanreview.org/?p=7352 | Auto-extracted figures, not yet checked line by line against the URLs: Adult men and postmenopausal women: 3.5 to 7.2 mg/dL; Premenopausal women: 2.6 to 6.0 mg/dL |
| Give the normal serum albumin value. | WikEM, Albumin | https://es.wikem.org/wiki/Albumin | Auto-extracted: no numeric or table claims in the answer; qualitative content only, not yet checked against the URLs. |
| Give the normal serum urea value; Give the normal serum creatinine value. | JoVE Science Education, renal function tests | https://www.jove.com/v/18487 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Renal function tests; renal clearance; causes of uraemia (acute kidney injury causes, chronic kidney disease causes); tests and causes of proteinuria; routine urine tests; chemical examination of urine; microalbumin; serum creatinine versus urea; clinical importance of creatinine; oliguria (definition and causes) | StatPearls, Renal Function Tests (read via the mirror page) | https://dev3.statpearls.com/point-of-care/28359 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out
- Same: how will you confirm it? (renal cell carcinoma): the textbook gives no diagnostic work-up (no ultrasonography, urine tests or biopsy), so only imaging detection and histological typing, which the textbook states, are given.
- Serum urea: the textbook-grade source gives blood urea nitrogen only; no value for urea itself is given. Serum creatinine and urea ranges come from JoVE, which is an educational source rather than a standard pathology textbook; please confirm or supply a preferred reference.
- Renal function tests: no normal value for cystatin C is given in the sources.
- Chemical examination of urine: the specific chemical principle of each dipstick pad (for example enzyme reactions) is not given in the sources used, so it is not stated; only the dry-chemistry principle is.
- Causes of uraemia: no list of chronic kidney disease causes beyond hypertension and diabetes is given in the sources.
- Not yet written (no reliable source found yet, left for next session): heat coagulation test, reducing substances in urine, Benedict's test, hyperuricaemia causes and significance, renal glycosuria (two questions), haematuria (three questions).

## Session 17, batch 3 (work-list questions 36 to 46, Chapter 21: testicular tumours, cryptorchidism, BPH)

Sources: site textbook chapter 21 (tools/textbook_src/ch21.json) for all eleven answers except the BPH work-up.

### Outside sources used
| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Mention the important diagnostic workup for BPH. | American Family Physician, Benign Prostatic Hyperplasia (June 2023); CMAJ, "Does this patient have benign prostatic hyperplasia?" | https://www.aafp.org/pubs/afp/issues/2023/0600/benign-prostatic-hyperplasia.pdf ; https://cmaj.ca/content/cmaj/186/7/525.full.pdf | Auto-extracted figures, not yet checked line by line against the URLs: History with the International Prostate Symptom Score (IPSS); Physical examination: abdominal examination for bladder enlargement; digital rectal examination for prost…; Urinalysis for glucosuria, proteinuria, haematuria and infection; Serum prostate-specific antigen (PSA): not required routinely; used after shared decision-making; (+1 more) |

### Points left out
- Name the testicular tumour markers: lactate dehydrogenase and placental alkaline phosphatase are not in the textbook; only AFP and hCG are given.
- Investigate a testicular mass: no ultrasonography or scrotal imaging is described in the textbook, so none is stated.
- Classify testicular tumours: the textbook table is only partly legible in the source file; the list is assembled from the classification text and the key concepts (pure and mixed forms; tumours unrelated to germ cell neoplasia in situ).
- BPH work-up: the textbook gives no work-up. Digital rectal examination, IPSS, urinalysis and PSA are from the AFP and CMAJ articles; uroflowmetry was left out because it is not stated in the sources read.
- Seminoma versus nonseminomatous germ cell tumour: the Cells, Local spread and Cut surface rows compare seminoma with embryonal carcinoma and the other nonseminomatous types as the textbook describes each; no single textbook table exists for this comparison.
- Not yet written (outside sources still to be gathered): semen collection, indications, normal findings, oligospermia, azoospermia (definition and causes), semen analysis short note, laboratory investigation of male infertility, infertility hormones.

## Session 17, batch 4 (work-list questions 56 to 75, Chapters 22 and 23)

Sources: site textbook chapter 22 (tools/textbook_src/ch22.json: cervix, endometriosis, endometrium, ovary) and chapter 23 (breast). No outside sources were used in this batch.

Previously empty and now written: "20-year-old woman with a free, movable breast lump" (Chapter 23). This was the only empty answer in the whole 75-question batch.

### Points left out
- Risk factors for carcinoma of cervix: smoking, oral contraceptives, parity and low socioeconomic status are not given in the site textbook, so they are not stated.
- Ovarian tumour markers: textbook gives CA-125, alpha-fetoprotein (yolk sac), chorionic gonadotropin and inhibin only; lactate dehydrogenase is not given.
- Fibroadenoma, investigations: the textbook gives only imaging (well-circumscribed radiodense mass) and histology; ultrasonography, fine-needle aspiration and core biopsy are not described, so they are not stated. Please decide whether an outside source (for example StatPearls on fibroadenoma) should be added.
- Endometrial carcinoma, confirm: only biopsy or curettage and mismatch repair testing are given; no ultrasonography criteria (endometrial thickness) are in the textbook.
- Classify ovarian tumours: the sex cord–stromal list is given only as granulosa cell tumour; the full textbook table is partly illegible in the source file.
- Not written this session (outside sources still to be gathered): all semen and male infertility questions (work-list items 47 to 55), heat coagulation test, reducing substances in urine, Benedict's test, hyperuricaemia causes and significance, renal glycosuria (two questions) and haematuria (three questions): 20 questions in all.

## Session 18, batch 1 (work-list questions 1 to 19, Chapters 20 and 21, outside sources)

None of these topics is in the site textbook, so every answer in this batch uses outside sources.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Semen collection, normal findings, semen analysis short note, indications, infertility laboratory work-up, hormones in male infertility, causes of azoospermia | StatPearls "Semen Analysis" (WHO 2010 lower reference limits) | https://www.ncbi.nlm.nih.gov/books/NBK564369/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Oligospermia, azoospermia (definitions) | Urology Textbook, "Semen Analysis: Technique and Normal Values" | https://www.urology-textbook.com/semen-analysis | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Azoospermia causes (transient azoospermia; cystic fibrosis, Klinefelter syndrome, vasectomy) | PMC "The importance of semen analysis in the context of azoospermia" | https://pmc.ncbi.nlm.nih.gov/articles/PMC3583176 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| What is renal glycosuria? / Why is sugar present? | StatPearls "Physiology, Glycosuria"; PMC "Glucosuria Is Not Always Due to Diabetes" | https://ncbi.nlm.nih.gov/books/NBK557441 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7953860/ | Auto-extracted figures, not yet checked line by line against the URLs: Familial renal glucosuria is caused by mutation of the SLC5A2 gene, which codes for the sodium-glucose co… |
| Haematuria short note, causes, microscopic haematuria | StatPearls "Gross and Microscopic Hematuria" | https://www.ncbi.nlm.nih.gov/books/NBK534213/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Heat coagulation test | Lecture and laboratory notes (not a standard textbook): biologynotesonline.com heat and acetic acid test page; Al-Zahraa University chemical examination of urine lecture | https://biologynotesonline.com/heat-and-acetic-acid-test-for-proteinuria-principle-procedure-result-uses/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Reducing substances in urine | Practical urine examination notes (slideshare) | https://www.slideshare.net/slideshow/urine-examination-for-practical-exam-pptx/280083072 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Benedict's test | HiMedia Benedict's Qualitative Reagent data sheet; Mahatma Gandhi Kashi / CSJM University study material for the grading table | https://www.himedialabs.com/media/TD/R002.pdf ; https://gyansanchay.csjmu.ac.in/wp-content/uploads/2022/10/Benedicts-test.pdf | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Raised serum uric acid; causes of hyperuricaemia | StatPearls "Hyperuricemia"; WikEM "Hyperuricemia" for the drug and alcohol causes | https://www.ncbi.nlm.nih.gov/books/NBK459218/ ; https://wikem.org/wiki/Hyperuricemia | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out and decisions needed
- Hormones for infertility in the female: no female hormone source was read, so only the male hormones are given. Please decide whether to add a source (for example StatPearls "Female Infertility").
- Heat coagulation test, reducing substances and Benedict's test: no standard textbook, StatPearls or WHO page was found for the bench procedure; lecture and manufacturer notes were used. Please confirm they are acceptable or name a preferred source.
- Semen: the indications are only what StatPearls and the Urology Textbook state (male infertility assessment and planning assisted fertilisation); post-vasectomy checks were not found in the sources read, so they are not stated.
- Haematuria short note: no textbook explanation of mechanism was found beyond the StatPearls pathophysiology paragraph; it is not repeated.
- Hyperuricaemia causes: gout-related causes such as inborn enzyme defects, cell turnover states and cytotoxic therapy were not found in the snippets read, so they are not stated.

## Session 18, batch 2 (work-list questions 20 to 30, Chapters 22 and 23)

Sources: site textbook chapter 22 (cervix: ch22.json) and chapter 23 (breast: ch23.json). No outside sources were used. No answers in this batch were previously empty.

### Points left out
- Risk factors for breast carcinoma: Table 23.2 is not legible in the extracted file, so only the factors stated in the running text are given (sex, age, estrogen exposure, inheritance, family history, low physical activity, early pregnancy and breastfeeding as protective).
- Breast lump causes: the textbook gives no single list; the answer is assembled from the symptoms section, the inflammatory and nonneoplastic sections and the tumour sections.
- Hard breast lump, diagnosis: the textbook says malignant tumours "tend to be irregular"; the sentence is cut off in the file, so fixity to tissue is not stated. Skin dimpling is explained from the inflammatory carcinoma passage only.
- Hard breast lump, investigations: core biopsy, FNAC, axillary ultrasound, chest, bone and liver imaging, Ki-67 and BRCA testing are not described in the textbook passages read, so they are not stated. Please decide whether an outside source (for example StatPearls "Breast Cancer") should be added.
- Cervical carcinoma diagnosis: smoking, contact bleeding and discharge as clinical features are not in the passages read; only the textbook's gross appearance, age, histology and HPV link are stated.

## Session 18, batch 3 (work-list questions 31 to 63, Chapter 24: thyroid and diabetes)

Sources: site textbook chapter 24 (tools/textbook_src/ch24.json) for the thyroid and diabetes answers.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| What is HbA1c? / Importance of HbA1c | StatPearls "Hemoglobin A1C" (definition and 2 to 3 month averaging); site textbook ch24 for the 6.5% and 5.7% to 6.4% thresholds | https://www.ncbi.nlm.nih.gov/books/NBK549816/ | Auto-extracted figures, not yet checked line by line against the URLs: Diagnosis of diabetes: a level of 6.5% or more; Diagnosis of prediabetes: a level of 5.7% to 6.4%; Monitoring long-term glycaemic control in type 1 and type 2 diabetes; It is not affected by the daily fluctuations seen with single glucose readings; (+1 more) |

### Points left out and decisions needed
- Glucose values are given in mg/dL because the textbook uses mg/dL; the case question about FBS 6.6 and RBS 10.0 mmol/L gives the cut-offs also in mmol/L (7.0 and 11.1) by dividing the textbook figures by 18. This conversion factor is not in the textbook. Please confirm that you want mmol/L shown.
- OGTT procedure and indications: the textbook gives only the 75 g load, the 2-hour value and its interpretation. Fasting before the test, sampling times and indications are not stated, because no outside source was read for them. Please decide whether to add StatPearls "Glucose Tolerance Test".
- Draw different types of diabetic curves: a drawing cannot be given in the answer text, so a table of fasting and 2-hour values is given. The normal fasting range (70 to 120 mg/dL) is the textbook's general blood glucose range; no separate normal 2-hour value is in the textbook, so "below 140" is taken as the lower limit of impaired glucose tolerance.
- Hyperglycaemia sine glycosuria: the textbook does not discuss it. Only the renal threshold statement from the type 1 diabetes passage is used; a raised renal threshold, ageing or other reasons are not stated.
- Causes of hyperglycaemia: pregnancy and the pancreatic and drug causes are from the classification table and the gestational diabetes passage; Cushing syndrome, acromegaly, phaeochromocytoma and other endocrine causes in the same chapter were not added.
- Case "musty odour": the textbook describes a fruity odour in diabetic ketoacidosis; the answer states the textbook term.
- Fasting 6.6 mmol/L case: the textbook gives no diagnosis for values below the cut-offs other than prediabetes; the answer states this.
- Thyroid: the sources do not list hypothyroidism causes as a table (lost in extraction); the four causes are from the running text. The textbook does not give a one-line definition of goitre; the answer states enlargement of the thyroid gland from the goitre section.
- Follicular carcinoma prognosis and iodine association for papillary carcinoma are not given in the passages read; shown as "not stated" in the comparison table.

### Housekeeping (batch 3)
- tools/hand_edits.json: one hunk removed (the bold-tag fix inside the old diabetes complications answer; that text no longer exists). 7 remain.

## Session 19, batch 1 (work-list questions 1 to 14, Chapters 25 and 26)

Sources: site textbook ch25 (skin) and ch26 (bones). No outside sources. No answers in this batch were previously empty.

### Points left out
- Great toe lesion, differential: the textbook gives no differential list for this case; the answer uses only the lesions the textbook says mimic melanoma (acral lentiginous melanoma, pigmented basal cell carcinoma, blue naevus, seborrhoeic keratosis).
- Confirmation of melanoma: dermoscopy, excision margins and Breslow thickness cut-offs are not in the passages read; only the prognostic factors listed are given.
- Osteomyelitis types: the textbook gives no formal classification by duration; the answer lists its headings (pyogenic, mycobacterial, skeletal syphilis) and its stages.

## Session 19, batch 2 (work-list questions 15 to 30, Chapters 26 and 28)

Sources: site textbook ch26 (Ewing sarcoma, giant cell tumour, osteomyelitis, joints) and ch28 (CNS tumours, meningioma, meningitis). No answers in this batch were previously empty.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Indications of CSF examination | Shahan, Choi, Nieves. Cerebrospinal Fluid Analysis. American Family Physician 2021; and S1 guideline "Lumbar puncture and cerebrospinal fluid analysis" (Neurological Research and Practice 2020) | https://www.aafp.org/pubs/afp/issues/2021/0401/p422.html ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7650145 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| CSF findings of types of meningitis; pyogenic, tubercular and viral differences (appearance and pressure cells only; cells, protein and glucose are from the textbook) | Table 1, typical CSF characteristics in meningitis and encephalitis | https://pmc.ncbi.nlm.nih.gov/articles/PMC10201400/table/tbl1 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Why glucose is reduced in pyogenic meningitis | Pleocytosis is not fully responsible for low CSF glucose in meningitis (Neurol Neuroimmunol Neuroinflamm 2018); Effect of induced hyperglycemia on brain cell membrane function in neonatal meningitis (experimental) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5745359 ; https://pure.skku.edu/en/publications/effect-of-induced-hyperglycemia-on-brain-cell-membrane-function-a/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Confirmation of meningitis (culture of CSF) | AAFP 2021 (above) | https://www.aafp.org/pubs/afp/issues/2021/0401/p422.html | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out and decisions needed
- StatPearls pages could not be retrieved in the search, so the American Family Physician review, the German S1 guideline and the PMC articles above were used instead. Please decide whether these are acceptable or whether StatPearls "Cerebrospinal Fluid Analysis" should replace them.
- Why glucose is reduced: the textbook gives no explanation. The sources disagree on the mechanism (leucocyte and bacterial glycolysis, impaired glucose transport), so the answer states only the points the two sources agree on and says that the cause is debated. Impaired transport across the blood-brain barrier and bacterial consumption are left out as not established.
- Neonatal meningitis causes: the textbook names only E. coli and group B streptococci for neonates; Listeria in neonates is left out.
- Purpuric rash: the textbook does not describe it. The answer links it to meningococcal disease only through the textbook statement that Neisseria meningitidis causes meningitis in adolescents and young adults and through the Waterhouse-Friderichsen syndrome passage.
- Normal CSF values and numerical cell counts are not given in the textbook, so none are stated.
- Osteomyelitis case: blood culture, sedimentation rate and C-reactive protein are not mentioned for osteomyelitis in the textbook, so they are left out.
- Systemic diseases affecting joints: the textbook does not use this phrase; rheumatoid arthritis and gout are chosen from its descriptions of joint diseases with systemic or metabolic causes.

## Session 19, batch 3 (work-list questions 31 to 38 and 43, Chapter 30: acid-base, electrolytes, LDH; outside sources)

The site textbook does not cover Clinical Biochemistry, so all answers use outside sources. No answers were previously empty.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Normal serum Na, K, Cl, HCO3 | NBME Laboratory Reference Values (Na 136 to 146, K 3.5 to 5.0, Cl 95 to 105, HCO3 22 to 28) | https://nbme.org/sites/default/files/2024-12/Laboratory_Reference_Values.pdf | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Normal pH of blood | StatPearls "Metabolic Acidosis" | https://www.ncbi.nlm.nih.gov/sites/books/NBK482146/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Normal pH of urine | WikEM "Urine analysis" (4.5 to 8.0); LITFL "Urinalysis Overview" | https://wikem.org/wiki/Urinalysis ; https://litfl.com/urinalysis-overview/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Metabolic acidosis: definition and causes; diarrhoea case; shock and oliguria case | StatPearls "Metabolic Acidosis"; StatPearls "Anion Gap and Non-Anion Gap Metabolic Acidosis" | https://www.ncbi.nlm.nih.gov/sites/books/NBK482146/ ; https://www.ncbi.nlm.nih.gov/sites/books/NBK448090/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Metabolic alkalosis | StatPearls "Alkalosis" and "Physiology, Metabolic Alkalosis"; Merck Manual Professional "Metabolic Alkalosis" | https://www.ncbi.nlm.nih.gov/sites/books/NBK545269/ ; https://www.ncbi.nlm.nih.gov/sites/books/NBK482291/ ; https://www.merckmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-alkalosis | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Respiratory acidosis | StatPearls "Respiratory Acidosis"; Merck Manual Professional "Respiratory Acidosis" | https://www.ncbi.nlm.nih.gov/sites/books/NBK482430/ ; https://www.merckmanuals.com/professional/endocrine-and-metabolic-disorders/acid-base-regulation-and-disorders/respiratory-acidosis | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of LDH | StatPearls "Biochemistry, Lactate Dehydrogenase"; Shipman, J Lab Precis Med review of plasma LDH | https://www.ncbi.nlm.nih.gov/sites/books/NBK557536/ ; https://jlpm.amegroups.org/article/view/8567/html | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out and decisions needed
- Normal electrolyte ranges differ between sources (StatPearls "Electrolytes" gives sodium 135 to 145, potassium 3.6 to 5.5, bicarbonate 23 to 30 mmol/L; the metabolic acidosis page gives bicarbonate 21 to 28). The NBME table is used because it gives all four values from one source. Please confirm or give the range your department uses.
- Urine pH: no StatPearls page with the range was retrieved; WikEM and LITFL are used. The normal chloride range is not given in the StatPearls pages read.
- Diarrhoea case: hypokalaemia comes from a fpnotebook summary that was read in search results only; sodium, dehydration and the degree of change are not stated because no reliable source was read for them.
- Shock and oliguria case: hyperkalaemia, hyponatraemia and raised urea and creatinine are expected but are not in the sources read, so only the acid-base status is stated. Please decide whether to add a source (for example StatPearls "Acute Kidney Injury").
- Metabolic alkalosis: causes listed from the sources above; Bartter, Gitelman and Liddle syndromes are named only as the sources name them.
- Respiratory acidosis: compensation figures are from StatPearls (1 and 4 mEq/L per 10 mmHg).
- LDH: the normal reference range is not given because no source read states one.

### Housekeeping (batch 3)
- tools/hand_edits.json: one hunk removed (the chloride 98 to 107 mmol/L fix in the old electrolytes answer; that text no longer exists). 6 remain.

## Session 20, batch 1 (work-list questions 1 to 8, Chapter 30: calcium, enzymes, ALT, AST, PSA, amylase, acid phosphatase, CK-MB; outside sources)

The site textbook does not cover Clinical Biochemistry, so all answers use outside sources. None of these answers were previously empty.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Clinical importance of serum calcium | StatPearls "Hypocalcemia" (normal range, causes, features); StatPearls "Physiology, Calcium" (distribution, hypercalcaemia, diagnostic approach) | https://www.ncbi.nlm.nih.gov/books/NBK430912/ ; https://www.ncbi.nlm.nih.gov/books/NBK482128/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Indications of enzymes of clinical importance | Esani, Laboratory Medicine 2014 (detecting, localising, quantifying damage); "Clinical Enzymology" lecture document, NISCPR repository (remaining indications) | https://researchexperts.utmb.edu/en/publications/the-physiological-sources-of-clinical-significance-of-and-laborat/ ; https://nsdl.niscpr.res.in/bitstream/123456789/697/1/ClinicalEnzymology.pdf | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of ALT; of AST | StatPearls "Liver Function Tests" (AST and ALT) | https://www.ncbi.nlm.nih.gov/books/NBK482489/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of PSA | StatPearls "Prostate-Specific Antigen" (David and Leslie) | https://www.ncbi.nlm.nih.gov/books/NBK557495/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of serum amylase | StatPearls "Analytical and Clinical Perspectives on Amylase" | https://www.ncbi.nlm.nih.gov/books/NBK557738/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of acid phosphatase | StatPearls "Acid Phosphatase" | https://www.ncbi.nlm.nih.gov/books/NBK556039 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of CK-MB | StatPearls "Creatine Phosphokinase" (Aujla, Zubair, Patel); NISCPR "Clinical Enzymology" (CK-2 above about 6% of total) | https://www.ncbi.nlm.nih.gov/books/NBK546624/ ; https://nsdl.niscpr.res.in/bitstream/123456789/697/1/ClinicalEnzymology.pdf | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out and decisions needed
- Serum calcium: the two StatPearls pages give slightly different total ranges (8.5 to 10.5 mg/dL on the hypocalcaemia page; 8.8 to 10.4 mg/dL on the physiology page). The hypocalcaemia page range (2.12 to 2.62 mmol/L) is used. The hypercalcaemia section in the sources is short, so other causes (for example vitamin D excess, thiazides, immobilisation) are left out because no source read states them.
- Enzymes indications: the NISCPR lecture document is not a standard textbook. It supplies the indications beyond tissue damage (diagnosis, prognosis, liver course, pancreas and salivary glands, cholinesterase). Please decide whether it is acceptable or whether a textbook source should replace it.
- CK-MB: the CK-2 above about 6% of total CK figure is from the same NISCPR document. The StatPearls page gives the timing for total CK only (rise 12 hours, peak 24 to 36 hours, normal in 48 to 72 hours), so no CK-MB-specific timing is stated.
- PSA: the old description of PSA as kallikrein-3 and a serine protease is left out because the StatPearls page does not state it.
- Amylase: no single normal range exists in the source, so only the reported spread (about 20 to 300 U/L) is given.
- Acid phosphatase: Paget disease and multiple myeloma (from the NISCPR table) and the sipuleucel-T immunotherapy details are left out as not closely tied to the question.

## Session 20, batch 2 (work-list questions 9 to 16, Chapter 30: AFP, creatine kinase, lipids, lipoproteins, dyslipidaemia, body fluids; outside sources)

The site textbook does not cover Clinical Biochemistry, so all answers use outside sources. None of these answers were previously empty.

| Question | Source | URL | Claims extracted |
|---|---|---|---|
| Clinical importance of alpha-fetoprotein | StatPearls "Alpha-Fetoprotein Analysis" | https://www.ncbi.nlm.nih.gov/books/NBK430750/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Clinical importance of creatine kinase | StatPearls "Creatine Phosphokinase" | https://www.ncbi.nlm.nih.gov/books/NBK546624/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Lipid profile, components and normal range | NCEP ATP III "At-a-Glance Summary" (classification and 9 to 12 hour fast); StatPearls "Cholesterol Levels" (components, Friedewald equation); StatPearls "Biochemistry, High Density Lipoprotein" (total cholesterol to HDL ratio, non-fasting use); Endotext "Approach to the Patient with Dyslipidemia" (non-HDL cholesterol, direct LDL) | https://hr.universityhealthsystem.com/secure/xwebdocs/Pharmacy/Pathways_and_Guidelines/Hyperlipidemia/06-National%20Cholesterol%20Education%20Program%20Adult%20Treatment%20Panel%20III%20%28At-A-Glance%20Summary%29.pdf ; https://dev2.statpearls.com/point-of-care/19466 ; https://www.ncbi.nlm.nih.gov/books/NBK549802/ ; https://www.endotext.org/wp-content/uploads/pdfs/approach-to-the-patient-with-dyslipidemia.pdf | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Fractions of lipid; short note on lipoprotein | StatPearls "Biochemistry, Lipoprotein Metabolism"; StatPearls "Biochemistry, High Density Lipoprotein" (apolipoprotein functions) | https://www.statpearls.com/point-of-care/732 ; https://www.ncbi.nlm.nih.gov/books/NBK549802/ | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| HDL good and LDL harmful | StatPearls "Biochemistry, High Density Lipoprotein"; StatPearls "Biochemistry, Lipoprotein Metabolism"; StatPearls "Cholesterol Levels" | as above | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Diagnosis of dyslipidaemia | Endotext "Approach to the Patient with Dyslipidemia"; StatPearls "Cholesterol Levels" (secondary causes); NCEP ATP III summary (cut-offs); StatPearls "Pediatric Dyslipidemia" (examination signs only) | https://www.endotext.org/wp-content/uploads/pdfs/approach-to-the-patient-with-dyslipidemia.pdf ; https://dev2.statpearls.com/point-of-care/19466 ; https://www.statpearls.com/point-of-care/136349 | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |
| Body fluids usually examined | ADLM "Pearls of Laboratory Medicine: Body Fluids" (2017) | https://myadlm.org/science-and-research/clinical-chemistry/clinical-chemistry-trainee-council/pearls-of-laboratory-medicine-in-english/2017/body-fluids | Topic-level entry: no single answers.md heading matches this label, so claims are not itemised here (review queue). |

### Points left out and decisions needed
- Body fluids: the only source read that lists the fluids is the ADLM page, which covers seven (cerebrospinal, pleural, pericardial, peritoneal, amniotic, synovial fluid and saliva). Blood, urine, stool, semen and sputum are not listed in any source read, so they are left out of this answer although the earlier answer included them. Please decide whether to add a source for them.
- Lipid profile: the earlier VLDL range (2 to 30 mg/dL) and the VLDL cholesterol equals triglycerides divided by 5 rule are left out because no source read states them. The ATP III summary and StatPearls differ on fasting (9 to 12 hours versus 12 hours); the ATP III figure is used. Sex-specific HDL cut-offs (below 50 mg/dL in women, from the University of Washington laboratory guideline) are not used; the ATP III cut-off of below 40 mg/dL is given. The ATP III summary gives total cholesterol as "over 240"; it is written as 240 and above, the standard ATP III cut-off. Total cholesterol has no range on the StatPearls page.
- Fractions of lipid: phospholipids and free fatty acids, listed in the earlier answer, are left out because no source read states them. Lipoprotein(a) is not described on the StatPearls lipoprotein page.
- Dyslipidaemia diagnosis: the Endotext chapter does not describe examination signs, so xanthomas, xanthelasma and corneal arcus come from the StatPearls paediatric dyslipidaemia page. The earlier mention of tendon and eruptive xanthomas as linked to specific disorders, and of the creamy layer in standing serum, are left out (no source read). Repeating an abnormal test after 2 weeks to 3 months is from the paediatric page only, so it is left out.
- Many NCBI Bookshelf pages returned a verification page, so some StatPearls pages (calcium, lipoprotein, lipid panel) were read through statpearls.com copies; their summaries should be spot-checked against NCBI if exact wording matters.
- HDL: the HDL page does not compare HDL and LDL directly; the LDL column comes from the lipoprotein metabolism page.

### Session 20 totals
- All 16 questions remaining in the work list were rewritten (the work list was 16 questions, not 75, because 1120 of 1135 distinct questions were already done).
