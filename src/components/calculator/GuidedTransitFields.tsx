import {
ChevronDown,
MapPin,
Plus,
X
} from "lucide-react";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import {
sameGuidedLine
} from '../../lib/calculator/options';
import { toJapaneseLineName, toJapaneseStationName } from "../../lib/transit";
import { guidedSelectChevronClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "addGuidedLine" | "guidedDistrictSelections" | "guidedLineOptions" | "guidedLineSelections" | "removeGuidedLine" | "guidedStationDraft" | "setGuidedStationDraft" | "addGuidedStation" | "guidedLocationStationOptions" | "guidedStationSelections" | "removeGuidedStation">;
export function GuidedTransitFields({ addGuidedLine, guidedDistrictSelections, guidedLineOptions, guidedLineSelections, removeGuidedLine, guidedStationDraft, setGuidedStationDraft, addGuidedStation, guidedLocationStationOptions, guidedStationSelections, removeGuidedStation }: Props) {
  return (<><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <label className="text-xs font-bold text-zinc-700" htmlFor="guided-line-add">希望線路</label>
              <span className="text-[9px] text-[#66736C]">最多 4 條</span>
            </div>
            <div className="relative">
              <select
                id="guided-line-add"
                value=""
                onChange={event => addGuidedLine(event.target.value)}
                disabled={!guidedDistrictSelections.length}
                className="peer h-11 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174] disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2] disabled:text-zinc-400"
              >
                <option value="">＋ 新增希望線路</option>
                {guidedLineOptions.map(line => <option key={line} value={line} disabled={guidedLineSelections.some(selected => sameGuidedLine(selected, line))}>{toJapaneseLineName(line)}</option>)}
              </select>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
            {guidedLineSelections.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="已選希望線路">
                {guidedLineSelections.map(line => (
                  <span key={line} className="inline-flex items-center gap-1 border border-[#8BCDB8] bg-[#E6F6F1] px-2 py-1 text-[9px] font-bold text-[#007D5A]">
                    {toJapaneseLineName(line)}
                    <button type="button" onClick={() => removeGuidedLine(line)} className="text-[#007D5A]/70 hover:text-[#007D5A]" aria-label={`移除${toJapaneseLineName(line)}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <label className="text-xs font-bold text-zinc-700" htmlFor="guided-station-add">希望車站</label>
              <span className="text-[9px] text-[#66736C]">可搜尋，最多 6 個</span>
            </div>
            <div className="flex">
              <div className="relative min-w-0 flex-1">
                <input
                  id="guided-station-add"
                  list="guided-station-options"
                  value={guidedStationDraft}
                  onChange={event => setGuidedStationDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addGuidedStation();
                    }
                  }}
                  disabled={!guidedDistrictSelections.length}
                  placeholder="輸入站名"
                  className="h-11 w-full border border-r-0 border-[#1A2A22] bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-inset focus:ring-[#00a174] disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2]"
                />
                <datalist id="guided-station-options">
                  {guidedLocationStationOptions.map(station => <option key={station.name} value={station.name}>{toJapaneseStationName(station.name)}駅</option>)}
                </datalist>
              </div>
              <button type="button" onClick={addGuidedStation} disabled={!guidedStationDraft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#1A2A22] bg-[#1A2A22] text-white hover:bg-[#008C68] disabled:cursor-not-allowed disabled:border-[#AEB8B2] disabled:bg-[#AEB8B2]" aria-label="加入希望車站">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {guidedStationSelections.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="已選希望車站">
                {guidedStationSelections.map(station => (
                  <span key={station} className="inline-flex items-center gap-1 border border-[#CBD7D1] bg-white px-2 py-1 text-[9px] font-bold text-[#35483E]">
                    <MapPin className="h-3 w-3 text-[#00A174]" />
                    {toJapaneseStationName(station)}駅
                    <button type="button" onClick={() => removeGuidedStation(station)} className="text-[#66736C] hover:text-[#1A2A22]" aria-label={`移除${toJapaneseStationName(station)}駅`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div></>);
}
