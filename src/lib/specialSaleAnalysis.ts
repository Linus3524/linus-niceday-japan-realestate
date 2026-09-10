import { parseArea, parseSalePrice, parseYenAmount, parseYieldRate } from "./listingExtraction.js";

export interface SpecialSaleFields {
  address?: string;
  age?: string;
  propertyType?: string;
  buildingName?: string;
  roomNumber?: string;
  floor?: string;
  buildingFloors?: string;
  totalUnits?: string;
  managementFee?: string;
  repairReserve?: string;
  landArea?: string;
  buildingArea?: string;
  roadDetails?: string;
  hospitalityDetails?: string;
  revenueDetails?: string;
  revenueScope?: string;
  taxDetails?: string;
  occupancyStatus?: string;
  specialNotes?: string;
  annualIncome?: string;
  currentRent?: string;
  grossYield?: string;
  salePrice?: string;
  area?: string;
  renovationDetails?: string;
  handoverDetails?: string;
  unitBreakdown?: string;
  optionalFacilities?: string;
  buildingCondition?: string;
  priceDetails?: string;
}

export interface RevenueCalculationItem {
  label: string;
  formula?: string;
  value: string;
}

function yen(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} 円`;
}

function numberFrom(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseYenRate(value?: string | null) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  const manMatch = normalized.match(/^([\d.]+)\s*(?:万円|万)$/);
  if (manMatch) return Math.round(Number(manMatch[1]) * 10000);
  const yenMatch = normalized.match(/^(\d+)(?:\s*円)?$/);
  if (yenMatch) return Number(yenMatch[1]);
  return numberFrom(normalized);
}

/** 將圖紙的日租、月租、年營收與投報率算式拆成使用者可讀的中文步驟。 */
export function parseRevenueCalculationBasis(raw?: string | null): RevenueCalculationItem[] {
  if (!raw?.trim()) return [{ label: "計算前提", value: "圖紙未載明收益計算前提" }];
  const text = raw.normalize("NFKC").replace(/\s+/gu, " ").trim();
  const lodging = text.match(/(?:(\d+)\s*日\s*[×*xX]\s*([\d,.]+\s*(?:万円|万|円)?)|([\d,.]+\s*(?:万円|万|円)?)\s*[×*xX]\s*(\d+)\s*日)/u);
  const monthly = text.match(/(?:(?:マンスリー)?\s*(\d+)\s*(?:ヶ|か|ケ|個)?月[^\d]*?([\d,.]+\s*(?:万円|万|円))\s*[×*xX]\s*(\d+)|(\d+)\s*(?:ヶ|か|ケ|個)?月\s*[×*xX]\s*([\d,.]+\s*(?:万円|万|円))|([\d,.]+\s*(?:万円|万|円)?)\s*[×*xX]\s*(\d+)\s*(?:ヶ|か|ケ|個)?月)/u);
  const lodgingDays = numberFrom(lodging?.[1] || lodging?.[4]);
  const lodgingRate = parseYenRate(lodging?.[2] || lodging?.[3]);
  const monthlyMonths = numberFrom(monthly?.[1] || monthly?.[4] || monthly?.[7]);
  const monthlyRate = parseYenRate(monthly?.[2] || monthly?.[5] || monthly?.[6]);
  const statedAnnual = numberFrom(text.match(/(?:年間)?(?:売上高?|營收|收入)\s*[:：]?\s*([\d,]+)\s*円/u)?.[1]);
  const statedYield = numberFrom(text.match(/(?:利回り|投報率)\s*[:：]?\s*([\d.]+)\s*%/u)?.[1]);
  const items: RevenueCalculationItem[] = [];

  const lodgingTotal = lodgingDays !== null && lodgingRate !== null ? lodgingDays * lodgingRate : null;
  if (lodgingTotal !== null) {
    const label = /売上高/u.test(text) ? "民泊營收" : "民泊收入";
    items.push({ label, formula: `${yen(lodgingRate)} × ${lodgingDays} 日`, value: yen(lodgingTotal) });
  }
  const monthlyTotal = monthlyMonths !== null && monthlyRate !== null ? monthlyMonths * monthlyRate : null;
  if (monthlyTotal !== null) {
    const label = /売上高/u.test(text) ? (monthlyMonths ? `月租 ${monthlyMonths} 個月營收` : "月租營收") : "月租收入";
    items.push({ label, formula: `${yen(monthlyRate)} × ${monthlyMonths} 個月`, value: yen(monthlyTotal) });
  }
  if (statedAnnual !== null || lodgingTotal !== null || monthlyTotal !== null) {
    const calculated = (lodgingTotal || 0) + (monthlyTotal || 0);
    const annual = statedAnnual ?? calculated;
    const formula = lodgingTotal !== null && monthlyTotal !== null ? `${yen(lodgingTotal)} ＋ ${yen(monthlyTotal)}` : undefined;
    items.push({ label: statedAnnual !== null ? "圖紙刊載年營收" : "年營收合計", formula, value: yen(annual) });
  }
  if (statedYield !== null) {
    items.push({ label: "圖紙刊載投報率", value: `${statedYield.toFixed(2)}%` });
  }
  if (items.length) return items;

  const translated = text
    .replace(/マンスリー\s*(\d+)\s*(?:ヶ|か|ケ)?月売上高/gu, "月租 $1 個月營收")
    .replace(/民泊の?売上高/gu, "民泊營收")
    .replace(/年間売上高/gu, "年營收")
    .replace(/想定年間収入/gu, "預估年收入")
    .replace(/想定利回り/gu, "預估投報率")
    .replace(/旅館実績/gu, "旅館實績")
    .replace(/売上高/gu, "營收")
    .replace(/利回り/gu, "投報率")
    .replace(/(?:ヶ|か|ケ)月/gu, "個月")
    .replace(/万円/gu, "萬円")
    .replace(/[◆◎●]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return [{ label: "圖紙計算記載", value: translated }];
}

/** 只修正能由欄位原文確認的矛盾，不能把投報率反算收入冒充刊載值。 */
export function reconcileSpecialSaleFields<T extends SpecialSaleFields & { roomNumber?: string }>(fields: T): T {
  const next = { ...fields };
  if (/(?:新価格|新價格|改定価格|改定價格)\s*[:：]?\s*\d/.test((next.priceDetails || "").normalize("NFKC"))) {
    const revisedPrice = parseSalePrice(next.priceDetails);
    if (revisedPrice !== null) next.salePrice = `${revisedPrice}円`;
  }
  if (/号地|號地/.test(next.roomNumber || "")) {
    next.specialNotes = [next.specialNotes, `基地編號：${next.roomNumber}`].filter(Boolean).join("\n");
    next.roomNumber = "";
  }
  const revenue = (next.revenueDetails || "").normalize("NFKC");
  if (/利回|投報/.test(revenue) && !/収入|收入|売上|營收|营收|賃料|家賃|月租/.test(revenue)) {
    next.annualIncome = "";
    next.currentRent = "";
  }
  return next;
}

export function saleOccupancy(fields: SpecialSaleFields) {
  const status = fields.occupancyStatus || "";
  const renovating = /リフォーム中|改装中|工事中|翻新中|翻修中|裝修中|裝修進行中|施工中/.test(`${fields.renovationDetails || ""} ${status} ${fields.specialNotes || ""}`);
  const vacant = /空室|空き|空屋|空置/.test(status);
  return { renovating, vacant, note: renovating ? "圖紙記載裝修中，需確認完工、驗收與交屋日期；空室不代表可立即入住。" : "請核對交屋日期、設備現況及入住條件；空室不代表已完成翻新。" };
}

export function buildSpecialSaleDetails(fields: SpecialSaleFields) {
  const normalizedPropertyType = (fields.propertyType || "").normalize("NFKC");
  const kindText = `${fields.propertyType || ""} ${fields.buildingName || ""}`.normalize("NFKC");
  let kind: "land" | "whole_building" | "detached" | "condominium" | "unknown" =
    /^(?:土地|売地|土地買賣)/.test(normalizedPropertyType) ? "land"
    : /一棟|1棟|整棟|売ビル/.test(kindText) ? "whole_building"
    : /戸建|一戸建|透天|獨棟/.test(kindText) ? "detached"
    : /土地|売地/.test(normalizedPropertyType) ? "land"
    : /区分|マンション|公寓|共同住宅|分譲/.test(kindText) ? "condominium" : "unknown";

  if (kind === "unknown") {
    // 若名稱或類型未明寫「マンション」，但具備集合住宅特徵（如房號、管理費、修繕金、特定樓層或多戶），且非土地/透天/整棟，推定為區分公寓
    const hasCondoTraits =
      Boolean(fields.roomNumber?.trim()) ||
      Boolean(fields.managementFee?.trim()) ||
      Boolean(fields.repairReserve?.trim()) ||
      (Boolean(fields.totalUnits?.trim()) && Number((fields.totalUnits || "").replace(/\D/g, "")) > 1) ||
      (Boolean(fields.floor?.trim()) && Boolean(fields.buildingFloors?.trim()) && fields.floor !== fields.buildingFloors);

    if (hasCondoTraits) {
      kind = "condominium";
    }
  }
  const hospitalityText = `${fields.hospitalityDetails || ""} ${fields.specialNotes || ""} ${fields.occupancyStatus || ""}`.normalize("NFKC");
  const hospitality = /民泊|旅館|宿泊|住宿/.test(hospitalityText.replace(/民泊(?:不可|禁止)|(?:不可|禁止)民泊/g, ""));
  const pending = /申請中|申請済|申請済み|申請已|已申請|申請完了/.test(hospitalityText);
  const supportOnly = /取得.{0,8}(?:サポート|支援|協助)|(?:協助|支援).{0,8}取得/.test(hospitalityText);
  const approvalEvidence = hospitalityText.replace(/(?:許可)?取得\s*(?:サポート|支援|協助)(?:可)?|(?:協助|支援)(?:取得許可|許可取得)|許可取得(?:予定|可能|可|未定)/g, "");
  const approved = /取得済|取得済み|取得み|取得已|已取得|許可書あり|許可書有|許可取得|许可取得/.test(approvalEvidence);
  const permitStatus = pending && approved ? "conflicting" : pending ? "pending" : approved ? "approved_claim" : supportOnly ? "support_only" : /民泊.*(?:可能|可)|旅館.*(?:可能|可)/.test(hospitalityText.replace(/許可/g, "")) ? "possibility_only" : "unconfirmed";
  const permitLabel = { conflicting: "許可記載互有矛盾，待核對", pending: "申請中／已送件，尚未確認核准", approved_claim: "圖紙稱已取得許可，待核對文件", support_only: "僅提供許可取得支援，未確認已核准", possibility_only: "僅刊載住宿用途可能，未確認許可", unconfirmed: "未確認許可狀態" }[permitStatus];
  const excludeCondoComparison = kind === "detached" || kind === "whole_building" || kind === "land" || hospitality;
  const reconciled = reconcileSpecialSaleFields(fields);
  // 只有原文明列月額時才能年換算；不把投報率或稼動率反算成收入。
  const statedMonthly = (fields.revenueDetails || "").normalize("NFKC").match(/(?:月額|月間収入|月収|月收入)\s*[:：/／]?\s*([\d,]+(?:\.\d+)?\s*(?:万円|万|円))/);
  const monthlyRevenue = parseYenAmount(reconciled.currentRent) ?? parseYenAmount(statedMonthly?.[1]);
  const annualRevenueYen = parseYenAmount(reconciled.annualIncome) ?? (monthlyRevenue ? monthlyRevenue * 12 : null);
  const price = parseSalePrice(fields.salePrice);
  const calculatedYieldPercent = price && annualRevenueYen ? Math.round(annualRevenueYen / price * 10000) / 100 : null;
  const statedYield = parseYieldRate(fields.grossYield);
  const statedYieldPercent = statedYield === null ? null : Math.round(statedYield * 10000) / 100;
  const revenueText = `${fields.revenueScope || ""} ${fields.revenueDetails || ""} ${fields.specialNotes || ""}`.normalize("NFKC");
  const partialIncome = /101|[0-9]+号室|[0-9]+號室|1F|1階|1樓|一樓|一階|部分/.test(revenueText);
  const handover = `${fields.handoverDetails || ""} ${fields.specialNotes || ""} ${fields.occupancyStatus || ""}`;
  const handoverConflict = /更地|拆除後|拆屋後/.test(handover) && /現況渡|現況交|現状渡|現狀交|解体.*相談|解體.*協商/.test(handover);
  const revenueBasis = /想定|預估|預計|預期|稼動|稼働|稼動率|稼働率|×|\*/.test(revenueText) ? "forecast" : /実績|實績/.test(revenueText) ? "claimed_actual" : "unconfirmed";
  const renovationText = `${fields.renovationDetails || ""} ${fields.priceDetails || ""} ${fields.specialNotes || ""}`;
  const illustrativePhotos = /リフォーム後イメージ|翻[修新]後示意|示意圖|イメージ写真/.test(renovationText);
  const renovationExtra = /リフォーム前|翻[修新]前|另.*翻[修新]|想定リフォーム価格/.test(renovationText);
  return {
    kind,
    kindLabel: { detached: "透天住宅", whole_building: "整棟收益物件", land: "土地", condominium: "區分所有公寓", unknown: "物件類型待確認" }[kind],
    hospitality, permitStatus, permitLabel, excludeCondoComparison, illustrativePhotos, renovationExtra,
    landAreaSqm: parseArea(fields.landArea),
    buildingAreaSqm: parseArea(fields.buildingArea || (kind === "land" ? "" : fields.area)),
    handoverConflict, revenueBasis,
    mixedUse: /店舗|店鋪|店舖|店面/.test(`${fields.propertyType || ""} ${fields.unitBreakdown || ""} ${fields.revenueScope || ""}`),
    revenueBasisLabel: { forecast: "預估／情境收入，非已收租金", claimed_actual: "圖紙稱實績，仍需核對帳務", unconfirmed: "收入性質與實收情況待核對" }[revenueBasis],
    annualRevenueYen, calculatedYieldPercent, statedYieldPercent,
    yieldMismatch: calculatedYieldPercent !== null && statedYieldPercent !== null && Math.abs(calculatedYieldPercent - statedYieldPercent) > 0.15,
    partialIncome,
    marketNote: kind === "detached" || kind === "land"
      ? "本案改以同類型國交省成交與 At Home 公開刊登相場比較；不套用中古公寓行情。"
      : excludeCondoComparison ? "此物件的整棟建物或營業用途，與現有中古公寓成交資料口徑不同，暫不作高低價判定。需另取同類成交與營運資料評估。" : null,
  };
}

/** 固都稅為合計金額，不猜測兩個稅目的分攤。 */
export function statedCombinedAnnualPropertyTax(text?: string): number | null {
  const raw = (text || "").normalize("NFKC");
  const match = raw.match(/(?:固都税|固都稅|固定資産税[・、／/]都市計画税|固定資產稅[・、／/]都市計畫稅)\s*[:：]?\s*(?:合計|年間|年額)?\s*約?\s*([\d,]+(?:\.\d+)?\s*(?:万円|万|萬円|円))/);
  return match ? parseYenAmount(match[1].replace(/萬/g, "万")) : null;
}

/** 圖紙同列分列土地／家屋年度固定資產稅時，兩者相加；不把土地面積當稅额。 */
export function statedAnnualPropertyTax(text?: string): number | null {
  const raw = (text || "").normalize("NFKC").replace(/,/g, "");
  if (!/固定資産税|固定資產稅/.test(raw)) return null;
  const land = raw.match(/土地\s*[:：]?\s*(\d+)\s*円/);
  const building = raw.match(/(?:家屋|建物)\s*[:：]?\s*(\d+)\s*円/);
  return land && building ? Number(land[1]) + Number(building[1]) : null;
}
