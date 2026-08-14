"""
Builds mockups for the archive: UI screens placed in devices, posters placed on
a wall and in a frame.

    python3 scripts/archive-mockups.py

Everything is composited from the real exports rather than generated, so the
pixels inside a screen or a poster are the actual artwork. The surroundings —
bezel, stand, browser chrome, wall, frame — are drawn here.

Writes into public/media/archive/<slug>/mock-*.jpg. Sources are the derivatives
from archive-derivatives.py; nothing in `Archive Stuff/` is touched.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "public" / "media" / "archive"
QUALITY = 88

# Grounds are per project so a run of mockups still reads as one set.
KIOSK_GROUND = (232, 92, 40)     # DishaMitra red-orange, desaturated
BROWSER_GROUND = (222, 228, 238)  # cool paper
WALL = (231, 228, 222)            # warm plaster
FRAME_WALL = (204, 200, 193)


def rounded(size, radius, fill):
    """A rounded-rectangle mask/plate at `size`."""
    img = Image.new("RGB", size, fill)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return img, mask


def shadow(canvas, box, radius, blur=34, alpha=88, offset=(0, 18)):
    """Soft drop shadow painted under `box` on `canvas`."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle(
        [x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]],
        radius,
        fill=(10, 8, 14, alpha),
    )
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), layer).convert("RGB"), (0, 0))


def fit(im, box_w, box_h):
    im = im.convert("RGB").copy()
    im.thumbnail((box_w, box_h), Image.LANCZOS)
    return im


def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def kiosk(screen: Image.Image, out: Path, ground=KIOSK_GROUND) -> None:
    """Screen on a floor-standing kiosk: bezel, body, column, base."""
    W, H = 1800, 2250
    canvas = Image.new("RGB", (W, H), ground)

    sc = fit(screen, 1180, 900)
    bezel = 34
    head_w, head_h = sc.width + bezel * 2, sc.height + bezel * 2
    hx, hy = (W - head_w) // 2, 250

    # Column and base first so the head sits in front of them.
    col_w = int(head_w * 0.2)
    col_x = (W - col_w) // 2
    col_top = hy + head_h - 20
    col_bottom = H - 230
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([col_x, col_top, col_x + col_w, col_bottom], 18, fill=(24, 24, 28))
    # Base plate, then a soft contact shadow so the unit stands on something.
    foot_w = int(col_w * 3.4)
    d.rounded_rectangle(
        [(W - foot_w) // 2, col_bottom - 26, (W + foot_w) // 2, col_bottom + 18], 16, fill=(20, 20, 24)
    )
    contact = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(contact).ellipse(
        [(W - int(foot_w * 1.5)) // 2, col_bottom + 6, (W + int(foot_w * 1.5)) // 2, col_bottom + 74],
        fill=(10, 8, 14, 70),
    )
    contact = contact.filter(ImageFilter.GaussianBlur(30))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), contact).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(canvas)

    shadow(canvas, (hx, hy, hx + head_w, hy + head_h), 30)
    head, mask = rounded((head_w, head_h), 30, (20, 20, 24))
    canvas.paste(head, (hx, hy), mask)
    canvas.paste(sc, (hx + bezel, hy + bezel))

    # Camera pip, so the head reads as hardware rather than a floating card.
    d = ImageDraw.Draw(canvas)
    d.ellipse([W // 2 - 9, hy + 14, W // 2 + 9, hy + 32], fill=(45, 45, 52))
    save(canvas, out)


def browser(screen: Image.Image, out: Path, ground=BROWSER_GROUND) -> None:
    """Screen in a desktop browser window."""
    W, H = 2000, 1400
    canvas = Image.new("RGB", (W, H), ground)

    sc = fit(screen, 1660, 1010)
    chrome = 58
    win_w, win_h = sc.width, sc.height + chrome
    x, y = (W - win_w) // 2, (H - win_h) // 2

    shadow(canvas, (x, y, x + win_w, y + win_h), 18, blur=40, alpha=70, offset=(0, 22))
    win, mask = rounded((win_w, win_h), 18, (246, 246, 248))
    canvas.paste(win, (x, y), mask)

    d = ImageDraw.Draw(canvas)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = x + 26 + i * 26
        d.ellipse([cx, y + chrome // 2 - 8, cx + 16, y + chrome // 2 + 8], fill=c)
    d.rounded_rectangle(
        [x + 140, y + 15, x + win_w - 30, y + chrome - 15], 12, fill=(226, 226, 231)
    )
    canvas.paste(sc, (x, y + chrome))
    save(canvas, out)


def phone(screen: Image.Image, out: Path, ground=BROWSER_GROUND) -> None:
    """Screen in a phone body, for anything portrait."""
    W, H = 1500, 1900
    canvas = Image.new("RGB", (W, H), ground)
    sc = fit(screen, 800, 1500)
    bezel = 22
    bw, bh = sc.width + bezel * 2, sc.height + bezel * 2
    x, y = (W - bw) // 2, (H - bh) // 2
    shadow(canvas, (x, y, x + bw, y + bh), 60, blur=44, alpha=80)
    body, mask = rounded((bw, bh), 60, (18, 18, 22))
    canvas.paste(body, (x, y), mask)
    inner, imask = rounded((sc.width, sc.height), 40, (0, 0, 0))
    inner.paste(sc, (0, 0))
    canvas.paste(inner, (x + bezel, y + bezel), imask)
    save(canvas, out)


def poster_wall(poster: Image.Image, out: Path) -> None:
    """Print pinned flat to a wall, lit from the left."""
    p = fit(poster, 1250, 1550)
    W, H = int(p.width * 1.9), int(p.height * 1.45)
    canvas = Image.new("RGB", (W, H), WALL)

    # A slow gradient across the wall, otherwise the flat fill reads as a
    # placeholder rather than a room.
    grad = Image.linear_gradient("L").resize((W, H)).rotate(0)
    canvas = Image.composite(canvas, Image.new("RGB", (W, H), (208, 204, 197)), grad)

    x, y = (W - p.width) // 2, (H - p.height) // 2
    shadow(canvas, (x, y, x + p.width, y + p.height), 4, blur=30, alpha=95, offset=(10, 16))
    canvas.paste(p, (x, y))
    save(canvas, out)


def poster_framed(poster: Image.Image, out: Path) -> None:
    """Print behind glass in a thin dark frame with a wide mat."""
    p = fit(poster, 1050, 1350)
    mat = int(min(p.width, p.height) * 0.16)
    frame = 26
    inner_w, inner_h = p.width + mat * 2, p.height + mat * 2
    fw, fh = inner_w + frame * 2, inner_h + frame * 2
    W, H = int(fw * 1.45), int(fh * 1.3)

    canvas = Image.new("RGB", (W, H), FRAME_WALL)
    x, y = (W - fw) // 2, (H - fh) // 2
    shadow(canvas, (x, y, x + fw, y + fh), 6, blur=36, alpha=110, offset=(6, 20))

    d = ImageDraw.Draw(canvas)
    d.rectangle([x, y, x + fw, y + fh], fill=(26, 25, 28))
    d.rectangle([x + frame, y + frame, x + frame + inner_w, y + frame + inner_h], fill=(247, 245, 241))
    canvas.paste(p, (x + frame + mat, y + frame + mat))
    save(canvas, out)


POSTERS = [
    "berserk", "the-pink-tape", "marshall-mathers", "dave-grohl",
    "bring-me-the-horizon", "i-choose-me", "the-weeknd", "tentacion",
    "twelve-carat-toothache", "air-max-97", "less-is-more",
]

# slug -> (device, screens to mock, ground)
UI = {
    "dishamitra-kiosk": ("kiosk", [1, 3, 6, 10, 14], KIOSK_GROUND),
    "music-store-concept": ("browser", [1, 2, 4, 6], (226, 222, 234)),
    "photo-store-concept": ("browser", [1, 2], (224, 230, 226)),
}


def main() -> None:
    made = 0

    for slug in POSTERS:
        src = BASE / slug / "full.jpg"
        if not src.exists():
            print(f"  ! missing {src}")
            continue
        with Image.open(src) as im:
            im.load()
            poster_wall(im.copy(), BASE / slug / "mock-wall.jpg")
            poster_framed(im.copy(), BASE / slug / "mock-framed.jpg")
        made += 2
        print(f"  {slug}: wall + framed")

    for slug, (device, picks, ground) in UI.items():
        for n in picks:
            src = BASE / slug / f"screen-{n:02d}.jpg"
            if not src.exists():
                print(f"  ! missing {src}")
                continue
            with Image.open(src) as im:
                im.load()
                out = BASE / slug / f"mock-{n:02d}.jpg"
                if device == "kiosk":
                    kiosk(im.copy(), out, ground)
                elif device == "phone":
                    phone(im.copy(), out, ground)
                else:
                    browser(im.copy(), out, ground)
            made += 1
        print(f"  {slug}: {len(picks)} {device} mockups")

    print(f"\nWrote {made} mockups")


if __name__ == "__main__":
    main()
