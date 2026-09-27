import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  extractTrialComparison, selectTrialSource, trialSelection, trialSnapshotSchema,
} from "../lib/evidence/clinical-trial-comparison";

const destination = new URL("../data/evidence/NCT01097616.suvorexant-sleep.v1.json", import.meta.url);
const digest = (source: unknown) => createHash("sha256")
  .update(JSON.stringify(source)).digest("hex");

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--check", "--write"].includes(arg)) || args.length > 1) {
    throw new Error("Use --check (offline), --write (replace snapshot), or no flag (preview).");
  }
  if (args.includes("--check")) {
    const snapshot = trialSnapshotSchema.parse(JSON.parse(await readFile(destination, "utf8")));
    if (digest(snapshot.source) !== snapshot.sourceSha256) throw new Error("Source checksum mismatch");
    console.log(JSON.stringify(extractTrialComparison(snapshot.source), null, 2));
    return;
  }
  const response = await fetch(trialSelection.apiUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`ClinicalTrials.gov returned ${response.status}`);
  const source = selectTrialSource(await response.json());
  const snapshot = trialSnapshotSchema.parse({
    schemaVersion: 1,
    sourceUrl: trialSelection.apiUrl,
    retrievedAt: new Date().toISOString(),
    sourceSha256: digest(source),
    source,
  });
  console.log(JSON.stringify(extractTrialComparison(source), null, 2));
  if (args.includes("--write")) {
    await mkdir(new URL("../data/evidence/", import.meta.url), { recursive: true });
    await writeFile(destination, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Saved ${fileURLToPath(destination)}. Review the diff before publication.`);
  } else {
    console.log("Preview only. Use --write to replace the local snapshot.");
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
