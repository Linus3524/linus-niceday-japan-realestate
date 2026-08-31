import { districtStations } from "../src/data/housingMarket";
import { buildRentRecommendations, RECOMMENDATION_LIMIT, type RentSearchCriteria } from "../src/lib/rentAnalysis";
import { findLocalTransitRoute } from "../src/lib/localTransitRoute";
import { toJapaneseStationName } from "../src/lib/transit";

type Scenario = { name: string; district: string; destination: string; budget: number; minutes: number };

const scenarios: Scenario[] = [
  { name: "東京通勤", district: "杉並區", destination: "新宿", budget: 105_000, minutes: 30 },
  { name: "橫濱通勤", district: "橫濱市中區", destination: "橫濱", budget: 110_000, minutes: 30 },
  { name: "大阪通勤", district: "大阪市淀川區", destination: "梅田", budget: 85_000, minutes: 30 },
  { name: "札幌通勤", district: "札幌市（市平均）", destination: "札幌", budget: 70_000, minutes: 30 },
  { name: "仙台通勤", district: "仙台市（市平均）", destination: "仙台", budget: 75_000, minutes: 30 },
  { name: "名古屋通勤", district: "名古屋市（市平均）", destination: "名古屋", budget: 80_000, minutes: 35 },
  { name: "京都通勤", district: "京都市（市平均）", destination: "京都", budget: 85_000, minutes: 35 },
  { name: "神戶通勤", district: "神戶市（市平均）", destination: "三之宮", budget: 80_000, minutes: 35 },
  { name: "廣島通勤", district: "廣島市（市平均）", destination: "廣島", budget: 75_000, minutes: 35 },
  { name: "福岡通勤", district: "福岡市（市平均）", destination: "博多", budget: 85_000, minutes: 35 },
  { name: "沖繩通勤", district: "那霸市", destination: "県庁前", budget: 75_000, minutes: 40 }
];

const failures: string[] = [];
const stationNames = [...new Set(Object.values(districtStations).flat().map(station => station.name))];
const stationSet = new Set(stationNames);
const localStations = stationNames.filter(station => Boolean(findLocalTransitRoute(station, station)));

for (const [district, stations] of Object.entries(districtStations)) {
  if (!stations.length) failures.push(`${district}: 沒有車站`);
  for (const station of stations) {
    const japanese = toJapaneseStationName(station.name);
    if (!japanese || /[A-Za-z]/.test(japanese)) failures.push(`${district}/${station.name}: 不是日文車站名稱（${japanese}）`);
    if (!station.lines.length) failures.push(`${district}/${station.name}: 沒有路線資料`);
  }
}

console.log("\n熱力地圖條件測試");
console.log("場景\t推薦站\t首選範圍\t本地路線卡\t結果");
for (const scenario of scenarios) {
  const criteria: RentSearchCriteria = {
    roomType: "k1", district: scenario.district, districts: [scenario.district],
    maxBudget: scenario.budget, budgetIncludesFees: true,
    commuteStation: scenario.destination, commuteStations: [scenario.destination],
    commuteMinutes: scenario.minutes, walkMinutes: 15, householdSize: 1
  };
  const recommendations = buildRentRecommendations(criteria);
  const unique = new Set(recommendations.map(item => item.station));
  const topMatches = recommendations[0]?.district === scenario.district;
  const unknown = recommendations.filter(item => item.station && !stationSet.has(item.station));
  const routed = recommendations.filter(item => item.station && findLocalTransitRoute(item.station, scenario.destination)).length;
  // 推薦清單採動態數量：有明確地理條件時只保留高相關候選，不再為了湊數固定回傳六筆。
  const hasValidCount = recommendations.length > 0 && recommendations.length <= RECOMMENDATION_LIMIT;
  const ok = hasValidCount && unique.size === recommendations.length && topMatches && !unknown.length;
  if (!ok) failures.push(`${scenario.name}: 推薦結果異常`);
  console.log(`${scenario.name}\t${recommendations.map(item => item.station).join("・")}\t${topMatches ? "正確" : "錯誤"}\t${routed}/${recommendations.length}\t${ok ? "PASS" : "FAIL"}`);
}

// Every heatmap district must at least rank one of its own stations first when
// the user explicitly selects that district. This is independent of online APIs.
for (const district of Object.keys(districtStations)) {
  const recommendation = buildRentRecommendations({ roomType: "k1", district, districts: [district], maxBudget: 100_000 })[0];
  if (!recommendation || recommendation.district !== district) failures.push(`${district}: 指定地區沒有排在首選`);
}

console.log("\n覆蓋摘要");
console.log(`行政區：${Object.keys(districtStations).length}`);
console.log(`熱力地圖唯一車站：${stationNames.length}`);
console.log(`本地公開班表可辨識：${localStations.length}（${(localStations.length / stationNames.length * 100).toFixed(1)}%）`);
console.log(`條件場景：${scenarios.length}`);
console.log(`失敗：${failures.length}`);

if (failures.length) {
  console.error("\n失敗項目：");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
}
