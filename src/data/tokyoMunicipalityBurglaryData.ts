export interface TokyoMunicipalityBurglaryItem {
  area: string;
  count: number;
}

/**
 * 東京都 59 區市町村住宅侵入竊盜統計（空き巣＋忍込み＋居空き）
 * 資料來源：警視廳官方「区市町村の町丁別、罪種別及び手口別認知件数」年度統計
 */
export const TOKYO_MUNICIPALITY_BURGLARY_DATA: readonly TokyoMunicipalityBurglaryItem[] = [
  { area: "千代田区", count: 1 },
  { area: "中央区", count: 6 },
  { area: "港区", count: 15 },
  { area: "新宿区", count: 46 },
  { area: "文京区", count: 4 },
  { area: "台東区", count: 17 },
  { area: "墨田区", count: 21 },
  { area: "江東区", count: 12 },
  { area: "品川区", count: 27 },
  { area: "目黒区", count: 14 },
  { area: "大田区", count: 79 },
  { area: "世田谷区", count: 39 },
  { area: "渋谷区", count: 22 },
  { area: "中野区", count: 42 },
  { area: "杉並区", count: 30 },
  { area: "豊島区", count: 16 },
  { area: "北区", count: 29 },
  { area: "荒川区", count: 10 },
  { area: "板橋区", count: 41 },
  { area: "練馬区", count: 62 },
  { area: "足立区", count: 71 },
  { area: "葛飾区", count: 35 },
  { area: "江戸川区", count: 51 },
  { area: "八王子市", count: 52 },
  { area: "立川市", count: 10 },
  { area: "武蔵野市", count: 17 },
  { area: "三鷹市", count: 6 },
  { area: "青梅市", count: 9 },
  { area: "府中市", count: 9 },
  { area: "昭島市", count: 18 },
  { area: "調布市", count: 10 },
  { area: "町田市", count: 62 },
  { area: "小金井市", count: 4 },
  { area: "小平市", count: 8 },
  { area: "日野市", count: 15 },
  { area: "東村山市", count: 15 },
  { area: "国分寺市", count: 16 },
  { area: "国立市", count: 6 },
  { area: "福生市", count: 11 },
  { area: "狛江市", count: 6 },
  { area: "東大和市", count: 7 },
  { area: "清瀬市", count: 6 },
  { area: "東久留米市", count: 11 },
  { area: "武蔵村山市", count: 4 },
  { area: "多摩市", count: 13 },
  { area: "稲城市", count: 8 },
  { area: "羽村市", count: 5 },
  { area: "あきる野市", count: 2 },
  { area: "西東京市", count: 12 },
  { area: "西多摩郡瑞穂町", count: 0 },
  { area: "西多摩郡日の出町", count: 0 },
  { area: "西多摩郡檜原村", count: 0 },
  { area: "西多摩郡奥多摩町", count: 0 },
  { area: "大島町", count: 0 },
  { area: "新島村", count: 0 },
  { area: "神津島村", count: 0 },
  { area: "三宅島三宅村", count: 0 },
  { area: "八丈島八丈町", count: 0 },
  { area: "小笠原村", count: 0 },
] as const;

/** 簡稱轉換函式（去除郡島與尾碼，保留 1-4 字元高辨識度名稱） */
export function formatMunicipalityShortName(name: string): string {
  const stripped = name
    .replace(/^西多摩郡/, "")
    .replace(/^三宅島/, "")
    .replace(/^八丈島/, "");
  const base = stripped.replace(/(区|市|町|村)$/, "");
  // 單字如「北」「港」保留「北区」「港区」以利識別
  if (base.length <= 1) {
    return stripped;
  }
  return base;
}
