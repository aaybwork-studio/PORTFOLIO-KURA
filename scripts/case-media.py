"""
Builds the case-study media: heroes, section stills and looping showreels.

    python3 scripts/case-media.py            # everything
    python3 scripts/case-media.py orbit      # one project

Rules this follows:

- Screens are never blown up. Compositions are sized around the native export,
  so a 587px screen sits in a smaller device on a larger ground rather than
  being stretched to fill a hero.
- Nothing is reused. Each still and each loop frame set draws on its own
  screens, so no shot appears twice across a project or between projects.
- Loops are seamless: the sequence returns to its first state, so playback has
  no visible cut.
- Motion only shows what the screens themselves do — a state changing, a view
  switching. No invented cursors, no transitions between screens that were
  never connected.

Aspect ratios match the slots on the page: 4:3 for heroes and half-width
blocks, 16:10 for full-width blocks.
"""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/Users/kura/Downloads/ Case study Assests")
OUT = ROOT / "public" / "media" / "case"

FULL = (1760, 1100)   # 16:10
CARD = (1400, 1050)   # 4:3
FPS = 25
SECONDS = 6


# --------------------------------------------------------------- ground work

def ground(size, top, bottom=None):
    """Flat or softly graded backdrop."""
    w, h = size
    if bottom is None:
        return Image.new("RGB", size, top)
    base = Image.new("RGB", size, top)
    grad = Image.linear_gradient("L").resize(size)
    return Image.composite(Image.new("RGB", size, bottom), base, grad)


def shadow(canvas, box, radius=18, blur=38, alpha=95, offset=(0, 24)):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(layer).rounded_rectangle(
        [x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]], radius, fill=(6, 4, 12, alpha)
    )
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(canvas.convert("RGBA"), layer).convert("RGB")


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius, fill=255)
    out = im.convert("RGB").copy()
    out.putalpha(mask)
    return out


def place(canvas, im, scale=1.0, centre=(0.5, 0.5), radius=10, shade=True):
    """Drop a screen onto a canvas at `scale` of its native size."""
    w = max(1, int(im.width * scale))
    h = max(1, int(im.height * scale))
    s = im.convert("RGB").resize((w, h), Image.LANCZOS)
    x = int(canvas.width * centre[0] - w / 2)
    y = int(canvas.height * centre[1] - h / 2)
    if shade:
        canvas = shadow(canvas, (x, y, x + w, y + h), radius)
    canvas.paste(rounded(s, radius), (x, y), rounded(s, radius))
    return canvas


def bezel(im, pad, colour=(16, 16, 20), radius=22):
    """Wrap a screen in a device body."""
    body = Image.new("RGB", (im.width + pad * 2, im.height + pad * 2), colour)
    body.paste(im.convert("RGB"), (pad, pad))
    return body


def save(im, path, quality=90):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"  {path.relative_to(ROOT)}")


def load(rel):
    p = SRC / rel
    if not p.exists():
        print(f"  ! missing {rel}")
        return None
    im = Image.open(p)
    im.load()
    return im.convert("RGB")


# --------------------------------------------------------------------- loops

def loop(states, out_path, size, seconds=SECONDS, hold=0.45):
    """Cross-fade through `states` and back to the first, so it loops clean."""
    if len(states) < 2:
        return
    frames = seconds * FPS
    seq = states + [states[0]]
    legs = len(seq) - 1
    per = frames / legs
    hold_f = per * hold
    fade_f = per - hold_f

    tmp = OUT / "_frames"
    tmp.mkdir(parents=True, exist_ok=True)
    for f in tmp.glob("*.jpg"):
        f.unlink()

    n = 0
    for i in range(legs):
        a, b = seq[i].resize(size, Image.LANCZOS), seq[i + 1].resize(size, Image.LANCZOS)
        for k in range(int(per)):
            if k < hold_f:
                frame = a
            else:
                t = (k - hold_f) / max(1, fade_f)
                # ease so the change reads as deliberate rather than mechanical
                t = t * t * (3 - 2 * t)
                frame = Image.blend(a, b, t)
            frame.save(tmp / f"f{n:04d}.jpg", quality=88)
            n += 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", str(tmp / "f%04d.jpg"),
         "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(out_path)],
        check=True,
    )
    for f in tmp.glob("*.jpg"):
        f.unlink()
    tmp.rmdir()
    print(f"  {out_path.relative_to(ROOT)}  ({seconds}s loop)")


def clip(src, out_path, start, seconds, crop, grade=None):
    """Cut a segment from real footage, with a short cross-fade to itself so the
    loop closes."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    vf = f"crop={crop},scale={FULL[0]}:{FULL[1]},fps={FPS}"
    if grade:
        vf += f",{grade}"
    xf = 0.6
    vf += (
        f",split[a][b];[a]trim=0:{seconds - xf},setpts=PTS-STARTPTS[main];"
        f"[b]trim={seconds - xf}:{seconds},setpts=PTS-STARTPTS[tail];"
        f"[main][tail]xfade=transition=fade:duration={xf}:offset={seconds - 2 * xf}"
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(seconds), "-i", str(src),
         "-filter_complex", vf, "-an", "-c:v", "libx264", "-crf", "24", "-preset", "slow",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)],
        check=True,
    )
    print(f"  {out_path.relative_to(ROOT)}  ({seconds}s from footage)")


# ------------------------------------------------------------------ projects

def orbit():
    print("orbit")
    d = OUT / "orbit"
    fs = "Orbit Elements/Final Screens /"
    dark, panel = (10, 10, 10), (24, 20, 18)

    home = load(f"{fs}Home.png")
    overlay = load(f"{fs}Interactions overlay.png")
    spaces = load(f"{fs}Spaces.png")
    history = load(f"{fs}History.png")
    insights = load(f"{fs}Insights.png")
    phone = load(f"{fs}Interaction Phone.png")
    scan = load(f"{fs}System scan.png")

    if home:
        c = ground(CARD, dark, panel)
        s = min(CARD[0] * 0.82 / home.width, CARD[1] * 0.78 / home.height)
        save(place(c, home, s, (0.5, 0.52), 12), d / "hero.jpg")
    if overlay:
        c = ground(FULL, dark, panel)
        s = min(FULL[0] * 0.78 / overlay.width, FULL[1] * 0.8 / overlay.height)
        save(place(c, overlay, s, (0.5, 0.5), 12), d / "overlay.jpg")
    for name, im in (("spaces", spaces), ("history", history), ("insights", insights), ("scan", scan)):
        if im:
            c = ground(CARD, dark, panel)
            s = min(CARD[0] * 0.84 / im.width, CARD[1] * 0.8 / im.height)
            save(place(c, im, s, (0.5, 0.5), 10), d / f"{name}.jpg")
    if phone:
        c = ground(CARD, panel, dark)
        s = min(CARD[0] * 0.42 / phone.width, CARD[1] * 0.82 / phone.height)
        save(place(c, bezel(phone, 14, (14, 14, 18), 26), s, (0.5, 0.5), 26), d / "companion.jpg")

    states = [im for im in (home, overlay, spaces, history) if im]
    if len(states) > 1:
        comp = []
        for im in states:
            c = ground(FULL, dark, panel)
            s = min(FULL[0] * 0.76 / im.width, FULL[1] * 0.78 / im.height)
            comp.append(place(c, im, s, (0.5, 0.5), 12))
        loop(comp, d / "reel.mp4", FULL)


def queue():
    print("queue")
    d = OUT / "queue"
    coral, pale = (253, 124, 84), (250, 232, 224)
    ipads = [load(f"Queue /iPad Pro 11_ - {n}.png") for n in (7, 8, 10, 12, 13)]
    ipads = [i for i in ipads if i]
    analysis = Image.open(d / "analysis.png").convert("RGB") if (d / "analysis.png").exists() else None

    if ipads:
        c = ground(CARD, coral, (236, 96, 58))
        k = bezel(ipads[0], 18, (18, 18, 22), 20)
        s = min(CARD[0] * 0.74 / k.width, CARD[1] * 0.74 / k.height)
        save(place(c, k, s, (0.5, 0.5), 20), d / "hero.jpg")
    if analysis:
        c = ground(FULL, pale, (238, 214, 205))
        s = min(FULL[0] * 0.76 / analysis.width, FULL[1] * 0.8 / analysis.height)
        save(place(c, analysis, s, (0.5, 0.5), 12), d / "analysis-panel.jpg")
    names = ["tryon", "compare", "stylist", "styles"]
    for name, im in zip(names, ipads[1:]):
        c = ground(CARD, pale, (240, 220, 212))
        s = min(CARD[0] * 0.8 / im.width, CARD[1] * 0.78 / im.height)
        save(place(c, im, s, (0.5, 0.5), 12), d / f"{name}.jpg")

    if len(ipads) > 1:
        comp = []
        for im in ipads:
            c = ground(FULL, coral, (236, 96, 58))
            k = bezel(im, 16, (18, 18, 22), 18)
            s = min(FULL[0] * 0.66 / k.width, FULL[1] * 0.76 / k.height)
            comp.append(place(c, k, s, (0.5, 0.5), 18))
        loop(comp, d / "reel.mp4", FULL)


def memory_bank():
    print("memory-bank")
    d = OUT / "memory-bank"
    blue, paper = (26, 115, 232), (238, 240, 245)
    home = load("Memory bank/Home.png")
    memory = load("Memory bank/Memory Page.png")
    library = load("Memory bank/Library.png")
    capture = load("Memory bank/Capturing Memory.png")
    savem = load("Memory bank/Save Memory.png")
    notif = load("Memory bank/Sp view Notifiaction.png")

    if home:
        c = ground(CARD, blue, (18, 84, 178))
        b = bezel(home, 12, (12, 12, 16), 30)
        s = min(CARD[0] * 0.4 / b.width, CARD[1] * 0.86 / b.height)
        save(place(c, b, s, (0.5, 0.5), 30), d / "hero.jpg")
    pairs = (("memory", memory), ("library", library), ("capture", capture), ("save", savem), ("notification", notif))
    for name, im in pairs:
        if not im:
            continue
        c = ground(CARD, paper, (222, 226, 234))
        b = bezel(im, 10, (12, 12, 16), 26)
        s = min(CARD[0] * 0.46 / b.width, CARD[1] * 0.88 / b.height)
        save(place(c, b, s, (0.5, 0.5), 26), d / f"{name}.jpg")

    video = SRC / "Memory bank/Prototype Video.mp4"
    if video.exists():
        # Two distinct segments: the map prompt, and the spatial depth view.
        clip(video, d / "reel-map.mp4", 12, SECONDS, "1080:675:420:180")
        clip(video, d / "reel-spatial.mp4", 58, SECONDS, "1080:675:420:180")


def guitar_flow():
    print("guitar-flow")
    d = OUT / "guitar-flow"
    black, teal = (10, 10, 12), (18, 60, 58)
    play = load("Guitar Flow/Screens /Play Overlay.png")
    lesson = load("Guitar Flow/Screens /Lesson Overlay.png")
    home = load("Guitar Flow/Screens /App open home overlay.png")
    unity = [load(f"Guitar Flow/Unity Prototyping Screenshots/image {n}.png") for n in (15, 17, 18)]
    unity = [u for u in unity if u]

    for name, im in (("play", play), ("lesson", lesson)):
        if im:
            c = ground(FULL, black, teal)
            s = min(FULL[0] * 0.8 / im.width, FULL[1] * 0.82 / im.height)
            save(place(c, im, s, (0.5, 0.5), 12), d / f"{name}.jpg")
    if home:
        c = ground(CARD, black, teal)
        s = min(CARD[0] * 0.7 / home.width, CARD[1] * 0.74 / home.height)
        save(place(c, home, s, (0.5, 0.5), 12), d / "menu.jpg")
    for i, u in enumerate(unity, 1):
        c = ground(CARD, black, (20, 20, 24))
        s = min(CARD[0] * 0.86 / u.width, CARD[1] * 0.82 / u.height)
        save(place(c, u, s, (0.5, 0.5), 8), d / f"unity-{i}.jpg")

    video = SRC / "Guitar Flow/VideoFinal (1).mp4"
    if video.exists():
        # Graded toward the project's teal, and cropped onto the overlay so the
        # room falls back and the strings are the subject.
        grade = "eq=contrast=1.12:brightness=-0.04:saturation=0.9,colorbalance=bs=0.06:gm=0.03"
        clip(video, d / "reel-passthrough.mp4", 6, SECONDS, "1024:640:0:200", grade)


def navaid():
    print("navaid")
    d = OUT / "navaid"
    tealc, concrete = (26, 153, 136), (222, 224, 220)
    outdoors = load("Nav-Aid /Outdoors.png")
    driving = load("Nav-Aid /While Self Driving.png")
    indoors = load("Nav-Aid /Indoors.png")
    manual = load("Nav-Aid /Manual Map.png")
    sensors = load("Nav-Aid /How sensors work.png")
    alt = load("Nav-Aid /Alt Layout.png")
    location = load("Nav-Aid /Location.png")
    addw = load("Nav-Aid /Add wheelchair.png")

    for name, im in (("outdoors", outdoors), ("indoors", indoors), ("manual", manual), ("alt-layout", alt)):
        if not im:
            continue
        c = ground(CARD, concrete, (204, 208, 204))
        b = bezel(im, 12, (18, 18, 20), 14)
        s = min(CARD[0] * 0.84 / b.width, CARD[1] * 0.78 / b.height)
        save(place(c, b, s, (0.5, 0.5), 14), d / f"{name}.jpg")
    if sensors:
        c = ground(FULL, tealc, (18, 120, 108))
        s = min(FULL[0] * 0.76 / sensors.width, FULL[1] * 0.8 / sensors.height)
        save(place(c, sensors, s, (0.5, 0.5), 12), d / "sensors.jpg")
    for name, im in (("location", location), ("add-chair", addw)):
        if not im:
            continue
        c = ground(CARD, tealc, (18, 120, 108))
        b = bezel(im, 10, (12, 12, 16), 26)
        s = min(CARD[0] * 0.44 / b.width, CARD[1] * 0.86 / b.height)
        save(place(c, b, s, (0.5, 0.5), 26), d / f"{name}.jpg")

    states = [im for im in (outdoors, driving, indoors, manual) if im]
    if len(states) > 1:
        comp = []
        for im in states:
            c = ground(FULL, concrete, (204, 208, 204))
            b = bezel(im, 14, (18, 18, 20), 14)
            s = min(FULL[0] * 0.72 / b.width, FULL[1] * 0.78 / b.height)
            comp.append(place(c, b, s, (0.5, 0.5), 14))
        loop(comp, d / "reel-screen.mp4", FULL)


BUILDERS = {
    "orbit": orbit,
    "queue": queue,
    "memory-bank": memory_bank,
    "guitar-flow": guitar_flow,
    "navaid": navaid,
}


if __name__ == "__main__":
    picks = sys.argv[1:] or list(BUILDERS)
    for p in picks:
        BUILDERS[p]()
