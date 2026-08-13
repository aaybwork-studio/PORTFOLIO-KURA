/*
 * Download the background music.
 *
 *   npm run tracks:fetch
 *
 * Straight from Free Music Archive's CDN. The obvious-looking route,
 * `/track/<slug>/download/`, serves a login page to anyone not signed in, and
 * curl will cheerfully write that HTML to a file called something.mp3 — six
 * identical 27 KB "tracks" that look downloaded and are not. That happened.
 * Hence both the CDN paths and the verification step below.
 *
 * Every track is by HoliznaCC0, from "Public Domain Lofi", CC0 1.0.
 */

import {
  closeSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CDN = "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks";

const FILES: { out: string; remote: string }[] = [
  { out: "moon-unit.mp3", remote: "CbNZO1QUuJq1f50RHzZ5kykNj1hdqT04UaWOYSNf.mp3" },
  { out: "lucid.mp3", remote: "je7RethXWuduCoRV6Gq3w25yDXvxYnnOWt5OGlgv.mp3" },
  { out: "calm-currents.mp3", remote: "4rKapZUMNnNSPAOvpjlfSH6B5Ib8rgEWdvjnM7C6.mp3" },
  { out: "tokyo-sunset.mp3", remote: "Xnd9Hr5AVzB68IlWcImKtXPlwCePD2G2m8ZFSVj4.mp3" },
  { out: "still-life.mp3", remote: "X2xAunfMENT4KSm1XpnQC2qUUC4hcMVbDXBMw9GI.mp3" },
  { out: "when-i-was-human.mp3", remote: "ChrX4PnONgrlvh9m2tgYBpK7mwnbfpLJoo36OOFW.mp3" },
];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "public", "audio");

/** An MP3 starts with an ID3 tag or a frame sync. Anything else is not audio. */
function looksLikeMp3(path: string): boolean {
  const { size } = statSync(path);
  // A login page is ~27 KB; the shortest real track here is over a megabyte.
  if (size < 200_000) return false;
  const fd = openSync(path, "r");
  const head = Buffer.alloc(3);
  readSync(fd, head, 0, 3, 0);
  closeSync(fd);
  return head.toString("latin1") === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
}

async function download(remote: string, out: string): Promise<void> {
  const url = `${CDN}/${remote}`;
  const target = resolve(outDir, out);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(target));

  if (!looksLikeMp3(target)) {
    unlinkSync(target);
    throw new Error("server returned something that is not audio");
  }

  const mb = (statSync(target).size / 1_048_576).toFixed(1);
  console.log(`  ok  ${out}  ${mb} MB`);
}

async function main() {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  console.log(`\n  Downloading ${FILES.length} tracks into public/audio\n`);

  let failed = 0;
  for (const f of FILES) {
    try {
      await download(f.remote, f.out);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${f.out}  ${(err as Error).message}`);
    }
  }

  if (failed) {
    console.error(
      `\n  ${failed} of ${FILES.length} failed. See public/audio/README.md for the ` +
        `track pages to download by hand.\n`,
    );
    process.exit(1);
  }

  console.log("\n  Done. Commit them — Vercel builds from the repo.\n");
}

void main();
