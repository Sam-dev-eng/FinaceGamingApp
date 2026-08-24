/**
 * Play through game slowly and log timing mismatches + API errors.
 */
import { chromium } from "playwright";

const API = "http://localhost:8080";
const PORTS = [5173, 5174, 5175, 5176];

async function findServer() {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return port;
    } catch {}
  }
  throw new Error("No dev server");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const port = await findServer();
  const base = `http://127.0.0.1:${port}`;
  const apiErrors = [];
  const consoleErrors = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("response", async (res) => {
    if (res.url().includes("/api/game/action") && !res.ok()) {
      apiErrors.push(`${res.status()} ${await res.text().catch(() => "")}`);
    }
  });

  const log = (label) => {
    const timer = page.locator("text=/\\d\\d:\\d\\d/").first();
    const limit = page.locator("text=/limit per turn/i");
    const banner = page.locator("text=/Bad Request|Not your turn|Invalid|circular/i");
    return Promise.all([
      timer.textContent().catch(() => "?"),
      limit.textContent().catch(() => "?"),
      banner.count(),
      page.locator("h1, h2").first().textContent().catch(() => "?"),
    ]).then(([t, l, b, h]) => console.log(`[${label}] timer=${t} limit="${l}" errors=${b}`));
  };

  console.log("Testing", base);

  await page.goto(base);
  await page.getByRole("button", { name: "HOST GAME" }).click();
  await page.waitForURL("**/lobby");
  await page.getByRole("button", { name: /Add Practice Opponents/i }).click();
  await sleep(500);
  await page.getByRole("button", { name: /Ready All Players/i }).click();
  await sleep(500);
  await page.getByRole("button", { name: "START GAME" }).click();
  await page.waitForURL("**/case-study");
  await sleep(2000); // linger on case study like a user
  await log("case-study-delayed");
  await page.getByRole("button", { name: /BEGIN YOUR JOURNEY/i }).click();
  await page.waitForURL("**/game");
  await page.getByText("Compulsory Decision").waitFor({ timeout: 15000 });
  await log("housing-modal");

  await page.getByRole("button", { name: /Stay with Parent/i }).click();
  await page.getByRole("button", { name: "CONFIRM DECISION" }).click();
  await sleep(1000);
  await log("after-housing");

  // Wait for round start
  await page.getByText(/Salaries & Payouts|CONTINUING IN/i).first().waitFor({ timeout: 20000 }).catch(() => {});
  await log("round-start");

  // Wait for round start to close (server 8s + buffer)
  await sleep(9000);
  await log("after-round-start-auto");

  const rentBtn = page.getByRole("button", { name: /ROLL DICE FOR RENT/i });
  if (await rentBtn.isVisible().catch(() => false)) {
    await log("survival-my-turn");
    await rentBtn.click();
    await sleep(1500);
    await page.getByRole("button", { name: /SURVIVAL.*RENT/i }).click();
    await sleep(1000);
    await log("after-survival");
  } else {
    console.log("[survival] rent button not visible — may have missed turn");
    await log("survival-missed");
  }

  const loanInput = page.locator('input[type="number"]');
  if (await loanInput.isVisible({ timeout: 20000 }).catch(() => false)) {
    await log("loan-my-turn");
    await loanInput.fill("150000");
    await page.getByRole("button", { name: /CONFIRM LOAN PAYMENT/i }).click();
    await sleep(1000);
    await log("after-loan");
  }

  const diceBtn = page.getByRole("button", { name: /^ROLL DICE$/i });
  if (await diceBtn.isVisible({ timeout: 20000 }).catch(() => false)) {
    await log("dice-my-turn");
    await diceBtn.click();
    await sleep(3000);
    await log("after-dice");
  }

  await browser.close();

  console.log("\n--- API errors ---");
  apiErrors.forEach((e) => console.log(" ", e.slice(0, 200)));
  console.log("\n--- Console errors ---");
  consoleErrors.filter((e) => !e.includes("sockjs") && !e.includes("409")).forEach((e) => console.log(" ", e));

  if (apiErrors.length || consoleErrors.filter((e) => !e.includes("sockjs")).length) {
    process.exit(1);
  }
  console.log("\n✅ Timing playtest complete");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
