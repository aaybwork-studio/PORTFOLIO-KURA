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
 * Two things set the tier, and the second one is the one to trust.
 *
 * Detection runs once at startup, but every signal it has is a guess that a
 * privacy-focused browser will deliberately corrupt: Brave farbles the WebGL
 * renderer string, clamps the core count and adds noise to WebGL parameters.
 * Reading those as fact is how Brave ended up on `minimal` — a blank page with
 * no icons and no motion on a machine with a perfectly good GPU. So no startup
 * hint costs more than one tier, and only a genuinely absent WebGL context
 * reaches `minimal`.
 *
 * The honest measure is the frame-time watchdog below. It watches what the
 * machine actually does, which no browser can spoof, and it also covers what no
 * static check could predict: integrated GPUs, thermal throttling and machines
 * that are simply busy.
 */

export type Tier = "full" | "reduced" | "minimal";

const ORDER: Tier[] = ["minimal", "reduced", "full"];

let tier: Tier = "full";
let detected = false;

const listeners = new Set<(t: Tier) => void>();

/*
 * Renderer strings that suggest a CPU rasteriser.
 *
 * "Suggest", not "prove". These are a hint and nothing more, because the string
 * is exactly what privacy browsers lie about: Brave's fingerprint protection
 * replaces the renderer with a generic value, and a spoofed value can look
 * indistinguishable from a real software rasteriser. So a match here costs one
 * tier, never two — WebGL keeps running either way, and the frame-time watchdog
 * decides whether the machine can actually keep up.
 */
const SOFTWARE = [
  "swiftshader",
  "llvmpipe",
  "softpipe",
  "software",
  "microsoft basic render",
  "mesa offscreen",
  "angle (software",
];

/*
 * Get a WebGL context, trying hard before giving up.
 *
 * Giving up means `minimal`, which is the only tier with no WebGL at all, so it
 * has to be reserved for the case where WebGL genuinely is not available. A
 * first call can fail for reasons that a second one with different attributes
 * will not: a major-performance-caveat refusal, a browser that only answers to
 * the legacy context name, or a transient failure while other contexts are
 * still being torn down.
 */
function getContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const attempts: [string, WebGLContextAttributes?][] = [
    ["webgl2", undefined],
    ["webgl", undefined],
    ["webgl", { failIfMajorPerformanceCaveat: false }],
    ["experimental-webgl", { failIfMajorPerformanceCaveat: false }],
  ];
  for (const [name, attrs] of attempts) {
    try {
      const gl = canvas.getContext(name, attrs) as WebGLRenderingContext | null;
      if (gl) return gl;
    } catch {
      /* try the next set of attributes */
    }
  }
  return null;
}

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

  let worst: Tier = "full";
  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement("canvas");
    const gl = getContext(canvas);

    // No context after every attempt: WebGL really is off, blocklisted or
    // unsupported. This is the one thing that earns `minimal`.
    if (!gl) return "minimal";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "").toLowerCase();
      if (SOFTWARE.some((s) => renderer.includes(s))) worst = "reduced";
    }

    // Very small texture limits point the same way. Also only a hint: this
    // parameter is farbled by the same privacy features that rewrite the
    // renderer string.
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (typeof maxTex === "number" && maxTex > 0 && maxTex < 4096) worst = "reduced";

    // Losing the context immediately keeps a probe from holding one of the
    // browser's limited WebGL slots for the life of the page.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /*
     * A throw in here means the probe failed, not that WebGL is absent — a
     * blocked parameter read or a farbled extension can raise, and that says
     * nothing about whether a canvas would render. Take one tier off and let
     * the watchdog judge the rest.
     */
    return "reduced";
  } finally {
    canvas = null;
  }

  /*
   * Core count is the last hint, and the weakest.
   *
   * Brave clamps `hardwareConcurrency` to a low number as a fingerprinting
   * defence, so a 16-core machine can report 2. One tier at most, same as the
   * rest.
   */
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= 2) worst = "reduced";

  return worst;
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
