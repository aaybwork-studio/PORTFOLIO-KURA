"""
Builds the design system plate that closes each case study.

    python3 scripts/style-guide.py

Every value here is the project's own. Colours were read out of the style guide
files in the assets folder, or sampled from the interface itself where a project
never had a guide, and the hex is printed as measured rather than as labelled —
Memory Bank's guide mislabels two of its own swatches, so its printed values are
not trustworthy on their own.

Typography is handled two ways. Where a project uses Inter the specimen is set
natively, because Inter is installed. Orbit's Syncopate and Space Grotesk are
not, so rather than fake them in a substitute the real typography panel is
lifted out of that project's own style guide and placed as artwork. Memory
Bank's panel is lifted for the same reason: its guide already sets out the scale
better than a rebuild would.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"
ASSETS = Path("/Users/kura/Downloads/ Case study Assests")

F = "/Users/kura/Library/Fonts/Inter-{}.otf"
W, H = 1760, 1100
PAD = 96

# (label, hex). Read from each project's own guide, or sampled from its screens.
PALETTES = {
    "orbit": [
        ("Deep Space", "#0A0A0A"), ("Industrial Panel", "#0E0E0E"),
        ("Active Onyx", "#0D0D0D"), ("Border Slate", "#1A1A1A"),
        ("Orbit Orange", "#FF4500"), ("Machine Green", "#00FF94"),
        ("Data Blue", "#3B82F6"), ("Dimmed Gray", "#666666"),
    ],
    "queue": [
        ("Primary", "#FD7C54"), ("Surface", "#FFFFFF"), ("Ink", "#000000"),
    ],
    "memory-bank": [
        ("Main / Blue", "#1A73E8"), ("BG / White", "#F1F3F4"),
        ("Primary text", "#202124"), ("Metadata text", "#5F6368"),
        ("Joy", "#F9C74F"), ("Calm", "#4D9FEC"), ("Love", "#E7669A"),
        ("Bittersweet", "#F9844A"), ("Nostalgia", "#43AA8B"),
        ("Success", "#34A853"), ("Error", "#EA4335"),
    ],
    "guitar-flow": [
        ("Signal Cyan", "#00D8FC"), ("Panel Teal", "#3C7884"),
        ("Deep Blue", "#0C3CB4"), ("Muted Steel", "#90B4C0"),
        ("Off White", "#FCFCFC"), ("Black", "#000000"),
    ],
    "navaid": [
        ("Ink", "#000000"), ("Panel", "#27292D"),
        ("Alert", "#D60202"), ("Surface", "#FFFFFF"),
    ],
}

# Projects whose typography panel is lifted from their own guide, because the
# families are not installed here and a substitute would misrepresent them.
# (source file, crop as fractions of that file, and the panel's own background)
# Crops are kept narrow on purpose: a full-width strip scales down to an
# unreadable band once it is fitted to the column, so only the specimen cards
# themselves are taken.
LIFTED = {
    "orbit": (ASSETS / "Orbit Elements/Style Guide.png", (0.090, 0.160, 0.272, 0.400), "#0A0A0A"),
    "memory-bank": (ASSETS / "Memory bank/Style Guide Part 1.png", (0.036, 0.192, 0.336, 0.354), "#FFFFFF"),
}

# Set natively: these three are Inter, which is installed.
# (role, weight name, px in the real interface)
SCALES = {
    "queue": [("Display", "SemiBold", 32), ("Heading", "SemiBold", 22), ("Body", "Regular", 16), ("Caption", "Regular", 13)],
    "guitar-flow": [("Display", "Bold", 34), ("Heading", "Bold", 22), ("Body", "Regular", 16), ("Label", "Medium", 14)],
    "navaid": [("Display", "Bold", 30), ("Heading", "SemiBold", 22), ("Body", "Regular", 17), ("Label", "Medium", 14)],
}

# Plate background and text colours, taken from each project's own base tone.
THEME = {
    "orbit": ("#0A0A0A", "#FFFFFF", "#666666"),
    "queue": ("#0B0B0C", "#FFFFFF", "#8A8A90"),
    "memory-bank": ("#F1F3F4", "#202124", "#5F6368"),
    "guitar-flow": ("#0C1A1E", "#FCFCFC", "#90B4C0"),
    "navaid": ("#000000", "#FFFFFF", "#8A8C90"),
}

TYPE_NAME = {
    "orbit": "Syncopate  ·  Space Grotesk",
    "queue": "Inter",
    "memory-bank": "Inter",
    "guitar-flow": "Inter",
    "navaid": "Inter",
}


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(F.format(weight), size)


def hex_rgb(s: str) -> tuple[int, int, int]:
    s = s.lstrip("#")
    return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (c / 255 for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def rule(d: ImageDraw.ImageDraw, x0: int, y: int, x1: int, colour) -> None:
    d.line([(x0, y), (x1, y)], fill=colour, width=1)


def swatches(d: ImageDraw.ImageDraw, im: Image.Image, project: str, x: int, y: int, width: int, ink, dim):
    """Colour grid. Each chip carries its own hex, set in whichever of black or
    white actually reads on it."""
    items = PALETTES[project]
    cols = 4 if len(items) > 6 else 3 if len(items) > 4 else len(items)
    gap = 22
    cw = (width - gap * (cols - 1)) // cols
    ch = 168
    for i, (name, hx) in enumerate(items):
        cx = x + (i % cols) * (cw + gap)
        cy = y + (i // cols) * (ch + 62)
        rgb = hex_rgb(hx)
        d.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=10, fill=rgb)
        # A near-background chip would otherwise vanish into the plate.
        if abs(luminance(rgb) - luminance(hex_rgb(THEME[project][0]))) < 0.06:
            d.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=10, outline=dim, width=1)
        on = (255, 255, 255) if luminance(rgb) < 0.55 else (0, 0, 0)
        d.text((cx + 16, cy + ch - 30), hx.upper(), font=font("Medium", 17), fill=on)
        d.text((cx, cy + ch + 16), name, font=font("Regular", 17), fill=dim)
    rows = (len(items) + cols - 1) // cols
    return y + rows * (ch + 62)


def build(project: str) -> Path:
    bg, ink, dim = (hex_rgb(c) for c in THEME[project])
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)

    d.text((PAD, PAD), "DESIGN SYSTEM", font=font("SemiBold", 17), fill=dim)
    rule(d, PAD, PAD + 42, W - PAD, dim)

    # Left column: typography.
    lx, ly = PAD, PAD + 96
    col_w = 700
    d.text((lx, ly), "TYPOGRAPHY", font=font("SemiBold", 15), fill=dim)
    d.text((lx, ly + 34), TYPE_NAME[project], font=font("SemiBold", 42), fill=ink)

    if project in LIFTED:
        src, box, panel_bg = LIFTED[project]
        art = Image.open(src).convert("RGB")
        aw, ah = art.size
        crop = art.crop((int(aw * box[0]), int(ah * box[1]), int(aw * box[2]), int(ah * box[3])))
        crop.thumbnail((col_w, 540), Image.LANCZOS)
        im.paste(crop, (lx, ly + 128))
    else:
        ty = ly + 132
        for role, weight, px in SCALES[project]:
            d.text((lx, ty), "Aa", font=font(weight, min(px + 30, 72)), fill=ink)
            d.text((lx + 150, ty + 12), role, font=font("Medium", 22), fill=ink)
            d.text((lx + 150, ty + 44), f"{weight} · {px}px", font=font("Regular", 18), fill=dim)
            ty += 108

    # Right column: colour.
    rx = PAD + col_w + 110
    rw = W - rx - PAD
    d.text((rx, ly), "COLOUR", font=font("SemiBold", 15), fill=dim)
    swatches(d, im, project, rx, ly + 40, rw, ink, dim)

    dest = CASE / project / "system.jpg"
    im.save(dest, "JPEG", quality=92, optimize=True, progressive=True)
    return dest


def main() -> None:
    for project in PALETTES:
        dest = build(project)
        print(f"  ✓ {dest.relative_to(ROOT)}  {len(PALETTES[project])} colours")


if __name__ == "__main__":
    main()
