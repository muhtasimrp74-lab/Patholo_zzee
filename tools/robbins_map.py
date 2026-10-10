# -*- coding: utf-8 -*-
"""Where every question sits in Robbins: chapter -> sub-chapter (section heading) -> topic.
Edit this file to move a question or rename a heading; then run  python3 tools/build.py
CHAPTERS: chapter number -> (title, [sub-chapters in book order]).   'P' = the practical section (not a Robbins chapter).
SYS: question id (q1..q189, the original viva questions) -> (chapter, sub-chapter, topic).
General Pathology questions get their placement from the headings in gp_written.txt."""

CHAPTERS = {
 2:  ('Cell Injury, Cell Death, and Adaptations', ['Cellular Adaptations to Stress', 'Cell Injury: Causes and Morphology', 'Mechanisms of Cell Injury', 'Necrosis', 'Apoptosis', 'Pathologic Calcification']),
 11: ('Blood Vessels', ['Hypertensive Vascular Disease', 'Arteriosclerosis', 'Vasculitis', 'Tumors of Blood Vessels']),
 12: ('The Heart', ['Congenital Heart Disease', 'Ischemic Heart Disease', 'Valvular Heart Disease', 'Cardiomyopathies', 'Pericardial Disease']),
 13: ('Diseases of White Blood Cells, Lymph Nodes, Spleen, and Thymus', ['Lymph Node Disorders', 'Lymphoid Neoplasms']),
 15: ('The Lung', ['Obstructive Lung Diseases', 'Chronic Interstitial (Restrictive) Lung Diseases', 'Pulmonary Infections', 'Lung Tumors']),
 17: ('The Gastrointestinal Tract', ['Congenital Anomalies', 'Esophagus', 'Stomach', 'Small and Large Intestines', 'Appendix']),
 18: ('Liver and Gallbladder', ['Cirrhosis', 'Portal Hypertension', 'Viral Hepatitis', 'Gallbladder']),
 20: ('The Kidney', ['Glomerular Diseases', 'Tubulointerstitial Diseases', 'Cystic Diseases of the Kidney', 'Urolithiasis', 'Tumors of the Kidney', 'Clinical Manifestations of Renal Disease']),
 21: ('The Lower Urinary Tract and Male Genital System', ['Urinary Bladder', 'Prostate', 'Male Infertility']),
 22: ('The Female Genital Tract', ['Infections (Pelvic Inflammatory Disease)', 'Cervix', 'Body of Uterus', 'Ovaries', 'Gestational and Placental Disorders']),
 24: ('The Endocrine System', ['Pituitary Gland', 'Thyroid Gland', 'Diabetes Mellitus (Endocrine Pancreas)']),
 25: ('The Skin', ['Terminology and Normal Skin', 'Blistering (Vesiculobullous) Diseases', 'Tumors of the Epidermis', 'Melanocytic Tumors']),
 26: ('Bones, Joints, and Soft Tissue Tumors', ['Osteomyelitis', 'Bone Tumors', 'Soft Tissue Tumors']),
 28: ('The Central Nervous System', ['Infections', 'Tumors']),
 29: ('The Eye', ['Lens', 'Retina']),
 'P': ('Histopathology Practical', ['Histopathology Technique', 'Lymph Node', 'Lung', 'Salivary Gland', 'Stomach', 'Intestine', 'Liver and Gallbladder', 'Kidney and Urinary Tract', 'Prostate and Testis', 'Female Genital Tract', 'Breast', 'Skin', 'Bone and Soft Tissue', 'Central Nervous System', 'Heart']),
}
CH_ORDER = [2, 11, 12, 13, 15, 17, 18, 20, 21, 22, 24, 25, 26, 28, 29, 'P']

SYS = {}
def _a(ids, ch, sub, topic):
    for i in ids: SYS['q%d' % i] = (ch, sub, topic)

# 11 Blood Vessels
_a([3], 11, 'Hypertensive Vascular Disease', 'Hypertension: causes and complications')
_a([4], 11, 'Arteriosclerosis', 'Atherosclerosis: pathogenesis')
_a([5], 11, 'Arteriosclerosis', 'Atheroma: composition and sites')
_a([6], 11, 'Arteriosclerosis', 'Arteriosclerosis vs atherosclerosis; complications')
_a([1], 11, 'Vasculitis', 'Types of vasculitis')
_a([2], 11, 'Tumors of Blood Vessels', 'Classification of vascular tumors')
# 12 Heart
_a([7], 12, 'Congenital Heart Disease', 'Classification')
_a([8], 12, 'Congenital Heart Disease', 'Tetralogy of Fallot')
_a([9], 12, 'Ischemic Heart Disease', 'Overview')
_a([10], 12, 'Ischemic Heart Disease', 'Angina pectoris (case)')
_a([11], 12, 'Ischemic Heart Disease', 'Myocardial infarction: diagnosis and markers')
_a([12], 12, 'Ischemic Heart Disease', 'Myocardial infarction: complications')
_a([13], 12, 'Ischemic Heart Disease', 'Myocardial infarction (case)')
_a([14, 15, 16, 21], 12, 'Valvular Heart Disease', 'Rheumatic fever')
_a([17], 12, 'Valvular Heart Disease', 'Vegetations')
_a([18], 12, 'Valvular Heart Disease', 'Infective endocarditis')
_a([20], 12, 'Cardiomyopathies', 'Types of cardiomyopathy')
_a([19], 12, 'Pericardial Disease', 'Pericarditis')
# 13 WBC / lymph nodes
_a([24, 26], 13, 'Lymph Node Disorders', 'Lymphadenopathy')
_a([22, 23, 25, 27], 13, 'Lymphoid Neoplasms', 'Hodgkin and non-Hodgkin lymphoma')
# 15 Lung
_a([28, 29, 30, 31], 15, 'Obstructive Lung Diseases', 'COPD, emphysema, chronic bronchitis, asthma')
_a([32], 15, 'Chronic Interstitial (Restrictive) Lung Diseases', 'Interstitial lung disease')
_a([33, 34, 35, 36], 15, 'Pulmonary Infections', 'Pneumonia')
_a([37, 38, 39, 40, 41, 42], 15, 'Pulmonary Infections', 'Tuberculosis')
_a([43], 15, 'Lung Tumors', 'Bronchogenic carcinoma')
# 17 GIT
_a([49, 50], 17, 'Congenital Anomalies', 'Meckel diverticulum, Hirschsprung disease')
_a([44], 17, 'Esophagus', 'Achalasia and reflux esophagitis')
_a([45, 47], 17, 'Esophagus', 'Esophageal varices')
_a([46], 17, 'Esophagus', 'Barrett esophagus')
_a([48], 17, 'Esophagus', 'Esophageal carcinoma')
_a([51], 17, 'Stomach', 'Gastritis')
_a([52, 53, 54, 55, 57, 58, 59], 17, 'Stomach', 'Peptic ulcer disease')
_a([56], 17, 'Stomach', 'H. pylori-related diseases')
_a([60, 61], 17, 'Stomach', 'Gastric carcinoma')
_a([62], 17, 'Small and Large Intestines', 'Inflammatory bowel disease')
_a([63], 17, 'Small and Large Intestines', 'Carcinoid tumor')
_a([64, 65], 17, 'Small and Large Intestines', 'Polyps')
_a([66], 17, 'Small and Large Intestines', 'Malignant tumors of the GIT')
_a([67], 17, 'Appendix', 'Acute appendicitis (case)')
# 18 Liver
_a([68, 69, 70], 18, 'Cirrhosis', 'Cirrhosis: types and etiology')
_a([71], 18, 'Portal Hypertension', 'Ascites')
_a([72, 73], 18, 'Viral Hepatitis', 'Hepatitis B and hepatotropic viruses')
_a([74], 18, 'Gallbladder', 'Carcinoma of the gallbladder')
_a([75], 18, 'Gallbladder', 'Gallstones')
# 20 Kidney
_a([76, 77, 79], 20, 'Glomerular Diseases', 'Nephritic and nephrotic syndromes')
_a([78, 80], 20, 'Glomerular Diseases', 'Acute post-streptococcal glomerulonephritis')
_a([83, 84, 86], 20, 'Tubulointerstitial Diseases', 'Pyelonephritis and urinary tract infection')
_a([82], 20, 'Cystic Diseases of the Kidney', 'Classification')
_a([85], 20, 'Urolithiasis', 'Renal calculi')
_a([87], 20, 'Tumors of the Kidney', 'Renal cell carcinoma')
_a([81], 20, 'Clinical Manifestations of Renal Disease', 'Hematuria')
_a([91], 20, 'Clinical Manifestations of Renal Disease', 'Renal function tests')
_a([92], 20, 'Clinical Manifestations of Renal Disease', 'Bence Jones protein')
# 21 Lower urinary tract & male genital
_a([88, 89, 90], 21, 'Urinary Bladder', 'Bladder carcinoma')
_a([93, 94], 21, 'Prostate', 'Prostate diseases and PSA')
_a([95, 96, 97], 21, 'Male Infertility', 'Semen analysis')
# 22 Female genital tract
_a([98], 22, 'Infections (Pelvic Inflammatory Disease)', 'Pelvic inflammatory disease')
_a([139, 140, 141], 22, 'Cervix', 'Cervical disease and carcinoma')
_a([142, 143, 144, 145, 146, 147], 22, 'Body of Uterus', 'Endometrium and myometrium')
_a([148, 149, 150, 151], 22, 'Ovaries', 'Ovarian tumors')
_a([152, 153, 154], 22, 'Gestational and Placental Disorders', 'Ectopic pregnancy, molar pregnancy, choriocarcinoma')
# 24 Endocrine
_a([104], 24, 'Pituitary Gland', 'Pituitary tumors')
_a([99, 100, 101, 102, 103], 24, 'Thyroid Gland', 'Thyroid disease and tumors')
_a([105, 106, 107, 108, 109, 110, 111, 112, 113, 114], 24, 'Diabetes Mellitus (Endocrine Pancreas)', 'Diabetes mellitus')
# 25 Skin
_a([115, 116], 25, 'Terminology and Normal Skin', 'Skin terminology and structure')
_a([117], 25, 'Blistering (Vesiculobullous) Diseases', 'Blistering diseases')
_a([118, 119], 25, 'Tumors of the Epidermis', 'Premalignant and malignant skin tumors')
_a([120], 25, 'Tumors of the Epidermis', 'Basal cell carcinoma')
_a([121, 122], 25, 'Tumors of the Epidermis', 'Squamous cell carcinoma')
_a([123], 25, 'Melanocytic Tumors', 'Nevus')
_a([124, 125, 126], 25, 'Melanocytic Tumors', 'Malignant melanoma')
# 26 Bones / soft tissue
_a([127], 26, 'Osteomyelitis', 'Osteomyelitis')
_a([128, 129, 130, 131], 26, 'Bone Tumors', 'Bone tumors')
_a([132], 26, 'Soft Tissue Tumors', 'Soft tissue tumors')
# 28 CNS
_a([136], 28, 'Infections', 'Meningitis')
_a([133, 134, 135], 28, 'Tumors', 'CNS tumors')
# 29 Eye
_a([137], 29, 'Lens', 'Cataract')
_a([138], 29, 'Retina', 'Retinoblastoma')
# P Practical
_a([155, 156, 157], 'P', 'Histopathology Technique', 'Biopsy, fixation and specimen handling')
_a([158, 159, 160, 161], 'P', 'Lymph Node', 'Lymphadenitis and lymphadenopathy')
_a([162, 163, 164, 169], 'P', 'Lung', 'Lung lesions')
_a([165], 'P', 'Salivary Gland', 'Parotid swelling')
_a([166, 167], 'P', 'Stomach', 'Gastric ulcer and gastritis')
_a([168, 170, 172, 188], 'P', 'Intestine', 'Colonic lesions')
_a([171, 173, 174], 'P', 'Liver and Gallbladder', 'Liver and gallbladder lesions')
_a([175], 'P', 'Kidney and Urinary Tract', 'Nephrectomy specimen')
_a([176, 179], 'P', 'Prostate and Testis', 'Prostate and testicular specimens')
_a([177, 178, 180], 'P', 'Female Genital Tract', 'Cervix, endometrium and ovary')
_a([181, 182], 'P', 'Breast', 'Breast lesions')
_a([183], 'P', 'Skin', 'Skin ulcer')
_a([184, 185, 186], 'P', 'Bone and Soft Tissue', 'Bone and soft tissue lesions')
_a([187], 'P', 'Central Nervous System', 'Brain lesion')
_a([189], 'P', 'Heart', 'Chest pain')

# display label of the chapter number
def label(ch):
    return 'Practical' if ch == 'P' else 'Ch %d' % ch

assert len(SYS) == 189, len(SYS)
for k, (ch, sub, topic) in SYS.items():
    assert sub in CHAPTERS[ch][1], (k, ch, sub)
