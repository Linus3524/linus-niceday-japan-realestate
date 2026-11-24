/**
 * 租屋申請資料（/moushikomi）的欄位定義。
 *
 * 前端表單、後端驗證、通知信、後台與「複製成日文申込書」都讀這一份，
 * 身份分支（留學生／打工度假・J-Find／上班族／其他、人在日本或海外）只寫在這裡。
 *
 * 表單值一律是字串（勾選框用 "1"），存成扁平的 Record，方便草稿保存與比對。
 */

import { domesticScreeningDocuments, overseasScreeningDocuments, type ScreeningDocumentProfile } from "../../data/rentStaticSearchData.js";

export type FormValues = Record<string, string>;
export type Requirement = "req" | "opt" | "unk";
/** dob：出生年月日，用三格數字輸入（年／月／日），不用難找年份的日曆選單。
 *  address：地址，可切換日本（郵遞區號帶出都道府縣、市區町村）或海外（一格自由填寫）。 */
export type FieldType = "text" | "tel" | "email" | "date" | "dob" | "chips" | "textarea" | "check" | "address";

export interface Option { id: string; label: string; ja?: string; note?: string }

export interface FieldDef {
  id: string;
  label: string;
  /** 日文申込書上的項目名稱。 */
  ja: string;
  type: FieldType;
  /** req：必填；opt：選填；unk：必填，但可以勾「不知道」。 */
  req: Requirement;
  options?: Option[];
  hint?: string;
  placeholder?: string;
  unkLabel?: string;
  /** 自動轉大寫（護照拼音）。 */
  upper?: boolean;
  /** 選項直排（選項有說明文字時）。 */
  stack?: boolean;
  max?: number;
  /** 地址預設日本或海外；where：跟著申請人「你現在人在哪裡」。 */
  addrDefault?: "jp" | "overseas" | "where";
}

export interface StepDef {
  id: string;
  title: string;
  /** 日文申込書的區塊標題。 */
  ja: string;
  intro?: string;
  /** 這一步不用填時的說明（例如打工度假還沒找到工作）。 */
  skip?: string;
  fields: FieldDef[];
}

export interface DocDef {
  id: string; label: string; required: boolean; hint?: string;
  /** 條列的說明（例如財力證明可以用哪些形式），接在 hint 後面。 */
  points?: string[];
  /** 條列之後的補充一句。 */
  footnote?: string;
}

export const PRIVACY_POLICY_VERSION = "2026-11-21.1";
export const RETENTION_DAYS = 90;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_DOC = 6;
export const MAX_FILES_TOTAL = 40;
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

const TEXT_MAX = 120;
const LONG_MAX = 300;

const GENDER: Option[] = [{ id: "m", label: "男", ja: "男" }, { id: "f", label: "女", ja: "女" }];
const HOUSING: Option[] = [{ id: "rent", label: "租的", ja: "賃貸" }, { id: "own", label: "自己家／住家裡", ja: "持家・家族所有" }];

// 身份與工作狀態的名稱對標官網「依身份準備的文件」（src/data/rentStaticSearchData.ts）。
export const IDENTITY_OPTIONS: Option[] = [
  { id: "worker", label: "工作簽證（上班族）", ja: "就労ビザ（会社員）", note: "尚未入職、入職未滿或滿三個月、轉職中" },
  { id: "student", label: "留學簽證", ja: "留学ビザ", note: "語言學校、專門學校、大學" },
  { id: "wh", label: "打工度假／J-Find 簽證", ja: "ワーキングホリデー／J-Find（未来創造人材）ビザ" },
  { id: "corporate", label: "法人契約（社員入住）", ja: "法人契約（社宅）", note: "由公司名義承租，你是入住的員工" },
  { id: "other", label: "其他簽證", ja: "その他", note: "家族滯在、配偶等，Linus 會再跟你確認文件" },
];
export const WORKER_STATUS_OPTIONS: Option[] = [
  { id: "offer", label: "尚未入職", ja: "入社前（内定）" },
  { id: "under3", label: "入職未滿三個月", ja: "在職3ヶ月未満" },
  { id: "over3", label: "入職三個月以上", ja: "在職3ヶ月以上" },
  { id: "changing", label: "轉職中", ja: "転職中" },
];
/** id 存進紀錄裡：yes／no 是舊版就有的值，不能改。 */
const WH_JOB_OPTIONS: Option[] = [
  { id: "yes", label: "已經在工作", ja: "就業中" },
  { id: "offer", label: "找到工作，還沒入職", ja: "入社予定" },
  { id: "school", label: "在上學（語言學校等）", ja: "在学中" },
  { id: "no", label: "還沒工作也沒上學", ja: "就職先・在学先なし" },
];
const WHERE_OPTIONS: Option[] = [
  { id: "japan", label: "日本境內審查", ja: "日本在住（国内審査）", note: "人已經在日本，有在留卡" },
  { id: "overseas", label: "海外審查", ja: "海外在住（海外審査）", note: "人還在海外，還沒拿到在留卡" },
];
const SCHOOL_TYPE_OPTIONS: Option[] = [
  { id: "lang", label: "語言學校", ja: "日本語学校" }, { id: "vocational", label: "專門學校", ja: "専門学校" }, { id: "univ", label: "大學・研究所", ja: "大学・大学院" },
];
const EMPLOYMENT_OPTIONS: Option[] = [
  { id: "full", label: "正職", ja: "正社員" }, { id: "dispatch", label: "派遣", ja: "派遣社員" },
  { id: "contract", label: "契約", ja: "契約社員" }, { id: "part", label: "打工", ja: "アルバイト" },
];
const JP_RELATION: Option[] = [
  { id: "friend", label: "朋友", ja: "友人" }, { id: "relative", label: "親戚", ja: "親族" },
  { id: "classmate", label: "同學", ja: "同級生" }, { id: "coworker", label: "同事", ja: "同僚" },
];
const GUARANTOR_RELATION: Option[] = [
  { id: "ceo", label: "公司代表人", ja: "代表者" }, { id: "boss", label: "上司", ja: "上司" },
  { id: "family", label: "家人", ja: "家族" }, { id: "other", label: "其他", ja: "その他" },
];
const HOME_RELATION: Option[] = [
  { id: "father", label: "父親", ja: "父" }, { id: "mother", label: "母親", ja: "母" }, { id: "grand", label: "祖父母", ja: "祖父母" },
  { id: "sibling", label: "兄弟姊妹", ja: "兄弟姉妹" }, { id: "relative", label: "其他親戚", ja: "親族" },
];
export const COHAB_OPTIONS: Option[] = [
  { id: "alone", label: "自己住", ja: "単身" }, { id: "spouse", label: "配偶", ja: "配偶者" },
  { id: "family", label: "家人", ja: "家族" }, { id: "partner", label: "男女朋友", ja: "婚約者・恋人" },
  { id: "other", label: "其他", ja: "その他" },
];
export const DOC_TIMING_OPTIONS: Option[] = [
  { id: "now", label: "現在上傳", note: "決定要申請了，先給可以最快送審" },
  { id: "later", label: "先看清單準備，之後再給", note: "還在考慮也沒關係，決定申請時用同一個連結回來上傳" },
];

const v = (values: FormValues, key: string) => (values[key] ?? "").trim();
export const is = {
  student: (x: FormValues) => v(x, "identity") === "student",
  wh: (x: FormValues) => v(x, "identity") === "wh",
  worker: (x: FormValues) => v(x, "identity") === "worker",
  other: (x: FormValues) => v(x, "identity") === "other",
  whNoJob: (x: FormValues) => v(x, "identity") === "wh" && v(x, "whJob") === "no",
  whJob: (x: FormValues) => v(x, "identity") === "wh" && ["yes", "offer"].includes(v(x, "whJob")),
  whSchool: (x: FormValues) => v(x, "identity") === "wh" && v(x, "whJob") === "school",
  /** 填學校表單：留學生，或打工度假在上學。 */
  school: (x: FormValues) => v(x, "identity") === "student" || (v(x, "identity") === "wh" && v(x, "whJob") === "school"),
  corporate: (x: FormValues) => v(x, "identity") === "corporate",
  overseas: (x: FormValues) => v(x, "where") === "overseas",
  /** 海外審查的工作簽證都還沒入職，不用再問工作狀態。 */
  offer: (x: FormValues) => (v(x, "identity") === "worker" && (v(x, "where") === "overseas" || v(x, "workerStatus") === "offer"))
    || (v(x, "identity") === "wh" && v(x, "whJob") === "offer"),
  changing: (x: FormValues) => v(x, "identity") === "worker" && v(x, "where") !== "overseas" && v(x, "workerStatus") === "changing",
  company: (x: FormValues) => ["worker", "corporate"].includes(v(x, "identity")) || (v(x, "identity") === "wh" && ["yes", "offer"].includes(v(x, "whJob"))),
  living: (x: FormValues) => Boolean(v(x, "cohab")) && v(x, "cohab") !== "alone",
  /** 收入欄改問「家人每月寄來的生活費」。 */
  allowance: (x: FormValues) => v(x, "identity") === "student" || (v(x, "identity") === "wh" && ["no", "school"].includes(v(x, "whJob"))),
};

// ── 地址 ──────────────────────────────────────────────────
/** 地址拆成幾個欄位存：{id}Region、{id}Zip、{id}Pref、{id}City、{id}Town、{id}Bldg、{id}Overseas。 */
export const ADDR_PARTS = ["Region", "Zip", "Pref", "City", "Town", "Bldg", "Overseas"] as const;
const JP_PARTS = ["Zip", "Pref", "City", "Town", "Bldg"] as const;

export function addrRegion(f: FieldDef, x: FormValues): "jp" | "overseas" {
  const set = x[`${f.id}Region`];
  if (set === "jp" || set === "overseas") return set;
  if (f.addrDefault === "overseas") return "overseas";
  if (f.addrDefault === "where") return is.overseas(x) ? "overseas" : "jp";
  return "jp";
}

const part = (f: FieldDef, x: FormValues, key: string) => (x[`${f.id}${key}`] ?? "").trim();

/** 必填的部分都有了嗎（日本：都道府縣＋市區町村＋町名番地＋建物名房號；海外：一整行）。 */
export function addrComplete(f: FieldDef, x: FormValues) {
  return addrRegion(f, x) === "overseas"
    ? Boolean(part(f, x, "Overseas"))
    : Boolean(part(f, x, "Pref") && part(f, x, "City") && part(f, x, "Town") && part(f, x, "Bldg"));
}
function addrAny(f: FieldDef, x: FormValues) {
  return addrRegion(f, x) === "overseas" ? Boolean(part(f, x, "Overseas")) : JP_PARTS.some(key => part(f, x, key));
}

export function formatZip(zip: string) {
  const digits = zip.replace(/\D/g, "");
  return digits.length === 7 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
}

export function formatAddress(f: FieldDef, x: FormValues) {
  if (addrRegion(f, x) === "overseas") return part(f, x, "Overseas");
  const zip = part(f, x, "Zip");
  const line = `${part(f, x, "Pref")}${part(f, x, "City")}${part(f, x, "Town")}`;
  const bldg = part(f, x, "Bldg");
  return [zip ? `〒${formatZip(zip)}` : "", line, bldg].filter(Boolean).join(" ");
}

// ── 出生年月日 ─────────────────────────────────────────────
/** "1995-6-1" → "1995-06-01"；不是真的日期回傳 null。 */
export function normalizeDob(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  if (y < 1900 || date.getTime() > Date.now()) return null;
  return `${m[1]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
const dobEmpty = (raw: string) => !raw.replace(/-/g, "").trim();

/** 這一格算不算沒填（地址、生日有自己的判斷）。 */
export function isBlank(f: FieldDef, x: FormValues) {
  if (f.type === "address") return !addrAny(f, x);
  if (f.type === "dob") return dobEmpty(x[f.id] ?? "");
  return !(x[f.id] ?? "").trim();
}

/** kanaHelp：片假名可以勾「不會寫，請 Linus 幫我寫」（申請人、同居人、母國聯絡人）；在日聯絡人與連帶保證人必須自己填。 */
function person(prefix: string, o: { noKanji?: boolean; relation?: Option[]; emailOpt?: boolean; phoneHint?: string; jaRole: string; addrDefault?: FieldDef["addrDefault"]; nationality?: boolean; kanaHelp?: boolean }): FieldDef[] {
  const f: (FieldDef | null)[] = [
    { id: `${prefix}NameEn`, label: "姓名（護照英文拼音，大寫）", ja: `${o.jaRole}氏名（ローマ字）`, type: "text", req: "req", upper: true, placeholder: "WANG XIAOMING" },
    o.noKanji ? null : { id: `${prefix}NameKanji`, label: "姓名（漢字）", ja: `${o.jaRole}氏名（漢字）`, type: "text", req: "req", placeholder: "王小明" },
    { id: `${prefix}Kana`, label: "姓名（日文片假名）", ja: `${o.jaRole}フリガナ`, type: "text", req: o.kanaHelp ? "unk" : "req", unkLabel: o.kanaHelp ? "不會寫，請 Linus 幫我寫" : undefined, placeholder: "オウ ショウメイ",
      // 只有申請人本人需要：之後開銀行、郵局帳戶的戶名片假名要跟租約一致。
      hint: prefix === "" ? "之後開銀行、郵局帳戶時，戶名片假名要跟這裡一致。" : undefined },
    { id: `${prefix}Birthday`, label: "出生年月日", ja: `${o.jaRole}生年月日`, type: "dob", req: "req" },
    { id: `${prefix}Gender`, label: "性別", ja: `${o.jaRole}性別`, type: "chips", req: "req", options: GENDER },
    o.nationality ? { id: `${prefix}Nationality`, label: "國籍", ja: `${o.jaRole}国籍`, type: "text", req: "req", placeholder: "例：台灣、日本" } : null,
    o.relation ? { id: `${prefix}Relation`, label: "跟你的關係", ja: `${o.jaRole}続柄`, type: "chips", req: "req", options: o.relation } : null,
    { id: `${prefix}Phone`, label: "手機號碼", ja: `${o.jaRole}携帯電話`, type: "tel", req: "req", hint: o.phoneHint || "含國碼，例如 +81 90-1234-5678 或 +886 912-345-678" },
    { id: `${prefix}Email`, label: "Email", ja: `${o.jaRole}メール`, type: "email", req: o.emailOpt ? "opt" : "req" },
    { id: `${prefix}Address`, label: "現在住的地址", ja: `${o.jaRole}現住所`, type: "address", req: "req", addrDefault: o.addrDefault ?? "jp" },
  ];
  return f.filter((x): x is FieldDef => Boolean(x));
}

/** 依目前填的內容列出每一步（已經過濾掉不適用的欄位）。 */
export function stepsFor(x: FormValues): StepDef[] {
  const identity: FieldDef[] = [
    { id: "where", label: "審查地點", ja: "審査区分", type: "chips", req: "req", stack: true, options: WHERE_OPTIONS },
    { id: "identity", label: "你的身份", ja: "身分", type: "chips", req: "req", stack: true, options: IDENTITY_OPTIONS },
    ...(is.worker(x) && !is.overseas(x) ? [{ id: "workerStatus", label: "工作狀態", ja: "就業状況", type: "chips", req: "req", stack: true, options: WORKER_STATUS_OPTIONS } as FieldDef] : []),
    ...(is.wh(x) ? [{ id: "whJob", label: "現在在日本是工作還是上學？", ja: "就業・就学状況", type: "chips", req: "req", options: WH_JOB_OPTIONS } as FieldDef] : []),
    { id: "property", label: "要申請的房子", ja: "申込物件", type: "text", req: "opt", placeholder: "物件名稱或網址", hint: "還沒決定可以先空著，Linus 之後幫你補。", max: LONG_MAX },
    ...(is.allowance(x) ? [{ id: "rent", label: "這間房子的月租＋管理費（円）", ja: "賃料＋管理費", type: "text", req: "opt", placeholder: "例：85000", hint: "填了會幫你算財力證明要準備多少（15 個月份）。", max: 12 } as FieldDef] : []),
  ];

  const applicant: FieldDef[] = person("", { jaRole: "", addrDefault: "where", kanaHelp: true });
  applicant.splice(5, 0, { id: "nationality", label: "國籍", ja: "国籍", type: "text", req: "req" });
  applicant.push(
    { id: "housing", label: "現在住的地方", ja: "現住居", type: "chips", req: "req", options: HOUSING },
    ...(v(x, "housing") === "rent" ? [{ id: "currentRent", label: "現在的月租（含管理費）", ja: "現住居の家賃", type: "text", req: "req", placeholder: "例：75,000 円" } as FieldDef] : []),
    { id: "yearsAtAddress", label: "在現在的地址住了幾年", ja: "現住所居住年数", type: "text", req: "req", placeholder: "例：1 年 3 個月" },
    ...(!is.overseas(x) ? [{ id: "yearsInJapan", label: "來日本幾年了", ja: "来日年数", type: "text", req: "req", placeholder: "例：2 年" } as FieldDef] : []),
    is.allowance(x)
      ? { id: "income", label: "家人每月從海外寄來的生活費", ja: "仕送り（月額）", type: "text", req: "req", placeholder: "例：每月 15 萬円（或台幣 3 萬）", hint: "學生或還沒有工作，填家人每月寄多少給你就可以。" }
      : { id: "income", label: is.offer(x) || is.changing(x) ? "新公司預定月薪（稅前）" : "每月收入（稅前）", ja: "月収（税込）", type: "text", req: "req", placeholder: "例：28 萬円" },
  );

  let orgTitle = "工作或學校";
  let orgFields: FieldDef[];
  if (is.school(x)) {
    orgTitle = "學校資訊";
    orgFields = [
      { id: "schoolType", label: "學校類型", ja: "学校種別", type: "chips", req: "req", options: SCHOOL_TYPE_OPTIONS },
      { id: "orgName", label: "學校名稱", ja: "学校名", type: "text", req: "req" },
      { id: "orgAddress", label: "學校地址", ja: "学校所在地", type: "address", req: "unk" },
      { id: "orgPhone", label: "學校電話", ja: "学校電話番号", type: "tel", req: "unk" },
    ];
  } else if (is.company(x)) {
    orgTitle = is.changing(x) ? "新公司資訊" : is.corporate(x) ? "公司資訊（承租的公司）" : "公司資訊";
    orgFields = [
      { id: "orgName", label: "公司名稱", ja: "勤務先名", type: "text", req: "req" },
      { id: "orgAddress", label: "公司地址", ja: "勤務先所在地", type: "address", req: "unk" },
      { id: "orgPhone", label: "公司電話", ja: "勤務先電話番号", type: "tel", req: "unk" },
      { id: "capital", label: "公司資本額", ja: "資本金", type: "text", req: "unk", placeholder: "例：1,000 萬円", hint: "公司官網的「会社概要」通常有寫。" },
      { id: "industry", label: "公司業種", ja: "業種", type: "text", req: "unk", placeholder: "例：IT、餐飲、貿易" },
      { id: "employment", label: "雇用形態", ja: "雇用形態", type: "chips", req: "req", options: EMPLOYMENT_OPTIONS },
      { id: "dept", label: "所屬部門", ja: "所属部署", type: "text", req: "opt" },
      { id: "jobDesc", label: "職務內容", ja: "職種・職務内容", type: "text", req: "req", placeholder: "例：軟體工程師、門市店員" },
      is.offer(x) || is.changing(x)
        ? { id: "startDate", label: "預計入職日", ja: "入社予定日", type: "date", req: "unk" }
        : { id: "jobYears", label: "在這間公司做了多久", ja: "勤続年数", type: "text", req: "req", placeholder: "例：1 年 2 個月" },
    ];
  } else {
    orgFields = [
      { id: "orgName", label: "公司或學校名稱", ja: "勤務先・学校名", type: "text", req: "opt" },
      { id: "orgAddress", label: "公司或學校地址", ja: "勤務先・学校所在地", type: "address", req: "opt" },
      { id: "orgPhone", label: "公司或學校電話", ja: "勤務先・学校電話番号", type: "tel", req: "opt" },
    ];
  }

  const jpNone = v(x, "jpNone") === "1";
  const jpContact: FieldDef[] = [
    { id: "jpNone", label: "我在日本沒有可以填的人", ja: "日本の緊急連絡先なし", type: "check", req: "opt", hint: "勾了也可以送出，Linus 會再跟你討論可以用的方案。" },
    ...(jpNone ? [] : [
      ...person("jp", { jaRole: "", relation: JP_RELATION, nationality: true }),
      { id: "jpOrgName", label: "公司或學校名稱", ja: "勤務先・学校名", type: "text", req: "opt" } as FieldDef,
      { id: "jpOrgAddress", label: "公司或學校地址", ja: "勤務先・学校所在地", type: "address", req: "opt" } as FieldDef,
      { id: "jpOrgPhone", label: "公司或學校電話", ja: "勤務先・学校電話番号", type: "tel", req: "opt" } as FieldDef,
    ]),
  ];

  const cohab: FieldDef[] = [
    { id: "cohab", label: "會跟誰一起住？", ja: "入居者", type: "chips", req: "req", options: COHAB_OPTIONS },
    ...(is.living(x) ? [
      ...person("co", { jaRole: "", emailOpt: true, nationality: true, kanaHelp: true }),
      { id: "coHousing", label: "同居人現在的住處", ja: "現住居", type: "chips", req: "req", options: HOUSING } as FieldDef,
      ...(v(x, "coHousing") === "rent" ? [{ id: "coRent", label: "同居人現在的月租", ja: "現住居の家賃", type: "text", req: "req" } as FieldDef] : []),
      { id: "coYearsAt", label: "在現在的地址住了幾年", ja: "現住所居住年数", type: "text", req: "req" } as FieldDef,
      { id: "coYearsJp", label: "來日本幾年了", ja: "来日年数", type: "text", req: "opt" } as FieldDef,
      { id: "coCompany", label: "任職公司名稱", ja: "勤務先名", type: "text", req: "opt" } as FieldDef,
      { id: "coCompanyAddress", label: "公司地址", ja: "勤務先所在地", type: "address", req: "opt" } as FieldDef,
      { id: "coCompanyPhone", label: "公司電話", ja: "勤務先電話番号", type: "tel", req: "opt" } as FieldDef,
      { id: "coIncome", label: "每月收入", ja: "月収", type: "text", req: "opt" } as FieldDef,
    ] : []),
  ];

  // 法人契約：連帶保證人，欄位跟申請人資料一樣（另加跟申請人的關係）。
  const guarantor: FieldDef[] = [
    ...person("gu", { jaRole: "", nationality: true, relation: GUARANTOR_RELATION }),
    { id: "guHousing", label: "現在住的地方", ja: "現住居", type: "chips", req: "req", options: HOUSING },
    ...(v(x, "guHousing") === "rent" ? [{ id: "guRent", label: "現在的月租（含管理費）", ja: "現住居の家賃", type: "text", req: "req", placeholder: "例：75,000 円" } as FieldDef] : []),
    { id: "guYearsAt", label: "在現在的地址住了幾年", ja: "現住所居住年数", type: "text", req: "req", placeholder: "例：5 年" },
    { id: "guYearsJp", label: "在日本住了幾年", ja: "来日年数", type: "text", req: "opt", placeholder: "例：10 年", hint: "日本籍可以不填。" },
    { id: "guIncome", label: "每月收入（稅前）", ja: "月収（税込）", type: "text", req: "req", placeholder: "例：50 萬円" },
  ];

  return [
    { id: "identity", title: "你的身份", ja: "申込区分", intro: "先選審查地點和身份，後面只會出現你需要填的欄位和文件。", fields: identity },
    { id: "applicant", title: "申請人資料", ja: "申込者", intro: "請照護照上的拼法填寫，送給管理公司的資料不能有錯字。", fields: applicant },
    {
      id: "org", title: orgTitle, ja: is.school(x) ? "学校" : "勤務先", fields: is.whNoJob(x) ? [] : orgFields,
      intro: is.other(x) ? "有在工作或上學的話再填，沒有可以直接下一步。" : is.changing(x) ? "請填要去的新公司。" : undefined,
      skip: is.whNoJob(x) ? "打工度假／J-Find 還沒工作也沒上學，這一步不用填，直接下一步。" : undefined,
    },
    ...(is.corporate(x) ? [{ id: "guarantor", title: "連帶保證人", ja: "連帯保証人", intro: "法人契約需要一位連帶保證人，請照對方的護照或在留卡填寫。", fields: guarantor } as StepDef] : []),
    { id: "jp", title: "在日緊急聯絡人", ja: "緊急連絡先（日本）", intro: "有日本朋友優先填日本人；沒有的話，填在日本的親戚、朋友或同學也可以。", fields: jpContact },
    { id: "home", title: "母國緊急聯絡人", ja: "緊急連絡先（母国）", intro: "以父母為主，其次是祖父母、兄弟姊妹。", fields: person("home", { jaRole: "", noKanji: true, relation: HOME_RELATION, phoneHint: "含國碼，例如 +886 912-345-678", addrDefault: "overseas", nationality: true, kanaHelp: true }) },
    { id: "cohab", title: "同居人", ja: "同居人", intro: "一個人住選「自己住」就好。", fields: cohab },
  ];
}

// ── 文件清單 ───────────────────────────────────────────────
// 直接讀官網「依身份準備的文件」的資料（rentStaticSearchData.ts），官網改了這裡跟著改。
// 標記 *n 對應該身份的 ※n 補充說明；（非必備）、（視個案）算選交。

/** 文件名稱 → 固定的英文代號（上傳時存在檔名與紀錄裡，不能隨便改）。 */
export const DOC_IDS: Record<string, string> = {
  "護照照片頁": "passport",
  "在留卡正反面": "zairyu",
  "在留資格認定書（COE）": "coe",
  "日本簽證貼紙": "visaSticker",
  "僱傭條件通知書或內定書": "offer",
  "僱傭條件通知書或契約書": "terms",
  "新公司僱傭條件通知書或內定書": "newOffer",
  "銀行財力或餘額證明": "bank",
  "家人海外送金證明": "remit",
  "入學通知書": "admission",
  "學生證": "studentId",
  "日本保險證正反面": "insurance",
  "已有的薪資明細": "pay",
  "現有公司源泉票": "gensen",
  "三個月薪資明細": "pay3",
  "舊公司三個月薪資明細": "oldPay",
  "公司登記簿謄本（履歴事項全部証明書）": "corpRegistry",
  "公司決算書影本": "corpFinancials",
  "公司印鑑證明書": "corpSeal",
  "代表者印鑑證明書": "repSeal",
  "入住者在留卡與護照": "residentId",
  "社員證或在職證明書": "employeeId",
  "公司簡介或官網資料": "corpProfile",
};
/** 表單自己加的文件（官網表格沒有）。 */
const EXTRA_DOCS = { visaDoc: "簽證相關文件", incomeDoc: "收入或財力證明", coId: "同居人的在留卡或護照照片頁", coIncomeDoc: "同居人的收入證明" };
export const ALL_DOC_IDS = new Set([...Object.values(DOC_IDS), ...Object.keys(EXTRA_DOCS)]);

/** 依審查地點與身份，找出官網表格的那一欄。 */
export function screeningProfileFor(x: FormValues): ScreeningDocumentProfile | null {
  const overseas = is.overseas(x);
  const list = overseas ? overseasScreeningDocuments : domesticScreeningDocuments;
  const find = (name: string) => list.find(p => p.profile === name) ?? domesticScreeningDocuments.find(p => p.profile === name) ?? null;
  if (is.corporate(x)) return find("法人契約（社員入住）");
  if (is.student(x)) return find("留學簽證");
  if (is.wh(x)) return find("打工度假／J-Find 簽證");
  if (is.worker(x)) {
    if (overseas) return find("工作簽證");
    const status = v(x, "workerStatus");
    return find(status === "offer" ? "尚未入職" : status === "under3" ? "入職未滿三個月" : status === "over3" ? "入職三個月以上" : status === "changing" ? "轉職中" : "");
  }
  return null;
}

/** 必交的財力證明：金額一句，可接受的形式條列，最後說明可以用誰的。 */
function bankDetail(x: FormValues): Pick<DocDef, "hint" | "points" | "footnote"> {
  const rent = parseInt(v(x, "rent").replace(/[^\d]/g, ""), 10);
  const amount = rent > 0
    ? `以月租 ${rent.toLocaleString()} 円計算，約需 ${Math.round((rent * 15) / 10000)} 萬円（15 個月份）。`
    : "建議餘額約為「月租＋管理費」的 15 個月份。";
  return {
    hint: `${amount}可以用以下任一種：`,
    points: ["網銀截圖＋存摺封面（需顯示戶名跟帳號）", "銀行正式申請的餘額證明", "活期帳戶月結單"],
    footnote: is.student(x) ? "留學生可以用自己或父母的。" : "需要是申請人本人的。",
  };
}

export function docsFor(x: FormValues): DocDef[] {
  const d: DocDef[] = [];
  const profile = screeningProfileFor(x);
  if (profile) {
    for (const raw of profile.documents) {
      const noteNo = raw.match(/\*(\d+)$/)?.[1];
      let label = raw.replace(/\*\d+$/, "");
      let required = true;
      let caseByCase = false;
      if (label.includes("（非必備）")) { required = false; label = label.replace("（非必備）", ""); }
      if (label.includes("（視個案）")) { required = false; caseByCase = true; label = label.replace("（視個案）", ""); }
      const id = DOC_IDS[label];
      if (!id) continue;
      const note = noteNo ? profile.notes?.find(n => n.startsWith(`※${noteNo}`))?.replace(/^※\d+\s*[^：]*：/, "") : undefined;
      if (id === "bank" && required) { d.push({ id, label, required, ...bankDetail(x) }); continue; }
      const hint = caseByCase ? `視個案，Linus 會再跟你確認要不要。${note ?? ""}` : note;
      d.push({ id, label, required, hint });
    }
  } else {
    // 其他簽證：官網沒有這一欄，只列基本身分文件，其他由 Linus 個別確認。
    d.push(is.overseas(x) ? { id: "passport", label: "護照照片頁", required: true } : { id: "zairyu", label: "在留卡正反面", required: true });
    if (!is.overseas(x)) d.push({ id: "passport", label: "護照照片頁", required: true });
    d.push({ id: "visaDoc", label: EXTRA_DOCS.visaDoc, required: false }, { id: "incomeDoc", label: EXTRA_DOCS.incomeDoc, required: false });
  }
  if (is.living(x)) d.push({ id: "coId", label: EXTRA_DOCS.coId, required: true }, { id: "coIncomeDoc", label: EXTRA_DOCS.coIncomeDoc, required: false });
  return d;
}

/** 決定文件清單所需的欄位：之後回來補傳時，只把這幾個欄位給前端（不回傳個資）。 */
export const DOC_KEYS = ["identity", "workerStatus", "whJob", "where", "cohab", "rent"] as const;

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);

/** 驗證一個步驟；回傳錯誤訊息（key 為欄位 id）。 */
export function validateStep(step: StepDef, values: FormValues, unknown: Record<string, boolean>): FieldErrors {
  const errors: FieldErrors = {};
  if (step.skip) return errors;
  for (const f of step.fields) {
    if (f.type === "check") continue;
    const value = (values[f.id] ?? "").trim();
    const need = f.req === "req" || (f.req === "unk" && !unknown[f.id]);
    if (isBlank(f, values)) {
      if (need) errors[f.id] = f.type === "chips" ? "請選一個" : f.req === "unk" ? `請填寫，不知道可以勾「${f.unkLabel || "不知道"}」` : f.type === "address" ? (addrRegion(f, values) === "jp" ? "請填郵遞區號帶出地址，再補上番地" : "請填寫地址") : "請填寫這一格";
      continue;
    }
    if (f.type === "address") {
      const zip = (values[`${f.id}Zip`] ?? "").replace(/\D/g, "");
      if (addrRegion(f, values) === "jp" && zip && zip.length !== 7) errors[f.id] = "郵遞區號是 7 位數字";
      else if (!addrComplete(f, values)) errors[f.id] = addrRegion(f, values) === "jp" ? "請把都道府縣、市區町村、町名番地、建物名房號填完整" : "請填寫地址";
      continue;
    }
    if (f.type === "dob") { if (!normalizeDob(value)) errors[f.id] = "請填完整的出生年月日（例：1995 年 6 月 1 日）"; continue; }
    if (f.type === "chips" && !f.options?.some(o => o.id === value)) errors[f.id] = "請選一個";
    else if (f.type === "email" && !EMAIL.test(value)) errors[f.id] = "Email 格式看起來不對";
    else if (f.type === "date" && (!DATE.test(value) || Number.isNaN(Date.parse(value)))) errors[f.id] = "日期格式不正確";
  }
  return errors;
}

export interface CleanForm { values: FormValues; unknown: Record<string, boolean> }

/** 只留下目前身份會出現的欄位，並整理長度；切換身份後殘留的舊值會被丟掉。 */
export function cleanForm(rawValues: unknown, rawUnknown: unknown): CleanForm {
  const input = rawValues && typeof rawValues === "object" ? (rawValues as Record<string, unknown>) : {};
  const unk = rawUnknown && typeof rawUnknown === "object" ? (rawUnknown as Record<string, unknown>) : {};
  // 欄位清單依值而定（身份決定後面的欄位）：重複整理到結果不再變為止（最多幾輪就穩定）。
  let values: FormValues = Object.fromEntries(
    Object.entries(input).map(([k, val]) => [k, typeof val === "string" ? val : val === true ? "1" : ""]),
  );
  for (let pass = 0; pass < 4; pass++) {
    const next: FormValues = {};
    for (const step of stepsFor(values)) {
      for (const f of step.fields) {
        if (f.type === "address") {
          const region = addrRegion(f, values);
          next[`${f.id}Region`] = region;
          if (region === "overseas") {
            const text = clean(values[`${f.id}Overseas`], LONG_MAX);
            if (text) next[`${f.id}Overseas`] = text;
          } else {
            const zip = clean(values[`${f.id}Zip`], 10).replace(/\D/g, "").slice(0, 7);
            if (zip) next[`${f.id}Zip`] = zip;
            for (const key of ["Pref", "City", "Town", "Bldg"] as const) {
              const text = clean(values[`${f.id}${key}`], TEXT_MAX);
              if (text) next[`${f.id}${key}`] = text;
            }
          }
          continue;
        }
        const text = clean(values[f.id], f.max ?? (f.type === "textarea" ? LONG_MAX : TEXT_MAX));
        if (!text) continue;
        if (f.type === "dob") { if (!dobEmpty(text)) next[f.id] = normalizeDob(text) ?? text; continue; }
        if (f.type === "check") { if (text === "1" || text === "true") next[f.id] = "1"; continue; }
        if (f.type === "chips" && !f.options?.some(o => o.id === text)) continue;
        next[f.id] = f.upper ? text.toUpperCase() : text;
      }
    }
    const timing = clean(values.docTiming, 10);
    if (timing === "now" || timing === "later") next.docTiming = timing;
    const stable = JSON.stringify(next) === JSON.stringify(values);
    values = next;
    if (stable) break;
  }
  const unknown: Record<string, boolean> = {};
  for (const step of stepsFor(values)) for (const f of step.fields) if (f.req === "unk" && unk[f.id] === true && isBlank(f, values)) unknown[f.id] = true;
  return { values, unknown };
}

/** 整份表單驗證（送出時）。 */
export function validateForm(form: CleanForm): FieldErrors {
  let errors: FieldErrors = {};
  for (const step of stepsFor(form.values)) errors = { ...errors, ...validateStep(step, form.values, form.unknown) };
  if (!form.values.docTiming) errors.docTiming = "請選一個";
  return errors;
}

export function optionLabel(f: FieldDef, value: string, lang: "zh" | "ja" = "zh") {
  const o = f.options?.find(item => item.id === value);
  return o ? (lang === "ja" ? o.ja || o.label : o.label) : value;
}

export function displayValue(f: FieldDef, form: CleanForm, lang: "zh" | "ja" = "zh"): string {
  if (f.req === "unk" && form.unknown[f.id]) return lang === "ja" ? "（確認中）" : `待確認（${f.unkLabel || "不知道"}）`;
  if (f.type === "address") {
    if (isBlank(f, form.values)) return lang === "ja" ? "" : "—";
    const text = formatAddress(f, form.values);
    return addrRegion(f, form.values) === "overseas" && lang === "ja" ? `（海外）${text}` : text;
  }
  const value = form.values[f.id] ?? "";
  if (!value) return lang === "ja" ? "" : "—";
  if (f.type === "dob" && lang === "zh") return normalizeDob(value) ?? value;
  if (f.type === "dob" && lang === "ja") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
  }
  if (f.type === "check") return lang === "ja" ? "該当" : "是";
  if (f.type === "chips") return optionLabel(f, value, lang);
  return value;
}

/** 摘要：身份一行字，用在通知信主旨與後台列表。 */
export function identitySummary(values: FormValues): string {
  const parts = [IDENTITY_OPTIONS.find(o => o.id === values.identity)?.label ?? "未選身份"];
  if (is.worker(values)) parts.push(WORKER_STATUS_OPTIONS.find(o => o.id === values.workerStatus)?.label ?? "");
  if (is.wh(values)) parts.push(WH_JOB_OPTIONS.find(o => o.id === values.whJob)?.label ?? "");
  if (values.where) parts.push(values.where === "overseas" ? "人在海外" : "在日本");
  return parts.filter(Boolean).join("・");
}

/** 複製成日文申込書格式（給管理公司、保證公司）。 */
export function toJapaneseSheet(form: CleanForm, refCode: string): string {
  const lines: string[] = [`入居申込情報（${refCode}）`];
  for (const step of stepsFor(form.values)) {
    if (step.id === "identity") {
      lines.push("", "■ 申込区分");
      lines.push(`身分：${identitySummaryJa(form.values)}`);
      if (form.values.property) lines.push(`申込物件：${form.values.property}`);
      continue;
    }
    if (step.skip) continue;
    const rows = step.fields.filter(f => f.type !== "check" || form.values[f.id]).map(f => `${f.ja}：${displayValue(f, form, "ja")}`);
    if (step.id === "cohab" && !is.living(form.values)) { lines.push("", "■ 同居人", "なし（単身入居）"); continue; }
    if (step.id === "jp" && form.values.jpNone) { lines.push("", `■ ${step.ja}`, "なし（要相談）"); continue; }
    lines.push("", `■ ${step.ja}`, ...rows);
  }
  return lines.join("\n");
}

function identitySummaryJa(values: FormValues) {
  const parts = [IDENTITY_OPTIONS.find(o => o.id === values.identity)?.ja ?? ""];
  if (is.worker(values)) parts.push(WORKER_STATUS_OPTIONS.find(o => o.id === values.workerStatus)?.ja ?? "");
  if (is.wh(values)) parts.push(WH_JOB_OPTIONS.find(o => o.id === values.whJob)?.ja ?? "");
  parts.push(WHERE_OPTIONS.find(o => o.id === values.where)?.ja ?? "");
  return parts.filter(Boolean).join("／");
}
