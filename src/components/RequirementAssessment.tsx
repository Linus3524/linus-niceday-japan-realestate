import { AlertTriangle, CheckCircle2, ClipboardCheck, HelpCircle } from "lucide-react";
import type { RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import {
  buildAxisVerdicts,
  buildOverallVerdict,
  type AxisStatus,
  type OverallLevel
} from "../lib/requirementVerdict";

const badgeStyle: Record<AxisStatus, string> = {
  "符合": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "部分符合": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]",
  "需調整": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "待確認": "border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"
};

const overallStyle: Record<OverallLevel, string> = {
  "可行": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "需調整": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "資料不足": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]"
};

export function RequirementAssessment({ criteria, recommendations }: {
  criteria: RentSearchCriteria;
  recommendations: RentRecommendation[];
}) {
  const axes = buildAxisVerdicts(criteria, recommendations);
  const overall = buildOverallVerdict(axes);
  const OverallIcon = overall.level === "可行" ? CheckCircle2 : overall.level === "資料不足" ? HelpCircle : AlertTriangle;

  return (
    <section className="mt-6 border border-[#1A2A22] bg-white" aria-labelledby="requirement-assessment-title">
      <div className="border-b border-[#1A2A22] bg-[#F5F8F6] p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[#00a174]" />
          <h4 id="requirement-assessment-title" className="text-base font-bold text-[#1A2A22]">需求可行性評估</h4>
        </div>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#66736C]">評估輸入的這組條件本身；右側是依此推導的可搜尋方向</p>

        <div className={`mt-3 border p-3 ${overallStyle[overall.level]}`}>
          <div className="flex items-center gap-2">
            <OverallIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold">{overall.level}</span>
          </div>
          <p className="mt-1.5 font-sans text-[11px] font-bold leading-relaxed">{overall.headline}</p>
          {overall.reasons.length > 0 && (
            <ul className="mt-2 space-y-1 font-sans text-[10px] leading-relaxed">
              {overall.reasons.map(reason => (
                <li key={reason} className="flex gap-1.5">
                  <span aria-hidden="true">・</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
          {overall.loosenFirst && (
            <p className="mt-2 border-t border-current/20 pt-2 font-sans text-[10px] font-bold leading-relaxed">
              最有效的調整 → {overall.loosenFirst}
            </p>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#DDE3DF]">
        {axes.map(axis => (
          <div key={axis.key} className="p-4 font-sans">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1A2A22]">{axis.label}</p>
                {axis.detail && <p className="mt-1 text-xs leading-relaxed text-[#3F5147]">{axis.detail}</p>}
              </div>
              <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${badgeStyle[axis.status]}`}>{axis.status}</span>
            </div>
            <p className="mt-2 text-[11px] font-bold leading-normal text-[#1A2A22]">{axis.headline}</p>
            {axis.drivers.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-l-2 border-[#9ee2cf] py-0.5 pl-2.5">
                {axis.drivers.map(driver => (
                  <li key={driver} className="text-[11px] leading-normal text-[#52635A]">{driver}</li>
                ))}
              </ul>
            )}
            {axis.nextStep && (
              <p className="mt-1.5 text-[11px] leading-normal font-medium text-[#007d5a]">→ {axis.nextStep}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
