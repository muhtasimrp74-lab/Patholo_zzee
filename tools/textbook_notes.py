# -*- coding: utf-8 -*-
"""'Study-notes' emphasis: auto-bold high-yield terms / numbers / count words, and mark ONE key sentence per paragraph.
Works on already-inlined HTML (only <b>, <i> tags present). Toggle in the reader hides it again (class .nohl)."""
import re
TERMS = """reversible injury|irreversible injury|cell injury|cell death|necrosis|coagulative necrosis|liquefactive necrosis|gangrenous necrosis|caseous necrosis|fat necrosis|fibrinoid necrosis|apoptosis|necroptosis|pyroptosis|ferroptosis|autophagy|efferocytosis|apoptotic bodies|apoptosome|caspase-1|caspase-3|caspase-8|caspase-9|caspases|cytochrome c|BCL2|BAX|BAK|BH3-only proteins|FADD|FLIP|FasL|TNFR1|RIPK1|RIPK3|MLKL|gasdermin D|GSDMD|inflammasome|DAMPs|pyknosis|karyorrhexis|karyolysis|myelin figures|eosinophilia|hydropic change|cellular swelling|fatty change|steatosis|hypoxia|ischemia|reperfusion injury|ischemia-reperfusion injury|infarct|myocardial infarction|troponin|oxidative stress|free radicals|reactive oxygen species|superoxide|hydrogen peroxide|hydroxyl radical|peroxynitrite|Fenton reaction|lipid peroxidation|catalase|superoxide dismutase|glutathione peroxidase|ATP depletion|mitochondrial permeability transition pore|unfolded protein response|ER stress|integrated stress response|eIF2α|ATF4|chaperones|proteasomes?|ubiquitin|hypoxia-inducible factor-1|HIF-1|p53|phospholipases|endonucleases|hypertrophy|hyperplasia|atrophy|metaplasia|dysplasia|squamous metaplasia|Barrett esophagus|myositis ossificans|lipofuscin|melanin|hemosiderin|hemosiderosis|hemochromatosis|anthracosis|Russell bodies|alcoholic hyaline|glycogen storage diseases|lysosomal storage diseases|dystrophic calcification|metastatic calcification|psammoma bodies|hypercalcemia|nephrocalcinosis|replicative senescence|telomerase|telomeres|sirtuins|mTOR|rapamycin|caloric restriction|IGF-1|Werner syndrome|atherosclerosis|foam cells|xanthomas|cholesterolosis|saponification|wet gangrene|homeostasis|pathogenesis|etiology|cachexia|marasmus|granuloma|amyloidosis|edema|thrombosis|embolism|infarction|hemorrhage|inflammation|neoplasia|carcinoma|metastasis|anemia|fibrosis|regeneration|ulcer|abscess|sepsis|hyperparathyroidism|diabetes mellitus|emphysema|cirrhosis""".split('|')
TERM_RE = re.compile(r'(?<![\w>/-])(' + '|'.join(sorted((t for t in TERMS if t), key=len, reverse=True)) + r')(?![\w-])', re.I)
UNITS = r'(?:%|percent|hours?|minutes?|seconds?|days?|weeks?|months?|years?|nm|kDa|mmol|μmol|°F|°C|fold|eightfold|times)'
NUM_RE = re.compile(r'(?<![\w.])(\d+(?:\.\d+)?%?(?:\s*(?:to|or|–|-)\s*\d+(?:\.\d+)?%?)?\s*(?:' + UNITS + r'\b)?)(?![\w.])')
NUM_RE = re.compile(r'(?<![\w.₀-₉⁰-⁹])(\d+(?:\.\d+)?\s*(?:%|percent\b)(?:\s*(?:to|or|–)\s*\d+(?:\.\d+)?\s*(?:%|percent\b)?)?|\d+(?:\.\d+)?(?:\s*(?:to|or|–)\s*\d+(?:\.\d+)?)?\s+(?:hours?|minutes?|seconds?|days?|weeks?|months?|years?|nm|kDa|mmol|μmol|times|fold)\b|\d+(?:\.\d+)?(?:°[FC]|-fold))')
COUNT_RE = re.compile(r'\b((?:two|three|four|five|six|seven|eight|more than \d+|over \d+)\s+(?:(?:principal|main|major|distinct|broad|general|critical|key|important|different|separate|prototypic)\s+)?(?:types?|forms?|pathways?|patterns?|mechanisms?|phases?|groups?|classes|categories|steps|stages|kinds?|causes|features|ways|reactions|members|processes|isoforms|kinases)\b)', re.I)
ENUM_RE = re.compile(r'(\((?:[1-9]|[a-d])\))')
STRONG = re.compile(r'characterized by|is defined as|defined as|is called|are called|known as|hallmark|most (?:important|common|characteristic|reactive)|principal|is the (?:most|major|key|main)|point of no return|irreversib', re.I)
WEAK = re.compile(r'critical|essential|in contrast|results? (?:from|in)|is caused by|is due to|leads? to', re.I)
DEFN = re.compile(r"^[A-Z][\w\s\-–()/’',α-ωΑ-Ω]{2,70}?\s(?:is|are|refers? to|describes?|represents?)\s(?:a|an|the|defined|characterized|any|one|abnormal|increase|decrease|reduction|reversible|regulated|process|form)\b")
ABBR = [('Fig.', 'Fig\x00'), ('e.g.', 'e\x00g\x00'), ('i.e.', 'i\x00e\x00'), ('et al.', 'et al\x00'), ('vs.', 'vs\x00'), ('spp.', 'spp\x00'), ('Dr.', 'Dr\x00'), ('approx.', 'approx\x00')]

def _bold_plain(seg, seen, budget):
    def tag(m):
        if budget[0] <= 0: return m.group(0)
        k = m.group(1).lower()
        if k in seen: return m.group(0)
        seen.add(k); budget[0] -= 1
        return '<b class="n">%s</b>' % m.group(1)
    for rx in (COUNT_RE, NUM_RE, TERM_RE):
        # protect already-created bold spans
        parts = re.split(r'(<b class="n">.*?</b>)', seg)
        seg = ''.join(p if p.startswith('<b class="n">') else rx.sub(tag, p) for p in parts)
    seg = re.sub(r'(?<!\w)(\((?:[1-9])\))', r'<b class="n">\1</b>', seg) if budget[0] > 0 else seg
    return seg

def notes(h, mark=True, cap=7):
    if len(h) < 60: return h
    seen = set(); budget = [cap]
    segs = re.split(r'(<b>.*?</b>|<i>.*?</i>)', h)
    h2 = ''.join(s if s.startswith(('<b>', '<i>')) else _bold_plain(s, seen, budget) for s in segs)
    if mark and len(re.sub(r'<[^>]+>', '', h2)) > 240:
        t = h2
        for x, y in ABBR: t = t.replace(x, y)
        sents = re.split(r'(?<=[.!?])\s+(?=[A-Z“(<])', t)
        best = None
        for i, sn in enumerate(sents):
            plain = re.sub(r'<[^>]+>', '', sn)
            if not (55 <= len(plain) <= 270) or sn.count('<b') != sn.count('</b>') or sn.count('<i>') != sn.count('</i>') or plain.startswith(('Fig', '(')): continue
            pr = 0 if (i == 0 and DEFN.search(plain)) else 1 if STRONG.search(plain) else 2 if (WEAK.search(plain) and len(h2) > 520) else None
            if pr is not None and (best is None or pr < best[0]): best = (pr, i)
        if best:
            sents[best[1]] = '<mark class="tbhl">%s</mark>' % sents[best[1]]
            h2 = ' '.join(sents).replace('\x00', '.')
        return h2
    return h2
