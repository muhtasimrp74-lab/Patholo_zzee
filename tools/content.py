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
# GENERAL PATHOLOGY - written questions, read from gp_written.txt (the list as you send it).
#   * To ADD questions: add lines to gp_written.txt under the right heading (or a new heading, see HEADINGS), then rebuild.
#   * To ADD ANSWERS: put them in ANSWERS below, keyed by the question text exactly as in gp_written.txt
#     (without the "(DU-..)" tag and stars), e.g.  'Define necrosis.': P('Necrosis', '...') + UL([...])
#   * Until an answer exists, the question shows "Answer to be added."
import os, re as _re
HEADINGS = {  # heading in gp_written.txt -> (topic id, topic name)
    'CELL INJURY & FREE RADICALS': ('G1', 'Cell Injury and Free Radicals'),
    'NECROSIS': ('G2', 'Necrosis'),
    'APOPTOSIS': ('G3', 'Apoptosis'),
    'HYPERTROPHY, HYPERPLASIA, ATROPHY AND METAPLASIA': ('G4', 'Hypertrophy, Hyperplasia and Atrophy'),
    'METAPLASIA': ('G5', 'Metaplasia'),
    'PATHOLOGICAL CALCIFICATION': ('G6', 'Pathological Calcification'),
}
ANSWERS = {}

def _gp_topics():
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gp_written.txt')
    order, topics, cur = [], {}, None
    for raw in open(src, encoding='utf8'):
        line = raw.strip()
        if not line or line == 'GENERAL PATHOLOGY':
            continue
        if line in HEADINGS:
            cur = HEADINGS[line]
            if cur[0] not in topics:
                topics[cur[0]] = (cur[1], []); order.append(cur[0])
            continue
        assert cur, 'question before any heading: ' + line
        m = _re.match(r'^(.*?)\s*\(((?:DU|BSMMU)[^)]*)\)\s*(\u2b50*)\s*$', line)
        q, ref, stars = (m.group(1), m.group(2), m.group(3)) if m else (line.rstrip('\u2b50 ').strip(), '', '')
        body = ANSWERS.get(q) or '<p>Answer to be added.</p>'
        # written questions have no A/B card code (those belong to the viva board): code is left blank
        topics[cur[0]][1].append(('', q, body, 'W', len(stars), ref))
    return [(t, topics[t][0], 'gp', topics[t][1]) for t in order]

TOPICS = _gp_topics()
