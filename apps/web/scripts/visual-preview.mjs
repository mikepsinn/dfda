// Captures before/after screenshots of key pages and writes the pull-request comment.
// The Visual Preview workflow (.github/workflows/visual-preview.yml) runs both commands.
//   BEFORE_URL=http://localhost:3001 AFTER_URL=http://localhost:3002 node scripts/visual-preview.mjs capture <out-dir>
//   node scripts/visual-preview.mjs comment <out-dir> <image-base-url> <before-label> <after-label>
// BEFORE_URL is optional (a base branch that does not build). CHROMIUM_PATH selects a local browser.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Pages that render without a database. Add a route when a change affects a page that is not listed.
// /conditions and /conditions/{id}/trials are not listed: they need the database, and the trial list
// shows live ClinicalTrials.gov data, which would differ between the before and after captures.
const routes = [
  { name: "home", path: "/" },
  { name: "treatment-rankings", path: "/treatment-rankings?condition=insomnia" },
  { name: "outcome-label", path: "/outcome-labels/demo/insomnia/suvorexant" },
  { name: "providers", path: "/providers" },
  { name: "developers", path: "/developers" },
  { name: "impact", path: "/impact" },
  { name: "find-trials", path: "/find-trials" },
  // The deck's outcome-label slide: the app's own components on the scaled presentation canvas.
  { name: "presentation", path: "/present/patient-journey#9" },
];
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  // A phone, not a narrow desktop window: no scrollbar, and the page's viewport tag applies.
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const marker = "<!-- visual-preview -->";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

async function capture(outDir) {
  const { chromium } = await import("@playwright/test");
  const sides = [["before", process.env.BEFORE_URL], ["after", process.env.AFTER_URL]].filter(([, url]) => url);
  if (!process.env.AFTER_URL) throw new Error("AFTER_URL is required");
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const shots = [];
  try {
    for (const route of routes) {
      for (const viewport of viewports) {
        const shot = { route: route.path, viewport: viewport.name };
        for (const [side, baseUrl] of sides) {
          shot[side] = await screenshot(browser, new URL(route.path, baseUrl).href, viewport, outDir,
            `${route.name}-${viewport.name}-${side}`);
        }
        shots.push(shot);
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(shots, null, 2)}\n`);
  const failures = shots.flatMap(shot => sides.filter(([side]) => shot[side].error).map(([side]) => `${side} ${shot.route}`));
  console.log(`Captured ${shots.length} page views${failures.length ? `; failed: ${failures.join(", ")}` : ""}`);
}

async function screenshot(browser, url, viewport, outDir, file) {
  const { width, height, isMobile = false, hasTouch = false } = viewport;
  const page = await browser.newPage({ viewport: { width, height }, isMobile, hasTouch, reducedMotion: "reduce" });
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    // Link prefetches can keep the network busy; they do not change what the page shows.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    const options = { type: "jpeg", quality: 80, animations: "disabled" };
    await page.screenshot({ ...options, path: join(outDir, `${file}.jpg`) });
    const full = await page.screenshot({ ...options, path: join(outDir, `${file}-full.jpg`), fullPage: true });
    return { status: response?.status() ?? null, image: `${file}.jpg`, fullImage: `${file}-full.jpg`, hash: sha256(full) };
  } catch (error) {
    // Record the failure in the comment instead of hiding the page.
    return { error: (error instanceof Error ? error.message : String(error)).split("\n")[0] };
  } finally {
    await page.close();
  }
}

function comment(outDir, imageBaseUrl, beforeLabel, afterLabel) {
  const shots = JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8"));
  const hasBefore = shots.some(shot => shot.before);
  const cell = (result, alt) => {
    if (!result) return "Not captured";
    if (result.error) return `Failed: ${result.error.replaceAll("|", "\\|")}`;
    const status = result.status >= 400 ? `<br>HTTP ${result.status}` : "";
    return `<a href="${imageBaseUrl}/${result.fullImage}"><img src="${imageBaseUrl}/${result.image}" width="380" alt="${alt}"></a>${status}`;
  };
  const byRoute = Map.groupBy(shots, shot => shot.route);
  const changed = [...byRoute].filter(([, views]) => views.some(view =>
    !view.before?.hash || !view.after?.hash || view.before.hash !== view.after.hash));
  const unchanged = [...byRoute.keys()].filter(route => !changed.some(([changedRoute]) => changedRoute === route));

  const lines = [
    marker,
    "## Visual preview",
    "",
    `Before: ${beforeLabel} · After: ${afterLabel}. Click an image to open the full page.`,
  ];
  if (!hasBefore) lines.push("", "**The base branch did not build, so there are no \"before\" screenshots.**");
  if (!changed.length) lines.push("", "No page changed.");
  for (const [route, views] of changed) {
    lines.push("", "<details open>", `<summary><strong><code>${route}</code></strong> · changed</summary>`, "",
      "| | Before | After |", "| --- | --- | --- |");
    for (const view of views) {
      const label = view.viewport[0].toUpperCase() + view.viewport.slice(1);
      lines.push(`| ${label} | ${cell(view.before, `${route} ${view.viewport} before`)} | ${cell(view.after, `${route} ${view.viewport} after`)} |`);
    }
    lines.push("", "</details>");
  }
  if (unchanged.length) lines.push("", `**Unchanged:** ${unchanged.map(route => `\`${route}\``).join(", ")}`);
  lines.push("", "<sub>Generated by the Visual Preview workflow. Pages render without a database.</sub>");
  process.stdout.write(`${lines.join("\n")}\n`);
}

const [command, outDir = "visual-preview", ...args] = process.argv.slice(2);
if (command === "capture") {
  await capture(outDir);
} else if (command === "comment" && args.length === 3) {
  comment(outDir, ...args);
} else {
  throw new Error("Usage: node scripts/visual-preview.mjs capture <out-dir> | comment <out-dir> <image-base-url> <before-label> <after-label>");
}
