# -*- coding: utf-8 -*-
"""New topics for the whole-pathology expansion: General Pathology (GP) and Haematology (HM).
Written in the same HTML shape as the existing answers so the site's JS (Say-this-first box, search,
related questions, practice mode) treats them exactly like the original 189."""
import re, html

def esc(t):
    t = html.escape(t, quote=False)
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)

def P(label, text=None):
    if text is None:
        return '<p>%s</p>' % esc(label)
    return '<p><strong class="lbl">%s:</strong> %s</p>' % (esc(label), esc(text))

def SH(t):
    return '<div class="sh"><strong class="lbl">%s</strong></div>' % esc(t)

def UL(items):
    return '<ul>' + ''.join('<li>%s</li>' % esc(i) for i in items) + '</ul>'

def TB(head, rows):
    h = ''.join('<th>%s</th>' % esc(x) for x in head)
    b = ''
    for r in rows:
        b += '<tr><td><strong>%s</strong></td>' % esc(r[0]) + ''.join('<td>%s</td>' % esc(x) for x in r[1:]) + '</tr>'
    return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (h, b)

# HOW TO ADD QUESTIONS
# Each topic is: (topic_id, 'Topic name', part, [questions])
#   part      'gp' = Part A General Pathology, 'hm' = Part B Haematology  (Part C Systemic is the original 15 topics)
#   topic_id  any short unique id that is not 01-15, e.g. 'G1', 'G2' ... for General Pathology and 'H1', 'H2' ... for Haematology
# Each question is: (card_code, 'Question text', answer_html[, 'W'])
#   card_code 'A1', 'A2' ... for A-box cards, 'B1', 'B2' ... for B-box cards. It drives the A-box / B-box filters and card pages.
#   'W'       add as the 4th item to mark a WRITTEN question; leave it out for a viva question.
# Build answers with P(), SH(), UL() and TB() above, then run:  python3 tools/build.py
#
# TOPICS = [
#  ('G1', 'Cell Injury and Adaptation', 'gp', [
#     ('A1', 'Define apoptosis. Differences between apoptosis and necrosis.',
#        P('Apoptosis', 'Programmed, energy-dependent cell death without inflammation.') + UL(['Cell shrinkage', 'Apoptotic bodies'])),
#     ('A2', 'Write short notes on hyperplasia.', P('Hyperplasia', 'Increase in the number of cells.'), 'W'),
#  ]),
#  ('H1', 'Anaemias', 'hm', [('A3', 'Classify anaemia.', P('Anaemia', 'Reduction in haemoglobin below normal.'))]),
# ]
# ---------------------------------------------------------------------------------------------
# GENERAL PATHOLOGY - written questions, read from gp_written.txt, grouped the way Robbins groups them.
#   gp_written.txt format (one heading per level, then the question lines):
#       # CHAPTER 2 | Cell Injury, Cell Death, and Adaptations     <- Robbins chapter number | title
#       ## Necrosis                                                 <- sub-chapter (section heading in the chapter)
#       ### Fat necrosis                                            <- topic
#       Why does fat necrosis occur in acute pancreatitis? (DU-11Ju) ⭐
#   * To ADD questions: append lines at the END of gp_written.txt (so existing question numbers never move),
#     under a heading line you repeat, e.g. "## Necrosis" and "### Fat necrosis". New chapters just need a "# CHAPTER n | title" line.
#   * To ADD ANSWERS: put them in ANSWERS below, keyed by the question text exactly as written in the file
#     (without the "(DU-..)" tag and stars), e.g.  'Define necrosis.': P('Necrosis', '...') + UL([...])
#   * Until an answer exists, the question shows "Answer to be added."
import os, re as _re
ANSWERS = {}
# ---- answers.md: one "## <exact question text>" heading per question, then the answer in simple markdown ----
def _md(t):
    import html as _h
    inl = lambda s: _re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', _h.escape(s, quote=False))
    out, blocks = [], _re.split(r'\n\s*\n', t.strip())
    for blk in blocks:
        ls = [l.rstrip() for l in blk.split('\n') if l.strip()]
        if not ls: continue
        if all(l.lstrip().startswith(('- ', '* ')) for l in ls):
            out.append('<ul>' + ''.join('<li>%s</li>' % inl(l.lstrip()[2:]) for l in ls) + '</ul>')
        elif all(_re.match(r'\d+[.)] ', l.lstrip()) for l in ls):
            out.append('<ol>' + ''.join('<li>%s</li>' % inl(_re.sub(r'^\d+[.)] ', '', l.lstrip())) for l in ls) + '</ol>')
        elif all(l.lstrip().startswith('|') for l in ls):
            rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in ls if not _re.match(r'^[\s|:-]+$', l)]
            th = ''.join('<th>%s</th>' % inl(c) for c in rows[0])
            out.append('<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (th, ''.join('<tr>' + ''.join('<td>%s</td>' % inl(c) for c in r) + '</tr>' for r in rows[1:])))
        else:
            p = inl(' '.join(l.strip() for l in ls))
            p = _re.sub(r'^<strong>([^<]+:)</strong>', r'<strong class="lbl">\1</strong>', p)
            out.append('<p>%s</p>' % p)
    return ''.join(out)
_AMD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'answers.md')
if os.path.exists(_AMD):
    for _sec in _re.split(r'(?m)^## ', open(_AMD, encoding='utf8').read())[1:]:
        _q, _, _body = _sec.partition('\n')
        if _body.strip(): ANSWERS[_q.strip()] = _md(_body)
GP_CHAPTERS = {}   # chapter number -> (title, [sub-chapters in order of appearance])

def _gp_topics():
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gp_written.txt')
    ch = sub = topic = None
    out, order = {}, []
    for raw in open(src, encoding='utf8'):
        line = raw.strip()
        if not line:
            continue
        if line.startswith('###'):
            topic = line[3:].strip(); continue
        if line.startswith('##'):
            sub = line[2:].strip(); topic = None
            if sub not in GP_CHAPTERS[ch][1]: GP_CHAPTERS[ch][1].append(sub)
            continue
        if line.startswith('#'):
            m = _re.match(r'^#\s*CHAPTER\s+(\d+)\s*\|\s*(.+)$', line)
            assert m, 'bad chapter heading: ' + line
            ch = int(m.group(1)); sub = topic = None
            GP_CHAPTERS.setdefault(ch, (m.group(2).strip(), []))
            if ch not in out: out[ch] = []; order.append(ch)
            continue
        assert ch and sub, 'question before a chapter and sub-chapter heading: ' + line
        m = _re.match(r'^(.*?)\s*\(((?:DU|BSMMU)[^)]*)\)\s*(\u2b50*)\s*$', line)
        q, ref, stars = (m.group(1), m.group(2), m.group(3)) if m else (line.rstrip('\u2b50 ').strip(), '', '')
        body = ANSWERS.get(q) or '<p>Answer to be added.</p>'
        # written questions have no A/B card code (those belong to the viva board): code is left blank
        out[ch].append(('', q, body, 'W', len(stars), ref, (ch, sub, topic or sub)))
    _box_viva(out, order)
    _du_written(out, order)
    _merge_dups(out)
    order.sort()   # book order (Part A: chapters 2-24, Part B: 13-14)
    return [('c%d' % c, GP_CHAPTERS[c][0], 'hm' if c in HM_CHAPTERS else ('sys' if c in SYS_CHAPTERS else 'gp'), out[c]) for c in order]

# ---------------------------------------------------------------------------------------------
# BOX VIVA (A-cards A1-A10: General Pathology + Haematology) - read from box_viva.txt, which is generated from the
# box viva list by  python3 tools/boxviva_parse.py  (see that file for the line format).
#   Every question carries the A-card(s) it was printed on, how many times it was asked (stars) and the question
#   numbers as printed. They are appended AFTER the written questions, so existing question ids never move.
#   Answers: put them in ANSWERS above, keyed by the question text exactly as written in box_viva.txt.
HM_CHAPTERS = {13, 14}
# Robbins systemic chapters (Blood Vessels .. CNS) belong to Part C, Systemic Pathology; chapters 2-9 and Clinical Biochemistry stay in Part A.
SYS_CHAPTERS = {11, 12, 15, 17, 18, 20, 21, 22, 23, 24, 25, 26, 28}
BOX_NOTE = 'Answer to be added.'
def _box_viva(out, order):
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'box_viva.txt')
    if not os.path.exists(src): return
    ch = sub = topic = None
    for raw in open(src, encoding='utf8'):
        line = raw.strip()
        if not line: continue
        if line.startswith('###'): topic = line[3:].strip(); continue
        if line.startswith('##'):
            sub = line[2:].strip(); topic = None
            if sub not in GP_CHAPTERS[ch][1]: GP_CHAPTERS[ch][1].append(sub)
            continue
        if line.startswith('#'):
            m = _re.match(r'^#\s*CHAPTER\s+(\d+)\s*\|\s*(.+)$', line)
            if not m: continue          # plain comment line
            ch = int(m.group(1)); sub = topic = None
            GP_CHAPTERS.setdefault(ch, (m.group(2).strip(), []))
            if ch not in out: out[ch] = []; order.append(ch)
            continue
        hl = line.endswith('\U0001F58D')
        if hl: line = line[:-1].rstrip()
        m = _re.match(r'^(.*?)\s*\{([^}]*)\}\s*(\u2b50*)\s*$', line)
        assert m, 'bad box viva line: ' + line
        body, boxes, stars = m.group(1), m.group(2), len(m.group(3))
        bx = []   # [[card code, 'Q13, Q15'], ...] in box order
        for part in boxes.split(';'):
            mm = _re.match(r'^\s*A-(\d+)\s*(.*)$', part)
            assert mm, 'bad box tag: ' + line
            bx.append(['A' + mm.group(1), mm.group(2).strip()])
        code = ' '.join(sorted({b[0] for b in bx}, key=lambda c: int(c[1:])))
        if body.startswith('@ '):
            title, asks, var = [x.strip() for x in body[2:].split('::')]
            q = title + ' \u2014 ' + ' '.join(asks.split(' | '))
            ans = '<p>%s</p>' % BOX_NOTE
            ans = ('<p><strong class="lbl">Case:</strong> %s</p>' % esc(title)) + '<div class="sh"><strong class="lbl">Questions on this case</strong></div>' + UL(asks.split(' | ')) + ((P('As printed', var)) if var else '') + '<p>%s</p>' % BOX_NOTE
        else:
            q = body; ans = ANSWERS.get(q) or '<p>%s</p>' % BOX_NOTE
        out[ch].append((code, q, ans, 'V', stars, '', (ch, sub, topic or sub), {'boxes': bx, 'hl': hl}))

# ---------------------------------------------------------------------------------------------
# DU WRITTEN QUESTIONS (gp_written_du.txt) - same line format as gp_written.txt, every question tagged (DU-..).
#   Items carry a 9th element ('late') so build.py numbers them AFTER the written and box-viva questions:
#   bookmarks, notes and progress already saved on the live site never move. To add more DU questions, append
#   them to gp_written_du.txt (new ones at the end of the file).
def _du_written(out, order):
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gp_written_du.txt')
    if not os.path.exists(src): return
    ch = sub = topic = None
    for raw in open(src, encoding='utf8'):
        line = raw.strip()
        if not line: continue
        if line.startswith('###'): topic = line[3:].strip(); continue
        if line.startswith('##'):
            sub = line[2:].strip(); topic = None
            if sub not in GP_CHAPTERS[ch][1]: GP_CHAPTERS[ch][1].append(sub)
            continue
        if line.startswith('#'):
            m = _re.match(r'^#\s*CHAPTER\s+(\d+)\s*\|\s*(.+)$', line)
            if not m: continue          # plain comment line
            ch = int(m.group(1)); sub = topic = None
            GP_CHAPTERS.setdefault(ch, (m.group(2).strip(), []))
            if ch not in out: out[ch] = []; order.append(ch)
            continue
        m = _re.match(r'^(.*?)\s*\(((?:DU|BSMMU)[^)]*)\)\s*(\u2b50*)\s*$', line)
        assert m, 'bad DU line: ' + line
        q, ref, stars = m.group(1), m.group(2), m.group(3)
        body = ANSWERS.get(q) or '<p>Answer to be added.</p>'
        out[ch].append(('', q, body, 'W', len(stars), ref, (ch, sub, topic or sub), {}, 2))

# ---------------------------------------------------------------------------------------------
# SAME QUESTION ON BOTH LISTS. A question asked in the written papers (DU) and also on the box-viva cards is shown ONCE:
#   one card carrying the A-card tags AND the (DU-..) exam tags, stars added together, type 'B' (shows under Viva and Written).
#   Matching is done by dupmerge.py (same kind of question about the same subject, inside one chapter).
#   Ids never move: every member keeps its place in the numbering; the one with the lowest id survives, the others are listed
#   in DROPPED (build.py skips them and writes ALIAS so notes/bookmarks saved on a dropped id follow the survivor).
import dupmerge
DROPPED = set()   # (topic id 'c3', index in that topic's list)
ALIAS = {}        # (topic id, dropped index) -> (topic id, surviving index)
def _combine_refs(refs):
    by, order = {}, []
    for r in refs:
        last = None
        for tok in [t.strip() for t in (r or '').split(',') if t.strip()]:
            m = _re.match(r'^([A-Za-z]+)-(.+)$', tok)
            if m: last, tok = m.group(1), m.group(2)
            last = last or 'DU'
            if last not in by: by[last] = []; order.append(last)
            if tok not in by[last]: by[last].append(tok)
    return ', '.join('%s-%s' % (k, ', '.join(by[k])) for k in order)
def _plain(t): return _re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()
def _merge_dups(out):
    for ch, items in out.items():
        info = []
        for i, it in enumerate(items):
            box = len(it) == 8 and ' \u2014 ' not in it[1]
            written = (len(it) == 7) or (len(it) > 8 and it[7] == {})
            rank = 0 if len(it) == 7 else (1 if len(it) == 8 else it[8])
            info.append((i, it, box, written, rank, dupmerge.key(it[1]) if (box or written) else None))
        done = set()
        for a in range(len(info)):
            if a in done or info[a][5] is None: continue
            grp = [a] + [b for b in range(a + 1, len(info)) if b not in done and info[b][5] is not None and dupmerge.same(info[a][5], info[b][5])]
            ws = [info[x] for x in grp if info[x][3]]; bs = [info[x] for x in grp if info[x][2]]
            if not ws or not bs: continue
            done.update(grp)
            mem = sorted(info[x] for x in grp)           # by (index...) ; survivor = lowest (rank, index)
            surv = min(mem, key=lambda m: (m[4], m[0]))
            main = max(ws, key=lambda m: (m[1][4], -m[0]))[1]          # the written wording, most-asked first
            bx = [b for m in bs for b in m[1][7]['boxes']]
            hl = any(m[1][7]['hl'] for m in bs)
            code = ' '.join(sorted({c for m in bs for c in m[1][0].split()}, key=lambda c: int(c[1:]) if c[1:].isdigit() else 0))
            stars = sum(m[1][4] for m in ws) + sum(m[1][4] for m in bs)
            refs = _combine_refs([m[1][5] for m in ws])
            others = []
            for m in mem:
                t = m[1][1]
                if _plain(t) != _plain(main[1]) and all(_plain(t) != _plain(o) for o in others): others.append(t)
            body = main[2]
            if others: body = '<p><em>Also asked as:</em> ' + '; '.join(esc(o) for o in others) + '</p>' + body
            merged = (code, main[1], body, 'B', stars, refs, tuple(bs[0][1][6]), {'boxes': bx, 'hl': hl}, surv[4])
            items[surv[0]] = merged
            for m in mem:
                if m[0] != surv[0]:
                    DROPPED.add(('c%d' % ch, m[0])); ALIAS[('c%d' % ch, m[0])] = ('c%d' % ch, surv[0])

TOPICS = _gp_topics()
TOPICS_IDX = {t[0]: i for i, t in enumerate(TOPICS)}
