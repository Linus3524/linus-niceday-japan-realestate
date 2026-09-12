import type { AnalyzeListingResult } from "../../lib/listing/types";


/* ───────────── Props ───────────── */
export interface ListingReportPdfProps {
  /** 與前端分析結果共用資料契約，避免 PDF 欄位漂移 */
  result: AnalyzeListingResult;
  title: string;
  generatedAt: Date;
  shareUrl?: string | null;
  /** 圖片素材的根路徑：瀏覽器用 ""（相對站根），Node 端測試用檔案絕對路徑 */
  assetBase?: string;
  /** 步行與周邊機能（若前端已載入） */
  locationContext?: {
    matchedAddress?: string;
    stationWalks?: Array<{ station: string; advertisedMinutes: number | null; normalMinutes: number; fastMinutes: number; slowMinutes: number; needsAttention?: boolean }>;
    amenities?: Array<{ category: string; label: string; name: string; distanceMeters: number }>;
  } | null;
  /** 使用者輸入的通勤試算（若有） */
  commute?: {
    destination?: string;
    totalMinutes?: number | null;
    transfers?: number | null;
    summary?: string;
  } | null;
}
