// 東京居住人格診斷的網址。
// 正式站的 /quiz/ 由 vercel.json 轉寫到測驗專案（同網域），測驗的統計事件才會送進本站
// /api/track-view、後台看得到；本機開發沒有這條轉寫，改連測驗專案的部署網址。
export const QUIZ_URL = import.meta.env.DEV ? "https://tokyo-living-persona.vercel.app/" : "/quiz/";

/** 桌機改在內容面板裡直接開測驗（App.tsx 監聽這個事件），手機照常跳轉 */
export const OPEN_QUIZ_EVENT = "linus:open-quiz";

export function openQuizInline(event: { preventDefault: () => void }) {
  if (typeof window === "undefined" || !window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches) return;
  event.preventDefault();
  window.dispatchEvent(new Event(OPEN_QUIZ_EVENT));
}
