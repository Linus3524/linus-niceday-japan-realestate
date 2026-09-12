import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { informationStyle } from "../../lib/ui/informationStyles";

export function LoadingNotice({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div role="status" className={informationStyle.loading}>
      <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[#007D5A]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#1A2A22]">{children}</p>
        {description && <p className={`mt-0.5 ${informationStyle.source}`}>{description}</p>}
      </div>
    </div>
  );
}
