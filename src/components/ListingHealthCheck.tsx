import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Landmark,
  LoaderCircle,
  Maximize2,
  Navigation,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrainFront,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { useListingHealthCheckController } from '../hooks/useListingHealthCheckController';
import type { ListingHealthCheckProps } from '../lib/listing/types';
import { BuildingHealthSection } from './listing/BuildingHealthSection';
import { InvestmentSection } from './listing/InvestmentSection';
import { ListingLocationSection } from './listing/ListingLocationSection';
import { ListingShareExportPanel } from './listing/ListingShareExportPanel';
import { RentalInitialCostsSection } from './listing/RentalInitialCostsSection';
import { RentalMarketSection } from './listing/RentalMarketSection';
import { RentalSummarySection } from './listing/RentalSummarySection';
import { SaleInitialCostsSection } from './listing/SaleInitialCostsSection';
import { SaleMarketSection } from './listing/SaleMarketSection';
import { SalePropertyFacts } from './listing/SalePropertyFacts';
import { SaleSummarySection } from './listing/SaleSummarySection';
export type { ListingHealthCheckProps } from '../lib/listing/types';
export type { VerdictStatusTheme } from './listing/statusTheme';

import { ACCEPTED_MIME_TYPES } from '../lib/listing/browser/uploadConfig';

import { formatFileSize } from '../lib/listing/formatters';

import { CommuteRouteCard } from "./CommuteRouteCard";

import { ErrorBoundary } from "./ErrorBoundary";

import { ListingAuditPanel } from "./ListingAuditPanel";

import { ListingContactCta } from "./ListingContactCta";

import { RentalConditionSummary } from "./RentalConditionSummary";

import { SpecialSaleReport } from "./SpecialSaleReport";

export type { InitialCostBreakdownItem, InitialCostEstimate, SaleAnalysisVerdict } from '../lib/listing/types';

export function ListingHealthCheck({ sharedId }: ListingHealthCheckProps = {}) {
  const model = useListingHealthCheckController({ sharedId });
  const {
    sharedMode,
    sharedTitle,
    sharedExpiresAt,
    inputRef,
    handleFileSelect,
    file,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
    previewImageUrl,
    setShowFullPreview,
    previewAspect,
    isPdfPreview,
    previewUrl,
    previewState,
    loading,
    removeFile,
    analyze,
    result,
    error,
    showFullPreview,
    isSaleListing,
    reportHeading,
    listingAudit,
    saleAnalysis,
    locationContext,
    extracted,
    isSpecialSale,
    managementFee,
    formattedShikibiki,
    hasPenalty,
    locationLoading,
    commuteDestination,
    setCommuteDestination,
    analyzeCommute,
    commuteLoading,
    commuteError,
    commute,
  } = model;
  return (
    <section className="border border-[#1A2A22] bg-white p-6 font-sans md:p-8" aria-label="物件圖紙分析">
      {/* 區塊頂部標題 */}
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00A174]">
        <Sparkles className="h-4 w-4" /> PROPERTY LISTING DIAGNOSTICS
      </div>
      <h3 className="mb-2 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
        {sharedMode ? (sharedTitle || "物件圖紙分析結果") : "物件圖紙分析與健檢"}
      </h3>
      {sharedMode ? (
        <p className="mb-4 text-sm leading-relaxed text-[#3F5147]">
          這是由他人分享的分析結果。原始圖紙不隨連結保存，請向分享者索取；步行時間與周邊機能依圖紙地址即時重新查詢。
          {sharedExpiresAt && (
            <span className="ml-1 text-[#66736C]">
              連結有效至 {new Date(sharedExpiresAt).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}。
            </span>
          )}
        </p>
      ) : (
        <p className="mb-4 text-sm leading-relaxed text-[#3F5147]">
          請上傳仲介提供的物件廣告或圖紙（支援圖片或 PDF）。系統將自動辨識租賃或買賣，為您產出完整的客觀分析報告。
        </p>
      )}

      {/* 隱藏的檔案上傳 input */}
      <input
        ref={inputRef}
        type="file" accept={ACCEPTED_MIME_TYPES}
        className="hidden" onChange={handleFileSelect}
      />

      {/* 現代化拖曳上傳 Dropzone（分享頁不顯示） */}
      {sharedMode ? null : !file ? (
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
            支援日本不動產概要書（租賃、中古公寓買賣、收租物件均可），圖檔或 PDF 檔案
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

      {/* 分享頁讀取中：上傳區藏起來了，讀取狀態要另外顯示，否則畫面是空白的 */}
      {sharedMode && loading && !result && (
        <div className="flex items-center gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-4 text-sm text-[#3F5147]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#007D5A]" />
          正在讀取分享的分析結果…
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
            {/* PDF 一律嵌原檔：放大檢視的目的是讀小字，瀏覽器原生檢視器不經 JPEG 壓縮、
                可自由縮放，比再大的轉圖都清楚。轉出的 JPEG 只留給對照區的行內顯示。
                圖片檔本身就是原檔，直接顯示即可。 */}
            {isPdfPreview && previewUrl ? (
              <iframe
                src={`${previewUrl}#view=FitH`}
                title="原始圖紙放大檢視（PDF 原檔）"
                className="h-full w-full border-0 bg-white"
              />
            ) : previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="原始圖紙放大檢視"
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* 分析結果呈現區塊 */}
      {result && (
        <ErrorBoundary
          fallbackTitle="圖紙分析結果呈現異常"
          fallbackMessage="圖紙已成功辨識，但在排版渲染特定分析項目時遇到顯示問題。請點擊重新整理畫面。"
        >
          <div className="listing-analysis-report mt-8 space-y-6 border-t-2 border-[#1A2A22] pt-6">
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
          {listingAudit && <ListingAuditPanel audit={listingAudit} />}
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
              <SaleMarketSection model={model} />

              {/* 模組 S2：核心買賣數值 Hero 5-Card 網格 */}
              <SaleSummarySection model={model} />

              {/* 模組 S2.5：物件基本規格・交通與設備（與租賃圖紙同一份整理，買賣端原本整塊缺漏） */}
              <SalePropertyFacts model={model} />
              {/* 模組 S3：每月固定持有成本逐筆拆解與大樓健康度對比 */}
              {isSpecialSale && (
                <ErrorBoundary fallbackTitle="特殊買賣分析區塊暫時無法顯示">
                  <SpecialSaleReport fields={extracted || {}} />
                </ErrorBoundary>
              )}
              {!isSpecialSale && <>
              <BuildingHealthSection model={model} />

              {/* 模組 S4：物件現況、投資收益與自住法務要點 */}
              <InvestmentSection model={model} />

              {/* 模組 S5：買方交屋初期諸費用深度試算 */}
              </>}
              <SaleInitialCostsSection model={model} />
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
              {/* 模組 1：每月租金與租賃條件 */}
              <RentalSummarySection model={model} />

              {/* 模組 2：租金行情診斷（同層級，無多餘外層大框框） */}
              <RentalMarketSection model={model} />

              {/* 模組 3：初期費用深度試算與分析（同層級，無多餘外層大框框） */}
              <RentalInitialCostsSection model={model} />

              {/* 模組 4：重要特約與法務事項 */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                    <ShieldAlert className="h-4 w-4 text-[#007D5A]" />
                    <span>重要特約與法務事項</span>
                  </div>
                  <span className="text-[10px] text-[#66736C]">
                    彙整圖紙刊載之重點特約與條款，簽約前請詳閱重要事項說明
                  </span>
                </div>

                <RentalConditionSummary
                  rentalConditions={extracted?.rentalConditions}
                  optionalFacilities={extracted?.optionalFacilities}
                  specialNotes={extracted?.specialNotes}
                  shikibiki={formattedShikibiki}
                  hasCancellationPenalty={hasPenalty}
                />

              </div>
            </>
      )}

          {/* 模組：地理位置實況、真實步行時間比對與 1.2km 生活機能 */}
          <ListingLocationSection model={model} />

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
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#007D5A]">全程門到門通勤時間</p>
                    <p className="mt-1 text-base font-bold text-[#1A2A22]">
                      {commute.route ? `${commute.route.originStation} → ${commute.route.destinationStation}` : commute.destinationStation}
                      ・轉乘 {commute.transfers} 次
                    </p>
                  </div>
                  <p className="shrink-0 text-3xl font-black text-[#007D5A]">約 {commute.totalMinutes} 分</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#3F5147]">
                  出門步行 {commute.originWalkMinutes} 分 ＋ 站間交通 {commute.transitMinutes} 分 ＋ 出站抵達 {commute.destinationWalkMinutes} 分
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#66736C]">目的地定位：{commute.destinationAddress}</p>
                {commute.destinationResolutionNote && (
                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#D97706]">{commute.destinationResolutionNote}</p>
                )}
                {commute.route ? (
                  <div className="mt-4 min-w-0">
                    <p className="mb-2 text-[11px] text-[#66736C]">站間交通路線（下方時間不含出門與抵達目的地的步行）</p>
                    <CommuteRouteCard route={commute.route} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#66736C]">目前未取得詳細線路與上下車站資料，請重新計算通勤。</p>
                )}
              </div>
            )}
          </div>

          {/* ── 分享與下載 ── 放在報告最後：使用者看完整份分析才會想轉給別人或留存。 */}
          <ListingShareExportPanel model={model} />
          {sharedMode && <ListingContactCta />}
        </div>
        </ErrorBoundary>
      )}
    </section>
  );
}
