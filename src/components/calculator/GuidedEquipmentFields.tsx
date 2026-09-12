import { type BudgetModifierId } from "../../data/rentGuideData";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import type { RentSearchFilter } from '../../lib/calculator/types';
import { guidedChoiceClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "guidedFloorMin" | "selectGuidedFloor" | "rentSearchFilters" | "toggleRentSearchFilter" | "washbasinSelected" | "toggleBathroomFacility" | "bidetSelected" | "guidedAutoLock" | "toggleBuildingSecurity" | "guidedElevator" | "calcModifiers" | "toggleModifier">;
export function GuidedEquipmentFields({ guidedFloorMin, selectGuidedFloor, rentSearchFilters, toggleRentSearchFilter, washbasinSelected, toggleBathroomFacility, bidetSelected, guidedAutoLock, toggleBuildingSecurity, guidedElevator, calcModifiers, toggleModifier }: Props) {
  return (<><fieldset className="border-t border-dashed border-[#C9D2CD] pt-4">
          <legend className="px-1 text-xs font-bold text-zinc-700">樓層與常用設備</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={guidedFloorMin >= 2}
              onClick={() => selectGuidedFloor(guidedFloorMin >= 2 ? 0 : 2)}
              className={guidedChoiceClass(guidedFloorMin >= 2)}
            >
              2 樓以上
            </button>
            <button
              type="button"
              aria-pressed={rentSearchFilters.includes("pets")}
              onClick={() => toggleRentSearchFilter("pets")}
              className={guidedChoiceClass(rentSearchFilters.includes("pets"))}
            >
              可養寵物
            </button>
            <button
              type="button"
              aria-pressed={washbasinSelected}
              onClick={() => toggleBathroomFacility("washbasin")}
              className={guidedChoiceClass(washbasinSelected)}
            >
              獨立洗面台
            </button>
            <button
              type="button"
              aria-pressed={bidetSelected}
              onClick={() => toggleBathroomFacility("bidet")}
              className={guidedChoiceClass(bidetSelected)}
            >
              免治馬桶
            </button>
            <button
              type="button"
              aria-pressed={guidedAutoLock}
              onClick={() => toggleBuildingSecurity("autoLock")}
              className={guidedChoiceClass(guidedAutoLock)}
            >
              自動門
            </button>
            <button
              type="button"
              aria-pressed={guidedElevator}
              onClick={() => toggleBuildingSecurity("elevator")}
              className={guidedChoiceClass(guidedElevator)}
            >
              電梯
            </button>
            {([
              ["separate_bath", "衛浴分離"],
              ["furnished", "家具家電"],
            ] as Array<[BudgetModifierId, string]>).map(([id, label]) => {
              const selected = calcModifiers.includes(id);
              return (
                <button key={id} type="button" aria-pressed={selected} onClick={() => toggleModifier(id)} className={guidedChoiceClass(selected)}>
                  {label}
                </button>
              );
            })}
            {([
              ["noKeyMoney", "免禮金"],
              ["noDeposit", "免押金"],
              ["freeInternet", "免費網路"],
              ["balcony", "附陽台"],
              ["twoBurners", "爐具 2 口以上"],
              ["cityGas", "都市瓦斯"],
            ] as Array<[RentSearchFilter, string]>).map(([id, label]) => {
              const selected = rentSearchFilters.includes(id);
              return (
                <button key={id} type="button" aria-pressed={selected} onClick={() => toggleRentSearchFilter(id)} className={guidedChoiceClass(selected)}>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset></>);
}
