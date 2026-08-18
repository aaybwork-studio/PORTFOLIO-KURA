"""
Replaces every display in a generated mockup with the real interface export.

    python3 scripts/screens-composite.py orbit/m-array --report   # show what it found
    python3 scripts/screens-composite.py orbit/m-array            # do it

The image models build convincing hardware and cannot draw an interface. Asked
for five tablets running five screens, they return five tablets running five
approximations: letterforms smear, words invent themselves, and on a mockup at
this angle a good half of the type comes back mirrored. The photography is worth
keeping; the screens are not.

So the render is treated as a set. Each display is located, the real export is
warped onto it, and the glass is put back over the top -- the render's own
highlights and reflections are kept as a multiply layer, so the interface sits
under the same glare the model lit it with rather than looking pasted on.

Displays are found rather than measured. In these renders the screen is the
darkest thing in frame by a wide margin, the bodies being pale aluminium and the
surface mid grey, so a threshold isolates them cleanly. Each region is reduced to
its convex hull and then to the four hull points that enclose the most area,
which for a rectangle seen in perspective are its corners.
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CASE = ROOT / "public" / "media" / "case"
ASSETS = Path("/Users/kura/Downloads/ Case study Assests")

# Which export belongs on which screen, in the order the screens are found:
# left to right, then top to bottom. Ordering by position rather than by name
# keeps the mapping stable if a render is regenerated with the same layout.
ORBIT = ASSETS / "Orbit Elements/Final Screens "
GUITAR = ASSETS / "Guitar Flow/Screens "

# `ratio` is the display's own proportion, not the quad's -- the quad is that
# rectangle seen in perspective and is narrower than the thing it depicts. Each
# export is padded to the display's ratio before it is warped, so the interface
# lands square instead of squashed. Orbit's screens are black to the edge, so
# the padding is invisible.
JOBS = {
    "orbit/m-array": {
        "min_area": 0.010,
        "ratio": 4 / 3,
        # Left to right, then top to bottom.
        "screens": [
            ORBIT / "Home.png",
            ORBIT / "Interactions overlay.png",
            ORBIT / "History.png",
            ORBIT / "Spaces.png",
            ORBIT / "System scan.png",
        ],
    },
    # The macro is a different problem, and not the one it looks like.
    #
    # Its display runs off two sides of the frame, so the detected quad is the
    # visible part of the screen rather than the screen. That much could be
    # fitted around. What cannot is that the render did not project the export
    # at all -- it invented a layout of its own, so its navigation sits at a
    # different height and spacing than the real one. Fitting a homography to
    # invented landmarks produced a screen axis 38 degrees off the screen's own
    # edge, which is the measurement telling you the premise is wrong.
    #
    # What is actually wrong with the frame is narrower than the whole screen:
    # the mark. Orbit's is a red spiral followed by a letterspaced ORBIT; the
    # render drew a filled ring and used it as the O. So the lockup alone is
    # replaced, its background rebuilt from the render's own glow so the red
    # bloom under it survives.
    "orbit/m-detail": {
        "min_area": 0.050,
        "patch": {
            "source": ORBIT / "Home.png",
            # Measured off the export rather than read off a grid: the mark
            # runs x 104-163 and ORBIT x 184-344, both between y 74 and 133.
            "box": (96, 66, 352, 141),
            # Clockwise from the top-left, on the plane of the screen. The
            # baseline follows the render's own type, the vertical follows the
            # screen's left edge, and the two are scaled to the crop's ratio.
            "quad": [(1784, 1847), (2553, 1491), (2592, 1736), (1823, 2092)],
        },
    },
}


def patch(art: Image.Image, spec) -> Image.Image:
    """Replace one element on a screen, keeping the light that falls on it."""
    lockup = Image.open(spec["source"]).convert("RGB").crop(spec["box"])
    quad = spec["quad"]
    W, H = art.size
    src = [(0, 0), (lockup.width, 0), (lockup.width, lockup.height), (0, lockup.height)]
    warped = lockup.transform((W, H), Image.PERSPECTIVE, perspective(src, quad), Image.BICUBIC)

    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(quad, fill=255)
    soft = mask.filter(ImageFilter.GaussianBlur(14))

    # Erase over a wider area than is painted. The render's mark is a fatter
    # shape than the real one, so a clear area the size of the replacement
    # leaves its edges poking out around it.
    c = np.array(quad, dtype=float).mean(axis=0)
    wide = [tuple(c + (np.array(q, dtype=float) - c) * 1.55) for q in quad]
    xs = [q[0] for q in wide]
    ys = [q[1] for q in wide]
    x0, x1 = max(1, int(min(xs))), min(W - 2, int(max(xs)))
    y0, y1 = max(1, int(min(ys))), min(H - 2, int(max(ys)))

    # The cleared area is the bounding box, not the tilted quad inside it. The
    # lockup runs on the diagonal, so a quad drawn around it covers well under
    # half of the box it spans and leaves the old mark's corners outside the
    # mask -- which is what a first attempt did, erasing beautifully and
    # changing nothing. The rebuilt pixels are interpolated from this box's own
    # edges, so blending back on the box is seamless anyway.
    clear = Image.new("L", (W, H), 0)
    ImageDraw.Draw(clear).rectangle((x0, y0, x1, y1), fill=255)
    clear = clear.filter(ImageFilter.GaussianBlur(90))

    # Erase what is there. Neither of the obvious filters does this: blurring
    # spreads bright type into a ghost of itself, and a minimum filter turns it
    # into dark type instead of removing it. What is wanted is not a filter at
    # all but a fill -- the region thrown away and rebuilt from the pixels
    # around it, which here are a smooth red bloom on black and interpolate
    # cleanly from either direction.
    a = np.asarray(art, dtype=np.float32)
    bw, bh = x1 - x0, y1 - y0
    tx = np.linspace(0, 1, bw, dtype=np.float32)[None, :, None]
    ty = np.linspace(0, 1, bh, dtype=np.float32)[:, None, None]
    across = a[y0:y1, x0 - 1][:, None, :] * (1 - tx) + a[y0:y1, x1][:, None, :] * tx
    down = a[y0 - 1, x0:x1][None, :, :] * (1 - ty) + a[y1, x0:x1][None, :, :] * ty

    erased = a.copy()
    erased[y0:y1, x0:x1] = (across + down) / 2
    erased = Image.fromarray(np.clip(erased, 0, 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(25)
    )
    cleared = Image.composite(erased, art, clear)

    # The real lockup is white and red on black. Screen blending puts it on the
    # rebuilt background without painting a black rectangle over the glow.
    base = np.asarray(cleared, dtype=np.float32) / 255
    add = np.asarray(warped, dtype=np.float32) / 255
    lit = 1 - (1 - base) * (1 - add)
    out = Image.fromarray(np.clip(lit * 255, 0, 255).astype(np.uint8))
    return Image.composite(out, cleared, soft)


def line(p, q):
    """The homogeneous line through two points."""
    return np.cross((p[0], p[1], 1.0), (q[0], q[1], 1.0))


def homography(edges, points):
    """Fit export -> render from two line correspondences and two point ones.

    A line maps under H the way a point maps under its inverse transpose, so a
    known edge gives `l_export ~ H^T l_render` and two independent equations,
    the same currency as a point. The source edges are the axes of the export:
    its top is y = 0 and its left is x = 0, which makes those two equations fall
    out as single entries of `H^T l` rather than a general cross product.
    """
    rows = []
    # h is row-major, so h[0..2] is H's first row and the entries a line
    # constraint touches are strided by three, not adjacent.
    a, b, c = line(*edges["top"])                       # export line y = 0
    rows.append([a, 0, 0, b, 0, 0, c, 0, 0])            # first entry of H^T l vanishes
    rows.append([0, 0, a, 0, 0, b, 0, 0, c])            # and so does the third
    a, b, c = line(*edges["left"])                      # export line x = 0
    rows.append([0, a, 0, 0, b, 0, 0, c, 0])            # second entry vanishes
    rows.append([0, 0, a, 0, 0, b, 0, 0, c])            # and the third
    for (x, y), (u, v) in points:
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    # Line coefficients come out of a cross product and are orders of magnitude
    # larger than the point rows; without this the fit is decided by scale.
    A = np.array(rows, dtype=float)
    A /= np.linalg.norm(A, axis=1, keepdims=True)
    _, _, vt = np.linalg.svd(A)
    return vt[-1].reshape(3, 3)


def fitted(art: Image.Image, ui: Image.Image, spec, inset: int) -> Image.Image:
    """Place one export using a fitted homography rather than a target box."""
    H = homography(spec["edges"], spec["points"])
    inv = np.linalg.inv(H)
    inv = inv / inv[2, 2]
    W, Hh = art.size
    warped = ui.convert("RGB").transform((W, Hh), Image.PERSPECTIVE, inv.reshape(9)[:8], Image.BICUBIC)

    # The export does not cover the whole display -- it ends where the screen
    # does -- so the region it may paint is its own rectangle carried through
    # the same fit, intersected with the display found in the render.
    cover = Image.new("L", ui.size, 255).transform((W, Hh), Image.PERSPECTIVE, inv.reshape(9)[:8], Image.NEAREST)
    return warped, cover


def fit(ui: Image.Image, ratio: float) -> Image.Image:
    """Pad the export out to the display's proportion, using its own edge colour."""
    w, h = ui.size
    if abs(w / h - ratio) < 0.01:
        return ui
    tw, th = (w, int(round(w / ratio))) if w / h > ratio else (int(round(h * ratio)), h)
    bg = ui.convert("RGB").getpixel((2, 2))
    out = Image.new("RGB", (tw, th), bg)
    out.paste(ui.convert("RGB"), ((tw - w) // 2, (th - h) // 2))
    return out


def quad_area(q) -> float:
    x = np.array([p[0] for p in q])
    y = np.array([p[1] for p in q])
    return float(abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2)


def hull(points: np.ndarray) -> np.ndarray:
    """Convex hull, counter-clockwise, by monotone chain."""
    pts = np.unique(points, axis=0)
    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]

    def half(ps):
        out = []
        for p in ps:
            while len(out) >= 2:
                (ax, ay), (bx, by) = out[-2], out[-1]
                if (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax) > 0:
                    break
                out.pop()
            out.append(tuple(p))
        return out

    lower, upper = half(pts), half(pts[::-1])
    return np.array(lower[:-1] + upper[:-1], dtype=float)


def corners(h: np.ndarray) -> list[tuple[float, float]]:
    """The four hull points enclosing the most area.

    A rectangle photographed in perspective is still a quadrilateral, so its
    corners are exactly the four hull vertices with the largest enclosed area.
    Hulls here run to a few dozen points, so this is searched rather than
    approximated.
    """
    n = len(h)
    if n <= 4:
        quad = h
    else:
        best, best_area = None, -1.0
        for i in range(n - 3):
            for j in range(i + 1, n - 2):
                for k in range(j + 1, n - 1):
                    for l in range(k + 1, n):
                        q = h[[i, j, k, l]]
                        x, y = q[:, 0], q[:, 1]
                        a = abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2
                        if a > best_area:
                            best, best_area = q, a
        quad = best

    # Clockwise from the top-left, which is the order the warp expects.
    c = quad.mean(axis=0)
    ang = np.arctan2(quad[:, 1] - c[1], quad[:, 0] - c[0])
    quad = quad[np.argsort(ang)]
    start = int(np.argmin(quad[:, 0] + quad[:, 1]))
    quad = np.roll(quad, -start, axis=0)
    return [(float(x), float(y)) for x, y in quad]


def regions(im: Image.Image, thresh: int, min_area: float, step: int = 8) -> list[np.ndarray]:
    """Dark regions, largest first, each as an array of full-resolution points."""
    small = im.convert("L").resize((im.width // step, im.height // step), Image.BILINEAR)
    dark = np.asarray(small, dtype=np.int16) < thresh
    h, w = dark.shape
    floor = int(min_area * h * w)

    seen = np.zeros_like(dark, dtype=bool)
    found = []
    for sy in range(h):
        for sx in range(w):
            if not dark[sy, sx] or seen[sy, sx]:
                continue
            stack, cells = [(sy, sx)], []
            seen[sy, sx] = True
            while stack:
                y, x = stack.pop()
                cells.append((x * step, y * step))
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(cells) >= floor:
                found.append(np.array(cells, dtype=float))
    found.sort(key=len, reverse=True)
    return found


def reading_order(quads: list[list[tuple[float, float]]]) -> list[int]:
    """Left to right, then top to bottom, in bands a third of the frame deep."""
    mids = [(np.mean([p[0] for p in q]), np.mean([p[1] for p in q])) for q in quads]
    span = max(m[1] for m in mids) - min(m[1] for m in mids) + 1
    top = min(m[1] for m in mids)
    return sorted(range(len(quads)), key=lambda i: (int((mids[i][1] - top) / (span / 2.4)), mids[i][0]))


def perspective(src, dst):
    """Coefficients mapping dst -> src, the direction PIL wants."""
    m = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    return np.linalg.solve(np.array(m, dtype=float), np.array(src, dtype=float).reshape(8))


def place(art: Image.Image, ui: Image.Image, quad, inset: int) -> Image.Image:
    """Warp one export onto one display, keeping the render's own glare."""
    W, H = art.size
    src = [(0, 0), (ui.width, 0), (ui.width, ui.height), (0, ui.height)]
    warped = ui.convert("RGB").transform((W, H), Image.PERSPECTIVE, perspective(src, quad), Image.BICUBIC)

    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(quad, fill=255)
    span = max(abs(quad[1][0] - quad[0][0]), abs(quad[1][1] - quad[0][1]))
    return blend(art, warped, mask, span, inset)


def blend(art: Image.Image, warped: Image.Image, mask: Image.Image, span: float, inset: int) -> Image.Image:
    """Lay a warped interface into the frame under the render's own reflections."""
    # Pull the mask in so the bezel's own lit edge survives, then soften it so
    # the join is a transition rather than a cut.
    mask = mask.filter(ImageFilter.MinFilter(inset)).filter(ImageFilter.GaussianBlur(inset / 3))

    # The render lit this glass; keep what it did, but only what it did. Screen
    # blending the original straight through brings its invented interface with
    # it and the result reads as two screens printed on top of each other. What
    # is wanted is the reflection alone, so the layer is blurred at a radius
    # wide enough to dissolve type and narrow enough to hold a gradient -- a
    # fortieth of the display's width, measured off the quad itself.
    radius = max(6, span / 40)

    # Blur the frame as it stands and the pale desk around the device bleeds in
    # over the edges, which lands as a haze across the whole interface. So the
    # display is isolated first and everything outside it flooded with the
    # screen's own average, giving the blur nothing bright to drag inward.
    arr = np.asarray(art, dtype=np.float32)
    m = (np.asarray(mask, dtype=np.float32) / 255)[:, :, None]
    mean = (arr * m).sum(axis=(0, 1)) / max(float(m.sum()), 1.0)
    glare = Image.fromarray(
        np.clip(arr * m + mean * (1 - m), 0, 255).astype(np.uint8)
    ).filter(ImageFilter.GaussianBlur(radius))
    glare = np.asarray(glare, dtype=np.float32) / 255

    # An export is a file; a display is a light source. Orbit's screens are
    # near-black by design, and dropped into a lit render at their file values
    # they read as devices that are switched off. The lift is a gamma rather
    # than a multiply so the black stays black and only what is already above
    # it comes up.
    base = np.asarray(warped, dtype=np.float32) / 255
    base = np.power(base, 0.72)
    lit = 1 - (1 - base) * (1 - glare * 0.32)
    out = Image.fromarray(np.clip(lit * 255, 0, 255).astype(np.uint8))
    return Image.composite(out, art, mask)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job", help="project/name, e.g. orbit/m-array")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--thresh", type=int, default=46)
    ap.add_argument("--inset", type=int, default=9)
    args = ap.parse_args()

    spec = JOBS[args.job]
    project, name = args.job.split("/")
    gen = CASE / project / "gen" / f"{name}.png"
    art = Image.open(gen).convert("RGB")

    found = regions(art, args.thresh, spec["min_area"])
    quads = [corners(hull(r)) for r in found]
    # A shadow cast between two devices is dark enough to pass the threshold but
    # collapses to a sliver once it is reduced to four corners. Keeping the N
    # largest quads by enclosed area drops those without needing a shape test.
    want = len(spec.get("screens", [1]))
    quads = sorted(quads, key=quad_area, reverse=True)[:want]
    quads = [quads[i] for i in reading_order(quads)]

    if args.report:
        print(f"{gen.name}  {art.size[0]}x{art.size[1]}  found {len(quads)} display(s)")
        for i, q in enumerate(quads):
            pts = "  ".join(f"({int(x)},{int(y)})" for x, y in q)
            print(f"  {i}  {pts}")
        proof = art.copy()
        d = ImageDraw.Draw(proof)
        for i, q in enumerate(quads):
            d.polygon(q, outline=(0, 255, 120), width=8)
            d.text((q[0][0] + 30, q[0][1] + 20), str(i), fill=(0, 255, 120))
        proof.thumbnail((1500, 1500))
        out = Path("/private/tmp/claude-501/-Users-kura/735fefc8-9513-4ee0-8a6e-40e6cab4aa27/scratchpad/quads.jpg")
        proof.save(out, quality=90)
        print(f"  overlay -> {out}")
        print(json.dumps([[list(map(int, p)) for p in q] for q in quads]))
        return

    if "patch" in spec:
        art = patch(art, spec["patch"])
        art.save(gen)
        print(f"  ✓ {gen.relative_to(ROOT)}  lockup replaced")
        return

    screens = spec["screens"]
    if len(screens) != len(quads):
        raise SystemExit(f"{len(quads)} displays found but {len(screens)} exports listed -- run --report")

    for path, quad in zip(screens, quads):
        art = place(art, fit(Image.open(path), spec["ratio"]), quad, args.inset)
    art.save(gen)
    print(f"  ✓ {gen.relative_to(ROOT)}  {len(quads)} interface(s) replaced")


if __name__ == "__main__":
    main()
