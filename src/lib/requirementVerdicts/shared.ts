import { districtStations } from "../../data/housingMarket.js";
import { toJapaneseStationName } from "../transit.js";


export const yen = (value: number) => `¥${(Math.round(value / 1000) * 1000).toLocaleString("en-US")}`;
export const man = (value: number) => {
  const num = Math.round(value / 1000) / 10;
  return Number.isInteger(num)
    ? `${num.toLocaleString("en-US")} 萬円`
    : `${num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬円`;
};

/**
 * 預算專用：無條件捨去到 0.1 萬，不四捨五入。
 *
 * 使用者說「6萬多」時，擷取會取區間上緣 69,999；man() 再四捨五入就變成「7 萬円」，
 * 兩層向上偏移疊起來，畫面顯示的預算比使用者實際講的多了近 15%，
 * 後續所有判斷與報價都被這個虛高的數字錨定。行情數字維持四捨五入即可，
 * 但使用者自己的預算只能少報、不能多報。
 */
export const manBudget = (value: number) => `${(Math.floor(value / 1000) / 10).toFixed(1).replace(/\.0$/, "")} 萬円`;

export const normalize = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/[\s・･（）()\-]/g, "");

export const normalizeStation = (value?: string | null) => normalize(toJapaneseStationName(value || ""));

/** 通勤路線查詢前先確認站名在本站交通資料中，避免無效站名觸發多輪外部查詢。 */
export function hasKnownCommuteStations(value?: string | null, alternatives: string[] = []): boolean {
  const targets = [...alternatives, ...((value || "").split(/[、,，/／或|・]/))]
    .map(item => normalizeStation(item))
    .filter(Boolean);
  if (!targets.length) return false;
  return targets.every(query => Object.values(districtStations).some(stations =>
    stations.some(station => normalizeStation(station.name) === query)
  ));
}

/** 路線名比對用：去掉營運商前綴與車種後綴，「西武池袋線」與「池袋線」才對得上。 */
export const normalizeLine = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/各停|急行|快速|特急|準急|通勤/g, "");

/** 沒指定地點時的預設取樣範圍：一都三縣，也就是通勤得到都心的範圍。 */
export const METRO_REGIONS = new Set(["東京都", "神奈川", "埼玉", "千葉"]);

/** 價差大時，行情說明最多列幾個區。列太多會變成一長串清單，反而看不到重點。 */
export const SEGMENT_SHOWCASE = 5;
