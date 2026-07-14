import React, { useState, useEffect } from "react";
import { rentRates, RentRate } from "../data/rentGuideData";
import { MapPin, Info } from "lucide-react";

interface RentMapProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  roomType: "r1" | "k1" | "ldk1" | "ldk2";
  onSelectRoomType: (type: "r1" | "k1" | "ldk1" | "ldk2") => void;
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
  "神奈川": { cols: "grid-cols-5", maxW: "max-w-[620px]" },
  "埼玉": { cols: "grid-cols-5", maxW: "max-w-[620px]" },
  "千葉": { cols: "grid-cols-5", maxW: "max-w-[620px]" },
  "大阪": { cols: "grid-cols-5", maxW: "max-w-[620px]" }
};

const thresholdsConfig = {
  r1: { high: 9.5, medHigh: 8.0, mid: 6.5 },
  k1: { high: 10.5, medHigh: 8.5, mid: 7.0 },
  ldk1: { high: 17.0, medHigh: 13.0, mid: 10.0 },
  ldk2: { high: 24.0, medHigh: 17.0, mid: 13.0 }
};

const buyThresholdsConfig = {
  r1: { high: 2500, medHigh: 1800, mid: 1300 },
  k1: { high: 2800, medHigh: 2000, mid: 1500 },
  ldk1: { high: 4800, medHigh: 3500, mid: 2500 },
  ldk2: { high: 6800, medHigh: 5000, mid: 3500 }
};

const getDistrictBuyPrice = (rate: RentRate, roomType: "r1" | "k1" | "ldk1" | "ldk2") => {
  const rateString = rate[roomType] as string;
  const rentYen = parseFloat(rateString) * 10000;
  const annualRent = rentYen * 12;
  
  const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(rate.district);
  const isTokyo23 = rate.region === "東京都" && !isTama;
  
  let baseYield = 0.05;
  if (isTokyo23) {
    baseYield = 0.040;
  } else if (rate.region === "東京都") {
    baseYield = 0.054;
  } else if (rate.region === "神奈川") {
    baseYield = 0.048;
  } else if (rate.region === "大阪") {
    baseYield = 0.052;
  } else if (rate.region === "埼玉" || rate.region === "千葉") {
    baseYield = 0.058;
  }
  
  if (roomType === "ldk1") {
    baseYield -= 0.002;
  } else if (roomType === "ldk2") {
    baseYield -= 0.004;
  } else if (roomType === "r1") {
    baseYield += 0.002;
  }
  
  const basePrice = annualRent / baseYield;
  return Math.max(Math.round(basePrice / 100000) * 10, 300);
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

  // Sync region selector when district is selected from parent (dropdown)
  useEffect(() => {
    const found = rentRates.find(r => r.district === selectedDistrict);
    if (found && found.region !== activeRegion) {
      setActiveRegion(found.region);
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
      // Keep the background heat color, but apply a strong thick black border via ring + shadow + scale without reducing content area
      border = "border-[#1A2A22] shadow-[3px_3px_0px_0px_rgba(26, 42, 34,1)] scale-[1.06] z-10 ring-2 ring-[#1A2A22]";
    }

    return { bg, border, text };
  };

  const getRentValue = (ward: RentRate) => {
    return parseFloat(ward[roomType] || "0");
  };

  const activeGrid = regionGrids[activeRegion] || regionGrids["東京都"];
  const gridConfig = gridConfigs[activeRegion] || gridConfigs["東京都"];

  return (
    <div className="border border-[#1A2A22] bg-white p-5 space-y-5" id="interactive-rent-map">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200 pb-3">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#1A2A22] flex items-center gap-1.5 font-sans">
            <MapPin className="w-4 h-4 text-[#0F8F6D]" />
            <span>
              {mode === "buy"
                ? "2026 關東/關西熱門區域房價行情地圖 (SUUMO/HOME'S & 實價登錄最新推估)"
                : "2026 關東/關西熱門區域家賃行情地圖 (SUUMO/HOME'S 最新租金)"}
            </span>
          </h4>
          <p className="text-[10px] text-zinc-500">
            💡 {mode === "buy"
              ? "點擊下方地圖的區塊，可自動將該區房價行情代入左側置產預算計算機中！"
              : "點擊下方地圖的區塊，可自動將該區租金行情代入左側租房預算計算機中！"}
          </p>
        </div>

        {/* Room Type Switcher inside Map Component */}
        <div className="flex bg-zinc-100 p-0.5 border border-zinc-300">
          {(["r1", "k1", "ldk1", "ldk2"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onSelectRoomType(type)}
              className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                roomType === type
                  ? "bg-white text-[#0F8F6D] border-b border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {type === "r1" ? "1R" : type === "k1" ? "1K" : type === "ldk1" ? "1LDK" : "2LDK"}
            </button>
          ))}
        </div>
      </div>

      {/* Region Switcher Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-dashed border-zinc-200 pb-3">
        {["東京都", "神奈川", "埼玉", "千葉", "大阪"].map((reg) => {
          const displayName = reg === "東京都" ? "東京都" :
                              reg === "神奈川" ? "神奈川縣" :
                              reg === "埼玉" ? "埼玉縣" :
                              reg === "千葉" ? "千葉縣" : "大阪府";
          
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
              className={`px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#0F8F6D] text-white border-[#0F8F6D]"
                  : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Grid-based Map Layout */}
      <div className="relative overflow-x-auto py-2">
        <div className="min-w-[780px] mx-auto select-none">
          {/* Main Heatmap Grid */}
          <div className={`grid ${gridConfig.cols} gap-2.5 relative ${gridConfig.maxW} mx-auto transition-all duration-300`}>
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
                  className={`p-1 sm:p-1.5 border cursor-pointer text-center transition-all duration-150 flex flex-col justify-between h-[72px] rounded-none ${bg} ${border}`}
                  title={mode === "buy" ? `${cell.name} - 2026行情: ${val.toLocaleString()}萬円` : `${cell.name} - 2026行情: ${val}萬円/月`}
                >
                  <div className="text-[9px] sm:text-[10px] font-bold leading-tight whitespace-nowrap">{cell.name}</div>
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
            {mode === "buy" ? "🎌 2026 房價（預估總價）熱力圖例：" : "🎌 2026 房租熱力圖例："}
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
                    <span className="font-bold text-[#0F8F6D] flex items-center gap-1">
                      <span>📍 {activeWard.district}</span>
                      {hoveredWard ? (
                        <span className="text-[9px] bg-zinc-800 text-white px-1 py-0.5 font-normal tracking-normal scale-90">預覽中</span>
                      ) : (
                        <span className="text-[9px] bg-[#0F8F6D] text-white px-1 py-0.5 font-normal tracking-normal scale-90">已選定</span>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {mode === "buy" ? "2026年 預估中古公寓總價" : "2026年 家賃相場"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono">
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1R (套房)</div>
                      <div className="text-xs font-bold text-zinc-800">
                        {mode === "buy" ? getDistrictBuyPrice(activeWard, "r1").toLocaleString() : activeWard.r1} 萬円
                      </div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200 ring-1 ring-[#0F8F6D]/10">
                      <div className="text-[9px] text-[#0F8F6D] font-sans font-bold">1K/1DK</div>
                      <div className="text-xs font-bold text-[#0F8F6D]">
                        {mode === "buy" ? getDistrictBuyPrice(activeWard, "k1").toLocaleString() : activeWard.k1} 萬円
                      </div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1LDK</div>
                      <div className="text-xs font-bold text-zinc-800">
                        {mode === "buy" ? getDistrictBuyPrice(activeWard, "ldk1").toLocaleString() : activeWard.ldk1} 萬円
                      </div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">2LDK</div>
                      <div className="text-xs font-bold text-zinc-800">
                        {mode === "buy" ? getDistrictBuyPrice(activeWard, "ldk2").toLocaleString() : activeWard.ldk2} 萬円
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 h-full justify-center">
              <Info className="w-4 h-4" />
              <span className="text-[11px]">將滑鼠游標移到地圖上，可在此看該區 4 種房型完整平均行情！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
