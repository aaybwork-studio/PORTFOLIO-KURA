import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, hasSanity, projectId } from "./env";

const builder = hasSanity ? imageUrlBuilder({ projectId, dataset }) : null;

export function urlFor(source: SanityImageSource): string | null {
  if (!builder || !source) return null;
  try {
    return builder.image(source).auto("format").fit("max").url();
  } catch {
    return null;
  }
}

/**
 * Resolve a Sanity image to a URL, returning the local `/media/*.png` fallback
 * whenever Sanity is unconfigured or the field is empty.
 */
export function img(source: SanityImageSource | null | undefined, fallbackPath: string): string {
  if (!source) return fallbackPath;
  return urlFor(source) ?? fallbackPath;
}
