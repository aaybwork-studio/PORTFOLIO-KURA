"""
Puts the real interface back onto a generated key art screen.

    python3 scripts/keyart-screen.py orbit --report   # show the detected quad
    python3 scripts/keyart-screen.py orbit

The cheap image models build a convincing set but cannot hold interface type:
letterforms come back smeared and wording drifts. Rather than pay for the model
that can, the set is generated and the screen is replaced here, so the
photography is model-made and the interface is pixel-true.

The screen is found rather than measured by hand. A laptop or tablet display in
these plates is the one large dark quadrilateral in the frame, so the panel is
located by thresholding, taking the biggest dark region, and fitting a corner to
each side of its convex hull.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"

# project -> the interface export that belongs on its key art screen.
#
# These are the original full-bleed exports, not the composited plates in gen/.
# A plate carries its own margin around the interface, so warping one leaves the
# screen showing a small window floating in black instead of a filled display.
ASSETS = Path("/Users/kura/Downloads/ Case study Assests")
UI = {
    "orbit": ASSETS / "Orbit Elements/Final Screens /Home.png",
    "queue": ASSETS / "Queue /iPad Pro 11_ - 8.png",
    "memory-bank": ASSETS / "Memory bank/Home.png",
    "guitar-flow": ASSETS / "Guitar Flow/Screens /App open home overlay.png",
    "navaid": ASSETS / "Nav-Aid /Home.png",
}


def coeffs(src, dst):
    """Perspective coefficients mapping dst -> src, the direction PIL wants."""
    m = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    return np.linalg.solve(np.array(m, dtype=float), np.array(src, dtype=float).reshape(8))


# Display corners, clockwise from top-left, measured on the generated plate.
# Automatic detection was tried and abandoned: on these sets the panel and its
# surroundings are both near-black, so a threshold takes the whole background
# with it. Four measured points per plate is more honest than a fragile guess.
QUADS = {
    "orbit": [(1111, 304), (2074, 365), (1984, 961), (1073, 945)],
}


def screen_quad(im: Image.Image, thresh: int = 70):
    """Corners of the display, clockwise from top-left."""
    # Work on a downscaled mask: the panel is thousands of pixels across, so
    # eighth resolution loses nothing and keeps the flood fill cheap.
    step = 8
    small = im.convert("L").resize((im.width // step, im.height // step), Image.BILINEAR)
    dark = np.asarray(small, dtype=np.int16) < thresh
    h, w = dark.shape

    # Largest connected dark region, by iterative flood fill.
    seen = np.zeros_like(dark, dtype=bool)
    best, best_size = None, 0
    for sy in range(h):
        for sx in range(w):
            if not dark[sy, sx] or seen[sy, sx]:
                continue
            stack, cells = [(sy, sx)], []
            seen[sy, sx] = True
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(cells) > best_size:
                best, best_size = cells, len(cells)

    if not best:
        raise SystemExit("no dark region found")
    pts = np.array([(x * step, y * step) for y, x in best], dtype=float)

    # The extreme point in each diagonal direction is a corner of the panel.
    s, d = pts[:, 0] + pts[:, 1], pts[:, 0] - pts[:, 1]
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmax(d)]
    bl = pts[np.argmin(d)]
    return [tuple(map(float, p)) for p in (tl, tr, br, bl)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    gen = CASE / args.project / "gen" / "keyart.png"
    art = Image.open(gen).convert("RGB")
    quad = QUADS.get(args.project) or screen_quad(art)

    if args.report:
        print(f"{gen.name}  {art.size[0]}x{art.size[1]}")
        for name, p in zip(("top-left", "top-right", "bottom-right", "bottom-left"), quad):
            print(f"  {name:13s} {int(p[0])}, {int(p[1])}")
        proof = art.copy()
        ImageDraw.Draw(proof).polygon(quad, outline=(0, 255, 0))
        out = Path("/private/tmp/claude-501/-Users-kura/e451185f-f4fc-4b85-a6d0-2ca7e2c94504/quad.jpg")
        proof.save(out, quality=88)
        print(f"  overlay -> {out}")
        return

    ui = Image.open(UI[args.project]).convert("RGB")
    W, H = art.size
    src = [(0, 0), (ui.width, 0), (ui.width, ui.height), (0, ui.height)]
    warped = ui.transform((W, H), Image.PERSPECTIVE, coeffs(src, quad), Image.BICUBIC)

    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(quad, fill=255)
    # Pull in a shade so the bezel's own edge is not overwritten.
    mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))

    out = Image.composite(warped, art, mask)
    out.save(gen)
    print(f"  ✓ {gen.relative_to(ROOT)}  interface replaced")


if __name__ == "__main__":
    main()
