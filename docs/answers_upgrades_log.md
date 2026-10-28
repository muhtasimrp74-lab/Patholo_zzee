# Answer upgrades (systemic by-id cards)

Continues the answer-rewrite programme (tools/answers_build_log.md, sessions 1 to 20) for the 224 systemic cards whose answers
live in tools/answers_by_id.json, which that programme did not cover. Upgrades are stored in **tools/answers_upgrades.json**
(tracked and public by the owner's decision, 2026-10-28) and replace the restored private answer for that card at build time
(tools/apply_answers_by_id.py). Gating is unchanged: upgraded answers still go only to private chunks.

Method: keep the existing textbook-derived content, restructure it into the programme's pattern (direct answer first, numbered
or bulleted points, sub-headings, tables for comparisons, bold for key terms, British spelling), remove duplication and inline
[bracketed] glosses, and check every claim against the site's own textbook (tools/textbook_src, Robbins 11th). Claims the
textbook does not contain are dropped and listed below. Existing ink on a rewritten answer is kept but may show as orphaned.

## Batch 1 (Chapter 12, The Heart)

| Card | Question | Textbook passages |
|---|---|---|
| q8 | Components of Fallot's tetralogy | Tetralogy of Fallot, morphology and clinical features (p489-490) |
| q15 | Valve commonly affected by rheumatic fever; Aschoff body | Rheumatic fever and RHD, morphology (p510) |
| q16 | Complications of rheumatic fever | RHD morphology (p508-510); clinical features (p511) |

Dropped or corrected:
- q8: "right heart failure is rare because the right ventricle is decompressed through the VSD" corrected to the textbook's
  "decompressed by the shunting of blood into the left ventricle and aorta" (p490).
- q15: duplicate paragraphs merged; bracketed glosses removed; a stray line break mid-sentence removed.
- q16: "the valve damage is cumulative" dropped (not in the textbook); replaced by the textbook's "the same manifestations are
  likely to appear with each recurrent attack" (p511). The note that the arthritis, chorea and skin lesions resolve was left out
  as outside the question (complications).
