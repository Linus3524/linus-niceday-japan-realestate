import { ShieldCheck, Info, Sparkles, Trophy, CheckCircle2, TrendingDown, TrendingUp, MapPin } from "lucide-react";
import type { PrefectureSafetyResult, SafetyGrade } from "../lib/crimeSafety";

interface PrefectureSafetyCardProps {
  prefecture: PrefectureSafetyResult;
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
    bg: "#E6F6F1",
    text: "#007D5A",
    border: "#9EE2CF",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    label: "遠低於全國平均（極安全）",
  },
  A: {
    bg: "#E6F6F1",
    text: "#007D5A",
    border: "#9EE2CF",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    label: "低於全國平均（安全）",
  },
  "B+": {
    bg: "#EBF5FF",
    text: "#1E65B8",
    border: "#B9DCFF",
    accent: "#1E65B8",
    badgeBg: "#FFFFFF",
    badgeText: "#1E65B8",
    badgeBorder: "#B9DCFF",
    label: "略優於全國平均（良好）",
  },
  B: {
    bg: "#FFF4E5",
    text: "#B76E00",
    border: "#FFD599",
    accent: "#B76E00",
    badgeBg: "#FFFFFF",
    badgeText: "#B76E00",
    badgeBorder: "#FFD599",
    label: "接近全國平均（普通）",
  },
  C: {
    bg: "#FDE8E8",
    text: "#C81E1E",
    border: "#F8B4B4",
    accent: "#C81E1E",
    badgeBg: "#FFFFFF",
    badgeText: "#C81E1E",
    badgeBorder: "#F8B4B4",
    label: "高於全國平均（留意）",
  },
  D: {
    bg: "#FDE8E8",
    text: "#9B1C1C",
    border: "#F8B4B4",
    accent: "#9B1C1C",
    badgeBg: "#FFFFFF",
    badgeText: "#9B1C1C",
    badgeBorder: "#F8B4B4",
    label: "明顯高於全國平均（注意）",
  },
};

/** 把倍率映射成長條寬度。1.0 落在中線 50%，2.0 以上填滿。 */
function barWidth(vsNational: number): number {
  return Math.max(4, Math.min(100, (vsNational / 2) * 100));
}

export function PrefectureSafetyCard({ prefecture }: PrefectureSafetyCardProps) {
  const config = GRADE_CONFIG[prefecture.grade] || GRADE_CONFIG.A;
  const diffPercent = Math.round((prefecture.vsNational - 1) * 100);

  const shares = [
    { label: "竊盜犯罪", value: prefecture.theftSharePercent, color: "#007D5A" },
    { label: "粗暴傷害", value: prefecture.violentSharePercent, color: "#B76E00" },
    { label: "凶惡重大", value: prefecture.felonySharePercent, color: "#C81E1E" },
  ].filter((item): item is { label: string; value: number; color: string } => item.value !== null);

  return (
    <div className="space-y-3 font-sans [font-family:var(--font-sans)]">
      {/* 模組統一標題列 (與全站模組一致) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
          <span>廣域治安統計概況</span>
        </div>
        <span className="text-[10px] text-[#66736C]">
          都道府縣級公開統計指標
        </span>
      </div>

      {/* 卡片本體：純直角、標準 1px 邊框 */}
      <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5 space-y-4">
        {/* 區域資訊列 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#66736C]">
            <MapPin className="h-3.5 w-3.5 text-[#007D5A] shrink-0" />
            <span className="font-bold text-[#66736C]">統計範圍：</span>
            <span className="font-bold text-[#1A2A22]">{prefecture.prefecture}</span>
            <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-medium text-[#66736C]">
              {prefecture.fiscalYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[#8A9590]">治安綜合評級</span>
            <span
              className="border px-2 py-0.5 text-xs font-black tabular-nums"
              style={{ borderColor: config.border, backgroundColor: config.bg, color: config.text }}
            >
              {prefecture.grade} <span className="text-[10px] font-bold text-[#66736C]">{config.label.split("（")[1]?.replace("）", "") || ""}</span>
            </span>
          </div>
        </div>

        {/* 精度說明 */}
        <div className="flex items-start gap-2.5 border border-[#B9DCFF] bg-[#EBF5FF] px-3.5 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1E65B8]" />
          <p className="text-[11px] leading-relaxed text-[#1E65B8]">
            東京都以外地區日本官方未公開町丁目級犯罪月報，此卡片為<strong>都道府県層級</strong>的總合指標基準。
          </p>
        </div>

        {/* 主要指標儀表卡 */}
        <div
          className="border p-3.5 space-y-3"
          style={{ backgroundColor: config.bg, borderColor: config.border }}
        >
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
              {config.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span
              className="text-3xl font-black leading-none tabular-nums"
              style={{ color: config.text }}
            >
              {prefecture.crimeRatePerThousand}
            </span>
            <span className="text-xs font-semibold text-[#52635A]">
              件／千人
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                diffPercent <= 0 ? "text-[#007D5A]" : "text-[#C81E1E]"
              }`}
            >
              {diffPercent <= 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`} 比全國平均
            </span>
          </div>

          {/* 與全國平均的視覺對照 */}
          <div className="space-y-1.5 pt-1">
            <div className="relative h-2 w-full bg-white border border-[#DDE3DF]">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${barWidth(prefecture.vsNational)}%`, backgroundColor: config.accent }}
              />
              {/* 全國平均基準線固定在 50% */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-[#1A2A22]/50" />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-[#66736C]">
              <span>優於平均（安全）</span>
              <span className="font-bold text-[#1A2A22]">全國平均 {prefecture.nationalRatePerThousand} 件</span>
              <span>高於平均</span>
            </div>
          </div>
        </div>

        {/* 排名與檢舉率雙卡 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#66736C]">
              <Trophy className="h-3 w-3 text-[#B76E00]" />
              <span>全國安全度排名</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black tabular-nums text-[#1A2A22]">
                第 {prefecture.safetyRank}
              </span>
              <span className="text-[10px] font-semibold text-[#8A9590]">
                ／ {prefecture.totalPrefectures} 都道府縣
              </span>
            </div>
          </div>

          <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#66736C]">
              <CheckCircle2 className="h-3 w-3 text-[#007D5A]" />
              <span>刑案破獲檢舉率</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black tabular-nums text-[#1A2A22]">
                {prefecture.clearanceRatePercent !== null ? `${prefecture.clearanceRatePercent}%` : "—"}
              </span>
              <span className="text-[10px] font-semibold text-[#8A9590]">
                破獲水準
              </span>
            </div>
          </div>
        </div>

        {/* 犯罪組成比例 */}
        {shares.length > 0 && (
          <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3 space-y-2.5">
            <div className="text-xs font-bold text-[#1A2A22]">主要犯罪類型佔比結構</div>
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

        {/* 治安專業診斷卡 (純 1px 邊框，去除過粗側邊線) */}
        <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#007D5A]" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#007D5A]">區域治安指標診斷</div>
              <p className="text-xs leading-relaxed font-medium text-[#1A2A22]">
                {prefecture.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 資料來源與免責聲明：與周邊生活機能地圖卡片統一樣式 */}
        <div className="pt-3 border-t border-[#DDE3DF] flex items-start gap-2 text-[11px] leading-relaxed text-[#8A9590]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A9590]" />
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <span className="font-semibold text-[#66736C]">資料來源：</span>
              <a
                className="underline hover:text-[#1A2A22]"
                href="https://www.e-stat.go.jp/"
                target="_blank"
                rel="noreferrer"
              >
                總務省統計局「社會生活統計指標」
              </a>
              <span>（e-Stat）都道府縣級公開統計基準</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#8A9590]">
              統計單位：都道府縣千人犯罪認知率與刑案破獲率。官方公開指標反映廣域宏觀數據，微觀街區環境建議實地勘查。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}