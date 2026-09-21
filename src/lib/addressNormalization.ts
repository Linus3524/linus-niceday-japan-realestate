import { toJapanesePlaceName } from "./transit.js";

/**
 * 將日文漢字數字（一～九十九、百）轉換為阿拉伯數字。
 * 專為地址中的「丁目」、「番地」、「番」、「号」前後的計數設計。
 */
export function kanjiToNumber(str: string): number {
  const digits: Record<string, number> = {
    "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3,
    "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
  };
  if (!str) return NaN;
  // 若本身已全為阿拉伯數字
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  // 純位值漢字數字（如「三二」-> 32）
  if (/^[〇零一二三四五六七八九]+$/.test(str)) {
    return parseInt([...str].map(c => digits[c] ?? "").join(""), 10);
  }
  // 含十、百的漢字計數（如「三十二」-> 32, 「十二」-> 12, 「百」-> 100）
  let res = 0;
  let cur = 0;
  for (const c of str) {
    if (digits[c] !== undefined) {
      cur = digits[c];
    } else if (c === "十") {
      res += (cur === 0 ? 1 : cur) * 10;
      cur = 0;
    } else if (c === "百") {
      res += (cur === 0 ? 1 : cur) * 100;
      cur = 0;
    }
  }
  res += cur;
  return res;
}

/**
 * 判斷地址字串是否包含丁目、番地或連字號後的完整門牌號碼（避免停留在區域級/街區級）。
 */
export function hasFullStreetNumber(value: string): boolean {
  return /(?:丁目[0-9０-９一二三四五六七八九十]+(?:番地?|[-‐‑‒–—―ー－−]))|[0-9０-９]+[-‐‑‒–—―ー－−][0-9０-９]+|[0-9０-９一二三四五六七八九十]+番地?[0-9０-９一二三四五六七八九十]+号?/.test(value);
}

/**
 * 日本地址寬容正規化管線（Address Normalization Pipeline）：
 * 1. Unicode NFKC 正規化：全形數字（０-９）轉半形、全形英數轉半形、全形空格轉半形。
 * 2. 異體字與繁簡轉換：如「區」->「区」、「縣」->「県」、「澀」->「渋」、「號」->「号」、「⻑」->「長」。
 * 3. 連接號統整：全形減號（－）、日文長音符（ー）、破折號（―、—）、數學減號（−）、波浪號（~、〜）統一為半形減號（-）。
 * 4. 中文連字號相容：數字間的「之」、「の」（如「32之2」）轉為標準減號「32-2」。
 * 5. 番地連號相容：「32番地之2」、「32番地2」統一轉為「32-2」或保留「32番地2号」。
 * 6. 漢字數字轉換：僅轉換「丁目」、「番地」、「番」、「号」關鍵詞前後的漢字數字（如「三丁目」->「3丁目」），
 *    嚴格保護「三軒茶屋」、「四ツ谷」、「八丁堀」、「六本木」等專有地名不被誤轉。
 * 7. 格式清理：移除開頭郵遞區號（〒123-4567）、折疊重複連字號與空白。
 */
export function normalizeJapaneseAddress(raw: string): string {
  if (!raw) return "";

  // 1. Unicode NFKC 正規化
  let s = raw.normalize("NFKC").trim();

  // 2. 移除開頭郵遞區號
  s = s.replace(/^〒?\s*\d{3}\s*[-‐‑‒–—―ー－~〜]?\s*\d{4}\s*/, "");

  // 3. 繁體/中文常用字轉日文當用漢字（保護地名定位）
  s = toJapanesePlaceName(s)
    .replace(/區/g, "区")
    .replace(/縣/g, "県")
    .replace(/號/g, "号")
    .replace(/樓/g, "階")
    .replace(/臺/g, "台");

  // 4. 連接號、破折號、長音符、波浪號統整為半形減號
  s = s.replace(/[\u2212\uFF0D\u30FC\u2010-\u2015\uFE63~〜]/gu, "-");

  // 5. 中文「之」或日文「の」在數字之間視為連字號：例如「32之2」->「32-2」
  s = s.replace(/(\d+)\s*[之の]\s*(\d+)/gu, "$1-$2");

  // 6. 「番地之」、「番地の」接數字：例如「32番地之2」->「32-2」
  s = s.replace(/(\d+)\s*番地?\s*[之の-]\s*(\d+)/gu, "$1-$2");

  // 7. 漢字數字轉阿拉伯數字（僅針對丁目、番地、番、号的前綴，不影響三軒茶屋、四谷等固有地名）
  s = s.replace(/([〇零一二三四五六七八九十百]+)\s*(丁目|番地?|号)/gu, (match, k, unit) => {
    const num = kanjiToNumber(k);
    return isNaN(num) ? match : `${num}${unit}`;
  });

  // 8. 規範化連字號周邊空格與連續連字號
  s = s.replace(/\s*-\s*/g, "-").replace(/-+/g, "-").replace(/\s+/g, " ").trim();

  return s;
}
