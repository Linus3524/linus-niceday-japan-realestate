import type { RoomType } from "./rentAnalysis.js";

/**
 * 把物件圖紙上抓出來的「人類可讀字串」轉成系統既有型別能用的數字／代碼。
 *
 * Gemini 從圖紙讀出來的一定是原始寫法（"10.5万円"、"１ＬＤＫ"、"1ヶ月"），
 * 這裡是唯一負責把這些字串轉成日圓整數與既有房型代碼的地方，
 * 避免解析邏輯散落在呼叫端、每個地方各寫一套微妙不同的規則。
 */

/**
 * 全形數字/字母轉半形；日文物件資料常見全形寫法（"１ＬＤＫ"、"２DK"）。
 * 一併轉全形句點／逗號（"１０．５万円"）——漏這兩個符號會讓小數點前的數字
 * 被規則運算式在句點處截斷，"10.5万円" 誤判成 "5万円"（少一個零頭）。
 */
function toHalfWidth(value: string): string {
  return value.replace(/[０-９Ａ-Ｚａ-ｚ．，]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

/**
 * 解析「10.5万円」「105,000円」「1,050,000」等寫法為日圓整數。
 * 抓不到數字或數字非正值時回傳 null，呼叫端要能處理「沒抓到」這個狀態，
 * 不能假設一定有值。
 */
export function parseYenAmount(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).replace(/,/g, "").trim();
  if (!cleaned) return null;

  const manMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*万/);
  if (manMatch) {
    const value = Math.round(Number(manMatch[1]) * 10000);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const plainMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*円?/);
  if (plainMatch) {
    const value = Math.round(Number(plainMatch[1]));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  return null;
}

/**
 * 敷金・礼金常見兩種寫法：「1ヶ月」（要乘以月租才知道金額）或直接「10万円」。
 * 沒有月租可乘、且文字本身又是「幾個月」寫法時，回傳 null——
 * 寧可讓畫面顯示「無法判讀」，也不要拿一個猜出來的數字去跟行情比對。
 */
export function parseMonthsOrYen(text: unknown, monthlyRent: number | null): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();

  const monthsMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)/);
  if (monthsMatch) {
    if (!monthlyRent) return null;
    const months = Number(monthsMatch[1]);
    return Number.isFinite(months) && months > 0 ? Math.round(monthlyRent * months) : null;
  }

  return parseYenAmount(cleaned);
}

/**
 * 房型文字 → 既有 5 桶代碼。對應規則與 rentAnalysis.ts 的 ROOM_TYPE_DETAIL_LABEL
 * 完全一致：k1 含 1DK；ldk1 含 2K、2DK；ldk2 含 3K、3DK；ldk3 代表 3LDK、4K、4DK。
 *
 * 4LDK 以上／5K 以上刻意回傳 null：市場行情資料本身就沒有收錄這個級距
 * （見 buyHouseData 免責聲明「4LDK以上另行保存，不納入 3LDK+ 代表值」），
 * 硬塞進 ldk3 只會讓比對結果失真，不如誠實顯示「查無此房型行情」。
 */
/**
 * 剝掉站名前面常見的營運商／路線前綴（"JR新宿駅"、"東京メトロ丸ノ内線 新宿御苑前駅"）。
 *
 * 既有的站名比對（requirementVerdict.ts 的 normalizeStation、rentAnalysis.ts 的
 * normalizeStationText）從來不做這件事——它們原本的輸入來源（使用者自然語言、
 * 站內車站清單）本來就是乾淨站名，沒剝過前綴也不會出錯。但真實的物件概要書
 * 常常直接印營運商全名，這是圖紙辨識這條新路徑才會遇到的輸入形狀，實測「JR新宿駅」
 * 沒剝過前綴會讓 estimateRequestedRent 查不到任何行情（誤判成「查無資料」）。
 *
 * 這裡先剝一輪常見營運商，再剝尾端「駅」。Prompt 已經要求 Gemini 只回傳站名本身，
 * 這裡是防止它沒完全照做時的安全網，兩邊都做才夠穩。
 */
export function stripStationOperatorPrefix(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const cleaned = text
    .trim()
    .replace(/^(?:JR|ＪＲ)/i, "")
    .replace(/^(?:東京メトロ|東京地下鉄|都営地下鉄|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくばエクスプレス)/, "")
    // "○○線 ○○駅" 這種前面還帶路線名的寫法，取最後一段當站名。
    .replace(/^.*線[\s・･]*/, "")
    .replace(/\s*(?:車站|站|駅)\s*$/, "")
    .trim();
  return cleaned || null;
}

export function normalizeRoomType(text: unknown): RoomType | null {
  if (typeof text !== "string") return null;

  // "1LDK+S"／"1SLDK"（納戸／服務房）不影響房間數分桶，先拿掉再比對核心格局。
  const cleaned = toHalfWidth(text)
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\+?S$/i, "")
    .replace(/^S/i, "");

  const rMatch = cleaned.match(/^(\d+)R$/);
  if (rMatch) return rMatch[1] === "1" ? "r1" : null;

  const kMatch = cleaned.match(/^(\d+)(?:K|DK)$/);
  if (kMatch) {
    const table: Record<string, RoomType> = { "1": "k1", "2": "ldk1", "3": "ldk2", "4": "ldk3" };
    return table[kMatch[1]] ?? null;
  }

  const ldkMatch = cleaned.match(/^(\d+)LDK$/);
  if (ldkMatch) {
    const table: Record<string, RoomType> = { "1": "ldk1", "2": "ldk2", "3": "ldk3" };
    return table[ldkMatch[1]] ?? null;
  }

  return null;
}
