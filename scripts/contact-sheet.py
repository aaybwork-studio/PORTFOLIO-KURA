"""
Builds one labelled contact sheet per project from the built case media.

    python3 scripts/contact-sheet.py

Written so the plates can be reviewed a project at a time before they are sent
off for generation — the prompts have to describe what is actually on each
screen, and the filenames alone do not say that.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "media" / "case"
OUT = Path("/private/tmp/claude-501/-Users-kura/803cad36-3e05-4c33-9628-58f9569ffbbe/scratchpad/sheets")

INTER = "/Users/kura/Library/Fonts/Inter-SemiBold.otf"

CELL = 460
LABEL = 30
COLS = 3


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype(INTER, 20)

    for project in ["orbit", "queue", "memory-bank", "guitar-flow", "navaid"]:
        plates = sorted(p for p in (SRC / project).iterdir() if p.suffix in {".jpg", ".png"})
        rows = (len(plates) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * CELL, rows * (CELL + LABEL)), (24, 24, 26))
        draw = ImageDraw.Draw(sheet)

        for i, p in enumerate(plates):
            im = Image.open(p).convert("RGB")
            im.thumbnail((CELL - 12, CELL - 12), Image.LANCZOS)
            x = (i % COLS) * CELL
            y = (i // COLS) * (CELL + LABEL)
            sheet.paste(im, (x + (CELL - im.width) // 2, y + LABEL + (CELL - LABEL - im.height) // 2))
            draw.text((x + 8, y + 6), p.name, font=font, fill=(255, 255, 255))

        dest = OUT / f"{project}.jpg"
        sheet.save(dest, "JPEG", quality=88)
        print(f"{dest}  {len(plates)} plates")


if __name__ == "__main__":
    main()
