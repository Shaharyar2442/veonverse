# Leadership Principle artwork

The official Manifesto Icons, one per principle. Each card on the Our Principles
screen loads its file by name.

| Filename          | Principle                        | Source file                                          |
| ----------------- | -------------------------------- | ---------------------------------------------------- |
| `clarity.png`     | Clarity is Our Superpower        | `Manifesto Icons_clarity is superpower.png`          |
| `pioneering.png`  | Our Pioneering Spirit Defines Us | `Manifesto Icons_our pioneering spirit defines us.png` |
| `mediocrity.png`  | We Fight Against Mediocrity      | `Manifesto Icons_we fight against mediocrity.png`    |
| `results.png`     | We Put Results Above Rituals     | `Manifesto Icons_we put results above rituals.png`   |
| `potential.png`   | We Hire for Potential and Drive  | `Manifesto Icons_we hire for potential and drive.png` |
| `courage.png`     | Courage Fuels Our Leadership     | `Manifesto Icons_courage fuels our leadership.png`   |
| `audacious.png`   | We Aim for Audacious Impact      | `Manifesto Icons_we aim for Audacious Impact.png`    |
| `integrity.png`   | We Incentivize with Integrity    | `Manifesto Icons_we incentivize with integrity.png`  |
| `together.png`    | We Stand Strong Together         | `Manifesto Icons_we stand strong together.png`       |
| `persistence.png` | We Never Give Up                 | `Manifesto Icons_we never give up.png`               |

The originals live in `/images` at the repo root.

## How these were prepared

The source art is 1920 x 1920 and 7.5 MB for the set — far too heavy to put ten
of on one screen. Each was resampled to 320 px (LANCZOS, PNG optimised), which
brought the set to 631 KB with no visible loss at the 124 px display size.

To regenerate after replacing a source file:

```python
from PIL import Image
im = Image.open("images/<source>.png").convert("RGBA")
im.thumbnail((320, 320), Image.LANCZOS)
im.save("frontend/public/principles/<name>.png", "PNG", optimize=True)
```

## Two things to know about the artwork

**It is semi-transparent.** Peak alpha runs 207-255 and most of each tile is far
below that, so these are luminous overlays rather than solid tiles. On the dark
card they read as a glow. Put one on a white background and it will look washed
out.

**It is a finished tile, not an icon.** Each file carries its own chamfered
shape, its own background colour and transparent corners, so the card renders it
bare. Only the lucide fallback in `src/data/principleTiles.js` gets a tinted
square behind it, because a bare stroke icon needs something to sit on.

## Per-principle colour

The `color` field in `src/data/principleTiles.js` drives the rule on the card
front and the border and label on the back. Each value was sampled from its
artwork, avoiding the bright centre glow. Replace a file and the colour should
be resampled to match.

## Replacing a file

Drop a new PNG in using the same filename and it is picked up on reload. If a
file is ever missing the card falls back to its lucide mark rather than showing
a broken image.
