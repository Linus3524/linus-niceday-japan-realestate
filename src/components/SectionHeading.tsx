import { ChevronDown, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SectionHeadingProps {
  /** 左側圖示，統一使用 lucide 圖示、統一尺寸與品牌綠 */
  icon: LucideIcon;
  title: ReactNode;
  /** 副標。對齊圖示左緣，不縮排 */
  description?: ReactNode;
  /** 右側控制項（例如流程切換鈕）。有值時在桌機版與標題同列右對齊 */
  action?: ReactNode;
  /** 給可摺疊區塊用：有傳 onToggle 時，標題整塊變成可點擊的開合按鈕 */
  open?: boolean;
  onToggle?: () => void;
}

/**
 * 區塊標題（圖示 ＋ 標題 ＋ 副標 ＋ 分隔線）。
 *
 * 這幾個區塊原本各寫各的：圖示有的置中有的置頂、副標間距 mt-0.5 / mt-1 / mt-2 都有、
 * 縮排有的 pl-7 有的貼齊圖示、分隔線六個區塊只有兩個有。
 * 統一收斂到這個元件，之後新增區塊直接用它，不要再手刻。
 */
export function SectionHeading({ icon: Icon, title, description, action, open, onToggle }: SectionHeadingProps) {
  const collapsible = typeof onToggle === "function";
  const collapsed = collapsible && open === false;

  const heading = (
    <>
      <h3 className="flex items-start gap-2 text-xl font-bold leading-snug text-[#1A2A22]">
        {/* 外框高度＝標題第一行的行高（1.375em ＝ text-xl × leading-snug），
            再把圖示垂直置中，圖示就會對齊第一行的視覺中線。
            標題折成兩行時，因為只吃第一行的高度，圖示仍留在第一行不會跟著往下跑。 */}
        <span className="flex h-[1.375em] w-5 shrink-0 items-center justify-center">
          <Icon className="h-5 w-5 text-[#00a174]" />
        </span>
        <span>{title}</span>
      </h3>
      {description && (
        <p className="mt-1.5 font-sans text-xs leading-6 text-zinc-500">
          {description}
        </p>
      )}
    </>
  );

  return (
    <div
      className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
        // 收合時不留分隔線與下方間距，卡片才不會只剩標題卻還有一大塊白
        collapsed ? "" : "mb-3 border-b border-[#DDE3DF] pb-3"
      }`}
    >
      {/* 標題本身不可點：閱讀時常會點到（或選取文字），整塊當按鈕很容易誤觸收合。
          開合只交給右邊的箭頭按鈕。 */}
      <div className="min-w-0 flex-1">{heading}</div>

      {/* 右側控制項與開合箭頭放在同一組，箭頭永遠在整列最右邊，
          不會卡在標題與切換鈕之間。收合時不顯示控制項（點不到內容卻看得到切換鈕很怪）。 */}
      {(action || collapsible) && (
        <div className="flex shrink-0 items-center gap-3 self-end md:self-auto">
          {action && !collapsed && action}
          {collapsible && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-label={open ? "收合這個區塊" : "展開這個區塊"}
              className="-m-1 cursor-pointer p-2 text-[#00a174] transition-colors hover:text-[#007d5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a174]"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
