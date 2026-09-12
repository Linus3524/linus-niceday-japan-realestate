import {
ChevronDown,
Lightbulb,
Receipt,
Smile,
Sparkles
} from "lucide-react";
import { getBuyModifier } from "../../data/buyHouseData";
import { getOfficialBuyEstimate } from "../../data/buyMarket";
import { districtStations } from "../../data/housingMarket";
import { MLIT_API_CREDIT } from "../../data/marketDataSources";
import { getBudgetModifier } from "../../data/rentGuideData";
import type { CalculatorViewModel } from '../../hooks/useCalculatorController';
import {
getDynamicBuyModifierMultiplier
} from "../../lib/calcRules";
import { formatManYen } from '../../lib/calculator/formatters';
import {
rentSearchFilterOptions
} from '../../lib/calculator/options';
import { calculateRentUpfrontBudget } from '../../lib/calculator/upfrontBudget';
import { renderFormattedText } from "../../lib/format";
import {
ROOM_TYPE_LABEL
} from "../../lib/rentAnalysis";
import { toJapaneseStationName } from "../../lib/transit";

interface AdvancedCalculatorResultsProps {
  model: Pick<
    CalculatorViewModel,
    | "calcMode"
    | "getSelectedDistrictData"
    | "getCalculatedRent"
    | "districtDisplayName"
    | "calcRoomType"
    | "calcStation"
    | "stationDisplayName"
    | "calcDistrict"
    | "getModifierPrice"
    | "calcModifiers"
    | "getAvailabilityAssessment"
    | "rentSearchFilters"
    | "rentUpfrontCash"
    | "setShowInitialFeeDetails"
    | "showInitialFeeDetails"
    | "guidedCommuteStation"
    | "guidedCommuteMinutes"
    | "guidedVisaType"
    | "guidedApplicationChannel"
    | "handleTabChange"
    | "handleSendMessage"
    | "getCalculatedBuyPrice"
    | "getDistrictBuyPrice"
    | "calcBuyModifiers"
    | "setShowBuyFeeDetails"
    | "showBuyFeeDetails"
    | "loanRatio"
    | "setLoanRatio"
    | "annualRate"
    | "setAnnualRate"
    | "loanYears"
    | "setLoanYears"
    | "getMonthlyPayment"
    | "aiResult"
  >;
}

export function AdvancedCalculatorResults({ model }: AdvancedCalculatorResultsProps) {
  const {
    calcMode,
    getSelectedDistrictData,
    getCalculatedRent,
    districtDisplayName,
    calcRoomType,
    calcStation,
    stationDisplayName,
    calcDistrict,
    getModifierPrice,
    calcModifiers,
    getAvailabilityAssessment,
    rentSearchFilters,
    rentUpfrontCash,
    setShowInitialFeeDetails,
    showInitialFeeDetails,
    guidedCommuteStation,
    guidedCommuteMinutes,
    guidedVisaType,
    guidedApplicationChannel,
    handleTabChange,
    handleSendMessage,
    getCalculatedBuyPrice,
    getDistrictBuyPrice,
    calcBuyModifiers,
    setShowBuyFeeDetails,
    showBuyFeeDetails,
    loanRatio,
    setLoanRatio,
    annualRate,
    setAnnualRate,
    loanYears,
    setLoanYears,
    getMonthlyPayment,
    aiResult,
  } = model;
  return (<div className="xl:col-span-5 xl:sticky xl:top-8 space-y-6">
    {/* Results Display */}
    <div className="border border-[#1A2A22] bg-white p-6 relative">
      <div className="absolute top-0 right-4 bg-[#00a174] text-white px-2.5 py-0.5 text-xs select-none font-sans flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-white" />
        <span>精算結果</span>
      </div>

      {calcMode === "rent" ? (
        <>
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
            {getSelectedDistrictData().sourceDate || "最新"} 市場推估房租預算：
          </h4>

          {/* The Big Number */}
          <div className="border-b border-[#1A2A22] pb-4 mb-4">
            <div className="flex items-baseline gap-1 font-sans">
              <span className="text-3xl md:text-4xl font-extrabold text-[#00a174] tracking-tight font-mono">
                {getCalculatedRent().toLocaleString()}
              </span>
              <span className="text-base font-bold text-[#1A2A22]">日圓 / 月</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
              約合 <strong>{(getCalculatedRent() / 10000).toFixed(1)}</strong> 萬日圓／月
            </div>
          </div>

          {/* Breakdown details */}
          <div className="space-y-3.5 text-xs font-sans">
            <div>
              <span className="text-zinc-500 block">所選基本平均租金 (<span lang="ja" className="font-jp">{districtDisplayName}</span>)：</span>
              <span className="font-bold text-zinc-800 font-mono">
                {(parseFloat(getSelectedDistrictData()[calcRoomType as keyof typeof getSelectedDistrictData] as string) * 10000).toLocaleString()} 円
              </span>
            </div>

            {calcStation !== "none" && (
              <div className="flex justify-between items-baseline border-t border-[#E1E6E3] pt-3 font-sans">
                <span className="text-zinc-500">周邊站點溢折價 (<span lang="ja" className="font-jp">{stationDisplayName}駅</span>)：</span>
                {(() => {
                  const currentStation = (districtStations[calcDistrict] || []).find(s => s.name === calcStation);
                  if (!currentStation) return null;
                  let price = 0;
                  if (currentStation.type === "major") price = 10000;
                  else if (currentStation.type === "regular") price = 5000;
                  else if (currentStation.type === "minor") price = -5000;

                  const adjustedPrice = getModifierPrice(price);
                  return (
                    <span className={`font-bold font-mono ${adjustedPrice >= 0 ? "text-[#00a174]" : "text-[#B13818]"}`}>
                      {adjustedPrice >= 0 ? "+ " : "− "}
                      {Math.abs(adjustedPrice).toLocaleString()} 円
                    </span>
                  );
                })()}
              </div>
            )}

            {calcModifiers.length > 0 && (() => {
              const modifierSubtotal = calcModifiers.reduce(
                (total, id) => total + getModifierPrice(getBudgetModifier(id)?.price || 0, id),
                0
              );
              return (
                <div className="space-y-2 border-t border-[#E1E6E3] pt-3">
                  <div className="flex justify-between items-baseline font-sans">
                    <span className="text-zinc-500">條件調整小計：</span>
                    <span className={`font-bold font-mono ${modifierSubtotal >= 0
                        ? "text-[#00a174]"
                        : "text-[#B13818]"
                      }`}>
                      {modifierSubtotal >= 0 ? "+ " : "− "}
                      {Math.abs(modifierSubtotal).toLocaleString()} 円
                    </span>
                  </div>
                  <div className="divide-y divide-[#E1E6E3] border-y border-[#E1E6E3] text-[11px] leading-relaxed">
                    {calcModifiers.map((id) => {
                      const mod = getBudgetModifier(id);
                      if (!mod) return null;
                      const adjustedPrice = getModifierPrice(mod.price, mod.id);
                      const isPlus = mod.type === "plus";
                      return (
                        <div key={id} className={`flex items-start justify-between gap-2 px-2 py-1.5 ${isPlus ? "bg-[#F1FAF7]" : "bg-[#FFF6F1]"}`}>
                          <span className="flex min-w-0 items-start gap-1.5 break-all text-zinc-700">
                            <span className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold ${isPlus ? "bg-[#DDF4EC] text-[#007D5A]" : "bg-[#FBE4D9] text-[#B13818]"}`}>
                              {isPlus ? "+" : "−"}
                            </span>
                            <span>{mod.text}</span>
                          </span>
                          <span className={`shrink-0 font-mono font-medium ${isPlus ? "text-[#008C68]" : "text-[#B13818]"}`}>
                            {isPlus ? "+ " : "− "}
                            {Math.abs(adjustedPrice).toLocaleString()} 円
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Relative listing supply and competition assessment */}
            {(() => {
              const assessment = getAvailabilityAssessment();
              return (
                <div className="border-t border-[#D4DDD8] pt-4">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <span className="block font-bold text-[#00a174]">房源供給與競爭評估</span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-[#66736C]">依地區熱度、房型與已勾選條件推估相對找房難度</span>
                    </div>
                    <span className="shrink-0 border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-1 text-[9px] font-bold text-[#3F5147]">篩選 {assessment.selectedCount}・租金條件 {assessment.modifierCount}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border border-[#DDE3DF] bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#66736C]">符合條件的房源量</span>
                        <span className={`text-xs font-bold ${assessment.supply.tone}`}>{assessment.supply.label}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden bg-[#EDF1EE]">
                        <div className={`h-full bg-[#00a174] ${assessment.supply.width}`} />
                      </div>
                    </div>
                    <div className="border border-[#DDE3DF] bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#66736C]">熱門物件競爭程度</span>
                        <span className={`text-xs font-bold ${assessment.competition.tone}`}>{assessment.competition.label}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden bg-[#EDF1EE]">
                        <div className={`h-full bg-[#E94E2B] ${assessment.competition.width}`} />
                      </div>
                    </div>
                  </div>
                  {assessment.limitingConditions.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-bold text-[#3F5147]">主要限縮條件</span>
                      {assessment.limitingConditions.map(condition => (
                        <span key={condition} className="border border-[#DCC8A1] bg-[#FFF9ED] px-2 py-1 text-[9px] font-bold text-[#7A5A1F]">{condition}</span>
                      ))}
                    </div>
                  )}
                  {assessment.expandingConditions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-bold text-[#3F5147]">擴大供給條件</span>
                      {assessment.expandingConditions.map(condition => (
                        <span key={condition} className="border border-[#9ee2cf] bg-[#e6f6f1] px-2 py-1 text-[9px] font-bold text-[#007d5a]">{condition}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 border-l-2 border-[#00a174] bg-[#F5F8F6] px-3 py-2.5 text-[10px] leading-relaxed text-[#3F5147]">{assessment.advice}</p>
                </div>
              );
            })()}

            {/* Estimation of Initial Fees */}
            <div className="border-t border-[#D4DDD8] pt-4">
              <span className="text-[#00a174] font-bold flex items-center gap-1.5 mb-2">
                <Receipt className="w-4 h-4 text-[#00a174] shrink-0" />
                <span>建議準備的初期費用</span>
              </span>
              {(() => {
                const { monthlyRent, recommendedMultiplier, recommendedCash, cashGap, reasons } = calculateRentUpfrontBudget({
                  getCalculatedRent,
                  getSelectedDistrictData,
                  calcDistrict,
                  calcStation,
                  calcRoomType,
                  calcModifiers,
                  rentSearchFilters,
                  rentUpfrontCash,
                  districtDisplayName,
                });

                return (
                  <div className="border border-zinc-200 bg-[#FAFCFB] p-3 font-sans">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-[#66736C]">
                          {recommendedMultiplier === 6 ? "目前條件較多，建議先抓" : recommendedMultiplier === 4 ? "免禮金／免押金優惠情境" : "一般準備基準"}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#1A2A22]">租金 × {recommendedMultiplier}</p>
                      </div>
                      <strong className="font-mono text-lg text-[#008C68]">¥{recommendedCash.toLocaleString()}</strong>
                    </div>

                    <p className="mt-2 border-t border-zinc-200 pt-2 text-[10px] leading-relaxed text-[#52635A]">
                      {reasons.length
                        ? reasons.join("；") + "。"
                        : "目前沒有明顯增加初期費用的特殊條件，先以一般物件的 5 倍準備較穩妥。"}
                    </p>

                    {rentUpfrontCash > 0 && (
                      <p className={`mt-2 text-[10px] font-bold ${cashGap > 0 ? "text-[#B13818]" : "text-[#007D5A]"}`}>
                        {cashGap > 0
                          ? `目前準備 ${formatManYen(rentUpfrontCash)}，距建議金額約差 ${formatManYen(cashGap)}。`
                          : `目前準備 ${formatManYen(rentUpfrontCash)}，可涵蓋這個建議金額。`}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowInitialFeeDetails(current => !current)}
                      aria-expanded={showInitialFeeDetails}
                      className="mt-3 flex w-full items-center justify-between border-t border-zinc-200 pt-2 text-left text-[10px] font-bold text-[#3F5147] hover:text-[#007D5A]"
                    >
                      <span>4／5／6 倍分別代表什麼？</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showInitialFeeDetails ? "rotate-180" : ""}`} />
                    </button>

                    {showInitialFeeDetails && (
                      <div className="mt-2 divide-y divide-zinc-200 border-t border-zinc-200 text-[10px] leading-relaxed text-[#52635A]">
                        <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                          <strong className="text-[#1A2A22]">4 倍</strong>
                          <span>優惠情境：熱門地區通常要同時遇到免禮金，並搭配免租、仲介費優惠或較低附帶費用，才較有機會接近。</span>
                          <span className="font-mono text-[#1A2A22]">¥{(monthlyRent * 4).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                          <strong className="text-[#007D5A]">5 倍</strong>
                          <span>一般情境：涵蓋起租租金、敷禮金、保證費、仲介費、保險與常見契約費用。</span>
                          <span className="font-mono text-[#007D5A]">¥{(monthlyRent * 5).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                          <strong className="text-[#7A5A1F]">6 倍</strong>
                          <span>費用較多：熱門物件有禮金，或另有寵物敷金、清潔、換鎖及其他指定費用時較接近此範圍。</span>
                          <span className="font-mono text-[#7A5A1F]">¥{(monthlyRent * 6).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-2 font-sans">
            <button
              onClick={() => {
                const roomTypeLabel = ROOM_TYPE_LABEL[calcRoomType];
                const stationPart = calcStation !== "none" ? `${calcStation}站附近` : "尚未指定車站";
                const upgradeConditions = calcModifiers.map(id => getBudgetModifier(id)).filter(mod => mod?.type === "plus").map(mod => mod!.text).join("、");
                const compromiseConditions = calcModifiers.map(id => getBudgetModifier(id)).filter(mod => mod?.type === "minus").map(mod => mod!.text).join("、");
                const searchFilters = rentSearchFilterOptions.filter(option => rentSearchFilters.includes(option.key)).map(option => option.label).join("、");
                const commuteCondition = guidedCommuteStation ? `${toJapaneseStationName(guidedCommuteStation)}駅，最長 ${guidedCommuteMinutes} 分鐘` : "尚未指定";
                const visaPart = guidedVisaType ? `- 在日身分／簽證：${guidedVisaType}\n` : "";
                const channelPart = `- 審查方式：${guidedApplicationChannel === "overseas" ? "海外跨國審查（人在海外先行預定）" : "日本境內審查（已在日）"}\n`;
                const messageText = `您好，我剛才使用租金預算計算器，請依以下完整條件協助我找房：\n- 地區：${calcDistrict}\n- 車站：${stationPart}\n- 通勤條件：${commuteCondition}\n- 格局：${roomTypeLabel}\n- 推估月租：¥${getCalculatedRent().toLocaleString()}\n${visaPart}${channelPart}${upgradeConditions ? `- 希望條件：${upgradeConditions}\n` : ""}${compromiseConditions ? `- 可接受的妥協：${compromiseConditions}\n` : ""}${searchFilters ? `- 房源篩選條件：${searchFilters}\n` : ""}請分析這組條件的找房難度、應優先保留與可放寬的項目，並告訴我還需要補充哪些資料。若要推薦即時房源，請先確認我的${guidedVisaType ? "" : "簽證、"}工作、收入、入住日期與居住人數，不要自行假設。`;
                handleTabChange("chat");
                handleSendMessage(undefined, messageText);
              }}
              className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#00a174] cursor-pointer text-xs uppercase transition-colors"
              id="calc-send-to-ai"
            >
              帶入此條件諮詢 AI 顧問 ➔
            </button>
          </div>

          {/* Rent Disclaimer：全卡只保留這一段，房源供給、初期費用等估算的方法論限制都收在這裡，不再逐段重複。 */}
          <div className="mt-4 border-t border-[#E1E6E3] pt-3 text-justify font-sans text-[10px] leading-relaxed text-zinc-400">
            ※ 行情模型估算；實際租金、供給與初期費用依當期募集物件為準。
          </div>
        </>
      ) : (
        <>
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
            條件式預算概算中心值：
          </h4>

          {/* The Big Number */}
          <div className="border-b border-[#1A2A22] pb-4 mb-4">
            <div className="flex items-baseline gap-1 font-sans">
              <span className="text-3xl md:text-4xl font-extrabold text-[#00a174] tracking-tight font-mono">
                {(getCalculatedBuyPrice() / 10000).toLocaleString()}
              </span>
              <span className="text-base font-bold text-[#1A2A22]">萬日圓</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
              （概算區間約 <strong>{(getCalculatedBuyPrice() * 0.85 / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>～<strong>{(getCalculatedBuyPrice() * 1.15 / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> 萬日圓；中心值不是鑑價或成交保證。）
            </div>
          </div>

          {/* Breakdown buy details */}
          <div className="space-y-4 text-xs font-sans">
            <div>
              <span className="text-zinc-500 block">
                {getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType)
                  ? "國交省交易資料基本總價"
                  : "租金收益率模型基本總價"} (<span lang="ja" className="font-jp">{districtDisplayName}</span>)：
              </span>
              <span className="font-bold text-zinc-800 font-mono">
                {(getDistrictBuyPrice(calcDistrict, calcRoomType) * 10000).toLocaleString()} 円 ({getDistrictBuyPrice(calcDistrict, calcRoomType)} 萬日圓)
              </span>
              {(() => {
                const estimate = getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType);
                return estimate ? (
                  <span className="mt-1 block text-[9px] leading-relaxed text-zinc-400">
                    近{estimate.windowQuarters === 4 ? "四" : "八"}季樣本 {estimate.sampleCount} 筆，期間 {estimate.periodStart}～{estimate.periodEnd}；採中位數後再套用所選條件。
                  </span>
                ) : (
                  <span className="mt-1 block text-[9px] leading-relaxed text-zinc-400">
                    此地區目前採用租金 ÷ 假設表面投報率的概算，不代表實際成交價格。
                  </span>
                );
              })()}
            </div>

            {calcBuyModifiers.length > 0 && (
              <div className="space-y-2 border-t border-[#E1E6E3] pt-3">
                <span className="text-zinc-500 block">條件調整清單：</span>
                <div className="divide-y divide-[#E1E6E3] border-y border-[#E1E6E3] text-[11px] leading-relaxed">
                  {calcBuyModifiers.map((id) => {
                    const mod = getBuyModifier(id);
                    if (!mod) return null;
                    const isPlus = mod.type === "plus";
                    const dynamicMult = getDynamicBuyModifierMultiplier(id, calcDistrict);
                    return (
                      <div key={id} className={`flex items-start justify-between gap-2 px-2 py-1.5 ${isPlus ? "bg-[#F1FAF7]" : "bg-[#FFF6F1]"}`}>
                        <span className="flex min-w-0 items-start gap-1.5 break-all font-sans text-zinc-700">
                          <span className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold ${isPlus ? "bg-[#DDF4EC] text-[#007D5A]" : "bg-[#FBE4D9] text-[#B13818]"}`}>
                            {isPlus ? "+" : "−"}
                          </span>
                          <span>{mod.text}</span>
                        </span>
                        <span className={`shrink-0 font-mono font-medium ${isPlus ? "text-[#008C68]" : "text-[#B13818]"}`}>
                          {isPlus ? "+ " : "− "}{Math.abs(dynamicMult * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Initial purchase fees section */}
            <div className="border-t border-[#D4DDD8] pt-3">
              <span className="text-[#00a174] font-bold flex items-center gap-1.5 mb-2">
                <Receipt className="w-4 h-4 text-[#00a174] shrink-0" />
                <span>購屋初期諸費用概算（一次性過戶費用）：</span>
              </span>
              <div className="bg-[#F5F8F6] border border-zinc-200">
                <div className="space-y-1.5 p-3">
                  <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                    <span>現金全款購置 (約總價 7%):</span>
                    <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.07 / 10000).toFixed(0)} 萬日圓</span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                    <span>申請貸款購置 (約總價 9%):</span>
                    <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.09 / 10000).toFixed(0)} 萬日圓</span>
                  </div>
                  <p className="mt-1 flex items-start gap-1 border-t border-zinc-200 pt-1.5 text-justify text-[10px] text-zinc-500">
                    <Lightbulb className="w-3.5 h-3.5 text-[#00a174] shrink-0 mt-0.5" />
                    <span>先以總價比例快速準備預算；展開後可查看費用組成與大致付款時間。</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBuyFeeDetails(current => !current)}
                  aria-expanded={showBuyFeeDetails}
                  className="flex w-full items-center justify-between border-t border-zinc-200 bg-white px-3 py-2.5 text-left text-[11px] font-bold text-[#31443A] hover:text-[#00a174]"
                >
                  <span>{showBuyFeeDetails ? "收合費用組成" : "展開費用組成"}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showBuyFeeDetails ? "rotate-180" : ""}`} />
                </button>
                {showBuyFeeDetails && (
                  <div className="grid gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-2">
                    {[
                      ["簽約時", "手付金、契約印紙稅；仲介費依媒介契約約定"],
                      ["交屋時", "尾款、仲介費、司法書士報酬、登錄免許稅及各項清算款"],
                      ["過戶後", "不動產取得稅通常於取得後另行收到通知"],
                      ["貸款案件", "銀行手續費、保證費、抵押權設定登記及保險費"],
                      ["大樓物件", "管理費、修繕積立金與固定資產稅等依交屋日清算"],
                      ["保險與個案費用", "火災／地震保險、估價、翻譯、海外送金等依案件發生"]
                    ].map(([label, description]) => (
                      <div key={label} className="bg-white p-3">
                        <strong className="block text-[10px] tracking-wide text-[#007d5a]">{label}</strong>
                        <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">{description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-zinc-400">
                7%／9%是整體準備預算的概算，不代表每項費用固定按房價比例計算；實際金額會依成交型態、評價額、貸款方案與特例資格改變。
              </p>
            </div>

            {/* Loan payments section */}
            <div className="border-t border-[#D4DDD8] pt-3">
              <span className="text-[#00a174] font-bold block mb-1">銀行貸款與月還款額試算：</span>
              <div className="bg-zinc-50 p-3 border border-zinc-200 space-y-1.5">
                <div className="mb-2 grid grid-cols-3 gap-2 border-b border-zinc-200 pb-2">
                  <label className="text-[10px] text-zinc-600">貸款成數 (%)
                    <input type="number" min="0" max="100" step="5" value={loanRatio} onChange={e => setLoanRatio(Math.min(100, Math.max(0, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[10px] text-zinc-600">年利率 (%)
                    <input type="number" min="0" max="20" step="0.1" value={annualRate} onChange={e => setAnnualRate(Math.min(20, Math.max(0, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                  </label>
                  <label className="text-[10px] text-zinc-600">貸款年限
                    <input type="number" min="1" max="50" step="1" value={loanYears} onChange={e => setLoanYears(Math.min(50, Math.max(1, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                  </label>
                </div>
                <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                  <span>首期自備款 ({100 - loanRatio}%):</span>
                  <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * (1 - loanRatio / 100) / 10000).toFixed(0)} 萬日圓</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                  <span>銀行貸款金額 ({loanRatio}%):</span>
                  <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * loanRatio / 100 / 10000).toFixed(0)} 萬日圓</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1.5 text-[11px] font-bold text-[#00a174] md:text-xs">
                  <span>每月本息試算 ({annualRate}%／{loanYears}年):</span>
                  <span className="font-mono text-[#00a174]">{getMonthlyPayment(getCalculatedBuyPrice()).toLocaleString()} 円 / 月</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 text-justify">
                  本試算採本息平均攤還，不含寬限期、銀行手續費、保證費、提前清償費或利率變動。可自行調整參數；是否核貸與實際條件由金融機構個案審査。
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-2 font-sans">
            <button
              onClick={() => {
                const buyConditions = calcBuyModifiers.map(id => getBuyModifier(id)?.text).filter(Boolean).join("、");
                const messageText = `您好，我剛才使用買房預算計算器，請依以下完整條件協助我評估：\n- 地區：${calcDistrict}\n- 估計物件總價：${(getCalculatedBuyPrice() / 10000).toFixed(0)} 萬日圓\n- 預計貸款比例：${loanRatio}%\n- 試算利率與年期：${annualRate}%／${loanYears} 年\n${buyConditions ? `- 已選條件：${buyConditions}\n` : ""}請分析這組條件的買房可行性、貸款與初期費用風險，以及我還需要補充哪些個人與物件資料。`;
                handleTabChange("chat");
                handleSendMessage(undefined, messageText);
              }}
              className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#00a174] cursor-pointer text-xs uppercase transition-colors"
              id="calc-send-to-ai"
            >
              帶入此條件諮詢 AI 顧問 ➔
            </button>
          </div>

          {/* Buy Disclaimer */}
          <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-sans leading-relaxed text-justify">
            {getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType) ? (
              <>
                * 方法與限制：中心值使用國交省交易資料的行政區／間取り中位數，再套用條件係數；不是銀行鑑價或成交保證。±15% 僅為閱讀概算的波動帶。<br />
                <span lang="ja">{MLIT_API_CREDIT}</span>
              </>
            ) : (
              <>* 方法與限制：總價以區域租金基準 ÷ 假設表面投報率，再套用實務折溢價係數估算；不是實際成交統計或銀行鑑價。±15% 僅為閱讀概算的波動帶；實際價格還會受面積、樓層、座向、權利、管理、修繕、災害風險及交易背景影響。</>
            )}
          </div>
        </>
      )}
    </div>

    {/* Calculator Guide Card */}
    {(calcMode === "buy" || aiResult?.advisorAdvice) && <div className="bg-white border border-[#1A2A22] p-5 space-y-3 font-sans">
      <h5 className="font-bold text-sm text-[#1A2A22] flex items-center gap-1.5">
        <Smile className="w-4.5 h-4.5 text-[#00a174]" />
        {calcMode === "rent" ? (
          <span>Linus AI 顧問意見</span>
        ) : (
          <span>Linus 實務置產提示</span>
        )}
      </h5>
      <div className="text-xs text-zinc-600 space-y-2.5 font-sans leading-relaxed">
        {calcMode === "rent" ? (
          <div className="space-y-1 text-[11px] leading-relaxed text-[#3F5147]">
            {renderFormattedText(aiResult?.advisorAdvice || "")}
          </div>
        ) : (
          <>
            <p>
              <strong>關於買房折溢價與實務：</strong>
            </p>
            <p className="text-justify leading-relaxed">
              在日本置產，<strong>「全新 (新築)」</strong>建案存在極高造價與品牌溢價，若一購入往往會立刻產生折舊。相比之下，屋齡在 15~25 年且進行過<strong>「全面現代化翻新 (リノベーション済み)」</strong>的中古公寓 (中古マンション)，內部裝潢、廚衛設備更與新成屋無異，具備最高的性價比與投資回報率！
            </p>
            <p className="text-justify leading-relaxed">
              此外，<strong>「帶租約出售（オーナーチェンジ）」</strong>的投資房，因承接既有租約、通常不能進入室內確認，且過戶後不能立即收回自住，市場價格往往會低於同條件的空屋。購入前應一併確認現行租金、租客與契約內容、修繕紀錄及未來空置風險，並以長期純收租的前提評估。
            </p>
          </>
        )}
      </div>
    </div>}
  </div>);
}
