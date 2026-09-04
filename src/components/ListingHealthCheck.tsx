import { useRef, useState, type ChangeEvent } from "react";
import { Footprints, LoaderCircle, MapPin, Navigation, Sparkles, Store, TrainFront, Upload, X } from "lucide-react";
import type { AxisStatus } from "../lib/requirementVerdict";
import type { ListingLocationContext } from "../lib/listingLocation";

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
// 用 image/* 而不是逐一列舉格式：白名單一長就一定會漏（相機的 HEIC、截圖的 AVIF、
// 掃描件的 TIFF…），漏掉的下場是使用者在檔案選擇視窗裡看到自己的圖是灰的、不能選，
// 卻沒有任何說明。反正能解碼的都會在上傳前被轉成 JPEG，放寬沒有壞處。
const ACCEPTED_MIME_TYPES = "image/*,application/pdf";

/**
 * 上傳前先在瀏覽器縮圖。
 *
 * 手機直接拍的図面動輒 3～8MB，仲介傳來的截圖也常常超過上限，若直接送原檔，
 * 使用者會在最常見的情境下就撞牆。而 Vercel 的 request body 硬上限是 4.5MB
 * （不可調），base64 又會讓體積膨脹約 1.37 倍，所以「把上限調大」不是選項。
 *
 * 縮到長邊 2000px 不影響辨識結果：Gemini vision 本來就會自行降採樣，
 * 解析度再高也不會讓圖紙上的字讀得更準，但檔案大小通常能降到十分之一以下。
 */
const MAX_UPLOAD_DIMENSION = 2000;
const JPEG_QUALITY = 0.8;

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
      // FileReader 的 data URL 會帶 "data:image/png;base64," 這種前綴，
      // 伺服器只要純 base64 本體，這裡先切掉。
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
  });
}

/** base64 字串還原成原始位元組數，用來判斷壓縮後是否仍超過上限。 */
function base64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function encodeForUpload(file: File): Promise<{ mimeType: string; data: string }> {
  // PDF 沒辦法走 canvas 這條路，原樣送出。
  if (file.type === "application/pdf") {
    return { mimeType: file.type, data: await fileToBase64(file) };
  }
  try {
    // imageOrientation 讓直式手機照片依 EXIF 轉正——躺著的圖會讓文字辨識變差。
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
    // 部分瀏覽器（例如非 Safari 的 HEIC）解不開，就退回原檔讓伺服器端去判斷，
    // 不要因為壓縮失敗就整個擋掉使用者。
    return { mimeType: file.type, data: await fileToBase64(file) };
  }
}

export function ListingHealthCheck() {
  const [files, setFiles] = useState<File[]>([]);
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
  const inputRef = useRef<HTMLInputElement>(null);


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
    setLocationContext(null);
    setCommute(null);
  };

  const loadLocationContext = async (analysis: AnalyzeListingResult) => {
    const address = analysis.extracted.address.trim();
    if (!address) {
      setLocationError("圖紙上沒有讀到完整地址，因此無法計算實際步行與周邊機能。");
      return;
    }
    const stations = analysis.extracted.station.split(/[,，]/).map(value => value.trim()).filter(Boolean);
    const advertisedWalkMinutes = analysis.extracted.walkTime
      .split(/[,，]/)
      .map(value => Number(value.match(/\d+/)?.[0]))
      .map(value => Number.isFinite(value) ? value : null);
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
      if (!body?.found) throw new Error(body?.message || "目前無法定位這個地址。");
      setLocationContext(body.context as ListingLocationContext);
    } catch (err: any) {
      setLocationError(err?.message || "位置資料暫時無法取得。");
    } finally {
      setLocationLoading(false);
    }
  };

  const analyze = async () => {
    if (!files.length || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLocationContext(null);
    setLocationError(null);
    setCommute(null);
    setCommuteError(null);
    try {
      const encoded = await Promise.all(files.map(encodeForUpload));

      // 大小以「壓縮後」為準。壓縮通常已經足夠，這裡是極端情況（例如超大 PDF、
      // 或瀏覽器解不開而退回原檔）的最後一道防線，擋在送出前才不會白跑一趟網路。
      const totalBytes = encoded.reduce((sum, file) => sum + base64Bytes(file.data), 0);
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        setError(
          `圖片壓縮後仍超過 ${Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB 上限，請減少張數，或改用 JPG／PNG 格式再試。`
        );
        return;
      }

      const response = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: encoded }),
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
    const fallbackStation = result?.extracted.station.split(/[,，]/).map(value => value.trim()).find(Boolean);
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
        <p className="text-xs text-[#66736C]">圖片不會儲存；圖紙地址僅用於本次公開地圖、步行與周邊設施查詢。</p>
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
          disabled={!files.length || loading}
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
      <p className="mt-2 text-[9px] text-[#66736C]">
        圖片會在上傳前自動壓縮，手機拍的照片可直接使用。為保護分析服務額度，同一使用者每 5 分鐘最多分析 3 次。
      </p>

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

          {/* 第二階段：地址座標解鎖實際步行、周邊設施與個人通勤。 */}
          <div className="border-t border-[#DDE3DF] pt-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00a174]" />
              <h4 className="text-sm font-bold text-[#1A2A22]">地址周邊實況</h4>
            </div>
            {locationLoading && (
              <div className="flex items-center gap-2 bg-[#F5F8F6] p-3 text-xs text-[#66736C]">
                <LoaderCircle className="h-4 w-4 animate-spin" /> 正在定位地址並計算實際路線…
              </div>
            )}
            {locationError && !locationLoading && (
              <p className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{locationError}</p>
            )}
            {locationContext && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 bg-[#F5F8F6] p-3 text-xs">
                  <div>
                    <p className="text-[#66736C]">定位結果</p>
                    <p className="mt-0.5 font-bold text-[#1A2A22]">{locationContext.matchedAddress}</p>
                  </div>
                  <a
                    className="font-bold text-[#007d5a] underline underline-offset-2"
                    href={`https://www.google.com/maps/search/?api=1&query=${locationContext.coordinate.lat},${locationContext.coordinate.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    在地圖確認
                  </a>
                </div>

                {locationContext.notices?.map(notice => (
                  <p key={notice} className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{notice}</p>
                ))}

                {locationContext.stationWalks.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Footprints className="h-4 w-4 text-[#00a174]" /> 實際路徑步行時間
                    </div>
                    <div className="space-y-2">
                      {locationContext.stationWalks.map(walk => (
                        <div key={walk.station} className={`border p-3 ${walk.needsAttention ? "border-[#DCC8A1] bg-[#FFF9ED]" : "border-[#DDE3DF]"}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-bold text-[#1A2A22]">{walk.station}駅</p>
                            <p className="text-[10px] text-[#66736C]">實際路徑約 {walk.distanceMeters.toLocaleString("zh-TW")}m</p>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white p-2"><p className="text-[9px] text-[#66736C]">快走</p><p className="font-bold text-[#1A2A22]">{walk.fastMinutes} 分</p></div>
                            <div className="bg-white p-2"><p className="text-[9px] text-[#66736C]">一般</p><p className="font-bold text-[#1A2A22]">{walk.normalMinutes} 分</p></div>
                            <div className="bg-white p-2"><p className="text-[9px] text-[#66736C]">慢走／行李</p><p className="font-bold text-[#1A2A22]">{walk.slowMinutes} 分</p></div>
                          </div>
                          {walk.advertisedMinutes !== null && (
                            <p className={`mt-2 text-[10px] ${walk.needsAttention ? "font-bold text-[#7A5A1F]" : "text-[#66736C]"}`}>
                              圖紙標示 {walk.advertisedMinutes} 分；一般速度估算{walk.differenceMinutes && walk.differenceMinutes > 0 ? `多約 ${walk.differenceMinutes} 分` : "大致相符"}。
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[9px] leading-relaxed text-[#66736C]">依公開道路資料的步行路徑距離換算；紅綠燈、坡度、天候與月台入口會造成差異。</p>
                  </div>
                )}

                {locationContext.amenities.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                      <Store className="h-4 w-4 text-[#00a174]" /> 1.2 公里內生活機能
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["convenience", "supermarket", "pharmacy", "medical", "school", "park"] as const).map(category => {
                        const items = locationContext.amenities.filter(item => item.category === category);
                        if (!items.length) return null;
                        return (
                          <div key={category} className="border border-[#DDE3DF] p-3">
                            <p className="mb-1.5 text-[10px] font-bold text-[#007d5a]">{items[0].label}</p>
                            <ul className="space-y-1 text-[11px] text-[#3F5147]">
                              {items.map(item => <li key={`${item.source}-${item.name}`} className="flex justify-between gap-2"><span className="truncate">{item.name}</span><span className="shrink-0 text-[#66736C]">約 {item.distanceMeters}m</span></li>)}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[9px] leading-relaxed text-[#66736C]">
                  資料來源：{locationContext.sources.map((source, index) => (
                    <span key={source.url}>{index > 0 ? "、" : ""}<a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a></span>
                  ))}。設施資料可能有缺漏，請以現場與官方資訊為準。
                </p>
                {locationContext.credit && <p className="text-[9px] leading-relaxed text-[#66736C]">{locationContext.credit}</p>}
              </div>
            )}
          </div>

          <div className="border-t border-[#DDE3DF] pt-5">
            <div className="mb-2 flex items-center gap-2">
              <TrainFront className="h-4 w-4 text-[#00a174]" />
              <h4 className="text-sm font-bold text-[#1A2A22]">我的實際通勤</h4>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#66736C]">輸入公司／學校完整地址，或最近車站，估算從這間房子出門到目的地的時間與轉乘次數。</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={commuteDestination}
                onChange={event => setCommuteDestination(event.target.value)}
                onKeyDown={event => { if (event.key === "Enter") void analyzeCommute(); }}
                placeholder="例如：東京都新宿区西新宿2-8-1／新宿駅"
                className="min-h-11 flex-1 border border-[#AAB8B0] px-3 text-sm text-[#1A2A22] outline-none focus:border-[#00a174]"
              />
              <button
                type="button"
                onClick={analyzeCommute}
                disabled={!commuteDestination.trim() || commuteLoading || locationLoading || (!locationContext?.stationWalks.length && !result.extracted.station)}
                className="flex min-h-11 items-center justify-center gap-2 bg-[#1A2A22] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {commuteLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {commuteLoading ? "查詢中…" : "計算通勤"}
              </button>
            </div>
            {commuteError && <p className="mt-2 bg-[#FFF9ED] p-3 text-xs text-[#7A5A1F]">{commuteError}</p>}
            {commute && (
              <div className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-[#007d5a]">從家門到目的地</p>
                    <p className="mt-1 text-sm font-bold text-[#1A2A22]">{commute.destinationStation}駅方向・轉乘 {commute.transfers} 次</p>
                  </div>
                  <p className="shrink-0 text-2xl font-black text-[#007d5a]">約 {commute.totalMinutes} 分</p>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-[#3F5147]">物件→車站 {commute.originWalkMinutes} 分 ＋ 電車 {commute.transitMinutes} 分 ＋ 目的站→目的地 {commute.destinationWalkMinutes} 分</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#66736C]">目的地定位：{commute.destinationAddress}</p>
                {commute.destinationResolutionNote && <p className="mt-1 text-[10px] font-bold leading-relaxed text-[#7A5A1F]">{commute.destinationResolutionNote}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
