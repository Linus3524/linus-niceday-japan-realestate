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
  // 一併轉全形加號「＋」：真實販売図面的間取常寫成 "1SLDK＋WIC"，
  // 漏了它會讓收納標記剝不掉，房型比對不到分桶而整塊行情消失。
  return value.replace(/[０-９Ａ-Ｚａ-ｚ．，＋]/g, char =>
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

/** 與 parseYenAmount 相同，但供稅費推算欄位接受合法的 0 円與 JSON 數字。 */
export function parseNonNegativeYenAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }
  if (typeof value !== "string") return null;
  const cleaned = toHalfWidth(value).replace(/,/g, "").trim();
  if (/^(?:0|0円|なし|無し|免税|非課税)$/i.test(cleaned)) return 0;
  return parseYenAmount(cleaned);
}

/**
 * 解析買賣物件每戶必須負擔的其他月費。
 *
 * 圖紙常把停車場、駐輪場與機車位的「使用者付費」混在附近；它們不是每戶固定
 * 持有成本，不能因為文字裡第一個金額很大就整筆算入。只採計有明確固定費用標籤
 * 的項目，並支援一列同時列出多項月費。
 */
export function parseMandatoryMonthlyFees(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).replace(/,/g, "");
  if (!cleaned.trim()) return null;

  const label = /町会費|町内会費|自治会費|協力金|外部所有者協力金|組合費|管理組合費|インターネット(?:使用)?料|CATV(?:使用)?料|有線放送料|その他月額費用/i;
  const amounts = cleaned
    .split(/[、，。;；\n]/)
    .filter(clause => label.test(clause))
    .flatMap(clause => [...clause.matchAll(/(\d{1,10})\s*円/g)])
    .map(match => Number(match[1]))
    .filter(value => Number.isFinite(value) && value > 0);
  if (!amounts.length) return null;
  return amounts.reduce((sum, value) => sum + value, 0);
}

/**
 * 修繕積立金的主欄偶爾仍印舊額，並在備註寫「○月分より月額○円に改定」。
 * 估算持有成本時應採改定額；原始擷取文字仍保留，方便使用者回看圖紙。
 */
export function parseEffectiveRepairReserve(repairText: unknown, notes: unknown): number | null {
  const base = parseYenAmount(repairText);
  if (typeof notes !== "string") return base;

  const cleaned = toHalfWidth(notes).replace(/,/g, "");
  const revisedAmounts = [...cleaned.matchAll(
    /修繕積立金[^。\n]{0,60}?月額\s*(\d{1,10})\s*円[^。\n]{0,24}?(?:改定|変更|増額)/g,
  )]
    .map(match => Number(match[1]))
    .filter(value => Number.isFinite(value) && value > 0);
  return revisedAmounts.at(-1) ?? base;
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
 * 判斷文字是否表示無、免費、0、不要
 */
export function isFreeOrZero(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const cleaned = toHalfWidth(text).trim();
  if (!cleaned) return false;
  // 單獨一個「無」是租賃図面敷金／礼金格子最常見的免收寫法之一（與なし、無し並列）。
  // 先前只認 無し／無償／無料，漏掉裸字「無」——Gemini 照原文回「無」時
  // 就判成「未載明」，圖紙明明寫了免押金卻顯示待確認。
  if (/^(?:0(?:\.0+)?\s*(?:円|ヶ月|ヵ月|カ月|個月)?|-|ー|―|無|無し|なし)$/.test(cleaned)) return true;
  // 含正數金額或月數的字串不是「免」：例如 "1ヶ月（償却なし）" 押金是 1 個月，
  // 不能因為括號裡出現なし就整筆當成零。要先擋這條，下面的關鍵字比對才安全。
  if (/[1-9][\d,]*(?:\.\d+)?\s*(?:万円|円|ヶ月|ヵ月|カ月|個月)/.test(cleaned)) return false;
  return /(?:無償|無料|不要|なし|無し|無|免除)/i.test(cleaned);
}

/**
 * 圖紙有時會漏填獨立的敷金／禮金欄位，卻在契約條件中寫「敷金0・礼金0」。
 * 這種明確的零額記載應優先於缺漏的結構化欄位，避免誤顯示為待確認。
 */
export function hasExplicitZeroLeaseCharge(
  text: unknown,
  kind: "deposit" | "keyMoney",
): boolean {
  if (typeof text !== "string") return false;
  const cleaned = toHalfWidth(text).normalize("NFKC");
  const label = kind === "deposit" ? "(?:敷金|押金|保証金|保證金)" : "(?:礼金|禮金)";
  // 無し 要排在 無 前面：alternation 由左至右嘗試，先配到較長的寫法才不會
  // 讓「無し」只吃到「無」、剩下的「し」再去干擾後面的單位比對。
  return new RegExp(`${label}\\s*(?:[:：]?\\s*)?(?:0(?:\\.0+)?|なし|無し|無|不要|ゼロ)\\s*(?:円|ヶ月|ヵ月|カ月|個月)?`, "i").test(cleaned);
}

/**
 * 格式化敷引標示：
 * 若圖紙寫 "1"、"1ヶ月"、"敷引1ヶ月"、"解約時敷金償却 1ヶ月"、"100%"，轉為清晰的中文說明。
 */
export function formatShikibiki(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = toHalfWidth(raw).trim();
  if (!cleaned || isFreeOrZero(cleaned)) return "";
  if (cleaned === "1") return "1 個月（退租固定扣抵）";

  const shokyakuMatch = cleaned.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)?/);
  if (shokyakuMatch) {
    return `${shokyakuMatch[1]} 個月（退租固定扣抵）`;
  }

  if (/^(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)?$/i.test(cleaned)) {
    const m = cleaned.match(/^(\d+(?:\.\d+)?)/)?.[1];
    return `${m} 個月（退租固定扣抵）`;
  }
  if (/[%％]/.test(cleaned)) {
    return `${cleaned}（退租固定扣抵）`;
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
 * 只剝除明確的路線或獨立營運商標籤；東武練馬、京成高砂等站名中的公司名必須保留。
 */
export function stripStationOperatorPrefix(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const cleaned = text
    .normalize("NFKC")
    .trim()
    // 図面常把站名寫成「ＪＲ総武線 『大久保』駅」，引號留著會讓站名比對失敗，
    // 進而讓不同車站被回退到同一個座標（實測大久保與新大久保都被算成 366m）。
    .replace(/[『』「」《》〈〉【】]/g, "")
    .replace(/^(?:JR|ＪＲ)/i, "")
    .replace(/^(?:東京メトロ|東京地下鉄|都営地下鉄|都営)/, "")
    .replace(/^(?:東急|京王|小田急|西武|東武|京急|京成|相鉄|つくばエクスプレス)[\s・･]+/, "")
    // "○○線 ○○駅" 這種前面還帶路線名的寫法，取最後一段當站名。
    .replace(/^.*線[\s・･]*/, "")
    .replace(/\s*(?:車站|站|駅)\s*$/, "")
    .trim();
  return cleaned || null;
}

/**
 * 解析所在階與建物總樓層。
 *
 * 所在階寫法：「3階」「7階部分」「16階」「B1階」；
 * 總樓層通常不在所在階欄位，而是混在構造欄位裡：
 * 「鉄筋コンクリート造7階建」「鉄筋コンクリート造21階建/地下1階」。
 *
 * 兩者要一起看才有意義：「7階」在 7 階建是頂樓、在 21 階建只是中低樓層，
 * 光看樓層數字無法判斷這是不是高樓層溢價。
 */
export function parseFloorInfo(floorText: unknown, structureText?: unknown): {
  floor: number | null;
  totalFloors: number | null;
} {
  const floorRaw = typeof floorText === "string" ? toHalfWidth(floorText) : "";
  const structureRaw = typeof structureText === "string" ? toHalfWidth(structureText) : "";

  // 地下樓層以負數表示，避免與地上同名樓層混淆。
  const basement = floorRaw.match(/(?:B|地下)\s*(\d+)\s*階?/i);
  const aboveGround = floorRaw.match(/^(\d+)$/) || floorRaw.match(/(?:所在階[：:\s]*)?(\d+)\s*(?:階|F|樓)/i);
  const floor = basement
    ? -Number(basement[1])
    : aboveGround
      ? Number(aboveGround[1])
      : null;

  // 「地下1階」也會寫成 ○階建 的鄰居，只取「○階建」這種明確的總樓層寫法。
  const totalMatch = `${structureRaw} ${floorRaw}`.match(/(\d+)\s*階建/);
  const totalFloors = totalMatch ? Number(totalMatch[1]) : null;

  const valid = (n: number | null) => (n !== null && Number.isFinite(n) && Math.abs(n) <= 100 ? n : null);
  return { floor: valid(floor), totalFloors: valid(totalFloors) };
}

export function normalizeRoomType(text: unknown): RoomType | null {
  if (typeof text !== "string") return null;

  const cleaned = toHalfWidth(text)
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[（(].*?[）)]/g, "");

  // 核心格局是「房間數＋(L)DK／K／R」，後面接的都是收納或附屬空間標記
  // （+W、+WIC、+SIC、+S、+2S、+N、+DEN、+F…）。這些在日本不計入居室，
  // 不改變房間數分桶，所以只錨定開頭的核心樣式，後面一律忽略。
  //
  // 先前用白名單列舉後綴（WIC|SIC|N|S），實測真實販売図面出現 "2LDK+W"、
  // "3LDK+2S"、"1LDK+DEN"、"3LDK+F" 就整個回傳 null，行情比對直接消失
  // （ビューネ吉祥寺203 的 "2LDK+W" 就是這樣掉的）。後綴花樣列不完，不要再用白名單。
  //
  // 夾在中間的 S 一併吸收："1SLDK" 就是 1LDK 附納戸，同樣不改變分桶。
  const ldkMatch = cleaned.match(/^(\d+)S?LDK/);
  if (ldkMatch) {
    const table: Record<string, RoomType> = { "1": "ldk1", "2": "ldk2", "3": "ldk3" };
    return table[ldkMatch[1]] ?? null;
  }

  const kMatch = cleaned.match(/^(\d+)S?(?:DK|K)/);
  if (kMatch) {
    const table: Record<string, RoomType> = { "1": "k1", "2": "ldk1", "3": "ldk2", "4": "ldk3" };
    return table[kMatch[1]] ?? null;
  }

  const rMatch = cleaned.match(/^(\d+)R/);
  if (rMatch) return rMatch[1] === "1" ? "r1" : null;

  return null;
}

/**
 * 解析專有面積字串（例如 "25.4㎡"、"25.40m2"、"25.40m²"、"25.4平米"、"7.68坪" 或 "15.5帖"）。
 */
export function parseArea(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();
  const match = cleaned.match(/(?:合計(?:面積)?|延床(?:面積)?|延べ床(?:面積)?|総床面積|總面積)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(㎡|m2|m²|平米|米|坪)/i)
    || cleaned.match(/(\d+(?:\.\d+)?)\s*(㎡|m2|m²|平米|米)/i)
    || cleaned.match(/(\d+(?:\.\d+)?)\s*(坪|帖|畳)/i);
  if (match) {
    let val = Number(match[1]);
    if (match[2] === "坪") val = Math.round(val * 3.30578 * 10) / 10;
    else if (/帖|畳/.test(match[2])) val = Math.round(val * 1.62 * 10) / 10;
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
  // 「鉄骨・鉄筋コンクリート造」中間帶分隔符，沒放寬會掉到下一條 /鉄筋/ 而誤判成 RC。
  if (/SRC|鉄骨[・･\s]*鉄筋|鋼骨[・･\s]*鋼筋/.test(s)) return "SRC造（鋼骨鋼筋混凝土）";
  if (/RC|鉄筋/.test(s)) return "RC造（鋼筋混凝土）";
  if (/軽量鉄骨/.test(s)) return "輕量鐵骨造";
  if (/重量鉄骨/.test(s)) return "重量鐵骨造";
  if (/S造|鉄骨|STEEL/.test(s)) return "S造（鐵骨造）";
  if (/木造|WOOD|W造/.test(s)) return "木造";
  if (/ALC/.test(s)) return "ALC造（輕質氣泡混凝土）";
  if (/PC|プレキャスト/.test(s)) return "PC造（預鑄混凝土）";
  return raw.trim() || null;
}

/**
 * 解析買賣售價（例如 "7,299万円"、"3,450万"、"6300万円"、"5,488"）
 */
export function parseSalePrice(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const normalized = text.normalize("NFKC").replace(/[,，\s]/g, "").replace(/億/g, "亿");
  const revised = normalized.match(/(?:新価格|新價格|改定価格|改定價格)[:：]?((?:\d+(?:\.\d+)?亿)?\d+(?:\.\d+)?[万萬](?:円)?)/);
  if (revised) return parseSalePrice(revised[1]);
  const compound = normalized.match(/(\d+(?:\.\d+)?)亿(?:(\d+(?:\.\d+)?)[万萬])?/);
  if (compound) return Math.round(Number(compound[1]) * 100_000_000 + Number(compound[2] || 0) * 10_000);
  const symbol = normalized.match(/(?:[¥￥](\d{1,12})|(\d{1,12})[¥￥])/);
  if (symbol) {
    const value = Number(symbol[1] || symbol[2]);
    return value > 0 ? value : null;
  }
  return parseYenAmount(normalized.replace(/萬/g, "万"));
}

/**
 * 解析總戶數（例如 "39戸"、"17戸"、"50戸"）
 */
export function parseUnitsCount(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();
  const match = cleaned.match(/(\d+)\s*(?:戸|戶|件)?/);
  if (match) {
    const val = Number(match[1]);
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  return null;
}

/**
 * 解析表面利回り（例如 "4.0%"、"4.00％"）
 */
export function parseYieldRate(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = toHalfWidth(text).trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*[%％]/);
  if (match) {
    const val = Number(match[1]);
    return Number.isFinite(val) && val > 0 && val < 50 ? val / 100 : null;
  }
  return null;
}

/**
 * 計算坪數、坪單價與平米單價
 */
export function computeTsuboAndSqmPrice(priceYen: number, areaSqm: number | null) {
  if (!areaSqm || areaSqm <= 0) {
    return {
      tsubo: null,
      tsuboPriceYen: null,
      tsuboPriceMan: null,
      sqmPriceYen: null,
      sqmPriceMan: null,
    };
  }
  const tsubo = Math.round((areaSqm * 0.3025) * 100) / 100;
  const tsuboPriceYen = tsubo > 0 ? Math.round(priceYen / tsubo) : null;
  const tsuboPriceMan = tsuboPriceYen ? Math.round((tsuboPriceYen / 10000) * 10) / 10 : null;
  const sqmPriceYen = Math.round(priceYen / areaSqm);
  const sqmPriceMan = Math.round((sqmPriceYen / 10000) * 10) / 10;

  return {
    tsubo,
    tsuboPriceYen,
    tsuboPriceMan,
    sqmPriceYen,
    sqmPriceMan,
  };
}

/**
 * 國土交通省修繕積立金指引與大樓戶數規模合理性評估
 */
export function assessRepairReserve(params: {
  monthlyRepairCostYen: number; // 修繕積立金 + 修繕基金
  areaSqm: number | null;
  totalUnits: number | null;
  ageYears?: number | null;
  monthlyManagementFeeYen?: number | null;
  totalFloors?: number | null;
}) {
  const { monthlyRepairCostYen, areaSqm, totalUnits, ageYears, monthlyManagementFeeYen, totalFloors } = params;

  // 1. 每平米月提撥金額與國交省長期修繕指針標準
  const isTower = typeof totalFloors === "number" && totalFloors >= 20;
  const guidelineRange = isTower ? "250 〜 450 円/㎡/月" : "200 〜 350 円/㎡/月";
  const lowThreshold = isTower ? 200 : 160;
  const highThreshold = isTower ? 450 : 350;

  const reservePerSqm = areaSqm && areaSqm > 0 ? Math.round(monthlyRepairCostYen / areaSqm) : null;

  let reserveHealthLevel: "inadequate" | "healthy" | "heavy" = "healthy";
  let reserveHealthText = "積立金水準適中";
  let reserveHealthNote = `符合日本國土交通省修繕積立金指針建議標準（約 ${guidelineRange}），大樓儲備提撥平準。`;

  if (reservePerSqm !== null) {
    if (reservePerSqm < lowThreshold) {
      reserveHealthLevel = "inadequate";
      reserveHealthText = "積立金提撥偏低";
      reserveHealthNote = (typeof ageYears === "number" && ageYears > 15)
        ? `每平米月提撥約 ¥${reservePerSqm.toLocaleString()}/㎡，低於國交省指針建議區間（${guidelineRange}）。大樓屋齡已屆成熟期，需留意修繕儲備金是否充足，建議向管委會調閱長期修繕計畫與總會報告，確認是否有儲備不足、後續調漲或徵收修繕一時金之規劃。`
        : `每平米月提撥約 ¥${reservePerSqm.toLocaleString()}/㎡，初期費率偏低。日本集合住宅初期多採階段增額方式（段階増額積立方式），依長期修繕計畫未來通常會分階段調升。`;
    } else if (reservePerSqm > highThreshold) {
      reserveHealthLevel = "heavy";
      reserveHealthText = "積立金水準偏高";
      reserveHealthNote = `每平米月提撥達 ¥${reservePerSqm.toLocaleString()}/㎡，高於指針基準。管委會提撥充裕、財務體質穩健，但每月固定持有支出較顯著，需納入長期現金流考量。`;
    } else {
      reserveHealthLevel = "healthy";
      reserveHealthText = "積立金水準適中";
      reserveHealthNote = `每平米月提撥約 ¥${reservePerSqm.toLocaleString()}/㎡，符合日本國土交通省長期修繕計畫指針建議水準（約 ${guidelineRange}），大樓儲備提撥平準。`;
    }
  }

  // 管理費與修繕金比例平衡觀察
  let reserveRatio: number | null = null;
  let feeRatioNote: string | null = null;
  if (monthlyManagementFeeYen && monthlyManagementFeeYen > 0 && monthlyRepairCostYen > 0) {
    const totalMaintenanceCost = monthlyManagementFeeYen + monthlyRepairCostYen;
    reserveRatio = Math.round((monthlyRepairCostYen / totalMaintenanceCost) * 100);
    if (reserveRatio <= 25 && monthlyRepairCostYen < 10000) {
      feeRatioNote = `管理與修繕費用配置：修繕積立金僅佔月維護費約 ${reserveRatio}%，日常管理支出佔比較高，長期修繕資本累積速度相對有限。`;
    } else if (reserveRatio > 65) {
      feeRatioNote = `管理與修繕費用配置：修繕積立金佔月維護費約 ${reserveRatio}%，大樓著重長期資本儲備，公共維護提撥充足。`;
    }
  }

  // 2. 戶數規模風險判定（四級客觀判定）
  let scaleRiskLevel: "high_risk" | "medium" | "safe" = "safe";
  let scaleRiskText = "中大型社區";
  let scaleRiskNote = "戶數具規模經濟，公共設施維護與大規模修繕每戶分攤平準。";

  if (totalUnits === null) {
    scaleRiskLevel = "safe";
    scaleRiskText = "總戶數待確認";
    scaleRiskNote = "圖紙未載明大樓總戶數，建議向仲介確認戶數規模，以客觀評估每戶分攤公共維修費之負擔。";
  } else if (totalUnits < 20) {
    scaleRiskLevel = "high_risk";
    scaleRiskText = "極小規模社區（<20戶）";
    scaleRiskNote = `總戶數僅 ${totalUnits} 戶，戶數較少，每戶分攤電梯保養、外牆清洗與屋頂防水等固定公共開銷相對顯著；管理形式多為巡回或自主管理，需留意管委會運作與修繕儲備。`;
  } else if (totalUnits < 50) {
    scaleRiskLevel = "medium";
    scaleRiskText = "中小規模社區（20-49戶）";
    scaleRiskNote = `總戶數約 ${totalUnits} 戶，規模適中，自住率高時共識較易凝聚；建議確認社區是否有正式長期修繕計劃書及電梯設備更新排程。`;
  } else if (totalUnits < 100) {
    scaleRiskLevel = "safe";
    scaleRiskText = "中大規模社區（50-99戶）";
    scaleRiskNote = `總戶數約 ${totalUnits} 戶，戶數與管理成本具備良好平衡，每戶分攤公共維護費用平準，管理體制通常較為健全。`;
  } else {
    scaleRiskLevel = "safe";
    scaleRiskText = "大規模社區／超高層（100戶以上）";
    scaleRiskNote = `總戶數達 ${totalUnits} 戶，具備顯著規模經濟優勢，管理基金儲備通常較充裕、公設維持度良好；大規模修繕時需留意所有權人大會決策共識凝聚。`;
  }

  return {
    reservePerSqm,
    reserveHealthLevel,
    reserveHealthText,
    reserveHealthNote,
    guidelineRange,
    reserveRatio,
    feeRatioNote,
    scaleRiskLevel,
    scaleRiskText,
    scaleRiskNote,
  };
}

export interface NetYieldBreakdownItem {
  name: string;
  amountYen: number;
  annualAmountYen: number;
  type: "income" | "deduction" | "subtotal";
  note?: string;
}

export interface NetYieldBreakdown {
  monthlyRentYen: number;
  annualIncomeYen: number;
  grossYield: number; // 表面利回り（%）
  monthlyHoldingCostsYen: number;
  annualHoldingCostsYen: number;
  pmFeeRatePercent: number; // 租賃代管費率（通常 5%）
  annualPmFeeYen: number;
  monthlyPmFeeYen: number;
  annualEstimatedPropertyTaxYen: number;
  monthlyEstimatedPropertyTaxYen: number;
  propertyTaxNote: string;
  annualNetOperatingIncomeYen: number; // NOI
  monthlyNetOperatingIncomeYen: number;
  netYieldPercent: number; // 實質淨利回（%）
  items: NetYieldBreakdownItem[];
}

/**
 * 投資客實質到手淨回報（NOI / Net Yield）速算
 * 依據日本常規租賃營運成本扣除：
 * 1. 大樓管理費與修繕積立金（HOA）
 * 2. 租賃代管委託費（PM Fee，常態約 5%）
 * 3. 概算固定資產稅與都市計畫稅（固都稅）
 */
export function calculateNetYieldBreakdown(params: {
  salePriceYen: number;
  monthlyRentYen: number;
  monthlyManagementFeeYen: number;
  monthlyRepairReserveYen: number;
  otherMonthlyFeesYen?: number;
  statedPropertyTaxYen?: number | null;
  pmFeeRatePercent?: number;
}): NetYieldBreakdown {
  const {
    salePriceYen,
    monthlyRentYen,
    monthlyManagementFeeYen,
    monthlyRepairReserveYen,
    otherMonthlyFeesYen = 0,
    statedPropertyTaxYen,
    pmFeeRatePercent = 5.0,
  } = params;

  const annualIncomeYen = monthlyRentYen * 12;
  const grossYield = salePriceYen > 0
    ? Math.round((annualIncomeYen / salePriceYen) * 1000) / 10
    : 0;

  const monthlyHoldingCostsYen = Math.max(0, monthlyManagementFeeYen + monthlyRepairReserveYen + otherMonthlyFeesYen);
  const annualHoldingCostsYen = monthlyHoldingCostsYen * 12;

  const annualPmFeeYen = Math.round(annualIncomeYen * (pmFeeRatePercent / 100));
  const monthlyPmFeeYen = Math.round(annualPmFeeYen / 12);

  // 固都稅概算：若圖紙有載明則採圖紙載明額；若無，住宅中古公寓常規約房價 0.25%（約等於 0.8～1.2 個月租金）
  let annualEstimatedPropertyTaxYen: number;
  let propertyTaxNote: string;

  if (typeof statedPropertyTaxYen === "number" && statedPropertyTaxYen > 0) {
    annualEstimatedPropertyTaxYen = Math.round(statedPropertyTaxYen);
    propertyTaxNote = "依圖紙記載之固定資產稅與都市計畫稅合計";
  } else if (salePriceYen > 0) {
    // 房價 0.25% 為基準，並夾在合理住宅區間內
    const priceBasedTax = Math.round(salePriceYen * 0.0025);
    const rentBasedCap = Math.round(monthlyRentYen * 1.2);
    const rentBasedFloor = Math.round(monthlyRentYen * 0.6);
    annualEstimatedPropertyTaxYen = Math.max(rentBasedFloor, Math.min(rentBasedCap, priceBasedTax));
    propertyTaxNote = "依中古公寓常態按售價 0.25% 概算（約合 1 個月租金水準）";
  } else {
    annualEstimatedPropertyTaxYen = monthlyRentYen;
    propertyTaxNote = "以 1 個月租金概算年度稅賦";
  }

  const monthlyEstimatedPropertyTaxYen = Math.round(annualEstimatedPropertyTaxYen / 12);

  const annualNetOperatingIncomeYen = Math.round(
    annualIncomeYen - annualHoldingCostsYen - annualPmFeeYen - annualEstimatedPropertyTaxYen
  );
  const monthlyNetOperatingIncomeYen = Math.round(annualNetOperatingIncomeYen / 12);

  const netYieldPercent = salePriceYen > 0
    ? Math.round((annualNetOperatingIncomeYen / salePriceYen) * 1000) / 10
    : 0;

  const items: NetYieldBreakdownItem[] = [
    {
      name: "年間租金毛收入",
      amountYen: monthlyRentYen,
      annualAmountYen: annualIncomeYen,
      type: "income",
      note: "現況月租金 × 12 個月",
    },
    {
      name: "大樓管理費與修繕積立金",
      amountYen: -monthlyHoldingCostsYen,
      annualAmountYen: -annualHoldingCostsYen,
      type: "deduction",
      note: "大樓管委會常態維持與儲備費用",
    },
    {
      name: "租賃代管委託費（集金代行）",
      amountYen: -monthlyPmFeeYen,
      annualAmountYen: -annualPmFeeYen,
      type: "deduction",
      note: `日本租賃管理公司常規費率約 ${pmFeeRatePercent}%（含招租、催繳與修繕窗口）`,
    },
    {
      // 全名 15 字在手機的窄欄位裡剛好差 5px 撐破容器，而且這串因為結尾是
      // 全形括號，瀏覽器不肯在括號前斷行（break-all／overflow-wrap 都無效）。
      // 通用簡稱「固都稅」在同頁的註腳已經定義過，直接用簡稱，全名留在備註。
      name: "固都稅（概算）",
      amountYen: -monthlyEstimatedPropertyTaxYen,
      annualAmountYen: -annualEstimatedPropertyTaxYen,
      type: "deduction",
      note: propertyTaxNote,
    },
    {
      name: "預估年實質淨到手收入（NOI）",
      amountYen: monthlyNetOperatingIncomeYen,
      annualAmountYen: annualNetOperatingIncomeYen,
      type: "subtotal",
      note: "扣除各項常態營運維持成本後之實質營業淨收益",
    },
  ];

  return {
    monthlyRentYen,
    annualIncomeYen,
    grossYield,
    monthlyHoldingCostsYen,
    annualHoldingCostsYen,
    pmFeeRatePercent,
    annualPmFeeYen,
    monthlyPmFeeYen,
    annualEstimatedPropertyTaxYen,
    monthlyEstimatedPropertyTaxYen,
    propertyTaxNote,
    annualNetOperatingIncomeYen,
    monthlyNetOperatingIncomeYen,
    netYieldPercent,
    items,
  };
}

export interface SaleInitialCostOptions {
  combinedAnnualPropertyTaxYen?: number | null;
  handoverDate?: string;
  prepaidMonths?: number;
  monthlyManagementFeeYen?: number;
  monthlyRepairReserveYen?: number;
  fixedAssetTaxYen?: number | null;
  cityPlanningTaxYen?: number | null;
  acquisitionTaxYen?: number | null;
  acquisitionTaxNote?: string;
  registrationFeeYen?: number | null;
  insuranceFeeYen?: number;
}

export interface AcquisitionTaxAssessmentInput {
  propertyCategory?: string;
  buildingAssessedValueYen: number | null;
  landTaxAfterReliefYen?: number | null;
  fallbackTaxYen?: number | null;
  areaSqm: number | null;
  ageYears: number | null;
  occupancyStatus?: string | null;
}

/**
 * 2026-04-01 起的中古住宅取得稅自住優惠防呆。
 * 租賃中／オーナーチェンジ一定不套自住扣除；空室僅以「買方自住」假設試算。
 */
export function assessRealEstateAcquisitionTax(input: AcquisitionTaxAssessmentInput) {
  const status = input.occupancyStatus || "";
  if (["land", "whole_building", "detached"].includes(input.propertyCategory || "")) {
    return {
      amount: null, reliefApplied: false, isTenanted: false, meetsArea: false, meetsSeismic: false,
      note: "土地／整棟／透天須個別核對課稅用途、新築或中古、土地與建物評價額；取得稅暫未計入，未套用區分公寓試算。",
    };
  }
  if (/民泊|旅館|宿泊|住宿/.test(status)) {
    return {
      amount: null, reliefApplied: false, isTenanted: false, meetsArea: false, meetsSeismic: false,
      note: "住宿營業物件須先確認登記用途與住宅／非住宅課稅分類，取得稅暫未計入；未套用買方自住扣除。",
    };
  }
  const isTenanted = /賃貸中|オーナーチェンジ|投資/i.test(status);
  const meetsArea = input.areaSqm !== null && input.areaSqm >= 40 && input.areaSqm <= 240;
  const meetsSeismic = input.ageYears !== null && input.ageYears <= 44;
  const reliefApplied = !isTenanted && meetsArea && meetsSeismic;
  const buildingValue = input.buildingAssessedValueYen;
  const landTax = Math.max(0, Math.round(input.landTaxAfterReliefYen ?? 0));

  let amount: number | null = null;
  if (buildingValue !== null) {
    const buildingTaxBase = reliefApplied ? Math.max(0, buildingValue - 12_000_000) : buildingValue;
    amount = Math.max(0, Math.round(buildingTaxBase * 0.03) + landTax);
  } else if (input.fallbackTaxYen !== null && input.fallbackTaxYen !== undefined) {
    // 舊 API 回應沒有建物評價額時只可沿用非零結果；租賃中物件的 0 円不可採信。
    amount = isTenanted && input.fallbackTaxYen === 0 ? null : Math.max(0, Math.round(input.fallbackTaxYen));
  }

  const note = isTenanted
    ? "租賃中／帶租約物件不符合買方自住要件，未套用 1,200 萬円建物評價額扣除"
    : !meetsArea
      ? "專有面積未落在 40～240㎡ 門檻內，未套用自住中古住宅扣除"
      : !meetsSeismic
        ? "未確認為 1982 年後興建或具新耐震證明，未套用自住中古住宅扣除"
        : amount === 0
          ? "符合自住、40～240㎡ 及新耐震條件，因建物評價額低於 1,200 萬円扣除額上限，全額折抵後稅額為 0 円"
          : "符合自住、40～240㎡ 及新耐震條件，建物評價額扣除 1,200 萬円扣除額後按 3% 試算";

  return { amount, reliefApplied, isTenanted, meetsArea, meetsSeismic, note };
}

/** 日本國稅廳「不動產讓渡契約書」現行輕減稅率（適用至 2027-03-31）。 */
export function getRealEstateStampDuty(salePriceYen: number): number {
  if (salePriceYen < 10000) return 0;
  if (salePriceYen <= 500000) return 200;
  if (salePriceYen <= 1000000) return 500;
  if (salePriceYen <= 5000000) return 1000;
  if (salePriceYen <= 10000000) return 5000;
  if (salePriceYen <= 50000000) return 10000;
  if (salePriceYen <= 100000000) return 30000;
  if (salePriceYen <= 500000000) return 60000;
  if (salePriceYen <= 1000000000) return 160000;
  if (salePriceYen <= 5000000000) return 320000;
  return 480000;
}

function saleCostDateInfo(dateText?: string) {
  const fallback = new Date();
  const parsed = dateText ? new Date(`${dateText}T00:00:00`) : fallback;
  const date = Number.isNaN(parsed.getTime()) ? fallback : parsed;
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const nextYear = new Date(year + 1, 0, 1);
  const end = new Date(year, 11, 31);
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    dateText: `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    remainingDays: Math.max(0, Math.round((end.getTime() - date.getTime()) / dayMs) + 1),
    daysInYear: Math.round((nextYear.getTime() - start.getTime()) / dayMs),
  };
}

/**
 * 買方交屋諸費用：法定公式由程式精算，只有需要固定資產評價額的項目接收 AI 辨識／推算值。
 */
export function calculateSaleInitialCosts(salePriceYen: number, options: SaleInitialCostOptions = {}) {
  const brokerageFee = Math.floor((salePriceYen * 0.03 + 60000) * 1.1);

  const registrationWasEstimated = options.registrationFeeYen == null || options.registrationFeeYen <= 0;
  const registrationAndScrivenerFee = registrationWasEstimated
    ? Math.max(0, Math.round(salePriceYen * 0.01))
    : Math.max(0, Math.round(options.registrationFeeYen!));
  const stampDuty = getRealEstateStampDuty(salePriceYen);
  const insuranceFee = Math.max(0, Math.round(options.insuranceFeeYen ?? 200000));

  const fixedAssetTaxYen = Math.max(0, Math.round(options.fixedAssetTaxYen ?? 0));
  const cityPlanningTaxYen = Math.max(0, Math.round(options.cityPlanningTaxYen ?? 0));
  const annualPropertyTaxes = options.combinedAnnualPropertyTaxYen == null ? fixedAssetTaxYen + cityPlanningTaxYen : Math.max(0, Math.round(options.combinedAnnualPropertyTaxYen));
  const dateInfo = saleCostDateInfo(options.handoverDate);
  const taxesProrated = Math.floor(annualPropertyTaxes * dateInfo.remainingDays / dateInfo.daysInYear);

  const acquisitionTaxWasEstimated = options.acquisitionTaxYen == null;
  const acquisitionTax = Math.max(0, Math.round(options.acquisitionTaxYen ?? 0));
  const prepaidMonths = Math.min(24, Math.max(0, Math.round(options.prepaidMonths ?? 3)));
  const monthlyManagementFeeYen = Math.max(0, Math.round(options.monthlyManagementFeeYen ?? 0));
  const monthlyRepairReserveYen = Math.max(0, Math.round(options.monthlyRepairReserveYen ?? 0));
  const managementPrepayment = (monthlyManagementFeeYen + monthlyRepairReserveYen) * prepaidMonths;

  const total = brokerageFee
    + registrationAndScrivenerFee
    + stampDuty
    + insuranceFee
    + taxesProrated
    + acquisitionTax
    + managementPrepayment;
  const percentageOfPrice = salePriceYen > 0 ? Math.round((total / salePriceYen) * 1000) / 10 : 0;

  return {
    total,
    percentageOfPrice,
    items: [
      {
        id: "brokerage",
        name: "仲介手續費（法定上限含稅）",
        amount: brokerageFee,
        note: "（總價 × 3% + 6萬円）× 1.1 消費稅",
      },
      {
        id: "registration",
        name: "登記免許稅與司法書士報酬",
        amount: registrationAndScrivenerFee,
        note: registrationWasEstimated
          ? "尚無圖紙評價資料，暫以房價 1.0% 估算；實際依固定資產評價額、貸款與司法書士報價"
          : "AI 依圖紙、固定資產評價與登記內容複合推算（通常約房價 0.8%～1.2%）",
      },
      {
        id: "stamp",
        name: "不動產買賣契約書印紙代",
        amount: stampDuty,
        note: "日本國稅廳印花稅階梯級距",
      },
      {
        id: "insurance",
        name: "火災保險・地震保險（預估）",
        amount: insuranceFee,
        note: "依建物構造、專有面積、保障內容與投保期間調整",
      },
      {
        id: "propertyTaxProration",
        name: "固都稅日割清算",
        amount: taxesProrated,
        note: annualPropertyTaxes > 0
          ? `預估全年固都稅 ${annualPropertyTaxes.toLocaleString("ja-JP")} 円 × 暫以分析日至年底約 ${dateInfo.remainingDays}/${dateInfo.daysInYear} 日估算（實際依簽約交屋日結算）`
          : "圖紙與 AI 均未取得固都稅年額，目前未計入；正式交屋時依賣方納稅通知書日割清算",
      },
      {
        id: "acquisitionTax",
        name: "不動產取得稅",
        amount: acquisitionTax,
        note: options.acquisitionTaxNote || (acquisitionTaxWasEstimated
          ? "尚無圖紙評價資料或 AI 推算值，目前未計入；取得後以都道府縣核定通知為準"
          : acquisitionTax > 0
          ? "AI 依建物評價額、專有面積與新耐震／自用住宅減免條件推算"
          : "符合自住條件且建物評價額低於 1,200 萬円扣除額上限，全額折抵後為 0 円（以都道府縣稅務署核定為準）"),
      },
      {
        id: "managementPrepayment",
        name: "管理費與修繕積立金預繳",
        amount: managementPrepayment,
        note: `（管理費 ${monthlyManagementFeeYen.toLocaleString("ja-JP")} 円 + 修繕積立金 ${monthlyRepairReserveYen.toLocaleString("ja-JP")} 円）× ${prepaidMonths} 個月`,
      },
    ],
    settings: {
      handoverDate: dateInfo.dateText,
      remainingDays: dateInfo.remainingDays,
      daysInYear: dateInfo.daysInYear,
      prepaidMonths,
    },
  };
}

export function parseAgeYears(ageStr?: string | null): number | null {
  if (!ageStr) return null;
  const currentYear = new Date().getFullYear();

  ageStr = ageStr.normalize("NFKC");
  // 建造年優先於廣告刊登當時的「築X年」，避免舊圖紙屋齡停留在過去。
  const mYear = ageStr.match(/(?:19|20)\d{2}/);
  if (mYear) {
    const y = Number(mYear[0]);
    return Math.max(0, currentYear - y);
  }

  // 3. Japanese era year: 平成X年, 令和X年, 昭和X年
  const mReiwa = ageStr.match(/令和\s*(\d+|元)\s*年?/);
  if (mReiwa) {
    const y = mReiwa[1] === "元" ? 1 : Number(mReiwa[1]);
    return Math.max(0, currentYear - (2018 + y));
  }
  const mHeisei = ageStr.match(/平成\s*(\d+|元)\s*年?/);
  if (mHeisei) {
    const y = mHeisei[1] === "元" ? 1 : Number(mHeisei[1]);
    return Math.max(0, currentYear - (1988 + y));
  }
  const mShowa = ageStr.match(/昭和\s*(\d+|元)\s*年?/);
  if (mShowa) {
    const y = mShowa[1] === "元" ? 1 : Number(mShowa[1]);
    return Math.max(0, currentYear - (1925 + y));
  }

  const mChiku = ageStr.match(/築\s*(\d+)\s*年/);
  if (mChiku) return Number(mChiku[1]);

  // 4. Fallback plain number
  const mAny = ageStr.match(/(\d+)\s*年/);
  if (mAny) {
    const val = Number(mAny[1]);
    if (val >= 1900) return Math.max(0, currentYear - val);
    return val;
  }

  return null;
}

export function formatYen(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `¥${Math.round(amount).toLocaleString("en-US")}`;
}

export interface MortgageTaxAssessment {
  eligible: boolean | null;
  statusText: string;
  note: string;
}

/**
 * 日本住宅貸款減稅（住宅ローン減税）專有面積與壁芯／內法門檻評估。
 * - 法定一般基準：登記簿謄本內法面積 ≥ 50㎡。
 * - 政策緩和特例：登記簿謄本內法面積 ≥ 40㎡（合計所得限 1,000 萬円以下等要件）。
 * - 關鍵防呆：圖紙標示皆為「壁芯面積」（以牆體中心線起算），通常比法務局登記簿之「內法面積」（以牆體內緣起算）大約 5%～8%。
 *   若壁芯僅約 40～42㎡，換算登記簿內法實測極高機率跌破 40.00㎡，無法適用減稅。
 */
export function assessMortgageTaxDeduction(areaSqm: number | null): MortgageTaxAssessment {
  if (!areaSqm || areaSqm <= 0) {
    return {
      eligible: null,
      statusText: "面積待確認",
      note: "未取得專有面積，需由專任司法書士查驗登記謄本內法面積。",
    };
  }
  if (areaSqm >= 50) {
    return {
      eligible: true,
      statusText: "符合住宅貸款減稅主要面積門檻（50㎡）",
      note: `專有面積約 ${areaSqm}㎡（壁芯達標 50㎡）。若登記簿謄本內法面積亦維持在 50㎡ 以上，符合日本「住宅貸款減稅（住宅ローン減税）」所得稅扣除之一般主要門檻。`,
    };
  }
  if (areaSqm >= 43) {
    return {
      eligible: null,
      statusText: "自住住宅貸款減稅資格審查（待核對）",
      note: `專有面積約 ${areaSqm}㎡（壁芯）。日本住宅貸款減稅特例要求「登記簿謄本內法面積 ≥ 40.00㎡」（合計所得限 1,000 萬円以下）。壁芯 43～50㎡ 扣除牆厚後內法有機會維持 40㎡ 以上，需調閱謄本確認實際內法面積。`,
    };
  }
  if (areaSqm >= 40) {
    return {
      eligible: false,
      statusText: "壁芯臨限 40㎡（謄本內法極高機率未滿 40㎡）",
      note: `專有面積約 ${areaSqm}㎡（壁芯）。住宅貸款減稅嚴格要求「登記簿謄本內法面積 ≥ 40.00㎡」；因圖紙標示多為壁芯面積（比謄本內法約大 5%～8%），壁芯僅約 40～42㎡ 者，登記謄本內法實測極高機率縮減至約 37～38㎡，通常無法適用住宅貸款減稅。若有自住節稅規劃，請務必先調閱謄本確認。`,
    };
  }
  return {
    eligible: false,
    statusText: "專有面積未達 40㎡（不符減稅門檻）",
    note: `專有面積約 ${areaSqm}㎡，未達住宅貸款減稅特例最低 40㎡ 標準，無法申請住宅ローン減稅。`,
  };
}

export interface BuildingNotesAssessment {
  specialStrengths: string[];
  specialCautions: string[];
}

/**
 * 辨識大樓特殊優勢與體質注意事項（涵蓋結構、維修亮點、管理體制、戶數規模、電梯、角部屋、朝向、露台與借地權等完整優劣勢）。
 */
export function detectBuildingSpecialNotes(params: {
  specialNotes?: string | null;
  renovationDetails?: string | null;
  structure?: string | null;
  ageYears?: number | null;
  totalUnits?: number | null;
  managementStyle?: string | null;
  managementCompany?: string | null;
  facilities?: string | null;
  floor?: number | null;
  totalFloors?: number | null;
  unitFeatures?: UnitFeatureEvaluation | null;
}): BuildingNotesAssessment {
  const {
    specialNotes,
    renovationDetails,
    structure,
    ageYears,
    totalUnits,
    managementStyle,
    managementCompany,
    facilities,
    floor,
    totalFloors,
    unitFeatures,
  } = params;

  const allNotes = [
    specialNotes || "",
    renovationDetails || "",
    structure || "",
    managementStyle || "",
    managementCompany || "",
    facilities || "",
  ].join(" ").normalize("NFKC");

  const specialStrengths: string[] = [];
  const specialCautions: string[] = [];

  // ── 1. 大樓維護與結構優勢 ──
  if (/立駐解体|機械式駐車場解体|ピット式立駐解体/.test(allNotes)) {
    specialStrengths.push("已拆除高維護成本機械停車塔（大幅消除社區未來最大維修赤字隱患）");
  }
  if (/r1|リノベ協議会/i.test(allNotes)) {
    specialStrengths.push("取得一般社團法人 R1 住宅認證（重要給排水管檢驗合格，附 2 年以上履歷保證）");
  }
  if (/給排水管交換|給排水管新規|給排水管.*(?:10年保証|保証)/.test(allNotes)) {
    specialStrengths.push("室內給排水管已更新／附保證（老屋翻新最關鍵之隱蔽工程，安心度大幅提升）");
  }
  if (/長期修繕計画/.test(allNotes)) {
    specialStrengths.push("大樓訂有長期修繕計畫，資金提撥與運用具前瞻性");
  }
  if (/新耐震/.test(allNotes) || (ageYears !== null && ageYears <= 44)) {
    specialStrengths.push("符合新耐震基準（耐震性高、銀行承貸與資產保值性佳）");
  }
  if (/大規模修繕.*(?:実施済|完了|工事済)/.test(allNotes)) {
    specialStrengths.push("近期已完成大規模修繕工事（外牆與共用部已定期維護）");
  }
  if (/ＳＲＣ|SRC|鉄骨鉄筋/.test(structure || "") || /ＳＲＣ|SRC|鉄骨鉄筋/.test(allNotes)) {
    specialStrengths.push("SRC 鋼骨鋼筋混凝土造（兼具耐震韌性與優異隔音之高規格建材）");
  }
  if (totalUnits && totalUnits >= 100) {
    specialStrengths.push(`百戶以上大規模社區（共 ${totalUnits} 戶，公設維護具規模經濟，長期保值率佳）`);
  }
  if (/ペット飼育可|ペット可|ペット相談|小型犬/i.test(allNotes)) {
    specialStrengths.push("規約允許飼育寵物（都會區流通稀缺，轉手流動性與租客吸引力高）");
  }
  if (/常駐|日勤/.test(allNotes) || (managementCompany && /管理/.test(managementCompany) && !/自主管理/.test(allNotes))) {
    if (/常駐/.test(allNotes)) {
      specialStrengths.push("物業人員常駐管理（日夜安全防犯與社區管理維護最安心）");
    } else if (/日勤/.test(allNotes)) {
      specialStrengths.push("專任管理員日勤維護（社區日常清潔與共用部巡檢健全）");
    }
  }

  // ── 1.5 專有部分規格與格局優勢 ──
  if (unitFeatures?.isCornerUnit) {
    specialStrengths.push("角部屋（邊間雙面採光，通風採光佳且少一側鄰戶雜音干擾）");
  }
  if (unitFeatures?.facingDirection === "south" || unitFeatures?.facingDirection === "southeast" || unitFeatures?.facingDirection === "southwest") {
    specialStrengths.push(`採光面朝向優異（${unitFeatures.facingDirectionZh || "南向"}，全日照充足、冬暖夏涼）`);
  }
  if (floor && totalFloors && floor >= totalFloors && totalFloors > 1) {
    specialStrengths.push(`位於最上階頂樓（${floor}F／共${totalFloors}層，無樓上腳步聲雜音，視野眺望佳）`);
  }
  if (unitFeatures?.hasRoofBalcony) {
    specialStrengths.push("附設景觀露台（ルーフバルコニー，擁有稀缺私人戶外休憩眺望空間）");
  }
  if (unitFeatures?.hasPrivateGarden) {
    specialStrengths.push("1 樓附設私人專用花園庭院（專用使用權加值，享受獨立戶外綠意）");
  }

  // ── 2. 體質未爆彈與注意事項（劣勢） ──
  if (/大規模修繕.*(?:検討|未定|予定|協議中)/.test(allNotes)) {
    const unitWarning = totalUnits && totalUnits < 25 ? `（本社區僅 ${totalUnits} 戶，戶數少每戶分攤金額更重）` : "";
    specialCautions.push(`大樓記載「大規模修繕工事實施檢討中（詳細未定）」${unitWarning}：管委會正在籌劃大修，建議向仲介調閱最新總會報告書與修繕積立金總額，確認公基金是否充裕，留意未來調漲月修繕費或向住戶徵收「修繕一時金」之可能。`);
  }
  if (/耐震基準不適合|旧耐震|舊耐震/.test(allNotes)) {
    specialCautions.push("為舊耐震基準建物（1981年5月前），需確認耐震診斷結果與銀行融資條件。");
  }
  if (/自主管理/.test(allNotes)) {
    specialCautions.push("大樓記載為「自主管理」（無委託專業物業管理公司）：住戶自行收繳費用與修繕，大樓長期維護品質不確定性高，多數日本主流銀行融資審查嚴格或拒貸，轉手流通性受限。");
  }
  if (/エレベーター無|EV無|無EV|エレベータ無/.test(allNotes)) {
    specialCautions.push("大樓無配置電梯：進出需爬樓梯，對長輩、嬰兒車與搬運重物極為不便，可能明顯壓低未來轉手流動性與租金行情。");
  }
  if (totalUnits && totalUnits > 0 && totalUnits < 20) {
    specialCautions.push(`社區總戶數僅 ${totalUnits} 戶（少於 20 戶之小規模社區）：每戶分攤的外牆拉皮與電梯維修等重大費用沉重，易面臨月修繕金大幅調漲或大修資金缺口。`);
  }
  if (/再建築不可|再建築不能/.test(allNotes)) {
    specialCautions.push("法定再建築不可物件，無法拆除重建，轉手融資受限。");
  }
  if (unitFeatures?.isLeasehold || /借地権|借地|定期借地/.test(allNotes)) {
    const leaseLabel = unitFeatures?.leaseholdType || "借地權";
    specialCautions.push(`屬「${leaseLabel}」（非土地完全所有權）：需每月定期繳納地租、期滿更新或轉售改建需地主承諾書與更新料，銀行貸款成數通常較所有權低 1～2 成。`);
  }
  if (unitFeatures?.facingDirection === "north" || unitFeatures?.facingDirection === "northeast" || unitFeatures?.facingDirection === "northwest") {
    specialCautions.push(`主要採光面朝向（${unitFeatures.facingDirectionZh || "北向"}）：冬季日照時間較短，室內採光受限且濕氣較重，內見時建議確認採光與通風乾燥狀態。`);
  }
  if (floor === 1 && !unitFeatures?.hasPrivateGarden) {
    specialCautions.push("位於 1 樓低樓層：街道行人視線與潮濕防犯考量較多，內見時應確認窗外遮蔽圍籬、防盜設施及日常日照狀況。");
  }

  return { specialStrengths, specialCautions };
}

export type FacingDirection =
  | "south"
  | "southeast"
  | "southwest"
  | "east"
  | "west"
  | "north"
  | "northeast"
  | "northwest";

export interface UnitFeatureEvaluation {
  isCornerUnit: boolean;
  facingDirection: FacingDirection | null;
  facingDirectionZh: string | null;
  hasRoofBalcony: boolean;
  hasPrivateGarden: boolean;
  isLeasehold: boolean;
  leaseholdType?: string | null;
}

/**
 * 從圖紙文字（備考、設備、陽台、土地權利等）辨識不動產査定手冊與東京カンテイ關鍵評價特徵：
 * 1. 角部屋（邊間，三面/雙面採光）
 * 2. 開口部朝向（南向、東南向、西南向 vs 北向）
 * 3. 專用露台（ルーフバルコニー）／私人庭院（専用庭）
 * 4. 土地權利（所有權 vs 借地權／舊法賃借權）
 */
export function detectUnitFeatures(
  textSources: {
    specialNotes?: unknown;
    renovationDetails?: unknown;
    otherConditions?: unknown;
    facilities?: unknown;
    balconyArea?: unknown;
    landRights?: unknown;
    propertyName?: unknown;
    rawText?: unknown;
  }
): UnitFeatureEvaluation {
  const combined = [
    typeof textSources.specialNotes === "string" ? textSources.specialNotes : "",
    typeof textSources.renovationDetails === "string" ? textSources.renovationDetails : "",
    typeof textSources.otherConditions === "string" ? textSources.otherConditions : "",
    typeof textSources.facilities === "string" ? textSources.facilities : "",
    typeof textSources.balconyArea === "string" ? textSources.balconyArea : "",
    typeof textSources.landRights === "string" ? textSources.landRights : "",
    typeof textSources.propertyName === "string" ? textSources.propertyName : "",
    typeof textSources.rawText === "string" ? textSources.rawText : "",
  ].join(" ").normalize("NFKC");

  // 1. 角部屋（邊間）
  const isCornerUnit = /角部屋|角住戸|三面採光|2面採光|二面採光|二方向採光/i.test(combined);

  // 2. 開口部朝向（陽台面向）
  let facingDirection: FacingDirection | null = null;
  let facingDirectionZh: string | null = null;

  if (/南東向き|南東向|東南向き|東南向|南東側/i.test(combined)) {
    facingDirection = "southeast";
    facingDirectionZh = "東南向";
  } else if (/南西向き|南西向|西南向き|西南向|南西側/i.test(combined)) {
    facingDirection = "southwest";
    facingDirectionZh = "西南向";
  } else if (/南向き|南向|南面採光|南面バルコニー|南側バルコニー|バルコニー南/i.test(combined)) {
    facingDirection = "south";
    facingDirectionZh = "南向";
  } else if (/東向き|東向|東面採光|東面バルコニー|東側バルコニー|バルコニー東/i.test(combined)) {
    facingDirection = "east";
    facingDirectionZh = "東向";
  } else if (/西向き|西向|西面採光|西面バルコニー|西側バルコニー|バルコニー西/i.test(combined)) {
    facingDirection = "west";
    facingDirectionZh = "西向";
  } else if (/北東向き|北東向|東北向き|東北向/i.test(combined)) {
    facingDirection = "northeast";
    facingDirectionZh = "東北向";
  } else if (/北西向き|北西向|西北向き|西北向/i.test(combined)) {
    facingDirection = "northwest";
    facingDirectionZh = "西北向";
  } else if (/北向き|北向|北面採光|北面バルコニー|北側バルコニー/i.test(combined)) {
    facingDirection = "north";
    facingDirectionZh = "北向";
  }

  // 3. 專用露台 / 私人庭院
  const hasRoofBalcony = /ルーフバルコニー|ルーバル|roof balcony/i.test(combined);
  const hasPrivateGarden = /専用庭|私人庭院|戶外花園|プライベートガーデン/i.test(combined);

  // 4. 土地權利（借地權 vs 所有權）
  const landRightsText = typeof textSources.landRights === "string" ? textSources.landRights.normalize("NFKC") : "";
  const isExplicitOwnership = /所有権|所有權/.test(landRightsText);
  let isLeasehold = false;
  let leaseholdType: string | null = null;

  if (!isExplicitOwnership && /借地権|旧法賃借権|賃借権|定期借地権|普通借地権|地上権/.test(`${landRightsText} ${combined}`)) {
    isLeasehold = true;
    const match = `${landRightsText} ${combined}`.match(/(旧法賃借権|定期借地権|普通借地権|地上権|賃借権|借地権)/);
    leaseholdType = match ? match[1] : "借地權";
  }

  return {
    isCornerUnit,
    facingDirection,
    facingDirectionZh,
    hasRoofBalcony,
    hasPrivateGarden,
    isLeasehold,
    leaseholdType,
  };
}


