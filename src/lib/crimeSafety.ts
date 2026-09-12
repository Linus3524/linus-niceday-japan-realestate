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
import tokyoPopulationSnapshot from "../data/tokyoPopulationSnapshot.json";

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

/**
 * 住宅侵入竊盜率（每千戶・年）。
 *
 * 為什麼要有這個：
 * 絕對件數無法比較不同規模的町丁目。實測中央区銀座8丁目侵入竊盜 50 件（全東京最高），
 * 但住家手口 0 件、住戶 495 戶——那 50 件全是店舖遭竊。只看件數會把它判成最危險，
 * 但對住戶而言風險是 0。
 *
 * 分子刻意只取住家三手口（空き巣・忍込み・居空き）：
 * 警視庁的「侵入窃盗計」混入事務所荒し・出店荒し・学校荒し，實測佔比高達 58.5%，
 * 那些是商業設施遭竊，與住戶曝險無關。
 *
 * 分母用世帯數而非人口：侵入竊盜的標的是「一戶住宅」，不是「一個人」。
 */
export interface ResidentialBurglaryRate {
  /** 住家三手口合計件數（評級期間）。 */
  count: number;
  /** 該町丁目世帯數。 */
  households: number;
  /** 每千戶件數。 */
  per1000: number;
  /** 低於全東京多少比例的町丁目（愈高愈安全）。 */
  saferThanPercent: number;
}

/**
 * 無法計算率的原因。分母太小或查無資料時，硬算會產生無意義的極端值
 * （實測大田区昭和島1丁目：3 件 ÷ 1 戶 = 每千戶 3,000 件）。
 */
export type RateUnavailableReason = "no-population-data" | "too-few-households";

/**
 * 街區活動強度。**刻意不是治安等級。**
 *
 * 原本這裡是「街區人身環境 A+~D」，但實測顯示那個分數在測的其實是人流量：
 *   與総合計的 Spearman 0.613（主要驅動力是「這裡發生多少事」）
 *   與人口的 Spearman 僅 0.327（跟住多少人關係不大）
 *   佔比最大的「暴行」與商業指標相關 0.351，是所有項目中最受商業污染的
 *
 * 而且無法用人口標準化修正——ひったくり vs 人口 Spearman 只有 0.022，
 * すり 0.014，街頭犯罪根本不隨居住人口等比例增加，沒有正確的分母可用。
 *
 * 所以改成事實陳述：把同一個分數的意義從「治安好壞」改成
 * 「安靜住宅區 ↔ 繁華商業區」，這才是它真正測到的東西。
 * 歌舞伎町是 `entertainment` 不再是扣分，而是準確的描述。
 */
export type StreetActivityLevel =
  | "quiet"          // 全年無街頭案件紀錄
  | "residential"    // 一般生活街區
  | "mixed"          // 住商混合
  | "busy"           // 人流密集商圈
  | "entertainment"; // 繁華街／大型轉運站

/**
 * 對行人的直接危害事件。
 *
 * 與街區活動強度分開呈現的理由：
 * ひったくり 與商業指標相關性只有 0.088、凶悪犯 0.203，
 * 明顯低於暴行的 0.351——它們是「對路過的人下手」，不是商圈熱鬧的副產品。
 * 但兩者合計只有 14.5% 的町丁目非零，做成等級會有 85% 同分為 0，
 * 因此只列件數，不給等級。
 */
export interface PedestrianRiskItem {
  label: string;
  count: number;
  /** 全東京有多少個町丁目也發生過此類事件，用來說明稀有程度。 */
  chomeWithAny: number;
}

/** 年對年趨勢。必須同為完整年度，否則 7 個月對 12 個月會假性下降。 */
export interface CrimeTrend {
  /** 例：「令和7年」 */
  currentLabel: string;
  /** 例：「令和6年」 */
  previousLabel: string;
  current: number;
  previous: number;
  /** 變化百分比；previous 為 0 時為 null（無法計算倍率）。 */
  changePercent: number | null;
  direction: "up" | "down" | "flat";
}

/** 對照全東京所有町丁目的相對位置（僅單一町丁目命中時計算，合併多個町丁目時不可比）。 */
export interface TokyoCrimeContext {
  /** 全東京町丁目數。 */
  chomeCount: number;
  /** 住宅侵入件數低於全東京多少比例的町丁目（中位名次法，0～100）。 */
  residentialSaferThanPercent: number;
  /**
   * 街區分數低於全東京多少比例的町丁目。
   * 注意：街區分數已改為「活動強度」，高低無優劣之分，
   * UI 刻意不把這個數字放進「愈高愈安全」的並列，只保留供分析使用。
   */
  streetSaferThanPercent: number;
  /** 全罪種總件數低於全東京多少比例的町丁目。 */
  totalSaferThanPercent: number;
  /**
   * 住宅侵入率由高到低的名次（1 = 全東京最高）。
   * C／D 這種開放區間內部差距極大，只給等級會讓兩端看起來一樣嚴重，
   * 因此另外提供名次做程度區分。
   */
  residentialRankFromWorst: number;
  /** 街區分數由高到低的名次（1 = 全東京最熱鬧）。 */
  streetRankFromWorst: number;
}

export interface CrimeSafetyResult {
  /** 查到的町丁目名稱（警視庁原文，丁目已轉半形） */
  chocho: string;
  /** 評級所用的統計期間，例：「令和7年（2025 年）全年」 */
  periodLabel: string;
  /** 評級所用的年份 */
  periodYear: number;
  /** 對照全東京的相對位置 */
  tokyoContext: TokyoCrimeContext | null;
  /** 犯罪總合計（評級期間） */
  totalCrimes: number;
  /**
   * 住宅侵入竊盜率。可計算時為物件，否則為無法計算的原因。
   * 評級優先採用率；退回件數時 UI 必須明確標示精度差異。
   */
  burglaryRate: ResidentialBurglaryRate | RateUnavailableReason;
  /** 住宅治安等級 */
  residentialGrade: SafetyGrade;
  /**
   * 街區活動強度（非治安等級）。
   * 保留 streetGrade 會讓「住宅 A ／街區 D」同框出現，實測有 302 個町丁目
   * （6.5%）落在這種組合，清一色是神保町、銀座、赤坂這類住家侵入 0 件的地方。
   */
  streetActivity: StreetActivityLevel;
  /** 街區案件加權分數。保留原始數值供排序與名次使用。 */
  streetScore: number;
  /** 對行人的直接危害事件（搶奪、凶惡犯），稀有故只列件數。 */
  pedestrianRisks: PedestrianRiskItem[];
  /** 住家侵入竊盜的年對年趨勢。 */
  burglaryTrend: CrimeTrend | null;
  /** 街區案件的年對年趨勢。 */
  streetTrend: CrimeTrend | null;
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
  /** 前一個完整年度，用於年對年趨勢。 */
  previous: CrimeSnapshotPeriod | null;
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

/**
 * 由高到低的名次（1 = 最高）。同分取最前面的名次，與體育排名同慣例。
 * 用來區分同一等級內的程度差異。
 */
function rankFromWorst(values: number[], value: number): number {
  let worse = 0;
  for (const v of values) {
    if (v > value) worse++;
  }
  return worse + 1;
}

/**
 * 警視庁 CSV 內含「◯◯区計」「23区計」「多摩地区・島部計」「合計」等彙總列（共 62 列）。
 * findSnapshotRows 查詢時因為要求前綴後接數字，不會誤中這些列；
 * 但百分位的母體若混入它們，就等於把「整個區的件數」當成一個町丁目來比，
 * 會系統性高估每個物件的安全百分位（實測約 +1 個百分點），且方向偏樂觀。
 */
function isAggregateRow(name: string): boolean {
  return name === "合計" || /計$/.test(name);
}

let tokyoDistribution: {
  residential: number[];
  street: number[];
  total: number[];
  chomeCount: number;
} | null = null;

/** 全東京町丁目的分布，只算一次。已排除彙總列，母體為真實町丁目。 */
function getTokyoDistribution() {
  if (tokyoDistribution) return tokyoDistribution;
  const col = (name: string) => snapshot.columns.indexOf(name) + 1;
  // 住宅分布用住家三手口，與評級同一把尺。
  // 用「侵入窃盗計」會把事務所荒し算進來（佔全體 58.5%），
  // 導致百分位跟等級講不同的故事。
  const iAkisu = col("侵入窃盗空き巣");
  const iShinobi = col("侵入窃盗忍込み");
  const iIaki = col("侵入窃盗居空き");
  const iViolent = col("粗暴犯計");
  const iSnatch = col("非侵入窃盗ひったくり");
  const iPick = col("非侵入窃盗すり");
  const iFelony = col("凶悪犯計");
  const iTotal = col("総合計");
  const residential: number[] = [];
  const street: number[] = [];
  const total: number[] = [];
  for (const row of snapshot.annual.rows) {
    if (isAggregateRow(row[0] as string)) continue;
    residential.push((row[iAkisu] as number) + (row[iShinobi] as number) + (row[iIaki] as number));
    street.push(streetScore(row[iViolent] as number, row[iSnatch] as number, row[iPick] as number, row[iFelony] as number));
    total.push(row[iTotal] as number);
  }
  tokyoDistribution = { residential, street, total, chomeCount: total.length };
  return tokyoDistribution;
}

/* ────────── 住宅侵入竊盜率 ────────── */

/**
 * 世帯數低於此值就不計算率。
 * 商辦・工業・埋立地的町丁目住戶數可能只有個位數，任何一件都會讓率爆炸
 * （實測：大田区昭和島1丁目 3 件 ÷ 1 戶 = 每千戶 3,000 件）。
 * 300 戶約可讓「1 件」對應到 3.3 件/千戶，仍在可解釋範圍內。
 * 此門檻會排除約 8% 的町丁目，它們退回顯示絕對件數。
 */
const MIN_HOUSEHOLDS_FOR_RATE = 300;

/**
 * D 級（唯一的紅色警示）至少要有這麼多件才成立，否則最多給到 C。
 *
 * 純用率會讓「400 戶的町丁目發生 1 件」= 2.5 件/千戶 = D。
 * 但單一事件在統計上根本無法區分 2.5 與 0.5 的地區，那只是一次意外。
 * 實測 58 個 D 級中有 39 個（67%）是靠 1～2 件撐起來的。
 *
 * 這個門檻也順帶解決了多摩地區被系統性上修的問題：
 * D 級佔比 23區 0.77% vs 多摩島 2.03%（2.7 倍落差），
 * 加上「至少 3 件」後變成 0.42% vs 0.40%（0.9 倍）——落差完全消失。
 * 可見那不是多摩獨棟住宅區真的比較危險，而是郊區町丁目戶數較少、
 * 分母小導致單一案件被放大。用最低件數處理比針對地區做例外更誠實。
 */
const MIN_INCIDENTS_FOR_WORST_GRADE = 3;

const populationSnapshot = tokyoPopulationSnapshot as unknown as {
  year: number;
  label: string;
  households: Record<string, [number, number]>;
};

/** 查該町丁目的世帯數。查無回 null。 */
function lookupHouseholds(chocho: string): number | null {
  const entry = populationSnapshot.households[chocho];
  return entry ? entry[0] : null;
}

/** 住家三手口：空き巣（空屋）、忍込み（夜間潛入）、居空き（在宅時潛入）。 */
function residentialBurglaryCount(row: RawCrimeRow): number {
  return row.侵入窃盗空き巣 + row.侵入窃盗忍込み + row.侵入窃盗居空き;
}

let burglaryRateDistribution: number[] | null = null;

/** 全東京各町丁目的住宅侵入竊盜率分布（僅含戶數足夠者），只算一次。 */
function getBurglaryRateDistribution(): number[] {
  if (burglaryRateDistribution) return burglaryRateDistribution;
  const col = (name: string) => snapshot.columns.indexOf(name) + 1;
  const iAkisu = col("侵入窃盗空き巣");
  const iShinobi = col("侵入窃盗忍込み");
  const iIaki = col("侵入窃盗居空き");
  const rates: number[] = [];
  for (const row of snapshot.annual.rows) {
    const name = row[0] as string;
    if (isAggregateRow(name)) continue;
    const households = lookupHouseholds(name);
    if (households === null || households < MIN_HOUSEHOLDS_FOR_RATE) continue;
    const count = (row[iAkisu] as number) + (row[iShinobi] as number) + (row[iIaki] as number);
    rates.push((count / households) * 1000);
  }
  burglaryRateDistribution = rates;
  return rates;
}

/* ────────── 等級計算 ────────── */

/**
 * 住宅評級（率）。門檻依令和 7 年全年、4,639 個戶數足夠的町丁目校準：
 *   0 件      → 84.2%
 *   ≤0.5 件   → 89.8%
 *   ≤1 件     → 95.3%
 *   ≤2 件     → 98.7%
 * 界線取 0.5 的整數倍，方便對使用者解釋（「每千戶每年 2 件以上」）。
 */
function residentialGradeByRate(per1000: number, count: number): SafetyGrade {
  if (per1000 === 0) return "A";
  if (per1000 <= 0.5) return "B+";
  if (per1000 <= 1) return "B";
  if (per1000 <= 2) return "C";
  // 率雖然到 D，但件數太少不足以支撐「紅色警示」這種強度的結論。
  return count >= MIN_INCIDENTS_FOR_WORST_GRADE ? "D" : "C";
}

/**
 * 住宅評級（件數）。僅在無法取得世帯數時退回使用。
 *
 * 傳入值必須是住家三手口（空き巣＋忍込み＋居空き），**不可以是「侵入窃盗計」**：
 * 後者有 58.5% 是事務所荒し・出店荒し，而會走到這條退回路徑的地方
 * 正是商辦與繁華街（世帯數 < 300），污染最嚴重。
 * 歌舞伎町1丁目住家侵入 0 件，若用合計會被評成 D，等於對著住戶
 * 拿商家的遭竊數字說「你家危險」。
 */
function residentialGrade(homeBurglaryCount: number): SafetyGrade {
  if (homeBurglaryCount === 0) return "A";
  if (homeBurglaryCount === 1) return "B+";
  if (homeBurglaryCount <= 3) return "B";
  if (homeBurglaryCount <= 6) return "C";
  return "D";
}

/**
 * 街區環境評分：粗暴犯為基礎，搶奪（對行人直接下手）加權 2 倍，
 * 凶惡犯（強盜・殺人・放火等）影響最大，加權 3 倍。
 */
function streetScore(violentTotal: number, snatching: number, pickpocket: number, feloniousTotal = 0): number {
  return violentTotal + snatching * 2 + pickpocket + feloniousTotal * 3;
}

/**
 * 街區活動強度。沿用原本的分數與門檻，但改成描述性分類而非優劣等級。
 *
 * 門檻依令和 7 年全年、全東京町丁目分布校準：
 * 0 分約占 41%、≤3 約 80%、≤6 約 91%、≤15 約 96%。
 * 分界點不變是刻意的——這個分數確實能區分安靜住宅區與繁華街（與総合計相關 0.613），
 * 問題只在於原本把「熱鬧」講成「危險」。
 */
function streetActivityLevel(score: number): StreetActivityLevel {
  if (score === 0) return "quiet";
  if (score <= 3) return "residential";
  if (score <= 6) return "mixed";
  if (score <= 15) return "busy";
  return "entertainment";
}

/**
 * 計算年對年趨勢。
 *
 * 只接受兩個完整年度。刻意不提供「YTD vs 全年」的版本：
 * 官網沒有去年同期的累計檔，7 個月對 12 個月會讓每個地區都假性下降約 40%。
 */
function buildTrend(
  current: number,
  previous: number,
  currentLabel: string,
  previousLabel: string,
): CrimeTrend {
  const diff = current - previous;
  // 町丁目件數很小，±1 件在統計上沒有意義，視為持平。
  const direction = Math.abs(diff) <= 1 ? "flat" : diff > 0 ? "up" : "down";
  return {
    currentLabel,
    previousLabel,
    current,
    previous,
    changePercent: previous === 0 ? null : Math.round((diff / previous) * 100),
    direction,
  };
}

let pedestrianPrevalence: { snatch: number; felony: number } | null = null;

/** 全東京有多少町丁目發生過搶奪／凶惡犯，用來說明這類事件有多罕見。 */
function getPedestrianPrevalence() {
  if (pedestrianPrevalence) return pedestrianPrevalence;
  const iSnatch = snapshot.columns.indexOf("非侵入窃盗ひったくり") + 1;
  const iFelony = snapshot.columns.indexOf("凶悪犯計") + 1;
  let snatch = 0;
  let felony = 0;
  for (const row of snapshot.annual.rows) {
    if (isAggregateRow(row[0] as string)) continue;
    if ((row[iSnatch] as number) > 0) snatch++;
    if ((row[iFelony] as number) > 0) felony++;
  }
  pedestrianPrevalence = { snatch, felony };
  return pedestrianPrevalence;
}

/* ────────── 摘要文字 ────────── */

function buildSummary(row: RawCrimeRow): string {
  const parts: string[] = [];

  // 凶惡犯（強盜・殺人・放火等）最優先提示
  if (row.凶悪犯計 > 0) {
    parts.push(`凶惡犯罪 ${row.凶悪犯計} 件${row.凶悪犯強盗 > 0 ? `（含強盜 ${row.凶悪犯強盗} 件）` : ""}`);
  }

  // 住家侵入。先講住家三手口，再把非住家的部分分開列，
  // 避免商辦遭竊被讀成住戶風險。
  const homeBurglary = residentialBurglaryCount(row);
  if (row.侵入窃盗計 === 0) {
    parts.push("未見侵入竊盜紀錄");
  } else if (homeBurglary === 0) {
    parts.push(`侵入竊盜 ${row.侵入窃盗計} 件（全為事務所、店舖等非住家案件）`);
  } else {
    const details: string[] = [];
    if (row.侵入窃盗空き巣 > 0) details.push(`空巢 ${row.侵入窃盗空き巣} 件`);
    if (row.侵入窃盗忍込み > 0) details.push(`忍込み ${row.侵入窃盗忍込み} 件`);
    if (row.侵入窃盗居空き > 0) details.push(`居空き ${row.侵入窃盗居空き} 件`);
    parts.push(`住家侵入竊盜 ${homeBurglary} 件（${details.join("・")}）`);

    // 非住家的部分獨立成句，不與住家數字混在同一個括號裡。
    const nonHome = row.侵入窃盗計 - homeBurglary;
    if (nonHome > 0) {
      const nonHomeDetails: string[] = [];
      if (row.侵入窃盗事務所荒し > 0) nonHomeDetails.push(`事務所荒し ${row.侵入窃盗事務所荒し} 件`);
      if (row.侵入窃盗出店荒し > 0) nonHomeDetails.push(`出店荒し ${row.侵入窃盗出店荒し} 件`);
      parts.push(
        `另有非住家侵入 ${nonHome} 件` +
        (nonHomeDetails.length ? `（${nonHomeDetails.join("・")}）` : "")
      );
    }
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

  // 跨多個町丁目時戶數要一起加總，否則率會被高估數倍。
  // 任一町丁目查不到戶數就整體放棄計算率——用殘缺的分母比不算更糟。
  const householdCounts = rows.map(r => lookupHouseholds(r.市区町丁));
  const totalHouseholds = householdCounts.some(h => h === null)
    ? null
    : householdCounts.reduce<number>((sum, h) => sum + (h as number), 0);

  const burglaryCount = residentialBurglaryCount(merged);
  let burglaryRate: ResidentialBurglaryRate | RateUnavailableReason;
  if (totalHouseholds === null) {
    burglaryRate = "no-population-data";
  } else if (totalHouseholds < MIN_HOUSEHOLDS_FOR_RATE * rows.length) {
    burglaryRate = "too-few-households";
  } else {
    const per1000 = (burglaryCount / totalHouseholds) * 1000;
    burglaryRate = {
      count: burglaryCount,
      households: totalHouseholds,
      per1000: Math.round(per1000 * 100) / 100,
      // 必須用中位名次法：84% 的町丁目為 0 件，若只算「嚴格更差」的比例，
      // 零案件的地方會顯示「安全於 16%」，看起來像後段班。
      saferThanPercent: saferThanPercent(getBurglaryRateDistribution(), per1000),
    };
  }

  // 有率就用率；退回件數只是保底，UI 會標示精度差異。
  const rGrade = typeof burglaryRate === "string"
    ? residentialGrade(residentialBurglaryCount(merged))
    : residentialGradeByRate(burglaryRate.per1000, burglaryRate.count);
  const sScoreValue = streetScore(
    merged.粗暴犯計,
    merged.非侵入窃盗ひったくり,
    merged.非侵入窃盗すり,
    merged.凶悪犯計,
  );
  const sActivity = streetActivityLevel(sScoreValue);

  // 對行人的直接危害。只列非零項目——把「搶奪 0 件」印出來反而像在暗示這是個議題。
  const prevalence = getPedestrianPrevalence();
  const pedestrianRisks: PedestrianRiskItem[] = [
    { label: "搶奪（ひったくり）", count: merged.非侵入窃盗ひったくり, chomeWithAny: prevalence.snatch },
    { label: "凶惡犯（強盜・殺人・放火等）", count: merged.凶悪犯計, chomeWithAny: prevalence.felony },
  ].filter(item => item.count > 0);

  // 年對年趨勢：同為完整年度才可比。
  const previousRows = snapshot.previous
    ? findSameChome(snapshot.previous, rows.map(r => r.市区町丁))
    : [];
  const previousMerged = previousRows.length === 0
    ? null
    : previousRows.length === 1 ? previousRows[0] : mergeRows(previousRows);

  const burglaryTrend = snapshot.previous && previousMerged
    ? buildTrend(
        residentialBurglaryCount(merged),
        residentialBurglaryCount(previousMerged),
        snapshot.annual.label,
        snapshot.previous.label,
      )
    : null;
  const streetTrend = snapshot.previous && previousMerged
    ? buildTrend(
        sScoreValue,
        streetScore(
          previousMerged.粗暴犯計,
          previousMerged.非侵入窃盗ひったくり,
          previousMerged.非侵入窃盗すり,
          previousMerged.凶悪犯計,
        ),
        snapshot.annual.label,
        snapshot.previous.label,
      )
    : null;

  const breakdown: CrimeBreakdownItem[] = [
    // 住宅相關
    { label: "侵入竊盜（空巢）", count: merged.侵入窃盗空き巣, group: "residential", icon: "🏠" },
    { label: "侵入竊盜（忍込み）", count: merged.侵入窃盗忍込み, group: "residential", icon: "🌙" },
    { label: "侵入竊盜（居空き）", count: merged.侵入窃盗居空き, group: "residential", icon: "🚪" },
    // 明講「非住家」：事務所荒し・出店荒し・学校荒し佔了侵入竊盜的 58.5%，
    // 標成「其他」會讓使用者把商辦遭竊誤讀成自家風險（銀座 8 丁目 50 件中住家 0 件）。
    { label: "侵入竊盜（非住家）", count: merged.侵入窃盗事務所荒し + merged.侵入窃盗出店荒し + merged.侵入窃盗学校荒し + merged.侵入窃盗金庫破り + merged.侵入窃盗その他, group: "residential", icon: "🔓" },
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

  // 合併多個町丁目時件數是加總，跟單一町丁目的分布不可比，不給百分位。
  let tokyoContext: TokyoCrimeContext | null = null;
  if (rows.length === 1) {
    const dist = getTokyoDistribution();
    const sScore = sScoreValue;
    tokyoContext = {
      chomeCount: dist.chomeCount,
      // 有率就用率的百分位，與等級同一把尺；否則退回件數百分位。
      residentialSaferThanPercent: typeof burglaryRate === "string"
        ? saferThanPercent(dist.residential, residentialBurglaryCount(merged))
        : burglaryRate.saferThanPercent,
      streetSaferThanPercent: saferThanPercent(dist.street, sScore),
      totalSaferThanPercent: saferThanPercent(dist.total, merged.総合計),
      // 名次同樣跟著等級的基準走，避免卡片上「等級用率、名次用件數」互相矛盾。
      residentialRankFromWorst: typeof burglaryRate === "string"
        ? rankFromWorst(dist.residential, residentialBurglaryCount(merged))
        : rankFromWorst(getBurglaryRateDistribution(), burglaryRate.per1000),
      streetRankFromWorst: rankFromWorst(dist.street, sScore),
    };
  }

  return {
    chocho,
    periodLabel: snapshot.annual.label,
    periodYear: snapshot.annual.year,
    tokyoContext,
    totalCrimes: merged.総合計,
    burglaryRate,
    residentialGrade: rGrade,
    streetActivity: sActivity,
    streetScore: sScoreValue,
    pedestrianRisks,
    burglaryTrend,
    streetTrend,
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
  rankFromWorst,
  isAggregateRow,
  getTokyoDistribution,
  findSnapshotRows,
  streetActivityLevel,
  buildTrend,
  snapshot,
};
