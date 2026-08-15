"""
Fills the placeholder bars on the Queue browse screen with style names.

    python3 scripts/tryon-fill-text.py --report
    python3 scripts/tryon-fill-text.py

The exported Hairstyles grid left every card's name and meta line as a grey
bar. Each card pairs a wide bar (the style name) with a narrower one below it
(a short qualifier), so the bars are grouped into pairs by proximity and filled
in reading order.

None of these names come from the deck — the deck only ever states Taper Fade
and Box Braids. The rest are sample data chosen to match the photograph on each
card, and --report lists them so they can be corrected rather than left as
quiet inventions.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "media" / "case" / "queue" / "tryon.jpg"
OUT = ROOT / "public" / "media" / "case" / "queue" / "tryon-filled.png"

INTER = "/Users/kura/Library/Fonts/Inter-Regular.otf"
INTER_SEMI = "/Users/kura/Library/Fonts/Inter-SemiBold.otf"

# In reading order: left column top to bottom, then right column.
CARDS = [
    ("Top Knot", "Gathered high, off the neck."),
    ("Sleek Bob", "Blunt ends, chin length."),
    ("Natural Curls", "Loose, worn long."),
    ("Box Braids", "Sectioned, low upkeep."),
    ("Taper Fade", "Shorter through the sides and back."),
    ("Buzz Cut", "One length, clipper short."),
]

# The placeholder fill is a flat mid grey on a very pale panel.
GREY_LO, GREY_HI = 150, 205


def fit(text: str, font_path: str, size: int, max_w: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(font_path, size)
    while size > 6 and f.getbbox(text)[2] > max_w:
        size -= 1
        f = ImageFont.truetype(font_path, size)
    return f


def local_fill(a: np.ndarray, box, pad: int = 3):
    """Background colour immediately around a bar.

    The panel is not one flat tone — it carries a soft gradient — so clearing
    every bar to a single sampled colour leaves visible patches. Taking the
    median of a thin ring around each bar matches that bar's own surroundings.
    """
    x0, y0, x1, y1 = box
    h, w = a.shape[:2]
    top = a[max(0, y0 - pad - 2) : max(1, y0 - 2), x0:x1]
    bot = a[min(h - 1, y1 + 2) : min(h, y1 + pad + 2), x0:x1]
    # Left of the bar is the card's own gutter, which stays panel even where the
    # layout's decorative photograph runs underneath the row. It is the only
    # sample that is reliable for every card, so it carries the most weight.
    left = a[y0 : y1 + 1, max(0, x0 - 14) : max(1, x0 - 2)]
    samples = [left.reshape(-1, 3)] * 2 + [top.reshape(-1, 3), bot.reshape(-1, 3)]
    ring = np.concatenate([s for s in samples if s.size])
    return tuple(int(v) for v in np.median(ring, axis=0))


def merge(bars, gap: int = 8):
    """Join fragments of one bar back together.

    A bar whose top edge lands a pixel lower on one side is picked up as two
    adjacent runs. Left unmerged, the second fragment looks like a stray and
    gets cleared using a colour sampled from the first — grey filled with grey.
    """
    out = []
    for b in sorted(bars, key=lambda b: (b[0], b[1])):
        for i, c in enumerate(out):
            vertical = min(b[3], c[3]) - max(b[1], c[1]) > 0.6 * min(b[3] - b[1], c[3] - c[1])
            horizontal = b[0] - c[2] <= gap and c[0] - b[2] <= gap
            if vertical and horizontal:
                out[i] = (min(b[0], c[0]), min(b[1], c[1]), max(b[2], c[2]), max(b[3], c[3]))
                break
        else:
            out.append(b)
    return out


def flat_run(a: np.ndarray, box, bg, cap: int = 460) -> int:
    """Width available before the bar's background stops being uniform."""
    x0, y0, x1, y1 = box
    ref = np.array(bg, dtype=int)
    rows = a[max(0, y0 - 2) : y1 + 3]
    for x in range(x1 + 2, min(a.shape[1], x0 + cap)):
        if np.abs(rows[:, x] - ref).max() > 26:
            return max(60, x - x0 - 10)
    return max(60, min(a.shape[1] - x0 - 14, cap))


def find_bars(a: np.ndarray, min_w: int = 40):
    """Flat grey rectangles, returned as (x0, y0, x1, y1)."""
    lum = a.mean(2)
    # A placeholder bar is flat: its three channels sit on top of each other.
    flat = np.ptp(a, axis=2) < 12
    band = (lum >= GREY_LO) & (lum <= GREY_HI) & flat
    boxes, seen = [], np.zeros_like(band, dtype=bool)
    for y in range(band.shape[0]):
        xs = np.where(band[y] & ~seen[y])[0]
        if len(xs) < min_w:
            continue
        for run in np.split(xs, np.where(np.diff(xs) > 1)[0] + 1):
            if len(run) < min_w:
                continue
            x0, x1 = int(run[0]), int(run[-1])
            y1 = y
            while y1 + 1 < band.shape[0] and band[y1 + 1, x0:x1].mean() > 0.8:
                y1 += 1
            seen[y : y1 + 1, x0 : x1 + 1] = True
            if y1 - y >= 4:
                boxes.append((x0, y, x1, y1))
    return boxes


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    bars = merge(find_bars(a))

    # Pair each wide name bar with the narrower meta bar directly beneath it.
    bars.sort(key=lambda b: (b[1], b[0]))
    pairs, used = [], set()
    for i, b in enumerate(bars):
        if i in used:
            continue
        below = [
            (j, c) for j, c in enumerate(bars)
            if j not in used and j != i and 0 < c[1] - b[3] < 40 and abs(c[0] - b[0]) < 14
        ]
        if below:
            j, c = min(below, key=lambda t: t[1][1])
            used.update({i, j})
            pairs.append((b, c))

    # Columns first, then rows within a column: the grid reads down each side.
    mid = im.width // 2
    pairs.sort(key=lambda p: (p[0][0] >= mid, p[0][1]))

    if args.report:
        print(f"source {im.size[0]}x{im.size[1]}  bars {len(bars)}  pairs {len(pairs)}")
        for (n, m), (name, desc) in zip(pairs, CARDS):
            print(f"  name x{n[0]}-{n[2]} y{n[1]}-{n[3]}   meta x{m[0]}-{m[2]}   ->  {name} / {desc}")
        if len(pairs) != len(CARDS):
            print(f"  ! {len(pairs)} pairs found but {len(CARDS)} cards declared")
        print("\n  [sample data — only Taper Fade and Box Braids come from the deck]")
        return

    out = im.copy()
    d = ImageDraw.Draw(out)

    # A bar that never found a partner is a stray placeholder with no copy to
    # carry. Leaving it renders as a grey block beside real text, so clear it.
    paired = {id(b) for pair in pairs for b in pair}
    for b in bars:
        if id(b) not in paired:
            d.rectangle([b[0] - 2, b[1] - 3, b[2] + 2, b[3] + 3], fill=local_fill(a, b))

    # Two equal columns, so a card's text may run until the next card starts.
    # Deriving the pitch from the two columns keeps this honest if the grid
    # changes, rather than hard-coding a pixel width that happens to fit today.
    xs = sorted({p[0][0] for p in pairs})
    pitch = (xs[-1] - xs[0]) if len(xs) > 1 else im.width // 2
    name_px = max(14, int((pairs[0][0][3] - pairs[0][0][1]) * 1.05))
    desc_px = max(10, int(name_px * 0.62))

    for (nb, mb), (name, desc) in zip(pairs, CARDS):
        for text, box, path, colour, px in (
            (name, nb, INTER_SEMI, (22, 22, 24), name_px),
            (desc, mb, INTER, (110, 112, 118), desc_px),
        ):
            x0, y0, x1, y1 = box
            bg = local_fill(a, box)
            # The right-hand column sits over the layout's decorative product
            # photograph, so a card's text has to stop where its own flat
            # background does, not at the next column.
            limit = min(pitch - 30, im.width - x0 - 14, flat_run(a, box, bg))
            # Pad the clear: the bar's anti-aliased edge survives an exact rect.
            d.rectangle([x0 - 2, y0 - 3, x1 + 2, y1 + 3], fill=bg)
            f = fit(text, path, px, limit)
            # Where the decorative photograph leaves a card no room, a shrunken
            # caption reads worse than none: clear the bar and leave it out.
            if f.size < px * 0.7 and path == INTER:
                continue
            d.text((x0, (y0 + y1) / 2), text, font=f, fill=colour, anchor="lm")

    out.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}  ({len(pairs)} cards filled)")


if __name__ == "__main__":
    main()
