import {
  Building,
  Calculator,
  ChevronDown,
  FileSearch,
  Landmark,
  MapPin,
  Sparkles
} from "lucide-react";
import { useCalculatorController } from '../hooks/useCalculatorController';
import { AdvancedCalculatorInputs } from './calculator/AdvancedCalculatorInputs';
import { AdvancedCalculatorResults } from './calculator/AdvancedCalculatorResults';
import { BuyBudgetPanel } from './calculator/BuyBudgetPanel';
import { GuidedRentForm } from './calculator/GuidedRentForm';

import { motion } from "motion/react";

import type { CalculatorTabProps } from '../lib/calculator/types';

import { ErrorBoundary } from "./ErrorBoundary";

import { ListingHealthCheck } from "./ListingHealthCheck";

import { PageIntroCard } from "./PageIntroCard";

import { RentCriteriaSummary } from "./RentCriteriaSummary";

import { RentMarketReports } from "./RentMarketReports";

export function CalculatorTab(props: CalculatorTabProps) {
  const model = useCalculatorController(props);
  const {
    setCalcMode,
    calcMode,
    rentInputMode,
    aiResult,
    applyRecommendationToCalculator,
    appliedNotice,
    setShowAdvancedTools,
    showAdvancedTools,
  } = model;
  return (
            <motion.div
              key="calculator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-calculator"
            >
              {/* Rent vs Buy vs Listing switcher */}
              <div className="flex border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1" id="calc-mode-switcher font-sans">
                <button
                  onClick={() => setCalcMode("rent")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "rent"
                      ? "bg-[#00a174] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  租屋預算健檢
                </button>
                <button
                  onClick={() => setCalcMode("buy")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "buy"
                      ? "bg-[#00a174] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  買房資金試算
                </button>
                <button
                  onClick={() => setCalcMode("listing")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "listing"
                      ? "bg-[#00a174] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  物件圖紙分析
                </button>
              </div>

              {/* Preface Intro for Calc */}
              <PageIntroCard
                id="calc-intro"
                icon={calcMode === "listing" ? FileSearch : Calculator}
                title={
                  calcMode === "listing"
                    ? "日本不動產圖紙深度解析"
                    : calcMode === "rent"
                    ? "日本租屋預算與條件評估"
                    : "日本買房總價與貸款評估"
                }
                sourceNote={
                  calcMode === "listing"
                    ? "資料來源：日本國土交通省 不動產資訊資料庫（不動産情報ライブラリ）成交實價、At Home 公開數據、國土地理院與 OpenStreetMap"
                    : calcMode === "rent"
                    ? "資料來源：At Home 公開租金行情、第一線租賃實務數據"
                    : "資料來源：日本國土交通省 不動產資訊資料庫（不動産情報ライブラリ）中古公寓成交實價"
                }
              >
                {calcMode === "listing" ? (
                  <>
                    <p>
                      剛拿到仲介提供的物件圖紙（図面），想更清楚掌握各項細節嗎？只要上傳單張圖檔或 PDF，系統會自動辨識物件類型，為您客觀整理出關鍵數據與條款重點。
                    </p>
                    <p>
                      <strong>買賣物件</strong>：比對日本國土交通省周邊實價登錄行情，換算台灣習慣的每坪單價；協助整理每月管理費與修繕積立金（修繕積立金）負擔、檢視社區規模與修繕基金充足度，並客觀試算實質投報率與交屋初期費用。<br />
                      <strong>租賃物件</strong>：評估租金合理區間、試算入住初期費用（初期費用），提醒敷引（押金不退還）等特殊特約條款注意事項，並同步標示周邊生活圈與通勤路線。
                    </p>
                  </>
                ) : calcMode === "rent" ? (
                  <>
                    <p>
                      找房最怕看了一圈才發現超出預算。這個工具能陪您將月租、格局與生活需求整合評估，找出真正容易租到的理想方向。
                    </p>
                    <p>
                      估算結合了 At Home 公開刊登行情與第一線實務經驗（包含屋齡、設備、車站距離等細節），不只呈現合理月租與初期費用，還會提醒哪些條件可能讓可選房源變少，讓您在正式找房前就能心中有數、做好取捨。
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      買房除了看總價，更要算清楚手頭的現金、各項交易費用與每月還款壓力，才不會讓生活負擔過重。
                    </p>
                    <p>
                      這裡能快速幫您整理出適合的購屋預算區間，並直接對照日本國土交通省的中古公寓實際成交行情。讓您不只清楚「能買多少」，也知道「心儀地區近期大概買在哪裡」，提早規劃自備款與格局，買得踏實又安心。
                    </p>
                  </>
                )}
              </PageIntroCard>

              <div hidden={calcMode !== "listing"}>
                <ErrorBoundary
                  fallbackTitle="圖紙健檢功能暫時無法載入"
                  fallbackMessage="圖紙分析功能在載入時遇到暫時性問題，請點擊重試。"
                >
                  <ListingHealthCheck />
                </ErrorBoundary>
              </div>

              <div hidden={calcMode === "listing"}>

              {/* Quick budget health check */}
              <section className="border border-[#1A2A22] bg-white" aria-label={calcMode === "rent" ? "租屋需求與市場分析" : "購屋預算快速試算"}>
                {calcMode === "buy" && (
                  <div className="border-b border-[#9ee2cf] bg-[#e6f6f1] px-5 py-4 text-[#1A2A22] md:px-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174] font-sans">
                      <Calculator className="h-4 w-4" /> Quick Budget Check
                    </div>
                    <h3 className="mt-1 text-lg font-bold md:text-xl">先確認自備現金與每月還款</h3>
                  </div>
                )}

                {calcMode === "rent" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <GuidedRentForm model={model} />

                    <div className="p-5 lg:col-span-7 md:p-8">
                      {rentInputMode === "ai" ? (
                        !aiResult ? (
                          <div className="flex min-h-[360px] h-full items-center justify-center py-10 text-center">
                            <div className="max-w-sm">
                              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#9ee2cf] bg-[#F5F8F6]">
                                <MapPin className="h-5 w-5 text-[#00a174]" />
                              </div>
                              <p className="mb-2 font-bold text-[#1A2A22]">分析後會依符合度列出合適車站</p>
                              <p className="text-xs leading-relaxed text-[#8A9590] font-sans">包含地區／車站、估算中心值、合理波動區間，以及與預算的落差。</p>
                            </div>
                          </div>
                        ) : (
                          <div id="guided-rent-results" className="scroll-mt-24">
                            <RentCriteriaSummary criteria={aiResult.criteria} />
                            <RentMarketReports
                              recommendations={aiResult.recommendations}
                              criteria={aiResult.criteria}
                              onApply={item => applyRecommendationToCalculator(item, aiResult.criteria)}
                            />
                            {appliedNotice && (
                              <p className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] px-3 py-2 text-xs font-bold text-[#007d5a] font-sans" role="status">
                                {appliedNotice}
                              </p>
                            )}
                          </div>
                        )
                      ) : (
                        <>
                          {!aiResult ? (
                            <div className="flex min-h-[360px] items-center justify-center py-10 text-center">
                              <div className="max-w-sm">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#9ee2cf] bg-[#F5F8F6]">
                                  <MapPin className="h-5 w-5 text-[#00a174]" />
                                </div>
                                <p className="mb-2 font-bold text-[#1A2A22]">分析後會依符合度列出合適車站</p>
                                <p className="text-xs leading-relaxed text-[#8A9590]">先在左側完成條件；可行性判讀會顯示在表單下方，這裡專心呈現推薦車站。</p>
                              </div>
                            </div>
                          ) : (
                            <div id="guided-rent-results" className="scroll-mt-24">
                              <RentCriteriaSummary criteria={aiResult.criteria} />
                              <RentMarketReports
                                recommendations={aiResult.recommendations}
                                criteria={aiResult.criteria}
                                onApply={item => applyRecommendationToCalculator(item, aiResult.criteria)}
                              />
                              {appliedNotice && (
                                <p className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] px-3 py-2 text-xs font-bold text-[#007d5a]" role="status">{appliedNotice}</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <BuyBudgetPanel model={model} />
                )}
              </section>

              <div className="flex flex-col gap-3 border border-[#DDE3DF] bg-[#FAFCFB] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1A2A22]">
                    {calcMode === "rent" ? "查看租屋試算與詳細計算明細" : "查看買房試算與詳細計算明細"}
                  </p>
                  <p className="mt-1 text-[10px] text-[#66736C]">
                    {calcMode === "rent"
                      ? "上方選好的條件會同步到這裡，可再檢查租金加減價與初期費用。"
                      : "上方選好的條件會同步到這裡，可再檢查總價加減價、初期費用與貸款假設。"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedTools(current => !current)}
                  aria-expanded={showAdvancedTools}
                  className="flex min-h-10 items-center justify-center gap-2 border border-[#1A2A22] bg-white px-4 text-xs font-bold text-[#1A2A22] hover:border-[#00a174] hover:text-[#00a174]"
                >
                  {showAdvancedTools ? "收起計算明細" : "展開計算明細"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedTools ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Multi-grid calculator interface */}
              {showAdvancedTools && <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start" id="calc-engine-container">
                {/* Inputs area (Left 7 Columns) */}
                <AdvancedCalculatorInputs model={model} />

                {/* Calculation Output (Right 5 Columns) - Sticky visual layout */}
                <AdvancedCalculatorResults model={model} />
              </div>}
              </div>
        </motion.div>
  );
}
