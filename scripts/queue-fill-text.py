"""
Fills the placeholder bars in the Queue analysis screen with real copy.

    python3 scripts/queue-fill-text.py --report   # list the bars it finds
    python3 scripts/queue-fill-text.py            # write the filled screen

The exported frame left its Head Information / Skin Information rows and its
suggested-style cards as blank bars. This finds those bars by colour, clears
them, and sets the text the screen was always meant to carry, in Inter at the
size the surrounding UI uses.

Values come from the project deck where the deck states them (face shape Oval,
the 46 and 60 metrics, Taper Fade). Everything else is sample data and is listed
by --report so it can be corrected rather than quietly invented.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/Users/kura/Downloads/ Case study Assests/Queue /iPad Pro 11_ - 9.png")
OUT = ROOT / "public" / "media" / "case" / "queue" / "analysis.png"

INTER = "/Users/kura/Library/Fonts/Inter-Regular.otf"
INTER_SEMI = "/Users/kura/Library/Fonts/Inter-SemiBold.otf"

# Text for the two dark analysis panels, top row down.
HEAD_ROWS = ["Face shape — Oval", "Symmetry — 46", "Proportion — 60"]
SKIN_ROWS = ["Tone — Medium", "Texture — Even", "Condition — Normal"]
# Suggested style cards: (name, one-line description)
STYLES = [
    ("Taper Fade", "Shorter through the sides and back."),
    ("Box Braids", "Sectioned, low upkeep."),
]


def fit(text: str, font_path: str, size: int, max_w: int) -> ImageFont.FreeTypeFont:
    """Largest size at or below `size` whose text fits `max_w`."""
    f = ImageFont.truetype(font_path, size)
    while size > 6 and f.getbbox(text)[2] > max_w:
        size -= 1
        f = ImageFont.truetype(font_path, size)
    return f


def find_bars(a: np.ndarray, y0: int, y1: int, lo: int, hi: int, min_w: int = 30):
    """Rectangles whose luminance sits in [lo, hi] — the placeholder fills."""
    lum = a.mean(2)
    band = (lum[y0:y1] >= lo) & (lum[y0:y1] <= hi)
    boxes, seen = [], np.zeros_like(band, dtype=bool)
    for y in range(band.shape[0]):
        xs = np.where(band[y] & ~seen[y])[0]
        if len(xs) < min_w:
            continue
        # split the row into runs
        splits = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        for run in splits:
            if len(run) < min_w:
                continue
            x_lo, x_hi = int(run[0]), int(run[-1])
            y_end = y
            while y_end + 1 < band.shape[0] and band[y_end + 1, x_lo:x_hi].mean() > 0.8:
                y_end += 1
            seen[y : y_end + 1, x_lo : x_hi + 1] = True
            if y_end - y >= 3:
                boxes.append((x_lo, y + y0, x_hi, y_end + y0))
    return boxes


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)

    # White bars inside the black analysis band, and grey bars on the light cards.
    white_bars = find_bars(a, 186, 320, 200, 255)
    grey_bars = find_bars(a, 320, im.height, 120, 190)

    if args.report:
        print(f"source {im.size[0]}x{im.size[1]}")
        print(f"\nwhite bars in the analysis band ({len(white_bars)}):")
        for b in white_bars:
            print(f"  x{b[0]}-{b[2]}  y{b[1]}-{b[3]}  w{b[2]-b[0]} h{b[3]-b[1]}")
        print(f"\ngrey bars on the style cards ({len(grey_bars)}):")
        for b in grey_bars:
            print(f"  x{b[0]}-{b[2]}  y{b[1]}-{b[3]}  w{b[2]-b[0]} h{b[3]-b[1]}")
        print("\ncopy to be written:")
        for r in HEAD_ROWS:
            print(f"  head  {r}")
        for r in SKIN_ROWS:
            print(f"  skin  {r}   [sample data, not in the deck]")
        for n, d in STYLES:
            print(f"  card  {n} / {d}")
        return

    out = im.copy()
    d = ImageDraw.Draw(out)

    # Left column is Head Information, right column is Skin Information.
    mid = im.width // 2
    left = sorted([b for b in white_bars if b[0] < mid], key=lambda b: b[1])
    right = sorted([b for b in white_bars if b[0] >= mid], key=lambda b: b[1])

    for rows, boxes in ((HEAD_ROWS, left), (SKIN_ROWS, right)):
        for text, box in zip(rows, boxes):
            x0, y0, x1, y1 = box
            # Pad the clear: the bar's anti-aliased edge is a shade darker than
            # the fill, so an exact-size rectangle leaves a 1px outline behind.
            d.rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], fill=(0, 0, 0))
            f = fit(text, INTER, max(7, int((y1 - y0) * 1.25)), im.width - x0 - 8)
            d.text((x0, y0 + (y1 - y0) / 2), text, font=f, fill=(255, 255, 255), anchor="lm")

    # Style cards sit side by side, so the bars group by column, not by row.
    # Sorting by y first pairs one card's name with the other card's name.
    columns: dict[int, list] = {}
    for b in grey_bars:
        key = min(columns, key=lambda k: abs(k - b[0])) if columns else None
        if key is None or abs(key - b[0]) > 40:
            columns[b[0]] = [b]
        else:
            columns[key].append(b)
    pairs = [sorted(v, key=lambda b: b[1]) for _, v in sorted(columns.items())]
    # A card runs until the next card starts, or until the frame edge for the
    # last one — which is what clipped the right-hand description before.
    lefts = sorted(p[0][0] for p in pairs)
    for (name, desc), pair in zip(STYLES, pairs):
        x_start = pair[0][0]
        nxt = next((l for l in lefts if l > x_start), im.width)
        max_w = nxt - x_start - 12
        for text, box, font_path, colour in (
            (name, pair[0], INTER_SEMI, (17, 17, 17)),
            (desc, pair[1], INTER, (90, 90, 90)),
        ):
            x0, y0, x1, y1 = box
            d.rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], fill=(255, 255, 255))
            f = fit(text, font_path, max(7, int((y1 - y0) * 1.2)), max_w)
            d.text((x0, y0 + (y1 - y0) / 2), text, font=f, fill=colour, anchor="lm")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
