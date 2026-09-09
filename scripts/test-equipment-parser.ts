import assert from "node:assert/strict";
import {
  parseEquipmentList,
  translateRenovationDetails,
  translateOccupancyStatus,
} from "../src/lib/equipmentParser";

const samples = [
  "バストイレ別,室内洗濯機置場,バルコニー,クローゼット,トランクルーム",
  "オートロック,プライベートトランクルーム,ペット可(細則有),2面採光,専用トランク,専用ポーチ,バルコニー",
  "24時間有人管理,多重セキュリティシステム,コンシェルジュサービス,ラウンジ,ゲストルーム,ジム,各フロアゴミ置き場有,24時間ゴミ出し対応,バルコニー,シューズインクローゼット(SIC),ウォークインクローゼット(WIC),バストイレ別,パウダールーム,独立洗面台",
  "駐輪スペース,防犯カメラ,宅配ボックス,光ファイバー,CATV,都市ガス,インターホン,下駄箱,エアコン(1基),ガスコンロ(1口),室内洗濯機置場",
  "オートロック,バルコニー洗置,クローゼット,1口IHコンロ,エアコン1基(設備:洋室),フローリング,バルコニー,駐輪場",
  "防犯カメラ,外壁タイル張り,分譲タイプ,エレベーター,24時間ゴミ出し可,風除室,敷地内ゴミ置き場,宅配BOX,集会所,システムキッチン,洋室(8.2畳),バルコニー",
  "オートロック,TVモニター付インターホン,対面式キッチン,システムキッチン,オートバス,宅配ボックス,都市ガス,給湯器,エレベーター,フローリング,ウォークインクローゼット,エアコン,ダウンライト,二重天井",
];

const parsed = samples.map(sample => parseEquipmentList(sample));
const names = parsed.flatMap(items => items.map(item => item.nameZh));

for (const expected of [
  "乾濕分離",
  "個人儲藏室",
  "玄關門廊",
  "雙面採光",
  "多重門禁保全系統",
  "化妝盥洗室",
  "自行車停放處",
  "光纖網路",
  "室內對講機",
  "收納鞋櫃",
  "陽台洗衣機置場",
  "住戶集會室",
  "西式房間（8.2 帖）",
  "1 口瓦斯爐",
  "開放式中島／吧檯廚房",
  "天花板嵌燈",
  "雙層降噪天花板",
]) {
  assert.ok(names.includes(expected), `missing Chinese equipment label: ${expected}`);
}

for (const items of parsed) {
  for (const item of items) {
    assert.doesNotMatch(item.nameZh, /[\u3040-\u30ff]/, `Japanese text leaked into visible label: ${item.nameZh}`);
    assert.ok(item.rawJa, `missing hover source text for ${item.nameZh}`);
  }
}

// 測試裝修翻新內容繁體中文化
const rawRenovation = "リフォーム内容（令和4年1月実施）：フローリング張替、壁・天井クロス貼替、ユニットバス交換、キッチン交換、給湯器交換、ダウンライト設置、エアコン設置。平成25年大規模修繕工事実施。";
const translatedReno = translateRenovationDetails(rawRenovation);

assert.doesNotMatch(translatedReno, /[\u3040-\u30ff]/, `Japanese kana leaked in renovation details: ${translatedReno}`);
assert.match(translatedReno, /2022年/);
assert.match(translatedReno, /更換木質地板/);
assert.match(translatedReno, /壁紙與天花板壁紙更新/);
assert.match(translatedReno, /整體衛浴設備更新/);
assert.match(translatedReno, /系統廚房更換/);
assert.match(translatedReno, /瓦斯熱水器更換/);
assert.match(translatedReno, /天花板嵌燈裝設/);
assert.match(translatedReno, /冷暖空調安裝/);
assert.match(translatedReno, /2013年/);
assert.match(translatedReno, /大樓大規模修繕工程實施/);

// 測試現況引渡條件繁體中文化
assert.equal(translateOccupancyStatus("居住中（相談）"), "現有屋主居住中（交屋期需協商）");
assert.equal(translateOccupancyStatus("空室"), "現況空室（可即刻交屋）");
assert.equal(translateOccupancyStatus("賃貸中（オーナーチェンジ）"), "出租中（帶租約買賣）");

console.log(`Equipment parser: ${parsed.length} sampled floor plans / ${names.length} visible labels passed`);
console.log(`Renovation & occupancy translation tests passed: "${translatedReno}"`);

// Preserve the stated structure type without duplicating 新 or treating fire resistance as seismic resistance.
for (const [raw, expected] of [["新耐震", "新耐震結構"], ["新耐震基準", "新耐震結構"], ["新耐震構造", "新耐震結構"], ["新耐震結構", "新耐震結構"], ["耐震構造", "耐震結構"], ["耐火構造", "耐火結構"]]) {
  assert.deepEqual(parseEquipmentList(raw).map(item => item.nameZh), [expected]);
}
