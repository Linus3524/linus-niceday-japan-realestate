// 章節裡的子主題分頁：內容較多的章節（例如申請流程）拆成幾個子主題，
// 左右切換一次看一個，不再把所有區塊疊成一條長長的捲動。
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

export interface SectionTab {
  id: string;
  label: string;
}

export function SectionTabs({ tabs, active, onChange }: { tabs: SectionTab[]; active: string; onChange: (id: string) => void }) {
  const index = Math.max(0, tabs.findIndex(t => t.id === active));
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    const selected = track?.querySelector<HTMLElement>(".is-active");
    if (!track || !selected) return;
    const bounds = track.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.left < bounds.left) track.scrollLeft += item.left - bounds.left;
    else if (item.right > bounds.right) track.scrollLeft += item.right - bounds.right;
  }, [active]);
  const selectTopic = (id: string, element: HTMLElement) => {
    onChange(id);
    element.closest(".chapter-body")?.scrollTo({ top: 0 });
  };
  return (
    <nav className="section-tabs" aria-label="章節子主題">
      <button type="button" className="section-tab-arrow" aria-label="上一個子主題" disabled={index === 0} onClick={event => selectTopic(tabs[index - 1].id, event.currentTarget)}><ArrowLeft aria-hidden="true" /></button>
      <div className="section-tab-track" ref={trackRef}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          type="button"
          aria-current={i === index ? "page" : undefined}
          className={`section-tab ${i === index ? "is-active" : ""}`}
          onClick={event => selectTopic(t.id, event.currentTarget)}
        >
          <span className="section-tab-num">{String(i + 1).padStart(2, "0")}</span>
          <span className="section-tab-label">{t.label}</span>
        </button>
      ))}
      </div>
      <button type="button" className="section-tab-arrow" aria-label="下一個子主題" disabled={index === tabs.length - 1} onClick={event => selectTopic(tabs[index + 1].id, event.currentTarget)}><ArrowRight aria-hidden="true" /></button>
    </nav>
  );
}
