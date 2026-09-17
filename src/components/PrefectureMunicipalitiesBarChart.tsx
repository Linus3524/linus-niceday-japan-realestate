import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { FileText, Info, ArrowUpDown } from "lucide-react";
import type { MunicipalCrimeItem } from "../lib/municipalCrimeBreakdown";

export interface PrefectureMunicipalitiesBarChartProps {
  prefecture: string;
  area: string;
  count: number;
  ratePerThousand: number;
  rank: number;
  totalAreas: number;
  prefectureAverageRate: number;
  items: readonly MunicipalCrimeItem[] | MunicipalCrimeItem[];
  gradeStyle: {
    accent: string;
    text: string;
    border: string;
    bg: string;
  };
  year: number;
}

/** 簡稱轉換函式（去除郡名、政令市前綴與尾碼，保留 1-4 字元高辨識度名稱） */
export function formatPrefectureMunicipalityShortName(name: string): string {
  let s = name
    .normalize("NFKC")
    .replace(/區/g, "区")
    .replace(/^[^\s]+郡/, ""); // 去除郡名如「足柄上郡」
  if (s.includes("市") && (s.endsWith("区") || s.includes("区"))) {
    const parts = s.split("市");
    s = parts[parts.length - 1]; // 例如「横浜市鶴見区」->「鶴見区」
  }
  const base = s.replace(/(区|市|町|村)$/, "");
  // 單字如「北」「港」「中」「西」「南」保留「北区」「中区」以利識別
  if (base.length <= 1) {
    return s;
  }
  return base;
}

/** 乾淨化區市町村名稱（處理全形半形、繁簡「區/区」、標準都道府県前綴） */
export function cleanMunicipality(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/區/g, "区")
    .replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, "")
    .replace(/^[^\s]+郡/, "")
    .trim();
}

/** 比對名稱是否為同一個區市町村（精確比對為主，政令市區名為輔） */
export function isMatchMunicipality(itemArea: string, targetArea: string): boolean {
  const n1 = cleanMunicipality(itemArea);
  const n2 = cleanMunicipality(targetArea);
  if (n1 === n2) return true;
  // 若一方只傳了政令市的區名（例如「中央区」與「千葉市中央区」）
  if (n2.length >= 2 && (n1.endsWith(n2) || n2.endsWith(n1))) {
    if (n1.includes("市") && n1.endsWith("区") && n2.endsWith("区")) {
      return true;
    }
  }
  return false;
}

export function PrefectureMunicipalitiesBarChart({
  prefecture,
  area,
  count,
  ratePerThousand,
  rank,
  totalAreas,
  prefectureAverageRate,
  items: rawItems,
  gradeStyle,
  year,
}: PrefectureMunicipalitiesBarChartProps) {
  // 排序模式：預設比率由少至多（直觀看出分布與平均線位置），亦可切換為官方行政順序
  const [sortMode, setSortMode] = useState<"rate" | "official">("rate");
  const [hoveredItem, setHoveredItem] = useState<{
    area: string;
    count: number;
    ratePerThousand: number;
    rank: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetBarRef = useRef<HTMLDivElement>(null);

  // 府縣道簡稱詞首
  const prefPrefix = prefecture.endsWith("府")
    ? "府內"
    : prefecture.includes("北海道")
    ? "道內"
    : "縣內";

  // 計算各項名次與排序列表
  const processedData = useMemo(() => {
    // 依每千人犯罪率由少至多排序（愈少愈安全，排在最前）
    const sortedByRate = [...rawItems].sort((a, b) => a.ratePerThousand - b.ratePerThousand);

    const displayItems =
      sortMode === "rate"
        ? sortedByRate
        : [...rawItems]; // 官方行政順序

    const maxRate = Math.max(...rawItems.map((i) => i.ratePerThousand), 1);
    // 保留頂部 14% 的餘裕給標籤與 callout，避免最高長條頂天被切斷
    const maxScale = Math.max(Math.ceil(maxRate * 1.15), 5);

    return {
      items: displayItems.map((item) => ({
        ...item,
        isTarget: isMatchMunicipality(item.area, area),
      })),
      maxRate,
      maxScale,
      average: prefectureAverageRate > 0 ? prefectureAverageRate : 5.0,
    };
  }, [rawItems, sortMode, area, prefectureAverageRate]);

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
    ratePerThousand,
    rank,
  };

  const diffWithAverage = Math.round((activeDisplay.ratePerThousand - processedData.average) * 100) / 100;
  const targetShort = formatPrefectureMunicipalityShortName(area);
  const innerWidth = Math.max(520, processedData.items.length * 12);

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
      {/* 標題與控制列 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
          <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: gradeStyle.accent }} />
          <span>全{prefecture} {totalAreas} 區市町村刑法犯統計</span>
        </div>

        {/* 右側圖例與切換排序 */}
        <div className="flex items-center gap-2 text-[10px]">
          {/* 本區標示 */}
          <span
            className="flex items-center gap-1 font-bold"
            style={{ color: gradeStyle.text }}
          >
            <span>◆</span>
            <span>{targetShort} 每千人 {ratePerThousand.toFixed(1)} 件</span>
          </span>

          {/* 平均線圖例 */}
          <span className="flex items-center gap-1 font-semibold text-[#DC2626]">
            <span className="inline-block w-2.5 border-t border-dashed border-[#EF4444]" />
            <span>{prefPrefix}平均 {processedData.average.toFixed(1)} 件</span>
          </span>

          {/* 排序切換按鈕 */}
          <button
            type="button"
            onClick={() => setSortMode((s) => (s === "rate" ? "official" : "rate"))}
            className="flex items-center gap-1 border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[9px] font-medium text-[#66736C] transition-colors hover:border-[#66736C] hover:text-[#1A2A22]"
            title="切換直條圖排序方式"
          >
            <ArrowUpDown className="h-2.5 w-2.5" />
            <span>{sortMode === "rate" ? "由少至多" : "行政順序"}</span>
          </button>
        </div>
      </div>

      {/* 直條圖卡片本體：嚴格限制在卡片寬度內 (max-w-full overflow-hidden) */}
      <div className="relative w-full min-w-0 max-w-full overflow-hidden border border-[#DDE3DF] bg-[#FAFCFB] p-2 pt-3 pb-1">
        {/* 滑動與定位提示 */}
        <div className="flex items-center justify-between pb-1.5 text-[9px] text-[#8A9590]">
          <span>左右滑動可對照全{prefecture} {totalAreas} 區市町村</span>
          <span className="font-medium text-[#1A2A22]">已優先顯示{targetShort}</span>
        </div>

        {/* 捲動容器：動態寬度，採用嚴格 N 欄 CSS Grid，長條與文字 100% 絕對垂直鎖定對齊 */}
        <div
          ref={scrollContainerRef}
          className="relative w-full max-w-full overflow-x-auto scrollbar-thin"
        >
          <div
            className="relative shrink-0 pb-1"
            style={{ width: `${innerWidth}px` }}
          >
            {/* 圖表主要長條區（高度 128px） */}
            <div className="relative h-32 w-full">
              {/* 紅色虛線：全府縣各區市町村平均基準線（1px 俐落細虛線，z-30） */}
              <div
                className="pointer-events-none absolute inset-x-0 z-30 flex items-center transition-all duration-300"
                style={{ bottom: `${avgBottomPercent}%` }}
              >
                <div className="w-full border-t border-dashed border-[#EF4444]" />
              </div>

              {/* N 個市區町村向上直條 Grid */}
              <div
                className="grid h-full w-full gap-[2px] items-end"
                style={{
                  gridTemplateColumns: `repeat(${processedData.items.length}, minmax(0, 1fr))`,
                }}
              >
                {processedData.items.map((item) => {
                  const heightPercent =
                    processedData.maxScale > 0
                      ? (item.ratePerThousand / processedData.maxScale) * 100
                      : 0;
                  // 0 件時保留 1.5px 微底線刻度，便於懸停查看
                  const barHeight = Math.max(item.ratePerThousand === 0 ? 1.5 : 2.5, heightPercent);
                  const shortName = formatPrefectureMunicipalityShortName(item.area);

                  return (
                    <div
                      key={item.area}
                      ref={item.isTarget ? targetBarRef : undefined}
                      onMouseEnter={() =>
                        setHoveredItem({
                          area: item.area,
                          count: item.count,
                          ratePerThousand: item.ratePerThousand,
                          rank: item.rank,
                        })
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
                            style={{ backgroundColor: gradeStyle.accent }}
                          >
                            {shortName} {item.ratePerThousand.toFixed(1)}件
                          </span>
                          <span
                            className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent"
                            style={{ borderTopColor: gradeStyle.accent }}
                          />
                        </div>
                      )}

                      {/* 懸停非本區時的臨時氣泡標籤 */}
                      {!item.isTarget && hoveredItem?.area === item.area && (
                        <div className="pointer-events-none absolute -top-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center whitespace-nowrap">
                          <span className="rounded-[2px] bg-[#1A2A22] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            {shortName} {item.ratePerThousand.toFixed(1)}件
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
                          backgroundColor: item.isTarget ? gradeStyle.accent : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X 軸下方名稱文字：與上方直條使用完全一致的 Grid 與 gap，確保 100% 垂直對齊無漂移 */}
            <div
              className="mt-1 grid w-full gap-[2px] pt-0.5"
              style={{
                gridTemplateColumns: `repeat(${processedData.items.length}, minmax(0, 1fr))`,
              }}
            >
              {processedData.items.map((item) => {
                const shortName = formatPrefectureMunicipalityShortName(item.area);
                return (
                  <div
                    key={item.area}
                    onMouseEnter={() =>
                      setHoveredItem({
                        area: item.area,
                        count: item.count,
                        ratePerThousand: item.ratePerThousand,
                        rank: item.rank,
                      })
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
                        color: item.isTarget ? gradeStyle.accent : undefined,
                      }}
                      title={`${item.area}：每千人 ${item.ratePerThousand.toFixed(1)} 件（全年 ${item.count.toLocaleString()} 件，第 ${item.rank} 名）`}
                    >
                      {shortName}
                    </span>
                    {/* 本區下方箭頭標示 */}
                    {item.isTarget && (
                      <span
                        className="mt-0.5 text-[8px] font-black leading-none"
                        style={{ color: gradeStyle.accent }}
                      >
                        ▲
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部互動資訊條 */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#DDE3DF] pt-1.5 text-[10px] text-[#66736C]">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#1A2A22]">{activeDisplay.area}</span>
            <span>每千人刑法犯</span>
            <span className="font-bold text-[#1A2A22]">{activeDisplay.ratePerThousand.toFixed(1)} 件</span>
            <span className="text-[#8A9590]">（全年共 {activeDisplay.count.toLocaleString()} 件，第 {activeDisplay.rank} / {totalAreas} 名）</span>
          </div>
          <div className="font-medium">
            {diffWithAverage === 0 ? (
              <span className="text-[#66736C]">等於{prefPrefix}平均</span>
            ) : diffWithAverage > 0 ? (
              <span className="text-[#D97706]">高於{prefPrefix}平均 +{diffWithAverage.toFixed(1)} 件</span>
            ) : (
              <span className="text-[#00A174]">低於{prefPrefix}平均 {Math.abs(diffWithAverage).toFixed(1)} 件</span>
            )}
          </div>
        </div>
      </div>

      {/* 資料備註說明 */}
      <div className="flex items-start gap-1.5 pt-0.5 text-[11px] leading-relaxed text-[#3F5147]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00A174]" />
        <span>本統計採用官方 {year} 年{prefecture}市區町村全罪種認知件數與人口換算；第 1 名代表每千人案件最少。</span>
      </div>
    </div>
  );
}
