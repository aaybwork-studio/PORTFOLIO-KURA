/**
 * Image generation through the Gemini API.
 *
 *   node scripts/gemini-image.mjs --shots scripts/shots-hero.json
 *   node scripts/gemini-image.mjs --shots ... --only orbit
 *   node scripts/gemini-image.mjs --shots ... --plan
 *
 * Replaces the Renoise path for stills. Renoise is still where the video models
 * live, but its cheap image models smear interface type and its good one costs
 * more per frame than this does.
 *
 * A shot names a prompt, an aspect ratio, and any reference images. References
 * are sent inline as base64 alongside the prompt, which is how this API takes
 * them — there is no upload step and no material id to cache.
 *
 * Nothing here tries to make the model render a user interface correctly. It
 * builds the photograph; the real screen is composited on afterwards by
 * screen-composite.py. Every model tested redraws interface type eventually,
 * and on a portfolio the type is the product.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = "gemini-3-pro-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const flag = (n) => args.includes(n);

const SHOTS = opt("--shots");
const ONLY = opt("--only");
const PLAN = flag("--plan");
const FORCE = flag("--force");

if (!SHOTS) throw new Error("--shots <file> is required");

function apiKey() {
  const env = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = /^GEMINI_API_KEY=(.+)$/m.exec(env);
  if (!m) throw new Error("GEMINI_API_KEY is not in .env.local");
  return m[1].trim();
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function inlineRef(path) {
  const abs = path.startsWith("/") ? path : join(ROOT, path);
  if (!existsSync(abs)) throw new Error(`reference missing: ${path}`);
  return {
    inline_data: { mime_type: MIME[extname(abs).toLowerCase()] ?? "image/png", data: readFileSync(abs).toString("base64") },
  };
}

/** Longest side, so a 4K request is not silently downgraded. */
const SIZES = { "1K": "1K", "2K": "2K", "4K": "4K" };

async function generate(shot, key) {
  const parts = [{ text: shot.prompt }, ...(shot.refs ?? []).map(inlineRef)];
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: shot.ratio ?? "16:9",
        imageSize: SIZES[shot.size ?? "2K"] ?? "2K",
      },
    },
  };

  const r = await fetch(`${ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`);

  const cand = j.candidates?.[0];
  const img = cand?.content?.parts?.find((p) => p.inline_data ?? p.inlineData);
  if (!img) {
    const reason = cand?.finishReason ?? "no image in response";
    const text = cand?.content?.parts?.find((p) => p.text)?.text ?? "";
    throw new Error(`${reason}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return Buffer.from((img.inline_data ?? img.inlineData).data, "base64");
}

async function main() {
  const shots = JSON.parse(readFileSync(join(ROOT, SHOTS), "utf8"))
    .flatMap((p) => p.shots.map((s) => ({ ...s, project: p.project })))
    .filter((s) => !ONLY || (ONLY.includes("/") ? `${s.project}/${s.name}` === ONLY : s.project === ONLY));

  if (PLAN) {
    for (const s of shots) {
      const dest = join("public/media/case", s.project, "gen", `${s.name}.png`);
      const done = existsSync(join(ROOT, dest));
      console.log(`  ${done ? "=" : " "} ${`${s.project}/${s.name}`.padEnd(30)} ${(s.ratio ?? "16:9").padEnd(6)} ${s.size ?? "2K"}  refs:${(s.refs ?? []).length}`);
    }
    console.log(`\n  ${shots.length} shots, ${shots.filter((s) => existsSync(join(ROOT, "public/media/case", s.project, "gen", `${s.name}.png`))).length} already built`);
    return;
  }

  const key = apiKey();
  for (const s of shots) {
    const dest = join(ROOT, "public/media/case", s.project, "gen", `${s.name}.png`);
    if (existsSync(dest) && !FORCE) {
      console.log(`  = ${s.project}/${s.name}`);
      continue;
    }
    try {
      const buf = await generate(s, key);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      console.log(`  ✓ ${s.project}/${s.name}  ${(buf.length / 1048576).toFixed(1)}MB`);
    } catch (e) {
      console.error(`  ! ${s.project}/${s.name}: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
