import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export type NoticeTone = "error" | "caution" | "notice" | "info" | "positive";

const NOTICE_TONE_STYLES: Record<NoticeTone, string> = {
  error: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B13818]",
  caution: "border-[#FDBA74] bg-[#FFF7ED] text-[#D97706]",
  notice: "border-[#FDE047] bg-[#FEF9C3] text-[#854D0E]",
  info: "border-[#7DD3FC] bg-[#E0F2FE] text-[#0284C7]",
  positive: "border-[#9EE2CF] bg-[#E6F6F1] text-[#00A174]",
};

/** 保留呼叫端的實際錯誤與重試操作，不自行判斷錯誤原因。 */
export function ErrorNotice({ children, action, tone = "error" }: {
  children: ReactNode;
  action?: ReactNode;
  tone?: NoticeTone;
}) {
  return (
    <div role="status" className={`flex flex-col gap-3 border p-3.5 sm:flex-row sm:items-center sm:justify-between ${NOTICE_TONE_STYLES[tone] || NOTICE_TONE_STYLES.error}`}>
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-xs leading-relaxed">{children}</p>
      </div>
      {action}
    </div>
  );
}

