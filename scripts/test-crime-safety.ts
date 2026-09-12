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
// buildTrend 透過 __testing 直接取用（下方趨勢測試），故保留具名 import 之外的整包參照。
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
assert.equal(quiet.streetActivity, "quiet");

/* ② 凶惡犯必須反映在街區分數上，不可被忽略。 */
const withFelony = buildResult([row({ 総合計: 1, 凶悪犯計: 1, 凶悪犯強盗: 1 })]);
const withoutFelony = buildResult([row({ 総合計: 0 })]);
assert.ok(withFelony.streetScore > withoutFelony.streetScore, "凶惡犯必須影響街區分數");
/* 凶惡犯屬「對行人的直接危害」，必須單獨列出而非只混進總分。 */
assert.ok(
  withFelony.pedestrianRisks.some(r => r.label.includes("凶惡犯") && r.count === 1),
  "凶惡犯必須單獨列入行人風險清單",
);
/* 0 件時不可列出——印「搶奪 0 件」反而像在暗示這是個議題。 */
assert.equal(withoutFelony.pedestrianRisks.length, 0, "無案件時不可列出行人風險項目");

/* 退回件數的路徑同樣不可用「侵入窃盗計」評級。
   會走到這條路徑的正是商辦與繁華街（世帯數 < 300），
   那裡的侵入竊盜幾乎全是事務所荒し，拿來評住宅等於指著商家的數字說住戶危險。 */
{
  // 世帯數不足 → 必定退回件數路徑；住家三手口 0 件，非住家 40 件。
  const officeOnly = buildResult([row({
    市区町丁: "新宿区歌舞伎町1丁目",
    総合計: 40, 侵入窃盗計: 40, 侵入窃盗事務所荒し: 30, 侵入窃盗出店荒し: 10,
  })]);
  assert.equal(typeof officeOnly.burglaryRate, "string", "此樣本應走退回件數路徑");
  assert.equal(
    officeOnly.residentialGrade, "A",
    "住家侵入 0 件必須是 A，不可被事務所荒し拖累",
  );
}
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

/*
 * ③ 住宅評級依「住家侵入竊盜 ÷ 世帯數」分級。
 *
 * 用 練馬区豊玉北5丁目 當基準町丁目：世帯數 2,713，屬一般住宅區。
 * 換算下來 1 件 = 0.37/千戶（B+）、3 件 = 1.11（C）、6 件 = 2.21（D）。
 */
const BASE = "練馬区豊玉北5丁目";
const grade = (homeBurglary: number, chocho = BASE) =>
  buildResult([row({
    市区町丁: chocho,
    総合計: homeBurglary,
    侵入窃盗計: homeBurglary,
    侵入窃盗空き巣: homeBurglary,
  })]).residentialGrade;

assert.equal(grade(0), "A");
assert.equal(grade(1), "B+");
assert.equal(grade(3), "C");
assert.equal(grade(6), "D");

/*
 * ③-1 非住家侵入（事務所荒し等）不得影響住宅評級。
 * 這是本模組最關鍵的一條：銀座 8 丁目侵入竊盜計 50 件全東京最高，
 * 但住家手口 0 件，對住戶而言風險是 0，不能判成 D。
 */
const officeOnly = buildResult([row({
  市区町丁: "中央区銀座8丁目",
  総合計: 50, 侵入窃盗計: 50, 侵入窃盗事務所荒し: 30, 侵入窃盗出店荒し: 20,
})]);
assert.equal(officeOnly.residentialGrade, "A", "全為事務所・店舖遭竊時，住宅評級必須是 A");
assert.match(officeOnly.summary, /非住家/);

/*
 * ③-2 D 級需要足夠的件數支撐。
 * 純用率會讓「小町丁目發生 1 件」就變紅色警示，
 * 但單一事件在統計上無法區分風險高低，最多只能給 C。
 */
const tinyOneCase = buildResult([row({
  市区町丁: "八王子市南陽台3丁目", // 423 戶：1 件 = 2.36/千戶，率已達 D
  総合計: 1, 侵入窃盗計: 1, 侵入窃盗空き巣: 1,
})]);
assert.equal(tinyOneCase.residentialGrade, "C", "件數不足 3 件時不得給到 D");

/*
 * ③-3 戶數過少時退回件數制，並標明原因，
 * 否則「3 件 ÷ 1 戶 = 每千戶 3000 件」這種數字會直接出現在 UI 上。
 */
const commercial = buildResult([row({
  市区町丁: "千代田区丸の内1丁目", // 僅個位數世帯
  総合計: 3, 侵入窃盗計: 3, 侵入窃盗空き巣: 3,
})]);
assert.equal(commercial.burglaryRate, "too-few-households");

/* 查無人口資料時同樣要退回，而不是當成 0 戶去除。 */
const unknownTown = buildResult([row({
  市区町丁: "存在しない町9丁目", 総合計: 1, 侵入窃盗計: 1, 侵入窃盗空き巣: 1,
})]);
assert.equal(unknownTown.burglaryRate, "no-population-data");
assert.equal(unknownTown.residentialGrade, "B+", "退回件數制時沿用舊門檻");

/* ③-4 率的內容要能被使用者驗算：件數、戶數、每千戶三者必須自洽。 */
const rateDetail = buildResult([row({
  市区町丁: BASE, 総合計: 3, 侵入窃盗計: 3, 侵入窃盗空き巣: 2, 侵入窃盗忍込み: 1,
})]).burglaryRate;
assert.notEqual(typeof rateDetail, "string");
if (typeof rateDetail !== "string") {
  assert.equal(rateDetail.count, 3);
  assert.ok(rateDetail.households > 0);
  assert.equal(
    Math.round((rateDetail.count / rateDetail.households) * 1000 * 100) / 100,
    rateDetail.per1000,
  );
  // 0 件的地方佔 84%，中位名次法必須讓它們落在高百分位而非墊底。
  const zero = buildResult([row({ 市区町丁: BASE, 総合計: 0 })]).burglaryRate;
  if (typeof zero !== "string") {
    assert.ok(zero.saferThanPercent >= 50, "全年 0 件不得顯示成後段班");
  }
}

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
  assert.equal(buildResult(prefixed).tokyoContext, null, "合併多個町丁目時不可給百分位");

  /* 百分位母體必須排除「◯◯区計」「合計」等彙總列。
     混入的話等於拿「整個區的件數」當成一個町丁目比，會系統性高估安全百分位。 */
  const { isAggregateRow, getTokyoDistribution, rankFromWorst } = __testing;
  assert.equal(isAggregateRow("新宿区計"), true);
  assert.equal(isAggregateRow("23区計"), true);
  assert.equal(isAggregateRow("多摩地区・島部計"), true);
  assert.equal(isAggregateRow("合計"), true);
  // 真實町丁目不可被誤判成彙總列。
  assert.equal(isAggregateRow("新宿区西新宿1丁目"), false);
  assert.equal(isAggregateRow("千代田区一番町"), false);

  const aggregateCount = snapshot.annual.rows.filter(r => isAggregateRow(r[0] as string)).length;
  assert.ok(aggregateCount > 0, "快照本來就含彙總列，這是此過濾存在的理由");
  const dist = getTokyoDistribution();
  assert.equal(
    dist.chomeCount,
    snapshot.annual.rows.length - aggregateCount,
    "百分位母體必須只剩真實町丁目",
  );
  assert.ok(built.tokyoContext && built.tokyoContext.chomeCount === dist.chomeCount);
  // 彙總列件數極大，混入母體會讓每個物件看起來更安全；確認已不在母體內。
  assert.ok(
    Math.max(...dist.total) < (snapshot.annual.rows.find(r => r[0] === "合計")![1] as number),
    "母體最大值不應該是「合計」列",
  );

  /* 同級程度區分：名次由高到低，1 = 全東京件數最高。 */
  assert.equal(rankFromWorst([5, 3, 1, 0], 5), 1);
  assert.equal(rankFromWorst([5, 3, 1, 0], 3), 2);
  assert.equal(rankFromWorst([5, 3, 1, 0], 0), 4);
  // 同分並列時取最前面的名次。
  assert.equal(rankFromWorst([5, 5, 1], 5), 1);

  /* 繁華街開放區間內部差距極大，名次必須能區分。 */
  const kabukicho = findSnapshotRows(snapshot.annual, "新宿区歌舞伎町1丁目");
  const senju = findSnapshotRows(snapshot.annual, "足立区千住2丁目");
  if (kabukicho.length === 1 && senju.length === 1) {
    const k = buildResult(kabukicho);
    const s = buildResult(senju);
    assert.equal(k.streetActivity, "entertainment");
    assert.equal(s.streetActivity, "entertainment");
    // 同為繁華街分類，但分數要拉開，否則使用者無從判斷程度。
    assert.ok(
      k.streetScore > s.streetScore * 3,
      "歌舞伎町的街頭案件強度應遠高於千住2丁目",
    );
    // 千住2丁目住宅侵入為 0，住宅評級必須是 A，不可被街區活動強度拖累。
    assert.equal(s.residentialGrade, "A", "街區活動強度不可污染住宅評級");
  }

  /* 年對年趨勢：兩邊都必須是完整年度，否則 7 個月對 12 個月會假性下降。 */
  const trendSample = findSnapshotRows(snapshot.annual, "新宿区歌舞伎町1丁目");
  if (trendSample.length === 1) {
    const t = buildResult(trendSample);
    if (t.burglaryTrend) {
      assert.notEqual(
        t.burglaryTrend.currentLabel,
        t.burglaryTrend.previousLabel,
        "趨勢的兩個期間不可相同",
      );
      // 兩個標籤都必須是「令和N年（YYYY 年）全年」格式，不可混入月累計。
      for (const label of [t.burglaryTrend.currentLabel, t.burglaryTrend.previousLabel]) {
        assert.match(label, /全年$/, `趨勢期間必須是完整年度，收到「${label}」`);
      }
    }
  }

  /* ±1 件視為持平：町丁目基數小，1 件波動不是趨勢。 */
  {
    const trend = (cur: number, prev: number) =>
      __testing.buildTrend(cur, prev, "令和7年（2025 年）全年", "令和6年（2024 年）全年");
    assert.equal(trend(3, 2).direction, "flat", "相差 1 件必須視為持平");
    assert.equal(trend(6, 2).direction, "up");
    assert.equal(trend(6, 2).changePercent, 200);
    assert.equal(trend(2, 6).direction, "down");
    // 前年為 0 時無法算倍率，必須回 null 而不是 Infinity。
    assert.equal(trend(4, 0).changePercent, null, "前年為 0 時不可回傳 Infinity");
  }
}
console.log("test-crime-safety: 快照查詢通過");
