import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

/** 沿用原本的線條式燈泡；顏色由共用提醒樣式決定。 */
export function AdviceBulbIcon({ className }: { className?: string }) {
  return <Lightbulb className={className} strokeWidth={2} aria-hidden="true" focusable="false" />;
}

/** 一般實務建議專用；錯誤、風險警告與試算結果不套用此配色。 */
export function AdviceNote({ children, title = "Linus 實務提醒", className = "", compact = false }: {
  children: ReactNode;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  return <aside role="note" className={`advice-note${compact ? " advice-note--compact" : ""}${className ? ` ${className}` : ""}`}>
    <span className="advice-note-icon"><AdviceBulbIcon /></span>
    <div className="advice-note-content"><strong className="advice-note-title">{title}</strong><div className="advice-note-body">{children}</div></div>
  </aside>;
}
