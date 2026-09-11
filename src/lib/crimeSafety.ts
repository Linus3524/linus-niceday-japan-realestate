/**
 * crimeSafety.ts — 東京都オープンデータ API 治安查詢
 *
 * 資料來源：警視庁「区市町村の町丁別、罪種別及び手口別認知件数（月累計）」
 * API Base:  https://service.api.metro.tokyo.lg.jp
 * 授權：CC BY（クリエイティブ・コモンズ 表示 4.0）
 * 無需 API Key / 帳號註冊
 */

const CRIME_API_URL =
  "https://service.api.metro.tokyo.lg.jp/api/t000022d1700000021-4eb9de23250eaab070a45dad29e76372-0/json";

/* ────────── 型別定義 ────────── */

/** API 回傳的單筆町丁目犯罪紀錄（欄位名為日文） */
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

export interface CrimeSafetyResult {
  /** 查到的町丁目名稱（API 原文） */
  chocho: string;
  /** 犯罪總合計 */
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

/* ────────── 地址解析 ────────── */

/**
 * 從 matchedAddress（如「東京都墨田区錦糸1丁目」）提取 API 可查的町丁目字串。
 * API 的「市区町丁」欄位格式為「墨田区錦糸1丁目」（不含「東京都」前綴）。
 * 可能回傳多個候選（精確町丁目 + 市區層級 fallback）。
 */
function extractChocho(address: string): string[] {
  const addr = address.replace(/\s+/g, "");
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
  const addr = address.replace(/\s+/g, "");
  // 移除 "東京都" 前綴
  const noPrefix = addr.replace(/^東京都/, "");
  // 嘗試匹配：区/市 + 町名 + N丁目
  const m = noPrefix.match(/^([^区市]+[区市])(.+?\d+丁目)/);
  if (m) return m[1] + m[2];
  // 嘗試匹配：区/市 + 町名（不含丁目）
  const m2 = noPrefix.match(/^([^区市]+[区市])([^\d]+)/);
  if (m2) return m2[1] + m2[2].replace(/[番号號].*$/, "");
  return null;
}

/* ────────── API 呼叫 ────────── */

async function queryTokyoCrimeApi(searchTerm: string): Promise<RawCrimeRow[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${CRIME_API_URL}?limit=20`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        searchCondition: {
          conditionRelationship: "and",
          stringAndSearch: [
            { column: "市区町丁", relationship: "contains", condition: searchTerm },
          ],
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Tokyo crime API error: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data?.hits ?? []) as RawCrimeRow[];
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error("Tokyo crime API timeout");
    } else {
      console.error("Tokyo crime API error:", err?.message ?? err);
    }
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/* ────────── 等級計算 ────────── */

function residentialGrade(burglaryTotal: number): SafetyGrade {
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
function streetGrade(violentTotal: number, snatching: number, pickpocket: number, feloniousTotal = 0): SafetyGrade {
  const score = violentTotal + snatching * 2 + pickpocket + feloniousTotal * 3;
  if (score === 0) return "A+";
  if (score <= 2) return "A";
  if (score <= 5) return "B+";
  if (score <= 10) return "B";
  if (score <= 20) return "C";
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
  // 解析地址，提取查詢用的町丁目
  const chocho = extractWardAndTown(matchedAddress);
  if (!chocho) {
    // fallback 用 extractChocho
    const candidates = extractChocho(matchedAddress);
    if (candidates.length === 0) return null;
    // 嘗試第一個候選
    const rows = await queryTokyoCrimeApi(candidates[0]);
    if (rows.length === 0 && candidates.length > 1) {
      const rows2 = await queryTokyoCrimeApi(candidates[1]);
      if (rows2.length === 0) return null;
      return buildResult(rows2);
    }
    if (rows.length === 0) return null;
    return buildResult(rows);
  }

  const rows = await queryTokyoCrimeApi(chocho);
  if (rows.length === 0) {
    // fallback: 用区名 + 町名（不含丁目數字）做更寬的搜尋
    const broader = chocho.replace(/\d+丁目$/, "");
    if (broader !== chocho) {
      const rows2 = await queryTokyoCrimeApi(broader);
      if (rows2.length > 0) return buildResult(rows2);
    }
    return null;
  }
  return buildResult(rows);
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

  return {
    chocho,
    totalCrimes: merged.総合計,
    residentialGrade: rGrade,
    streetGrade: sGrade,
    breakdown,
    summary: buildSummary(merged),
    credit: "資料來源：警視庁・東京都オープンデータ（CC BY 4.0）｜区市町村町丁別犯罪認知件數（月累計）",
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

/**
 * 僅供測試使用的內部函式出口（scripts/test-crime-safety.ts）。
 * 讓評級與明細對帳邏輯可以離線回歸，不需打外部 API。
 */
export const __testing = { buildResult, extractWardAndTown, mergeRows };
