import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const baseUrl = process.env.CAPTURE_BASE_URL || "http://127.0.0.1:4173";
const output = resolve(process.env.CAPTURE_OUTPUT || "../evidence");
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;

let playwright;
if (runtimeModules) {
  playwright = await import(pathToFileURL(join(runtimeModules, "playwright", "index.mjs")));
} else {
  playwright = await import("playwright");
}

await mkdir(output, { recursive: true });

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await playwright.chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1
});

const captures = [
  ["01_commuter_journey_and_tracking.png", "commuter"],
  ["02_authority_dashboard.png", "authority"],
  ["03_product_backlog.png", "backlog"],
  ["04_three_sprint_board.png", "sprints"],
  ["05_api_responsibilities.png", "apis"]
];

for (const [filename, view] of captures) {
  await page.goto(`${baseUrl}/?view=${view}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(output, filename), fullPage: true });
}

await browser.close();
console.log(`Captured ${captures.length} evidence screenshots in ${output}`);
