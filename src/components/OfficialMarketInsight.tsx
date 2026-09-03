import React, { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, Building2, Footprints, BarChart3, Sparkles } from "lucide-react";
import type { LayoutCode } from "../data/housingMarket";
import { getBuyMarketEstimate, getModeledBuyYieldRate } from "../data/buyMarket";
import { rentRates } from "../data/housingMarket";
import { toJapanesePlaceName } from "../lib/transit";
import { TAMA_CITIES } from "../lib/calcRules";

interface OfficialMarketInsightProps {
  region: string;
  district: string;
  currentLayout: LayoutCode;
  onSelectLayout?: (layout: LayoutCode) => void;
  className?: string;
}

const LAYOUT_NAMES: Record<LayoutCode, string> = {
  r1: "1R",
  k1: "1K / 1DK",
  ldk1: "1LDK / 2K",
  ldk2: "2LDK / 3K",
  ldk3: "3LDK+"
};

interface MarketInsightContent {
  stationWalkTitle: string;
  stationWalkText: React.ReactNode;
  buildingAgeTitle: string;
  buildingAgeText: React.ReactNode;
  consultantTitle: string;
  consultantText: React.ReactNode;
}

function getRegionalMarketInsight(
  region: string,
  district: string,
  currentYield: number
): MarketInsightContent {
  const isTokyo = region === "東京都";
  const isTama = isTokyo && TAMA_CITIES.includes(district);
  const isTokyo23 = isTokyo && !isTama;
  const isKantoCommuter = ["神奈川", "埼玉", "千葉"].includes(region);
  const isKansaiCore = ["大阪", "京都", "兵庫"].includes(region);
  const isRegionalHub = ["愛知", "福岡", "北海道", "宮城", "廣島"].includes(region);
  const jpDistrict = toJapanesePlaceName(district);
  const yieldStr = currentYield > 0 ? `${currentYield.toFixed(1)}%` : "約 4%～5%";

  if (isTokyo23) {
    return {
      stationWalkTitle: "東京 23 區車站步行距離溢價效應",
      stationWalkText: (
        <>
          國交省成約資料顯示：在東京 23 區，<strong>徒步 5 分鐘內</strong>的物件相比徒步 10～15 分鐘以上，平均每坪單價溢價約 <strong>+12%～+18%</strong>。近站物件流動性、租賃去化速度與抗跌保值性明顯優於遠站物件。
        </>
      ),
      buildingAgeTitle: "屋齡折舊與「新耐震基準」分水嶺",
      buildingAgeText: (
        <>
          <strong>1981 年 6 月</strong>頒布之「新耐震基準」是日本銀行房貸核貸與海外買方轉手的重要分水嶺。東京都心築 15 年內中古大樓抗跌性強；若考慮保值性，建議優先鎖定新耐震大樓。
        </>
      ),
      consultantTitle: `Linus 房產顧問觀點：${jpDistrict} 之投報率與資產配置`,
      consultantText: (
        <>
          【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。東京 23 區因土地高昂、房價分母大，表面投報率普遍偏低，但享有全日本最低空置率與強勁的資產保值性。建議以「長期抗通膨、資產保值」為核心目標，切忌盲目追逐高利回老屋。
        </>
      )
    };
  }

  if (isTama) {
    return {
      stationWalkTitle: "多摩生活圈通勤動線與徒步關鍵",
      stationWalkText: (
        <>
          多摩地區高度依賴 JR 中央線、京王線、小田急線等快速/特快停靠站。國交省資料顯示，<strong>徒步 7 分鐘內</strong>或特快大站周邊抗跌性最穩健；若步行超過 12 分鐘，建議挑選附設停車位或大型優質管理社區。
        </>
      ),
      buildingAgeTitle: "郊區社區維護與修繕積立金檢視",
      buildingAgeText: (
        <>
          多摩住宅區有許多中低密度社區，除確認 1981 新耐震外，中古公寓之<strong>管理費與修繕積立金總額</strong>是否充足，是影響未來轉手評價與居住品質的關鍵指標。
        </>
      ),
      consultantTitle: `Linus 房產顧問觀點：${jpDistrict} 空間性價比與生活機能`,
      consultantText: (
        <>
          【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。多摩生活圈擁有優質綠意、學區與寬敞空間性價比，受在地家庭與穩定育兒族青睞，適合兼顧「居住空間尺度」與「合理購屋總價」的買方。
        </>
      )
    };
  }

  if (isKantoCommuter) {
    return {
      stationWalkTitle: `${region} 通勤東京動線與近站溢價`,
      stationWalkText: (
        <>
          在{region}（如橫濱、川崎、大宮、浦和、西船橋等），直通東京核心之急行/快速停靠站為主力。國交省資料顯示<strong>徒步 8 分鐘內</strong>為租賃與轉手黃金期，能以更親民總價取得更優質的生活空間。
        </>
      ),
      buildingAgeTitle: "中古公寓耐震與大規模修繕履歷",
      buildingAgeText: (
        <>
          除了 1981 年新耐震基準外，首都圈外圍購買中古公寓應特別調閱<strong>「長期修繕計畫書」</strong>，確認外牆與電梯是否依期保養，避免過戶後隨即面臨臨時增收修繕費。
        </>
      ),
      consultantTitle: `Linus 房產顧問觀點：${jpDistrict}（${region}）之剛需性價比`,
      consultantText: (
        <>
          【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。做為東京生活圈的主要衛星城市，擁有龐大且穩定的通勤剛需，購屋總價門檻較東京都心親民許多，租金收益率與自住舒適度具備極佳性價比。
        </>
      )
    };
  }

  if (isKansaiCore) {
    return {
      stationWalkTitle: `${region} 軌道商圈與徒步流動性`,
      stationWalkText: (
        <>
          關西核心圈（如大阪地鐵御堂筋線、環狀線，京都地鐵沿線）對車站距離極為敏感。國交省成約資料顯示<strong>徒步 5～7 分鐘內</strong>單身與 1LDK 戶型招租週期短，商業與觀光樞紐周邊流動性最強。
        </>
      ),
      buildingAgeTitle: "耐震基準與室內現代化翻新 (リノベ)",
      buildingAgeText: (
        <>
          關西都會區中古大樓交易熱絡，1981 新耐震為融資審查基本門檻；若為 20～30 年中古大樓，具備<strong>室內全面骨架翻新（フルリノベーション）</strong>的物件在二手市場承接力道最為強勁。
        </>
      ),
      consultantTitle: `Linus 房產顧問觀點：${jpDistrict}（${region}）租金回報與商圈潛力`,
      consultantText: (
        <>
          【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。關西核心圈商業與觀光動能活絡，租金回報率普遍較東京高出約 <strong>+0.5%～+1.5%</strong>。投資布局時需特別留意各街區的人口流向、學區與商業繁華度差異。
        </>
      )
    };
  }

  if (isRegionalHub) {
    return {
      stationWalkTitle: `${region} 中心樞紐與車位（駐車場）考量`,
      stationWalkText: (
        <>
          在{region}（如福岡天神/博多、名驛/榮、札幌大通等核心區），地鐵徒步 7 分內為招租王道；但在外圍或住宅區，<strong>「專用停車位（敷地內駐車場）」</strong>的有無往往與徒步時間同樣關鍵。
        </>
      ),
      buildingAgeTitle: "地方大城耐震與管理維護品質",
      buildingAgeText: (
        <>
          1981 新耐震基準為銀行融資標準。地方主要核心都市年輕人口聚集，極淺築或維護優良之品牌公寓在轉手市場具備極高流動性。
        </>
      ),
      consultantTitle: `Linus 房產顧問觀點：${jpDistrict}（${region}）地方首善之人口紅利`,
      consultantText: (
        <>
          【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。做為地方核心大城，持續吸引周邊區域年輕就業人口移入，單身套房與小家庭租賃需求強勁，兼具相對親民的入場總價與穩健的租金收益率。
        </>
      )
    };
  }

  // 地方其他縣市
  return {
    stationWalkTitle: `${region} 在地交通模式與生活圈特質`,
    stationWalkText: (
      <>
        在地方生活圈，除主要車站周邊外，周邊聯外幹線交通與<strong>「附設專用停車位（駐車場）」</strong>對出租率與自住轉手性影響極大。自住挑選建議以主要行政機關、綜合醫院或大型購物中心周邊為優先。
      </>
    ),
    buildingAgeTitle: "地方物件折舊特性與空置風險防範",
    buildingAgeText: (
      <>
        除確認 1981 新耐震標準外，地方城市中古大樓折舊速度相對較快，過戶前務必確認大樓管委會積立金現況，並實地勘查周圍空屋率與維護情形。
      </>
    ),
    consultantTitle: `Linus 房產顧問觀點：${jpDistrict}（${region}）投資與自住務實建議`,
    consultantText: (
      <>
        【{jpDistrict}】當前表面投報率約 <strong>{yieldStr}</strong>。地方城市帳面投報率往往較高，但務必理性防範「空置期較長、未來二手轉手不易」之隱形成本，建議以明確自住剛需或特定高確定性租賃族群為目標。
      </>
    )
  };
}

export const OfficialMarketInsight: React.FC<OfficialMarketInsightProps> = ({
  region,
  district,
  currentLayout,
  onSelectLayout,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const wardRate = rentRates.find(r => r.district === district);
  const getLayoutRentYen = (code: LayoutCode) => {
    if (!wardRate) return 0;
    const rateStr = (wardRate[code] || wardRate.ldk2) as string;
    return (parseFloat(rateStr) || 0) * 10000;
  };

  const currentRentYen = getLayoutRentYen(currentLayout);
  const currentEstimate = getBuyMarketEstimate({
    region,
    district,
    layout: currentLayout,
    monthlyRentYen: currentRentYen
  });

  const currentAnnualRent = currentRentYen * 12;
  const currentYield = currentEstimate.basePriceYen > 0
    ? (currentAnnualRent / currentEstimate.basePriceYen) * 100
    : (getModeledBuyYieldRate(region, district, currentLayout) * 100);

  const layouts: LayoutCode[] = ["r1", "k1", "ldk1", "ldk2", "ldk3"];
  const allLayoutData = layouts.map(code => {
    const rentYen = getLayoutRentYen(code);
    const estimate = getBuyMarketEstimate({
      region,
      district,
      layout: code,
      monthlyRentYen: rentYen
    });
    const yieldRate = estimate.basePriceYen > 0
      ? ((rentYen * 12) / estimate.basePriceYen) * 100
      : (getModeledBuyYieldRate(region, district, code) * 100);
    return {
      code,
      name: LAYOUT_NAMES[code],
      priceMan: Math.round(estimate.basePriceYen / 10000),
      monthlyRentMan: (rentYen / 10000).toFixed(1),
      yieldRate: yieldRate.toFixed(1),
      source: estimate.source,
      sampleCount: estimate.sampleCount
    };
  });

  const isOfficial = currentEstimate.source === "official_transaction";
  const jpDistrict = toJapanesePlaceName(district);
  const insight = getRegionalMarketInsight(region, district, currentYield);

  return (
    <div className={`border border-[#DDE3DF] bg-white text-zinc-700 font-sans transition-all ${className}`}>
      {/* 頂部主卡片 */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-[#F9FBFA]">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EEF2F0] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#EAF5F0] px-2 py-0.5 text-[11px] font-bold text-[#007D5A]">
                <TrendingUp className="w-3 h-3" />
                國土交通省成約行情
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                {isOfficial
                  ? `統計區間：${currentEstimate.periodStart}～${currentEstimate.periodEnd}`
                  : "收益率模型推估"}
              </span>
            </div>
            <h4 className="mt-1.5 text-sm sm:text-base font-bold text-[#1A2A22] flex items-center gap-1.5">
              <span lang="ja" className="font-jp">{jpDistrict}</span>
              <span className="text-zinc-400 font-normal">·</span>
              <span className="text-[#007D5A]">{LAYOUT_NAMES[currentLayout]}</span>
              <span className="font-normal text-xs text-zinc-500">中古公寓實價成約指標</span>
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-bold text-[#007D5A] hover:text-[#00a174] bg-[#F5F8F6] hover:bg-[#EBF3EF] px-2.5 py-1.5 border border-[#DDE3DF] transition-colors"
          >
            <span>{isExpanded ? "收合深度解讀" : "查看全格局與趨勢"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 雙指標對比：成交中位數 vs 表面利回 */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 卡片 1：成約價中位數 */}
          <div className="bg-[#F5F8F6] p-3.5 border border-[#E3ECE7] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-700">成約價中位數</span>
                {isOfficial && (
                  <span className="text-[10px] bg-white border border-[#DDE3DF] px-1.5 py-0.5 rounded-xs text-[#007D5A] font-medium font-mono shrink-0">
                    {currentEstimate.sampleCount.toLocaleString()} 筆樣本
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="font-jost text-2xl sm:text-3xl font-bold text-[#1A2A22]">
                  {Math.round(currentEstimate.basePriceYen / 10000).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-zinc-600">萬日圓</span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 pt-1.5 border-t border-[#E8EFEA]">
              {isOfficial ? "國交省近 4 季實價登記統計" : "參考租金模型反推估算"}
            </div>
          </div>

          {/* 卡片 2：表面投報率 */}
          <div className="bg-[#F5F8F6] p-3.5 border border-[#E3ECE7] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-700">表面投報率 (利回り)</span>
                <span className="text-[10px] text-zinc-400 font-mono">年租金 ÷ 房價</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="font-jost text-2xl sm:text-3xl font-bold text-[#007D5A]">
                  {currentYield.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-[#007D5A]">%</span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400 pt-1.5 border-t border-[#E8EFEA] flex items-center justify-between">
              <span>月租相場約 {((currentRentYen || 0) / 10000).toFixed(1)} 萬円</span>
              <span className="text-[10px] text-zinc-400">At Home 統計</span>
            </div>
          </div>
        </div>

        {/* 底部數據說明 */}
        <p className="mt-2.5 text-[10px] leading-normal text-zinc-400">
          ※ 數據取自國土交通省不動產資訊資料庫（ReinfoLib）中古公寓實價成約去識別化紀錄，反映該區市場定價基準。
        </p>
      </div>

      {/* 展開區塊：全格局階梯表 + 趨勢分析指南 */}
      {isExpanded && (
        <div className="border-t border-[#DDE3DF] bg-white p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
          {/* 格局橫向切換與階梯表 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h5 className="text-xs font-bold text-[#1A2A22] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#007D5A]" />
                <span>{jpDistrict} 各格局成交行情與投報率階梯表</span>
              </h5>
              <span className="text-[10px] text-zinc-400">點擊格局可直接套入計算機</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {allLayoutData.map((item, idx) => {
                const isSelected = item.code === currentLayout;
                const isLast = idx === allLayoutData.length - 1;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => onSelectLayout?.(item.code)}
                    className={`p-2.5 text-left border cursor-pointer transition-all ${
                      isLast ? "col-span-2 sm:col-span-1" : ""
                    } ${
                      isSelected
                        ? "border-[#007D5A] bg-[#EAF5F0] ring-1 ring-[#007D5A]/30 shadow-xs"
                        : "border-[#DDE3DF] bg-[#FAFCFB] hover:border-zinc-400 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={isSelected ? "text-[#007D5A]" : "text-zinc-700"}>{item.name}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-[#007D5A] text-white px-1 py-0.2 rounded-xs">當前</span>
                      )}
                    </div>
                    <div className="mt-1.5 font-jost text-base font-bold text-[#1A2A22]">
                      {item.priceMan.toLocaleString()}
                      <span className="ml-0.5 text-[10px] font-normal text-zinc-500">萬円</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-[#EEF2F0]">
                      <span>表面利回</span>
                      <span className="font-bold text-[#007D5A]">{item.yieldRate}%</span>
                    </div>
                    {item.source === "official_transaction" && item.sampleCount > 0 && (
                      <div className="mt-0.5 text-[9px] text-zinc-400">
                        {item.sampleCount} 筆樣本
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 國交省成約統計實務指南（動態適配地區） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="border border-[#E3ECE7] bg-[#F9FBFA] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                <Footprints className="w-3.5 h-3.5 text-[#007D5A]" />
                <span>{insight.stationWalkTitle}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-600">
                {insight.stationWalkText}
              </p>
            </div>

            <div className="border border-[#E3ECE7] bg-[#F9FBFA] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                <Building2 className="w-3.5 h-3.5 text-[#007D5A]" />
                <span>{insight.buildingAgeTitle}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-600">
                {insight.buildingAgeText}
              </p>
            </div>
          </div>

          {/* Linus 實務觀點提示（動態適配地區與當前數據） */}
          <div className="border-l-4 border-[#007D5A] bg-[#F5F8F6] p-3 text-xs leading-relaxed text-[#1A2A22]">
            <div className="flex items-center gap-1.5 font-bold text-[#007D5A] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{insight.consultantTitle}</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              {insight.consultantText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
