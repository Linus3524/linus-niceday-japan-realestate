import assert from "node:assert/strict";
import { buildRentRecommendations, computeStackedEstimate, enrichRentCriteriaFromPrompt, getRentModifierIds, RECOMMENDATION_LIMIT, resolveUncoveredNeeds, type RentSearchCriteria } from "../src/lib/rentAnalysis";
import { districtStations, rentRates } from "../src/data/housingMarket";
import {
  axisImpactLevel,
  buildAxisVerdicts,
  buildOverallVerdict,
  buildListingPriceVerdict,
  buildSalePriceVerdict,
  hasKnownCommuteStations,
  resolveSearchScope
} from "../src/lib/requirementVerdict";
import { commuteFitForTransfers } from "../src/lib/transitRouteApi";
import { parseEffectiveRepairReserve, parseMandatoryMonthlyFees } from "../src/lib/listingExtraction";
import {
  getReinsSaleListingBenchmark,
  REINS_CHUBU_SALE_LISTING_BENCHMARK,
  REINS_KINKI_SALE_LISTING_BENCHMARK,
  REINS_METRO_SALE_LISTING_BENCHMARK,
  reinsImpliedDiscountFromListingRate,
  reinsNewListingPremiumRate,
} from "../src/data/reinsSaleMarket";
import { getSaleListingBenchmark } from "../src/data/saleListingMarket";
import { buildSizeEquivalentRange } from "../src/lib/requirementVerdicts/rentSizeEquivalence";
import type { RequestedRentRange } from "../src/lib/requirementVerdicts/types";
import { resolveDistrictAndRegion } from "../api/analyze-listing";

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
    name: "明確入住時間不會被 AI 誤填的入境日期覆蓋",
    run: () => {
      for (const timing of ["2 個月內", "2027-03-15", "不急"]) {
        const criteria = enrichRentCriteriaFromPrompt({ ...base, moveInTiming: "2027-02-20" },
          `入住時間：${timing}\n目前居住地：海外，2027-02-20 入境`);
        assert.equal(criteria.moveInTiming, timing);
      }
    }
  },
  {
    name: "問卷居住地保留境內／海外審查管道，獨居也保留人數",
    run: () => {
      for (const [residence, channel] of [["海外", "overseas"], ["日本", "domestic"]] as const) {
        const criteria = enrichRentCriteriaFromPrompt(base, `目前居住地：${residence}\n其他條件：1 人住`);
        assert.equal(criteria.applicationChannel, channel);
        assert.equal(criteria.householdSize, 1);
        assert.equal(criteria.currentResidence, residence);
      }
    }
  },
  {
    name: "山手線不會被擷取成橫濱山手站，朝南與室內洗衣機不會遺失",
    run: () => {
      const criteria = enrichRentCriteriaFromPrompt({ ...base, district: null, districts: [], stations: [] },
        "期望地區：中野 高圓寺 山手線 池袋 秋葉原\n房型設備：1K、朝南、室內洗衣機\n通勤地點：目黑");
      assert.equal(criteria.stations?.includes("山手"), false);
      assert.equal(criteria.districts?.includes("橫濱市中區"), false);
      assert.ok(criteria.otherNeeds?.includes("朝南"));
      assert.ok(criteria.otherNeeds?.includes("室內洗衣機"));
      const station = enrichRentCriteriaFromPrompt({ ...base, district: null, stations: [] }, "期望車站：山手站");
      assert.ok(station.stations?.includes("山手"), "真的指定山手站時仍要辨識");
      const negated = enrichRentCriteriaFromPrompt(base, "不需要朝南，不需要室內洗衣機");
      assert.equal(negated.otherNeeds?.includes("朝南") || false, false);
      assert.equal(negated.otherNeeds?.includes("室內洗衣機") || false, false);
    }
  },
  {
    name: "多選房型不會把初期費用 100 萬覆蓋月租上限 25 萬",
    run: () => {
      const prompt = "簽證種類：日本籍\n期望預算：¥25萬以下（含管理費，理想 ¥15萬）\n期望地區：中野 高圓寺 山手線 池袋 秋葉原\n房型設備：1R或1K或1LDK或1DK、一樓門禁自動門、室內洗衣機、朝南、免費網路、電梯、乾濕分離、免治馬桶、家具家電、獨立洗面台、都市瓦斯\n通勤地點：目黑\n其他條件：2 樓以上、免押金、可養寵物、附陽台、爐具 2 口以上、免禮金、初期費用 100 萬円以內\n入住時間：1 個月內";
      for (const text of [prompt, prompt.replace("100 萬円", "1,000,000 日圓")]) {
        const criteria = enrichRentCriteriaFromPrompt({ ...base, maxBudget: 250000, minBudget: 150000, initialCostBudget: 1000000 }, text);
        assert.equal(criteria.maxBudget, 250000);
        assert.equal(criteria.minBudget, 150000);
        assert.equal(criteria.initialCostBudget, 1000000);
        assert.equal(criteria.roomType, "ldk1");
        const axis = assess(criteria).axes.find(axis => axis.key === "initialCost");
        assert.match(axis?.headline || "", /4\.0 倍/);
        assert.doesNotMatch(axis?.headline || "", /1\.0 倍/);
      }
      const plans = enrichRentCriteriaFromPrompt({ ...base, maxBudget: 60000 }, "1K 預算 6萬，或 2LDK 預算 13萬，初期費用 100萬");
      assert.equal(plans.maxBudget, 130000, "真正的多方案仍須保留較高的月租預算");
      assert.equal(plans.minBudget, 60000);
    }
  },
  {
    name: "中野、高圓寺被 AI 放入行政區時，自動對應中野區與杉並區行情",
    run: () => {
      const prompt = "預算含管理費 9.5 萬円（理想 8 萬円），想住中野、高圓寺，1K 20㎡以上，要一樓門禁自動門、乾濕分離，走路 10 分鐘內，屋齡 20 年內，不要木造，通勤到新宿，1 個月內入住，留學（大學・專門學校）簽證。";
      for (const districts of [["中野", "高圓寺"], ["中野区", "高円寺"], ["中野／高圓寺"]]) {
        const raw = { ...base, district: districts[0], districts, station: null, stations: [], commuteStation: "新宿" };
        const scope = resolveSearchScope(raw);
        assert.deepEqual([...scope.districts].sort(), ["中野區", "杉並區"].sort());
        assert.deepEqual(scope.unresolvedLocations, []);
        assert.notEqual(assess(raw).axes.find(axis => axis.key === "budget")?.pendingReason, "no-market-data");
        const enriched = enrichRentCriteriaFromPrompt(raw, prompt);
        assert.deepEqual(enriched.districts?.sort(), ["中野區", "杉並區"].sort());
        assert.ok(enriched.stations?.includes("高圓寺"));
        assert.ok(buildRentRecommendations(enriched).some(item => item.station === "高圓寺"));
        assert.deepEqual(resolveSearchScope(enriched).unresolvedLocations, []);
      }
      const mixed = resolveSearchScope({ ...base, district: "高圓寺、火星區" });
      assert.deepEqual(mixed.unresolvedLocations, ["火星區"], "不能把真正未知的地點也消掉");
    }
  },
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
    // 條件標籤（RentCriteriaSummary）先前自己串接 otherNeeds，沒有套用重複過濾，
    // 於是 petsAllowed + otherNeeds:["可養貓"] 會讓「可養貓」在特殊條件出現兩次。
    name: "已由專屬欄位呈現的條件不會重複列入其他需求",
    run: () => {
      const criteria: RentSearchCriteria = {
        ...base,
        petsAllowed: true,
        petType: "貓",
        balcony: true,
        floorMin: 2,
        gasBurnersMin: 2,
        otherNeeds: ["可養貓", "2 樓以上", "陽台", "瓦斯爐2個以上"]
      };
      assert.deepEqual(resolveUncoveredNeeds(criteria, criteria.otherNeeds || []), []);
    }
  },
  {
    name: "沒有對應欄位的其他需求要保留並去重",
    run: () => {
      const criteria: RentSearchCriteria = { ...base, otherNeeds: ["可養貓", "採光良好", "採光良好"] };
      // petsAllowed 未設定時不可過濾寵物條件，否則需求會整個消失。
      assert.deepEqual(resolveUncoveredNeeds(criteria, criteria.otherNeeds || []), ["可養貓", "採光良好"]);
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
      // 沒有租金行情、只有路線資料的通勤目的地也要認得，否則整份通勤查詢會被跳過
      assert.equal(hasKnownCommuteStations("虎ノ門"), true);
      assert.equal(hasKnownCommuteStations("虎ノ門駅"), true);
      assert.equal(hasKnownCommuteStations("公司"), false);
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
    // 回報案例：選新宿・澀谷・目黑・文京＋千代田線，評估卻出現「足立區起跳價 12.9 萬」。
    name: "已指定行政區時，路線不擴大評估範圍，起跳價對得上區名",
    run: () => {
      const criteria = {
        ...base, district: null, roomType: "k1", minBudget: 80_000, maxBudget: 120_000,
        districts: ["新宿區", "澀谷區", "目黑區", "文京區"], lines: ["東京メトロ千代田線"],
        commuteStation: "代代木", commuteMinutes: 45, floorMin: 2, bidet: true, separateBath: true
      } as RentSearchCriteria;
      const scope = resolveSearchScope(criteria);
      assert.equal(scope.districts.size, 4, "千代田線不應把足立區等未指定的區併進來");
      const axis = buildAxisVerdicts(criteria, buildRentRecommendations(criteria)).find(item => item.key === "budget")!;
      const text = JSON.stringify(axis);
      assert.doesNotMatch(text, /足立/);
      assert.match(axis.nextStep || "", /12\.9 萬円（文京區一帶的起跳價）/);
    }
  },
  {
    name: "有區買得起時，不再同時說低於起跳行情",
    run: () => {
      const criteria = {
        ...base, district: null, roomType: "k1", maxBudget: 130_000,
        districts: ["新宿區", "澀谷區", "目黑區", "文京區"], floorMin: 2, bidet: true, separateBath: true
      } as RentSearchCriteria;
      const axis = buildAxisVerdicts(criteria, buildRentRecommendations(criteria)).find(item => item.key === "budget")!;
      assert.equal(axis.status, "部分符合");
      assert.doesNotMatch(axis.headline, /低於/);
    }
  },
  {
    name: "同區優先挑最接近預算的車站，並保留一站在指定路線上",
    run: () => {
      const recs = buildRentRecommendations({
        ...base, district: null, roomType: "k1", maxBudget: 120_000,
        districts: ["文京區", "澀谷區"], lines: ["千代田線"], floorMin: 2, bidet: true, separateBath: true
      } as RentSearchCriteria);
      const inDistrict = (district: string) => recs.filter(item => item.district === district && !item.isBudgetAlternative);
      const bunkyoHighest = Math.max(...inDistrict("文京區").map(item => item.estimate));
      assert.equal(bunkyoHighest, 129_000, "文京區有三站 12.9 萬，不應再選更貴的車站");
      assert.ok(inDistrict("澀谷區").some(item => item.lines.some(line => line.includes("千代田"))), "澀谷區應保留千代田線上的車站");
      assert.ok(inDistrict("澀谷區").every(item => item.station !== "原宿"), "17.2 萬的原宿不應佔名額");
    }
  },
  {
    name: "指定範圍沒有預算內車站時才補替代，且標示清楚、不影響通勤判斷",
    run: () => {
      const criteria = {
        ...base, district: null, roomType: "k1", maxBudget: 120_000,
        districts: ["新宿區", "澀谷區", "目黑區", "文京區"], lines: ["千代田線"],
        commuteStation: "代代木", floorMin: 2, bidet: true, separateBath: true
      } as RentSearchCriteria;
      const recs = buildRentRecommendations(criteria);
      const alternatives = recs.filter(item => item.isBudgetAlternative);
      assert.ok(alternatives.length > 0 && alternatives.length <= 3);
      assert.ok(alternatives.every(item => item.recommendationType === "預算替代" && item.estimate <= 120_000));
      assert.ok(alternatives.every(item => !criteria.districts!.includes(item.district)));
      assert.ok(alternatives.some(item => item.station === "北千住"), "同線且預算內的北千住應列入");
      assert.equal(recs.at(-1)?.isBudgetAlternative, true, "替代方向要排在指定範圍之後");

      const roomy = buildRentRecommendations({ ...criteria, maxBudget: 130_000 });
      assert.ok(roomy.every(item => !item.isBudgetAlternative), "範圍內已有預算內車站就不補替代");
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
  },
  {
    name: "打工度假＋海外審查為高難度組合且提示存款證明與買機票順序",
    run: () => {
      const result = assess({ ...base, visaType: "打工度假", applicationChannel: "overseas" });
      const visaAxis = result.axes.find(a => a.key === "visa")!;
      assert.equal(visaAxis.status, "需調整");
      assert.ok(visaAxis.supplyImpact >= 5);
      assert.ok(visaAxis.drivers.some(d => d.includes("存款餘額證明")));
      assert.ok(visaAxis.nextStep?.includes("購買赴日機票"));
    }
  },
  {
    name: "留學簽證＋海外審查提示入學許可與COE",
    run: () => {
      const result = assess({ ...base, visaType: "留學", applicationChannel: "overseas" });
      const visaAxis = result.axes.find(a => a.key === "visa")!;
      assert.equal(visaAxis.status, "符合");
      assert.ok(visaAxis.drivers.some(d => d.includes("COE")));
      assert.ok(visaAxis.nextStep?.includes("入學許可書"));
    }
  },
  {
    name: "日本籍＋海外審查享有國民資格且不苛扣房源分數",
    run: () => {
      const result = assess({ ...base, visaType: "日本籍", applicationChannel: "overseas" });
      const visaAxis = result.axes.find(a => a.key === "visa")!;
      assert.equal(visaAxis.status, "符合");
      assert.equal(visaAxis.supplyImpact, 1);
      assert.ok(visaAxis.drivers.some(d => d.includes("不受在留資格限制")));
    }
  },
  {
    name: "未指定簽證＋海外審查標記待確認並提示補上簽證",
    run: () => {
      const result = assess({ ...base, visaType: null, applicationChannel: "overseas" });
      const visaAxis = result.axes.find(a => a.key === "visa")!;
      assert.equal(visaAxis.status, "待確認");
      assert.ok(visaAxis.headline.includes("在留資格"));
      assert.ok(visaAxis.nextStep?.includes("補上在留資格"));
    }
  },
  {
    name: "首都圈買賣同時提供成約與市場典型開價兩層基準",
    run: () => {
      const benchmark = getReinsSaleListingBenchmark("東京都");
      assert.equal(benchmark, REINS_METRO_SALE_LISTING_BENCHMARK);
      assert.equal(Math.round(reinsNewListingPremiumRate(benchmark!) * 1000) / 10, 40);
      assert.equal(Math.round(reinsImpliedDiscountFromListingRate(benchmark!) * 1000) / 10, 28.6);

      const verdict = buildSalePriceVerdict({
        salePriceYen: 59_800_000,
        medianPriceYen: 46_400_000,
        layout: "ldk2",
        areaSqm: 60,
        ageYears: 22,
        walkMinutes: 9,
        floor: 5,
        totalFloors: 10,
        sampleCount: 40,
        listingBenchmark: benchmark,
      });

      assert.equal(verdict.expectedPriceMan, 4640);
      assert.equal(verdict.typicalListingPriceMan, 6497);
      assert.equal(verdict.listingDiffPercent, -8);
      assert.equal(verdict.listingVerdict, "typical");
      assert.match(verdict.explanation, /不代表本案可議相同幅度/);
    }
  },
  {
    name: "中部與近畿使用各自 REINS，無基準時不套用首都圈數字",
    run: () => {
      assert.equal(getReinsSaleListingBenchmark("愛知"), REINS_CHUBU_SALE_LISTING_BENCHMARK);
      assert.equal(getReinsSaleListingBenchmark("大阪"), REINS_KINKI_SALE_LISTING_BENCHMARK);
      assert.equal(getReinsSaleListingBenchmark("福岡"), null);
      const verdict = buildSalePriceVerdict({
        salePriceYen: 30_000_000,
        medianPriceYen: 30_000_000,
        layout: "ldk1",
        areaSqm: 41,
        ageYears: 22,
        walkMinutes: 9,
        floor: 3,
        totalFloors: 8,
      });
      assert.equal(verdict.typicalListingPriceMan, null);
      assert.equal(verdict.listingVerdict, null);
      assert.match(verdict.explanation, /沒有同口徑的在售統計/);
    }
  },
  {
    name: "全國公開販售快照優先使用同區同房型 At Home 平均",
    run: () => {
      const benchmark = getSaleListingBenchmark("東京都", "中央區", "ldk1");
      assert.equal(benchmark?.kind, "public_listing_average");
      if (benchmark?.kind !== "public_listing_average") throw new Error("Expected public listing benchmark");
      const verdict = buildSalePriceVerdict({
        salePriceYen: benchmark.averageListingPriceYen,
        medianPriceYen: 60_000_000,
        layout: "ldk1",
        areaSqm: null,
        ageYears: null,
        walkMinutes: null,
        floor: null,
        totalFloors: null,
        listingBenchmark: benchmark,
      });
      assert.equal(verdict.typicalListingPriceMan, Math.round(benchmark.averageListingPriceYen / 10_000));
      assert.equal(verdict.listingDiffPercent, 0);
      assert.equal(verdict.listingBenchmarkKind, "public_listing_average");
      assert.match(verdict.explanation, /刊登價非成交價/);
    }
  },
  {
    name: "全國地址會辨識政令市行政區且不會跨縣誤配同名市",
    run: () => {
      assert.deepEqual(resolveDistrictAndRegion("福岡県北九州市小倉北区魚町1-2", ""), {
        region: "福岡", district: "北九州市小倉北区"
      });
      assert.deepEqual(resolveDistrictAndRegion("大阪府大阪市中央区", ""), {
        region: "大阪", district: "大阪市中央區"
      });
      assert.deepEqual(resolveDistrictAndRegion("広島県府中市", ""), {
        region: "廣島", district: "府中市"
      });
      assert.deepEqual(resolveDistrictAndRegion("沖縄県那覇市久茂地", ""), {
        region: "沖繩", district: "那霸市"
      });
      assert.equal(resolveDistrictAndRegion("辨識不到的地址", ""), null);
    }
  },
  {
    name: "非塔樓最上階會使用獨立樓層溢價",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 30_000_000,
        medianPriceYen: 30_000_000,
        layout: "ldk1",
        areaSqm: 41,
        ageYears: null,
        walkMinutes: null,
        floor: 7,
        totalFloors: 7,
      });
      const floorFactor = verdict.factors.find(factor => factor.label === "樓層");
      assert.equal(floorFactor?.ratePercent, 5.1);
      assert.match(floorFactor?.note || "", /最上階/);
    }
  },
  {
    name: "同屋齡帶㎡單價不會再疊加手估屋齡係數",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 50_000_000,
        medianPriceYen: 30_000_000,
        medianSqmPriceYen: 1_000_000,
        ageControlledByMarket: true,
        layout: "ldk1",
        areaSqm: 40,
        ageYears: 5,
        walkMinutes: null,
        floor: null,
        totalFloors: null,
      });
      assert.equal(verdict.expectedPriceMan, 4000);
      assert.equal(verdict.factors.find(factor => factor.label === "屋齡"), undefined);
      assert.equal(verdict.ageHandledInBaseline, true);
      assert.match(verdict.baselineNote, /同屋齡帶/);
      assert.match(verdict.areaBasisNote, /成交㎡單價中位數/);
    }
  },
  {
    name: "真實販売図面的全面翻新明細會套用翻新係數",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 50_000_000,
        medianPriceYen: 45_000_000,
        layout: "ldk1",
        areaSqm: 40,
        ageYears: null,
        walkMinutes: null,
        floor: null,
        totalFloors: null,
        renovationNotes: "キッチン・トイレ・洗面台・浴室・給排水管交換、床フローリング・壁・天井クロス貼替",
      });
      assert.equal(verdict.factors.find(factor => factor.label === "翻新")?.ratePercent, 8);
    }
  },
  {
    name: "可選停車位不會混入固定月費，改定後修繕金會優先",
    run: () => {
      assert.equal(parseMandatoryMonthlyFees("駐車場：有(月額29,000円)、駐輪場：有(月額300円)"), null);
      assert.equal(parseMandatoryMonthlyFees("町会費 200円、インターネット使用料 1,100円"), 1300);
      assert.equal(parseMandatoryMonthlyFees("300円／月（町会費）"), 300);
      assert.equal(
        parseEffectiveRepairReserve("月額4,600円", "2025年12月分より修繕積立金、月額7,300円に改定。"),
        7300,
      );
    }
  },
  {
    name: "地段溢價小於3%仍會揭露町名排名，交通樞紐大站會列入因子",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 77_990_000,
        medianPriceYen: 50_000_000,
        layout: "ldk2",
        areaSqm: 46.92,
        ageYears: 28,
        walkMinutes: 5,
        floor: 7,
        totalFloors: 7,
        transitHub: {
          hasMajorTerminal: true,
          majorStation: "中野",
          majorWalkMinutes: 11,
          totalStations: 2,
          totalLinesCount: 3,
          ratePercent: 4,
          note: "可徒步至「中野」駅（JR中央線・東西線・熱門核心大站，徒步 11 分），合計 2 站 3 路線利用可能",
        },
        townPremium: {
          town: "高円寺南",
          premiumPercent: 1.3,
          sampleCount: 40,
          rank: 13,
          townCount: 24,
        },
      });
      const townFactor = verdict.factors.find(f => f.label === "地段（町名）");
      assert.ok(townFactor, "地段（町名）應存在");
      assert.equal(townFactor?.ratePercent, 1.3);
      assert.match(townFactor?.note || "", /排第 13 名/);

      const hubFactor = verdict.factors.find(f => f.label === "交通樞紐");
      assert.ok(hubFactor, "交通樞紐應存在");
      assert.equal(hubFactor?.ratePercent, 4);
      assert.match(hubFactor?.note || "", /中野/);

      const floorFactor = verdict.factors.find(f => f.label === "樓層");
      assert.ok(floorFactor, "最上階樓層應存在");
      assert.match(floorFactor?.note || "", /最上階/);
    }
  },
  {
    name: "角部屋、南向、露台及借地權正確列入因子且累計優勢合計正確",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 77_990_000,
        medianPriceYen: 55_040_000,
        layout: "ldk2",
        areaSqm: 46.92,
        ageYears: 28,
        walkMinutes: 5,
        floor: 7,
        totalFloors: 7,
        unitFeatures: {
          isCornerUnit: true,
          facingDirection: "southeast",
          facingDirectionZh: "東南向",
          hasRoofBalcony: true,
          hasPrivateGarden: false,
          isLeasehold: false,
        },
      });

      const cornerFactor = verdict.factors.find(f => f.label === "角部屋");
      assert.ok(cornerFactor, "角部屋應列入因子");
      assert.equal(cornerFactor?.ratePercent, 4);

      const facingFactor = verdict.factors.find(f => f.label === "陽台朝向");
      assert.ok(facingFactor, "陽台朝向應列入因子");
      assert.equal(facingFactor?.ratePercent, 3);

      const balconyFactor = verdict.factors.find(f => f.label === "專用露台");
      assert.ok(balconyFactor, "專用露台應列入因子");
      assert.equal(balconyFactor?.ratePercent, 5);

      assert.ok(verdict.positiveFactorsSumPercent >= 17, `優勢合計應大於等於 17%（實得 ${verdict.positiveFactorsSumPercent}%）`);
      assert.ok(verdict.insightPoints.some(p => p.id === "factors_sum"), "應產生條件累計分析 insight point");
    }
  },
  {
    name: "自主管理、無電梯、社區規模及寵物飼育正確列入査定因子與優劣勢",
    run: () => {
      const verdict = buildSalePriceVerdict({
        salePriceYen: 35_000_000,
        medianPriceYen: 40_000_000,
        layout: "ldk1",
        areaSqm: 38,
        ageYears: 35,
        walkMinutes: 8,
        floor: 4,
        totalFloors: 5,
        totalUnits: 120,
        managementStyle: "自主管理",
        buildingNotes: "エレベーター無 ペット飼育可",
      });

      const mgmtFactor = verdict.factors.find(f => f.label === "管理體制");
      assert.ok(mgmtFactor, "自主管理應列入因子");
      assert.equal(mgmtFactor?.ratePercent, -5);

      const evFactor = verdict.factors.find(f => f.label === "電梯配置");
      assert.ok(evFactor, "4樓無電梯應列入因子");
      assert.equal(evFactor?.ratePercent, -6);

      const scaleFactor = verdict.factors.find(f => f.label === "社區規模");
      assert.ok(scaleFactor, "120戶大規模社區應列入因子");
      assert.equal(scaleFactor?.ratePercent, 3);

      const petFactor = verdict.factors.find(f => f.label === "寵物飼育");
      assert.ok(petFactor, "寵物飼育可應列入因子");
      assert.equal(petFactor?.ratePercent, 2);
    }
  },
  {
    name: "大坪數 1LDK 依面積換算行情，不因格局判偏貴",
    run: () => {
      // 固定行情數字，不吃每月更新的快照（避免行情一動測試就壞）
      const mk = (median: number): RequestedRentRange => ({
        low: Math.round(median * 0.94), median, high: Math.round(median * 1.04),
        sampleCount: 1, basis: "測試區", segments: [{ district: "測試區", low: median, median, high: median }], spread: false,
      });
      const table: Record<string, RequestedRentRange> = { k1: mk(108_000), ldk1: mk(154_000), ldk2: mk(195_000), ldk3: mk(283_000) };
      const rangeFor = (rt: string) => table[rt] ?? null;
      const ctx = { ageYears: 14, walkMinutes: 10, roomType: "ldk1", structure: "RC", floor: 6, totalFloors: 10,
        facilities: "B・T別,シャワー,追焚機能,洗面台,オートロック,宅配BOX,角部屋,2面採光" };

      // 55㎡ 的 1LDK（池袋ユニブール案例）：換算到 2LDK～3LDK 之間並扣格局 4%
      const sized = buildSizeEquivalentRange("ldk1", 55.28, table.ldk1, rangeFor);
      assert.ok(sized, "55㎡ 1LDK 應啟用面積換算");
      assert.equal(sized!.adjustment.direction, "oversize");
      assert.ok(sized!.range.median > table.ldk2.median, `換算中位應高於 2LDK 中位，實得 ${sized!.range.median}`);
      const verdict = buildListingPriceVerdict(200_000, sized!.range, { ...ctx, areaSqm: 55.28, sizeAdjusted: true });
      assert.doesNotMatch(verdict.status, /偏高/, `55㎡ 1LDK 20 萬不應判偏高：${verdict.headline}`);
      assert.ok(!verdict.factors?.some(f => f.category === "space"), "已依面積換算就不可再重複給面積加成");

      // 對照：沿用格局行情會判偏高（這就是要修的誤判）
      const naive = buildListingPriceVerdict(200_000, table.ldk1, { ...ctx, facilities: "", areaSqm: 55.28 });
      assert.match(naive.status, /偏高/);

      // 正常大小（40㎡）的 1LDK 不換算
      assert.equal(buildSizeEquivalentRange("ldk1", 40, table.ldk1, rangeFor), null);

      // 反方向：38㎡ 的 2LDK 面積偏小，換算中位要低於 2LDK 中位且不扣格局折讓
      const small = buildSizeEquivalentRange("ldk2", 38, table.ldk2, rangeFor);
      assert.ok(small && small.adjustment.direction === "undersize");
      assert.ok(small!.range.median < table.ldk2.median);
      assert.equal(small!.adjustment.layoutAdjustPercent, 0);
    }
  },
  {
    name: "圖紙設備寫法 B・T別／洗面台／角部屋 都要算到加成",
    run: () => {
      const range: RequestedRentRange = { low: 90_000, median: 100_000, high: 105_000, sampleCount: 1, basis: "測試區", segments: [], spread: false };
      for (const facilities of ["B・T別,洗面台,角部屋", "ＢＴ別、独立洗面台、2面採光", "b･t別 シャンプードレッサー 角住戸"]) {
        const labels = buildListingPriceVerdict(100_000, range, { facilities }).factors?.map(f => f.label) ?? [];
        assert.ok(labels.includes("乾濕分離（BT別）"), `${facilities} 應辨識乾濕分離`);
        assert.ok(labels.includes("獨立洗面台"), `${facilities} 應辨識獨立洗面台`);
        assert.ok(labels.includes("角間雙面採光"), `${facilities} 應辨識角間`);
      }
    }
  },
  {
    name: "租金判定只用一個標準：條件折減後超出就不能標合理",
    run: () => {
      const range: RequestedRentRange = { low: 90_000, median: 100_000, high: 110_000, sampleCount: 1, basis: "測試區", segments: [], spread: false };
      // 築 35 年、徒步 18 分、木造：條件淨值明顯為負；月額 10.8 萬仍在原始行情區間內，以前上方會標「合理」
      const old = buildListingPriceVerdict(108_000, range, { ageYears: 35, walkMinutes: 18, structure: "木造" });
      assert.ok((old.netFactorsSumPercent ?? 0) < -20, `條件淨值應為大幅負值，實得 ${old.netFactorsSumPercent}`);
      assert.match(old.status, /偏高/, `條件差卻開在區間高端應判偏高：${old.status} ${old.headline}`);
      assert.match(old.detail, /合理行情約/, "說明要寫出條件調整後的合理行情");
      // 同一間開 6.5 萬：落在條件調整後的行情內（淨值約 −37%，合理約 5.7～6.9 萬）
      assert.equal(buildListingPriceVerdict(65_000, range, { ageYears: 35, walkMinutes: 18, structure: "木造" }).status, "合理");
      // 新築、近站、RC、設備齊全（淨值約 +39%，合理約 12.5～15.3 萬）：開價 14 萬高於原始上限，但條件撐得起 → 條件反映
      const premium = buildListingPriceVerdict(140_000, range, { ageYears: 2, walkMinutes: 3, structure: "RC", facilities: "B・T別,洗面台,オートロック" });
      assert.equal(premium.status, "條件反映", `${premium.status} ${premium.headline}`);
    }
  }
];

for (const scenario of scenarios) {
  scenario.run();
  console.log(`✓ ${scenario.name}`);
}

console.log(`\n需求可行性回歸測試：${scenarios.length}/${scenarios.length} 通過`);
