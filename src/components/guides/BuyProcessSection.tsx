import { FileText, MapPin } from "lucide-react";
import {
buyHouseCashSteps, buyHouseLoanSteps, signingDocuments
} from "../../data/buyHouseData";
import { SectionHeading } from "../SectionHeading";

interface Props {
  isBuySearchActive: boolean;
  buyCategory: string;
  isStepOpen: (key: string) => boolean;
  toggleStep: (key: string) => void;
  setSelectedFlowType: (t: "cash" | "loan") => void;
  selectedFlowType: "cash" | "loan";
}
export function BuyProcessSection({ isBuySearchActive, buyCategory, isStepOpen, toggleStep, setSelectedFlowType, selectedFlowType }: Props) {
  return (<>{!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <div className="space-y-6">
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 md:p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={MapPin}
                      title="日本買房交易完整流程"
                      description="全款與貸款兩條路：掌握出價、審查到交屋的時間節奏，安心完成跨國置產。"
                      open={isStepOpen("flow")}
                      onToggle={() => toggleStep("flow")}
                      action={
                        /* Flow Type Switcher */
                        <div className="flex w-full border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1 font-sans text-xs md:w-auto">
                        <button
                          onClick={() => setSelectedFlowType("cash")}
                          className={`flex-1 px-4 py-2 font-bold cursor-pointer transition-all md:flex-none ${
                            selectedFlowType === "cash"
                              ? "bg-[#00a174] text-white"
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          現金全款交易流程
                        </button>
                        <button
                          onClick={() => setSelectedFlowType("loan")}
                          className={`flex-1 px-4 py-2 font-bold cursor-pointer transition-all md:flex-none ${
                            selectedFlowType === "loan"
                              ? "bg-[#00a174] text-white"
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          銀行貸款交易流程
                        </button>
                        </div>
                      }
                    />

                    {/* Render Stepper */}
                    {isStepOpen("flow") && (
                    <div className="space-y-6">
                      {selectedFlowType === "cash" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          {buyHouseCashSteps.map((step, sIdx) => (
                            <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                              <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">{step.step}</span>
                                <span>{step.title}</span>
                              </h4>
                              <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                {step.description}
                              </p>
                              <div className="mt-4 grid gap-2 border-t border-dashed border-zinc-300 pt-3 font-sans text-[11px] leading-relaxed">
                                {step.timing && <p><strong className="text-[#007d5a]">時間｜</strong>{step.timing}</p>}
                                {step.payment && <p><strong className="text-[#007d5a]">付款｜</strong>{step.payment}</p>}
                                {step.documents && <p><strong className="text-[#007d5a]">文件｜</strong>{step.documents}</p>}
                              </div>
                              {step.warning && (
                                <p className="mt-2 text-[11px] text-[#00a174] bg-red-50 p-2 border-l-2 border-[#00a174] leading-normal font-sans">
                                  {step.warning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {buyHouseLoanSteps.map((step, sIdx) => (
                              <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                                <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                  <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">{step.step}</span>
                                  <span>{step.title}</span>
                                </h4>
                                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                  {step.description}
                                </p>
                                <div className="mt-4 grid gap-2 border-t border-dashed border-zinc-300 pt-3 font-sans text-[11px] leading-relaxed">
                                  {step.timing && <p><strong className="text-[#007d5a]">時間｜</strong>{step.timing}</p>}
                                  {step.payment && <p><strong className="text-[#007d5a]">付款｜</strong>{step.payment}</p>}
                                  {step.documents && <p><strong className="text-[#007d5a]">文件｜</strong>{step.documents}</p>}
                                </div>
                                {step.warning && (
                                  <p className="mt-2 text-[11px] text-[#00a174] bg-red-50 p-2 border-l-2 border-[#00a174] leading-normal font-sans">
                                    {step.warning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </section>

                  {/* Signing documents requirements */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 md:p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={FileText}
                      title={signingDocuments.title}
                      description="清單式整理台日身分必備文件！按身分與付款方式超前部署，過戶登記不卡關。"
                      open={isStepOpen("documents")}
                      onToggle={() => toggleStep("documents")}
                    />

                    {isStepOpen("documents") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#00a174] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#00a174]"></span>
                          <span>{signingDocuments.residenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.residenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#00a174] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#00a174]"></span>
                          <span>{signingDocuments.nonResidenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.nonResidenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    )}
                  </section>
                </div>
              )}</>);
}
