"""
Normalises generated product imagery into the sizes the case layout serves.

    python3 scripts/promote-product.py --report
    python3 scripts/promote-product.py

Generated frames land in public/media/case/<project>/gen as full size PNG. This
centre-crops each to its slot's ratio, resamples down and writes a progressive
JPEG next to the plates, keeping the original in gen/ so a promotion can be
undone.

Served sizes are larger than the layout's CSS width on purpose. The frames are
1760 and 1400 wide, so these land at roughly 1.4x for a retina display rather
than being resampled up by the browser.

Videos are absent by design. One showreel slot per project sits directly under
the hero and is left empty for a hand-made clip: no video model holds an
interface still across a shot, which is what made the earlier generated reels
read as broken.
"""

import argparse
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"

FULL = (2400, 1500)   # 16:10 full span
HALF = (1800, 1350)   # 4:3 half span
HERO = (2800, 1750)   # 16:10 page header and work card

# gen stem -> (served filename, size)
PROMOTE = {
    "orbit": {
        "hero2": ("hero.jpg", HERO),
        "p-spaces": ("spaces.jpg", HALF),
        "p-history": ("history.jpg", HALF),
        "p-overlay": ("overlay.jpg", HALF),
        "p-companion": ("companion.jpg", HALF),
        "m-lineup": ("m-lineup.jpg", FULL),
        "m-devices": ("m-devices.jpg", FULL),
        "m-array": ("m-array.jpg", FULL),
        "m-detail": ("m-detail.jpg", HALF),
        "m-flatlay": ("m-flatlay.jpg", HALF),
    },
    "queue": {
        "p-hero": ("hero.jpg", HERO),
        "p-tryon": ("tryon.jpg", HALF),
        "p-compare": ("compare.jpg", HALF),
        "p-analysis": ("analysis-panel.jpg", HALF),
        "p-stylist": ("stylist.jpg", HALF),
        "m-lineup": ("m-lineup.jpg", FULL),
        "m-devices": ("m-devices.jpg", FULL),
        "m-array": ("m-array.jpg", FULL),
        "m-detail": ("m-detail.jpg", HALF),
        "m-held": ("m-held.jpg", HALF),
    },
    "memory-bank": {
        "p-hero": ("hero.jpg", HERO),
        "p-library": ("library.jpg", HALF),
        "p-memory": ("memory.jpg", HALF),
        "p-capture": ("capture.jpg", HALF),
        "p-save": ("save.jpg", HALF),
        "m-lineup": ("m-lineup.jpg", FULL),
        "m-array": ("m-array.jpg", FULL),
        "m-flatlay": ("m-flatlay.jpg", FULL),
        "m-detail": ("m-detail.jpg", HALF),
        "m-prints": ("m-prints.jpg", HALF),
    },
    "guitar-flow": {
        "p-hero": ("headset.jpg", HERO),
        "p-menu": ("menu.jpg", HALF),
        "p-workspace": ("unity-2.jpg", HALF),
        "p-lesson": ("lesson.jpg", HALF),
        "p-play": ("play.jpg", HALF),
        "m-lineup": ("m-lineup.jpg", FULL),
        "m-devices": ("m-devices.jpg", FULL),
        "m-array": ("m-array.jpg", FULL),
        "m-detail": ("m-detail.jpg", HALF),
        "m-room": ("m-room.jpg", HALF),
    },
    "navaid": {
        # The full-chair shot never resolved: at that distance the mounted
        # tablet is small enough that the model kept inventing an oversized
        # screen. This hero moves in close on the control unit instead.
        "m-hero": ("hero-screen.jpg", HERO),
        "p-outdoors": ("outdoors.jpg", HALF),
        "p-manual": ("manual.jpg", HALF),
        "p-location": ("location.jpg", HALF),
        "p-add-chair": ("add-chair.jpg", FULL),
        "m-lineup": ("m-lineup.jpg", FULL),
        "m-detail": ("m-detail.jpg", HALF),
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

            backup = gen / f"_prev-{dest_name}"
            if dest.exists() and not backup.exists():
                shutil.copy2(dest, backup)

            with Image.open(src) as im:
                fit(im.convert("RGB"), size).save(dest, "JPEG", quality=88, optimize=True, progressive=True)
            print(f"  ✓ {dest.relative_to(ROOT)}  {size[0]}x{size[1]}")

    if missing:
        print(f"\n  {missing} not generated yet")


if __name__ == "__main__":
    main()
