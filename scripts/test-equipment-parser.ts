import assert from "node:assert/strict";
import { parseEquipmentList } from "../src/lib/equipmentParser";

const samples = [
  "バストイレ別,室内洗濯機置場,バルコニー,クローゼット,トランクルーム",
  "オートロック,プライベートトランクルーム,ペット可(細則有),2面採光,専用トランク,専用ポーチ,バルコニー",
  "24時間有人管理,多重セキュリティシステム,コンシェルジュサービス,ラウンジ,ゲストルーム,ジム,各フロアゴミ置き場有,24時間ゴミ出し対応,バルコニー,シューズインクローゼット(SIC),ウォークインクローゼット(WIC),バストイレ別,パウダールーム,独立洗面台",
  "駐輪スペース,防犯カメラ,宅配ボックス,光ファイバー,CATV,都市ガス,インターホン,下駄箱,エアコン(1基),ガスコンロ(1口),室内洗濯機置場",
  "オートロック,バルコニー洗置,クローゼット,1口IHコンロ,エアコン1基(設備:洋室),フローリング,バルコニー,駐輪場",
  "防犯カメラ,外壁タイル張り,分譲タイプ,エレベーター,24時間ゴミ出し可,風除室,敷地内ゴミ置き場,宅配BOX,集会所,システムキッチン,洋室(8.2畳),バルコニー",
];

const parsed = samples.map(parseEquipmentList);
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
]) {
  assert.ok(names.includes(expected), `missing Chinese equipment label: ${expected}`);
}

for (const items of parsed) {
  for (const item of items) {
    assert.doesNotMatch(item.nameZh, /[\u3040-\u30ff]/, `Japanese text leaked into visible label: ${item.nameZh}`);
    assert.ok(item.rawJa, `missing hover source text for ${item.nameZh}`);
  }
}

console.log(`Equipment parser: ${parsed.length} sampled floor plans / ${names.length} visible labels passed`);
