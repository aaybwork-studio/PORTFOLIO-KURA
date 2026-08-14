/**
 * Fills the archive with the real posters, interface studies and photographs.
 *
 *   npx tsx scripts/seed-archive.ts          # dry run
 *   npx tsx scripts/seed-archive.ts --write  # uploads images and commits
 *
 * Run scripts/archive-derivatives.py first — this reads the JPEGs it writes to
 * public/media/archive. Every file is uploaded once (Sanity dedupes by hash),
 * so re-running is cheap and idempotent.
 *
 * Old archive documents are deleted so the carousel does not end up half
 * placeholder, half real.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { photos, posters, uiSets, type ArchiveSeed } from "./archive-content";

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

const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });

/*
 * Carousel order.
 *
 * Grouping all eleven posters, then all the UI, then fifteen photographs would
 * make each row of the carousel look like one long theme. Interleaving spreads
 * the kinds so any slice of the arc has a mix in it.
 */
function interleave(): ArchiveSeed[] {
  const out: ArchiveSeed[] = [];
  const queues = [posters.slice(), photos.slice(), uiSets.slice()];
  const weights = [2, 2, 1];
  while (queues.some((q) => q.length)) {
    queues.forEach((q, i) => {
      for (let n = 0; n < weights[i] && q.length; n++) out.push(q.shift()!);
    });
  }
  return out;
}

const items = interleave();
const docId = (slug: string) => `archive-${slug}`;

async function uploadAll(paths: string[]) {
  const map = new Map<string, string>();
  for (const p of [...new Set(paths)]) {
    const file = join(process.cwd(), "public", p.replace(/^\//, ""));
    if (!existsSync(file)) {
      console.warn(`  ! missing ${file}`);
      continue;
    }
    const asset = await client.assets.upload("image", readFileSync(file), {
      filename: p.split("/").pop(),
    });
    map.set(p, asset._id);
  }
  return map;
}

const ref = (map: Map<string, string>, src: string) => {
  const id = map.get(src);
  return id ? { _type: "image", asset: { _type: "reference", _ref: id } } : undefined;
};

async function main() {
  const existing: { _id: string }[] = await client.fetch(`*[_type=="archiveItem"]{_id}`);
  const keep = new Set(items.map((i) => docId(i.slug)));
  const stale = existing.filter((d) => !keep.has(d._id));

  const counts = {
    posters: posters.length,
    ui: uiSets.length,
    photos: photos.length,
    images: items.reduce((n, i) => n + 1 + i.gallery.length, 0),
  };

  console.log(`${projectId}/${dataset}\n`);
  console.log(`${items.length} archive items: ${counts.posters} posters, ${counts.ui} UI sets, ${counts.photos} photographs`);
  console.log(`${counts.images} images to upload`);
  console.log(`${stale.length} old documents to delete`);

  if (!write) {
    console.log("\nOrder:");
    items.forEach((i, n) => console.log(`  ${String(n).padStart(2, "0")}  ${i.kind.padEnd(6)} ${i.title}`));
    console.log("\nDry run. Re-run with --write to commit.");
    return;
  }

  console.log("\nUploading images...");
  const map = await uploadAll(items.flatMap((i) => [i.card, ...i.gallery.map((g) => g.src)]));
  console.log(`  ${map.size} uploaded`);

  const tx = client.transaction();

  items.forEach((item, order) => {
    const image = ref(map, item.card);
    if (!image) {
      console.warn(`  ! no card image for ${item.slug} — skipping`);
      return;
    }
    tx.createOrReplace({
      _id: docId(item.slug),
      _type: "archiveItem",
      title: item.title,
      slug: { _type: "slug", current: item.slug },
      kind: item.kind,
      ...(item.year ? { year: item.year } : {}),
      ...(item.note ? { note: item.note } : {}),
      image,
      order,
      gallery: item.gallery
        .map((g, i) => {
          const img = ref(map, g.src);
          return img
            ? { _key: `media-${i}`, _type: "caseMedia", span: g.span, alt: g.alt, image: img }
            : null;
        })
        .filter(Boolean),
    });
  });

  for (const d of stale) tx.delete(d._id);

  await tx.commit();
  console.log(`\nDone: ${items.length} items written, ${stale.length} deleted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
