"""
Puts the real Nav-Aid interface onto the 3D chair's screen.

    python3 scripts/navaid-screen-composite.py

The turntable render leaves the chair's display as a flat dark panel. This
warps the actual UI export onto that panel with a perspective transform, so the
hero shows the project rather than a clay model of it.

The stand pole passes in front of the screen. Rather than masking it by hand,
the composite only writes where the render is dark: the panel is near-black and
every occluder in front of it — pole, armrest, seat edge — is bright, so a
luminance threshold separates them cleanly.
"""

from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
HERO = ROOT / "public" / "media" / "case" / "navaid" / "hero.jpg"
UI = Path("/Users/kura/Downloads/ Case study Assests/Nav-Aid /While Self Driving.png")
OUT = ROOT / "public" / "media" / "case" / "navaid" / "hero-screen.jpg"

# Panel corners in hero.jpg, clockwise from top-left, measured off a 2x zoom.
QUAD = [(450, 172), (660, 176), (667, 290), (491, 300)]

# Anything brighter than this inside the panel is something in front of it.
OCCLUDER_LUMA = 70


def coeffs(src, dst):
    """Perspective coefficients mapping dst -> src, which is the direction
    PIL's transform wants."""
    m = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    A = np.array(m, dtype=float)
    B = np.array(src, dtype=float).reshape(8)
    return np.linalg.solve(A, B)


def main() -> None:
    hero = Image.open(HERO).convert("RGB")
    ui = Image.open(UI).convert("RGB")
    W, H = hero.size

    # Warp the UI so its own corners land on the panel's corners.
    src = [(0, 0), (ui.width, 0), (ui.width, ui.height), (0, ui.height)]
    warped = ui.transform((W, H), Image.PERSPECTIVE, coeffs(src, QUAD), Image.BICUBIC)

    # Screen-shaped mask: inside the quad, and only where the render is dark.
    quad_mask = Image.new("L", (W, H), 0)
    from PIL import ImageDraw

    ImageDraw.Draw(quad_mask).polygon(QUAD, fill=255)

    luma = np.asarray(hero.convert("L"), dtype=np.int16)
    dark = ((luma < OCCLUDER_LUMA) * 255).astype(np.uint8)
    mask = np.minimum(np.asarray(quad_mask), dark)
    mask_img = Image.fromarray(mask, "L").filter(ImageFilter.GaussianBlur(0.6))

    out = Image.composite(warped, hero, mask_img)

    # A screen emits light. Without a little bloom the panel reads as a sticker.
    glow = Image.composite(warped, Image.new("RGB", (W, H), (0, 0, 0)), mask_img)
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    out = Image.blend(out, Image.blend(out, glow, 0.0), 0.0)
    out = Image.fromarray(
        np.clip(np.asarray(out, dtype=np.int16) + (np.asarray(glow, dtype=np.int16) * 0.28), 0, 255).astype(np.uint8)
    )

    out.save(OUT, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"wrote {OUT.relative_to(ROOT)}  ({out.size[0]}x{out.size[1]})")
    print(f"panel pixels written: {int((mask > 0).sum())}")


if __name__ == "__main__":
    main()
