import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { FileText, Info, ArrowUpDown } from "lucide-react";
import {
  TOKYO_MUNICIPALITY_BURGLARY_DATA,
  formatMunicipalityShortName,
  type TokyoMunicipalityBurglaryItem,
} from "../data/tokyoMunicipalityBurglaryData";

export interface TokyoMunicipalitiesBarChartProps {
  area: string;
  count: number;
  rank: number;
  total: number;
  averageCount: number;
  items?: readonly TokyoMunicipalityBurglaryItem[] | TokyoMunicipalityBurglaryItem[];
  residentialStyle: {
    accent: string;
    text: string;
    border: string;
    bg: string;
  };
  chocho: string;
  homeCount: number;
}

/** 比對名稱是否為同一個區市町村（相容繁簡日字、有無後綴） */
function isMatchMunicipality(itemArea: string, targetArea: string): boolean {
  const norm = (s: string) =>
    s
      .replace(/區/g, "区")
      .replace(/^西多摩郡/, "")
      .replace(/^三宅島/, "")
      .replace(/^八丈島/, "")
      .replace(/(区|市|町|村)$/, "")
      .trim();
  const n1 = norm(itemArea);
  const n2 = norm(targetArea);
  return n1 === n2 || itemArea.includes(targetArea) || targetArea.includes(itemArea);
}

export function TokyoMunicipalitiesBarChart({
  area,
  count,
  rank,
  total,
  averageCount,
  items: propItems,
  residentialStyle,
  chocho,
  homeCount,
}: TokyoMunicipalitiesBarChartProps) {
  // 排序模式：預設件數由少至多（直觀看出分布與平均線位置），亦可切換為官方行政順序
  const [sortMode, setSortMode] = useState<"count" | "official">("count");
  const [hoveredItem, setHoveredItem] = useState<{
    area: string;
    count: number;
    rank: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetBarRef = useRef<HTMLDivElement>(null);

  // 資料源：優先使用 props 傳入的項目，無則 fallback 靜態 59 區市町村快照
  const rawItems = propItems && propItems.length > 0 ? propItems : TOKYO_MUNICIPALITY_BURGLARY_DATA;

  // 計算各項名次與排序列表
  const processedData = useMemo(() => {
    // 依件數計算名次（件數愈少名次愈前）
    const sortedByCount = [...rawItems].sort((a, b) => a.count - b.count);
    const rankMap = new Map<string, number>();
    sortedByCount.forEach((item) => {
      // 若件數相同，給同一個名次（第一個出現的位置 + 1）
      const firstSameIndex = sortedByCount.findIndex((x) => x.count === item.count);
      rankMap.set(item.area, firstSameIndex + 1);
    });

    const displayItems =
      sortMode === "count"
        ? sortedByCount
        : [...rawItems]; // 官方行政順序（23區 -> 多摩市部 -> 郡町村）

    const maxCount = Math.max(...rawItems.map((i) => i.count), 1);
    // 保留頂部 14% 的餘裕給標籤與 callout，避免最高長條頂天被切斷
    const maxScale = Math.max(Math.ceil(maxCount * 1.15), 20);

    return {
      items: displayItems.map((item) => ({
        ...item,
        rank: rankMap.get(item.area) ?? 1,
        isTarget: isMatchMunicipality(item.area, area),
      })),
      maxCount,
      maxScale,
      average: averageCount > 0 ? averageCount : 17.5,
    };
  }, [rawItems, sortMode, area, averageCount]);

  // 優先滾動至目標行政區所在位置（精確以 getBoundingClientRect 居中）
  const scrollToTarget = useCallback(() => {
    if (!scrollContainerRef.current || !targetBarRef.current) return;
    const container = scrollContainerRef.current;
    const target = targetBarRef.current;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const currentDiff = targetRect.left - containerRect.left;
    const centerOffset = container.clientWidth / 2 - target.clientWidth / 2;
    const scrollDelta = currentDiff - centerOffset;

    container.scrollTo({
      left: Math.max(0, container.scrollLeft + scrollDelta),
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToTarget();
    const t1 = setTimeout(scrollToTarget, 80);
    const t2 = setTimeout(scrollToTarget, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scrollToTarget, sortMode, area, processedData]);

  const avgBottomPercent = Math.min(92, Math.max(8, (processedData.average / processedData.maxScale) * 100));

  // 當前檢視的項目（Hover 優先，預設為本案所在區）
  const activeDisplay = hoveredItem ?? {
    area,
    count,
    rank,
  };

  const diffWithAverage = activeDisplay.count - processedData.average;

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
      {/* 標題與控制列 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
          <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: residentialStyle.accent }} />
          <span>全東京 59 區市町村住宅侵入統計</span>
        </div>

        {/* 右側圖例與切換排序 */}
        <div className="flex items-center gap-2 text-[10px]">
          {/* 本區標示 */}
          <span
            className="flex items-center gap-1 font-bold"
            style={{ color: residentialStyle.text }}
          >
            <span>◆</span>
            <span>{area} {count} 件</span>
          </span>

          {/* 平均線圖例 */}
          <span className="flex items-center gap-1 font-semibold text-[#DC2626]">
            <span className="inline-block w-2.5 border-t border-dashed border-[#EF4444]" />
            <span>都內平均 {processedData.average.toFixed(1)} 件</span>
          </span>

          {/* 排序切換按鈕 */}
          <button
            type="button"
            onClick={() => setSortMode((s) => (s === "count" ? "official" : "count"))}
            className="flex items-center gap-1 border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[9px] font-medium text-[#66736C] transition-colors hover:border-[#66736C] hover:text-[#1A2A22]"
            title="切換直條圖排序方式"
          >
            <ArrowUpDown className="h-2.5 w-2.5" />
            <span>{sortMode === "count" ? "由少至多" : "行政順序"}</span>
          </button>
        </div>
      </div>

      {/* 直條圖卡片本體：嚴格限制在卡片寬度內 (max-w-full overflow-hidden) */}
      <div className="relative w-full min-w-0 max-w-full overflow-hidden border border-[#DDE3DF] bg-[#FAFBFA] p-2 pt-3 pb-1">
        {/* 滑動與定位提示 */}
        <div className="flex items-center justify-between pb-1.5 text-[9px] text-[#8A9590]">
          <span>左右滑動可對照全東京 59 區市町村</span>
          <span className="font-medium text-[#1A2A22]">已優先顯示{area}</span>
        </div>

        {/* 捲動容器：固定 680px 寬度，採用嚴格 59 欄 CSS Grid，長條與文字 100% 絕對垂直鎖定對齊 */}
        <div
          ref={scrollContainerRef}
          className="relative w-full max-w-full overflow-x-auto scrollbar-thin"
        >
          <div className="relative w-[680px] shrink-0 pb-1">
            {/* 圖表主要長條區（高度 128px） */}
            <div className="relative h-32 w-full">
              {/* 紅色虛線：都內各區平均基準線（1px 俐落細虛線，z-30） */}
              <div
                className="pointer-events-none absolute inset-x-0 z-30 flex items-center transition-all duration-300"
                style={{ bottom: `${avgBottomPercent}%` }}
              >
                <div className="w-full border-t border-dashed border-[#EF4444]" />
              </div>

              {/* 59 個市區町村向上直條 Grid */}
              <div className="grid h-full w-full grid-cols-[repeat(59,minmax(0,1fr))] gap-[2px] items-end">
                {processedData.items.map((item) => {
                  const heightPercent =
                    processedData.maxScale > 0
                      ? (item.count / processedData.maxScale) * 100
                      : 0;
                  // 0 件時保留 2px 微底線刻度，便於懸停查看
                  const barHeight = Math.max(item.count === 0 ? 1.5 : 2.5, heightPercent);

                  return (
                    <div
                      key={item.area}
                      ref={item.isTarget ? targetBarRef : undefined}
                      onMouseEnter={() =>
                        setHoveredItem({ area: item.area, count: item.count, rank: item.rank })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative flex flex-col items-center justify-end h-full cursor-pointer min-w-0 ${
                        item.isTarget ? "z-20" : "z-10 hover:z-25"
                      }`}
                    >
                      {/* 本區頂端突顯氣泡標籤（一眼看見該區，z-40 最高層級） */}
                      {item.isTarget && (
                        <div className="pointer-events-none absolute -top-7 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center whitespace-nowrap">
                          <span
                            className="rounded-[2px] px-1.5 py-0.5 text-[9px] font-black tracking-tight text-white shadow-md"
                            style={{ backgroundColor: residentialStyle.accent }}
                          >
                            {formatMunicipalityShortName(item.area)} {item.count}件
                          </span>
                          <span
                            className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent"
                            style={{ borderTopColor: residentialStyle.accent }}
                          />
                        </div>
                      )}

                      {/* 懸停非本區時的臨時氣泡標籤 */}
                      {!item.isTarget && hoveredItem?.area === item.area && (
                        <div className="pointer-events-none absolute -top-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center whitespace-nowrap">
                          <span className="rounded-[2px] bg-[#1A2A22] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            {formatMunicipalityShortName(item.area)} {item.count}件
                          </span>
                          <span className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent border-t-[#1A2A22]" />
                        </div>
                      )}

                      {/* 直條本體 */}
                      <div
                        className={`w-full rounded-t-[1px] transition-all duration-150 ${
                          item.isTarget
                            ? "ring-1 ring-[#1A2A22]/20"
                            : "bg-[#DDE3DF] group-hover:bg-[#94A3B8]"
                        }`}
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: item.isTarget ? residentialStyle.accent : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X 軸下方名稱文字：與上方直條使用完全一致的 59 欄 Grid 與 gap，確保 100% 垂直對齊無漂移 */}
            <div className="mt-1 grid w-full grid-cols-[repeat(59,minmax(0,1fr))] gap-[2px] pt-0.5">
              {processedData.items.map((item) => (
                <div
                  key={item.area}
                  onMouseEnter={() =>
                    setHoveredItem({ area: item.area, count: item.count, rank: item.rank })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex flex-col items-center justify-start cursor-pointer group min-w-0"
                >
                  <span
                    className={`select-none text-[8.5px] leading-tight tracking-tighter transition-colors ${
                      item.isTarget
                        ? "font-black"
                        : "font-normal text-[#8A9590] group-hover:text-[#1A2A22]"
                    }`}
                    style={{
                      writingMode: "vertical-rl",
                      color: item.isTarget ? residentialStyle.accent : undefined,
                    }}
                    title={`${item.area}：全年 ${item.count} 件（第 ${item.rank} 名）`}
                  >
                    {formatMunicipalityShortName(item.area)}
                  </span>
                  {/* 本區下方箭頭標示 */}
                  {item.isTarget && (
                    <span
                      className="mt-0.5 text-[8px] font-black leading-none"
                      style={{ color: residentialStyle.accent }}
                    >
                      ▲
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部互動資訊條 */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#DDE3DF] pt-1.5 text-[10px] text-[#66736C]">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#1A2A22]">{activeDisplay.area}</span>
            <span>全年住宅侵入</span>
            <span className="font-bold text-[#1A2A22]">{activeDisplay.count} 件</span>
            <span className="text-[#8A9590]">（排名第 {activeDisplay.rank} / 59 區市町村）</span>
          </div>
          <div className="font-medium">
            {diffWithAverage === 0 ? (
              <span className="text-[#66736C]">等於都內平均</span>
            ) : diffWithAverage > 0 ? (
              <span className="text-[#D97706]">高於都內平均 +{diffWithAverage.toFixed(1)} 件</span>
            ) : (
              <span className="text-[#00A174]">低於都內平均 {Math.abs(diffWithAverage).toFixed(1)} 件</span>
            )}
          </div>
        </div>
      </div>

      {/* 微觀町丁目對照說明（保留原有的本物件所在町丁目 0 件資訊） */}
      <div className="flex items-start gap-1.5 pt-0.5 text-[11px] leading-relaxed text-[#3F5147]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00A174]" />
        <span>本物件所在之「{chocho}」全年為 {homeCount} 件。</span>
      </div>
    </div>
  );
}
