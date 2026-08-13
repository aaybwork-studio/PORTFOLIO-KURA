/**
 * Seeds the Sanity dataset with the design's content.
 *
 *   npx tsx scripts/seed.ts
 *
 * Idempotent: documents use fixed _ids and are written with createOrReplace,
 * and each image in public/media is uploaded once (Sanity dedupes by hash).
 *
 * Requires SANITY_API_WRITE_TOKEN in .env.local.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  fallbackProjects,
  fallbackArchive,
  fallbackSiteSettings,
  fallbackInfoPage,
} from "../src/lib/fallback";
import type { ResolvedImage } from "../src/lib/types";

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
const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_READ_TOKEN;

if (!projectId) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set");
if (!token) throw new Error("SANITY_API_WRITE_TOKEN is not set");

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-02-19",
  useCdn: false,
});

/** Uploads /media/*.png once each and returns a path -> assetId map. */
async function uploadImages(paths: string[]) {
  const map = new Map<string, string>();
  for (const p of [...new Set(paths)]) {
    const file = join(process.cwd(), "public", p.replace(/^\//, ""));
    if (!existsSync(file)) {
      console.warn(`  ! missing ${file} — skipping`);
      continue;
    }
    const asset = await client.assets.upload("image", readFileSync(file), {
      filename: p.split("/").pop(),
    });
    map.set(p, asset._id);
    console.log(`  uploaded ${p} -> ${asset._id}`);
  }
  return map;
}

const imageRef = (map: Map<string, string>, img: ResolvedImage | undefined) => {
  const id = img && map.get(img.src);
  return id ? { _type: "image", asset: { _type: "reference", _ref: id } } : undefined;
};

async function main() {
  console.log(`Seeding ${projectId}/${dataset}\n`);

  const allPaths = [
    ...fallbackProjects.flatMap((p) => [
      p.cardImage.src,
      p.heroImage.src,
      ...p.sections.flatMap((s) => [s.imageA.src, s.imageB.src]),
    ]),
    ...fallbackArchive.map((a) => a.image.src),
  ];

  console.log("Uploading images...");
  const images = await uploadImages(allPaths);

  const tx = client.transaction();

  tx.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    ...fallbackSiteSettings,
    socials: fallbackSiteSettings.socials.map((s, i) => ({
      _key: `social-${i}`,
      _type: "socialLink",
      ...s,
    })),
  });

  tx.createOrReplace({
    _id: "infoPage",
    _type: "infoPage",
    ...fallbackInfoPage,
    faq: fallbackInfoPage.faq.map((q, i) => ({
      _key: `faq-${i}`,
      _type: "faqItem",
      ...q,
    })),
    services: fallbackInfoPage.services.map((s, i) => ({
      _key: `service-${i}`,
      _type: "serviceItem",
      ...s,
    })),
  });

  fallbackProjects.forEach((p) => {
    tx.createOrReplace({
      _id: `project-${p.slug}`,
      _type: "project",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      kicker: p.kicker,
      year: p.year,
      role: p.role,
      discipline: p.discipline,
      order: p.order,
      comingSoon: p.comingSoon,
      homeCardLabel: p.homeCardLabel,
      workCardSubtitle: p.workCardSubtitle,
      homeAspect: p.homeAspect,
      cardImage: imageRef(images, p.cardImage),
      heroImage: imageRef(images, p.heroImage),
      sections: p.sections.map((s, j) => ({
        _key: `section-${j}`,
        _type: "caseSection",
        kicker: s.kicker,
        heading: s.heading,
        body: s.body,
        note: s.note,
        imageA: imageRef(images, s.imageA),
        imageB: imageRef(images, s.imageB),
      })),
    });
  });

  fallbackArchive.forEach((a, i) => {
    tx.createOrReplace({
      _id: `archive-${i + 1}`,
      _type: "archiveItem",
      title: a.title,
      order: a.order,
      image: imageRef(images, a.image),
    });
  });

  await tx.commit();

  console.log(
    `\nDone: 1 siteSettings, 1 infoPage, ${fallbackProjects.length} projects, ${fallbackArchive.length} archive items.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
