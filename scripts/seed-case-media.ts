/**
 * Attaches the built media to the five case studies, section by section.
 *
 *   npx tsx scripts/seed-case-media.ts          # dry run
 *   npx tsx scripts/seed-case-media.ts --write  # upload and patch
 *
 * Images are uploaded to Sanity. Videos are referenced by URL on the site's own
 * domain, because caseMedia takes a video URL rather than an upload — so the
 * files in public/media/case must be deployed for the clips to play.
 *
 * Section order is fixed by the copy: 0 About, 1 Process, 2 Challenges,
 * 3 Craft, 4 Results, 5 System. Nothing appears twice: each asset is used in
 * exactly one slot, in one project.
 *
 * Run this after seed-cases.ts, never before. That script rebuilds sections
 * wholesale, so it drops whatever media is attached to them.
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

const SITE = "https://aayushbhandari.com";

type Slot = { src: string; span: "full" | "half"; alt: string };

/** section index -> media for that section */
type Plan = Record<string, Record<number, Slot[]>>;

const B = "/media/case";

const plan: Plan = {
  orbit: {
    0: [{ src: `${B}/orbit/hero.jpg`, span: "full", alt: "Orbit on a desk at night, the orb waiting for a query" }],
    1: [
      { src: `${B}/orbit/scan.jpg`, span: "half", alt: "Choosing directories for the first index" },
      { src: `${B}/orbit/history.jpg`, span: "half", alt: "History of past retrievals" },
    ],
    2: [{ src: `${B}/orbit/overlay.jpg`, span: "full", alt: "The overlay: one input over whatever is already open" }],
    3: [{ src: `${B}/orbit/reel.mp4`, span: "full", alt: "The orb turning while the machine waits" }],
    4: [
      { src: `${B}/orbit/spaces.jpg`, span: "half", alt: "Spaces as semantic containers" },
      { src: `${B}/orbit/companion.jpg`, span: "half", alt: "The mobile companion, late at night" },
    ],
    5: [{ src: `${B}/orbit/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  queue: {
    0: [{ src: `${B}/queue/hero.jpg`, span: "full", alt: "The kiosk on the salon counter, ready for the next client" }],
    1: [{ src: `${B}/queue/analysis-panel.jpg`, span: "full", alt: "Face analysis returned as an overview" }],
    2: [
      { src: `${B}/queue/tryon.jpg`, span: "half", alt: "Browsing styles on the kiosk" },
      { src: `${B}/queue/compare.jpg`, span: "half", alt: "Two styles held side by side" },
    ],
    3: [{ src: `${B}/queue/reel.mp4`, span: "full", alt: "The kiosk waiting on the counter" }],
    4: [
      { src: `${B}/queue/stylist.jpg`, span: "half", alt: "The AI stylist, asked out loud" },
      { src: `${B}/queue/styles.jpg`, span: "half", alt: "Suggested styles from the scan" },
    ],
    5: [{ src: `${B}/queue/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  "memory-bank": {
    0: [{ src: `${B}/memory-bank/hero.jpg`, span: "full", alt: "The map as the home screen, out on the street" }],
    1: [
      { src: `${B}/memory-bank/library.jpg`, span: "half", alt: "Memories grouped by place" },
      { src: `${B}/memory-bank/memory.jpg`, span: "half", alt: "A memory with its note and mood" },
    ],
    2: [{ src: `${B}/memory-bank/reel-spatial.mp4`, span: "full", alt: "Capturing depth at the water's edge" }],
    3: [
      { src: `${B}/memory-bank/capture.jpg`, span: "half", alt: "Capture, moving the phone to read depth" },
      { src: `${B}/memory-bank/save.jpg`, span: "half", alt: "Saving with a note and an emotion tag" },
    ],
    4: [{ src: `${B}/memory-bank/reel-map.mp4`, span: "full", alt: "Arriving near a saved memory" }],
    5: [{ src: `${B}/memory-bank/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  // The passthrough clip is the only footage shot on the real headset, so it
  // closes the page rather than opening it: the generated pieces set the scene
  // and the real capture is the payoff.
  "guitar-flow": {
    0: [{ src: `${B}/guitar-flow/hero-loop.mp4`, span: "full", alt: "The menu floating in the practice room" }],
    1: [{ src: `${B}/guitar-flow/unity-2.jpg`, span: "full", alt: "The MR scene under construction" }],
    2: [{ src: `${B}/guitar-flow/lesson.jpg`, span: "full", alt: "Lesson panel beside the guitar" }],
    3: [{ src: `${B}/guitar-flow/play.jpg`, span: "full", alt: "Song selection, seen from behind the guitar" }],
    4: [{ src: `${B}/guitar-flow/reel-passthrough.mp4`, span: "full", alt: "Passthrough capture: the overlay on a real guitar" }],
    5: [{ src: `${B}/guitar-flow/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  navaid: {
    0: [{ src: `${B}/navaid/hero-screen.jpg`, span: "full", alt: "The chair with its attachment, navigation running" }],
    1: [{ src: `${B}/navaid/sensors.jpg`, span: "full", alt: "What the sensors detect around the chair" }],
    2: [
      { src: `${B}/navaid/outdoors.jpg`, span: "half", alt: "Navigating a pavement crossing" },
      { src: `${B}/navaid/manual.jpg`, span: "half", alt: "Manual map search, seen from the chair" },
    ],
    3: [{ src: `${B}/navaid/reel-screen.mp4`, span: "full", alt: "The chair waiting in the corridor" }],
    4: [
      { src: `${B}/navaid/location.jpg`, span: "half", alt: "Companion app showing where the chair is" },
      { src: `${B}/navaid/add-chair.jpg`, span: "half", alt: "Pairing a chair for the first time" },
    ],
    5: [{ src: `${B}/navaid/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
};

const isVideo = (src: string) => src.endsWith(".mp4") || src.endsWith(".webm");

async function upload(paths: string[]) {
  const map = new Map<string, string>();
  for (const p of [...new Set(paths)]) {
    const file = join(process.cwd(), "public", p.replace(/^\//, ""));
    if (!existsSync(file)) {
      console.warn(`  ! missing ${file}`);
      continue;
    }
    const asset = await client.assets.upload("image", readFileSync(file), { filename: p.split("/").pop() });
    map.set(p, asset._id);
  }
  return map;
}

async function main() {
  const all = Object.values(plan).flatMap((sections) => Object.values(sections).flat());
  const images = all.filter((s) => !isVideo(s.src));
  const videos = all.filter((s) => isVideo(s.src));

  console.log(`${projectId}/${dataset}\n`);
  for (const [slug, sections] of Object.entries(plan)) {
    const counts = Object.entries(sections)
      .map(([i, slots]) => `${i}:${slots.length}`)
      .join(" ");
    console.log(`  ${slug.padEnd(14)} sections ${counts}`);
  }
  console.log(`\n${images.length} images to upload, ${videos.length} videos referenced by URL`);

  const missing = all.filter((s) => !existsSync(join(process.cwd(), "public", s.src.replace(/^\//, ""))));
  if (missing.length) {
    console.log(`\n! ${missing.length} files not built yet:`);
    for (const m of missing) console.log(`   ${m.src}`);
  }

  if (!write) {
    console.log("\nDry run. Re-run with --write to upload and patch.");
    return;
  }

  console.log("\nUploading...");
  const map = await upload(images.map((s) => s.src));
  console.log(`  ${map.size} uploaded`);

  for (const [slug, sections] of Object.entries(plan)) {
    const patch = client.patch(`project-${slug}`);
    for (const [idx, slots] of Object.entries(sections)) {
      const media = slots
        .map((s, i) => {
          const base = { _key: `m-${idx}-${i}`, _type: "caseMedia", span: s.span, alt: s.alt };
          if (isVideo(s.src)) return { ...base, videoUrl: `${SITE}${s.src}` };
          const id = map.get(s.src);
          return id ? { ...base, image: { _type: "image", asset: { _type: "reference", _ref: id } } } : null;
        })
        .filter(Boolean);
      patch.set({ [`sections[${idx}].media`]: media });
    }
    await patch.commit();
    console.log(`  patched project-${slug}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
