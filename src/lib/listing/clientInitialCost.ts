import {
  formatShikibiki,
  hasExplicitZeroLeaseCharge,
  isFreeOrZero,
  parseGuaranteeFee,
  parseYenAmount,
} from '../listingExtraction.js';
import { additionalRentalFees, rentalConditionText } from '../rentalConditions.js';
import type { AnalyzeListingResult, InitialCostBreakdownItem, InitialCostEstimate } from './types.js';
/**
 * 前端 fallback 初期費用試算：若 API 回應中未包含完整物件，
 * 即刻依既有欄位與市場行情標準補充計算，確保使用者必定能看到初期費用拆解。
 */
export function buildClientInitialCost(result: AnalyzeListingResult): InitialCostEstimate | null {
  const rent = result.parsed.rent;
  if (!rent) return null;
  const managementFee = result.parsed.managementFee ?? 0;
  const totalMonthlyCost = rent + managementFee;
  const leaseChargeSource = [
    result.extracted.deposit,
    result.extracted.keyMoney,
    rentalConditionText(result.extracted),
  ].filter(Boolean).join(" ");
  const depositExplicitZero = isFreeOrZero(result.extracted.deposit) || hasExplicitZeroLeaseCharge(leaseChargeSource, "deposit");
  const keyMoneyExplicitZero = isFreeOrZero(result.extracted.keyMoney) || hasExplicitZeroLeaseCharge(leaseChargeSource, "keyMoney");
  const depositUnknown = result.parsed.deposit == null && !depositExplicitZero;
  const keyMoneyUnknown = result.parsed.keyMoney == null && !keyMoneyExplicitZero;
  const deposit = depositExplicitZero ? 0 : result.parsed.deposit ?? 0;
  const keyMoney = keyMoneyExplicitZero ? 0 : result.parsed.keyMoney ?? 0;

  const formattedShikibiki = formatShikibiki(result.extracted.shikibiki);
  const hasShikibiki = Boolean(formattedShikibiki);

  const customGuarantee = parseGuaranteeFee(result.extracted.guaranteeFee, totalMonthlyCost);
  const guaranteeAmount = customGuarantee ?? Math.round(totalMonthlyCost * 0.5);

  const items: InitialCostBreakdownItem[] = [
    {
      id: "deposit",
      name: "敷金（押金）",
      amount: deposit,
      isUnknown: depositUnknown,
      isFromFlyer: Boolean(result.extracted.deposit) || depositExplicitZero,
      note: depositUnknown ? "押金未確認，未計入小計" : deposit === 0
        ? "免押金（需留意退租時之原狀恢復或預收清掃費條款）" : hasShikibiki
          ? `擔保性質費用（ 含「${formattedShikibiki}」扣除約定，退租時不退還）` : "擔保性質費用，退租扣除自然折舊外之修繕後退還餘額",
    },
    {
      id: "keyMoney",
      name: "禮金（礼金）",
      amount: keyMoney,
      isUnknown: keyMoneyUnknown,
      isFromFlyer: Boolean(result.extracted.keyMoney) || keyMoneyExplicitZero,
      note: keyMoneyUnknown ? "禮金未確認，未計入小計" : keyMoney === 0 ? "免禮金（無須額外贈與房東謝禮，初期負擔大幅減輕）" : "日本傳統贈與房東之謝禮，退租時不予退還",
    },
    {
      id: "advanceRent",
      name: "前家賃（次月完整租金＋管理費）",
      amount: totalMonthlyCost,
      isFromFlyer: true,
      note: "簽約時預先繳交入住次月之全月租金與共益費",
    },
    {
      id: "proratedRent",
      name: "起租月日割租金（按日計租預估）",
      amount: Math.round(totalMonthlyCost * 0.5),
      isFromFlyer: false,
      note: "以月中 15 天起租試算；若起租日靠近月底（例如 25 號後）可降至更低",
    },
    {
      id: "guaranteeFee",
      name: "保證會社初回保證料",
      amount: guaranteeAmount,
      isFromFlyer: Boolean(customGuarantee),
      note: customGuarantee
        ? `圖紙載明：${result.extracted.guaranteeFee}（依月總租金 ¥${totalMonthlyCost.toLocaleString()} 計約 ¥${guaranteeAmount.toLocaleString()}）` : result.extracted.guaranteeFee
          ? `圖紙標示：${result.extracted.guaranteeFee}` : "外國籍租客多數需加入保證公司，一般首年為總租金 50%～100%",
    },
    {
      id: "brokerageFee",
      name: "仲介手續費（仲介手数料）",
      amount: Math.round(rent * 1.1),
      isFromFlyer: false,
      note: "依日本租賃仲介費法定上限，以 1 個月租金加消費稅計。本試算先按此上限預留，實際是否收取及金額以申請管道、媒介契約與簽約前說明為準。",
    },
    (() => {
      const insuranceIncluded = /(?:含む|込み|含まれ|包含|已含)/u.test(result.extracted.insuranceFee || "");
      const insuranceAmount = insuranceIncluded ? 0 : (parseYenAmount(result.extracted.insuranceFee) ?? 20000);
      return {
        id: "insuranceFee",
        name: "火災保險／家財保險（期間待核對）",
        amount: insuranceAmount,
        isFromFlyer: insuranceIncluded || Boolean(parseYenAmount(result.extracted.insuranceFee)),
        note: insuranceIncluded ? `已包含於圖紙指定的會員／支援費中：${result.extracted.insuranceFee}` : result.extracted.insuranceFee ? `圖紙標示：${result.extracted.insuranceFee}` : "保障租客個人財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
      };
    })(),
    {
      id: "lockReplacementFee",
      name: "鑰匙更換費（鍵交換代）",
      amount: isFreeOrZero(result.extracted.lockReplacementFee) ? 0 : (parseYenAmount(result.extracted.lockReplacementFee) ?? 22000),
      isFromFlyer: isFreeOrZero(result.extracted.lockReplacementFee) || Boolean(parseYenAmount(result.extracted.lockReplacementFee)),
      note: isFreeOrZero(result.extracted.lockReplacementFee)
        ? `免換鎖費用（圖紙標示：${result.extracted.lockReplacementFee || "無償"}）` : result.extracted.lockReplacementFee
          ? `圖紙標示：${result.extracted.lockReplacementFee}` : "交屋前換新鎖芯費用（一般鎖約 1.6 萬～2.2 萬円，電子鎖約 3.3 萬円）",
    },
  ];

  const customCleaning = parseYenAmount(result.extracted.cleaningFee);
  if (deposit === 0 || customCleaning) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: customCleaning ?? 44000,
      isFromFlyer: Boolean(customCleaning),
      note: result.extracted.cleaningFee ? `圖紙標示：${result.extracted.cleaningFee}` : "金額與收費時點未載，暫列44,000円預備金；不是已確認的簽約請款",
    });
  }

  const customSupport = parseYenAmount(result.extracted.supportFee);
  if (customSupport && customSupport > 0) {
    const isMembershipFee = /友の会|會員/u.test(result.extracted.supportFee || "");
    items.push({
      id: "supportFee",
      name: isMembershipFee ? "指定會員月費（含租客保障與緊急支援）" : "入居者サポート／24小時生活支援",
      amount: customSupport,
      isFromFlyer: true,
      note: isMembershipFee ? `圖紙標示：${result.extracted.supportFee}；此為每月費用` : `圖紙標示：${result.extracted.supportFee}（24 小時生活急修與支援服務）`,
    });
  }

  items.push(...additionalRentalFees(rentalConditionText(result.extracted)));
  const totalMin = items.filter(i => i.id !== "proratedRent").reduce((sum, i) => sum + i.amount, 0);
  const totalMax = items.reduce((sum, i) => sum + i.amount, 0);
  const monthsMultipleMin = Number((totalMin / totalMonthlyCost).toFixed(1));
  const monthsMultipleMax = Number((totalMax / totalMonthlyCost).toFixed(1));

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
  const managementFeeUnknown = result.parsed.managementFee == null && !result.extracted.managementFee;
  const missingCosts = [
    depositUnknown ? "押金" : null,
    keyMoneyUnknown ? "禮金" : null,
    managementFeeUnknown ? "共益費" : null,
  ].filter((item): item is string => Boolean(item));
  if (missingCosts.length > 0) {
    level = "standard";
    levelText = "必要費用未齊，暫不分級";
    tips.push(`【費用待確認】${missingCosts.join("、")}未載明，目前只列已知及暫估小計；未載明項目不代表免收。`);
  }

  // 1. 租金高性價比／超值物件
  if (result.verdict?.status === "超值") {
    tips.push("【低於行情】租金＋管理費低於同區同房型行情。這類物件去化較快，審查通過後建議儘早決定。");
  }

  // 2. 免租期（Free Rent）特惠提示
  if (result.extracted.freeRent && !isFreeOrZero(result.extracted.freeRent)) {
    tips.push(`【免租期】圖紙載明「${result.extracted.freeRent}」，首月可減免租金，約省 ¥${rent.toLocaleString()}。`);
  }

  // 3. 初期費用優惠（3.8 倍以下）
  if (monthsMultipleMax <= 3.8 && missingCosts.length === 0) {
    tips.push(`【初期費用划算】合計約 ${monthsMultipleMax} 個月租金，比市場常見的 4.5～5.0 個月省下不少，入住門檻明顯較低。`);
  }

  // 4. 禮金與押金動態解析
  if (hasShikibiki) {
    tips.push(`【敷引／償却】圖紙載明「${formattedShikibiki}」，退租時不予退還，初期預算建議直接列為固定支出。`);
  }
  if (keyMoney === 0 && deposit === 0) {
    tips.push("【免禮金免押金】初期省約 2 個月租金。需確認退租時的清掃費與原狀恢復特約。");
  } else if (keyMoney === 0) {
    tips.push("【免禮金】省約 1 個月租金。");
  } else if (keyMoney >= rent * 1.5) {
    const kmMonths = (keyMoney / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【禮金偏高】禮金 ${kmMonths} 個月，常見於熱門地段，初期成本較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isFreeOrZero(result.extracted.lockReplacementFee)) {
    tips.push("【免換鎖費】圖紙載明鍵交換代 0 円，省約 2～4 萬円。");
  }

  // 6. 附免費高速網路
  const allNotes = `${result.extracted.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【附免費網路】免自行申辦，年省約 5～6 萬円。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日影響首期】首期預收「起租月日割租金＋次月完整租金與管理費」。起租日通常在審查通過後 10～20 天內，若落在下旬，日割天數少、首筆金額較低。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款】初期費用多需由日本國內銀行匯款。海外電匯請預留約 4,000 円日本端手續費與匯差。");

  return { totalMin, totalMax, monthsMultipleMin, monthsMultipleMax, level, levelText, items, tips };
}
