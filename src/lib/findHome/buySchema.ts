import {
  ADJUSTABLE_OPTIONS,
  AGE_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  LIMITS,
  RESIDENCE_OPTIONS,
  WALK_OPTIONS,
  validateContactStep,
  validateDecision,
  type Decision,
  type FieldErrors,
  type FindHomeSubmission,
  type Option,
  type StepId,
} from "./schema.js";

export const BUY_TIMING_OPTIONS = [
  { id: "3m", label: "3 個月內" },
  { id: "6m", label: "半年內" },
  { id: "1y", label: "1 年內" },
  { id: "flexible", label: "先了解、不急" },
  { id: "date", label: "指定日期" },
] as const;
export const BUY_FUNDING_OPTIONS = [
  { id: "cash", label: "全款現金" },
  { id: "loan", label: "需要貸款" },
  { id: "undecided", label: "還在評估" },
] as const;
export const BUY_PURPOSE_OPTIONS = [
  { id: "own", label: "自住" },
  { id: "investment", label: "投資出租" },
  { id: "both", label: "自住兼投資／未來出租" },
] as const;
export const BUY_PROPERTY_OPTIONS = [
  { id: "condo", label: "區分公寓" },
  { id: "house", label: "一戶建" },
  { id: "building", label: "整棟物件" },
  { id: "land", label: "土地" },
  { id: "undecided", label: "還沒決定" },
] as const;
export const BUY_VIEWING_OPTIONS = [
  { id: "in-person", label: "會來日本實地看房" },
  { id: "online", label: "可線上看房後決定" },
  { id: "either", label: "實地或線上都可以" },
  { id: "undecided", label: "還在評估" },
] as const;
export const BUY_BUDGET_SCOPE_OPTIONS = [
  { id: "property", label: "物件價格，另準備購屋費用" },
  { id: "all-in", label: "含購屋費用的總預算" },
  { id: "unsure", label: "還不確定，想先討論" },
] as const;
export const BUY_LOAN_OPTIONS = [
  { id: "not-started", label: "尚未諮詢銀行" },
  { id: "consulted", label: "已向銀行諮詢" },
  { id: "preapproved", label: "已取得事前審查結果" },
] as const;
export const BUY_VISA_OPTIONS: readonly Option[] = [
  { id: "日本籍", label: "日本籍" },
  { id: "技術・人文知識・國際業務", label: "工作簽證" },
  { id: "永住者", label: "永住" },
  { id: "經營管理", label: "經營管理簽證" },
  { id: "留學", label: "留學簽證" },
  { id: "other", label: "其他" },
];
/** 舊草稿與既有買房需求轉到六分類，保留原本的身分說明。 */
export function normalizeBuyVisa(visaType = "", visaTypeOther = "") {
  if (visaType === "留學（日本語學校）") return { visaType: "留學" };
  const legacy: Record<string, string> = {
    none: "沒有日本簽證", unsure: "尚未確定", 高度人才: "高度人才",
    打工度假: "打工度假", 家族滯在: "家族滯在／配偶",
  };
  if (Object.hasOwn(legacy, visaType)) return { visaType: "other", visaTypeOther: visaTypeOther || legacy[visaType] };
  return { visaType, ...(visaType === "other" ? { visaTypeOther } : {}) };
}
export const BUY_LAYOUT_OPTIONS: readonly Option[] = [
  "1R",
  "1K",
  "1DK",
  "1LDK",
  "2LDK",
  "3LDK",
  "4LDK+",
].map((id) => ({ id, label: id === "4LDK+" ? "4LDK 以上" : id }));
export const BUY_STRUCTURE_OPTIONS = [
  { id: "any", label: "不限" },
  { id: "rc", label: "RC／SRC 造" },
  { id: "non-wood", label: "非木造" },
  { id: "wood", label: "可接受木造" },
] as const;
export const BUY_MUST_HAVE_OPTIONS = [
  { id: "elevator", label: "電梯" },
  { id: "autolock", label: "門禁自動門" },
  { id: "pets", label: "可養寵物" },
  { id: "south-facing", label: "朝南" },
  { id: "balcony", label: "陽台" },
  { id: "parking", label: "停車位" },
  { id: "renovated", label: "已翻新" },
  { id: "vacant", label: "空屋／可自住" },
  { id: "leased", label: "可接受帶租約" },
  { id: "new-seismic", label: "新耐震基準" },
  { id: "freehold", label: "所有權土地" },
] as const;
export const BUY_ON_MATCH_OPTIONS = [
  { id: "apply-asap", label: "條件確認後，準備出價洽談" },
  { id: "view-first", label: "想先看房，再決定" },
  { id: "compare", label: "想多比較幾間" },
  { id: "market-only", label: "先了解市場與購屋流程" },
] as const;

type Id<T extends readonly Option[]> = T[number]["id"];
export interface BuyRequirement {
  kind: "buy";
  gender: Id<typeof GENDER_OPTIONS>;
  ageRange: Id<typeof AGE_RANGE_OPTIONS>;
  residence: Id<typeof RESIDENCE_OPTIONS>;
  nationality?: string;
  visaType: string;
  visaTypeOther?: string;
  funding: Id<typeof BUY_FUNDING_OPTIONS>;
  loanStatus?: Id<typeof BUY_LOAN_OPTIONS>;
  ownFundsMan?: number;
  viewing: Id<typeof BUY_VIEWING_OPTIONS>;
  visitTiming?: string;
  purchaseTiming: Id<typeof BUY_TIMING_OPTIONS>;
  purchaseDate?: string;
  budgetIdealMan: number;
  budgetMaxMan: number;
  budgetScope: Id<typeof BUY_BUDGET_SCOPE_OPTIONS>;
  purpose: Id<typeof BUY_PURPOSE_OPTIONS>;
  propertyTypes: Id<typeof BUY_PROPERTY_OPTIONS>[];
  areas: string;
  layouts: string[];
  minAreaSqm?: number;
  walkMaxMin?: number;
  ageMaxYears?: number;
  floorMin?: number;
  structure?: Id<typeof BUY_STRUCTURE_OPTIONS>;
  mustHaves: Id<typeof BUY_MUST_HAVE_OPTIONS>[];
  adjustable: string[];
}
export type BuyFindHomeSubmission = Omit<FindHomeSubmission, "requirement"> & {
  dealType: "buy";
  requirement: BuyRequirement;
};
export type AnyRequirement = import("./schema.js").Requirement | BuyRequirement;
export type AnyFindHomeSubmission = FindHomeSubmission | BuyFindHomeSubmission;
export const isBuyRequirement = (req: AnyRequirement): req is BuyRequirement =>
  "kind" in req && req.kind === "buy";

const text = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
const has = <T extends readonly Option[]>(options: T, v: unknown): v is Id<T> =>
  typeof v === "string" && options.some((o) => o.id === v);
const many = <T extends readonly Option[]>(options: T, v: unknown): Id<T>[] =>
  Array.isArray(v) ? [...new Set(v.filter((id) => has(options, id)))] : [];
const number = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v !== "number" && typeof v !== "string") return null;
  const n = Number(typeof v === "string" ? v.replace(/[,，\s]/g, "") : v);
  return Number.isFinite(n) ? n : null;
};
const validDate = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(`${v}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v
  );
};
export function validateBuyRequirement(
  input: any,
  step?: StepId,
): { value: BuyRequirement; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const check = (n: StepId) => step === undefined || step === n;
  const value: BuyRequirement = {
    kind: "buy",
    gender: input?.gender,
    ageRange: input?.ageRange,
    residence: input?.residence,
    ...normalizeBuyVisa(text(input?.visaType, 50), text(input?.visaTypeOther, LIMITS.visaTypeOther)),
    funding: input?.funding,
    viewing: input?.viewing,
    purchaseTiming: input?.purchaseTiming,
    budgetIdealMan: number(input?.budgetIdealMan) ?? 0,
    budgetMaxMan: number(input?.budgetMaxMan) ?? 0,
    budgetScope: input?.budgetScope,
    purpose: input?.purpose,
    propertyTypes: many(BUY_PROPERTY_OPTIONS, input?.propertyTypes),
    areas: text(input?.areas, LIMITS.areas),
    layouts: many(BUY_LAYOUT_OPTIONS, input?.layouts),
    mustHaves: many(BUY_MUST_HAVE_OPTIONS, input?.mustHaves),
    adjustable: many(ADJUSTABLE_OPTIONS, input?.adjustable),
  };
  if (value.propertyTypes.includes("undecided"))
    value.propertyTypes = ["undecided"];
  if (value.adjustable.includes("keep")) value.adjustable = ["keep"];
  if (check(1)) {
    if (!has(GENDER_OPTIONS, value.gender)) errors.gender = "請選擇性別。";
    if (!has(AGE_RANGE_OPTIONS, value.ageRange))
      errors.ageRange = "請選擇年齡層。";
    if (!has(RESIDENCE_OPTIONS, value.residence))
      errors.residence = "請選擇目前住在日本或海外。";
    if (!has(BUY_VISA_OPTIONS, value.visaType))
      errors.visaType = "請選擇簽證種類。";
    if (value.visaType === "other") {
      if (!value.visaTypeOther) errors.visaTypeOther = "請說明其他身分或簽證種類。";
    }
    if (value.residence === "overseas") {
      value.nationality = text(input?.nationality, LIMITS.nationality);
      if (!value.nationality) errors.nationality = "請填寫國籍。";
    }
    if (!has(BUY_FUNDING_OPTIONS, value.funding))
      errors.funding = "請選擇現金、貸款或還在評估。";
    if (value.funding !== "cash") {
      if (has(BUY_LOAN_OPTIONS, input?.loanStatus))
        value.loanStatus = input.loanStatus;
      const ownFunds = number(input?.ownFundsMan);
      if (
        ownFunds === null &&
        input?.ownFundsMan !== undefined &&
        input?.ownFundsMan !== null &&
        input.ownFundsMan !== ""
      )
        errors.ownFundsMan = "請填有效的自有資金金額，或留空。";
      if (ownFunds !== null) {
        if (ownFunds <= 0 || ownFunds > 1000000)
          errors.ownFundsMan = "自有資金請填 1–1,000,000 萬円，或留空。";
        else value.ownFundsMan = ownFunds;
      }
    }
    if (!has(BUY_VIEWING_OPTIONS, value.viewing))
      errors.viewing = "請選擇看房安排。";
    if (value.viewing !== "online") {
      const visitTiming = text(input?.visitTiming, 80);
      if (visitTiming) value.visitTiming = visitTiming;
    }
    if (!has(BUY_TIMING_OPTIONS, value.purchaseTiming))
      errors.purchaseTiming = "請選擇目標購買時間。";
    if (value.purchaseTiming === "date") {
      if (!validDate(input?.purchaseDate))
        errors.purchaseDate = "請選擇目標購買日期。";
      else value.purchaseDate = input.purchaseDate;
    }
  }
  if (check(2)) {
    if (value.budgetIdealMan <= 0 || value.budgetIdealMan > 1000000)
      errors.budgetIdealMan = "請填理想購屋預算（萬円）。";
    if (value.budgetMaxMan <= 0 || value.budgetMaxMan > 1000000)
      errors.budgetMaxMan = "請填最高購屋預算（萬円）。";
    if (value.budgetIdealMan > value.budgetMaxMan && value.budgetMaxMan > 0)
      errors.budgetMaxMan = "最高預算不能低於理想預算。";
    if (!has(BUY_BUDGET_SCOPE_OPTIONS, value.budgetScope))
      errors.budgetScope = "請選擇預算是否包含購屋費用。";
    if (!has(BUY_PURPOSE_OPTIONS, value.purpose))
      errors.purpose = "請選擇購買用途。";
    if (!value.propertyTypes.length)
      errors.propertyTypes = "請選擇物件類型，未定也可以。";
    if (!value.areas)
      errors.areas = "請填希望購買的地區、路線或車站；還沒決定可以填「未定」。";
    for (const [field, max] of [
      ["minAreaSqm", 10000],
      ["floorMin", 100],
    ] as const) {
      const n = number(input?.[field]);
      if (
        n === null &&
        input?.[field] !== undefined &&
        input?.[field] !== null &&
        input[field] !== ""
      )
        errors[field] = "請填有效的數字，或留空。";
      if (n !== null) {
        if (n < 1 || n > max || !Number.isInteger(n))
          errors[field] = `請填 1–${max} 的整數，或留空。`;
        else value[field] = n;
      }
    }
    for (const [field, options] of [
      ["walkMaxMin", WALK_OPTIONS],
      ["ageMaxYears", AGE_OPTIONS],
    ] as const) {
      const n = number(input?.[field]);
      if (
        n === null &&
        input?.[field] !== undefined &&
        input?.[field] !== null &&
        input[field] !== ""
      )
        errors[field] = "請選擇有效的選項。";
      if (n !== null && n !== 0) {
        if (!options.some((o) => o.id === String(n)))
          errors[field] = "請選擇有效的選項。";
        else value[field] = n;
      }
    }
    if (
      has(BUY_STRUCTURE_OPTIONS, input?.structure) &&
      input.structure !== "any"
    )
      value.structure = input.structure;
  }
  return { value, errors };
}
export function validateBuySubmission(input: any): {
  ok: boolean;
  value?: BuyFindHomeSubmission;
  errors?: FieldErrors;
} {
  const requirement = validateBuyRequirement(input?.requirement);
  const decision = validateDecision(input?.decision);
  // 買房沒有租房的先行申請／先行契約選項。
  delete decision.value.applicationRoutes;
  const contact = validateContactStep(input);
  const errors = {
    ...requirement.errors,
    ...decision.errors,
    ...contact.errors,
  };
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ...contact.value,
      dealType: "buy",
      requirement: requirement.value,
      decision: decision.value,
      privacyAck: true,
    },
  };
}
export const BUY_FIELD_STEP: Record<string, StepId> = {
  gender: 1,
  ageRange: 1,
  residence: 1,
  visaType: 1,
  visaTypeOther: 1,
  nationality: 1,
  funding: 1,
  loanStatus: 1,
  ownFundsMan: 1,
  viewing: 1,
  visitTiming: 1,
  purchaseTiming: 1,
  purchaseDate: 1,
  budgetIdealMan: 2,
  budgetMaxMan: 2,
  budgetScope: 2,
  purpose: 2,
  propertyTypes: 2,
  areas: 2,
  minAreaSqm: 2,
  floorMin: 2,
  walkMaxMin: 2,
  ageMaxYears: 2,
  onMatch: 3,
  nickname: 4,
  contact: 4,
  privacyAck: 4,
};
