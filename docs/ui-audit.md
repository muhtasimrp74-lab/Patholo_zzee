# UI audit (before) — 13 screens at 390, 800 and 1280 px

Method: screenshots plus measured checks in Chromium (contrast, target size, overflow, fonts, radii). Content is English only (no Bangla text in the UI or chunks).

## Colour
- Palette is cohesive (ivory, paper, plum, burgundy, rose) and measured body/muted text passes AA (muted #6F5C6C on ivory about 5.4:1). No pure black or white on light pages.
- Gating UI added a second error colour and plain grey borders on some states; burgundy is used for both primary buttons and prices, so price and action compete.
- Primary vs secondary actions in dialogs are clear; on the Account page "Remove" and "Sign out" look the same weight as navigation.

## Typography
- Five families load (Hanken Grotesk, DM Serif Display, Newsreader, Inter, Caveat). Headings use DM Serif Display at weight 400, but the gating dialogs ask for 700, so the browser fakes bold: heavy, off-brand titles.
- Dialog body copy is 16 px with 1.5 line height (fine); receipt figures are not tabular in every row.

## Spacing and layout
- No horizontal scroll on any screen. Fixed top bar and bottom nav do not cover dialogs; the page body has bottom padding for the nav.
- Account page is narrow and left-hugging on desktop; section spacing differs from other pages.
- On desktop, answers are open by default, so a locked topic repeats a full lock box (text + button) in every card: noisy.

## Components
- Payment dialog titles show a focus rectangle when the dialog opens (title receives focus, global focus style wins).
- Close (×) buttons are 40 px; app toolbar icons are 25 x 32 px (below the 44 px target) on phones.
- Radii in use: 9, 10, 12, 16, 18 px, 50% and 999 px: no scale.
- Locked answers have no icon; the lock reads as an error box, not as premium content.

## States
- Loading is plain text ("Loading…"); no skeletons. Disabled buttons only dim. Focus rings exist but vary.
- Error copy is clear after the earlier pass.

## Motion
- Dialogs, notices and plan selection appear with no transition. The app has its own animations; gating UI has none and nothing checks prefers-reduced-motion.

## Polish details
- theme-color meta (#1C1219), SVG favicon, viewport-fit=cover and lang=en are present.
- Gating UI uses text glyphs (×) while the app uses stroked SVG icons.

## Mobile feel
- Bottom nav and primary CTAs are thumb-reachable. Dialogs fit at 390 px; long plan lists still fit without scrolling.
- Safe-area insets: the app uses viewport-fit=cover; gating dialogs do not add inset padding (fine while centred).

## Scope decision
The app's own screens (home, topics, cards, MCQ, menu, footer) are already consistent and mostly pass. Their CSS lives in the private base HTML, so the work below targets the gating layer (sign-in, plans, payment states, account, locked content) plus app-wide focus, target size and reduced-motion fixes that can be layered on safely.

## After (this pass)
- Tokens: tools/zz.css opens with one token set (accent, surfaces, ink, hairlines, type scale, spacing 4-32, radii 10/14/20/pill, two shadows, 150/220 ms motion) built on the app palette; every gating screen uses only these.
- Dialogs: brand serif titles at their real weight (no fake bold), 48 px inputs and buttons, 44 px stroked close icon, title receives focus without a ring, scrim with light blur, 220 ms rise-in.
- Plans: Everything first with a "Best value" badge and the computed saving, one line on what each plan includes, tabular prices.
- Locked content: lock icon in a soft accent circle; locked answers show blurred placeholder lines (CSS only, no real text) under a one-line notice; topic notice above the questions.
- States: shimmer skeletons replace "Loading..." for answers and MCQs; receipt has a check mark; disabled and pressed states; all motion off under prefers-reduced-motion.
- Dark theme: same components through the app variables; accent text and icons switch to rose for contrast.
- Left alone (deliberately): the app's own header toolbar icons (25 x 32 px; enlarging them overflows the 390 px header), the five-font stack, and the app's page CSS, which lives in the private base HTML.
