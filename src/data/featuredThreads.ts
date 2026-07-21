// LINUS 精選 Threads 文章
//
// 只要把你想精選的 Threads 貼文「連結」貼進下面的陣列即可，
// 網站會自動抓出該貼文的縮圖與內文，點擊會直接開啟 Threads App 或網頁。
//
// 取得連結方式：在 Threads App／網頁點該篇貼文右上角「…」→「複製連結」。
// 貼上來後，網址「?」後面的追蹤參數可留可刪（建議刪掉保持乾淨），
// 只要保留 https://www.threads.com/@帳號/post/XXXXXXXXX 這段即可。
//
// theme 可省略；想要深色卡片時可加 theme: "dark"。

export interface FeaturedThread {
  /** Threads 貼文連結（必填） */
  url: string;
  /** 卡片主題，可省略。"dark" = 深色卡片 */
  theme?: "light" | "dark";
  /**
   * 這張卡片要顯示的高度（像素），可省略，預設 360。
   * ─ 純文字短貼文：想矮一點就調小，例如 300。
   * ─ 有圖片的貼文：Threads 是「文字在上、圖片在下」，想露出圖片就調高，
   *   例如 480 ~ 560，數字越大露出越多。
   */
  height?: number;
}

export const featuredThreads: FeaturedThread[] = [
  // 日本租房網路上看得到、租不到
  { url: "https://www.threads.com/@linus3524/post/DOxJh3zkq2V" },
  // 想在日本租房看房可能沒機會
  { url: "https://www.threads.com/@linus3524/post/DMwXuccSd40" },
  // 保證會社、什麼是初期保證料
  { url: "https://www.threads.com/@linus3524/post/DP0yW9REpWJ" },
  // 日本租房申請到審查流程
  { url: "https://www.threads.com/@linus3524/post/DLrIPCwSJLw" },
  // 日本租房取消申請
  { url: "https://www.threads.com/@linus3524/post/DKYkqrQyLcL" },
  // 水電瓦斯知識
  { url: "https://www.threads.com/@linus3524/post/DLcBEMeOFwp" },
  // 瓦斯電力代開注意
  { url: "https://www.threads.com/@linus3524/post/DVfqKaXkzSa" },
  // 入居檢查、原狀回復
  { url: "https://www.threads.com/@linus3524/post/DYwX2kyk97_" },
  // 日本租房平面圖尺寸（示範：這篇有圖，調高一點露出圖片）
  { url: "https://www.threads.com/@linus3524/post/DYd73ZcEa0h", height: 520 },
  // 日本租房可能沒有免費網路
  { url: "https://www.threads.com/@linus3524/post/DXRInxEk55A" },
  // 日本租房可能沒有燈
  { url: "https://www.threads.com/@linus3524/post/DW6Y-n-ky51" },
  // 日本租房 10 個懶人須知
  { url: "https://www.threads.com/@linus3524/post/DXPEpkKk11-" },
  // 日本開啟水道小知識
  { url: "https://www.threads.com/@linus3524/post/DV_T53FE3qK" },
  // 為什麼日本租房都先匯款後簽約
  { url: "https://www.threads.com/@linus3524/post/DUkBCbOksVf" },
];
