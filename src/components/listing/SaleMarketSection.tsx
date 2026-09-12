import {
Building,
Compass,
FileText,
Home,
Info,
Landmark,
Layers,
MapPin,
Maximize2,
Sparkles,
Sun,
TrainFront
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import {
buildSaleMarketPresentation
} from '../../lib/listing/saleMarketPresentation';
import { SaleAgeComparison } from './SaleAgeComparison';
import { SalePriceFactors } from './SalePriceFactors';
import { SalePricePosition } from './SalePricePosition';
import { SalePriceSources } from './SalePriceSources';
import { STATUS_STYLE } from './statusTheme';

interface SaleMarketSectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "effectiveMlitComparison"
    | "saleAnalysis"
    | "locationContext"
    | "extracted"
    | "isSpecialSale"
    | "specialComparison"
    | "specialSale"
    | "parsedArea"
  >;
}

export function SaleMarketSection({ model }: SaleMarketSectionProps) {
  const {
    effectiveMlitComparison,
    saleAnalysis,
    locationContext,
    extracted,
    isSpecialSale,
    specialComparison,
    specialSale,
    parsedArea,
  } = model;
  return (<>{effectiveMlitComparison && (() => {
    const { c, priceMan, man, sqmOf, amenityHighlights, stationFacts, walkFacts, officialMan, officialDiffPercent, listingMan, listingLowMan, listingHighMan, listingRangeText, fairLow, fairHigh, hasFairRange, span, pos } = buildSaleMarketPresentation({ effectiveMlitComparison, saleAnalysis, locationContext, extracted });

    // 本案沿用租賃圖紙診斷的同一組語意色票（STATUS_STYLE）：
    // 落在區間內是綠、明顯高於上緣才是紅，不再不分結論一律深紅。
    const fairState = !hasFairRange
      ? {
        text: "缺合理區間", box: "border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]", dot: "bg-[#8A9590]",
        short: null as string | null, accent: "#3F5147"
      }
      : priceMan > (fairHigh as number)
        ? {
          text: "高於價格區間上限", box: STATUS_STYLE["偏高"].badge, dot: STATUS_STYLE["偏高"].dot,
          short: "高於區間上限", accent: "#B13818"
        }
        : priceMan < (fairLow as number)
          ? {
            text: "低於價格區間下限", box: STATUS_STYLE["超值"].badge, dot: STATUS_STYLE["超值"].dot,
            short: "低於區間下限", accent: "#007D5A"
          }
          : {
            text: "落在合理價格區間內", box: STATUS_STYLE["合理"].badge, dot: STATUS_STYLE["合理"].dot,
            short: "落在合理價格區間內", accent: "#007D5A"
          };

    const officialRangeText = fairLow && fairHigh && fairLow !== fairHigh
      ? `${fairLow.toLocaleString()} 〜 ${fairHigh.toLocaleString()} 萬円`
      : null;

    const benchmarks = [
      officialMan !== null && {
        key: "official",
        label: isSpecialSale ? "國交省同類成交基準" : "實價登錄平均",
        shortLabel: isSpecialSale ? "國交省成交" : "實價登錄",
        badge: isSpecialSale ? "國交省成交" : "國交省成約",
        value: officialMan,
        lowMan: fairLow,
        highMan: fairHigh,
        rangeText: officialRangeText,
        tone: "#0284C7",
        diff: officialDiffPercent,
        note: isSpecialSale
          ? `${specialComparison?.market || c.district}・${c.layout}・${c.sampleCount ?? 0}筆成交`
          : `國土交通省實價登錄 ${c.sampleCount ?? 0} 筆成交均價`,
      },
      listingMan !== null && {
        key: "listing",
        label: isSpecialSale ? "At Home 公開刊登基準" : "市場同規模在售行情",
        shortLabel: "市場在售",
        badge: "同規模校準",
        value: listingMan,
        lowMan: listingLowMan,
        highMan: listingHighMan,
        rangeText: listingRangeText,
        tone: "#D97706",
        diff: c.listingDiffPercent,
        note: c.listingBenchmarkSourceLabel
          ? `${c.listingBenchmarkSourceLabel}（賣方開價，非成交價）`
          : isSpecialSale ? "同區同面積帶公開刊登開價（非成交價）" : "依本案面積與條件校準之同規模在售行情區間中位（賣方開價，非成交價）",
      },
    ].filter(Boolean) as Array<{
      key: string; label: string; shortLabel: string; badge?: string; value: number; lowMan?: number | null;
      highMan?: number | null; rangeText?: string | null; tone: string;
      diff: number | null | undefined; note: string;
    }>;

    // 影響強度用「固定 ±15% 刻度」而不是組內最大值正規化。
    // 用最大值正規化時，+12% 只要是組內最大就會畫成滿格，看起來像 100%，反而誤導。
    const FACTOR_SCALE = 15;
    const factorIcon = (label: string) =>
      /站|交通|徒歩|徒步|樞紐/.test(label) ? TrainFront
        : /樓層|階/.test(label) ? Layers
          : /屋齡|築年|年數/.test(label) ? Home
            : /地段|町名/.test(label) ? MapPin
              : /朝向|方位|日照|採光/.test(label) ? Sun
                : /角部屋|角住戶|邊間/.test(label) ? Compass
                  : /露台|庭院|陽台|バルコニー/.test(label) ? Maximize2
                    : /現況|租約|入居/.test(label) ? Building
                      : /翻新|改裝|裝修/.test(label) ? Sparkles
                        : /土地|借地/.test(label) ? Landmark
                          : FileText;

    return (
      <>
        <SalePricePosition isSpecialSale={isSpecialSale} specialComparison={specialComparison} c={c} specialSale={specialSale} priceMan={priceMan} saleAnalysis={saleAnalysis} benchmarks={benchmarks} sqmOf={sqmOf} hasFairRange={hasFairRange} man={man} fairLow={fairLow} fairHigh={fairHigh} pos={pos} fairState={fairState} officialDiffPercent={officialDiffPercent} />

        {/* ── 影響價格的主要因素與計算基準（綜合呈現） ── */}
        {c.priceFactors && c.priceFactors.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                <Sparkles className="h-4 w-4 text-[#007D5A]" />
                <span>影響價格的主要因素與評估依據</span>
              </div>
              <span className="text-[10px] text-[#66736C]">
                條件加減權重 ＋ 國交省成交基準與在售行情交叉驗算
              </span>
            </div>

            {/* ① 上層：條件加減幅度一覽表（表頭＋方塊強度刻度） */}
            <SalePriceFactors FACTOR_SCALE={FACTOR_SCALE} c={c} factorIcon={factorIcon} priceMan={priceMan} />

            {/* ①-b 屋齡帶對照：換一個屋齡帶，同區同房型的成交單價差多少。
                             這是同一個分桶內的實際成交資料，不含任何估算係數。 */}
            <SaleAgeComparison c={c} />

            {/* ② 中層：雙來源官方數據與算式（簡潔雙欄方格卡片） */}
            <SalePriceSources c={c} parsedArea={parsedArea} man={man} officialMan={officialMan} officialDiffPercent={officialDiffPercent} isSpecialSale={isSpecialSale} listingRangeText={listingRangeText} listingMan={listingMan} />

            {/* ③ 下層：未量化個別條件（簡短標籤與說明） */}
            <div className="border border-[#DDE3DF] bg-white p-3.5 sm:p-4 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#3F5147]">
                {stationFacts.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#1A2A22]">交通：</span>
                    <span>
                      {stationFacts.map((st, i) => `${st}${walkFacts[i] ? ` 徒步${walkFacts[i]}分` : ""}`).join("、")}
                    </span>
                  </div>
                )}
                {amenityHighlights.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#1A2A22]">生活機能：</span>
                    <span>
                      {amenityHighlights.map(a => `${a.label} ${Math.round(a.distanceMeters)}m`).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2.5 border-t border-[#DDE3DF] pt-2 text-[10px] leading-relaxed text-[#8A9590]">
                ※ 國交省成交庫主要涵蓋區域、格局與屋齡帶；徒步距離、樓層視野與周邊機能等個別優勢，可做為評估本案開價合理性與議價之依據。
              </p>
            </div>
          </div>
        )}

        {/* ── 注意事項 ── */}
        {c.priceCautions && c.priceCautions.length > 0 && (
          <div className="space-y-2 border border-[#EAB879] bg-[#FEF3C7] p-4">
            {c.priceCautions.map((caution, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                <p className="text-[11px] leading-relaxed text-[#1A2A22]">
                  {i === 0 && <strong className="mr-1 font-bold text-[#D97706]">注意事項</strong>}
                  {caution}
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    );
  })()}</>);
}
