// 小型選項（設備、審查方式等）：選中用極淡綠底＋品牌綠框與字，不用實心綠塊與陰影；
// 依 UI 用色規則，小按鈕不套半漸層。
export const guidedChoiceClass = (selected: boolean) =>
  `inline-flex items-center justify-center border px-3 py-2 font-serif text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] focus-visible:ring-offset-2 ${selected
    ? "border-[#00A174] bg-[#F0FAF6] text-[#00A174]"
    : "border-[#DDE3DF] bg-white text-[#3F5147] hover:bg-[#F5F8F6]"
  }`;

export const guidedSelectChevronClass =
  "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3F5147] peer-disabled:text-[#8A9590]";
