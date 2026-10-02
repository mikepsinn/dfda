// Read-only comparison between this fork of the medical dataset and Optimitron.
// The dataset was copied from Optimitron and is now edited here; this script never writes files.
//   --check  confirms the recorded fork origin matches the Optimitron commit byte for byte.
//   --diff   lists files changed here since the fork, and files changed upstream since a later ref.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const [repository, mode = "--diff", upstreamRef, ...extra] = process.argv.slice(2);
if (!repository || extra.length || !["--check", "--diff"].includes(mode)) {
  throw new Error("Usage: node scripts/compare-optimitron-medical-data.mjs <optimitron-checkout> [--check|--diff [upstream-ref]]");
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL("../data/optimitron/manifest.json", import.meta.url)), "utf8"));
const { commit, root, files } = manifest.forkedFrom;
const local = fileURLToPath(new URL("../data/optimitron/medical-data/", import.meta.url));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { maxBuffer: 32 * 1024 * 1024 });
const upstreamFiles = ref => new Map(git("ls-tree", "-r", "--name-only", ref, "--", root).toString("utf8").trim().split("\n")
  .map(path => [path.slice(root.length + 1), sha256(git("show", `${ref}:${path}`))]));

if (mode === "--check") {
  const origin = upstreamFiles(commit);
  const mismatched = files.filter(f => origin.get(f.path) !== f.sha256);
  if (mismatched.length || origin.size !== files.length) {
    throw new Error(`Fork record does not match ${commit}: ${mismatched.map(f => f.path).join(", ") || "file count differs"}`);
  }
  console.log(`The fork record matches all ${files.length} files at ${commit}.`);
} else {
  const changedHere = files.filter(f => {
    const path = join(local, f.path);
    return !existsSync(path) || sha256(readFileSync(path)) !== f.sha256;
  }).map(f => f.path);
  const recorded = new Set(files.map(f => f.path));
  const addedHere = readdirSync(join(local, "treatments")).map(n => `treatments/${n}`)
    .filter(path => !recorded.has(path));
  console.log(`Changed here since the fork: ${changedHere.length ? changedHere.join(", ") : "none"}`);
  console.log(`Added here since the fork: ${addedHere.length ? addedHere.join(", ") : "none"}`);
  if (upstreamRef) {
    const later = upstreamFiles(upstreamRef);
    const changedUpstream = [...later].filter(([path, hash]) => files.find(f => f.path === path)?.sha256 !== hash)
      .map(([path]) => path);
    console.log(`Changed in Optimitron between the fork and ${upstreamRef}: ${changedUpstream.join(", ") || "none"}`);
    console.log("Review upstream changes by hand; nothing is copied automatically.");
  }
}
