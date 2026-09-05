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
  if (/^(?:0|0円|-|ー|―)$/.test(cleaned)) return true;
  return /(?:無償|無料|不要|なし|無し|免除)/i.test(cleaned);
}

/**
 * 格式化敷引標示：
 * 若圖紙寫 "1"、"1ヶ月"、"敷引1ヶ月"、"解約時敷金償却 1ヶ月"、"100%"，轉為清晰的中文說明。
 */
export function formatShikibiki(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = toHalfWidth(raw).trim();
  if (!cleaned || isFreeOrZero(cleaned)) return "";
  if (cleaned === "1") return "敷引 1 個月（退租直接扣除、不予退還）";

  const shokyakuMatch = cleaned.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?)\s*(?:ヶ月|ヵ月|カ月|個月)?/);
  if (shokyakuMatch) {
    return `敷引／償却 ${shokyakuMatch[1]} 個月（退租直接扣除、不予退還）`;
  }

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
  const aboveGround = floorRaw.match(/(\d+)\s*階/);
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

  // 收納空間標記不影響房間數分桶，先拿掉再比對核心格局：
  // +S／+N（納戸）、+WIC（步入式衣帽間）、+SIC（玄關收納），
  // 以及夾在中間的 S（"1SLDK" 就是 1LDK 附納戸，實測真實販売図面很常這樣寫）。
  const cleaned = toHalfWidth(text)
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\+(?:WIC|SIC|N|S)$/i, "")
    .replace(/\+?S$/i, "")
    .replace(/^S/i, "")
    .replace(/S(?=(?:LDK|DK|K)$)/i, "");

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

/**
 * 解析買賣售價（例如 "7,299万円"、"3,450万"、"6300万円"、"5,488"）
 */
export function parseSalePrice(text: unknown): number | null {
  if (typeof text !== "string") return null;
  return parseYenAmount(text);
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
}) {
  const { monthlyRepairCostYen, areaSqm, totalUnits, ageYears } = params;

  // 1. 每平米月提撥金額（國交省指引標準通常建議 200 ~ 300 円/㎡/月）
  const reservePerSqm = areaSqm && areaSqm > 0 ? Math.round(monthlyRepairCostYen / areaSqm) : null;

  let reserveHealthLevel: "inadequate" | "healthy" | "heavy" = "healthy";
  let reserveHealthText = "提撥適中";
  let reserveHealthNote = "符合日本國土交通省修繕積立金指引標準（約 200～300 円/㎡/月）。";

  if (reservePerSqm !== null) {
    if (reservePerSqm < 160) {
      reserveHealthLevel = "inadequate";
      reserveHealthText = "提撥偏低";
      reserveHealthNote = (ageYears && ageYears > 15)
        ? `每平米僅提撥約 ¥${reservePerSqm.toLocaleString()}/㎡/月。屋齡已超過 15 年，需留意大樓修繕儲備金是否不足，未來可能有調漲或徵收一次性修繕一時金的風險。`
        : `每平米提撥約 ¥${reservePerSqm.toLocaleString()}/㎡/月，初期費率較低，依長期修繕計畫未來 10 年通常會逐步階梯式調升。`;
    } else if (reservePerSqm > 320) {
      reserveHealthLevel = "heavy";
      reserveHealthText = "提撥充裕（負擔較重）";
      reserveHealthNote = `每平米提撥達 ¥${reservePerSqm.toLocaleString()}/㎡/月，管委會提撥積極充足、財務體質穩健，但每月固定持有成本較顯著。`;
    }
  }

  // 2. 戶數規模風險判定
  let scaleRiskLevel: "high_risk" | "medium" | "safe" = "safe";
  let scaleRiskText = "中大型社區";
  let scaleRiskNote = "戶數具規模經濟，公共設施維護與大規模修繕每戶分攤平準。";

  if (totalUnits !== null) {
    if (totalUnits < 20) {
      scaleRiskLevel = "high_risk";
      scaleRiskText = "極小規模社區（<20戶）";
      scaleRiskNote = "⚠️ 總戶數少於 20 戶，每戶分攤電梯保養、外牆清洗與屋頂防水等固定成本壓力較大，管委會運作與欠繳風險需特別留意。";
    } else if (totalUnits < 50) {
      scaleRiskLevel = "medium";
      scaleRiskText = "中小規模社區（20-49戶）";
      scaleRiskNote = "戶數適中，管委會溝通通常較有效率，建議確認是否有正式長期修繕計劃書。";
    }
  }

  return {
    reservePerSqm,
    reserveHealthLevel,
    reserveHealthText,
    reserveHealthNote,
    scaleRiskLevel,
    scaleRiskText,
    scaleRiskNote,
  };
}

/**
 * 買方初期費用（諸費用）估算
 */
export function calculateSaleInitialCosts(salePriceYen: number) {
  // 1. 仲介手續費（法定上限：總價 3% + 6萬 + 10% 消費稅）
  const brokerageFee = Math.round((salePriceYen * 0.03 + 60000) * 1.1);

  // 2. 登記免許稅 & 司法書士手續費（所有權移轉、抵當權設定等，約總價 1.5% ~ 2.0%）
  const registrationAndScrivenerFee = Math.round(salePriceYen * 0.018);

  // 3. 印紙代（契約書印花稅）
  let stampDuty = 10000;
  if (salePriceYen > 50000000) stampDuty = 30000;
  else if (salePriceYen > 10000000) stampDuty = 10000;
  else stampDuty = 5000;

  // 4. 火災地震保險（概算 10年期）
  const insuranceFee = 200000;

  // 5. 固定資產稅・都市計畫稅日割精算 & 取得稅備用（約總價 0.5% ~ 1.0%）
  const taxesProrated = Math.round(salePriceYen * 0.008);

  const total = brokerageFee + registrationAndScrivenerFee + stampDuty + insuranceFee + taxesProrated;
  const percentageOfPrice = Math.round((total / salePriceYen) * 1000) / 10;

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
        note: "土地與建物所有權移轉登記、抵當權設定及司法書士代辦費（約 1.8%）",
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
        note: "長期火災防護保費（依構造、坪數與投保年期調整）",
      },
      {
        id: "taxes",
        name: "固定資產稅日割清算與取得稅預備",
        amount: taxesProrated,
        note: "交屋日按日計算公租公課日割金，及後續不動產取得稅預備金（約 0.8%）",
      },
    ],
  };
}

export function parseAgeYears(ageStr?: string | null): number | null {
  if (!ageStr) return null;
  const currentYear = new Date().getFullYear();

  // 1. Explicit 築X年, e.g. "築4年", "築15年"
  const mChiku = ageStr.match(/築\s*(\d+)\s*年/);
  if (mChiku) return Number(mChiku[1]);

  // 2. 4-digit year, e.g. "2022年", "2018/05", "1998年"
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

  // 4. Fallback plain number
  const mAny = ageStr.match(/(\d+)\s*年/);
  if (mAny) {
    const val = Number(mAny[1]);
    if (val >= 1900) return Math.max(0, currentYear - val);
    return val;
  }

  return null;
}
