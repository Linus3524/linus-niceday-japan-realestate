/** 評估程度與資料狀態共用色票；領域判斷與標籤由呼叫者保留。 */
export const statusBadgeStyle = {
  positive: "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]",
  caution: "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  negative: "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  pending: "border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]",
} as const;
