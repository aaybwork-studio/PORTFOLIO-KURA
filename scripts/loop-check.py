"""
Measures how closely a clip's last frame returns to its first.

    python3 scripts/loop-check.py public/media/case/*/gen/*.mp4

Prints mean absolute pixel difference between the opening frame and each of the
last few frames, as a percentage of full scale. A clip that genuinely comes back
lands near zero and can be cut at its best match; one that drifts stays high and
needs a cross-fade to close instead.

The best matching tail frame is reported too, since trimming a few frames off
the end is a cleaner way to close a loop than blending over it.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

TAIL = 24  # how many closing frames to test


def frames(path: Path, out: Path) -> list[Path]:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
         "-vf", "scale=320:-1", str(out / "f%04d.png")],
        check=True,
    )
    return sorted(out.glob("f*.png"))


def main() -> None:
    for arg in sys.argv[1:]:
        path = Path(arg)
        with tempfile.TemporaryDirectory() as td:
            fs = frames(path, Path(td))
            if len(fs) < TAIL + 2:
                print(f"{path.name}: too short")
                continue
            first = np.asarray(Image.open(fs[0]).convert("RGB"), dtype=float)
            scores = []
            for i in range(len(fs) - TAIL, len(fs)):
                a = np.asarray(Image.open(fs[i]).convert("RGB"), dtype=float)
                scores.append((np.abs(a - first).mean() / 255 * 100, i))
            best, idx = min(scores)
            last = scores[-1][0]
            keep = idx + 1
            print(
                f"{path.parent.parent.name}/{path.name}: "
                f"last frame {last:.2f}%  best {best:.2f}% at frame {idx + 1}/{len(fs)}  "
                f"-> trim to {keep} frames ({keep / 24:.2f}s)"
            )


if __name__ == "__main__":
    main()
