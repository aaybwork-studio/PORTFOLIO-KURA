"""
Normalises the Gemini product imagery into the sizes the case layout serves.

    python3 scripts/promote-product.py --report
    python3 scripts/promote-product.py

Generated frames land in public/media/case/<project>/gen as full size PNG. This
centre-crops each to its slot's ratio, resamples down and writes a progressive
JPEG next to the plates, keeping the original in gen/ so a promotion can be
undone.

Slots are 1760x1100 for full span and 1400x1050 for half. A 16:9 generation
loses a little from its sides going into a 16:10 full slot, which is why every
prompt asks for the subject weighted to the centre.

Videos are deliberately absent. The showreel slots in the case layout are left
empty for hand-made clips rather than generated ones: no video model holds an
interface still across a shot, which is what made the previous reels look wrong.
"""

import argparse
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"

FULL = (1760, 1100)   # 16:10 full span
HALF = (1400, 1050)   # 4:3 half span

# gen stem -> (served filename, size)
PROMOTE = {
    "orbit": {
        "hero2": ("hero.jpg", FULL),
        "p-spaces": ("spaces.jpg", HALF),
        "p-history": ("history.jpg", HALF),
        "p-overlay": ("overlay.jpg", FULL),
        "p-companion": ("companion.jpg", FULL),
    },
    "queue": {
        "p-hero": ("hero.jpg", FULL),
        "p-tryon": ("tryon.jpg", HALF),
        "p-compare": ("compare.jpg", HALF),
        "p-analysis": ("analysis-panel.jpg", FULL),
        "p-stylist": ("stylist.jpg", FULL),
    },
    "memory-bank": {
        "p-hero": ("hero.jpg", FULL),
        "p-library": ("library.jpg", HALF),
        "p-memory": ("memory.jpg", HALF),
        "p-capture": ("capture.jpg", FULL),
        "p-save": ("save.jpg", FULL),
    },
    "guitar-flow": {
        "p-hero": ("headset.jpg", FULL),
        "p-menu": ("menu.jpg", HALF),
        "p-workspace": ("unity-2.jpg", HALF),
        "p-lesson": ("lesson.jpg", FULL),
        "p-play": ("play.jpg", FULL),
    },
    "navaid": {
        "hero2": ("hero-screen.jpg", FULL),
        "p-outdoors": ("outdoors.jpg", HALF),
        "p-manual": ("manual.jpg", HALF),
        "p-location": ("location.jpg", FULL),
        "p-add-chair": ("add-chair.jpg", FULL),
    },
}


def fit(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Centre-crop to the target ratio, then resample to the target size."""
    tw, th = size
    target = tw / th
    w, h = im.size
    if w / h > target:
        new_w = int(round(h * target))
        box = ((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h)
    else:
        new_h = int(round(w / target))
        box = (0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h)
    return im.crop(box).resize(size, Image.LANCZOS)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--only")
    args = ap.parse_args()

    missing = 0
    for project, entries in PROMOTE.items():
        if args.only and project != args.only:
            continue
        gen = CASE / project / "gen"
        for stem, (dest_name, size) in entries.items():
            src = gen / f"{stem}.png"
            dest = CASE / project / dest_name
            if not src.exists():
                print(f"  - {project}/{stem}: not generated")
                missing += 1
                continue

            if args.report:
                with Image.open(src) as im:
                    print(f"  {project}/{stem} {im.size[0]}x{im.size[1]} -> {dest_name} {size[0]}x{size[1]}")
                continue

            # Keep whatever is being replaced, once, so this is reversible.
            backup = gen / f"_prev-{dest_name}"
            if dest.exists() and not backup.exists():
                shutil.copy2(dest, backup)

            with Image.open(src) as im:
                fit(im.convert("RGB"), size).save(dest, "JPEG", quality=90, optimize=True, progressive=True)
            print(f"  ✓ {dest.relative_to(ROOT)}  {size[0]}x{size[1]}")

    if missing:
        print(f"\n  {missing} not generated yet")


if __name__ == "__main__":
    main()
