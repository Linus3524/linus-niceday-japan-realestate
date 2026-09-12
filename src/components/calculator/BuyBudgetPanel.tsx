import type { CalculatorViewModel } from '../../hooks/useCalculatorController';
import { formatManYen, formatManYenNumber } from '../../lib/calculator/formatters';

interface BuyBudgetPanelProps {
  model: Pick<
    CalculatorViewModel,
    | "buyAvailableCash"
    | "setBuyAvailableCash"
    | "buyMonthlyPaymentBudget"
    | "setBuyMonthlyPaymentBudget"
    | "loanRatio"
    | "setLoanRatio"
    | "annualRate"
    | "setAnnualRate"
    | "loanYears"
    | "setLoanYears"
    | "affordableBuyLow"
    | "affordableBuyPrice"
    | "affordableDownPayment"
    | "affordableBuyFees"
    | "buyFeeRate"
  >;
}

export function BuyBudgetPanel({ model }: BuyBudgetPanelProps) {
  const {
    buyAvailableCash,
    setBuyAvailableCash,
    buyMonthlyPaymentBudget,
    setBuyMonthlyPaymentBudget,
    loanRatio,
    setLoanRatio,
    annualRate,
    setAnnualRate,
    loanYears,
    setLoanYears,
    affordableBuyLow,
    affordableBuyPrice,
    affordableDownPayment,
    affordableBuyFees,
    buyFeeRate,
  } = model;
  return (<div className="grid grid-cols-1 lg:grid-cols-12">
    <div className="space-y-5 border-b border-[#DDE3DF] bg-[#F5F8F6] p-5 lg:col-span-5 lg:border-b-0 lg:border-r md:p-6">
      <label className="block text-xs font-bold text-zinc-700">
        可準備的購屋現金
        <div className="mt-1.5 flex h-12 items-center border border-[#1A2A22] bg-white px-3">
          <input
            type="number"
            min="0"
            step="100"
            value={buyAvailableCash / 10000}
            onChange={event => setBuyAvailableCash(Math.max(0, (Number(event.target.value) || 0) * 10000))}
            className="w-full bg-transparent font-mono text-base font-bold outline-none"
          />
          <span className="ml-2 shrink-0 text-sm font-bold text-zinc-500">萬円</span>
        </div>
        <span className="mt-1 block text-[9px] font-normal leading-relaxed text-zinc-400">包含頭期款與購屋初期諸費用</span>
      </label>
      <label className="block text-xs font-bold text-zinc-700">
        每月可接受的本息還款
        <div className="mt-1.5 flex h-12 items-center border border-[#1A2A22] bg-white px-3">
          <input
            type="number"
            min="0"
            step="1"
            value={buyMonthlyPaymentBudget / 10000}
            onChange={event => setBuyMonthlyPaymentBudget(Math.max(0, (Number(event.target.value) || 0) * 10000))}
            className="w-full bg-transparent font-mono text-base font-bold outline-none"
          />
          <span className="ml-2 shrink-0 text-sm font-bold text-zinc-500">萬円</span>
        </div>
      </label>

      <details className="border border-[#DDE3DF] bg-white">
        <summary className="cursor-pointer px-3 py-2.5 text-xs font-bold text-[#31443A]">調整貸款假設</summary>
        <div className="grid grid-cols-3 gap-2 border-t border-[#DDE3DF] p-3">
          <label className="text-[9px] text-zinc-500">貸款成數
            <input type="number" min="0" max="100" step="5" value={loanRatio} onChange={event => setLoanRatio(Math.min(100, Math.max(0, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
          </label>
          <label className="text-[9px] text-zinc-500">年利率
            <input type="number" min="0" max="20" step="0.1" value={annualRate} onChange={event => setAnnualRate(Math.min(20, Math.max(0, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
          </label>
          <label className="text-[9px] text-zinc-500">貸款年限
            <input type="number" min="1" max="50" step="1" value={loanYears} onChange={event => setLoanYears(Math.min(50, Math.max(1, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
          </label>
        </div>
      </details>
    </div>

    <div className="p-5 lg:col-span-7 md:p-6">
      <div className="border-b border-[#DDE3DF] pb-4">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#66736C] uppercase font-sans">Affordable range</p>
        <h4 className="mt-1 text-lg font-bold text-[#1A2A22]">建議購屋總價控制在</h4>
        <p className="mt-2 font-mono text-2xl font-black text-[#00a174]">
          {formatManYenNumber(affordableBuyLow, 0)}～{formatManYen(affordableBuyPrice, 0)}
        </p>
        <p className="mt-1 text-[10px] text-zinc-400">依現金與月付能力取較低上限，並保留約 10% 緩衝。</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-px border border-[#DDE3DF] bg-[#DDE3DF] sm:grid-cols-3">
        <div className="bg-white p-4">
          <p className="text-[10px] font-bold text-[#66736C]">頭期款概算</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{formatManYen(affordableDownPayment, 0)}</p>
          <p className="mt-1 text-[9px] text-zinc-400">總價的 {100 - loanRatio}%</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[10px] font-bold text-[#66736C]">初期諸費用概算</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{formatManYen(affordableBuyFees, 0)}</p>
          <p className="mt-1 text-[9px] text-zinc-400">目前以總價約 {Math.round(buyFeeRate * 100)}% 準備</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[10px] font-bold text-[#66736C]">貸款假設</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{annualRate}%／{loanYears} 年</p>
          <p className="mt-1 text-[9px] text-zinc-400">貸款成數 {loanRatio}%</p>
        </div>
      </div>

      <div className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-3 text-xs leading-relaxed text-[#245746]">
        這個結果只回答「資金上大致負擔得起多少」，尚未計入管理費、修繕積立金、固定資產稅與個別銀行審査。地區行情與物件條件可在下方進階工具繼續比較。
      </div>
    </div>
  </div>);
}
