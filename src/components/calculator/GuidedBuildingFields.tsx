import {
ChevronDown
} from "lucide-react";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import { guidedSelectChevronClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "guidedMinArea" | "selectGuidedArea" | "areaOptions" | "guidedWalkMinutes" | "selectGuidedWalk" | "guidedAgeMax" | "selectGuidedAge">;
export function GuidedBuildingFields({ guidedMinArea, selectGuidedArea, areaOptions, guidedWalkMinutes, selectGuidedWalk, guidedAgeMax, selectGuidedAge }: Props) {
  return (<><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-[11px] font-bold text-zinc-700">
            最低面積
            <div className="relative mt-1.5">
              <select value={guidedMinArea} onChange={event => selectGuidedArea(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                <option value={0}>不限</option>
                {areaOptions.map(area => <option key={area} value={area}>{area}㎡以上</option>)}
              </select>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
          </label>
          <label className="text-[11px] font-bold text-zinc-700">
            徒步到車站
            <div className="relative mt-1.5">
              <select value={guidedWalkMinutes} onChange={event => selectGuidedWalk(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                <option value={0}>6～10 分／不限</option>
                <option value={5}>5 分內</option>
                <option value={15}>11～15 分</option>
                <option value={20}>16～20 分</option>
              </select>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
          </label>
          <label className="text-[11px] font-bold text-zinc-700">
            屋齡上限
            <div className="relative mt-1.5">
              <select value={guidedAgeMax} onChange={event => selectGuidedAge(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                <option value={0}>不限</option>
                <option value={3}>3 年內</option>
                <option value={5}>5 年內</option>
                <option value={7}>7 年內</option>
                <option value={10}>10 年內</option>
                <option value={15}>15 年內</option>
                <option value={20}>20 年內</option>
                <option value={25}>25 年內</option>
                <option value={30}>30 年內</option>
                <option value={40}>40 年內</option>
                <option value={50}>50 年內</option>
              </select>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
          </label>
        </div></>);
}
