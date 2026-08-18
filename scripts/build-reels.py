"""
Turns the hand-made showreels into the clips the case studies serve.

    python3 scripts/build-reels.py --report   # what would change
    python3 scripts/build-reels.py            # do it

The exports come out of the editor at capture resolution and capture bitrate —
one is 62MB — which is far too heavy for a clip that autoplays the moment the
section scrolls into view. Each one is re-encoded, and on the way through the
loop is closed so the restart is not a visible jump.

Nothing is trimmed. The edits play in full; only the last few frames are
touched, and only where they have to be.

Closing the loop is two strategies, tried in that order:

  * Cut. If some frame near the end already matches the opening frame, the clip
    ends there. Every frame is real and the seam is invisible.
  * Blend. Where it never comes back on its own the join is made instead of
    found: the closing frames cross-fade into the opening ones.

A poster is written beside each clip. Without one the block is blank until the
video's first frame decodes, which on a slow connection is most of a second.
"""

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"
SRC = Path.home() / "Downloads" / "Vivaldi Downloads" / "Showreels"

FPS = 30
MAX_W = 1920
MAX_H = 1200
CRF = "23"

CUT_MAX = 1.5   # % pixel difference a plain cut can hide
FADE = 12       # frames of cross-fade when it cannot
TAIL = 45       # how far back from the end to look for the matching frame

# source file -> (project, output stem, crf)
#
# Orbit is the one that needs its own number. The reel is 45 seconds of a
# particle sphere -- thousands of single-pixel dots in constant motion, which is
# the worst case a codec can be handed. At the default it came out at 20MB; at
# 25 the dots still read individually and it is a third smaller. Everything
# else is flat interface and compresses to nothing at the default.
REELS = [
    ("Orbit Sh1.mp4", "orbit", "showreel", "25"),
    ("Queue Search.webm", "queue", "showreel-search", CRF),
    ("Queue Sh1.mp4", "queue", "showreel", CRF),
    ("mb sh1.mp4", "memory-bank", "showreel", CRF),
    ("VideoFinal.mp4", "guitar-flow", "showreel", CRF),
    ("NavAid Sh1.mp4", "navaid", "showreel", CRF),
]


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def probe(path: Path, entries: str) -> list[str]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", entries, "-of", "csv=p=0:s=x", str(path)],
        capture_output=True, text=True, check=True,
    )
    return out.stdout.strip().split("x")


def frame_count(path: Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-count_frames", "-show_entries", "stream=nb_read_frames",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return int(out.stdout.strip())


def target_size(w: int, h: int) -> tuple[int, int]:
    """Fit inside MAX_W x MAX_H without changing the ratio. Even dimensions,
    because yuv420p cannot encode an odd one."""
    scale = min(MAX_W / w, MAX_H / h, 1.0)
    return (max(2, int(w * scale) // 2 * 2), max(2, int(h * scale) // 2 * 2))


def encode(src: Path, dest: Path, size: tuple[int, int], crf: str, trim_to: int | None = None) -> None:
    vf = f"fps={FPS},scale={size[0]}:{size[1]}"
    if trim_to is not None:
        vf = f"fps={FPS},trim=start_frame=0:end_frame={trim_to},setpts=PTS-STARTPTS,scale={size[0]}:{size[1]}"
    ffmpeg("-i", str(src), "-vf", vf, "-an",
           "-c:v", "libx264", "-crf", crf, "-preset", "slow",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dest))


def blend(src: Path, dest: Path, size: tuple[int, int], total: int, crf: str) -> None:
    """Cross-fade the closing frames into the opening ones."""
    body_end = total - FADE
    dur = FADE / FPS
    graph = (
        f"[0:v]fps={FPS},scale={size[0]}:{size[1]},split=3[a][b][c];"
        f"[a]trim=start_frame={FADE}:end_frame={body_end},setpts=PTS-STARTPTS[body];"
        f"[b]trim=start_frame={body_end}:end_frame={total},setpts=PTS-STARTPTS[tail];"
        f"[c]trim=start_frame=0:end_frame={FADE},setpts=PTS-STARTPTS[head];"
        f"[tail][head]xfade=transition=fade:duration={dur}:offset=0[join];"
        f"[body][join]concat=n=2:v=1:a=0[v]"
    )
    ffmpeg("-i", str(src), "-filter_complex", graph, "-map", "[v]", "-an",
           "-c:v", "libx264", "-crf", crf, "-preset", "slow",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dest))


def seam(path: Path) -> tuple[int, float, int]:
    """Where the clip comes back to its opening frame.

    Returns the frame count to keep, how close that frame is to the first as a
    percentage, and the clip's total frame count. Only the head and the last
    TAIL frames are decoded — a 45 second clip has no business being unpacked
    in full to answer this.
    """
    total = frame_count(path)
    with tempfile.TemporaryDirectory() as td:
        out = Path(td)
        ffmpeg("-i", str(path), "-vf", "select='eq(n\\,0)',scale=320:-2",
               "-vsync", "0", str(out / "head.png"))
        start = max(0, total - TAIL)
        ffmpeg("-i", str(path), "-vf", f"select='gte(n\\,{start})',scale=320:-2",
               "-vsync", "0", str(out / "t%04d.png"))
        first = np.asarray(Image.open(out / "head.png").convert("RGB"), dtype=float)
        tails = sorted(out.glob("t*.png"))
        if not tails:
            return total, 100.0, total
        best, idx = min(
            (float(np.abs(np.asarray(Image.open(f).convert("RGB"), dtype=float) - first).mean() / 255 * 100), i)
            for i, f in enumerate(tails)
        )
    return start + idx + 1, best, total


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--only", help="limit to one project")
    args = ap.parse_args()

    for name, project, stem, crf in REELS:
        if args.only and project != args.only:
            continue
        src = SRC / name
        if not src.exists():
            print(f"  ! {name}: not found")
            continue

        w, h = (int(v) for v in probe(src, "stream=width,height"))
        size = target_size(w, h)
        dest = CASE / project / f"{stem}.mp4"
        poster = CASE / project / f"{stem}.jpg"

        if args.report:
            print(f"  {project}/{stem}: {w}x{h} -> {size[0]}x{size[1]}  "
                  f"({src.stat().st_size / 1e6:.1f}MB)")
            continue

        with tempfile.TemporaryDirectory() as td:
            flat = Path(td) / "flat.mp4"
            # Normalise first: the seam is measured on the frames that ship,
            # not on the source's own frame timing.
            encode(src, flat, size, crf)
            keep, diff, total = seam(flat)

            if diff < CUT_MAX and keep < total:
                encode(src, dest, size, crf, trim_to=keep)
                how = f"cut at {keep}/{total} ({diff:.2f}% off)"
            elif diff < CUT_MAX:
                flat.replace(dest)
                how = f"already closes ({diff:.2f}% off)"
            else:
                blend(flat, dest, size, total, crf)
                how = f"blended {FADE}f ({diff:.2f}% off, no match)"

        ffmpeg("-i", str(dest), "-vf", "select='eq(n\\,0)',scale=1200:-2",
               "-vsync", "0", "-q:v", "4", str(poster))

        print(f"  {project}/{stem}.mp4  {size[0]}x{size[1]}  "
              f"{src.stat().st_size / 1e6:.1f}MB -> {dest.stat().st_size / 1e6:.1f}MB  {how}")


if __name__ == "__main__":
    main()
