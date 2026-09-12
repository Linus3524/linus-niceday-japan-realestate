import {
ChevronDown,
X
} from "lucide-react";
import { rentRates } from "../../data/housingMarket";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import { toJapanesePlaceName, toJapanesePrefectureName } from "../../lib/transit";
import { guidedSelectChevronClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "addGuidedDistrict" | "guidedDistrictSelections" | "removeGuidedDistrict">;
export function GuidedDistrictFields({ addGuidedDistrict, guidedDistrictSelections, removeGuidedDistrict }: Props) {
  return (<><div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <label className="text-xs font-bold text-zinc-700" htmlFor="guided-district-add">希望地區</label>
            <span className="text-[9px] text-[#66736C]">可複選，最多 4 個同生活圈地區</span>
          </div>
          <div className="relative">
            <select
              id="guided-district-add"
              value=""
              onChange={event => addGuidedDistrict(event.target.value)}
              className="peer h-12 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-sm outline-none focus:ring-1 focus:ring-[#00a174]"
            >
              <option value="">＋ 新增希望地區</option>
              {Array.from(new Set(rentRates.map(rate => rate.region))).map(region => (
                <optgroup key={region} label={toJapanesePrefectureName(region)}>
                  {rentRates.filter(rate => rate.region === region).map(rate => (
                    <option key={rate.district} value={rate.district} disabled={guidedDistrictSelections.includes(rate.district)}>
                      {toJapanesePlaceName(rate.district)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className={guidedSelectChevronClass} />
          </div>
          {guidedDistrictSelections.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="已選希望地區">
              {guidedDistrictSelections.map(district => (
                <span key={district} className="inline-flex items-center gap-1 bg-[#008C68] px-2.5 py-1.5 text-[10px] font-bold text-white">
                  {toJapanesePlaceName(district)}
                  <button type="button" onClick={() => removeGuidedDistrict(district)} className="ml-0.5 text-white/75 hover:text-white" aria-label={`移除${toJapanesePlaceName(district)}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div></>);
}
