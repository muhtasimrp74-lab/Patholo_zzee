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
TOPICS = []
