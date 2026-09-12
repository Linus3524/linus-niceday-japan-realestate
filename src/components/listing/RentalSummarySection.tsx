import {
Coins
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';

interface RentalSummarySectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "totalMonthlyCost"
    | "rent"
    | "extracted"
    | "managementFee"
    | "parsed"
    | "displayArea"
    | "displayStructure"
    | "stationItems"
    | "equipmentList"
  >;
}

export function RentalSummarySection({ model }: RentalSummarySectionProps) {
  const {
    totalMonthlyCost,
    rent,
    extracted,
    managementFee,
    parsed,
    displayArea,
    displayStructure,
    stationItems,
    equipmentList,
  } = model;
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
        <Coins className="h-4 w-4 text-[#007D5A]" />
        <span>每月租金與租賃條件</span>
      </div>
      <span className="text-[10px] text-[#66736C]">
        每月實付總額與基本租賃規格明細
      </span>
    </div>

    {/* 3 大金額重點卡片 */}
    <div className="grid gap-3 sm:grid-cols-3">
      {/* 每月總額（核心重點） */}
      <div className="border-2 border-[#1A2A22] bg-[#F8FAFC] p-4">
        <p className="text-[11px] font-bold text-[#1A2A22]">每月總負擔（總賃料）</p>
        <p className="mt-1 text-2xl font-black text-[#1A2A22]">
          {formatYen(totalMonthlyCost)}
          <span className="text-xs font-normal text-[#66736C]"> / 月</span>
        </p>
        <p className="mt-1 text-[10px] text-[#66736C]">房租 ＋ 管理費每月實付總額</p>
      </div>

      {/* 純房租 */}
      <div className="border border-[#DDE3DF] bg-white p-4">
        <p className="text-[11px] font-bold text-[#66736C]">純租金（賃料／家賃）</p>
        <p className="mt-1 text-2xl font-black text-[#1A2A22]">
          {formatYen(rent)}
          <span className="text-xs font-normal text-[#66736C]"> / 月</span>
        </p>
        <p className="mt-1 text-[10px] text-[#66736C]">圖紙標示：{extracted?.rent || "—"}</p>
      </div>

      {/* 管理費／共益費 */}
      <div className="border border-[#DDE3DF] bg-white p-4">
        <p className="text-[11px] font-bold text-[#66736C]">管理費／共益費</p>
        <p className="mt-1 text-2xl font-black text-[#1A2A22]">
          {managementFee > 0 ? formatYen(managementFee) : "0 円"}
          <span className="text-xs font-normal text-[#66736C]"> / 月</span>
        </p>
        <p className="mt-1 text-[10px] text-[#66736C]">
          {managementFee > 0 ? `圖紙標示：${extracted?.managementFee || "—"}` : "已包含於租金中或免管理費"}
        </p>
      </div>
    </div>

    {/* 物件基本規格明細清單 */}
    <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-4">
      <p className="mb-3 text-xs font-bold text-[#1A2A22]">物件規格與契約條件</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[#66736C]">禮金（礼金）</dt>
          <dd className="font-bold text-[#1A2A22]">
            {parsed?.keyMoney === 0 ? "0 個月（免禮金）" : (extracted?.keyMoney || "無標示")}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">敷金（押金）</dt>
          <dd className="font-bold text-[#1A2A22]">
            {parsed?.deposit === 0 ? "0 個月（免押金）" : (extracted?.deposit || "無標示")}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">格局（間取り）</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.layout || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">專有面積</dt>
          <dd className="font-bold text-[#1A2A22]">
            {displayArea || "未於圖面載明"}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">屋齡／建築年月</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.age || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">樓層／總階數</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.floor || "—"}</dd>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <dt className="text-[#66736C]">建物構造</dt>
          <dd className="font-bold text-[#1A2A22]">
            {displayStructure || "未於圖面載明"}
          </dd>
        </div>
      </dl>

      {/* 交通資訊・最寄り駅路線與徒步（分開獨立列點、標記所屬線路） */}
      {stationItems.length > 0 && (
        <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A2A22]">最寄り駅・各路線徒步時間</span>
            <span className="text-[10px] text-[#66736C]">
              共確認 {stationItems.length} 個利用車站
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stationItems.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex flex-wrap items-center gap-2 border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs shadow-2xs"
              >
                {item.lineName && (
                  <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-bold text-[#1A2A22]">
                    {item.lineName}
                  </span>
                )}
                <span className="font-bold text-[#1A2A22]">{item.stationName} 駅</span>
                {item.walkMin !== null ? (
                  <span className="text-xs text-[#3F5147]">
                    徒歩 <span className="font-bold text-[#007D5A]">{item.walkMin}</span> 分
                  </span>
                ) : (
                  <span className="text-xs text-[#66736C]">徒步時間未標註</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 圖紙確認設備與公設規格 */}
      {equipmentList.length > 0 && (
        <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1A2A22]">圖紙設備與建物規格</span>
              <span className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-medium text-[#007D5A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#007D5A]" />
                綠底：影響行情與生活品質的關鍵設備
              </span>
            </div>
            <span className="text-[10px] text-[#66736C]">
              共確認 {equipmentList.length} 項圖面設備
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[...equipmentList]
              .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
              .map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${item.highlight
                      ? "border-[#9EE2CF] bg-[#E6F6F1] font-bold text-[#007D5A]"
                      : "border-[#DDE3DF] bg-white text-[#3F5147]"
                    }`}
                  title={item.note ? `${item.nameZh}（${item.note}） 原文：${item.rawJa}` : `原文：${item.rawJa}`}
                >
                  <span className={item.highlight ? "font-bold text-[#007D5A]" : "text-[#8A9590]"}>✓</span>
                  <span>{item.nameZh}</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  </div>);
}
