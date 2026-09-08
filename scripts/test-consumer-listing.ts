import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { consumerListingText } from "../src/lib/consumerListingText.js";
import { ListingAuditPanel } from "../src/components/ListingAuditPanel.js";
import { SpecialSaleReport } from "../src/components/SpecialSaleReport.js";
const source = "取引態様：売主、手数料：3%（税込）、ネット掲載：不可、定休日：水曜日・日曜日。現況渡し、契約不適合責任免責。";
assert.equal(consumerListingText(source), "現況渡し。契約不適合責任免責");
const fees = "室内抗菌処理代17,600円、事務手数料11,000円、更新事務手数料5,500円。";
assert.equal(consumerListingText(fees), fees, "租客費用與原文標點保留");
assert.doesNotMatch(consumerListingText("AD 100%、広告掲載不可。ペット可"), /AD|広告/);
const html = renderToStaticMarkup(createElement(SpecialSaleReport, { fields: { propertyType: "一棟", specialNotes: source, handoverDetails: source, area: "136.17㎡", hospitalityDetails: "1F旅館業許可取得済", annualIncome: "3,780,000円", salePrice: "8980万円", revenueScope: "101号室" } }));
assert.doesNotMatch(html, /取引態様|手数料|ネット掲載|定休日|圖紙補充條件與交屋原文/);
assert.match(html, /契約不適合責任免責/);
assert.match(html, /營業收入與投報率/);
assert.match(html, /3,780,000/);
const revenueHtml = renderToStaticMarkup(createElement(SpecialSaleReport, { fields: {
  propertyType: "一棟",
  salePrice: "8190万円",
  revenueScope: "一棟全体",
  revenueDetails: "◎民泊の売上高：3.5万円×180日＝6,300,000円 ◎マンスリー3ヶ月売上高35万円×3 1,050,000円 ◎年間売上高：7,350,000円 利回り：8.97%",
} }));
assert.match(revenueHtml, /民泊營收/);
assert.match(revenueHtml, /月租 3 個月營收/);
assert.match(revenueHtml, /年營收/);
assert.match(revenueHtml, /投報率/);
assert.match(revenueHtml, /收益範圍[\s\S]*整棟/);
assert.doesNotMatch(revenueHtml, /マンスリー|売上高|利回り|一棟全体/);
const audit = { version: 1 as const, entries: [], issues: [{ code: "missing-station", severity: "missing" as const, message: "內部缺項" }], blocksComparison: false };
assert.equal(renderToStaticMarkup(createElement(ListingAuditPanel, { audit })), "");
const warning = renderToStaticMarkup(createElement(ListingAuditPanel, { audit: { ...audit, blocksComparison: true, issues: [{ code: "buildingArea-unit-conflict", severity: "conflict", message: "internal" }] } }));
assert.match(warning, /平方米與坪數記載不一致/);
assert.doesNotMatch(warning, /internal|辨識來源|修正前|核對清單/);
console.log("Consumer reports: internal metadata hidden, tenant fees preserved, contextual warnings and shared layout passed.");
