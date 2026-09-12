import type { ReactNode } from "react";
import { informationStyle } from "../../lib/ui/informationStyles";

/** 只標記資料依據，不代表評估程度或資料已通過驗證。 */
export function SourceBadge({ children, estimated = false }: { children: ReactNode; estimated?: boolean }) {
  return <span className={estimated ? informationStyle.estimateBadge : informationStyle.sourceBadge}>{children}</span>;
}
