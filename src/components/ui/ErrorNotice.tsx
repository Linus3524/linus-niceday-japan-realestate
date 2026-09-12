import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/** 保留呼叫端的實際錯誤與重試操作，不自行判斷錯誤原因。 */
export function ErrorNotice({ children, action, tone = "error" }: {
  children: ReactNode;
  action?: ReactNode;
  tone?: "error" | "caution";
}) {
  return (
    <div role="status" className={`flex flex-col gap-3 border p-3.5 sm:flex-row sm:items-center sm:justify-between ${tone === "error" ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]" : "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]"}`}>
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-xs leading-relaxed">{children}</p>
      </div>
      {action}
    </div>
  );
}
