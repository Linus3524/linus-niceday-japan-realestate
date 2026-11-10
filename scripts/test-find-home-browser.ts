/** 真實瀏覽器驗證租／買切換、草稿隔離、送出失敗重試與後台修改；資料只存記憶體。 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import {
  MemoryBackend,
  setLeadBackendForTests,
  listLeads,
  getLead,
} from "../src/lib/leadStore";
import {
  emptyFindHomeForm,
  FIND_HOME_DRAFT_KEY,
} from "../src/lib/findHome/draft";
import { emptyBuyForm, BUY_HOME_DRAFT_KEY } from "../src/lib/findHome/buyDraft";
import submitHandler from "../api/find-home";
import adminHandler from "../api/leads";
process.env.RESEND_API_KEY = "";
process.env.LEADS_ADMIN_TOKEN = "ui-isolated-test-token";
setLeadBackendForTests(new MemoryBackend());
const server = await createServer({
  server: { host: "127.0.0.1", port: 0, hmr: false },
  logLevel: "error",
});
await server.listen();
const address = server.httpServer!.address();
if (!address || typeof address === "string")
  throw new Error("Missing preview address");
const base = `http://127.0.0.1:${address.port}`;
const output = resolve("scratch/buy-questionnaire-qa");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      : undefined),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
let failSubmission = true;
const payloads: any[] = [];
function mockResponse() {
  return {
    code: 200,
    data: undefined as any,
    setHeader() {},
    status(n: number) {
      this.code = n;
      return this;
    },
    json(data: any) {
      this.data = data;
      return this;
    },
    send(data: any) {
      this.data = data;
      return this;
    },
  };
}
await context.route("**/api/**", async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === "/api/find-home") {
    const body = route.request().postDataJSON();
    payloads.push(body);
    if (failSubmission) {
      failSubmission = false;
      return route.fulfill({
        status: 503,
        json: { error: "測試暫時收件失敗" },
      });
    }
    const res = mockResponse();
    await submitHandler({ method: "POST", headers: {}, body }, res);
    return route.fulfill({ status: res.code, json: res.data });
  }
  if (url.pathname === "/api/leads") {
    const res = mockResponse();
    await adminHandler(
      {
        method: route.request().method(),
        headers: route.request().headers(),
        query: Object.fromEntries(url.searchParams),
        body: route.request().postData()
          ? route.request().postDataJSON()
          : undefined,
      },
      res,
    );
    return route.fulfill({ status: res.code, json: res.data });
  }
  return route.fulfill({ json: { count: 1, success: true } });
});
await page.addInitScript(
  ({ buyKey, rentKey, buyForm, rentForm }) => {
    if (sessionStorage.getItem("questionnaire-ui-initialized")) return;
    localStorage.setItem(
      buyKey,
      JSON.stringify({
        form: buyForm,
        step: 1,
        startedAt: Date.now() - 60000,
        idempotencyKey: "ui-buy-key-1234567890",
      }),
    );
    localStorage.setItem(
      rentKey,
      JSON.stringify({
        form: rentForm,
        step: 1,
        startedAt: Date.now() - 60000,
        idempotencyKey: "ui-rent-key-1234567890",
      }),
    );
    sessionStorage.setItem("questionnaire-ui-initialized", "1");
  },
  {
    buyKey: BUY_HOME_DRAFT_KEY,
    rentKey: FIND_HOME_DRAFT_KEY,
    buyForm: emptyBuyForm(),
    rentForm: emptyFindHomeForm(),
  },
);
const choice = async (field: string, label: string) =>
  page
    .locator(`#field-${field}`)
    .getByRole(field === "onMatch" ? "radio" : "button", {
      name: label,
      exact: true,
    })
    .click();
const next = async () =>
  page.getByRole("button", { name: "下一步", exact: true }).click();
const noOverflow = async () =>
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
    "No horizontal overflow",
  );
try {
  await page.goto(`${base}/find-home?from=instagram`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("link", { name: /我要買房/ }).waitFor();
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({ path: `${output}/entry-mobile.png`, fullPage: true });
  await page.getByRole("link", { name: /我要買房/ }).click();
  assert.match(page.url(), /from=instagram/);
  assert.match(page.url(), /type=buy/);
  await page.getByRole("heading", { name: /日本買房計畫/ }).waitFor();
  await next();
  await page.getByText("請選擇性別。", { exact: true }).waitFor();
  await choice("gender", "女性");
  await choice("ageRange", "30–39 歲");
  await choice("residence", "海外");
  await choice("visaType", "沒有日本簽證");
  await page.getByRole("textbox", { name: "國籍", exact: true }).fill("台灣");
  await choice("funding", "全款現金");
  await choice("viewing", "會來日本實地看房");
  await page
    .getByRole("textbox", { name: "預計來日本／方便看房的時間" })
    .fill("明年 3 月來日本");
  await choice("purchaseTiming", "半年內");
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `${output}/buy-step1-mobile.png`,
    fullPage: true,
  });
  await next();
  await page.locator("#buy-budget-ideal").fill("3000");
  await page.locator("#buy-budget-max").fill("5000");
  await choice("budgetScope", "含購屋費用的總預算");
  await choice("purpose", "自住");
  await choice("propertyTypes", "區分公寓");
  await page
    .getByRole("textbox", { name: "希望購買的地區、路線或車站" })
    .fill("中野、高圓寺");
  await choice("layouts", "2LDK");
  await page.locator("#buy-walk").selectOption("10");
  await page.locator("#buy-age").selectOption("20");
  await page.getByRole("textbox", { name: "最小面積（㎡）" }).fill("50");
  await page.getByRole("textbox", { name: "最低樓層" }).fill("2");
  await page.locator("#buy-structure").selectOption("rc");
  await choice("mustHaves", "電梯");
  await choice("mustHaves", "可養寵物");
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `${output}/buy-step2-mobile.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "租房需求", exact: true }).click();
  await page.getByRole("heading", { name: /日本租房需求/ }).waitFor();
  await page.locator("#field-areas input").fill("池袋");
  await page.getByRole("link", { name: "買房需求", exact: true }).click();
  await page.locator("#buy-budget-max").waitFor();
  assert.equal(await page.locator("#buy-budget-max").inputValue(), "5000");
  assert.equal(
    await page
      .getByRole("textbox", { name: "希望購買的地區、路線或車站" })
      .inputValue(),
    "中野、高圓寺",
  );
  await next();
  await choice("onMatch", "想先看房，再決定");
  await next();
  await page.getByPlaceholder("例：小林").fill("UI 買家");
  await page.getByPlaceholder("你的 LINE ID").fill("ui_flow_person");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "送出買房需求，請 Linus 聯絡我" })
    .click();
  await page.getByRole("button", { name: "複製填好的內容" }).waitFor();
  assert.ok(
    await page.evaluate((key) => localStorage.getItem(key), BUY_HOME_DRAFT_KEY),
  );
  await page
    .getByRole("button", { name: "送出買房需求，請 Linus 聯絡我" })
    .click();
  await page.getByRole("heading", { name: "已收到你的買房需求" }).waitFor();
  assert.equal(
    await page.getByText("用這些條件看行情", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), BUY_HOME_DRAFT_KEY),
    null,
  );
  assert.ok(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      FIND_HOME_DRAFT_KEY,
    ),
  );
  assert.equal(payloads[1].dealType, "buy");
  assert.equal(payloads[1].requirement.budgetMaxMan, "5000");
  assert.equal(payloads[1].source, "instagram");
  assert.equal(payloads[0].idempotencyKey, payloads[1].idempotencyKey);
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `${output}/buy-success-mobile.png`,
    fullPage: true,
  });
  const buyer = (await listLeads()).find((l) => l.dealType === "buy")!;
  assert.ok(buyer);
  await page.goto(`${base}/find-home?type=rent&from=instagram`, {
    waitUntil: "domcontentloaded",
  });
  await choice("gender", "男性");
  await choice("ageRange", "20–29 歲");
  await choice("moveIn", "1 個月內");
  await choice("residence", "日本");
  await choice("visaType", "日本籍");
  await choice("layouts", "1K");
  assert.equal(await page.locator("#field-areas input").inputValue(), "池袋");
  await next();
  await page.locator("#rent-ideal").fill("10");
  await page.locator("#rent-max").fill("12");
  await choice("adjustable", "擴大地區");
  await next();
  await page
    .locator("#field-onMatch")
    .getByRole("radio", { name: "希望先看房（內見）" })
    .click();
  await next();
  await page.getByPlaceholder("例：小林").fill("UI 租客");
  await page.getByPlaceholder("你的 LINE ID").fill("ui_flow_person");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "送出找房需求，請 Linus 聯絡我" })
    .click();
  await page.getByRole("heading", { name: "已收到你的租房需求" }).waitFor();
  await page.getByRole("button", { name: "用這些條件看行情" }).waitFor();
  assert.equal((await listLeads()).length, 2);
  await page.evaluate(() =>
    sessionStorage.setItem("linus-leads-admin-token", "ui-isolated-test-token"),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/#admin/leads/${buyer.id}`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: "修改需求", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "用這些條件開費用試算" }).count(),
    0,
  );
  await page.getByRole("button", { name: "修改需求", exact: true }).click();
  await page.locator("#buy-budget-max").fill("6500");
  await page.getByRole("button", { name: "儲存買房需求" }).click();
  await page.getByText("買房需求已更新，已記錄變更", { exact: true }).waitFor();
  const updated = (await getLead(buyer.id))!;
  assert.ok("budgetMaxMan" in updated.requirement);
  assert.equal(updated.requirement.budgetMaxMan, 6500);
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `${output}/buy-admin-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "回到客戶列表", exact: true }).click();
  await page.getByRole("button", { name: "買房 1", exact: true }).click();
  assert.equal(await page.getByText("UI 買家", { exact: false }).count(), 1);
  assert.equal(await page.getByText("UI 租客", { exact: false }).count(), 0);
  await page.getByRole("button", { name: "租房 1", exact: true }).click();
  assert.equal(await page.getByText("UI 租客", { exact: false }).count(), 1);
  assert.equal(await page.getByText("UI 買家", { exact: false }).count(), 0);
  await page.goto(`${base}/find-home`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /我要買房/ }).waitFor();
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.screenshot({
    path: `${output}/entry-desktop.png`,
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser QA passed: mobile/desktop, draft isolation, failure retry, buy/rent submissions, and buyer admin edit.",
  );
  console.log(`Screenshots: ${output}`);
} finally {
  await browser.close();
  await server.close();
}
