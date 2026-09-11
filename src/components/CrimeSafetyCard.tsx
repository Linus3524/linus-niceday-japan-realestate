import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { CrimeSafetyResult, CrimeBreakdownItem, SafetyGrade } from "../lib/crimeSafety";

interface CrimeSafetyCardProps {
  crime: CrimeSafetyResult;
}

const GRADE_CONFIG: Record<SafetyGrade, { bg: string; text: string; border: string; label: string }> = {
  "A+": { bg: "#E6F6F1", text: "#007D5A", border: "#9ee2cf", label: "極安全" },
  A:    { bg: "#E6F6F1", text: "#007D5A", border: "#9ee2cf", label: "安全" },
  "B+": { bg: "#EBF5FF", text: "#1E65B8", border: "#B9DCFF", label: "良好" },
  B:    { bg: "#FFF4E5", text: "#B76E00", border: "#FFD599", label: "普通" },
  C:    { bg: "#FDE8E8", text: "#C81E1E", border: "#F8B4B4", label: "留意" },
  D:    { bg: "#FDE8E8", text: "#9B1C1C", border: "#F8B4B4", label: "注意" },
};

const GROUP_LABELS: Record<CrimeBreakdownItem["group"], string> = {
  residential: "住宅安全相關",
  street: "街區人身安全",
  property: "財產類犯罪",
  other: "其他",
};

function GradeBadge({ grade, label }: { grade: SafetyGrade; label: string }) {
  const config = GRADE_CONFIG[grade];
  return (
    <div
      className="flex items-center gap-2 border px-3 py-2"
      style={{ backgroundColor: config.bg, borderColor: config.border }}
    >
      <span className="text-xs font-bold" style={{ color: config.text }}>
        {label}
      </span>
      <span className="text-lg font-black leading-none" style={{ color: config.text }}>
        {grade}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: config.text, opacity: 0.7 }}>
        {config.label}
      </span>
    </div>
  );
}

export function CrimeSafetyCard({ crime }: CrimeSafetyCardProps) {
  const [expanded, setExpanded] = useState(false);

  const groups: CrimeBreakdownItem["group"][] = ["residential", "street", "property", "other"];
  const groupTotal = (g: CrimeBreakdownItem["group"]) =>
    crime.breakdown.filter(b => b.group === g).reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="border border-[#DDE3DF] bg-white p-4 space-y-3">
      {/* 標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#007D5A]" />
          <span className="text-xs font-bold text-[#007D5A]">周邊治安資料</span>
          <span className="text-[10px] text-[#66736C]">
            {crime.chocho}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-[#8A9590]">
          犯罪認知件數合計 {crime.totalCrimes} 件
        </span>
      </div>

      {/* 等級膠囊 */}
      <div className="flex flex-wrap gap-2">
        <GradeBadge grade={crime.residentialGrade} label="住宅治安" />
        <GradeBadge grade={crime.streetGrade} label="街區環境" />
      </div>

      {/* 一句話摘要 */}
      <div className="border-l-2 border-[#007D5A] bg-[#F5F8F6] px-3 py-2">
        <p className="text-xs leading-relaxed text-[#3F5147]">
          {crime.summary}
        </p>
      </div>

      {/* 犯罪種類拆解（可展開收合） */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border border-[#DDE3DF] bg-[#FAFCFB] px-3 py-2 text-xs font-bold text-[#3F5147] transition-colors hover:bg-[#F2F5F3]"
      >
        <span>犯罪種類明細</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-3">
          <p className="text-[10px] leading-relaxed text-[#8A9590]">
            以下明細各項相加即為上方「犯罪認知件數合計 {crime.totalCrimes} 件」，數字為該町丁目的月累計值。
          </p>
          {groups.map(groupKey => {
            const items = crime.breakdown.filter(b => b.group === groupKey);
            if (items.length === 0) return null;
            const allZero = items.every(i => i.count === 0);
            return (
              <div key={groupKey}>
                <div className="mb-1 flex items-baseline justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#66736C]">
                    {GROUP_LABELS[groupKey]}
                  </p>
                  <p className="text-[10px] font-bold tabular-nums text-[#66736C]">
                    小計 {groupTotal(groupKey)} 件
                  </p>
                </div>
                <div className="border border-[#DDE3DF]">
                  {items.map((item, idx) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-3 py-1.5 ${
                        idx < items.length - 1 ? "border-b border-[#DDE3DF]" : ""
                      } ${item.count > 0 ? "bg-white" : "bg-[#FAFCFB]"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <span className={`text-xs ${item.count > 0 ? "font-bold text-[#1A2A22]" : "text-[#8A9590]"}`}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          item.count === 0
                            ? "text-[#8A9590]"
                            : groupKey === "residential" || groupKey === "street"
                              ? item.count >= 3
                                ? "text-[#C81E1E]"
                                : item.count >= 1
                                  ? "text-[#B76E00]"
                                  : "text-[#007D5A]"
                              : "text-[#1A2A22]"
                        }`}
                      >
                        {item.count} 件
                      </span>
                    </div>
                  ))}
                </div>
                {groupKey === "residential" && allZero && (
                  <p className="mt-1 text-[10px] text-[#007D5A]">
                    ✓ 此町丁目未見住宅侵入竊盜紀錄
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 資料來源（CC BY 義務） */}
      <p className="text-[10px] leading-relaxed text-[#8A9590]">
        {crime.credit}
      </p>
    </div>
  );
}
