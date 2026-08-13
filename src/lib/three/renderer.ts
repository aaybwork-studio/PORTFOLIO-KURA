import * as THREE from "three";
import { atLeast, rendererSettings } from "@/lib/perf";

/* Design file lines 962-974 — verbatim. */

export function onScreen(canvas: HTMLCanvasElement): boolean {
  const r = canvas.getBoundingClientRect();
  return r.bottom > -100 && r.top < window.innerHeight + 100 && r.width > 1;
}

export function makeRenderer(
  canvas: HTMLCanvasElement,
  alpha: boolean,
  scale?: number,
): THREE.WebGLRenderer | null {
  /*
   * At `minimal` there is no usable GPU, so no canvas gets one. Returning null
   * here rather than gating each component individually means every caller
   * already handles it: they all hide their canvas when the renderer cannot be
   * made, which was written for browsers without WebGL at all.
   */
  if (!atLeast("reduced")) return null;

  // Below `full` there is no GPU worth asking for a high-performance adapter
  // from, antialiasing is a pure cost, and pixel ratio is pinned to 1 — that
  // last one matters most, since fragment cost is quadratic in it.
  const { pixelRatio, antialias } = rendererSettings();
  try {
    const r = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: antialias && !scale,
      alpha: !!alpha,
      powerPreference: atLeast("full") ? "high-performance" : "low-power",
    });
    r.setPixelRatio(Math.min(pixelRatio * (scale || 1), scale ? 1 : pixelRatio));
    if (alpha) r.setClearColor(0x000000, 0);
    return r;
  } catch {
    return null;
  }
}

/* Design file lines 1359-1362 — the non-"bow" branch of resizeScene(). */
export function resizePerspective(
  renderer: THREE.WebGLRenderer,
  cam: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
): void {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  cam.aspect = w / Math.max(1, h);
  cam.updateProjectionMatrix();
}

/** Dispose every geometry/material reachable from `root`. The design relies on
    page teardown for this; React needs it explicit. Purely additive — it does
    not change any scene math. */
export function disposeScene(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (!mat) return;
    if (Array.isArray(mat)) mat.forEach((m) => materials.add(m));
    else materials.add(mat);
  });
  materials.forEach((m) => m.dispose());
}
