import { useId, useRef, useState } from "react";
import { ArrowRight, Banknote, Building2, Clock3, FileText, Globe2, HandCoins, IdCard, KeyRound, Landmark, Languages, Search, Stamp, Target, TriangleAlert } from "lucide-react";
import { buyHouseCashSteps, buyHouseLoanSteps, signingDocuments } from "../../data/buyHouseData";
import { SectionHeading } from "../SectionHeading";
import { getSigningDocumentParts } from "../../lib/guides/buyReference";

type FlowType = "cash" | "loan";
interface SectionProps { open: boolean; onToggle: () => void }

const CASH_ICONS = [Target, Search, Building2, FileText, Stamp, Banknote, KeyRound];
const LOAN_ICONS = [Landmark, FileText, Search, Stamp, Banknote, KeyRound];
const CASH_LABELS = ["購買目的", "篩選物件", "確認屋況", "提出買付", "正式簽約", "安排尾款", "過戶交屋"];
const LOAN_LABELS = ["事前審查", "買付簽約", "正式審查", "貸款契約", "撥款過戶", "點交領匙"];

export function BuyFlowDesk({ open, onToggle, flowType, setFlowType }: SectionProps & { flowType: FlowType; setFlowType: (type: FlowType) => void }) {
  const journeyId = useId();
  const stepRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [selectedSteps, setSelectedSteps] = useState<Record<FlowType, string>>({ cash: "1", loan: "1" });
  const isLoan = flowType === "loan";
  const steps = isLoan ? buyHouseLoanSteps : buyHouseCashSteps;
  const icons = isLoan ? LOAN_ICONS : CASH_ICONS;
  const labels = isLoan ? LOAN_LABELS : CASH_LABELS;
  const selectedStep = selectedSteps[flowType];
  const selectStep = (step: string) => {
    setSelectedSteps(current => ({ ...current, [flowType]: step }));
    const target = stepRefs.current[`${flowType}-${step}`];
    if (!target) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    // 只捲動章節內容，避免首頁面板也被 scrollIntoView 帶動。
    const scroller = target.closest<HTMLElement>(".chapter-body");
    if (scroller) scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 20), behavior });
    else target.scrollIntoView({ block: "start", behavior });
  };
  return <section className="buy-journey-desk">
    <SectionHeading icon={KeyRound} title="日本買房交易完整流程" description="把交易順序、付款時點與要準備的文件放在一起看，先掌握每一步要做什麼。" open={open} onToggle={onToggle} />
    {open && <>
      <nav className="buy-journey-switch" aria-label="選擇付款方式">
        <button type="button" className="ui-switch-large" aria-pressed={!isLoan} onClick={() => setFlowType("cash")}><Banknote /><span><strong>現金全款</strong><small>資金準備 → 簽約 → 過戶交屋</small></span><ArrowRight /></button>
        <button type="button" className="ui-switch-large" aria-pressed={isLoan} onClick={() => setFlowType("loan")}><Landmark /><span><strong>銀行貸款</strong><small>審查 → 簽約與撥款 → 過戶交屋</small></span><ArrowRight /></button>
      </nav>
      <nav className="buy-journey-overview" aria-label="交易路線導覽"><div className="buy-journey-route-heading"><div><span>交易路線</span><strong>{steps.length} 個階段</strong></div><p>點選步驟，查看對應內容</p></div><div className="buy-journey-route-scroll"><ol style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(80px, 1fr))` }}>{steps.map((step, index) => {
        const Icon = icons[index] ?? FileText;
        return <li key={step.step}>
          <button type="button" className="buy-journey-route-button" aria-label={`前往第 ${step.step} 步：${step.title}`} aria-current={selectedStep === step.step ? "step" : undefined} aria-controls={`${journeyId}-${flowType}-${step.step}`} onClick={() => selectStep(step.step)}><span className="buy-journey-route-icon"><Icon aria-hidden="true" /></span><span>{labels[index]}</span></button>
        </li>;
      })}</ol></div></nav>
      <ol className="buy-journey-timeline" aria-label={isLoan ? "銀行貸款交易步驟" : "現金全款交易步驟"}>
        {steps.map((step, index) => {
          const Icon = icons[index] ?? FileText;
          return <li key={`${flowType}-${step.step}`} ref={element => { stepRefs.current[`${flowType}-${step.step}`] = element; }}>
            <button type="button" className="buy-journey-marker" aria-label={`選取第 ${step.step} 步：${step.title}`} aria-current={selectedStep === step.step ? "step" : undefined} aria-controls={`${journeyId}-${flowType}-${step.step}`} onClick={() => selectStep(step.step)}><span>{step.step.padStart(2, "0")}</span></button>
            <article id={`${journeyId}-${flowType}-${step.step}`} className={`buy-journey-step${selectedStep === step.step ? " is-selected" : ""}`}>
              <header><h4><Icon aria-hidden="true" />{step.title}</h4>{step.timing && <span className="buy-journey-time"><Clock3 aria-hidden="true" />{step.timing}</span>}</header>
              <p className="buy-journey-description">{step.description}</p>
              <dl className="buy-journey-prep">
                {step.payment && <div><dt><HandCoins aria-hidden="true" />付款準備</dt><dd>{step.payment}</dd></div>}
                {step.documents && <div><dt><FileText aria-hidden="true" />這一步的文件</dt><dd>{step.documents}</dd></div>}
              </dl>
              {step.warning && <aside className="buy-journey-warning"><TriangleAlert aria-hidden="true" /><p>{step.warning}</p></aside>}
            </article>
          </li>;
        })}
      </ol>
    </>}
  </section>;
}

const RESIDENT_ICONS = [FileText, IdCard, FileText, Stamp, Landmark];
const OVERSEAS_ICONS = [IdCard, IdCard, FileText, Stamp, Landmark, Languages];

export function BuyDocumentsDesk({ open, onToggle }: SectionProps) {
  const [resident, setResident] = useState(true);
  const group = resident ? signingDocuments.residenceGroup : signingDocuments.nonResidenceGroup;
  const icons = resident ? RESIDENT_ICONS : OVERSEAS_ICONS;
  return <section className="buy-journey-desk">
    <SectionHeading icon={FileText} title={signingDocuments.title} description="依居住身分查看準備項目，將身分確認、登記用印與貸款財力分清楚。" open={open} onToggle={onToggle} />
    {open && <>
      <nav className="buy-journey-switch" aria-label="文件適用身分">
        <button type="button" className="ui-switch-large" aria-pressed={resident} onClick={() => setResident(true)}><IdCard /><span><strong>在日居民</strong><small>持有在留卡／中長期簽證</small></span><ArrowRight /></button>
        <button type="button" className="ui-switch-large" aria-pressed={!resident} onClick={() => setResident(false)}><Globe2 /><span><strong>海外買方</strong><small>非在日居民／台灣買方</small></span><ArrowRight /></button>
      </nav>
      <header className="buy-document-context"><h4>{group.title}</h4><span>{group.items.length} 項準備清單</span></header>
      <ul className="buy-document-list">
        {group.items.map((item, index) => {
          const Icon = icons[index] ?? FileText;
          const { title, description } = getSigningDocumentParts(item);
          const loanOnly = /若辦理貸款|僅在申請房貸時/.test(item);
          return <li key={`${resident}-${title}`}>
            <span className="buy-document-icon"><Icon aria-hidden="true" /></span>
            <div className="buy-document-name"><h4>{title}</h4>{loanOnly && <span><Landmark aria-hidden="true" />申請貸款時</span>}</div>
            {description && <p>{description}</p>}
          </li>;
        })}
      </ul>
    </>}
  </section>;
}
