import type { ReactNode } from "react";

/** 費用摘要的共用版型；標籤、金額格式、假設與操作由領域元件提供。 */
export function CostSummary({ children, action }: { children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 border border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}
