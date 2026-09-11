/**
 * 治安資料模組回歸測試（離線，不呼叫外部 API）。
 *
 * 驗證重點：
 * ① 犯罪明細各項相加必須等於 API 的「総合計」——UI 上會同時顯示總計與明細，
 *    只要有欄位沒被歸類，使用者就會看到對不起來的數字。
 * ② 凶惡犯（強盜・殺人・放火等）必須反映在街區評級與摘要，不可被
 *    「主要為自行車竊盜」這類樂觀結論蓋掉。
 */
import assert from "node:assert/strict";
import { __testing } from "../src/lib/crimeSafety.js";

const { buildResult, extractWardAndTown } = __testing;

/** 依 API 欄位建立測試列，未指定的欄位一律為 0。 */
function row(overrides: Record<string, number | string> = {}) {
  const keys = [
    "凶悪犯計", "凶悪犯強盗", "凶悪犯その他",
    "粗暴犯計", "粗暴犯凶器準備集合", "粗暴犯暴行", "粗暴犯傷害", "粗暴犯脅迫", "粗暴犯恐喝",
    "侵入窃盗計", "侵入窃盗金庫破り", "侵入窃盗学校荒し", "侵入窃盗事務所荒し", "侵入窃盗出店荒し",
    "侵入窃盗空き巣", "侵入窃盗忍込み", "侵入窃盗居空き", "侵入窃盗その他",
    "非侵入窃盗計", "非侵入窃盗自動車盗", "非侵入窃盗オートバイ盗", "非侵入窃盗自転車盗",
    "非侵入窃盗車上ねらい", "非侵入窃盗自販機ねらい", "非侵入窃盗工事場ねらい", "非侵入窃盗すり",
    "非侵入窃盗ひったくり", "非侵入窃盗置引き", "非侵入窃盗万引き", "非侵入窃盗その他",
    "その他計", "その他詐欺", "その他占有離脱物横領", "その他その他知能犯", "その他賭博", "その他その他刑法犯",
  ];
  const base: any = { row: 1, 市区町丁: "新宿区西新宿2丁目", 総合計: 0 };
  for (const k of keys) base[k] = 0;
  return Object.assign(base, overrides);
}

const sumBreakdown = (r: { breakdown: Array<{ count: number }> }) =>
  r.breakdown.reduce((s, b) => s + b.count, 0);

/* ① 明細必須完整涵蓋総合計：以實際 API 回傳的西新宿2丁目資料為準。 */
const nishishinjuku = buildResult([row({
  総合計: 50,
  粗暴犯計: 3, 粗暴犯暴行: 3,
  非侵入窃盗計: 13, 非侵入窃盗自転車盗: 3, 非侵入窃盗車上ねらい: 1,
  非侵入窃盗万引き: 1, 非侵入窃盗その他: 8,
  その他計: 34, その他詐欺: 16, その他占有離脱物横領: 1,
  その他その他知能犯: 2, その他その他刑法犯: 15,
})]);
assert.equal(nishishinjuku.totalCrimes, 50);
assert.equal(sumBreakdown(nishishinjuku), 50, "明細合計必須等於総合計，否則 UI 上數字對不起來");

/* 全零地區也要對得上，且不可誤報。 */
const quiet = buildResult([row({ 総合計: 0 })]);
assert.equal(sumBreakdown(quiet), 0);
assert.equal(quiet.residentialGrade, "A");
assert.equal(quiet.streetGrade, "A+");

/* ② 凶惡犯必須拉低街區評級，不可被忽略。 */
const withFelony = buildResult([row({ 総合計: 1, 凶悪犯計: 1, 凶悪犯強盗: 1 })]);
const withoutFelony = buildResult([row({ 総合計: 0 })]);
assert.notEqual(withFelony.streetGrade, withoutFelony.streetGrade, "凶惡犯必須影響街區評級");
assert.match(withFelony.summary, /凶惡犯罪 1 件/);
assert.match(withFelony.summary, /強盜 1 件/);
assert.equal(sumBreakdown(withFelony), 1);

/* 凶惡犯不可被「主要為自行車竊盜」的樂觀結論蓋掉。 */
const bikeHeavyWithFelony = buildResult([row({
  総合計: 10, 凶悪犯計: 1, 凶悪犯その他: 1, 非侵入窃盗計: 9, 非侵入窃盗自転車盗: 9,
})]);
assert.doesNotMatch(bikeHeavyWithFelony.summary, /未見明顯住宅侵入犯罪或暴力犯罪集中/);
assert.match(bikeHeavyWithFelony.summary, /凶惡犯罪/);

/* 純自行車竊盜（無任何暴力／侵入）才可給出樂觀結論。 */
const bikeOnly = buildResult([row({ 総合計: 10, 非侵入窃盗計: 9, 非侵入窃盗自転車盗: 9, その他計: 1, その他その他刑法犯: 1 })]);
assert.match(bikeOnly.summary, /自行車竊盜/);

/* ③ 住宅評級依侵入竊盜件數分級。 */
assert.equal(buildResult([row({ 総合計: 0 })]).residentialGrade, "A");
assert.equal(buildResult([row({ 総合計: 1, 侵入窃盗計: 1, 侵入窃盗空き巣: 1 })]).residentialGrade, "B+");
assert.equal(buildResult([row({ 総合計: 3, 侵入窃盗計: 3, 侵入窃盗空き巣: 3 })]).residentialGrade, "B");
assert.equal(buildResult([row({ 総合計: 5, 侵入窃盗計: 5, 侵入窃盗空き巣: 5 })]).residentialGrade, "C");
assert.equal(buildResult([row({ 総合計: 9, 侵入窃盗計: 9, 侵入窃盗空き巣: 9 })]).residentialGrade, "D");

/* ④ 多筆町丁目合併時，件數要相加而非覆蓋。 */
const mergedRows = buildResult([
  row({ 市区町丁: "墨田区錦糸1丁目", 総合計: 9, 非侵入窃盗計: 4, 非侵入窃盗自転車盗: 4, その他計: 5, その他詐欺: 5 }),
  row({ 市区町丁: "墨田区錦糸2丁目", 総合計: 6, 非侵入窃盗計: 2, 非侵入窃盗自転車盗: 2, その他計: 4, その他詐欺: 4 }),
]);
assert.equal(mergedRows.totalCrimes, 15, "多筆町丁目要合計");
assert.equal(sumBreakdown(mergedRows), 15);
assert.match(mergedRows.chocho, /錦糸1丁目・墨田区錦糸2丁目/);

/* ⑤ 地址解析：去除「東京都」前綴並保留到丁目。 */
assert.equal(extractWardAndTown("東京都墨田区錦糸1丁目5-10"), "墨田区錦糸1丁目");
assert.equal(extractWardAndTown("東京都新宿区西新宿2丁目8-1"), "新宿区西新宿2丁目");
assert.equal(extractWardAndTown("東京都八王子市旭町1丁目"), "八王子市旭町1丁目");

/* ⑥ CC BY 授權要求：資料來源標示不可遺失。 */
assert.match(nishishinjuku.credit, /警視庁/);
assert.match(nishishinjuku.credit, /CC BY/);

console.log("test-crime-safety: 全部通過");