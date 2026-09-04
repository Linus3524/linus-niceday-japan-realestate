import { useRef, useState, type ChangeEvent } from "react";
import { LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import type { AxisStatus } from "../lib/requirementVerdict";

/**
 * 物件圖紙健檢：上傳仲介提供的物件概要書／図面圖片，讀取結構化資訊，
 * 與所在地區行情比對租金＋管理費是否合理。
 *
 * 與同一頁面既有的「AI 需求分析」是相反的使用情境——那邊回答「我該往哪找」，
 * 這裡回答「我手上這間值不值」，所以刻意做成獨立卡片，不接在同一條步驟流程裡。
 *
 * 這裡的文案（按鈕字樣、隱私提示、結果句子）都先用直白但暫定的寫法，
 * 最終措辭需要站方過目定稿，不是最後版本。
 */

// 必須與 api/analyze-listing.ts 的 MAX_FILES / MAX_TOTAL_IMAGE_BYTES 一致，
// 前端先擋一次能讓使用者當場知道超過限制，不用等一趟網路來回才發現。
const MAX_FILES = 3;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

const STATUS_STYLE: Record<AxisStatus, string> = {
  "符合": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "部分符合": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "需調整": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "待確認": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]",
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
}

interface AnalyzeListingResult {
  extracted: ExtractedFields;
  parsed: {
    rent: number | null;
    managementFee: number | null;
    keyMoney: number | null;
    deposit: number | null;
    roomType: string | null;
  };
  range: { low: number; median: number; high: number } | null;
  verdict: { status: AxisStatus; headline: string; detail: string } | null;
  initialCostMonths: number | null;
}

const formatMan = (value: number) => `${(value / 10000).toLocaleString("zh-TW", { maximumFractionDigits: 1 })} 萬円`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // FileReader 的 data URL 會帶 "data:image/png;base64," 這種前綴，
      // 伺服器只要純 base64 本體，這裡先切掉。
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
  });
}

export function ListingHealthCheck() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeListingResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const overSizeLimit = totalBytes > MAX_TOTAL_IMAGE_BYTES;

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (!picked.length) return;
    setError(null);
    setFiles(current => {
      const merged = [...current, ...picked].slice(0, MAX_FILES);
      return merged;
    });
    // 允許使用者重選同一個檔案（例如先移除又想加回來），input 值要清空。
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(current => current.filter((_, i) => i !== index));
    setResult(null);
  };

  const analyze = async () => {
    if (!files.length || loading || overSizeLimit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const encoded = await Promise.all(
        files.map(async file => ({ mimeType: file.type, data: await fileToBase64(file) }))
      );
      const response = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: encoded }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || `分析失敗（HTTP ${response.status}）。`);
      }
      setResult(body as AnalyzeListingResult);
    } catch (err: any) {
      setError(err?.message || "圖片分析失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const extracted = result?.extracted;
  const stationSummary = extracted?.station
    ? extracted.station
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean)
        .join("、")
    : null;

  return (
    <section className="border border-[#1A2A22] bg-white p-6 font-sans md:p-8" aria-label="物件圖紙健檢">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174]">
        <Sparkles className="h-4 w-4" /> Listing Reality Check
      </div>
      <h3 className="mb-3 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
        上傳物件圖紙，看這間房子的價格合不合理
      </h3>
      <div className="mb-5 space-y-2 text-sm leading-relaxed text-[#3F5147]">
        <p>上傳仲介提供的物件概要書或図面（有寫租金、管理費的那張），AI 會讀取關鍵資訊，並與所在地區的行情比對租金＋管理費是否合理。</p>
        <p className="text-xs text-[#66736C]">圖片僅用於本次分析，伺服器不會另外儲存。</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 border border-[#1A2A22] bg-white px-5 text-sm font-bold text-[#1A2A22] transition-colors hover:bg-[#F5F8F6] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Upload className="h-4 w-4" /> 選擇圖片（最多 {MAX_FILES} 張）
        </button>
        <button
          type="button"
          onClick={analyze}
          disabled={!files.length || loading || overSizeLimit}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#18181B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "正在讀取圖紙…" : "分析這個物件"}
        </button>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-1.5 text-xs text-[#3F5147]">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => removeFile(index)} aria-label={`移除 ${file.name}`} className="shrink-0 text-[#66736C] hover:text-[#B13818]">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {overSizeLimit && (
        <p className="mt-2 text-[10px] text-[#B13818]">
          圖片總大小超過 {Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB，請移除部分檔案或壓縮後再試。
        </p>
      )}
      <p className="mt-2 text-[9px] text-[#66736C]">為保護分析服務額度，同一使用者每 5 分鐘最多分析 3 次。</p>

      {error && <p className="mt-3 bg-[#FBDFD2] p-3 text-xs text-[#B13818]">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4 border-t border-[#DDE3DF] pt-5">
          {/* 抓取欄位摘要 */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#3F5147] sm:grid-cols-3">
            {stationSummary && (
              <div>
                <dt className="text-[#66736C]">車站</dt>
                <dd className="font-bold text-[#1A2A22]">{stationSummary}</dd>
              </div>
            )}
            {extracted?.layout && (
              <div>
                <dt className="text-[#66736C]">格局</dt>
                <dd className="font-bold text-[#1A2A22]">{extracted.layout}</dd>
              </div>
            )}
            {extracted?.age && (
              <div>
                <dt className="text-[#66736C]">屋齡</dt>
                <dd className="font-bold text-[#1A2A22]">{extracted.age}</dd>
              </div>
            )}
            {extracted?.floor && (
              <div>
                <dt className="text-[#66736C]">樓層</dt>
                <dd className="font-bold text-[#1A2A22]">{extracted.floor}</dd>
              </div>
            )}
          </dl>

          {/* 行情比對結果 */}
          {result.verdict && (
            <div className={`border p-4 ${STATUS_STYLE[result.verdict.status]}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{result.verdict.status}</span>
              <p className="mt-1 text-sm font-bold leading-relaxed">{result.verdict.headline}</p>
              <p className="mt-1.5 text-xs leading-relaxed opacity-90">{result.verdict.detail}</p>
            </div>
          )}

          {/* 初期費用提示：敷金＋禮金合計超過 3 個月房租才顯示，避免每次都跳出提醒 */}
          {result.initialCostMonths !== null && result.initialCostMonths > 3 && (
            <p className="border border-[#DCC8A1] bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">
              敷金＋禮金合計約 {result.initialCostMonths.toFixed(1)} 個月房租，高於常見的 1～2 個月，建議向仲介確認明細。
            </p>
          )}

          {!result.verdict && result.parsed.rent === null && (
            <p className="text-xs text-[#66736C]">圖片上沒有讀到明確的租金金額，無法進行行情比對。</p>
          )}
        </div>
      )}
    </section>
  );
}
