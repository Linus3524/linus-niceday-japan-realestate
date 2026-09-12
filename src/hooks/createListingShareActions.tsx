import {
  createListingShare
} from '../lib/listing/apiClient';
import type { ListingHealthCheckProps } from '../lib/listing/types';
import { trackAction } from "../lib/trackView";
import type { ListingState } from './useListingState';

type Context = Pick<ListingState,
  "requests" |
  "result"
  | "shareLoading"
  | "shareTitle"
  | "setShareError"
  | "setShareLoading"
  | "setShareUrl"
  | "shareUrl"
  | "setShareCopied"
  | "pdfLoading"
  | "setPdfLoading"
  | "setPdfError"
  | "sharedTitle"
  | "locationContext"
  | "commute"> & Pick<ListingHealthCheckProps,
    "sharedId"> & {
      sharedMode: boolean;
      reportHeading: string;
    };

/** 分享、剪貼簿與延遲載入 PDF 匯出；保留原瀏覽器副作用。 */
export function createListingShareActions(context: Context) {
  const {
    requests,
    result,
    shareLoading,
    shareTitle,
    setShareError,
    setShareLoading,
    setShareUrl,
    shareUrl,
    setShareCopied,
    pdfLoading,
    setPdfLoading,
    setPdfError,
    sharedMode,
    sharedTitle,
    reportHeading,
    sharedId,
    locationContext,
    commute,
  } = context;

  // 分享連結：只送分析結果，不送圖紙（見 api/listing-share.ts 的說明）。
  const createShareLink = async () => {
    if (!result || shareLoading || requests.pending("share")) return;
    const title = shareTitle.trim();
    if (!title) {
      setShareError("請先填寫標題，收件人才知道這是哪一間。");
      return;
    }
    const task = requests.begin("share");
    setShareLoading(true);
    setShareError(null);
    try {
      const response = await createListingShare({ title, result });
      const body = await response.json().catch(() => null);
      if (!task.current()) return;
      if (!response.ok) throw new Error(body?.error || `建立連結失敗（HTTP ${response.status}）。`);
      setShareUrl(`${window.location.origin}/#listing/${body.id}`);
      trackAction("listing-share-create");
    } catch (err: any) {
      if (!task.current()) return;
      setShareError(err?.message || "建立連結失敗，請稍後再試。");
    } finally {
      if (task.current()) setShareLoading(false);
      task.finish();
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    const task = requests.begin("clipboard");
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (!task.current()) return;
      setShareCopied(true);
      window.setTimeout(() => {
        if (task.current()) setShareCopied(false);
      }, 2000);
    } catch {
      // 剪貼簿被擋（例如非 https 或無權限）就讓使用者自己選取欄位複製
    }
  };

  // PDF：在瀏覽器產生，不經過伺服器。@react-pdf/renderer 與兩個 5MB 的字型檔
  // 都是按下去才載入，不放進主 bundle。
  const downloadPdf = async () => {
    if (!result || pdfLoading || requests.pending("pdf")) return;
    const task = requests.begin("pdf");
    setPdfLoading(true);
    setPdfError(null);
    try {
      const [{ pdf }, { ListingReportPdf, registerPdfFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/ListingReportPdf"),
      ]);
      if (!task.current()) return;
      registerPdfFonts("/fonts");
      const title = (sharedMode ? sharedTitle ?? "" : shareTitle).trim() || reportHeading;
      const blob = await pdf(
        <ListingReportPdf
          result={result}
          title={title}
          generatedAt={new Date()}
          shareUrl={shareUrl || (sharedId ? `${window.location.origin}/#listing/${sharedId}` : null)}
          // 圖片（logo、QR）用絕對網址：react-pdf 在瀏覽器裡是用 fetch 取圖，
          // 給站根絕對路徑最不會受目前 hash 路由影響。
          assetBase={window.location.origin}
          locationContext={locationContext}
          commute={commute ? {
            destination: commute.destinationInput || commute.destinationAddress,
            totalMinutes: commute.totalMinutes,
            transfers: commute.transfers,
            summary: `出門到 ${commute.destinationStation ? `${commute.destinationStation}駅` : "目的地"}：步行 ${commute.originWalkMinutes} 分＋電車 ${commute.transitMinutes} 分＋步行 ${commute.destinationWalkMinutes} 分`,
          } : null}
        />,
      ).toBlob();
      if (!task.current()) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title.replace(/[\\/:*?"<>|]+/g, "_")}-物件分析.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      trackAction("listing-pdf-download");
    } catch (err: any) {
      if (!task.current()) return;
      console.error("PDF 產生失敗", err);
      setPdfError("PDF 產生失敗，請稍後再試。");
    } finally {
      if (task.current()) setPdfLoading(false);
      task.finish();
    }
  };
  return {
    createShareLink,
    copyShareUrl,
    downloadPdf,
  };
}
