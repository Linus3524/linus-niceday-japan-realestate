import {
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  RESIDENCE_OPTIONS,
  labelOf,
  labelsOf,
  type Decision,
} from "./schema.js";
import {
  buyPropertyRules,
  BUY_BUDGET_SCOPE_OPTIONS,
  BUY_FUNDING_OPTIONS,
  BUY_LAYOUT_OPTIONS,
  BUY_LOAN_OPTIONS,
  BUY_MUST_HAVE_OPTIONS,
  BUY_ON_MATCH_OPTIONS,
  BUY_PROPERTY_OPTIONS,
  BUY_PURPOSE_OPTIONS,
  BUY_STRUCTURE_OPTIONS,
  BUY_TIMING_OPTIONS,
  BUY_VIEWING_OPTIONS,
  BUY_VISA_OPTIONS,
  normalizeBuyVisa,
  type BuyRequirement,
} from "./buySchema.js";
import type { Dimensions } from "./lead.js";

const yen = (man?: number) =>
  man ? `¥${Math.round(man * 10000).toLocaleString("en-US")}` : "—";
export const BUY_REQUIREMENT_FIELDS: {
  key: keyof BuyRequirement;
  label: string;
  format: (r: BuyRequirement) => string;
}[] = [
  {
    key: "gender",
    label: "性別",
    format: (r) => labelOf(GENDER_OPTIONS, r.gender),
  },
  {
    key: "ageRange",
    label: "年齡層",
    format: (r) => labelOf(AGE_RANGE_OPTIONS, r.ageRange),
  },
  {
    key: "residence",
    label: "目前住在",
    format: (r) => labelOf(RESIDENCE_OPTIONS, r.residence),
  },
  { key: "nationality", label: "國籍", format: (r) => r.nationality || "—" },
  {
    key: "visaType",
    label: "簽證種類",
    format: (r) => {
      const visa = normalizeBuyVisa(r.visaType, r.visaTypeOther);
      return visa.visaType === "other" ? visa.visaTypeOther || "其他" : labelOf(BUY_VISA_OPTIONS, visa.visaType);
    },
  },
  {
    key: "funding",
    label: "購屋資金方式",
    format: (r) => labelOf(BUY_FUNDING_OPTIONS, r.funding),
  },
  {
    key: "loanStatus",
    label: "貸款準備進度",
    format: (r) =>
      r.loanStatus ? labelOf(BUY_LOAN_OPTIONS, r.loanStatus) : "—",
  },
  {
    key: "ownFundsMan",
    label: "可投入自有資金",
    format: (r) => yen(r.ownFundsMan),
  },
  {
    key: "viewing",
    label: "看房安排",
    format: (r) => labelOf(BUY_VIEWING_OPTIONS, r.viewing),
  },
  {
    key: "visitTiming",
    label: "來日／看房時間",
    format: (r) => r.visitTiming || "—",
  },
  {
    key: "purchaseTiming",
    label: "目標購買時間",
    format: (r) =>
      r.purchaseTiming === "date"
        ? r.purchaseDate || "—"
        : labelOf(BUY_TIMING_OPTIONS, r.purchaseTiming),
  },
  {
    key: "budgetIdealMan",
    label: "理想購屋預算",
    format: (r) => yen(r.budgetIdealMan),
  },
  {
    key: "budgetMaxMan",
    label: "最高購屋預算",
    format: (r) => yen(r.budgetMaxMan),
  },
  {
    key: "budgetScope",
    label: "購屋預算範圍",
    format: (r) => labelOf(BUY_BUDGET_SCOPE_OPTIONS, r.budgetScope),
  },
  {
    key: "purpose",
    label: "購買用途",
    format: (r) => labelOf(BUY_PURPOSE_OPTIONS, r.purpose),
  },
  {
    key: "propertyTypes",
    label: "物件類型",
    format: (r) => labelsOf(BUY_PROPERTY_OPTIONS, r.propertyTypes),
  },
  { key: "areas", label: "希望地區", format: (r) => r.areas || "—" },
  {
    key: "layouts",
    label: "房型",
    format: (r) => labelsOf(BUY_LAYOUT_OPTIONS, r.layouts),
  },
  {
    key: "minAreaSqm",
    label: "最小面積",
    format: (r) => (r.minAreaSqm ? `${r.minAreaSqm} ㎡` : "—"),
  },
  {
    key: "walkMaxMin",
    label: "徒步到車站",
    format: (r) => (r.walkMaxMin ? `${r.walkMaxMin} 分內` : "—"),
  },
  {
    key: "ageMaxYears",
    label: "屋齡上限",
    format: (r) => (r.ageMaxYears ? `${r.ageMaxYears} 年內` : "—"),
  },
  {
    key: "floorMin",
    label: "最低樓層",
    format: (r) => (r.floorMin ? `${r.floorMin} 樓以上` : "—"),
  },
  {
    key: "structure",
    label: "建築結構",
    format: (r) =>
      r.structure ? labelOf(BUY_STRUCTURE_OPTIONS, r.structure) : "—",
  },
  {
    key: "mustHaves",
    label: "物件要求",
    format: (r) => labelsOf(BUY_MUST_HAVE_OPTIONS, r.mustHaves),
  },
  {
    key: "adjustable",
    label: "可以調整",
    format: (r) => labelsOf(buyPropertyRules(r.propertyTypes).adjustableOptions, r.adjustable),
  },
];
export function computeBuyDimensions(
  req: BuyRequirement,
  decision: Decision,
  now: Date,
): Dimensions {
  const today = new Date(now.getTime() + 9 * 3600_000)
    .toISOString()
    .slice(0, 10);
  const days = req.purchaseDate
    ? (Date.parse(`${req.purchaseDate}T00:00:00Z`) -
        Date.parse(`${today}T00:00:00Z`)) /
      86400000
    : Infinity;
  const urgency =
    req.purchaseTiming === "3m" || (req.purchaseTiming === "date" && days <= 90)
      ? "high"
      : req.purchaseTiming === "6m" ||
          (req.purchaseTiming === "date" && days <= 180)
        ? "mid"
        : "low";
  const readiness =
    decision.onMatch === "apply-asap"
      ? "high"
      : decision.onMatch === "view-first"
        ? "mid"
        : "low";
  const gap =
    req.budgetIdealMan > 0
      ? (req.budgetMaxMan - req.budgetIdealMan) / req.budgetIdealMan
      : 0;
  const flexibility = req.adjustable.includes("keep")
    ? "low"
    : req.adjustable.length >= 2 && gap >= 0.1
      ? "high"
      : req.adjustable.length || gap > 0
        ? "mid"
        : "low";
  return {
    urgency,
    readiness,
    flexibility,
    ruleVersion: "2026-11-10-buy",
    reasons: [
      `急迫：目標${req.purchaseTiming === "date" ? req.purchaseDate : labelOf(BUY_TIMING_OPTIONS, req.purchaseTiming)}`,
      `準備：${labelOf(BUY_ON_MATCH_OPTIONS, decision.onMatch)}`,
      `彈性：預算差 ${Math.round(gap * 100)}%，${req.adjustable.length ? labelsOf(buyPropertyRules(req.propertyTypes).adjustableOptions, req.adjustable) : "尚未指定可調整條件"}`,
    ],
  };
}
