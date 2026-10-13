import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const directory = new URL("../data/crowdsourcing-cures-ratings/", import.meta.url);
const manifestUrl = new URL("manifest.json", directory);
const source = "Crowdsourcing Cures Aggregated Self-Reported Patient Ratings";
const sourceDatabase = "Crowdsourcing Cures Postgres database (Neon project \"wishonia\"), Dfda* tables";

// Ordered by source IDs so an unchanged source reproduces identical bytes.
const queries: Record<string, string> = {
  "treatment-ratings.jsonl": `
    SELECT r."conditionId", c.name AS condition, r."treatmentId", t.name AS treatment,
      r."majorImprovement", r."moderateImprovement", r."noEffect", r.worse, r."muchWorse",
      r.popularity, r."averageEffect"
    FROM "DfdaConditionTreatment" r
    JOIN "DfdaCondition" c ON c.id = r."conditionId"
    JOIN "DfdaTreatment" t ON t.id = r."treatmentId"
    WHERE r."deletedAt" IS NULL ORDER BY r."conditionId", r."treatmentId"`,
  "treatment-side-effects.jsonl": `
    SELECT r."treatmentId", t.name AS treatment, r."sideEffectId", s.name AS "sideEffect", r."votesPercent"
    FROM "DfdaTreatmentSideEffect" r
    JOIN "DfdaTreatment" t ON t.id = r."treatmentId"
    JOIN "DfdaSideEffect" s ON s.id = r."sideEffectId"
    WHERE r."deletedAt" IS NULL ORDER BY r."treatmentId", r."sideEffectId"`,
  "condition-symptoms.jsonl": `
    SELECT r."conditionId", c.name AS condition, r."symptomId", s.name AS symptom, r.votes,
      r.extreme, r.severe, r.moderate, r.mild, r.minimal, r."noSymptoms"
    FROM "DfdaConditionSymptom" r
    JOIN "DfdaCondition" c ON c.id = r."conditionId"
    JOIN "DfdaSymptom" s ON s.id = r."symptomId"
    WHERE r."deletedAt" IS NULL ORDER BY r."conditionId", r."symptomId"`,
  "condition-causes.jsonl": `
    SELECT r."conditionId", c.name AS condition, r."causeId", k.name AS cause, r."votesPercent"
    FROM "DfdaConditionCause" r
    JOIN "DfdaCondition" c ON c.id = r."conditionId"
    JOIN "DfdaCause" k ON k.id = r."causeId"
    WHERE r."deletedAt" IS NULL ORDER BY r."conditionId", r."causeId"`,
};

const lastUpdatedQuery = `SELECT GREATEST(
  (SELECT max("updatedAt") FROM "DfdaConditionTreatment"), (SELECT max("updatedAt") FROM "DfdaTreatmentSideEffect"),
  (SELECT max("updatedAt") FROM "DfdaConditionSymptom"), (SELECT max("updatedAt") FROM "DfdaConditionCause"),
  (SELECT max("updatedAt") FROM "DfdaCondition"), (SELECT max("updatedAt") FROM "DfdaTreatment"),
  (SELECT max("updatedAt") FROM "DfdaSideEffect"), (SELECT max("updatedAt") FROM "DfdaSymptom"),
  (SELECT max("updatedAt") FROM "DfdaCause")) AT TIME ZONE 'UTC' AS "lastUpdatedAt"`;

type FileEntry = { path: string; rows: number; bytes: number; sha256: string };
const describe = (path: string, text: string): FileEntry => ({
  path,
  rows: text.split("\n").length - 1,
  bytes: Buffer.byteLength(text),
  sha256: createHash("sha256").update(text).digest("hex"),
});

async function check() {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8")) as { files: FileEntry[] };
  for (const entry of manifest.files) {
    const actual = describe(entry.path, await readFile(new URL(entry.path, directory), "utf8"));
    if (JSON.stringify(actual) !== JSON.stringify(entry)) {
      throw new Error(`${entry.path} does not match manifest.json: ${JSON.stringify(actual)}`);
    }
  }
  const ratings = (await readFile(new URL("treatment-ratings.jsonl", directory), "utf8"))
    .trimEnd().split("\n").map(line => JSON.parse(line));
  const badTotal = ratings.find(r =>
    r.popularity !== r.majorImprovement + r.moderateImprovement + r.noEffect + r.worse + r.muchWorse);
  if (badTotal) throw new Error(`popularity is not the sum of the vote counts: ${JSON.stringify(badTotal)}`);
  console.log(`OK: ${manifest.files.map(f => `${f.path} (${f.rows} rows)`).join(", ")}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--check", "--write"].includes(arg)) || args.length > 1) {
    throw new Error("Use --check (offline), --write (replace snapshot), or no flag (preview).");
  }
  if (args.includes("--check")) return check();

  const connectionString = process.env.CROWDSOURCING_CURES_DATABASE_URL;
  if (!connectionString) throw new Error("Set CROWDSOURCING_CURES_DATABASE_URL to the source database.");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const texts: Record<string, string> = {};
    for (const [path, sql] of Object.entries(queries)) {
      const { rows } = await client.query(sql);
      texts[path] = rows.map(row => `${JSON.stringify(row)}\n`).join("");
    }
    const { rows: [{ lastUpdatedAt }] } = await client.query(lastUpdatedQuery);
    const files = Object.entries(texts).map(([path, text]) => describe(path, text));
    console.table(files.map(({ path, rows, bytes }) => ({ path, rows, bytes })));
    if (!args.includes("--write")) {
      console.log("Preview only. Use --write to replace the local snapshot.");
      return;
    }
    await mkdir(directory, { recursive: true });
    for (const [path, text] of Object.entries(texts)) await writeFile(new URL(path, directory), text);
    const manifest = {
      schemaVersion: 1,
      source,
      origin: "patient-reported",
      reviewStatus: "unverified-import",
      sourceDatabase,
      sourceLastUpdatedAt: new Date(lastUpdatedAt).toISOString(),
      retrievedAt: new Date().toISOString(),
      files,
    };
    await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Saved ${fileURLToPath(directory)}. Review the diff before committing.`);
  } finally {
    await client.end();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
