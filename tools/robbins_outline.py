# -*- coding: utf-8 -*-
"""Robbins-order outline: chapter -> heading (sub-chapter) -> topic, in the order the book teaches them.

How it is used (tools/build.py):
  * the order of the headings and topics here is the order the Questions tab and each chapter page show them;
  * written (W) and box-viva (V) questions keep the heading/topic they already have in their source files;
  * DU written questions are placed by the keyword rules below (T(name, regex, priority));
    a "Same ..." follow-up goes under the same topic as the question before it;
  * a question that matches no rule is listed by build.py as UNPLACED so a rule can be added.
To move a question or add a topic: edit this file, run  python3 tools/build.py,  bump VERSION in sw.js.
Question ids never change (they come from the order of the source files, not from this file)."""
import re

def T(name, rx=None, prio=0):
    return (name, re.compile(rx, re.I) if rx else None, prio)
def S(name, *topics):
    return (name, list(topics))

OUT = {}

OUT[2] = [
 S('Cellular Adaptations to Stress', T('Overview of adaptation'), T('Hypertrophy'), T('Hyperplasia'), T('Atrophy'), T('Metaplasia'), T('Dysplasia')),
 S('Cell Injury: Causes and Morphology', T('Cell injury: definition and causes'), T('Types of cell injury'), T('Morphology of cell injury')),
 S('Mechanisms of Cell Injury', T('Ischemic (hypoxic) injury'), T('Free radicals, ATP depletion and calcium'), T('Calcium and cell injury'), T('Free radicals'), T('Membrane damage'), T('Ischemia-reperfusion injury')),
 S('Necrosis', T('Definition and features'), T('Definition of necrosis'), T('Morphology of the necrosed cell'), T('Types of necrosis'), T('Coagulative necrosis'), T('Coagulative vs liquefactive necrosis'), T('Caseous necrosis'), T('Fat necrosis')),
 S('Apoptosis', T('Definition and overview'), T('Causes and significance'), T('Physiological and pathological apoptosis'), T('Apoptosis'), T('Pathogenesis'), T('Necrosis vs apoptosis')),
 S('Intracellular Accumulations', T('Intracellular accumulation'), T('Fatty change'), T('Fatty liver (case)'), T('Hyaline change')),
 S('Pathologic Calcification', T('Pathologic calcification'), T('Dystrophic calcification'), T('Dystrophic vs metastatic calcification')),
 S('Cellular Aging', T('Cellular aging')),
]

OUT[3] = [
 S('Overview of Inflammation', T('Introduction to inflammation', r'^define inflammation|acute and chronic inflammation|cardinal signs|protective response|components of acute')),
 S('Acute Inflammation: Vascular Events', T('Vascular changes and permeability', r'vascular events|vasoactive amines', 1)),
 S('Acute Inflammation: Cellular Events', T('Leukocyte recruitment and chemotaxis', r'chemotaxis|extravasation|cellular events'), T('Phagocytes and phagocytosis', r'phagocyt|opsonin|microbial killing')),
 S('Chemical Mediators of Inflammation', T('Chemical mediators', r'mediator|cytokines|complement', 2)),
 S('Morphology, Outcomes and Systemic Effects', T('Morphological patterns', r'morphological patterns'), T('Effects of acute inflammation'), T('Outcomes and resolution'), T('Systemic effects and investigations', r'systemic effects')),
 S('Chronic and Granulomatous Inflammation', T('Chronic inflammation'), T('Macrophages'), T('Granulomatous inflammation', r'granulom'), T('Giant cells')),
 S('Tissue Repair and Wound Healing', T('Regeneration and repair', r'regeneration|^what is healing', 1), T('Granulation tissue', r'granulation'), T('Wound healing', r'healing|angiogenesis|keloid|scar')),
 S('Clinical Scenarios', T('Inflammation cases', r'10y boy', 3)),
]

OUT[4] = [
 S('Edema and Effusions', T('Edema', r'edema|anasarca'), T('Exudates, transudates and body fluids')),
 S('Hyperemia and Congestion', T('Hyperemia and congestion', r'hyperemia|congestion')),
 S('Thrombosis', T('Normal haemostasis', r'haemostasis|antithrombotic properties', 2), T('Thrombosis', r'thromb|virchow|hypercoag|endothelial injury')),
 S('Embolism', T('Embolism', r'embol'), T('Pulmonary embolism', r'pulmonary embolism', 1), T('Pulmonary embolism (case)', r'femur fracture|haemoptysis after', 3)),
 S('Infarction', T('Infarction', r'infarct')),
 S('Shock', T('Shock', r'shock|bleeding in rta|collapses')),
 S('Fluid, Electrolyte and Acid–Base Disorders', T('Normal serum electrolytes'), T('Sodium'), T('Potassium'), T('Calcium'), T('Acid–base disorders')),
]

OUT[5] = [
 S('Genes, Mutations and Classification', T('Genes and mutations', r'mutation')),
 S('Single-Gene Disorders', T('Transmission patterns', r'dominant|recessive|x-linked')),
 S('Cytogenetic Disorders', T('Chromosomal disorders', r'cytogenetic disorders|down|barr body'), T('Cytogenetic cases', r'^(a girl|an adolescent)', 3)),
 S('Laboratory Diagnosis of Genetic Disorders', T('Laboratory diagnosis', r'karyotyp')),
]

OUT[6] = [
 S('Immunity and Hypersensitivity', T('Immunity', r'\bMHC\b'), T('Hypersensitivity', r'anaphyla|hypersens')),
 S('Autoimmunity and Immunodeficiency', T('Autoimmunity and immunodeficiency', r'autoimmun|immunodeficien|thyroid enlargement')),
 S('Amyloidosis', T('Amyloidosis', r'amyloid')),
]

OUT[7] = [
 S('Nomenclature', T('Definitions and nomenclature', r'neoplasia|teratoma|childhood tumours', 2)),
 S('Differentiation, Anaplasia and Dysplasia', T('Benign vs malignant tumours', r'benign|characteristics of a malignant'), T('Anaplasia and carcinoma in situ', r'dysplasia|anaplasia|in situ')),
 S('Invasion and Metastasis', T('Invasion and metastasis', r'metasta|spread|invasion')),
 S('Carcinogenesis and Tumour Biology', T('Carcinogenesis'),
   T('Oncogenes and tumour suppressor genes', r'\boncogene\b|suppressor|role of genes|cell become malignant'),
   T('Carcinogenic agents', r'carcinogenic agents|environmental factors'),
   T('Viral oncogenesis', r'viral|oncogenic virus'),
   T('Tumour angiogenesis and heterogeneity', r'angiogenesis|heterogeneity'),
   T('Precancerous lesions', r'precancerous')),
 S('Clinical Aspects of Neoplasia', T('Clinical aspects', r'grading|staging|common cancers')),
 S('Laboratory Diagnosis of Tumours', T('Laboratory diagnosis', r'diagnos|markers|cytology|FNAC|frozen|fixative|IHC|clinical data')),
 S('Clinical Scenarios', T('Tumour cases')),
]

OUT[9] = [
 S('Environmental Hazards and Toxicity', T('Environmental hazards and toxins', r'pollution')),
 S('Tobacco and Alcohol', T('Tobacco and alcohol')),
 S('Physical Injury: Burns and Radiation', T('Burns and radiation')),
 S('Nutritional Diseases', T('Nutritional disorders'), T('Protein-energy malnutrition', r'PEM|kwashiorkor|malnutrition'), T('Vitamin deficiencies', r'vitamin|beriberi'), T('Mineral deficiencies', r'zinc')),
 S('Diet and Systemic Disease', T('Diet and cancer')),
]

OUT[11] = [
 S('Hypertensive Vascular Disease', T('Hypertension: causes and complications')),
 S('Arteriosclerosis',
   T('Arteriosclerosis: definition and types', r'arteriosclerosis|define atherosclerosis', 1),
   T('Arteriosclerosis vs atherosclerosis; complications'),
   T('Atherosclerosis: pathogenesis', r'pathogenesis|risk factors'),
   T('Atheroma: composition and sites', r'atheroma|common sites|most frequently involved'),
   T('Atherosclerosis: complications', r'complications of athero'),
   T('Atherosclerosis: diet')),
 S('Vasculitis', T('Types of vasculitis')),
 S('Tumors of Blood Vessels', T('Classification of vascular tumors')),
]

OUT[12] = [
 S('Congenital Heart Disease', T('Classification'), T('Tetralogy of Fallot')),
 S('Ischemic Heart Disease',
   T('Overview', r'^define ischemic|types of ischemic'),
   T('Angina pectoris (case)', r'angina', 3),
   T('Myocardial infarction: pathogenesis', r'risk factors of ischemic|pathogenesis of myocardial|what is myocardial infarction'),
   T('Myocardial infarction: morphology', r'morphological changes in myocardial'),
   T('Myocardial infarction: complications', r'complications/consequences'),
   T('Myocardial infarction: diagnosis and markers', r'laboratory diagnosis of MI|cardiac markers|troponin'),
   T('Myocardial infarction (case)', r'central chest pain', 3)),
 S('Hypertensive Heart Disease', T('Hypertensive heart disease (case)', r'long-standing hypertension', 3)),
 S('Valvular Heart Disease', T('Rheumatic fever', r'rheumatic|aschoff|migratory'), T('Vegetations', r'vegetation', 1), T('Infective endocarditis', r'endocarditis')),
 S('Cardiomyopathies', T('Types of cardiomyopathy')),
 S('Pericardial Disease', T('Pericarditis')),
]

OUT[13] = [
 S('Reactive Leukocyte Disorders', T('Granulopoiesis'),
   T('Leukocytosis and leukopenia', r'neutroph|neutropenia|leukopenia|eosinophil|lymphocytosis'),
   T('Leukocyte disorders and leukaemoid reaction', r'leukaemoid|leukoerythroblastic', 1)),
 S('Lymph Node Disorders', T('Lymphadenopathy and lymphadenitis', r'lymphadenopathy')),
 S('Leukaemias',
   T('Leukaemia: definition and classification', r'^define leukaemia|etiology of leukaemia|classify \(acute\) leukaemia', 2),
   T('Acute leukaemias', r'acute leukaemia|\bAML\b|\bALL\b|myeloblast|blast crisis|severe pallor, sore throat', 3),
   T('Chronic myeloid leukaemia', r'chronic (leukaemia|granulocytic|myeloid)|philadelphia'),
   T('Chronic lymphocytic leukaemia')),
 S('Lymphoid Neoplasms', T('Hodgkin and non-Hodgkin lymphoma', r'hodgkin|reed-sternberg|painless cervical', 3)),
 S('Plasma Cell Disorders', T('Myeloma and paraproteinaemia', r'paraprotein|myeloma|bence|punched-out')),
 S('Myeloproliferative and Myelodysplastic Disorders', T('Myeloproliferative disorders', r'myeloproliferative|polycythaemia|sub-leukaemic', 2)),
 S('Spleen and Hypersplenism', T('Splenomegaly and hypersplenism')),
 S('Clinical Scenarios', T('Leukocyte and plasma cell cases')),
]

OUT[14] = [
 S('Haemopoiesis and Laboratory Assessment',
   T('Haemopoiesis', r'developmental stages|nutrients for haemopoiesis|reticulocyte|granulopoiesis'),
   T('Peripheral film, red cell indices and haemoglobin', r'\bESR\b|\bPBF\b|\bPCV\b|indices|\bMCV\b|iron profile tests|iron stores', 2),
   T('Bone marrow examination', r'marrow|trephine|dry tap|blood tap')),
 S('Anaemia: General', T('Classification and investigation', r'^what is anemia|classification of anemia|investigations for morphological|polycythemia', 3)),
 S('Iron Deficiency and Microcytic Anaemia', T('Iron deficiency anaemia', r'microcytic|iron deficiency|pregnant lady|bleeding peptic ulcer')),
 S('Megaloblastic and Macrocytic Anaemia', T('Megaloblastic anaemia', r'macrocy|megaloblast|schilling|pernicious|gastrectomy')),
 S('Haemolytic Anaemias', T('Haemolytic anaemia', r'haemoly|warm antibody|coombs', 3)),
 S('Haemoglobinopathies and Thalassaemia', T('Haemoglobinopathies', r'normal \(and abnormal\) haemoglobins|hemoglobinopathy'), T('Thalassaemia', r'thalassemia|mongoloid'), T('Sickle cell anaemia', r'sickle')),
 S('Aplastic Anaemia and Pancytopenia', T('Pancytopenia', r'pancytopenia|aplastic|marrow aplasia|Hb 2 g', 3)),
 S('Bleeding and Coagulation Disorders',
   T('Bleeding disorders', r'normal findings and expected changes|screening tests|hemorrhagic disorders|bleeding \(haemorrhagic\)|causes of gum bleeding', 3),
   T('Platelet disorders and ITP', r'thrombocytopen|\bITP\b|purpuric rash', 2),
   T('Coagulation disorders and haemophilia', r'coagulation|hemophilia|APTT|willebrand|hemarthrosis'),
   T('Disseminated intravascular coagulation', r'\bDIC\b', 2)),
 S('Blood Groups, Transfusion and Anticoagulants', T('Transfusion and anticoagulants', r'blood group|transfusion|blood products|cross match|stored blood|preservation of blood|anticoagulant|Rh-incompat')),
 S('Clinical Scenarios', T('Haematology cases')),
]

OUT[15] = [
 S('Obstructive Lung Diseases', T('COPD, emphysema, chronic bronchitis, asthma', r'COPD|emphysema|obstructive and restrictive')),
 S('Chronic Interstitial (Restrictive) Lung Diseases', T('Interstitial lung disease')),
 S('Pulmonary Infections',
   T('Pneumonia', r'pneumonia'),
   T('Lung abscess', r'abscess'),
   T('Tuberculosis', r'tubercul|\bTB\b|ghon|mantoux|cough, evening rise|27y with hemoptysis', 1)),
 S('Lung Tumors', T('Bronchogenic carcinoma', r'tumours of lung|bronchogenic|small cell|smoker has cough')),
]

OUT[17] = [
 S('Esophagus', T('Achalasia and reflux esophagitis'), T('Esophageal varices'), T('Barrett esophagus', r'barrett', 2), T('Esophageal carcinoma')),
 S('Stomach', T('Gastritis'), T('Peptic ulcer disease', r'ulcer|\bPUD\b|pylori|epigastric pain'), T('H. pylori-related diseases'), T('Gastric carcinoma'), T('Gastrointestinal stromal tumour (GIST)', r'GIST', 2)),
 S('Congenital Anomalies', T('Meckel diverticulum, Hirschsprung disease', r'congenital anomalies|hirschsprung')),
 S('Small and Large Intestines',
   T('Malabsorption', r'malabsorption'),
   T('Inflammatory bowel disease', r'inflammatory bowel|crohn|colitis', 1),
   T('Polyps', r'polyp|villous adenoma'),
   T('Carcinoid tumor', r'carcinoid'),
   T('Malignant tumors of the GIT')),
 S('Appendix', T('Acute appendicitis (case)', r'RIF tenderness|appendic', 3)),
 S('Laboratory Tests of the GIT', T('Occult blood test', r'occult blood')),
]

OUT[18] = [
 S('Jaundice and Hyperbilirubinaemia', T('Jaundice', r'jaundice|bilirubin|kernicterus|acholuric')),
 S('Liver Function and Hepatomegaly', T('Liver function tests', r'liver function|prothrombin|synthetic'), T('Hepatomegaly', r'hepatomegaly')),
 S('Viral Hepatitis', T('Hepatitis B and hepatotropic viruses', r'hepatotropic|hepatitis B|viral hepatitis|blood transfusion has jaundice', 2)),
 S('Alcoholic Liver Disease', T('Alcohol and the liver', r'alcohol')),
 S('Cirrhosis', T('Cirrhosis: types and etiology', r'cirrhosis|cirrhotic|gynaecomastia', 3), T('Hepatic encephalopathy', r'encephalopathy')),
 S('Portal Hypertension', T('Ascites', r'ascites')),
 S('Tumours of the Liver', T('Hepatocellular carcinoma', r'hepatocellular carcinoma|HBV history', 3)),
 S('Gallbladder', T('Gallstones', r'stone formation|gallstone'), T('Carcinoma of the gallbladder')),
]

OUT[20] = [
 S('Glomerular Diseases',
   T('Classification of glomerular diseases', r'classify glomerular|primary glomerular diseases'),
   T('Nephrotic syndrome', r'nephrotic'),
   T('Nephritic syndromes and glomerulonephritis', r'nephritic|glomerulonephritis|cocoa', 1),
   T('Nephritic and nephrotic syndromes'),
   T('Acute post-streptococcal glomerulonephritis')),
 S('Tubulointerstitial Diseases', T('Pyelonephritis and urinary tract infection', r'\bUTI\b|pyelonephritis')),
 S('Acute Kidney Injury', T('Acute renal failure', r'acute renal failure|cessation of micturition')),
 S('Cystic Diseases of the Kidney', T('Classification')),
 S('Urolithiasis', T('Renal calculi')),
 S('Tumors of the Kidney', T('Renal cell carcinoma', r'renal cell|loin pain|lumbar mass', 2), T('Classification of kidney tumours', r'tumours of kidney'), T('Wilms tumour', r'wilms')),
 S('Clinical Manifestations of Renal Disease',
   T('Hematuria', r'haematuria'),
   T('Proteinuria', r'proteinuria|microalbumin|heat coagulation|nephrotic'),
   T('Renal function tests', r'renal function|clearance|creatinine|\burea\b|serum albumin|uric acid|uricaemia|uremia|glycosuria'),
   T('Urine examination', r'urine|reducing substances|benedict|oliguria'),
   T('Bence Jones protein', r'bence')),
]

OUT[21] = [
 S('Urinary Bladder', T('Bladder carcinoma')),
 S('Testis', T('Testicular tumours and cryptorchidism', r'testic|seminoma|beta-hCG|cryptorchidism|germ cell')),
 S('Prostate', T('Prostate diseases and PSA'), T('Benign prostatic hyperplasia', r'prostat|\bBPH\b')),
 S('Male Infertility', T('Investigation of male infertility', r'infertility'), T('Semen analysis', r'semen|oligospermia|azoospermia')),
]

OUT[22] = [
 S('Infections (Pelvic Inflammatory Disease)', T('Pelvic inflammatory disease')),
 S('Cervix', T('Cervical disease and carcinoma', r'cervix|cervical|\bHPV\b|\bCIN\b|pap smear|contact bleeding')),
 S('Body of Uterus', T('Endometrium and myometrium'), T('Endometriosis', r'endometriosis'), T('Endometrial carcinoma', r'postmenopausal')),
 S('Ovaries', T('Ovarian tumors', r'ovar|dermoid|germ cell')),
 S('Gestational and Placental Disorders', T('Ectopic pregnancy, molar pregnancy, choriocarcinoma')),
]

OUT[23] = [
 S('Inflammatory and Benign Lesions', T('Inflammatory lesions', r'inflammatory lesions'), T('Causes of breast lump', r'causes of breast lump'), T('Fibroadenoma', r'fibroadenoma')),
 S('Carcinoma of the Breast', T('Classification', r'classify|molecular classification'), T('Risk factors', r'risk factors'), T('Prognostic and predictive factors', r'prognostic|ER, PR'), T("Paget disease of the nipple", r'paget')),
 S('Breast Lumps', T('Breast lump (case)', r'breast lump fixed|hard, firm breast lump', 3)),
]

OUT[24] = [
 S('Pituitary Gland', T('Pituitary tumors')),
 S('Thyroid Gland',
   T('Hypothyroidism and goitre', r'hypothyroidism|goitre'),
   T('Thyroiditis', r'hashimoto'),
   T('Graves disease (case)', r'graves|exophthalmos', 3),
   T('Thyroid tumours', r'tumours of thyroid|malignant tumours of thyroid|papillary carcinoma|follicular carcinoma'),
   T('Thyroid disease and tumors')),
 S('Diabetes Mellitus (Endocrine Pancreas)',
   T('Diabetes mellitus', r'define diabetes|classified|difference between type|criteria|gestational|clinical features of a diabetic'),
   T('OGTT and glucose tolerance', r'OGTT|fasting blood glucose|\bIGT\b|diabetic curves'),
   T('HbA1c', r'HbA1c', 1),
   T('Hyperglycaemia', r'hyperglycaemia'),
   T('Complications and ketoacidosis', r'complications of diabetes|ketone|ketoacidosis|\bDKA\b|musty'),
   T('Diabetes cases', r'obese male', 3)),
]

OUT[25] = [
 S('Terminology and Normal Skin', T('Skin terminology and structure')),
 S('Blistering (Vesiculobullous) Diseases', T('Blistering diseases')),
 S('Tumors of the Epidermis', T('Premalignant and malignant skin tumors'), T('Basal cell carcinoma', r'basal cell'), T('Squamous cell carcinoma')),
 S('Melanocytic Tumors', T('Nevus', r'nevus'), T('Malignant melanoma', r'black ulcerated|melanoma')),
]

OUT[26] = [
 S('Osteomyelitis', T('Osteomyelitis', r'osteomyelitis|tibial pain|predisposing factors, etiologic'), T('Tuberculosis of bone (Pott disease)', r'pott')),
 S('Bone Tumors', T('Bone tumors', r'bone-forming'), T('Osteosarcoma', r'osteosarcoma'), T("Ewing sarcoma", r'ewing'), T('Giant cell tumour of bone', r'giant cell')),
 S('Joint Diseases', T('Systemic diseases affecting joints', r'joints')),
 S('Soft Tissue Tumors', T('Soft tissue tumors')),
]

OUT[28] = [
 S('Infections', T('Meningitis', r'meningitis|neck rigidity', 1), T('CSF examination', r'CSF|pleocytosis')),
 S('Tumors', T('CNS tumors', r'CNS neoplasm'), T('Meningioma', r'meningioma', 2)),
]

OUT[29] = [S('Lens', T('Cataract')), S('Retina', T('Retinoblastoma'))]

# chapter 30 (clinical biochemistry): kept as the source file groups them
OUT[30] = [
 S('Acid–base & electrolytes', T('Acid–base & electrolytes')), S('Enzymes', T('Enzymes')), S('Lipid profile', T('Lipid profile')), S('Body fluids', T('Body fluids')),
]

OUT['P'] = [
 S('Histopathology Technique', T('Biopsy, fixation and specimen handling')), S('Lymph Node', T('Lymphadenitis and lymphadenopathy')),
 S('Lung', T('Lung lesions')), S('Salivary Gland', T('Parotid swelling')), S('Stomach', T('Gastric ulcer and gastritis')),
 S('Intestine', T('Colonic lesions')), S('Liver and Gallbladder', T('Liver and gallbladder lesions')),
 S('Kidney and Urinary Tract', T('Nephrectomy specimen')), S('Prostate and Testis', T('Prostate and testicular specimens')),
 S('Female Genital Tract', T('Cervix, endometrium and ovary')), S('Breast', T('Breast lesions')), S('Skin', T('Skin ulcer')),
 S('Bone and Soft Tissue', T('Bone and soft tissue lesions')), S('Central Nervous System', T('Brain lesion')), S('Heart', T('Chest pain')),
]

# two spellings of the same topic: shown under one heading
TOPIC_ALIAS = {(13, 'Lymph Node Disorders', 'Lymphadenopathy'): 'Lymphadenopathy and lymphadenitis'}

# a question that really belongs in another chapter's heading (matched on the question text, DU questions only)
GLOBAL = [
 (re.compile(r'angina pectoris', re.I), 12, 'Ischemic Heart Disease', 'Angina pectoris (case)'),
 (re.compile(r'pleocytosis', re.I), 28, 'Infections', 'CSF examination'),
]
CLINICAL = re.compile(r'^(a|an)\s+\d|^(a|an)\s+(child|boy|girl|male|female|patient|woman|man|young|pregnant|smoker|elderly|adolescent)\b', re.I)

def sub_order(ch):
    return [s[0] for s in OUT.get(ch, [])]

def topic_order(ch, sub):
    for s, ts in OUT.get(ch, []):
        if s == sub: return [t[0] for t in ts]
    return []

def place_du(ch, q, orig_sub, prev):
    """(chapter, heading, topic) for a DU written question, or None if no rule fits."""
    if q.lower().startswith('same') and prev: return prev
    for rx, c, s, t in GLOBAL:
        if rx.search(q): return (c, s, t)
    out = OUT.get(ch)
    if not out: return None
    cands = []
    for si, (s, ts) in enumerate(out):
        for ti, (t, rx, prio) in enumerate(ts):
            if rx and rx.search(q): cands.append((-prio, si, ti, s, t))
    if cands:
        cands.sort(); c = cands[0]
        return (ch, c[3], c[4])
    if any(s == orig_sub for s, _ in out):          # the heading it was filed under already is a Robbins heading
        return (ch, orig_sub, orig_sub)
    if CLINICAL.search(q):
        for s, ts in out:
            if s == 'Clinical Scenarios': return (ch, s, ts[0][0])
    return None

def norm(ch, sub, top):
    return (ch, sub, TOPIC_ALIAS.get((ch, sub, top), top))
