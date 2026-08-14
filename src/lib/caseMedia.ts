import type { CaseMedia, ResolvedImage } from "./types";

/**
 * The default media rhythm for a case section.
 *
 * A case study reads badly when every section is shaped the same, and it reads
 * worse when the shape is decided per image — so the rhythm is derived from the
 * section's position, not from the assets. Even sections give each image the
 * full measure; odd sections pair them into a split row. Scrolling then goes
 * big, big, pair, big, big, pair rather than a uniform column.
 *
 * Anything authored explicitly in Sanity wins over this — see mapSections.
 */
export function defaultMedia(
  imageA: ResolvedImage,
  imageB: ResolvedImage,
  sectionIndex: number,
): CaseMedia[] {
  const span: CaseMedia["span"] = sectionIndex % 2 === 1 ? "half" : "full";
  return [
    { kind: "image", src: imageA.src, alt: imageA.alt ?? "", span },
    { kind: "image", src: imageB.src, alt: imageB.alt ?? "", span },
  ];
}

/** True when the URL is something a <video> element can play. */
export function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src);
}
