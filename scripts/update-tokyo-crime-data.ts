/**
 * 從警視庁官網建立東京都町丁目級犯罪快照。
 *
 * 為什麼不用東京都オープンデータ API（service.api.metro.tokyo.lg.jp）：
 * 那個 API 是 2024/02 建立後就沒再更新的快照（metadata updated 為空），
 * 實際數字跟令和 5～8 年任何一份官方檔案都對不上，期間不明。
 * 警視庁官網本身就直接提供 CSV（免金鑰、CC BY 4.0），每月更新，
 * 且同時有「上一個完整年」與「今年至今累計」兩份，才是該用的來源。
 *
 * 產出三組資料：
 *   annual   — 上一個完整年（12 個月），主要評級用；町丁目件數很小，
 *              半年以下的期間會因一兩件事件讓等級亂跳，全年才穩。
 *   previous — 再前一個完整年，與 annual 做同期間長度的年對年趨勢比較。
 *   ytd      — 今年 1 月～最新月的累計，顯示今年進度用。
 *
 * 為什麼趨勢要用 annual vs previous，而不是 ytd vs annual：
 * 官網只提供「今年的月累計」（R8.1～R8.7），沒有去年同期的累計檔，
 * 拿 7 個月對 12 個月會系統性地看起來「下降 40%」，那是假的。
 * 兩個完整年度相比才是唯一能誠實計算的口徑。
 *
 * 用法（每月跑一次即可；不需要任何金鑰）：
 *   npm run data:update:tokyo-crime
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const INDEX_URL = "https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html";
const FILES_BASE = "https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.files/";
const OUTPUT_PATH = resolve("src/data/tokyoCrimeSnapshot.json");
const USER_AGENT = "Mozilla/5.0 (compatible; linus-niceday-data-update)";

/** 令和元年 = 2019 */
const reiwaToYear = (reiwa: number) => 2018 + reiwa;

async function fetchText(url: string, encoding: "utf-8" | "shift_jis") {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return new TextDecoder(encoding).decode(await res.arrayBuffer());
}

/**
 * 官網索引頁的連結格式：
 *   R8.csv   → 「7月累計　区市町村の町丁別…」（今年至今，檔名不帶月份）
 *   R8.6.csv → 「6月累計　…」（今年較早的月份）
 *   R7.csv   → 「令和7年　区市町村の町丁別…」（去年全年）
 * 從連結文字判斷各檔案的期間，不用猜。
 */
function parseIndex(html: string) {
  const links = [...html.matchAll(/href="[^"]*ninchikensu\.files\/(R(\d+)(?:\.\d+)?\.csv)"[^>]*>([^<]*)</g)];
  const annuals: Array<{ file: string; reiwa: number }> = [];
  let ytd: { file: string; reiwa: number; throughMonth: number } | null = null;
  for (const [, file, reiwaText, label] of links) {
    const reiwa = Number(reiwaText);
    const ytdMatch = label.match(/(\d+)月累計/);
    if (ytdMatch && /^R\d+\.csv$/.test(file)) {
      if (!ytd || reiwa > ytd.reiwa) ytd = { file, reiwa, throughMonth: Number(ytdMatch[1]) };
    } else if (/令和\d+年/.test(label) && !ytdMatch) {
      annuals.push({ file, reiwa });
    }
  }
  if (!annuals.length) throw new Error("索引頁找不到全年 CSV，官網版面可能改了。");
  // 由新到舊，取最新兩年做年對年比較。
  annuals.sort((a, b) => b.reiwa - a.reiwa);
  const annual = annuals[0];
  // 必須恰好是前一年，中間斷年的話趨勢會變成「兩年前對比」而不自知。
  const previous = annuals.find(a => a.reiwa === annual.reiwa - 1) ?? null;
  return { annual, previous, ytd };
}

function parseCsv(text: string) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(line => line.trim());
  const header = lines[0].split(",");
  if (header[0] !== "市区町丁" || header[1] !== "総合計") {
    throw new Error(`CSV 欄位順序不符預期：${header.slice(0, 3).join(",")}`);
  }
  const rows = lines.slice(1).map(line => {
    const cells = line.split(",");
    // 官網 CSV 的丁目是全形數字（「１丁目」），統一成半形跟地址解析對齊。
    const name = cells[0].replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
    const values = cells.slice(1).map(v => Number(v) || 0);
    if (values.length !== header.length - 1) throw new Error(`欄位數不符：${cells[0]}`);
    return [name, ...values] as [string, ...number[]];
  });
  return { columns: header.slice(1), rows };
}

const html = await fetchText(INDEX_URL, "utf-8");
const index = parseIndex(html);
console.log(`全年：${index.annual.file}（令和${index.annual.reiwa}年）`);
console.log(index.previous ? `前年：${index.previous.file}（令和${index.previous.reiwa}年）` : "前年：無（無法計算年對年趨勢）");
console.log(index.ytd ? `至今：${index.ytd.file}（令和${index.ytd.reiwa}年 1～${index.ytd.throughMonth}月）` : "至今：無（年初尚未發布）");

const annualCsv = parseCsv(await fetchText(FILES_BASE + index.annual.file, "shift_jis"));
const previousCsv = index.previous ? parseCsv(await fetchText(FILES_BASE + index.previous.file, "shift_jis")) : null;
const ytdCsv = index.ytd ? parseCsv(await fetchText(FILES_BASE + index.ytd.file, "shift_jis")) : null;
if (ytdCsv && ytdCsv.columns.join() !== annualCsv.columns.join()) {
  throw new Error("全年與至今兩份 CSV 的欄位不一致，不能合併使用。");
}
if (previousCsv && previousCsv.columns.join() !== annualCsv.columns.join()) {
  throw new Error("兩個年度的 CSV 欄位不一致，逐年比較會對到錯誤的罪種。");
}

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: {
    name: "警視庁「区市町村の町丁別、罪種別及び手口別認知件数」",
    url: INDEX_URL,
    license: "CC BY 4.0",
  },
  columns: annualCsv.columns,
  annual: {
    year: reiwaToYear(index.annual.reiwa),
    label: `令和${index.annual.reiwa}年（${reiwaToYear(index.annual.reiwa)} 年）全年`,
    rows: annualCsv.rows,
  },
  previous: index.previous && previousCsv
    ? {
        year: reiwaToYear(index.previous.reiwa),
        label: `令和${index.previous.reiwa}年（${reiwaToYear(index.previous.reiwa)} 年）全年`,
        rows: previousCsv.rows,
      }
    : null,
  ytd: index.ytd && ytdCsv
    ? {
        year: reiwaToYear(index.ytd.reiwa),
        throughMonth: index.ytd.throughMonth,
        label: `${reiwaToYear(index.ytd.reiwa)} 年 1～${index.ytd.throughMonth} 月累計`,
        rows: ytdCsv.rows,
      }
    : null,
};

await writeFile(OUTPUT_PATH, JSON.stringify(snapshot));
console.log(
  `已寫入 ${OUTPUT_PATH}：全年 ${annualCsv.rows.length} 筆、` +
  `前年 ${previousCsv?.rows.length ?? 0} 筆、至今 ${ytdCsv?.rows.length ?? 0} 筆`
);
