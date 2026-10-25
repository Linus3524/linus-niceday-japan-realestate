// 東京居住人格診斷的網址。
// 測驗有自己的子網域（測驗專案 tokyo-living-persona），統計事件由測驗跨網域送回本站 /api/track-view。
// 跟本站同一個 linusniceday.com，桌機面板裡用 iframe 開時，瀏覽器也會跟直接開測驗共用同一份作答紀錄。
export const QUIZ_URL = "https://quiz.linusniceday.com/";

/** 桌機改在內容面板裡直接開測驗（App.tsx 監聽這個事件），手機照常跳轉 */
export const OPEN_QUIZ_EVENT = "linus:open-quiz";

export function openQuizInline(event: { preventDefault: () => void }) {
  // 與 useIsDesktop 同一個斷點：桌機首屏改到 ≥1280px 之後，1024～1279px 已經沒有內嵌面板，要照一般連結開測驗
  if (typeof window === "undefined" || !window.matchMedia("(min-width: 1280px) and (hover: hover) and (pointer: fine)").matches) return;
  event.preventDefault();
  window.dispatchEvent(new Event(OPEN_QUIZ_EVENT));
}
