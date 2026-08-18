/*
 * Which palette the page background is painted in.
 *
 * The cloud shader is mounted once, in the shell, and survives every route
 * change — that is the point of it, the background does not restart when you
 * navigate. So a page cannot simply render a different background; it has to
 * ask the one that already exists to change colour.
 *
 * Hence a tiny store rather than context: the canvas reads it inside a frame
 * loop that was registered once and would close over a stale context value,
 * and a change here must not re-render anything.
 */

export type BackdropName = "site" | "case";

export type Palette = {
  /** the lit colour of the field, linear 0-1 for the shader */
  base: [number, number, number];
  /** what the field darkens toward at its densest */
  deep: [number, number, number];
  /** the CSS gradient painted underneath, for when the shader is not running */
  css: string;
};

/*
 * The site's blue, and a neutral stone for case studies.
 *
 * A case study is a page of screenshots and mockups, and full-intensity #0B01FF
 * behind them competed with the work for attention — it was the loudest thing
 * on a page whose whole job is to show something else. A navy was tried first
 * and had the same problem in a quieter voice: still a colour, still pulling.
 *
 * So the case study ground has no hue at all. Mid-dark rather than near-black,
 * which matters here: the Orbit mockups are themselves nearly black, and on a
 * near-black page they would dissolve into it instead of sitting on it. At this
 * value a dark mockup and a light one both keep their edges.
 *
 * The colours below are the shader's endpoints, not the painted result. It
 * paints `mix(base, deep, q * 0.22)`, so `deep` is only ever approached a fifth
 * of the way: the site's blue lands in a band around #0B01FF, and stone lands
 * between #303036 and #26262A. Stone's endpoints are far apart precisely so
 * that a fifth of the distance is a small step — the dither stays visible as
 * texture without becoming contrast you notice while reading.
 */
export const PALETTES: Record<BackdropName, Palette> = {
  site: {
    base: [0.043, 0.004, 1.0],
    deep: [0.031, 0.016, 0.29],
    css: "linear-gradient(160deg, #0B01FF 0%, #0A02DA 50%, #0B01FF 100%)",
  },
  case: {
    // #303036 lit; a fifth of the way to near-black lands the darkest band on
    // #26262A, which is the range the page actually shows.
    base: [0.188, 0.188, 0.212],
    deep: [0.011, 0.011, 0.031],
    css: "linear-gradient(160deg, #303036 0%, #2B2B2F 50%, #26262A 100%)",
  },
};

let current: BackdropName = "site";
const listeners = new Set<(n: BackdropName) => void>();

export function getBackdrop(): BackdropName {
  return current;
}

export function setBackdrop(next: BackdropName): void {
  if (next === current) return;
  current = next;
  if (typeof document !== "undefined") {
    // The attribute is what CSS keys off; the listeners are for the canvas.
    document.documentElement.dataset.backdrop = next;
  }
  listeners.forEach((fn) => fn(next));
}

export function onBackdropChange(fn: (n: BackdropName) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
