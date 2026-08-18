/**
 * 分頁瀏覽與來源標記的回報（前端）。
 *
 * 為什麼不用 Vercel 的熱門頁面：整個網站只有一個路徑「/」，分頁切換是 React
 * 狀態、次要頁面靠 hash，而 hash 不會送到伺服器。Vercel 只看得到「/」被開了
 * 幾次，分不出客人是在看租屋指南還是計算機。
 *
 * 這裡刻意只送分頁代號與來源標記，不送 session、不送任何識別碼——後台要回答
 * 的是「哪一區最多人看」「哪個管道帶人進來」，不是「誰看了什麼」。
 */

export type TrackableView =
  | "rent-guide" | "buy-guide" | "calculator" | "ai-advisor" | "contact" | "threads" | "policy";

// 同一個分頁在短時間內重複回報沒有意義（切走再切回、元件重新掛載都會觸發）。
// 記住上一個回報的分頁，只在真的換頁時才送。
let lastReported: TrackableView | null = null;

// 來源標記（?from=line、?utm_source=fb）每次造訪只回報一次。
// 用 sessionStorage 而不是模組變數：重新整理不該再算一次造訪。
const SOURCE_SENT_KEY = "linus-source-sent";

/** 射後不理：統計失敗不該讓使用者看到任何東西，也不該擋住畫面。 */
function send(payload: Record<string, string>) {
  try {
    const body = JSON.stringify(payload);
    // sendBeacon 在關閉分頁時仍會送出，比 fetch 可靠。
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

/**
 * 回報網址上的來源標記。獨立於分頁回報，且必須在進站時就送。
 *
 * 手機停在首頁不算任何一個分頁，如果把來源夾在分頁回報裡一起送，
 * 「從 LINE 點開、看一眼首頁就關掉」這種最常見的情境會完全沒有紀錄——
 * 而社群與通訊軟體來的流量幾乎都是手機。
 */
export function trackSource() {
  try {
    if (sessionStorage.getItem(SOURCE_SENT_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const source = params.get("from") || params.get("utm_source");
    if (!source) return;
    sessionStorage.setItem(SOURCE_SENT_KEY, "1");
    send({ source });
  } catch {
    // sessionStorage 在無痕模式或被封鎖時會丟例外，忽略即可
  }
}

export function trackView(view: TrackableView) {
  if (view === lastReported) return;
  lastReported = view;
  send({ view });
}
