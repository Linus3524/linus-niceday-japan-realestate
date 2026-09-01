import { ReactNode, isValidElement } from "react";
import { LucideIcon } from "lucide-react";

interface PageIntroCardProps {
  id?: string;
  /** 左側圖示，可傳入 LucideIcon、ReactNode 或 Material Symbols 名稱字串 */
  icon?: LucideIcon | ReactNode | string;
  /** 主標題 */
  title: ReactNode;
  /** 前言內文段落 */
  children: ReactNode;
  /** 底部資料來源或小字附註 */
  sourceNote?: ReactNode;
  /** 底部快捷操作卡片區塊 */
  actions?: ReactNode;
}

/**
 * 全站各分頁頂部的統一前言導言卡片 (PageIntroCard)
 * 統一標題字級、顏色、深綠品牌色與內文排版層級。
 */
export function PageIntroCard({
  id,
  icon,
  title,
  children,
  sourceNote,
  actions,
}: PageIntroCardProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-5 w-5 text-[#00a174]" />;
    }
    if (typeof icon === "string") {
      return (
        <span className="material-symbols-rounded select-none text-[22px] leading-none text-[#00a174]" aria-hidden="true">
          {icon}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      id={id}
      className="border border-[#DDE3DF] bg-white p-6 md:p-8 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft font-sans"
    >
      {/* 標題列：左側圖示 + 主標題 */}
      <h3 className="border-b border-[#DDE3DF] pb-3.5 mb-4 flex items-center gap-2.5 text-lg md:text-xl font-bold text-[#1A2A22]">
        {icon && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#00a174]" aria-hidden="true">
            {renderIcon()}
          </span>
        )}
        <span>{title}</span>
      </h3>

      {/* 內文區域：統一字級、字色、行高與多段落間距 */}
      <div className="text-xs md:text-[13.5px] leading-relaxed md:leading-7 text-zinc-700 text-justify space-y-3">
        {children}
        {sourceNote && (
          <p className="pt-1 text-[11px] leading-normal text-zinc-400">
            {sourceNote}
          </p>
        )}
      </div>

      {/* 底部快捷操作卡片（若有） */}
      {actions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-[#DDE3DF]">
          {actions}
        </div>
      )}
    </div>
  );
}
