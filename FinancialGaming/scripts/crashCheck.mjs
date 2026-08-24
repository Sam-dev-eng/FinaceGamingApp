import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://127.0.0.1:5175/game", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Stay with Parent/i }).click();
await page.getByRole("button", { name: "CONFIRM DECISION" }).click();
await page.waitForTimeout(10000);

const root = await page.locator("#root").innerText().catch(() => "ROOT_FAIL");
console.log("ROOT @10s:\n", root.slice(0, 800));
console.log("Errors:", errors);
await page.screenshot({ path: "scripts/screenshots/at-10s.png", fullPage: true });
await browser.close();
