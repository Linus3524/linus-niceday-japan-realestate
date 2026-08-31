import assert from "node:assert/strict";
import { buildRentRecommendations, computeStackedEstimate, enrichRentCriteriaFromPrompt, getRentModifierIds, RECOMMENDATION_LIMIT, type RentSearchCriteria } from "../src/lib/rentAnalysis";
import { districtStations, rentRates } from "../src/data/housingMarket";
import {
  axisImpactLevel,
  buildAxisVerdicts,
  buildOverallVerdict,
  hasKnownCommuteStations,
  resolveSearchScope
} from "../src/lib/requirementVerdict";
import { commuteFitForTransfers } from "../src/lib/transitRouteApi";

const base: RentSearchCriteria = {
  roomType: "k1",
  maxBudget: 120_000,
  budgetIncludesFees: true,
  district: "練馬區",
  commuteStation: "池袋",
  visaType: "技人國"
};

const assess = (criteria: RentSearchCriteria) => {
  const axes = buildAxisVerdicts(criteria, []);
  return { axes, overall: buildOverallVerdict(axes) };
};

const scenarios: Array<{ name: string; run: () => void }> = [
  {
    name: "一般條件可行",
    run: () => assert.equal(assess({ ...base, areaMin: 22 }).overall.level, "可行")
  },
  {
    name: "寵物是高影響但非單項否決",
    run: () => assert.equal(assess({ ...base, petsAllowed: true, petType: "貓" }).overall.level, "有條件可行")
  },
  {
    name: "寵物條件不會在其他核心條件重複出現",
    run: () => {
      const result = assess({
        ...base,
        petsAllowed: true,
        petType: "貓",
        otherNeeds: ["可養貓"],
        unverifiedConditions: ["可養貓"]
      });
      assert.ok(result.axes.some(axis => axis.key === "pet" && axis.detail === "可養貓"));
      assert.equal(result.axes.some(axis => axis.key === "otherCoreNeeds"), false);
    }
  },
  {
    name: "不存在行政區不退回預設行情",
    run: () => {
      const result = assess({ ...base, district: "不存在區域XYZ" });
      assert.equal(result.overall.level, "資料不足");
      assert.equal(axisImpactLevel(result.axes.find(axis => axis.key === "budget")!), "待補資料");
      assert.deepEqual(resolveSearchScope({ ...base, district: "不存在區域XYZ" }).unresolvedLocations, ["不存在區域XYZ"]);
    }
  },
  {
    name: "不存在車站與路線會標記待確認",
    run: () => {
      const scope = resolveSearchScope({ ...base, district: null, station: "火星站", line: "銀河鐵道999線" });
      assert.deepEqual(scope.unresolvedLocations, ["火星站", "銀河鐵道999線"]);
      assert.equal(assess({ ...base, district: null, station: "火星站" }).overall.level, "資料不足");
    }
  },
  {
    name: "不存在通勤站會標記待確認",
    run: () => {
      assert.equal(hasKnownCommuteStations("火星站"), false);
      assert.equal(hasKnownCommuteStations("池袋"), true);
      assert.equal(hasKnownCommuteStations("惠比壽"), true);
      assert.equal(hasKnownCommuteStations("恵比寿"), true);
      const result = assess({ ...base, commuteStation: "火星站", commuteStations: ["火星站"] });
      assert.equal(result.axes.find(axis => axis.key === "commute")?.status, "待確認");
      assert.equal(result.overall.level, "資料不足");
    }
  },
  {
    name: "實際路線有轉乘時不會標成直達",
    run: () => {
      assert.equal(commuteFitForTransfers(0), "直達線路");
      assert.equal(commuteFitForTransfers(1), "需轉乘");
      assert.equal(commuteFitForTransfers(2), "需轉乘");
    }
  },
  {
    name: "非法數值不會進入輸出",
    run: () => {
      const result = assess({
        ...base,
        visaYears: Infinity,
        gasBurnersMin: -3,
        areaMin: Number.NaN,
        walkMinutes: -1
      });
      const output = JSON.stringify(result);
      assert.doesNotMatch(output, /NaN|Infinity|瓦斯爐 -3|在留 -/);
    }
  },
  {
    name: "非法格局安全回退為 1K",
    run: () => {
      const result = assess({ ...base, roomType: "castle" } as unknown as RentSearchCriteria);
      const output = JSON.stringify(result);
      assert.match(output, /1K/);
      assert.doesNotMatch(output, /undefined|NaN/);
    }
  },
  {
    name: "3LDK、4K、4DK 都會解析為 3LDK+ 群組",
    run: () => {
      for (const layout of ["3LDK", "4K", "4DK"]) {
        const criteria = enrichRentCriteriaFromPrompt(base, `希望格局：${layout}`);
        assert.equal(criteria.roomType, "ldk3", `${layout} 應對應到 ldk3`);
      }
    }
  },
  {
    name: "3LDK+ 評估會使用更新後的行政區行情",
    run: () => {
      const rate = rentRates.find(row => row.district === "新宿區");
      assert.ok(rate?.ldk3, "新宿區必須有 3LDK+ 行情");
      const expected = Math.round(parseFloat(rate.ldk3) * 10) * 1000;
      assert.equal(computeStackedEstimate(rate, null, [], "ldk3"), expected);

      const recommendations = buildRentRecommendations({
        ...base,
        roomType: "ldk3",
        district: "新宿區",
        commuteStation: null,
        maxBudget: 400_000
      });
      const shinjuku = recommendations.find(item => item.district === "新宿區");
      assert.ok(shinjuku, "3LDK+ 推薦結果必須保留指定的新宿區");
      assert.ok(Number.isFinite(shinjuku.estimate) && shinjuku.estimate > 0);
    }
  },
  {
    name: "預算上下限顛倒時捨棄下限",
    run: () => {
      const result = assess({ ...base, minBudget: 150_000, maxBudget: 80_000 });
      assert.doesNotMatch(JSON.stringify(result), /15 萬円～8 萬円/);
    }
  },
  {
    name: "選配家具不加入租金溢價",
    run: () => {
      assert.equal(getRentModifierIds({ ...base, furnished: true, furnishedPriority: "preferred" }).includes("furnished"), false);
      assert.equal(getRentModifierIds({ ...base, furnished: true, furnishedPriority: "uncertain" }).includes("furnished"), false);
      assert.equal(getRentModifierIds({ ...base, furnished: true, furnishedPriority: "required" }).includes("furnished"), true);
    }
  },
  {
    // 先前行政區是硬篩選、車站只是加分，而分數是在篩選之後才排序，
    // 於是同時指定「目黑區」與「元住吉、日吉」時，指定的車站整批消失。
    name: "同時指定行政區與車站時，兩者都要出現",
    run: () => {
      const recs = buildRentRecommendations({
        ...base, district: undefined, roomType: "ldk1", maxBudget: 200_000,
        districts: ["目黑區"], stations: ["元住吉", "日吉"]
      } as RentSearchCriteria);
      const stations = recs.map(item => item.station);
      assert.ok(stations.includes("元住吉"), "指定的元住吉應該出現");
      assert.ok(stations.includes("日吉"), "指定的日吉應該出現");
      assert.ok(recs.some(item => item.district === "目黑區"), "指定的目黑區也應該保留");
    }
  },
  {
    // 結果不再硬湊九筆，但使用者明確指定的車站不能因動態截點而消失。
    name: "只指定少數車站仍保留指定結果",
    run: () => {
      const recs = buildRentRecommendations({ ...base, district: undefined, stations: ["新宿"] } as RentSearchCriteria);
      assert.ok(recs.length >= 1 && recs.length <= RECOMMENDATION_LIMIT);
      assert.ok(recs.some(item => item.station === "新宿"));
    }
  },
  {
    // 台灣讀者會打繁體，日本官方標示用日文漢字，兩種寫法都要對得到同一站。
    name: "中日漢字寫法都能對到同一個車站",
    run: () => {
      for (const spelling of ["恵比寿", "惠比壽", "学芸大学", "學藝大學", "浅草", "淺草"]) {
        const recs = buildRentRecommendations({ ...base, district: undefined, stations: [spelling] } as RentSearchCriteria);
        assert.ok(
          recs.some(item => item.recommendationType === "指定車站"),
          `${spelling} 應該要對到資料庫裡的車站`
        );
      }
    }
  },
  {
    // roomType 缺漏或無效時，parseFloat(undefined) 會讓估價變成 NaN，
    // 連帶價格區間與預算差額都會把 NaN 帶到畫面上。
    name: "格局缺漏或無效時估價不會是 NaN",
    run: () => {
      for (const roomType of [undefined, null, "castle"]) {
        const recs = buildRentRecommendations({ maxBudget: 150_000, roomType } as unknown as RentSearchCriteria);
        assert.ok(recs.length > 0);
        for (const item of recs) {
          assert.ok(Number.isFinite(item.estimate), `估價應為數字，實際為 ${item.estimate}`);
          assert.ok(Number.isFinite(item.rangeLow) && Number.isFinite(item.rangeHigh));
        }
      }
    }
  },
  {
    name: "長站名不會再誤判成內含的短站名",
    run: () => {
      const stationNames = [...new Set(Object.values(districtStations).flat().map(station => station.name))];
      const collisions = stationNames.flatMap(longName => stationNames
        .filter(shortName => longName !== shortName && longName.includes(shortName))
        .map(shortName => ({ longName, shortName })));
      assert.ok(collisions.length > 0, "測試資料中應至少存在一組站名包含關係");

      for (const { longName, shortName } of collisions) {
        const criteria = enrichRentCriteriaFromPrompt(
          { ...base, district: null, districts: [], station: null, stations: [], commuteStation: null },
          `期望車站：${longName}`
        );
        assert.ok(criteria.stations?.includes(longName), `${longName} 應被正確辨識`);
        assert.equal(criteria.stations?.includes(shortName), false, `${longName} 不應額外產生 ${shortName}`);
      }
    }
  },
  {
    // 動態結果仍要避免全部落在同一區，至少保留跨區比較；不再強制湊三區九站。
    name: "推薦清單會跨行政區，不會一區洗版",
    run: () => {
      const recs = buildRentRecommendations({ ...base, district: undefined, maxBudget: 150_000 } as RentSearchCriteria);
      const districts = new Set(recs.map(item => item.district));
      assert.ok(districts.size >= 2, `應橫跨多個行政區，實際只有 ${districts.size} 個`);
      for (const district of districts) {
        const count = recs.filter(item => item.district === district).length;
        assert.ok(count <= 3, `${district} 佔了 ${count} 個名額，超過上限`);
      }
    }
  },
  {
    name: "AI 單一摘要不會吃掉原文的複數地區",
    run: () => {
      const enriched = enrichRentCriteriaFromPrompt(
        { ...base, district: "目黑區", districts: [], line: "東急東橫線", lines: [] },
        "期望地區：目黑區／世田谷區\n希望路線：東急東橫線\n通勤地點：惠比壽"
      );
      assert.ok(enriched.districts?.includes("目黑區"));
      assert.ok(enriched.districts?.includes("世田谷區"));
      assert.ok(enriched.lines?.length);
    }
  },
  {
    name: "複數路線都會納入搜尋範圍",
    run: () => {
      const scope = resolveSearchScope({ ...base, district: null, line: null, lines: ["東急東橫線", "山手線"] });
      assert.ok(scope.districts.size > 1);
      assert.equal(scope.unresolvedLocations.length, 0);
    }
  },
  {
    name: "免禮金免押金與免費網路會成為獨立條件",
    run: () => {
      const criteria = enrichRentCriteriaFromPrompt(
        { ...base, freeInternet: undefined },
        "希望免禮金、免押金，也要免費網路"
      );
      assert.equal(criteria.noKeyMoney, true);
      assert.equal(criteria.noDeposit, true);
      assert.equal(criteria.freeInternet, true);
      const axes = buildAxisVerdicts(criteria, []);
      assert.ok(axes.some(axis => axis.key === "initialFeePreference" && axis.supplyImpact === 2));
    }
  }
];

for (const scenario of scenarios) {
  scenario.run();
  console.log(`✓ ${scenario.name}`);
}

console.log(`\n需求可行性回歸測試：${scenarios.length}/${scenarios.length} 通過`);
