/*
 * Splitting body copy into paragraphs.
 *
 * Case study bodies arrive as one string, and a wall of six sentences reads as
 * one continuous obligation — there is nowhere to stop, so people skim it or
 * skip it. Breaking it into short paragraphs gives the eye somewhere to rest
 * and lets a related pair of sentences sit together.
 *
 * An authored blank line always wins. When there is none, sentences are grouped
 * in pairs: two is enough to make a point and its consequence, and a
 * one-sentence paragraph at the end reads as a deliberate closing line rather
 * than as a stray.
 */

/** Sentence boundary: terminator, space, then something that starts a sentence. */
const BOUNDARY = /(?<=[.!?])\s+(?=["'(“‘]?[A-Z0-9])/;

export function paragraphs(text: string, perParagraph = 2): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Authored breaks are a decision someone made; never second-guess them.
  const authored = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (authored.length > 1) return authored;

  const flat = authored[0] ?? trimmed.replace(/\s+/g, " ");
  const sentences = flat.split(BOUNDARY).filter(Boolean);
  if (sentences.length <= perParagraph) return [flat];

  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    out.push(sentences.slice(i, i + perParagraph).join(" "));
  }

  /*
   * A trailing single sentence is fine on its own, but only if the paragraph
   * before it has something to spare. Otherwise it is folded back in, so the
   * section never ends on a fragment left stranded under a full block.
   */
  if (out.length > 1 && sentences.length % perParagraph === 1 && out.length > 2) {
    const last = out.pop();
    if (last) out[out.length - 1] = `${out[out.length - 1]} ${last}`;
  }

  return out;
}
