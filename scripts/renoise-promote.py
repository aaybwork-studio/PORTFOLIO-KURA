"""
Moves approved Renoise output into the media set the site actually serves.

    python3 scripts/renoise-promote.py --report   # what would change
    python3 scripts/renoise-promote.py            # do it

Generated frames land in public/media/case/<project>/gen as full-size PNG (and
MP4 for the loops). This normalises them to the sizes and formats the case study
layout expects and writes them over the plate filenames, keeping the originals
in gen/ so a promotion can always be undone.

Two fixes are applied on the way through:

  * hailuo-h3 always renders an audio track and offers no way to disable it.
    These are silent background loops on a portfolio page, so the track is
    dropped rather than shipped muted — it is dead weight in the download.
  * Generated stills come back at the model's own resolution, not the layout's.
    Half-span media is 1400x1050 (4:3) and full-span is 1760x1100 (16:10), so
    anything wider is centre-cropped to the target ratio and resampled down.
"""

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"

HALF = (1400, 1050)   # 4:3, sits in a half-span slot
FULL = (1760, 1100)   # 16:10, sits in a full-span slot
ART = (2240, 1260)    # 16:9 key art, serving both the case hero and the 4:3
                      # work card — the card crops the sides, so every one of
                      # these is composed centre-weighted.

# gen name -> (destination filename, target size)
PROMOTE = {
    "orbit": {
        "keyart": ("keyart.jpg", ART),
        "hero": ("hero.jpg", HALF),
        "overlay": ("overlay.jpg", FULL),
        "companion": ("companion.jpg", HALF),
        "spaces": ("spaces.jpg", HALF),
        "scan": ("scan.jpg", HALF),
        "history": ("history.jpg", HALF),
        "reel": ("reel.mp4", None),
    },
    "queue": {
        "keyart": ("keyart.jpg", ART),
        "hero": ("hero.jpg", HALF),
        "analysis-panel": ("analysis-panel.jpg", FULL),
        "tryon": ("tryon.jpg", HALF),
        "compare": ("compare.jpg", HALF),
        "stylist": ("stylist.jpg", HALF),
        "styles": ("styles.jpg", HALF),
        "reel": ("reel.mp4", None),
    },
    "memory-bank": {
        "keyart": ("keyart.jpg", ART),
        "hero": ("hero.jpg", HALF),
        "capture": ("capture.jpg", HALF),
        "save": ("save.jpg", HALF),
        "library": ("library.jpg", HALF),
        "memory": ("memory.jpg", HALF),
        "reel-map": ("reel-map.mp4", None),
        "reel-spatial": ("reel-spatial.mp4", None),
    },
    "guitar-flow": {
        "keyart": ("keyart.jpg", ART),
        "hero": ("menu.jpg", HALF),
        "play": ("play.jpg", FULL),
        "lesson": ("lesson.jpg", FULL),
        "workspace": ("unity-2.jpg", FULL),
        "reel": ("hero-loop.mp4", None),
    },
    "navaid": {
        "keyart": ("keyart.jpg", ART),
        "hero": ("hero-screen.jpg", HALF),
        "outdoors": ("outdoors.jpg", HALF),
        "manual": ("manual.jpg", HALF),
        "location": ("location.jpg", HALF),
        "add-chair": ("add-chair.jpg", HALF),
        "reel": ("reel-screen.mp4", None),
    },
}


CUT_MAX = 1.5   # % pixel difference a plain cut can hide
FADE = 12       # frames of cross-fade when it cannot


MIN_FRAMES = 132  # 5.5s at 24fps, before the fade takes its cut


def blend_loop(src: Path, dest: Path, keep: int) -> None:
    """Close a loop that does not come back on its own.

    Where a clip drifts — light that keeps moving, foliage that does not settle
    — no single frame matches the opening, so the join is made instead of
    found: the closing frames are cross-faded into the opening ones. The result
    runs `keep` frames and its last frame hands back to its first.
    """
    body_start = FADE
    body_end = keep - FADE
    dur = FADE / 24
    graph = (
        f"[0:v]trim=start_frame={body_start}:end_frame={body_end},setpts=PTS-STARTPTS[body];"
        f"[0:v]trim=start_frame={body_end}:end_frame={keep},setpts=PTS-STARTPTS[tail];"
        f"[0:v]trim=start_frame=0:end_frame={FADE},setpts=PTS-STARTPTS[head];"
        f"[tail][head]xfade=transition=fade:duration={dur}:offset=0[join];"
        f"[body][join]concat=n=2:v=1:a=0[v]"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
         "-filter_complex", graph, "-map", "[v]",
         "-an", "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(dest)],
        check=True,
    )


def frame_count(path: Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-count_frames", "-show_entries", "stream=nb_read_frames",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return int(out.stdout.strip())


def close_loop(path: Path, tail: int = 30) -> tuple[int, float]:
    """Frame count to keep so the clip returns to its opening frame.

    The models were asked for motion that comes back on its own, and they do —
    but they overshoot the turn by a few frames. Cutting at the closest match
    rather than blending over the join keeps every frame of real motion and
    leaves no cross-fade ghost at the seam.
    """
    with tempfile.TemporaryDirectory() as td:
        out = Path(td)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
             "-vf", "scale=320:-1", str(out / "f%04d.png")],
            check=True,
        )
        fs = sorted(out.glob("f*.png"))
        if len(fs) < tail + 2:
            return len(fs), 100.0
        first = np.asarray(Image.open(fs[0]).convert("RGB"), dtype=float)
        best, idx = min(
            (float(np.abs(np.asarray(Image.open(fs[i]).convert("RGB"), dtype=float) - first).mean() / 255 * 100), i)
            for i in range(len(fs) - tail, len(fs))
        )
        return idx + 1, best


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
    ap.add_argument("--only", help="limit to one project")
    args = ap.parse_args()

    for project, entries in PROMOTE.items():
        if args.only and project != args.only:
            continue
        gen = CASE / project / "gen"
        if not gen.is_dir():
            continue

        for stem, (dest_name, size) in entries.items():
            video = size is None
            src = gen / f"{stem}.{'mp4' if video else 'png'}"
            dest = CASE / project / dest_name
            if not src.exists():
                print(f"  - {project}/{stem}: not generated")
                continue

            if args.report:
                if video:
                    print(f"  {project}/{stem}.mp4 -> {dest_name}  (audio stripped)")
                else:
                    with Image.open(src) as im:
                        print(f"  {project}/{stem}.png {im.size[0]}x{im.size[1]} -> {dest_name} {size[0]}x{size[1]}")
                continue

            # Keep the composited plate the first time it is replaced, so the
            # pre-generation version is always recoverable.
            plate_backup = gen / f"_plate-{dest_name}"
            if dest.exists() and not plate_backup.exists():
                shutil.copy2(dest, plate_backup)

            if video:
                keep, drift = close_loop(src)
                if drift <= CUT_MAX:
                    # Comes back on its own: cut at the match and keep every
                    # frame of real motion.
                    subprocess.run(
                        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
                         "-frames:v", str(keep),
                         "-an", "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
                         "-movflags", "+faststart", str(dest)],
                        check=True,
                    )
                    how = f"cut at {keep}"
                else:
                    # The fade makes the join rather than finding it, so the
                    # exact cut point barely matters — but it costs FADE frames
                    # off the runtime. Take back enough to stay above five
                    # seconds when the source has the frames to give.
                    total = frame_count(src)
                    keep = min(total, max(keep, MIN_FRAMES + FADE))
                    blend_loop(src, dest, keep)
                    how = f"cut at {keep} + {FADE}f fade"
                print(f"  ✓ {dest.relative_to(ROOT)}  {how}, seam {drift:.2f}%")
            else:
                with Image.open(src) as im:
                    out = fit(im.convert("RGB"), size)
                out.save(dest, "JPEG", quality=90, optimize=True, progressive=True)
                print(f"  ✓ {dest.relative_to(ROOT)}  {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
