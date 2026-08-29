import { AlertTriangle, CheckCircle2, ClipboardCheck, HelpCircle } from "lucide-react";
import type { RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { criteriaTagStyle } from "../lib/criteriaTagStyles";
import {
  axisImpactLevel,
  buildAxisVerdicts,
  buildOverallVerdict,
  type AxisImpactLevel,
  type OverallLevel
} from "../lib/requirementVerdict";

const badgeStyle: Record<AxisImpactLevel, string> = {
  "容易達成": criteriaTagStyle.equipment,
  "需要取捨": criteriaTagStyle.layout,
  "較難兼顧": criteriaTagStyle.budget,
  "待補資料": criteriaTagStyle.transport
};

const overallStyle: Record<OverallLevel, string> = {
  "可行": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "有條件可行": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
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
    <div className="mt-6 space-y-4">
      <section className="border border-[#1A2A22] bg-white p-4" aria-labelledby="requirement-assessment-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#00a174]" />
              <h4 id="requirement-assessment-title" className="text-base font-bold text-[#1A2A22]">需求可行性評估</h4>
            </div>
            <p className="mt-1 font-sans text-[10px] text-[#66736C]">根據預算、地點與設備條件判斷</p>
          </div>
          <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${overallStyle[overall.level]}`}>{overall.level}</span>
        </div>

        <div className="mt-4 font-sans">
          <div className="flex items-start gap-2.5">
            <OverallIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7A5A1F]" />
            <p className="text-[11px] font-bold leading-relaxed text-[#1A2A22]">{overall.headline}</p>
          </div>
          {overall.reasons.length > 0 && (
            <ul className="mt-2 space-y-1 pl-6">
              {overall.reasons.map(reason => (
                <li key={reason} className="list-disc text-[10px] leading-relaxed text-[#52635A]">
                  {reason}
                </li>
              ))}
            </ul>
          )}
          {overall.loosenFirst && (
            <p className="mt-3 border-t border-[#E1E7E3] pt-3 text-[10px] font-bold leading-relaxed text-[#007D5A]">
              建議先調整：{overall.loosenFirst}
            </p>
          )}
          {overall.pendingLabels && overall.pendingLabels.length > 0 && (
            <p className="mt-2 text-[10px] leading-relaxed text-[#52635A]">
              待補資料：{overall.pendingLabels.join("、")}
            </p>
          )}
        </div>
      </section>

      <section className="border border-[#DDE3DF] bg-white divide-y divide-[#DDE3DF]" aria-label="各條件的達成難度">
        {axes.map(axis => {
          const impact = axisImpactLevel(axis);
          return <div key={axis.key} className="p-4 font-sans">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1A2A22]">{axis.label}</p>
                {axis.detail && <p className="mt-1 text-xs leading-relaxed text-[#3F5147]">{axis.detail}</p>}
              </div>
              <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${badgeStyle[impact]}`}>{impact}</span>
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
          </div>;
        })}
      </section>
    </div>
  );
}
