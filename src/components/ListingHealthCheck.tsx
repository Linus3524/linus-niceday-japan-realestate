import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Footprints,
  Info,
  Landmark,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  Lightbulb,
  TrainFront,
  Trash2,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";
import type { AxisStatus } from "../lib/requirementVerdict";
import type { ListingLocationContext } from "../lib/listingLocation";
import { publicSaleMarketCrossChecks } from "../data/saleListingMarket";
import {
  normalizeStructure,
  parseArea,
  parseGuaranteeFee,
  formatShikibiki,
  isFreeOrZero,
  parseSalePrice,
  parseUnitsCount,
  parseYenAmount,
  computeTsuboAndSqmPrice,
  assessRepairReserve,
  calculateSaleInitialCosts,
} from "../lib/listingExtraction";
import { ListingLocationMap } from "./ListingLocationMap";

/**
 * 物件圖紙分析：上傳仲介提供的物件概要書／図面（單張圖紙或 PDF），
 * 支援「租賃圖紙」與「買賣圖紙」，深度萃取金額與特約條款，
 * 進行行情比對、每坪單價、持有負擔與大樓修繕基金合理性診斷、
 * 初期費用預測試算、實際步行與周邊機能檢驗。
 */

// 改為單張圖紙上傳：日本不動產物件概要書（マイソク / Maisoku）絕大多數均為單頁橫式（A4/B4），
// 單張上傳能避免順序錯亂、縮短辨識等待時間，並大幅簡化使用者操作體驗。
const MAX_FILES = 1;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = "image/*,application/pdf";
const MAX_UPLOAD_DIMENSION = 2000;
const JPEG_QUALITY = 0.8;
// Gemini 直接讀取掃描型 PDF 時，可能先以較低解析度將整頁光柵化，導致細字誤讀。
// 先在瀏覽器將單頁圖紙轉成約 180 DPI（A4 橫式長邊約 2,100px）的 JPEG，
// 能保留小字，同時控制上傳量與圖片 token。
const MAX_PDF_RENDER_DIMENSION = 2200;
const PDF_JPEG_QUALITY = 0.88;

interface InsightBulletItem {
  id: string;
  iconType: "verdict" | "factor" | "market" | "advice";
  tag: string;
  title?: string;
  text: string;
}

function getInsightBulletItems(mlitComparison: {
  explanation: string;
  insightPoints?: Array<{
    id: string;
    icon: string;
    tag: string;
    title: string;
    content: string;
    type?: string;
  }>;
}): InsightBulletItem[] {
  if (mlitComparison.insightPoints && mlitComparison.insightPoints.length > 0) {
    return mlitComparison.insightPoints.map(p => ({
      id: p.id,
      iconType: (p.type as any) || "verdict",
      tag: p.tag,
      title: p.title,
      text: p.content,
    }));
  }

  const rawText = mlitComparison.explanation || "";
  const lines = rawText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const items: InsightBulletItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^•\s*【(.*?)】[：:](.*)$/);
    if (match) {
      const tag = match[1].trim();
      const text = match[2].trim();
      let iconType: "verdict" | "factor" | "market" | "advice" = "verdict";
      if (tag.includes("條件") || tag.includes("溢價") || tag.includes("優勢")) iconType = "factor";
      else if (tag.includes("刊登") || tag.includes("市場")) iconType = "market";
      else if (tag.includes("建議") || tag.includes("Linus")) iconType = "advice";

      items.push({
        id: `parsed-${i}`,
        iconType,
        tag,
        text,
      });
    } else {
      let iconType: "verdict" | "factor" | "market" | "advice" = "verdict";
      let tag = "行情解讀";
      if (line.includes("建議") || line.includes("談判") || line.includes("出價")) {
        iconType = "advice";
        tag = "Linus 實務建議";
      } else if (line.includes("刊登") || line.includes("At Home") || line.includes("REINS")) {
        iconType = "market";
        tag = "市面刊登對照";
      } else if (line.includes("條件") || line.includes("屋齡") || line.includes("徒步")) {
        iconType = "factor";
        tag = "條件優勢拆解";
      }
      items.push({
        id: `parsed-${i}`,
        iconType,
        tag,
        text: line.replace(/^•\s*/, ""),
      });
    }
  }

  return items;
}

const STATUS_STYLE: Record<string, { badge: string; box: string }> = {
  "合理": {
    badge: "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
    box: "border-[#9ee2cf] bg-[#f2faf7]",
  },
  "超值": {
    badge: "border-[#8fd4cb] bg-[#e0f5f0] text-[#00694c]",
    box: "border-[#8fd4cb] bg-[#eefaf7]",
  },
  "條件反映": {
    badge: "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
    box: "border-[#DCC8A1] bg-[#FFFDF8]",
  },
  "偏高": {
    badge: "border-[#F4C1A8] bg-[#FFF0E8] text-[#9E3E1B]",
    box: "border-[#F4C1A8] bg-[#FFF9F5]",
  },
  "明顯偏高": {
    badge: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
    box: "border-[#F8D2C5] bg-[#FFF5F2]",
  },
  "符合": {
    badge: "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
    box: "border-[#9ee2cf] bg-[#f2faf7]",
  },
  "部分符合": {
    badge: "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
    box: "border-[#9ee2cf] bg-[#f2faf7]",
  },
  "需調整": {
    badge: "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
    box: "border-[#DCC8A1] bg-[#FFFDF8]",
  },
  "難度高": {
    badge: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
    box: "border-[#F8D2C5] bg-[#FFF5F2]",
  },
  "待確認": {
    badge: "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]",
    box: "border-[#D6EAF0] bg-[#F8FBFC]",
  },
};

const getStatusStyle = (status?: string | null) => {
  if (!status) return STATUS_STYLE["待確認"];
  return STATUS_STYLE[status] || STATUS_STYLE["待確認"];
};

export interface SaleAnalysisVerdict {
  salePriceYen: number;
  salePriceMan: number;
  areaSqm: number | null;
  tsuboAndSqm: {
    tsubo: number | null;
    tsuboPriceYen: number | null;
    tsuboPriceMan: number | null;
    sqmPriceYen: number | null;
    sqmPriceMan: number | null;
  };
  monthlyHoldingCosts: {
    managementFee: number;
    repairReserve: number;
    repairFund: number;
    otherMonthlyFees: number;
    totalMonthlyCost: number;
    items: Array<{ name: string; amount: number; note: string }>;
  };
  buildingHealth: {
    totalUnits: number | null;
    ageYears: number | null;
    reservePerSqm: number | null;
    reserveHealthLevel: "inadequate" | "healthy" | "heavy";
    reserveHealthText: string;
    reserveHealthNote: string;
    scaleRiskLevel: "high_risk" | "medium" | "safe";
    scaleRiskText: string;
    scaleRiskNote: string;
    specialStrengths: string[];
  };
  mlitComparison: {
    region: string;
    district: string;
    /** 實際比對用的行情分桶標籤（非圖紙原文房型） */
    layout: string;
    /** 圖紙上寫的原文房型 */
    listingLayout?: string;
    medianPriceYen: number | null;
    medianPriceMan: number | null;
    medianSqmPriceYen?: number | null;
    marketAgeBand?: string | null;
    marketAgeBandSampleCount?: number | null;
    marketAgeBandScope?: "layout" | "district" | null;
    /** 相對「條件校準後預期價」的價差 */
    diffPercent: number | null;
    /** 相對「未校準分桶中位數」的價差，供對照 */
    rawDiffPercent?: number | null;
    expectedPriceMan?: number | null;
    fairLowMan?: number | null;
    fairHighMan?: number | null;
    typicalListingPriceMan?: number | null;
    listingDiffPercent?: number | null;
    listingVerdict?: "below" | "typical" | "above" | null;
    listingVerdictText?: string | null;
    listingPremiumRatePercent?: number | null;
    impliedDiscountFromListingPercent?: number | null;
    listingBenchmarkPeriod?: string | null;
    listingBenchmarkSourceUrl?: string | null;
    listingBenchmarkSourceLabel?: string | null;
    listingBenchmarkKind?: "public_listing_average" | "reins_ratio" | null;
    listingBenchmarkScopeLabel?: string | null;
    areaAdjusted?: boolean;
    areaBasisNote?: string;
    priceFactors?: Array<{ label: string; ratePercent: number; note: string }>;
    priceCautions?: string[];
    verdict: "bargain" | "fair" | "premium";
    verdictText: string;
    explanation: string;
    insightPoints?: Array<{
      id: string;
      icon: string;
      tag: string;
      title: string;
      content: string;
      type?: "verdict" | "factor" | "market" | "advice";
    }>;
    sampleCount?: number;
    periodStart?: string;
    periodEnd?: string;
    latestPeriod?: string;
    snapshotGeneratedAt?: string | null;
    stationWalkFactor: {
      walkMinutes: number;
      level: "prime_close" | "standard" | "far";
      note: string;
    };
  } | null;
  occupancyAssessment: {
    status: "vacant" | "tenanted_investment" | "occupied_owner" | "unknown";
    statusText: string;
    investmentYield?: {
      monthlyRentYen: number;
      annualIncomeYen: number;
      grossYield: number;
      netYieldEstimated: number | null;
    };
    mortgageTaxEligible: boolean | null;
    mortgageTaxNote: string;
    renovationNote?: string;
  };
  initialCosts: {
    total: number;
    percentageOfPrice: number;
    items: Array<{ id: string; name: string; amount: number; note: string }>;
  };
}

interface ExtractedFields {
  dealType?: string;
  buildingName?: string;
  station: string;
  walkTime: string;
  layout: string;
  rent: string;
  managementFee: string;
  keyMoney: string;
  deposit: string;
  age: string;
  floor: string;
  address: string;
  area?: string;
  structure?: string;
  guaranteeFee?: string;
  lockReplacementFee?: string;
  cleaningFee?: string;
  insuranceFee?: string;
  shikibiki?: string;
  cancellationPenalty?: string;
  renewalFee?: string;
  supportFee?: string;
  freeRent?: string;
  salePrice?: string;
  totalUnits?: string;
  repairReserve?: string;
  repairFund?: string;
  otherMonthlyFees?: string;
  occupancyStatus?: string;
  currentRent?: string;
  annualIncome?: string;
  grossYield?: string;
  landRights?: string;
  zoning?: string;
  renovationDetails?: string;
  managementCompany?: string;
  managementStyle?: string;
  specialNotes?: string;
}

export interface InitialCostBreakdownItem {
  id: string;
  name: string;
  amount: number;
  isFromFlyer: boolean;
  note: string;
}

export interface InitialCostEstimate {
  totalMin: number;
  totalMax: number;
  monthsMultipleMin: number;
  monthsMultipleMax: number;
  level: "low" | "standard" | "high";
  levelText: string;
  items: InitialCostBreakdownItem[];
  tips: string[];
}

interface AnalyzeListingResult {
  dealType?: "sale" | "rent";
  extracted: ExtractedFields;
  parsed: {
    rent: number | null;
    managementFee: number | null;
    salePrice?: number | null;
    keyMoney: number | null;
    deposit: number | null;
    roomType: string | null;
    area?: number | null;
    structure?: string | null;
    totalUnits?: number | null;
    repairReserve?: number | null;
    repairFund?: number | null;
    otherMonthlyFees?: number | null;
  };
  range: {
    low: number;
    median: number;
    high: number;
    sourceUrl?: string;
    sourceLabel?: string;
    sourceDate?: string;
  } | null;
  verdict: { status: string; headline: string; detail: string } | null;
  initialCostMonths: number | null;
  initialCostEstimate?: InitialCostEstimate | null;
  saleAnalysis?: SaleAnalysisVerdict | null;
}

interface ListingCommuteResult {
  destinationInput: string;
  destinationAddress: string;
  destinationResolutionNote?: string | null;
  destinationStation: string;
  destinationWalkMinutes: number;
  originWalkMinutes: number;
  transitMinutes: number;
  totalMinutes: number;
  transfers: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
  });
}

function base64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function renderPdfForUpload(file: File): Promise<{ mimeType: string; data: string }> {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  try {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = MAX_PDF_RENDER_DIMENSION / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvas, viewport, background: "rgb(255,255,255)" }).promise;
    page.cleanup();

    const data = canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY).split(",")[1] ?? "";
    if (!data) throw new Error("PDF canvas encode failed");
    return { mimeType: "image/jpeg", data };
  } finally {
    await pdf.destroy();
  }
}

async function encodeForUpload(file: File): Promise<{ mimeType: string; data: string }> {
  if (file.type === "application/pdf") {
    try {
      return await renderPdfForUpload(file);
    } catch (error) {
      console.warn("PDF 高解析度轉圖失敗，改送原始 PDF。", error);
      return { mimeType: file.type, data: await fileToBase64(file) };
    }
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const data = canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1] ?? "";
    if (!data) throw new Error("canvas encode failed");
    return { mimeType: "image/jpeg", data };
  } catch {
    return { mimeType: file.type, data: await fileToBase64(file) };
  }
}

function formatYen(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 前端 fallback 初期費用試算：若 API 回應中未包含完整物件，
 * 即刻依既有欄位與市場行情標準補充計算，確保使用者必定能看到初期費用拆解。
 */
function buildClientInitialCost(result: AnalyzeListingResult): InitialCostEstimate | null {
  const rent = result.parsed.rent;
  if (!rent) return null;
  const managementFee = result.parsed.managementFee ?? 0;
  const totalMonthlyCost = rent + managementFee;
  const deposit = result.parsed.deposit ?? 0;
  const keyMoney = result.parsed.keyMoney ?? 0;

  const formattedShikibiki = formatShikibiki(result.extracted.shikibiki);
  const hasShikibiki = Boolean(formattedShikibiki);

  const customGuarantee = parseGuaranteeFee(result.extracted.guaranteeFee, totalMonthlyCost);
  const guaranteeAmount = customGuarantee ?? Math.round(totalMonthlyCost * 0.5);

  const items: InitialCostBreakdownItem[] = [
    {
      id: "deposit",
      name: "敷金（押金）",
      amount: deposit,
      isFromFlyer: Boolean(result.extracted.deposit),
      note: deposit === 0
        ? "免押金（需留意退租時之原狀恢復或預收清掃費條款）"
        : hasShikibiki
        ? `擔保性質費用（⚠️ 含「${formattedShikibiki}」扣除約定，退租時不退還）`
        : "擔保性質費用，退租扣除自然折舊外之修繕後退還餘額",
    },
    {
      id: "keyMoney",
      name: "禮金（礼金）",
      amount: keyMoney,
      isFromFlyer: Boolean(result.extracted.keyMoney),
      note: keyMoney === 0 ? "免禮金（無須額外贈與房東謝禮，初期負擔大幅減輕）" : "日本傳統贈與房東之謝禮，退租時不予退還",
    },
    {
      id: "advanceRent",
      name: "前家賃（次月完整租金＋管理費）",
      amount: totalMonthlyCost,
      isFromFlyer: true,
      note: "簽約時預先繳交入住次月之全月租金與共益費",
    },
    {
      id: "proratedRent",
      name: "起租月日割租金（按日計租預估）",
      amount: Math.round(totalMonthlyCost * 0.5),
      isFromFlyer: false,
      note: "以月中 15 天起租試算；若起租日靠近月底（例如 25 號後）可降至更低",
    },
    {
      id: "guaranteeFee",
      name: "保證會社初回保證料",
      amount: guaranteeAmount,
      isFromFlyer: Boolean(customGuarantee),
      note: customGuarantee
        ? `圖紙載明：${result.extracted.guaranteeFee}（依月總租金 ¥${totalMonthlyCost.toLocaleString()} 計約 ¥${guaranteeAmount.toLocaleString()}）`
        : result.extracted.guaranteeFee
        ? `圖紙標示：${result.extracted.guaranteeFee}`
        : "外國籍租客多數需加入保證公司，一般首年為總租金 50%～100%",
    },
    {
      id: "brokerageFee",
      name: "仲介手續費（仲介手数料）",
      amount: Math.round(rent * 1.1),
      isFromFlyer: false,
      note: "日本國土交通省法定上限為 1 個月租金 + 10% 消費稅",
    },
    {
      id: "insuranceFee",
      name: "火災保險／家財保險（2年）",
      amount: parseYenAmount(result.extracted.insuranceFee) ?? 20000,
      isFromFlyer: Boolean(parseYenAmount(result.extracted.insuranceFee)),
      note: result.extracted.insuranceFee ? `圖紙標示：${result.extracted.insuranceFee}` : "保障租客個人財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
    },
    {
      id: "lockReplacementFee",
      name: "鑰匙更換費（鍵交換代）",
      amount: isFreeOrZero(result.extracted.lockReplacementFee) ? 0 : (parseYenAmount(result.extracted.lockReplacementFee) ?? 22000),
      isFromFlyer: isFreeOrZero(result.extracted.lockReplacementFee) || Boolean(parseYenAmount(result.extracted.lockReplacementFee)),
      note: isFreeOrZero(result.extracted.lockReplacementFee)
        ? `免換鎖費用（圖紙標示：${result.extracted.lockReplacementFee || "無償"}）`
        : result.extracted.lockReplacementFee
        ? `圖紙標示：${result.extracted.lockReplacementFee}`
        : "交屋前換新鎖芯費用（一般鎖約 1.6 萬～2.2 萬円，電子鎖約 3.3 萬円）",
    },
  ];

  const customCleaning = parseYenAmount(result.extracted.cleaningFee);
  if (deposit === 0 || customCleaning) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: customCleaning ?? 44000,
      isFromFlyer: Boolean(customCleaning),
      note: result.extracted.cleaningFee ? `圖紙標示：${result.extracted.cleaningFee}` : "免押金物件通常於簽約初期預收退租清掃費",
    });
  }

  const customSupport = parseYenAmount(result.extracted.supportFee);
  if (customSupport && customSupport > 0) {
    items.push({
      id: "supportFee",
      name: "入居者サポート／24小時生活支援",
      amount: customSupport,
      isFromFlyer: true,
      note: `圖紙標示：${result.extracted.supportFee}（24 小時生活急修與支援服務）`,
    });
  }

  const totalMin = items.filter(i => i.id !== "proratedRent").reduce((sum, i) => sum + i.amount, 0);
  const totalMax = items.reduce((sum, i) => sum + i.amount, 0);
  const monthsMultipleMin = Number((totalMin / totalMonthlyCost).toFixed(1));
  const monthsMultipleMax = Number((totalMax / totalMonthlyCost).toFixed(1));

  let level: "low" | "standard" | "high" = "standard";
  let levelText = "市場標準常態（約 3.5 ～ 4.8 倍）";
  if (monthsMultipleMax <= 3.5) {
    level = "low";
    levelText = "極度優惠（3.5 倍以下）";
  } else if (monthsMultipleMax >= 5.0) {
    level = "high";
    levelText = "初期負擔偏高（5.0 倍以上）";
  }

  const tips: string[] = [];

  // 1. 租金高性價比／超值物件
  if (result.verdict?.status === "超值") {
    tips.push("【💡 高性價比／超值物件】本物件租金＋管理費顯著低於同區同房型市場行情，價格極具競爭力！在東京租屋市場中，此類平價超值房源去化速度極快，若審查通過建議把握簽約時機，以免被其他申請者搶先。");
  }

  // 2. 免租期（Free Rent）特惠提示
  if (result.extracted.freeRent && !isFreeOrZero(result.extracted.freeRent)) {
    tips.push(`【✨ 專屬禮遇・免租期（フリーレント）】圖紙載有「${result.extracted.freeRent}」優惠！起租首月可減免本體租金，實質大幅減輕簽約搬家現金壓力（約省下 ¥${rent.toLocaleString()}）。`);
  }

  // 3. 初期費用極度親民（3.5 倍以下）
  if (monthsMultipleMax <= 3.5) {
    tips.push(`【💰 初期費用極度親民】本物件總初期費用僅約 ${monthsMultipleMax} 個月租金（市場普遍約 4.0～4.8 倍），大幅壓低赴日搬遷的現金流門檻！`);
  }

  // 4. 禮金與押金動態解析
  if (hasShikibiki) {
    tips.push(`【⚠️ 重要特約・敷引（押金不退還）】圖紙載有「${formattedShikibiki}」，此約定表示退租時該筆押金將直接扣除沒收、絕不退還，實質形同額外禮金，請務必納入預算考量。`);
  }
  if (keyMoney === 0 && deposit === 0) {
    tips.push("【🎉 零禮金・零押金（雙零物件）】免付房東謝禮與押金，初期可直接省下約 2 個月租金負擔；但請特別留意退租時合約約定的基本清掃費與原狀恢復計費特約。");
  } else if (keyMoney === 0) {
    tips.push("【✨ 免禮金優勢】本物件「免禮金」，為您省下致贈房東的謝禮（相當於省下約 1 個月租金）；所繳押金於扣除退租清潔特約後仍有機會返還。");
  } else if (keyMoney >= rent * 1.5) {
    const kmMonths = (keyMoney / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【⚠️ 初期負擔偏高】本物件禮金高達 ${kmMonths} 個月，屬於熱門物件或都心精華地段常見設定，初期成本相對較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isFreeOrZero(result.extracted.lockReplacementFee)) {
    tips.push("【🔑 免換鎖費優惠】圖紙載明免收換鎖費（鍵交換代 0 円），為您額外省下約 2～4 萬円的交屋雜費。");
  }

  // 6. 附免費高速網路
  const allNotes = `${result.extracted.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【📶 附免費高速網路】圖紙標示內建免費網路，入居後免自行申辦與綁約，每年實質再為您省下約 5 萬～6 萬円通信開銷。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日與首期金額浮動】日本簽約多會預收「起租月剩餘日數之日割租金＋次月完整租金與管理費」。因起租日需配合管理會社規定之最晚起租期限（通常為審查核准後約 10～20 天內，無法隨意延後），若核准的起租日剛好落在下旬（如 25 號後），當月日割天數少，首筆需匯出的初期款項會相對有感降低；若落在月初則日割接近全額。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款提醒】海外租客簽約初期費用多需以日本國內銀行匯款，若由海外電匯請預留約 4,000 円日本端中繼受金手續費與匯差緩衝。");

  return { totalMin, totalMax, monthsMultipleMin, monthsMultipleMax, level, levelText, items, tips };
}

/**
 * 前端 fallback 買賣圖紙分析：確保即使後端特定結構缺漏，前端亦能正常算妥數值
 */
function buildClientSaleAnalysis(result: AnalyzeListingResult): SaleAnalysisVerdict | null {
  const salePriceYen = result.parsed.salePrice ?? parseSalePrice(result.extracted.salePrice);
  if (!salePriceYen) return null;
  const areaSqm = result.parsed.area ?? parseArea(result.extracted.area);
  const tsuboAndSqm = computeTsuboAndSqmPrice(salePriceYen, areaSqm);
  const managementFee = result.parsed.managementFee ?? parseYenAmount(result.extracted.managementFee) ?? 0;
  const repairReserve = result.parsed.repairReserve ?? parseYenAmount(result.extracted.repairReserve) ?? 0;
  const repairFund = result.parsed.repairFund ?? parseYenAmount(result.extracted.repairFund) ?? 0;
  const otherMonthlyFees = result.parsed.otherMonthlyFees ?? parseYenAmount(result.extracted.otherMonthlyFees) ?? 0;
  const totalMonthlyCost = managementFee + repairReserve + repairFund + otherMonthlyFees;

  const totalUnits = result.parsed.totalUnits ?? parseUnitsCount(result.extracted.totalUnits);
  const reserveAssessment = assessRepairReserve({
    monthlyRepairCostYen: repairReserve + repairFund,
    areaSqm,
    totalUnits,
  });

  const initialCosts = calculateSaleInitialCosts(salePriceYen);

  return {
    salePriceYen,
    salePriceMan: Math.round(salePriceYen / 10000),
    areaSqm,
    tsuboAndSqm,
    monthlyHoldingCosts: {
      managementFee,
      repairReserve,
      repairFund,
      otherMonthlyFees,
      totalMonthlyCost,
      items: [
        { name: "管理費", amount: managementFee, note: result.extracted.managementCompany || "大樓日常維護與共用部費用" },
        { name: "修繕積立金", amount: repairReserve, note: "管委會大樓長期修繕儲備基金" },
        ...(repairFund > 0 ? [{ name: "修繕積立基金（月額）", amount: repairFund, note: "定期追加修繕準備金" }] : []),
        ...(otherMonthlyFees > 0 ? [{ name: "其他月額雜費", amount: otherMonthlyFees, note: result.extracted.otherMonthlyFees || "町會費或自治費用" }] : []),
      ],
    },
    buildingHealth: {
      totalUnits,
      ageYears: null,
      ...reserveAssessment,
      specialStrengths: [],
    },
    mlitComparison: null,
    occupancyAssessment: {
      status: "unknown",
      statusText: result.extracted.occupancyStatus || "一般買賣物件",
      mortgageTaxEligible: areaSqm && areaSqm >= 50 ? true : null,
      mortgageTaxNote: areaSqm && areaSqm >= 50 ? "專有面積達 50㎡ 以上，符合住宅貸款減稅主要面積標準。" : "需查驗謄本內法面積是否達標。",
    },
    initialCosts,
  };
}

export function ListingHealthCheck() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeListingResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"auto" | "rent" | "sale">("auto");
  const [locationContext, setLocationContext] = useState<ListingLocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [commuteDestination, setCommuteDestination] = useState("");
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [commute, setCommute] = useState<ListingCommuteResult | null>(null);
  const [showInitialCostDetails, setShowInitialCostDetails] = useState(true);
  const [showSaleCostsDetails, setShowSaleCostsDetails] = useState(true);
  const [customBuildingName, setCustomBuildingName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 當辨識出建物名稱時，自動帶入可編輯狀態
  useEffect(() => {
    if (result?.extracted?.buildingName) {
      setCustomBuildingName(result.extracted.buildingName.trim());
    } else {
      setCustomBuildingName("");
    }
  }, [result]);

  // 當 previewUrl 變動時妥善釋放 object URL，避免記憶體洩漏
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectSingleFile = (selectedFile: File) => {
    setError(null);
    setResult(null);
    setLocationContext(null);
    setCommute(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) selectSingleFile(picked);
    event.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectSingleFile(dropped);
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setLocationContext(null);
    setCommute(null);
    setError(null);
  };

  const loadLocationContext = async (analysis: AnalyzeListingResult) => {
    const address = analysis.extracted.address.trim();
    if (!address) {
      setLocationError("圖紙上未載明完整地址，因此無法進行精確步行與生活機能定位。");
      return;
    }
    const stations = analysis.extracted.station.split(/[,，]/).map(v => v.trim()).filter(Boolean);
    const advertisedWalkMinutes = analysis.extracted.walkTime
      .split(/[,，]/)
      .map(v => Number(v.match(/\d+/)?.[0]))
      .map(v => Number.isFinite(v) ? v : null);

    setLocationLoading(true);
    setLocationError(null);
    try {
      const response = await fetch("/api/listing-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "context", address, stations, advertisedWalkMinutes }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "位置資料暫時無法取得。");
      if (!body?.found) throw new Error(body?.message || "目前無法定位此地址。");
      setLocationContext(body.context as ListingLocationContext);
    } catch (err: any) {
      setLocationError(err?.message || "位置資料暫時無法取得。");
    } finally {
      setLocationLoading(false);
    }
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLocationContext(null);
    setLocationError(null);
    setCommute(null);
    setCommuteError(null);

    try {
      const encoded = await encodeForUpload(file);
      const totalBytes = base64Bytes(encoded.data);
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        setError(`圖片壓縮後仍超過 ${Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB 上限，請改用 JPG／PNG 格式再試。`);
        return;
      }

      const response = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [encoded], mode: analysisMode }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || `分析失敗（HTTP ${response.status}）。`);
      }
      const analysis = body as AnalyzeListingResult;
      setResult(analysis);
      void loadLocationContext(analysis);
    } catch (err: any) {
      setError(err?.message || "圖片分析失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const analyzeCommute = async () => {
    const destination = commuteDestination.trim();
    const firstWalk = locationContext?.stationWalks[0];
    const fallbackStation = result?.extracted.station.split(/[,，]/).map(v => v.trim()).find(Boolean);
    const originStation = firstWalk?.station || fallbackStation;
    if (!destination || !originStation || commuteLoading) return;

    setCommuteLoading(true);
    setCommuteError(null);
    setCommute(null);

    try {
      const response = await fetch("/api/listing-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "commute",
          originStation,
          originWalkMinutes: firstWalk?.normalMinutes || 0,
          addressContext: result?.extracted.address || "",
          destination,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "通勤路線暫時無法取得。");
      if (!body?.found) throw new Error(body?.message || "目前查不到這條通勤路線。");
      setCommute(body.commute as ListingCommuteResult);
    } catch (err: any) {
      setCommuteError(err?.message || "通勤路線暫時無法取得。");
    } finally {
      setCommuteLoading(false);
    }
  };

  const extracted = result?.extracted;
  const parsed = result?.parsed;
  const rent = parsed?.rent ?? null;
  const managementFee = parsed?.managementFee ?? 0;
  const totalMonthlyCost = rent !== null ? rent + managementFee : null;
  const initialCost = result?.initialCostEstimate || (result ? buildClientInitialCost(result) : null);

  const stationSummary = extracted?.station
    ? extracted.station.split(/[,，]/).map(s => s.trim()).filter(Boolean).join("、")
    : null;

  const parsedArea = parsed?.area ?? parseArea(extracted?.area);
  const displayArea = parsedArea
    ? `${parsedArea} ㎡（約 ${(parsedArea / 3.30578).toFixed(1)} 坪）`
    : extracted?.area || null;

  const displayStructure =
    parsed?.structure ||
    normalizeStructure(extracted?.structure) ||
    extracted?.structure ||
    null;

  const rawShikibiki =
    extracted?.shikibiki ||
    extracted?.deposit?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0] ||
    extracted?.specialNotes?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0] ||
    "";
  const formattedShikibiki = formatShikibiki(rawShikibiki);
  const hasShikibiki = Boolean(formattedShikibiki);
  const hasPenalty = Boolean(
    extracted?.cancellationPenalty &&
      !/^(?:なし|無|0|-|ー|―)$/i.test(extracted.cancellationPenalty.trim())
  );
  const hasRenewal = Boolean(
    extracted?.renewalFee &&
      !/^(?:なし|無|0|-|ー|―)$/i.test(extracted.renewalFee.trim())
  );

  const cleanVerdictDetail = result?.verdict?.detail
    ? result.verdict.detail
        .replace(/^這個地區與房型的行情約[^\u3002]*\u3002\s*/, "")
        .replace(/^同車站同房型成約[^\u3002]*\u3002\s*/, "")
        .trim()
    : "";

  const isSaleListing =
    result?.dealType === "sale" ||
    Boolean(result?.saleAnalysis) ||
    Boolean(result?.parsed?.salePrice && result.parsed.salePrice >= 10000000);
  const saleAnalysis = result?.saleAnalysis || (result ? buildClientSaleAnalysis(result) : null);
  const buildingName = (customBuildingName !== "" ? customBuildingName : (extracted?.buildingName || "")).trim();
  // Google 智慧容錯直達（以 site:mansion-review.jp 搜尋，徹底解決平假名／片假名／漢字登錄差異與 Brave 檔腳本問題）
  const googleMansionReviewUrl = buildingName
    ? `https://www.google.com/search?q=${encodeURIComponent('site:mansion-review.jp ' + buildingName)}`
    : null;
  // Mansion Review 站內乾淨搜尋（移除易出錯的 direct_search_mname=1）
  const mansionReviewDirectUrl = buildingName
    ? `https://www.mansion-review.jp/mansion/?mname=${encodeURIComponent(buildingName)}&search=1`
    : null;
  // SUUMO 同棟大樓中古行情搜尋
  const suumoBuildingUrl = buildingName
    ? `https://suumo.jp/ms/chuko/tokyo/city/?keyword=${encodeURIComponent(buildingName)}`
    : null;
  // LIFULL HOME'S 同棟大樓搜尋
  const homesBuildingUrl = buildingName
    ? `https://www.homes.co.jp/mansion/b-list/?keyword=${encodeURIComponent(buildingName)}`
    : null;

  return (
    <section className="border border-[#1A2A22] bg-white p-6 font-sans md:p-8" aria-label="物件圖紙分析">
      {/* 區塊頂部標題 */}
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174]">
        <Sparkles className="h-4 w-4" /> Listing Sheet Analysis
      </div>
      <h3 className="mb-2 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
        物件圖紙分析・全面健檢與數值行情預測
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-[#3F5147]">
        上傳仲介提供的物件概要書或図面（單張圖紙或 PDF 均可）。<strong>系統由 AI 自動辨識「租屋圖紙」或「買賣圖紙」</strong>，深度分析市場實價行情、每坪單價、持有成本與修繕基金合理性、初期費用試算及生活機能地圖。
      </p>

      {/* 隱藏的檔案上傳 input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 現代化拖曳上傳 Dropzone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-[#00a174] bg-[#e6f6f1]"
              : "border-[#AAB8B0] bg-[#FAFCFB] hover:border-[#00a174] hover:bg-[#F2F8F5]"
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f6f1] text-[#007d5a] transition-transform duration-200 group-hover:scale-110">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-base font-bold text-[#1A2A22]">
            點擊選擇圖紙，或將圖紙直接拖曳至此
          </p>
          <p className="mt-1 text-xs text-[#66736C]">
            支援單張日本不動產概要書（租賃物件・中古公寓買賣・投資收租圖紙均可）、照片或 PDF 檔案
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-[#486355]">
            <span className="bg-[#EAEFEA] px-2 py-0.5">JPG / PNG</span>
            <span className="bg-[#EAEFEA] px-2 py-0.5">WEBP / HEIC</span>
            <span className="bg-[#EAEFEA] px-2 py-0.5">PDF</span>
            <span className="ml-1 text-[11px] text-[#66736C]">（自動最佳化，不留存個人資料）</span>
          </div>
        </div>
      ) : (
        /* 檔案已選取之卡片狀態 */
        <div className="border border-[#1A2A22] bg-[#FAFCFB] p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 overflow-hidden">
              {previewUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#DDE3DF] bg-white">
                  <img src={previewUrl} alt="圖紙預覽" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#DDE3DF] bg-[#e6f6f1] text-[#007d5a]">
                  <FileText className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-[#e6f6f1] px-2 py-0.5 text-[10px] font-bold text-[#007d5a]">
                    <CheckCircle2 className="h-3 w-3" /> 圖紙已就緒
                  </span>
                  <span className="text-[11px] text-[#66736C]">{formatFileSize(file.size)}</span>
                </div>
                <p className="mt-1 truncate text-sm font-bold text-[#1A2A22]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-[#66736C]">
                  AI 智慧自動辨識（自動區分租賃或買賣分析）
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-1.5 border border-[#AAB8B0] bg-white px-3.5 py-2 text-xs font-bold text-[#1A2A22] transition-colors hover:bg-[#F2F5F3] disabled:opacity-45"
              >
                <RefreshCw className="h-3.5 w-3.5" /> 更換圖紙
              </button>
              <button
                type="button"
                onClick={removeFile}
                disabled={loading}
                aria-label="移除圖紙"
                className="flex items-center gap-1.5 border border-[#E94E2B] bg-white px-3 py-2 text-xs font-bold text-[#B13818] transition-colors hover:bg-[#FBDFD2] disabled:opacity-45"
              >
                <Trash2 className="h-3.5 w-3.5" /> 移除
              </button>
            </div>
          </div>

          {/* 開始分析按鈕 */}
          <div className="mt-4 border-t border-[#DDE3DF] pt-4">
            <button
              type="button"
              onClick={analyze}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 bg-[#18181B] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>正在由 AI 深度解讀圖紙各項數值、條款與特約…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#00a174]" />
                  <span>開始物件圖紙全面健檢與數值分析</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 錯誤提示 */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 border border-[#E94E2B] bg-[#FBDFD2] p-3.5 text-xs text-[#B13818]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* 分析結果呈現區塊 */}
      {result && (
        <div className="mt-8 space-y-6 border-t-2 border-[#1A2A22] pt-6">
          {/* 結果頂部 Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A2A22] p-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00a174] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {isSaleListing ? "買賣分析完成" : "租賃健檢完成"}
                </span>
                <span className="text-xs text-[#AAB8B0]">AI 圖紙結構化分析</span>
              </div>
              <p className="mt-1 text-base font-bold">
                {stationSummary ? `${stationSummary}駅周邊` : (isSaleListing ? "日本買賣公寓" : "日本租賃物件")}
                {extracted?.layout ? `・${extracted.layout}` : ""}
                {displayArea ? `・${displayArea}` : ""}
                {displayStructure ? `・${displayStructure}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSaleListing ? (
                saleAnalysis?.mlitComparison && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 國交省成約中位判定 */}
                    <span className={`border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                      saleAnalysis.mlitComparison.verdict === "bargain"
                        ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                        : saleAnalysis.mlitComparison.verdict === "premium"
                        ? "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]"
                        : "border-[#9ee2cf] bg-[#f2faf7] text-[#007d5a]"
                    }`}>
                      國交省實價成約：{saleAnalysis.mlitComparison.verdictText}
                      {saleAnalysis.mlitComparison.rawDiffPercent != null && ` (${saleAnalysis.mlitComparison.rawDiffPercent >= 0 ? "+" : ""}${saleAnalysis.mlitComparison.rawDiffPercent.toFixed(1)}%)`}
                    </span>

                    {/* 市場開價判定 */}
                    {saleAnalysis.mlitComparison.listingVerdictText && (
                      <span className={`border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                        saleAnalysis.mlitComparison.listingVerdict === "below"
                          ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                          : saleAnalysis.mlitComparison.listingVerdict === "above"
                          ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
                          : "border-[#9ee2cf] bg-[#f2faf7] text-[#007d5a]"
                      }`}>
                        市場開價：{saleAnalysis.mlitComparison.listingVerdictText}
                        {saleAnalysis.mlitComparison.listingDiffPercent != null && ` (${saleAnalysis.mlitComparison.listingDiffPercent >= 0 ? "+" : ""}${saleAnalysis.mlitComparison.listingDiffPercent.toFixed(1)}%)`}
                      </span>
                    )}
                  </div>
                )
              ) : (
                result.verdict && (
                  <span className={`border px-3 py-1 text-xs font-black uppercase tracking-wider ${getStatusStyle(result.verdict.status).badge}`}>
                    行情判定：{result.verdict.status}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 建物名稱・實價歷史即時核對區塊 */}
          {buildingName && (
            <div className="border border-[#1A2A22]/20 bg-gradient-to-r from-[#F9FBFA] via-[#F4F8F6] to-[#EEF5F1] p-4 sm:p-5 shadow-xs transition-all">
              <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
                {/* 建物名稱輸入與編輯 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-[#1A2A22] px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                      <Building className="h-3 w-3 text-[#00a174]" /> 建物名稱・同棟歷史價格核對
                    </span>
                    <span className="text-[11px] text-[#66736C]">（支援即時手動修改以精準搜尋）</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customBuildingName}
                        onChange={(e) => setCustomBuildingName(e.target.value)}
                        placeholder="請輸入或修改建物名稱..."
                        className="w-full border-2 border-[#1A2A22]/30 bg-white px-3 py-2 text-sm font-bold text-[#1A2A22] shadow-2xs transition-colors focus:border-[#00a174] focus:outline-none focus:ring-2 focus:ring-[#00a174]/20"
                      />
                      {customBuildingName !== extracted?.buildingName && extracted?.buildingName && (
                        <button
                          type="button"
                          onClick={() => setCustomBuildingName(extracted.buildingName || "")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F2F5F3] px-2 py-0.5 text-[11px] font-bold text-[#007d5a] hover:bg-[#e6f6f1] transition-colors"
                        >
                          還原圖紙名稱
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 搜尋跳轉按鈕組 */}
                <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
                  {/* 首選：Google 智慧直達（最強容錯假名/漢字/英日文差異） */}
                  {googleMansionReviewUrl && (
                    <a
                      href={googleMansionReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 bg-[#00a174] px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-[#008761] hover:shadow cursor-pointer"
                      title="透過 Google 智慧容錯直達 Mansion Review 大樓歷史頁面，自動處理漢字（如住利）、平假名（如すみとし）與別名出入"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Google 智慧直達同棟（推薦・容錯）</span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-90" />
                    </a>
                  )}

                  {/* 次選：Mansion Review 站內直接搜尋 */}
                  {mansionReviewDirectUrl && (
                    <a
                      href={mansionReviewDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 border border-[#1A2A22] bg-white px-3.5 py-2 text-xs font-bold text-[#1A2A22] transition-colors hover:bg-[#F2F5F3] cursor-pointer"
                      title="於マンションレビュー進行站內直接搜尋"
                    >
                      <span>Mansion Review 站內</span>
                      <ExternalLink className="h-3 w-3 text-[#66736C]" />
                    </a>
                  )}

                  {/* 第三方備援：SUUMO / HOME'S */}
                  {suumoBuildingUrl && (
                    <a
                      href={suumoBuildingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1 border border-[#DDE3DF] bg-white px-2.5 py-2 text-xs font-semibold text-[#486355] transition-colors hover:bg-[#F9FBFA] cursor-pointer"
                      title="於 SUUMO 查詢此大樓中古待售與歷史紀錄"
                    >
                      <span>SUUMO</span>
                      <ExternalLink className="h-2.5 w-2.5 text-[#8A9590]" />
                    </a>
                  )}

                  {homesBuildingUrl && (
                    <a
                      href={homesBuildingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1 border border-[#DDE3DF] bg-white px-2.5 py-2 text-xs font-semibold text-[#486355] transition-colors hover:bg-[#F9FBFA] cursor-pointer"
                      title="於 LIFULL HOME'S 查詢此大樓"
                    >
                      <span>HOME'S</span>
                      <ExternalLink className="h-2.5 w-2.5 text-[#8A9590]" />
                    </a>
                  )}
                </div>
              </div>

              {/* 貼心說明備註 */}
              <div className="mt-3 flex items-start gap-2 border-t border-[#DDE3DF]/70 pt-2.5 text-[11px] leading-relaxed text-[#3F5147]">
                <Info className="h-3.5 w-3.5 shrink-0 text-[#007d5a] mt-0.5" />
                <p>
                  <strong>日本大樓登錄名稱特性：</strong>日本不動產大樓名稱在圖紙（図面）與網路各大資料庫登記時，常有<strong>漢字／平假名／片假名</strong>差異（例如本案圖紙標示「住利」，Mansion Review 等網站常登錄為「すみとし」；亦常見本館／住吉館／塔樓英日文寫法不同）。若站內直接搜尋未命中，強烈建議點擊<strong>「Google 智慧直達同棟（推薦・容錯）」</strong>（具備自然語言搜尋與別名對照，可精準直達該棟行情），亦可直接在左側修改名稱後重新點擊。
                </p>
              </div>
            </div>
          )}

          {/* 條件分支：買賣圖紙視角 VS 租賃圖紙視角 */}
          {isSaleListing && saleAnalysis ? (
            <>
              {/* 模組 S1：國土交通省成約實價 & 市場開價多維深度比對 */}
              {saleAnalysis.mlitComparison && (
                <div className="border border-[#1A2A22]/20 bg-white p-5 sm:p-6 shadow-sm">
                  {/* 區塊標題與區域規格 */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-[#1A2A22] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          <Scale className="h-3 w-3 text-[#00a174]" /> 實價與市場行情客觀對比
                        </span>
                        <h4 className="text-base font-black text-[#1A2A22]">
                          {saleAnalysis.mlitComparison.region}
                          {saleAnalysis.mlitComparison.district}・{saleAnalysis.mlitComparison.layout}中古公寓成約基準
                        </h4>
                      </div>
                      <p className="mt-1 text-xs text-[#66736C]">
                        同步客觀比對【本案圖紙賣價】、【國土交通省實價登錄成約價】與【現在市場在售公開開價】三大真實數據。
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {saleAnalysis.mlitComparison.rawDiffPercent != null && (
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                          saleAnalysis.mlitComparison.rawDiffPercent > 10
                            ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
                            : saleAnalysis.mlitComparison.rawDiffPercent < -5
                            ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                            : "border-[#DDE3DF] bg-[#FFF9ED] text-[#7A5A1F]"
                        }`}>
                          相對實價登錄：{saleAnalysis.mlitComparison.rawDiffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.rawDiffPercent.toFixed(1)}%
                        </span>
                      )}
                      {saleAnalysis.mlitComparison.listingDiffPercent != null && (
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                          saleAnalysis.mlitComparison.listingDiffPercent > 10
                            ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
                            : saleAnalysis.mlitComparison.listingDiffPercent < -5
                            ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                            : "border-[#DDE3DF] bg-[#FFF9ED] text-[#7A5A1F]"
                        }`}>
                          相對在售行情：{saleAnalysis.mlitComparison.listingDiffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.listingDiffPercent.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 核心三柱比對卡片矩陣：圖紙賣價 VS 實價登錄 VS 現在市場在售行情 */}
                  <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
                    {/* 柱 1：本案圖紙賣價 (待檢驗目標) */}
                    <div className="flex flex-col justify-between border-2 border-[#1A2A22] bg-[#FAFBFB] p-4 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-[#1A2A22] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                            📍 本案圖紙賣價
                          </span>
                          <span className="text-[10px] font-bold text-[#1A2A22]">圖紙公開開價</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-2xl font-black text-[#1A2A22] font-mono">
                            {saleAnalysis.salePriceMan.toLocaleString()}
                            <span className="text-sm font-bold text-[#66736C]"> 萬円</span>
                          </p>
                        </div>

                        <div className="mt-2 text-xs font-bold text-[#1A2A22] space-y-0.5">
                          {saleAnalysis.tsuboAndSqm.tsuboPriceMan != null && (
                            <p className="text-[11px] text-[#3F5147]">
                              每坪約 <span className="font-mono font-black">{saleAnalysis.tsuboAndSqm.tsuboPriceMan.toFixed(1)}</span> 萬円
                            </p>
                          )}
                          {saleAnalysis.tsuboAndSqm.sqmPriceYen != null && (
                            <p className="text-[11px] text-[#66736C]">
                              每㎡約 <span className="font-mono">{Math.round(saleAnalysis.tsuboAndSqm.sqmPriceYen / 10000)}</span> 萬円
                              {saleAnalysis.areaSqm ? `（專有面積 ${saleAnalysis.areaSqm}㎡）` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-[#DDE3DF]/60 pt-2.5 text-[10px] text-[#66736C] space-y-0.5">
                        <p className="font-medium text-[#1A2A22]">
                          ※ 仲介銷售図面（Maisoku）標示之開價總額，為本次比對分析目標。
                        </p>
                      </div>
                    </div>

                    {/* 柱 2：國土交通省 官方實價登錄成約基準 */}
                    <div className="flex flex-col justify-between border-2 border-[#00a174]/40 bg-[#F4FBF8] p-4 shadow-2xs transition-all hover:border-[#00a174]">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-[#00a174] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                            🏛️ 國交省實價登錄
                          </span>
                          <span className="text-[10px] font-bold text-[#007d5a]">官方真實成約中位</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-2xl font-black text-[#007d5a] font-mono">
                            約 {saleAnalysis.mlitComparison.medianPriceMan?.toLocaleString()}
                            <span className="text-sm font-bold text-[#007d5a]/70"> 萬円</span>
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {saleAnalysis.mlitComparison.rawDiffPercent != null && (
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-black ${
                              saleAnalysis.mlitComparison.rawDiffPercent > 10
                                ? "bg-[#FBDFD2] text-[#B13818]"
                                : saleAnalysis.mlitComparison.rawDiffPercent < -5
                                ? "bg-[#e6f6f1] text-[#007d5a]"
                                : "bg-[#FFF9ED] text-[#7A5A1F]"
                            }`}>
                              本案開價 {saleAnalysis.mlitComparison.rawDiffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.rawDiffPercent.toFixed(1)}%
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-[#66736C]">
                            {saleAnalysis.mlitComparison.verdictText}
                          </span>
                        </div>

                        {/* 平米單價換算本案面積 */}
                        {saleAnalysis.mlitComparison.medianSqmPriceYen && saleAnalysis.areaSqm && (
                          <div className="mt-2.5 border-t border-[#9ee2cf]/60 pt-2 text-[11px] text-[#007d5a]">
                            <span className="font-semibold text-[#1A2A22]">
                              依本案 {saleAnalysis.areaSqm}㎡ 單價換算：
                            </span>
                            <span className="font-bold text-[#007d5a] ml-1">
                              約 {Math.round((saleAnalysis.mlitComparison.medianSqmPriceYen * saleAnalysis.areaSqm) / 10000).toLocaleString()} 萬円
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 border-t border-[#9ee2cf]/60 pt-2.5 text-[10px] text-[#66736C] space-y-0.5">
                        <p>
                          樣本統計：{saleAnalysis.mlitComparison.sampleCount != null ? `${saleAnalysis.mlitComparison.sampleCount} 筆成約` : "多筆成交"}
                          {saleAnalysis.mlitComparison.periodStart && saleAnalysis.mlitComparison.periodEnd
                            ? ` (${saleAnalysis.mlitComparison.periodStart}～${saleAnalysis.mlitComparison.periodEnd})`
                            : ""}
                        </p>
                        <p className="text-[#8A9590]">
                          ※ 官方過戶成交紀錄，無仲介或賣方開價灌水。
                        </p>
                      </div>
                    </div>

                    {/* 柱 3：市場在售公開刊登開價基準 */}
                    <div className="flex flex-col justify-between border-2 border-[#DCC8A1] bg-[#FFFCF7] p-4 shadow-2xs transition-all hover:border-[#C4AF82]">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-[#DCC8A1] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#7A5A1F]">
                            🏷️ 現在市場在售行情
                          </span>
                          <span className="text-[10px] font-bold text-[#7A5A1F]">同區市面刊登平均</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-2xl font-black text-[#7A5A1F] font-mono">
                            約 {saleAnalysis.mlitComparison.typicalListingPriceMan?.toLocaleString()}
                            <span className="text-sm font-bold text-[#7A5A1F]/70"> 萬円</span>
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {saleAnalysis.mlitComparison.listingDiffPercent != null && (
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-black ${
                              saleAnalysis.mlitComparison.listingDiffPercent > 10
                                ? "bg-[#FBDFD2] text-[#B13818]"
                                : saleAnalysis.mlitComparison.listingDiffPercent < -5
                                ? "bg-[#e6f6f1] text-[#007d5a]"
                                : "bg-[#FFF9ED] text-[#7A5A1F]"
                            }`}>
                              本案開價 {saleAnalysis.mlitComparison.listingDiffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.listingDiffPercent.toFixed(1)}%
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-[#7A5A1F]">
                            {saleAnalysis.mlitComparison.listingVerdictText || "高於典型開價"}
                          </span>
                        </div>

                        <div className="mt-2.5 border-t border-[#DCC8A1]/60 pt-2 text-[11px] text-[#7A5A1F]">
                          <p>
                            {saleAnalysis.mlitComparison.listingBenchmarkSourceUrl ? (
                              <a
                                href={saleAnalysis.mlitComparison.listingBenchmarkSourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold underline decoration-[#DCC8A1] underline-offset-2"
                              >
                                {saleAnalysis.mlitComparison.listingBenchmarkSourceLabel} {saleAnalysis.mlitComparison.listingBenchmarkPeriod}
                              </a>
                            ) : (
                              <span>{saleAnalysis.mlitComparison.listingBenchmarkSourceLabel} {saleAnalysis.mlitComparison.listingBenchmarkPeriod}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-[#DCC8A1]/60 pt-2.5 text-[10px] text-[#66736C] space-y-0.5">
                        <p>
                          三大在售核對：{" "}
                          {publicSaleMarketCrossChecks.map((source, index) => (
                            <span key={source.label}>
                              {index > 0 ? "・" : ""}
                              <a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-[#007d5a] underline underline-offset-2">
                                {source.label}
                              </a>
                            </span>
                          ))}
                        </p>
                        <p className="text-[#8A9590]">
                          ※ 房產入口網賣方開價，通常隱含 5~10% 開價議價空間。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 視覺化價格光譜橫條 (Price Spectrum Gauge) */}
                  <div className="mt-5 border border-[#DDE3DF] bg-[#FAFBFB] p-4.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1A2A22]">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="h-4 w-4 text-[#007d5a]" /> 三大價格維度定位對比
                      </span>
                      <span className="text-[11px] text-[#66736C]">圖紙賣價 vs 實價登錄成約價 vs 現在在售開價</span>
                    </div>

                    {/* 光譜長條圖 */}
                    <div className="mt-3.5 relative">
                      {/* 背景光譜軌道 */}
                      <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#e6f6f1] via-[#FFF9ED] to-[#FBDFD2] relative overflow-hidden" />

                      {/* 3 個關鍵價格標記 */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-center">
                        {/* 國交省成約 */}
                        <div className="border-l-2 border-[#00a174] pl-2 text-left bg-[#F4FBF8] p-2 rounded-r">
                          <p className="text-[10px] text-[#007d5a] font-bold">🏛️ 國交省實價登錄</p>
                          <p className="text-xs font-black text-[#1A2A22]">
                            約 {saleAnalysis.mlitComparison.medianPriceMan} 萬円
                          </p>
                          <p className="text-[10px] text-[#66736C]">官方成交中位數</p>
                        </div>

                        {/* 市場在售開價 */}
                        {saleAnalysis.mlitComparison.typicalListingPriceMan && (
                          <div className="border-l-2 border-[#DCC8A1] pl-2 text-left bg-[#FFFCF7] p-2 rounded-r">
                            <p className="text-[10px] text-[#7A5A1F] font-bold">🏷️ 現在市場在售開價</p>
                            <p className="text-xs font-black text-[#1A2A22]">
                              約 {saleAnalysis.mlitComparison.typicalListingPriceMan} 萬円
                            </p>
                            <p className="text-[10px] text-[#66736C]">門戶網站刊登平均</p>
                          </div>
                        )}

                        {/* 本案開價 */}
                        <div className="border-l-2 border-[#B13818] pl-2 text-left bg-[#FBDFD2]/40 p-2 rounded-r">
                          <p className="text-[10px] font-black text-[#B13818]">📍 本案圖紙賣價</p>
                          <p className="text-xs font-black text-[#B13818]">
                            {saleAnalysis.salePriceMan} 萬円
                            {saleAnalysis.mlitComparison.rawDiffPercent != null && ` (+${saleAnalysis.mlitComparison.rawDiffPercent.toFixed(1)}%)`}
                          </p>
                          <p className="text-[10px] text-[#B13818]">待健檢開價目標</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linus 深度行情解讀 Card - 結構化分列點呈現 */}
                  {(() => {
                    const insightItems = getInsightBulletItems(saleAnalysis.mlitComparison);
                    const standardItems = insightItems.filter(item => item.iconType !== "advice");
                    const adviceItem = insightItems.find(item => item.iconType === "advice");

                    return (
                      <div className="mt-4 border-l-4 border-[#00a174] border-t border-r border-b border-[#9ee2cf] bg-[#F7FCFA] p-4 sm:p-5">
                        {/* 頂部 Header */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF]/70 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a174]/15 text-[#007d5a]">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#007d5a]">
                              Linus 實價行情深度解讀
                            </h4>
                          </div>

                          <span
                            className={`inline-flex self-start rounded border px-2.5 py-0.5 text-[11px] font-bold ${
                              saleAnalysis.mlitComparison.verdict === "bargain"
                                ? "border-[#9ee2cf] bg-white text-[#007d5a]"
                                : saleAnalysis.mlitComparison.verdict === "premium"
                                ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
                                : "border-[#DDE3DF] bg-white text-[#1A2A22]"
                            }`}
                          >
                            實價成約判定：{saleAnalysis.mlitComparison.verdictText}
                          </span>
                        </div>

                        {/* 分列點清單 (Bullet Items) */}
                        <div className="mt-3.5 space-y-2.5">
                          {standardItems.map((item) => {
                            const isVerdict = item.iconType === "verdict";
                            const isFactor = item.iconType === "factor";
                            const isMarket = item.iconType === "market";

                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-2.5 rounded bg-white p-3 border border-[#E3ECE7] transition-all hover:border-[#9ee2cf]"
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isVerdict && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e6f6f1] text-[#007d5a]">
                                      <Target className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  {isFactor && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#F0F4F2] text-[#3F5147]">
                                      <Scale className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  {isMarket && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#F5F8F6] text-[#66736C]">
                                      <Store className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                        isVerdict
                                          ? "bg-[#e6f6f1] text-[#007d5a]"
                                          : isFactor
                                          ? "bg-[#F0F4F2] text-[#3F5147]"
                                          : "bg-[#F5F8F6] text-[#66736C]"
                                      }`}
                                    >
                                      {item.tag}
                                    </span>
                                    {item.title && (
                                      <span className="text-xs font-bold text-[#1A2A22]">
                                        {item.title}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs leading-relaxed text-[#2D3E35]">
                                    {item.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 壓軸亮點：Linus 實務談判建議 (琥珀金微光卡片) */}
                        {adviceItem && (
                          <div className="mt-3 border-l-4 border-[#C18714] border border-[#DCC8A1] bg-[#FFFDF8] p-3.5 sm:p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#A87212]">
                              <Lightbulb className="h-4 w-4 text-[#C18714] shrink-0" />
                              <span>{adviceItem.tag}：{adviceItem.title || "出價與談判攻防建議"}</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#7A5A1F]">
                              {adviceItem.text}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 價格校準因子明細透明展開 */}
                  {saleAnalysis.mlitComparison.priceFactors && saleAnalysis.mlitComparison.priceFactors.length > 0 && (
                    <div className="mt-4 border border-[#DDE3DF] bg-white p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF]/60 pb-2.5">
                        <p className="text-xs font-bold text-[#1A2A22]">
                          價格校準因子明細（基準：{saleAnalysis.mlitComparison.district}・{saleAnalysis.mlitComparison.layout}成約中位 {saleAnalysis.mlitComparison.medianPriceMan} 萬円）
                        </p>
                        <span className="text-[10px] text-[#66736C]">
                          成約資料期間：{saleAnalysis.mlitComparison.periodStart}～{saleAnalysis.mlitComparison.periodEnd}・{saleAnalysis.mlitComparison.sampleCount} 筆樣本
                        </span>
                      </div>

                      {saleAnalysis.mlitComparison.areaBasisNote && (
                        <p className="mt-2 text-[11px] text-[#66736C]">{saleAnalysis.mlitComparison.areaBasisNote}</p>
                      )}

                      {saleAnalysis.mlitComparison.marketAgeBand && (
                        <p className="mt-1 text-[11px] text-[#66736C]">
                          屋齡已由同築年帶成交㎡單價控制
                          {saleAnalysis.mlitComparison.marketAgeBandScope === "district" ? "（同區跨房型備援）" : "（同區同房型）"}
                          {saleAnalysis.mlitComparison.marketAgeBandSampleCount != null ? `・分層樣本 ${saleAnalysis.mlitComparison.marketAgeBandSampleCount} 筆` : ""}
                          ；樣本不足時才回退到原本的屋齡係數。
                        </p>
                      )}

                      {/* 校準因子 Chips Grid */}
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {saleAnalysis.mlitComparison.priceFactors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between border border-[#ECEFEC] bg-[#FAFCFB] p-2 text-xs">
                            <span className="font-bold text-[#1A2A22]">{factor.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#66736C]">{factor.note}</span>
                              <span className={`font-black font-mono text-xs px-1.5 py-0.5 ${
                                factor.ratePercent > 0
                                  ? "bg-[#FBDFD2] text-[#B13818]"
                                  : factor.ratePercent < 0
                                  ? "bg-[#e6f6f1] text-[#007d5a]"
                                  : "bg-[#EAEFEA] text-[#66736C]"
                              }`}>
                                {factor.ratePercent >= 0 ? "+" : ""}{factor.ratePercent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {saleAnalysis.mlitComparison.rawDiffPercent != null && (
                        <p className="mt-3 border-t border-[#DDE3DF]/60 pt-2 text-[10px] text-[#66736C] leading-relaxed">
                          💡 <strong>條件加權試算說明：</strong>未考慮個別屋況時，本案開價相對分桶成交中位數為 {saleAnalysis.mlitComparison.rawDiffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.rawDiffPercent.toFixed(1)}%；該中位數涵蓋了不同面積與屋齡之成約。若進一步納入專有面積、車站步行與樓層等客觀條件加權試算，本案開價相對同條件行情區間仍偏高約 {saleAnalysis.mlitComparison.diffPercent != null && saleAnalysis.mlitComparison.diffPercent >= 0 ? "+" : ""}{saleAnalysis.mlitComparison.diffPercent?.toFixed(1)}%，買方具備實質議價折讓空間。
                        </p>
                      )}
                    </div>
                  )}

                  {/* 警示與資產評估 */}
                  {saleAnalysis.mlitComparison.priceCautions?.map((caution, index) => (
                    <div key={index} className="mt-3 flex items-start gap-2 border border-[#DCC8A1] bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#B13818] mt-0.5" />
                      <div>
                        <strong className="font-bold text-[#B13818]">注意：</strong> {caution}
                      </div>
                    </div>
                  ))}

                  {/* 車站徒步保值性 */}
                  {saleAnalysis.mlitComparison.stationWalkFactor && (
                    <div className="mt-3 flex items-start gap-2.5 border border-[#9ee2cf] bg-[#F4FBF8] p-3 text-xs text-[#3F5147]">
                      <Footprints className="h-4 w-4 shrink-0 text-[#007d5a] mt-0.5" />
                      <div>
                        <span className="font-bold text-[#1A2A22]">
                          車站徒步 {saleAnalysis.mlitComparison.stationWalkFactor.walkMinutes} 分資產流動性評估：
                        </span>
                        <span className="ml-1 leading-relaxed">{saleAnalysis.mlitComparison.stationWalkFactor.note}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 模組 S2：核心買賣數值 Hero 5-Card 網格 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007d5a]">
                  <Landmark className="h-4 w-4" /> 買賣核心指標與坪單價速覽
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {/* 1. 販売總價 */}
                  <div className="border-2 border-[#00a174] bg-[#f2faf7] p-4">
                    <p className="text-[11px] font-bold text-[#007d5a]">販売價格（總價）</p>
                    <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                      {saleAnalysis.salePriceMan.toLocaleString()}
                      <span className="text-sm font-bold text-[#007d5a]"> 萬円</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[#66736C]">
                      {formatYen(saleAnalysis.salePriceYen)}
                    </p>
                  </div>

                  {/* 2. 坪單價 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <p className="text-[11px] font-bold text-[#66736C]">每坪單價（坪単価）</p>
                    <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                      {saleAnalysis.tsuboAndSqm.tsuboPriceMan !== null
                        ? `${saleAnalysis.tsuboAndSqm.tsuboPriceMan.toFixed(1)}`
                        : "—"}
                      <span className="text-xs font-normal text-[#66736C]"> 萬円/坪</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[#66736C]">
                      {saleAnalysis.tsuboAndSqm.tsubo !== null
                        ? `專有約 ${saleAnalysis.tsuboAndSqm.tsubo.toFixed(2)} 坪`
                        : "依專有面積折算"}
                    </p>
                  </div>

                  {/* 3. 平米單價 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <p className="text-[11px] font-bold text-[#66736C]">每平米單價（㎡単価）</p>
                    <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                      {saleAnalysis.tsuboAndSqm.sqmPriceMan !== null
                        ? `${saleAnalysis.tsuboAndSqm.sqmPriceMan.toFixed(1)}`
                        : "—"}
                      <span className="text-xs font-normal text-[#66736C]"> 萬円/㎡</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[#66736C]">
                      {saleAnalysis.areaSqm ? `專有面積 ${saleAnalysis.areaSqm} ㎡` : "專有面積換算"}
                    </p>
                  </div>

                  {/* 4. 每月固定持有成本 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <p className="text-[11px] font-bold text-[#66736C]">每月固定持有支出</p>
                    <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                      {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyCost)}
                      <span className="text-xs font-normal text-[#66736C]"> / 月</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[#66736C]">
                      全年合計約 {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyCost * 12)}
                    </p>
                  </div>

                  {/* 5. 社區規模與屋齡 */}
                  <div className="border border-[#DDE3DF] bg-white p-4 sm:col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-bold text-[#66736C]">社區規模與屋齡</p>
                    <p className="mt-1 text-lg font-black text-[#1A2A22]">
                      {saleAnalysis.buildingHealth.totalUnits ? `${saleAnalysis.buildingHealth.totalUnits} 戶` : "—"}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#007d5a]">
                      {saleAnalysis.buildingHealth.scaleRiskText}
                    </p>
                    <p className="text-[10px] text-[#66736C]">
                      {extracted?.age || "建物屋齡"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 模組 S3：每月固定持有成本逐筆拆解與大樓健康度對比 */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 左側：每月固定持有負擔逐筆拆解 */}
                <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#DDE3DF] pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Coins className="h-4 w-4 text-[#007d5a]" />
                      <span>每月持有成本明細（管委會固定費用）</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#007d5a]">
                      月合計 {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyCost)}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-[#E8ECE9]">
                    {saleAnalysis.monthlyHoldingCosts.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <span className="font-bold text-[#1A2A22]">{item.name}</span>
                          <p className="text-[10px] text-[#66736C]">{item.note}</p>
                        </div>
                        <span className="font-black text-[#1A2A22]">{formatYen(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t-2 border-[#1A2A22] pt-2.5 text-xs">
                    <span className="font-black text-[#1A2A22]">全年持有現金流成本（12個月）：</span>
                    <span className="text-sm font-black text-[#007d5a]">
                      {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyCost * 12)} / 年
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-[#66736C]">
                    ※ 不含每年 5~6 月由地方政府課徵之固定資產稅・都市計畫稅（固都稅）。
                  </p>
                </div>

                {/* 右側：大樓修繕積立金水位與戶數規模風險診斷 */}
                <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#DDE3DF] pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Building className="h-4 w-4 text-[#007d5a]" />
                      <span>修繕積立金健康度與大樓風險審查</span>
                    </div>
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-bold ${
                        saleAnalysis.buildingHealth.reserveHealthLevel === "healthy"
                          ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                          : saleAnalysis.buildingHealth.reserveHealthLevel === "inadequate"
                          ? "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]"
                          : "border-[#D6EAF0] bg-[#F2F8FA] text-[#1A2A22]"
                      }`}
                    >
                      {saleAnalysis.buildingHealth.reserveHealthText}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3 text-xs">
                    {/* 每平米修繕金比率 */}
                    <div className="rounded border border-[#E8ECE9] bg-[#FAFCFB] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#66736C]">每平米每月修繕積立金：</span>
                        <span className="text-base font-black text-[#1A2A22]">
                          {saleAnalysis.buildingHealth.reservePerSqm
                            ? `¥${saleAnalysis.buildingHealth.reservePerSqm.toLocaleString()} / ㎡`
                            : "—"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#007d5a]">
                        國土交通省長期修繕計畫提撥基準：200 ～ 300 円/㎡/月
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-[#3F5147]">
                        {saleAnalysis.buildingHealth.reserveHealthNote}
                      </p>
                    </div>

                    {/* 戶數規模分析 */}
                    <div className="rounded border border-[#E8ECE9] bg-[#FAFCFB] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#66736C]">戶數規模風險：</span>
                        <span className="font-bold text-[#1A2A22]">
                          {saleAnalysis.buildingHealth.scaleRiskText}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#3F5147]">
                        {saleAnalysis.buildingHealth.scaleRiskNote}
                      </p>
                    </div>

                    {/* 維護亮點標籤 */}
                    {saleAnalysis.buildingHealth.specialStrengths.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-[#66736C]">大樓優勢認證：</span>
                        {saleAnalysis.buildingHealth.specialStrengths.map((str, i) => (
                          <span
                            key={i}
                            className="rounded bg-[#e6f6f1] px-2 py-0.5 text-[11px] font-bold text-[#007d5a]"
                          >
                            ✨ {str}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 模組 S4：物件現況、投資收益與自住法務要點 */}
              <div className="border border-[#1A2A22] bg-[#FAFCFB] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#007d5a]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#007d5a]">
                      物件現況・投資回報率與自住法務要點
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#1A2A22]">
                    現況判定：{saleAnalysis.occupancyAssessment.statusText}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {/* 現況與收益性 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <p className="text-xs font-bold text-[#1A2A22]">現況使用與收益分析</p>

                    {saleAnalysis.occupancyAssessment.status === "tenanted_investment" &&
                    saleAnalysis.occupancyAssessment.investmentYield ? (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded border border-[#00a174] bg-[#f2faf7] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[#007d5a] font-bold">表面利回り（Gross Yield）：</span>
                            <span className="text-xl font-black text-[#007d5a]">
                              {saleAnalysis.occupancyAssessment.investmentYield.grossYield.toFixed(2)}%
                            </span>
                          </div>
                          {saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated !== null && (
                            <div className="mt-1 flex items-center justify-between text-[11px]">
                              <span className="text-[#66736C]">扣除管修實質利回り（Net Yield）：</span>
                              <span className="font-bold text-[#1A2A22]">
                                約 {saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div>
                            <span className="text-[#66736C]">現況月租金收入：</span>
                            <p className="font-bold text-[#1A2A22]">
                              {formatYen(saleAnalysis.occupancyAssessment.investmentYield.monthlyRentYen)} / 月
                            </p>
                          </div>
                          <div>
                            <span className="text-[#66736C]">現況年間租金總額：</span>
                            <p className="font-bold text-[#1A2A22]">
                              {formatYen(saleAnalysis.occupancyAssessment.investmentYield.annualIncomeYen)} / 年
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 border-t border-[#E8ECE9] pt-2 text-[11px] leading-relaxed text-[#782610] bg-[#FFF5F2] p-2 border border-[#F8D2C5]">
                          ⚠️ <strong>帶租約物件注意事項：</strong>本物件為「オーナーチェンジ」，現有租客居住中，買方無法立即交屋自住。交屋時將全面承受現有普通賃貸借契約與押金返還義務。
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded border border-[#9ee2cf] bg-[#f2faf7] p-3">
                          <p className="font-bold text-[#007d5a]">
                            {saleAnalysis.occupancyAssessment.status === "vacant"
                              ? "✨ 空室／全室翻新完成物件"
                              : "🏠 現有屋主居住中（相談引渡）"}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#3F5147]">
                            {saleAnalysis.occupancyAssessment.status === "vacant"
                              ? "交屋後可隨時自住入住，或依目前市場行情重新招租，靈活性最高。"
                              : "交屋時點需配合現屋主搬遷協商，請於簽約前確認引渡猶予期日。"}
                          </p>
                        </div>

                        {extracted?.renovationDetails && (
                          <div className="rounded border border-[#E8ECE9] bg-[#FAFCFB] p-2.5">
                            <span className="font-bold text-[#1A2A22]">裝修與翻新內容（リノベーション）：</span>
                            <p className="mt-1 text-[11px] text-[#66736C]">{extracted.renovationDetails}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 自住法務要點與住宅貸款減稅門檻 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <p className="text-xs font-bold text-[#1A2A22]">產權形式與住宅貸款減稅資格審查</p>

                    <div className="mt-3 space-y-2 text-xs">
                      {/* 住宅貸款減稅檢核 */}
                      <div className="rounded border border-[#E8ECE9] bg-[#FAFCFB] p-3">
                        <div className="flex items-center gap-1.5 font-bold">
                          {saleAnalysis.occupancyAssessment.mortgageTaxEligible ? (
                            <span className="text-[#007d5a]">✅ 符合住宅貸款減稅主要面積門檻（50㎡）</span>
                          ) : (
                            <span className="text-[#7A5A1F]">ℹ️ 專有面積未達 50㎡（自住節稅留意）</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-[#3F5147]">
                          {saleAnalysis.occupancyAssessment.mortgageTaxNote}
                        </p>
                      </div>

                      {/* 土地權利 */}
                      <div className="flex items-center justify-between border-t border-[#E8ECE9] pt-2">
                        <span className="text-[#66736C]">土地權利形式：</span>
                        <span className="font-bold text-[#1A2A22]">
                          {extracted?.landRights || "所有權（所有権）"}
                        </span>
                      </div>

                      {/* 管理體制 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#66736C]">管理形態與公司：</span>
                        <span className="font-bold text-[#1A2A22]">
                          {extracted?.managementCompany
                            ? `${extracted.managementCompany}（${extracted?.managementStyle || "委託管理"}）`
                            : extracted?.managementStyle || "委託管理（日勤/巡迴）"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 規格明細總覽 */}
                <div className="mt-4 border-t border-[#DDE3DF] pt-3">
                  <p className="mb-2 text-xs font-bold text-[#1A2A22]">建物與物件規格清單</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-[#66736C]">格局（間取り）</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.layout || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">專有面積</dt>
                      <dd className="font-bold text-[#1A2A22]">{displayArea || "未標明"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">樓層／總階數</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.floor || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">建築年月／構造</dt>
                      <dd className="font-bold text-[#1A2A22]">
                        {extracted?.age || ""} {displayStructure ? `(${displayStructure})` : ""}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* 模組 S5：買方交屋初期諸費用深度試算 */}
              {saleAnalysis.initialCosts && (
                <div className="border border-[#1A2A22] bg-white p-5 md:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007d5a]">
                        <Wallet className="h-4 w-4" /> 買方交屋諸費用預測試算
                      </div>
                      <h4 className="mt-1 text-lg font-bold text-[#1A2A22]">
                        購屋自備款與法定規費預估
                      </h4>
                    </div>

                    <span className="inline-flex self-start border border-[#9ee2cf] bg-[#e6f6f1] px-3 py-1 text-xs font-bold text-[#007d5a]">
                      諸費用比率：約 {saleAnalysis.initialCosts.percentageOfPrice.toFixed(1)}%
                    </span>
                  </div>

                  {/* 總額預估 Banner */}
                  <div className="mt-4 flex flex-col justify-between gap-4 border border-[#9ee2cf] bg-[#e6f6f1] p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold text-[#007d5a]">買方交屋諸費用預估總額</p>
                      <p className="mt-1 text-2xl font-black text-[#1A2A22] md:text-3xl">
                        約 {formatYen(saleAnalysis.initialCosts.total)}
                      </p>
                      <p className="mt-1 text-xs text-[#3F5147]">
                        包含仲介手續費、產權登記稅、印花稅、火災保險等法定規費（約為總價之 6%～8%）
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSaleCostsDetails(!showSaleCostsDetails)}
                      className="flex shrink-0 items-center justify-center gap-1.5 border border-[#007d5a] bg-white px-4 py-2 text-xs font-bold text-[#007d5a] transition-colors hover:bg-[#d8f1e9] cursor-pointer"
                    >
                      {showSaleCostsDetails ? (
                        <>
                          <span>收合費用明細</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span>查看諸費用逐項拆解</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* 項目逐筆拆解表格 */}
                  {showSaleCostsDetails && (
                    <div className="mt-4 overflow-x-auto border border-[#DDE3DF]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]">
                          <tr>
                            <th className="p-2.5 font-bold">費用項目</th>
                            <th className="p-2.5 text-right font-bold">預估金額</th>
                            <th className="p-2.5 font-bold">計算標準與法定依據</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DDE3DF]">
                          {saleAnalysis.initialCosts.items.map(item => (
                            <tr key={item.id} className="hover:bg-[#FAFCFB]">
                              <td className="p-2.5 font-bold text-[#1A2A22]">{item.name}</td>
                              <td className="p-2.5 text-right font-bold text-[#007d5a]">
                                {formatYen(item.amount)}
                              </td>
                              <td className="p-2.5 text-[11px] text-[#66736C]">{item.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 border border-[#DCC8A1] bg-[#FFFDF8] p-4 text-xs leading-relaxed text-[#7A5A1F]">
                    <div className="mb-1 flex items-center gap-1.5 font-bold">
                      <Info className="h-4 w-4 text-[#C18714]" />
                      <span>Linus 買方資金準備提醒：</span>
                    </div>
                    <p>
                      買賣公寓時，海外買方除物件本體頭期款外，需預留約 <strong>6%～8% 之各項交屋規費</strong>。交屋時還需依日割清算當年度的固定資產稅與當月份的管理費、修繕積立金。
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 模組：大數據租金行情合理度診斷（置於月額負擔上方，排版洗鍊不重複） */}
              {result.verdict && (
                <div className={`border p-4 sm:p-5 ${getStatusStyle(result.verdict.status).box}`}>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${getStatusStyle(result.verdict.status).badge}`}>
                        行情診斷：{result.verdict.status}
                      </span>
                      <h4 className="text-sm font-bold text-[#1A2A22]">
                        {result.verdict.headline}
                      </h4>
                    </div>

                    {result.range && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#66736C]">同區公開刊登行情：</span>
                        <span className="font-bold text-[#1A2A22]">
                          {formatYen(result.range.low)} ～ {formatYen(result.range.high)}
                        </span>
                        <span className="rounded border border-[#DDE3DF] bg-white px-2 py-0.5 text-[11px] font-bold text-[#007d5a]">
                          中位數 {formatYen(result.range.median)}
                        </span>
                      </div>
                    )}
                  </div>

                  {result.range?.sourceUrl && (
                    <p className="mt-1 text-right text-[10px] text-[#66736C]">
                      來源：<a href={result.range.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#007d5a] underline underline-offset-2">
                        {result.range.sourceLabel || "At Home 公開租金行情"}
                      </a>
                      {result.range.sourceDate ? `・快照 ${result.range.sourceDate}` : ""}
                    </p>
                  )}

                  {cleanVerdictDetail && (
                    <p className="mt-2.5 border-t border-[#DDE3DF]/60 pt-2 text-xs leading-relaxed text-[#3F5147]">
                      💡 <strong>Linus 專業分析：</strong>{cleanVerdictDetail}
                    </p>
                  )}
                </div>
              )}

          {/* 模組 1：每月固定現金支出與條件個別明細 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007d5a]">
              <Coins className="h-4 w-4" /> 月額負擔與條件個別拆解
            </div>

            {/* 3 大金額重點卡片 */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* 每月總額（核心重點） */}
              <div className="border-2 border-[#00a174] bg-[#f2faf7] p-4">
                <p className="text-[11px] font-bold text-[#007d5a]">每月總負擔（總賃料）</p>
                <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                  {formatYen(totalMonthlyCost)}
                  <span className="text-xs font-normal text-[#66736C]"> / 月</span>
                </p>
                <p className="mt-1 text-[10px] text-[#007d5a]">房租 ＋ 管理費每月實付總額</p>
              </div>

              {/* 純房租 */}
              <div className="border border-[#DDE3DF] bg-white p-4">
                <p className="text-[11px] font-bold text-[#66736C]">純租金（賃料／家賃）</p>
                <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                  {formatYen(rent)}
                  <span className="text-xs font-normal text-[#66736C]"> / 月</span>
                </p>
                <p className="mt-1 text-[10px] text-[#66736C]">圖紙標示：{extracted?.rent || "—"}</p>
              </div>

              {/* 管理費／共益費 */}
              <div className="border border-[#DDE3DF] bg-white p-4">
                <p className="text-[11px] font-bold text-[#66736C]">管理費／共益費</p>
                <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                  {managementFee > 0 ? formatYen(managementFee) : "0 円"}
                  <span className="text-xs font-normal text-[#66736C]"> / 月</span>
                </p>
                <p className="mt-1 text-[10px] text-[#66736C]">
                  {managementFee > 0 ? `圖紙標示：${extracted?.managementFee || "—"}` : "已包含於租金中或免管理費"}
                </p>
              </div>
            </div>

            {/* 物件基本規格明細清單 */}
            <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-4">
              <p className="mb-3 text-xs font-bold text-[#1A2A22]">物件規格與契約條件</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-[#66736C]">禮金（礼金）</dt>
                  <dd className="font-bold text-[#1A2A22]">
                    {parsed?.keyMoney === 0 ? "0 個月（免禮金）" : (extracted?.keyMoney || "無標示")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">敷金（押金）</dt>
                  <dd className="font-bold text-[#1A2A22]">
                    {parsed?.deposit === 0 ? "0 個月（免押金）" : (extracted?.deposit || "無標示")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">格局（間取り）</dt>
                  <dd className="font-bold text-[#1A2A22]">{extracted?.layout || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">專有面積</dt>
                  <dd className="font-bold text-[#1A2A22]">
                    {displayArea || "未於圖面載明"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">最寄り駅・徒步</dt>
                  <dd className="font-bold text-[#1A2A22]">
                    {stationSummary ? `${stationSummary} 徒步 ${extracted?.walkTime || "—"} 分` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">屋齡／建築年月</dt>
                  <dd className="font-bold text-[#1A2A22]">{extracted?.age || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">樓層／總階數</dt>
                  <dd className="font-bold text-[#1A2A22]">{extracted?.floor || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#66736C]">建物構造</dt>
                  <dd className="font-bold text-[#1A2A22]">
                    {displayStructure || "未於圖面載明"}
                  </dd>
                </div>
              </dl>
              {extracted?.address && (
                <div className="mt-3 border-t border-[#E8ECE9] pt-2 text-xs">
                  <span className="text-[#66736C]">所在地：</span>
                  <span className="font-bold text-[#1A2A22]">{extracted.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* 模組 3：🎯 初期費用全面預測試算與深度分析 */}
          {initialCost && (
            <div className="border border-[#1A2A22] bg-white p-5 md:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007d5a]">
                    <Wallet className="h-4 w-4" /> 初期費用深度試算與分析
                  </div>
                  <h4 className="mt-1 text-lg font-bold text-[#1A2A22]">
                    簽約入住預估準備金
                  </h4>
                </div>

                <span className={`inline-flex self-start border px-3 py-1 text-xs font-bold ${
                  initialCost.level === "low"
                    ? "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
                    : initialCost.level === "high"
                    ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
                    : "border-[#D6EAF0] bg-[#F2F8FA] text-[#1A2A22]"
                }`}>
                  負擔評級：{initialCost.levelText}
                </span>
              </div>

              {/* 總額預估 Banner */}
              <div className="mt-4 flex flex-col justify-between gap-4 border border-[#9ee2cf] bg-[#e6f6f1] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold text-[#007d5a]">簽約初期總額預估區間</p>
                  <p className="mt-1 text-2xl font-black text-[#1A2A22] md:text-3xl">
                    {formatYen(initialCost.totalMin)} ～ {formatYen(initialCost.totalMax)}
                  </p>
                  <p className="mt-1 text-xs text-[#3F5147]">
                    約相當於月總租金的 <strong className="font-bold text-[#007d5a]">{initialCost.monthsMultipleMin} ～ {initialCost.monthsMultipleMax} 倍</strong>（取決於實際起租日與保證會社方案）
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInitialCostDetails(!showInitialCostDetails)}
                  className="flex shrink-0 items-center justify-center gap-1.5 border border-[#007d5a] bg-white px-4 py-2 text-xs font-bold text-[#007d5a] transition-colors hover:bg-[#d8f1e9]"
                >
                  {showInitialCostDetails ? (
                    <>
                      <span>收合費用明細</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>查看各項明細拆解</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* 項目逐筆拆解明細表格 */}
              {showInitialCostDetails && (
                <div className="mt-4 space-y-2">
                  <div className="overflow-x-auto border border-[#DDE3DF]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]">
                        <tr>
                          <th className="p-2.5 font-bold">費用項目</th>
                          <th className="p-2.5 font-bold">依據來源</th>
                          <th className="p-2.5 text-right font-bold">預估金額</th>
                          <th className="hidden p-2.5 font-bold md:table-cell">備註說明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DDE3DF]">
                        {initialCost.items.map(item => (
                          <tr key={item.id} className="hover:bg-[#FAFCFB]">
                            <td className="p-2.5 font-bold text-[#1A2A22]">{item.name}</td>
                            <td className="p-2.5">
                              {item.isFromFlyer ? (
                                <span className="inline-block bg-[#e6f6f1] px-1.5 py-0.5 text-[10px] font-bold text-[#007d5a]">
                                  圖紙載明
                                </span>
                              ) : (
                                <span className="inline-block bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-medium text-[#66736C]">
                                  市場常態預估
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-bold text-[#1A2A22]">
                              {formatYen(item.amount)}
                            </td>
                            <td className="hidden p-2.5 text-[11px] text-[#66736C] md:table-cell">
                              {item.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 手機版顯示備註折疊說明 */}
                  <div className="space-y-1 text-[11px] text-[#66736C] md:hidden">
                    {initialCost.items.map(item => (
                      <p key={item.id}>• <strong>{item.name}</strong>：{item.note}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Linus 專家審查與省錢避坑指南 */}
              {initialCost.tips.length > 0 && (
                <div className="mt-4 border border-[#DCC8A1] bg-[#FFFDF8] p-4 text-xs leading-relaxed text-[#7A5A1F]">
                  <div className="mb-1.5 flex items-center gap-1.5 font-bold">
                    <Info className="h-4 w-4 text-[#C18714]" />
                    <span>Linus 專業簽約與費用提醒：</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-[#684C15]">
                    {initialCost.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 模組 3：圖紙契約重要特約與法務注意事項（敷引、違約金、更新料、生活規範） */}
          <div className="border border-[#1A2A22] bg-[#FAFCFB] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#007d5a]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#007d5a]">
                  圖紙契約重要特約與法務注意事項
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#66736C]">
                日本租屋特約條款審查
              </span>
            </div>

            {/* 1. 敷引／償却（最關鍵法務警示） */}
            {hasShikibiki ? (
              <div className="mt-3.5 border-2 border-[#E94E2B] bg-[#FFF5F2] p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B13818]" />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#B13818] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        ⚠️ 關鍵條款警告
                      </span>
                      <strong className="text-sm font-black text-[#B13818]">
                        圖紙載有「敷引／償却」不退還約定：{formattedShikibiki}
                      </strong>
                    </div>
                    <p className="text-xs leading-relaxed text-[#782610]">
                      <strong>Linus 深度解析：</strong>
                      日本關西、中部與部分特定租賃契約會約定「敷引 / 償却」。雖然在圖面上寫在「敷金（押金）」欄位，但載明「{formattedShikibiki}」代表退租時該筆金額<strong>將被直接扣除沒收、絕不退還</strong>！其法律實質性質等同於「變相禮金」或「強制預收原狀恢復費」。這意味著搬走時這筆錢無法退回，初期預算應直接將其視為不可回收之沉沒成本。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex items-center gap-2.5 border border-[#9ee2cf] bg-[#f2faf7] p-3 text-xs text-[#007d5a]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="leading-relaxed">
                  <strong>敷引約定：</strong>圖紙未發現「敷引／償却」扣除條款。退租時敷金將依日本國交省《原狀恢復指南》，僅扣除承租人故意或過失之修繕費用，餘額全數退還。
                </p>
              </div>
            )}

            {/* 2. 違約金、更新料、保證會社條款網格 */}
            <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
              {/* 短期解約違約金 */}
              <div className="border border-[#DDE3DF] bg-white p-3.5">
                <p className="text-[11px] font-bold text-[#66736C]">短期解約違約金</p>
                <p className="mt-1 text-xs font-black text-[#1A2A22]">
                  {hasPenalty ? extracted?.cancellationPenalty : "未特別標註（依常態條款）"}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                  {hasPenalty
                    ? "⚠️ 注意：若在約定期限內提早解約搬家，需支付約定之違約金。"
                    : "日本多為 2 年期契約，通常約定未滿 1 年退租罰 1 個月租金，請簽約前再次核對重要事項說明書。"}
                </p>
              </div>

              {/* 契約更新料 */}
              <div className="border border-[#DDE3DF] bg-white p-3.5">
                <p className="text-[11px] font-bold text-[#66736C]">契約更新料</p>
                <p className="mt-1 text-xs font-black text-[#1A2A22]">
                  {hasRenewal ? extracted?.renewalFee : "每 2 年新租金 1 個月（常態）"}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                  每 2 年續約時支付給房東之更新謝禮；請留意仲介管理公司是否另收取更新事務手續費（通常約 0.25～0.5 個月）。
                </p>
              </div>

              {/* 保證公司利用 */}
              <div className="border border-[#DDE3DF] bg-white p-3.5">
                <p className="text-[11px] font-bold text-[#66736C]">保證會社與火災保險</p>
                <p className="mt-1 text-xs font-black text-[#1A2A22]">
                  {extracted?.guaranteeFee ? `保證料：${extracted.guaranteeFee}` : "外國籍利用必須"}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                  外國籍租客原則上必須加入日本家賃債務保證會社；除初回保證料外，次年起多有每年約 1 萬円之更新保證料。
                </p>
              </div>
            </div>

            {/* 3. 特約事項與生活限制備註 */}
            {extracted?.specialNotes && !/^(?:なし|無|0)$/i.test(extracted.specialNotes.trim()) && (
              <div className="mt-3 border border-[#DDE3DF] bg-white p-3.5">
                <p className="text-xs font-bold text-[#1A2A22]">圖紙其他特約・生活規範與備考事項：</p>
                <div className="mt-1.5 text-xs leading-relaxed text-[#3F5147] whitespace-pre-line bg-[#FAFCFB] p-2.5 border border-[#E8ECE9]">
                  {extracted.specialNotes}
                </div>
              </div>
            )}
          </div>
        </>
      )}

          {/* 模組 4：地理位置實況、真實步行時間比對與 1.2km 生活機能 */}
          <div className="border-t border-[#DDE3DF] pt-6">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00a174]" />
              <h4 className="text-sm font-bold text-[#1A2A22]">地址定位與周邊生活機能</h4>
            </div>

            {locationLoading && (
              <div className="flex items-center gap-2 bg-[#F5F8F6] p-3 text-xs text-[#66736C]">
                <LoaderCircle className="h-4 w-4 animate-spin" /> 正在定位地址並計算真實道路路徑…
              </div>
            )}

            {locationError && !locationLoading && (
              <p className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{locationError}</p>
            )}

            {locationContext && (
              <div className="space-y-4">
                {/* 定位地址標頭列 */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F5F8F6] p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#66736C]">定位地址：</span>
                    <span className="font-bold text-[#1A2A22]">{locationContext.matchedAddress}</span>
                  </div>
                  <a
                    className="font-bold text-[#007d5a] underline underline-offset-2 hover:text-[#005a41]"
                    href={`https://www.google.com/maps/search/?api=1&query=${locationContext.coordinate.lat},${locationContext.coordinate.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    在 Google Maps 開啟確認
                  </a>
                </div>

                {locationContext.notices?.map(notice => (
                  <p key={notice} className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{notice}</p>
                ))}

                {/* 實際步行時間比對：改為緊湊俐落的水平卡片，不再鬆散佔位 */}
                {locationContext.stationWalks.length > 0 && (
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                        <Footprints className="h-4 w-4 text-[#00a174]" />
                        <span>真實道路步行時間比對</span>
                      </div>
                      <span className="text-[10px] text-[#66736C]">依公開道路步行路徑計算</span>
                    </div>

                    <div className="space-y-2.5">
                      {locationContext.stationWalks.map(walk => (
                        <div
                          key={walk.station}
                          className={`flex flex-col justify-between gap-3 border p-3 transition-colors sm:flex-row sm:items-center ${
                            walk.needsAttention ? "border-[#DCC8A1] bg-[#FFFDF8]" : "border-[#E8ECE9] bg-[#FAFCFB]"
                          }`}
                        >
                          {/* 車站與距離 */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#1A2A22]">{walk.station}駅</span>
                              <span className="bg-white px-2 py-0.5 text-[10px] font-semibold text-[#66736C] border border-[#DDE3DF]">
                                約 {walk.distanceMeters.toLocaleString("zh-TW")}m
                              </span>
                            </div>
                            {walk.advertisedMinutes !== null && (
                              <p className={`mt-1 text-[11px] ${walk.needsAttention ? "font-bold text-[#7A5A1F]" : "text-[#66736C]"}`}>
                                圖紙標示 {walk.advertisedMinutes} 分；以一般速度計算
                                {walk.differenceMinutes && walk.differenceMinutes > 0
                                  ? `多約 ${walk.differenceMinutes} 分鐘`
                                  : "大致相符"}
                              </p>
                            )}
                          </div>

                          {/* 3 段速度緊湊膠囊 */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            <div className="border border-[#DDE3DF] bg-white px-2.5 py-1 text-center">
                              <span className="block text-[9px] text-[#66736C]">快步</span>
                              <span className="block text-xs font-bold text-[#1A2A22]">{walk.fastMinutes}分</span>
                            </div>
                            <div className="border border-[#00a174] bg-[#e6f6f1] px-3 py-1 text-center">
                              <span className="block text-[9px] font-bold text-[#007d5a]">一般常態</span>
                              <span className="block text-sm font-black text-[#007d5a]">{walk.normalMinutes}分</span>
                            </div>
                            <div className="border border-[#DDE3DF] bg-white px-2.5 py-1 text-center">
                              <span className="block text-[9px] text-[#66736C]">雨天/行李</span>
                              <span className="block text-xs font-bold text-[#1A2A22]">{walk.slowMinutes}分</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 互動地圖與周邊生活機能：將房屋與所有周邊設施直接標記在地圖上 */}
                <div className="border border-[#DDE3DF] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Store className="h-4 w-4 text-[#00a174]" />
                      <span>周邊 1.2 公里生活機能與互動地圖</span>
                    </div>
                    <span className="text-[10px] text-[#66736C]">點擊地圖標記可看名稱與距離</span>
                  </div>

                  {/* 核心組件：地圖視覺化標出本物件與所有周邊設施 */}
                  <ListingLocationMap context={locationContext} />
                </div>

                {/* 資料來源與免責聲明：純繁體中文呈現，不混合日文字句 */}
                <div className="border-t border-[#DDE3DF] pt-3 text-[11px] leading-relaxed text-[#66736C]">
                  資料來源：
                  <a className="font-semibold underline hover:text-[#1A2A22]" href="https://maps.gsi.go.jp/" target="_blank" rel="noreferrer">國土地理院地址搜尋</a>、
                  <a className="font-semibold underline hover:text-[#1A2A22]" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>、
                  <a className="font-semibold underline hover:text-[#1A2A22]" href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noreferrer">國土交通省 不動產資訊資料庫</a>。
                  本服務使用日本國土交通省不動產資訊資料庫 API，但不保證所提供資訊之即時性、正確性與完整性；周邊設施資料亦可能存在缺漏，實際現況請以現場與官方公開資訊為準。
                </div>
              </div>
            )}
          </div>

          {/* 模組 5：個人自訂通勤試算 */}
          <div className="border-t border-[#DDE3DF] pt-6">
            <div className="mb-2 flex items-center gap-2">
              <TrainFront className="h-4 w-4 text-[#00a174]" />
              <h4 className="text-sm font-bold text-[#1A2A22]">我的實際通勤試算</h4>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#66736C]">
              輸入公司或學校之完整地址或最近車站，精算從這間房子「出家門到抵達目的地」的全程門到門耗時與轉乘次數。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={commuteDestination}
                onChange={event => setCommuteDestination(event.target.value)}
                onKeyDown={event => { if (event.key === "Enter") void analyzeCommute(); }}
                placeholder="例如：東京都新宿区西新宿2-8-1 或 新宿駅"
                className="min-h-11 flex-1 border border-[#AAB8B0] px-3.5 text-sm text-[#1A2A22] outline-none transition-colors focus:border-[#00a174]"
              />
              <button
                type="button"
                onClick={analyzeCommute}
                disabled={!commuteDestination.trim() || commuteLoading || locationLoading || (!locationContext?.stationWalks.length && !result.extracted.station)}
                className="flex min-h-11 items-center justify-center gap-2 bg-[#1A2A22] px-5 text-xs font-bold text-white transition-colors hover:bg-[#33423a] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {commuteLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {commuteLoading ? "計算中…" : "計算門到門通勤"}
              </button>
            </div>
            {commuteError && <p className="mt-2 bg-[#FFF9ED] p-3 text-xs text-[#7A5A1F]">{commuteError}</p>}
            {commute && (
              <div className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#007d5a]">全程門到門通勤時間</p>
                    <p className="mt-1 text-base font-bold text-[#1A2A22]">{commute.destinationStation}駅方向・轉乘 {commute.transfers} 次</p>
                  </div>
                  <p className="shrink-0 text-3xl font-black text-[#007d5a]">約 {commute.totalMinutes} 分</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#3F5147]">
                  出門步行 {commute.originWalkMinutes} 分 ＋ 電車 {commute.transitMinutes} 分 ＋ 出站抵達 {commute.destinationWalkMinutes} 分
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#66736C]">目的地定位：{commute.destinationAddress}</p>
                {commute.destinationResolutionNote && (
                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#7A5A1F]">{commute.destinationResolutionNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
