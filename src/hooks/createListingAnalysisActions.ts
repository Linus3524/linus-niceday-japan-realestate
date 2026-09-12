import {
  requestListingAnalysis
} from '../lib/listing/apiClient';
import { base64Bytes } from '../lib/listing/browser/fileUtils';
import { MAX_TOTAL_IMAGE_BYTES } from '../lib/listing/browser/uploadConfig';
import { encodeForUpload } from '../lib/listing/browser/uploadEncoding';
import type { AnalyzeListingResult } from '../lib/listing/types';
import { trackAction } from "../lib/trackView";
import type { ListingState } from './useListingState';

type Context = Pick<ListingState,
  "requests" |
  "file"
  | "loading"
  | "setLoading"
  | "setError"
  | "setResult"
  | "setLocationContext"
  | "setLocationError"
  | "setCommute"
  | "setCommuteError"
  | "setCrimeData"
  | "setPrefectureSafety"
  | "analysisMode"> & {
    resetReport: () => void;
    loadLocationContext: (analysis: AnalyzeListingResult) => Promise<void>;
  };

/** 上傳、大小檢查與分析請求；每次 render 使用當次 state 快照。 */
export function createListingAnalysisActions(context: Context) {
  const {
    requests,
    resetReport,
    file,
    loading,
    setLoading,
    setError,
    setResult,
    setLocationContext,
    setLocationError,
    setCommute,
    setCommuteError,
    setCrimeData,
    setPrefectureSafety,
    analysisMode,
    loadLocationContext,
  } = context;

  const analyze = async () => {
    if (!file || loading || requests.pending("analysis")) return;
    resetReport();
    const task = requests.begin("analysis");
    setLoading(true);
    setError(null);
    setResult(null);
    setLocationContext(null);
    setLocationError(null);
    setCommute(null);
    setCommuteError(null);
    setCrimeData(null);
    setPrefectureSafety(null);

    try {
      const { files: encoded, layoutText } = await encodeForUpload(file);
      if (!task.current()) return;
      const totalBytes = encoded.reduce((sum, item) => sum + base64Bytes(item.data), 0);
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        setError(`圖片壓縮後仍超過 ${Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB 上限，請改用 JPG／PNG 格式再試。`);
        return;
      }

      const response = await requestListingAnalysis({ files: encoded, mode: analysisMode, layoutText });
      const body = await response.json().catch(() => null);
      if (!task.current()) return;
      if (!response.ok) {
        throw new Error(body?.error || `分析失敗（HTTP ${response.status}）。`);
      }
      const analysis = body as AnalyzeListingResult;
      setResult(analysis);
      void loadLocationContext(analysis);
      trackAction(analysis.dealType === "sale" || Boolean(analysis.saleAnalysis) ? "listing-check-sale" : "listing-check-rent");
    } catch (err: any) {
      if (!task.current()) return;
      setError(err?.message || "圖片分析失敗，請稍後再試。");
    } finally {
      if (task.current()) setLoading(false);
      task.finish();
    }
  };
  return {
    analyze,
  };
}
