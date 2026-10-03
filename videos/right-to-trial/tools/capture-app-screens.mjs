// Captures the web app screens used as footage in the video (2x, light theme, no dev overlay).
// Start the app first (the "web-demo" launch configuration or `pnpm dev:next` with placeholder env),
// then run from apps/web so Playwright resolves:
//   node ../../videos/right-to-trial/tools/capture-app-screens.mjs
// BASE_URL defaults to http://localhost:3005; CHROME_PATH points at an installed Chrome if Playwright's
// own browser is not installed.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL ?? "http://localhost:3005";
const out = fileURLToPath(new URL("../public/app/", import.meta.url));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await (await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: "light",
})).newPage();

async function open(path) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 180_000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(800);
}

// Full pages for the Step 1 tour (scene 6). Scene 6's camera targets are CSS-px positions on these pages.
await open("/treatment-rankings?condition=alzheimers-disease");
await page.screenshot({ path: `${out}rankings-alzheimers.png`, fullPage: true });
await open("/outcome-labels/demo/alzheimers-disease/lecanemab");
await page.screenshot({ path: `${out}label-lecanemab.png`, fullPage: true });

// The home page "Daily Tracking" card (scene 10).
await open("/");
const card = await page.evaluateHandle(() => {
  let node = [...document.querySelectorAll("div")].find(e => e.textContent.trim() === "Daily Tracking");
  while (node && !String(node.className).includes("max-w-md")) node = node.parentElement;
  return node;
});
await card.asElement().scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await card.asElement().screenshot({ path: `${out}tracking-mockup.png` });

await browser.close();
console.log(`Saved screens to ${out}. If a page's layout changed, recheck scene 6's camera targets.`);
