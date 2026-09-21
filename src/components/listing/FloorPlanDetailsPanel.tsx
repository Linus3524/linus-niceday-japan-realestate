import React from "react";
import { Home, Droplets, Archive, Sun, Compass } from "lucide-react";
import {
  parseFloorPlanDetails,
  groupFloorPlanItems,
  type FloorPlanCategory,
  type FloorPlanItem
} from "../../lib/floorPlanDetails";

/**
 * 空間分類樣式設定
 * 統一採用全站品牌主綠 #00A174，維持極致乾淨與視覺一致性。
 */
const CATEGORY_STYLES: Record<
  FloorPlanCategory,
  {
    shortName: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }
> = {
  居室空間: { shortName: "居室", icon: Home },
  水區設備: { shortName: "水區", icon: Droplets },
  收納空間: { shortName: "收納", icon: Archive },
  戶外空間: { shortName: "戶外", icon: Sun },
  其他標註: { shortName: "其他", icon: Compass },
};

function FloorPlanChip({ item }: { item: FloorPlanItem }) {
  const tooltipText = item.note
    ? `${item.nameZh}：${item.note}（日文：${item.rawJa}）`
    : `日文圖面標記：${item.rawJa}`;

  return (
    <div
      className="inline-flex items-center gap-1.5 border border-[#DDE3DF] bg-white px-2 py-1 text-[11px] transition-colors hover:border-[#00A174]"
      title={tooltipText}
    >
      {item.floor && (
        <span className="shrink-0 bg-[#F5F8F6] px-1 py-0.5 text-[10px] font-bold text-[#3F5147]">
          {item.floor}
        </span>
      )}

      <span className="font-bold text-[#1A2A22]">{item.nameZh}</span>

      {item.size && (
        <span className="shrink-0 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-bold text-[#00A174]">
          {item.size}
        </span>
      )}

      {item.rawJa !== item.nameZh && (
        <span lang="ja" className="font-jp text-[10px] text-[#8A9590]">
          ({item.rawJa})
        </span>
      )}
    </div>
  );
}

/**
 * 格局圖標註的緊湊呈現。
 *
 * 嚴格對齊全站 Design Specifications：
 * 1. 【純直角矩形】：絕無任何 rounded 圓角，全站維持純直角俐落風格。
 * 2. 【標準灰階】：
 *    - 主文字：#1A2A22（ink）
 *    - 次文字：#3F5147（ink-soft）
 *    - 說明註解：#66736C（ink-note）
 *    - 原文弱化：#8A9590（ink-mute）
 *    - 邊框標準：#DDE3DF（line）
 *    - 內部分隔：#ECEFEC（line-soft）
 *    - 淺底交替：#FAFCFB（bg-subtle）
 * 3. 【緊湊行內標籤】：高度縮減 65%，不佔版面，中日文字清晰分離。
 */
export function FloorPlanDetailsPanel({
  raw,
  showDisclaimer = true,
}: {
  raw?: string | null;
  showDisclaimer?: boolean;
}) {
  const items = parseFloorPlanDetails(raw);

  if (!items.length) {
    if (!raw) return null;
    return (
      <div className="mt-3 border-t border-[#DDE3DF] pt-2.5 text-xs leading-relaxed">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="font-bold text-xs text-[#1A2A22]">格局圖分析</span>
          {showDisclaimer && (
            <span className="text-[10px] text-[#66736C]">
              依圖紙辨識；實際尺寸與設備以管理方資料為準。
            </span>
          )}
        </div>
        <p className="whitespace-pre-line break-words text-[#3F5147]">{raw}</p>
      </div>
    );
  }

  const groups = groupFloorPlanItems(items);

  return (
    <div className="mt-3 border-t border-[#DDE3DF] pt-2.5 text-xs leading-relaxed">
      {/* 標題欄：左側標題與計數，右側微型免責聲明（無 icon，對齊右上） */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-[#1A2A22]">格局圖空間解析</span>
          <span className="text-[10px] text-[#8A9590]">（共 {items.length} 項標註）</span>
        </div>
        {showDisclaimer && (
          <span className="text-[10px] text-[#66736C]">
            依圖紙辨識；實際尺寸與設備以管理方資料為準。
          </span>
        )}
      </div>

      {/* 緊湊行內分組列表：純直角矩形、標準 line 邊框與 line-soft 分隔 */}
      <div className="divide-y divide-[#ECEFEC] border border-[#DDE3DF] bg-[#FAFCFB]">
        {groups.map(group => {
          const style = CATEGORY_STYLES[group.category];
          const CategoryIcon = style.icon;
          return (
            <div
              key={group.category}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 sm:px-3 sm:py-1.5"
            >
              {/* 左側分類徽章：精緻圖示 ＋ 標題 ＋ 數量 */}
              <div className="flex shrink-0 items-center gap-1.5 sm:w-20">
                <CategoryIcon className="h-3.5 w-3.5 shrink-0 text-[#00A174]" />
                <span className="font-bold text-[11px] text-[#1A2A22]">
                  {style.shortName}
                </span>
                <span className="text-[10px] text-[#8A9590]">
                  ({group.items.length})
                </span>
              </div>

              {/* 右側項目膠囊標籤雲 */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {group.items.map(item => (
                  <FloorPlanChip key={item.key} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
