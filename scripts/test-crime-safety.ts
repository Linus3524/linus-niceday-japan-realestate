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
import { crimePrefectureMeta, crimePrefectureRows } from "../src/data/crimePrefectureSnapshot.js";

const {
  buildResult,
  extractWardAndTown,
  extractPrefecture,
  prefectureGrade,
  buildPrefectureResult,
  normalizeAddress,
} = __testing;

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

/* ⑦ 都道府県解析：47 縣都要認得，含省略都道府県名的政令市寫法。 */
assert.equal(extractPrefecture("大阪府大阪市北区梅田1-1-1"), "大阪府");
assert.equal(extractPrefecture("北海道札幌市中央区北1条西2丁目"), "北海道");
assert.equal(extractPrefecture("神奈川県横浜市西区みなとみらい2-3-1"), "神奈川県");
assert.equal(extractPrefecture("東京都墨田区錦糸1丁目"), "東京都");
// 「京都府」不可被「京都市」的比對搶先切成錯誤結果。
assert.equal(extractPrefecture("京都府京都市中京区"), "京都府");
// 省略都道府県的政令市地址要能回推。
assert.equal(extractPrefecture("名古屋市中区栄3丁目"), "愛知県");
assert.equal(extractPrefecture("福岡市博多区博多駅前2丁目"), "福岡県");
assert.equal(extractPrefecture("Paris, France"), null);

/* ⑧ 都道府県評級用「相對全国倍率」，不可用絕對件數。 */
assert.equal(prefectureGrade(0.5), "A+");
assert.equal(prefectureGrade(0.75), "A");
assert.equal(prefectureGrade(0.95), "B+");
assert.equal(prefectureGrade(1.1), "B");
assert.equal(prefectureGrade(1.4), "C");
assert.equal(prefectureGrade(1.8), "D");

/* ⑨ 全國快照完整性：47 筆、排名唯一且連續、倍率與全国基準一致。 */
assert.equal(crimePrefectureRows.length, 47, "都道府県快照應為 47 筆");
assert.equal(crimePrefectureMeta.prefectureCount, 47);
const ranks = crimePrefectureRows.map(r => r.safetyRank).sort((a, b) => a - b);
assert.deepEqual(ranks, Array.from({ length: 47 }, (_, i) => i + 1), "安全度排名必須是 1..47 且不重複");
for (const prefRow of crimePrefectureRows) {
  assert.ok(prefRow.crimeRatePerThousand > 0, `${prefRow.prefecture} 犯罪率應為正數`);
  const expected = prefRow.crimeRatePerThousand / crimePrefectureMeta.nationalRatePerThousand;
  assert.ok(
    Math.abs(prefRow.vsNational - expected) < 0.002,
    `${prefRow.prefecture} 的 vsNational 與全国基準算出來的倍率不符`,
  );
}
// 排名最前者的犯罪率必須真的最低，避免排序方向寫反。
const safest = crimePrefectureRows.find(r => r.safetyRank === 1)!;
const lowest = Math.min(...crimePrefectureRows.map(r => r.crimeRatePerThousand));
assert.equal(safest.crimeRatePerThousand, lowest, "排名第 1 必須是犯罪率最低的縣");

/* ⑩ 都道府県結果：摘要與來源標示要帶出年度與比較基準。 */
const tokyoRow = crimePrefectureRows.find(r => r.prefecture === "東京都")!;
const tokyoPref = buildPrefectureResult(tokyoRow, crimePrefectureRows.length);
assert.equal(tokyoPref.totalPrefectures, 47);
assert.equal(tokyoPref.nationalRatePerThousand, crimePrefectureMeta.nationalRatePerThousand);
assert.match(tokyoPref.summary, /全國平均/);
assert.match(tokyoPref.summary, /第 \d+ 名/);
assert.match(tokyoPref.credit, /e-Stat|社会生活統計指標/);
assert.match(tokyoPref.fiscalYear, /年度/);

/* ⑪ 地址正規化：圖紙 OCR 常給全形／漢数字，不轉會讓東京物件掉到縣級。 */
assert.equal(normalizeAddress("東京都世田谷区経堂１丁目"), "東京都世田谷区経堂1丁目");
assert.equal(normalizeAddress("東京都港区港南三丁目"), "東京都港区港南3丁目");
assert.equal(normalizeAddress("東京都渋谷区神南 １ 丁目"), "東京都渋谷区神南1丁目");
// 全形連字號要收斂成半形，否則番地會殘留怪符號。
assert.equal(normalizeAddress("東京都新宿区西新宿２−８−１"), "東京都新宿区西新宿2-8-1");
// 正規化後才抓得到町丁目；這是先前實測失敗的案例。
assert.equal(extractWardAndTown("東京都世田谷区経堂１丁目"), "世田谷区経堂1丁目");
assert.equal(extractWardAndTown("東京都港区港南三丁目"), "港区港南3丁目");
// 不可誤傷原本就正常的半形地址。
assert.equal(extractWardAndTown("東京都墨田区錦糸1丁目5-10"), "墨田区錦糸1丁目");
// 縣名判斷同樣吃正規化後的字串。
assert.equal(extractPrefecture("大阪市北区梅田１−１−１"), "大阪府");

console.log("test-crime-safety: 全部通過");
/* ④ 快照查詢：地址 → 町丁目、前綴合併、年度期間與全東京百分位。 */
{
  const { findSnapshotRows, snapshot, saferThanPercent } = __testing;
  assert.ok(snapshot.annual.rows.length > 5000, "全年快照應涵蓋全東京五千多個町丁目");
  assert.match(snapshot.annual.label, /全年$/, "評級期間必須是完整年度，不是月累計");

  // 精確命中
  const exact = findSnapshotRows(snapshot.annual, "荒川区西日暮里6丁目");
  assert.equal(exact.length, 1);
  assert.equal(exact[0].市区町丁, "荒川区西日暮里6丁目");

  // 只給町名 → 撈整個町的各丁目；不能撈到別的町（「錦糸」不可含「錦糸町」以外的無關列）
  const prefixed = findSnapshotRows(snapshot.annual, "墨田区錦糸");
  assert.ok(prefixed.length >= 2);
  assert.ok(prefixed.every(r => /^墨田区錦糸\d+丁目$/.test(r.市区町丁)));

  // 町名本身含「番」：千代田区一番町 必須命中，不能被當番地切掉
  assert.equal(extractWardAndTown("東京都千代田区一番町5"), "千代田区一番町");
  assert.equal(findSnapshotRows(snapshot.annual, "千代田区一番町").length, 1);

  // 中位名次法：0 件不會算成「勝過 0%」，最差值不會是 100%
  assert.equal(saferThanPercent([0, 0, 0, 1], 0), 63);
  assert.equal(saferThanPercent([0, 0, 0, 1], 1), 13);

  const built = buildResult(exact);
  assert.equal(built.periodYear, snapshot.annual.year);
  assert.ok(built.tokyoContext && built.tokyoContext.chomeCount === snapshot.annual.rows.length);
  assert.equal(buildResult(prefixed).tokyoContext, null, "合併多個町丁目時不可給百分位");
}
console.log("test-crime-safety: 快照查詢通過");
