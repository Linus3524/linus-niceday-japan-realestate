/** 需求條件分類色票；評估程度使用 ui/statusStyles，避免分類與風險混用。
 * 全站標籤嚴格遵守「紅・橙・黃・綠・藍」5 音光譜規範：
 * - 格局與預算：黃色 (Sunny Yellow)
 * - 設備與規格：綠色 (Emerald Green)
 * - 地點與交通：藍色 (Sky Blue)
 * - 特殊條件：橘色 (Amber Orange)
 * 不在條件標籤中使用紫色與粉色。
 */
export const criteriaTagStyle = {
  layout: "border-[#FDE047] bg-[#FEF9C3] text-[#854D0E]",
  equipment: "border-[#86EFAC] bg-[#DCFCE7] text-[#166534]",
  transport: "border-[#7DD3FC] bg-[#E0F2FE] text-[#0284C7]",
  special: "border-[#FDBA74] bg-[#FFF7ED] text-[#D97706]",
  budget: "border-[#FDE047] bg-[#FEF9C3] text-[#854D0E]"
} as const;


