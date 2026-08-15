/**
 * Sets each project's card and hero image to its key art.
 *
 *   npx tsx scripts/seed-case-art.ts          # dry run
 *   npx tsx scripts/seed-case-art.ts --write  # upload and patch
 *
 * Both fields take the same asset deliberately. The work grid crops it to 4:3
 * and the case study header to 16:9, so every piece is composed centre-weighted
 * to survive both. Uploading once also means the grid and the page it opens are
 * never out of step.
 *
 * This is safe to run at any point: unlike seed-cases.ts it patches two fields
 * rather than replacing the document.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

const SLUGS = ["orbit", "queue", "memory-bank", "guitar-flow", "navaid"];

async function main() {
  console.log(`${projectId}/${dataset}\n`);

  const files = SLUGS.map((slug) => ({
    slug,
    file: join(process.cwd(), "public", "media", "case", slug, "keyart.jpg"),
  }));

  const missing = files.filter((f) => !existsSync(f.file));
  for (const m of missing) console.log(`  ! missing ${m.file}`);
  if (missing.length) throw new Error(`${missing.length} key art files not built`);

  for (const { slug } of files) console.log(`  ${slug.padEnd(14)} keyart.jpg -> cardImage + heroImage`);

  if (!write) {
    console.log("\nDry run. Re-run with --write to upload and patch.");
    return;
  }

  console.log("\nUploading...");
  for (const { slug, file } of files) {
    const asset = await client.assets.upload("image", readFileSync(file), { filename: `${slug}-keyart.jpg` });
    const image = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
    await client.patch(`project-${slug}`).set({ cardImage: image, heroImage: image }).commit();
    console.log(`  ✓ project-${slug}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
