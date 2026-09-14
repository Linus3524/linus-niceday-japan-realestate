import { parseArea, parseSalePrice, parseYenAmount, isFreeOrZero } from "./listingExtraction.js";
import { buildSpecialSaleDetails, type SpecialSaleFields } from "./specialSaleAnalysis.js";
import type { RentalConditionFields } from "./rentalConditions.js";
import type { TransitLeg } from "./transitParser.js";

export interface AuditFields extends SpecialSaleFields, RentalConditionFields {
  rent?: string; managementFee?: string; deposit?: string; keyMoney?: string;
  /**
   * 交通動線結構化結果（路線×車站×步行時間綁在一起），下游一律以此為準。
   *
   * 注意資料方向：`station` / `walkTime` 是 **Gemini 的原始輸出**
   * （見 analyze-listing 的 schema），legs 是從它們解析出來的，
   * 不是反過來。兩個舊欄位因此必須保留——它們同時是 AI 原文（供
   * `sourceValues` 稽核對照）與對外相容欄位。
   */
  transitLegs?: TransitLeg[];
  station?: string; walkTime?: string; address?: string; landRights?: string;
  layout?: string; repairReserve?: string; insuranceFee?: string; cleaningFee?: string;
  buildingFloors?: string;
  renewalFee?: string; fixedAssetTax?: number | string; cityPlanningTax?: number | string;
  sourceValues?: Record<string, string>;
}
export const auditKeys = ["salePrice", "priceDetails", "rent", "managementFee", "deposit", "keyMoney", "area", "buildingArea", "landArea", "annualIncome", "grossYield", "taxDetails", "fixedAssetTax", "cityPlanningTax", "station", "walkTime", "propertyType", "rentalConditions", "handoverDetails"] as const;
export interface AuditIssue { code: string; severity: "conflict" | "missing" | "notice"; message: string }
export interface AuditEntry { key: string; label: string; value: string; source: string; status: "extracted" | "calculated" | "estimated" | "missing" }
export interface ListingAudit { version: 1; entries: AuditEntry[]; issues: AuditIssue[]; blocksComparison: boolean }

const present = (value: unknown) => value != null && String(value).trim() !== "" && !/^(?:未載明|未記載|不明|未定|調査中|待確認|範囲未記載|-)$/i.test(String(value).trim());

/** 純函式核對層：辨識文字不是已查證的證據，不把模型估值標成圖紙確定值。 */
export function buildListingAudit(fields: AuditFields, mode: "sale" | "rent"): ListingAudit {
  const d = buildSpecialSaleDetails(fields);
  const entries: AuditEntry[] = [];
  const issues: AuditIssue[] = [];
  let blocksComparison = false;
  const add = (code: string, severity: AuditIssue["severity"], message: string, block = false) => {
    issues.push({ code, severity, message });
    if (block) blocksComparison = true;
  };
  const entry = (key: keyof AuditFields, label: string, estimated = false) => {
    const value = String(fields[key] ?? "");
    const original = fields.sourceValues?.[key] ?? value;
    entries.push({ key, label, value: present(value) ? value : "未載明／待核對", source: original,
      status: !present(value) ? "missing" : estimated ? "estimated" : original !== value ? "calculated" : "extracted" });
  };
  const require = (key: keyof AuditFields, label: string, block = false) => {
    if (!present(fields[key])) add(`missing-${key}`, "missing", `${label}未確認，不能當成零費用或條件符合。`, block);
  };
  entry(mode === "sale" ? "salePrice" : "rent", mode === "sale" ? "售價" : "月租金");
  const price = mode === "sale" ? parseSalePrice(fields.salePrice) : parseYenAmount(fields.rent);
  if (price === null) add("missing-price", "missing", "主要價格缺漏或無法解析，暫停行情判定。", true);
  entry("propertyType", "物件類型");
  entry(d.kind === "land" ? "landArea" : "buildingArea", d.kind === "land" ? "土地面積" : "建物／專有面積");
  if (d.kind !== "land" && !present(fields.buildingArea)) entry("area", "一般面積欄");
  const area = d.kind === "land" ? d.landAreaSqm : d.buildingAreaSqm;
  if (area === null) add("missing-area", "missing", "適用面積缺漏，不能計算單價或判定面積條件。", true);
  entry("station", "車站"); entry("walkTime", "圖紙徒步時間");
  require("address", "物件地址"); require("station", "最寄車站"); require("walkTime", "徒步時間");

  // 交通動線解析漏條的防線。
  //
  // 2026-09 曾發生「同一車站的多條路線只顯示一條」，而且在 5 個環節連鎖靜默
  // 失敗——沒有任何一層察覺數量不對。這裡比對 AI 原文的站數與解析出的動線數，
  // 不一致就出聲，避免同類問題再度潛伏。
  //
  // 注意只比對「站數」而非逐欄相等：解析會正規化站名（去「駅」、剝路線前綴）
  // 並刻意收斂完全重複的刊載，值本來就會不同，數量才是可靠的訊號。
  if (fields.transitLegs && present(fields.station)) {
    const advertisedCount = String(fields.station).split(/[,，、]/).map(s => s.trim()).filter(Boolean).length;
    const parsedCount = fields.transitLegs.length;
    if (parsedCount < advertisedCount) {
      add("transit-legs-shortfall", "notice",
        `圖紙標示 ${advertisedCount} 個車站，但只解析出 ${parsedCount} 條交通動線。` +
        `同名站的不同路線可能未完整列出，請對照圖紙原文確認。`);
    }
  }

  const areaText = (fields.buildingArea || "").normalize("NFKC");
  const floors = [...areaText.matchAll(/(?:([1-9]\d*)\s*(?:F|階|樓))\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:m2|m²|㎡)/gi)];
  if (floors.length >= 2 && /合計|総面積|總面積|延床/.test(areaText) && d.buildingAreaSqm !== null) {
    const unique = new Map(floors.map(m => [m[1], Number(m[2])]));
    if (unique.size === floors.length) {
      const sum = [...unique.values()].reduce((a, b) => a + b, 0);
      const allFloors = Number(fields.buildingFloors) === unique.size;
      // 部分樓層的小計低於全棟不是矛盾；有完整總階數才檢查兩方向差額。
      if (sum - d.buildingAreaSqm > 0.1 || (allFloors && Math.abs(sum - d.buildingAreaSqm) > 0.1)) add("floor-area-conflict", "conflict", `已列樓層面積合計 ${sum.toFixed(2)}㎡，與建物總面積 ${d.buildingAreaSqm}㎡不符，請核對各層及合計。`, true);
    }
  }
  for (const key of ["buildingArea", "landArea"] as const) {
    const raw = (fields[key] || "").normalize("NFKC");
    const pair = raw.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|㎡)\s*[（(]\s*約?\s*(\d+(?:\.\d+)?)\s*坪/);
    if (pair && Math.abs(Number(pair[1]) - Number(pair[2]) * 3.305785) > Math.max(0.2, Number(pair[1]) * 0.01)) {
      add(`${key}-unit-conflict`, "conflict", `${key === "landArea" ? "土地" : "建物"}同列的平方米與坪數換算不一致，保留兩個原值並請核對。`, true);
    }
  }
  if (d.handoverConflict) add("handover-conflict", "conflict", "更地交付與現況交付／拆除協商並存，須確認交屋狀態及拆除責任。");
  if (d.yieldMismatch) add("yield-conflict", "conflict", "刊載投報率與年收入÷售價不一致，須核對收入範圍及價格分母。");
  if (d.permitStatus === "conflicting") add("permit-conflict", "conflict", "許可申請與核准記載互相矛盾，不能視為已核准。");
  const priceText = (fields.priceDetails || "").normalize("NFKC");
  if (/新価格|新價格|改定価格|改定價格/.test(priceText)) {
    const revised = parseSalePrice(priceText);
    if (revised && price && revised !== price) add("price-version-conflict", "conflict", "目前售價與原文新價格不同，暫停行情判定。", true);
    else add("price-version", "notice", "此圖紙有價格改定，採新價格；舊價格僅供對照。");
  }
  if (mode === "rent") {
    for (const [key, label] of [["managementFee", "管理費／共益費"], ["deposit", "押金"], ["keyMoney", "禮金"], ["rentalConditions", "租期、更新及個別契約條件"]] as const) {
      entry(key, label); require(key, label, key === "managementFee");
    }
    for (const [key, label] of [["insuranceFee", "保險"], ["cleaningFee", "清掃費"]] as const) {
      entry(key, label);
      if (parseYenAmount(fields[key]) === null && !isFreeOrZero(fields[key])) add(`amount-${key}`, "missing", `${label}金額未確認，費用表若有數字屬暫估預算。`);
    }
    add("rent-assumptions", "notice", "初期費用含起租日、保證方案及部分暫估假設；養寵、停車與更新年費須另核對。");
  } else {
    if (d.kind === "unknown") add("missing-kind", "missing", "買賣物件類型未確認，暫停套用公寓行情。", true);
    require("landRights", "土地權利"); entry("taxDetails", "年度稅額");
    entry("fixedAssetTax", "固定資產稅推算欄", true); entry("cityPlanningTax", "都市計畫稅推算欄", true);
    if (!present(fields.taxDetails) || /調査中|調查中|未載/.test(fields.taxDetails || "")) add("missing-tax", "missing", "未取得刊載年度稅額，不能把模型概算視為納稅通知書金額。");
    if (["land", "detached", "whole_building"].includes(d.kind)) {
      entry("landArea", "土地面積與負擔"); require("landArea", "土地面積"); require("roadDetails", "接道／建築限制"); require("handoverDetails", "交付條件");
    }
    if (d.kind === "whole_building" || d.hospitality) {
      entry("annualIncome", "刊載年收入"); entry("grossYield", "刊載投報率"); require("revenueScope", "收益適用房號／樓層範圍"); require("occupancyStatus", "營運／出租／空置現況");
      if (d.annualRevenueYen === null) add("missing-income", "missing", "未取得可核對年收入，不由投報率反推成已刊載收入。");
      if (d.hospitality && d.permitStatus !== "approved_claim") add("permit-unconfirmed", "missing", d.permitLabel);
    }
    if (d.kind === "condominium") { require("managementFee", "管理費"); require("repairReserve", "修繕積立金"); }
  }
  return { version: 1, entries: entries.filter((e, i) => entries.findIndex(x => x.key === e.key) === i), issues, blocksComparison };
}
