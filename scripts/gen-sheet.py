"""
Contact sheet of generated frames, for reviewing a batch at a glance.

    python3 scripts/gen-sheet.py orbit queue
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"
OUT = Path("/private/tmp/claude-501/-Users-kura/803cad36-3e05-4c33-9628-58f9569ffbbe/sheets")
INTER = "/Users/kura/Library/Fonts/Inter-SemiBold.otf"

CELL = 620
LABEL = 34
COLS = 2


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype(INTER, 22)

    for project in sys.argv[1:]:
        gen = CASE / project / "gen"
        plates = sorted(p for p in gen.iterdir() if p.suffix == ".png" and not p.name.startswith("_"))
        if not plates:
            print(f"{project}: nothing generated")
            continue
        rows = (len(plates) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * CELL, rows * (CELL + LABEL)), (20, 20, 22))
        draw = ImageDraw.Draw(sheet)

        for i, p in enumerate(plates):
            im = Image.open(p).convert("RGB")
            im.thumbnail((CELL - 14, CELL - 14), Image.LANCZOS)
            x, y = (i % COLS) * CELL, (i // COLS) * (CELL + LABEL)
            sheet.paste(im, (x + (CELL - im.width) // 2, y + LABEL + (CELL - LABEL - im.height) // 2))
            draw.text((x + 10, y + 7), f"{project}/{p.stem}", font=font, fill=(255, 255, 255))

        dest = OUT / f"gen-{project}.jpg"
        sheet.save(dest, "JPEG", quality=86)
        print(f"{dest}  {len(plates)}")


if __name__ == "__main__":
    main()
