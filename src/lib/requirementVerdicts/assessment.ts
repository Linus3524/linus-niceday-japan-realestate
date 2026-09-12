import {
type RentRecommendation,
type RentSearchCriteria
} from "../rentAnalysis.js";
import { budgetAxis, buildingAxis, commuteAxis, equipmentAxis, initialCostAxis, initialFeePreferenceAxis, layoutAxis, otherCoreNeedsAxis, petAxis, timingAxis, visaAxis } from './axes.js';
import { budgetOutOfRange, sanitizeCriteria } from './criteria.js';
import { estimateRequestedRent } from './rentScope.js';
import type { AxisImpactLevel, AxisVerdict, OverallVerdict } from './types.js';


/**
 * 個別列只表達「這項條件在整體需求中的達成難度」，不再顯示符合／不符合。
 * 符合是整組需求的結論；單項使用取捨程度，才不會讓人誤讀成逐項驗收。
 */
export function axisImpactLevel(axis: AxisVerdict): AxisImpactLevel {
  if (axis.status === "待確認") return "待補資料";
  if (axis.supplyImpact >= 2) return "較難兼顧";
  if (axis.supplyImpact >= 1) return "需要取捨";
  return "容易達成";
}

export function buildAxisVerdicts(rawCriteria: RentSearchCriteria, recommendations: RentRecommendation[]): AxisVerdict[] {
  const criteria = sanitizeCriteria(rawCriteria);
  const range = estimateRequestedRent(criteria);
  return [
    visaAxis(criteria),
    budgetAxis(criteria, range, budgetOutOfRange(rawCriteria)),
    commuteAxis(criteria, recommendations),
    layoutAxis(criteria),
    buildingAxis(criteria),
    equipmentAxis(criteria),
    petAxis(criteria),
    otherCoreNeedsAxis(criteria),
    timingAxis(criteria),
    initialFeePreferenceAxis(criteria),
    initialCostAxis(criteria)
  ].filter(Boolean) as AxisVerdict[];
}

export function buildOverallVerdict(axes: AxisVerdict[]): OverallVerdict {
  // 待補資料只影響判斷完整度，不先當成市場阻力加分。
  const totalImpact = axes.reduce((sum, axis) => sum + (axis.status === "待確認" ? 0 : axis.supplyImpact), 0);
  const highImpact = axes.filter(axis => axis.status !== "待確認" && axis.supplyImpact >= 2);
  const adjusting = axes.filter(axis => axis.status === "需調整");
  const stillPending = axes.filter(axis => axis.status === "待確認");
  const pendingLabels = [...new Set(stillPending.map(axis => axis.label))];

  // 只有「整組需求本身無法成立」的軸才是一票否決：預算搆不到指定行情、
  // 或所有推薦方向都超過通勤上限。寵物、築淺、家具等雖然很壓縮供給，
  // 仍應與預算、地區彈性及其他條件一起做整體判斷，不能單項直接判死刑。
  const hardConflicts = axes.filter(axis =>
    axis.status === "難度高" && (axis.key === "budget" || axis.key === "commute")
  );
  // 只有預算缺席才真的無法判斷。沒有通勤目的地仍可評預算、格局、建物等軸，
  // 不該讓整份評估降級成「資料不足」而蓋掉其他結論。
  const pendingKeys = axes.filter(axis => axis.status === "待確認" && axis.key === "budget");
  // 預算軸有兩種待確認，下一步完全不同：真的沒填要叫他補預算；
  // 地區查無行情時他明明填了預算，再叫他「補上預算」只會讓人反覆重填
  // 一個已經填好的欄位，真正該換的是地區。
  const noMarketData = pendingKeys.some(axis => axis.pendingReason === "no-market-data");

  // 最該先放寬的：壓縮供給最多、且有具體下一步的那一項。
  const loosenFirst = [...axes]
    .filter(axis => axis.nextStep && axis.supplyImpact >= 2)
    .sort((a, b) => b.supplyImpact - a.supplyImpact)[0];

  if (pendingKeys.length) {
    return {
      level: "資料不足",
      headline: noMarketData
        ? "這個地區目前沒有收錄行情，無法比對預算。換一個地區或指定車站再試一次。"
        : `補上${pendingKeys.map(axis => axis.label).join("與")}後才能判斷這組需求找不找得到。`,
      reasons: pendingKeys.map(axis => axis.headline),
      pendingLabels
    };
  }

  const explicitReasons = [...hardConflicts, ...adjusting];
  const impactfulReasons = axes
    .filter(axis => axis.supplyImpact > 0 && !explicitReasons.includes(axis))
    .sort((a, b) => b.supplyImpact - a.supplyImpact);
  const reasons = [...explicitReasons, ...impactfulReasons].slice(0, 3).map(axis => axis.headline);

  if (hardConflicts.length || totalImpact >= 6) {
    return {
      level: "難度高",
      headline: hardConflicts.length
        ? `${hardConflicts.map(axis => axis.label).join("、")}與目前設定有明顯落差，整組需求需要大幅調整。`
        : "多項條件疊加後，同時滿足全部要求的房源相對較少。",
      reasons: reasons.length ? reasons : ["多項條件同時限制供給"],
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined,
      pendingLabels: pendingLabels.length ? pendingLabels : undefined
    };
  }
  // 多項條件同時壓縮供給時，線性加總撐不到門檻：預算勉強、屋齡勉強各記 1 分，
  // 合計 2 分仍判「可行」，使用者照著去找卻處處碰壁。
  //
  // 只計「部分符合且真的壓縮供給（impact ≥ 1）」的軸——單看狀態會誤判：
  // 通勤 40 分鐘會顯示部分符合但 impact 0，那不是限制，只是提醒。
  const squeezing = axes.filter(axis => axis.status === "部分符合" && axis.supplyImpact >= 1);

  if (highImpact.length || adjusting.length || totalImpact >= 4 || squeezing.length >= 2) {
    const pressureLabels = [...highImpact, ...adjusting, ...impactfulReasons]
      .sort((a, b) => b.supplyImpact - a.supplyImpact)
      .filter((axis, index, list) => list.findIndex(item => item.key === axis.key) === index)
      .slice(0, 3)
      .map(axis => axis.label);
    return {
      level: "有條件可行",
      headline: pressureLabels.length
        ? pressureLabels.length === 1
          ? `整體仍有機會，但${pressureLabels[0]}會明顯縮小可選房源。`
          : `整體仍有機會，但${pressureLabels.join("、")}疊加後會明顯縮小可選房源。`
        : "整體仍有機會，但有幾項條件需要排列優先順序。",
      reasons,
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined,
      pendingLabels: pendingLabels.length ? pendingLabels : undefined
    };
  }
  if (stillPending.length) {
    return {
      level: "資料不足",
      headline: `已填的條件在市場上找得到，補上${stillPending.map(axis => axis.label).join("與")}後就能確認整組需求。`,
      reasons: stillPending.map(axis => axis.headline),
      loosenFirst: undefined,
      pendingLabels
    };
  }
  return {
    level: "可行",
    headline: "這組條件在市場上找得到，可以直接開始看物件。",
    reasons: []
  };
}
