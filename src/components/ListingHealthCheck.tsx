import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  FileSpreadsheet,
  FileText,
  Footprints,
  Info,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrainFront,
  Trash2,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";
import type { AxisStatus } from "../lib/requirementVerdict";
import type { ListingLocationContext } from "../lib/listingLocation";

/**
 * 物件圖紙健檢：上傳仲介提供的物件概要書／図面（單張圖紙或 PDF），
 * 深度讀取租金、管理費、禮押金與各項雜費，進行所在地區行情比對、
 * 初期費用全面預測試算、實際步行與周邊機能診斷。
 */

// 改為單張圖紙上傳：日本不動產物件概要書（マイソク / Maisoku）絕大多數均為單頁橫式（A4/B4），
// 單張上傳能避免順序錯亂、縮短辨識等待時間，並大幅簡化使用者操作體驗。
const MAX_FILES = 1;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = "image/*,application/pdf";
const MAX_UPLOAD_DIMENSION = 2000;
const JPEG_QUALITY = 0.8;

const STATUS_STYLE: Record<AxisStatus, { badge: string; box: string }> = {
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

interface ExtractedFields {
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
  extracted: ExtractedFields;
  parsed: {
    rent: number | null;
    managementFee: number | null;
    keyMoney: number | null;
    deposit: number | null;
    roomType: string | null;
    area?: number | null;
    structure?: string | null;
  };
  range: { low: number; median: number; high: number } | null;
  verdict: { status: AxisStatus; headline: string; detail: string } | null;
  initialCostMonths: number | null;
  initialCostEstimate?: InitialCostEstimate | null;
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

async function encodeForUpload(file: File): Promise<{ mimeType: string; data: string }> {
  if (file.type === "application/pdf") {
    return { mimeType: file.type, data: await fileToBase64(file) };
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

  const items: InitialCostBreakdownItem[] = [
    {
      id: "deposit",
      name: "敷金（押金）",
      amount: deposit,
      isFromFlyer: Boolean(result.extracted.deposit),
      note: deposit === 0 ? "免押金（需留意退租時之原狀恢復或預收清掃費條款）" : "擔保性質費用，退租扣除自然折舊外之修繕後退還餘額",
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
      amount: Math.round(totalMonthlyCost * 0.5),
      isFromFlyer: Boolean(result.extracted.guaranteeFee),
      note: result.extracted.guaranteeFee ? `圖紙標示：${result.extracted.guaranteeFee}` : "外國籍租客多數需加入保證公司，一般首年為總租金 50%～100%",
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
      amount: 20000,
      isFromFlyer: Boolean(result.extracted.insuranceFee),
      note: result.extracted.insuranceFee ? `圖紙標示：${result.extracted.insuranceFee}` : "保障租客個人財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
    },
    {
      id: "lockReplacementFee",
      name: "鑰匙更換費（鍵交換代）",
      amount: 22000,
      isFromFlyer: Boolean(result.extracted.lockReplacementFee),
      note: result.extracted.lockReplacementFee ? `圖紙標示：${result.extracted.lockReplacementFee}` : "交屋前換新鎖芯費用（一般鎖約 1.6 萬～2.2 萬円，電子鎖約 3.3 萬円）",
    },
  ];

  if (deposit === 0 || result.extracted.cleaningFee) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: 44000,
      isFromFlyer: Boolean(result.extracted.cleaningFee),
      note: result.extracted.cleaningFee ? `圖紙標示：${result.extracted.cleaningFee}` : "免押金物件通常於簽約初期預收退租清掃費",
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
  if (keyMoney === 0 && deposit === 0) {
    tips.push("本物件為「零禮金、零押金」，初期現金壓力極小；但請注意退租時的清潔費或原狀恢復計費約定。");
  } else if (keyMoney === 0) {
    tips.push("本物件「免禮金」，為您省下致贈房東的謝禮（通常相當於 1 個月租金）。");
  } else if (keyMoney >= rent * 1.5) {
    tips.push("本物件禮金高達 1.5 個月以上，屬於傳統熱門物件或都心精華地段常見設定，初期成本較高。");
  }
  tips.push("【節費技巧】協調起租日在每月 25 號以後，當月日割租金僅需付數天，可顯著壓低第一筆需匯出的初期款項。");
  tips.push("【海外審查提醒】海外租客簽約初期費用多需以日本國內銀行匯款，若由海外電匯請預留約 4,000 円日本端受金手續費與匯差。");

  return { totalMin, totalMax, monthsMultipleMin, monthsMultipleMax, level, levelText, items, tips };
}

export function ListingHealthCheck() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeListingResult | null>(null);
  const [locationContext, setLocationContext] = useState<ListingLocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [commuteDestination, setCommuteDestination] = useState("");
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [commute, setCommute] = useState<ListingCommuteResult | null>(null);
  const [showInitialCostDetails, setShowInitialCostDetails] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ files: [encoded] }),
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

  return (
    <section className="border border-[#1A2A22] bg-white p-6 font-sans md:p-8" aria-label="物件圖紙健檢">
      {/* 區塊頂部標題 */}
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174]">
        <Sparkles className="h-4 w-4" /> Listing Reality Check
      </div>
      <h3 className="mb-2 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
        上傳物件圖紙・全面健檢與初期費用預測
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-[#3F5147]">
        上傳仲介提供的物件概要書或図面（單張圖紙），AI 將自動提取純租金、管理費、禮押金與各項雜費，深度比對大數據租金行情，並精確拆解入住所需的初期費用。
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
            支援單張日本不動產概要書（マイソク / Maisoku）、格局資料照片或 PDF 檔案
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-[#486355]">
            <span className="bg-[#EAEFEA] px-2 py-0.5">JPG / PNG</span>
            <span className="bg-[#EAEFEA] px-2 py-0.5">WEBP / HEIC</span>
            <span className="bg-[#EAEFEA] px-2 py-0.5">PDF</span>
            <span className="ml-1 text-[11px] text-[#66736C]">（自動壓縮最佳化，不留存個人資料）</span>
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
                <p className="text-[11px] text-[#66736C]">單張圖紙辨識中</p>
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
              className="flex min-h-12 w-full items-center justify-center gap-2.5 bg-[#18181B] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>正在深度讀取圖紙費用與條件資訊…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#00a174]" />
                  <span>開始圖紙健檢與初期費用試算</span>
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
                  健檢完成
                </span>
                <span className="text-xs text-[#AAB8B0]">AI 圖紙結構化分析</span>
              </div>
              <p className="mt-1 text-base font-bold">
                {stationSummary ? `${stationSummary}駅周邊` : "日本租賃物件"}
                {extracted?.layout ? `・${extracted.layout}` : ""}
                {extracted?.area ? `（${extracted.area}）` : ""}
              </p>
            </div>
            {result.verdict && (
              <span className={`border px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS_STYLE[result.verdict.status].badge}`}>
                行情判定：{result.verdict.status}
              </span>
            )}
          </div>

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
                    {extracted?.area || (parsed?.area ? `${parsed.area} ㎡` : "—")}
                    {parsed?.area ? `（約 ${(parsed.area / 3.30578).toFixed(1)} 坪）` : ""}
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
                  <dd className="font-bold text-[#1A2A22]">{extracted?.structure || "—"}</dd>
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

          {/* 模組 2：大數據租金行情合理度診斷 */}
          {result.verdict && (
            <div className={`border p-5 ${STATUS_STYLE[result.verdict.status].box}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[result.verdict.status].badge}`}>
                  行情合理度診斷：{result.verdict.status}
                </span>
                {result.range && (
                  <span className="text-xs font-bold text-[#3F5147]">
                    同車站同房型成約區間：{formatYen(result.range.low)} ～ {formatYen(result.range.high)}（中位數 {formatYen(result.range.median)}）
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-bold leading-relaxed text-[#1A2A22]">
                {result.verdict.headline}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#3F5147]">
                {result.verdict.detail}
              </p>
            </div>
          )}

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
                <div className="flex flex-wrap items-start justify-between gap-2 bg-[#F5F8F6] p-3 text-xs">
                  <div>
                    <p className="text-[#66736C]">定位地址</p>
                    <p className="mt-0.5 font-bold text-[#1A2A22]">{locationContext.matchedAddress}</p>
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

                {locationContext.stationWalks.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Footprints className="h-4 w-4 text-[#00a174]" /> 實際路徑步行時間比對
                    </div>
                    <div className="space-y-2">
                      {locationContext.stationWalks.map(walk => (
                        <div key={walk.station} className={`border p-3.5 ${walk.needsAttention ? "border-[#DCC8A1] bg-[#FFF9ED]" : "border-[#DDE3DF] bg-white"}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-bold text-[#1A2A22]">{walk.station}駅</p>
                            <p className="text-[11px] text-[#66736C]">真實道路距離約 {walk.distanceMeters.toLocaleString("zh-TW")}m</p>
                          </div>
                          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                            <div className="border border-[#E8ECE9] bg-[#FAFCFB] p-2">
                              <p className="text-[10px] text-[#66736C]">快走步伐</p>
                              <p className="text-sm font-bold text-[#1A2A22]">{walk.fastMinutes} 分</p>
                            </div>
                            <div className="border border-[#00a174] bg-[#e6f6f1] p-2">
                              <p className="text-[10px] text-[#007d5a]">一般步行常態</p>
                              <p className="text-sm font-bold text-[#007d5a]">{walk.normalMinutes} 分</p>
                            </div>
                            <div className="border border-[#E8ECE9] bg-[#FAFCFB] p-2">
                              <p className="text-[10px] text-[#66736C]">慢走／雨天行李</p>
                              <p className="text-sm font-bold text-[#1A2A22]">{walk.slowMinutes} 分</p>
                            </div>
                          </div>
                          {walk.advertisedMinutes !== null && (
                            <p className={`mt-2 text-[11px] ${walk.needsAttention ? "font-bold text-[#7A5A1F]" : "text-[#66736C]"}`}>
                              圖紙標示 {walk.advertisedMinutes} 分；以一般速度計算{walk.differenceMinutes && walk.differenceMinutes > 0 ? `多約 ${walk.differenceMinutes} 分鐘` : "大致相符"}。
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[#66736C]">
                      依公開地圖的真實步行道路換算；紅綠燈等候、坡度、天候與月台入口深度均會造成個人差異。
                    </p>
                  </div>
                )}

                {locationContext.amenities.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Store className="h-4 w-4 text-[#00a174]" /> 1.2 公里內生活機能設施
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["convenience", "supermarket", "pharmacy", "medical", "school", "park"] as const).map(category => {
                        const items = locationContext.amenities.filter(item => item.category === category);
                        if (!items.length) return null;
                        return (
                          <div key={category} className="border border-[#DDE3DF] bg-white p-3">
                            <p className="mb-1.5 text-[11px] font-bold text-[#007d5a]">{items[0].label}</p>
                            <ul className="space-y-1 text-xs text-[#3F5147]">
                              {items.map(item => (
                                <li key={`${item.source}-${item.name}`} className="flex justify-between gap-2">
                                  <span className="truncate">{item.name}</span>
                                  <span className="shrink-0 text-[#66736C]">約 {item.distanceMeters}m</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
