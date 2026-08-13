/*
 * Rendering capability tiers.
 *
 * This site runs several WebGL canvases at once — a full-viewport fbm cloud,
 * the extruded logo, the bouncing footer logo, the hero icons, the header
 * cassette and the cursor — on top of Lenis and a particle canvas. With a GPU
 * that is comfortable. Without one it is not: Chrome with hardware
 * acceleration disabled falls back to SwiftShader, a CPU rasteriser, and a
 * full-screen fragment shader at native resolution then costs tens of
 * milliseconds per frame. The page does not degrade, it stops.
 *
 * So capability is detected up front and the site is built to three tiers:
 *
 *   full     everything, as designed
 *   reduced  WebGL stays, but cheaper: pixel ratio pinned to 1, no
 *            antialiasing, no particles, no cloud shader
 *   minimal  no WebGL and no smooth scroll at all — CSS gradients, native
 *            scrolling, native cursor
 *
 * Two things set the tier. Detection runs once at startup and catches the
 * clear-cut cases (no WebGL context, a software renderer string). Everything
 * else is caught by watching real frame times: a machine that simply cannot
 * keep up gets demoted after a sustained bad patch, which also covers
 * integrated GPUs, thermal throttling and heavily loaded machines that no
 * static check could predict.
 */

export type Tier = "full" | "reduced" | "minimal";

const ORDER: Tier[] = ["minimal", "reduced", "full"];

let tier: Tier = "full";
let detected = false;

const listeners = new Set<(t: Tier) => void>();

/** Renderer strings that mean "this is running on the CPU". */
const SOFTWARE = [
  "swiftshader",
  "llvmpipe",
  "softpipe",
  "software",
  "microsoft basic render",
  "mesa offscreen",
  "angle (software",
  "generic renderer",
];

function probe(): Tier {
  if (typeof window === "undefined") return "full";

  /*
   * Manual override: `?tier=minimal`, `?tier=reduced`, `?tier=full`.
   *
   * Reproducing a no-GPU machine otherwise means restarting the browser with
   * hardware acceleration off, which is slow enough that the cheap tiers would
   * never actually get tested.
   */
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "minimal" || forced === "reduced" || forced === "full") return forced;

  // A visitor who has asked for less motion gets the cheap build too — it is
  // the same set of things they do not want.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";

  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;

    // No context at all: WebGL disabled, blocklisted, or unsupported.
    if (!gl) return "minimal";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "").toLowerCase();
      if (SOFTWARE.some((s) => renderer.includes(s))) return "minimal";
    }

    // Very small texture limits are a reliable sign of a fallback rasteriser
    // even when the renderer string has been masked for fingerprinting.
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (typeof maxTex === "number" && maxTex > 0 && maxTex < 4096) return "reduced";

    // Losing the context immediately keeps a probe from holding one of the
    // browser's limited WebGL slots for the life of the page.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "minimal";
  } finally {
    canvas = null;
  }

  // A 2-core machine will not enjoy six canvases even with a working GPU.
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= 2) return "reduced";

  return "full";
}

/** Detect once, on first call. Safe to call from anywhere, any number of times. */
export function initTier(): Tier {
  if (detected) return tier;
  detected = true;
  tier = probe();
  return tier;
}

export function getTier(): Tier {
  return detected ? tier : initTier();
}

export function atLeast(min: Tier): boolean {
  return ORDER.indexOf(getTier()) >= ORDER.indexOf(min);
}

export function onTierChange(fn: (t: Tier) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setTier(next: Tier) {
  if (next === tier) return;
  tier = next;
  document.documentElement.dataset.tier = next;
  listeners.forEach((fn) => fn(next));
}

/** Drop one step. Never climbs back up — flapping between tiers is worse than
    sitting one level too low, and a machine that stuttered once usually will
    again. */
export function demote(): void {
  const i = ORDER.indexOf(tier);
  if (i > 0) setTier(ORDER[i - 1]);
}

/*
 * Frame-time watchdog.
 *
 * Fed from the shell's existing loop. It ignores the first second (startup,
 * shader compilation and font swap all land there and are not representative)
 * and then demotes after a sustained run of slow frames rather than on a
 * single spike, so a garbage-collection pause or a background tab regaining
 * focus cannot trigger it.
 */
const SLOW_MS = 34; // roughly below 30fps
const NEEDED = 45; // consecutive slow frames before acting
const WARMUP_MS = 1000;

let slow = 0;
let elapsed = 0;

export function sampleFrame(dtMs: number): void {
  // A tab that was backgrounded reports one enormous delta; it says nothing
  // about the machine.
  if (dtMs > 500) {
    slow = 0;
    return;
  }

  elapsed += dtMs;
  if (elapsed < WARMUP_MS) return;

  if (dtMs > SLOW_MS) {
    slow++;
    if (slow >= NEEDED) {
      slow = 0;
      demote();
    }
  } else if (slow > 0) {
    slow--;
  }
}

/** Renderer settings for the current tier. */
export function rendererSettings(): { pixelRatio: number; antialias: boolean } {
  const t = getTier();
  if (t === "full") {
    return { pixelRatio: Math.min(window.devicePixelRatio || 1, 1.6), antialias: true };
  }
  // Pixel ratio is the single biggest lever on a software rasteriser: it is
  // quadratic in fragment count, so pinning it to 1 is worth more than every
  // other reduction combined.
  return { pixelRatio: 1, antialias: false };
}
