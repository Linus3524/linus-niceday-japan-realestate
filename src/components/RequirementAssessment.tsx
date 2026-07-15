import { ClipboardCheck } from "lucide-react";
import { buildMarketReality, type RentRecommendation, type RentSearchCriteria } from "../lib/rentAnalysis";

type Difficulty = "條件合理" | "需要取捨" | "難度高" | "資料不足";

interface AssessmentRow {
  category: string;
  detail: string;
  difficulty: Difficulty;
  explanation: string;
}

const roomLabel = (roomType: RentSearchCriteria["roomType"]) => ({
  r1: "1R",
  k1: "1K／1DK",
  ldk1: "1LDK／2K／2DK",
  ldk2: "2LDK"
}[roomType]);

const yen = (value: number) => `${Math.round(value / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const badgeStyle: Record<Difficulty, string> = {
  "條件合理": "border-[#A8D5C2] bg-[#EAF3EE] text-[#0A6D52]",
  "需要取捨": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "資料不足": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]"
};

function buildRows(criteria: RentSearchCriteria, recommendations: RentRecommendation[]): AssessmentRow[] {
  const withinBudget = recommendations.filter(item => item.fit === "預算內").length;
  const lowest = Math.min(...recommendations.map(item => item.rangeLow));
  const highest = Math.max(...recommendations.map(item => item.rangeHigh));
  const location = [
    ...(criteria.districts || []), criteria.district,
    criteria.line,
    ...(criteria.stations || []).map(station => `${station}站`),
    criteria.station ? `${criteria.station}站` : null,
    criteria.commuteStation ? `通勤至 ${criteria.commuteStation}${criteria.commuteMinutes ? `・${criteria.commuteMinutes} 分鐘內` : ""}` : criteria.locationPreference
  ].filter(Boolean).join("・");
  const equipment = [
    criteria.washbasin ? "獨立洗面台" : null,
    criteria.bidet ? "免治馬桶" : null,
    criteria.elevator ? "電梯" : null,
    criteria.autoLock ? "一樓自動門" : null,
    criteria.balcony ? "陽台" : null,
    criteria.gasBurnersMin ? `瓦斯爐 ${criteria.gasBurnersMin} 口以上` : null,
    criteria.freeInternet ? "免費網路" : null,
    criteria.lpGasAccepted ? "可接受 LP 瓦斯" : null,
    criteria.cityGasRequired ? "都市瓦斯指定" : null,
    criteria.furnished ? "家具家電" : null,
    criteria.tower ? "塔樓住宅" : null
  ].filter(Boolean) as string[];

  const closestEstimate = recommendations.length ? Math.min(...recommendations.map(item => item.estimate)) : null;
  const budgetGapRatio = criteria.maxBudget && closestEstimate ? (closestEstimate - criteria.maxBudget) / criteria.maxBudget : null;
  const budgetDifficulty: Difficulty = !criteria.maxBudget
    ? "資料不足"
    : withinBudget > 0
      ? "條件合理"
      : budgetGapRatio !== null && budgetGapRatio <= 0.1
        ? "需要取捨"
        : "難度高";
  const areaThreshold = criteria.roomType === "ldk2" ? 50 : criteria.roomType === "ldk1" ? 35 : 25;
  const areaDifficulty: Difficulty = criteria.areaMin && criteria.areaMin >= areaThreshold ? "需要取捨" : "條件合理";
  
  // Real estate market logic: Premium equipment (Auto-lock, separate vanity, washlet, multiple burners, etc.)
  // is standard configuration in larger layouts (1LDK / 2LDK or larger).
  const isLargeLayout = criteria.roomType === "ldk1" || criteria.roomType === "ldk2";
  const adjustedMaxCount = isLargeLayout ? 6 : 4;
  const adjustedMidCount = isLargeLayout ? 3 : 2;
  const equipmentDifficulty: Difficulty = criteria.tower
    ? "難度高"
    : equipment.length >= adjustedMaxCount
      ? "難度高"
      : equipment.length >= adjustedMidCount
        ? "需要取捨"
        : equipment.length
          ? "條件合理"
          : "資料不足";

  return [
    {
      category: "身份簽證",
      detail: criteria.visaType ? `${criteria.visaType}${criteria.visaYears ? `・在留期間 ${criteria.visaYears} 年` : ""}` : "未提供簽證資料",
      difficulty: criteria.visaType ? "條件合理" : "資料不足",
      explanation: criteria.analysisNotes?.visa || (criteria.visaType
        ? `已具備進一步準備租屋申請的基本資訊。接下來請備妥在留卡、護照，以及能說明工作與收入的文件；實際送件資料會依物件與保證公司要求調整。`
        : `請先補上簽證類型、在留期限與工作狀態，才能判斷應優先準備僱傭資料、薪資資料或財力文件，避免看中房源後才發現無法送件。`)
    },
    {
      category: "期望預算",
      detail: criteria.maxBudget ? `每月上限 ¥${yen(criteria.maxBudget)}${criteria.budgetIncludesFees === true ? "（含管理費）" : criteria.budgetIncludesFees === false ? "（不含管理費）" : "（是否含管理費未確認）"}` : "未指定月租上限",
      difficulty: budgetDifficulty,
      explanation: `${buildMarketReality(criteria, recommendations)}${recommendations.length ? ` 本次六個方向的整體參考區間約為 ¥${yen(lowest)}～¥${yen(highest)}。` : ""}`
    },
    {
      category: "地點交通",
      detail: location || "未指定線路、車站或行政區",
      difficulty: location ? (recommendations.some(item => item.station || item.lines.length) ? "條件合理" : "需要取捨") : "資料不足",
      explanation: criteria.analysisNotes?.location || (location
        ? `目前會以指定範圍作為找房主軸${criteria.commuteStation ? `，並優先兼顧前往 ${criteria.commuteStation}${criteria.commuteMinutes ? `、約 ${criteria.commuteMinutes} 分鐘內` : ""}的通勤便利性` : ""}。若租金超出預算，請先保留最重要的通勤方向，再擴大相鄰車站與可接受行政區，選擇會增加得最明顯。`
        : `請至少提供上班地點或一條偏好的鐵路線；有明確通勤目的地後，才能排除租金便宜但每天移動負擔過高的區域。`)
    },
    {
      category: "周邊機能",
      detail: criteria.nearbyAmenity ? `${criteria.nearbyAmenity}${criteria.amenityWalkMinutes ? `步行 ${criteria.amenityWalkMinutes} 分鐘內` : ""}` : "未指定生活機能",
      difficulty: criteria.nearbyAmenity ? "需要取捨" : "資料不足",
      explanation: criteria.analysisNotes?.amenity || (criteria.nearbyAmenity
        ? `這項需求合理，但會在最後篩選階段淘汰部分地址。建議先找到租金與通勤合適的候選物件，再逐間確認實際步行路線、營業時間與店鋪規模。`
        : `可補充最常使用的生活設施，例如超市、醫院或學校，並只保留一至兩項真正需要每天使用的條件，避免房源範圍縮得過小。`)
    },
    {
      category: "格局面積",
      detail: `${roomLabel(criteria.roomType)}${criteria.areaMin ? `・${criteria.areaMin}㎡以上` : "・面積未指定"}`,
      difficulty: areaDifficulty,
      explanation: criteria.analysisNotes?.layout || (criteria.areaMin
        ? `${roomLabel(criteria.roomType)} 與 ${criteria.areaMin}㎡以上必須同時符合，選擇會比只指定格局更少。若預算壓力偏高，可比較縮小面積、改看 1DK，或保留格局但移往相鄰車站，確認哪一種取捨最能接受。`
        : `建議補上真正能接受的最低面積。同樣格局可能有很大的室內大小差異，只看房型容易低估實際租金。`)
    },
    {
      category: "建物條件",
      detail: [criteria.structure, criteria.buildingAgeMax ? `屋齡 ${criteria.buildingAgeMax} 年內` : null, criteria.floorMin ? `${criteria.floorMin} 樓以上` : null].filter(Boolean).join("・") || "未限制結構、屋齡或樓層",
      difficulty: criteria.buildingAgeMax && criteria.buildingAgeMax <= 5 ? "難度高" : criteria.buildingAgeMax && criteria.buildingAgeMax <= 10 ? "需要取捨" : "條件合理",
      explanation: criteria.analysisNotes?.building || (criteria.buildingAgeMax || criteria.structure || criteria.floorMin
        ? `結構、屋齡與樓層疊加後會排除不少物件。若這些都是必要條件，就需要接受較高租金；若預算固定，建議優先放寬屋齡，再比較翻新狀況、隔音與管理品質。`
        : `目前建物選擇較有彈性。實際看房時可優先比較隔音、耐震、翻新狀況與公共區域管理，不必只用新舊判斷居住品質。`)
    },
    {
      category: "步行距離",
      detail: criteria.walkMinutes ? `車站步行 ${criteria.walkMinutes} 分鐘內` : "未限制車站步行時間",
      difficulty: criteria.walkMinutes && criteria.walkMinutes <= 5 ? "難度高" : criteria.walkMinutes && criteria.walkMinutes <= 10 ? "需要取捨" : "條件合理",
      explanation: criteria.analysisNotes?.walking || (criteria.walkMinutes
        ? `${criteria.walkMinutes} 分鐘內屬於通勤方便的範圍，熱門車站附近通常租金更高、競爭也更快。預算不足時，建議與設備、屋齡及車站範圍一起放寬，而不是只調整其中一項。`
        : `請設定每天真的願意走的時間上限。完全不限制雖然房源較多，但可能得到租金合適、實際通勤卻無法長期接受的結果。`)
    },
    {
      category: "設備條件",
      detail: equipment.length ? equipment.join("・") : "未指定特殊設備",
      difficulty: equipmentDifficulty,
      explanation: criteria.analysisNotes?.equipment || (equipment.length
        ? `目前有 ${equipment.length} 項設備要求。${
            isLargeLayout
              ? "由於您選擇了 1LDK 或更寬敞的格局，這類物件在市場上普遍將獨立洗面台、自動門、免治馬桶、2口瓦斯爐等項目列為標準配備，因此即使設備條件較多，在 1LDK / 2LDK 中的尋找難度也會顯著降低。"
              : "同時滿足所有項目會明顯減少小坪數單身房源（如 1R/1K）的選擇。建議分成「入住必須」與「有最好」兩組，預算不足時優先捨棄後者。"
          }${criteria.lpGasAccepted ? " 接受 LP 瓦斯可能增加選擇，但請一併比較每月瓦斯費。" : ""}${criteria.cityGasRequired ? " 若堅持都市瓦斯，請把它視為必要篩選條件並接受房源數量下降。" : ""}`
        : `目前設備選擇較有彈性。建議先列出兩至三項真正不能少的設備，其餘保留彈性，會比完全不設條件更容易有效比較房源。`)
    },
    {
      category: "寵物與特殊條件",
      detail: criteria.petsAllowed ? `可養${criteria.petType || "寵物"}` : "未指定寵物條件",
      difficulty: criteria.petsAllowed ? "難度高" : "條件合理",
      explanation: criteria.analysisNotes?.special || (criteria.petsAllowed
        ? `可養貓是本次找房的重要限制，房源會明顯變少，也可能增加敷金或清潔費。若確實會帶貓入住，這項不能妥協；應改從提高預算、擴大地區、放寬屋齡與設備著手。`
        : `目前沒有寵物限制，可保留較多選擇。若未來可能飼養寵物，請在申請前提出，不能入住後再自行飼養。`)
    }
  ];
}

export function RequirementAssessment({ criteria, recommendations }: {
  criteria: RentSearchCriteria;
  recommendations: RentRecommendation[];
}) {
  const rows = buildRows(criteria, recommendations);

  return (
    <section className="mt-6 border border-[#1A2A22] bg-white" aria-labelledby="requirement-assessment-title">
      <div className="border-b border-[#1A2A22] bg-[#F5F8F6] p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[#0F8F6D]" />
          <h4 id="requirement-assessment-title" className="text-base font-bold text-[#1A2A22]">綜合評估報告</h4>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[#66736C] font-sans">逐項看懂哪些條件容易實現、哪些需要提高預算或重新取捨</p>
      </div>
      <div className="divide-y divide-[#DDE3DF]">
        {rows.map(row => (
          <div key={row.category} className="p-4 font-sans">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-[#1A2A22]">{row.category}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#3F5147]">{row.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeStyle[row.difficulty]}`}>{row.difficulty}</span>
            </div>
            <p className="mt-2 border-l-2 border-[#A8D5C2] pl-2 text-[10px] leading-relaxed text-[#66736C]">{row.explanation}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-[#DDE3DF] bg-[#FAFCFB] p-3 text-[9px] leading-relaxed text-[#8A9590] font-sans">難度是搜尋條件的相對評估，不代表保證有空室或通過入居審査；實際結果仍以當下募集物件、管理公司與房東審査為準。</p>
    </section>
  );
}
