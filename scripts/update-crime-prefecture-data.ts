/**
 * 從 e-Stat「社会生活統計指標（都道府県データ）」建立全國治安快照。
 *
 * 背景：全罪種的犯罪統計，只有東京都提供到「町丁目」且按月更新。
 * 其他 46 道府県的町丁目級開放資料只有「窃盗7手口」且各縣格式不一，
 * e-Stat 的市区町村級全罪種表（0000020111）又停在 2009 年度。
 * 因此全國覆蓋採都道府県級（表 0000010211，最新 2023 年度），
 * 讓非東京物件仍能對照全國基準，而不是直接顯示「不支援」。
 *
 * API Key 不會進到瀏覽器。放在 .env.local 後執行：
 *
 *   npm run data:update:crime
 */
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const APP_ID = process.env.ESTAT_APP_ID;
const STATS_DATA_ID = "0000010211";
const API_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";
const OUTPUT_PATH = resolve("src/data/crimePrefectureSnapshot.ts");
const SOURCE_URL = "https://www.e-stat.go.jp/dbview?sid=0000010211";

/** 人口千人あたり刑法犯認知件数 */
const CAT_RATE = "#K06101";
/** 刑法犯検挙率 */
const CAT_CLEARANCE = "#K06201";
/** 認知件数に占める凶悪犯の割合 */
const CAT_FELONY_SHARE = "#K06401";
/** 認知件数に占める粗暴犯の割合 */
const CAT_VIOLENT_SHARE = "#K06402";
/** 認知件数に占める窃盗犯の割合 */
const CAT_THEFT_SHARE = "#K06403";

const CATS = [CAT_RATE, CAT_CLEARANCE, CAT_FELONY_SHARE, CAT_VIOLENT_SHARE, CAT_THEFT_SHARE];

if (!APP_ID) {
  throw new Error("缺少 ESTAT_APP_ID。請到 https://www.e-stat.go.jp/ 註冊並將 appId 放進 .env.local。");
}

interface EstatValue {
  "@area": string;
  "@cat01": string;
  "@time": string;
  "@unit"?: string;
  $: string;
}

async function callApi(path: string, params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams({ appId: APP_ID!, ...params });
  const res = await fetch(`${API_BASE}/${path}?${query}`);
  if (!res.ok) throw new Error(`e-Stat ${path} HTTP ${res.status}`);
  return res.json();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** 讀 metaInfo，取得地區代碼對照與可用年度。 */
async function fetchMeta(): Promise<{ areas: Map<string, string>; times: Array<{ code: string; name: string }> }> {
  const json = await callApi("getMetaInfo", { statsDataId: STATS_DATA_ID });
  const result = json?.GET_META_INFO?.RESULT;
  if (result?.STATUS !== 0) throw new Error(`e-Stat metaInfo 失敗：${result?.ERROR_MSG ?? "unknown"}`);

  const areas = new Map<string, string>();
  let times: Array<{ code: string; name: string }> = [];
  for (const classObj of asArray<any>(json.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ)) {
    const entries = asArray<any>(classObj.CLASS);
    if (classObj["@id"] === "area") {
      for (const entry of entries) areas.set(entry["@code"], entry["@name"]);
    }
    if (classObj["@id"] === "time") {
      times = entries.map(entry => ({ code: entry["@code"], name: entry["@name"] }));
    }
  }
  return { areas, times };
}

/** 抓指定年度的所有指標。回傳 area → cat → 數值。 */
async function fetchYear(timeCode: string): Promise<Map<string, Map<string, number>>> {
  const json = await callApi("getStatsData", {
    statsDataId: STATS_DATA_ID,
    cdCat01: CATS.join(","),
    cdTime: timeCode,
    limit: "1000",
  });
  const result = json?.GET_STATS_DATA?.RESULT;
  // STATUS=1 是「查詢成功但無資料」。最新年度常已建表卻尚未填值，
  // 這屬於預期情況，回空集合讓呼叫端往前一個年度找，不是錯誤。
  if (result?.STATUS === 1) return new Map();
  if (result?.STATUS !== 0) throw new Error(`e-Stat getStatsData 失敗：${result?.ERROR_MSG ?? "unknown"}`);

  const values = asArray<EstatValue>(json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE);
  const byArea = new Map<string, Map<string, number>>();
  for (const value of values) {
    const raw = value.$;
    if (raw === "-" || raw === "***" || raw === "") continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) continue;
    if (!byArea.has(value["@area"])) byArea.set(value["@area"], new Map());
    byArea.get(value["@area"])!.set(value["@cat01"], parsed);
  }
  return byArea;
}

const { areas, times } = await fetchMeta();

// 年度由新到舊試，取第一個「48 地區都有每千人犯罪率」的年度。
// 最新年度常常已建表但尚未填值，直接取 times[0] 會得到空資料。
const sortedTimes = [...times].sort((a, b) => b.code.localeCompare(a.code));
let chosen: { code: string; name: string } | null = null;
let data: Map<string, Map<string, number>> | null = null;

for (const time of sortedTimes.slice(0, 6)) {
  const candidate = await fetchYear(time.code);
  const withRate = [...candidate.values()].filter(m => m.has(CAT_RATE)).length;
  console.log(`  ${time.name}：${withRate} 個地區有每千人犯罪率`);
  if (withRate >= 47) {
    chosen = time;
    data = candidate;
    break;
  }
}

if (!chosen || !data) throw new Error("近 6 個年度都沒有完整的都道府県犯罪率資料，已中止並保留既有快照。");

const national = data.get("00000");
const nationalRate = national?.get(CAT_RATE) ?? null;
if (nationalRate === null) throw new Error("缺少全国基準值，無法計算相對倍率，已中止。");

interface Row {
  code: string;
  prefecture: string;
  crimeRatePerThousand: number;
  clearanceRatePercent: number | null;
  felonySharePercent: number | null;
  violentSharePercent: number | null;
  theftSharePercent: number | null;
  /** 相對全国平均的倍率，1 為與全国相同。 */
  vsNational: number;
  /** 1 = 全國最安全。 */
  safetyRank: number;
}

const rows: Row[] = [];
for (const [code, metrics] of data) {
  if (code === "00000") continue;
  const rate = metrics.get(CAT_RATE);
  if (rate === undefined) continue;
  const name = areas.get(code);
  if (!name) continue;
  rows.push({
    code,
    prefecture: name,
    crimeRatePerThousand: rate,
    clearanceRatePercent: metrics.get(CAT_CLEARANCE) ?? null,
    felonySharePercent: metrics.get(CAT_FELONY_SHARE) ?? null,
    violentSharePercent: metrics.get(CAT_VIOLENT_SHARE) ?? null,
    theftSharePercent: metrics.get(CAT_THEFT_SHARE) ?? null,
    vsNational: Math.round((rate / nationalRate) * 1000) / 1000,
    safetyRank: 0,
  });
}

if (rows.length < 47) {
  throw new Error(`僅取得 ${rows.length} 個都道府県（應為 47），判定為抓取異常，已中止並保留既有快照。`);
}

rows.sort((a, b) => a.crimeRatePerThousand - b.crimeRatePerThousand);
rows.forEach((row, index) => { row.safetyRank = index + 1; });
rows.sort((a, b) => a.code.localeCompare(b.code));

const generatedAt = new Date().toISOString().slice(0, 10);
const body = `/**
 * 全國都道府県治安快照（e-Stat 社会生活統計指標）。
 *
 * 此檔由 \`npm run data:update:crime\` 產生，請勿手動編輯。
 *
 * 為什麼是都道府県級：全罪種的町丁目級統計只有東京都提供（且按月更新），
 * 其餘 46 道府県的開放資料僅涵蓋窃盗 7 手口且各縣格式不一；
 * e-Stat 的市区町村級全罪種表停在 2009 年度，過舊不宜使用。
 * 因此非東京物件以都道府県級對照全國基準，並在 UI 明確標示精度差異。
 */

export interface CrimePrefectureRow {
  /** e-Stat 地區代碼，例如 "13000"。 */
  code: string;
  prefecture: string;
  /** 人口千人あたり刑法犯認知件数。 */
  crimeRatePerThousand: number;
  clearanceRatePercent: number | null;
  felonySharePercent: number | null;
  violentSharePercent: number | null;
  theftSharePercent: number | null;
  /** 相對全国平均的倍率，1 為與全国相同。 */
  vsNational: number;
  /** 1 = 全國最安全（每千人犯罪率最低）。 */
  safetyRank: number;
}

export const crimePrefectureMeta = {
  generatedAt: "${generatedAt}",
  fiscalYear: "${chosen.name}",
  nationalRatePerThousand: ${nationalRate},
  prefectureCount: ${rows.length},
  statsDataId: "${STATS_DATA_ID}",
  sourceName: "総務省「社会生活統計指標（都道府県データ）Ｋ 安全」（e-Stat）",
  sourceUrl: "${SOURCE_URL}",
};

export const crimePrefectureRows: CrimePrefectureRow[] = ${JSON.stringify(rows, null, 2)};

const byPrefecture = new Map(crimePrefectureRows.map(row => [row.prefecture, row]));

/** 以都道府県名稱查詢，找不到回傳 null。 */
export function findCrimePrefecture(name: string): CrimePrefectureRow | null {
  return byPrefecture.get(name) ?? null;
}
`;

await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`\n已寫入 ${rows.length} 筆（${chosen.name}）到 ${OUTPUT_PATH}`);
console.log(`全国基準：${nationalRate} 件/千人`);
console.log(`最安全：${rows.slice().sort((a, b) => a.safetyRank - b.safetyRank)[0].prefecture}`);