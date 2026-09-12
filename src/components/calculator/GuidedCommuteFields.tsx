import {
ChevronDown
} from "lucide-react";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import { toJapaneseStationName } from "../../lib/transit";
import { guidedSelectChevronClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "guidedCommuteStation" | "setGuidedCommuteStation" | "setLocationGuardNotice" | "validateCommuteCompatibility" | "commuteStationOptions" | "guidedCommuteMinutes" | "setGuidedCommuteMinutes">;
export function GuidedCommuteFields({ guidedCommuteStation, setGuidedCommuteStation, setLocationGuardNotice, validateCommuteCompatibility, commuteStationOptions, guidedCommuteMinutes, setGuidedCommuteMinutes }: Props) {
  return (<><div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(120px,1fr)]">
          <label className="block text-[11px] font-bold text-zinc-700">
            通勤目的車站（可輸入搜尋）
            <input
              list="commute-station-options"
              value={guidedCommuteStation}
              onChange={event => {
                setGuidedCommuteStation(event.target.value);
                if (!event.target.value) setLocationGuardNotice(null);
              }}
              onBlur={event => setLocationGuardNotice(validateCommuteCompatibility(event.target.value))}
              placeholder="例如：渋谷、新宿、東京"
              className="mt-1.5 h-11 w-full border border-[#1A2A22] bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-[#00a174]"
            />
            <datalist id="commute-station-options">
              {commuteStationOptions.map(station => <option key={station} value={station}>{toJapaneseStationName(station)}駅</option>)}
            </datalist>
          </label>
          <label className="block text-[11px] font-bold text-zinc-700">
            最長通勤時間
            <div className="relative mt-1.5">
              <select
                value={guidedCommuteMinutes}
                onChange={event => setGuidedCommuteMinutes(Number(event.target.value))}
                disabled={!guidedCommuteStation}
                className="peer h-11 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174] disabled:cursor-not-allowed disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2] disabled:text-zinc-400"
              >
                <option value={15}>15 分內</option>
                <option value={20}>20 分內</option>
                <option value={30}>30 分內</option>
                <option value={45}>45 分內</option>
                <option value={60}>60 分內</option>
                <option value={75}>75 分內</option>
                <option value={90}>90 分內</option>
              </select>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
          </label>
        </div></>);
}
