import { parseYenAmount } from "./listingExtraction.js";

export interface RentalConditionFields {
  rentalConditions?: string;
  specialNotes?: string;
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
    { id: "administrationFee", name: "簽約事務手續費", pattern: /(?:^|[。；;、,\s])(?:事務手数料|事務手續費|簽約事務費)\s*[:：]?\s*([\d,]+(?:\.\d+)?\s*(?:万円|円|日圓))/ },
  ];
  return definitions.flatMap(({ id, name, pattern }) => {
    const match = raw.match(pattern);
    if (match) {
      const prefix = raw.slice(0, match.index).split(/[。；;、\n]/).pop() || "";
      const suffix = raw.slice((match.index || 0) + match[0].length);
      if (/更新|退去|解約|任意|希望/.test(prefix) || /^\s*(?:[/／]\s*(?:月|年)|(?:毎月|毎年))/.test(suffix)) return [];
    }
    const amount = parseYenAmount(match?.[1]?.replace(/日圓/g, "円"));
    return amount ? [{ id, name, amount, isFromFlyer: true, note: `圖紙標示：${match![0].trim()}` }] : [];
  });
}

export function rentalConditionText(fields: RentalConditionFields) {
  return [fields.rentalConditions, fields.specialNotes, fields.supportFee, fields.guaranteeFee, fields.optionalFacilities].filter(Boolean).join("\n");
}
