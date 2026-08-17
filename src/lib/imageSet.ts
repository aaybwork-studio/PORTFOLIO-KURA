/*
 * Width-capped sources for Sanity CDN images.
 *
 * Every project image was served as `?auto=format&fit=max` with no width, which
 * means the CDN hands back the original upload. A phone downloading a 4000px
 * JPEG to paint it 390px wide is the single most expensive thing on the site:
 * it is most of the page weight, most of the CDN egress, and it is decoded at
 * full size before it is scaled down.
 *
 * This bolts a srcset onto the URL rather than changing how images are
 * resolved. The pipeline already produces a finished CDN URL by the time it
 * reaches a component (see sanity/image.ts), so appending `&w=` to that string
 * is the whole transformation — no change to the content types, no change to
 * the CMS, and nothing to do for the local `/media/*.png` fallbacks, which are
 * not on the CDN and are simply left alone.
 */

const SANITY_CDN = "https://cdn.sanity.io/";

/** Widths worth generating. Beyond ~2560 the file grows faster than it helps. */
const WIDTHS = [480, 768, 1080, 1440, 1920, 2560];

export function isSanityImage(src: string): boolean {
  return typeof src === "string" && src.startsWith(SANITY_CDN);
}

function withWidth(src: string, w: number): string {
  return `${src}${src.includes("?") ? "&" : "?"}w=${w}`;
}

/**
 * A srcset across the standard widths, or `undefined` for anything not on the
 * Sanity CDN — a local fallback has one size and no transform endpoint, and an
 * srcset of identical URLs would just confuse the browser's selection.
 */
export function srcSetFor(src: string): string | undefined {
  if (!isSanityImage(src)) return undefined;
  return WIDTHS.map((w) => `${withWidth(src, w)} ${w}w`).join(", ");
}

/**
 * A capped default for the `src` itself, so browsers that ignore srcset — and
 * anything that reads the attribute directly, like a social preview scrape —
 * still do not pull the original.
 */
export function cappedSrc(src: string, w = 1920): string {
  return isSanityImage(src) ? withWidth(src, w) : src;
}

/**
 * Everything an <img> needs, in one call.
 *
 * `sizes` describes the rendered width to the browser and has to be passed by
 * the caller: only the component knows whether its image is full-bleed, half of
 * a split row, or a card in a two-column grid, and getting it wrong is how a
 * srcset ends up picking a file that is still four times too big.
 */
export function imgProps(src: string, sizes: string): {
  src: string;
  srcSet?: string;
  sizes?: string;
} {
  const srcSet = srcSetFor(src);
  return srcSet ? { src: cappedSrc(src), srcSet, sizes } : { src };
}
