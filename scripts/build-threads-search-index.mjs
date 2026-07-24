// 產生 Threads 貼文全文搜尋索引。
//
// 為什麼需要這支腳本：Threads 貼文渲染在跨網域 iframe，前端 JS 讀不到內文，
// 且貼文頁把內容擋在 JS 渲染 + 登入後，一般 fetch 只拿得到空殼。唯一可行的
// 方式是用無頭瀏覽器把「嵌入頁」當最上層網頁載入、等 JS 跑完再讀文字。
//
// 產出 src/data/threadsSearchIndex.ts（靜態檔，網站直接 import，執行時不需要
// 連 Threads、也不需要 playwright）。有快取：已抓過的貼文預設略過，新增貼文
// 只會抓新的。要全部重抓加 --force。
//
// 用法：
//   node scripts/build-threads-search-index.mjs
//   node scripts/build-threads-search-index.mjs --force

import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const DATA_FILE = join(root, "src/data/featuredThreads.ts");
const OUT_FILE = join(root, "src/data/threadsSearchIndex.ts");
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 4;

// 從資料檔擷取所有 Threads 網址（保序、去重）
function readPostUrls() {
  const src = readFileSync(DATA_FILE, "utf8");
  const urls = [...src.matchAll(/https:\/\/www\.threads\.com\/[^\s"']+/g)].map(m => m[0]);
  return [...new Set(urls)];
}

function postId(url) {
  const m = url.match(/\/post\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : url;
}

// 讀既有索引（給快取用）
function readExistingIndex() {
  if (!existsSync(OUT_FILE)) return {};
  try {
    const src = readFileSync(OUT_FILE, "utf8");
    const json = src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// 清掉頭尾樣板，只留貼文本文（保留關鍵字即可，不追求完美排版）
function clean(raw) {
  let t = raw.replace(/\r/g, "");
  t = t.replace(/^[\s\S]*?(追蹤|Follow)\s*/, "");            // 開頭：帳號／分類／追蹤
  t = t.replace(/(在 Threads 查看|View on Threads)[\s\S]*$/, ""); // 結尾標記
  t = t.replace(/(上午|下午|\d{1,2}:\d{2}\s*(AM|PM))[^\n]*[\s\S]*$/, ""); // 時間戳與其後互動數
  return t.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
}

async function extract(page, url) {
  await page.goto(`${url}/embed/`, { waitUntil: "networkidle", timeout: 25000 });
  // 等內文真的長出來（超過純樣板長度）
  await page.waitForFunction(() => document.body.innerText.trim().length > 60, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  const raw = await page.evaluate(() => document.body.innerText);
  return clean(raw);
}

const urls = readPostUrls();
const index = readExistingIndex();
const todo = urls.filter(u => FORCE || !index[postId(u)]);

console.log(`共 ${urls.length} 篇，需抓取 ${todo.length} 篇${FORCE ? "（--force 全抓）" : "（其餘用快取）"}`);
if (todo.length === 0) {
  console.log("沒有需要抓的，結束。");
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: "zh-TW",
  extraHTTPHeaders: { "Accept-Language": "zh-TW,zh;q=0.9" },
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
});

let done = 0, failed = 0;
async function worker(queue) {
  const page = await context.newPage();
  while (queue.length) {
    const url = queue.shift();
    const id = postId(url);
    try {
      const text = await extract(page, url);
      if (text && text.length > 10) {
        index[id] = text;
        done++;
      } else {
        failed++;
        console.warn(`  空白：${id}`);
      }
    } catch (e) {
      failed++;
      console.warn(`  失敗：${id} — ${e.message.split("\n")[0]}`);
    }
    if ((done + failed) % 10 === 0) console.log(`  進度 ${done + failed}/${todo.length}`);
  }
  await page.close();
}

const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
await browser.close();

// 依原始網址順序輸出，diff 才穩定
const ordered = {};
for (const u of urls) if (index[postId(u)]) ordered[postId(u)] = index[postId(u)];

const banner = `// 自動產生，請勿手改。來源：scripts/build-threads-search-index.mjs\n// 重新產生：node scripts/build-threads-search-index.mjs\n`;
writeFileSync(
  OUT_FILE,
  `${banner}export const threadsSearchIndex: Record<string, string> = ${JSON.stringify(ordered, null, 2)};\n`,
  "utf8",
);
console.log(`完成：成功 ${done}、失敗 ${failed}、索引共 ${Object.keys(ordered).length} 篇 → src/data/threadsSearchIndex.ts`);
