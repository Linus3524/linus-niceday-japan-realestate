/**
 * crimeSafety.ts — 全日本治安查詢（分層資料源）
 *
 * 資料精度依地區分兩層，因為日本並不存在全國統一的細粒度犯罪統計：
 *
 * ① 東京都 → 町丁目級・全罪種
 *    警視庁「区市町村の町丁別、罪種別及び手口別認知件数」官網 CSV（CC BY 4.0，免金鑰），
 *    由 scripts/update-tokyo-crime-data.ts 抓成靜態快照：
 *    上一個完整年（12 個月）做評級，今年至今累計顯示趨勢。
 *    町丁目件數很小，半年以下的期間會因一兩件事件讓等級亂跳，全年才穩。
 *    （東京都オープンデータ API 是 2024/02 之後就沒更新的快照、期間不明，已棄用。）
 *
 * ② 其他 46 道府県 → 都道府県級・年度
 *    総務省「社会生活統計指標」（e-Stat），建置期抓成靜態快照。
 *
 * 為什麼不做到全國町丁目級：其餘道府県的開放資料只涵蓋「窃盗7手口」
 * 且 47 縣格式各異（逐筆事件 CSV、BODIK、CKAN…）；e-Stat 的市区町村級
 * 全罪種表停在 2009 年度。與其拼湊出看似精細實則不可比的數字，
 * 不如分層呈現並在 UI 明說精度差異。
 */

import {
  crimePrefectureMeta,
  findCrimePrefecture,
  type CrimePrefectureRow,
} from "../data/crimePrefectureSnapshot.js";
import tokyoCrimeSnapshot from "../data/tokyoCrimeSnapshot.json";

/* ────────── 型別定義 ────────── */

/** 單筆町丁目犯罪紀錄（欄位名沿用警視庁 CSV 的日文表頭） */
interface RawCrimeRow {
  row: number;
  市区町丁: string;
  総合計: number;
  凶悪犯計: number;
  凶悪犯強盗: number;
  凶悪犯その他: number;
  粗暴犯計: number;
  粗暴犯凶器準備集合: number;
  粗暴犯暴行: number;
  粗暴犯傷害: number;
  粗暴犯脅迫: number;
  粗暴犯恐喝: number;
  侵入窃盗計: number;
  侵入窃盗金庫破り: number;
  侵入窃盗学校荒し: number;
  侵入窃盗事務所荒し: number;
  侵入窃盗出店荒し: number;
  侵入窃盗空き巣: number;
  侵入窃盗忍込み: number;
  侵入窃盗居空き: number;
  侵入窃盗その他: number;
  非侵入窃盗計: number;
  非侵入窃盗自動車盗: number;
  非侵入窃盗オートバイ盗: number;
  非侵入窃盗自転車盗: number;
  非侵入窃盗車上ねらい: number;
  非侵入窃盗自販機ねらい: number;
  非侵入窃盗工事場ねらい: number;
  非侵入窃盗すり: number;
  非侵入窃盗ひったくり: number;
  非侵入窃盗置引き: number;
  非侵入窃盗万引き: number;
  非侵入窃盗その他: number;
  その他計: number;
  その他詐欺: number;
  その他占有離脱物横領: number;
  その他その他知能犯: number;
  その他賭博: number;
  その他その他刑法犯: number;
}

export interface CrimeBreakdownItem {
  /** 犯罪種類的翻譯標籤 */
  label: string;
  /** 件數 */
  count: number;
  /** 分類群組 */
  group: "residential" | "street" | "property" | "other";
  /** 圖示 */
  icon: string;
}

export type SafetyGrade = "A+" | "A" | "B+" | "B" | "C" | "D";

/** 今年至今累計（趨勢用；年初官網尚未發布時為 null）。 */
export interface CrimeYtdSummary {
  /** 例：「2026 年 1～7 月累計」 */
  label: string;
  throughMonth: number;
  totalCrimes: number;
  residentialCount: number;
  streetCount: number;
}

/** 對照全東京所有町丁目的相對位置（僅單一町丁目命中時計算，合併多個町丁目時不可比）。 */
export interface TokyoCrimeContext {
  /** 全東京町丁目數。 */
  chomeCount: number;
  /** 住宅侵入件數低於全東京多少比例的町丁目（中位名次法，0～100）。 */
  residentialSaferThanPercent: number;
  /** 街區粗暴分數低於全東京多少比例的町丁目。 */
  streetSaferThanPercent: number;
  /** 全罪種總件數低於全東京多少比例的町丁目。 */
  totalSaferThanPercent: number;
}

export interface CrimeSafetyResult {
  /** 查到的町丁目名稱（警視庁原文，丁目已轉半形） */
  chocho: string;
  /** 評級所用的統計期間，例：「令和7年（2025 年）全年」 */
  periodLabel: string;
  /** 評級所用的年份 */
  periodYear: number;
  /** 今年至今累計（趨勢用） */
  ytd: CrimeYtdSummary | null;
  /** 對照全東京的相對位置 */
  tokyoContext: TokyoCrimeContext | null;
  /** 犯罪總合計（評級期間） */
  totalCrimes: number;
  /** 住宅治安等級 */
  residentialGrade: SafetyGrade;
  /** 街區環境等級 */
  streetGrade: SafetyGrade;
  /** 犯罪種類拆解清單 */
  breakdown: CrimeBreakdownItem[];
  /** 一句話摘要 */
  summary: string;
  /** 資料來源標示 */
  credit: string;
}

/**
 * 都道府県級治安結果（東京都以外）。
 * 精度低於町丁目級，欄位刻意與 CrimeSafetyResult 分開，避免 UI 誤用成同等精度。
 */
export interface PrefectureSafetyResult {
  prefecture: string;
  /** 人口千人あたり刑法犯認知件数。 */
  crimeRatePerThousand: number;
  /** 全国平均（同年度）。 */
  nationalRatePerThousand: number;
  /** 相對全国平均的倍率，1 為與全国相同。 */
  vsNational: number;
  /** 1 = 全國最安全。 */
  safetyRank: number;
  totalPrefectures: number;
  clearanceRatePercent: number | null;
  felonySharePercent: number | null;
  violentSharePercent: number | null;
  theftSharePercent: number | null;
  grade: SafetyGrade;
  fiscalYear: string;
  summary: string;
  credit: string;
}

/** 查詢結果的統一封包，precision 讓 UI 明確區分兩種精度。 */
export type CrimeLookupResult =
  | { precision: "chome"; chome: CrimeSafetyResult }
  | { precision: "prefecture"; prefecture: PrefectureSafetyResult };

/* ────────── 地址解析 ────────── */

/**
 * 地址正規化。圖紙 OCR 出來的地址常帶全形數字與漢數字
 * （例：「世田谷区経堂１丁目」「港区港南三丁目」），而下游的 `\d`
 * 與警視庁 API 的「市区町丁」欄位都只認半形阿拉伯數字。
 * 不轉的話東京物件會白白掉到都道府県級，精度平白損失。
 */
function normalizeAddress(address: string): string {
  let addr = address.replace(/\s+/g, "");
  // 全形阿拉伯數字 → 半形
  addr = addr.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  // 全形連字號類 → 半形，避免「１−１」殘留怪符號
  addr = addr.replace(/[－―‐‑‒–—ー−]/g, "-");
  // 漢数字丁目 → 阿拉伯数字丁目。町丁目最多到 9 丁目為主，
  // 十位數（十一丁目等）罕見且格式不一，這裡只處理一～十。
  const kanji: Record<string, string> = {
    一: "1", 二: "2", 三: "3", 四: "4", 五: "5",
    六: "6", 七: "7", 八: "8", 九: "9", 十: "10",
  };
  addr = addr.replace(/([一二三四五六七八九十])丁目/g, (_, d: string) => `${kanji[d]}丁目`);
  return addr;
}

/**
 * 從 matchedAddress（如「東京都墨田区錦糸1丁目」）提取 API 可查的町丁目字串。
 * API 的「市区町丁」欄位格式為「墨田区錦糸1丁目」（不含「東京都」前綴）。
 * 可能回傳多個候選（精確町丁目 + 市區層級 fallback）。
 */
function extractChocho(address: string): string[] {
  const addr = normalizeAddress(address);
  const candidates: string[] = [];

  // ① 嘗試匹配「◯◯区/市 ◯◯N丁目」（精確町丁目）
  const choMatch = addr.match(/((?:[^\u90fd\u9053\u5e9c\u770c])[区市].+?\d+丁目)/);
  if (choMatch) {
    candidates.push(choMatch[1]);
  }

  // ② fallback：「◯◯区/市 + 町名」（不含丁目號碼）
  const wardMatch = addr.match(/((?:[^\u90fd\u9053\u5e9c\u770c])[区市][^\d]+)/);
  if (wardMatch) {
    const cleaned = wardMatch[1].replace(/\d.*$/, "").replace(/[丁目番号號].*$/, "");
    if (cleaned && !candidates.includes(cleaned)) {
      candidates.push(cleaned);
    }
  }

  return candidates;
}

/**
 * 更精確地從日本地址中提取 ward + 町名。
 * 例如 "東京都墨田区錦糸1丁目5-10" → "墨田区錦糸1丁目"
 */
function extractWardAndTown(address: string): string | null {
  const addr = normalizeAddress(address);
  // 移除 "東京都" 前綴
  const noPrefix = addr.replace(/^東京都/, "");
  // 嘗試匹配：区/市 + 町名 + N丁目
  const m = noPrefix.match(/^([^区市]+[区市])(.+?\d+丁目)/);
  if (m) return m[1] + m[2];
  // 嘗試匹配：区/市 + 町名（不含丁目）
  // 町名本身可能含「番」（千代田区一番町～六番町），不能把「番」當番地切掉；
  // [^\d]+ 已經在第一個數字前停下，番地數字不會混進來。
  const m2 = noPrefix.match(/^([^区市]+[区市])([^\d]+)/);
  if (m2) return m2[1] + m2[2].replace(/(?:番地|番|号|號)$/, "");
  return null;
}

/* ────────── 快照查詢 ────────── */

type SnapshotRow = [string, ...number[]];

interface CrimeSnapshotPeriod {
  year: number;
  label: string;
  rows: SnapshotRow[];
}

interface CrimeSnapshot {
  generatedAt: string;
  source: { name: string; url: string; license: string };
  columns: string[];
  annual: CrimeSnapshotPeriod;
  ytd: (CrimeSnapshotPeriod & { throughMonth: number }) | null;
}

const snapshot = tokyoCrimeSnapshot as unknown as CrimeSnapshot;

/** 快照用陣列存以省空間，這裡展開成有欄位名的物件；只在命中時做，不預先展開五千筆。 */
function inflateRow(row: SnapshotRow, index: number): RawCrimeRow {
  const obj: Record<string, number | string> = { row: index, 市区町丁: row[0] };
  snapshot.columns.forEach((column, i) => { obj[column] = row[i + 1] ?? 0; });
  return obj as unknown as RawCrimeRow;
}

/**
 * 依「区＋町名（＋丁目）」找町丁目。先找完全一致，沒有再用前綴找
 * （例如「墨田区錦糸」會撈到錦糸 1～4 丁目，由呼叫端合併）。
 * 前綴比對要求下一個字不是同一個町名的延續（「西日暮里」不能撈到「西日暮里台」這種不存在的假設情境），
 * 所以只接受後面直接接數字或結束。
 */
function findSnapshotRows(period: CrimeSnapshotPeriod, term: string): RawCrimeRow[] {
  const exact: RawCrimeRow[] = [];
  const prefixed: RawCrimeRow[] = [];
  period.rows.forEach((row, index) => {
    const name = row[0];
    if (name === term) exact.push(inflateRow(row, index));
    else if (name.startsWith(term) && /^\d/.test(name.slice(term.length))) prefixed.push(inflateRow(row, index));
  });
  return exact.length ? exact : prefixed;
}

/** 依名稱在另一期間找同一組町丁目（趨勢對照用）。 */
function findSameChome(period: CrimeSnapshotPeriod, names: string[]): RawCrimeRow[] {
  const wanted = new Set(names);
  const found: RawCrimeRow[] = [];
  period.rows.forEach((row, index) => { if (wanted.has(row[0])) found.push(inflateRow(row, index)); });
  return found;
}

/** 中位名次法百分位：嚴格更差的比例 + 相同者的一半。件數為 0 時不會得到「勝過 0%」這種誤導值。 */
function saferThanPercent(values: number[], value: number): number {
  let worse = 0;
  let same = 0;
  for (const v of values) {
    if (v > value) worse++;
    else if (v === value) same++;
  }
  return Math.round(((worse + same / 2) / values.length) * 100);
}

let tokyoDistribution: { residential: number[]; street: number[]; total: number[] } | null = null;

/** 全東京町丁目的分布，只算一次。 */
function getTokyoDistribution() {
  if (tokyoDistribution) return tokyoDistribution;
  const col = (name: string) => snapshot.columns.indexOf(name) + 1;
  const iInv = col("侵入窃盗計");
  const iViolent = col("粗暴犯計");
  const iSnatch = col("非侵入窃盗ひったくり");
  const iPick = col("非侵入窃盗すり");
  const iFelony = col("凶悪犯計");
  const iTotal = col("総合計");
  const residential: number[] = [];
  const street: number[] = [];
  const total: number[] = [];
  for (const row of snapshot.annual.rows) {
    residential.push(row[iInv] as number);
    street.push(streetScore(row[iViolent] as number, row[iSnatch] as number, row[iPick] as number, row[iFelony] as number));
    total.push(row[iTotal] as number);
  }
  tokyoDistribution = { residential, street, total };
  return tokyoDistribution;
}

/* ────────── 等級計算 ────────── */

function residentialGrade(burglaryTotal: number): SafetyGrade {
  // 令和 7 年全年全東京分布：0 件約 69%、1 件累計 88%、≤3 件 96%、≤6 件 97.5%。
  if (burglaryTotal === 0) return "A";
  if (burglaryTotal === 1) return "B+";
  if (burglaryTotal <= 3) return "B";
  if (burglaryTotal <= 6) return "C";
  return "D";
}

/**
 * 街區環境評分：粗暴犯為基礎，搶奪（對行人直接下手）加權 2 倍，
 * 凶惡犯（強盜・殺人・放火等）影響最大，加權 3 倍。
 */
function streetScore(violentTotal: number, snatching: number, pickpocket: number, feloniousTotal = 0): number {
  return violentTotal + snatching * 2 + pickpocket + feloniousTotal * 3;
}

function streetGrade(violentTotal: number, snatching: number, pickpocket: number, feloniousTotal = 0): SafetyGrade {
  // 門檻依令和 7 年全年、全東京 5,266 個町丁目的分布校準：
  // 0 分約占 41%、≤1 約 63%、≤3 約 80%、≤6 約 91%、≤15 約 96%，
  // 等級大致對應「前四成／前六成／前八成／前九成／後 4%」。
  const score = streetScore(violentTotal, snatching, pickpocket, feloniousTotal);
  if (score === 0) return "A+";
  if (score <= 1) return "A";
  if (score <= 3) return "B+";
  if (score <= 6) return "B";
  if (score <= 15) return "C";
  return "D";
}

/* ────────── 摘要文字 ────────── */

function buildSummary(row: RawCrimeRow): string {
  const parts: string[] = [];

  // 凶惡犯（強盜・殺人・放火等）最優先提示
  if (row.凶悪犯計 > 0) {
    parts.push(`凶惡犯罪 ${row.凶悪犯計} 件${row.凶悪犯強盗 > 0 ? `（含強盜 ${row.凶悪犯強盗} 件）` : ""}`);
  }

  // 住宅侵入
  if (row.侵入窃盗計 === 0) {
    parts.push("未見住宅侵入竊盜紀錄");
  } else {
    const details: string[] = [];
    if (row.侵入窃盗空き巣 > 0) details.push(`空巢 ${row.侵入窃盗空き巣} 件`);
    if (row.侵入窃盗忍込み > 0) details.push(`忍込み ${row.侵入窃盗忍込み} 件`);
    if (row.侵入窃盗居空き > 0) details.push(`居空き ${row.侵入窃盗居空き} 件`);
    if (row.侵入窃盗事務所荒し > 0) details.push(`事務所荒し ${row.侵入窃盗事務所荒し} 件`);
    if (row.侵入窃盗出店荒し > 0) details.push(`出店荒し ${row.侵入窃盗出店荒し} 件`);
    parts.push(`侵入竊盜 ${row.侵入窃盗計} 件（${details.join("・") || "其他手法"}）`);
  }

  // 粗暴犯
  if (row.粗暴犯計 > 0) {
    parts.push(`粗暴犯罪 ${row.粗暴犯計} 件`);
  }

  // 自行車竊盜（很常見、件數多但住宅影響低）
  if (row.非侵入窃盗自転車盗 > 0) {
    parts.push(`自行車竊盜 ${row.非侵入窃盗自転車盗} 件`);
  }

  // 搶奪
  if (row.非侵入窃盗ひったくり > 0) {
    parts.push(`搶奪 ${row.非侵入窃盗ひったくり} 件`);
  }

  if (parts.length === 0) return "此區域犯罪件數極低，整體治安環境良好。";

  // 判斷主要犯罪組成
  const mainCrime = row.非侵入窃盗自転車盗 > row.総合計 * 0.4 ? "犯罪主要為自行車竊盜" : null;
  // 有凶惡犯時絕不套用這句「安全」結論，避免蓋掉最該提醒的資訊。
  if (mainCrime && row.侵入窃盗計 === 0 && row.粗暴犯計 === 0 && row.凶悪犯計 === 0) {
    return `${mainCrime}，未見明顯住宅侵入犯罪或暴力犯罪集中。`;
  }

  return parts.join("；") + "。";
}

/* ────────── 主函式 ────────── */

export async function getCrimeSafety(matchedAddress: string): Promise<CrimeSafetyResult | null> {
  const chocho = extractWardAndTown(matchedAddress);
  const candidates = chocho ? [chocho] : extractChocho(matchedAddress);
  if (candidates.length === 0) return null;

  // 先精確到丁目，查不到再退到「区＋町名」（不含丁目數字）合併整個町。
  const terms = [...candidates];
  const broader = candidates[0].replace(/\d+丁目$/, "");
  if (broader !== candidates[0] && !terms.includes(broader)) terms.push(broader);

  for (const term of terms) {
    const rows = findSnapshotRows(snapshot.annual, term);
    if (rows.length > 0) return buildResult(rows);
  }
  return null;
}

function buildResult(rows: RawCrimeRow[]): CrimeSafetyResult {
  // 如果有多個町丁目（例如搜尋「錦糸」回傳 1-4 丁目），合併統計
  const merged: RawCrimeRow = rows.length === 1
    ? rows[0]
    : mergeRows(rows);

  const chocho = rows.length === 1
    ? rows[0].市区町丁
    : rows.map(r => r.市区町丁).join("・");

  const rGrade = residentialGrade(merged.侵入窃盗計);
  const sGrade = streetGrade(
    merged.粗暴犯計,
    merged.非侵入窃盗ひったくり,
    merged.非侵入窃盗すり,
    merged.凶悪犯計,
  );

  const breakdown: CrimeBreakdownItem[] = [
    // 住宅相關
    { label: "侵入竊盜（空巢）", count: merged.侵入窃盗空き巣, group: "residential", icon: "🏠" },
    { label: "侵入竊盜（忍込み）", count: merged.侵入窃盗忍込み, group: "residential", icon: "🌙" },
    { label: "侵入竊盜（居空き）", count: merged.侵入窃盗居空き, group: "residential", icon: "🚪" },
    { label: "侵入竊盜（其他）", count: merged.侵入窃盗事務所荒し + merged.侵入窃盗出店荒し + merged.侵入窃盗学校荒し + merged.侵入窃盗金庫破り + merged.侵入窃盗その他, group: "residential", icon: "🔓" },
    // 街區人身安全
    { label: "暴行", count: merged.粗暴犯暴行, group: "street", icon: "⚠️" },
    { label: "傷害", count: merged.粗暴犯傷害, group: "street", icon: "🩹" },
    { label: "搶奪（ひったくり）", count: merged.非侵入窃盗ひったくり, group: "street", icon: "🏃" },
    { label: "扒竊（すり）", count: merged.非侵入窃盗すり, group: "street", icon: "✋" },
    { label: "強盜", count: merged.凶悪犯強盗, group: "street", icon: "🚨" },
    { label: "恐嚇・脅迫", count: merged.粗暴犯脅迫 + merged.粗暴犯恐喝, group: "street", icon: "😰" },
    { label: "其他凶惡犯", count: merged.凶悪犯その他, group: "street", icon: "🛑" },
    // 財產類（常見但住宅影響相對低）
    { label: "自行車竊盜", count: merged.非侵入窃盗自転車盗, group: "property", icon: "🚲" },
    { label: "車上狙い", count: merged.非侵入窃盗車上ねらい, group: "property", icon: "🚗" },
    { label: "萬引き（商店竊盜）", count: merged.非侵入窃盗万引き, group: "property", icon: "🏪" },
    { label: "置引き（順手牽羊）", count: merged.非侵入窃盗置引き, group: "property", icon: "🧳" },
    { label: "機車・汽車竊盜", count: merged.非侵入窃盗自動車盗 + merged.非侵入窃盗オートバイ盗, group: "property", icon: "🏍️" },
    { label: "其他竊盜（自販機・工事場等）", count: merged.非侵入窃盗自販機ねらい + merged.非侵入窃盗工事場ねらい + merged.非侵入窃盗その他, group: "property", icon: "📦" },
    // 其他
    { label: "詐欺", count: merged.その他詐欺, group: "other", icon: "📞" },
    { label: "占有離脫物侵占", count: merged.その他占有離脱物横領, group: "other", icon: "🧾" },
    { label: "其他智慧犯・賭博", count: merged.その他その他知能犯 + merged.その他賭博, group: "other", icon: "🎲" },
    { label: "其他刑法犯", count: merged.その他その他刑法犯, group: "other", icon: "📋" },
  ];

  const ytdRows = snapshot.ytd ? findSameChome(snapshot.ytd, rows.map(r => r.市区町丁)) : [];
  const ytdMerged = ytdRows.length === 0 ? null : ytdRows.length === 1 ? ytdRows[0] : mergeRows(ytdRows);
  const ytd: CrimeYtdSummary | null = snapshot.ytd && ytdMerged
    ? {
        label: snapshot.ytd.label,
        throughMonth: snapshot.ytd.throughMonth,
        totalCrimes: ytdMerged.総合計,
        residentialCount: ytdMerged.侵入窃盗計,
        streetCount: ytdMerged.粗暴犯計,
      }
    : null;

  // 合併多個町丁目時件數是加總，跟單一町丁目的分布不可比，不給百分位。
  let tokyoContext: TokyoCrimeContext | null = null;
  if (rows.length === 1) {
    const dist = getTokyoDistribution();
    tokyoContext = {
      chomeCount: dist.total.length,
      residentialSaferThanPercent: saferThanPercent(dist.residential, merged.侵入窃盗計),
      streetSaferThanPercent: saferThanPercent(
        dist.street,
        streetScore(merged.粗暴犯計, merged.非侵入窃盗ひったくり, merged.非侵入窃盗すり, merged.凶悪犯計),
      ),
      totalSaferThanPercent: saferThanPercent(dist.total, merged.総合計),
    };
  }

  return {
    chocho,
    periodLabel: snapshot.annual.label,
    periodYear: snapshot.annual.year,
    ytd,
    tokyoContext,
    totalCrimes: merged.総合計,
    residentialGrade: rGrade,
    streetGrade: sGrade,
    breakdown,
    summary: buildSummary(merged),
    credit: `資料來源：警視庁「区市町村の町丁別、罪種別及び手口別認知件数」（CC BY 4.0）｜${snapshot.annual.label}`,
  };
}

function mergeRows(rows: RawCrimeRow[]): RawCrimeRow {
  const base = { ...rows[0] };
  const numericKeys = Object.keys(base).filter(k => k !== "row" && k !== "市区町丁") as (keyof RawCrimeRow)[];
  for (let i = 1; i < rows.length; i++) {
    for (const key of numericKeys) {
      (base as any)[key] = ((base as any)[key] ?? 0) + ((rows[i] as any)[key] ?? 0);
    }
  }
  return base;
}

/* ────────── 都道府県級（東京都以外） ────────── */

/** 47 都道府県的正式名稱。地址開頭比對用，長名優先避免「京都府」被「京都」誤切。 */
const PREFECTURE_NAMES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

/** 政令指定都市等，地址若省略都道府県時的回推對照。 */
const CITY_TO_PREFECTURE: Record<string, string> = {
  "札幌市": "北海道", "仙台市": "宮城県", "さいたま市": "埼玉県", "千葉市": "千葉県",
  "横浜市": "神奈川県", "川崎市": "神奈川県", "相模原市": "神奈川県",
  "新潟市": "新潟県", "静岡市": "静岡県", "浜松市": "静岡県", "名古屋市": "愛知県",
  "京都市": "京都府", "大阪市": "大阪府", "堺市": "大阪府", "神戸市": "兵庫県",
  "岡山市": "岡山県", "広島市": "広島県", "北九州市": "福岡県", "福岡市": "福岡県",
  "熊本市": "熊本県",
};

/** 從地址取出都道府県名。找不到回 null。 */
function extractPrefecture(address: string): string | null {
  const addr = normalizeAddress(address);
  for (const name of PREFECTURE_NAMES) {
    if (addr.includes(name)) return name;
  }
  for (const [city, prefecture] of Object.entries(CITY_TO_PREFECTURE)) {
    if (addr.includes(city)) return prefecture;
  }
  return null;
}

/**
 * 都道府県等級：用「相對全国平均的倍率」而非絕對件數。
 * 都道府県級的基數差異極大（東京 vs 秋田），絕對值不可比。
 */
function prefectureGrade(vsNational: number): SafetyGrade {
  if (vsNational <= 0.6) return "A+";
  if (vsNational <= 0.8) return "A";
  if (vsNational <= 1.0) return "B+";
  if (vsNational <= 1.2) return "B";
  if (vsNational <= 1.5) return "C";
  return "D";
}

function buildPrefectureResult(row: CrimePrefectureRow, totalPrefectures: number): PrefectureSafetyResult {
  const national = crimePrefectureMeta.nationalRatePerThousand;
  const diffPercent = Math.round((row.vsNational - 1) * 100);
  const comparison =
    diffPercent === 0 ? "與全國平均相當"
      : diffPercent > 0 ? `高於全國平均 ${diffPercent}%`
        : `低於全國平均 ${Math.abs(diffPercent)}%`;

  const parts = [
    `${row.prefecture}每千人刑法犯認知件數 ${row.crimeRatePerThousand} 件（全國平均 ${national} 件），${comparison}`,
    `安全度在 47 都道府県中排第 ${row.safetyRank} 名`,
  ];
  if (row.theftSharePercent !== null) {
    parts.push(`其中竊盜佔 ${row.theftSharePercent}%`);
  }

  return {
    prefecture: row.prefecture,
    crimeRatePerThousand: row.crimeRatePerThousand,
    nationalRatePerThousand: national,
    vsNational: row.vsNational,
    safetyRank: row.safetyRank,
    totalPrefectures,
    clearanceRatePercent: row.clearanceRatePercent,
    felonySharePercent: row.felonySharePercent,
    violentSharePercent: row.violentSharePercent,
    theftSharePercent: row.theftSharePercent,
    grade: prefectureGrade(row.vsNational),
    fiscalYear: crimePrefectureMeta.fiscalYear,
    summary: parts.join("；") + "。",
    credit: `資料來源：${crimePrefectureMeta.sourceName}／${crimePrefectureMeta.fiscalYear}`,
  };
}

/**
 * 全日本治安查詢入口。
 * 東京都回町丁目級；其他道府県回都道府県級；都無法解析時回 null。
 */
export async function lookupCrimeSafety(matchedAddress: string): Promise<CrimeLookupResult | null> {
  const prefecture = extractPrefecture(matchedAddress);

  // 東京都優先走町丁目級。查不到（地址精度不足、或該町丁目無紀錄）時
  // 不直接失敗，退回都道府県級，至少給得出可比的基準。
  if (prefecture === "東京都" || prefecture === null) {
    const chome = await getCrimeSafety(matchedAddress);
    if (chome) return { precision: "chome", chome };
  }

  if (!prefecture) return null;

  const row = findCrimePrefecture(prefecture);
  if (!row) return null;
  return {
    precision: "prefecture",
    prefecture: buildPrefectureResult(row, crimePrefectureMeta.prefectureCount),
  };
}

/**
 * 僅供測試使用的內部函式出口（scripts/test-crime-safety.ts）。
 * 讓評級與明細對帳邏輯可以離線回歸。
 */
export const __testing = {
  buildResult,
  extractWardAndTown,
  mergeRows,
  extractPrefecture,
  prefectureGrade,
  buildPrefectureResult,
  normalizeAddress,
  saferThanPercent,
  findSnapshotRows,
  snapshot,
};
