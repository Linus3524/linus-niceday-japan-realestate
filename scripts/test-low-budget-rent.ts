import assert from 'node:assert/strict';
import { enrichRentCriteriaFromPrompt, buildRentRecommendations } from '../src/lib/rentAnalysis';
import { normalizeRentLocations } from '../src/lib/rentLocations';
import { resolveSearchScope } from '../src/lib/requirementVerdict';
import { parseAreas } from '../src/lib/findHome/calculatorBridge';

const prompt = `簽證種類：打工度假
期望預算：¥5萬以下（含管理費，理想 ¥4萬）
期望地區：東京 神奈川 埼玉 千葉皆可
期望車站：車站徒步 20 分鐘內
房型設備：1R
通勤地點：進城方便30~45分鐘皆可 如 和光市 朝霞台 所沢至池袋 生田 百合ヶ丘至新宿 松戸 船橋至上野 東京
其他條件：免禮金、免押金、屋齡 50 年內、初期費用 15 萬円以內、1 人住
入住時間：不急
目前居住地：海外，2027-01-20 入境`;
// 注入與實際錯誤相同的模型誤判，驗證原文能校正 AI，而非只測乾淨輸入。
const criteria = normalizeRentLocations(enrichRentCriteriaFromPrompt({
  roomType: 'r1', maxBudget: 50000, district: '千代田區',
  districts: ['千代田區', '神奈川', '埼玉', '千葉市中央區'],
  station: '東京', stations: ['東京', '千葉'],
  commuteStation: '池袋', commuteStations: ['池袋'],
}, prompt));
assert.deepEqual(criteria.districts, ['東京都', '神奈川', '埼玉', '千葉']);
assert.deepEqual(criteria.stations, []);
assert.deepEqual(criteria.commuteStations, ['池袋', '新宿', '上野', '東京']);
assert.equal(criteria.commuteDestinationsAreAlternatives, true);
assert.equal(criteria.commutePreferredMinutes, 30);
assert.equal(criteria.commuteMinutes, 45);
assert.equal(criteria.maxBudget, 50000);
assert.equal(criteria.minBudget, 40000);
assert.equal(criteria.initialCostBudget, 150000);
assert.deepEqual(resolveSearchScope(criteria).unresolvedLocations, []);
assert.ok(resolveSearchScope(criteria).districts.size > 50);
const recommendations = buildRentRecommendations(criteria);
assert.ok(recommendations.length > 0);
assert.ok(recommendations.every(item => item.estimate <= 50000), '寬鬆地區有預算內候選時，不得擠入超預算地區');
assert.ok(recommendations.every(item => item.district !== '千代田區'));
assert.ok(new Set(recommendations.map(item => item.region)).size >= 3, '不能因資料順序只推薦東京都');
for (const area of ['東京 神奈川 埼玉 千葉皆可', '東京都、神奈川県、埼玉県、千葉県', '東京、神奈川、埼玉、千葉 皆可']) {
  const parsed = normalizeRentLocations({ roomType: 'r1', ...parseAreas(area) });
  assert.deepEqual(parsed.districts, ['東京都', '神奈川', '埼玉', '千葉']);
  assert.deepEqual(parsed.stations, []);
}
// 真的指定東京站，仍保留站名與其行政區，不能一律當成東京都。
const explicit = normalizeRentLocations({roomType:'r1', stations:['東京駅']});
assert.ok(explicit.stations?.includes('東京'));
assert.ok(explicit.districts?.includes('千代田區'));
// 只允許神奈川時不可越界到東京或其他縣。
const kanagawa = buildRentRecommendations({ roomType:'r1', districts:['神奈川'], maxBudget:80000 });
assert.ok(kanagawa.length > 0);
assert.ok(kanagawa.every(item=>item.region==='神奈川'));
console.log('Low-budget questionnaire regression passed:', recommendations.map(item=>`${item.region}・${item.station} ¥${item.estimate}`).join(' / '));
