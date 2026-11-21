/** 租屋申請資料（/moushikomi）：身份分支、文件清單、上傳、送出、結案刪除與 90 天自動刪除。資料只存記憶體。 */
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { MemoryBackend, setLeadBackendForTests } from "../src/lib/leadStore";
import { MemoryDrive, setDriveForTests } from "../src/lib/moushikomi/drive";
import { addrRegion, cleanForm, docsFor, displayValue, normalizeDob, stepsFor, toJapaneseSheet, validateForm, type FormValues } from "../src/lib/moushikomi/schema";
import { createApplication } from "../src/lib/moushikomi/store";
import handler from "../api/moushikomi";

process.env.RESEND_API_KEY = "";
process.env.LEADS_ADMIN_TOKEN = "apply-test-token";
process.env.CRON_SECRET = "apply-cron";
setLeadBackendForTests(new MemoryBackend());
const drive = new MemoryDrive();
setDriveForTests(drive);

// ── 欄位與文件分支 ──────────────────────────────────────────
const ids = (x: FormValues) => stepsFor(x).flatMap(step => step.fields.map(f => f.id));
const docIds = (x: FormValues) => docsFor(x).map(d => d.id);

assert.ok(ids({ identity: "student" }).includes("schoolType"), "留學生要問學校類型");
assert.ok(!ids({ identity: "student" }).includes("capital"), "留學生不問資本額");
assert.ok(ids({ identity: "worker", workerStatus: "over3" }).includes("capital"), "上班族要問資本額");
assert.ok(ids({ identity: "worker", workerStatus: "offer" }).includes("startDate"), "尚未入職問預計入職日");
assert.ok(ids({ identity: "worker", where: "overseas" }).includes("startDate"), "海外審查的工作簽證視為尚未入職");
assert.ok(!ids({ identity: "worker", where: "overseas" }).includes("workerStatus"), "海外審查不問工作狀態");
assert.ok(ids({ identity: "corporate" }).includes("capital"), "法人契約填公司資訊");
assert.ok(ids({ identity: "corporate" }).includes("guNameEn") && !ids({ identity: "worker" }).includes("guNameEn"), "法人契約才有連帶保證人");
const findField = (x: FormValues, id: string) => stepsFor(x).flatMap(s => s.fields).find(f => f.id === id)!;
for (const id of ["Kana", "coKana", "homeKana"]) assert.equal(findField({ cohab: "spouse" }, id).req, "unk", `${id} 可以勾不會寫`);
for (const id of ["jpKana", "guKana"]) assert.equal(findField({ identity: "corporate" }, id).req, "req", `${id} 必填、不能勾不會寫`);
assert.ok(ids({ cohab: "other" }).includes("coNameEn"), "同居人選其他也要填資料");
for (const key of ["jpNationality", "homeNationality"]) assert.ok(ids({}).includes(key), `${key} 要問國籍`);
assert.ok(ids({ cohab: "spouse" }).includes("coNationality"));
assert.equal(stepsFor({}).find(s => s.id === "jp")!.fields.find(f => f.id === "jpOrgName")!.req, "opt", "在日聯絡人的公司資訊選填");
assert.equal(stepsFor({ identity: "wh", whJob: "no" })[2].skip !== undefined, true, "打工度假沒工作跳過公司");
assert.ok(!ids({ identity: "student", where: "overseas" }).includes("yearsInJapan"), "人在海外不問來日年數");
assert.ok(ids({ identity: "student" }).includes("rent") && !ids({ identity: "worker", workerStatus: "over3" }).includes("rent"));
assert.equal(stepsFor({ identity: "student" })[1].fields.find(f => f.id === "income")!.label, "家人每月從海外寄來的生活費");
assert.ok(!ids({ jpNone: "1" }).includes("jpNameEn"), "勾在日沒人就不出現聯絡人欄位");
assert.ok(ids({ cohab: "spouse" }).includes("coNameEn") && !ids({ cohab: "alone" }).includes("coNameEn"));

// 文件對標官網「依身份準備的文件」。
assert.deepEqual(docIds({ identity: "student", where: "japan" }), ["passport", "zairyu", "studentId", "bank", "remit"]);
assert.deepEqual(docIds({ identity: "student", where: "overseas" }), ["passport", "coe", "admission", "bank"]);
assert.deepEqual(docIds({ identity: "worker", workerStatus: "over3", where: "japan" }), ["zairyu", "passport", "insurance", "gensen", "pay3", "terms", "bank", "remit"]);
assert.deepEqual(docIds({ identity: "worker", workerStatus: "changing", where: "japan" }), ["zairyu", "passport", "newOffer", "oldPay", "bank", "remit"]);
assert.deepEqual(docIds({ identity: "worker", where: "overseas" }), ["passport", "coe", "offer", "bank", "remit"]);
assert.deepEqual(docIds({ identity: "wh", whJob: "no", where: "overseas" }), ["passport", "visaSticker", "bank", "offer"]);
assert.deepEqual(docIds({ identity: "corporate", where: "japan" }), ["corpRegistry", "corpFinancials", "corpSeal", "repSeal", "residentId", "employeeId", "corpProfile"]);
const workerDocs = docsFor({ identity: "worker", workerStatus: "over3", where: "japan" });
assert.equal(workerDocs.find(d => d.id === "bank")!.required, false, "上班族財力證明非必備");
assert.match(workerDocs.find(d => d.id === "terms")!.hint!, /蓋有公司社章/, "帶入官網的補充說明");
assert.equal(docsFor({ identity: "worker", workerStatus: "changing", where: "japan" }).find(d => d.id === "oldPay")!.required, false, "視個案算選交");
const bankDoc = docsFor({ identity: "student", rent: "85000" }).find(d => d.id === "bank")!;
assert.match(bankDoc.hint!, /約需 128 萬円/);
assert.ok(bankDoc.points!.some(point => /需顯示戶名跟帳號/.test(point)), "財力證明形式條列");
assert.equal(bankDoc.footnote, "留學生可以用自己或父母的。");
assert.ok(docIds({ identity: "worker", workerStatus: "under3", cohab: "partner" }).includes("coId"));

// 切換身份後，舊身份的欄位不會被存下來。
const switched = cleanForm({ identity: "student", capital: "1000萬", schoolType: "lang", NameEn: "wang" }, { capital: true });
assert.equal(switched.values.capital, undefined);
assert.equal(switched.values.NameEn, "WANG");
assert.deepEqual(switched.unknown, {});

const student: FormValues = {
  identity: "student", where: "japan", property: "中野 1K", rent: "80000",
  NameEn: "WANG XIAOMING", NameKanji: "王小明", Birthday: "2001-04-05", Gender: "m", nationality: "台灣",
  Phone: "+81 90-1234-5678", Email: "wang@example.com",
  AddressZip: "1640001", AddressPref: "東京都", AddressCity: "中野区", AddressTown: "中野 1-2-3", AddressBldg: "中野ハイツ 201",
  housing: "rent", currentRent: "70000",
  yearsAtAddress: "1 年", yearsInJapan: "2 年", income: "每月 15 萬円",
  schoolType: "lang", orgName: "東京日本語学校",
  jpNone: "1",
  homeNameEn: "WANG DAMING", homeBirthday: "1970-01-01", homeGender: "m", homeRelation: "father", homePhone: "+886 912-345-678", homeEmail: "dad@example.com", homeNationality: "台灣", homeAddressOverseas: "台北市大安區忠孝東路四段 1 號",
  cohab: "alone", docTiming: "now",
};
const studentUnknown = { Kana: true, orgAddress: true, orgPhone: true, homeKana: true };
assert.deepEqual(validateForm(cleanForm(student, studentUnknown)), {}, "留學生完整資料應該通過");
const missing = validateForm(cleanForm({ ...student, Phone: "", Email: "bad" }, studentUnknown));
assert.equal(missing.Phone, "請填寫這一格");
assert.equal(missing.Email, "Email 格式看起來不對");
assert.ok(validateForm(cleanForm(student, {})).Kana, "片假名沒勾不知道就必填");
// 地址：日本拆行、海外一行；母國聯絡人預設海外，申請人跟著「人在哪裡」。
const homeAddr = stepsFor({}).find(s => s.id === "home")!.fields.find(f => f.id === "homeAddress")!;
const applicantAddr = stepsFor({}).find(s => s.id === "applicant")!.fields.find(f => f.id === "Address")!;
assert.equal(addrRegion(homeAddr, {}), "overseas");
assert.equal(addrRegion(applicantAddr, {}), "jp");
assert.equal(addrRegion(applicantAddr, { where: "overseas" }), "overseas");
assert.equal(addrRegion(applicantAddr, { where: "overseas", AddressRegion: "jp" }), "jp", "客人手動切換優先");
const studentForm = cleanForm(student, studentUnknown);
assert.equal(displayValue(applicantAddr, studentForm), "〒164-0001 東京都中野区中野 1-2-3 中野ハイツ 201");
assert.equal(displayValue(homeAddr, studentForm, "ja"), "（海外）台北市大安區忠孝東路四段 1 號");
assert.equal(validateForm(cleanForm({ ...student, AddressTown: "" }, studentUnknown)).Address, "請把都道府縣、市區町村、町名與番地填完整");
assert.equal(validateForm(cleanForm({ ...student, AddressZip: "16400" }, studentUnknown)).Address, "郵遞區號是 7 位數字");
assert.equal(cleanForm({ ...student, AddressRegion: "overseas", AddressOverseas: "Taipei" }, studentUnknown).values.AddressPref, undefined, "切到海外就不留日本欄位");
// 生日：三格輸入可能沒補零，存的時候補齊；不存在的日期擋掉。
assert.equal(normalizeDob("1995-6-1"), "1995-06-01");
assert.equal(normalizeDob("1995-2-30"), null);
assert.equal(cleanForm({ ...student, Birthday: "2001-4-5" }, studentUnknown).values.Birthday, "2001-04-05");
assert.ok(validateForm(cleanForm({ ...student, Birthday: "2001--" }, studentUnknown)).Birthday, "沒填完的生日要擋");
const sheet = toJapaneseSheet(cleanForm(student, studentUnknown), "AP-TEST");
assert.match(sheet, /氏名（ローマ字）：WANG XIAOMING/);
assert.match(sheet, /フリガナ：（確認中）/);
assert.match(sheet, /生年月日：2001年4月5日/);
assert.match(sheet, /現住所：〒164-0001 東京都中野区中野 1-2-3 中野ハイツ 201/);
assert.match(sheet, /■ 緊急連絡先（日本）\nなし（要相談）/);
assert.match(sheet, /■ 同居人\nなし（単身入居）/);

// ── API 流程 ───────────────────────────────────────────────
type Res = { code: number; data: any; headers: Record<string, string> };
async function call(opts: { method?: string; query?: Record<string, string>; headers?: Record<string, string>; body?: any; raw?: Buffer }): Promise<Res> {
  const req: any = opts.raw ? Readable.from([opts.raw]) : {};
  req.method = opts.method || "GET";
  req.query = opts.query || {};
  req.headers = { ...(opts.raw ? { "content-type": "application/octet-stream" } : {}), ...(opts.headers || {}) };
  if (!opts.raw) req.body = opts.body;
  const res: any = {
    code: 200, data: undefined, headers: {},
    setHeader(k: string, v: string) { this.headers[k] = v; },
    status(n: number) { this.code = n; return this; },
    json(d: any) { this.data = d; return this; },
    send(d: any) { this.data = d; return this; },
    end() { return this; },
  };
  await handler(req, res);
  return res;
}
const admin = { "x-admin-token": "apply-test-token" };

assert.equal((await call({ query: { admin: "list" } })).code, 401, "後台要密碼");
const created = await call({ method: "POST", headers: admin, body: { admin: "create", label: "小明", property: "中野 1K" } });
assert.equal(created.code, 201);
const app = created.data.application;
assert.match(app.refCode, /^AP-[A-HJ-NP-Z2-9]{4}$/);
assert.ok(app.driveFolderId, "建立連結時先建好 Drive 資料夾");
const tok = { "x-apply-token": app.token };

assert.equal((await call({ headers: { "x-apply-token": "x".repeat(32) } })).code, 404, "錯的連結");
const state = await call({ headers: tok });
assert.equal(state.data.property, "中野 1K");
assert.equal(state.data.submitted, false);

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const up = await call({ method: "POST", headers: { ...tok, "x-doc-id": "passport", "x-file-name": encodeURIComponent("護照.jpg") }, raw: jpeg });
assert.equal(up.code, 201);
assert.equal(up.data.files.length, 1);
assert.equal([...drive.files.values()].filter(f => f.folderId === app.driveFolderId).length, 1, "檔案進到客人的資料夾");
assert.equal((await call({ method: "POST", headers: { ...tok, "x-doc-id": "passport", "x-file-name": "a.exe" }, raw: Buffer.from("MZ not an image at all") })).code, 415, "不是照片或 PDF 擋掉");
assert.equal((await call({ method: "POST", headers: { ...tok, "x-doc-id": "nope" }, raw: jpeg })).code, 400, "文件種類要在清單內");

const noConsent = await call({ method: "POST", headers: tok, body: { action: "submit", values: student, unknown: studentUnknown } });
assert.equal(noConsent.code, 400);
const missingDocs = await call({ method: "POST", headers: tok, body: { action: "submit", values: student, unknown: studentUnknown, privacyAck: true, shareConsent: true } });
assert.equal(missingDocs.code, 400);
assert.ok(missingDocs.data.fieldErrors["doc:zairyu"], "必交文件沒傳也沒勾之後再補要擋");
const later = { zairyu: true, studentId: true, bank: true, remit: true };
const submitted = await call({ method: "POST", headers: tok, body: { action: "submit", values: student, unknown: studentUnknown, docLater: later, privacyAck: true, shareConsent: true } });
assert.equal(submitted.code, 201, JSON.stringify(submitted.data));
assert.equal(submitted.data.submitted, true);
assert.equal(submitted.data.docKeys.identity, "student");
assert.equal(submitted.data.docKeys.NameEn, undefined, "送出後不回傳個資");
assert.equal((await call({ method: "POST", headers: tok, body: { action: "submit", values: student, unknown: studentUnknown, docLater: later, privacyAck: true, shareConsent: true } })).code, 409);

const folder = drive.folders.get(app.driveFolderId)!;
assert.equal(folder.name, `${app.refCode} WANG XIAOMING`, "送出後資料夾改成護照拼音");

await call({ method: "POST", headers: { ...tok, "x-doc-id": "zairyu", "x-file-name": "zairyu.jpg" }, raw: jpeg });
const done = await call({ method: "POST", headers: tok, body: { action: "docs-done" } });
assert.equal(done.code, 200);
assert.equal(done.data.docLater.zairyu, undefined, "補傳後不再標成之後再補");

const one = await call({ query: { admin: "one", id: app.id }, headers: admin });
assert.equal(one.data.application.form.values.NameEn, "WANG XIAOMING");
assert.equal(one.data.application.notify.status, "failed", "沒設定寄信時記錄未寄出");
assert.match(one.data.application.events[0].text, /補交 1 個檔案/);
const list = await call({ query: { admin: "list" }, headers: admin });
assert.equal(list.data.applications.length, 1);
assert.equal(list.data.drive.mode, "memory");

assert.equal((await call({ method: "POST", headers: admin, body: { admin: "close", id: app.id, confirm: "AP-XXXX" } })).code, 400);
assert.equal((await call({ method: "POST", headers: admin, body: { admin: "close", id: app.id, confirm: app.refCode } })).data.deleted, true);
assert.equal(drive.folders.has(app.driveFolderId), false, "結案刪掉 Drive 資料夾");
assert.equal([...drive.files.values()].length, 0, "連同檔案");
assert.equal((await call({ headers: tok })).code, 404, "結案後連結失效");

// 90 天自動刪除：建立於 100 天前、沒送出的連結。
const old = await createApplication({ label: "舊客人" }, new Date(Date.now() - 100 * 86_400_000));
const fresh = await createApplication({ label: "新客人" });
assert.equal((await call({ query: { task: "purge" } })).code, 401, "排程要驗證");
const purge = await call({ query: { task: "purge" }, headers: { authorization: "Bearer apply-cron" } });
assert.equal(purge.data.purged, 1);
assert.equal((await call({ headers: { "x-apply-token": old.token } })).code, 404);
assert.equal((await call({ headers: { "x-apply-token": fresh.token } })).code, 200);

console.log("moushikomi tests passed");
