/**
 * 從東京都統計局官網建立町丁目級「世帯數」快照。
 *
 * 用途：當住宅侵入竊盜率的分母。
 * 只有絕對件數時，5,000 戶的大型住宅區與 500 戶的小社區無法比較，
 * 也會讓商辦區（住戶極少但事務所遭竊多）被誤判成治安差。
 *
 * 為什麼用「世帯數」而不是「人口」：
 * 侵入竊盜的標的是「一戶住宅」，不是「一個人」。用戶數才是正確的曝險單位，
 * 這比日本各家治安排行榜慣用的「人口一萬人あたり」更貼近實際風險。
 *
 * 資料來源：東京都統計局「住民基本台帳による東京都の世帯と人口」第5表
 *           （区市町村、町丁別の世帯数及び男女別人口）
 * 更新頻率：每年 1 月 1 日現在，年中發布。
 *
 * 用法（每年跑一次即可；不需要任何金鑰）：
 *   npm run data:update:tokyo-population
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import crimeSnapshot from "../src/data/tokyoCrimeSnapshot.json";

const INDEX_URL = "https://www.toukei.metro.tokyo.lg.jp/juukiy/jy-index.htm";
const BASE = "https://www.toukei.metro.tokyo.lg.jp";
const OUTPUT_PATH = resolve("src/data/tokyoPopulationSnapshot.json");
const USER_AGENT = "Mozilla/5.0 (compatible; linus-niceday-data-update)";

async function fetchText(url: string) {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  // 此站的 CSV 與 HTML 都是 UTF-8（與警視庁的 Shift_JIS 不同）。
  return new TextDecoder("utf-8").decode(await res.arrayBuffer());
}

/**
 * 從索引頁找出最新年度的資料頁。
 * 連結格式：/juukiy/2026/jy26000001.htm
 */
function findLatestYearPage(html: string) {
  const links = [...html.matchAll(/href="(\/juukiy\/(\d{4})\/jy\d{2}000001\.htm)"/g)];
  if (!links.length) throw new Error("索引頁找不到年度頁連結，官網版面可能改了。");
  let best = { path: "", year: 0 };
  for (const [, path, yearText] of links) {
    const year = Number(yearText);
    if (year > best.year) best = { path, year };
  }
  return best;
}

/**
 * 第5表在年度頁上是「一覧へ」子頁面，實際的合併 CSV 在該子頁。
 * 檔名規則：jyNNqv0500.csv（NN = 西元年後兩碼）。
 */
function findTable5Csv(html: string) {
  const direct = html.match(/href="(\/juukiy\/\d{4}\/jy\d{2}qv0500\.csv)"/);
  if (direct) return direct[1];
  const listPage = html.match(/href="(\/juukiy\/\d{4}\/jy\d{2}q10501\.htm)"/);
  return listPage ? { listPage: listPage[1] } : null;
}

/* ────────── 名稱正規化 ────────── */

/** 全形數字 → 半形。 */
const toHalfWidth = (s: string) =>
  s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));

/**
 * 異體字統一（左為人口表寫法 → 右為警視庁犯罪表寫法）。
 *
 * 兩份官方資料對同一個地名採用不同字體，肉眼完全看不出差別，
 * 但字元碼不同就會對應失敗，實測造成 142 筆缺口。
 */
const VARIANT_CHARS: Record<string, string> = {
  "麴": "麹",  // 麴町（千代田区，6 筆）
  "簞": "箪",  // 簞笥町（新宿区）
  "鴬": "鶯",  // 鴬谷町（渋谷区）
};

/**
 * 去除 IVS（漢字異體字選擇器，U+E0100～U+E01EF）。
 *
 * 東京都的人口表在部分地名後面帶了這種零寬度字元，
 * 例如「八王子市大塚」的塚後面接 U+E0104，字串長度因此多 1，
 * 用肉眼或一般字串比對完全找不出差異。實測影響八王子市與豊島区共 7 筆。
 */
const stripVariationSelectors = (s: string) =>
  s.replace(/[\u{E0100}-\u{E01EF}\uFE00-\uFE0F]/gu, "");

/**
 * 套用所有字形正規化。
 *
 * NFC 正規化負責「互換漢字」（CJK Compatibility Ideographs）：
 * 人口表的「大塚」用 U+FA10，犯罪表用一般的 U+585A，兩者顯示完全相同。
 * NFC 會把 U+FA10 轉成 U+585A，一次解決豊島区與八王子市的大塚系列。
 * 這類字無法靠肉眼發現，只能靠正規化處理。
 */
function normalizeChars(s: string): string {
  let out = stripVariationSelectors(s).normalize("NFC");
  for (const [from, to] of Object.entries(VARIANT_CHARS)) {
    out = out.replaceAll(from, to);
  }
  return out;
}

/**
 * 郡部的「地域」欄只寫町村名（瑞穂町），但犯罪表寫全稱（西多摩郡瑞穂町）。
 * 少了郡名會讓整個西多摩郡對應不上，實測影響 60 筆以上。
 *
 * 島部（大島町、八丈町等）刻意不在此列：
 * 犯罪表對島部不加支庁名，而且會插入島名（「三宅島三宅村神着」「八丈島八丈町三根」），
 * 規則不一致。島部總計不到 40 個地區且多數無住宅成交，
 * 硬湊對應表只會製造難以驗證的特例，交給既有的退回機制處理即可。
 */
const GUN_PREFIX: Record<string, string> = {
  "瑞穂町": "西多摩郡",
  "日の出町": "西多摩郡",
  "檜原村": "西多摩郡",
  "奥多摩町": "西多摩郡",
};

const KANJI: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

/** 漢數字 → 阿拉伯數字。丁目最多到 40 幾，處理到「九十九」綽綽有餘。 */
function kanjiToNumber(s: string): number | null {
  if (s === "十") return 10;
  if (s.startsWith("十")) {
    const rest = KANJI[s.slice(1)];
    return rest ? 10 + rest : null;
  }
  if (s.includes("十")) {
    const [tens, ones] = s.split("十");
    const t = KANJI[tens];
    if (!t) return null;
    return ones ? t * 10 + (KANJI[ones] ?? 0) : t * 10;
  }
  return KANJI[s] ?? null;
}

/**
 * 統一成警視庁犯罪表的格式：「◯◯区◯◯N丁目」（半形阿拉伯數字）。
 *
 * 人口表的丁目寫法三種並存（實測令和8年）：
 *   全形數字「銀座１丁目」  3,457 筆
 *   漢數字  「丸の内一丁目」1,216 筆
 *   半形數字「◯◯1丁目」     141 筆
 * 只處理其中一種，對應率會從 97% 掉到 33%。
 */
function normalizeChomeName(ward: string, town: string): string | null {
  const w = normalizeChars(ward);
  const prefixed = (GUN_PREFIX[w] ?? "") + w;
  const t = toHalfWidth(normalizeChars(town));

  const kanji = t.match(/^(.+?)([一二三四五六七八九十]+)丁目$/);
  if (kanji) {
    const n = kanjiToNumber(kanji[2]);
    if (n === null) return null;
    return `${prefixed}${kanji[1]}${n}丁目`;
  }

  const arabic = t.match(/^(.+?)([0-9]+)丁目$/);
  if (arabic) return `${prefixed}${arabic[1]}${Number(arabic[2])}丁目`;

  // 無丁目的町（例：千代田区一番町）
  return `${prefixed}${t}`;
}

/* ────────── 主流程 ────────── */

const indexHtml = await fetchText(INDEX_URL);
const latest = findLatestYearPage(indexHtml);
console.log(`最新年度頁：${latest.path}（${latest.year} 年）`);

const yearHtml = await fetchText(BASE + latest.path);
let csvPath = findTable5Csv(yearHtml);
if (csvPath && typeof csvPath === "object") {
  // 第5表在子頁，進去再找一次。
  const listHtml = await fetchText(BASE + csvPath.listPage);
  const inner = listHtml.match(/href="(\/juukiy\/\d{4}\/jy\d{2}qv0500\.csv)"/);
  csvPath = inner ? inner[1] : null;
}
if (!csvPath || typeof csvPath !== "string") {
  throw new Error("找不到第5表（町丁別世帯數）的 CSV，官網版面可能改了。");
}
console.log(`第5表 CSV：${csvPath}`);

const csv = await fetchText(BASE + csvPath);
const lines = csv.replace(/^\ufeff/, "").split(/\r?\n/).filter(l => l.trim());
const header = lines[0].split(",");

const iArea = header.indexOf("地域");
const iLevel = header.indexOf("町丁別地域階層");
const iName = header.indexOf("町丁別地域");
const iHouse = header.indexOf("世帯数(世帯)");
const iPop = header.indexOf("人口／総数(人)");
if ([iArea, iLevel, iName, iHouse, iPop].some(i => i < 0)) {
  throw new Error(`人口表欄位與預期不符：${header.join(",")}`);
}

/** 「-」代表該町丁目無住民登記，是實質 0 而非缺值。 */
const num = (v: string) => (v === "-" || v === "" ? 0 : Number(v.replace(/,/g, "")) || 0);

const households: Record<string, [number, number]> = {};
let aggregateRows = 0;
let unparsable = 0;

for (const line of lines.slice(1)) {
  const cells = line.split(",");
  // 階層 0 是「◯◯区総数」彙總列，與犯罪表的「◯◯区計」同性質，必須排除。
  if (cells[iLevel] === "0" || /総数$/.test(cells[iName])) {
    aggregateRows++;
    continue;
  }
  const key = normalizeChomeName(cells[iArea], cells[iName]);
  if (!key) {
    unparsable++;
    continue;
  }
  households[key] = [num(cells[iHouse]), num(cells[iPop])];
}

const count = Object.keys(households).length;
if (count < 4000) {
  throw new Error(`町丁目筆數異常偏低（${count}），可能是格式改變導致解析失敗。`);
}

/*
 * 直接對帳犯罪快照：筆數正常不代表名稱對得上。
 * 實測只處理漢數字丁目時，筆數看起來完全正常，但對應率只有 32.7%——
 * 那會讓大部分物件默默退回件數制，而且沒有任何錯誤訊息。
 */
const crimeNames: string[] = (crimeSnapshot as any).annual.rows
  .map((r: any[]) => r[0] as string)
  .filter((n: string) => !/(計|合計)$/.test(n));
const matched = crimeNames.filter(n => n in households).length;
const coverage = (matched / crimeNames.length) * 100;
console.log(`與犯罪快照對應：${matched}/${crimeNames.length}（${coverage.toFixed(1)}%）`);
if (coverage < 95) {
  throw new Error(
    `對應率僅 ${coverage.toFixed(1)}%，低於 95% 門檻。` +
    `官方可能更動了地名寫法（全形／漢數字／異體字／IVS），請檢查 normalizeChomeName。`
  );
}

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: {
    name: "東京都統計局「住民基本台帳による東京都の世帯と人口」第5表",
    url: BASE + latest.path,
    note: "毎年1月1日現在",
  },
  year: latest.year,
  label: `${latest.year} 年 1 月 1 日現在`,
  /** 町丁目名稱 → [世帯數, 人口總數]。名稱已正規化成警視庁犯罪表的格式。 */
  households,
};

await writeFile(OUTPUT_PATH, JSON.stringify(snapshot));
console.log(
  `已寫入 ${OUTPUT_PATH}：${count} 筆町丁目` +
  `（排除彙總列 ${aggregateRows} 筆、無法解析 ${unparsable} 筆）`
);
