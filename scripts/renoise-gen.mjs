/**
 * Drives Renoise generation for the case study media.
 *
 *   node scripts/renoise-gen.mjs --plan            # cost the manifest, generate nothing
 *   node scripts/renoise-gen.mjs --only orbit      # one project
 *   node scripts/renoise-gen.mjs --only orbit/hero # one shot
 *   node scripts/renoise-gen.mjs                   # everything outstanding
 *
 * Shots are declared in renoise-shots.json. Each one names a source plate from
 * public/media/case, a prompt, and a model. Plates are uploaded once and the
 * material id is cached by file hash, so re-runs cost nothing extra.
 *
 * Results land in public/media/case/<project>/gen/. Nothing is overwritten in
 * place: the built plates stay put until a generated frame is chosen to replace
 * them, so a bad generation can never destroy the fallback.
 *
 * Video shots set first_frame and last_frame to the same image. The model then
 * has to return to where it started, which is what makes the reel loop without
 * a cross-fade seam.
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(process.env.HOME, ".local", "bin", "renoise");
const SHOTS = join(ROOT, "scripts", process.argv.includes("--keyart") ? "renoise-keyart.json" : "renoise-shots.json");
const STATE = join(ROOT, "scripts", ".renoise-state.json");
const PROMPTS = "/private/tmp/claude-501/-Users-kura/803cad36-3e05-4c33-9628-58f9569ffbbe/scratchpad/prompts";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const PLAN_ONLY = flag("--plan");
const ONLY = opt("--only");
// Videos cost seven times an image and are cut from generated stills, so the
// stills get reviewed first.
const KIND = flag("--images") ? "image" : flag("--videos") ? "video" : null;

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { materials: {}, shots: {} };
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2));

async function cli(cliArgs, { json = false } = {}) {
  const { stdout } = await exec(CLI, json ? [...cliArgs, "--json"] : cliArgs, {
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
  });
  return json ? JSON.parse(stdout) : stdout;
}

/** Field lookup for the CLI's "Key:  value" table output. */
function field(text, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "mi").exec(text);
  return m ? m[1].trim() : null;
}

async function balance() {
  return Number(field(await cli(["account", "status"]), "Balance")?.replace(/[^0-9]/g, "") ?? 0);
}

/** Upload a plate once; the material id is keyed by content hash. */
async function material(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) throw new Error(`plate missing: ${relPath}`);
  const hash = createHash("md5").update(readFileSync(abs)).digest("hex");
  if (state.materials[hash]) return state.materials[hash];
  const res = await cli(["upload", abs], { json: true });
  const id = res.material.id;
  state.materials[hash] = id;
  save();
  console.log(`    uploaded ${relPath} -> material ${id}`);
  return id;
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return dest;
}

async function cost(shot) {
  const a = ["task", "cost", shot.model, "--resolution", shot.resolution];
  if (shot.type === "video") a.push("--duration", String(shot.duration ?? 6));
  const out = await cli(a);
  return Number(field(out, "Estimated cost")?.replace(/[^0-9]/g, "") ?? 0);
}

async function run(shot) {
  const key = `${shot.project}/${shot.name}`;
  const ext = shot.type === "video" ? "mp4" : "png";
  const dest = join(ROOT, "public", "media", "case", shot.project, "gen", `${shot.name}.${ext}`);

  if (state.shots[key]?.file && existsSync(join(ROOT, state.shots[key].file))) {
    console.log(`  = ${key} (already generated)`);
    return;
  }

  // A video's frames may be the output of an earlier image shot.
  const plate = shot.from
    ? join("public", "media", "case", shot.project, "gen", `${shot.from}.png`)
    : shot.plate;

  // Key art has no plate: there is no interface to hold true, so it is drawn
  // from the prompt alone rather than from a reference.
  let roles = [];
  if (plate) {
    const id = await material(plate);
    // hailuo-h3 rejects a last frame that matches the first, so the loop is
    // asked for in the prompt instead: the still opens the clip as first_frame
    // and the motion described is the kind that comes back on its own.
    roles = [`${id}:${shot.type === "video" ? "first_frame" : "reference_image"}`];
  }

  mkdirSync(PROMPTS, { recursive: true });
  const pf = join(PROMPTS, `${shot.project}-${shot.name}.txt`);
  writeFileSync(pf, shot.prompt);

  const a = [
    "task", "create", shot.model,
    "--type", shot.type,
    "--prompt-file", pf,
    "--resolution", shot.resolution,
  ];
  if (roles.length) a.push("--materials", roles.join(","));
  // hailuo-h3 rejects an explicit ratio in frame mode: the frames define it.
  if (shot.ratio) a.push("--ratio", shot.ratio);
  if (shot.type === "video") a.push("--duration", String(shot.duration ?? 6));

  const created = await cli(a, { json: true });
  const taskId = created.task.id;
  console.log(`  > ${key}  task ${taskId}`);

  await cli(["task", "wait", String(taskId)]);
  const result = await cli(["task", "result", String(taskId)]);
  const url = field(result, "Video Url") ?? field(result, "Image Url");
  if (!url) throw new Error(`no output url for ${key}:\n${result}`);

  await download(url, dest);
  state.shots[key] = { taskId, file: dest.slice(ROOT.length + 1) };
  save();
  console.log(`  ✓ ${key} -> ${state.shots[key].file}`);
}

async function main() {
  const shots = JSON.parse(readFileSync(SHOTS, "utf8")).flatMap((p) =>
    p.shots.map((s) => ({ ...s, project: p.project }))
  );

  const selected = shots.filter((s) => {
    if (KIND && s.type !== KIND) return false;
    if (!ONLY) return true;
    return ONLY.includes("/") ? `${s.project}/${s.name}` === ONLY : s.project === ONLY;
  });

  if (PLAN_ONLY) {
    let total = 0;
    const done = [];
    for (const s of selected) {
      const key = `${s.project}/${s.name}`;
      const already = state.shots[key]?.file && existsSync(join(ROOT, state.shots[key].file));
      const c = await cost(s);
      if (already) done.push(key); else total += c;
      console.log(`  ${already ? "=" : " "} ${key.padEnd(28)} ${s.model.padEnd(22)} ${s.type.padEnd(5)} ${String(c).padStart(4)}`);
    }
    const bal = await balance();
    console.log(`\n  ${selected.length} shots, ${done.length} already done`);
    console.log(`  outstanding cost ${total} credits, balance ${bal}, left after ${bal - total}`);
    return;
  }

  for (const s of selected) {
    try {
      await run(s);
    } catch (err) {
      console.error(`  ! ${s.project}/${s.name}: ${err.message.split("\n")[0]}`);
    }
  }
  console.log(`\nbalance now ${await balance()} credits`);
}

main().catch((e) => { console.error(e); process.exit(1); });
