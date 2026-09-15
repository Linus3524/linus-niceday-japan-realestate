import { parseYenAmount } from "./listingExtraction.js";

/** AI 結構化輸出的租賃條件項目（Phase 2）。 */
export interface RentalConditionItem {
  category: "lease" | "moveIn" | "pet" | "guarantee" | "fees" | "moveOut" | "optional";
  ja: string;
  zh: string;
}

/** AI 結構化輸出的備考特約項目（Phase 3）。 */
export interface SpecialNoteItem {
  category: "契約特約" | "費用約定" | "生活規範" | "使用限制" | "入住條件" | "設施設備" | "買賣特約" | "其他備考";
  title: string;
  ja: string;
  zh: string;
  tone?: "amber" | "emerald" | "blue" | "neutral";
}

export interface RentalConditionFields {
  rentalConditions?: string;
  /** AI 結構化的租賃條件（分類＋翻譯完成），有值時優先於 regex 管線。 */
  rentalConditionItems?: RentalConditionItem[];
  specialNotes?: string;
  /** AI 結構化的備考特約（分類＋翻譯完成），有值時優先於 regex 管線。 */
  specialNoteItems?: SpecialNoteItem[];
  supportFee?: string;
  guaranteeFee?: string;
  optionalFacilities?: string;
}

/** 僅加計明載且屬簽約一次性的費用；不把年費、停車或養寵條件混入。 */
export function additionalRentalFees(text?: string) {
  const raw = (text || "").normalize("NFKC");
  const definitions = [
    { id: "antibacterialFee", name: "室內抗菌處理費", pattern: /(?:室内抗菌処理代|室內抗菌處理(?:費|代)|抗菌処理代)\s*[:：]?\s*([\d,]+(?:\.\d+)?\s*(?:万円|円|日圓))/ },
    { id: "disinfectionFee", name: "室內消毒費", pattern: /(?:消毒代|室內消毒(?:費|代))\s*[:：]?\s*([\d,]+(?:\.\d+)?\s*(?:万円|円|日圓))/ },
    // 前面允許任何非文字符號（◎★・、等），只擋「更新事務手数料」這種前綴黏著的字。
    { id: "administrationFee", name: "簽約事務手續費", pattern: /(?:^|[^\p{L}\p{N}]|契約時?)(?:事務手数料|事務手續費|簽約事務費)\s*[:：]?\s*([\d,]+(?:\.\d+)?\s*(?:万円|円|日圓))/u },
  ];
  return definitions.flatMap(({ id, name, pattern }) => {
    const match = raw.match(pattern);
    if (match) {
      const prefix = raw.slice(0, match.index).split(/[。；;、\n]/).pop() || "";
      const suffix = raw.slice((match.index || 0) + match[0].length);
      if (/更新|退去|解約|任意|希望/.test(prefix) || /^\s*(?:[/／]\s*(?:月|年)|(?:毎月|毎年))/.test(suffix)) return [];
    }
    const amount = parseYenAmount(match?.[1]?.replace(/日圓/g, "円"));
    // 註記只留條文本身：pattern 為了定界會把前面的「、」「◎」一起吃進 match[0]，全部剝掉。
    return amount ? [{ id, name, amount, isFromFlyer: true, note: `圖紙標示：${match![0].trim().replace(/^[^\p{L}\p{N}]+/u, "")}` }] : [];
  });
}

export function rentalConditionText(fields: RentalConditionFields) {
  return [fields.rentalConditions, fields.specialNotes, fields.supportFee, fields.guaranteeFee, fields.optionalFacilities].filter(Boolean).join("\n");
}
