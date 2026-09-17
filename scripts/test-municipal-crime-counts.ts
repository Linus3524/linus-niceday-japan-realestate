import assert from "node:assert/strict";
import { getMunicipalCrimeResult, __testing } from "../src/lib/municipalCrimeBreakdown.js";
import { lookupCrimeSafety } from "../src/lib/crimeSafety.js";

const kashiwa = getMunicipalCrimeResult("千葉県柏市中新宿二丁目20番", "千葉県");
assert.ok(kashiwa);
assert.equal(kashiwa.municipality, "柏市");
assert.equal(kashiwa.total, 2778);
assert.equal(kashiwa.totalAreas, 59);
assert.equal(kashiwa.items.length, 59);
assert.ok(kashiwa.items.every(i => Boolean(i.area) && typeof i.count === "number" && typeof i.ratePerThousand === "number" && typeof i.rank === "number"));
assert.ok(kashiwa.breakdown);
assert.equal(kashiwa.breakdown.groups.reduce((sum, group) => sum + group.count, 0), kashiwa.total);
assert.equal(kashiwa.breakdown.scopeKind, "municipality");

const chuo = getMunicipalCrimeResult("千葉県千葉市中央区富士見二丁目", "千葉県");
assert.ok(chuo);
assert.equal(chuo.municipality, "千葉市中央区");
assert.equal(chuo.total, 2430);

// 埼玉市的政令市區用「さいたま市＋區名」對到官方表
const omiya = getMunicipalCrimeResult("埼玉県さいたま市大宮区桜木町一丁目", "埼玉県");
assert.ok(omiya);
assert.equal(omiya.municipality, "さいたま市大宮区");
assert.equal(getMunicipalCrimeResult("千葉県住所不明", "千葉県"), null);
// 還沒接入官方表的縣一律回 null，由呼叫端退回縣級
assert.equal(getMunicipalCrimeResult("沖縄県那覇市", "沖縄県"), null);
assert.equal(__testing.snapshot.prefectures["千葉県"].records.length, 59);

const routed = await lookupCrimeSafety("千葉県柏市中新宿二丁目20番");
assert.ok(routed && routed.precision === "prefecture");
if (routed?.precision === "prefecture") {
  assert.equal(routed.prefecture.municipal?.municipality, "柏市");
  assert.equal(routed.prefecture.breakdown?.scopeKind, "municipality");
}

// 縣有資料但地址對不到任何市區町村時，整卡退回縣級（不能拿別的市頂替）
const fallback = await lookupCrimeSafety("千葉県住所不明一丁目");
assert.ok(fallback && fallback.precision === "prefecture");
if (fallback?.precision === "prefecture") {
  assert.equal(fallback.prefecture.municipal, null);
  assert.equal(fallback.prefecture.breakdown?.scopeKind, "prefecture");
}

console.log("municipal crime tests: ok");
