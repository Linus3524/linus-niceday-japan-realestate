/** 共用資訊角色；只定義呈現，不格式化數字、不推斷資料可信度。 */
export const informationStyle = {
  label: "font-sans text-xs font-bold text-[#3F5147]",
  amount: "font-sans text-2xl font-black leading-snug tabular-nums text-[#1A2A22] md:text-3xl",
  detailAmount: "p-2.5 text-right font-bold text-[#1A2A22] whitespace-nowrap tabular-nums",
  note: "font-sans text-xs leading-relaxed text-[#52635A]",
  source: "font-sans text-[11px] leading-relaxed text-[#66736C]",
  sourceBadge: "inline-block whitespace-nowrap border border-[#DDE3DF] bg-white px-2 py-0.5 font-sans text-[11px] font-medium text-[#3F5147]",
  estimateBadge: "inline-block whitespace-nowrap border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-0.5 font-sans text-[11px] font-medium text-[#3F5147]",
  tableHead: "border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]",
  tableBody: "divide-y divide-[#DDE3DF]",
  caution: "border border-[#DCC8A1] bg-[#FFF9ED] p-4 text-xs leading-relaxed",
  cautionTitle: "flex items-center gap-1.5 font-bold text-[#7A5A1F]",
  loading: "flex items-center gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3.5",
} as const;
