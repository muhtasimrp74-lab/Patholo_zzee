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
    order.sort()   # book order (Part A: chapters 2-24, Part B: 13-14)
    return [('c%d' % c, GP_CHAPTERS[c][0], 'hm' if c in HM_CHAPTERS else 'gp', out[c]) for c in order]

# ---------------------------------------------------------------------------------------------
# BOX VIVA (A-cards A1-A10: General Pathology + Haematology) - read from box_viva.txt, which is generated from the
# box viva list by  python3 tools/boxviva_parse.py  (see that file for the line format).
#   Every question carries the A-card(s) it was printed on, how many times it was asked (stars) and the question
#   numbers as printed. They are appended AFTER the written questions, so existing question ids never move.
#   Answers: put them in ANSWERS above, keyed by the question text exactly as written in box_viva.txt.
HM_CHAPTERS = {13, 14}
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

TOPICS = _gp_topics()
