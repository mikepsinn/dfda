// Captures before/after screenshots of key pages and presentation slides, and writes the
// pull-request comment. The Visual Preview workflow (.github/workflows/visual-preview.yml) runs both:
//   BEFORE_URL=http://localhost:3001 AFTER_URL=http://localhost:3002 node scripts/visual-preview.mjs capture <out-dir>
//   node scripts/visual-preview.mjs comment <out-dir> <image-base-url> <before-label> <after-label>
// BEFORE_URL is optional (a base branch that does not build). CHROMIUM_PATH selects a local browser.
// A changed page gets an overview of the whole page with each change boxed, and close-ups of the
// changed areas; a presentation is compared slide by slide (see visual-diff.mjs).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareImages, scaleImage, stitchStrips } from "./visual-diff.mjs";

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
  // The deck on a phone, which shows the desktop layout scaled down; its slides are compared below.
  { name: "presentation", path: "/present/patient-journey#9", viewports: ["mobile"] },
];
// Presentations, compared slide by slide at their full 1920 × 1080 size.
const decks = [{ name: "patient-journey", path: "/present/patient-journey" }];
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  // A phone, not a narrow desktop window: no scrollbar, and the page's viewport tag applies.
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const marker = "<!-- visual-preview -->";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const writeJpeg = (outDir, file, base64) => writeFileSync(join(outDir, file), Buffer.from(base64, "base64"));
const errorText = error => (error instanceof Error ? error.message : String(error)).split("\n")[0];

async function capture(outDir) {
  const { chromium } = await import("@playwright/test");
  const sides = [["before", process.env.BEFORE_URL], ["after", process.env.AFTER_URL]].filter(([, url]) => url);
  if (!process.env.AFTER_URL) throw new Error("AFTER_URL is required");
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  // A blank page where the browser compares screenshots and draws the comment's images.
  const lab = await browser.newPage();
  const shots = [];
  const slideshows = [];
  try {
    for (const route of routes) {
      for (const viewport of viewports.filter(v => !route.viewports || route.viewports.includes(v.name))) {
        const shot = { route: route.path, viewport: viewport.name };
        const pngs = {};
        for (const [side, baseUrl] of sides) {
          const { png, ...result } = await screenshot(browser, lab, new URL(route.path, baseUrl).href, viewport, outDir,
            `${route.name}-${viewport.name}-${side}`);
          shot[side] = result;
          pngs[side] = png;
        }
        if (pngs.before && pngs.after && shot.before.hash !== shot.after.hash) {
          shot.diff = await describeChange(lab, pngs.before, pngs.after, outDir, `${route.name}-${viewport.name}`);
        }
        shots.push(shot);
      }
    }
    for (const deck of decks) slideshows.push(await captureDeck(browser, lab, deck, sides, outDir));
  } finally {
    await browser.close();
  }
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify({ shots, decks: slideshows }, null, 2)}\n`);
  const failures = shots.flatMap(shot => sides.filter(([side]) => shot[side].error).map(([side]) => `${side} ${shot.route}`));
  const slides = slideshows.reduce((n, deck) => n + deck.slides.length, 0);
  console.log(`Captured ${shots.length} page views and ${slides} slides${failures.length ? `; failed: ${failures.join(", ")}` : ""}`);
}

async function screenshot(browser, lab, url, viewport, outDir, file) {
  const { width, height, isMobile = false, hasTouch = false } = viewport;
  const page = await browser.newPage({ viewport: { width, height }, isMobile, hasTouch, reducedMotion: "reduce" });
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    // Link prefetches can keep the network busy; they do not change what the page shows.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ type: "jpeg", quality: 80, animations: "disabled", path: join(outDir, `${file}.jpg`) });
    // The whole page in strips joined by the browser (see stitchStrips), lossless so JPEG noise is
    // not mistaken for changes; pages are cut off at 32,000 pixels, the most a canvas can hold.
    const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    const pageWidth = Math.max(width, size.width), pageHeight = Math.min(size.height, 32_000);
    const strips = [];
    for (let y = 0; y < pageHeight; y += 4_000) {
      const clip = { x: 0, y, width: pageWidth, height: Math.min(4_000, pageHeight - y) };
      strips.push((await page.screenshot({ type: "png", animations: "disabled", fullPage: true, clip })).toString("base64"));
    }
    const stitched = await lab.evaluate(stitchStrips, { strips });
    writeJpeg(outDir, `${file}-full.jpg`, stitched.jpeg);
    const png = Buffer.from(stitched.png, "base64");
    return { status: response?.status() ?? null, image: `${file}.jpg`, fullImage: `${file}-full.jpg`, hash: sha256(png), png };
  } catch (error) {
    // Record the failure in the comment instead of hiding the page.
    return { error: errorText(error) };
  } finally {
    await page.close();
  }
}

// Where a page changed: an overview of the whole "after" page with each change boxed and numbered,
// and before/after close-ups of the first few changed areas.
async function describeChange(lab, before, after, outDir, name) {
  const result = await lab.evaluate(compareImages, { before: before.toString("base64"), after: after.toString("base64") });
  if (!result.areaCount) return { areaCount: 0 }; // only rendering noise
  writeJpeg(outDir, `${name}-overview.jpg`, result.overview);
  const areas = result.closeUps.map((closeUp, index) => {
    const files = { before: `${name}-area${index + 1}-before.jpg`, after: `${name}-area${index + 1}-after.jpg` };
    writeJpeg(outDir, files.before, closeUp.before);
    writeJpeg(outDir, files.after, closeUp.after);
    return { ...files, truncated: closeUp.truncated };
  });
  return { overview: `${name}-overview.jpg`, columns: result.columns, areas, areaCount: result.areaCount };
}

// Every slide of a deck on one side, by its key in the address (#1, #B2), as lossless images.
async function deckSlides(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, reducedMotion: "reduce" });
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    if (!response?.ok()) return { error: `HTTP ${response?.status()}` };
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    const count = await page.locator("section.deck-slide").count();
    const slides = [];
    for (let i = 0; i < count; i++) {
      await page.keyboard.press(i ? "ArrowRight" : "Home");
      await page.waitForTimeout(150);
      const slide = page.locator("section.deck-slide:not([hidden])");
      const key = await page.evaluate(() => decodeURIComponent(location.hash.slice(1)));
      const label = (await slide.getAttribute("aria-label"))?.replace(/ \(\d+ of \d+\)$/, "") ?? "";
      const png = await slide.screenshot({ type: "png", animations: "disabled" });
      slides.push({ key, label, png, hash: sha256(png) });
    }
    return { slides };
  } catch (error) {
    return { error: errorText(error) };
  } finally {
    await page.close();
  }
}

// Compares a deck slide by slide; images are kept only for slides that changed, were added or were removed.
async function captureDeck(browser, lab, deck, sides, outDir) {
  const captured = {};
  for (const [side, baseUrl] of sides) captured[side] = await deckSlides(browser, new URL(deck.path, baseUrl).href);
  const before = new Map((captured.before?.slides ?? []).map(slide => [slide.key, slide]));
  const after = captured.after.slides ?? [];
  const result = { path: deck.path, error: captured.after.error, beforeError: captured.before?.error, slides: [] };
  const file = (slide, side) => `${deck.name}-slide-${slide.key}-${side}.jpg`;
  for (const slide of after) {
    const old = before.get(slide.key);
    const entry = { key: slide.key, label: slide.label };
    if (!captured.before) {
      entry.change = "unknown";
    } else if (!old) {
      entry.change = "added";
      writeJpeg(outDir, file(slide, "after"), await lab.evaluate(scaleImage, { image: slide.png.toString("base64"), width: 960 }));
      entry.after = file(slide, "after");
    } else if (old.hash === slide.hash) {
      entry.change = "same";
    } else {
      const images = await lab.evaluate(compareImages, {
        before: old.png.toString("base64"), after: slide.png.toString("base64"), slideWidth: 960,
      });
      if (!images.areaCount) { // only rendering noise
        entry.change = "same";
        result.slides.push(entry);
        continue;
      }
      writeJpeg(outDir, file(slide, "before"), images.before);
      writeJpeg(outDir, file(slide, "after"), images.after);
      Object.assign(entry, { change: "changed", before: file(slide, "before"), after: file(slide, "after"), areaCount: images.areaCount });
    }
    result.slides.push(entry);
  }
  for (const [key, old] of before) {
    if (after.some(slide => slide.key === key)) continue;
    writeJpeg(outDir, file(old, "before"), await lab.evaluate(scaleImage, { image: old.png.toString("base64"), width: 960 }));
    result.slides.push({ key, label: old.label, change: "removed", before: file(old, "before") });
  }
  return result;
}

// "1, 3–7, 10, B1–B3": slide keys in order, with runs of consecutive numbers joined.
function keyRanges(keys) {
  const parts = [];
  for (const key of keys) {
    const [, prefix, number] = /^(\D*)(\d+)$/.exec(key) ?? [null, key, null];
    const last = parts.at(-1);
    if (number && last && last.prefix === prefix && Number(number) === last.end + 1) last.end++;
    else parts.push({ prefix, start: Number(number), end: Number(number), key });
  }
  return parts.map(p => Number.isNaN(p.start) ? p.key : p.start === p.end ? `${p.prefix}${p.start}` : `${p.prefix}${p.start}–${p.prefix}${p.end}`).join(", ");
}

function comment(outDir, imageBaseUrl, beforeLabel, afterLabel) {
  const { shots, decks: slideshows = [] } = JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8"));
  const hasBefore = shots.some(shot => shot.before);
  const image = (file, alt, width) =>
    `<a href="${imageBaseUrl}/${file}"><img src="${imageBaseUrl}/${file}"${width ? ` width="${width}"` : ""} alt="${alt}"></a>`;
  const top = (result, alt) => {
    if (!result) return "Not captured";
    if (result.error) return `Failed: ${result.error}`;
    const status = result.status >= 400 ? `<br>HTTP ${result.status}` : "";
    return `<a href="${imageBaseUrl}/${result.fullImage}"><img src="${imageBaseUrl}/${result.image}" width="380" alt="${alt}"></a>${status}`;
  };
  const byRoute = Map.groupBy(shots, shot => shot.route);
  // A view changed if a side failed or is missing, or its screenshots differ by more than rendering noise.
  const differs = view => !view.before?.hash || !view.after?.hash ||
    (view.before.hash !== view.after.hash && view.diff?.areaCount !== 0);
  const changed = [...byRoute].filter(([, views]) => views.some(differs));
  const unchanged = [...byRoute.keys()].filter(route => !changed.some(([changedRoute]) => changedRoute === route));

  const lines = [
    marker,
    "## Visual preview",
    "",
    `Before: ${beforeLabel} · After: ${afterLabel}. Changes are boxed in red; click an image to open it.`,
  ];
  if (!hasBefore) lines.push("", "**The base branch did not build, so there are no \"before\" screenshots.**");
  if (!changed.length) lines.push("", "No page changed.");
  for (const [route, views] of changed) {
    lines.push("", "<details open>", `<summary><strong><code>${route}</code></strong> · changed</summary>`, "");
    for (const view of views) {
      const label = view.viewport[0].toUpperCase() + view.viewport.slice(1);
      const alt = side => `${route} ${view.viewport} ${side}`;
      if (!differs(view)) continue;
      if (!view.diff) {
        lines.push(`**${label}**`, "", "<table><tr><th>Before</th><th>After</th></tr>",
          `<tr><td>${top(view.before, alt("before"))}</td><td>${top(view.after, alt("after"))}</td></tr></table>`, "");
        continue;
      }
      const { overview, columns, areas, areaCount } = view.diff;
      const more = areaCount > areas.length ? ` (close-ups of the first ${areas.length}; the overview boxes all of them)` : "";
      lines.push(`**${label}** · ${areaCount} changed ${areaCount === 1 ? "area" : "areas"}${more} · full page: ` +
        `<a href="${imageBaseUrl}/${view.before.fullImage}">before</a>, <a href="${imageBaseUrl}/${view.after.fullImage}">after</a>`, "",
        image(overview, alt("overview")), "",
        `<sub>The whole page after the change${columns > 1 ? ", cut into columns that read left to right" : ""}; ` +
        "the numbers match the close-ups.</sub>", "",
        "<table><tr><th></th><th>Before</th><th>After</th></tr>");
      areas.forEach((area, index) => {
        const note = area.truncated ? "<br><sub>Continues below; see the full page.</sub>" : "";
        lines.push(`<tr><td valign="top"><b>${index + 1}</b></td><td valign="top">${image(area.before, alt(`area ${index + 1} before`), 400)}</td>` +
          `<td valign="top">${image(area.after, alt(`area ${index + 1} after`), 400)}${note}</td></tr>`);
      });
      lines.push("</table>", "");
    }
    lines.push("</details>");
  }
  if (unchanged.length) lines.push("", `**Unchanged:** ${unchanged.map(route => `\`${route}\``).join(", ")}`);

  for (const deck of slideshows) {
    if (deck.error) {
      lines.push("", `**Presentation \`${deck.path}\`:** could not be captured (${deck.error}).`);
      continue;
    }
    const shown = deck.slides.filter(slide => ["changed", "added", "removed"].includes(slide.change));
    const same = deck.slides.filter(slide => slide.change === "same").map(slide => slide.key);
    const total = deck.slides.filter(slide => slide.change !== "removed").length;
    if (deck.slides.every(slide => slide.change === "unknown")) {
      lines.push("", `**Presentation \`${deck.path}\`:** ${total} slides; nothing to compare with` +
        `${deck.beforeError ? ` (the base branch shows ${deck.beforeError})` : ""}.`);
      continue;
    }
    if (!shown.length) {
      lines.push("", `**Presentation \`${deck.path}\`:** no slide changed.`);
      continue;
    }
    lines.push("", "<details open>",
      `<summary><strong><code>${deck.path}</code></strong> · ${shown.length} of ${total} slides changed</summary>`, "",
      "<table><tr><th>Before</th><th>After</th></tr>");
    for (const slide of shown) {
      const before = slide.before ? image(slide.before, `slide ${slide.key} before`, 420) : "<i>New slide</i>";
      const after = slide.after ? image(slide.after, `slide ${slide.key} after`, 420) : "<i>Removed</i>";
      lines.push(`<tr><td colspan="2"><b>Slide ${slide.key}</b> · ${slide.label}</td></tr>`,
        `<tr><td valign="top">${before}</td><td valign="top">${after}</td></tr>`);
    }
    lines.push("</table>", "");
    if (same.length) lines.push(`Unchanged slides: ${keyRanges(same)}`, "");
    lines.push("</details>");
  }
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
