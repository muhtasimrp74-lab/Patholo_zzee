# Fonts

The site uses four typefaces and nothing else (see the "type system" section of `tools/css/plain.css`).

| File | Typeface | Licence |
|---|---|---|
| `tan-buster-bold.woff2` | TAN Buster Bold | Commercial (TanType). Supplied by the site owner; the owner's licence must cover web use. |
| `anton-latin-400-normal.woff2` | Anton | SIL Open Font License 1.1 |
| `oswald-latin-wght-normal.woff2` | Oswald (variable, 200-700) | SIL Open Font License 1.1 |
| `tinos-subset-*.woff2` | Tinos, subset to the characters the content uses | SIL Open Font License 1.1 (`OFL-Tinos.txt`) |

Times New Roman itself is a system font and is not shipped. Where it is installed the browser uses it; elsewhere (Android, Linux)
the page loads Tinos, which has the same metrics, so line breaks match on every device.
