import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5175/game", { waitUntil: "networkidle" });

// Housing
await page.getByRole("button", { name: /Stay with Parent/i }).click();
await page.getByRole("button", { name: "CONFIRM DECISION" }).click();
await page.waitForTimeout(22000);
await page.getByRole("button", { name: /START ROUND 1/i }).click();

// Survival
await page.getByRole("button", { name: /SURVIVAL \+ RENT/i }).click();

for (let i = 1; i <= 35; i++) {
  await page.waitForTimeout(1000);
  const t = await page.locator("#root").innerText();
  const loan = t.includes("CONFIRM LOAN PAYMENT");
  const dice = t.includes("ROLL DICE");
  const survival = t.includes("SURVIVAL + RENT");
  const net = t.includes("NET WORTH");
  console.log(`${i}s loan=${loan} survival=${survival} dice=${dice} net=${net} | ${t.match(/(YOU|Opponent A|Opponent B): (\d\d:\d\d)/)?.[0] ?? ""}`);
  if (loan) { console.log("✓ Loan phase reached"); break; }
}

await browser.close();
