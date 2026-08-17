"""
Builds editorial product mockups and in-mockup animated video showreels
for all five portfolio case studies:
1. ORBIT (Dark workstation / developer setup)
2. QUEUE (Salon counter-top kiosk)
3. MEMORY BANK (Travel / photography desk setting)
4. GUITAR FLOW (Practice studio / MR session)
5. NAVAID (Assistive hardware / navigation module)

All assets are written directly to public/media/case/<slug>/
for local preview on localhost:3000 before publishing.
"""

import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = Path("/Users/kura/Downloads/ Case study Assests")
OUT = ROOT / "public" / "media" / "case"
BRAIN = Path("/Users/kura/.gemini/antigravity-ide/brain/42a42898-aea1-4812-aa67-679ed3feac30")

FPS = 25
HOLD_SEC = 1.6
FADE_SEC = 0.5
QUALITY = 92

HALF_SIZE = (1400, 1050)   # 4:3
FULL_SIZE = (1760, 1100)   # 16:10
ART_SIZE  = (2240, 1260)   # 16:9


def coeffs(src, dst):
    """Perspective coefficients mapping dst -> src for PIL transform."""
    m = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    return np.linalg.solve(np.array(m, dtype=float), np.array(src, dtype=float).reshape(8))


def composite_ui(base_im, ui_path, quad):
    """Warps and pastes 1:1 UI screen onto `quad` of `base_im` with supersampled anti-aliased mask."""
    ui = Image.open(ui_path).convert("RGB")
    src_corners = [(0, 0), (ui.width, 0), (ui.width, ui.height), (0, ui.height)]
    c = coeffs(src_corners, quad)
    warped = ui.transform(base_im.size, Image.PERSPECTIVE, c, Image.BICUBIC)
    
    scale = 4
    mask_big = Image.new("L", (base_im.width * scale, base_im.height * scale), 0)
    draw_big = ImageDraw.Draw(mask_big)
    quad_big = [(x * scale, y * scale) for x, y in quad]
    draw_big.polygon(quad_big, fill=255)
    mask = mask_big.resize(base_im.size, Image.LANCZOS)
    
    res = base_im.copy()
    res.paste(warped, (0, 0), mask)
    return res


def build_showreel(composites, out_path, fps=FPS, hold_sec=HOLD_SEC, fade_sec=FADE_SEC):
    """Renders a seamless, looping in-mockup showreel video from a list of composite frames."""
    if len(composites) < 2:
        return
    
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    hold_frames = int(fps * hold_sec)
    fade_frames = int(fps * fade_sec)
    
    tmp_dir = out_path.parent / f"_tmp_{out_path.stem}"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    for f in tmp_dir.glob("*.jpg"):
        f.unlink()
        
    seq = composites + [composites[0]]
    frame_idx = 0
    
    for i in range(len(composites)):
        cur_img = seq[i]
        next_img = seq[i + 1]
        
        # Hold on current screen
        for _ in range(hold_frames):
            cur_img.save(tmp_dir / f"f{frame_idx:04d}.jpg", quality=88)
            frame_idx += 1
            
        # Smooth cubic ease transition to next screen
        for f in range(fade_frames):
            t = (f + 1) / (fade_frames + 1)
            t = t * t * (3 - 2 * t)  # cubic smoothstep
            blended = Image.blend(cur_img, next_img, t)
            blended.save(tmp_dir / f"f{frame_idx:04d}.jpg", quality=88)
            frame_idx += 1
            
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-framerate", str(fps),
        "-i", str(tmp_dir / "f%04d.jpg"),
        "-c:v", "libx264", "-crf", "22", "-preset", "medium",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(out_path)
    ], check=True)
    
    for f in tmp_dir.glob("*.jpg"):
        f.unlink()
    tmp_dir.rmdir()
    print(f"  ✓ {out_path.relative_to(ROOT)} ({frame_idx} frames, seamless loop)")


def save_image(im, out_path, size=None):
    """Saves image at target size with high quality."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if size:
        # Centre-crop / fit to aspect ratio then resize
        target_w, target_h = size
        src_w, src_h = im.size
        src_ratio = src_w / src_h
        target_ratio = target_w / target_h
        
        if abs(src_ratio - target_ratio) > 0.02:
            if src_ratio > target_ratio:
                # crop width
                new_w = int(src_h * target_ratio)
                left = (src_w - new_w) // 2
                im = im.crop((left, 0, left + new_w, src_h))
            else:
                # crop height
                new_h = int(src_w / target_ratio)
                top = (src_h - new_h) // 2
                im = im.crop((0, top, src_w, top + new_h))
        im = im.resize(size, Image.LANCZOS)
    im.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    print(f"  ✓ {out_path.relative_to(ROOT)} ({im.size[0]}x{im.size[1]})")


# ------------------------------------------------------------------ 1. QUEUE
def process_queue():
    print("\n--- Processing QUEUE (Salon Kiosk Mockup & Showreel) ---")
    dest_dir = OUT / "queue"
    base_path = BRAIN / "queue_salon_mockup_1786958458769.jpg"
    base_im = Image.open(base_path).convert("RGB")
    quad = [(523, 268), (824, 266), (809, 487), (521, 484)]
    
    screens = [
        ASSETS / "Queue /iPad Pro 11_ - 8.png",   # Keyart / Home
        ASSETS / "Queue /iPad Pro 11_ - 7.png",   # Analysis / Scan
        ASSETS / "Queue /iPad Pro 11_ - 10.png",  # Live Try-On
        ASSETS / "Queue /iPad Pro 11_ - 12.png",  # Compare
        ASSETS / "Queue /iPad Pro 11_ - 13.png",  # Stylist Consultation
    ]
    
    composites = [composite_ui(base_im, s, quad) for s in screens]
    
    # Save Keyart and Hero Mockups
    save_image(composites[0], dest_dir / "keyart.jpg", ART_SIZE)
    save_image(composites[0], dest_dir / "hero.jpg", HALF_SIZE)
    
    # Save Section Mockups in the salon setting
    save_image(composites[1], dest_dir / "analysis-panel.jpg", FULL_SIZE)
    save_image(composites[2], dest_dir / "tryon.jpg", HALF_SIZE)
    save_image(composites[3], dest_dir / "compare.jpg", HALF_SIZE)
    save_image(composites[4], dest_dir / "stylist.jpg", HALF_SIZE)
    
    # Generate in-mockup showreel
    build_showreel(composites, dest_dir / "reel.mp4")


# ------------------------------------------------------------------ 2. ORBIT
def process_orbit():
    print("\n--- Processing ORBIT (Developer Workstation Mockup & Showreel) ---")
    dest_dir = OUT / "orbit"
    base_path = BRAIN / "orbit_keyart_mockup_1786829254356.jpg"
    base_im = Image.open(base_path).convert("RGB")
    quad = [(531, 143), (993, 173), (963, 524), (523, 456)]
    
    screens = [
        ASSETS / "Orbit Elements/Final Screens /Home.png",
        ASSETS / "Orbit Elements/Final Screens /Interactions overlay.png",
        ASSETS / "Orbit Elements/Final Screens /result screen.png",
        ASSETS / "Orbit Elements/Final Screens /Spaces.png",
        ASSETS / "Orbit Elements/Final Screens /History.png",
        ASSETS / "Orbit Elements/Final Screens /System scan.png",
    ]
    
    composites = [composite_ui(base_im, s, quad) for s in screens]
    
    # Save Keyart and Hero Mockups
    save_image(composites[0], dest_dir / "keyart.jpg", ART_SIZE)
    save_image(composites[0], dest_dir / "hero.jpg", HALF_SIZE)
    
    # Save Section Mockups
    save_image(composites[1], dest_dir / "overlay.jpg", FULL_SIZE)
    save_image(composites[3], dest_dir / "spaces.jpg", HALF_SIZE)
    save_image(composites[4], dest_dir / "history.jpg", HALF_SIZE)
    save_image(composites[5], dest_dir / "scan.jpg", HALF_SIZE)
    
    # Generate in-mockup showreel
    build_showreel(composites, dest_dir / "reel.mp4")


# ------------------------------------------------------------------ 3. MEMORY BANK
def process_memory_bank():
    print("\n--- Processing MEMORY BANK (Travel / Map Setting Mockup & Showreel) ---")
    dest_dir = OUT / "memory-bank"
    base_path = dest_dir / "gen" / "hero.png"
    base_im = Image.open(base_path).convert("RGB")
    
    # Memory Bank phone quad on gen/hero.png
    # Measured on the 2400x1792 plate:
    w, h = base_im.size
    quad = [(895, 230), (1505, 230), (1505, 1560), (895, 1560)]
    
    screens = [
        ASSETS / "Memory bank/Home.png",
        ASSETS / "Memory bank/Sp view Notifiaction.png",
        ASSETS / "Memory bank/Capturing Memory.png",
        ASSETS / "Memory bank/Memory Page.png",
        ASSETS / "Memory bank/Library.png",
        ASSETS / "Memory bank/Save Memory.png",
    ]
    
    composites = [composite_ui(base_im, s, quad) for s in screens]
    
    save_image(composites[0], dest_dir / "keyart.jpg", ART_SIZE)
    save_image(composites[0], dest_dir / "hero.jpg", HALF_SIZE)
    
    save_image(composites[4], dest_dir / "library.jpg", HALF_SIZE)
    save_image(composites[3], dest_dir / "memory.jpg", HALF_SIZE)
    save_image(composites[2], dest_dir / "capture.jpg", HALF_SIZE)
    save_image(composites[5], dest_dir / "save.jpg", HALF_SIZE)
    save_image(composites[1], dest_dir / "notification.jpg", HALF_SIZE)
    
    build_showreel(composites, dest_dir / "reel-map.mp4")


# ------------------------------------------------------------------ 4. GUITAR FLOW
def process_guitar_flow():
    print("\n--- Processing GUITAR FLOW (MR Studio Mockup & Showreel) ---")
    dest_dir = OUT / "guitar-flow"
    base_path = dest_dir / "gen" / "hero.png"
    base_im = Image.open(base_path).convert("RGB")
    
    w, h = base_im.size
    quad = [(440, 290), (1960, 290), (1960, 1500), (440, 1500)]
    
    screens = [
        ASSETS / "Guitar Flow/Screens /App open home overlay.png",
        ASSETS / "Guitar Flow/Screens /Play Overlay.png",
        ASSETS / "Guitar Flow/Screens /Lesson Overlay.png",
        ASSETS / "Guitar Flow/Unity Prototyping Screenshots/image 17.png",
    ]
    
    composites = [composite_ui(base_im, s, quad) for s in screens]
    
    save_image(composites[0], dest_dir / "keyart.jpg", ART_SIZE)
    save_image(composites[0], dest_dir / "menu.jpg", HALF_SIZE)
    save_image(composites[1], dest_dir / "play.jpg", FULL_SIZE)
    save_image(composites[2], dest_dir / "lesson.jpg", FULL_SIZE)
    save_image(composites[3], dest_dir / "unity-2.jpg", FULL_SIZE)
    
    build_showreel(composites, dest_dir / "hero-loop.mp4")


# ------------------------------------------------------------------ 5. NAVAID
def process_navaid():
    print("\n--- Processing NAVAID (Wheelchair Tactile Module Mockup & Showreel) ---")
    dest_dir = OUT / "navaid"
    base_path = dest_dir / "gen" / "hero.png"
    base_im = Image.open(base_path).convert("RGB")
    
    w, h = base_im.size
    quad = [(480, 260), (1920, 260), (1920, 1530), (480, 1530)]
    
    screens = [
        ASSETS / "Nav-Aid /Outdoors.png",
        ASSETS / "Nav-Aid /While Self Driving.png",
        ASSETS / "Nav-Aid /How sensors work.png",
        ASSETS / "Nav-Aid /Indoors.png",
        ASSETS / "Nav-Aid /Manual Map.png",
        ASSETS / "Nav-Aid /Location.png",
    ]
    
    composites = [composite_ui(base_im, s, quad) for s in screens]
    
    save_image(composites[0], dest_dir / "keyart.jpg", ART_SIZE)
    save_image(composites[0], dest_dir / "hero-screen.jpg", HALF_SIZE)
    save_image(composites[0], dest_dir / "outdoors.jpg", HALF_SIZE)
    save_image(composites[2], dest_dir / "sensors.jpg", FULL_SIZE)
    save_image(composites[4], dest_dir / "manual.jpg", HALF_SIZE)
    save_image(composites[5], dest_dir / "location.jpg", HALF_SIZE)
    
    build_showreel(composites, dest_dir / "reel-screen.mp4")


def main():
    print("Building all editorial product mockups and in-mockup showreels...")
    process_queue()
    process_orbit()
    process_memory_bank()
    process_guitar_flow()
    process_navaid()
    print("\n✓ All case study media built successfully!")


if __name__ == "__main__":
    main()
