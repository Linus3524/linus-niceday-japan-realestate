import { SAFETY_PALETTE } from "../lib/safetyPalette";
import { PrefectureCrimeBreakdownCard } from "./PrefectureCrimeBreakdownCard";
import { NeighborhoodActivityCard } from "./NeighborhoodActivityCard";
import type { ListingLocationContext } from "../lib/listingLocation";
import { ShieldCheck, Info, FileText, Trophy, CheckCircle2, TrendingDown, TrendingUp, MapPin } from "lucide-react";
import type { PrefectureSafetyResult, SafetyGrade } from "../lib/crimeSafety";

interface PrefectureSafetyCardProps {
  prefecture: PrefectureSafetyResult;
  location?: ListingLocationContext | null;
}

const GRADE_CONFIG: Record<
  SafetyGrade,
  {
    bg: string;
    text: string;
    border: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    label: string;
  }
> = {
  "A+": {
    bg: "#F2FAF7",
    text: SAFETY_PALETTE.green,
    border: "#9EE2CF",
    accent: SAFETY_PALETTE.green,
    badgeBg: "#FFFFFF",
    badgeText: SAFETY_PALETTE.green,
    badgeBorder: "#9EE2CF",
    label: "遠低於全國平均",
  },
  A: {
    bg: "#F2FAF7",
    text: SAFETY_PALETTE.green,
    border: "#9EE2CF",
    accent: SAFETY_PALETTE.green,
    badgeBg: "#FFFFFF",
    badgeText: SAFETY_PALETTE.green,
    badgeBorder: "#9EE2CF",
    label: "低於全國平均",
  },
  "B+": {
    bg: "#F4F8FD",
    text: SAFETY_PALETTE.blue,
    border: "#B9DCFF",
    accent: SAFETY_PALETTE.blue,
    badgeBg: "#FFFFFF",
    badgeText: SAFETY_PALETTE.blue,
    badgeBorder: "#B9DCFF",
    label: "略優於全國平均",
  },
  B: {
    bg: "#FFF8F1",
    text: SAFETY_PALETTE.orangeText,
    border: "#FFDDBA",
    accent: SAFETY_PALETTE.orange,
    badgeBg: "#FFFFFF",
    badgeText: SAFETY_PALETTE.orangeText,
    badgeBorder: "#FFDDBA",
    label: "接近全國平均",
  },
  C: {
    bg: "#FDF2F2",
    text: SAFETY_PALETTE.red,
    border: "#F8B4B4",
    accent: SAFETY_PALETTE.red,
    badgeBg: "#FFFFFF",
    badgeText: SAFETY_PALETTE.red,
    badgeBorder: "#F8B4B4",
    label: "高於全國平均",
  },
  D: {
    bg: "#FDF2F2",
    text: "#9B1C1C",
    border: "#F8B4B4",
    accent: "#9B1C1C",
    badgeBg: "#FFFFFF",
    badgeText: "#9B1C1C",
    badgeBorder: "#F8B4B4",
    label: "明顯高於全國平均",
  },
};

/** 把倍率映射成長條寬度。1.0 落在中線 50%，2.0 以上填滿。 */
function barWidth(vsNational: number): number {
  return Math.max(4, Math.min(100, (vsNational / 2) * 100));
}

export function PrefectureSafetyCard({ prefecture, location }: PrefectureSafetyCardProps) {
  const local = prefecture.municipal ?? null;
  const effectiveGrade = local?.grade ?? prefecture.grade;
  const effectiveRate = local?.crimeRatePerThousand ?? prefecture.crimeRatePerThousand;
  const comparisonRate = local?.prefectureAverageRate ?? prefecture.nationalRatePerThousand;
  const comparisonRatio = local?.vsPrefecture ?? prefecture.vsNational;
  const comparisonLabel = local ? `${prefecture.prefecture}市區町村平均` : "全國平均";
  const config = GRADE_CONFIG[effectiveGrade] || GRADE_CONFIG.A;
  const diffPercent = Math.round((comparisonRatio - 1) * 100);

  const shares = [
    { label: "竊盜犯罪", value: prefecture.theftSharePercent, color: SAFETY_PALETTE.green },
    { label: "粗暴犯罪", value: prefecture.violentSharePercent, color: SAFETY_PALETTE.orange },
    { label: "凶惡犯罪", value: prefecture.felonySharePercent, color: SAFETY_PALETTE.red },
  ].filter((item): item is { label: string; value: number; color: string } => item.value !== null);

  const partialSum = shares.reduce((sum, item) => sum + item.value, 0);
  if (shares.length === 3 && partialSum <= 100) {
    shares.push({ label: "其他分類", value: Math.round((100 - partialSum) * 100) / 100, color: SAFETY_PALETTE.gray });
  }

  return (
    <div className="space-y-3 font-sans [font-family:var(--font-sans)]">
      {/* 模組統一標題列 (與全站模組一致) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
          <span>周邊治安資料分析</span>
        </div>
        <span className="text-[10px] text-[#66736C]">
          物件周邊環境・都道府縣犯罪統計
        </span>
      </div>

      {/* 卡片本體：純直角、標準 1px 邊框 */}
      <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5 space-y-4">
        {/* 區域資訊列 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#66736C]">
            <MapPin className="h-3.5 w-3.5 text-[#007D5A] shrink-0" />
            <span className="font-bold text-[#66736C]">統計範圍：</span>
            <span className="font-bold text-[#1A2A22]">{local?.municipality ?? prefecture.prefecture}</span>
            <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-medium text-[#66736C]">
              {local ? "市區町村統計" : "縣級備援"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[10px] font-bold text-[#007D5A]">
              {local ? `${local.year} 年` : prefecture.fiscalYear}
            </span>
            <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-[#1A2A22]">
              {local ? `${prefecture.prefecture}內每千人案件第 ${local.rank} 名` : `全國每千人案件第 ${prefecture.safetyRank} 名`}
            </span>
          </div>
        </div>

        {/* 精度說明 */}
        <div className="flex items-start gap-2.5 border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <p className="text-[11px] leading-relaxed text-zinc-600">
            {local
              ? <>本區採用<strong className="font-bold text-zinc-800">官方市區町村全罪種統計</strong>；右側街區活動依物件周邊 500m 環境推估。兩者範圍不同，會分開標示。</>
              : <>目前未接入可同年度比較的市區町村全罪種表，本區採<strong className="font-bold text-zinc-800">都道府県統計備援</strong>；右側街區活動依物件周邊 500m 環境推估。</>}
          </p>
        </div>

        <div className="prefecture-safety-pair grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* 主要指標儀表卡 */}
        <div
          className="prefecture-safety-card border p-3.5"
          style={{ backgroundColor: config.bg, borderColor: config.border }}
        >
          <div className="prefecture-safety-top">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-bold text-[#1A2A22]">
              每千人刑法犯認知件數
            </span>
            <span
              className="border px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
                borderColor: config.badgeBorder,
              }}
            >
              {local ? config.label.replace("全國", prefecture.prefecture) : config.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 pb-2">
            <div>
              <div className="text-[11px] font-medium text-[#66736C]">{local ? "市區町村統計評級" : "縣級統計評級"}</div>
              <div className="mt-1 text-4xl font-black leading-none" style={{ color: config.text }}>{effectiveGrade}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#66736C]">每千人刑法犯</div>
              <div className="mt-1 text-4xl font-black leading-none text-[#1A2A22]">{effectiveRate}<span className="ml-1 text-base">件</span></div>
            </div>
          </div>
          <div className="flex gap-1">
            {["明顯偏高", "偏高", "接近平均", "較低", "明顯較低"].map((label, index) => {
              const gradeLevel = (({ "A+": 5, A: 4, "B+": 4, B: 3, C: 2, D: 1 } as Record<string, number>)[effectiveGrade] ?? 3);
              const isCurrent = index + 1 === gradeLevel;
              return <div className="min-w-0 flex-1 text-center" key={label}>
                <div className="h-2" style={{ backgroundColor: index < gradeLevel ? config.accent : `${config.border}90` }} />
                <span
                  className={`mt-1 block text-[9px] leading-tight ${isCurrent ? "font-bold" : "font-normal"}`}
                  style={{ color: isCurrent ? config.accent : "#66736C" }}
                >
                  {label}
                </span>
              </div>;
            })}
          </div>
          <div className="prefecture-safety-description mt-3 flex flex-wrap items-center gap-1 text-[11px] leading-relaxed font-bold" style={{ color: config.text }}>
            {diffPercent <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {diffPercent > 0 ? "+" : ""}{diffPercent}% 比{comparisonLabel}
          </div>
          </div>
        {/* 縣級排名與破案率併入左側統計卡 */}
        <div className="prefecture-safety-middle grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#66736C]">
              <Trophy className="h-3 w-3" style={{ color: config.accent }} />
              <span>每千人案件由少至多排名</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black tabular-nums text-[#1A2A22]">
                第 {local?.rank ?? prefecture.safetyRank}
              </span>
              <span className="text-[10px] font-semibold text-[#8A9590]">
                ／ {local ? `${local.totalAreas} 個市區町村` : `${prefecture.totalPrefectures} 都道府縣`}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#66736C]">
              <CheckCircle2 className="h-3 w-3 text-[#007D5A]" />
              <span>{local ? "全年刑法犯認知件數" : "刑案破案率（檢舉率）"}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black tabular-nums text-[#1A2A22]">
                {local ? local.total.toLocaleString() : prefecture.clearanceRatePercent !== null ? `${prefecture.clearanceRatePercent}%` : "—"}
              </span>
              <span className="text-[10px] font-semibold text-[#8A9590]">
                {local ? "件" : "破獲水準"}
              </span>
            </div>
          </div>
          <p className="col-span-2 text-[10px] leading-relaxed text-[#66736C]">第 1 名＝每千人案件最少；同值採相同名次。</p>
        </div>

          <div className="prefecture-safety-bottom space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#66736C]">
                <FileText className="h-3.5 w-3.5 shrink-0" />{local ? "市區町村統計摘要" : "都道府縣統計摘要"}
              </div>
              <p className="text-[11px] leading-relaxed text-[#55635B]">{local
                ? `${local.municipality}全年共 ${local.total.toLocaleString()} 件，每千人 ${local.crimeRatePerThousand} 件；在${prefecture.prefecture} ${local.totalAreas} 個可比較市區町村中排第 ${local.rank} 名。`
                : prefecture.summary}</p>
            </div>
          {/* 與全國平均的視覺對照 */}
          <div className="space-y-1.5 pt-1">
            <div className="relative h-2 w-full bg-white border border-[#DDE3DF]">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${barWidth(comparisonRatio)}%`, backgroundColor: config.accent }}
              />
              {/* 全國平均基準線固定在 50% */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-[#1A2A22]/50" />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-[#66736C]">
              <span>低於平均</span>
              <span className="font-bold text-[#1A2A22]">{comparisonLabel} {comparisonRate} 件</span>
              <span>高於平均</span>
            </div>
          </div>
          </div>
        </div>

          <NeighborhoodActivityCard alignRows showCounts showNightInfo activity={location?.neighborhoodActivity} address={location?.matchedAddress} />
        </div>

        {/* 犯罪組成比例 */}
        {prefecture.breakdown ? <PrefectureCrimeBreakdownCard data={prefecture.breakdown} prefecture={prefecture.prefecture} /> : shares.length > 0 && (
          <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3 space-y-2.5">
            <div className="text-xs font-bold text-[#1A2A22]">犯罪類型佔比（件數尚未接入）</div>
            <p className="text-[10px] leading-relaxed text-[#66736C]">目前只有比例資料，無法還原精確件數。其他分類為 100% 扣除已列三類的差額；若有比例缺值，僅呈現已知分類。</p>
            <div className="space-y-2">
              {shares.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="w-20 font-medium text-[#1A2A22] text-[11px]">{item.label}</span>
                  <div className="h-1.5 flex-1 bg-[#E5E7EB]">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, item.value)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold tabular-nums text-[#1A2A22] text-[11px]">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 資料來源與免責聲明：與周邊生活機能地圖卡片統一樣式 */}
        <div className="pt-3 border-t border-[#DDE3DF] flex items-start gap-2 text-[11px] leading-relaxed text-[#8A9590]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A9590]" />
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <span className="font-semibold text-[#66736C]">資料來源：</span>
              <a
                className="underline hover:text-[#1A2A22]"
                href={local?.sourceUrl ?? "https://www.e-stat.go.jp/"}
                target="_blank"
                rel="noreferrer"
              >
                {local ? `${prefecture.prefecture}警察官方統計` : "總務省統計局「社會生活統計指標」"}
              </a>
              <span>{local ? `／人口：Statistics Dashboard（${local.populationYear} 年）` : "（e-Stat）都道府縣級公開統計基準"}</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#8A9590]">
              {local ? `統計單位：${local.municipality}全區；非物件所在町丁目。犯罪件數與人口年份均標示於卡片。` : "統計單位：都道府縣千人犯罪認知率與刑案破獲率。廣域統計不等於物件周邊風險。"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
