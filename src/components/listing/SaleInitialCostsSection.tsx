import {
ChevronDown,
ChevronUp,
Info,
Wallet
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';

interface SaleInitialCostsSectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "saleInitialCosts"
    | "isSpecialSale"
    | "taxEstimationSummary"
    | "showSaleCostsDetails"
    | "setShowSaleCostsDetails"
    | "specialSale"
    | "acquisitionTaxAssessment"
  >;
}

export function SaleInitialCostsSection({ model }: SaleInitialCostsSectionProps) {
  const {
    saleInitialCosts,
    isSpecialSale,
    taxEstimationSummary,
    showSaleCostsDetails,
    setShowSaleCostsDetails,
    specialSale,
    acquisitionTaxAssessment,
  } = model;
  return (<>{saleInitialCosts && (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <Wallet className="h-4 w-4 text-[#007D5A]" />
          <span>買方交屋諸費用試算</span>
        </div>
        <span className="text-[10px] text-[#66736C]">
          {isSpecialSale ? "土地建物與營業用途需逐項核對" : "日本中古大樓諸費用常態約佔房價 5%～7%"}
        </span>
      </div>

      {/* 總額預估 Banner */}
      <div className="flex flex-col justify-between gap-5 border border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="min-w-0 sm:w-[78%]">
          <p className="text-xs font-bold text-[#007D5A]">{isSpecialSale ? "已列交屋費用小計（不含待核對項目）" : "買方交屋諸費用預估總額"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <p className="flex items-center gap-1.5 text-2xl font-black text-[#1A2A22] md:text-3xl">
              <span className="text-sm font-semibold leading-none text-[#66736C]">約</span>
              <span className="leading-none tabular-nums">{formatYen(saleInitialCosts.total)}</span>
            </p>
            <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-xs font-bold text-[#007D5A]">
              約佔物件總價 {typeof saleInitialCosts?.percentageOfPrice === "number" && !isNaN(saleInitialCosts.percentageOfPrice) ? saleInitialCosts.percentageOfPrice.toFixed(1) : "—"}%
            </span>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-[#8A9590]">
            {isSpecialSale ? "已列項目概算，取得稅待確認登記用途後另計；仲介費按一般上限參考，非已確認報價。" : "法定公式精算仲介費、印紙稅、固都稅日割與管修預繳；"}
            {taxEstimationSummary
              ? `評價額相關稅費依圖面推算（${taxEstimationSummary}），實際金額以交屋正式文件為準。`
              : "評價額相關稅費由 AI 依圖面推算，實際金額以交屋正式文件為準。"}
          </p>
        </div>

        <button
          type="button" aria-expanded={showSaleCostsDetails} onClick={() => setShowSaleCostsDetails(!showSaleCostsDetails)}
          className="flex w-28 shrink-0 self-start items-center justify-center gap-1.5 whitespace-nowrap border border-[#007D5A] bg-white px-4 py-2 text-xs font-bold text-[#007D5A] transition-colors hover:bg-[#E6F6F1] cursor-pointer sm:self-center">
          {showSaleCostsDetails ? (
            <>
              <span>收合明細</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>展開明細</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* 項目逐筆拆解表格。同租賃那張表：手機上用左右滑動看完整，不把欄位擠成一個字一行。 */}
      {showSaleCostsDetails && (
        <div className="mt-4 overflow-x-auto border border-[#DDE3DF]">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]">
              <tr>
                <th className="p-2.5 font-bold whitespace-nowrap">費用項目</th>
                <th className="p-2.5 text-right font-bold whitespace-nowrap w-[110px]">預估金額</th>
                <th className="p-2.5 font-bold min-w-[360px]">計算標準與法定依據</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3DF]">
              {saleInitialCosts.items.filter(item => (!isSpecialSale || item.id !== "managementPrepayment") && (specialSale.kind !== "land" || item.id !== "insurance")).map(item => (
                <tr key={item.id} className="hover:bg-[#F5F8F6]">
                  <td className="p-2.5 font-bold text-[#1A2A22] whitespace-nowrap">{item.name}</td>
                  <td className="p-2.5 text-right font-bold text-[#007D5A] whitespace-nowrap tabular-nums">
                    {item.id === "acquisitionTax" && acquisitionTaxAssessment?.amount == null ? "待核對，未計入" : formatYen(item.amount)}
                  </td>
                  <td className="p-2.5 text-[11px] leading-relaxed text-[#66736C]">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showSaleCostsDetails && (
        <p className="mt-2 text-[10px] text-[#8A9590] md:hidden">※ 表格可左右滑動，查看預估金額與計算依據。</p>
      )}

      <div className="mt-4 border border-[#EAB879] bg-[#FEF3C7] p-4 text-xs leading-relaxed">
        <div className="mb-2 flex items-center gap-1.5 font-bold text-[#D97706]">
          <Info className="h-4 w-4 text-[#D97706]" />
          <span>買方交屋初期費用試算說明與資金準備：</span>
        </div>
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-[#3F5147]">
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-[#D97706]">•</span>
            <span>
              <strong className="text-[#1A2A22]">固都稅日割計算標準：</strong>
              因現行圖紙分析階段尚未簽約約定交屋日，系統預設以「<strong>本日分析日起至年底之剩餘日數</strong>」進行日割概算；正式成交時將由司法書士以合約約定的<strong>實際交屋日（引渡日）</strong>為準按日精算。
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-[#D97706]">•</span>
            <span>
              <strong className="text-[#1A2A22]">{isSpecialSale ? "建物維護與營業預備金：" : "管修費用預繳慣例："}</strong>
              {specialSale.kind === "land" ? "土地需另外確認拆除、整地及建築預算，未套用公寓管修費預繳。" : isSpecialSale ? "整棟或透天需自行編列屋頂、外牆、設備更新及營運周轉金，未套用公寓管修費預繳。" : "日本大樓集合住宅交屋時，管理費與修繕積立金暫按預繳 3 個月估算，實際依管理組合請款確認。"}
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-[#D97706]">•</span>
            <span>
              <strong className="text-[#1A2A22]">法定稅費依據：</strong>
              登記免許稅、不動產取得稅與固都稅屬於地方稅務局核定稅額，AI 係依圖紙條件與法定稅率推估；實際金額以賣方提供的固定資產評價證明書及都道府縣稅務通知為準。
            </span>
          </li>
        </ul>
      </div>
    </div>
  )}</>);
}
