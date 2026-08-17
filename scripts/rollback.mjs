#!/usr/bin/env node
/*
 * Roll the live site back.
 *
 * Deployment is git-driven: Vercel builds whatever is on `main`, so rolling
 * back means putting different code on `main`. This does that by *reverting*
 * rather than resetting — a revert is a new commit that undoes the old ones, so
 * the history everyone else has already pulled stays valid and the rollback
 * itself is something you can undo. A force-push would rewrite published
 * history to fix a bad five minutes.
 *
 * Usage:
 *   npm run rollback              # undo the last commit
 *   npm run rollback -- 3         # undo the last 3 commits
 *   npm run rollback -- <sha>     # undo that one commit
 *   npm run rollback -- --to <sha>  # return the tree to exactly that commit
 *   npm run rollback -- --list    # show recent commits and exit
 *   npm run rollback -- --dry-run # print what would happen, change nothing
 *
 * Add --push to publish. Without it, the revert is made locally and left for
 * you to inspect — this script will not deploy anything on its own.
 */

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const DRY = flag("--dry-run");
const PUSH = flag("--push");

function git(cmdArgs, { capture = true } = {}) {
  return execFileSync("git", cmdArgs, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

/* ---------------------------------------------------------------- guards */

let branch;
try {
  branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
} catch {
  fail("Not a git repository.");
}

// A rollback of a dirty tree silently mixes uncommitted work into the revert.
const dirty = git(["status", "--porcelain"]).trim();
if (dirty && !DRY) {
  fail(
    "Working tree has uncommitted changes. Commit or stash them first:\n\n" +
      dirty
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n"),
  );
}

const recent = git(["log", "--oneline", "-15"]).trimEnd();

if (flag("--list") || flag("-l")) {
  console.log(`\n  Branch: ${branch}\n\n${recent.replace(/^/gm, "  ")}\n`);
  process.exit(0);
}

/* ------------------------------------------------------------- what to do */

const positional = args.filter((a) => !a.startsWith("-"));
const toIndex = args.indexOf("--to");
const target = toIndex >= 0 ? args[toIndex + 1] : null;

let plan;
if (target) {
  // Everything after `target` is undone in one commit, leaving the tree
  // exactly as it was at `target`.
  let resolved;
  try {
    resolved = git(["rev-parse", "--verify", `${target}^{commit}`]).trim();
  } catch {
    fail(`Not a commit: ${target}`);
  }
  plan = {
    label: `restore the tree to ${target} (${resolved.slice(0, 7)})`,
    run: () => {
      git(["revert", "--no-commit", `${resolved}..HEAD`], { capture: false });
      git(["commit", "-m", `Roll back to ${resolved.slice(0, 7)}`], { capture: false });
    },
  };
} else {
  const arg = positional[0] ?? "1";
  if (/^\d+$/.test(arg)) {
    const n = Number(arg);
    if (n < 1) fail("Count must be 1 or more.");
    plan = {
      label: `revert the last ${n} commit${n === 1 ? "" : "s"}`,
      run: () => git(["revert", "--no-edit", `HEAD~${n}..HEAD`], { capture: false }),
    };
  } else {
    let resolved;
    try {
      resolved = git(["rev-parse", "--verify", `${arg}^{commit}`]).trim();
    } catch {
      fail(`Not a commit: ${arg}`);
    }
    plan = {
      label: `revert commit ${resolved.slice(0, 7)}`,
      run: () => git(["revert", "--no-edit", resolved], { capture: false }),
    };
  }
}

/* -------------------------------------------------------------------- go */

console.log(`\n  Branch: ${branch}`);
console.log(`  Plan:   ${plan.label}`);
console.log(`  Push:   ${PUSH ? "yes — this will redeploy" : "no (add --push to publish)"}`);
console.log(`\n  Recent commits:\n${recent.replace(/^/gm, "    ")}\n`);

if (DRY) {
  console.log("  --dry-run: nothing changed.\n");
  process.exit(0);
}

try {
  plan.run();
} catch {
  fail(
    "Revert failed — most likely a conflict.\n" +
      "  Resolve the files, then `git revert --continue`,\n" +
      "  or abandon it with `git revert --abort`.",
  );
}

console.log(`\n  Reverted. HEAD is now:\n    ${git(["log", "--oneline", "-1"]).trim()}\n`);

if (!PUSH) {
  console.log("  Not pushed. Check it, then: git push\n");
  process.exit(0);
}

git(["push"], { capture: false });
console.log("\n  Pushed. Vercel will rebuild from this commit.\n");
