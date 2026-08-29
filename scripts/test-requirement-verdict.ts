import assert from "node:assert/strict";
import { buildRentRecommendations, getRentModifierIds, type RentSearchCriteria } from "../src/lib/rentAnalysis";
import {
  axisImpactLevel,
  buildAxisVerdicts,
  buildOverallVerdict,
  hasKnownCommuteStations,
  resolveSearchScope
} from "../src/lib/requirementVerdict";

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
    // 只指定車站時，清單一度被截斷成「只有那幾站」，比不填地點得到的資訊還少。
    name: "只指定少數車站仍給滿推薦數",
    run: () => {
      const recs = buildRentRecommendations({ ...base, district: undefined, stations: ["新宿"] } as RentSearchCriteria);
      assert.equal(recs.length, 9);
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
    // 九個結果全落在同一區的話，使用者看不到「同樣條件在別區長什麼樣」。
    name: "推薦清單會跨行政區，不會一區洗版",
    run: () => {
      const recs = buildRentRecommendations({ ...base, district: undefined, maxBudget: 150_000 } as RentSearchCriteria);
      const districts = new Set(recs.map(item => item.district));
      assert.ok(districts.size >= 3, `應橫跨多個行政區，實際只有 ${districts.size} 個`);
      for (const district of districts) {
        const count = recs.filter(item => item.district === district).length;
        assert.ok(count <= 3, `${district} 佔了 ${count} 個名額，超過上限`);
      }
    }
  }
];

for (const scenario of scenarios) {
  scenario.run();
  console.log(`✓ ${scenario.name}`);
}

console.log(`\n需求可行性回歸測試：${scenarios.length}/${scenarios.length} 通過`);
