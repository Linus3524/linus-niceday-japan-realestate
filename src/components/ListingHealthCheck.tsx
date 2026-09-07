import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Coins,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Home,
  Maximize2,
  Footprints,
  Info,
  Landmark,
  Layers,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Ruler,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrainFront,
  Trash2,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import type { AxisStatus } from "../lib/requirementVerdict";
import type { ListingLocationContext } from "../lib/listingLocation";
import {
  normalizeStructure,
  parseArea,
  parseGuaranteeFee,
  formatShikibiki,
  isFreeOrZero,
  parseSalePrice,
  parseUnitsCount,
  parseYenAmount,
  parseNonNegativeYenAmount,
  computeTsuboAndSqmPrice,
  assessRepairReserve,
  calculateSaleInitialCosts,
  assessRealEstateAcquisitionTax,
  parseAgeYears,
} from "../lib/listingExtraction";
import { ListingLocationMap } from "./ListingLocationMap";
import { parseAndExplainSpecialNotes } from "../lib/specialNotesParser";
import { parseEquipmentList } from "../lib/equipmentParser";
import { parseTransitStations } from "../lib/transitParser";
import { criteriaTagStyle } from "../lib/criteriaTagStyles";

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
// 部分 PDF（常見於特定不動產軟體輸出的內嵌日文字型）會讓 pdf.js 的
// page.render() 永遠不 resolve、也不 reject——不是「渲染很慢」，是真的卡死。
// 這種情況 try/catch 完全攔不到，使用者會看到分析永遠轉圈。
// 用逾時把它視同渲染失敗，走既有的「改送原始 PDF」備援路徑。
const PDF_RENDER_TIMEOUT_MS = 10000;
// 縮圖只需貼合卡片與對照區的顯示寬度，不必用送審那份的解析度。
const PDF_PREVIEW_MAX_DIMENSION = 900;
// 縮圖轉不出來就退回原生 PDF 預覽，等太久只是讓使用者對著轉圈發呆。
const PDF_PREVIEW_TIMEOUT_MS = 8000;
// 還原後的版面文字長度上限，避免異常大的圖紙把請求撐爆。
const MAX_LAYOUT_TEXT_CHARS = 6000;

interface InsightBulletItem {
  id: string;
  iconType: "verdict" | "factor" | "market" | "advice";
  tag: string;
  title?: string;
  text: string;
}

export interface VerdictStatusTheme {
  borderLeft: string;
  badge: string;
  dot: string;
  dataBg: string;
  medianBadge: string;
  tagStyle: string;
}

const STATUS_STYLE: Record<string, VerdictStatusTheme> = {
  "合理": {
    borderLeft: "border-l-[#007D5A]",
    badge: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
  },
  "超值": {
    borderLeft: "border-l-[#007D5A]",
    badge: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
  },
  "條件反映": {
    borderLeft: "border-l-[#D97706]",
    badge: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
  },
  "需調整": {
    borderLeft: "border-l-[#D97706]",
    badge: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
  },
  "偏高": {
    borderLeft: "border-l-[#B13818]",
    badge: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  },
  "明顯偏高": {
    borderLeft: "border-l-[#B13818]",
    badge: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  },
  "符合": {
    borderLeft: "border-l-[#007D5A]",
    badge: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
  },
  "部分符合": {
    borderLeft: "border-l-[#D97706]",
    badge: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]",
  },
  "難度高": {
    borderLeft: "border-l-[#B13818]",
    badge: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  }
};;

const getStatusStyle = (status?: string | null): VerdictStatusTheme => {
  if (!status) return STATUS_STYLE["待確認"];
  return STATUS_STYLE[status] || STATUS_STYLE["待確認"];
};

/** 依據條件評估工具色票（criteriaTagStyle）為特約條款標籤進行語意分類跳色 */
function getSpecialNoteTagStyle(category: string, badgeTone?: string): string {
  if (badgeTone === "emerald") {
    return criteriaTagStyle.equipment; // 綠色：利多優惠（免租期、免禮押、可商量寵物/樂器等）
  }
  switch (category) {
    case "費用約定":
      return criteriaTagStyle.budget; // 櫻紅：金錢費用項目（手續費、更新料、加收押金等）
    case "合約特約":
    case "買賣特約":
      return criteriaTagStyle.special; // 暖橘：合約約束項目（短期違約金、解約條款）
    case "生活規範":
      return criteriaTagStyle.special; // 暖橘：生活規約限制（禁寵、禁煙、禁樂器等）
    case "使用限制":
      return criteriaTagStyle.layout; // 柔黃：使用用途限定（純住宅、事務所不可、民泊禁止）
    case "入住條件":
      return criteriaTagStyle.transport; // 晴藍：居住資格與人口限制（單身限定、人數規範、高齡者特別約定）
    case "設施設備":
      return criteriaTagStyle.equipment; // 嫩綠：公設與服務項目（24H安心生活管家、網路、駐輪設備）
    default:
      return "border-[#DDE3DF] bg-[#F5F8F6] text-[#55635B]";
  }
}

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
    totalMonthlyHoldingCost: number;
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
  initialCosts: ReturnType<typeof calculateSaleInitialCosts>;
}

interface ExtractedFields {
  dealType?: string;
  buildingName?: string;
  roomNumber?: string;
  station: string;
  walkTime: string;
  transitAccess?: string;
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
  fixedAssetTax?: number | string;
  cityPlanningTax?: number | string;
  realEstateAcquisitionTax?: number | string;
  buildingAssessedValue?: number | string;
  landAcquisitionTaxAfterRelief?: number | string;
  registrationFee?: number | string;
  landRightsRatio?: string;
  taxEstimationBasis?: string;
  specialNotes?: string;
  facilities?: string;
  balconyArea?: string;
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 逾時（${ms}ms）`)), ms);
    promise.then(
      value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); }
    );
  });
}

/**
 * 判斷畫布是不是一片空白。取樣間隔取質數，避免剛好與規律的表格線對齊而誤判。
 * 實際的物件概要書滿版都是文字、表格與照片，非白像素遠高於門檻；
 * 渲染失敗的空白頁則趨近於 0。
 */
function canvasHasContent(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    // 讀不到像素時不要因此擋掉正常流程，交給後續步驟判斷。
    return true;
  }
  let sampled = 0;
  let inked = 0;
  for (let i = 0; i < pixels.length; i += 4 * 17) {
    sampled++;
    if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) inked++;
  }
  return sampled > 0 && inked / sampled > 0.005;
}

/**
 * 依座標把 PDF 文字層還原成「一行＝圖紙上的一列」的文字。
 *
 * 這類圖紙的費用表在畫面上是整齊的格線，但 PDF 內部的文字順序是散的，
 * 標籤與數值不相鄰，AI 只能猜哪個值屬於哪一列——實測會把敷引讀成「-」、
 * 把礼金讀成「1ヶ月」。還原成正確列序後再交給 AI，對位就穩定正確。
 *
 * 這一步只讀文字層、不需要 canvas 繪製，因此就算渲染失敗也拿得到。
 */
async function extractPdfLayoutText(pdf: any): Promise<string> {
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const items = content.items
    .map((item: any) => ({ x: item.transform[4], y: item.transform[5], text: String(item.str || "").trim() }))
    .filter((item: { text: string }) => item.text);

  const rows: Array<{ y: number; items: Array<{ x: number; text: string }> }> = [];
  for (const item of items.sort((a: any, b: any) => b.y - a.y)) {
    // 同一列的字有輕微高低差（例如 586.2 與 584.5），4pt 內視為同列；
    // 相鄰兩列間距約 7pt 以上，不會誤併。
    const row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 4);
    if (row) {
      row.items.push(item);
      row.y = (row.y + item.y) / 2;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }
  return rows
    .map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.text).join("　"))
    .join("\n")
    .slice(0, MAX_LAYOUT_TEXT_CHARS);
}

/**
 * 讀 PDF 首頁並產生介面預覽縮圖。
 *
 * 舊版把「讀長寬比」與「轉縮圖」拆成兩個函式，各自 getDocument 同一個檔案並同時啟動；
 * pdf.js 只有一條 worker，兩份解析互相搶資源，實測レグノ・セレーノ這種滿版日文図面
 * 光是解析就吃掉大半預算，縮圖必然撞上逾時。這裡合併成單次解析：先把長寬比回報出去
 * 讓版面立刻貼合，再接著渲染，省掉一整份重複的解析成本。
 */
async function renderPdfPreview(
  file: File,
  onAspect?: (aspect: number) => void,
): Promise<{ blobUrl: string; aspect: number } | null> {
  let pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]> | null = null;
  try {
    const [pdfjs, workerModule] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
    });
    pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const aspect = baseViewport.height > 0 ? baseViewport.width / baseViewport.height : 1.414;
    // 長寬比先回報：卡片與對照區可以立刻用正確比例撐開，不必等渲染完成。
    onAspect?.(aspect);

    // 這張圖只餵給縮圖卡與對照區（最寬約 900 CSS px，含 2x 螢幕也綽綽有餘）。
    // 舊版沿用 1800px 的上限，等於為了一張縮圖付四倍的渲染成本，是逾時的主因之一。
    const scale = Math.min(2, PDF_PREVIEW_MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
    try {
      await withTimeout(renderTask.promise, PDF_PREVIEW_TIMEOUT_MS, "PDF 預覽轉圖");
    } catch (error) {
      // 逾時卻不取消，這份渲染會繼續佔著同一條 worker，
      // 接著把送審用的高解析度轉圖一起拖垮。必須主動中止。
      renderTask.cancel();
      throw error;
    }
    page.cleanup();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return null;
    return { blobUrl: URL.createObjectURL(blob), aspect };
  } catch (error) {
    console.warn("PDF 預覽轉圖失敗，降級為原生預覽", error);
    return null;
  } finally {
    await pdf?.destroy();
  }
}

async function renderPdfForUpload(file: File): Promise<{ rendered: { mimeType: string; data: string } | null; layoutText: string }> {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  // 日本圖紙用 CID 編碼的日文字型，少了 CMap 與標準字型會整頁渲染成空白或亂碼。
  // 資源由 scripts/copy-pdfjs-assets.mjs 在 build 前複製到 public/pdfjs/。
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
  const pdf = await loadingTask.promise;
  // 版面文字先取：它不依賴 canvas，就算後面渲染失敗也要保住這份對位資訊。
  let layoutText = "";
  try {
    layoutText = await extractPdfLayoutText(pdf);
  } catch (error) {
    console.warn("PDF 版面文字還原失敗，僅送圖與原檔。", error);
  }
  try {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = MAX_PDF_RENDER_DIMENSION / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
    try {
      await withTimeout(renderTask.promise, PDF_RENDER_TIMEOUT_MS, "PDF 渲染");
    } catch (error) {
      renderTask.cancel();
      throw error;
    }
    page.cleanup();

    // render() 有可能「成功回傳」卻畫出一張全白的圖：內嵌字型載入失敗時，
    // 部分瀏覽器不是卡死而是靜靜地什麼都不畫。這種空白 JPEG 送到後端，
    // AI 自然讀不出任何欄位，使用者只會看到「無法從這張圖片讀出物件資訊」。
    // 這裡實際檢查畫布內容，空白就視同渲染失敗，改送原始 PDF。
    if (!canvasHasContent(canvas)) {
      throw new Error("PDF 渲染結果為空白畫面");
    }

    const data = canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY).split(",")[1] ?? "";
    if (!data) throw new Error("PDF canvas encode failed");
    return { rendered: { mimeType: "image/jpeg", data }, layoutText };
  } catch (error) {
    // 渲染失敗不影響已取得的版面文字，照樣回傳給後端當對位依據。
    console.warn("PDF 高解析度轉圖失敗，改以原始 PDF 與版面文字分析。", error);
    return { rendered: null, layoutText };
  } finally {
    await pdf.destroy();
  }
}

/**
 * PDF 一律以原始檔為底稿送出，能成功轉出的高解析度圖再額外附上。
 *
 * 原因：pdf.js 對某些不動產軟體輸出的 PDF 會卡死或畫出空白，而原始 PDF 交給
 * 後端模型判讀反而穩定（同兩份問題檔案各測三次皆正確讀出欄位）。反過來，
 * 掃描型 PDF 又需要前端高解析度轉圖才能保住小字。兩份一起送就能同時覆蓋
 * 這兩種情況，任一份可讀就不會再出現「無法讀出物件資訊」。
 */
async function encodeForUpload(file: File): Promise<{ files: Array<{ mimeType: string; data: string }>; layoutText: string }> {
  if (file.type === "application/pdf") {
    const raw = { mimeType: file.type, data: await fileToBase64(file) };
    try {
      const { rendered, layoutText } = await renderPdfForUpload(file);
      if (!rendered) return { files: [raw], layoutText };
      const combinedBytes = base64Bytes(raw.data) + base64Bytes(rendered.data);
      // 超過上傳上限時捨棄轉出的圖，保留一定讀得到的原始 PDF 與版面文字。
      if (combinedBytes > MAX_TOTAL_IMAGE_BYTES) {
        console.warn("PDF 轉圖後總量超過上限，只送原始 PDF。");
        return { files: [raw], layoutText };
      }
      return { files: [rendered, raw], layoutText };
    } catch (error) {
      console.warn("PDF 前處理失敗，只送原始 PDF。", error);
      return { files: [raw], layoutText: "" };
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
    return { files: [{ mimeType: "image/jpeg", data }], layoutText: "" };
  } catch {
    return { files: [{ mimeType: file.type, data: await fileToBase64(file) }], layoutText: "" };
  }
}

function formatYen(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function formatManagementSummary(company?: string, style?: string): string {
  const rawCompany = company?.trim() || "";
  const cleanCompany = rawCompany.replace(/[（(].*$/, "").trim();
  const inferredStyle = style?.trim() || rawCompany.match(/[（(](.*)[）)]$/)?.[1] || "";
  const cleanStyle = inferredStyle
    .replace(/[（(]\s*/g, "／")
    .replace(/\s*[）)]/g, "")
    .replace(/[\/／]+/g, "／")
    .replace(/^／|／$/g, "")
    .trim();

  return [cleanCompany, cleanStyle].filter(Boolean).join("・") || "委託管理／日勤・巡迴";
}

function summarizeTaxEstimationBasis(basis?: string | null): string | null {
  if (!basis?.trim()) return null;
  if (/圖紙|圖面/.test(basis) && /未載明|未記載|沒有/.test(basis)) {
    return "圖紙未載明稅額，已依土地持分、面積、結構及屋齡概算。";
  }
  if (/圖紙|圖面/.test(basis) && /載明|記載|採用/.test(basis)) {
    return "稅額優先採用圖紙記載，未載項目由 AI 概算。";
  }
  return "AI 已依圖紙資訊概算稅費，實際金額以正式文件為準。";
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
        ? "免押金（需留意退租時之原狀恢復或預收清掃費條款）": hasShikibiki
        ? `擔保性質費用（ 含「${formattedShikibiki}」扣除約定，退租時不退還）`: "擔保性質費用，退租扣除自然折舊外之修繕後退還餘額",
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
        ? `圖紙載明：${result.extracted.guaranteeFee}（依月總租金 ¥${totalMonthlyCost.toLocaleString()} 計約 ¥${guaranteeAmount.toLocaleString()}）`: result.extracted.guaranteeFee
        ? `圖紙標示：${result.extracted.guaranteeFee}`: "外國籍租客多數需加入保證公司，一般首年為總租金 50%～100%",
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
      note: result.extracted.insuranceFee ? `圖紙標示：${result.extracted.insuranceFee}`: "保障租客個人財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
    },
    {
      id: "lockReplacementFee",
      name: "鑰匙更換費（鍵交換代）",
      amount: isFreeOrZero(result.extracted.lockReplacementFee) ? 0 : (parseYenAmount(result.extracted.lockReplacementFee) ?? 22000),
      isFromFlyer: isFreeOrZero(result.extracted.lockReplacementFee) || Boolean(parseYenAmount(result.extracted.lockReplacementFee)),
      note: isFreeOrZero(result.extracted.lockReplacementFee)
        ? `免換鎖費用（圖紙標示：${result.extracted.lockReplacementFee || "無償"}）`: result.extracted.lockReplacementFee
        ? `圖紙標示：${result.extracted.lockReplacementFee}`: "交屋前換新鎖芯費用（一般鎖約 1.6 萬～2.2 萬円，電子鎖約 3.3 萬円）",
    },
  ];

  const customCleaning = parseYenAmount(result.extracted.cleaningFee);
  if (deposit === 0 || customCleaning) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: customCleaning ?? 44000,
      isFromFlyer: Boolean(customCleaning),
      note: result.extracted.cleaningFee ? `圖紙標示：${result.extracted.cleaningFee}`: "免押金物件通常於簽約初期預收退租清掃費",
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
  let levelText = "符合市場常態（約 4 ～ 5 倍）";
  if (monthsMultipleMax <= 3.8) {
    level = "low";
    levelText = "低於市場常態（約 3 ～ 4 倍）";
  } else if (monthsMultipleMax >= 5.5) {
    level = "high";
    levelText = "高於市場常態（5.5 倍以上）";
  }

  const tips: string[] = [];

  // 1. 租金高性價比／超值物件
  if (result.verdict?.status === "超值") {
    tips.push("【低於行情】租金＋管理費低於同區同房型行情。這類物件去化較快，審查通過後建議儘早決定。");
  }

  // 2. 免租期（Free Rent）特惠提示
  if (result.extracted.freeRent && !isFreeOrZero(result.extracted.freeRent)) {
    tips.push(`【免租期】圖紙載明「${result.extracted.freeRent}」，首月可減免租金，約省 ¥${rent.toLocaleString()}。`);
  }

  // 3. 初期費用優惠（3.8 倍以下）
  if (monthsMultipleMax <= 3.8) {
    tips.push(`【初期費用偏低】約 ${monthsMultipleMax} 個月租金，低於市場常見的 4.5～5.0 倍標準。`);
  }

  // 4. 禮金與押金動態解析
  if (hasShikibiki) {
    tips.push(`【敷引／償却】圖紙載明「${formattedShikibiki}」，退租時不予退還，初期預算建議直接列為固定支出。`);
  }
  if (keyMoney === 0 && deposit === 0) {
    tips.push("【免禮金免押金】初期省約 2 個月租金。需確認退租時的清掃費與原狀恢復特約。");
  } else if (keyMoney === 0) {
    tips.push("【免禮金】省約 1 個月租金。");
  } else if (keyMoney >= rent * 1.5) {
    const kmMonths = (keyMoney / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【禮金偏高】禮金 ${kmMonths} 個月，常見於熱門地段，初期成本較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isFreeOrZero(result.extracted.lockReplacementFee)) {
    tips.push("【免換鎖費】圖紙載明鍵交換代 0 円，省約 2～4 萬円。");
  }

  // 6. 附免費高速網路
  const allNotes = `${result.extracted.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【附免費網路】免自行申辦，年省約 5～6 萬円。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日影響首期】首期預收「起租月日割租金＋次月完整租金與管理費」。起租日通常在審查通過後 10～20 天內，若落在下旬，日割天數少、首筆金額較低。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款】初期費用多需由日本國內銀行匯款。海外電匯請預留約 4,000 円日本端手續費與匯差。");

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
  const ageYears = parseAgeYears(result.extracted.age);
  const reserveAssessment = assessRepairReserve({
    monthlyRepairCostYen: repairReserve + repairFund,
    areaSqm,
    totalUnits,
    ageYears,
  });

  const acquisitionTaxAssessment = assessRealEstateAcquisitionTax({
    buildingAssessedValueYen: parseNonNegativeYenAmount(result.extracted.buildingAssessedValue),
    landTaxAfterReliefYen: parseNonNegativeYenAmount(result.extracted.landAcquisitionTaxAfterRelief),
    fallbackTaxYen: parseNonNegativeYenAmount(result.extracted.realEstateAcquisitionTax),
    areaSqm,
    ageYears,
    occupancyStatus: `${result.extracted.occupancyStatus || ""} ${
      result.extracted.currentRent || result.extracted.annualIncome || result.extracted.grossYield ? "賃貸中" : ""
    }`,
  });

  const initialCosts = calculateSaleInitialCosts(salePriceYen, {
    monthlyManagementFeeYen: managementFee,
    monthlyRepairReserveYen: repairReserve + repairFund,
    fixedAssetTaxYen: parseNonNegativeYenAmount(result.extracted.fixedAssetTax),
    cityPlanningTaxYen: parseNonNegativeYenAmount(result.extracted.cityPlanningTax),
    acquisitionTaxYen: acquisitionTaxAssessment.amount,
    acquisitionTaxNote: acquisitionTaxAssessment.note,
    registrationFeeYen: parseNonNegativeYenAmount(result.extracted.registrationFee),
    prepaidMonths: 3,
  });

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
      totalMonthlyHoldingCost: totalMonthlyCost,
      items: [
        { name: "管理費", amount: managementFee, note: result.extracted.managementCompany || "大樓日常維護與共用部費用" },
        { name: "修繕積立金", amount: repairReserve, note: "管委會大樓長期修繕儲備基金" },
        ...(repairFund > 0 ? [{ name: "修繕積立基金（月額）", amount: repairFund, note: "定期追加修繕準備金" }] : []),
        ...(otherMonthlyFees > 0 ? [{ name: "其他月額雜費", amount: otherMonthlyFees, note: result.extracted.otherMonthlyFees || "町會費或自治費用" }] : []),
      ],
    },
    buildingHealth: {
      totalUnits,
      ageYears,
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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewAspect, setPreviewAspect] = useState<number | null>(null);
  // "idle"｜"rendering"（轉縮圖中）｜"ready"｜"failed"（轉圖失敗，改用原生 PDF 預覽）
  const [previewState, setPreviewState] = useState<"idle" | "rendering" | "ready" | "failed">("idle");
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
  const [showSpecialNotes, setShowSpecialNotes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 全螢幕檢視時支援 Esc 關閉
  useEffect(() => {
    if (!showFullPreview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFullPreview(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showFullPreview]);

  // 當 previewUrl 或 previewImageUrl 變動時妥善釋放 object URL，避免記憶體洩漏
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (previewImageUrl && previewImageUrl !== previewUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewUrl, previewImageUrl]);

  const selectSingleFile = (selectedFile: File) => {
    setError(null);
    setResult(null);
    setLocationContext(null);
    setCommute(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewImageUrl && previewImageUrl !== previewUrl) URL.revokeObjectURL(previewImageUrl);

    setFile(selectedFile);
    setShowFullPreview(false);

    const isPdf = selectedFile.type === "application/pdf";
    const isImg = selectedFile.type.startsWith("image/");

    if (isImg) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setPreviewImageUrl(url);
      setPreviewAspect(null);
      setPreviewState("ready");
      const img = new Image();
      img.onload = () => {
        if (img.naturalHeight > 0) {
          setPreviewAspect(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = url;
    } else if (isPdf) {
      const rawUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(rawUrl);
      setPreviewImageUrl(null);
      setPreviewAspect(null);

      // 單次解析：先回報長寬比讓版面立刻貼合，再背景轉出圖片預覽
      //（消除瀏覽器原生 PDF 檢視器的黑色空底與控制列）。
      setPreviewState("rendering");
      void renderPdfPreview(selectedFile, (aspect) => setPreviewAspect(aspect)).then((rendered) => {
        if (rendered) {
          setPreviewImageUrl(rendered.blobUrl);
          setPreviewAspect(rendered.aspect);
          setPreviewState("ready");
        } else {
          // 轉圖失敗時要明確結束載入狀態，否則縮圖會永遠停在轉圈。
          // previewUrl 仍是原始 PDF，改用瀏覽器原生預覽當縮圖即可。
          setPreviewState("failed");
        }
      });
    } else {
      setPreviewUrl(null);
      setPreviewImageUrl(null);
      setPreviewAspect(null);
      setPreviewState("idle");
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
    setShowFullPreview(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewImageUrl && previewImageUrl !== previewUrl) URL.revokeObjectURL(previewImageUrl);
    setFile(null);
    setPreviewUrl(null);
    setPreviewImageUrl(null);
    setPreviewAspect(null);
    setPreviewState("idle");
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
      const { files: encoded, layoutText } = await encodeForUpload(file);
      const totalBytes = encoded.reduce((sum, item) => sum + base64Bytes(item.data), 0);
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        setError(`圖片壓縮後仍超過 ${Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB 上限，請改用 JPG／PNG 格式再試。`);
        return;
      }

      const response = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: encoded, mode: analysisMode, layoutText }),
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
    ? `${parsedArea} ㎡（約 ${(parsedArea / 3.30578).toFixed(1)} 坪）`: extracted?.area || null;

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

  const isSRCBuilding = /src|鉄骨[・･\s]*鉄筋|鋼骨[・･\s]*鋼筋/i.test(
    `${displayStructure || parsed?.structure || extracted?.structure || ""}`
      .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
  );

  const cleanVerdictHeadline = (result?.verdict?.headline || "")
    .replace(/建議評估議價空間/g, "建議評估個人每月承擔能力")
    .replace(/強烈建議積極議價或多比較周邊同級房源/g, "建議謹慎評估自身負擔能力，並多比較周邊同級房源");

  const cleanVerdictDetail = (() => {
    if (!result?.verdict?.detail) return "";
    let d = result.verdict.detail
      .replace(/^這個地區與房型的行情約[^\u3002]*\u3002\s*/, "")
      .replace(/^同車站同房型成約[^\u3002]*\u3002\s*/, "")
      .trim();

    if (isSRCBuilding) {
      d = d.replace(/RC\s*(?:鋼筋混凝土造?|造（鋼筋混凝土）)/g, "SRC造（鋼骨鋼筋混凝土）");
    } else {
      d = d.replace(/RC\s*鋼筋混凝土造(?!（)/g, "RC造（鋼筋混凝土）");
    }

    d = d
      .replace(/建議向仲介確認加價原因，或嘗試爭取免租期（Free Rent）與禮金減免以平衡負擔。?/g, "由於日本租屋月租多為固定定價、幾無議價談判空間，建議承租前務必衡量個人每月預算與承擔能力，亦可同步比較周邊其他同級房源。")
      .replace(/強烈建議積極議價或多比較周邊同級房源。?/g, "考量日本租屋習慣無談判議價空間，建議謹慎衡量個人每月承受力，並優先多比較周邊同級房源。");

    return d;
  })();

  const isSaleListing =
    result?.dealType === "sale" ||
    Boolean(result?.saleAnalysis) ||
    Boolean(result?.parsed?.salePrice && result.parsed.salePrice >= 10000000);
  const saleAnalysis = result?.saleAnalysis || (result ? buildClientSaleAnalysis(result) : null);
  const taxEstimationSummary = summarizeTaxEstimationBasis(extracted?.taxEstimationBasis);
  const acquisitionTaxAssessment = saleAnalysis ? assessRealEstateAcquisitionTax({
    buildingAssessedValueYen: parseNonNegativeYenAmount(extracted?.buildingAssessedValue),
    landTaxAfterReliefYen: parseNonNegativeYenAmount(extracted?.landAcquisitionTaxAfterRelief),
    fallbackTaxYen: parseNonNegativeYenAmount(extracted?.realEstateAcquisitionTax),
    areaSqm: saleAnalysis.areaSqm,
    ageYears: saleAnalysis.buildingHealth.ageYears,
    occupancyStatus: `${extracted?.occupancyStatus || ""} ${
      extracted?.currentRent || extracted?.annualIncome || extracted?.grossYield ? "賃貸中" : ""
    }`,
  }) : null;
  const saleInitialCosts = saleAnalysis ? calculateSaleInitialCosts(saleAnalysis.salePriceYen, {
    prepaidMonths: 3,
    monthlyManagementFeeYen: saleAnalysis.monthlyHoldingCosts.managementFee,
    monthlyRepairReserveYen:
      saleAnalysis.monthlyHoldingCosts.repairReserve + saleAnalysis.monthlyHoldingCosts.repairFund,
    fixedAssetTaxYen: parseNonNegativeYenAmount(extracted?.fixedAssetTax),
    cityPlanningTaxYen: parseNonNegativeYenAmount(extracted?.cityPlanningTax),
    acquisitionTaxYen: acquisitionTaxAssessment?.amount,
    acquisitionTaxNote: acquisitionTaxAssessment?.note,
    registrationFeeYen: parseNonNegativeYenAmount(extracted?.registrationFee),
  }) : null;
  const buildingName = (extracted?.buildingName || "").trim();
  // 買賣図面的房號常不在獨立欄位，而是混在「所在階／部屋番号」「物件名」或備註列裡，
  // 因此除了 roomNumber 之外，再依序掃描這幾個欄位，讓買賣報告標題也能帶出房號。
  const roomNumberFallbackSources = [
    extracted?.floor,
    extracted?.buildingName,
    extracted?.otherConditions,
    extracted?.specialNotes,
    extracted?.address,
  ];
  // 販売図面實測多半只寫到「○階」而不印房號（レグノ・セレーノ803 的圖面內文即無 803），
  // 但仲介寄檔時幾乎都會把房號接在物件名後面。因此圖面本身找不到時，最後才退回檔名，
  // 且僅接受「緊接在物件名之後」的數字，避免把日期、管理編號或「12F」誤判成房號。
  const roomNumberFromFileName = (() => {
    const name = (file?.name || "").replace(/\.[^.]+$/, "").replace(/[０-９Ａ-Ｚａ-ｚ]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );
    if (!name || !buildingName || !name.includes(buildingName)) return "";
    const tail = name.slice(name.indexOf(buildingName) + buildingName.length);
    const hit = tail.match(/^[\s_＿\-‗・]*([A-Za-z]?\d{2,4})(?:号室|號室|号|室)?(?=$|[\s_＿\-‗・.（(])/);
    const value = hit?.[1] || "";
    // 4 位數的 19xx／20xx 幾乎都是年份或日期批號，不是房號。
    return /^(?:19|20)\d{2}$/.test(value) ? "" : value;
  })();
  const rawRoomNumber = (
    extracted?.roomNumber ||
    roomNumberFallbackSources
      .map(src => src?.match(/(?:^|[^\d])([A-Za-z]?\d{2,4}\s*(?:号室|號室|号|室))(?!\d)/)?.[1])
      .find(Boolean) ||
    roomNumberFromFileName ||
    ""
  ).trim().replace(/\s+/g, "");
  const formattedRoom = rawRoomNumber
    ? /^[A-Za-z]?\d{2,4}$/.test(rawRoomNumber)
      ? `${rawRoomNumber}号室`
      : rawRoomNumber.replace(/號室$/, "号室").replace(/(?<!号)室$/, "号室")
    : "";
  const roomAlreadyInName = Boolean(
    formattedRoom && (
      buildingName.includes(formattedRoom) ||
      (rawRoomNumber && buildingName.includes(rawRoomNumber))
    )
  );
  // 販売図面常常不印号室（デュオ・スカーラ新宿即是），這時退而寫出圖紙標示的所在階，
  // 讓標題至少能對上「是哪一戶」的層別資訊，而不是只有一個大樓名。
  const floorLabel = (() => {
    if (formattedRoom) return "";
    const raw = (extracted?.floor || "").replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    const hit = raw.match(/(地下\s*\d+|\d+)\s*階/);
    if (!hit) return "";
    const floor = `${hit[1].replace(/\s+/g, "")}階`;
    // 「4階建」是建物總樓層，不是這一戶的所在階，不能拿來當標題。
    return new RegExp(`${floor}建`).test(raw) && !/所在階|部分/.test(raw) ? "" : floor;
  })();
  const displayBuildingWithRoom = [
    buildingName,
    !roomAlreadyInName ? (formattedRoom || floorLabel) : null,
  ].filter(Boolean).join(" ");
  const reportHeading =
    displayBuildingWithRoom ||
    (stationSummary
      ? formattedRoom
        ? `${stationSummary}駅周邊 ${formattedRoom}`
        : `${stationSummary}駅周邊`
      : isSaleListing
        ? "日本買賣公寓"
        : "日本租賃物件");
  const isPdfPreview = file?.type === "application/pdf";
  const specialNotesParsed = parseAndExplainSpecialNotes(extracted?.specialNotes);
  const equipmentList = parseEquipmentList(extracted?.facilities || extracted?.specialNotes);
  const stationItems = parseTransitStations(extracted?.transitAccess, extracted?.station, extracted?.walkTime);
  // Google 智慧容錯直達（以 site:mansion-review.jp 搜尋，徹底解決平假名／片假名／漢字登錄差異與 Brave 檔腳本問題）

  return (
    <section className="border border-[#1A2A22] bg-white p-6 font-sans md:p-8" aria-label="物件圖紙分析">
      {/* 區塊頂部標題 */}
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00A174]">
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
        type="file" accept={ACCEPTED_MIME_TYPES}
        className="hidden" onChange={handleFileSelect}
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
              ? "border-[#00A174] bg-[#E6F6F1]": "border-[#8A9590] bg-[#F5F8F6] hover:border-[#00A174] hover:bg-[#F5F8F6]"}`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center bg-[#E6F6F1] text-[#007D5A] transition-transform duration-200 group-hover:scale-110">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-base font-bold text-[#1A2A22]">
            點擊選擇圖紙，或將圖紙直接拖曳至此
          </p>
          <p className="mt-1 text-xs text-[#66736C]">
            支援單張日本不動產概要書（租賃物件・中古公寓買賣・投資收租圖紙均可）、照片或 PDF 檔案
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-[#3F5147]">
            <span className="bg-[#DDE3DF] px-2 py-0.5">JPG / PNG</span>
            <span className="bg-[#DDE3DF] px-2 py-0.5">WEBP / HEIC</span>
            <span className="bg-[#DDE3DF] px-2 py-0.5">PDF</span>
            <span className="ml-1 text-[11px] text-[#66736C]">（自動最佳化，不留存個人資料）</span>
          </div>
        </div>
      ) : (
        /* 檔案已選取之卡片狀態 */
        <div className="border border-[#1A2A22] bg-[#F5F8F6] p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 overflow-hidden">
              {previewImageUrl ? (
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  aria-label="放大檢視圖紙"
                  className="group relative shrink-0 overflow-hidden border border-[#DDE3DF] bg-white shadow-xs transition-all hover:border-[#00A174] hover:shadow-sm cursor-pointer"
                  style={{
                    height: "84px",
                    aspectRatio: previewAspect ? `${previewAspect}` : (isPdfPreview ? "1.414" : "1"),
                    maxWidth: "135px",
                    minWidth: "60px",
                  }}
                  title="點擊放大檢視圖紙"
                >
                  <img src={previewImageUrl} alt="圖紙縮圖" className="h-full w-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A2A22]/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                </button>
              ) : previewUrl && isPdfPreview ? (
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  aria-label="放大檢視圖紙"
                  className="group relative flex shrink-0 items-center justify-center overflow-hidden border border-[#DDE3DF] bg-white shadow-xs transition-all hover:border-[#00A174]"
                  style={{
                    height: "84px",
                    aspectRatio: previewAspect ? `${previewAspect}` : "1.414",
                    maxWidth: "135px",
                    minWidth: "60px",
                  }}
                  title="點擊放大檢視圖紙"
                >
                  {previewState === "failed" ? (
                    /* 轉圖失敗（多為極複雜的日文図面渲染逾時）：直接用瀏覽器原生預覽當縮圖，
                       不再顯示永遠不會結束的轉圈。分析本身不受影響。 */
                    <iframe
                      src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                      title="圖紙縮圖"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="pointer-events-none h-full w-full border-0"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-[#007D5A]">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      <span className="text-[10px] font-bold">縮圖生成中</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A2A22]/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                </button>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-[#DDE3DF] bg-[#E6F6F1] text-[#007D5A]">
                  <FileText className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-[#E6F6F1] px-2 py-0.5 text-[10px] font-bold text-[#007D5A]">
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
                type="button" onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-1.5 border border-[#8A9590] bg-white px-3.5 py-2 text-xs font-bold text-[#1A2A22] transition-colors hover:bg-[#F5F8F6] disabled:opacity-45">
                <RefreshCw className="h-3.5 w-3.5" /> 更換圖紙
              </button>
              <button
                type="button" onClick={removeFile}
                disabled={loading}
                aria-label="移除圖紙" className="flex items-center gap-1.5 border border-[#E94E2B] bg-white px-3 py-2 text-xs font-bold text-[#B13818] transition-colors hover:bg-[#FBDFD2] disabled:opacity-45">
                <Trash2 className="h-3.5 w-3.5" /> 移除
              </button>
            </div>
          </div>

          {/* 開始分析按鈕 */}
          <div className="mt-4 border-t border-[#DDE3DF] pt-4">
            <button
              type="button" onClick={analyze}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 bg-[#1A2A22] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3F5147] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>正在由 AI 深度解讀圖紙各項數值、條款與特約…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#00A174]" />
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

      {/* 全螢幕圖紙檢視 */}
      {showFullPreview && (previewImageUrl || previewUrl) && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#1A2A22]/90 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="原始圖紙放大檢視"
          onClick={() => setShowFullPreview(false)}
        >
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <span className="truncate text-sm font-bold text-white">{file?.name || "原始圖紙"}</span>
            <div className="flex items-center gap-2">
              {isPdfPreview && previewUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(previewUrl, "_blank");
                  }}
                  className="flex items-center gap-1.5 border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> 開啟 PDF 原檔
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                className="flex items-center gap-1.5 border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" /> 關閉
              </button>
            </div>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white/5 p-2 sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="原始圖紙放大檢視"
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
            ) : isPdfPreview && previewUrl ? (
              <iframe
                src={previewUrl}
                title="原始圖紙放大檢視"
                className="h-full w-full border-0 bg-white"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* 分析結果呈現區塊 */}
      {result && (
        <div className="mt-8 space-y-6 border-t-2 border-[#1A2A22] pt-6">
          {/* 物件標題 */}
          <div className="border-b border-[#DDE3DF] pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
              <Sparkles className="h-4 w-4 text-[#007D5A]" />
              <span>LINUS {isSaleListing ? "買賣圖紙分析" : "租賃圖紙健檢"}</span>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-bold text-[#1A2A22] md:text-2xl">
                {reportHeading}
              </h3>
            </div>
          </div>

          {/* 原始圖紙對照：讓使用者能自行核對下方分析數值是否與圖紙相符 */}
          {(previewImageUrl || previewUrl) && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                  <FileText className="h-4 w-4" />
                  <span>原始圖紙對照</span>
                  <span className="text-[11px] font-normal normal-case text-[#66736C]">
                    （可核對下方各項分析數值）
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isPdfPreview && previewUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(previewUrl, "_blank")}
                      className="hidden sm:inline-flex items-center gap-1 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#3F5147] transition-colors hover:border-[#8A9590] hover:text-[#1A2A22]"
                    >
                      <ExternalLink className="h-3 w-3" /> 新分頁開啟 PDF
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFullPreview(true)}
                    className="flex items-center gap-1.5 border border-[#8A9590] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A2A22] transition-colors hover:border-[#00A174] hover:bg-[#F5F8F6] cursor-pointer"
                  >
                    <Maximize2 className="h-3 w-3" /> 放大檢視
                  </button>
                </div>
              </div>

              {/* 圖片對照主體：徹底貼合圖片比例，去除任何黑底與死板高度 */}
              <div
                className="group relative flex cursor-zoom-in items-center justify-center border border-[#DDE3DF] bg-[#F5F8F6] p-3 sm:p-5"
                onClick={() => setShowFullPreview(true)}
                title="點擊放大檢視原始圖紙"
              >
                {previewImageUrl ? (
                  <div
                    className="relative w-full overflow-hidden bg-white shadow-xs transition-shadow duration-200 group-hover:shadow-md"
                    style={{
                      aspectRatio: previewAspect ? `${previewAspect}` : undefined,
                      maxWidth: previewAspect && previewAspect < 0.9 ? "600px" : "100%",
                    }}
                  >
                    <img
                      src={previewImageUrl}
                      alt="原始圖紙對照"
                      className="block h-full w-full object-contain select-none"
                      loading="lazy"
                    />
                  </div>
                ) : isPdfPreview && previewUrl ? (
                  /* 轉圖中或降級情況：以計算後的長寬比撐開，避免產生黑底 */
                  <div
                    className="relative w-full overflow-hidden bg-white"
                    style={{
                      aspectRatio: previewAspect ? `${previewAspect}` : "1.414",
                    }}
                  >
                    <iframe
                      src={`${previewUrl}#toolbar=0&navpanes=0`}
                      title="原始圖紙"
                      className="h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-white text-[#66736C]">
                    <FileText className="h-8 w-8 text-[#8A9590]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 條件分支：買賣圖紙視角 VS 租賃圖紙視角 */}
          {isSaleListing && saleAnalysis ? (
            <>
              {/* 模組 S1：價格定位（實價登錄平均 vs 市場在售平均 vs 本案開價） */}
              {saleAnalysis.mlitComparison && (() => {
                const c = saleAnalysis.mlitComparison;
                const priceMan = saleAnalysis.salePriceMan;
                const man = (v: number | null | undefined) =>
                  v == null ? null : Math.round(v).toLocaleString();
                const tsuboOf = (totalMan: number | null) =>
                  totalMan == null || !saleAnalysis.tsuboAndSqm.tsubo
                    ? null
                    : (totalMan / saleAnalysis.tsuboAndSqm.tsubo).toFixed(1);

                const officialMan = typeof c.medianPriceMan === "number" && c.medianPriceMan > 0 ? c.medianPriceMan : null;
                const listingMan = typeof c.typicalListingPriceMan === "number" && c.typicalListingPriceMan > 0
                  ? c.typicalListingPriceMan : null;
                const fairLow = typeof c.fairLowMan === "number" && c.fairLowMan > 0 ? c.fairLowMan : null;
                const fairHigh = typeof c.fairHighMan === "number" && c.fairHighMan > 0 ? c.fairHighMan : null;
                const hasFairRange = fairLow !== null && fairHigh !== null;

                // 價格區間軸：涵蓋區間上下限、中位與本案，兩端各留 6% 餘裕。
                const axisPoints = [officialMan, fairLow, fairHigh, priceMan]
                  .filter((v): v is number => typeof v === "number" && v > 0);
                const axisLo = Math.min(...axisPoints);
                const axisHi = Math.max(...axisPoints);
                const axisPad = (axisHi - axisLo) * 0.06 || axisHi * 0.06 || 1;
                const pos = (v: number) => ((v - (axisLo - axisPad)) / ((axisHi + axisPad) - (axisLo - axisPad))) * 100;

                // 本案沿用租賃圖紙診斷的同一組語意色票（STATUS_STYLE）：
                // 落在區間內是綠、明顯高於上緣才是紅，不再不分結論一律深紅。
                const fairState = !hasFairRange
                  ? { text: "缺合理區間", box: "border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]", dot: "bg-[#8A9590]",
                      short: null as string | null, accent: "#3F5147" }
                  : priceMan > (fairHigh as number)
                    ? { text: "高於價格區間上限", box: STATUS_STYLE["偏高"].badge, dot: STATUS_STYLE["偏高"].dot,
                        short: "高於區間上限", accent: "#B13818" }
                    : priceMan < (fairLow as number)
                      ? { text: "低於價格區間下限", box: STATUS_STYLE["超值"].badge, dot: STATUS_STYLE["超值"].dot,
                          short: "低於區間下限", accent: "#007D5A" }
                      : { text: "落在合理價格區間內", box: STATUS_STYLE["合理"].badge, dot: STATUS_STYLE["合理"].dot,
                          short: "落在合理價格區間內", accent: "#007D5A" };

                const benchmarks = [
                  officialMan !== null && {
                    key: "official", label: "實價登錄平均", value: officialMan, tone: "#0284C7",
                    diff: c.rawDiffPercent, note: `國土交通省實價登錄 ${c.sampleCount ?? 0} 筆成交均價`,
                  },
                  listingMan !== null && {
                    key: "listing", label: "市場在售平均", value: listingMan, tone: "#FB923C",
                    diff: c.listingDiffPercent,
                    note: c.listingBenchmarkSourceLabel
                      ? `${c.listingBenchmarkSourceLabel}（賣方開價，非成交價）`
                      : "同區同房型公開刊登開價平均（非成交價）",
                  },
                ].filter(Boolean) as Array<{
                  key: string; label: string; value: number; tone: string;
                  diff: number | null | undefined; note: string;
                }>;

                // 影響因素的長度條用「固定 ±20% 刻度」而不是組內最大值正規化。
                // 用最大值正規化時，+12% 只要是組內最大就會畫成滿格，看起來像 100%，反而誤導。
                const FACTOR_SCALE = 20;
                const factorIcon = (label: string) =>
                  /站|交通|徒歩|徒步/.test(label) ? TrainFront
                    : /樓層|階/.test(label) ? Layers
                    : /屋齡|築年|年數/.test(label) ? Home
                    : /現況|租約|入居/.test(label) ? Building
                    : /翻新|改裝|裝修/.test(label) ? Sparkles
                    : FileText;

                return (
                  <>
                    <div className="space-y-3">
                      {/* 區塊頂部標題列：與租賃圖紙各模組同一層級（卡片外 eyebrow，無圖示方塊） */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                          <TrendingUp className="h-4 w-4 text-[#007D5A]" />
                          <span>價格定位</span>
                        </div>
                        <span className="text-[10px] text-[#66736C]">
                          {c.district}・{c.layout}・中古公寓
                        </span>
                      </div>

                      {/* 兩張子卡直接當網格項目，不再多包一層外框（避免框中框） */}
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      {/* ── 左：本案開價 ＋ 三方對照 ＋ 價格區間軸 ── */}
                      <div className="border border-[#DDE3DF] bg-white p-4 sm:px-5 sm:pb-2 sm:pt-5">
                        <div className="grid gap-6 sm:grid-cols-3 sm:items-stretch">
                          <div className="self-stretch border-l-[3px] border-[#007D5A] pl-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-bold text-[#1A2A22]">本案開價</p>
                              <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[11px] font-bold text-[#007D5A]">
                                中古公寓
                              </span>
                            </div>
                            <p className="mt-1 flex items-baseline gap-1">
                              <span className="text-[54px] font-black leading-[0.95] tracking-tight text-[#1A2A22] tabular-nums">
                                {priceMan.toLocaleString()}
                              </span>
                              <span className="text-xl font-bold text-[#3F5147]">萬円</span>
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#66736C]">
                              {saleAnalysis.areaSqm && (
                                <span className="tabular-nums">{saleAnalysis.areaSqm} ㎡</span>
                              )}
                              {saleAnalysis.tsuboAndSqm.tsuboPriceMan != null && (
                                <>
                                  <span className="hidden h-3 w-px bg-[#DDE3DF] sm:inline-block" />
                                  <span className="tabular-nums">每坪 {saleAnalysis.tsuboAndSqm.tsuboPriceMan.toFixed(1)} 萬円</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 sm:col-span-2">
                            {/* 價格與來源共用同一網格：兩組靠右排列，並維持上下色線對齊。 */}
                            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-[max-content_max-content] lg:justify-end">
                              {benchmarks.map(item => (
                                <div key={item.key} className="min-w-[180px] border-l-2 pl-2.5" style={{ borderColor: item.tone }}>
                                  <p
                                    className="text-[11px] font-bold"
                                    style={{ color: item.tone }}
                                  >
                                    {item.label}
                                  </p>
                                  <p className="mt-0.5 text-lg font-bold tabular-nums text-[#1A2A22]">
                                    {item.value.toLocaleString()}
                                    <span className="ml-0.5 text-[10px] font-normal text-[#66736C]">萬円</span>
                                  </p>
                                  {tsuboOf(item.value) && (
                                    <p className="mt-0.5 text-[10px] tabular-nums text-[#8A9590]">
                                      每坪 {tsuboOf(item.value)} 萬円
                                    </p>
                                  )}
                                </div>
                              ))}

                              <p className="mt-1 text-[9px] font-bold tracking-wide text-[#8A9590] sm:col-span-2">資料與計算方式</p>
                              <p className="border-l-2 pl-2 text-[9px] leading-relaxed text-[#66736C]" style={{ borderColor: "#0284C7" }}>
                                <strong className="font-bold text-[#0284C7]">實價登錄</strong>
                                <span>：國土交通省實價登錄 {c.sampleCount} 筆。</span>
                              </p>
                              {c.listingBenchmarkSourceLabel && (
                                <p className="border-l-2 pl-2 text-[9px] leading-relaxed text-[#66736C]" style={{ borderColor: "#FB923C" }}>
                                  <strong className="font-bold text-[#FB923C]">市場在售</strong>
                                  <span>：{c.listingBenchmarkSourceLabel}。</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 價格區間軸 */}
                        {hasFairRange && (
                          <div className="mt-6 border-t border-[#E8ECE9] pt-5">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <p className="text-sm font-black text-[#1A2A22]">該區域同類物件合理價格區間</p>
                              <p className="border border-[#DDE3DF] bg-[#F5F8F6] px-2.5 py-1 text-xs font-black tabular-nums text-[#1A2A22]">
                                {man(fairLow)} 〜 {man(fairHigh)} 萬円
                              </p>
                            </div>

                            <div className="mt-4 px-4 pt-12 sm:px-6">
                              <div className="relative h-3 w-full bg-[#E1E7E4]">
                                <div
                                  className="absolute inset-y-0 bg-[#CFEFE5]"
                                  style={{ left: `${pos(fairLow as number)}%`, width: `${pos(fairHigh as number) - pos(fairLow as number)}%` }}
                                />
                                {/* 上下限刻度、數字標籤與本案指標全部共用同一個 X 座標。 */}
                                {[fairLow as number, fairHigh as number].map(v => (
                                  <div key={v} className="absolute -top-1.5 h-6 w-[3px] -translate-x-1/2 bg-[#718078]" style={{ left: `${pos(v)}%` }} />
                                ))}
                                {benchmarks.map(b => (
                                  <div
                                    key={b.key}
                                    className="absolute -top-2 h-7 w-[3px] -translate-x-1/2"
                                    style={{ left: `${pos(b.value)}%`, backgroundColor: b.tone }}
                                  />
                                ))}
                                <div
                                  className="absolute -top-12 z-10 flex -translate-x-1/2 flex-col items-center"
                                  style={{ left: `${pos(priceMan)}%` }}
                                >
                                  <span
                                    className="whitespace-nowrap px-3 py-1.5 text-center text-[11px] font-black leading-tight text-white shadow-sm"
                                    style={{ backgroundColor: fairState.accent }}
                                  >
                                    本案 <span className="tabular-nums">{priceMan.toLocaleString()}</span>
                                  </span>
                                  <span
                                    className="h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent"
                                    style={{ borderTopColor: fairState.accent }}
                                  />
                                </div>
                                <div
                                  className="absolute -top-2 h-7 w-[3px] -translate-x-1/2"
                                  style={{ left: `${pos(priceMan)}%`, backgroundColor: fairState.accent }}
                                />
                              </div>

                              <div className="relative mt-3 h-8">
                                <span
                                  className="absolute min-w-[56px] -translate-x-1/2 text-center text-[10px] font-semibold leading-tight text-[#66736C]"
                                  style={{ left: `${pos(fairLow as number)}%` }}
                                >
                                  <span className="block text-xs font-black tabular-nums text-[#1A2A22]">{man(fairLow)}</span>
                                  下限
                                </span>
                                {/* 行情標籤與刻度同樣共用原始座標；過近時僅保留實價登錄平均。 */}
                                {(() => {
                                  const edges = [pos(fairLow as number), pos(fairHigh as number)];
                                  const clear = (p: number) => edges.every(e => Math.abs(p - e) >= 10);
                                  const shown = benchmarks.filter(b => clear(pos(b.value)));
                                  const spaced = shown.length === 2
                                    && Math.abs(pos(shown[0].value) - pos(shown[1].value)) < 12
                                    ? shown.filter(b => b.key === "official")
                                    : shown;
                                  return spaced.map(b => (
                                    <span
                                      key={b.key}
                                      className="absolute min-w-[72px] -translate-x-1/2 text-center text-[10px] font-semibold leading-tight"
                                      style={{ left: `${pos(b.value)}%`, color: b.tone }}
                                    >
                                      <span className="block text-xs font-black tabular-nums">{man(b.value)}</span>
                                      {b.label}
                                    </span>
                                  ));
                                })()}
                                <span
                                  className="absolute min-w-[56px] -translate-x-1/2 text-center text-[10px] font-semibold leading-tight text-[#66736C]"
                                  style={{ left: `${pos(fairHigh as number)}%` }}
                                >
                                  <span className="block text-xs font-black tabular-nums text-[#1A2A22]">{man(fairHigh)}</span>
                                  上限
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── 右：相對位置 ── */}
                      <div className="border border-[#DDE3DF] bg-white p-4 sm:px-5 sm:pb-2 sm:pt-5">
                        <p className="text-xs font-bold text-[#1A2A22]">相對位置</p>

                        <div className="mt-3 space-y-3">
                          {benchmarks.map(b => {
                            const d = b.diff;
                            const isBelow = (d ?? 0) < 0;
                            const Icon = isBelow ? TrendingDown : TrendingUp;
                            return (
                              <div key={b.key}>
                                <p className="text-[10px] leading-relaxed text-[#66736C]">
                                  與{b.label} <span className="tabular-nums">{b.value.toLocaleString()}</span> 萬円相比
                                </p>
                                {d == null ? (
                                  <p className="mt-1 border border-[#DDE3DF] bg-[#F5F8F6] p-2 text-[11px] text-[#8A9590]">
                                    缺少可比對的數值
                                  </p>
                                ) : (
                                  <div className={`mt-1 flex items-center gap-2.5 border p-2.5 ${
                                    isBelow ? "border-[#9EE2CF] bg-[#E6F6F1]" : "border-[#EAB879] bg-[#FEF3C7]"
                                  }`}>
                                    <span
                                      className="flex h-7 w-7 shrink-0 items-center justify-center text-white"
                                      style={{ backgroundColor: isBelow ? "#007D5A" : "#D97706" }}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </span>
                                    <span
                                      className="text-2xl font-black leading-none tabular-nums"
                                      style={{ color: isBelow ? "#007D5A" : "#D97706" }}
                                    >
                                      {d >= 0 ? "+" : "−"}{Math.abs(Math.round(d))}%
                                    </span>
                                    <span className="text-[10px] leading-tight text-[#3F5147]">
                                      {isBelow ? "低於" : "高於"}
                                      <br />{b.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-3 border-l-2 border-[#007D5A] bg-[#F5F8F6] p-3 text-[11px] leading-relaxed text-[#1A2A22]">
                          本案開價
                          {c.rawDiffPercent != null && (
                            <>{c.rawDiffPercent >= 0 ? "高於" : "低於"}實價登錄平均 <strong className="font-bold">{Math.abs(Math.round(c.rawDiffPercent))}%</strong></>
                          )}
                          {c.listingDiffPercent != null && (
                            <>，{c.listingDiffPercent >= 0 ? "也高於" : "也低於"}市場在售平均 <strong className="font-bold">{Math.abs(Math.round(c.listingDiffPercent))}%</strong></>
                          )}
                          。
                          {hasFairRange && <>納入面積、車站距離、樓層與現況條件校準後，{fairState.short}。</>}
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* ── 影響價格的主要因素：獨立成一個模組，標題層級與租賃一致 ── */}
                    {c.priceFactors && c.priceFactors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                            <Sparkles className="h-4 w-4 text-[#007D5A]" />
                            <span>影響價格的主要因素</span>
                          </div>
                          <span className="text-[10px] text-[#66736C]">
                            相對 {c.district} 同房型實價登錄平均 {c.medianPriceMan?.toLocaleString()} 萬円的加減幅度
                          </span>
                        </div>

                        <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                        <dl className="divide-y divide-[#DDE3DF]">
                          {[...c.priceFactors]
                            .sort((a, b) => Math.abs(b.ratePercent) - Math.abs(a.ratePercent))
                            .map((f, i) => {
                              const Icon = factorIcon(f.label);
                              const up = f.ratePercent > 0;
                              const down = f.ratePercent < 0;
                              // 與上方價格定位共用色票：市場在售橘、本案價格綠。
                              const tone = up ? "#FB923C" : down ? "#007D5A" : "#8A9590";
                              const width = Math.min(100, (Math.abs(f.ratePercent) / FACTOR_SCALE) * 100);
                              return (
                                <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                                  <dt className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:shrink-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]">
                                      <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-[#1A2A22]">{f.label}</span>
                                  </dt>
                                  <dd className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
                                    <span className="min-w-0 flex-1 text-right text-[11px] leading-relaxed text-[#66736C]">
                                      {f.note}
                                    </span>
                                    <span className="h-1.5 w-20 shrink-0 bg-[#EDF1EF] sm:w-28">
                                      <span className="block h-full" style={{ width: `${width}%`, backgroundColor: tone }} />
                                    </span>
                                    <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: tone }}>
                                      {up ? "+" : down ? "−" : ""}{Math.abs(f.ratePercent)}%
                                    </span>
                                  </dd>
                                </div>
                              );
                            })}
                        </dl>

                        </div>
                        <p className="text-[10px] leading-relaxed text-[#8A9590]">
                          長度條以 ±{FACTOR_SCALE}% 為滿格，% 僅代表相對區域平均的影響
                        </p>
                      </div>
                    )}

                    {/* ── 注意事項 ── */}
                    {c.priceCautions && c.priceCautions.length > 0 && (
                      <div className="space-y-2 border border-[#EAB879] bg-[#FEF3C7] p-4">
                        {c.priceCautions.map((caution, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                            <p className="text-[11px] leading-relaxed text-[#1A2A22]">
                              {i === 0 && <strong className="mr-1 font-bold text-[#D97706]">注意事項</strong>}
                              {caution}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* 模組 S2：核心買賣數值 Hero 5-Card 網格 */}
              {(() => {
                const heroCards = [
                  {
                    key: "price",
                    icon: Coins,
                    label: "販売價格（總價）",
                    value: saleAnalysis.salePriceMan.toLocaleString(),
                    unit: "萬円",
                    sub: formatYen(saleAnalysis.salePriceYen),
                    primary: true,
                  },
                  {
                    key: "tsubo",
                    icon: Ruler,
                    label: "每坪單價（坪単価）",
                    value: saleAnalysis.tsuboAndSqm.tsuboPriceMan !== null
                      ? saleAnalysis.tsuboAndSqm.tsuboPriceMan.toFixed(1) : "—",
                    unit: "萬円/坪",
                    sub: saleAnalysis.tsuboAndSqm.tsubo !== null
                      ? `專有約 ${saleAnalysis.tsuboAndSqm.tsubo.toFixed(2)} 坪` : "依專有面積折算",
                    primary: false,
                  },
                  {
                    key: "sqm",
                    icon: Maximize2,
                    label: "每平方米單價（㎡単価）",
                    value: saleAnalysis.tsuboAndSqm.sqmPriceMan !== null
                      ? saleAnalysis.tsuboAndSqm.sqmPriceMan.toFixed(1) : "—",
                    unit: "萬円/㎡",
                    sub: saleAnalysis.areaSqm ? `專有面積 ${saleAnalysis.areaSqm} ㎡` : "專有面積換算",
                    primary: false,
                  },
                  {
                    key: "holding",
                    icon: Wallet,
                    label: "每月固定持有支出",
                    value: formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost),
                    unit: "/ 月",
                    sub: `全年合計約 ${formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost * 12)}`,
                    primary: false,
                  },
                  {
                    key: "building",
                    icon: Building,
                    label: "社區規模與屋齡",
                    value: saleAnalysis.buildingHealth.totalUnits ? `${saleAnalysis.buildingHealth.totalUnits}` : "—",
                    unit: saleAnalysis.buildingHealth.totalUnits ? "戶" : "",
                    sub: extracted?.age || "建物屋齡",
                    tag: saleAnalysis.buildingHealth.scaleRiskText,
                    primary: false,
                  },
                ];

                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                      <Landmark className="h-4 w-4 text-[#007D5A]" />
                      <span>買賣核心指標與坪單價速覽</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {heroCards.map(card => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.key}
                          className={`p-3 sm:p-3.5 ${card.primary
                            ? "border-2 border-[#00A174] bg-[#F5F8F6]"
                            : "border border-[#DDE3DF] bg-white"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${
                              card.primary ? "bg-[#007D5A] text-white" : "bg-[#E6F6F1] text-[#007D5A]"}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <p className={`text-[11px] font-bold ${card.primary ? "text-[#007D5A]" : "text-[#66736C]"}`}>
                              {card.label}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="flex items-baseline gap-1 text-2xl font-black text-[#1A2A22] tabular-nums">
                              {card.value}
                              {card.unit && (
                                <span className="text-xs font-normal text-[#66736C]">
                                  {card.unit}
                                </span>
                              )}
                            </p>
                            {card.tag && (
                              <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-bold text-[#007D5A]">
                                {card.tag}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[10px] text-[#66736C]">{card.sub}</p>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })()}

              {/* 模組 S2.5：物件基本規格・交通與設備（與租賃圖紙同一份整理，買賣端原本整塊缺漏） */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                    <FileSpreadsheet className="h-4 w-4 text-[#007D5A]" />
                    <span>物件基本規格・交通與設備</span>
                  </div>
                  <span className="text-[10px] text-[#66736C]">逐項對照圖紙載明內容</span>
                </div>

                <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4">
                    <div>
                      <dt className="text-[#66736C]">格局（間取り）</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.layout || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">專有面積</dt>
                      <dd className="font-bold text-[#1A2A22]">{displayArea || "未於圖面載明"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">陽台面積（バルコニー）</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.balconyArea || "未於圖面載明"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">屋齡／建築年月</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.age || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">樓層／總階數</dt>
                      <dd className="font-bold text-[#1A2A22]">
                        {[extracted?.floor, extracted?.buildingFloors ? `／共 ${extracted.buildingFloors} 階建` : ""]
                          .filter(Boolean).join("") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">總戶數（総戸数）</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.totalUnits || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">土地權利形式</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.landRights || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">用途地域</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.zoning || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">現況（引渡條件）</dt>
                      <dd className="font-bold text-[#1A2A22]">
                        {extracted?.occupancyStatus || saleAnalysis.occupancyAssessment.statusText || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">管理形態</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.managementStyle || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[#66736C]">建物構造</dt>
                      <dd className="font-bold text-[#1A2A22]">{displayStructure || "未於圖面載明"}</dd>
                    </div>
                  </dl>

                  {/* 交通資訊・最寄り駅路線與徒步 */}
                  {stationItems.length > 0 && (
                    <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1A2A22]">最寄り駅・各路線徒步時間</span>
                        <span className="text-[10px] text-[#66736C]">
                          共確認 {stationItems.length} 個利用車站
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stationItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex flex-wrap items-center gap-2 border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs shadow-2xs"
                          >
                            {item.lineName && (
                              <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-bold text-[#1A2A22]">
                                {item.lineName}
                              </span>
                            )}
                            <span className="font-bold text-[#1A2A22]">{item.stationName} 駅</span>
                            {item.walkMin !== null ? (
                              <span className="text-xs text-[#3F5147]">
                                徒歩 <span className="font-bold text-[#007D5A]">{item.walkMin}</span> 分
                              </span>
                            ) : (
                              <span className="text-xs text-[#66736C]">徒步時間未標註</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 圖紙確認設備與公設規格 */}
                  {equipmentList.length > 0 && (
                    <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#1A2A22]">圖紙設備與建物規格</span>
                          <span
                            className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-medium text-[#007D5A]"
                            title="衛浴分離、獨立洗面、門禁防犯等影響生活品質與行情的關鍵亮點"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#007D5A]" />
                            綠底：核心加分設備
                          </span>
                        </div>
                        <span className="text-[10px] text-[#66736C]">
                          共確認 {equipmentList.length} 項圖面設備
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {equipmentList.map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                              item.highlight
                                ? "border-[#9EE2CF] bg-[#E6F6F1] font-bold text-[#007D5A]"
                                : "border-[#DDE3DF] bg-white text-[#3F5147]"
                            }`}
                            title={item.note ? `${item.nameZh}（${item.note}） 原文：${item.rawJa}` : `原文：${item.rawJa}`}
                          >
                            <span className={item.highlight ? "font-bold text-[#007D5A]" : "text-[#8A9590]"}>✓</span>
                            <span>{item.nameZh}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* 模組 S3：每月固定持有成本逐筆拆解與大樓健康度對比 */}
              <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                <Wallet className="h-4 w-4 text-[#007D5A]" />
                <span>持有成本與大樓體質審查</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {/* 左側：每月固定持有負擔逐筆拆解 */}
                <div className="flex flex-col border border-[#DDE3DF] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                      <Coins className="h-3.5 w-3.5 text-[#1A2A22]" />
                      每月持有成本明細
                    </p>
                    <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-1 text-[11px] font-bold text-[#007D5A]">
                      月合計 {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost)}
                    </span>
                  </div>

                  <div className="flex-1 p-4">
                    <div className="divide-y divide-[#DDE3DF] border border-[#DDE3DF] bg-[#F5F8F6]">
                      {saleAnalysis.monthlyHoldingCosts.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 p-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                              {/^修繕/.test(item.name) ? <Wrench className="h-3.5 w-3.5" /> : <Building className="h-3.5 w-3.5" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1A2A22]">{item.name}</p>
                              <p className="mt-0.5 text-[10px] leading-relaxed text-[#66736C]">{item.note}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-black tabular-nums text-[#1A2A22]">
                            {formatYen(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border border-[#9EE2CF] bg-[#E6F6F1] p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#007D5A] text-white">
                          <Calculator className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-bold text-[#1A2A22]">全年持有現金流成本（12 個月）</span>
                      </div>
                      <span className="shrink-0 text-base font-black tabular-nums text-[#007D5A]">
                        {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost * 12)} / 年
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-[#8A9590]">
                      ※ 不含每年 5〜6 月由地方政府課徵之固定資產稅・都市計畫稅（固都稅）。
                    </p>
                  </div>
                </div>

                {/* 右側：大樓修繕積立金水位與戶數規模風險診斷 */}
                <div className="flex flex-col border border-[#DDE3DF] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1A2A22]" />
                      修繕積立金與大樓體質
                    </p>
                    <span
                      className={`border px-2 py-1 text-[11px] font-bold ${
                        saleAnalysis.buildingHealth.reserveHealthLevel === "healthy"
                          ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                          : saleAnalysis.buildingHealth.reserveHealthLevel === "inadequate"
                            ? "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]"
                            : "border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]"}`}
                    >
                      {saleAnalysis.buildingHealth.reserveHealthText}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 p-4">
                    {/* 每平米修繕金比率 */}
                    <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                            <Wrench className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1A2A22]">每平米每月修繕積立金</p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-[#007D5A]">
                              國土交通省長期修繕計畫提撥基準：200 〜 300 円/㎡/月
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-base font-black tabular-nums text-[#1A2A22]">
                          {saleAnalysis.buildingHealth.reservePerSqm
                            ? `¥${saleAnalysis.buildingHealth.reservePerSqm.toLocaleString()} / ㎡` : "—"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
                        {saleAnalysis.buildingHealth.reserveHealthNote}
                      </p>
                    </div>

                    {/* 戶數規模分析 */}
                    <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                            <Users className="h-3.5 w-3.5" />
                          </span>
                          <p className="text-xs font-bold text-[#1A2A22]">戶數規模風險</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-[#1A2A22]">
                          {saleAnalysis.buildingHealth.scaleRiskText}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
                        {saleAnalysis.buildingHealth.scaleRiskNote}
                      </p>
                    </div>

                    {/* 維護亮點標籤 */}
                    {saleAnalysis.buildingHealth.specialStrengths.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 border border-[#9EE2CF] bg-[#E6F6F1] p-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#007D5A]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          大樓優勢認證
                        </span>
                        {saleAnalysis.buildingHealth.specialStrengths.map((str, i) => (
                          <span key={i} className="text-[11px] font-bold text-[#1A2A22]">{str}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* 模組 S4：物件現況、投資收益與自住法務要點 */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                    <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
                    <span>物件現況・投資回報率與自住法務要點</span>
                  </div>
                  <span className="text-[10px] text-[#66736C]">
                    現況判定：{saleAnalysis.occupancyAssessment.statusText}
                  </span>
                </div>
                {/* 兩張子卡直接當網格項目，不再多包一層外框（避免框中框） */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* 現況與收益性 */}
                  <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                    <p className="text-sm font-bold text-[#1A2A22]">現況使用與收益分析</p>

                    {saleAnalysis.occupancyAssessment.status === "tenanted_investment" &&
                    saleAnalysis.occupancyAssessment.investmentYield ? (
                      <div className="mt-4 space-y-4 text-xs">
                        <div className="border-l-[3px] border-[#00A174] bg-[#F5F8F6] px-4 py-3">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="font-bold text-[#007D5A]">表面租金報酬率</span>
                            <span className="text-2xl font-black leading-none text-[#007D5A] tabular-nums">
                              {saleAnalysis.occupancyAssessment.investmentYield.grossYield.toFixed(2)}%
                            </span>
                          </div>
                          {saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated !== null && (
                            <div className="mt-2 flex items-center justify-between gap-4 border-t border-[#DDE3DF] pt-2 text-[11px]">
                              <span className="text-[#66736C]">實質租金報酬率（扣除管理費與修繕積立金）</span>
                              <span className="shrink-0 font-bold text-[#1A2A22] tabular-nums">
                                約 {saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-1 text-xs">
                          <div>
                            <span className="text-[11px] text-[#66736C]">現況月租金收入</span>
                            <p className="mt-1 font-bold text-[#1A2A22] tabular-nums">
                              {formatYen(saleAnalysis.occupancyAssessment.investmentYield.monthlyRentYen)} / 月
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] text-[#66736C]">現況年間租金總額</span>
                            <p className="mt-1 font-bold text-[#1A2A22] tabular-nums">
                              {formatYen(saleAnalysis.occupancyAssessment.investmentYield.annualIncomeYen)} / 年
                            </p>
                          </div>
                        </div>

                        <p className="border-l-[3px] border-[#D95D39] bg-[#FBDFD2] px-4 py-3 text-[11px] leading-relaxed text-[#B13818]"><strong>帶租約物件注意事項：</strong>本物件為「オーナーチェンジ」，現有租客居住中，買方無法立即交屋自住。交屋時將全面承受現有普通賃貸借契約與押金返還義務。
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className=" border border-[#9EE2CF] bg-[#F5F8F6] p-3">
                          <p className="font-bold text-[#007D5A]">
                            {saleAnalysis.occupancyAssessment.status === "vacant"? "空室／全室翻新完成物件": "現有屋主居住中（相談引渡）"}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#3F5147]">
                            {saleAnalysis.occupancyAssessment.status === "vacant"? "交屋後可隨時自住入住，或依目前市場行情重新招租，靈活性最高。": "交屋時點需配合現屋主搬遷協商，請於簽約前確認引渡猶予期日。"}
                          </p>
                        </div>

                        {extracted?.renovationDetails && (
                          <div className=" border border-[#DDE3DF] bg-[#F5F8F6] p-2.5">
                            <span className="font-bold text-[#1A2A22]">裝修與翻新內容（リノベーション）：</span>
                            <p className="mt-1 text-[11px] text-[#66736C]">{extracted.renovationDetails}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 自住法務要點與住宅貸款減稅門檻 */}
                  <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                    <p className="text-sm font-bold text-[#1A2A22]">產權形式與住宅貸款減稅資格審查</p>

                    <div className="mt-4 text-xs">
                      {/* 住宅貸款減稅檢核 */}
                      <div className={`px-4 py-3 ${
                        saleAnalysis.occupancyAssessment.mortgageTaxEligible
                          ? "border-l-[3px] border-[#00A174] bg-[#F5F8F6]"
                          : "border border-[#EAB879] bg-[#FEF3C7]"
                      }`}>
                        {/* 原本用文字符號 ℹ 當提醒標記，在小字級下幾乎看不見，改用實心告警圖示 */}
                        <div className="flex items-start gap-2 font-bold">
                          {saleAnalysis.occupancyAssessment.mortgageTaxEligible ? (
                            <>
                              <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-[#007D5A]" />
                              <span className="text-[#007D5A]">符合住宅貸款減稅主要面積門檻（50㎡）</span>
                            </>
                          ) : (
                            <>
                              <Info className="mt-px h-4 w-4 shrink-0 text-[#D97706]" />
                              <span className="text-[#D97706]">專有面積未達 50㎡（自住節稅留意）</span>
                            </>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
                          {saleAnalysis.occupancyAssessment.mortgageTaxNote}
                        </p>
                      </div>

                      <dl className="mt-3 divide-y divide-[#E8ECE9]">
                        {/* 土地權利 */}
                        <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 py-2.5">
                          <dt className="text-[#66736C]">土地權利形式</dt>
                          <dd className="text-right font-bold text-[#1A2A22]">
                          {extracted?.landRights || "所有權（所有権）"}
                          </dd>
                        </div>

                        {/* 管理體制 */}
                        <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 py-2.5">
                          <dt className="text-[#66736C]">管理形態與公司</dt>
                          <dd className="text-right font-bold leading-relaxed text-[#1A2A22]">
                          {formatManagementSummary(extracted?.managementCompany, extracted?.managementStyle)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

              </div>

              {/* 模組 S5：買方交屋初期諸費用深度試算 */}
              {saleInitialCosts && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                      <Wallet className="h-4 w-4 text-[#007D5A]" />
                      <span>買方交屋諸費用深度試算</span>
                    </div>
                    <span className="text-[10px] text-[#66736C]">
                      諸費用比率：約 {saleInitialCosts.percentageOfPrice.toFixed(1)}%
                    </span>
                  </div>

                  {/* 總額預估 Banner */}
                  <div className="flex flex-col justify-between gap-4 border border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold text-[#007D5A]">買方交屋諸費用預估總額</p>
                      <p className="mt-1 text-2xl font-black text-[#1A2A22] md:text-3xl">
                        約 {formatYen(saleInitialCosts.total)}
                      </p>
                      <p className="mt-1 text-xs text-[#3F5147]">
                        法定公式精算仲介費、印紙稅、固都稅日割與管修預繳；評價額相關稅費由 AI 辨識／推算
                      </p>
                    </div>

                    <button
                      type="button" onClick={() => setShowSaleCostsDetails(!showSaleCostsDetails)}
                      className="flex shrink-0 items-center justify-center gap-1.5 border border-[#007D5A] bg-white px-4 py-2 text-xs font-bold text-[#007D5A] transition-colors hover:bg-[#E6F6F1] cursor-pointer">
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

                  {taxEstimationSummary && (
                    <p className="border-l-2 border-[#8A9590] bg-[#F5F8F6] px-3 py-2 text-[10px] leading-relaxed text-[#66736C]">
                      <strong className="mr-1 text-[#3F5147]">AI 稅費推算依據</strong>
                      {taxEstimationSummary}
                    </p>
                  )}

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
                          {saleInitialCosts.items.map(item => (
                            <tr key={item.id} className="hover:bg-[#F5F8F6]">
                              <td className="p-2.5 font-bold text-[#1A2A22]">{item.name}</td>
                              <td className="p-2.5 text-right font-bold text-[#007D5A]">
                                {formatYen(item.amount)}
                              </td>
                              <td className="p-2.5 text-[11px] text-[#66736C]">{item.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 border border-[#EAB879] bg-[#FEF3C7] p-4 text-xs leading-relaxed">
                    <div className="mb-1 flex items-center gap-1.5 font-bold text-[#D97706]">
                      <Info className="h-4 w-4 text-[#D97706]" />
                      <span>買方資金準備提醒：</span>
                    </div>
                    <p className="text-[#1A2A22]">
                      固都稅以分析當日至年底的剩餘天數估算，管理費與修繕積立金預繳固定採 3 個月。AI 推算項目仍須以納稅通知書、都道府縣核定及司法書士正式報價為準。
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : isSaleListing ? (
            <>
              {/* 買賣圖紙但圖面未載明販売価格（例如「価格 応相談」「価格未定」），
                  此時不能退回租賃版型硬算，直接說明缺什麼、已讀到什麼，避免整份報告空白。 */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                    <Landmark className="h-4 w-4 text-[#007D5A]" />
                    <span>價格定位</span>
                  </div>
                  <span className="text-[10px] text-[#66736C]">需有販売価格才能進行行情比對</span>
                </div>

                <div className="border border-[#EAB879] bg-[#FEF3C7] p-4 sm:p-5">
                  <div className="flex items-start gap-2.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A2A22]">這份買賣圖紙未載明販売価格，無法進行行情比對</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#3F5147]">
                        圖面上的「価格」欄為空白或標示「応相談」「未定」，因此無法計算每坪單價、實價登錄對照與交屋初期費用。
                        建議向仲介索取載有販売価格的正式版図面後重新上傳，或直接詢問目前的開價。
                      </p>
                    </div>
                  </div>

                  {/* 已讀到的物件基本資料：讓這份報告即使缺價格也仍有可核對的內容 */}
                  <dl className="mt-4 grid gap-x-4 gap-y-2 border-t border-[#EAB879] pt-3 text-xs sm:grid-cols-2">
                    {[
                      { label: "間取り", value: extracted?.layout },
                      { label: "專有面積", value: extracted?.area },
                      { label: "所在階", value: extracted?.floor },
                      { label: "築年月", value: extracted?.age },
                      { label: "管理費", value: extracted?.managementFee },
                      { label: "修繕積立金", value: extracted?.repairReserve },
                      { label: "總戶數", value: extracted?.totalUnits },
                      { label: "土地權利", value: extracted?.landRights },
                    ].filter(item => item.value && String(item.value).trim()).map(item => (
                      <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-[#F0E0BE] pb-1.5">
                        <dt className="shrink-0 text-[#66736C]">{item.label}</dt>
                        <dd className="text-right font-bold text-[#1A2A22]">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 模組 1：每月固定現金支出與條件個別明細 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                  <Coins className="h-4 w-4 text-[#007D5A]" />
                  <span>月額負擔與條件個別拆解</span>
                </div>

                {/* 3 大金額重點卡片 */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* 每月總額（核心重點） */}
                  <div className="border-2 border-[#1A2A22] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold text-[#1A2A22]">每月總負擔（總賃料）</p>
                    <p className="mt-1 text-2xl font-black text-[#1A2A22]">
                      {formatYen(totalMonthlyCost)}
                      <span className="text-xs font-normal text-[#66736C]"> / 月</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[#66736C]">房租 ＋ 管理費每月實付總額</p>
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
                <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-4">
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
                      <dt className="text-[#66736C]">屋齡／建築年月</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.age || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#66736C]">樓層／總階數</dt>
                      <dd className="font-bold text-[#1A2A22]">{extracted?.floor || "—"}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <dt className="text-[#66736C]">建物構造</dt>
                      <dd className="font-bold text-[#1A2A22]">
                        {displayStructure || "未於圖面載明"}
                      </dd>
                    </div>
                  </dl>

                  {/* 交通資訊・最寄り駅路線與徒步（分開獨立列點、標記所屬線路） */}
                  {stationItems.length > 0 && (
                    <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1A2A22]">最寄り駅・各路線徒步時間</span>
                        <span className="text-[10px] text-[#66736C]">
                          共確認 {stationItems.length} 個利用車站
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stationItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex flex-wrap items-center gap-2 border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs shadow-2xs"
                          >
                            {item.lineName && (
                              <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-bold text-[#1A2A22]">
                                {item.lineName}
                              </span>
                            )}
                            <span className="font-bold text-[#1A2A22]">{item.stationName} 駅</span>
                            {item.walkMin !== null ? (
                              <span className="text-xs text-[#3F5147]">
                                徒歩 <span className="font-bold text-[#007D5A]">{item.walkMin}</span> 分
                              </span>
                            ) : (
                              <span className="text-xs text-[#66736C]">徒步時間未標註</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 圖紙確認設備與公設規格 */}
                  {equipmentList.length > 0 && (
                    <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#1A2A22]">圖紙設備與建物規格</span>
                          <span
                            className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-medium text-[#007D5A]"
                            title="衛浴分離、獨立洗面、門禁防犯等影響生活品質與行情的關鍵亮點"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#007D5A]" />
                            綠底：核心加分設備
                          </span>
                        </div>
                        <span className="text-[10px] text-[#66736C]">
                          共確認 {equipmentList.length} 項圖面設備
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {equipmentList.map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                              item.highlight
                                ? "border-[#9EE2CF] bg-[#E6F6F1] font-bold text-[#007D5A]"
                                : "border-[#DDE3DF] bg-white text-[#3F5147]"
                            }`}
                            title={item.note ? `${item.nameZh}（${item.note}） 原文：${item.rawJa}` : `原文：${item.rawJa}`}
                          >
                            <span className={item.highlight ? "font-bold text-[#007D5A]" : "text-[#8A9590]"}>✓</span>
                            <span>{item.nameZh}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 模組 2：租金行情診斷（同層級，無多餘外層大框框） */}
              {result.verdict && (() => {
                const style = getStatusStyle(result.verdict.status);
                const detailStr = cleanVerdictDetail || "";
                const advantageMatch = detailStr.match(/^(.*?)(?:但此物件具備明顯優勢：)(.*?)(?:。)(.*)$/);
                const prefixText = advantageMatch ? advantageMatch[1].trim() : "";
                const tags = advantageMatch
                  ? advantageMatch[2].split("；").map(t => t.trim()).filter(Boolean)
                  : [];
                const conclusionText = advantageMatch ? advantageMatch[3].trim() : "";

                return (
                  <div className="space-y-3">
                    {/* 區塊頂部標題列：與其他模組保持完全一致的層級 */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                        <TrendingUp className="h-4 w-4 text-[#007D5A]" />
                        <span>租金行情診斷</span>
                      </div>
                      <span className="text-[10px] text-[#66736C]">
                        綜合總賃料、站距、屋齡與設備規格評定
                      </span>
                    </div>

                    {/* 行情分析與評估內容卡片 */}
                    <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
                      {/* 核心結論大字與評定標籤 */}
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {result.verdict.status}
                        </span>
                        <h4 className="min-w-0 flex-1 text-sm font-bold leading-relaxed text-[#1A2A22] sm:text-base">
                          {cleanVerdictHeadline}
                        </h4>
                      </div>

                      {/* 中層：同區公開行情對照面板（獨立橫向 Data Strip） */}
                      {result.range && (
                        <div className="mt-3 flex flex-col gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#66736C]">同區同房型公開行情：</span>
                              <span className="font-mono font-bold text-[#1A2A22]">
                                {formatYen(result.range.low)} ～ {formatYen(result.range.high)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#66736C]">區域中位數：</span>
                              <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[11px] font-mono font-bold text-[#007D5A]">
                                {formatYen(result.range.median)}
                              </span>
                            </div>
                          </div>

                          {result.range?.sourceUrl && (
                            <div className="text-[11px] text-[#66736C]">
                              來源：
                              <a
                                href={result.range.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#007D5A] underline underline-offset-2 hover:text-[#00A174]"
                              >
                                {result.range.sourceLabel || "At Home 刊登物件直近 3 個月租金平均"}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 下層：Linus 顧問觀點（條理化拆解與優勢 Tag） */}
                      {cleanVerdictDetail && (
                        <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                            <Sparkles className="h-3.5 w-3.5 text-[#007D5A]" />
                            <span>市場行情與條件綜合評估</span>
                          </div>

                          {advantageMatch ? (
                            <div className="space-y-2 text-xs text-[#3F5147]">
                              {prefixText && (
                                <p className="leading-relaxed">{prefixText}</p>
                              )}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-[#66736C]">具備核心優勢：</span>
                                  {tags.map((rawTag, idx) => {
                                    const tagClean = rawTag.replace(/^配備\s*/, "").trim();
                                    const match = tagClean.match(/^([^(（]+)(?:[(（](.*?)[)）])?$/);
                                    const mainTitle = match ? match[1].trim() : tagClean;
                                    const rawNote = match && match[2] ? match[2].trim() : null;
                                    const isLong = rawNote && rawNote.length > 8;
                                    const displayNote = rawNote && !isLong ? rawNote : null;
                                    const tooltip = rawNote || undefined;

                                    return (
                                      <span
                                        key={idx}
                                        title={tooltip}
                                        className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[11px] font-bold text-[#007D5A]"
                                      >
                                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#007D5A]" />
                                        <span>{mainTitle}</span>
                                        {displayNote && (
                                          <span className="text-[10px] font-medium opacity-85">
                                            （{displayNote}）
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              {conclusionText && (
                                <p className="border-l-2 border-[#007D5A] bg-[#F5F8F6] p-2.5 text-xs font-medium leading-relaxed text-[#1A2A22]">
                                  {conclusionText}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed text-[#3F5147]">
                              {cleanVerdictDetail}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 模組 3：初期費用深度試算與分析（同層級，無多餘外層大框框） */}
              {initialCost && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                      <Wallet className="h-4 w-4 text-[#007D5A]" />
                      <span>初期費用深度試算與分析</span>
                    </div>
                    <span className="text-[10px] text-[#66736C]">
                      依圖紙費用表、租約特約與常態行情精算
                    </span>
                  </div>

                  {/* 總額預估 Banner */}
                  <div className="flex flex-col justify-between gap-4 border border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-[#007D5A]">簽約入住預估總費用</p>
                        <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-bold ${
                          initialCost.level === "low" ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]" : initialCost.level === "high" ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`}>
                          行情對照：{initialCost.levelText}
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-black text-[#1A2A22] md:text-3xl">
                        {formatYen(initialCost.totalMin)} ～ {formatYen(initialCost.totalMax)}
                      </p>
                      <p className="mt-1 text-xs text-[#3F5147]">
                        約相當於月總租金的 <strong className="font-bold text-[#007D5A]">{initialCost.monthsMultipleMin} ～ {initialCost.monthsMultipleMax} 倍</strong>（取決於實際起租日與保證會社方案）
                      </p>
                    </div>

                    <button
                      type="button" onClick={() => setShowInitialCostDetails(!showInitialCostDetails)}
                      className="flex shrink-0 items-center justify-center gap-1.5 border border-[#007D5A] bg-white px-4 py-2 text-xs font-bold text-[#007D5A] transition-colors hover:bg-[#E6F6F1] cursor-pointer">
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
                    <div className="space-y-2">
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
                          <tbody className="divide-y border-[#DDE3DF]">
                            {initialCost.items.map(item => (
                              <tr key={item.id} className="hover:bg-[#F5F8F6]">
                                <td className="p-2.5 font-bold text-[#1A2A22]">{item.name}</td>
                                <td className="p-2.5">
                                  {item.isFromFlyer ? (
                                    <span className="inline-block border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-bold text-[#007D5A]">
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

                  {/* 簽約與初期費用提醒 */}
                  {initialCost.tips.length > 0 && (
                    <div className="border border-[#EAB879] bg-[#FEF3C7] p-4 text-xs leading-relaxed">
                      <div className="mb-1.5 flex items-center gap-1.5 font-bold text-[#D97706]">
                        <Info className="h-4 w-4 text-[#D97706]" />
                        <span>簽約與初期費用提醒：</span>
                      </div>
                      <ul className="space-y-1.5 pl-5 list-disc text-[#1A2A22]">
                        {initialCost.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 模組 4：圖紙契約重要特約與法務注意事項（同層級，無多餘外層大框框） */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                  <ShieldAlert className="h-4 w-4 text-[#007D5A]" />
                  <span>圖紙契約重要特約與法務注意事項</span>
                </div>

                {/* 1. 敷引／償却（契約重要特約提醒） */}
                {hasShikibiki ? (
                  <div className="border border-[#FFA39E] bg-[#FFF1F0] p-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-[#FFA39E] bg-white px-2 py-0.5 text-[10px] font-bold text-[#CF1322]">
                          特約押金不退
                        </span>
                        <strong className="text-xs font-bold text-[#CF1322] sm:text-sm">
                          「敷引／償却」約定：{formattedShikibiki}
                        </strong>
                      </div>
                      <p className="text-xs leading-relaxed text-[#1A2A22]">
                        此項約定代表退租時該筆押金將作為固定扣抵（通常用於屋況折舊與清潔修繕），不予退還。在規劃初期費用時，建議直接將其視為不可收回的固定支出；簽約前亦建議向仲介確認該款項是否已包含退租清潔費，以保障承租權益。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 border border-[#9EE2CF] bg-[#E6F6F1] p-3 text-xs text-[#007D5A]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007D5A]" />
                    <p className="leading-relaxed">
                      <strong className="text-[#1A2A22]">敷引約定：</strong>圖紙未載明退租扣抵條款。退租時押金在扣除承租人修繕責任後，餘額將正常返還。
                    </p>
                  </div>
                )}

                {/* 2. 違約金、更新料、保證會社與火災保險條款網格 */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* 短期解約違約金 */}
                  <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                    <p className="text-[11px] font-bold text-[#66736C]">短期解約違約金</p>
                    <p className="mt-1 text-xs font-black text-[#1A2A22]">
                      {hasPenalty ? extracted?.cancellationPenalty : "未特別標註（依常態條款）"}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                      {hasPenalty
                        ? "若於約定期限內提早解約，需依約支付短期解約違約金。"
                        : "日本常態租約多為 2 年期，常見約定未滿 1 年解約需支付 1 個月租金，請於簽約前確認重要事項說明書。"}
                    </p>
                  </div>

                  {/* 契約更新料 */}
                  <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                    <p className="text-[11px] font-bold text-[#66736C]">契約更新料</p>
                    <p className="mt-1 text-xs font-black text-[#1A2A22]">
                      {hasRenewal ? extracted?.renewalFee : "每 2 年新租金 1 個月（常態）"}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                      每 2 年續約時支付之固定更新費用；亦請留意管理公司是否另收約 0.25～0.5 個月之更新事務手續費。
                    </p>
                  </div>

                  {/* 保證會社方案 */}
                  <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                    <p className="text-[11px] font-bold text-[#66736C]">保證會社費用</p>
                    <p className="mt-1 text-xs font-black text-[#1A2A22]">
                      {extracted?.guaranteeFee ? (
                        extracted.guaranteeFee.startsWith("保")
                          ? extracted.guaranteeFee
                          : `保證料：${extracted.guaranteeFee}`
                      ) : "外國籍利用必須"}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                      {(() => {
                        const fee = (extracted?.guaranteeFee || "").trim();
                        const hasMonthly = /月次|月額|毎月|月\s*1%|月\s*2%/i.test(fee);
                        const hasAnnual = /年|1万|10,?000|更新料/i.test(fee) && !/2年/i.test(fee);

                        if (hasMonthly) {
                          return "外國籍租客原則上必須加入保證會社。圖紙已約定月次保證料（隨每月租金支付），此方案次年通常無需再繳交每年約 1 萬円之年次更新料。";
                        }
                        if (hasAnnual) {
                          return "外國籍租客原則上必須加入保證會社；除簽約時之初回保證料外，次年起需依約每年支付更新保證料。";
                        }
                        if (fee) {
                          return "外國籍租客原則上必須加入保證會社；除初回保證料外，次年起依會社方案多為「每年約 1 萬円更新料」或「月次約 1%～2% 保證料」。";
                        }
                        return "外國籍租客原則上必須加入日本家賃債務保證會社；次年起依會社方案多有每年約 1 萬円之更新保證料或月次保證料。";
                      })()}
                    </p>
                  </div>

                  {/* 火災／家財保險 */}
                  <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                    <p className="text-[11px] font-bold text-[#66736C]">火災／家財保險</p>
                    <p className="mt-1 text-xs font-black text-[#1A2A22]">
                      {extracted?.insuranceFee ? (
                        extracted.insuranceFee.includes("保")
                          ? extracted.insuranceFee
                          : `保費：${extracted.insuranceFee}`
                      ) : "常態約 1.8 萬 ～ 2.2 萬円（2 年期）"}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
                      {extracted?.insuranceFee
                        ? "圖紙指定之 2 年期火災與租客家財賠償責任險；簽約時加入，每 2 年隨租約更新續保。"
                        : "日本租屋必備之火災與借家人賠償責任保險，保障個人財物與突發事故賠償責任；每 2 年隨租約更新。"}
                    </p>
                  </div>
                </div>

                {/* 3. 特約事項與生活限制備註：全部條列、統一字體與卡片設計 */}
                {specialNotesParsed.length > 0 && (
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-[#007D5A]" />
                        <span className="text-xs font-bold text-[#1A2A22]">
                          圖紙其他特約・生活規範與備考事項
                        </span>
                        <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-bold text-[#66736C]">
                          共 {specialNotesParsed.length} 項條款
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSpecialNotes(!showSpecialNotes)}
                        className="flex items-center gap-1 text-xs font-bold text-[#007D5A] hover:text-[#00A174] cursor-pointer"
                        aria-expanded={showSpecialNotes}
                      >
                        <span>{showSpecialNotes ? "收合條款解析" : "展開查看條款解析"}</span>
                        {showSpecialNotes ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {showSpecialNotes && (
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {specialNotesParsed.map((item, idx) => (
                          <div
                            key={idx}
                            className="border border-[#DDE3DF] bg-[#F5F8F6] p-3 transition-colors"
                          >
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`border px-1.5 py-0.5 text-[10px] font-bold ${getSpecialNoteTagStyle(item.category, item.badgeTone)}`}
                              >
                                {item.category}
                              </span>
                              <span className="text-xs font-bold text-[#1A2A22]">{item.title}</span>
                            </div>

                            <p className="mt-1.5 text-xs leading-relaxed text-[#3F5147]">
                              {item.explanation}
                            </p>

                            {item.rawJapanese && (
                              <p className="mt-1.5 text-[10px] text-[#66736C]">
                                圖紙原文：{item.rawJapanese}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
      )}

          {/* 模組：地理位置實況、真實步行時間比對與 1.2km 生活機能 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                <MapPin className="h-4 w-4 text-[#007D5A]" />
                <span>地址定位與周邊生活機能</span>
              </div>
              <span className="text-[10px] text-[#66736C]">
                真實道路步行時間比對與 1.2km 生活圈
              </span>
            </div>

            {locationLoading && (
              <div className="flex items-center justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                <div className="flex items-center gap-2.5">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#007D5A]" />
                  <div>
                    <p className="text-xs font-bold text-[#1A2A22]">正在定位門牌與檢索周邊生活機能設施…</p>
                    <p className="mt-0.5 text-[11px] text-[#66736C]">比對真實道路步行時間，並搜尋周邊 1.2km 超商、超市、藥妝、公園等生活設施</p>
                  </div>
                </div>
              </div>
            )}

            {locationError && !locationLoading && (
              <div className="flex flex-col gap-2 border border-[#E8C4A8] bg-[#FFF9ED] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-[#7A5A1F]">{locationError}</p>
                {result && (
                  <button
                    type="button"
                    onClick={() => void loadLocationContext(result)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 border border-[#007D5A] bg-[#007D5A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#006548]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> 重新載入設施與地圖
                  </button>
                )}
              </div>
            )}

            {locationContext && (
              <div className="space-y-4">
                {/* 定位地址標頭列 */}
                <div className="flex items-center justify-between bg-[#F5F8F6] p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#66736C]">定位地址：</span>
                    <span className="font-bold text-[#1A2A22]">{locationContext.matchedAddress}</span>
                  </div>
                  {result && (
                    <button
                      type="button"
                      onClick={() => void loadLocationContext(result)}
                      disabled={locationLoading}
                      className="flex items-center gap-1 border border-[#DDE3DF] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#66736C] hover:bg-[#E8ECE9] hover:text-[#1A2A22]"
                      title="重新整理周邊生活機能設施"
                    >
                      <RefreshCw className={`h-3 w-3 ${locationLoading ? "animate-spin" : ""}`} /> 重新整理
                    </button>
                  )}
                </div>

                {locationContext.notices?.map(notice => (
                  <p key={notice} className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{notice}</p>
                ))}

                {/* 實際步行時間比對：改為緊湊俐落的水平卡片，不再鬆散佔位 */}
                {locationContext.stationWalks.length > 0 && (
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#007D5A]">
                        <Footprints className="h-4 w-4 text-[#007D5A]" />
                        <span>真實道路步行時間比對</span>
                      </div>
                      <span className="text-[10px] text-[#66736C]">依公開道路步行路徑計算</span>
                    </div>

                    <div className="space-y-2.5">
                      {locationContext.stationWalks.map(walk => (
                        <div
                          key={walk.station}
                          className={`flex flex-col justify-between gap-3 border p-3 transition-colors sm:flex-row sm:items-center ${
                            walk.needsAttention ? "border-[#DCC8A1] bg-[#FFFDF8]" : "border-[#E8ECE9] bg-[#FAFCFB]"}`}
                        >
                          {/* 車站與距離 */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#1A2A22]">{walk.station}駅</span>
                              <span className={`border px-2 py-0.5 text-[10px] font-semibold ${
                                walk.source === "nearby"
                                  ? "border-[#C9D2CD] bg-[#F5F8F6] text-[#66736C]"
                                  : "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                              }`}>
                                {walk.source === "nearby" ? "附近補充" : "圖紙刊載"}
                              </span>
                              <span className="bg-white px-2 py-0.5 text-[10px] font-semibold text-[#66736C] border border-[#DDE3DF]">
                                約 {walk.distanceMeters.toLocaleString("zh-TW")}m
                              </span>
                            </div>
                            {walk.advertisedMinutes !== null && (
                              <p className={`mt-1 text-[11px] ${walk.needsAttention ? "font-bold text-[#7A5A1F]" : "text-[#66736C]"}`}>
                                圖紙標示 {walk.advertisedMinutes} 分；以一般速度計算
                                {walk.differenceMinutes && walk.differenceMinutes > 0
                                   ? `多約 ${walk.differenceMinutes} 分鐘`: "大致相符"}
                              </p>
                            )}
                            {walk.source === "nearby" && (
                              <p className="mt-1 text-[11px] text-[#66736C]">圖紙未刊載，依物件座標補充的附近車站</p>
                            )}
                          </div>

                          {/* 3 段速度緊湊膠囊 */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            <div className="border border-[#DDE3DF] bg-white px-2.5 py-1 text-center">
                              <span className="block text-[9px] text-[#66736C]">快步</span>
                              <span className="block text-xs font-bold text-[#1A2A22]">{walk.fastMinutes}分</span>
                            </div>
                            <div className="border border-[#00A174] bg-[#E6F6F1] px-3 py-1 text-center">
                              <span className="block text-[9px] font-bold text-[#007D5A]">一般常態</span>
                              <span className="block text-sm font-black text-[#007D5A]">{walk.normalMinutes}分</span>
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
                    <div className="flex items-center gap-2 text-xs font-bold text-[#007D5A]">
                      <Store className="h-4 w-4 text-[#007D5A]" />
                      <span>周邊 1.2 公里生活機能與互動地圖</span>
                    </div>
                    <span className="text-[10px] text-[#66736C]">車站最多 3 站　·　生活機能每類別取最近 3 筆</span>
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                <TrainFront className="h-4 w-4 text-[#007D5A]" />
                <span>我的實際通勤試算</span>
              </div>
              <span className="text-[10px] text-[#66736C]">
                門到門全程耗時與轉乘路線精算
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#66736C]">
              輸入公司或學校之完整地址或最近車站，精算從這間房子「出家門到抵達目的地」的全程門到門耗時與轉乘次數。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={commuteDestination}
                onChange={event => setCommuteDestination(event.target.value)}
                onKeyDown={event => { if (event.key === "Enter") void analyzeCommute(); }}
                placeholder="例如：東京都新宿区西新宿2-8-1 或 新宿駅" className="min-h-11 flex-1 border border-[#8A9590] px-3.5 text-sm text-[#1A2A22] outline-none transition-colors focus:border-[#00A174]"/>
              <button
                type="button" onClick={analyzeCommute}
                disabled={!commuteDestination.trim() || commuteLoading || locationLoading || (!locationContext?.stationWalks.length && !result.extracted.station)}
                className="flex min-h-11 items-center justify-center gap-2 bg-[#1A2A22] px-5 text-xs font-bold text-white transition-colors hover:bg-[#3F5147] disabled:cursor-not-allowed disabled:opacity-45">
                {commuteLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {commuteLoading ? "計算中…" : "計算門到門通勤"}
              </button>
            </div>
            {commuteError && <p className="mt-2 bg-[#FEF3C7] p-3 text-xs text-[#D97706]">{commuteError}</p>}
            {commute && (
              <div className="mt-3 border border-[#DDE3DF] bg-[#F5F8F6] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#007D5A]">全程門到門通勤時間</p>
                    <p className="mt-1 text-base font-bold text-[#1A2A22]">{commute.destinationStation}駅方向・轉乘 {commute.transfers} 次</p>
                  </div>
                  <p className="shrink-0 text-3xl font-black text-[#007D5A]">約 {commute.totalMinutes} 分</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#3F5147]">
                  出門步行 {commute.originWalkMinutes} 分 ＋ 電車 {commute.transitMinutes} 分 ＋ 出站抵達 {commute.destinationWalkMinutes} 分
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#66736C]">目的地定位：{commute.destinationAddress}</p>
                {commute.destinationResolutionNote && (
                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#D97706]">{commute.destinationResolutionNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
