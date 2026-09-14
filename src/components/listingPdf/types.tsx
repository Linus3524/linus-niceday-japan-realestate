import type { AnalyzeListingResult } from "../../lib/listing/types";
import type { CrimeSafetyResult, PrefectureSafetyResult } from "../../lib/crimeSafety";


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
    stationWalks?: Array<{
      station: string;
      /** 同名站的不同路線（都営両国 vs JR両国）要分開列，路線名是唯一能區分的標示 */
      lineName?: string;
      source?: "flyer" | "nearby";
      distanceMeters?: number;
      advertisedMinutes: number | null;
      normalMinutes: number;
      fastMinutes: number;
      slowMinutes: number;
      needsAttention?: boolean;
    }>;
    amenities?: Array<{ category: string; label: string; name: string; distanceMeters: number }>;
  } | null;
  /** 治安分析（東京町丁目級或其餘道府縣的市區町村／縣級），與網站卡片同一份資料 */
  safety?:
    | { precision: "chome"; chome: CrimeSafetyResult }
    | { precision: "prefecture"; prefecture: PrefectureSafetyResult }
    | null;
  /** 使用者輸入的通勤試算（若有） */
  commute?: {
    destination?: string;
    totalMinutes?: number | null;
    transfers?: number | null;
    summary?: string;
  } | null;
}
