import assert from "node:assert/strict";
import { getRentModifierIndexes, type RentSearchCriteria } from "../src/lib/rentAnalysis";
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
      assert.equal(getRentModifierIndexes({ ...base, furnished: true, furnishedPriority: "preferred" }).includes(15), false);
      assert.equal(getRentModifierIndexes({ ...base, furnished: true, furnishedPriority: "uncertain" }).includes(15), false);
      assert.equal(getRentModifierIndexes({ ...base, furnished: true, furnishedPriority: "required" }).includes(15), true);
    }
  }
];

for (const scenario of scenarios) {
  scenario.run();
  console.log(`✓ ${scenario.name}`);
}

console.log(`\n需求可行性回歸測試：${scenarios.length}/${scenarios.length} 通過`);
