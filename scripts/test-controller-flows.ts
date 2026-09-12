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
      assert.deepEqual(actual.state, old.state, name + " state");
      assert.deepEqual(actual.pending, old.pending, name + " requests");
    } else assert.deepEqual(value, expected.snapshots[name], name);
  }
  assert.deepEqual(checkpoint("analysis-current-file-response").state.result, analysis);
  assert.equal(checkpoint("shared-unmount-ignores-rejection").state.result, null);
  console.log("Controller flows: historical non-race contracts and corrected stale-response assertions passed.");

} finally {
  await browser.close();
}
