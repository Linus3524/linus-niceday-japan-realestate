import { VISA_TYPES, VISA_TYPES_WITHOUT_PROCESS } from "../visaOptions.js";

/**
 * 找房需求問卷（/find-home）的欄位定義與驗證。
 *
 * 前端表單與後端 API 共用這一份：選項、必填規則、互斥規則只寫一次，
 * 前端擋下的錯誤後端也一定擋得下（後端是唯一的安全邊界，前端只是為了體驗）。
 *
 * 個資原則（使用者定案，見 docs/LEADS_ADMIN.md）：
 *   - 只收稱呼（綽號可）＋一種聯絡方式＋找房需求；不收真名、電話、證件、收入。
 *   - 聯絡方式只保留到「已聯絡上」或送出後 30 天，之後刪除；稱呼與需求保留。
 */

export type Option<T extends string = string> = { id: T; label: string };

export const MOVE_IN_OPTIONS = [
  { id: "1m", label: "1 個月內" },
  { id: "2m", label: "2 個月內" },
  { id: "3m", label: "3 個月內" },
  { id: "flexible", label: "不急" },
  { id: "date", label: "指定日期" },
] as const satisfies readonly Option[];

export const REASON_OPTIONS = [
  { id: "lease-end", label: "租約到期" },
  { id: "commute", label: "通勤通學" },
  { id: "moving-to-japan", label: "赴日" },
  { id: "living-together", label: "同居" },
  { id: "upgrade", label: "想住更好" },
  { id: "just-looking", label: "先看看" },
  { id: "other", label: "其他" },
] as const satisfies readonly Option[];

export const RESIDENCE_OPTIONS = [
  { id: "japan", label: "日本" },
  { id: "overseas", label: "海外" },
] as const satisfies readonly Option[];

/**
 * 簽證種類（在留資格）：和費用試算共用 src/lib/visaOptions.ts 的清單（代號一致，之後可直接帶進費用試算），
 * 問卷另外多「其他（自填）」。
 */
export const VISA_TYPE_OPTIONS = [
  ...VISA_TYPES.map(({ value, shortLabel }) => ({ id: value, label: shortLabel })),
  { id: "other", label: "其他" },
] as const satisfies readonly Option[];

export const GENDER_OPTIONS = [
  { id: "male", label: "男性" },
  { id: "female", label: "女性" },
  { id: "no-answer", label: "其他／不想回答" },
] as const satisfies readonly Option[];

export const AGE_RANGE_OPTIONS = [
  { id: "under-20", label: "未滿 20 歲" },
  { id: "20s", label: "20–29 歲" },
  { id: "30s", label: "30–39 歲" },
  { id: "40s", label: "40–49 歲" },
  { id: "50s", label: "50–59 歲" },
  { id: "60plus", label: "60 歲以上" },
] as const satisfies readonly Option[];

/** 不需要再問簽證辦理進度的身分。 */
export const NO_VISA_PROCESS: readonly string[] = VISA_TYPES_WITHOUT_PROCESS;

/** 簽證辦理進度（海外、且需要辦簽證時才問）。 */
export const VISA_OPTIONS = [
  { id: "issued", label: "已核發" },
  { id: "applying", label: "申請中" },
  { id: "not-yet", label: "還沒申請" },
  { id: "unsure", label: "不確定" },
] as const satisfies readonly Option[];

export const LAYOUT_OPTIONS = [
  { id: "1R", label: "1R" },
  { id: "1K", label: "1K" },
  { id: "1DK", label: "1DK" },
  { id: "1LDK", label: "1LDK" },
  { id: "2K+", label: "2K／2DK" },
  { id: "2LDK+", label: "2LDK 以上" },
] as const satisfies readonly Option[];

/** 想要的條件：和費用試算的設備項目一致（中文），另加室內洗衣機、朝南。 */
export const MUST_HAVE_OPTIONS = [
  { id: "second-floor", label: "2 樓以上" },
  { id: "pets", label: "可養寵物" },
  { id: "washbasin", label: "獨立洗面台" },
  { id: "bidet", label: "免治馬桶" },
  { id: "autolock", label: "一樓門禁自動門" },
  { id: "elevator", label: "電梯" },
  { id: "separate-bath", label: "乾濕分離" },
  { id: "furnished", label: "家具家電" },
  { id: "no-key-money", label: "免禮金" },
  { id: "no-deposit", label: "免押金" },
  { id: "free-internet", label: "免費網路" },
  { id: "balcony", label: "附陽台" },
  { id: "two-burner", label: "爐具 2 口以上" },
  { id: "city-gas", label: "都市瓦斯" },
  { id: "indoor-washer", label: "室內洗衣機" },
  { id: "south-facing", label: "朝南" },
] as const satisfies readonly Option[];

/** 舊版問卷用過、現在改由下拉選單處理的條件：只用於顯示舊資料，不再出現在問卷上。 */
export const LEGACY_MUST_HAVE_OPTIONS = [
  { id: "near-station", label: "車站 10 分內" },
  { id: "newer-building", label: "屋齡 20 年內" },
] as const satisfies readonly Option[];
export const MUST_HAVE_LABEL_OPTIONS: readonly Option[] = [...MUST_HAVE_OPTIONS, ...LEGACY_MUST_HAVE_OPTIONS];

/** 徒步到車站（分鐘上限，0 = 不限）。 */
export const WALK_OPTIONS = [
  { id: "0", label: "不限" },
  { id: "5", label: "5 分內" },
  { id: "10", label: "10 分內" },
  { id: "15", label: "15 分內" },
  { id: "20", label: "20 分內" },
] as const satisfies readonly Option[];

/** 屋齡上限（年，0 = 不限），與費用試算相同的級距。 */
export const AGE_OPTIONS = [
  { id: "0", label: "不限" },
  ...[3, 5, 7, 10, 15, 20, 25, 30, 40, 50].map(year => ({ id: String(year), label: `${year} 年內` })),
] as readonly Option[];

/** 建築結構：問「最低接受到哪一種」。 */
export const STRUCTURE_OPTIONS = [
  { id: "any", label: "不限" },
  { id: "non-wood", label: "非木造（鐵骨造以上）" },
  { id: "rc", label: "鋼筋混凝土以上（RC・SRC 造）" },
] as const satisfies readonly Option[];

export const ADJUSTABLE_OPTIONS = [
  { id: "budget", label: "提高預算" },
  { id: "area", label: "擴大地區" },
  { id: "age", label: "屋齡較舊" },
  { id: "walk", label: "走路遠一點" },
  { id: "size", label: "小一點" },
  { id: "equipment", label: "放寬設備" },
  { id: "keep", label: "維持原條件" },
] as const satisfies readonly Option[];

export const ON_MATCH_OPTIONS = [
  { id: "apply-asap", label: "想儘快申請" },
  { id: "view-first", label: "希望先看房（內見）" },
  { id: "compare", label: "想多比較幾間" },
  { id: "market-only", label: "先了解行情就好" },
] as const satisfies readonly Option[];

export const IF_NOT_FOUND_OPTIONS = [
  { id: "adjust", label: "調整條件" },
  { id: "reconsider", label: "再評估" },
  { id: "wait", label: "繼續等" },
  { id: "pause", label: "暫停" },
] as const satisfies readonly Option[];

export const OTHER_AGENTS_OPTIONS = [
  { id: "yes", label: "有" },
  { id: "no", label: "沒有" },
  { id: "maybe", label: "可能會" },
] as const satisfies readonly Option[];

export const CONTACT_CHANNEL_OPTIONS = [
  { id: "line", label: "LINE" },
  { id: "wechat", label: "WeChat" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
] as const satisfies readonly Option[];

export const CONTACT_TIME_OPTIONS = [
  { id: "weekday-day", label: "平日白天" },
  { id: "weekday-evening", label: "平日晚上" },
  { id: "weekend", label: "週末" },
  { id: "any", label: "都可以" },
] as const satisfies readonly Option[];

type Ids<T extends readonly Option[]> = T[number]["id"];
export type MoveIn = Ids<typeof MOVE_IN_OPTIONS>;
export type Reason = Ids<typeof REASON_OPTIONS>;
export type Residence = Ids<typeof RESIDENCE_OPTIONS>;
export type Visa = Ids<typeof VISA_OPTIONS>;
export type VisaType = Ids<typeof VISA_TYPE_OPTIONS>;
export type Gender = Ids<typeof GENDER_OPTIONS>;
export type AgeRange = Ids<typeof AGE_RANGE_OPTIONS>;
export type Layout = Ids<typeof LAYOUT_OPTIONS>;
export type MustHave = Ids<typeof MUST_HAVE_OPTIONS> | Ids<typeof LEGACY_MUST_HAVE_OPTIONS>;
export type Structure = Ids<typeof STRUCTURE_OPTIONS>;
export type Adjustable = Ids<typeof ADJUSTABLE_OPTIONS>;
export type OnMatch = Ids<typeof ON_MATCH_OPTIONS>;
export type IfNotFound = Ids<typeof IF_NOT_FOUND_OPTIONS>;
export type OtherAgents = Ids<typeof OTHER_AGENTS_OPTIONS>;
export type ContactChannel = Ids<typeof CONTACT_CHANNEL_OPTIONS>;
export type ContactTime = Ids<typeof CONTACT_TIME_OPTIONS>;

/** 客人填的需求（後台修改也是改這一包，變更紀錄比對的也是這一包）。 */
export interface Requirement {
  gender?: Gender; // 必填（舊資料可能沒有）
  ageRange?: AgeRange; // 必填（舊資料可能沒有）
  moveIn: MoveIn;
  moveInDate?: string; // YYYY-MM-DD，moveIn = date 時必填
  reasons: Reason[];
  reasonOther?: string;
  residence: Residence;
  entryDate?: string; // YYYY-MM-DD，海外必填
  visaType?: VisaType; // 必填（舊資料可能沒有）
  visaTypeOther?: string; // visaType = other 時必填
  nationality?: string; // 海外必填
  visa?: Visa; // 海外且需要辦簽證時必填
  areas: string;
  commuteTarget?: string;
  occupants: number;
  layouts: Layout[];
  minAreaSqm?: number;
  walkMaxMin?: number; // 徒步到車站上限（分），0 或沒有 = 不限
  ageMaxYears?: number; // 屋齡上限（年），0 或沒有 = 不限
  structure?: Structure;
  rentIdealMan: number; // 萬円，含管理費
  rentMaxMan: number;
  initialCostMaxMan?: number;
  mustHaves: MustHave[];
  top3: MustHave[];
  adjustable: Adjustable[];
}

export interface Decision {
  onMatch: OnMatch;
  ifNotFound?: IfNotFound;
  otherAgents?: OtherAgents;
  note?: string;
}

export interface ContactInput {
  channel: ContactChannel;
  value: string;
}

export interface FindHomeSubmission {
  nickname: string;
  contact: ContactInput;
  contactTimes: ContactTime[];
  requirement: Requirement;
  decision: Decision;
  privacyAck: true;
}

/** 隱私權政策版本：條文改了就改這裡，同意紀錄會存下當時的版本。 */
export const PRIVACY_POLICY_VERSION = "2026-11-10.3";

export const LIMITS = {
  nickname: 30,
  areas: 120,
  commuteTarget: 120,
  reasonOther: 80,
  visaTypeOther: 40,
  nationality: 30,
  note: 500,
  contact: 100,
  maxOccupants: 8,
  maxRentMan: 200,
  maxAreaSqm: 300,
} as const;

export type FieldErrors = Record<string, string>;

const has = <T extends readonly Option[]>(options: T, value: unknown): value is Ids<T> =>
  typeof value === "string" && options.some(option => option.id === value);

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

function pickMany<T extends readonly Option[]>(options: T, value: unknown): Ids<T>[] {
  if (!Array.isArray(value)) return [];
  const picked = value.filter(item => has(options, item)) as Ids<T>[];
  return [...new Set(picked)];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/[,，\s]/g, ""));
  return Number.isFinite(number) ? number : null;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * 正規化聯絡方式並檢查格式。回傳空字串代表不合格。
 * 只做「明顯不是聯絡方式」的檢查，不嘗試驗證帳號是否真的存在。
 */
export function normalizeContact(channel: ContactChannel, raw: unknown): string {
  const value = cleanText(raw, LIMITS.contact);
  if (!value) return "";
  switch (channel) {
    case "email": {
      const email = value.toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : "";
    }
    case "whatsapp": {
      // 國碼＋號碼；允許空白、連字號、括號，存成 +886912345678 這種形式。
      const digits = value.replace(/[\s\-()（）]/g, "");
      return /^\+?\d{8,15}$/.test(digits) ? (digits.startsWith("+") ? digits : `+${digits}`) : "";
    }
    case "line":
    case "wechat": {
      // LINE／WeChat ID：英數、底線、點、連字號；也接受貼上 @ 開頭的寫法。
      const id = value.replace(/^@/, "");
      return /^[A-Za-z0-9._-]{3,40}$/.test(id) ? id : "";
    }
  }
}

export const CONTACT_PLACEHOLDER: Record<ContactChannel, string> = {
  line: "你的 LINE ID",
  wechat: "你的 WeChat ID",
  email: "you@example.com",
  whatsapp: "+886 912 345 678",
};

export const CONTACT_ERROR: Record<ContactChannel, string> = {
  line: "LINE ID 格式不對，請填英數字（3–40 字）。",
  wechat: "WeChat ID 格式不對，請填英數字（3–40 字）。",
  email: "Email 格式不對，請再檢查一次。",
  whatsapp: "請填含國碼的電話號碼，例如 +886 912 345 678。",
};

/** 每一步要檢查的欄位，前端按「下一步」時只驗證這一步。 */
export type StepId = 1 | 2 | 3 | 4;

/**
 * lenient：後台修改用。舊資料沒有後來才加的欄位（簽證種類、國籍），後台改其他欄位時不因此被擋。
 */
export function validateRequirement(input: any, step?: StepId, lenient = false): { value: Requirement; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const check = (s: StepId) => step === undefined || step === s;

  const moveIn = has(MOVE_IN_OPTIONS, input?.moveIn) ? input.moveIn : undefined;
  const residence = has(RESIDENCE_OPTIONS, input?.residence) ? input.residence : undefined;
  const occupants = toNumber(input?.occupants);
  const minArea = toNumber(input?.minAreaSqm);
  const rentIdeal = toNumber(input?.rentIdealMan);
  const rentMax = toNumber(input?.rentMaxMan);
  const initialCost = toNumber(input?.initialCostMaxMan);
  // 後台修改舊資料時保留舊版條件代號，避免被當成「客人刪掉了」而記成變更。
  const mustHaves = pickMany(lenient ? MUST_HAVE_LABEL_OPTIONS : MUST_HAVE_OPTIONS, input?.mustHaves) as MustHave[];
  let adjustable = pickMany(ADJUSTABLE_OPTIONS, input?.adjustable);
  if (adjustable.includes("keep") && adjustable.length > 1) adjustable = ["keep"];

  const value: Requirement = {
    moveIn: moveIn as MoveIn,
    reasons: pickMany(REASON_OPTIONS, input?.reasons),
    residence: residence as Residence,
    areas: cleanText(input?.areas, LIMITS.areas),
    occupants: occupants === null ? 0 : Math.round(occupants),
    layouts: pickMany(LAYOUT_OPTIONS, input?.layouts),
    rentIdealMan: rentIdeal ?? 0,
    rentMaxMan: rentMax ?? 0,
    mustHaves,
    // 最不能妥協只能從已勾選的條件挑，最多 3 項；取消勾選某條件時自動剔除。
    top3: (pickMany(MUST_HAVE_LABEL_OPTIONS, input?.top3) as MustHave[]).filter(id => mustHaves.includes(id)).slice(0, 3),
    adjustable,
  };

  if (check(1)) {
    if (has(GENDER_OPTIONS, input?.gender)) value.gender = input.gender;
    else if (!lenient) errors.gender = "請選擇性別。";
    if (has(AGE_RANGE_OPTIONS, input?.ageRange)) value.ageRange = input.ageRange;
    else if (!lenient) errors.ageRange = "請選擇年齡層。";
    if (!moveIn) errors.moveIn = "請選擇預計入住時間。";
    if (moveIn === "date") {
      if (isValidDate(input?.moveInDate)) value.moveInDate = input.moveInDate;
      else errors.moveInDate = "請選擇入住日期。";
    }
    if (value.reasons.includes("other")) {
      const other = cleanText(input?.reasonOther, LIMITS.reasonOther);
      if (other) value.reasonOther = other;
    }
    if (!residence) errors.residence = "請選擇目前住在日本或海外。";
    if (has(VISA_TYPE_OPTIONS, input?.visaType)) value.visaType = input.visaType;
    else if (!lenient) errors.visaType = "請選擇簽證種類。";
    if (value.visaType === "other") {
      const other = cleanText(input?.visaTypeOther, LIMITS.visaTypeOther);
      if (other) value.visaTypeOther = other;
      else if (!lenient) errors.visaTypeOther = "請填寫簽證種類。";
    }
    if (residence === "overseas") {
      const nationality = cleanText(input?.nationality, LIMITS.nationality);
      if (nationality) value.nationality = nationality;
      else if (!lenient) errors.nationality = "請填寫國籍。";
      if (isValidDate(input?.entryDate)) value.entryDate = input.entryDate;
      else if (!lenient || input?.entryDate) errors.entryDate = "請選擇預計入境日期（大概的日期也可以）。";
      if (!value.visaType || !NO_VISA_PROCESS.includes(value.visaType)) {
        if (has(VISA_OPTIONS, input?.visa)) value.visa = input.visa;
        else if (!lenient) errors.visa = "請選擇簽證辦理進度。";
      }
    }
    if (!value.areas) errors.areas = "請填想住的地區、路線或車站。";
    const commute = cleanText(input?.commuteTarget, LIMITS.commuteTarget);
    if (commute) value.commuteTarget = commute;
    if (!occupants || occupants < 1 || occupants > LIMITS.maxOccupants) errors.occupants = `入住人數請填 1–${LIMITS.maxOccupants} 人。`;
    if (value.layouts.length === 0) errors.layouts = "請至少選一種房型。";
    if (minArea !== null) {
      if (minArea <= 0 || minArea > LIMITS.maxAreaSqm) errors.minAreaSqm = "面積請填 1–300 ㎡。";
      else value.minAreaSqm = Math.round(minArea);
    }
  }

  if (check(2)) {
    if (rentIdeal === null || rentIdeal <= 0 || rentIdeal > LIMITS.maxRentMan) errors.rentIdealMan = "請填理想月租（萬円）。";
    if (rentMax === null || rentMax <= 0 || rentMax > LIMITS.maxRentMan) errors.rentMaxMan = "請填最高月租（萬円）。";
    if (rentIdeal !== null && rentMax !== null && rentMax > 0 && rentIdeal > rentMax) errors.rentMaxMan = "最高月租不能低於理想月租。";
    if (initialCost !== null) {
      if (initialCost <= 0 || initialCost > 1000) errors.initialCostMaxMan = "初期費用請填 1–1000 萬円，或留空。";
      else value.initialCostMaxMan = initialCost;
    }
    const walk = toNumber(input?.walkMaxMin);
    if (walk !== null && WALK_OPTIONS.some(option => option.id === String(walk)) && walk > 0) value.walkMaxMin = walk;
    const age = toNumber(input?.ageMaxYears);
    if (age !== null && AGE_OPTIONS.some(option => option.id === String(age)) && age > 0) value.ageMaxYears = age;
    if (has(STRUCTURE_OPTIONS, input?.structure) && input.structure !== "any") value.structure = input.structure;
    if (adjustable.length === 0) errors.adjustable = "請至少選一項；都不想調整就選「維持原條件」。";
  }

  return { value, errors };
}

export function validateDecision(input: any, check = true): { value: Decision; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const value: Decision = { onMatch: input?.onMatch };
  if (!check) return { value, errors };
  if (!has(ON_MATCH_OPTIONS, input?.onMatch)) errors.onMatch = "請選擇找到合適物件時的打算。";
  if (has(IF_NOT_FOUND_OPTIONS, input?.ifNotFound)) value.ifNotFound = input.ifNotFound;
  if (has(OTHER_AGENTS_OPTIONS, input?.otherAgents)) value.otherAgents = input.otherAgents;
  const note = cleanMultiline(input?.note, LIMITS.note);
  if (note) value.note = note;
  return { value, errors };
}

export function validateContactStep(input: any): {
  value: Pick<FindHomeSubmission, "nickname" | "contact" | "contactTimes">;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const nickname = cleanText(input?.nickname, LIMITS.nickname);
  const channel: ContactChannel = has(CONTACT_CHANNEL_OPTIONS, input?.contact?.channel) ? input.contact.channel : "line";
  const contactValue = normalizeContact(channel, input?.contact?.value);
  if (!nickname) errors.nickname = "請填一個稱呼，綽號也可以。";
  if (!contactValue) {
    errors.contact = cleanText(input?.contact?.value, LIMITS.contact) ? CONTACT_ERROR[channel] : "請留下一種聯絡方式。";
  }
  if (input?.privacyAck !== true) errors.privacyAck = "請先勾選同意，Linus 才能用這些資料聯絡你。";
  return {
    value: { nickname, contact: { channel, value: contactValue }, contactTimes: pickMany(CONTACT_TIME_OPTIONS, input?.contactTimes) },
    errors,
  };
}

/** 整份問卷一次驗證（後端用；前端送出前也跑一次）。 */
export function validateSubmission(input: any): { ok: boolean; value?: FindHomeSubmission; errors?: FieldErrors } {
  const requirement = validateRequirement(input?.requirement);
  const decision = validateDecision(input?.decision);
  const contact = validateContactStep(input);
  const errors = { ...requirement.errors, ...decision.errors, ...contact.errors };
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ...contact.value,
      requirement: requirement.value,
      decision: decision.value,
      privacyAck: true,
    },
  };
}

/** 欄位屬於哪一步：後端回傳錯誤時，前端跳回第一個有錯的步驟。 */
export const FIELD_STEP: Record<string, StepId> = {
  gender: 1, ageRange: 1, moveIn: 1, moveInDate: 1, residence: 1, visaType: 1, visaTypeOther: 1, nationality: 1, entryDate: 1, visa: 1, areas: 1, occupants: 1, layouts: 1, minAreaSqm: 1,
  rentIdealMan: 2, rentMaxMan: 2, initialCostMaxMan: 2, adjustable: 2,
  onMatch: 3,
  nickname: 4, contact: 4, privacyAck: 4,
};

export function labelOf(options: readonly Option[], id: string | undefined): string {
  return options.find(option => option.id === id)?.label ?? (id || "—");
}

export function labelsOf(options: readonly Option[], ids: readonly string[] | undefined): string {
  if (!ids || ids.length === 0) return "—";
  return ids.map(id => labelOf(options, id)).join("、");
}

/** 來源標記白名單（網址 ?from= 或 ?source=）；其他字串一律記成 other，避免任意字串寫進資料。 */
export const LEAD_SOURCES = ["website", "line", "instagram", "threads", "facebook", "listing", "calculator", "ai", "wechat", "qr", "direct", "other"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export function normalizeLeadSource(value: unknown): LeadSource {
  if (typeof value !== "string" || !value.trim()) return "direct";
  const source = value.trim().toLowerCase();
  if (source === "ig") return "instagram";
  if (source === "fb") return "facebook";
  return (LEAD_SOURCES as readonly string[]).includes(source) ? (source as LeadSource) : "other";
}

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  website: "官網", line: "LINE", instagram: "Instagram", threads: "Threads", facebook: "Facebook",
  listing: "圖紙分析", calculator: "費用試算", ai: "AI 顧問", wechat: "WeChat", qr: "QR Code", direct: "直接開啟", other: "其他",
};
