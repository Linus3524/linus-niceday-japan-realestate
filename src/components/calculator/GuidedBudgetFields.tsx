import {
ChevronDown
} from "lucide-react";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import {
RENT_BUDGET_OPTIONS
} from '../../lib/calculator/options';
import { guidedSelectChevronClass } from './fieldStyles';

type Props = Pick<CalculatorViewModel, "rentMonthlyBudgetMin" | "setRentMonthlyBudgetMin" | "rentMonthlyBudget" | "setRentMonthlyBudget">;
export function GuidedBudgetFields({ rentMonthlyBudgetMin, setRentMonthlyBudgetMin, rentMonthlyBudget, setRentMonthlyBudget }: Props) {
  return (<><fieldset>
          <legend className="text-xs font-bold text-zinc-700">每月總預算（含管理費）</legend>
          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="relative flex h-12 min-w-0 items-center border border-[#1A2A22] bg-white focus-within:ring-1 focus-within:ring-[#00a174]">
              <select
                aria-label="每月最低預算"
                value={rentMonthlyBudgetMin}
                onChange={event => {
                  const nextMinimum = Number(event.target.value);
                  setRentMonthlyBudgetMin(nextMinimum);
                  if (nextMinimum > rentMonthlyBudget) setRentMonthlyBudget(nextMinimum);
                }}
                className="peer h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-16 font-mono text-base font-bold outline-none"
              >
                <option value={0}>不限</option>
                {RENT_BUDGET_OPTIONS.map(value => (
                  <option key={`minimum-${value}`} value={value}>{value / 10000}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-10 text-xs font-bold text-zinc-500">萬円</span>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
            <span aria-hidden="true" className="font-mono text-base font-bold text-[#66736C]">～</span>
            <div className="relative flex h-12 min-w-0 items-center border border-[#1A2A22] bg-white focus-within:ring-1 focus-within:ring-[#00a174]">
              <select
                aria-label="每月最高預算"
                value={rentMonthlyBudget}
                onChange={event => {
                  const nextMaximum = Number(event.target.value);
                  setRentMonthlyBudget(nextMaximum);
                  if (rentMonthlyBudgetMin > nextMaximum) setRentMonthlyBudgetMin(nextMaximum);
                }}
                className="peer h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-16 font-mono text-base font-bold outline-none"
              >
                {RENT_BUDGET_OPTIONS.map(value => (
                  <option key={`maximum-${value}`} value={value}>{value / 10000}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-10 text-xs font-bold text-zinc-500">萬円</span>
              <ChevronDown className={guidedSelectChevronClass} />
            </div>
          </div>
        </fieldset></>);
}
