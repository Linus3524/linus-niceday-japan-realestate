import { ArrowDownToLine, ArrowRight, ArrowUpRight, Building2, Calculator, CalendarDays, ChevronDown, HandCoins, Paintbrush, ReceiptText, Ruler, Wallet } from "lucide-react";
import { useState } from "react";
import { taiwanJapanComparisons, taxLifecycle } from "../../lib/guides/buyReference";
import { AdviceNote } from "../AdviceNote";

const COMPARISON_ICONS = [Ruler, Calculator, Paintbrush, Building2, HandCoins];
const STAGE_ICONS = [ArrowDownToLine, CalendarDays, Wallet, ArrowUpRight];

/** 以完整的一張對照卡取代表格＋額外展開列，原生 details 保留鍵盤操作。 */
export function ConceptsVsDesk() {
  return (
    <div className="buy-comparison-deck">
    <ol className="buy-comparison-list">
      {taiwanJapanComparisons.map((item, index) => {
        const Icon = COMPARISON_ICONS[index];
        return (
        <li key={item.id}>
          <details className="buy-comparison-card">
            <summary aria-label={`${item.title}：展開或收合完整台日比較`}>
              <span className="buy-comparison-topic"><span className="buy-comparison-icon"><Icon aria-hidden="true" /></span><span>{item.title}</span></span>
              <span className="buy-comparison-fact is-taiwan"><small>台灣常見理解</small><strong>{item.taiwanShort}</strong></span>
              <span className="buy-comparison-bridge"><ArrowRight aria-hidden="true" /></span>
              <span className="buy-comparison-fact is-japan"><small>日本實務</small><strong>{item.japanShort}</strong></span>
              <span className="buy-comparison-toggle"><span className="when-closed">詳解</span><span className="when-open">收合</span><ChevronDown aria-hidden="true" /></span>
            </summary>
            <div className="buy-comparison-content">
              <div className="buy-comparison-explanation">
                <section><h4>台灣常見理解</h4><p>{item.taiwan}</p></section>
                <section className="is-japan"><h4>日本實務</h4><p>{item.japan}</p></section>
              </div>
              <AdviceNote>{item.advice}</AdviceNote>
            </div>
          </details>
        </li>
      ); })}
    </ol>
    </div>
  );
}

/** 稅務以階段切換，並列稅目、重點數字與計算條件；手機沿用原有卡片。 */
export function TaxLifecycleDesk() {
  const [active, setActive] = useState(0);
  const stage = taxLifecycle[active];
  return (
    <div className="buy-tax-desk">
      <nav className="buy-tax-selector" aria-label="稅務階段">
        {taxLifecycle.map((item, i) => {
          const Icon = STAGE_ICONS[i];
          return (
          <button className="ui-switch-large" key={item.stage} type="button" aria-pressed={active === i} onClick={() => setActive(i)}>
            <span className="buy-tax-selector-label"><Icon aria-hidden="true" />{item.stage}</span>
            <small>{["取得時的一次性費用", "每年的稅與管理費", "租金收入與申報", "出售時的獲利課稅"][i]}</small>
          </button>
        ); })}
      </nav>
      <section className="buy-tax-panel" aria-label={`${stage.stage}的稅務與成本`}>
            <div className="buy-tax-panel-intro"><span>{stage.stage}</span><p>{stage.summary}</p></div>
            <div className="buy-tax-cards">
              {stage.details.map(d => (
                <section key={d.title} className="buy-tax-card">
                  <h5><ReceiptText aria-hidden="true" />{d.title}</h5>
                  {"key" in d && d.key && <strong className="buy-tax-key">{d.key}</strong>}
                  <p className="buy-tax-basis-label">計算依據與適用條件</p>
                  <ul>{d.points.map(p => <li key={p}>{p}</li>)}</ul>
                </section>
              ))}
            </div>
            <AdviceNote className="mt-5">{stage.note}</AdviceNote>
      </section>
    </div>
  );
}
