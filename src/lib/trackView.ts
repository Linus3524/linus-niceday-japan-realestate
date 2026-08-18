/**
 * 分頁瀏覽回報（前端）。
 *
 * 為什麼不用 Vercel 的熱門頁面：整個網站只有一個路徑「/」，分頁切換是 React
 * 狀態、次要頁面靠 hash，而 hash 不會送到伺服器。Vercel 只看得到「/」被開了
 * 幾次，分不出客人是在看租屋指南還是計算機。
 *
 * 這裡刻意只送分頁代號，不送 session、不送任何識別碼——後台要回答的是
 * 「哪一區最多人看」，不是「誰看了什麼」。
 */

export type TrackableView =
  | "rent-guide" | "buy-guide" | "calculator" | "ai-advisor" | "contact" | "threads" | "policy";

// 同一個分頁在短時間內重複回報沒有意義（切走再切回、元件重新掛載都會觸發）。
// 記住上一個回報的分頁，只在真的換頁時才送。
let lastReported: TrackableView | null = null;

// 來源標記（?from=line、?utm_source=fb）每次造訪只回報一次。
// 用 sessionStorage 而不是模組變數：重新整理不該再算一次造訪。
const SOURCE_SENT_KEY = "linus-source-sent";

function pendingSource(): string | undefined {
  try {
    if (sessionStorage.getItem(SOURCE_SENT_KEY)) return undefined;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("from") || params.get("utm_source");
    if (!raw) return undefined;
    sessionStorage.setItem(SOURCE_SENT_KEY, "1");
    return raw;
  } catch {
    return undefined;
  }
}

export function trackView(view: TrackableView) {
  if (view === lastReported) return;
  lastReported = view;

  // 射後不理：統計失敗不該讓使用者看到任何東西，也不該擋住畫面。
  // sendBeacon 在關閉分頁時仍會送出，比 fetch 可靠。
  try {
    const body = JSON.stringify({ view, source: pendingSource() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track-view", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // 忽略：瀏覽器擋掉或離線都不影響網站本身
  }
}
