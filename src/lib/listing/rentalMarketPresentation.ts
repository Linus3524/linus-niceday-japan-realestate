import { formatYen } from './formatters.js';
import type { AnalyzeListingResult } from './types.js';

export function parseRentalVerdictDetail(cleanVerdictDetail: string) {
  const detailStr = cleanVerdictDetail || "";
  const advantageMatch = detailStr.match(/^(.*?)(?:但此物件具備明顯優勢：)(.*?)(?:。)(.*)$/);
  const prefixText = advantageMatch ? advantageMatch[1].trim() : "";
  const tags = advantageMatch
    ? advantageMatch[2].split("；").map(t => t.trim()).filter(Boolean)
    : [];
  const conclusionText = advantageMatch ? advantageMatch[3].trim() : "";
  return { tags, conclusionText };
}

export function buildRentalMarketFactors(result: AnalyzeListingResult, tags: string[], totalMonthlyCost: number | null) {
  const rentalFactors = (() => {
    if (result.verdict?.factors && result.verdict.factors.length > 0) {
      return result.verdict.factors;
    }
    const fList: Array<{ label: string; ratePercent: number; note: string; level: number; category: string }> = [];
    const fields = result.extracted;

    // 車站徒步
    const walkMinutes = (() => {
      const wt = fields?.walkTime;
      if (!wt) return null;
      const m = wt.match(/(\d+)/);
      return m ? Number(m[1]) : null;
    })();

    if (walkMinutes !== null) {
      if (walkMinutes <= 3) {
        fList.push({ label: "近站交通優勢", ratePercent: 10.0, note: `車站徒步 ${walkMinutes} 分，日常通勤時間與負擔大幅降低`, level: 5, category: "location" });
      } else if (walkMinutes <= 7) {
        fList.push({ label: "近站交通優勢", ratePercent: 5.0, note: `車站徒步 ${walkMinutes} 分，步行 7 分內黃金通勤圈`, level: 3, category: "location" });
      } else if (walkMinutes >= 11 && walkMinutes <= 15) {
        fList.push({ label: "車站徒步腳程稍長", ratePercent: -5.0, note: `車站徒步 ${walkMinutes} 分，腳程稍長，租金反映折讓換取生活空間`, level: 2, category: "location" });
      } else if (walkMinutes > 15) {
        fList.push({ label: "車站徒步腳程較遠", ratePercent: -12.0, note: `車站徒步 ${walkMinutes} 分，偏離核心生活站圈，租金有明顯讓利`, level: 4, category: "location" });
      }
    }

    // 屋齡
    const ageStr = fields?.age || "";
    const ageMatch = ageStr.match(/(\d+)/);
    const ageYears = ageMatch ? Number(ageMatch[1]) : null;
    if (ageYears !== null) {
      if (ageYears <= 3) {
        fList.push({ label: "新築完工成屋", ratePercent: 18.0, note: `屋齡僅 ${ageYears} 年，建築外觀與設備維持頂尖健康水準`, level: 5, category: "age" });
      } else if (ageYears <= 5) {
        fList.push({ label: "淺築新古屋", ratePercent: 12.0, note: `屋齡僅 ${ageYears} 年，建築設備現代新穎`, level: 4, category: "age" });
      } else if (ageYears <= 10) {
        fList.push({ label: "10年內次新房", ratePercent: 6.0, note: `屋齡 ${ageYears} 年，維持現代化規格水準`, level: 2, category: "age" });
      } else if (ageYears >= 21 && ageYears <= 30) {
        fList.push({ label: "屋齡中古折讓", ratePercent: -6.0, note: `屋齡 ${ageYears} 年，設備公設略有折舊，享有價格讓利`, level: 2, category: "age" });
      } else if (ageYears > 30) {
        fList.push({ label: "屋齡築古折讓", ratePercent: -15.0, note: `屋齡 ${ageYears} 年（築古建物），租金已反映折舊讓利優勢`, level: 4, category: "age" });
      }
    }

    // 樓層
    const floorStr = fields?.floor || "";
    const floorMatch = floorStr.match(/(\d+)/);
    const floorNum = floorMatch ? Number(floorMatch[1]) : null;
    if (floorNum === 1) {
      fList.push({ label: "房間位於一樓", ratePercent: -3.5, note: "一樓多有隱私與防盜考量，市場租金普遍折讓約 3,000 円/月", level: 2, category: "floor" });
    } else if (floorNum !== null && floorNum >= 2) {
      fList.push({ label: "位於 2 樓以上", ratePercent: 2.0, note: `房間位於 ${floorNum} 樓，排除一樓潮濕與防盜顧慮之主流樓層`, level: 1, category: "floor" });
    }

    // 專有面積
    const areaNum = result.parsed.area || (() => {
      const aStr = fields?.area || "";
      const m = aStr.match(/(\d+(?:\.\d+)?)/);
      return m ? Number(m[1]) : null;
    })();
    const roomType = result.parsed.roomType;
    let hasHandledArea = false;
    if (areaNum !== null && areaNum > 0) {
      hasHandledArea = true;
      if (roomType === "ldk1") {
        if (areaNum >= 40) {
          fList.push({ label: "專有空間加成", ratePercent: 6.0, note: `專有面積 ${areaNum}㎡（寬敞 1LDK，高於平均 32㎡）`, level: 3, category: "space" });
        } else if (areaNum >= 35) {
          fList.push({ label: "專有空間加成", ratePercent: 3.5, note: `專有面積 ${areaNum}㎡（空間充裕，起居動線舒暢）`, level: 2, category: "space" });
        } else if (areaNum < 28) {
          fList.push({ label: "室內空間緊湊", ratePercent: -5.0, note: `專有面積 ${areaNum}㎡（緊湊型 1LDK/1DK）`, level: 2, category: "space" });
        }
      } else if (roomType === "ldk2") {
        if (areaNum >= 60) {
          fList.push({ label: "專有空間加成", ratePercent: 10.0, note: `專有面積 ${areaNum}㎡（寬敞 2LDK，遠高於家庭平均 48㎡）`, level: 4, category: "space" });
        } else if (areaNum >= 50) {
          fList.push({ label: "專有空間加成", ratePercent: 5.0, note: `專有面積 ${areaNum}㎡（空間充裕，獨立雙房動線）`, level: 3, category: "space" });
        } else if (areaNum < 42) {
          fList.push({ label: "室內空間緊湊", ratePercent: -6.0, note: `專有面積 ${areaNum}㎡（緊湊型 2LDK/2DK）`, level: 2, category: "space" });
        }
      } else if (roomType === "ldk3") {
        if (areaNum >= 80) {
          fList.push({ label: "專有空間加成", ratePercent: 10.0, note: `專有面積 ${areaNum}㎡（大坪數三房家庭宅，高於平均 68㎡）`, level: 4, category: "space" });
        } else if (areaNum >= 70) {
          fList.push({ label: "專有空間加成", ratePercent: 4.0, note: `專有面積 ${areaNum}㎡（空間充裕，家庭動線舒適）`, level: 2, category: "space" });
        } else if (areaNum < 60) {
          fList.push({ label: "室內空間緊湊", ratePercent: -6.0, note: `專有面積 ${areaNum}㎡（緊湊型 3LDK）`, level: 2, category: "space" });
        }
      } else {
        if (areaNum >= 25) {
          fList.push({ label: "專有空間加成", ratePercent: 6.0, note: `專有面積 ${areaNum}㎡（寬敞大套房，高於單身平均 18㎡）`, level: 3, category: "space" });
        } else if (areaNum >= 20) {
          fList.push({ label: "專有空間加成", ratePercent: 3.0, note: `專有面積 ${areaNum}㎡（空間充裕，動線舒適）`, level: 2, category: "space" });
        } else if (areaNum < 16) {
          fList.push({ label: "室內空間緊湊", ratePercent: -6.0, note: `專有面積 ${areaNum}㎡（空間緊湊精簡型套房）`, level: 2, category: "space" });
        }
      }
    }

    tags.forEach(t => {
      if (/專有面積|面積/.test(t)) {
        if (!hasHandledArea) {
          fList.push({ label: "專有空間加成", ratePercent: 8.0, note: t.replace(/^專有面積\s*/, "專有面積 "), level: 4, category: "space" });
        }
      } else if (/乾濕分離|バス・トイレ別/.test(t)) {
        fList.push({ label: "乾濕分離（BT別）", ratePercent: 3.5, note: "浴室廁所獨立分開，日本租屋市場核心剛需配置", level: 2, category: "amenity" });
      } else if (/獨立洗面|洗面台/.test(t)) {
        fList.push({ label: "獨立洗面台", ratePercent: 3.0, note: "獨立梳洗動線與鏡櫃收納，女性與單身熱門加分設備", level: 2, category: "amenity" });
      } else if (/自動門鎖|オートロック/.test(t)) {
        fList.push({ label: "防盜自動門鎖", ratePercent: 2.5, note: "オートロック 門禁門卡管制，提升獨居防犯安全性", level: 2, category: "amenity" });
      } else if (/RC造|SRC造|鋼筋/.test(t)) {
        fList.push({ label: /SRC/.test(t) ? "SRC 鋼骨鋼筋造" : "RC 鋼筋混凝土造", ratePercent: 2.0, note: "耐火耐震與優良隔音結構，居住品質遠優於木造鐵骨", level: 1, category: "structure" });
      } else if (/木造|軽量鉄骨/.test(t)) {
        fList.push({ label: "木造／輕鋼構結構", ratePercent: -10.0, note: "隔音耐震保溫次於 RC 鋼筋混凝土，但總體租金極具親民優勢", level: 4, category: "structure" });
      } else if (/網路|wifi/i.test(t)) {
        fList.push({ label: "附免費光纖網路", ratePercent: 3.5, note: "入居即享高速 Wi-Fi，免自行簽約每月現省約 4,500 円", level: 2, category: "internet" });
      } else if (/宅配/.test(t)) {
        fList.push({ label: "宅配箱", ratePercent: 1.5, note: "不在家也能安全收取包裹，現代都會生活必備配備", level: 1, category: "amenity" });
      } else if (/乾燥機|暖風/.test(t)) {
        fList.push({ label: "浴室暖風乾燥機", ratePercent: 1.5, note: "雨天花粉季可室內乾衣，冬季預先暖房並防止浴室發霉", level: 1, category: "amenity" });
      } else if (/リノベ|翻新|全面改装/.test(t)) {
        fList.push({ label: "室內現代化翻新", ratePercent: 6.0, note: "リノベーション 重新翻修，室內水電廚衛設備媲美新屋", level: 3, category: "amenity" });
      }
    });
    return fList;
  })();

  const positiveFactorsSum = result.verdict?.positiveFactorsSumPercent ?? Number(
    rentalFactors.filter(f => f.ratePercent > 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const negativeFactorsSum = result.verdict?.negativeFactorsSumPercent ?? Number(
    rentalFactors.filter(f => f.ratePercent < 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const netFactorsSum = result.verdict?.netFactorsSumPercent ?? Number(
    rentalFactors.reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const nominalDiff = result.verdict?.nominalDiffPercent ?? (result.range
    ? Number((((totalMonthlyCost - result.range.median) / Math.max(1, result.range.median)) * 100).toFixed(1))
    : 0);
  return { rentalFactors, positiveFactorsSum, negativeFactorsSum, netFactorsSum, nominalDiff };
}

export function buildRentalMarketConclusion({ result, rentalFactors, totalMonthlyCost, netFactorsSum, nominalDiff, conclusionText, cleanVerdictDetail }: { result: AnalyzeListingResult; rentalFactors: ReturnType<typeof buildRentalMarketFactors>['rentalFactors']; totalMonthlyCost: number | null; netFactorsSum: number; nominalDiff: number; conclusionText: string; cleanVerdictDetail: string }) {
  const posFactorsCount = rentalFactors.filter(f => f.ratePercent > 0).length;
  const negFactorsCount = rentalFactors.filter(f => f.ratePercent < 0).length;
  const medianRent = result.range?.median ?? 0;
  const nominalDiffYen = result.range && totalMonthlyCost ? totalMonthlyCost - medianRent : 0;
  const netDiffYen = result.range ? Math.round(medianRent * (netFactorsSum / 100)) : 0;

  const isWellSupported = nominalDiff > 0 && netFactorsSum >= nominalDiff - 1.5;
  const isOverpriced = nominalDiff > netFactorsSum + 5.0;
  const isDiscounted = nominalDiff < 0;

  const areaSqm = result.parsed?.area || (() => {
    const aStr = result.extracted?.area || "";
    const m = aStr.match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : null;
  })();
  const roomType = result.parsed?.roomType;
  const benchmarkTarget = roomType === "ldk1" ? "1LDK 平均" : roomType === "ldk2" ? "2LDK 平均" : roomType === "ldk3" ? "3LDK 平均" : "單身平均";
  const benchmarkArea = roomType === "ldk1" ? "32㎡" : roomType === "ldk2" ? "48㎡" : roomType === "ldk3" ? "68㎡" : "18㎡";
  const areaPart = areaSqm && areaSqm >= (roomType === "ldk1" ? 35 : roomType === "ldk2" ? 50 : roomType === "ldk3" ? 70 : 20)
    ? `專有面積 ${areaSqm}㎡ 高於${benchmarkTarget} ${benchmarkArea}`
    : areaSqm ? `專有面積 ${areaSqm}㎡` : "";

  const topFeatures = rentalFactors
    .filter(f => f.ratePercent > 0 && !/專有|空間|面積/.test(f.label))
    .slice(0, 3)
    .map(f => f.label)
    .join("、");
  const featureClause = [areaPart, topFeatures ? `${topFeatures}等實用配備` : ""].filter(Boolean).join("、");
  const featureNote = featureClause ? `（${featureClause}）` : "";

  const verdictConclusionText = (() => {
    if (!result.range) {
      return conclusionText || cleanVerdictDetail;
    }
    if (isWellSupported) {
      return `本案規格條件累計淨加成（+${netFactorsSum.toFixed(1)}%，換算居住價值約 +${formatYen(netDiffYen)} / 月）充分涵蓋當前月租相對區域中位數之溢價（+${nominalDiff.toFixed(1)}%，每月高出約 +${formatYen(nominalDiffYen)}）。考量硬體規格與生活便利性${featureNote}，當前租金溢價完全反映在更好的居住品質與實用機能上，開價具備充分條件支撐，定價具高度合理性（屬於物有所值的「合理溢價」）。`;
    }
    if (isOverpriced) {
      const excessPercent = (nominalDiff - netFactorsSum).toFixed(1);
      const excessYen = Math.max(0, nominalDiffYen - netDiffYen);
      return `當前每月租金相對區域中位數溢價（+${nominalDiff.toFixed(1)}%，每月高出約 +${formatYen(nominalDiffYen)}），超出目前可量化之規格優勢加成（+${netFactorsSum.toFixed(1)}%，約 +${formatYen(netDiffYen)} / 月）約 +${excessPercent}%（約 +${formatYen(excessYen)} / 月）。若該物件無其他特殊不可替代優勢（如附全套精緻家具家電、特殊景觀或額外管理服務），開價略有超額溢價，建議多比較周邊同級房源或爭取免禮金優惠。`;
    }
    if (isDiscounted) {
      return `本案每月總負擔低於同區中位數 ${Math.abs(nominalDiff).toFixed(1)}%（每月折讓約 ${formatYen(Math.abs(nominalDiffYen))}）。${netFactorsSum >= 0
          ? `在享有良好規格設備（條件加成 +${netFactorsSum.toFixed(1)}%）的同時，月額仍具價格讓利優勢，性價比極高。`
          : `租金已充分反映屋齡折舊或步程等折減，居住成本負擔合宜實惠。`
        }`;
    }
    return `本案每月總負擔與規格條件加權後之行情落點相符（溢價 ${nominalDiff.toFixed(1)}% 貼近規格淨值 +${netFactorsSum.toFixed(1)}%）。考量硬體規格與生活便利性${featureNote}，定價合宜健康。`;
  })();
  return { posFactorsCount, negFactorsCount, nominalDiffYen, netDiffYen, isWellSupported, isOverpriced, isDiscounted, verdictConclusionText };
}
