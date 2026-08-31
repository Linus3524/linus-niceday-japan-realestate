import React, { useState, useEffect } from "react";
import type { RentRate } from "../data/rentGuideData";
import { rentRates } from "../data/housingMarket";
import { MapPin, Info, Lightbulb, Layers } from "lucide-react";
import { toJapanesePlaceName, toJapanesePrefectureName } from "../lib/transit";
import { ROOM_TYPE_LABEL, ROOM_TYPE_DETAIL_LABEL, ROOM_TYPE_INCLUDES_LABEL, type RoomType } from "../lib/rentAnalysis";
import { getBuyMarketEstimate } from "../data/buyMarket";

interface RentMapProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  roomType: RoomType;
  onSelectRoomType: (type: RoomType) => void;
  mode?: "rent" | "buy";
}

interface GridNode {
  name: string;
  col: number;
  row: number;
}

// Grid mappings for all supported regions to keep the visual map feel
const regionGrids: Record<string, GridNode[]> = {
  "東京都": [
    // 多摩市部 (representing west of Tokyo, columns 0 to 3)
    { name: "小平市", col: 2, row: 0 },
    { name: "西東京市", col: 3, row: 0 },
    { name: "立川市", col: 1, row: 1 },
    { name: "三鷹市", col: 2, row: 1 },
    { name: "武藏野市", col: 3, row: 1 },
    { name: "八王子市", col: 0, row: 2 },
    { name: "府中市", col: 1, row: 2 },
    { name: "調布市", col: 2, row: 2 },
    { name: "狛江市", col: 3, row: 2 },
    { name: "日野市", col: 0, row: 3 },
    { name: "多摩市", col: 0, row: 4 },
    { name: "町田市", col: 1, row: 4 },

    // 23區 (East part of Tokyo, columns 4 to 11)
    { name: "板橋區", col: 6, row: 0 },
    { name: "北區", col: 7, row: 0 },
    { name: "足立區", col: 9, row: 0 },
    { name: "練馬區", col: 5, row: 1 },
    { name: "豐島區", col: 7, row: 1 },
    { name: "文京區", col: 8, row: 1 },
    { name: "荒川區", col: 9, row: 1 },
    { name: "葛飾區", col: 10, row: 1 },
    { name: "杉並區", col: 4, row: 2 },
    { name: "中野區", col: 6, row: 2 },
    { name: "新宿區", col: 7, row: 2 },
    { name: "千代田區", col: 8, row: 2 },
    { name: "台東區", col: 9, row: 2 },
    { name: "墨田區", col: 10, row: 2 },
    { name: "江戶川區", col: 11, row: 2 },
    { name: "世田谷區", col: 4, row: 3 },
    { name: "澀谷區", col: 6, row: 3 },
    { name: "港區", col: 7, row: 3 },
    { name: "中央區", col: 8, row: 3 },
    { name: "江東區", col: 9, row: 3 },
    { name: "目黑區", col: 5, row: 4 },
    { name: "品川區", col: 7, row: 4 },
    { name: "大田區", col: 7, row: 5 }
  ],
  "神奈川": [
    // Kawasaki (north-east next to Tokyo)
    { name: "川崎市高津區", col: 1, row: 0 },
    { name: "川崎市中原區", col: 2, row: 0 },
    { name: "川崎市川崎區", col: 3, row: 0 },
    // Northern Yokohama
    { name: "橫濱市青葉區", col: 0, row: 1 },
    { name: "橫濱市港北區", col: 1, row: 1 },
    { name: "橫濱市神奈川區", col: 2, row: 1 },
    // Central & Western Yokohama
    { name: "橫濱市戶塚區", col: 1, row: 2 },
    { name: "橫濱市西區", col: 2, row: 2 },
    { name: "橫濱市中區", col: 3, row: 2 },
    // Shonan Coast (South)
    { name: "藤澤市", col: 1, row: 3 },
    { name: "鎌倉市", col: 2, row: 3 },
    { name: "橫濱市港南區", col: 3, row: 3 }
  ],
  "埼玉": [
    // North/Central
    { name: "埼玉市大宮區", col: 2, row: 0 },
    { name: "越谷市", col: 4, row: 0 },
    // Central-South
    { name: "埼玉市中央區", col: 1, row: 1 },
    { name: "埼玉市浦和區", col: 2, row: 1 },
    { name: "草加市", col: 3, row: 1 },
    // Southern Border (East-West)
    { name: "所澤市", col: 0, row: 2 },
    { name: "朝霞市", col: 1, row: 2 },
    { name: "川口市", col: 2, row: 2 },
    { name: "八潮市", col: 3, row: 2 },
    { name: "三鄉市", col: 4, row: 2 },
    // Tokyo border edge
    { name: "和光市", col: 1, row: 3 },
    { name: "戶田市", col: 2, row: 3 }
  ],
  "千葉": [
    // North
    { name: "流山市", col: 0, row: 0 },
    { name: "柏市", col: 1, row: 0 },
    { name: "我孫子市", col: 2, row: 0 },
    // Mid-North
    { name: "松戶市", col: 0, row: 1 },
    { name: "八千代市", col: 2, row: 1 },
    // West / Tokyo Border / Central
    { name: "市川市", col: 0, row: 2 },
    { name: "船橋市", col: 1, row: 2 },
    { name: "習志野市", col: 2, row: 2 },
    { name: "千葉市花見川區", col: 3, row: 2 },
    // Bay Coast
    { name: "浦安市", col: 0, row: 3 },
    { name: "千葉市美濱區", col: 2, row: 3 },
    { name: "千葉市中央區", col: 3, row: 3 }
  ],
  "大阪": [
    // North-most
    { name: "箕面市", col: 1, row: 0 },
    { name: "高槻市", col: 3, row: 0 },
    // Hokusetsu
    { name: "豐中市", col: 1, row: 1 },
    { name: "吹田市", col: 2, row: 1 },
    { name: "枚方市", col: 4, row: 1 },
    // Osaka City North/Center/East
    { name: "大阪市淀川區", col: 1, row: 2 },
    { name: "大阪市北區", col: 2, row: 2 },
    { name: "大阪市都島區", col: 3, row: 2 },
    { name: "東大阪市", col: 4, row: 2 },
    // Osaka City South/West/East
    { name: "大阪市福島區", col: 0, row: 3 },
    { name: "大阪市西區", col: 1, row: 3 },
    { name: "大阪市中央區", col: 2, row: 3 },
    { name: "大阪市天王寺區", col: 3, row: 3 },
    { name: "八尾市", col: 4, row: 3 },
    // South
    { name: "大阪市浪速區", col: 1, row: 4 },
    { name: "堺市堺區", col: 2, row: 4 }
  ]
};

const gridConfigs: Record<string, { cols: string; maxW: string }> = {
  "東京都": { cols: "grid-cols-12", maxW: "max-w-[1080px]" },
  "神奈川": { cols: "grid-cols-5", maxW: "max-w-[520px]" },
  "埼玉": { cols: "grid-cols-5", maxW: "max-w-[520px]" },
  "千葉": { cols: "grid-cols-5", maxW: "max-w-[520px]" },
  "大阪": { cols: "grid-cols-5", maxW: "max-w-[520px]" }
};

const thresholdsConfig = {
  r1: { high: 9.5, medHigh: 8.0, mid: 6.5 },
  k1: { high: 10.5, medHigh: 8.5, mid: 7.0 },
  ldk1: { high: 17.0, medHigh: 13.0, mid: 10.0 },
  ldk2: { high: 24.0, medHigh: 17.0, mid: 13.0 },
  ldk3: { high: 34.0, medHigh: 25.0, mid: 18.0 }
};

const buyThresholdsConfig = {
  r1: { high: 2500, medHigh: 1800, mid: 1300 },
  k1: { high: 2800, medHigh: 2000, mid: 1500 },
  ldk1: { high: 4800, medHigh: 3500, mid: 2500 },
  ldk2: { high: 6800, medHigh: 5000, mid: 3500 },
  ldk3: { high: 9000, medHigh: 6800, mid: 4800 }
};

const getDistrictBuyPrice = (rate: RentRate, roomType: RoomType) => {
  const rateString = (rate[roomType] || rate.ldk2) as string;
  const rentYen = parseFloat(rateString) * 10000;
  const estimate = getBuyMarketEstimate({
    region: rate.region,
    district: rate.district,
    layout: roomType,
    monthlyRentYen: rentYen
  });
  return Math.max(Math.round(estimate.basePriceYen / 100000) * 10, 300);
};

const getDistrictBuySource = (rate: RentRate, roomType: RoomType) => {
  const rateString = (rate[roomType] || rate.ldk2) as string;
  return getBuyMarketEstimate({
    region: rate.region,
    district: rate.district,
    layout: roomType,
    monthlyRentYen: parseFloat(rateString) * 10000
  }).source;
};

export const RentMap: React.FC<RentMapProps> = ({
  selectedDistrict,
  onSelectDistrict,
  roomType,
  onSelectRoomType,
  mode = "rent"
}) => {
  const [hoveredWard, setHoveredWard] = useState<RentRate | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>("東京都");
  const [activeAreaGroup, setActiveAreaGroup] = useState<string>("關東");

  // Sync region selector when district is selected from parent (dropdown)
  useEffect(() => {
    const found = rentRates.find(r => r.district === selectedDistrict);
    if (found && found.region !== activeRegion) {
      setActiveRegion(found.region);
      setActiveAreaGroup(found.areaGroup || "其他");
    }
  }, [selectedDistrict]);

  // Helper to get rent/buy level color
  const getHeatmapStyle = (val: number, isSelected: boolean) => {
    const limits = mode === "buy" ? buyThresholdsConfig[roomType] : thresholdsConfig[roomType];
    let bg = "bg-white hover:bg-zinc-50";
    let border = "border-zinc-200";
    let text = "text-zinc-500";

    if (val >= limits.high) {
      bg = "bg-[#fee2e2] hover:bg-[#fca5a5]";
      border = "border-[#f87171]";
      text = "text-[#991b1b] font-bold";
    } else if (val >= limits.medHigh) {
      bg = "bg-[#ffedd5] hover:bg-[#fed7aa]";
      border = "border-[#fb923c]";
      text = "text-[#c2410c] font-semibold";
    } else if (val >= limits.mid) {
      bg = "bg-[#fef9c3] hover:bg-[#fef08a]";
      border = "border-[#facc15]";
      text = "text-[#854d0e] font-medium";
    } else {
      bg = "bg-[#dcfce7] hover:bg-[#bbf7d0]";
      border = "border-[#86efac]";
      text = "text-[#15803d] font-medium";
    }

    if (isSelected) {
      // Keep selection emphasis inside the tile so edge items are never clipped by the scroll viewport.
      border = "border-[#1A2A22] shadow-[2px_2px_0px_0px_rgba(26,42,34,1)] z-10 ring-2 ring-inset ring-[#1A2A22]";
    }

    return { bg, border, text };
  };

  const getRentValue = (ward: RentRate) => {
    return parseFloat(ward[roomType] || "0");
  };

  const activeGrid = regionGrids[activeRegion] || rentRates
    .filter(rate => rate.region === activeRegion)
    .map((rate, index) => ({ name: rate.district, col: index % 5, row: Math.floor(index / 5) }));
  const gridConfig = gridConfigs[activeRegion] || { cols: "grid-cols-5", maxW: "max-w-[520px]" };
  const isTokyoMap = activeRegion === "東京都";
  const availableRegions = Array.from(new Set(rentRates.map(rate => rate.region)));
  const areaGroupOrder = ["北海道", "東北", "關東", "中部", "關西", "中國", "九州"];
  const availableAreaGroups = areaGroupOrder.filter(group => rentRates.some(rate => rate.areaGroup === group));
  const visibleRegions = availableRegions.filter(region => rentRates.some(rate => rate.region === region && rate.areaGroup === activeAreaGroup));
  const regionDisplayName = toJapanesePrefectureName;
  const latestSourceDate = rentRates.reduce((latest, rate) =>
    (rate.sourceDate || "") > latest ? rate.sourceDate || latest : latest, "");

  return (
    <div className="border border-[#1A2A22] bg-white p-5 space-y-5" id="interactive-rent-map">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200 pb-3">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#1A2A22] flex items-center gap-1.5 font-sans">
            <MapPin className="w-4 h-4 text-[#00a174]" />
            <span>
              {mode === "buy"
                ? `${latestSourceDate || "最新"} 日本主要中古公寓房價概算地圖`
                : `${latestSourceDate || "最新"} 日本主要租屋市場家賃行情地圖`}
            </span>
          </h4>
          <p className="text-[10px] text-zinc-500">
            {mode === "buy"
              ? "點擊下方地圖的區塊，可自動將該區房價行情代入左側置產預算計算機中！"
              : "點擊下方地圖的區塊，可自動將該區租金行情代入左側租屋預算計算機中！"}
          </p>
        </div>

        {/* Room Type Switcher inside Map Component */}
        {/* 按鈕只放代表性格局（寫全名會讓五顆鈕在手機上擠爆），
            實際涵蓋範圍以下方說明與 title 補齊，不讓使用者誤以為只查得到 1K 與 1LDK。 */}
        <div className="flex shrink-0 bg-zinc-100 p-0.5 border border-zinc-300">
          {(["r1", "k1", "ldk1", "ldk2", "ldk3"] as const).map((type) => {
            const includesText = ROOM_TYPE_INCLUDES_LABEL[type];
            return (
              <div key={type} className="group relative">
                <button
                  onClick={() => onSelectRoomType(type)}
                  title={ROOM_TYPE_DETAIL_LABEL[type]}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                    roomType === type
                      ? "bg-white text-[#00a174] font-semibold border-b border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {ROOM_TYPE_LABEL[type]}
                </button>
                {includesText && (
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 whitespace-nowrap bg-zinc-900 text-white text-[10px] font-sans font-normal px-2 py-0.5 shadow-md rounded-xs">
                    {includesText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Area and prefecture switcher tabs */}
      <div className="grid grid-cols-4 gap-1 border border-[#DDE3DF] bg-[#F5F8F6] p-1 sm:grid-cols-7">
        {availableAreaGroups.map(group => (
          <button
            key={group}
            onClick={() => {
              setActiveAreaGroup(group);
              const firstRegion = availableRegions.find(region => rentRates.some(rate => rate.region === region && rate.areaGroup === group));
              if (!firstRegion) return;
              setActiveRegion(firstRegion);
              const firstDistrict = rentRates.find(rate => rate.region === firstRegion);
              if (firstDistrict) onSelectDistrict(firstDistrict.district);
            }}
            className={`min-h-9 px-2 text-[11px] font-bold transition-colors ${activeAreaGroup === group ? "bg-[#1A2A22] text-white" : "bg-white text-[#3F5147] hover:bg-[#e6f6f1]"}`}
          >
            {group}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 border-b border-dashed border-zinc-200 pb-3">
        {visibleRegions.map((reg) => {
          const displayName = regionDisplayName(reg);
          const isActive = activeRegion === reg;
          return (
            <button
              key={reg}
              onClick={() => {
                setActiveRegion(reg);
                // Also auto-select the first district in that region to update the calculator
                const firstDist = rentRates.find(r => r.region === reg);
                if (firstDist) {
                  onSelectDistrict(firstDist.district);
                }
              }}
              lang="ja"
              className={`font-jp px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#00a174] text-white border-[#00a174]"
                  : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Grid-based Map Layout */}
      <div className="relative overflow-x-auto px-1 py-3">
        <div className={`${isTokyoMap ? "min-w-[780px]" : "min-w-[480px]"} mx-auto select-none`}>
          {/* Main Heatmap Grid */}
          <div className={`grid ${gridConfig.cols} ${isTokyoMap ? "gap-2.5" : "gap-2"} relative ${gridConfig.maxW} mx-auto transition-all duration-300`}>
            {activeGrid.map((cell) => {
              const rateData = rentRates.find(r => r.district === cell.name);
              if (!rateData) return null;

              const val = mode === "buy" ? getDistrictBuyPrice(rateData, roomType) : getRentValue(rateData);
              const isSelected = selectedDistrict === cell.name;
              const { bg, border, text } = getHeatmapStyle(val, isSelected);

              // Grid position
              const colStyle = {
                gridColumnStart: cell.col + 1,
                gridRowStart: cell.row + 1
              };

              return (
                <div
                  key={cell.name}
                  style={colStyle}
                  onClick={() => onSelectDistrict(cell.name)}
                  onMouseEnter={() => setHoveredWard(rateData)}
                  onMouseLeave={() => setHoveredWard(null)}
                  className={`${isTokyoMap ? "h-[72px]" : "h-[56px]"} p-1 sm:p-1.5 border cursor-pointer text-center transition-all duration-150 flex flex-col justify-between rounded-none ${bg} ${border}`}
                  title={mode === "buy"
                    ? `${toJapanesePlaceName(cell.name)} - ${getDistrictBuySource(rateData, roomType) === "official_transaction" ? "交易資料" : "收益率模型"}: ${val.toLocaleString()}萬円`
                    : `${toJapanesePlaceName(cell.name)} - ${rateData.sourceDate || latestSourceDate}行情: ${val}萬円/月`}
                >
                  <div lang="ja" className="font-jp text-[9px] sm:text-[10px] font-bold leading-tight whitespace-nowrap">{toJapanesePlaceName(cell.name)}</div>
                  <div className={`text-[10px] font-mono font-bold leading-none mt-1.5 ${text}`}>
                    {mode === "buy" ? val.toLocaleString() : val.toFixed(1)} <span className="text-[8px] font-sans">萬</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Legend & Interactive Tooltip Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-dashed border-zinc-200 pt-4 font-sans text-xs">
        {/* Color Legend */}
        <div className="md:col-span-5 space-y-2">
              <span className="font-bold text-zinc-700 block text-[11px] tracking-wider">
            {mode === "buy" ? "房價（預估總價）熱力圖例：" : "房租熱力圖例："}
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fee2e2] border border-[#f87171]" />
              <span>
                {mode === "buy" 
                  ? `極高房價 (≥ ${buyThresholdsConfig[roomType].high} 萬円)` 
                  : `極高預算 (≥ ${thresholdsConfig[roomType].high} 萬円)`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#ffedd5] border border-[#fb923c]" />
              <span>
                {mode === "buy"
                  ? `中高房價 (${buyThresholdsConfig[roomType].medHigh} ~ ${buyThresholdsConfig[roomType].high - 1} 萬円)`
                  : `中高預算 (${thresholdsConfig[roomType].medHigh} ~ ${(thresholdsConfig[roomType].high - 0.1).toFixed(1)} 萬円)`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fef9c3] border border-[#facc15]" />
              <span>
                {mode === "buy"
                  ? `中等房價 (${buyThresholdsConfig[roomType].mid} ~ ${buyThresholdsConfig[roomType].medHigh - 1} 萬円)`
                  : `中等預算 (${thresholdsConfig[roomType].mid} ~ ${(thresholdsConfig[roomType].medHigh - 0.1).toFixed(1)} 萬円)`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#dcfce7] border border-[#86efac]" />
              <span>
                {mode === "buy"
                  ? `實惠房價 (＜ ${buyThresholdsConfig[roomType].mid} 萬円)`
                  : `實惠預算 (＜ ${thresholdsConfig[roomType].mid} 萬円)`}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Details (Hover or Selected Ward) */}
        <div className="md:col-span-7 bg-[#F5F8F6] p-3 border border-zinc-200 flex flex-col justify-between min-h-[60px]">
          {hoveredWard || rentRates.find(r => r.district === selectedDistrict) ? (
            (() => {
              const activeWard = hoveredWard || rentRates.find(r => r.district === selectedDistrict)!;
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center border-b border-zinc-300 pb-1">
                    <span className="font-bold text-[#00a174] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00a174] shrink-0" />
                      <span lang="ja" className="font-jp">{toJapanesePlaceName(activeWard.district)}</span>
                      {hoveredWard ? (
                        <span className="text-[9px] bg-zinc-800 text-white px-1 py-0.5 font-normal tracking-normal scale-90">預覽中</span>
                      ) : (
                        <span className="text-[9px] bg-[#00a174] text-white px-1 py-0.5 font-normal tracking-normal scale-90">已選定</span>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {mode === "buy"
                        ? getDistrictBuySource(activeWard, roomType) === "official_transaction" ? "國交省交易資料" : "租金收益率總價模型"
                        : `${activeWard.sourceDate || latestSourceDate} 家賃相場`}
                    </span>
                  </div>
                  {/* 使用簡短格局標籤，Hover 時顯示群組實際涵蓋範圍（例如包含 1DK）。 */}
                  <div className="grid grid-cols-5 gap-1 text-center font-mono">
                    {(["r1", "k1", "ldk1", "ldk2", "ldk3"] as const).map(type => {
                      const isActive = roomType === type;
                      const includesText = ROOM_TYPE_INCLUDES_LABEL[type];
                      const priceVal = mode === "buy" ? getDistrictBuyPrice(activeWard, type).toLocaleString() : (activeWard[type] || activeWard.ldk2);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onSelectRoomType(type)}
                          title={ROOM_TYPE_DETAIL_LABEL[type]}
                          className={`group relative bg-white py-1.5 px-1 border cursor-pointer transition-all ${
                            isActive
                              ? "border-[#00a174] ring-1 ring-[#00a174]/20 bg-[#F1F6F3]"
                              : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                          }`}
                        >
                          <div className={`text-[11px] font-medium font-sans leading-tight ${isActive ? "text-[#00a174] font-semibold" : "text-zinc-500"}`}>
                            {ROOM_TYPE_LABEL[type]}
                          </div>
                          <div className={`text-xs font-semibold leading-tight ${isActive ? "text-[#00a174]" : "text-zinc-800"}`}>
                            {priceVal}
                            <span className={`mt-0.5 block text-[10px] font-normal ${isActive ? "text-[#00a174]" : "text-zinc-500"}`}>萬円</span>
                          </div>

                          {/* Hover 浮動提示標籤 */}
                          {includesText && (
                            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 whitespace-nowrap bg-zinc-900 text-white text-[10px] font-sans font-normal px-2 py-0.5 shadow-md rounded-xs">
                              {includesText}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 h-full justify-center">
              <Info className="w-4 h-4" />
              <span className="text-[11px]">將滑鼠游標移到地圖上，可在此看該區 5 種格局群組行情！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
