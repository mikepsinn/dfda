// Copies the complete pinned source directory without transforming its contents.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [repository, mode = "--preview", ...extra] = process.argv.slice(2);
if (!repository || extra.length || !["--preview", "--write", "--check"].includes(mode)) {
  throw new Error("Usage: node scripts/import-optimitron-medical-data.mjs <source-checkout> [--preview|--write|--check]");
}
const sourceCommit = "06ffef0fa4d9e00dde304c30bf8a8213297cb45b";
const sourceRoot = "packages/data/src/datasets/medical-data";
const destination = fileURLToPath(new URL("../data/optimitron/medical-data/", import.meta.url));
const manifestPath = fileURLToPath(new URL("../data/optimitron/manifest.json", import.meta.url));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { maxBuffer: 32 * 1024 * 1024 });
const paths = git("ls-tree", "-r", "--name-only", sourceCommit, "--", sourceRoot)
  .toString("utf8").trim().split("\n");
const entries = paths.map(sourcePath => {
  const path = sourcePath.slice(sourceRoot.length + 1);
  if (!sourcePath.startsWith(`${sourceRoot}/`) || !/^(?:treatments\/)?[a-zA-Z0-9.-]+$/.test(path)) {
    throw new Error(`Unexpected source path: ${sourcePath}`);
  }
  const bytes = git("show", `${sourceCommit}:${sourcePath}`);
  if (path.endsWith(".json")) JSON.parse(bytes.toString("utf8"));
  return { path, bytes, sha256: sha256(bytes) };
});
const readSource = path => JSON.parse(entries.find(e => e.path === path).bytes.toString("utf8"));
const conditions = readSource("conditions.json");
const slugs = readSource("treatments/index.json").conditions;
if (new Set(slugs).size !== slugs.length || conditions.length !== slugs.length ||
    conditions.some(c => !slugs.includes(c.slug)) ||
    entries.filter(e => e.path.startsWith("treatments/") && e.path !== "treatments/index.json").length !== slugs.length) {
  throw new Error("Condition index and treatment files do not agree");
}
const comparisons = slugs.reduce((count, slug) => count + readSource(`treatments/${slug}.json`).treatments.length, 0);
const manifest = {
  schemaVersion: 1,
  sourceRepository: "mikepsinn/optimitron",
  sourceCommit,
  sourceRoot,
  displayOrigin: "model-estimate",
  reviewStatus: "unverified-import",
  counts: { conditions: conditions.length, treatmentComparisons: comparisons,
    treatments: readSource("treatments.json").length, references: readSource("references.json").references.length },
  files: entries.map(({ path, bytes, sha256 }) => ({ path, bytes: bytes.length, sha256 })),
};

function localFiles(directory, prefix = "") {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? localFiles(join(directory, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]);
}

if (mode === "--check") {
  const saved = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (JSON.stringify(saved) !== JSON.stringify(manifest)) throw new Error("Manifest differs from pinned source");
  if (localFiles(destination).sort().join("\n") !== entries.map(e => e.path).sort().join("\n")) {
    throw new Error("Local source file inventory differs from pinned source");
  }
  for (const entry of entries) {
    if (!readFileSync(join(destination, entry.path)).equals(entry.bytes)) throw new Error(`Source mismatch: ${entry.path}`);
  }
  console.log(`All ${entries.length} files match the pinned source byte for byte.`);
} else if (mode === "--write") {
  // Check the whole destination before writing anything. Do not erase user edits
  // or stale files during refresh; require their explicit reconciliation instead.
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
  for (const path of localFiles(destination)) {
    const recorded = previous?.files.find(e => e.path === path);
    if (!recorded || sha256(readFileSync(join(destination, path))) !== recorded.sha256) {
      throw new Error(`Preserving unrecorded or edited local file: ${path}`);
    }
    if (!entries.some(e => e.path === path)) throw new Error(`Reconcile retired source file before refresh: ${path}`);
  }
  for (const { path, bytes } of entries) {
    const target = join(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Copied ${entries.length} complete source files. No fields were removed.`);
} else {
  console.log(`Preview: ${entries.length} files; no files changed. Use --write to import.`);
}
console.log(JSON.stringify(manifest.counts));
