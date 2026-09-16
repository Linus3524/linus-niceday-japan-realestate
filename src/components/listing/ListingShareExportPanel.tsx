import {
Check,
Copy,
Download,
ExternalLink,
Link2,
LoaderCircle,
Wand2
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';

interface ListingShareExportPanelProps {
  model: Pick<
    ListingHealthCheckModel,
    | "sharedMode"
    | "shareTitle"
    | "setShareTitle"
    | "setShareError"
    | "reportHeading"
    | "shareUrl"
    | "copyShareUrl"
    | "shareCopied"
    | "createShareLink"
    | "shareLoading"
    | "downloadPdf"
    | "pdfLoading"
    | "shareError"
    | "pdfError"
  >;
}

export function ListingShareExportPanel({ model }: ListingShareExportPanelProps) {
  const {
    sharedMode,
    shareTitle,
    setShareTitle,
    setShareError,
    reportHeading,
    shareUrl,
    copyShareUrl,
    shareCopied,
    createShareLink,
    shareLoading,
    downloadPdf,
    pdfLoading,
    shareError,
    pdfError,
  } = model;
  return (<div className="border border-dashed border-[#8A9590] bg-[#FAFCFB] p-5 md:p-6">
    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A2A22]">
      <Link2 className="h-4 w-4 text-[#00A174]" />
      分享與下載分析結果
    </div>
    <p className="mb-4 text-xs leading-relaxed text-[#66736C]">
      {sharedMode
        ? "可將這份分析下載成 PDF 留存。PDF 在你的瀏覽器裡產生，內容不會再傳到任何伺服器。"
        : "建立連結後可直接傳給家人或朋友，連結保存 14 天。連結只包含分析結果，不包含你上傳的圖紙。PDF 在瀏覽器裡產生，不經過伺服器。"}
    </p>

    {!sharedMode && (
      <div className="mb-3">
        <label className="mb-1 block text-xs font-bold text-[#1A2A22]">
          標題 <span className="text-[#B13818]">*</span>
        </label>
        {/* 標題幾乎都是「物件名＋房號」，而這份資訊圖紙分析早就解析出來了（reportHeading）。
            給一個一鍵帶入的按鈕省去重打，但仍是一般輸入框，使用者要改成自己的備註也可以。 */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={shareTitle}
            onChange={event => { setShareTitle(event.target.value); setShareError(null); }}
            placeholder={`例如：${reportHeading}`}
            maxLength={60}
            className="min-w-0 flex-1 border border-[#DDE3DF] bg-white px-3 py-2.5 text-sm text-[#1A2A22] placeholder:text-[#8A9590] focus:border-[#00A174] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { setShareTitle(reportHeading.slice(0, 60)); setShareError(null); }}
            disabled={!reportHeading || shareTitle.trim() === reportHeading.slice(0, 60)}
            title={`帶入圖紙解析出的物件名稱與房號：${reportHeading}`}
            className="flex shrink-0 items-center justify-center gap-1.5 border border-[#00A174] bg-white px-3 py-2.5 text-xs font-bold text-[#00A174] transition-colors hover:bg-[#E6F6F1] disabled:cursor-not-allowed disabled:border-[#DDE3DF] disabled:text-[#8A9590] disabled:hover:bg-white"
          >
            <Wand2 className="h-3.5 w-3.5" />
            帶入物件名稱
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#66736C]">
          可直接帶入圖紙解析出的「{reportHeading}」，也可自行修改成看得懂的備註。
        </p>
      </div>
    )}

    {!sharedMode && shareUrl && (
      <div className="mb-3 flex items-center gap-2 border border-[#9ee2cf] bg-[#e6f6f1] p-2.5">
        <input
          readOnly
          value={shareUrl}
          onFocus={event => event.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-[#00A174] font-bold focus:outline-none"
        />
        <button
          type="button"
          onClick={copyShareUrl}
          className="flex shrink-0 items-center gap-1 border border-[#00A174] bg-white px-2.5 py-1.5 text-xs font-bold text-[#00A174] hover:bg-[#E6F6F1]"
        >
          {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {shareCopied ? "已複製" : "複製"}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 bg-[#00A174] px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#00895D]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          前往
        </a>
      </div>
    )}

    <div className="flex flex-col gap-2 sm:flex-row">
      {!sharedMode && (
        <button
          type="button"
          onClick={createShareLink}
          disabled={shareLoading || !shareTitle.trim()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#1A2A22] px-5 text-sm font-bold text-white transition-colors hover:bg-[#3F5147] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {shareLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          {shareUrl ? "重新建立連結" : "建立連結"}
        </button>
      )}
      <button
        type="button"
        onClick={downloadPdf}
        disabled={pdfLoading}
        className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#1A2A22] bg-white px-5 text-sm font-bold text-[#1A2A22] transition-colors hover:bg-[#F5F8F6] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pdfLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {pdfLoading ? "產生 PDF 中…" : "下載 PDF"}
      </button>
    </div>
    {(shareError || pdfError) && (
      <p className="mt-3 text-xs text-[#B13818]">{shareError || pdfError}</p>
    )}
  </div>);
}
