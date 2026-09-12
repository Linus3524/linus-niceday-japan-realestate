import { Font } from "@react-pdf/renderer";


/**
 * 圖紙分析結果的 PDF 版型。
 *
 * 內容對齊網站分享頁的每一個區塊，資料整理直接重用網站的 lib（租賃條件分組、
 * 特約解讀、設備解析），不另寫一套會各自飄移的邏輯。
 *
 * 版面規則：
 * - 每一張卡片都是 wrap={false} 的 View，保證不會被切到兩頁；一頁塞不下就整張換頁。
 * - 最後一頁固定是聯絡頁（LINE／WeChat QR、社群與 email）。
 * - 配色、字型與網站一致（品牌綠 #00A174／#007D5A、墨色 #1A2A22、線 #DDE3DF、淺底 #F5F8F6）。
 *
 * 字型只在建立 PDF 時才註冊與下載（見 ListingHealthCheck 的下載流程），
 * 主字型兩個檔各約 7MB、補字型各 0.9MB，不放進主 bundle，瀏覽器會快取。
 */

export const SITE_URL = "https://linus-niceday-japan-realestate.vercel.app";
export const SITE_HOST = "linus-niceday-japan-realestate.vercel.app";

export let fontsRegistered = false;

/**
 * 註冊 PDF 用字型。由呼叫端在產生 PDF 前呼叫一次，而不是在模組載入時做：
 * 瀏覽器要的是 /fonts/… 的網址，Node 端測試要的是檔案絕對路徑，
 * 寫死在模組頂層就沒辦法在不同環境切換。
 */
export function registerPdfFonts(baseUrl = "/fonts") {
  if (fontsRegistered) return;
  fontsRegistered = true;
  // 繁體中文為主、日文補字：Google Fonts 的 Noto Sans TC 缺 26 個日文新字體
  // （歩・区・横・浅・価…，圖紙原文一定有），Noto Sans JP 又缺繁體的「值」「查」。
  // TC 當主字型讓漢字用台灣讀者習慣的字形（與網站 CSS 的順序一致），
  // JP 只裁出 TC 沒有的 2,773 個字做補字（各 0.9MB），不整套載入。
  Font.register({
    family: "NotoSansTC",
    fonts: [
      { src: `${baseUrl}/NotoSansTC-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/NotoSansTC-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.register({
    family: "NotoSansJPSupplement",
    fonts: [
      { src: `${baseUrl}/NotoSansJP-Supplement-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/NotoSansJP-Supplement-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // 中日文沒有空白可以斷行，這裡把 CJK 逐字拆成音節，讓引擎可以在任何字之間換行。
  // 引擎在音節邊界換行時一定會插入一個 U+002D 連字號；這件事靠排版選項擋不掉
  // （K&P 在有伸縮空間時反而偏好斷在能多塞連字號的點）。所以改從字型下手：
  // 字型檔已用 scripts/patch-pdf-fonts.py 把 U+002D 改成零寬空字形、把原本的連字號
  // 複製到 U+E000。這裡再把內容裡的真實「-」換成 U+E000，使用者看到的減號與
  // 日期範圍一如原樣，引擎自動塞的那個則什麼都不畫。
  // 英數字維持整個單字不拆，"PDF" 不會變成 P-D-F。
  const VISIBLE_HYPHEN = "\uE000";
  const CJK_OR_OTHER = /[\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]|[^\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]+/g;
  // 禁則處理：句讀與右括號不能出現在行首、左括號不能落在行尾。把這類標點黏進
  // 相鄰的字一起當一個音節，引擎就不會在它們前後斷行。
  const CLOSING = /^[、。，．：；！？）」』】〕〉》］｝,.!?:;)\]}]$/;
  const OPENING = /^[（「『【〔〈《［｛(\[{]$/;
  Font.registerHyphenationCallback(word => {
    const safe = word.replace(/-/g, VISIBLE_HYPHEN);
    const tokens = safe.match(CJK_OR_OTHER) ?? [safe];
    const merged: string[] = [];
    for (const token of tokens) {
      const last = merged[merged.length - 1];
      if (last !== undefined && (CLOSING.test(token) || OPENING.test(last))) {
        merged[merged.length - 1] = last + token;
      } else {
        merged.push(token);
      }
    }
    return merged;
  });
}
