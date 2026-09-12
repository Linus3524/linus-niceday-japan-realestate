import { statusBadgeStyle } from "../../lib/ui/statusStyles";

export interface InsightBulletItem {
  id: string;
  iconType: "verdict" | "factor" | "market" | "advice";
  tag: string;
  title?: string;
  text: string;
}

export interface VerdictStatusTheme {
  borderLeft: string;
  badge: string;
  dot: string;
  dataBg: string;
  medianBadge: string;
  tagStyle: string;
}

export const STATUS_STYLE: Record<string, VerdictStatusTheme> = {
  "合理": {
    borderLeft: "border-l-[#007D5A]",
    badge: statusBadgeStyle.positive,
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: statusBadgeStyle.positive,
  },
  "超值": {
    borderLeft: "border-l-[#007D5A]",
    badge: statusBadgeStyle.positive,
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: statusBadgeStyle.positive,
  },
  "條件反映": {
    borderLeft: "border-l-[#D97706]",
    badge: statusBadgeStyle.caution,
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: statusBadgeStyle.caution,
  },
  "需調整": {
    borderLeft: "border-l-[#D97706]",
    badge: statusBadgeStyle.caution,
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: statusBadgeStyle.caution,
  },
  "偏高": {
    borderLeft: "border-l-[#B13818]",
    badge: statusBadgeStyle.negative,
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: statusBadgeStyle.negative,
  },
  "明顯偏高": {
    borderLeft: "border-l-[#B13818]",
    badge: statusBadgeStyle.negative,
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: statusBadgeStyle.negative,
  },
  "符合": {
    borderLeft: "border-l-[#007D5A]",
    badge: statusBadgeStyle.positive,
    dot: "bg-[#007D5A]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#9EE2CF] bg-white text-[#007D5A]",
    tagStyle: statusBadgeStyle.positive,
  },
  "部分符合": {
    borderLeft: "border-l-[#D97706]",
    badge: statusBadgeStyle.caution,
    dot: "bg-[#D97706]",
    dataBg: "bg-[#FFFDF5]",
    medianBadge: "border-[#EAB879] bg-white text-[#D97706]",
    tagStyle: statusBadgeStyle.caution,
  },
  "難度高": {
    borderLeft: "border-l-[#B13818]",
    badge: statusBadgeStyle.negative,
    dot: "bg-[#B13818]",
    dataBg: "bg-[#FFF8F6]",
    medianBadge: "border-[#E94E2B] bg-white text-[#B13818]",
    tagStyle: statusBadgeStyle.negative,
  },
  // getStatusStyle 的 fallback 指向這一鍵，但它原本並不存在，
  // 於是任何沒收錄的 verdict.status 都會讓 style 變成 undefined，
  // 後面讀 style.badge 直接丟 TypeError、整個圖紙分析被 ErrorBoundary 接走。
  "待確認": {
    borderLeft: "border-l-[#8A9590]",
    badge: statusBadgeStyle.pending,
    dot: "bg-[#8A9590]",
    dataBg: "bg-[#F5F8F6]",
    medianBadge: "border-[#DDE3DF] bg-white text-[#3F5147]",
    tagStyle: statusBadgeStyle.pending,
  },
};

export const getStatusStyle = (status?: string | null): VerdictStatusTheme => {
  if (!status) return STATUS_STYLE["待確認"];
  return STATUS_STYLE[status] || STATUS_STYLE["待確認"];
};
