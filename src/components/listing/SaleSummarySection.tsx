import {
Building,
Coins,
Landmark,
Maximize2,
Ruler,
Wallet
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';

interface SaleSummarySectionProps {
  model: Pick<ListingHealthCheckModel, "saleAnalysis" | "specialSale" | "isSpecialSale" | "extracted">;
}

export function SaleSummarySection({ model }: SaleSummarySectionProps) {
  const { saleAnalysis, specialSale, isSpecialSale, extracted } = model;
  return (<>{(() => {
    const heroCards = [
      {
        key: "price",
        icon: Coins,
        label: "物件總價（販売価格）",
        value: typeof saleAnalysis?.salePriceMan === "number" ? saleAnalysis.salePriceMan.toLocaleString() : "—",
        unit: "萬円",
        sub: formatYen(saleAnalysis?.salePriceYen),
        primary: true,
      },
      {
        key: "tsubo",
        icon: Ruler,
        label: "每坪單價（坪単価）",
        value: typeof saleAnalysis?.tsuboAndSqm?.tsuboPriceMan === "number" && !isNaN(saleAnalysis.tsuboAndSqm.tsuboPriceMan)
          ? saleAnalysis.tsuboAndSqm.tsuboPriceMan.toFixed(1) : "—",
        unit: "萬円/坪",
        sub: typeof saleAnalysis?.tsuboAndSqm?.tsubo === "number" && !isNaN(saleAnalysis.tsuboAndSqm.tsubo)
          ? `${specialSale.kind === "land" ? "土地約" : isSpecialSale ? "建物合計約" : "專有約"} ${saleAnalysis.tsuboAndSqm.tsubo.toFixed(2)} 坪` : "依面積折算",
        primary: false,
      },
      {
        key: "sqm",
        icon: Maximize2,
        label: "每平方米單價（㎡単価）",
        value: typeof saleAnalysis?.tsuboAndSqm?.sqmPriceMan === "number" && !isNaN(saleAnalysis.tsuboAndSqm.sqmPriceMan)
          ? saleAnalysis.tsuboAndSqm.sqmPriceMan.toFixed(1) : "—",
        unit: "萬円/㎡",
        sub: saleAnalysis?.areaSqm ? `${specialSale.kind === "land" ? "土地面積" : isSpecialSale ? "建物總面積" : "專有面積"} ${saleAnalysis.areaSqm} ㎡` : "面積未載明",
        primary: false,
      },
      {
        key: "holding",
        icon: Wallet,
        label: "每月固定持有支出",
        value: formatYen(saleAnalysis?.monthlyHoldingCosts?.totalMonthlyHoldingCost),
        unit: "/ 月",
        sub: `全年合計約 ${formatYen((saleAnalysis?.monthlyHoldingCosts?.totalMonthlyHoldingCost || 0) * 12)}`,
        primary: false,
      },
      {
        key: "building",
        icon: Building,
        label: "社區規模與屋齡",
        value: saleAnalysis?.buildingHealth?.totalUnits ? `${saleAnalysis.buildingHealth.totalUnits}` : "—",
        unit: saleAnalysis?.buildingHealth?.totalUnits ? "戶" : "",
        sub: extracted?.age || "建物屋齡",
        tag: saleAnalysis?.buildingHealth?.scaleRiskText,
        primary: false,
      },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <Landmark className="h-4 w-4 text-[#007D5A]" />
          <span>買賣核心指標與坪單價速覽</span>
        </div>

        <div className={`grid gap-3 sm:grid-cols-2 ${isSpecialSale ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}>
          {heroCards.filter(card => !isSpecialSale || !["holding", "building"].includes(card.key)).map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`p-3 sm:p-3.5 ${card.primary
                  ? "border-2 border-[#00A174] bg-[#F5F8F6]"
                  : "border border-[#DDE3DF] bg-white"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${card.primary ? "bg-[#007D5A] text-white" : "bg-[#E6F6F1] text-[#007D5A]"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className={`text-[11px] font-bold ${card.primary ? "text-[#007D5A]" : "text-[#66736C]"}`}>
                    {card.label}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="flex items-baseline gap-1 text-2xl font-black text-[#1A2A22] tabular-nums">
                    {card.value}
                    {card.unit && (
                      <span className="text-xs font-normal text-[#66736C]">
                        {card.unit}
                      </span>
                    )}
                  </p>
                  {card.tag && (
                    <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-bold text-[#007D5A]">
                      {card.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-[#66736C]">{card.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  })()}</>);
}
