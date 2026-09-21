import { verifyListingRaces } from "./helpers/listing-race-cases";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import type {} from "./helpers/controller-browser-harness";

const fixturePath = resolve("scripts/fixtures/controller-flows-baseline.json");
const mock = `
const h = () => globalThis.controllerHarness;
export const requestListingAnalysis = payload => h().deferred('analysis', payload);
export const requestListingLocation = payload => h().deferred('location', payload);
export const createListingShare = payload => h().deferred('share', payload);
export const readListingShare = id => h().deferred('readShare', id);
export const requestRentAnalysis = payload => h().deferred('rent', payload);
export const encodeForUpload = file => h().deferred('encode', { name: file.name, type: file.type });
export const renderPdfPreview = (file, onAspect) => { h().registerPreview(file.name, onAspect); return h().deferred('preview', { name: file.name }); };
export const trackAction = name => h().track(name);
export const pdf = element => ({toBlob: () => h().deferred('pdf', element.props)});
export const ListingReportPdf = () => null;
export const registerPdfFonts = base => h().events.push({fonts:base});
`;
const bundle = await build({
  entryPoints: ["scripts/helpers/controller-browser-harness.tsx"], write: false,
  bundle: true, format: "iife", platform: "browser", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' }, logLevel: "silent",
  plugins: [{ name: "controlled-providers", setup(builder) {
    builder.onResolve({ filter: /(?:listing\/apiClient|calculator\/apiClient|browser\/uploadEncoding|browser\/pdfRendering|lib\/trackView|components\/ListingReportPdf|@react-pdf\/renderer)$/ }, () => ({ path: "providers", namespace: "test" }));
    builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: mock, loader: "js" }));

  } }],
});
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", error => errors.push(error.message));
await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }));
const snapshots: Record<string, unknown> = {};
try {
  await page.goto("http://controller.test/");
  await page.clock.setFixedTime(new Date("2026-09-12T00:00:00.000Z"));
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const run = async (code: string) => page.evaluate(async code => {
    // The expressions below are fixed test source, never external input.
    return await new Function("h", `return (async () => { ${code} })()`)((globalThis as unknown as { controllerHarness: unknown }).controllerHarness);
  }, code);
  const save = async (name: string) => { snapshots[name] = await run("return h.snapshot();"); };
  const baselineListing = JSON.parse(await readFile("scripts/fixtures/refactor-baseline.json", "utf8")).listing[0].input;
  const analysis = { ...baselineListing, extracted: { ...baselineListing.extracted, address: "東京都新宿区西新宿1丁目", station: "新宿，西新宿", walkTime: "徒歩5分，8分" }, dealType: "rent" };
  const criteria = { roomType: "k1", district: "新宿區", maxBudget: 120000, minBudget: 80000, areaMin: 25, autoLock: true, cityGasRequired: true };
  const encoded = { files: [{ mimeType: "image/jpeg", data: "YQ==" }], layoutText: "layout text" };

  await run('await h.mount("listing"); await h.call("analyze");');
  await save("listing-empty-guard");
  await run('await h.file("A.pdf", "application/pdf"); await h.file("B.pdf", "application/pdf"); await h.settle("preview", {blobUrl:"blob:B", aspect:2}, {occurrence:1}); await h.settle("preview", {blobUrl:"blob:A", aspect:1});');
  await save("preview-reverse-completion");
  await run('await h.file("C.pdf", "application/pdf"); await h.call("removeFile"); await h.settle("preview", {blobUrl:"blob:C", aspect:3});');
  await save("preview-completes-after-removal");
  await run('await h.mount("listing"); await h.file("blank.pdf", "application/pdf"); await h.settle("preview", null);');
  await save("preview-native-fallback");
  await run('await h.call("setShowFullPreview", true); window.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape"})); await h.call("setShareTitle", "");');
  await save("preview-escape");

  await run('await h.mount("listing"); await h.file("A.png", "image/png"); await h.call("analyze"); await h.call("analyze");');
  await run(`await h.settle("encode", ${JSON.stringify(encoded)}); await h.file("B.png", "image/png");`);
  await save("analysis-loading-guard-and-file-switch");
  await run(`await h.settle("analysis", ${JSON.stringify(analysis)});`);
  await save("analysis-old-file-response");
  await run('await h.call("analyze");');
  await run(`await h.settle("encode", ${JSON.stringify(encoded)}); await h.settle("analysis", ${JSON.stringify(analysis)});`);
  await save("analysis-current-file-response");
  await run('await h.settle("location", {error:"定位服務逾時"}, {status:504});');
  await save("location-failure-starts-raw-address-crime");
  await run('await h.settle("location", {found:true, precision:"prefecture", prefecture:{name:"東京都", level:"test"}});');
  await save("crime-prefecture-fallback");
  await run('await h.call("setCommuteDestination", " 東京駅 "); await h.call("analyzeCommute");');
  await save("commute-missing-walk-guard");
  await run(`await h.call("loadLocationContext", ${JSON.stringify(analysis)}); await h.settle("location", {found:true,context:{matchedAddress:"東京都新宿区西新宿一丁目",stationWalks:[{station:"新宿",normalMinutes:6,advertisedMinutes:5}]}}); await h.settle("location", null, {reject:true}); await h.call("analyzeCommute"); await h.call("analyzeCommute");`);
  await save("commute-request-and-loading-guard");
  await run('await h.settle("location", {found:false,message:"路線なし"});');
  await save("commute-not-found");
  await run('await h.call("analyzeCommute"); await h.settle("location", {found:true,commute:{totalMinutes:25,transfers:1}});');
  await save("commute-success");
  await run('await h.call("createShareLink"); await h.call("setShareTitle", "  新宿測試  "); await h.call("createShareLink"); await h.call("createShareLink");');
  await save("share-title-and-loading-guard");
  await run('await h.settle("share", {id:"ABCDEFGH"}); h.clipboardFailure(true); await h.call("copyShareUrl");');
  await save("share-clipboard-failure");
  await run('h.clipboardFailure(false); await h.call("copyShareUrl");');
  await save("share-clipboard-success");
  await run('await h.call("downloadPdf"); await h.call("downloadPdf");');
  await save("pdf-lazy-export-and-loading-guard");
  await run('await h.settle("pdf", new Blob(["pdf"], {type:"application/pdf"}));');
  await save("pdf-download-success");
  await run('await h.call("downloadPdf"); await h.settle("pdf", "renderer failed", {reject:true});');
  await save("pdf-render-failure");

  await run('await h.mount("listing"); await h.file("large.png", "image/png"); await h.call("analyze"); await h.settle("encode", {files:[{mimeType:"image/jpeg",data:"A".repeat(4194308)}],layoutText:""});');
  await save("analysis-size-limit");
  await run(`await h.call("analyze"); await h.settle("encode", ${JSON.stringify(encoded)}); await h.settle("analysis", null, {status:502,invalidJson:true});`);
  await save("analysis-invalid-json-error");
  await run('await h.call("analyze"); await h.settle("encode", "decode failed", {reject:true});');
  await save("analysis-encoding-rejection");

  await run('await h.mount("listing", "AAAAAAAA"); await h.setSharedId("BBBBBBBB");');
  await run(`await h.settle("readShare", {title:"old",result:${JSON.stringify(analysis)}});`);
  await save("shared-id-cleanup-ignores-old-response");
  await run(`await h.settle("readShare", {title:"new",expiresAt:"2026-09-20",result:${JSON.stringify(analysis)}});`);
  await save("shared-current-response");
  await run('await h.settle("location", null, {reject:true}); await h.settle("location", {found:false}); await h.setSharedId("CCCCCCCC"); await h.unmount(); await h.settle("readShare", "expired", {reject:true});');
  await save("shared-unmount-ignores-rejection");

  await run('await h.mount("calculator"); await h.call("selectGuidedArea", 30); await h.call("toggleModifier", "first_floor"); await h.call("toggleRentSearchFilter", "secondFloor"); await h.call("toggleModifier", "lp_gas"); await h.call("toggleRentSearchFilter", "cityGas"); await h.call("toggleBuildingSecurity", "autoLock"); await h.call("selectGuidedStructure", "木造");');
  await save("calculator-modifier-synchronization");
  await run('await h.call("setAiPrompt", "  希望住新宿  "); await h.call("analyzeNaturalLanguageRent"); await h.call("analyzeNaturalLanguageRent");');
  await save("natural-language-loading-guard");
  await run(`await h.settle("rent", {criteria:${JSON.stringify(criteria)},recommendations:[],advisorAdvice:"advisor"});`);
  await save("natural-language-sync-success");
  await run('await h.call("analyzeStructuredRent"); await h.call("analyzeStructuredRent"); await h.settle("rent", {error:"upstream failed"}, {status:503});');
  await save("structured-local-recommendation-fallback");
  await run('await h.call("analyzeNaturalLanguageRent"); await h.settle("rent", null, {invalidJson:true});');
  await save("natural-language-invalid-json-preserves-result");
  await run('await h.call("analyzeNaturalLanguageRent"); await h.call("analyzeStructuredRent");');
  const secondCriteria = { ...criteria, areaMin: 35, maxBudget: 160000 };
  await run(`await h.settle("rent", {criteria:${JSON.stringify(secondCriteria)},recommendations:[],advisorAdvice:"structured"}, {occurrence:1}); await h.settle("rent", {criteria:${JSON.stringify(criteria)},recommendations:[],advisorAdvice:"natural"});`);
  await save("independent-analysis-flows-reverse-completion");
  await run('await h.call("setGuidedCommuteStation", "大阪"); await h.call("analyzeStructuredRent");');
  await save("structured-incompatible-commute-guard");
  await run('await h.call("addGuidedDistrict", "澀谷區"); await h.call("setGuidedCommuteStation", ""); await h.call("addGuidedDistrict", "澀谷區"); await h.call("removeGuidedDistrict", "新宿區");');
  await save("district-guard-and-removal");

  const checkpoint = (name: string) => snapshots[name] as {
    state: Record<string, unknown>; pending: Array<{ kind: string; payload: unknown }>;
  };
  assert.equal(checkpoint("analysis-loading-guard-and-file-switch").pending.length, 1);
  assert.equal(checkpoint("natural-language-loading-guard").pending.length, 1);
  assert.equal(checkpoint("analysis-size-limit").pending.length, 0);
  assert.equal(checkpoint("analysis-size-limit").state.loading, false);
  assert.deepEqual(checkpoint("location-failure-starts-raw-address-crime").pending[0].payload, {
    mode: "crime", address: analysis.extracted.address,
  });
  assert.equal(checkpoint("shared-id-cleanup-ignores-old-response").state.result, null);
  assert.equal(checkpoint("structured-incompatible-commute-guard").pending.length, 0);
  assert.match(String(checkpoint("structured-incompatible-commute-guard").state.locationGuardNotice), /不在同一生活圈/);
  assert.equal(checkpoint("pdf-render-failure").state.pdfLoading, false);
  assert.equal(checkpoint("preview-reverse-completion").state.file, "B.pdf");
  assert.equal(checkpoint("preview-reverse-completion").state.previewImageUrl, "blob:B");
  assert.equal(checkpoint("preview-completes-after-removal").state.file, null);
  assert.equal(checkpoint("preview-completes-after-removal").state.previewImageUrl, null);
  assert.equal(checkpoint("analysis-old-file-response").state.file, "B.png");
  assert.equal(checkpoint("analysis-old-file-response").state.result, null);
  assert.equal(checkpoint("analysis-old-file-response").pending.length, 0);
  assert.equal(checkpoint("analysis-loading-guard-and-file-switch").state.loading, false);
  await verifyListingRaces(run, analysis, encoded);
  assert.deepEqual(errors, [], "No uncaught browser errors");
  const expected = JSON.parse(await readFile(fixturePath, "utf8"));
  // 交通動線修復後，location context 請求額外帶上 stationLines，讓後端能區分
  // 同名站的不同路線（如都営大江戸線「両国」vs 中央・総武線各停「両国」）。
  // 歷史 baseline 保持不動：先單獨斷言這個新欄位確實送出，再從比對對象中移除。
  const locationRequests: unknown[] = [];
  const withoutStationLines = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutStationLines);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const payload = record.payload as Record<string, unknown> | undefined;
      if (payload && payload.mode === "context" && "stationLines" in payload) {
        locationRequests.push(payload.stationLines);
        const { stationLines: _dropped, ...rest } = payload;
        return { ...record, payload: withoutStationLines(rest) };
      }
      return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, withoutStationLines(item)]));
    }
    return value;
  };
  // 分享 payload 新增了 commute／commuteDestination（讓收件人看得到同一份通勤試算）。
  // 歷史 baseline 產生於此之前，因此比對前先移除；新行為另外單獨斷言。
  const sharedCommutePayloads: unknown[] = [];
  const withoutSharedCommute = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutSharedCommute);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (record.kind === "share" && record.payload && typeof record.payload === "object") {
        const { commute, commuteDestination, ...rest } = record.payload as Record<string, unknown>;
        sharedCommutePayloads.push({ commute, commuteDestination });
        return { ...record, payload: rest };
      }
      return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, withoutSharedCommute(item)]));
    }
    return value;
  };
  // 移除 payload 新增的 safety 欄位，讓歷史 fixture 仍可比對其餘內容。
  // 只針對值為 null 的情形移除：有實際治安資料時應該要能看出差異，不該被靜默吃掉。
  const withoutSafety = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutSafety);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const entries = Object.entries(record)
        .filter(([key, item]) => !(key === "safety" && item === null))
        .map(([key, item]) => [key, withoutSafety(item)]);
      return Object.fromEntries(entries);
    }
    return value;
  };
  // 巴士通勤（4b9a085）讓 location 的 commute 請求多帶 originBusMinutes／originBusStop：
  // 路線起點是巴士站時，步行時間要算到巴士站而不是車站。歷史 fixture 產生於此之前，
  // 因此比對前先移除，與上面 safety／sharedCommute 的處理一致。
  // 只移除「沒有巴士」的預設值（0 / null）：真的有巴士資料時必須看得出差異，不可靜默吃掉。
  const busCommutePayloads: unknown[] = [];
  const withoutOriginBus = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutOriginBus);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const payload = record.payload as Record<string, unknown> | undefined;
      if (payload && payload.mode === "commute" && "originBusMinutes" in payload
        && payload.originBusMinutes === 0 && payload.originBusStop === null) {
        const { originBusMinutes, originBusStop, ...rest } = payload;
        busCommutePayloads.push({ originBusMinutes, originBusStop });
        return { ...record, payload: rest };
      }
      return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, withoutOriginBus(item)]));
    }
    return value;
  };

  // The historical fixture stays immutable. Only the explicitly fixed race
  // checkpoints use new assertions; unaffected form/API results keep the baseline.
  const changed = new Set(["preview-reverse-completion", "preview-completes-after-removal", "analysis-loading-guard-and-file-switch", "analysis-old-file-response", "analysis-current-file-response", "shared-unmount-ignores-rejection"]);
  const pipeline = ["location-failure-starts-raw-address-crime", "crime-prefecture-fallback", "commute-missing-walk-guard", "commute-request-and-loading-guard", "commute-not-found", "commute-success", "share-title-and-loading-guard", "share-clipboard-failure", "share-clipboard-success", "pdf-lazy-export-and-loading-guard", "pdf-download-success", "pdf-render-failure"];
  for (const [name, value] of Object.entries(snapshots)) {
    if (changed.has(name)) continue;
    if (pipeline.includes(name)) {
      // A's ignored request adds different events; compare B's published state
      // and request payloads against the same successful historical report.
      const actual = checkpoint(name);
      const old = expected.snapshots[name];
      // Refresh now clears the previous crime result even if its replacement
      // fails. Preserve other historical contracts and assert this correction.
      const refreshed = pipeline.indexOf(name) >= pipeline.indexOf("commute-request-and-loading-guard");
      assert.deepEqual(actual.state, refreshed ? { ...old.state, prefectureSafety: null } : old.state, name + " state");
      // 同一次修正也讓 PDF 匯出的 payload 帶上 safety；治安結果被清掉時它是 null。
      // 歷史 fixture 產生於此欄位存在之前，因此比對前先移除，與上面 state 的處理一致。
      assert.deepEqual(withoutOriginBus(withoutSafety(withoutStationLines(withoutSharedCommute(actual.pending)))), old.pending, name + " requests");
    } else assert.deepEqual(withoutOriginBus(withoutStationLines(withoutSharedCommute(value))), expected.snapshots[name], name);
  }

  // 上面把「沒有巴士」的預設值剝掉才能比對歷史 fixture，因此這裡必須確認該欄位
  // 真的有送出——否則哪天請求整個不帶巴士欄位，剝離會無聲通過，等於守護消失。
  assert.ok(busCommutePayloads.length > 0, "commute 請求必須帶上 originBusMinutes／originBusStop");
  for (const payload of busCommutePayloads) {
    assert.deepEqual(payload, { originBusMinutes: 0, originBusStop: null },
      "無巴士路線時，originBusMinutes 應為 0 且 originBusStop 為 null");
  }

  // stationLines 必須真的送出且與 stations 等長，否則後端無法區分同名站的不同路線。
  assert.ok(locationRequests.length > 0, "location context 請求必須帶上 stationLines");
  for (const lines of locationRequests) {
    assert.ok(Array.isArray(lines), "stationLines 應為陣列");
    assert.ok((lines as unknown[]).every(line => typeof line === "string"),
      "stationLines 每一項都應為字串（無路線時為空字串）");
  }
  assert.deepEqual(checkpoint("analysis-current-file-response").state.result, analysis);
  assert.equal(checkpoint("shared-unmount-ignores-rejection").state.result, null);
  // Completing the JPEG preview must leave the original PDF available to the viewer.
  await run('await h.mount("listing"); await h.file("lifecycle.pdf", "application/pdf");');
  const originalPdfUrl = await run('return h.snapshot().state.previewUrl;');
  await run('await h.settle("preview", {blobUrl:"blob:lifecycle-thumbnail", aspect:1.4});');
  assert.equal(await run(`return h.events.some(e => e.revokeUrl === ${JSON.stringify(originalPdfUrl)});`), false, "PDF remains live after thumbnail completion");
  await run('await h.call("removeFile");');
  assert.equal(await run(`return h.events.some(e => e.revokeUrl === ${JSON.stringify(originalPdfUrl)});`), true, "Removed PDF is released");
  assert.equal(await run('return h.events.some(e => e.revokeUrl === "blob:lifecycle-thumbnail");'), true, "Removed thumbnail is released");

  // 1. 分享連結必須帶上當前已計算出的門到門通勤結果
  assert.ok(sharedCommutePayloads.length > 0, "分享請求必須包含通勤 payload");
  const firstSharePayload = sharedCommutePayloads[0] as { commute: unknown; commuteDestination: string };
  assert.deepEqual(firstSharePayload.commute, { totalMinutes: 25, transfers: 1 }, "分享時應帶上最新算出的通勤結果");
  assert.equal(firstSharePayload.commuteDestination, "東京駅", "分享時應帶上通勤目的地原文");

  // 2. 讀取分享連結時，若後端有存通勤資料，必須正確還原進 state
  await run(`await h.mount("listing", "COMMUTESHARE"); await h.settle("readShare", {title:"測試",expiresAt:"2026-09-30",result:${JSON.stringify(analysis)},commute:{totalMinutes:18,transfers:0,destinationStation:"新宿"},commuteDestination:"新宿駅"});`);
  assert.deepEqual(await run('return h.value("commute");'), { totalMinutes: 18, transfers: 0, destinationStation: "新宿" }, "分享頁掛載後應還原通勤試算結果");
  assert.equal(await run('return h.value("commuteDestination");'), "新宿駅", "分享頁掛載後應還原通勤目的地輸入值");

  // 3. 計算機：全室翻新 (renovated) 與 10 年內新成屋 (age_within_5y / age_within_10y) 防呆互斥
  await run('await h.mount("calculator"); await h.call("toggleModifier", "renovated");');
  assert.deepEqual(await run('return h.value("calcModifiers");'), ["renovated"], "可單獨勾選全室翻新");
  // 勾選 5 年內新房 → 翻新應被自動互斥移除
  await run('await h.call("toggleModifier", "age_within_5y");');
  assert.deepEqual(await run('return h.value("calcModifiers");'), ["age_within_5y"], "勾選 5 年內新房應自動移除全室翻新");
  // 勾選全室翻新 → 5 年內新房應被自動互斥移除
  await run('await h.call("toggleModifier", "renovated");');
  assert.deepEqual(await run('return h.value("calcModifiers");'), ["renovated"], "再次勾選全室翻新應自動移除新屋條件");
  // 透過導引屋齡選單選「10 年內」→ 翻新應被自動清除
  await run('await h.call("selectGuidedAge", 10);');
  assert.deepEqual(await run('return h.value("calcModifiers");'), ["age_within_10y"], "導引屋齡選 10 年內應自動清除全室翻新");
  assert.equal(await run('return h.value("guidedAgeMax");'), 10);
  // 勾選全室翻新 → 屋齡選單的 10 年內上限應被還原（歸 0）
  await run('await h.call("toggleModifier", "renovated");');
  assert.deepEqual(await run('return h.value("calcModifiers");'), ["renovated"], "勾選全室翻新應清除 age_within_10y");
  assert.equal(await run('return h.value("guidedAgeMax");'), 0, "勾選全室翻新應將導引屋齡重設為不限");

  console.log("Controller flows: historical non-race contracts and corrected stale-response assertions passed.");

} finally {
  await browser.close();
}
