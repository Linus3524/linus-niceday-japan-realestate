import { Shield, Info } from "lucide-react";
import type { PrefectureSafetyResult, SafetyGrade } from "../lib/crimeSafety";

interface PrefectureSafetyCardProps {
  prefecture: PrefectureSafetyResult;
}

const GRADE_CONFIG: Record<SafetyGrade, { bg: string; text: string; border: string; label: string }> = {
  "A+": { bg: "#E6F6F1", text: "#007D5A", border: "#9ee2cf", label: "遠低於全國平均" },
  A:    { bg: "#E6F6F1", text: "#007D5A", border: "#9ee2cf", label: "低於全國平均" },
  "B+": { bg: "#EBF5FF", text: "#1E65B8", border: "#B9DCFF", label: "略優於全國平均" },
  B:    { bg: "#FFF4E5", text: "#B76E00", border: "#FFD599", label: "接近全國平均" },
  C:    { bg: "#FDE8E8", text: "#C81E1E", border: "#F8B4B4", label: "高於全國平均" },
  D:    { bg: "#FDE8E8", text: "#9B1C1C", border: "#F8B4B4", label: "明顯高於全國平均" },
};

/** 把倍率映射成長條寬度。1.0 落在中線 50%，2.0 以上填滿。 */
function barWidth(vsNational: number): number {
  return Math.max(4, Math.min(100, (vsNational / 2) * 100));
}

export function PrefectureSafetyCard({ prefecture }: PrefectureSafetyCardProps) {
  const config = GRADE_CONFIG[prefecture.grade];
  const diffPercent = Math.round((prefecture.vsNational - 1) * 100);

  const shares = [
    { label: "竊盜", value: prefecture.theftSharePercent },
    { label: "粗暴犯", value: prefecture.violentSharePercent },
    { label: "凶惡犯", value: prefecture.felonySharePercent },
  ].filter((item): item is { label: string; value: number } => item.value !== null);

  return (
    <div className="border border-[#DDE3DF] bg-white p-4 space-y-3">
      {/* 標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#007D5A]" />
          <span className="text-xs font-bold text-[#007D5A]">地區治安概況</span>
          <span className="text-[10px] text-[#66736C]">{prefecture.prefecture}</span>
        </div>
        <span className="text-[10px] font-semibold text-[#8A9590]">
          {prefecture.fiscalYear}
        </span>
      </div>

      {/* 精度說明：這張卡是縣級，不能讓使用者誤以為和東京的町丁目級同精度 */}
      <div className="flex items-start gap-2 border border-[#E4EAF7] bg-[#F4F7FD] px-3 py-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1E65B8]" />
        <p className="text-[10px] leading-relaxed text-[#3F5147]">
          此地區僅有<strong>都道府県層級</strong>的公開統計，無法精確到街區。
          （町丁目級的全罪種資料目前僅東京都公開）
        </p>
      </div>

      {/* 主要指標 */}
      <div
        className="border px-3 py-3"
        style={{ backgroundColor: config.bg, borderColor: config.border }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold" style={{ color: config.text }}>
            每千人刑法犯認知件數
          </span>
          <span className="text-[10px] font-semibold" style={{ color: config.text, opacity: 0.8 }}>
            {config.label}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black leading-none tabular-nums" style={{ color: config.text }}>
            {prefecture.crimeRatePerThousand}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: config.text }}>
            件／千人
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: config.text }}>
            {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
          </span>
        </div>

        {/* 與全國平均的視覺對照 */}
        <div className="mt-2.5">
          <div className="relative h-2 w-full bg-white/70">
            <div
              className="h-2"
              style={{ width: `${barWidth(prefecture.vsNational)}%`, backgroundColor: config.text }}
            />
            {/* 全國平均基準線固定在 50% */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-[#1A2A22]/45" />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[#66736C]">
            <span>安全</span>
            <span>全國平均 {prefecture.nationalRatePerThousand}</span>
            <span>偏高</span>
          </div>
        </div>
      </div>

      {/* 排名與檢舉率 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-[#DDE3DF] bg-[#FAFCFB] px-3 py-2">
          <p className="text-[10px] text-[#66736C]">全國安全度排名</p>
          <p className="text-sm font-bold tabular-nums text-[#1A2A22]">
            第 {prefecture.safetyRank} <span className="text-[10px] font-semibold text-[#66736C]">／ {prefecture.totalPrefectures} 縣</span>
          </p>
        </div>
        <div className="border border-[#DDE3DF] bg-[#FAFCFB] px-3 py-2">
          <p className="text-[10px] text-[#66736C]">刑案檢舉率</p>
          <p className="text-sm font-bold tabular-nums text-[#1A2A22]">
            {prefecture.clearanceRatePercent !== null ? `${prefecture.clearanceRatePercent}%` : "—"}
          </p>
        </div>
      </div>

      {/* 犯罪組成 */}
      {shares.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#66736C]">
            犯罪類型組成
          </p>
          <div className="border border-[#DDE3DF]">
            {shares.map((item, idx) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-3 py-1.5 ${
                  idx < shares.length - 1 ? "border-b border-[#DDE3DF]" : ""
                }`}
              >
                <span className="text-xs text-[#1A2A22]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-[#EEF2F0]">
                    <div
                      className="h-1.5 bg-[#007D5A]"
                      style={{ width: `${Math.min(100, item.value)}%` }}
                    />
                  </div>
                  <span className="w-11 text-right text-xs font-bold tabular-nums text-[#1A2A22]">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 摘要 */}
      <div className="border-l-2 border-[#007D5A] bg-[#F5F8F6] px-3 py-2">
        <p className="text-xs leading-relaxed text-[#3F5147]">{prefecture.summary}</p>
      </div>

      <p className="text-[10px] leading-relaxed text-[#8A9590]">{prefecture.credit}</p>
    </div>
  );
}