import {
  formatShikibiki,
  hasExplicitZeroLeaseCharge,
  isFreeOrZero,
  parseGuaranteeFee,
  parseYenAmount
} from "../../listingExtraction.js";
import { additionalRentalFees } from "../../rentalConditions.js";
import type { InitialCostBreakdownItem, InitialCostEstimate } from './types.js';
export function calculateInitialCostBreakdown(params: {
  rent: number;
  managementFee: number | null;
  keyMoney: number | null;
  deposit: number | null;
  extractedKeyMoney: string;
  extractedDeposit: string;
  extractedGuaranteeFee?: string;
  extractedLockReplacementFee?: string;
  extractedCleaningFee?: string;
  extractedInsuranceFee?: string;
  extractedSupportFee?: string;
  extractedFreeRent?: string;
  extractedShikibiki?: string;
  specialNotes?: string;
  rentalConditions?: string;
  marketVerdict?: { status: string; headline: string; detail: string } | null;
}): InitialCostEstimate {
  const { rent, managementFee, keyMoney, deposit } = params;
  const totalMonthlyCost = rent + (managementFee ?? 0);
  const leaseChargeSource = [
    params.extractedDeposit,
    params.extractedKeyMoney,
    params.rentalConditions,
    params.specialNotes,
  ].filter(Boolean).join(" ");
  const depositExplicitZero = isFreeOrZero(params.extractedDeposit) || hasExplicitZeroLeaseCharge(leaseChargeSource, "deposit");
  const keyMoneyExplicitZero = isFreeOrZero(params.extractedKeyMoney) || hasExplicitZeroLeaseCharge(leaseChargeSource, "keyMoney");
  const depositUnknown = deposit === null && !depositExplicitZero;
  const keyMoneyUnknown = keyMoney === null && !keyMoneyExplicitZero;

  const items: InitialCostBreakdownItem[] = [];

  // 1. 敷金（押金）與敷引／償却判定
  const depositAmount = depositExplicitZero ? 0 : deposit ?? 0;
  let rawShikibiki = params.extractedShikibiki || "";
  if (!rawShikibiki || isFreeOrZero(rawShikibiki)) {
    const fromDeposit = params.extractedDeposit?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0];
    const fromNotes = params.specialNotes?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0];
    if (fromDeposit) rawShikibiki = fromDeposit;
    else if (fromNotes) rawShikibiki = fromNotes;
  }
  const formattedShikibiki = formatShikibiki(rawShikibiki);
  const hasShikibiki = Boolean(formattedShikibiki);

  items.push({
    id: "deposit",
    name: "敷金（押金）",
    amount: depositAmount,
    isUnknown: depositUnknown,
    isFromFlyer: Boolean(params.extractedDeposit) || depositExplicitZero,
    note: depositUnknown ? "押金未載明，尚未計入小計；不代表免押金" : depositAmount === 0
      ? "免押金（需留意退租時是否有預收清掃費或特約條款）"
      : hasShikibiki
        ? `擔保性質費用（含「${formattedShikibiki}」扣除約定，退租時不退還）`
        : "擔保性質費用，退租扣除修繕後退還餘額",
  });

  // 2. 禮金（礼金）
  const keyMoneyAmount = keyMoneyExplicitZero ? 0 : keyMoney ?? 0;
  items.push({
    id: "keyMoney",
    name: "禮金（礼金）",
    amount: keyMoneyAmount,
    isUnknown: keyMoneyUnknown,
    isFromFlyer: Boolean(params.extractedKeyMoney) || keyMoneyExplicitZero,
    note: keyMoneyUnknown ? "禮金未載明，尚未計入小計；不代表免禮金" : keyMoneyAmount === 0 ? "免禮金（無須贈與房東謝禮，初期負擔大幅減輕）" : "贈與房東之謝禮，退租時不予退還",
  });

  // 3. 次月預付前家賃（1 個月完整租金與管理費）
  items.push({
    id: "advanceRent",
    name: "前家賃（次月完整租金與管理費）",
    amount: totalMonthlyCost,
    isFromFlyer: true,
    note: "簽約時預先支付入住次月之全額租金與管理費",
  });

  // 4. 起租月日割租金（預估半個月）
  const proratedRent = Math.round(totalMonthlyCost * 0.5);
  items.push({
    id: "proratedRent",
    name: "起租月日割租金（按日計租預估）",
    amount: proratedRent,
    isFromFlyer: false,
    note: "以月中 15 天起租試算；若起租日靠近月底（例如 25 號後）可降至更低",
  });

  // 5. 保證會社初回保證料
  const customGuarantee = parseGuaranteeFee(params.extractedGuaranteeFee, totalMonthlyCost);
  const guaranteeAmount = customGuarantee ?? Math.round(totalMonthlyCost * 0.5);
  items.push({
    id: "guaranteeFee",
    name: "保證會社初回保證料",
    amount: guaranteeAmount,
    isFromFlyer: Boolean(customGuarantee),
    note: customGuarantee
      ? `圖紙標示：${params.extractedGuaranteeFee}（以月總租金 ¥${totalMonthlyCost.toLocaleString()} 計）`
      : params.extractedGuaranteeFee
        ? `圖紙標示：${params.extractedGuaranteeFee}`
        : "外國籍租客多需加入保證公司，一般常態為總月租之 50%～100%",
  });

  // 6. 仲介手續費
  const brokerageFee = Math.round(rent * 1.1);
  items.push({
    id: "brokerageFee",
    name: "仲介手續費（仲介手数料）",
    amount: brokerageFee,
    isFromFlyer: false,
    note: "依日本租賃仲介費法定上限，以 1 個月租金加消費稅計。本試算先按此上限預留，實際是否收取及金額以申請管道、媒介契約與簽約前說明為準。",
  });

  // 7. 火災保險費
  const insuranceIncluded = /(?:含む|込み|含まれ|包含|已含)/u.test(params.extractedInsuranceFee || "");
  const customInsurance = insuranceIncluded ? 0 : parseYenAmount(params.extractedInsuranceFee);
  const insuranceAmount = customInsurance ?? 20000;
  items.push({
    id: "insuranceFee",
    name: "火災保險／家財保險（期間待核對）",
    amount: insuranceAmount,
    isFromFlyer: insuranceIncluded || Boolean(customInsurance),
    note: insuranceIncluded
      ? `已包含於圖紙指定的會員／支援費中：${params.extractedInsuranceFee}`
      : params.extractedInsuranceFee
        ? `圖紙標示：${params.extractedInsuranceFee}${customInsurance === null ? "；金額未載，暫估20,000円，期間待核對" : ""}`
        : "保障租客財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
  });

  // 8. 鑰匙更換費（精準判定無償／なし）
  const isLockFree = isFreeOrZero(params.extractedLockReplacementFee);
  const customLock = isLockFree ? 0 : parseYenAmount(params.extractedLockReplacementFee);
  const lockAmount = isLockFree ? 0 : (customLock ?? 22000);
  items.push({
    id: "lockReplacementFee",
    name: "鑰匙更換費（鍵交換代）",
    amount: lockAmount,
    isFromFlyer: isLockFree || Boolean(customLock),
    note: isLockFree
      ? `免換鎖費用（圖紙標示：${params.extractedLockReplacementFee || "無償"}）`
      : params.extractedLockReplacementFee
        ? `圖紙標示：${params.extractedLockReplacementFee}`
        : "交屋前換新鎖芯（一般鎖約 1.6 萬～2.2 萬円，電子防盜鎖約 3.3 萬円）",
  });

  // 9. 退去清掃費
  const customCleaning = parseYenAmount(params.extractedCleaningFee);
  const cleaningAmount = customCleaning ?? (depositAmount === 0 ? 44000 : 0);
  if (cleaningAmount > 0) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: cleaningAmount,
      isFromFlyer: Boolean(customCleaning),
      note: params.extractedCleaningFee
        ? `圖紙標示：${params.extractedCleaningFee}`
        : "金額與收費時點未載，暫列44,000円預備金；不是已確認的簽約請款",
    });
  }

  // 10. 入居者生活支援／安心サポート
  const customSupport = parseYenAmount(params.extractedSupportFee);
  if (customSupport && customSupport > 0) {
    const isMembershipFee = /友の会|會員/u.test(params.extractedSupportFee || "");
    items.push({
      id: "supportFee",
      name: isMembershipFee ? "指定會員月費（含租客保障與緊急支援）" : "入居者サポート／24小時生活支援",
      amount: customSupport,
      isFromFlyer: true,
      note: isMembershipFee ? `圖紙標示：${params.extractedSupportFee}；此為每月費用` : `圖紙標示：${params.extractedSupportFee}（24 小時生活急修與支援服務）`,
    });
  }

  items.push(...additionalRentalFees([params.rentalConditions, params.specialNotes].filter(Boolean).join("\n")));

  // totalMin: 假設月底起租（不計入日割租金）
  const totalMin = items
    .filter(item => item.id !== "proratedRent")
    .reduce((sum, item) => sum + item.amount, 0);

  // totalMax: 包含半個月日割租金
  const totalMax = items.reduce((sum, item) => sum + item.amount, 0);

  const monthsMultipleMin = totalMonthlyCost > 0 ? Number((totalMin / totalMonthlyCost).toFixed(1)) : 0;
  const monthsMultipleMax = totalMonthlyCost > 0 ? Number((totalMax / totalMonthlyCost).toFixed(1)) : 0;

  let level: "low" | "standard" | "high" = "standard";
  let levelText = "符合市場常態（約 4 ～ 5 倍）";

  if (monthsMultipleMax <= 3.8) {
    level = "low";
    levelText = "低於市場常態（約 3 ～ 4 倍）";
  } else if (monthsMultipleMax >= 5.5) {
    level = "high";
    levelText = "高於市場常態（5.5 倍以上）";
  }

  const tips: string[] = [];
  const missingCosts = [
    depositUnknown ? "押金" : null,
    keyMoneyUnknown ? "禮金" : null,
    managementFee === null ? "共益費" : null,
  ].filter((item): item is string => Boolean(item));
  if (missingCosts.length > 0) {
    level = "standard";
    levelText = "必要費用未齊，暫不分級";
    tips.push(`【費用待確認】${missingCosts.join("、")}未載明，目前只列已知及暫估小計；未載明項目不代表免收。`);
  }

  // 1. 租金高性價比／超值物件
  if (params.marketVerdict?.status === "超值") {
    tips.push("【低於行情】租金＋管理費低於同區同房型行情。這類物件去化較快，審查通過後建議儘早決定。");
  }

  // 2. 免租期（Free Rent）特惠提示
  const hasFreeRent = Boolean(params.extractedFreeRent && !isFreeOrZero(params.extractedFreeRent));
  if (hasFreeRent) {
    tips.push(`【免租期】圖紙載明「${params.extractedFreeRent}」，首月可減免租金，約省 ¥${rent.toLocaleString()}。`);
  }

  // 3. 初期費用優惠（3.8 倍以下）
  if (monthsMultipleMax <= 3.8 && missingCosts.length === 0) {
    tips.push(`【初期費用划算】合計約 ${monthsMultipleMax} 個月租金，比市場常見的 4.5～5.0 個月省下不少，入住門檻明顯較低。`);
  }

  // 4. 禮金與押金動態解析
  if (formattedShikibiki) {
    tips.push(`【敷引／償却】圖紙載明「${formattedShikibiki}」，退租時不予退還，初期預算建議直接列為固定支出。`);
  }
  if (!keyMoneyUnknown && !depositUnknown && keyMoneyAmount === 0 && depositAmount === 0) {
    tips.push("【免禮金免押金】初期省約 2 個月租金。需確認退租時的清掃費與原狀恢復特約。");
  } else if (!keyMoneyUnknown && keyMoneyAmount === 0) {
    tips.push("【免禮金】省約 1 個月租金。");
  } else if (keyMoneyAmount >= rent * 1.5) {
    const kmMonths = (keyMoneyAmount / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【禮金偏高】禮金 ${kmMonths} 個月，常見於熱門地段，初期成本較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isLockFree) {
    tips.push("【免換鎖費】圖紙載明鍵交換代 0 円，省約 2～4 萬円。");
  }

  // 6. 附免費高速網路
  const allNotes = `${params.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【附免費網路】免自行申辦，年省約 5～6 萬円。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日影響首期】首期預收「起租月日割租金＋次月完整租金與管理費」。起租日通常在審查通過後 10～20 天內，若落在下旬，日割天數少、首筆金額較低。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款】初期費用多需由日本國內銀行匯款。海外電匯請預留約 4,000 円日本端手續費與匯差。");

  return {
    totalMin,
    totalMax,
    monthsMultipleMin,
    monthsMultipleMax,
    level,
    levelText,
    items,
    tips,
  };
}
