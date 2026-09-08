import {
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  FileText,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { buildSpecialSaleDetails, parseRevenueCalculationBasis, type SpecialSaleFields } from "../lib/specialSaleAnalysis";
import { consumerListingFields } from "../lib/consumerListingText";
import { getSpecialSaleMarketComparison } from "../data/specialSaleMarket";
import { MLIT_API_CREDIT } from "../data/marketDataSources";
import { parseAgeYears, parseSalePrice } from "../lib/listingExtraction";

const sectionTitleClass =
  "listing-section-title flex items-center gap-2";

export function SpecialSaleReport({ fields: sourceFields }: { fields: SpecialSaleFields }) {
  const fields = consumerListingFields(sourceFields);
  const d = buildSpecialSaleDetails(fields);
  if (!d.excludeCondoComparison) return null;

  const rows = [
    ...(fields.priceDetails ? [["售價（版本與稅金範圍）", fields.priceDetails]] : []),
    ["土地面積／私道負擔", fields.landArea || "未載明，待查謄本"],
    [
      d.kind === "land" ? "現存建物面積" : "建物總面積／各樓層",
      fields.buildingArea || (d.kind === "land" ? "" : fields.area) || "未載明",
    ],
    ["接道與建築限制", fields.roadDetails || "未載明，需核對道路及建築資料"],
    ...(fields.buildingCondition ? [["建物完成／新舊記載", fields.buildingCondition]] : []),
    ...(fields.unitBreakdown ? [["用途與戶數組成", fields.unitBreakdown]] : []),
    ...(fields.optionalFacilities ? [["停車／選配設施", fields.optionalFacilities]] : []),
    ["年度稅額原文", fields.taxDetails || "圖紙未載明年度稅額，其他稅費數字屬概算"],
  ];

  const propertyCautions = d.kind === "land"
    ? [
        "單價按土地面積計算；現存建物面積未載明時保留未知。",
        "土地稅費、拆除與整地費須另行確認。",
        "道路寬度、接道長度、私道與退縮面積須分別核對，不能僅憑圖紙判定可重建。",
      ]
    : [
        "售價按建物面積換算的單價不等於建物單獨估值，需核對土地權利與價款分配。",
        "修繕、保險與稅費需自行編列；未載管理費不代表持有成本為零。",
        "道路寬度、接道長度、私道與退縮面積須分別核對，不能僅憑圖紙判定可重建。",
      ];
  const renovation = presentRenovation(fields.renovationDetails);
  const handoverDate = presentHandoverDate(fields.handoverDetails);
  const otherConditions = presentOtherConditions(fields.specialNotes);
  const revenueDetails = parseRevenueCalculationBasis(fields.revenueDetails || fields.annualIncome);
  const revenueScope = presentRevenueScope(fields.revenueScope);
  const salePriceYen = parseSalePrice(fields.salePrice);
  const comparison = (d.kind === "detached" || d.kind === "land") && salePriceYen
    ? getSpecialSaleMarketComparison({
        kind: d.kind,
        address: fields.address,
        salePriceYen,
        areaSqm: d.kind === "land" ? d.landAreaSqm : d.buildingAreaSqm,
        ageYears: parseAgeYears(fields.age || fields.buildingCondition),
      })
    : null;

  return (
    <section aria-label="特殊買賣物件分析" className="space-y-5">
      {(d.kind === "detached" || d.kind === "land") && (
        <div className="space-y-3">
          <h3 className={sectionTitleClass}>
            <TrendingUp className="h-4 w-4" />
            同類物件價格定位
          </h3>
          {comparison ? (
            <div className="border border-[#DDE3DF] bg-white">
              <div className="grid sm:grid-cols-3">
                <MarketMetric label="本案開價" value={salePriceYen!} note={d.kindLabel} primary />
                <MarketMetric className="border-t border-[#DDE3DF] sm:border-l sm:border-t-0" label="國交省同類成交基準" value={comparison.officialPriceYen} note={`${comparison.market}・${comparison.areaBand}・${comparison.officialPeriod}・${comparison.officialSampleCount}筆${comparison.ageControlled ? "・同屋齡帶" : ""}`} href={comparison.officialSourceUrl} />
                <MarketMetric className="border-t border-[#DDE3DF] sm:border-l sm:border-t-0" label="At Home 公開刊登基準" value={comparison.listingPriceYen} note={comparison.listingPriceYen ? `${comparison.market}・${comparison.areaBand}・快照 ${comparison.listingPeriod}` : "同區同面積帶未提供刊登相場"} href={comparison.listingSourceUrl} />
              </div>
              <div className="border-t border-[#DDE3DF] px-4 py-3 text-xs leading-relaxed text-[#3F5147]">
                <strong className={comparison.verdict === "above" ? "text-[#B13818]" : "text-[#007D5A]"}>
                  {comparison.verdict === "above" ? "高於同類成交參考區間" : comparison.verdict === "below" ? "低於同類成交參考區間" : "落在同類成交參考區間"}
                </strong>
                <span>（約 {Math.round(comparison.fairLowYen / 10_000).toLocaleString()}～{Math.round(comparison.fairHighYen / 10_000).toLocaleString()} 萬円）。本案較國交省基準{comparison.saleVsOfficialPercent >= 0 ? "高" : "低"} {Math.abs(comparison.saleVsOfficialPercent)}%</span>
                {comparison.saleVsListingPercent !== null && <span>，較 At Home 刊登基準{comparison.saleVsListingPercent >= 0 ? "高" : "低"} {Math.abs(comparison.saleVsListingPercent)}%</span>}。
                <span className="text-[#66736C]">{d.kind === "land" ? " 土地以每㎡成交單價校準本案面積。" : " 戶建以土地建物合計成交價按建物面積正規化；仍須另核對土地形狀、接道及建物狀況。"}</span>
              </div>
              <p className="border-t border-[#DDE3DF] px-4 py-2 text-[9px] leading-relaxed text-[#7A8780]">{MLIT_API_CREDIT}</p>
            </div>
          ) : (
            <div className="border border-[#DDE3DF] bg-white px-4 py-3 text-xs text-[#66736C]">
              地址、面積或同區合格樣本不足，暫不作價格高低判定。
            </div>
          )}
        </div>
      )}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h3 className={`${sectionTitleClass} shrink-0`}>
            <Building2 className="h-4 w-4" />
            {d.kindLabel}・物件條件
          </h3>
          <p className="border-[#D6DDD9] text-xs leading-relaxed text-[#3F5147] sm:border-l sm:pl-4">
            {d.marketNote}
          </p>
        </div>

        <div className="overflow-hidden border border-[#DDE3DF] bg-white">
          <dl className="grid sm:grid-cols-2">
            {rows.map(([label, value], index) => (
              <div
                key={label}
                className={`grid min-w-0 border-[#DDE3DF] sm:grid-cols-[minmax(8rem,0.72fr)_minmax(0,1.55fr)] ${
                  index === 1 ? "border-t sm:border-l sm:border-t-0" : index >= 2 ? "border-t" : ""
                } ${index > 1 && index % 2 === 1 ? "sm:border-l" : ""}`}
              >
                <dt className="bg-[#F5F8F6] px-3 py-2.5 text-[11px] leading-relaxed text-[#58685F]">
                  {label}
                </dt>
                <dd className="whitespace-pre-line break-words px-3 py-2.5 text-xs font-semibold leading-relaxed text-[#1A2A22]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {(d.illustrativePhotos || d.renovationExtra) && (
            <div className="space-y-1.5 border-t border-[#EAB879] bg-[#FFF8E9] px-4 py-3 text-xs leading-relaxed text-[#76511F]">
              {d.illustrativePhotos && <p className="font-bold">室內照片為翻新後示意，不能作為已完工現況。</p>}
              {d.renovationExtra && (
                <p className="font-bold">刊載售價為翻新前／現況價格；另估翻新費未含在售價及交屋費用小計。投報率是否包含翻新成本，需另核對計算分母。</p>
              )}
            </div>
          )}

          <div className="grid gap-3 border-t border-[#DDE3DF] bg-white px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-5">
            <div className="flex items-center gap-2 border-[#D6DDD9] text-xs font-bold text-[#007D5A] sm:border-r">
              <CircleAlert className="h-4 w-4" />
              注意事項
            </div>
            <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-[#58685F]">
              {propertyCautions.map((item) => <li key={item}>{item}</li>)}
              {/客室/.test(fields.unitBreakdown || "") && (
                <li className="text-[#76511F]">客室數、管理室／備品室與總戶數的計數方式可能不同，需逐室核對。</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={sectionTitleClass}>
          <FileText className="h-4 w-4" />
          交付與契約條件
        </h3>
        <div className="overflow-hidden border border-[#DDE3DF] bg-white">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="flex gap-3 sm:border-r sm:border-[#DDE3DF] sm:pr-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#007D5A]" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#66736C]">交付日期</p>
              <p className="mt-1 whitespace-pre-line break-words text-xs font-bold leading-relaxed text-[#1A2A22]">
                {handoverDate}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-[#007D5A]" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#66736C]">交屋與現況</p>
              <p className="mt-1 whitespace-pre-line break-words text-xs font-bold leading-relaxed text-[#1A2A22]">
                {fields.occupancyStatus || "未載明，待確認"}
              </p>
            </div>
          </div>
        </div>

        {fields.renovationDetails && (
          <div className="grid gap-3 border-t border-[#DDE3DF] px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-5">
            <div>
              <p className="text-xs font-bold text-[#1A2A22]">翻新記載</p>
              {renovation.summary && <p className="mt-1 text-[11px] leading-relaxed text-[#66736C]">{renovation.summary}</p>}
            </div>
            {renovation.items.length > 0 ? (
              <ul className="grid gap-x-5 gap-y-1.5 text-xs leading-relaxed text-[#3F5147] sm:grid-cols-2 lg:grid-cols-3">
                {renovation.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[3] text-[#007D5A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-line break-words text-xs font-semibold leading-relaxed text-[#1A2A22]">{fields.renovationDetails}</p>
            )}
          </div>
        )}

        {(d.handoverConflict || d.kind === "land") && (
          <div className="space-y-1.5 border-t border-[#DDE3DF] px-4 py-3 text-xs leading-relaxed">
            {d.handoverConflict && (
              <p className="font-bold text-[#B13818]">交付條件矛盾：同時記載更地交付與現況交付／解體協商。拆除責任、費用、交屋狀態與期限尚未確認。</p>
            )}
            {d.kind === "land" && (
              <p className="text-[#66736C]">「建築条件なし」仍須核對用途地域、建蔽率、容積率、接道及防火限制。古屋拆除、整地與新建費用未列入交屋費用小計；契約不適合責任免責的範圍須核對契約。</p>
            )}
          </div>
        )}

        <div className="grid gap-3 border-t border-[#DDE3DF] bg-[#F5F8F6] px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-5">
          <div className="flex items-center gap-2 border-[#D6DDD9] text-[#007D5A] sm:border-r">
            <CircleAlert className="h-4 w-4 shrink-0 text-[#007D5A]" />
            <p className="text-xs font-bold">其他物件條件</p>
          </div>
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-[#58685F]">
            {otherConditions.map((condition) => <li key={condition}>{condition}</li>)}
            <li>預定完工、退去或交屋日期仍需核對目前進度。</li>
            <li>買方用途與登記資料尚未確認，不能僅以建物總面積判定自住減稅適用。</li>
          </ul>
        </div>
        </div>
      </div>

      {d.hospitality && (
        <div className="space-y-3">
          <h3 className={sectionTitleClass}>
            <ShieldCheck className="h-4 w-4" />
            住宿用途與許可
          </h3>
          <div className="grid items-center gap-3 border border-[#DDE3DF] bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:gap-5">
            <h4 className="w-fit border border-[#55A98A] bg-[#F4FBF7] px-3 py-2 font-sans text-xs font-bold text-[#146A4F]">
              {d.permitLabel}
            </h4>
            <div className="min-w-0 border-[#DDE3DF] text-xs leading-relaxed sm:border-x sm:px-5">
              <p className="whitespace-pre-line break-words">{fields.hospitalityDetails || "許可狀態依備註辨識，請核對原始文件。"}</p>
              {["support_only", "possibility_only"].includes(d.permitStatus) && (
                <p className="mt-1.5 font-bold">取得支援、用途可能及預估收益均不能證明目前已有營業許可。</p>
              )}
              <p className="mt-1.5 text-[11px] text-[#66736C]">{d.permitStatus === "pending" ? "申請済表示已送件，並非已核准。" : ""}請確認許可種類、營業人、適用樓層及買方承接營業的條件。</p>
            </div>
            <a className="text-[11px] font-bold text-[#007D5A] underline" href="https://www.mlit.go.jp/kankocho/minpaku/overview/minpaku/index.html" target="_blank" rel="noreferrer">
              觀光廳：許可種類 →
            </a>
          </div>
        </div>
      )}

      {(d.hospitality || d.kind === "whole_building" || d.annualRevenueYen !== null || d.statedYieldPercent !== null) && (
        <div className="space-y-3">
          <h3 className={sectionTitleClass}>
            <TrendingUp className="h-4 w-4" />
            營業收入與投報率
          </h3>
          <div className="overflow-hidden border border-[#DDE3DF] bg-white">
            <div className="grid sm:grid-cols-2">
              <div className="px-4 py-3">
                <p className="text-[11px] leading-relaxed text-[#66736C]">收入性質</p>
                <p className="mt-1 text-xs font-bold leading-relaxed text-[#76511F]">{d.revenueBasisLabel}</p>
              </div>
              <div className="border-t border-[#DDE3DF] px-4 py-3 sm:border-l sm:border-t-0">
                <p className="text-[11px] leading-relaxed text-[#66736C]">收益範圍</p>
                <p className="mt-1 text-xs font-bold leading-relaxed text-[#1A2A22]">
                  {revenueScope}
                  {d.partialIncome && <span className="ml-1 text-[#76511F]">（部分房號／樓層，不能代表全棟收益）</span>}
                </p>
              </div>
            </div>
            {d.mixedUse && <p className="border-t border-[#DDE3DF] px-4 py-3 text-xs leading-relaxed">店鋪與住宅混合用途：請分別核對各用途面積、租金、空置與修繕支出，整棟戶數不能當作單一住宅格局。</p>}

            <div className="grid border-t border-[#DDE3DF] sm:grid-cols-3">
              <Metric label="刊載年營收／依月額年換算" value={d.annualRevenueYen === null ? "未載明" : `${d.annualRevenueYen.toLocaleString()} 円`} />
              <Metric className="border-t border-[#DDE3DF] sm:border-l sm:border-t-0" label="圖紙刊載投報率" value={d.statedYieldPercent === null ? "未載明" : `${d.statedYieldPercent.toFixed(2)}%`} />
              <Metric className="border-t border-[#DDE3DF] sm:border-l sm:border-t-0" label={d.partialIncome ? "已載部分收入 ÷ 全棟售價" : "年營收 ÷ 售價（算術核對）"} value={d.calculatedYieldPercent === null ? "資料不足" : `${d.calculatedYieldPercent.toFixed(2)}%`} />
            </div>

            {d.yieldMismatch && <p className="border-t border-[#DDE3DF] px-4 py-3 text-xs font-bold text-[#B13818]">刊載投報率與年營收／售價計算不一致，請確認分母、收入範圍及計算前提。</p>}
            {d.annualRevenueYen === null && d.statedYieldPercent !== null && <p className="border-t border-[#DDE3DF] px-4 py-3 text-xs font-bold text-[#76511F]">圖紙只刊載投報率，未載年收入；未用售價反推收入。空室物件需取得招租假設與租金明細。</p>}

            <div className="grid gap-3 border-t border-[#DDE3DF] px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-5">
              <p className="text-xs font-bold text-[#007D5A]">計算依據</p>
              <div className="grid gap-x-5 gap-y-3 text-xs leading-relaxed text-[#1A2A22] sm:grid-cols-2 lg:grid-cols-4">
                {revenueDetails.map((detail) => (
                  <div key={`${detail.label}-${detail.value}`} className="min-w-0">
                    <p className="text-[11px] font-bold text-[#007D5A]">{detail.label}</p>
                    {detail.formula && <p className="mt-1 break-words text-[11px] text-[#66736C]">{detail.formula}</p>}
                    <p className="mt-1 break-words font-bold tabular-nums text-[#1A2A22]">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 border-t border-[#DDE3DF] bg-[#F5F8F6] px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-5">
              <div className="flex items-center gap-2 border-[#D6DDD9] text-xs font-bold text-[#007D5A] sm:border-r">
                <CircleAlert className="h-4 w-4" />
                重要說明
              </div>
              <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-[#58685F]">
                <li>以上是營收與售價的比例，未扣清潔、平台佣金、管理代營運、水電、保險、稅費、修繕、空置及貸款成本。</li>
                <li>這不是扣除成本後的淨投報率。</li>
                <li>以房價×天數或稼動率計算的是情境試算；標示「實績」仍須核對帳務。</li>
                <li>民泊與月租收入混合時，也需確認各自的營運條件。</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`bg-white p-3 ${className}`}>
      <p className="text-[11px] leading-relaxed text-[#66736C]">{label}</p>
      <p className="mt-1 text-xl font-black leading-tight tabular-nums text-[#1A2A22]">{value}</p>
    </div>
  );
}

function MarketMetric({ label, value, note, href, primary = false, className = "" }: {
  label: string; value: number | null; note: string; href?: string | null; primary?: boolean; className?: string;
}) {
  return (
    <div className={`p-4 ${primary ? "bg-[#F5F8F6]" : "bg-white"} ${className}`}>
      <p className="text-[11px] font-bold text-[#66736C]">{label}</p>
      <p className="mt-1 text-2xl font-black leading-tight tabular-nums text-[#1A2A22]">
        {value === null ? "未提供" : `${Math.round(value / 10_000).toLocaleString()} 萬円`}
      </p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-[#66736C]">
        {href ? <a className="underline decoration-[#AAB8B0] underline-offset-2 hover:text-[#007D5A]" href={href} target="_blank" rel="noreferrer">{note}</a> : note}
      </p>
    </div>
  );
}

function presentHandoverDate(raw?: string | null) {
  if (!raw?.trim()) return "圖紙未載明，待確認";
  return raw.trim().replace(/^(?:引渡予定|引渡時期|交付日期|交屋日期)\s*[：:]\s*/u, "");
}

function presentRenovation(raw?: string | null) {
  if (!raw?.trim()) return { summary: "", items: [] as string[] };
  const value = raw.trim();
  const match = value.match(/^(.{1,100}?)[：:]\s*(.+)$/su);
  if (!match) return { summary: "", items: [] as string[] };
  const items = match[2]
    .split(/[、，,]/u)
    .map((item) => item.trim().replace(/[。；;]+$/u, ""))
    .filter(Boolean);
  return items.length > 1 ? { summary: match[1], items } : { summary: "", items: [] as string[] };
}

function presentOtherConditions(raw?: string | null) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[。\n]+/u)
    .map((condition) => condition.trim())
    .filter(Boolean);
}

function presentRevenueScope(raw?: string | null) {
  if (!raw?.trim()) return "圖紙未明確說明";
  return raw.trim()
    .replace(/一棟全体|一棟全棟/gu, "整棟")
    .replace(/(\d+)号室/gu, "$1號室")
    .replace(/(\d+)Fのみ/gu, "僅 $1 樓");
}
