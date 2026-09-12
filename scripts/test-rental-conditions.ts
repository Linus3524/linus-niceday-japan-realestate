import assert from "node:assert/strict";
import { normalizeRoomType } from "../src/lib/listingExtraction.js";
import { calculateInitialCostBreakdown } from "../api/analyze-listing.js";
import { additionalRentalFees } from "../src/lib/rentalConditions.js";
import { rentalConditionGroups } from "../src/lib/rentalConditionDisplay.js";
import { reconcileRentalListingText } from "../src/lib/rentalListingReconciliation.js";

const conditions = "普通賃貸借1年契約（更新型）。1、2回目の更新時5％の賃料改定あり。更新料は1回のみ。室内抗菌処理代17,600円 事務手数料11,000円。ペット可：敷金2ヶ月。地下駐輪場：登録料5,500円。";
const costs = calculateInitialCostBreakdown({ rent: 179000, managementFee: 20000, deposit: 0, keyMoney: 0, extractedDeposit: "0ヶ月", extractedKeyMoney: "0ヶ月", extractedGuaranteeFee: "家賃総額50％～、エポス年次保証料2万円", extractedSupportFee: "24Hサポート料22,000円/1年", extractedLockReplacementFee: "22,000円", extractedInsuranceFee: "別途費用", rentalConditions: conditions, specialNotes: conditions });
assert.equal(costs.items.find(i => i.id === "antibacterialFee")?.amount, 17600);
assert.equal(costs.items.find(i => i.id === "administrationFee")?.amount, 11000);
assert.equal(costs.items.filter(i => i.id === "administrationFee").length, 1, "重複原文不可重複加計");
assert.equal(costs.items.find(i => i.id === "supportFee")?.amount, 22000);
assert.equal(costs.items.find(i => i.id === "guaranteeFee")?.amount, 99500);
assert.match(costs.items.find(i => i.id === "brokerageFee")!.note, /1 個月租金加消費稅/);
assert.doesNotMatch(costs.items.find(i => i.id === "brokerageFee")!.note, /0\.5 個月/);
assert.equal(costs.items.find(i => i.id === "deposit")?.amount, 0, "養寵條件不直接加進無寵物試算");
assert.equal(costs.totalMin, 632000);
assert.equal(costs.totalMax, 731500);
const unknown = calculateInitialCostBreakdown({ rent: 179000, managementFee: 20000, deposit: null, keyMoney: null, extractedDeposit: "", extractedKeyMoney: "" });
assert.equal(unknown.items.find(i => i.id === "deposit")?.isUnknown, true);
assert.equal(unknown.items.find(i => i.id === "keyMoney")?.isUnknown, true);
assert.doesNotMatch(unknown.items.find(i => i.id === "deposit")!.note, /^免押金/);
const explicitZero = calculateInitialCostBreakdown({
  rent: 179000,
  managementFee: 20000,
  deposit: null,
  keyMoney: null,
  extractedDeposit: "",
  extractedKeyMoney: "",
  rentalConditions: "契約条件：敷金0ヶ月礼金0ヶ月",
});
assert.equal(explicitZero.items.find(i => i.id === "deposit")?.amount, 0);
assert.equal(explicitZero.items.find(i => i.id === "deposit")?.isUnknown, false);
assert.match(explicitZero.items.find(i => i.id === "deposit")!.note, /^免押金/);
assert.equal(explicitZero.items.find(i => i.id === "keyMoney")?.amount, 0);
assert.equal(explicitZero.items.find(i => i.id === "keyMoney")?.isUnknown, false);
assert.match(explicitZero.items.find(i => i.id === "keyMoney")!.note, /^免禮金/);
assert.doesNotMatch(explicitZero.tips.join("\n"), /費用待確認.*押金|費用待確認.*禮金/);
assert.match(explicitZero.tips.join("\n"), /免禮金免押金/);
assert.equal(additionalRentalFees("更新事務手数料11,000円、駐輪場登録料5,500円").length, 0, "更新費與選配不可當簽約一次性費用");
assert.equal(additionalRentalFees("室内抗菌処理代１７，６００円　事務手数料１１，０００円").length, 2);
assert.equal(additionalRentalFees("事務手数料：未定").length, 0);
assert.equal(additionalRentalFees("更新時 事務手数料11,000円").length, 0);
assert.equal(additionalRentalFees("事務手数料11,000円/年").length, 0);
const displayed = rentalConditionGroups(
  "普通賃貸借1年契約（更新型）。1、2回目の更新時5％の賃料改定あり。更新料は1回のみ。入居日：2026年10月14日。敷金0・礼金0キャンペーン中（キャンペーンは9月末日迄の成約となります）。ペット可：小型犬・猫1匹迄敷金2ヶ月預かり。M保証システム利用料（家賃総額の50%〜）↑エポス保証にて成約となった場合、年次保証料2万円。24Hサポート料22,000円/1年。鍵交換代22,000円。室内抗菌処理代17,600円。事務手数料11,000円。当社指定賃貸入居者総合保険加入の事（別途費用）。※退去時清掃費用、更新時更新費用等がございます。■地平面より下がる住居が一部ございます。",
  "バイク置き場（5,500円/月）※要確認、地下駐輪場：登録料5,500円（サイズ制限有）",
);
const visibleConditions = displayed.flatMap(group => group.items).join("\n");
assert.match(visibleConditions, /普通租賃契約，租期 1 年/);
assert.match(visibleConditions, /第 1、2 次續約時，租金調整 5%/);
assert.match(visibleConditions, /免押金、免禮金/);
assert.match(visibleConditions, /可入住日：2026年10月14日/);
assert.match(visibleConditions, /可養寵物：小型犬或貓限 1 隻/);
assert.match(visibleConditions, /室內抗菌處理費：17,600円/);
assert.match(visibleConditions, /地下自行車停車場：登錄費 5,500円/);
assert.match(displayed.find(group => group.id === "moveIn")?.items.join("\n") || "", /可養寵物/, "養寵物的追加押金應放在入住條件內");
assert.doesNotMatch(visibleConditions, /[\u3040-\u30ff]/, "使用者端不可直接顯示日文假名特約");

const excelanLayoutText = `
エクセラン東武練馬 ■ACCESS
東武東上線 東武練馬駅 徒歩6分
都営三田線 西台駅 徒歩28分
東京メトロ副都心線 平和台駅 徒歩30分
賃料 127,000円 301号室 管理費 4,000円
敷金 0ヶ月 礼金 1ヶ月
間取り 1K タイプ 専有面積 37.34㎡
入居日 即 内見 可
「木下の賃貸」友の会費 3,190円（税込）/月額
所在地 東京都板橋区徳丸2-18-36 構造 木造 規模 3階建3階
竣工日 2025年02月 総戸数 14戸
駐車場 施設無 空き無 駐輪場 施設無 空き無 ペット飼育不可
インターネット月額基本使用料無料（iのぞみネット）
契約期間 2年 更新料 新賃料1.25ヶ月 解約予告1ヶ月前 に当社宛に通知
鍵交換代27,500円（税込） 消毒代26,400円（税込） 定額ルームクリーニング代74,800円（税込）
木下グループ保証：初回保証料80%、利用手数料月額550円（税込）、継続保証委託料20,000円（2年毎）
木下の賃貸友の会加入必須。入居者補償制度（火災保険）、住まいのトラブル緊急サポート等のサービスを提供。
12ヵ月未満の解約時、賃料1ヵ月分の違約金が御座います。
CATV、BS・CS110°、インターネット等には別途契約、費用がかかります。
実入居者様が61歳以上の場合、弊社指定の見守りサービスへのご加入が必須となります。
取引態様：代理 広告料100%
`;
const excelan = reconcileRentalListingText({
  dealType: "rent",
  rentalConditions: "費用がかかります",
  optionalFacilities: "",
  specialNotes: "パレットガス推奨",
}, excelanLayoutText);
assert.equal(excelan.rent, "127,000円");
assert.equal(excelan.managementFee, "4,000円");
assert.equal(excelan.deposit, "0ヶ月");
assert.equal(excelan.keyMoney, "1ヶ月");
assert.equal(excelan.renewalFee, "新賃料1.25ヶ月");
assert.equal(excelan.lockReplacementFee, "27,500円");
assert.equal(excelan.cleaningFee, "74,800円");
assert.match(excelan.guaranteeFee || "", /初回80%/);
assert.match(excelan.cancellationPenalty || "", /12ヵ月未満/);
assert.match(excelan.optionalFacilities || "", /駐車場：施設なし・空きなし/);
assert.doesNotMatch(excelan.optionalFacilities || "", /0円|無料/);
assert.doesNotMatch(`${excelan.rentalConditions}\n${excelan.specialNotes}`, /取引態様|広告料/);
const excelanGroups = rentalConditionGroups(excelan.rentalConditions, excelan.optionalFacilities);
const excelanVisible = excelanGroups.flatMap(group => group.items).join("\n");
assert.match(excelanVisible, /普通租賃契約，租期 2 年/);
assert.match(excelanVisible, /續約費：新租金 1.25 個月/);
assert.match(excelanVisible, /木下集團保證：初回費為月租總額 80%/);
assert.match(excelanVisible, /換鎖費：27,500円/);
assert.match(excelanVisible, /室內消毒費：26,400円/);
assert.match(excelanVisible, /定額室內清潔費：74,800円/);
assert.match(excelanVisible, /未滿 12 個月解約/);
assert.doesNotMatch(excelanVisible, /[\u3040-\u30ff]/, "東武練馬圖紙的契約卡不可直接顯示日文假名");
assert.equal(additionalRentalFees(excelan.rentalConditions).find(item => item.id === "disinfectionFee")?.amount, 26400);
assert.doesNotMatch(excelan.optionalFacilities || "", /ペット|寵物/, "寵物條件不可在選配設施重複出現");
const excelanCosts = calculateInitialCostBreakdown({
  rent: 127000,
  managementFee: 4000,
  deposit: 0,
  keyMoney: 127000,
  extractedDeposit: excelan.deposit || "",
  extractedKeyMoney: excelan.keyMoney || "",
  extractedGuaranteeFee: excelan.guaranteeFee,
  extractedLockReplacementFee: excelan.lockReplacementFee,
  extractedCleaningFee: excelan.cleaningFee,
  extractedInsuranceFee: excelan.insuranceFee,
  extractedSupportFee: excelan.supportFee,
  rentalConditions: excelan.rentalConditions,
  specialNotes: excelan.specialNotes,
});
assert.equal(excelanCosts.items.find(item => item.id === "insuranceFee")?.amount, 0, "友之會已含火災保險，不可再暫估一筆保費");
assert.equal(excelanCosts.items.find(item => item.id === "guaranteeFee")?.amount, 104800);
assert.equal(excelanCosts.items.find(item => item.id === "cleaningFee")?.amount, 74800);
assert.equal(excelanCosts.items.find(item => item.id === "disinfectionFee")?.amount, 26400);
assert.equal(excelanCosts.items.find(item => item.id === "supportFee")?.amount, 3190);
console.log("Rental PDF conditions: additional fees, annual/optional exclusions and totals passed.");


// A flyer may label its header 1DK while its explicit room breakdown says 1LDK.
const layoutCase = { dealType: "rent", layout: "1DK", specialNotes: "既有契約注意事項" };
const roomDetail = "間取り 1DK\nLDK(10.3畳) 洋室(6.4畳)\n間取詳細\n構造 鉄筋コンクリート";
const correctedLayout = reconcileRentalListingText(layoutCase, roomDetail);
assert.equal(correctedLayout.layout, "1LDK");
assert.match(correctedLayout.specialNotes!, /既有契約注意事項/);
assert.match(correctedLayout.specialNotes!, /總格局為 1DK.*行情比較依詳細格局採 1LDK/);
assert.equal(layoutCase.layout, "1DK", "do not mutate the original extraction");
assert.equal(reconcileRentalListingText(correctedLayout, roomDetail).specialNotes, correctedLayout.specialNotes, "idempotent reconciliation");
for (const detail of ["LDK", "LDK(10.3畳)", "DK(10.3畳) 洋室(6.4畳)", "LDK(10.3畳) 洋室(6.4畳) 洋室(5畳)", "LDK(10.3畳) 洋室(6.4畳) 和室", "LDK(10.3畳) 洋室(6.4畳) 納戸(3畳)"]) {
  assert.equal(reconcileRentalListingText(layoutCase, `間取詳細 ${detail}`).layout, "1DK", `do not infer from incomplete/conflicting detail: ${detail}`);
}
assert.equal(reconcileRentalListingText(layoutCase, "備考：LDK(10.3畳) 洋室(6.4畳)").layout, "1DK", "unlabelled prose is not a breakdown");
assert.equal(reconcileRentalListingText(layoutCase, "間取詳細 ＬＤＫ（１０．３帖）＋洋室（６．４帖）").layout, "1LDK");
assert.equal(reconcileRentalListingText({ ...layoutCase, layout: "2DK" }, "間取詳細 LDK(12畳) 洋室(6畳) 和室(5畳)").layout, "2LDK");

assert.equal(normalizeRoomType(correctedLayout.layout), "ldk1", "corrected layout must use 1LDK market group, never k1");
