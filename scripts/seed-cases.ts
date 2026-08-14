/**
 * Replaces the placeholder projects with the five real case studies.
 *
 *   npx tsx scripts/seed-cases.ts          # dry run, prints what it would write
 *   npx tsx scripts/seed-cases.ts --write  # commits the transaction
 *
 * Copy comes from scripts/case-content.ts. Images are left alone: existing
 * cardImage / heroImage on a document are preserved, and sections seed with no
 * media so they render text-only until the real shots are uploaded in Studio.
 *
 * Old placeholder documents (project-project-01 … 04) are deleted, unless a
 * real slug happens to reuse one of those ids, which it does not.
 *
 * Requires SANITY_API_WRITE_TOKEN in .env.local.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cases } from "./case-content";

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const write = process.argv.includes("--write");

if (!projectId) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set");
if (!token) throw new Error("SANITY_API_WRITE_TOKEN is not set");

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-02-19",
  useCdn: false,
});

const docId = (slug: string) => `project-${slug}`;

async function main() {
  const existing: { _id: string; slug: string | null }[] = await client.fetch(
    `*[_type=="project"]{_id,"slug":slug.current}`
  );
  const keep = new Set(cases.map((c) => docId(c.slug)));
  const stale = existing.filter((d) => !keep.has(d._id));

  console.log(`${projectId}/${dataset}`);
  console.log(`\nWriting ${cases.length} projects:`);
  for (const c of cases) {
    console.log(`  ${docId(c.slug)}  ${c.title} (${c.year}) — ${c.sections.length} sections`);
  }
  if (stale.length) {
    console.log(`\nDeleting ${stale.length} stale documents:`);
    for (const d of stale) console.log(`  ${d._id}  ${d.slug ?? "(no slug)"}`);
  }

  if (!write) {
    console.log("\nDry run. Re-run with --write to commit.");
    return;
  }

  // Existing images are re-attached so a reseed never blanks artwork that was
  // uploaded through Studio after the first run.
  const priorImages: Record<string, { cardImage?: unknown; heroImage?: unknown }> =
    Object.fromEntries(
      (
        await client.fetch<{ _id: string; cardImage?: unknown; heroImage?: unknown }[]>(
          `*[_type=="project"]{_id,cardImage,heroImage}`
        )
      ).map((d) => [d._id, { cardImage: d.cardImage, heroImage: d.heroImage }])
    );

  const tx = client.transaction();

  // Anything without its own artwork borrows a placeholder image off the old
  // documents, so no card renders as an empty frame before the real shots land.
  const spares = Object.values(priorImages)
    .flatMap((p) => [p.cardImage, p.heroImage])
    .filter(Boolean);

  for (const [i, c] of cases.entries()) {
    const id = docId(c.slug);
    const prior = priorImages[id] ?? {};
    if (!prior.cardImage && spares.length) prior.cardImage = spares[i % spares.length];
    if (!prior.heroImage && spares.length) prior.heroImage = spares[(i + 1) % spares.length];
    tx.createOrReplace({
      _id: id,
      _type: "project",
      title: c.title,
      slug: { _type: "slug", current: c.slug },
      kicker: c.kicker,
      year: c.year,
      role: c.role,
      discipline: c.discipline,
      order: c.order,
      comingSoon: c.comingSoon,
      homeCardLabel: c.homeCardLabel,
      workCardSubtitle: c.workCardSubtitle,
      homeAspect: c.homeAspect,
      ...(prior.cardImage ? { cardImage: prior.cardImage } : {}),
      ...(prior.heroImage ? { heroImage: prior.heroImage } : {}),
      sections: c.sections.map((s, j) => ({
        _key: `section-${j}`,
        _type: "caseSection",
        kicker: s.kicker,
        heading: s.heading,
        body: s.body,
        note: s.note,
      })),
    });
  }

  for (const d of stale) tx.delete(d._id);

  await tx.commit();
  console.log(`\nDone: ${cases.length} projects written, ${stale.length} deleted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
