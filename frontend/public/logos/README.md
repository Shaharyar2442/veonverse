# OpCo brand logos

Drop the official artwork here using these exact filenames. The app picks each
file up automatically — no code change needed. Until a file exists, the app
falls back to the hand-drawn SVG in `src/components/BrandLogos.jsx`.

| Filename         | Logo          |
| ---------------- | ------------- |
| `veon.jpg`       | VEON          |
| `mobilink.jpg`   | Mobilink Bank |
| `jazzworld.jpg`  | JazzWorld     |
| `kyivstar.jpg`   | Kyivstar      |
| `banglalink.jpg` | Banglalink    |
| `beeline.jpg`    | Beeline       |

The current files carry a `.jpg` extension but are actually PNG/WebP data.
Browsers sniff the content, so they render correctly — the name just has to
match the `file=` prop in `src/components/BrandLogos.jsx`.

## Requirements

- **Transparent background.** These sit on a near-black page, so a logo saved on
  a white background renders as a white box. Use a transparent PNG (or SVG).
- **Square-ish crop, mark only.** They render as small squares (24–38 px), so
  crop to the symbol and leave out the wordmark — a wide "MobilinkBank" lockup
  shrinks to an unreadable sliver.
- **Roughly 256×256 px** is plenty; anything larger is wasted bytes.
- To use `.svg` instead of `.png`, change the extension in the `file=` prop for
  that logo in `src/components/BrandLogos.jsx`.
