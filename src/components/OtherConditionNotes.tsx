import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { parseAndExplainSpecialNotes } from "../lib/specialNotesParser";

const semanticRules = [
  /抗菌/u,
  /自行車|駐輪/u,
  /機車|バイク/u,
  /寵物|ペット|小型犬|猫/u,
  /清潔|清掃/u,
  /押金|敷金/u,
  /續約|更新/u,
  /保證|保証/u,
  /保險|保険/u,
  /換鎖|鍵交換/u,
  /24\s*小時|24時間|生活支援|安心サポート/u,
];

function semanticKeys(text: string) {
  return semanticRules.flatMap((rule, index) => rule.test(text) ? [index] : []);
}

export function OtherConditionNotes({
  notes,
  coveredConditions,
}: {
  notes?: string | null;
  coveredConditions?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const coveredKeys = new Set(semanticKeys(coveredConditions || ""));
  const items = parseAndExplainSpecialNotes(notes).filter((item) => {
    const text = `${item.title} ${item.explanation} ${item.rawJapanese || ""}`;
    const keys = semanticKeys(text);
    return keys.length === 0 || keys.some((key) => !coveredKeys.has(key));
  });

  if (items.length === 0) return null;

  return (
    <section aria-label="其他條件・生活規範與備考事項" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-[#007D5A]" strokeWidth={1.8} />
          <h4 className="font-sans text-xs font-bold text-[#1A2A22] [font-family:var(--font-sans)]">其他條件・生活規範與備考事項</h4>
          <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-0.5 text-[10px] font-bold text-[#66736C]">
            共 {items.length} 項條款
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#007D5A] hover:text-[#00A174]"
          aria-expanded={expanded}
        >
          <span>{expanded ? "收合條款解析" : "展開條款解析"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article key={`${item.category}-${item.title}`} className="h-full border border-[#DDE3DF] bg-[#F5F8F6] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-[#BFCAC4] bg-white px-2 py-0.5 text-[10px] font-bold text-[#55635B]">
                  {item.category}
                </span>
                <h5 className="text-xs font-bold text-[#1A2A22]">{item.title}</h5>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#3F5147]">{item.explanation}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
