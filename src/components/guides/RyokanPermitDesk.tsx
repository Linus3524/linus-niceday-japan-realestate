import { Bath, ClipboardCheck, ConciergeBell, FireExtinguisher, Ruler, Signpost } from "lucide-react";
import { ryokanRules } from "../../data/buyHouseData";
import { AdviceNote } from "../AdviceNote";

const REQUIREMENT_LABELS = [
  { title: "客室面積", icon: Ruler },
  { title: "接待與管理體制", icon: ConciergeBell },
  { title: "消防設備", icon: FireExtinguisher },
  { title: "客室與衛生設備", icon: Bath },
  { title: "營業標示與附加服務", icon: Signpost }
];

/** 法規摘要以段落與標題分層，全文直接可讀，不用圖解或逐步切換。 */
export function RyokanPermitDesk() {
  return <div className="ryokan-reading">
    <header className="ryokan-reading-intro">
      <div className="ryokan-reading-window"><span>營業許可申請窗口</span><strong className="lodging-authority">各區保健所</strong><p>依設施所在地洽詢</p></div>
      <dl className="ryokan-reading-contacts">
        <div><dt>消防法令與設備確認</dt><dd>消防署</dd></div>
        <div><dt>用途與建築條件查核</dt><dd>建築士</dd></div>
      </dl>
      <p className="ryokan-reading-cost">{ryokanRules.cost}</p>
    </header>

    <section className="ryokan-reading-section" aria-label="旅館業許可申請流程">
      <header><h3>許可申請流程</h3><span>從事前諮詢到許可開業</span></header>
      <ol className="ryokan-reading-steps">
        {ryokanRules.steps.map((step, index) => <li key={step.name}>
          <span className="ryokan-reading-order" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h4>{step.name}</h4>
          <p>{step.desc}</p>
        </li>)}
      </ol>
    </section>

    <section className="ryokan-reading-section" aria-label="簡易宿所硬體與消防規範">
      <header><h3>硬體、管理與消防確認</h3><span>依物件與所在地規定確認</span></header>
      <dl className="ryokan-reading-requirements">
        {ryokanRules.requirements.map((rule, index) => {
          const { title, icon: Icon } = REQUIREMENT_LABELS[index] ?? { title: "其他確認項目", icon: ClipboardCheck };
          return <div key={rule}>
            <dt><Icon aria-hidden="true" /><span>{title}</span></dt><dd>{rule}</dd>
          </div>;
        })}
      </dl>
    </section>

    <AdviceNote title="購入與改修前確認" className="mt-6"><ul>{ryokanRules.warnings.map(warning => <li key={warning}>{warning.replace(/^⚠️\s*/u, "")}</li>)}</ul></AdviceNote>
  </div>;
}
