/**
 * 找房問卷與客戶需求後台的回歸測試（不連外部服務，用記憶體資料庫）。
 *   npm run test:find-home
 */
import assert from "node:assert/strict";
import { computeDimensions, diffRequirement, requirementText } from "../src/lib/findHome/lead";
import { buildLeadEmail } from "../src/lib/leadNotify";
import { normalizeContact, normalizeLeadSource, validateRequirement, validateSubmission } from "../src/lib/findHome/schema";
import {
  MemoryBackend, deleteLead, getLead, listLeads, patchLead, purgeExpiredContacts, removeContact, setLeadBackendForTests, submitLead,
} from "../src/lib/leadStore";
import findHomeHandler from "../api/find-home";
import leadsHandler from "../api/leads";

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (error) { console.error(`  ✗ ${name}`); throw error; }
}

const validInput = () => ({
  nickname: "小林",
  contact: { channel: "line", value: "@Kobayashi_01" },
  contactTimes: ["weekday-evening", "bogus"],
  privacyAck: true,
  requirement: {
    moveIn: "1m", reasons: ["commute"], residence: "overseas", entryDate: "2027-03-15", visa: "issued",
    visaType: "work", nationality: "台灣",
    areas: "中野、高圓寺", commuteTarget: "新宿站", occupants: 1, layouts: ["1K", "1DK"], minAreaSqm: "",
    rentIdealMan: "8.5", rentMaxMan: "10", initialCostMaxMan: "", mustHaves: ["separate-bath", "near-station"],
    top3: ["near-station", "autolock"], adjustable: ["budget", "area"],
  },
  decision: { onMatch: "apply-asap", ifNotFound: "adjust", note: "" },
});

function mockRes() {
  const res: any = { statusCode: 200, headers: {} as Record<string, string>, body: undefined as any };
  res.setHeader = (key: string, value: string) => { res.headers[key.toLowerCase()] = value; };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  res.send = (body: any) => { res.body = body; return res; };
  res.end = () => res;
  return res;
}

console.log("find-home schema");

await test("合格的問卷通過驗證，未知選項與不在已選條件中的 top3 被剔除", () => {
  const result = validateSubmission(validInput());
  assert.equal(result.ok, true);
  assert.deepEqual(result.value!.contactTimes, ["weekday-evening"]);
  assert.deepEqual(result.value!.requirement.top3, ["near-station"]);
  assert.equal(result.value!.contact.value, "Kobayashi_01");
  assert.equal(result.value!.requirement.rentMaxMan, 10);
});

await test("海外必填入境日期與簽證；最高月租不能低於理想", () => {
  const input = validInput();
  delete (input.requirement as any).entryDate;
  input.requirement.rentMaxMan = "7";
  const result = validateSubmission(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors!.entryDate);
  assert.ok(result.errors!.rentMaxMan);
});

await test("簽證種類必填；其他要自填；海外要國籍；日籍與永住者不問辦理進度", () => {
  const input = validInput();
  delete (input.requirement as any).visaType;
  delete (input.requirement as any).nationality;
  let result = validateSubmission(input);
  assert.ok(result.errors!.visaType && result.errors!.nationality);
  (input.requirement as any).visaType = "other";
  (input.requirement as any).nationality = "台灣";
  result = validateSubmission(input);
  assert.ok(result.errors!.visaTypeOther);
  (input.requirement as any).visaType = "permanent";
  delete (input.requirement as any).visa;
  result = validateSubmission(input);
  assert.equal(result.ok, true);
  assert.equal(result.value!.requirement.visa, undefined);
  // 在日本：不問國籍
  const japan = validInput();
  japan.requirement.residence = "japan";
  delete (japan.requirement as any).nationality;
  assert.equal(validateSubmission(japan).ok, true);
  // 後台修改舊資料（沒有簽證種類）不會被擋
  const old = validInput().requirement as any;
  delete old.visaType; delete old.nationality;
  assert.deepEqual(validateRequirement(old, undefined, true).errors, {});
});

await test("需求清單文字：略過沒填的欄位、含參考碼、不含聯絡方式", () => {
  const value = validateSubmission(validInput()).value!;
  const text = requirementText("FH-TEST", value.requirement, value.decision);
  assert.ok(text.startsWith("【找房需求 FH-TEST】"));
  assert.ok(text.includes("簽證種類：工作簽證"));
  assert.ok(text.includes("國籍：台灣"));
  assert.ok(text.includes("最高月租：¥100,000"));
  assert.equal(text.includes("最小面積"), false);
  assert.equal(text.includes("Kobayashi"), false);
});

await test("通知信內文：完整需求、後台連結，不含稱呼與聯絡方式", () => {
  const value = validateSubmission(validInput()).value!;
  const lead: any = {
    id: "ABCDEFGHJKMNPQRS", refCode: "FH-TEST", createdAt: "2026-11-10T03:00:00Z", updatedAt: "2026-11-10T03:00:00Z",
    source: "line", nickname: "小林", contact: value.contact, requirement: value.requirement, decision: value.decision, revisions: [],
  };
  const mail = buildLeadEmail(lead, "new");
  assert.ok(mail.subject.includes("FH-TEST"));
  assert.ok(mail.text.includes("希望地區：中野、高圓寺"));
  assert.ok(mail.text.includes("找到合適物件時：想儘快申請"));
  assert.ok(mail.text.includes("/#admin/leads/ABCDEFGHJKMNPQRS"));
  assert.equal(mail.text.includes("小林"), false);
  assert.equal(mail.text.includes("Kobayashi"), false);
});

await test("「維持原條件」與其他可調整項目互斥", () => {
  const input = validInput();
  input.requirement.adjustable = ["budget", "keep"];
  assert.deepEqual(validateRequirement(input.requirement).value.adjustable, ["keep"]);
});

await test("缺稱呼、無效聯絡方式、沒勾同意都會被擋", () => {
  const result = validateSubmission({ ...validInput(), nickname: " ", contact: { channel: "email", value: "not-an-email" }, privacyAck: false });
  assert.equal(result.ok, false);
  assert.ok(result.errors!.nickname && result.errors!.contact && result.errors!.privacyAck);
});

await test("聯絡方式正規化", () => {
  assert.equal(normalizeContact("email", " Foo@Example.COM "), "foo@example.com");
  assert.equal(normalizeContact("whatsapp", "886 912-345-678"), "+886912345678");
  assert.equal(normalizeContact("line", "有空白 的 id"), "");
  assert.equal(normalizeLeadSource("IG"), "instagram");
  assert.equal(normalizeLeadSource("<script>"), "other");
  assert.equal(normalizeLeadSource(undefined), "direct");
});

await test("三個維度：急迫看入住、準備看找到時的打算、維持原條件彈性低", () => {
  const { value } = validateRequirement(validInput().requirement);
  const dims = computeDimensions(value, { onMatch: "apply-asap" }, new Date("2026-11-10T00:00:00Z"));
  assert.equal(dims.urgency, "high");
  assert.equal(dims.readiness, "high");
  assert.equal(dims.flexibility, "high"); // 預算差 17%、可調整 2 項
  const keep = computeDimensions({ ...value, moveIn: "flexible", adjustable: ["keep"] }, { onMatch: "market-only" });
  assert.deepEqual([keep.urgency, keep.readiness, keep.flexibility], ["low", "low", "low"]);
  assert.equal(dims.reasons.length, 3);
});

await test("需求差異以顯示文字呈現前後值", () => {
  const { value } = validateRequirement(validInput().requirement);
  const changes = diffRequirement(value, { ...value, rentMaxMan: 11 });
  assert.deepEqual(changes, [{ field: "rentMaxMan", label: "最高月租", before: "¥100,000", after: "¥110,000" }]);
});

console.log("lead store");
const db = new MemoryBackend();
setLeadBackendForTests(db);
const base = new Date("2026-11-10T03:00:00Z");
const submission = validateSubmission(validInput()).value!;

let leadId = "";
await test("建立一筆需求：參考碼格式、初始狀態、同意紀錄", async () => {
  const result = await submitLead(submission, { source: "line", idempotencyKey: "key-aaaaaaaaaaaaaaaa" }, base);
  assert.match(result.refCode, /^FH-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(result.lead.admin.status, "new");
  assert.equal(result.lead.consents.length, 1);
  assert.equal(result.lead.notify.status, "pending");
  leadId = result.leadId;
});

await test("同一次填寫重送不會產生第二筆", async () => {
  const again = await submitLead(submission, { source: "line", idempotencyKey: "key-aaaaaaaaaaaaaaaa" }, base);
  assert.equal(again.duplicate, true);
  assert.equal(again.leadId, leadId);
  assert.equal((await listLeads(base)).length, 1);
});

await test("同一聯絡方式再填一次：併入原本那筆並記下變更", async () => {
  const changed = { ...submission, requirement: { ...submission.requirement, rentMaxMan: 11 } };
  const merged = await submitLead(changed, { source: "website", idempotencyKey: "key-bbbbbbbbbbbbbbbb" }, new Date(base.getTime() + 3600_000));
  assert.equal(merged.merged, true);
  assert.equal(merged.leadId, leadId);
  assert.equal(merged.lead.revisions[0].by, "client");
  assert.equal(merged.lead.revisions[0].changes[0].after, "¥110,000");
  assert.equal((await listLeads(base)).length, 1);
});

await test("後台修改：版本不符回 conflict，符合則寫入並記變更", async () => {
  const lead = (await getLead(leadId))!;
  assert.equal(await patchLead(leadId, lead.ver - 1, { status: "active" }), "conflict");
  const updated = await patchLead(leadId, lead.ver, { status: "to-contact", feasibility: "feasible", requirement: { ...lead.requirement, areas: "中野" } });
  assert.ok(typeof updated === "object");
  assert.equal(updated.admin.status, "to-contact");
  assert.equal(updated.revisions[0].by, "admin");
  assert.equal(updated.events[0].text, "狀態改為「待聯絡」");
});

await test("已聯絡上：刪除聯絡方式，之後同一聯絡方式再填會開新的一筆", async () => {
  const lead = (await getLead(leadId))!;
  const removed = await removeContact(leadId, "contacted", lead.ver);
  assert.ok(typeof removed === "object");
  assert.equal(removed.contact, null);
  assert.equal(removed.admin.status, "clarifying");
  assert.equal(JSON.stringify(removed).includes("Kobayashi_01"), false);
  const fresh = await submitLead(submission, { source: "line", idempotencyKey: "key-cccccccccccccccc" }, base);
  assert.notEqual(fresh.leadId, leadId);
  await deleteLead(fresh.leadId);
});

await test("送出滿 30 天未聯絡上：自動刪除聯絡方式", async () => {
  const other = { ...submission, contact: { channel: "email" as const, value: "late@example.com" } };
  const created = await submitLead(other, { source: "direct", idempotencyKey: "key-dddddddddddddddd" }, base);
  assert.equal(await purgeExpiredContacts(new Date(base.getTime() + 29 * 86_400_000)), 0);
  assert.equal(await purgeExpiredContacts(new Date(base.getTime() + 31 * 86_400_000)), 1);
  const after = (await getLead(created.leadId))!;
  assert.equal(after.contact, null);
  assert.equal(after.contactRemovedReason, "expired");
});

await test("刪除整筆資料", async () => {
  const before = (await listLeads(base)).length;
  assert.equal(await deleteLead(leadId), true);
  assert.equal((await listLeads(base)).length, before - 1);
  assert.equal(await getLead(leadId), null);
});

console.log("api handlers");

await test("POST /api/find-home：honeypot 與太快送出回假成功、不寫入", async () => {
  const before = (await listLeads()).length;
  const res = mockRes();
  await findHomeHandler({ method: "POST", headers: {}, body: { ...validInput(), idempotencyKey: "key-eeeeeeeeeeeeeeee", website: "spam" } }, res);
  assert.equal(res.statusCode, 201);
  const res2 = mockRes();
  await findHomeHandler({ method: "POST", headers: {}, body: { ...validInput(), idempotencyKey: "key-ffffffffffffffff", startedAt: Date.now() } }, res2);
  assert.equal(res2.statusCode, 201);
  assert.equal((await listLeads()).length, before);
});

await test("POST /api/find-home：欄位錯誤回 400 fieldErrors；成功回參考碼且不回傳內部判斷", async () => {
  const bad = mockRes();
  await findHomeHandler({ method: "POST", headers: {}, body: { ...validInput(), nickname: "", idempotencyKey: "key-gggggggggggggggg" } }, bad);
  assert.equal(bad.statusCode, 400);
  assert.ok(bad.body.fieldErrors.nickname);
  const ok = mockRes();
  await findHomeHandler({ method: "POST", headers: {}, body: { ...validInput(), contact: { channel: "wechat", value: "wx_tester" }, idempotencyKey: "key-hhhhhhhhhhhhhhhh", startedAt: Date.now() - 60_000 } }, ok);
  assert.equal(ok.statusCode, 201);
  assert.deepEqual(Object.keys(ok.body), ["refCode"]);
});

await test("/api/leads：沒密碼 401；有密碼可列表、CSV 不含聯絡方式", async () => {
  process.env.LEADS_ADMIN_TOKEN = "test-token-123";
  const denied = mockRes();
  await leadsHandler({ method: "GET", headers: { "x-admin-token": "wrong" }, query: {} }, denied);
  assert.equal(denied.statusCode, 401);
  const list = mockRes();
  await leadsHandler({ method: "GET", headers: { "x-admin-token": "test-token-123" }, query: {} }, list);
  assert.equal(list.statusCode, 200);
  assert.ok(list.body.leads.some((lead: any) => lead.contactChannel === "wechat"));
  assert.equal(JSON.stringify(list.body).includes("wx_tester"), false);
  const csv = mockRes();
  await leadsHandler({ method: "GET", headers: { "x-admin-token": "test-token-123" }, query: { export: "csv" } }, csv);
  assert.equal(csv.statusCode, 200);
  assert.equal(String(csv.body).includes("wx_tester"), false);
  assert.ok(String(csv.body).includes("保留中（未匯出）"));
});

await test("/api/leads?task=purge 需要 CRON_SECRET", async () => {
  delete process.env.CRON_SECRET;
  const res = mockRes();
  await leadsHandler({ method: "GET", headers: {}, query: { task: "purge" } }, res);
  assert.equal(res.statusCode, 401);
  process.env.CRON_SECRET = "cron-secret";
  const ok = mockRes();
  await leadsHandler({ method: "GET", headers: { authorization: "Bearer cron-secret" }, query: { task: "purge" } }, ok);
  assert.equal(ok.statusCode, 200);
});

await test("/api/leads：沒設 LEADS_ADMIN_TOKEN 時沿用 ANALYTICS_TOKEN", async () => {
  delete process.env.LEADS_ADMIN_TOKEN;
  process.env.ANALYTICS_TOKEN = "stats-token-456";
  const res = mockRes();
  await leadsHandler({ method: "GET", headers: { "x-admin-token": "stats-token-456" }, query: {} }, res);
  assert.equal(res.statusCode, 200);
});

await test("沒設 CRON_SECRET：只接受 Vercel Cron，且一小時內只跑一次", async () => {
  delete process.env.CRON_SECRET;
  const outsider = mockRes();
  await leadsHandler({ method: "GET", headers: { "user-agent": "curl/8" }, query: { task: "purge" } }, outsider);
  assert.equal(outsider.statusCode, 401);
  const first = mockRes();
  await leadsHandler({ method: "GET", headers: { "user-agent": "vercel-cron/1.0" }, query: { task: "purge" } }, first);
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.skipped, undefined);
  const second = mockRes();
  await leadsHandler({ method: "GET", headers: { "user-agent": "vercel-cron/1.0" }, query: { task: "purge" } }, second);
  assert.equal(second.body.skipped, true);
});

console.log(`\n${passed} passed`);
