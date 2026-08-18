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

type Slot = {
  src: string;
  span: "full" | "half";
  alt: string;
  /** overrides the shape the span would give the block */
  ratio?: string;
  /** first frame, shown while a video loads; ignored for images */
  poster?: string;
};

/** section index -> media for that section */
type Plan = Record<string, Record<number, Slot[]>>;

const B = "/media/case";

const plan: Plan = {
  // Section 0 (About) is the showreel slot, sitting directly under the page
  // hero. The reels are hand-made, cut in an editor rather than generated, and
  // built into their served form by scripts/build-reels.py.
  //
  // Sections 1 to 3 each run two half-width cards side by side then one
  // full-width photograph beneath. Section 4 closes with a single wide frame.
  orbit: {
    0: [
      {
        src: `${B}/orbit/showreel.mp4`,
        span: "full",
        alt: "Orbit on the desktop, retrieving a file",
        poster: `${B}/orbit/showreel.jpg`,
      },
    ],
    1: [
      { src: `${B}/orbit/spaces.jpg`, span: "half", alt: "Spaces as semantic containers" },
      { src: `${B}/orbit/history.jpg`, span: "half", alt: "History of past retrievals" },
      { src: `${B}/orbit/m-lineup.jpg`, span: "full", alt: "Home, history and browser side by side" },
    ],
    2: [
      { src: `${B}/orbit/m-detail.jpg`, span: "half", alt: "The wordmark at the screen's edge" },
      { src: `${B}/orbit/companion.jpg`, span: "half", alt: "The mobile companion, late at night" },
      { src: `${B}/orbit/m-devices.jpg`, span: "full", alt: "Desktop, tablet and phone together" },
    ],
    3: [
      { src: `${B}/orbit/m-flatlay.jpg`, span: "half", alt: "Screens laid out in sequence" },
      { src: `${B}/orbit/overlay.jpg`, span: "half", alt: "The overlay: one input over whatever is already open" },
      { src: `${B}/orbit/m-array.jpg`, span: "full", alt: "The interface repeated across a grid" },
    ],
    4: [
      { src: `${B}/orbit/m-desk.jpg`, span: "full", alt: "The desk it was built for" },
    ],
    5: [{ src: `${B}/orbit/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  queue: {
    // Two reels here, in this order. The search clip types out "confused about
    // what hairstyle to get" -- it is the question the whole case study answers,
    // so it has to be read before the product reel starts.
    0: [
      {
        src: `${B}/queue/showreel-search.mp4`,
        span: "full",
        // The clip is 5.7:1. In the 16:10 a full block would impose, 72% of the
        // width goes and the sentence reads "out what hairsty" -- which defeats
        // the only reason it is here. It runs as a strip instead.
        ratio: "16:3",
        alt: "Typing the question the salon cannot answer",
        poster: `${B}/queue/showreel-search.jpg`,
      },
      {
        src: `${B}/queue/showreel.mp4`,
        span: "full",
        alt: "Queue running on the salon kiosk",
        poster: `${B}/queue/showreel.jpg`,
      },
    ],
    1: [
      { src: `${B}/queue/tryon.jpg`, span: "half", alt: "Browsing styles on the kiosk" },
      { src: `${B}/queue/compare.jpg`, span: "half", alt: "Two styles held side by side" },
      { src: `${B}/queue/m-lineup.jpg`, span: "full", alt: "Browse, analysis and compare side by side" },
    ],
    2: [
      { src: `${B}/queue/m-detail.jpg`, span: "half", alt: "The kiosk's screen edge up close" },
      { src: `${B}/queue/stylist.jpg`, span: "half", alt: "The AI stylist, asked out loud" },
      { src: `${B}/queue/m-devices.jpg`, span: "full", alt: "Three kiosk screens together" },
    ],
    3: [
      { src: `${B}/queue/m-held.jpg`, span: "half", alt: "The kiosk held up to compare" },
      { src: `${B}/queue/analysis-panel.jpg`, span: "half", alt: "Face analysis returned as an overview" },
      { src: `${B}/queue/m-array.jpg`, span: "full", alt: "The kiosk repeated across a grid" },
    ],
    4: [
      { src: `${B}/queue/m-counter.jpg`, span: "full", alt: "The kiosk on the salon counter" },
    ],
    5: [{ src: `${B}/queue/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  "memory-bank": {
    0: [
      {
        src: `${B}/memory-bank/showreel.mp4`,
        span: "full",
        alt: "Dropping a memory onto the map",
        poster: `${B}/memory-bank/showreel.jpg`,
      },
    ],
    1: [
      { src: `${B}/memory-bank/library.jpg`, span: "half", alt: "Memories grouped by place" },
      { src: `${B}/memory-bank/memory.jpg`, span: "half", alt: "A memory with its note and mood" },
      { src: `${B}/memory-bank/m-lineup.jpg`, span: "full", alt: "Map, library and review side by side" },
    ],
    2: [
      { src: `${B}/memory-bank/m-detail.jpg`, span: "half", alt: "The library screen's edge up close" },
      { src: `${B}/memory-bank/capture.jpg`, span: "half", alt: "Capture, moving the phone to read depth" },
      { src: `${B}/memory-bank/m-array.jpg`, span: "full", alt: "The app repeated across a grid" },
    ],
    3: [
      { src: `${B}/memory-bank/m-prints.jpg`, span: "half", alt: "The phone on a stack of prints" },
      { src: `${B}/memory-bank/save.jpg`, span: "half", alt: "Saving with a note and an emotion tag" },
      { src: `${B}/memory-bank/m-flatlay.jpg`, span: "full", alt: "Screens laid out in sequence" },
    ],
    4: [
      { src: `${B}/memory-bank/m-street.jpg`, span: "full", alt: "Out on the street, near a saved memory" },
    ],
    5: [{ src: `${B}/memory-bank/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  "guitar-flow": {
    // The reel came out of the headset square, and a square is what it stays:
    // cropped to the 16:10 a full-width block would impose, the fretboard goes
    // over the edge. It takes a half instead, with the menu shot beside it at
    // the same 1:1 -- a lone square centred on the page reads as a mistake, two
    // squares side by side read as a decision.
    0: [
      {
        src: `${B}/guitar-flow/showreel.mp4`,
        span: "half",
        ratio: "1:1",
        alt: "Playing along, seen through the headset",
        poster: `${B}/guitar-flow/showreel.jpg`,
      },
      {
        src: `${B}/guitar-flow/keyart.jpg`,
        span: "half",
        ratio: "1:1",
        alt: "The menu, anchored in the practice room",
      },
    ],
    1: [
      { src: `${B}/guitar-flow/menu.jpg`, span: "half", alt: "The menu floating in the practice room" },
      { src: `${B}/guitar-flow/unity-2.jpg`, span: "half", alt: "The MR scene under construction" },
      { src: `${B}/guitar-flow/m-lineup.jpg`, span: "full", alt: "Three panels seen from behind the guitar" },
    ],
    2: [
      { src: `${B}/guitar-flow/m-detail.jpg`, span: "half", alt: "Markers sitting on the strings" },
      { src: `${B}/guitar-flow/lesson.jpg`, span: "half", alt: "Lesson panel beside the guitar" },
      { src: `${B}/guitar-flow/m-devices.jpg`, span: "full", alt: "Looking down the fretboard mid chord" },
    ],
    3: [
      { src: `${B}/guitar-flow/m-room.jpg`, span: "half", alt: "Seated, one lesson panel ahead" },
      { src: `${B}/guitar-flow/play.jpg`, span: "half", alt: "Song selection, seen from behind the guitar" },
      { src: `${B}/guitar-flow/m-array.jpg`, span: "full", alt: "Panels anchored through the room" },
    ],
    4: [
      { src: `${B}/guitar-flow/m-close.jpg`, span: "full", alt: "Mid song, the song list within reach" },
    ],
    5: [{ src: `${B}/guitar-flow/system.jpg`, span: "full", alt: "Type and colour tokens" }],
  },
  navaid: {
    0: [
      {
        src: `${B}/navaid/showreel.mp4`,
        span: "full",
        alt: "Driving the chair from the mounted screen",
        poster: `${B}/navaid/showreel.jpg`,
      },
    ],
    1: [
      { src: `${B}/navaid/outdoors.jpg`, span: "half", alt: "Navigating a pavement crossing" },
      { src: `${B}/navaid/manual.jpg`, span: "half", alt: "Manual map search, seen from the chair" },
      { src: `${B}/navaid/m-lineup.jpg`, span: "full", alt: "The companion app, location and pairing" },
    ],
    2: [
      { src: `${B}/navaid/m-detail.jpg`, span: "half", alt: "The mounted screen's corner up close" },
      { src: `${B}/navaid/location.jpg`, span: "half", alt: "Companion app showing where the chair is" },
      { src: `${B}/navaid/m-seated.jpg`, span: "full", alt: "Looking down at the control unit from the seat" },
    ],
    3: [
      { src: `${B}/navaid/m-joystick.jpg`, span: "half", alt: "The joystick under the screen" },
      { src: `${B}/navaid/m-mount.jpg`, span: "half", alt: "The mount behind the screen" },
      { src: `${B}/navaid/add-chair.jpg`, span: "full", alt: "Pairing a chair for the first time" },
    ],
    4: [
      { src: `${B}/navaid/m-caretaker.jpg`, span: "full", alt: "Checking the chair from another room" },
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
  // Posters upload exactly like any other image; only where they are attached
  // differs. A video with no poster shows a blank frame until it decodes.
  const images = [
    ...new Set([
      ...all.map((s) => s.src).filter((src) => !isVideo(src)),
      ...all.map((s) => s.poster).filter((p): p is string => Boolean(p)),
    ]),
  ];
  const videos = all.filter((s) => isVideo(s.src));

  console.log(`${projectId}/${dataset}\n`);
  for (const [slug, sections] of Object.entries(plan)) {
    const counts = Object.entries(sections)
      .map(([i, slots]) => `${i}:${slots.length}`)
      .join(" ");
    console.log(`  ${slug.padEnd(14)} sections ${counts}`);
  }
  console.log(`\n${images.length} images to check/upload, ${videos.length} videos referenced by URL`);

  const missing = images.filter((src) => !existsSync(join(process.cwd(), "public", src.replace(/^\//, ""))));
  if (missing.length) {
    console.log(`\n! ${missing.length} files missing:`);
    for (const m of missing) console.log(`   ${m}`);
  }

  if (!write) {
    console.log("\nDry run. Re-run with --write to upload and patch.");
    return;
  }

  console.log("\nUploading...");
  const map = await upload(images);
  console.log(`  ${map.size} uploaded / referenced`);

  for (const [slug, sections] of Object.entries(plan)) {
    // cardImage and heroImage are not touched here. They take the same asset as
    // each other and are owned by seed-case-art.ts; having two scripts write the
    // same two fields meant whichever ran last silently won.
    const patch = client.patch(`project-${slug}`);

    for (const [idx, slots] of Object.entries(sections)) {
      const media = slots
        .map((s, i) => {
          const ref = (id: string) => ({ _type: "image", asset: { _type: "reference", _ref: id } });
          const base = {
            _key: `m-${idx}-${i}`,
            _type: "caseMedia",
            span: s.span,
            alt: s.alt,
            ...(s.ratio ? { ratio: s.ratio } : {}),
          };
          if (isVideo(s.src)) {
            const poster = s.poster ? map.get(s.poster) : undefined;
            return {
              ...base,
              videoUrl: `${SITE}${s.src}`,
              ...(poster ? { poster: ref(poster) } : {}),
            };
          }
          const id = map.get(s.src);
          return id ? { ...base, image: ref(id) } : null;
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
