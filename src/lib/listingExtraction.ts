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

  // 若含有百分比符號，絕對不可當作日圓金額！
  if (/[%％]/.test(cleaned)) return null;

  const manMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*万/);
  if (manMatch) {
    const value = Math.round(Number(manMatch[1]) * 10000);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  // 若有明確的「円」單位，且非單一小額百分比數字
  const yenMatch = cleaned.match(/(\d{2,10})\s*円/);
  if (yenMatch) {
    const value = Math.round(Number(yenMatch[1]));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  // 純數字格式且必須大於等於 1000 円，避免「70」或「1」被誤判為 70 円
  const plainMatch = cleaned.match(/^(\d{4,10})$/);
  if (plainMatch) {
    const value = Math.round(Number(plainMatch[1]));
    return Number.isFinite(value) && value >= 1000 ? value : null;
  }

  return null;
}

/**
 * 解析保證會社初回保證料：
 * 1. 百分比（例如 "初回保証料70％"、"70%"、"総賃料の50%"）：總租金（租金＋管理費）乘以比例
 * 2. 幾個月（例如 "0.5ヶ月"、"1ヶ月"）：總租金乘以月數
 * 3. 固定日圓金額（例如 "45,000円"、"5万円"）
 */
export function parseGuaranteeFee(text: unknown, totalMonthlyCost: number): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();
  if (!cleaned) return null;

  // 1. 百分比格式（例如 "初回保証料70％"、"70%"）
  const percentMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[%％]/);
  if (percentMatch) {
    const rate = Number(percentMatch[1]) / 100;
    if (Number.isFinite(rate) && rate > 0 && rate <= 2.0 && totalMonthlyCost > 0) {
      return Math.round(totalMonthlyCost * rate);
    }
  }

  // 2. 幾個月格式（例如 "0.5ヶ月"、"1ヶ月"）
  const monthsMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)/);
  if (monthsMatch) {
    const months = Number(monthsMatch[1]);
    if (Number.isFinite(months) && months > 0 && months <= 3 && totalMonthlyCost > 0) {
      return Math.round(totalMonthlyCost * months);
    }
  }

  // 3. 固定金額格式（例如 "45,000円"、"5万円"）
  const yen = parseYenAmount(cleaned);
  if (yen && yen >= 10000) {
    return yen;
  }

  return null;
}

/**
 * 格式化敷引標示：
 * 若圖紙寫 "1"、"1ヶ月"、"敷引1ヶ月"、"100%"，轉為清晰的中文說明。
 */
export function formatShikibiki(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = toHalfWidth(raw).trim();
  if (!cleaned || /^(?:なし|無|0|不要|-|ー|―)$/i.test(cleaned)) return "";
  if (cleaned === "1") return "敷引 1 個月（退租直接扣除、不予退還）";
  if (/^(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)?$/i.test(cleaned)) {
    const m = cleaned.match(/^(\d+(?:\.\d+)?)/)?.[1];
    return `敷引 ${m} 個月（退租直接扣除、不予退還）`;
  }
  if (/[%％]/.test(cleaned)) {
    return `敷金償却 ${cleaned}（退租扣除約定）`;
  }
  return cleaned;
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

/**
 * 解析專有面積字串（例如 "25.4㎡"、"25.40m2"、"25.40m²"、"25.4平米"、"7.68坪" 或 "15.5帖"）。
 */
export function parseArea(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:㎡|m2|m²|平米|米|坪|帖|畳)/i);
  if (match) {
    let val = Number(match[1]);
    if (cleaned.includes("坪")) val = Math.round(val * 3.30578 * 10) / 10;
    else if (/帖|畳/.test(cleaned)) val = Math.round(val * 1.62 * 10) / 10;
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  const plainNum = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNum) {
    const val = Number(plainNum[1]);
    return Number.isFinite(val) && val > 0 && val < 500 ? val : null;
  }
  return null;
}

/**
 * 建物構造英文代碼或日文縮寫正規化為完整中文標示。
 */
export function normalizeStructure(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = toHalfWidth(raw).trim().toUpperCase();
  if (/SRC|鉄骨鉄筋/.test(s)) return "SRC造（鋼骨鋼筋混凝土）";
  if (/RC|鉄筋/.test(s)) return "RC造（鋼筋混凝土）";
  if (/軽量鉄骨/.test(s)) return "輕量鐵骨造";
  if (/重量鉄骨/.test(s)) return "重量鐵骨造";
  if (/S造|鉄骨|STEEL/.test(s)) return "S造（鐵骨造）";
  if (/木造|WOOD|W造/.test(s)) return "木造";
  if (/ALC/.test(s)) return "ALC造（輕質氣泡混凝土）";
  if (/PC|プレキャスト/.test(s)) return "PC造（預鑄混凝土）";
  return raw.trim() || null;
}

