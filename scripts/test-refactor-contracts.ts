import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mock } from "node:test";
import { requestRentAnalysis } from "../src/lib/calculator/apiClient.js";
import { createAvailabilityAssessment, type AvailabilityInput } from "../src/lib/calculator/availability.js";
import { calculateBuyAffordability, createBuyEstimator, type BuyAffordabilityInput, type BuyEstimateInput } from "../src/lib/calculator/buyBudget.js";
import { buildStructuredRentCriteria, type StructuredRentForm } from "../src/lib/calculator/criteriaMapping.js";
import { normalizeRentBudgetSelection, normalizeStructureOption, sameGuidedLine } from "../src/lib/calculator/options.js";
import { createRentEstimator } from "../src/lib/calculator/rentEstimate.js";
import { createListingShare, readListingShare, requestListingAnalysis, requestListingLocation } from "../src/lib/listing/apiClient.js";
import { base64Bytes, canvasHasContent, withTimeout } from "../src/lib/listing/browser/fileUtils.js";
import { buildClientInitialCost } from "../src/lib/listing/clientInitialCost.js";
import { buildClientSaleAnalysis } from "../src/lib/listing/clientSaleAnalysis.js";
import { buildRentalMarketFactors } from "../src/lib/listing/rentalMarketPresentation.js";
import { buildListingReportModel } from "../src/lib/listing/reportModel.js";
import { buildAgeBandPriceScale, layoutSalePriceMarks } from "../src/lib/listing/saleMarketPresentation.js";
import type { AnalyzeListingResult } from "../src/lib/listing/types.js";

type CalculatorInput = Omit<AvailabilityInput, "getSelectedDistrictData">
  & Omit<BuyEstimateInput, "getSelectedDistrictData"> & BuyAffordabilityInput;

// Expected values were captured from 78ea857 before extraction, not recalculated
// from the new modules. Include complete fee items and explanations, not only totals.
const fixtures = JSON.parse(readFileSync(new URL("./fixtures/refactor-baseline.json", import.meta.url), "utf8")) as {
  clock: string;
  listing: Array<{ name: string; input: AnalyzeListingResult; expected: unknown }>;
  calculator: Array<{ name: string; input: CalculatorInput; expected: unknown }>;
};
const snapshot = (value: unknown): unknown => JSON.parse(JSON.stringify(value, (_key, item) =>
  typeof item === "number" && !Number.isFinite(item) ? String(item) : item));

mock.timers.enable({ apis: ["Date"], now: Date.parse(fixtures.clock) });
try {
  for (const { name, input, expected } of fixtures.listing) {
    assert.deepEqual(snapshot({
      initialCost: buildClientInitialCost(input),
      saleAnalysis: buildClientSaleAnalysis(input),
    }), expected, name);
  }
  for (const { name, input, expected } of fixtures.calculator) {
    const rent = createRentEstimator(input);
    const buy = createBuyEstimator({ ...input, getSelectedDistrictData: rent.getSelectedDistrictData });
    const availability = createAvailabilityAssessment({ ...input, getSelectedDistrictData: rent.getSelectedDistrictData });
    const price = buy.getCalculatedBuyPrice();
    assert.deepEqual(snapshot({
      rent: rent.getCalculatedRent(),
      districtScale: rent.getDistrictScale(),
      modifierPrice: rent.getModifierPrice(10000),
      price,
      monthlyPayment: buy.getMonthlyPayment(price),
      districtPrice: buy.getDistrictBuyPrice(input.calcDistrict, input.calcRoomType),
      availability: availability(),
      affordable: calculateBuyAffordability(input),
    }), expected, name);
  }

  const base = fixtures.listing[0].input;
  const titled = { ...base, extracted: { ...base.extracted, buildingName: "テストマンション", floor: "3階" } };
  assert.equal(buildListingReportModel(titled, { name: "テストマンション_８０３.pdf", type: "application/pdf" }).reportHeading, "テストマンション 803号室");
  assert.equal(buildListingReportModel(titled, { name: "テストマンション_2026.pdf", type: "application/pdf" }).reportHeading, "テストマンション 3階");
  assert.equal(buildListingReportModel({ ...titled, extracted: { ...titled.extracted, floor: "4階建" } }, null).reportHeading, "テストマンション");
  assert.equal(buildListingReportModel(null, null).reportHeading, "日本租賃物件");

  const serverFactors = [{ label: "後端明示因子", ratePercent: 0, monthlyYen: 0, note: "保留零值", level: 0, category: "test" }];
  const withFactors = { ...base, verdict: { status: "合理", headline: "", detail: "", factors: serverFactors, positiveFactorsSumPercent: 0, negativeFactorsSumPercent: 0, netFactorsSumPercent: 0, nominalDiffPercent: 0 } };
  const factors = buildRentalMarketFactors(withFactors, ["乾濕分離"], 200000);
  assert.equal(factors.rentalFactors, serverFactors, "API factors retain priority and identity");
  assert.equal(factors.nominalDiff, 0, "Explicit API zero must not trigger the fallback");
  assert.equal(factors.netFactorsSum, 0);
  const sale = buildClientSaleAnalysis(fixtures.listing.find(item => item.name === "sale-occupied")!.input)!;
  const blocked = buildListingReportModel({ ...base, dealType: "sale", saleAnalysis: { ...sale, mlitComparison: { district: "中野區" } as NonNullable<typeof sale.mlitComparison> }, audit: { version: 1, entries: [], issues: [], blocksComparison: true } }, null);
  assert.equal(blocked.saleAnalysis?.mlitComparison, null, "Audit comparison gate survives extraction");
} finally {
  mock.timers.reset();
}

assert.equal(normalizeRentBudgetSelection(1), 20000);
assert.equal(normalizeRentBudgetSelection(102500), 105000);
assert.equal(normalizeRentBudgetSelection(2000000), 1000000);
assert.equal(normalizeStructureOption("SRC造"), "SRC造");
assert.equal(sameGuidedLine("JR山手線（各停）", "JR山手線"), true);

const form: StructuredRentForm = {
  calcRoomType: "k1", guidedMinArea: 0, rentMonthlyBudgetMin: 150000, rentMonthlyBudget: 100000,
  guidedDistrictSelections: ["新宿區"], guidedLineSelections: [], guidedStationSelections: [],
  guidedWalkMinutes: 0, guidedCommuteStation: "", guidedCommuteMinutes: 45,
  guidedVisaType: "", guidedApplicationChannel: "overseas", guidedAgeMax: 0, guidedFloorMin: 0,
  calcModifiers: ["furnished", "separate_bath"], guidedAutoLock: false, guidedElevator: false,
  guidedStructure: "", rentSearchFilters: ["noDeposit", "twoBurners"],
};
const criteria = buildStructuredRentCriteria(form);
assert.equal(criteria.minBudget, 100000);
assert.equal(criteria.areaMin, null);
assert.equal(criteria.commuteMinutes, null);
assert.equal(criteria.initialCostBudget, null);
assert.equal(criteria.furnishedPriority, "required");
assert.equal(criteria.applicationChannel, "overseas");
assert.equal(criteria.noDeposit, true);
assert.equal(criteria.gasBurnersMin, 2);
assert.equal(criteria.districts, form.guidedDistrictSelections);

const equalBandScale = buildAgeBandPriceScale({ ageBandComparison: [
  { ageBand: "age_0_10", medianSqmPriceYen: 1000000, sampleCount: 1, diffPercent: 0, isCurrent: true },
  { ageBand: "age_11_20", medianSqmPriceYen: 1000000, sampleCount: 1, diffPercent: 0, isCurrent: false },
] } as Parameters<typeof buildAgeBandPriceScale>[0]);
assert.equal(equalBandScale.priceLevel(1000000), 5);
const marks = layoutSalePriceMarks(value => value, 50, 50, []);
assert.deepEqual(marks.rowOf, [0, 1], "Identical price marks occupy distinct rows");
assert.equal(marks.rows, 2);

// Response/error handling stays in the workflow. A non-JSON error response must
// reach the caller untouched, and a rejected request must not be retried here.
const originalFetch = globalThis.fetch;
const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
const response = new Response("not JSON", { status: 503 });
globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return response; };
try {
  const result = fixtures.listing[0].input;
  const analysis = { files: [{ mimeType: "application/pdf", data: "YWJj" }], mode: "auto" as const, layoutText: "敷金　無" };
  assert.equal(await readListingShare("a/b?日本"), response);
  assert.equal(await createListingShare({ title: "物件", result }), response);
  assert.equal(await requestListingAnalysis(analysis), response);
  const context = { mode: "context" as const, address: "東京都中野区", stations: ["中野"], advertisedWalkMinutes: [null, 6] };
  await requestListingLocation(context);
  const crime = { mode: "crime" as const, address: "大阪府大阪市" };
  await requestListingLocation(crime);
  const commute = { mode: "commute" as const, originStation: "中野", originWalkMinutes: 8, originAdvertisedMinutes: undefined, addressContext: "東京都", destination: "新宿駅" };
  await requestListingLocation(commute);
  await requestRentAnalysis({ criteria });
  await requestRentAnalysis({ prompt: "月租10万円" });
  assert.deepEqual(calls[0], { url: "/api/listing-share?id=a%2Fb%3F%E6%97%A5%E6%9C%AC", init: undefined });
  const payloads = [
    ["/api/listing-share", { title: "物件", result }], ["/api/analyze-listing", analysis],
    ["/api/listing-location", context], ["/api/listing-location", crime], ["/api/listing-location", commute],
    ["/api/rent-analysis", { criteria }], ["/api/rent-analysis", { prompt: "月租10万円" }],
  ];
  payloads.forEach(([url, payload], index) => assert.deepEqual(calls[index + 1], {
    url, init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
  }));
  let attempts = 0;
  const failure = new Error("network unavailable");
  globalThis.fetch = async () => { attempts++; throw failure; };
  await assert.rejects(requestListingAnalysis(analysis), error => error === failure);
  assert.equal(attempts, 1);
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(base64Bytes("YQ=="), 1);
assert.equal(base64Bytes("YWI="), 2);
assert.equal(base64Bytes("YWJj"), 3);
const canvas = (data: Uint8ClampedArray) => ({ width: 3400, height: 1, getContext: () => ({ getImageData: () => ({ data }) }) }) as unknown as HTMLCanvasElement;
const pixels = new Uint8ClampedArray(4 * 17 * 200).fill(255);
pixels[0] = 0;
assert.equal(canvasHasContent(canvas(pixels)), false, "Exactly 0.5% ink still counts as blank");
pixels[4 * 17] = 0;
assert.equal(canvasHasContent(canvas(pixels)), true);
assert.equal(canvasHasContent({ getContext: () => null } as unknown as HTMLCanvasElement), false);
assert.equal(canvasHasContent({ getContext: () => ({ getImageData: () => { throw new Error("blocked"); } }) } as unknown as HTMLCanvasElement), true);

mock.timers.enable({ apis: ["setTimeout"] });
try {
  assert.equal(await withTimeout(Promise.resolve("ready"), 10, "PDF"), "ready");
  const failure = new Error("render failed");
  await assert.rejects(withTimeout(Promise.reject(failure), 10, "PDF"), error => error === failure);
  const timedOut = assert.rejects(withTimeout(new Promise<never>(() => {}), 10, "PDF"), /PDF 逾時（10ms）/);
  mock.timers.tick(10);
  await timedOut;
} finally {
  mock.timers.reset();
}

console.log(`Refactor contracts: ${fixtures.listing.length} listing + ${fixtures.calculator.length} calculator baselines, request contracts and browser utility boundaries passed.`);
