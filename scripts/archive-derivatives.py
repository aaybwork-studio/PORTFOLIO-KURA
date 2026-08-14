"""
Builds web derivatives for the archive out of `Archive Stuff/`.

    python3 scripts/archive-derivatives.py

For every item it writes into public/media/archive/<slug>/:
  card.jpg   1200x1500, 4:5, the plate shown in the carousel
  full.jpg   long edge 2200, the whole artefact
  crop-N.jpg long edge 1800, real detail crops taken from the source file

Crops are cut from the original pixels rather than generated, so what the
detail view shows is genuinely the poster at 100% and not an approximation.
Source files are never modified.
"""

from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Archive Stuff"
OUT = ROOT / "public" / "media" / "archive"

CARD = (1200, 1500)  # 4:5
FULL_EDGE = 2200
CROP_EDGE = 1800
QUALITY = 86

# slug -> (source file, [ (crop-name, x0, y0, x1, y1) ... ]) as fractions of the frame
POSTERS = {
    "twelve-carat-toothache": (
        "620514529_17944777964964125_1208392982252206790_n.webp",
        [("portrait", 0.34, 0.13, 1.00, 0.66),
         ("title", 0.00, 0.08, 0.42, 0.92),
         ("tracklist", 0.00, 0.62, 1.00, 1.00)],
    ),
    "less-is-more": (
        "622650433_18090213593101451_7432200421957673758_n.jpg",
        [("headline", 0.04, 0.04, 0.96, 0.34),
         ("column", 0.28, 0.22, 0.72, 0.82),
         ("medallion", 0.18, 0.48, 0.86, 0.96)],
    ),
    "tentacion": (
        "639493026_18517018309076799_8450293527454376264_n.jpg",
        [("portrait", 0.18, 0.18, 0.82, 0.66),
         ("marks", 0.00, 0.00, 0.52, 0.36),
         ("lettering", 0.00, 0.60, 1.00, 1.00)],
    ),
    "the-weeknd": (
        "622515499_18091745516052730_3328868892429869319_n.jpg",
        [("portrait", 0.14, 0.18, 0.86, 0.76),
         ("panels", 0.00, 0.00, 1.00, 0.30),
         ("wordmark", 0.08, 0.70, 1.00, 1.00)],
    ),
    "air-max-97": (
        "655094052_18087641327227794_6822622786259994734_n.jpg",
        [("wordmark", 0.00, 0.00, 1.00, 0.30),
         ("shoe", 0.14, 0.28, 0.92, 0.82),
         ("specs", 0.44, 0.64, 1.00, 1.00)],
    ),
    "berserk": (
        "berserk 1.png",
        [("spine", 0.00, 0.00, 0.46, 0.40),
         ("vortex", 0.14, 0.24, 0.96, 0.70),
         ("guts", 0.38, 0.64, 1.00, 1.00)],
    ),
    "bring-me-the-horizon": (
        "bmth 1.png",
        [("logotype", 0.08, 0.02, 0.92, 0.32),
         ("halftone", 0.18, 0.30, 0.82, 0.76),
         ("frame", 0.14, 0.68, 0.86, 1.00)],
    ),
    "dave-grohl": (
        "daave 1.png",
        [("spine", 0.00, 0.04, 0.40, 0.96),
         ("stencil", 0.30, 0.08, 1.00, 0.72),
         ("roundel", 0.00, 0.58, 0.52, 1.00)],
    ),
    "marshall-mathers": (
        "em 1.png",
        [("portrait", 0.18, 0.14, 0.82, 0.72),
         ("script", 0.14, 0.00, 0.86, 0.26),
         ("wordmark", 0.00, 0.70, 1.00, 1.00)],
    ),
    "the-pink-tape": (
        "liluzi 1.png",
        [("display", 0.08, 0.04, 0.92, 0.40),
         ("portrait", 0.22, 0.18, 0.78, 0.72),
         ("badge", 0.48, 0.62, 1.00, 1.00)],
    ),
    "i-choose-me": (
        "kendrick.png",
        [("type", 0.00, 0.00, 1.00, 0.36),
         ("warp", 0.12, 0.24, 0.88, 0.72),
         ("figure", 0.00, 0.58, 0.78, 1.00)],
    ),
}

# slug -> (folder, card source, ordered screens)
UI_SETS = {
    "dishamitra-kiosk": (
        "DishaMitra Kiosk ",
        "Home.png",
        ["Home.png", "login.png", "Destination.png", "Destination Drop Down.png", "Prices.png",
         "Payment.png", "Cash method.png", "Cash method balance.png", "Balance.png",
         "UPI Recipt.png", "Cash recipt.png", "Fare recite.png", "Share options.png",
         "Cancel popup.png", "Cancel finish.png"],
    ),
    "music-store-concept": (
        "Music store webiste concept",
        "home.png",
        ["home.png", "Cat.png", "Prod L.png", "Prod D.png", "Cart.png", "Checkout.png"],
    ),
    "photo-store-concept": (
        "Photograpgy In college/Photogrpahy Product + Website concept",
        "landing.png",
        ["landing.png", "prod page.png"],
    ),
}

PHOTO_DIR = "Photograpgy In college"


def save(im: Image.Image, path: Path, edge: int) -> None:
    im = im.convert("RGB")
    im.thumbnail((edge, edge), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def card(im: Image.Image, path: Path) -> None:
    """4:5 plate. Cover-crop anchored slightly above centre, where posters
    usually put their subject."""
    out = ImageOps.fit(im.convert("RGB"), CARD, Image.LANCZOS, centering=(0.5, 0.4))
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def card_contain(im: Image.Image, path: Path) -> None:
    """4:5 plate for landscape UI screens.

    Cover-cropping a kiosk layout into a portrait plate throws away most of the
    screen and lands on a meaningless slice of it. Here the whole screen is
    fitted inside the plate instead, on a ground sampled from the screen's own
    corner so the letterboxing reads as a mount rather than as a gap.
    """
    rgb = im.convert("RGB")
    ground = rgb.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    ground = tuple(int(c * 0.35 + 20) for c in ground)
    plate = Image.new("RGB", CARD, ground)
    inner = rgb.copy()
    inner.thumbnail((int(CARD[0] * 0.88), int(CARD[1] * 0.62)), Image.LANCZOS)
    plate.paste(inner, ((CARD[0] - inner.width) // 2, (CARD[1] - inner.height) // 2))
    path.parent.mkdir(parents=True, exist_ok=True)
    plate.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def crop(im: Image.Image, box) -> Image.Image:
    w, h = im.size
    x0, y0, x1, y1 = box
    return im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))


def main() -> None:
    made = 0

    for slug, (fname, crops) in POSTERS.items():
        src = SRC / fname
        if not src.exists():
            print(f"  ! missing {src}")
            continue
        with Image.open(src) as im:
            im.load()
            d = OUT / slug
            card(im, d / "card.jpg")
            save(im.copy(), d / "full.jpg", FULL_EDGE)
            for name, *box in crops:
                save(crop(im, box), d / f"crop-{name}.jpg", CROP_EDGE)
            made += 2 + len(crops)
        print(f"  {slug}: card + full + {len(crops)} crops")

    for slug, (folder, card_src, screens) in UI_SETS.items():
        base = SRC / folder
        d = OUT / slug
        cs = base / card_src
        if cs.exists():
            with Image.open(cs) as im:
                im.load()
                card_contain(im, d / "card.jpg")
            made += 1
        for i, name in enumerate(screens):
            p = base / name
            if not p.exists():
                print(f"  ! missing {p}")
                continue
            with Image.open(p) as im:
                im.load()
                save(im.copy(), d / f"screen-{i + 1:02d}.jpg", FULL_EDGE)
            made += 1
        print(f"  {slug}: {len(screens)} screens")

    photos = sorted(p for p in (SRC / PHOTO_DIR).glob("*.png") if p.is_file())
    for i, p in enumerate(photos):
        d = OUT / "photography"
        with Image.open(p) as im:
            im.load()
            card(im, d / f"photo-{i + 1:02d}-card.jpg")
            save(im.copy(), d / f"photo-{i + 1:02d}.jpg", FULL_EDGE)
        made += 2
    print(f"  photography: {len(photos)} shots")

    print(f"\nWrote {made} files to {OUT}")


if __name__ == "__main__":
    main()
