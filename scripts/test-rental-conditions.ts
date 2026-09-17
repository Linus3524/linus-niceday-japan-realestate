import assert from "node:assert/strict";
import { normalizeRoomType, detectUnitFeatures, parseMonthsOrYen, isFreeOrZero, formatShikibiki, normalizeMonthUnit, parseYenAmount } from "../src/lib/listingExtraction.js";
import { parseAndExplainSpecialNotes } from "../src/lib/specialNotesParser.js";
import { formatDirection } from "../src/lib/listing/formatters.js";
import { calculateInitialCostBreakdown } from "../api/analyze-listing.js";
import { additionalRentalFees } from "../src/lib/rentalConditions.js";
import { rentalConditionGroups, buildRentalConditionSections, stripOrphanedBrackets } from "../src/lib/rentalConditionDisplay.js";
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
assert.match(visibleConditions, /第 1、2 次契約更新時，租金調整 5%/);
assert.match(visibleConditions, /免押金、免禮金/);
assert.match(visibleConditions, /可入住日：2026年10月14日/);
assert.match(visibleConditions, /可養寵物：小型犬或貓限 1 隻/);
assert.match(visibleConditions, /室內抗菌處理費：17,600円/);
assert.match(visibleConditions, /地下自行車停車場：登錄費 5,500円/);
assert.doesNotMatch(visibleConditions, /[\u3040-\u30ff]/, "使用者端不可直接顯示日文假名特約");

const moveOutSections = buildRentalConditionSections({ rentalConditions: "解約予告50日前。退去時請求)" });
const moveOutItems = moveOutSections.find(s => s.title === "退租與違約")?.rows.find(r => r.title === "退租與提前解約")?.items || [];
assert.deepEqual(moveOutItems, ["退租須於 50 日前通知", "退去時請求"]);
assert.equal(stripOrphanedBrackets("退去時請求)"), "退去時請求");
assert.equal(stripOrphanedBrackets("（退去時請求）"), "退去時請求");
assert.equal(stripOrphanedBrackets("(退去時請求)"), "退去時請求");

// 測試：定期借家 + 更新料 - + 入居時期 2026年11月中旬予定 的拆分與 Option A 解析
const ryogokuSections = buildRentalConditionSections({
  rentalConditions: "定期借家契約 2年、更新料 -、入居時期 2026年11月中旬予定",
  guaranteeFee: "必須　家賃総額より50％～",
  insuranceFee: "有 22,200円 24ヶ月",
  specialNotes: "その他費用 AMLクラブサポート費用（契約時請求）：16,500円",
  totalMonthlyCost: 200000,
});
const contractSection = ryogokuSections.find(s => s.title === "契約與入住");
assert.ok(contractSection, "必須包含「契約與入住」大分類");
const leaseRow = contractSection.rows.find(r => r.title === "租期與契約更新");
assert.ok(leaseRow, "必須包含「租期與契約更新」");
assert.match(leaseRow.items.join("\n"), /定期借家契約 2 年/);
assert.match(leaseRow.items.join("\n"), /定期借家契約期滿確定終止，無自動更新；若期滿雙方合意辦理「再契約」，手續費待向管理公司確認（圖紙標示 -）/);
assert.doesNotMatch(leaseRow.items.join("\n"), /續約費\s*-/);

const moveInRow = contractSection.rows.find(r => r.title === "入住與優惠");
assert.ok(moveInRow, "必須包含「入住與優惠」");
assert.match(moveInRow.items.join("\n"), /2026年11月中旬/);
assert.doesNotMatch(moveInRow.items.join("\n"), /圖紙未載明入住日或優惠條件/);

const feeSection = ryogokuSections.find(s => s.title === "保證、保險與附加費用");
assert.ok(feeSection, "必須包含「保證、保險與附加費用」");
const guaranteeRow = feeSection.rows.find(r => r.title === "保證料與火災保險");
assert.ok(guaranteeRow, "必須包含「保證料與火災保險」");
assert.match(guaranteeRow.items.join("\n"), /50％ 起/);
assert.match(guaranteeRow.items.join("\n"), /約 100,000円/);
assert.match(guaranteeRow.items.join("\n"), /火災保險：須投保，22,200円/);
assert.doesNotMatch(guaranteeRow.items.join("\n"), /圖紙未載明保證公司方案/);

const addFeeRow = feeSection.rows.find(r => r.title === "附加費用與服務");
assert.ok(addFeeRow, "必須包含「附加費用與服務」");
assert.match(addFeeRow.items.join("\n"), /AML/);
assert.doesNotMatch(addFeeRow.items.join("\n"), /圖紙未載明其他一次性或年度費用/, "有其他費用時不可自相矛盾出現未載明警語");

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
// 月數單位統一由 normalizeMonthUnit 正規化成「ヶ」，回補結果一律是 ヶ月（原圖寫 ヵ月）。
assert.match(excelan.cancellationPenalty || "", /12ヶ月未満/);
assert.match(excelan.optionalFacilities || "", /駐車場：施設なし・空きなし/);
assert.doesNotMatch(excelan.optionalFacilities || "", /0円|無料/);
assert.doesNotMatch(`${excelan.rentalConditions}\n${excelan.specialNotes}`, /取引態樣|取引態様|広告料/);
const excelanGroups = rentalConditionGroups(excelan.rentalConditions, excelan.optionalFacilities);
const excelanVisible = excelanGroups.flatMap(group => group.items).join("\n");
assert.match(excelanVisible, /普通租賃契約，租期 2 年/);
assert.match(excelanVisible, /契約更新費：新租金 1.25 個月/);
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

// 採光面朝向（向き）驗證
assert.equal(formatDirection("南"), "南向");
assert.equal(formatDirection("南向き"), "南向");
assert.equal(formatDirection("南東"), "東南向");
assert.equal(formatDirection("東南向き"), "東南向");
assert.equal(formatDirection("南西"), "西南向");
assert.equal(formatDirection("北東"), "東北向");
assert.equal(formatDirection("北西"), "西北向");
assert.equal(formatDirection("東"), "東向");
assert.equal(formatDirection("西"), "西向");
assert.equal(formatDirection("北"), "北向");
assert.equal(formatDirection("-"), "圖面標示 -（未載明）");
assert.equal(formatDirection("ー"), "圖面標示 -（未載明）");
assert.equal(formatDirection("なし"), "圖面標示 -（未載明）");
assert.equal(formatDirection(""), "");
assert.equal(formatDirection("北東（依間取り圖方位記號推算）"), "東北向（依平面圖方位記號推算）");
assert.equal(formatDirection("東北（依平面圖推算）"), "東北向（依平面圖方位記號推算）");
assert.equal(formatDirection("南（依間取り図方位記号推算）"), "南向（依平面圖方位記號推算）");

assert.equal(detectUnitFeatures({ direction: "南" }).facingDirectionZh, "南向");
assert.equal(detectUnitFeatures({ direction: "南東向き" }).facingDirectionZh, "東南向");
assert.equal(detectUnitFeatures({ direction: "北東（依間取り圖方位記號推算）" }).facingDirectionZh, "東北向");
assert.equal(detectUnitFeatures({ specialNotes: "バルコニー南向き日当たり良好" }).facingDirectionZh, "南向");

const dirCase = reconcileRentalListingText({ dealType: "rent" }, "向き 南\n賃料120,000円");
assert.equal(dirCase.direction, "南");
console.log("Direction formatting and reconciliation tests passed.");

// 交通路線與多站點全面防漏測試
import { parseTransitStations } from "../src/lib/transitParser.js";

const multiRouteTransit = "都営大江戸線 両国 徒歩1分\n中央・総武線各停 両国 徒歩6分";
const parsedStations = parseTransitStations(multiRouteTransit, "両国,両国", "1,6");
assert.equal(parsedStations.length, 2, "同一車站不同路線必須保留為 2 個獨立卡片");
assert.equal(parsedStations[0].stationName, "両国");
assert.equal(parsedStations[0].lineName, "都営大江戸線");
assert.equal(parsedStations[0].walkMin, 1);
assert.equal(parsedStations[1].stationName, "両国");
assert.equal(parsedStations[1].lineName, "中央・総武線各停");
assert.equal(parsedStations[1].walkMin, 6);

const bracketTransit = "中央・総武線各停「両国」駅 徒歩6分\n都営大江戸線「両国」駅徒歩1分";
const parsedBracket = parseTransitStations(bracketTransit);
assert.equal(parsedBracket.length, 2);
assert.equal(parsedBracket[0].lineName, "中央・総武線各停");
assert.equal(parsedBracket[0].walkMin, 6);
assert.equal(parsedBracket[1].lineName, "都営大江戸線");
assert.equal(parsedBracket[1].walkMin, 1);

const reconciledTransitCase = reconcileRentalListingText({ dealType: "rent" }, "交通 都営大江戸線 両国 徒歩1分\n中央・総武線各停 両国 徒歩6分\n賃料 172,000円");
assert.equal(reconciledTransitCase.station, "両国,両国");
assert.equal(reconciledTransitCase.walkTime, "1,6");
assert.match(reconciledTransitCase.transitAccess!, /都営大江戸線 両国駅 徒歩1分/);
assert.match(reconciledTransitCase.transitAccess!, /中央・総武線各停 両国駅 徒歩6分/);
console.log("Multi-route transit parsing and reconciliation tests passed.");

// 月數單位回歸測試：ヶ(U+30F6)／ヵ(U+30F5)／ケ(U+30B1)／カ(U+30AB)／か(U+304B)／個。
// 日本図面與契約書寫「一個月」的字形各家不同，碼位卻互不相等。先前各處的月數比對
// 只列了 ヶ／ヵ／カ／個，導致 parseMonthsOrYen("1ケ月", 45000) 回 null——礼金整整
// 一個月租金沒被算進初期費用。平假名「1か月」是官方公文與報紙的標準寫法，
// 實測「アデニウム東神田」圖紙的備考欄就寫著「法人で保証会社加入無しの場合、敷金1か月」。
for (const unit of ["ヶ", "ヵ", "カ", "個", "ケ", "か"]) {
  assert.equal(parseMonthsOrYen(`1${unit}月`, 45000), 45000, `1${unit}月 應換算為一個月租金`);
  assert.equal(parseMonthsOrYen(`0.5${unit}月`, 45000), 22500, `0.5${unit}月 應換算為半個月租金`);
  assert.equal(isFreeOrZero(`0${unit}月`), true, `0${unit}月 應判為免收`);
  assert.equal(isFreeOrZero(`1${unit}月`), false, `1${unit}月 不可判為免收`);
  assert.match(formatShikibiki(`敷引1${unit}月`), /1 個月（退租固定扣抵）/, `敷引1${unit}月 應格式化為中文`);
}
// 單位字元不接「月」時不可被改寫，否則會傷到正常詞彙（ケーキ、ケア、赤坂、明かり）。
assert.equal(normalizeMonthUnit("ケーキ工房"), "ケーキ工房", "非月數的ケ不可被改寫");
assert.equal(normalizeMonthUnit("赤坂山王"), "赤坂山王", "非月數的カ不可被改寫");
assert.equal(normalizeMonthUnit("明かり取り"), "明かり取り", "非月數的か不可被改寫");
assert.equal(normalizeMonthUnit("1ケ月"), "1ヶ月");
assert.equal(normalizeMonthUnit("1か月"), "1ヶ月");

// 真實圖紙字串：「アデニウム東神田」備考欄的法人條件用的是平假名「か月」。
assert.equal(
  normalizeMonthUnit("法人で保証会社加入無しの場合、敷金1か月"),
  "法人で保証会社加入無しの場合、敷金1ヶ月",
  "圖紙實寫的「敷金1か月」須正規化後才能被下游月數比對讀到",
);

// 各種單位寫法在三條下游管線都要與「ヶ月」等價。
for (const unit of ["ヶ", "ケ", "か"]) {
  const shikibikiCost = calculateInitialCostBreakdown({
    rent: 45000, managementFee: 3000, deposit: 45000, keyMoney: 0,
    extractedDeposit: "45,000円", extractedKeyMoney: "", extractedShikibiki: `敷引1${unit}月`,
  });
  assert.match(shikibikiCost.items.find(i => i.id === "deposit")!.note, /1 個月（退租固定扣抵）/,
    `初期費用應認得敷引1${unit}月`);

  const translated = rentalConditionGroups(`更新料1${unit}月`).flatMap(g => g.items).join(" / ");
  assert.match(translated, /個月/, `更新料1${unit}月 應翻成中文`);
  assert.doesNotMatch(translated, new RegExp(`${unit}月`), `更新料1${unit}月 不應殘留日文單位`);

  assert.ok(
    parseAndExplainSpecialNotes(`ペット飼育時敷金1${unit}月`).some(i => i.title === "寵物加收押金約定"),
    `備考特約應認得ペット敷金1${unit}月`,
  );
}
console.log("Month-unit (ヶ/ヵ/ケ/カ/か/個 月) normalization tests passed.");

// 小數點金額回歸測試。
//
// 管理系統匯出的図面會把金額印成「92000.00円」——「武蔵台コーポ203」的礼金欄
// 就是這樣（版面文字實測：「敷金/礼金　無 / 92000.00円」）。
// 舊的 `(\d{2,10})\s*円` 會從小數點後重新配到「00」而算出 0，整筆被當成解析失敗：
// 圖紙明明載明 92,000 円礼金，報告卻顯示「未載明」且完全不計入初期費用試算。
assert.equal(parseYenAmount("92000.00円"), 92000, "小數點金額須完整解析");
assert.equal(parseYenAmount("92000.00"), 92000, "無單位的小數點金額亦同");
assert.equal(parseMonthsOrYen("92000.00円", 92000), 92000, "礼金欄的小數點金額須換算");
// 既有行為不得退化：萬円、千分位、百分比與過小的數字。
assert.equal(parseYenAmount("11.4万円"), 114000, "萬円的小數仍按萬計");
assert.equal(parseYenAmount("92,000円"), 92000);
assert.equal(parseYenAmount("50%"), null, "百分比不是金額");
assert.equal(parseYenAmount("70"), null, "無單位的小額數字不可當成金額");
assert.equal(parseYenAmount("0.00円"), null, "0 円視為未取得金額，交由 isFreeOrZero 判免收");
{
  // 端到端：礼金 92000.00円 必須計入初期費用，而不是標成待確認。
  const cost = calculateInitialCostBreakdown({
    rent: 92000, managementFee: 3000, deposit: 0, keyMoney: 92000,
    extractedDeposit: "無", extractedKeyMoney: "92000.00円",
  });
  const keyMoney = cost.items.find(i => i.id === "keyMoney")!;
  assert.equal(keyMoney.amount, 92000, "小數點寫法的礼金須計入初期費用");
  assert.notEqual(keyMoney.isUnknown, true, "載明金額的礼金不可標成未確認");
}
console.log("Decimal yen amounts (92000.00円) parsing tests passed.");

// 更新料／再契約料的實際寫法回歸測試。
//
// 這些字串全部取自真實圖紙的版面文字。翻譯規則配不到時，整條會退化成
// 「圖紙另有個別日文特約…」這種等於沒說的提示——續約要付一個月租金這件事
// 就完全不會出現在報告裡。更新料在系統內始終是字串、不進任何試算，
// 因此顯示層配不到就是唯一的失效點，必須逐種寫法守住。
{
  const renderedOf = (text: string) => rentalConditionGroups(text).flatMap(g => g.items).join(" ｜ ");
  const fallback = /圖紙另有個別日文特約/;

  // ルージュ駒場401：更新料と更新事務手数料の併記。
  assert.match(renderedOf("更新料 新賃料1ヶ月分 更新事務手数料10,000円(税別)"), /契約更新費：新租金 1 個月/);
  // パークアクシス北千束206 / Ｃａｓａ－Ａｉｌｅ603（三井系）：「の」と「分相当額」付き。
  // 「の」を許さない規則だったため、以前はこの書き方が丸ごとフォールバックしていた。
  const mitsui = renderedOf("契約期間 2年 更新料 新賃料の1ヶ月分相当額");
  assert.match(mitsui, /契約更新費：新租金 1 個月/);
  assert.doesNotMatch(mitsui, fallback);
  // プレール・ドゥーク下北沢211：表格のセル分割で数値と単位の間に空白が入る。
  assert.match(renderedOf("更新料 新賃料 1.25 ヶ月"), /契約更新費：新租金 1\.25 個月/);
  // 武蔵台コーポ203：金額表記。
  assert.match(renderedOf("更新料 92000円"), /契約更新費：92000円/);

  // 定期借家は「更新料」ではなく「再契約料」と書く（XEBEC大手町201 など）。
  // 借主にとっては同じ「住み続けるなら払う金」なので、必ず訳して見せる。
  for (const raw of ["再契約料 新賃料の1ヶ月", "定期借家 2年 再契約料 新賃料の1ヶ月"]) {
    const rendered = renderedOf(raw);
    assert.match(rendered, /再簽約費（定期租約期滿續住）：新租金 1 個月/, `${raw} 應翻成中文`);
    assert.doesNotMatch(rendered, fallback, `${raw} 不可退化成泛用提示`);
  }
  assert.match(renderedOf("再契約手数料 55,000円"), /再簽約費（定期租約期滿續住）：55,000円/);
}
console.log("Renewal fee (更新料／再契約料) wording tests passed.");

// ── AI 結構化輸出支援測試（Phase 2: rentalConditionItems & Phase 3: specialNoteItems）──
{
  // Phase 2: rentalConditionItems 結構化條目優先採用
  const structuredItems = [
    { category: "fees" as const, ja: "鍵交換代33,000円", zh: "換鎖費：33,000 円" },
    { category: "moveOut" as const, ja: "退去時精算手数料5,500円（最終請求時）", zh: "退租結算手續費：5,500 円（隨最後一期帳單請款）" },
    { category: "guarantee" as const, ja: "GTN加入要（海外審査OK）", zh: "外國籍租客：須加入 GTN 保證（可接受海外審查）" },
  ];
  const groups = rentalConditionGroups(null, null, structuredItems);
  const feeGroup = groups.find(g => g.id === "fees");
  assert.ok(feeGroup, "應存在 fees 分組");
  assert.ok(feeGroup.items.includes("換鎖費：33,000 円"), "應包含結構化換鎖費");

  const moveOutGroup = groups.find(g => g.id === "moveOut");
  assert.ok(moveOutGroup, "應存在 moveOut 分組");
  assert.ok(moveOutGroup.items.includes("退租結算手續費：5,500 円（隨最後一期帳單請款）"));

  // Phase 3: specialNoteItems 結構化條目優先採用
  const structuredNotes = [
    {
      category: "生活規範" as const,
      title: "全面禁止飼養寵物",
      zh: "本大樓及室內嚴禁飼養任何寵物，違者可能面臨立即終止契約。",
      ja: "ペット飼育不可",
      tone: "amber" as const,
    },
    {
      category: "費用約定" as const,
      title: "退租鍍膜清潔費",
      zh: "退租時須支付室內鍍膜清潔費 55,000 円。",
      ja: "退去時クリーンコート代55,000円",
      tone: "neutral" as const,
    },
  ];
  const parsedNotes = parseAndExplainSpecialNotes(null, structuredNotes);
  assert.equal(parsedNotes.length, 2, "應解析出 2 筆結構化特約");
  assert.equal(parsedNotes[0].title, "全面禁止飼養寵物");
  assert.equal(parsedNotes[0].badgeTone, "amber");
  assert.equal(parsedNotes[1].title, "退租鍍膜清潔費");

  // buildRentalConditionSections 端到端整合
  const sections = buildRentalConditionSections({
    rentalConditionItems: structuredItems,
    specialNoteItems: structuredNotes,
  });
  assert.ok(sections.length > 0, "應產生四大區塊");
  const guaranteeSection = sections.find(s => s.title === "保證、保險與附加費用");
  assert.ok(guaranteeSection, "應包含保證與費用區塊");
  console.log("Structured AI items (rentalConditionItems & specialNoteItems) tests passed.");
}
// ── 定期借家（再契約料＋法人相談＋家具家電撤去費）端到端與 Fallback 雙軌測試 ──
{
  const xebecExtracted = {
    rentalConditions: "■鍵交換代33,000円■退去時クリーンコート代55,000円■事務手数料22,000円■退去時精算手数料5,500円（最終請求時）■リブクラブ2,200円/月■SBI少額短期保険800円/月■指定賃貸保証加入（総賃料100%）■賃料等引き落とし料330円/月■家具家電撤去費用27,500円（家具家電無し契約を希望の場合）■短期解約違約金：賃料1ヶ月分（1年未満）■モバイルwifi(50GB)付■民泊・簡易宿泊による利用及びそれに伴う広告等は一切禁止■法人契約の場合、普通借相談可■法人で保証会社加入無しの場合、敷金1か月■海外審査相談可■全物件先行契約になります■事務所・SOHO利用禁止■外国籍の方：GTN加入要（海外審査OK）初回保証料：賃料総額100％ 月次手数料2,330円（税込）",
    guaranteeFee: "外国籍の方：初回保証料：賃料総額100%、月次手数料2,330円（税込）",
    insuranceFee: "800円/月",
    renewalFee: "再契約料 新賃料の1ヶ月",
    rentalConditionItems: [
      { category: "lease" as const, ja: "再契約料 新賃料の1ヶ月", zh: "再契約手續費：新租金的 1 個月" },
      { category: "lease" as const, ja: "法人契約の場合、普通借相談可", zh: "法人簽約之情況，可協商改為普通租賃契約" },
      { category: "fees" as const, ja: "家具家電撤去費用27,500円（家具家電無し契約を希望の場合）", zh: "家具家電撤除搬遷費：27,500 円（若希望以不附家具家電承租時）" },
    ],
  };

  // Option B: Structured AI items
  const sectionsB = buildRentalConditionSections({
    rentalConditions: xebecExtracted.rentalConditions,
    rentalConditionItems: xebecExtracted.rentalConditionItems,
    guaranteeFee: xebecExtracted.guaranteeFee,
    insuranceFee: xebecExtracted.insuranceFee,
    renewalFee: xebecExtracted.renewalFee,
  });
  const leaseRowB = sectionsB.find(s => s.title === "契約與入住")?.rows.find(r => r.title === "租期與契約更新");
  assert.ok(leaseRowB, "Option B 必須包含「租期與契約更新」");
  assert.match(leaseRowB.items.join("\n"), /再契約手續費：新租金的 1 個月/);
  assert.match(leaseRowB.items.join("\n"), /法人簽約之情況，可協商改為普通租賃契約/);

  // Option A: Fallback regex parser (no structured items)
  const sectionsA = buildRentalConditionSections({
    rentalConditions: xebecExtracted.rentalConditions,
    guaranteeFee: xebecExtracted.guaranteeFee,
    insuranceFee: xebecExtracted.insuranceFee,
    renewalFee: xebecExtracted.renewalFee,
  });
  const leaseRowA = sectionsA.find(s => s.title === "契約與入住")?.rows.find(r => r.title === "租期與契約更新");
  assert.ok(leaseRowA, "Fallback 模式必須包含「租期與契約更新」");
  const leaseTextA = leaseRowA.items.join("\n");
  assert.match(leaseTextA, /再簽約費（定期租約期滿續住）：新租金 1 個月/, "Fallback 必須翻譯獨立欄位中的再契約料");
  assert.match(leaseTextA, /法人承租時，可洽談改採普通租賃契約/, "Fallback 必須翻譯「法人契約の場合、普通借相談可」");
  assert.doesNotMatch(leaseTextA, /家具家電撤除/, "家具家電撤除費不應被誤分入「租期與契約更新」");

  const feesRowA = sectionsA.find(s => s.title === "保證、保險與附加費用")?.rows.find(r => r.title === "附加費用與服務");
  assert.ok(feesRowA, "Fallback 模式必須包含「附加費用與服務」");
  assert.match(feesRowA.items.join("\n"), /家具家電撤除費：27,500円/, "家具家電撤除費應正確歸入附加費用");

  console.log("XEBEC 定期借家 (再契約料／法人普通借相談／家具家電撤去) 雙軌測試通過。");
}



