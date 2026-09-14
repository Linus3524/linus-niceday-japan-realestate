import assert from "node:assert/strict";
import { atHomeNationwideRentSnapshots } from "../src/data/atHomeNationwideRentSnapshot.js";
import { getNationwideRentBenchmark } from "../src/data/nationwideRentMarket.js";
import { normalizeAddressText, resolveDistrictAndRegion } from "../src/lib/server/listing/marketLocation.js";

// 圖紙地址是日文寫法，At Home 快照的市區町村名是繁體異體字（稻毛區、橫濱市、埼玉市）。
// 這裡把快照名稱反轉成日文地址，逐一確認「地址 → 市區町村 → 租金行情」整條路都通。
// 2026-09 實測：稲毛區有資料卻判成「查無行情」，就是 normalize 少了「稲／稻」這一個字。
const toJapanese = (value: string) => value
  .replace("（市平均）", "")
  .replace(/區/g, "区").replace(/濱/g, "浜").replace(/橫/g, "横").replace(/稻/g, "稲")
  .replace(/澤/g, "沢").replace(/戶/g, "戸").replace(/嶋/g, "島").replace(/黑/g, "黒")
  .replace(/綠/g, "緑").replace(/豐/g, "豊").replace(/櫻/g, "桜").replace(/邊/g, "辺")
  .replace(/龍/g, "竜").replace(/鹽/g, "塩").replace(/藏/g, "蔵").replace(/鄉/g, "郷")
  .replace(/穗/g, "穂").replace(/藝/g, "芸").replace(/廣/g, "広").replace(/靜/g, "静")
  .replace(/姬/g, "姫").replace(/繩/g, "縄").replace(/埼玉市/g, "さいたま市");
const regionSuffix = (region: string) =>
  region === "東京都" || region === "北海道" ? region : ["大阪", "京都"].includes(region) ? `${region}府` : `${toJapanese(region)}県`;

const layouts = ["k1", "ldk1", "ldk2", "r1", "ldk3"] as const;
const failures: string[] = [];
for (const row of atHomeNationwideRentSnapshots) {
  if (row.district.includes("（市平均）")) continue;
  const address = `${regionSuffix(row.region)}${toJapanese(row.district)}1丁目1-1`;
  const resolved = resolveDistrictAndRegion(address, "");
  if (!resolved) { failures.push(`${address}: 解析不到市區町村`); continue; }
  const benchmark = layouts.map(layout => getNationwideRentBenchmark(resolved.region, resolved.district, layout)).find(Boolean);
  if (!benchmark) { failures.push(`${address}: ${resolved.region}/${resolved.district} 對不到 At Home 租金`); continue; }
  if (normalizeAddressText(benchmark.district.replace("（市平均）", "")) !== normalizeAddressText(row.district)) {
    failures.push(`${address}: 對到 ${benchmark.district}，應為 ${row.district}`);
  }
}
assert.equal(failures.length, 0, `At Home 租金快照有 ${failures.length} 個市區町村從日文地址對不到：\n${failures.slice(0, 20).join("\n")}`);

// 幾個曾經對錯的實例，獨立列出讓失敗訊息一眼看得懂。
const expectations: Array<[string, string]> = [
  ["千葉県千葉市稲毛区長沼町7-4", "千葉市稻毛區"],
  ["神奈川県横浜市青葉区美しが丘1-1", "橫濱市青葉區"],
  ["埼玉県さいたま市大宮区桜木町1-1", "埼玉市大宮區"],
  ["大阪府大阪市福島区福島1-1", "大阪市福島區"],          // 「福島」不是福島県
  ["滋賀県愛知郡愛荘町愛知川1", "愛知郡愛荘町"],           // 「愛知郡」不是愛知県
  ["愛知県名古屋市千種区今池1-1", "名古屋市千種區"],       // 不能被「名古屋市（市平均）」搶走
  ["愛知県北名古屋市西之保1", "北名古屋市"],
  ["埼玉県鶴ヶ島市脚折町1", "鶴ケ島市"],
];
for (const [address, expected] of expectations) {
  const resolved = resolveDistrictAndRegion(address, "");
  assert.ok(resolved, `${address} 解析不到市區町村`);
  const benchmark = layouts.map(layout => getNationwideRentBenchmark(resolved.region, resolved.district, layout)).find(Boolean);
  assert.ok(benchmark, `${address} 對不到 At Home 租金（${resolved.region}/${resolved.district}）`);
  assert.equal(normalizeAddressText(benchmark.district), normalizeAddressText(expected), `${address} 對到 ${benchmark.district}`);
}

console.log(`Market location: ${atHomeNationwideRentSnapshots.length} At Home municipalities resolve from Japanese addresses; ${expectations.length} regression cases passed.`);
