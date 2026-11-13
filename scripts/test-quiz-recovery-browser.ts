import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const html = readFileSync(new URL("../public/quiz-recover.html", import.meta.url), "utf8");
const home = "https://quiz.linusniceday.com";
const sources = ["https://linusniceday.com", "https://linus-niceday-japan-realestate.vercel.app", "https://tokyo-living-persona.vercel.app"];
const dex = "tokyo-quiz-collection", codes = dex + "-codes", proofs = dex + "-proofs";
const state = "tokyo-quiz-0.9.5";
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" });
try {
  for (const source of sources) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    // Real origin isolation and top-level navigation, with local responses instead of live deployments.
    await context.route("**/*", route => route.fulfill({ contentType: "text/html", body: new URL(route.request().url()).pathname === "/quiz-recover.html" ? html : "<!doctype html><body>Storage fixture</body>" }));
    const page = await context.newPage();
    const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
    const old = { [dex]: '["sumida","taito"]', [codes]: '{"sumida":"aaaaaaaaaaaa","taito":"aaaaaaaaaaaa"}', [proofs]: '{"sumida":"abcdefghijklmnop","taito":"abcdefghijklmnop"}', [state]: '{"answers":{"q1":"a"}}', "tokyo-quiz-moved": "1", "admin-token": "never-transfer" };
    await page.goto(source + "/seed");
    await page.evaluate(data => { for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); }, old);
    await page.goto(home + "/seed");
    await page.evaluate(({ dex, codes, state }) => {
      localStorage.setItem(dex, '["sumida"]'); localStorage.setItem(codes, '{"sumida":"bbbbbbbbbbbb"}');
      localStorage.setItem(state, '{"answers":{"q1":"b"}}'); localStorage.setItem("tokyo-quiz-lang", "ja");
    }, { dex, codes, state });
    await page.goto(home + "/quiz-recover.html?lang=zh");
    if (source !== sources[0]) await page.locator("summary").click();
    await page.locator("button").nth(sources.indexOf(source)).click();
    await page.locator("#status").filter({ hasText: "已新增 1 個圖鑑" }).waitFor();
    assert.equal(page.url(), home + "/quiz-recover.html?lang=zh");
    const saved = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    assert.deepEqual(JSON.parse(saved[dex]), ["sumida", "taito"]);
    assert.equal(JSON.parse(saved[codes]).sumida, "bbbbbbbbbbbb");
    assert.equal(JSON.parse(saved[proofs]).sumida, undefined);
    assert.equal(JSON.parse(saved[proofs]).taito, "abcdefghijklmnop");
    assert.equal(saved[state], '{"answers":{"q1":"b"}}'); assert.equal(saved["tokyo-quiz-lang"], "ja");
    assert.equal(saved["admin-token"], undefined); assert.equal(saved["tokyo-quiz-moved"], undefined);
    assert(saved["tokyo-quiz-recovery-backup"]);
    if (source !== sources[0]) await page.locator("summary").click();
    await page.locator("button").nth(sources.indexOf(source)).click();
    await page.locator("#status").filter({ hasText: "已新增 0 個圖鑑" }).waitFor();
    if (source === sources[0]) {
      mkdirSync("artifacts/quiz-recovery", { recursive: true });
      await page.screenshot({ path: "artifacts/quiz-recovery/recovered-mobile.png", fullPage: true });
    }
    await page.goto(source + "/seed");
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage))), old, "Old data must remain byte-for-byte intact");
    assert.deepEqual(errors, []);
    await context.close();
  }

  const context = await browser.newContext();
  await context.route("**/*", route => route.fulfill({ contentType: "text/html", body: html }));
  const page = await context.newPage();
  await page.goto(home + "/quiz-recover.html?lang=ja");
  assert.equal(await page.locator("h1").innerText(), "以前の記録を復元");
  assert.equal(await page.locator("#back").getAttribute("href"), home + "/ja/");
  await page.locator("button").first().click();
  await page.locator("#status").filter({ hasText: "記録がありませんでした" }).waitFor();
  // Storage denial on an old origin returns an actionable error rather than reporting success.
  await context.addInitScript(() => {
    if (location.origin === "https://linusniceday.com") Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } });
  });
  await page.locator("button").first().click();
  await page.locator("#status").filter({ hasText: "読み取れませんでした" }).waitFor();
  await page.goto(home + "/quiz-recover.html?lang=zh#recovery=%ZZ");
  await page.locator("#status").filter({ hasText: "已失效或不完整" }).waitFor();
  assert.equal(new URL(page.url()).hash, "");
  await context.close();
  console.log("Brave recovery passed: all three old origins, proof pairing, source preservation, repeat imports, Japanese, empty/blocked storage and invalid payloads.");
} finally { await browser.close(); }
