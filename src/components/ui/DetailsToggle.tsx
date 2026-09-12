import { ChevronDown, ChevronUp } from "lucide-react";

interface DetailsToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

/** 費用明細開合操作；狀態由各領域元件持有。 */
export function DetailsToggle({ expanded, onToggle }: DetailsToggleProps) {
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="flex min-h-11 w-28 shrink-0 cursor-pointer self-start items-center justify-center gap-1.5 whitespace-nowrap border border-[#007D5A] bg-white px-4 py-2 font-sans text-xs font-bold text-[#007D5A] transition-colors hover:bg-[#E6F6F1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007D5A] sm:self-center"
    >
      <span>{expanded ? "收合明細" : "展開明細"}</span>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
