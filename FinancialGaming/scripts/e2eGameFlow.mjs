/**
 * Browser E2E test — full flow with Spring Boot backend.
 * Requires:
 *   - Backend: cd FinancialGamingBackend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
 *   - Frontend: cd FinancialGaming && npm run dev
 * Run: npm run e2e
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const API = process.env.VITE_API_URL ?? "http://localhost:8080";
const PORTS = [5176, 5175, 5174, 5173];

async function findServer() {
  const found = [];
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) found.push(port);
    } catch {}
  }
  if (!found.length) throw new Error("Start the dev server first: npm run dev");
  return Math.max(...found);
}

async function assertBackend() {
  try {
    const res = await fetch(`${API}/api/lobby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostName: "__healthcheck__" }),
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const lobby = await res.json();
    console.log("Backend OK — sample room", lobby.roomCode);
  } catch (err) {
    throw new Error(
      `Backend not reachable at ${API}. Start it with: mvn spring-boot:run -Dspring-boot.run.profiles=dev\n${err.message}`
    );
  }
}

const BASE = `http://127.0.0.1:${await findServer()}`;
console.log("Testing against", BASE);
const errors = [];

mkdirSync("scripts/screenshots", { recursive: true });

async function screenshot(page, name) {
  await page.screenshot({ path: `scripts/screenshots/${name}.png`, fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function run() {
  await assertBackend();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  console.log("\n1. Landing → Host lobby");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "HOST GAME" }).click();
  await page.waitForURL("**/lobby");
  await page.getByRole("button", { name: /Add Practice Opponents/i }).waitFor({ timeout: 20000 });
  await screenshot(page, "01-lobby");
  console.log("  ✓ Lobby ready");

  console.log("2. Fill opponents & start");
  await page.getByRole("button", { name: /Add Practice Opponents/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Ready All Players/i }).click();
  await page.waitForTimeout(800);
  const startBtn = page.getByRole("button", { name: "START GAME" });
  await startBtn.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("START GAME")
      );
      return btn && !btn.disabled;
    },
    { timeout: 10000 }
  );
  await startBtn.click();

  console.log("3. Case study");
  await page.waitForURL("**/case-study");
  await screenshot(page, "02-case-study");
  await page.getByRole("button", { name: /BEGIN YOUR JOURNEY/i }).click();

  console.log("4. Game — housing");
  await page.waitForURL("**/game");
  await page.getByText("Live", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByText("Compulsory Decision").waitFor({ timeout: 10000 });
  await screenshot(page, "03-housing-modal");
  await page.getByRole("button", { name: /Stay with Parent/i }).click();
  await page.getByRole("button", { name: "CONFIRM DECISION" }).click();
  console.log("  ✓ Housing chosen");

  console.log("5. Wait for round start or survival phase");
  const roundStartOrSurvival = page.getByText(/Salaries & Payouts|ROLL DICE FOR RENT|SURVIVAL \+ RENT/i);
  await roundStartOrSurvival.first().waitFor({ timeout: 35000 });

  const continueBtn = page.getByRole("button", { name: /CONTINUE TO ROUND/i });
  if (await continueBtn.isVisible().catch(() => false)) {
    await screenshot(page, "04b-round-start");
    await continueBtn.click();
  }

  console.log("6. Survival — roll rent dice");
  const rentBtn = page.getByRole("button", { name: /ROLL DICE FOR RENT/i });
  await rentBtn.waitFor({ timeout: 45000 });
  await rentBtn.click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /SURVIVAL.*RENT/i }).click();
  console.log("  ✓ Survival paid");
  await screenshot(page, "05-survival");

  console.log("7. Loan phase");
  const loanInput = page.locator('input[type="number"]');
  await loanInput.waitFor({ timeout: 45000 });
  await loanInput.fill("150000");
  await page.getByRole("button", { name: /CONFIRM LOAN PAYMENT/i }).click();
  console.log("  ✓ Loan paid");
  await screenshot(page, "07-loan");

  console.log("8. Dice phase");
  const diceBtn = page.getByRole("button", { name: /^ROLL DICE$/i });
  await diceBtn.waitFor({ timeout: 45000 });
  await diceBtn.click();
  await page.waitForTimeout(2000);
  console.log("  ✓ Dice rolled");
  await screenshot(page, "08-dice");

  await browser.close();

  const critical = errors.filter(
    (e) =>
      !e.includes("sockjs") &&
      !e.includes("WebSocket") &&
      !e.includes("409")
  );
  if (critical.length) {
    console.error("\n✗ Console errors:");
    critical.forEach((e) => console.error(" ", e));
    process.exit(1);
  }

  console.log("\n✅ Full E2E flow passed (backend + frontend)\n");
}

run().catch(async (err) => {
  console.error("\n✗ E2E failed:", err.message);
  process.exit(1);
});
