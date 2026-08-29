import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RentSearchCriteria } from "../lib/rentAnalysis";
import { ROOM_TYPE_LABEL } from "../lib/rentAnalysis";
import { criteriaTagStyle } from "../lib/criteriaTagStyles";

type SummaryItem = {
  label: string;
  category: keyof typeof criteriaTagStyle;
};

const unique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));

const formatMan = (value: number) =>
  (value / 10000).toLocaleString("zh-TW", { maximumFractionDigits: 1 });

const stationLabel = (station: string) => `${station.replace(/[駅站]$/, "")}站`;

export function RentCriteriaSummary({ criteria }: { criteria: RentSearchCriteria }) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => setExpanded(true), [criteria]);

  const districts = unique([...(criteria.districts || []), criteria.district]);
  const lines = unique([...(criteria.lines || []), criteria.line]);
  const stations = unique([...(criteria.stations || []), criteria.station]);
  const commuteName = criteria.commuteStation?.replace(/[駅站]$/, "");

  // 所有條件依色系連續排列，不再分核心／其他或加入第二層分類。
  const primaryItems: SummaryItem[] = [
    { label: ROOM_TYPE_LABEL[criteria.roomType], category: "layout" },
    criteria.areaMin && { label: `${criteria.areaMin}㎡以上`, category: "layout" as const },
    criteria.structure && { label: criteria.structure, category: "layout" as const },
    criteria.buildingAgeMax && { label: `屋齡 ${criteria.buildingAgeMax} 年內`, category: "layout" as const },
    criteria.maxBudget && {
      label: criteria.minBudget
        ? `月租 ${formatMan(criteria.minBudget)}～${formatMan(criteria.maxBudget)} 萬円`
        : `月租 ${formatMan(criteria.maxBudget)} 萬円內`,
      category: "budget" as const
    },
    criteria.initialCostBudget && { label: `初期 ${formatMan(criteria.initialCostBudget)} 萬円`, category: "budget" as const },
    districts.length && { label: districts.join("・"), category: "transport" as const },
    commuteName && {
      label: criteria.commuteMinutes ? `${commuteName}通勤 ${criteria.commuteMinutes} 分內` : `通勤至${commuteName}`,
      category: "transport" as const
    }
  ].filter(Boolean) as SummaryItem[];

  const locationItems: SummaryItem[] = [
    ...lines.map(label => ({ label, category: "transport" as const })),
    ...stations.map(label => ({ label: stationLabel(label), category: "transport" as const })),
    criteria.walkMinutes && { label: `步行 ${criteria.walkMinutes} 分內`, category: "transport" as const }
  ].filter(Boolean) as SummaryItem[];

  const equipmentItems: SummaryItem[] = [
    criteria.floorMin && { label: `${criteria.floorMin} 樓以上`, category: "equipment" as const },
    criteria.washbasin && { label: "獨立洗面台", category: "equipment" as const },
    criteria.bidet && { label: "免治馬桶", category: "equipment" as const },
    criteria.separateBath && { label: "衛浴分離", category: "equipment" as const },
    criteria.autoLock && { label: "自動門", category: "equipment" as const },
    criteria.elevator && { label: "電梯", category: "equipment" as const },
    criteria.balcony && { label: "陽台", category: "equipment" as const },
    criteria.furnished && { label: "家具家電", category: "equipment" as const },
    criteria.freeInternet && { label: "免費網路", category: "equipment" as const },
    criteria.gasBurnersMin && { label: `爐具 ${criteria.gasBurnersMin} 口以上`, category: "equipment" as const },
    criteria.cityGasRequired && { label: "都市瓦斯", category: "equipment" as const },
    criteria.lpGasAccepted && { label: "可接受 LP 瓦斯", category: "equipment" as const },
    criteria.tower && { label: "塔樓大廈", category: "equipment" as const }
  ].filter(Boolean) as SummaryItem[];

  const specialItems: SummaryItem[] = [
    criteria.petsAllowed && { label: criteria.petType ? `可養${criteria.petType}` : "可養寵物", category: "special" as const },
    criteria.noKeyMoney && { label: "免禮金", category: "special" as const },
    criteria.noDeposit && { label: "免押金", category: "special" as const },
    ...(criteria.otherNeeds || []).map(label => ({ label, category: "special" as const }))
  ].filter(Boolean) as SummaryItem[];

  const renderChip = (item: SummaryItem, index: number) => (
    <span key={`${item.category}-${item.label}-${index}`} className={`border px-2 py-0.5 text-[10px] font-bold ${criteriaTagStyle[item.category]}`}>
      {item.label}
    </span>
  );

  const allItems = [...primaryItems, ...locationItems, ...equipmentItems, ...specialItems];
  const groups = [
    { label: "房型與預算", items: allItems.filter(item => item.category === "layout" || item.category === "budget") },
    { label: "地點與交通", items: allItems.filter(item => item.category === "transport") },
    { label: "設備與建物", items: allItems.filter(item => item.category === "equipment") },
    { label: "特殊條件", items: allItems.filter(item => item.category === "special") }
  ].filter(group => group.items.length > 0);

  return (
    <div className="mb-4 font-sans">
      <button
        type="button"
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between border-y border-[#DDE3DF] py-2 text-left text-[10px] font-bold text-[#52635A] transition-colors hover:text-[#007D5A]"
      >
        <span>搜尋條件・共 {allItems.length} 項</span>
        <span className="inline-flex items-center gap-1">
          {expanded ? "收起" : "展開"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>
      {expanded && (
        <div className="space-y-2.5 pt-3">
          {groups.map(group => (
            <div key={group.label} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-3">
              <span className="pt-0.5 text-[9px] font-bold text-[#7A8580]">{group.label}</span>
              <div className="flex flex-wrap gap-1.5">{group.items.map(renderChip)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
