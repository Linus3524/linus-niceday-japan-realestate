import { ChevronDown, FileText, TrainFront } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type * as React from 'react';
import {
applicationRoutes,
domesticSop,
overseasSop,
processReminders
} from "../../data/rentStaticSearchData";
import { renderFormattedText } from "../../lib/format";

interface Props {
  isSearchActive: boolean;
  showProcessSection: boolean;
  showSop: boolean;
  showDocuments: boolean;
  setDocumentsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isDocumentSearchResult: boolean;
  isDocumentsOpen: boolean;
  searchQuery: string;
  showRoutes: boolean;
  filtered: { fees: import("../../data/rentGuideData").InitialFeeItem[]; terms: import("../../data/rentGuideData").SpecialTermItem[]; steps: import("../../data/rentGuideData").ProcessStep[]; qa: import("../../data/rentGuideData").QAItem[]; };
  showReminders: boolean;
  VisaDocumentMatrix: ({ searchQuery }: { searchQuery?: string; }) => React.JSX.Element;
}
const stepTitle = (name: string) => name.replace(/^[①②③④⑤⑥⑦⑧⑨]\s*/, "");

// 作業天數 → 天數範圍（甘特圖用）：「2 - 5 工作日」→ [2, 5]；入住後才做的步驟回傳 null，另外標在入住日之後
const dayRange = (duration: string): [number, number] | null => {
  if (/入住後/.test(duration)) return null;
  const n = duration.replace(/[（(].*$/, "").match(/\d+/g)?.map(Number) ?? [1];
  return [n[0], n[1] ?? n[0]];
};
const STAMP_KEY = "rent-steps-stamps";
const readStamps = (): string[] => { try { return JSON.parse(localStorage.getItem(STAMP_KEY) ?? "[]"); } catch { return []; } };

/** 電腦版：上方「集章進度＋時程甘特圖」總覽，下方「電車路線圖」——小電車跟著捲動停在讀到的那一站，每站可以蓋章（手機版仍是直式時間軸） */
function StepsDesk({ steps }: { steps: Props["filtered"]["steps"] }) {
  const [stamps, setStamps] = useState<string[]>(readStamps);
  const [current, setCurrent] = useState(steps[0]?.id ?? "1");
  const [trainTop, setTrainTop] = useState(0);
  // 時程估算：fast＝免房東審查（直接跳過那一步）、normal＝一般（每步照最快天數）、slow＝每步都拖到最慢
  const [mode, setMode] = useState<"fast" | "normal" | "slow">("normal");
  const slow = mode === "slow";
  const isSkipped = (name: string) => mode === "fast" && /房東/.test(name);
  const stations = useRef<Record<string, HTMLLIElement | null>>({});

  const toggle = (id: string) => setStamps(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    try { localStorage.setItem(STAMP_KEY, JSON.stringify(next)); } catch { /* 無痕模式等：只是不記住 */ }
    return next;
  });
  const goTo = (id: string) => stations.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });

  // 讀到哪一站：站牌頂端已經過了判定線的最後一站
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // 捲動容器：往上找第一個真的能捲動的祖先（只看 overflow 不夠：overflow-x: hidden 會讓 overflow-y 變成 auto）
    const findScroller = () => {
      let el = root.current?.parentElement ?? null;
      while (el && !(/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1)) el = el.parentElement;
      return el;
    };
    const update = () => {
      const scroller = findScroller();
      const view = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      // 判定線平常在畫面 40% 高；快捲到底時慢慢往下移到畫面底部，最後幾站（領鑰匙、屋況檢查）才輪得到、不會被跳過
      const remaining = scroller ? scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight : document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      const near = Math.min(1, Math.max(0, 1 - remaining / (view.height * 1.4)));
      const line = view.top + view.height * (0.4 + 0.55 * near);
      let pick = steps[0]?.id ?? "1";
      for (const st of steps) {
        const el = stations.current[st.id];
        if (el && el.getBoundingClientRect().top <= line) pick = st.id;
      }
      setCurrent(pick);
    };
    update();
    // scroll 事件不會冒泡，用捕獲階段在 document 上一次接住所有容器的捲動
    document.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    return () => { document.removeEventListener("scroll", update, { capture: true }); window.removeEventListener("resize", update); };
  }, [steps]);
  useEffect(() => { setTrainTop(stations.current[current]?.offsetTop ?? 0); }, [current, steps]);

  // 甘特圖：每一步接在前一步完成之後開始。「通常」照最快天數接下去；切到「如果都拖到」就照最慢天數接，後面每一步跟著往後推。
  // 入住後才做的步驟（屋況檢查）從拿到鑰匙那天開始畫，淺紅色
  let cursor = 0;
  const pre = steps.map(step => {
    const r = dayRange(step.duration);
    if (!r) return null;
    // 免房東審查：那一列保留，天數當 0（條的位置照樣接在前一步後面，只是沒有長度）
    const bar = { id: step.id, r: (isSkipped(step.name) ? [0, 0] : r) as [number, number], start: cursor };
    cursor += slow ? bar.r[1] : bar.r[0];
    return bar;
  });
  const moveIn = cursor;
  const after = steps.map(step => /入住後/.test(step.duration) ? (step.duration.match(/\d+/g)?.map(Number) ?? [14]) : null);
  const total = pre.reduce((t, b) => t + (b ? (slow ? b.r[1] : b.r[0]) : 0), 0);
  const bars = steps.map((step, k) => pre[k] ?? (after[k] ? { id: step.id, r: [after[k]![0], after[k]![1] ?? after[k]![0]] as [number, number], start: moveIn, after: true } : null));
  // 時間軸長度固定用「全部步驟都拖到」算，三種模式切換時刻度不會跳
  const high = steps.reduce((t, st) => t + (dayRange(st.duration)?.[1] ?? 0), 0);
  // 時間軸固定用「全部拖到」的長度（兩種模式切換時刻度不會跳），右邊再留 8 天給天數文字和入住後那一段
  const span = high + 8;
  const pctOf = (d: number) => `${(d / span) * 100}%`;
  // 橫軸刻度：每 5 天一格
  const ticks = Array.from({ length: Math.floor(span / 5) + 1 }, (_, i) => i * 5);
  const done = steps.filter(s => stamps.includes(s.id)).length;

  return (
    <div className="rent-steps-desk" ref={root}>
      <div className="rent-steps-overview">
        <div className="rent-stampbook">
          <div className="rent-stampbook-head">
            <div>
              <span className="rent-stampbook-en">RENT STAMP RALLY</span>
              <span className="rent-stampbook-title">租屋集章帳</span>
            </div>
            <strong>{done}<small> / {steps.length}</small></strong>
          </div>
          <div className="rent-stampbook-grid">
            {steps.map(s => {
              const on = stamps.includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => goTo(s.id)} className={`${on ? "is-stamped" : ""}${current === s.id ? " is-current" : ""}`} aria-label={`${stepTitle(s.name)}${on ? "（已完成）" : ""}`}>
                  <span className="rent-stampbook-slot">
                    {on ? <span className="rent-stampbook-seal"><b>済</b><small>{s.id.padStart(2, "0")}</small></span> : <span className="rent-stampbook-no">{s.id.padStart(2, "0")}</span>}
                  </span>
                  <span className="rent-stampbook-name">{stepTitle(s.name).replace(/\s*[（(].*$/, "").replace(/^(房東／管理公司審查)$/, "房東審查").replace(/^(精算書與契約書發送)$/, "精算書發送")}</span>
                </button>
              );
            })}
          </div>
          <div className="rent-stampbook-foot">
            <div className="rent-steps-progress-bar"><i style={{ width: `${(done / steps.length) * 100}%` }} /></div>
            <p>{done === steps.length ? "全部蓋滿了，恭喜順利入住 🎉" : done ? `再 ${steps.length - done} 站就完成，加油！` : "每完成一步，就到下面的車站蓋章。進度只記在這台裝置。"}</p>
          </div>
        </div>
        <div className="rent-steps-gantt">
          <div className="rent-steps-gantt-head">
            <span>從申請到拿鑰匙 <strong className={`is-${mode}`}>約 {total} 天</strong></span>
            <span className="rent-gantt-mode" role="group" aria-label="時程估算">
              {([["fast", "免房東審查"], ["normal", "一般"], ["slow", "都拖到"]] as const).map(([m, label]) => (
                <button key={m} type="button" className={`is-${m}`} aria-pressed={mode === m} onClick={() => setMode(m)}>{label}</button>
              ))}
            </span>
          </div>
          <div className="rent-gantt-wrap">
          <div className="rent-gantt-grid" aria-hidden="true">{ticks.map(d => <i key={d} style={{ left: pctOf(d) }} />)}</div>
          <ol className="rent-gantt">
            {steps.map((step, k) => {
              const b = bars[k];
              const isAfter = !!b && "after" in b;
              return (
                <li key={step.id} className={current === step.id ? "is-current" : ""}>
                  <button type="button" onClick={() => goTo(step.id)} title={`${stepTitle(step.name)}：${step.duration}`}>
                    <span className="rent-gantt-label"><b>{step.id.padStart(2, "0")}</b>{stepTitle(step.name).replace(/\s*[（(].*$/, "").replace("房東／管理公司審查", "房東審查").replace("精算書與契約書發送", "精算書發送")}</span>
                    <span className="rent-gantt-track">
                      {isAfter ? (
                        <span className="rent-gantt-after" style={{ left: pctOf(b!.start) }}>入住後 {b!.r.join("–")} 天內</span>
                      ) : b && (
                        <span className={`rent-gantt-bar${b.r[1] === 0 ? " is-zero" : ""}`} style={{ left: pctOf(b.start), width: pctOf(b.r[1]) }}>
                          <i style={{ width: b.r[1] ? `${(b.r[0] / b.r[1]) * 100}%` : 0 }} />
                          <em>{b.r[0] === b.r[1] ? `${b.r[0]} 天` : `${b.r[0]}–${b.r[1]} 天`}</em>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="rent-gantt-axis" aria-hidden="true">
            {ticks.map(d => <span key={d} className={d / span > 0.9 ? "is-end" : undefined} style={{ left: pctOf(d) }}>{d === 0 ? "申請日" : `第 ${d} 天`}</span>)}
          </div>
          </div>
        </div>
      </div>

      <ol className="rent-route">
        <li className="rent-route-train" style={{ transform: `translateY(${trainTop}px)` }} aria-hidden="true"><TrainFront className="h-4 w-4" /></li>
        {steps.map(step => {
          const stamped = stamps.includes(step.id);
          return (
            <li key={step.id} data-step={step.id} ref={el => { stations.current[step.id] = el; }} className={`rent-route-station${current === step.id ? " is-current" : ""}${stamped ? " is-stamped" : ""}`}>
              <span className="rent-route-dot" aria-hidden="true" />
              <div className="rent-route-sign">
                <span className="rent-route-no">{step.id.padStart(2, "0")}</span>
                <h5>{stepTitle(step.name)}</h5>
                <span className="rent-route-time">所要 {step.duration}</span>
              </div>
              <div className="rent-route-body">
                <div className="rent-route-desc">{renderFormattedText(step.description)}</div>
                {step.details && step.details.length > 0 && <ul>{step.details.map(d => <li key={d}>{d}</li>)}</ul>}
              </div>
              <button type="button" className="rent-route-stamp" onClick={() => toggle(step.id)} aria-pressed={stamped}>
                <span className="rent-stamp">{stamped ? "済" : ""}</span>
                {stamped ? "已完成" : "完成就蓋章"}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RentProcessSection({ isSearchActive, showProcessSection, showSop, showDocuments, setDocumentsExpanded, isDocumentSearchResult, isDocumentsOpen, searchQuery, showRoutes, filtered, showReminders, VisaDocumentMatrix }: Props) {
  return (<>{!isSearchActive && showProcessSection && (
                <section className="space-y-4 pt-4">
                  <h3 className="chapter-section-title text-lg font-bold border-l-4 border-[#00a174] pl-3">
                    <span>日本租屋正式申請與交屋流程 SOP</span>
                  </h3>

                  {/* General / Overseas SOP highlight banner */}
                  {showSop && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#00a174] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#00a174] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">{overseasSop.badge}</div>
                      <h4 className="font-bold text-sm text-[#00a174] mb-2 flex items-center gap-1.5">
                        <span>✈ {overseasSop.title}</span>
                      </h4>
                      <p className="text-[#3F5147] leading-relaxed text-justify mb-3">
                        {overseasSop.description}
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF]">
                        <span className="font-bold text-[#1A2A22] block border-b border-[#C9D2CD] pb-1.5 mb-2.5 font-sans">📋 海外審查 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-[#3F5147] font-sans leading-relaxed">
                          {overseasSop.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-[#1A2A22] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#00a174] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#00a174] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">{domesticSop.badge}</div>
                      <h4 className="font-bold text-sm text-[#00a174] mb-2 flex items-center gap-1.5">
                        <span>🇯🇵 {domesticSop.title}</span>
                      </h4>
                      <p className="text-[#3F5147] leading-relaxed text-justify mb-3">
                        {domesticSop.description}
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF]">
                        <span className="font-bold text-[#1A2A22] block border-b border-[#C9D2CD] pb-1.5 mb-2.5 font-sans">📋 入境審查 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-[#3F5147] font-sans leading-relaxed">
                          {domesticSop.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-[#00a174] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Required Documents Section for Overseas vs Domestic Screenings */}
                  {showDocuments && (
                  <div className="rent-documents border border-[#DDE3DF] hover:border-[#00a174] bg-[#F5F8F6] p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <button
                      type="button"
                      onClick={() => setDocumentsExpanded(current => !current)}
                      disabled={isDocumentSearchResult}
                      aria-expanded={isDocumentsOpen}
                      aria-controls="screening-document-matrix"
                      className={`flex w-full items-center justify-between gap-4 text-left ${isDocumentsOpen ? "border-b border-[#C9D2CD] pb-3 mb-4" : ""}`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#00a174]" />
                        <span>
                          <span className="block text-sm font-bold text-[#1A2A22] md:text-base">審查所需資料與準備文件對照</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-[#66736C]">依海外／日本境內審查與目前身份，查看建議先準備的文件</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#00a174]">
                        {isDocumentSearchResult ? "符合搜尋" : isDocumentsOpen ? "收合" : "展開查看"}
                        {!isDocumentSearchResult && (
                          <ChevronDown className={`h-4 w-4 transition-transform ${isDocumentsOpen ? "rotate-180" : ""}`} />
                        )}
                      </span>
                    </button>

                    {isDocumentsOpen && (
                      <div id="screening-document-matrix">
                        <VisaDocumentMatrix searchQuery={searchQuery} />
                      </div>
                    )}
                    <div className="hidden" aria-hidden="true">
                      <div className="bg-white p-5 border border-[#C9D2CD] space-y-3">
                        <h5 className="font-bold text-[#00a174] text-xs uppercase tracking-wider border-b border-[#ECEFEC] pb-1 flex items-center gap-1.5">
                          <span>✈ 海外審查需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-[#3F5147] leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、簽證貼紙頁（若已核發）。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在留資格認定證明書 (COE)：</strong>或打工度假簽證證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>入學許可書 / 內定通知書：</strong>學生提供學校錄取書；就職者提供公司給予的內定通知/薪資證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>存款餘額證明：</strong>打工度假或預算有限者，保證公司通常要求提供等值 12 至 15 個月房租的個人存款證明（台幣或日幣均可）。提供海外帳戶的「網路銀行餘額截圖（含帳號）」加「存摺封面」即可，正式的銀行餘額證明也可以，不需要英文版本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>緊急聯絡人：</strong>通常需要兩位，一位為母國二親等內家長（能提供戶籍謄本佐證親屬關係較佳），另一位為日本在留者（部分保證公司要求，若無可向仲介諮詢協助）。</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-white p-5 border border-[#C9D2CD] space-y-3">
                        <h5 className="font-bold text-[#00a174] text-xs uppercase tracking-wider border-b border-[#ECEFEC] pb-1 flex items-center gap-1.5">
                          <span>🇯🇵 境內審查需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-[#3F5147] leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、日本入境章戳頁。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在留卡（正反面）：</strong>住居地欄位及申報狀態依個案確認；不得把沒有實際居住的親友、飯店或短租地址當成自己的住址申報。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>日本手機門號：</strong>保證公司審查時會撥打電話照會，必須能正常通話與接聽。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>日本銀行帳戶 & 提款卡/存摺：</strong>契約簽署後綁定每個月房租自動扣款使用。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>所得證明 / 學生證：</strong>在日就職者需提供近期的源泉徵收票、課稅證明書或薪資單；學生需提供在學證明或學生證影本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在日緊急聯絡人：</strong>通常要求必須是居住在日本境內、且能用日文進行基本電話溝通的朋友或長輩。</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Application route comparison */}
                  {showRoutes && (
                  <div className="rent-routes border border-[#DDE3DF] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <div className="mb-4 flex flex-col gap-1 border-b border-[#DDE3DF] pb-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-[#1A2A22]">申請前，先確認是哪一種流程</h4>
                        <p className="mt-1 text-xs leading-relaxed text-[#3F5147] font-sans">是否已退租、能否內見，會直接影響申請後還有沒有改變決定的空間。</p>
                      </div>
                      <span className="text-xs font-bold text-[#00a174] font-sans">三種申請方式</span>
                    </div>
                    <div className="rent-route-grid grid grid-cols-1 gap-3 md:grid-cols-3 font-sans">
                      {applicationRoutes.map((route, index) => (
                        <div key={route.title} className={`rent-route-card border border-[#DDE3DF] p-4 ${index === 2 ? "is-caution" : ""}`}>
                          <span className="rent-route-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <h5 className="text-sm font-bold text-[#1A2A22]">{route.title}</h5>
                            <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${index === 2 ? "bg-[#FEE2E2] text-[#B13818]" : "bg-[#e6f6f1] text-[#00a174]"}`}>{route.condition}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-[#3F5147]">{route.body}</p>
                          {/* 例子與流程順序：整理自上面的說明，只在電腦版顯示 */}
                          <p className="rent-route-example"><span>例</span>{route.example}</p>
                          <ol className="rent-route-steps" aria-label={`${route.title}的流程順序`}>
                            {route.steps.map(step => <li key={step}>{step}</li>)}
                          </ol>
                          <p className={`mt-3 border-t border-[#ECEFEC] pt-2 text-[11px] font-bold ${index === 2 ? "text-[#B13818]" : "text-[#00a174]"}`}>{route.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Vertical Linear Steps Timeline */}
                  {filtered.steps.length > 0 && (
                  <div className="rent-steps border border-[#DDE3DF] bg-white p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <div className="absolute top-0 right-6 bg-[#00a174] text-white px-2.5 py-0.5 text-xs tracking-widest font-sans font-medium uppercase">
                      租屋申請9步驟
                    </div>
                    <h4 className="text-base font-bold text-[#1A2A22] border-b border-[#DDE3DF] pb-3 mb-6">
                      租屋審查、付款與入住步驟全解析
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-[#66736C] font-sans">從送件到入住後屋況確認：每一步該確認什麼、通常要等多久，都整理在這裡。</span>
                    </h4>

                    <StepsDesk steps={filtered.steps} />
                    <div className="rent-steps-timeline relative border-l border-[#DDE3DF] ml-3 pl-6 space-y-8 py-2">
                      {filtered.steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Single numbered timeline node: the title itself no longer repeats the step number. */}
                          <div className="absolute -left-[38px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#00a174] bg-white text-xs font-bold text-[#00a174] font-sans transition-colors group-hover:bg-[#00a174] group-hover:text-white">
                            {step.id}
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#1A2A22]">
                              {step.name.replace(/^[①②③④⑤⑥⑦⑧⑨]\s*/, "")}
                            </h5>
                            <span className="text-xs bg-[#F5F8F6] border border-[#C9D2CD] text-[#3F5147] px-2 py-0.5 font-sans shrink-0">
                              作業天數：{step.duration}
                            </span>
                          </div>
                          <div className="border-l-2 border-[#9ee2cf] pl-3 text-xs text-[#3F5147] leading-relaxed text-justify font-sans">
                            <span className="mr-2 text-[10px] font-bold tracking-wide text-[#00a174]">作業重點</span>
                            {renderFormattedText(step.description)}
                          </div>
                          {step.details && step.details.length > 0 && (
                            <ul className="mt-3 space-y-1.5 pl-3 text-xs leading-relaxed text-[#3F5147] font-sans">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex gap-2">
                                  <span className="shrink-0 text-[#00a174]">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {showReminders && (
                    <div className="rent-reminders bg-[#F5F8F6] p-4 border border-[#DDE3DF] text-xs text-[#3F5147] leading-relaxed font-sans space-y-2">
                      <span className="rent-reminders-label font-bold text-[#00a174] block">Linus 實務小提醒</span>
                      <ul className="space-y-1.5">
                        {processReminders.map((reminder, index) => (
                          <li key={reminder} className="rent-reminder-card flex gap-2">
                            <span className="rent-reminder-number shrink-0 text-[#00a174]">{String(index + 1).padStart(2, "0")}</span>
                            <div><h4 className="rent-reminder-title">{["什麼時候開始找房", "住址與銀行開戶", "生活服務代辦聯繫", "初期費用的最終確認", "第一次房租怎麼繳"][index]}</h4><p>{reminder}</p></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}</>);
}
