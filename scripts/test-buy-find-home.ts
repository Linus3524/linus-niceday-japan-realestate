import assert from "node:assert/strict";
import {
  validateBuyRequirement,
  validateBuySubmission,
  isBuyRequirement,
  BUY_VISA_OPTIONS,
  type BuyFindHomeSubmission,
} from "../src/lib/findHome/buySchema";
import {
  BUY_HOME_DRAFT_KEY,
  emptyBuyForm,
  loadBuyDraft,
} from "../src/lib/findHome/buyDraft";
import { FIND_HOME_DRAFT_KEY } from "../src/lib/findHome/draft";
import {
  questionnaireHref,
  questionnaireType,
} from "../src/lib/findHome/routes";
import { validateSubmission } from "../src/lib/findHome/schema";
import {
  requirementText,
  computeDimensions,
  diffRequirement,
  toSummary,
} from "../src/lib/findHome/lead";
import {
  MemoryBackend,
  setLeadBackendForTests,
  submitLead,
  getLead,
  patchLead,
  deleteLead,
  removeContact,
  listLeads,
  purgeExpiredContacts,
} from "../src/lib/leadStore";
import { buildLeadEmail } from "../src/lib/leadNotify";
import handler from "../api/find-home";
import admin from "../api/leads";
let passed = 0;
async function test(name: string, fn: () => unknown | Promise<unknown>) {
  await fn();
  passed++;
  console.log(`✓ ${name}`);
}
export const buyInput = () => ({
  dealType: "buy",
  nickname: "測試買家",
  contact: { channel: "line", value: "same_buyer" },
  contactTimes: ["weekend"],
  privacyAck: true,
  requirement: {
    kind: "buy",
    gender: "female",
    ageRange: "30s",
    residence: "overseas",
    nationality: "台灣",
    visaType: "other",
    visaTypeOther: "沒有日本簽證",
    funding: "cash",
    viewing: "in-person",
    visitTiming: "明年 3 月來日本",
    purchaseTiming: "6m",
    budgetIdealMan: "3000",
    budgetMaxMan: "5000",
    budgetScope: "all-in",
    purpose: "own",
    propertyTypes: ["condo"],
    areas: "中野、高圓寺",
    layouts: ["2LDK"],
    walkMaxMin: "10",
    ageMaxYears: "20",
    minAreaSqm: "50",
    floorMin: "2",
    structure: "rc",
    mustHaves: ["elevator", "pets"],
    adjustable: ["area"],
  },
  decision: {
    onMatch: "view-first",
    note: "希望可養貓",
    applicationRoutes: ["advance-contract"],
  },
});
function res() {
  return {
    statusCode: 200,
    body: null as any,
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(n: number) {
      this.statusCode = n;
      return this;
    },
    json(b: any) {
      this.body = b;
      return this;
    },
    send(b: any) {
      this.body = b;
      return this;
    },
  };
}
const valid = () => validateBuySubmission(buyInput()).value!;
await test("買房簽證只有指定六項，其他需說明；舊資料保留原身分", () => {
  assert.deepEqual(BUY_VISA_OPTIONS.map(o => o.label), ["日本籍", "工作簽證", "永住", "經營管理簽證", "留學簽證", "其他"]);
  const input = buyInput().requirement;
  assert.ok(validateBuyRequirement({ ...input, visaType: "other", visaTypeOther: "" }).errors.visaTypeOther);
  const old = validateBuyRequirement({ ...input, visaType: "none", visaTypeOther: "" }).value;
  assert.equal(old.visaType, "other");
  assert.equal(old.visaTypeOther, "沒有日本簽證");
  assert.equal(validateBuyRequirement({ ...input, visaType: "留學（日本語學校）" }).value.visaType, "留學");
  assert.match(requirementText(null, old), /簽證種類：沒有日本簽證/);
});
await test("原買房七題加性別、年齡、簽證可完整驗證；沒有簽證的海外買家可填", () => {
  const p = validateBuySubmission(buyInput());
  assert.equal(p.ok, true, JSON.stringify(p.errors));
  assert.equal(p.value!.requirement.budgetMaxMan, 5000);
  assert.equal(p.value!.requirement.visaType, "other");
  assert.equal(p.value!.requirement.visaTypeOther, "沒有日本簽證");
  assert.equal(p.value!.requirement.floorMin, 2);
  assert.equal(p.value!.requirement.visitTiming, "明年 3 月來日本");
  assert.equal(p.value!.decision.applicationRoutes, undefined);
});
await test("缺性別、年齡、簽證、海外國籍會分別標示，沒有強制租屋入境日期", () => {
  const input = buyInput();
  for (const field of ["gender", "ageRange", "visaType", "nationality"])
    delete (input.requirement as any)[field];
  const p = validateBuySubmission(input);
  for (const field of ["gender", "ageRange", "visaType", "nationality"])
    assert.ok(p.errors?.[field]);
  assert.equal(p.errors?.entryDate, undefined);
  assert.equal(p.errors?.rentMaxMan, undefined);
});
await test("購屋預算上限與理想值、數字、日期及物件條件驗證", () => {
  const req = buyInput().requirement;
  assert.ok(
    validateBuyRequirement({ ...req, budgetMaxMan: 2000 }).errors.budgetMaxMan,
  );
  for (const value of [NaN, Infinity, -1, "nope", 1000001])
    assert.ok(
      validateBuyRequirement({ ...req, budgetMaxMan: value }).errors
        .budgetMaxMan,
    );
  assert.ok(
    validateBuyRequirement({
      ...req,
      purchaseTiming: "date",
      purchaseDate: "2027-02-30",
    }).errors.purchaseDate,
  );
  assert.ok(validateBuyRequirement({ ...req, floorMin: -2 }).errors.floorMin);
  assert.ok(
    validateBuyRequirement({ ...req, minAreaSqm: "abc" }).errors.minAreaSqm,
    "非數字面積不可被靜默略過",
  );
});
await test("改選現金／線上／非指定日期時清掉過時的分支資料", () => {
  const req = {
    ...buyInput().requirement,
    funding: "cash",
    ownFundsMan: 1000,
    loanStatus: "preapproved",
    viewing: "online",
    visitTiming: "舊的來日安排",
    purchaseDate: "2027-01-01",
  };
  const p = validateBuyRequirement(req).value;
  assert.equal(p.loanStatus, undefined);
  assert.equal(p.ownFundsMan, undefined);
  assert.equal(p.visitTiming, undefined);
  assert.equal(p.purchaseDate, undefined);
  assert.deepEqual(
    validateBuyRequirement({
      ...req,
      propertyTypes: ["condo", "undecided"],
      adjustable: ["area", "keep"],
    }).value.propertyTypes,
    ["undecided"],
  );
});
await test("固定種子隨機 180 組買房條件不混入月租、入住審查或租屋申請文字", () => {
  let seed = 20261110;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pick = <T>(xs: T[]) => xs[Math.floor(next() * xs.length)];
  for (let i = 0; i < 180; i++) {
    const input = buyInput();
    Object.assign(input.requirement, {
      gender: pick(["male", "female", "no-answer"]),
      ageRange: pick(["20s", "30s", "40s", "60plus"]),
      funding: pick(["cash", "loan", "undecided"]),
      residence: pick(["japan", "overseas"]),
      visaType: pick([
        "none",
        "日本籍",
        "留學",
        "永住者",
        "技術・人文知識・國際業務",
      ]),
      viewing: pick(["online", "in-person", "either", "undecided"]),
      purchaseTiming: pick(["3m", "6m", "1y", "flexible"]),
      purpose: pick(["own", "investment", "both"]),
      budgetIdealMan: 1000 + i,
      budgetMaxMan: 3000 + i,
      propertyTypes: [pick(["condo", "house", "building", "undecided"])],
    });
    const p = validateBuySubmission(input);
    assert.equal(p.ok, true, JSON.stringify(p.errors));
    const text = requirementText(
      "FH-TEST",
      p.value!.requirement,
      p.value!.decision,
    );
    assert.match(text, /買房需求/);
    assert.match(text, /最高購屋預算/);
    assert.doesNotMatch(text, /月租|禮金|敷金|先行契約|入住時間/);
    assert.equal(
      computeDimensions(p.value!.requirement, p.value!.decision).ruleVersion,
      "2026-11-10-buy",
    );
  }
});
await test("同一頁可直達租或買並保留來源；兩邊草稿分開", () => {
  assert.equal(questionnaireType(""), null);
  assert.equal(questionnaireType("?type=buy"), "buy");
  assert.equal(questionnaireType("?type=sell"), null);
  assert.equal(
    questionnaireHref("buy", "?from=instagram&type=rent"),
    "/find-home?from=instagram&type=buy",
  );
  assert.notEqual(BUY_HOME_DRAFT_KEY, FIND_HOME_DRAFT_KEY);
  const data = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  };
  data.set(
    FIND_HOME_DRAFT_KEY,
    JSON.stringify({ form: { requirement: { areas: "租房草稿" } } }),
  );
  assert.equal(loadBuyDraft().form.dealType, "buy");
  assert.equal(loadBuyDraft().form.requirement.areas, "");
  assert.equal(emptyBuyForm().requirement.budgetMaxMan, "");
  delete (globalThis as any).localStorage;
});
setLeadBackendForTests(new MemoryBackend());
const rentRaw = {
  nickname: "測試租客",
  contact: buyInput().contact,
  privacyAck: true,
  requirement: {
    gender: "male",
    ageRange: "30s",
    moveIn: "1m",
    reasons: [],
    residence: "japan",
    visaType: "日本籍",
    areas: "中野",
    occupants: 1,
    layouts: ["1K"],
    rentIdealMan: 10,
    rentMaxMan: 12,
    mustHaves: [],
    top3: [],
    adjustable: ["area"],
  },
  decision: { onMatch: "view-first" },
};
const rental = validateSubmission(rentRaw).value!;
let rentId = "";
let buyId = "";
await test("同一聯絡方式、同一送出 key 填買與租，會保留兩筆獨立需求", async () => {
  const rent = await submitLead(rental, {
    source: "line",
    idempotencyKey: "same-idempotency-key",
  });
  const buy = await submitLead(valid(), {
    source: "instagram",
    idempotencyKey: "same-idempotency-key",
  });
  rentId = rent.leadId;
  buyId = buy.leadId;
  assert.notEqual(rentId, buyId);
  assert.notEqual(rent.refCode, buy.refCode);
  assert.equal(buy.lead.dealType, "buy");
  assert.equal(rent.lead.dealType, "rent");
  assert.equal((await listLeads()).length, 2);
});
await test("買房重送保持參考碼，只更新買房；總價、用途變更都有紀錄", async () => {
  const p = valid();
  p.requirement.budgetMaxMan = 6000;
  p.requirement.purpose = "investment";
  const updated = await submitLead(p, {
    source: "threads",
    idempotencyKey: "new-buy-key-123456",
  });
  assert.equal(updated.leadId, buyId);
  assert.equal(updated.merged, true);
  assert.ok(
    updated.lead.revisions[0].changes.some((c) => c.field === "budgetMaxMan"),
  );
  assert.equal((await getLead(rentId))!.dealType, "rent");
  const again = await submitLead(p, {
    source: "threads",
    idempotencyKey: "new-buy-key-123456",
  });
  assert.equal(again.duplicate, true);
  const summary = toSummary(updated.lead);
  assert.equal(summary.dealType, "buy");
  assert.equal(summary.budgetMaxMan, 6000);
  assert.equal(summary.rentMaxMan, undefined);
});
await test("買房摘要、通知信及修改紀錄保留買房語意，通知不含稱呼聯絡方式", async () => {
  const lead = (await getLead(buyId))!;
  const mail = buildLeadEmail(lead, "new");
  assert.match(mail.subject, /買房需求/);
  assert.match(mail.text, /最高購屋預算/);
  assert.doesNotMatch(mail.text, /same_buyer|測試買家|先行契約/);
  const req = lead.requirement;
  assert.ok(isBuyRequirement(req));
  const changes = diffRequirement(req, { ...req, budgetMaxMan: 7000 });
  assert.equal(changes[0].label, "最高購屋預算");
});
await test("POST 公開 API 收買房、拒絕無效欄位與未知租買類型", async () => {
  const bad = res();
  await handler(
    {
      method: "POST",
      headers: {},
      body: {
        ...buyInput(),
        requirement: { ...buyInput().requirement, budgetMaxMan: 1000 },
        idempotencyKey: "invalid-buy-request-123",
        startedAt: Date.now() - 10000,
      },
    },
    bad,
  );
  assert.equal(bad.statusCode, 400);
  assert.ok(bad.body.fieldErrors.budgetMaxMan);
  const good = res();
  await handler(
    {
      method: "POST",
      headers: {},
      body: {
        ...buyInput(),
        idempotencyKey: "valid-buy-request-1234",
        startedAt: Date.now() - 10000,
      },
    },
    good,
  );
  assert.equal(good.statusCode, 201);
  assert.deepEqual(Object.keys(good.body), ["refCode"]);
  const wrong = res();
  await handler(
    {
      method: "POST",
      headers: {},
      body: {
        ...buyInput(),
        dealType: "sell",
        idempotencyKey: "wrong-buy-request-1234",
        startedAt: Date.now() - 10000,
      },
    },
    wrong,
  );
  assert.equal(wrong.statusCode, 400);
});
process.env.LEADS_ADMIN_TOKEN = "buy-test-token";
await test("後台可改買房總價及查看 CSV，買房與租房欄位正確且不匯出聯絡方式", async () => {
  const lead = (await getLead(buyId))!;
  const patched = res();
  await admin(
    {
      method: "PATCH",
      headers: { "x-admin-token": "buy-test-token" },
      body: {
        id: buyId,
        ver: lead.ver,
        patch: { requirement: { ...lead.requirement, budgetMaxMan: 8000 } },
      },
    },
    patched,
  );
  assert.equal(patched.statusCode, 200);
  assert.equal(patched.body.lead.requirement.budgetMaxMan, 8000);
  assert.equal(patched.body.lead.dealType, "buy");
  const csv = res();
  await admin(
    {
      method: "GET",
      headers: { "x-admin-token": "buy-test-token" },
      query: { export: "csv" },
    },
    csv,
  );
  assert.match(csv.body, /買房｜最高購屋預算/);
  assert.match(csv.body, /80,000,000/);
  assert.doesNotMatch(csv.body, /same_buyer/);
});
await test("買房刪除聯絡方式及整筆刪除，不會破壞同一聯絡方式的租房去重", async () => {
  await removeContact(buyId, "contacted", null);
  assert.equal((await getLead(buyId))!.contact, null);
  await deleteLead(buyId);
  const again = await submitLead(rental, {
    source: "line",
    idempotencyKey: "rent-after-buy-delete",
  });
  assert.equal(again.leadId, rentId);
  assert.equal(again.merged, true);
  const fresh = await submitLead(valid(), {
    source: "line",
    idempotencyKey: "buy-after-buy-delete",
  });
  assert.notEqual(fresh.leadId, buyId);
  const future = new Date(Date.now() + 31 * 86400000);
  assert.ok(await purgeExpiredContacts(future));
  assert.equal((await getLead(fresh.leadId))!.contact, null);
});
console.log(
  `\n${passed} buy questionnaire tests passed (including 180 seeded combinations).`,
);
