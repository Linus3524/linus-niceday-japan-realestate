import { atHomeNationwideRentSnapshots } from "../../../data/atHomeNationwideRentSnapshot.js";
import { districtStations } from "../../../data/housingMarket.js";
import { mlitBuySnapshots } from "../../../data/mlitBuySnapshot.js";
import { toJapaneseStationName } from "../../transit.js";

export const normalizeStation = (value?: string | null) =>
  (toJapaneseStationName(value || ""))
    .toLowerCase()
    .replace(/涉谷|渋谷/g, "澀谷")
    .replace(/[\s・･（）()\-]/g, "");


export const normalizeAddressText = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/廣|広/g, "広")
  .replace(/德|徳/g, "徳")
  .replace(/靜|静/g, "静")
  .replace(/繩|縄/g, "縄")
  .replace(/兒|児/g, "児")
  .replace(/覇|霸/g, "霸")
  .replace(/姫|姬/g, "姬")
  .replace(/浜|濱/g, "濱")
  .replace(/稲|稻/g, "稻")
  .replace(/芸|藝/g, "藝")
  .replace(/桜|櫻/g, "櫻")
  .replace(/辺|邊/g, "邊")
  .replace(/竜|龍/g, "龍")
  .replace(/塩|鹽/g, "鹽")
  .replace(/蔵|藏/g, "藏")
  .replace(/郷|鄉/g, "鄉")
  .replace(/穂|穗/g, "穗")
  .replace(/緑|綠/g, "綠")
  .replace(/区/g, "區")
  .replace(/沢/g, "澤")
  .replace(/戸/g, "戶")
  .replace(/島/g, "嶋")
  .replace(/黒/g, "黑")
  .replace(/[\s・･（）()\-]/g, "");


export const nationwideListingMarkets = [...new Map(
  [...mlitBuySnapshots, ...atHomeNationwideRentSnapshots]
    .map(row => [`${row.region}|${row.district}`, { district: row.district, region: row.region }])
).values()].sort((a, b) => b.district.length - a.district.length);


export function resolveDistrictAndRegion(address: string, station: string): { district: string; region: string } | null {
  const cleanAddr = (address || "").replace(/\s+/g, "");

  if (cleanAddr) {
    const normAddr = normalizeAddressText(cleanAddr);

    // 直接使用國交省全國成交快照中的市區町村，不再受租金頁原本 210 個地區限制。
    // 完整名稱優先，並用都道府縣消除「府中市」等跨縣同名市的歧義。
    const matches = nationwideListingMarkets.filter(market => {
      const district = normalizeAddressText(market.district.replace("（市平均）", ""));
      return district.length >= 2 && normAddr.includes(district);
    });
    if (matches.length) {
      const addressRegion = [...new Set(nationwideListingMarkets.map(market => market.region))].find(regionName => {
        const region = normalizeAddressText(regionName).replace(/[都道府県]$/, "");
        return region.length >= 2 && normAddr.includes(region);
      });
      if (addressRegion) {
        // 同名市が他県にしかない（例如広島県府中市但快照只有東京都府中市）時，
        // 寧可回傳無資料，也不能把它錯配到另一個都道府縣。
        return matches.find(market => market.region === addressRegion) ?? null;
      }
      const prefectureMatch = matches.find(market => {
        const region = normalizeAddressText(market.region).replace(/[都道府県]$/, "");
        return region.length >= 2 && normAddr.includes(region);
      });
      return prefectureMatch || matches[0];
    }
  }

  // Chiba
  if (cleanAddr.includes("船橋")) return { district: "船橋市", region: "千葉" };
  if (cleanAddr.includes("千葉")) return { district: "千葉市", region: "千葉" };
  if (cleanAddr.includes("市川")) return { district: "市川市", region: "千葉" };
  if (cleanAddr.includes("柏")) return { district: "柏市", region: "千葉" };

  // Kanagawa
  if (cleanAddr.includes("横浜") || cleanAddr.includes("橫濱")) return { district: "橫濱", region: "神奈川" };
  if (cleanAddr.includes("川崎")) return { district: "川崎", region: "神奈川" };

  // Tokyo 23 wards
  const tokyoWards = [
    "千代田", "中央", "港", "新宿", "文京", "台東", "墨田", "江東", "品川", "目黑", "目黒", "大田",
    "世田谷", "渋谷", "澁谷", "中野", "杉並", "豊島", "豐島", "北", "荒川", "板橋", "練馬", "足立", "葛飾", "江戸川", "江戶川"
  ];
  for (const ward of tokyoWards) {
    if (cleanAddr.includes(ward)) {
      const normalized = ward
        .replace("目黒", "目黑")
        .replace("澁谷", "澀谷")
        .replace("渋谷", "澀谷")
        .replace("豊島", "豐島")
        .replace("江戸川", "江戶川");
      return { district: `${normalized}區`, region: "東京都" };
    }
  }

  // Fallback to station
  const cleanStation = (station || "").trim();
  if (!cleanStation) return null;
  if (cleanStation.includes("船橋")) return { district: "船橋市", region: "千葉" };
  for (const [dist, stations] of Object.entries(districtStations)) {
    if (stations.some(s => {
      const sName = normalizeStation(s.name);
      const cName = normalizeStation(cleanStation);
      return sName === cName || cName.includes(sName) || sName.includes(cName);
    })) {
      const isTokyo23 = /區$/.test(dist);
      const reg = dist === "川崎" || dist === "橫濱" ? "神奈川" : isTokyo23 ? "東京都" : "東京都";
      return { district: dist, region: reg };
    }
  }

  return null;
}
