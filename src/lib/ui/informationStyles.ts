/** 共用資訊角色；只定義呈現，不格式化數字、不推斷資料可信度。 */
export const informationStyle = {
  label: "font-sans text-xs font-bold text-[#3F5147]",
  amount: "font-sans text-2xl font-black leading-snug tabular-nums text-[#1A2A22] md:text-3xl",
  detailAmount: "p-2.5 text-right font-bold text-[#1A2A22] whitespace-nowrap tabular-nums",
  note: "font-sans text-xs leading-relaxed text-[#3F5147]",
  source: "font-sans text-[11px] leading-relaxed text-[#66736C]",
  sourceBadge: "inline-block whitespace-nowrap border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 font-sans text-[11px] font-medium text-[#1A2A22]",
  estimateBadge: "inline-block whitespace-nowrap border border-[#00A174] bg-[#00A174] px-2 py-0.5 font-sans text-[11px] font-medium text-white",
  tableHead: "border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]",
  tableBody: "divide-y divide-[#DDE3DF]",
  /* 提醒（黃）：需要留意但不影響判讀的補充說明。
     底／框／字必須同屬黃色系，否則會出現「橘底配紅字」這種跨色系的髒配色。 */
  notice: "border border-[#FDE047] bg-[#FEF9C3] p-4 text-xs leading-relaxed text-[#854D0E]",
  noticeTitle: "flex items-center gap-1.5 font-bold text-[#854D0E]",
  /* 注意（黃）：與 notice 同色階，語意上更強調「請先確認」。
     原本缺文字色而繼承外層紅棕字，已補上 #854D0E 收斂為單一色系。 */
  caution: "border border-[#FDE047] bg-[#FEF9C3] p-4 text-xs leading-relaxed text-[#854D0E]",
  cautionTitle: "flex items-center gap-1.5 font-bold text-[#854D0E]",
  /* 警示（紅）：資料有誤或會造成損失，才升到紅色。 */
  alert: "border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-xs leading-relaxed text-[#B13818]",
  alertTitle: "flex items-center gap-1.5 font-bold text-[#B13818]",
  loading: "flex items-center gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3.5",
} as const;
