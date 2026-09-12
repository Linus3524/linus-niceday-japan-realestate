import { man } from './shared.js';
import type { ListingPriceVerdict, ListingPriceVerdictContext, RentalPriceFactor, RequestedRentRange } from './types.js';


export function buildListingPriceVerdict(
  totalMonthlyCost: number,
  range: RequestedRentRange | null,
  context?: ListingPriceVerdictContext
): ListingPriceVerdict {
  if (!range) {
    return {
      status: "待確認",
      headline: "查無這個地區與房型的行情資料，無法判斷這個價格合不合理。",
      detail: "可能是圖紙上的車站無法辨識，或這個房型在行情資料庫中樣本不足。",
    };
  }

  const allNotes = `${context?.specialNotes || ""} ${context?.otherConditions || ""} ${context?.freeRent || ""} ${context?.facilities || ""}`.toLowerCase();
  const hasFreeInternet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  const hasAutoLock = /オートロック|自動ロック/.test(allNotes);
  const hasSeparateBathToilet = /バス・トイレ別|バストイレ別|ｂｔ別|風呂トイレ別/.test(allNotes);
  const hasIndependentWashbasin = /独立洗面|洗面化粧台|洗面所独立/.test(allNotes);
  const hasBathroomDryer = /浴室乾燥|浴室暖房/.test(allNotes);
  const hasDeliveryBox = /宅配box|宅配ボックス|宅配ロッカー|宅配ｂｏｘ/.test(allNotes);
  const rawStructure = `${context?.structure || ""}`
    .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .toLowerCase();
  const isSRC = /src|鉄骨鉄筋|鋼骨鋼筋/.test(rawStructure);
  const isRC = !isSRC && /rc|鉄筋コンクリート|鋼筋/.test(rawStructure);
  const isWooden = /木造|軽量鉄骨|軽鉄|木造アパート/.test(rawStructure);

  // 1. 網路實質價值折抵（日本申辦個人光纖網路每月通常約 ¥4,000 ~ ¥5,000 円）
  const internetMonthlyValue = hasFreeInternet ? 4500 : 0;
  const effectiveMonthlyCost = Math.max(0, totalMonthlyCost - internetMonthlyValue);

  // 2. 屋齡優勢／折價量化（基準為市場平均庫存 20~25 年中古水準）
  let agePremiumRate = 0;
  let ageText: string | null = null;
  const ageYears = context?.ageYears;
  if (ageYears !== null && ageYears !== undefined) {
    if (ageYears <= 3) {
      agePremiumRate = 0.18;
      ageText = `屋齡 ${ageYears} 年（新築）`;
    } else if (ageYears <= 5) {
      agePremiumRate = 0.12;
      ageText = `屋齡 ${ageYears} 年（淺築新古屋）`;
    } else if (ageYears <= 10) {
      agePremiumRate = 0.06;
      ageText = `屋齡 ${ageYears} 年（淺築）`;
    } else if (ageYears <= 20) {
      agePremiumRate = 0;
      ageText = `屋齡 ${ageYears} 年（標準中古水準）`;
    } else if (ageYears <= 30) {
      agePremiumRate = -0.06;
      ageText = `屋齡 ${ageYears} 年（略為陳舊）`;
    } else {
      agePremiumRate = -0.15;
      ageText = `屋齡 ${ageYears} 年（築古）`;
    }
  }

  // 3. 徒步距離優勢／折價量化（基準為徒歩 8~10 分）
  let walkPremiumRate = 0;
  let walkText: string | null = null;
  const walkMinutes = context?.walkMinutes;
  if (walkMinutes !== null && walkMinutes !== undefined) {
    if (walkMinutes <= 3) {
      walkPremiumRate = 0.10;
      walkText = `車站徒步 ${walkMinutes} 分（超近站）`;
    } else if (walkMinutes <= 7) {
      walkPremiumRate = 0.05;
      walkText = `車站徒步 ${walkMinutes} 分`;
    } else if (walkMinutes <= 10) {
      walkPremiumRate = 0;
      walkText = `車站徒步 ${walkMinutes} 分`;
    } else if (walkMinutes <= 15) {
      walkPremiumRate = -0.05;
      walkText = `車站徒步 ${walkMinutes} 分（步行稍遠）`;
    } else {
      walkPremiumRate = -0.12;
      walkText = `車站徒步 ${walkMinutes} 分（步行較遠）`;
    }
  }

  // 4. 專有面積空間加成（依房型基準判定）
  let areaPremiumRate = 0;
  let areaText: string | null = null;
  const areaSqm = context?.areaSqm;
  const roomType = context?.roomType;
  if (areaSqm !== null && areaSqm !== undefined) {
    if (roomType === "ldk1") {
      if (areaSqm >= 45) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（超大 1LDK，兼具起居與大收納空間）`;
      } else if (areaSqm >= 40) {
        areaPremiumRate = 0.06;
        areaText = `專有面積 ${areaSqm}㎡（寬敞 1LDK，高於平均 32㎡）`;
      } else if (areaSqm >= 35) {
        areaPremiumRate = 0.035;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，起居動線舒暢）`;
      } else if (areaSqm < 28) {
        areaPremiumRate = -0.05;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 1LDK/1DK）`;
      }
    } else if (roomType === "ldk2") {
      if (areaSqm >= 60) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（寬敞 2LDK，遠高於家庭型平均 48㎡）`;
      } else if (areaSqm >= 50) {
        areaPremiumRate = 0.05;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，雙臥室與客餐廳動線獨立）`;
      } else if (areaSqm < 42) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 2LDK/2DK）`;
      }
    } else if (roomType === "ldk3") {
      if (areaSqm >= 80) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（大坪數三房家庭宅，高於平均 68㎡）`;
      } else if (areaSqm >= 70) {
        areaPremiumRate = 0.04;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，家庭生活動線舒適）`;
      } else if (areaSqm < 60) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 3LDK）`;
      }
    } else {
      // 1R, 1K 或通用單身基準（平均約 18~20㎡）
      if (areaSqm >= 30) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（超寬敞套房，遠高於單身平均 18㎡）`;
      } else if (areaSqm >= 25) {
        areaPremiumRate = 0.06;
        areaText = `專有面積 ${areaSqm}㎡（寬敞大套房，高於單身平均 18㎡）`;
      } else if (areaSqm >= 20) {
        areaPremiumRate = 0.03;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，居住動線寬敞）`;
      } else if (areaSqm < 16) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（空間緊湊，精簡型套房）`;
      }
    }
  }

  // 5. 樓層高低與景觀防盜折溢價
  let floorPremiumRate = 0;
  const floor = context?.floor;
  const totalFloors = context?.totalFloors;
  const isTopFloor = floor !== null && floor !== undefined && totalFloors !== null && totalFloors !== undefined && floor >= totalFloors && totalFloors >= 3;
  const isFirstFloor = floor === 1;
  const isUpperFloor = floor !== null && floor !== undefined && floor >= 2 && !isTopFloor;
  const noElevatorHighFloor = floor !== null && floor !== undefined && floor >= 4 && /エレベーター無|ev無|階段のみ/.test(allNotes);

  if (isTopFloor) {
    floorPremiumRate += 0.04;
  } else if (isUpperFloor) {
    floorPremiumRate += 0.02;
  } else if (isFirstFloor) {
    floorPremiumRate -= 0.035;
  }
  if (noElevatorHighFloor) {
    floorPremiumRate -= 0.05;
  }

  // 6. 裝潢翻新
  const hasRenovation = /リノベ|リノベーション|改装済み|全面改装|リフォーム済/.test(allNotes);
  const renovationRate = hasRenovation ? 0.06 : 0;

  // 7. 結構與設備附加價值
  const structureRate = isSRC ? 0.025 : isRC ? 0.02 : isWooden ? -0.10 : 0;

  let amenitiesRate = 0;
  const amenitiesList: string[] = [];
  if (hasSeparateBathToilet) {
    amenitiesRate += 0.035;
    amenitiesList.push("乾濕分離");
  }
  if (hasIndependentWashbasin) {
    amenitiesRate += 0.03;
    amenitiesList.push("獨立洗面台");
  }
  if (hasAutoLock) {
    amenitiesRate += 0.025;
    amenitiesList.push("防盜自動門鎖");
  }
  if (hasDeliveryBox) {
    amenitiesList.push("宅配箱");
  }
  if (hasBathroomDryer) {
    amenitiesList.push("浴室暖風乾燥機");
  }
  const internetText = hasFreeInternet ? "附免費光纖網路" : null;

  // 綜合調整後的合理上限
  const totalJustifiedPremiumRate = agePremiumRate + walkPremiumRate + areaPremiumRate + floorPremiumRate + structureRate + renovationRate + amenitiesRate;
  const adjustedHigh = Math.round(range.high * (1 + Math.max(0, totalJustifiedPremiumRate)));

  // 整理租賃規格加減因子清單（供前端對照拆解卡使用）
  const factors: RentalPriceFactor[] = [];

  // 專有面積
  if (areaPremiumRate !== 0 && areaSqm) {
    factors.push({
      label: areaPremiumRate > 0 ? "專有空間加成" : "室內空間緊湊",
      ratePercent: Number((areaPremiumRate * 100).toFixed(1)),
      note: areaText || (areaPremiumRate > 0
        ? `專有面積 ${areaSqm}㎡（高於同房型平均規格）`
        : `專有面積 ${areaSqm}㎡（空間緊湊精簡，居住動線精緻）`),
      level: Math.abs(areaPremiumRate) >= 0.08 ? 4 : 2,
      category: "space",
    });
  }

  // 車站徒步距離
  if (walkPremiumRate !== 0 && walkMinutes) {
    factors.push({
      label: walkPremiumRate > 0 ? "近站交通優勢" : "車站徒步腳程稍長",
      ratePercent: Number((walkPremiumRate * 100).toFixed(1)),
      note: walkPremiumRate > 0
        ? `車站徒步 ${walkMinutes} 分，日常通勤時間與負擔大幅降低`
        : `車站徒步 ${walkMinutes} 分，腳程稍長，租金反映折讓換取生活空間`,
      level: Math.abs(walkPremiumRate) >= 0.10 ? 5 : 3,
      category: "location",
    });
  }

  // 屋齡新舊
  if (agePremiumRate !== 0 && ageYears !== null && ageYears !== undefined) {
    factors.push({
      label: agePremiumRate > 0 ? (ageYears <= 3 ? "新築完工成屋" : "淺築新古屋") : "屋齡築古折讓",
      ratePercent: Number((agePremiumRate * 100).toFixed(1)),
      note: agePremiumRate > 0
        ? `屋齡僅 ${ageYears} 年，建築外觀與設備維持頂尖健康水準`
        : `屋齡 ${ageYears} 年（築古中古），管線與公設具歲月痕跡，租金具讓利優勢`,
      level: Math.abs(agePremiumRate) >= 0.12 ? 5 : 3,
      category: "age",
    });
  }

  // 樓層條件
  if (isTopFloor && floor && totalFloors) {
    factors.push({
      label: "最上階景觀視野",
      ratePercent: 4.0,
      note: `位於頂樓（${floor}F/${totalFloors}F），無樓上腳步噪音且通風採光佳`,
      level: 3,
      category: "floor",
    });
  } else if (isUpperFloor && floor) {
    factors.push({
      label: "位於 2 樓以上",
      ratePercent: 2.0,
      note: `房間位於 ${floor} 樓，排除一樓潮濕與防盜顧慮之主流樓層`,
      level: 1,
      category: "floor",
    });
  } else if (isFirstFloor) {
    factors.push({
      label: "房間位於一樓",
      ratePercent: -3.5,
      note: "一樓多有隱私與防盜考量，市場租金普遍折讓約 3,000 円/月",
      level: 2,
      category: "floor",
    });
  }

  if (noElevatorHighFloor && floor) {
    factors.push({
      label: "高樓層無電梯",
      ratePercent: -5.0,
      note: `位於 ${floor} 樓且無電梯，出入攀爬負擔較大，享有實質租金補償`,
      level: 3,
      category: "floor",
    });
  }

  // 建築結構
  if (isSRC) {
    factors.push({
      label: "SRC 鋼骨鋼筋造",
      ratePercent: 2.5,
      note: "頂級耐震與高隔音建材，居住私密安靜度絕佳",
      level: 2,
      category: "structure",
    });
  } else if (isRC) {
    factors.push({
      label: "RC 鋼筋混凝土造",
      ratePercent: 2.0,
      note: "耐火耐震與優良隔音結構，居住品質遠優於木造鐵骨",
      level: 1,
      category: "structure",
    });
  } else if (isWooden) {
    factors.push({
      label: "木造／輕鋼構結構",
      ratePercent: -10.0,
      note: "隔音耐震保溫次於 RC 鋼筋混凝土，但總體租金極具親民優勢",
      level: 4,
      category: "structure",
    });
  }

  // 裝潢翻新
  if (hasRenovation) {
    factors.push({
      label: "室內現代化翻新",
      ratePercent: 6.0,
      note: "リノベーション 重新翻修，水電管線、地板廚衛全面更新",
      level: 3,
      category: "amenity",
    });
  }

  // 核心設備
  if (hasSeparateBathToilet) {
    factors.push({
      label: "乾濕分離（BT別）",
      ratePercent: 3.5,
      note: "浴室廁所獨立分開，日本租屋必備剛需配置",
      level: 2,
      category: "amenity",
    });
  }

  if (hasIndependentWashbasin) {
    factors.push({
      label: "獨立洗面台",
      ratePercent: 3.0,
      note: "獨立梳洗與收納動線，單身承租熱門加分設備",
      level: 2,
      category: "amenity",
    });
  }

  if (hasAutoLock) {
    factors.push({
      label: "防盜自動門鎖",
      ratePercent: 2.5,
      note: "オートロック 門禁門卡管制，提升獨居防犯安全性",
      level: 2,
      category: "amenity",
    });
  }

  if (hasFreeInternet) {
    factors.push({
      label: "附免費光纖網路",
      ratePercent: 3.5,
      monthlyYen: 4500,
      note: "入居即享高速 Wi-Fi，免自行簽約每月現省約 4,500 円",
      level: 2,
      category: "internet",
    });
  }

  if (hasDeliveryBox) {
    factors.push({
      label: "宅配箱",
      ratePercent: 1.5,
      note: "不在家也能安全收取包裹，現代都會網購必備配備",
      level: 1,
      category: "amenity",
    });
  }

  if (hasBathroomDryer) {
    factors.push({
      label: "浴室暖風乾燥機",
      ratePercent: 1.5,
      note: "雨天花粉季可室內乾衣，冬季預先暖房並防止浴室發霉",
      level: 1,
      category: "amenity",
    });
  }

  const positiveFactorsSumPercent = Number(
    factors.filter(f => f.ratePercent > 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const negativeFactorsSumPercent = Number(
    factors.filter(f => f.ratePercent < 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const netFactorsSumPercent = Number(
    factors.reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const nominalDiffPercent = range
    ? Number((((totalMonthlyCost - range.median) / Math.max(1, range.median)) * 100).toFixed(1))
    : 0;

  // 低於行情低端
  if (effectiveMonthlyCost < range.low) {
    const gapPercent = Math.round(((range.low - effectiveMonthlyCost) / range.low) * 100);
    return {
      status: "超值",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 低於同區行情約 ${gapPercent}%，價格優勢顯著。`,
      detail: `同區同房型行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。價格明顯親民實惠，建議留意確認是否有特殊解約約定、朝向日照限制或周邊環境等取捨。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 落在基準行情內
  if (totalMonthlyCost <= range.high) {
    const nearMedian = Math.abs(totalMonthlyCost - range.median) / Math.max(1, range.median) <= 0.05;
    const belowMedian = totalMonthlyCost < range.median;
    return {
      status: "合理",
      headline: nearMedian
        ? `每月總負擔 ${man(totalMonthlyCost)} 貼近同區行情中位數，定價合宜健康。`
        : `每月總負擔 ${man(totalMonthlyCost)} 落在周邊市場正常行情區間（偏${belowMedian ? "實惠" : "高端"}），符合行情。`,
      detail: `同區同房型行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。當前月額負擔與區域行情相符。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 名目租金高於基準高端，但綜合條件（屋齡、距離、面積、設備）足以支撐
  if (effectiveMonthlyCost <= adjustedHigh) {
    const positiveReasons: string[] = [];
    if (walkText && walkPremiumRate > 0) positiveReasons.push(walkText);
    if (areaText && areaPremiumRate > 0) positiveReasons.push(areaText);
    if (ageText && agePremiumRate > 0) positiveReasons.push(ageText);
    if (internetText) positiveReasons.push(internetText);
    amenitiesList.forEach(a => positiveReasons.push(a));

    const areaNote = areaSqm && areaSqm >= 20 ? `（專有面積 ${areaSqm}㎡ 高於單身平均 17㎡）` : "";
    const diffYen = totalMonthlyCost - range.median;
    const netYen = Math.round(range.median * (netFactorsSumPercent / 100));
    const comparisonText = netFactorsSumPercent >= nominalDiffPercent
      ? `本案條件累計淨加成（+${netFactorsSumPercent.toFixed(1)}%，約 +${man(netYen)}）充分涵蓋當前月額相對中位數之溢價（+${nominalDiffPercent.toFixed(1)}%，+${man(diffYen)}）。考量硬體規格與生活便利性${areaNote}，當前租金溢價反映更好的居住品質，定價具備充分條件支撐與合理性。`
      : `考量硬體規格與生活便利性${areaNote}，當前價格反映的是更好的居住品質，定價具合理性。`;

    return {
      status: "條件反映",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 雖略高於同區行情均值，但綜合屋齡、站距與規格，屬於符合品質的「合理溢價」。`,
      detail: `同區同房型基礎行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。但此物件具備明顯優勢：${positiveReasons.join("；") || "建物規格較佳"}。${comparisonText}`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 真的偏高
  const gapPercent = Math.round(((effectiveMonthlyCost - adjustedHigh) / adjustedHigh) * 100);
  if (gapPercent <= 10) {
    return {
      status: "偏高",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 略高於同條件市場行情約 ${gapPercent}%，建議評估個人每月承擔能力。`,
      detail: `考量屋齡、車站距離與空間大小後，推估同條件行情上限約為 ${man(adjustedHigh)}。目前月額負擔稍顯偏高，由於日本租屋月租多為固定定價、幾無議價談判空間，建議承租前務必衡量個人每月預算與承擔能力，亦可同步比較周邊其他同級房源。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  return {
    status: "明顯偏高",
    headline: `每月總負擔 ${man(totalMonthlyCost)} 明顯高於周邊同條件行情約 ${gapPercent}%，建議審慎評估自身承擔能力。`,
    detail: `此物件月額負擔超出周邊同等屋齡與距離之行情上限甚多。除非有特定不可替代之偏好（如特殊景觀或高品質裝潢），否則性價比偏低；考量日本租屋習慣無談判議價空間，建議謹慎衡量個人每月承受力，並優先多比較周邊同級房源。`,
    factors,
    positiveFactorsSumPercent,
    negativeFactorsSumPercent,
    netFactorsSumPercent,
    nominalDiffPercent,
  };
}
