import { SAFETY_PALETTE } from "../lib/safetyPalette";
import { ChevronDown, Footprints, Moon } from "lucide-react";
import { ACTIVITY_LABELS, type NeighborhoodActivity } from "../lib/neighborhoodActivity";

interface NeighborhoodActivityCardProps {
  activity?: NeighborhoodActivity;
  address?: string;
  showCounts?: boolean;
  showNightInfo?: boolean;
  alignRows?: boolean;
  annualStreetCrime?: { count: number; area: string; period: string };
}

export function NeighborhoodActivityCard({ activity, address, showCounts = false, showNightInfo = false, alignRows = false, annualStreetCrime }: NeighborhoodActivityCardProps) {
  const level = activity?.level ?? null;
  const landUse = activity?.landUse ?? null;
  // 圖資收錄不足時，官方用途地域是判定的主要依據，說明文字要如實改述依據來源，
  // 不能還寫「地圖收錄多棟住宅建物」——那在這種情況下並不成立。
  const mapDerived = (activity?.residential ?? 0) >= 5 || (activity?.commercial ?? 0) >= 8;
  const explanation = !activity || activity.status === "unavailable"
    ? "周邊環境資料暫時無法取得，尚不能判斷街區活動程度。"
    : activity.status === "imprecise"
      ? "目前僅定位到街區附近，請確認完整門牌後再分析物件周邊。"
      : activity.status === "sparse"
        ? "地圖收錄的住宅與商業資訊不足，尚不能判定繁華或安靜。"
        : level === 5 ? "地圖收錄較多酒吧、娛樂場所及商店，推估周邊娛樂活動較集中。"
          : level === 4 ? "地圖收錄較密集的商店與餐飲場所，推估周邊商業活動較熱絡。"
            : level === 3
              ? mapDerived
                ? "附近同時有住宅建物與多處商店、餐飲場所，呈現住商混合特徵。"
                : `官方用途地域為${landUse?.zone || "混合型分區"}，且位於人口集中地區，推估為住商混合的既成市街地。`
              : mapDerived
                ? "近處有多棟明確標註的住宅建物，已收錄商店較少，暫估住宅為主。"
                : `官方用途地域為${landUse?.zone || "住居系分區"}，屬法定住宅環境，已收錄商店較少，暫估住宅為主。`;
  const accent = level === 5 ? SAFETY_PALETTE.purple : level && level >= 3 ? SAFETY_PALETTE.blue : SAFETY_PALETTE.green;
  const palette = !level ? { bg: "#F5F8F6", border: "#CFE0D8" }
    : level === 5 ? { bg: "#F7F5FC", border: "#DED4F2" }
      : level >= 3 ? { bg: "#F4F8FD", border: "#CFE0F4" }
        : { bg: "#F2FAF7", border: "#CDEBE0" };
  const badgeBorder = !level ? "#DDE3DF" : level === 5 ? "#DED4F2" : level >= 3 ? "#B9DCFF" : "#9EE2CF";
  const badgeText = !level ? "#66736C" : accent;
  return <div style={{ backgroundColor: palette.bg, borderColor: palette.border }} className={`${alignRows ? "prefecture-safety-card" : "flex flex-col justify-between"} border border-[#DDE3DF] bg-[#F5F8F6] p-3.5`}>
    <div className={alignRows ? "prefecture-safety-top" : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
          <Footprints className="h-4 w-4 shrink-0" style={{ color: accent }} />
          <span>街區活動程度</span>
        </span>
        <span
          className="border px-2 py-0.5 text-[10px] font-bold"
          style={{
            borderColor: badgeBorder,
            color: badgeText,
            backgroundColor: "#FFFFFF",
          }}
        >
          {level ? "環境推估" : "資料待確認"}
        </span>
      </div>
      {annualStreetCrime ? <div className="grid grid-cols-2 gap-4 pt-3 pb-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#66736C]">活動程度</div>
          <div className="mt-1 flex h-9 items-baseline text-xl sm:text-2xl font-black leading-none tracking-tight" style={{ color: accent }}>{level ? ACTIVITY_LABELS[level - 1] : "待確認"}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#66736C]">街頭案件全年</div>
          <div className="mt-1 flex h-9 items-baseline text-4xl font-black leading-none tabular-nums text-[#1A2A22]">{annualStreetCrime.count.toLocaleString()}<span className="ml-1 text-base font-bold">件</span></div>
        </div>
      </div> : <div className={alignRows ? "pt-3 pb-2" : undefined}>
        <p className={`${alignRows ? "" : "mt-3"} text-2xl font-black`} style={{ color: accent }}>{level ? ACTIVITY_LABELS[level - 1] : "待確認"}</p>
        <p className="mt-1 break-words text-[10px] text-[#66736C]">{address || "物件位置待確認"}・周邊 500m</p>
      </div>}
      <div className={`${alignRows ? "" : annualStreetCrime ? "mt-1" : "mt-3"} flex gap-1`} aria-label={level ? `街區活動程度：${ACTIVITY_LABELS[level - 1]}` : "街區活動程度尚無法判斷"}>
        {ACTIVITY_LABELS.map((label, index) => {
          const isCurrent = level !== null && index + 1 === level;
          return <div key={label} className="min-w-0 flex-1 text-center">
            <div className="h-2" style={{ backgroundColor: level && index < level ? accent : `${palette.border}90` }} />
            <span
              className={`mt-1 block text-[9px] leading-tight ${isCurrent ? "font-bold" : "font-normal"}`}
              style={{ color: isCurrent ? accent : "#66736C" }}
            >
              {label}
            </span>
          </div>;
        })}
      </div>
      <p className={`${alignRows ? "prefecture-safety-description " : ""}mt-3 text-[11px] leading-relaxed text-[#3F5147]`}>{explanation}</p>
      {annualStreetCrime && !alignRows && <div className="mt-2 space-y-0.5 border-t border-dashed border-[#DDE3DF] pt-2 text-[10px] leading-relaxed text-[#66736C]">
        {annualStreetCrime && <p className="break-words">環境：{address || "物件位置待確認"}・周邊 500m</p>}
        <p className="break-words">街頭案件：{annualStreetCrime.area}・{annualStreetCrime.period}（警視廳）</p>
      </div>}
      {showCounts && !alignRows && <ActivityCounts activity={activity} standalone />}
    </div>
    {alignRows && <div className="prefecture-safety-middle prefecture-safety-evidence">
      {showCounts && <ActivityCounts activity={activity} standalone={false} />}
          <div className="space-y-0.5 text-[10px] leading-relaxed text-[#66736C]">
            {annualStreetCrime && <p className="break-words">環境：{address || "物件位置待確認"}・周邊 500m</p>}
            {annualStreetCrime ? <p className="break-words">街頭案件：{annualStreetCrime.area}・{annualStreetCrime.period}（警視廳）</p> : <p className="break-words">場所統計：商店／餐飲／娛樂 500m、近處商家 150m、住宅建物 250m。</p>}
          </div>

      {(!activity || activity.status === "unavailable" || activity.status === "imprecise") && <p className="text-[10px] text-[#66736C] my-auto">場所件數資料待確認</p>}
    </div>}
    {showNightInfo && (alignRows
      ? <div className="prefecture-safety-bottom space-y-2">
          <div className="prefecture-safety-evidence" style={{ height: "auto" }}><ActivityNightInfo activity={activity} /></div>
        </div>
      : <ActivityNightInfo activity={activity} />)}
  </div>;
}

export function NeighborhoodActivityEvidence({ activity, showCounts = true }: { activity?: NeighborhoodActivity; showCounts?: boolean }) {
  return <details className="group border border-[#DDE3DF] bg-[#FAFCFB] p-3">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold text-[#66736C] [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-1.5"><Footprints className="h-3.5 w-3.5" />街區環境依據與夜間資訊</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
    </summary>
    {showCounts && <ActivityCounts activity={activity} standalone />}
    <ActivityNightInfo activity={activity} />
  </details>;
}

function ActivityCounts({ activity, standalone = false }: { activity?: NeighborhoodActivity; standalone?: boolean }) {
  const unavailable = !activity || activity.status === "unavailable" || activity.status === "imprecise";
  if (unavailable) return null;

  if (standalone) {
    return (
      <>
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 border-t border-[#DDE3DF] pt-2 text-[10px] leading-normal text-[#66736C]">
          <span>商店／餐飲／娛樂 <strong className="text-[#1A2A22]">{activity.commercial} 處</strong></span>
          <span>其中娛樂場所 <strong className="text-[#1A2A22]">{activity.entertainment} 處</strong></span>
          <span>近處 150m 商業場所 <strong className="text-[#1A2A22]">{activity.nearbyCommercial} 處</strong></span>
          <span>250m 住宅建物 <strong className="text-[#1A2A22]">{activity.residential} 棟</strong></span>
        </div>
        <OfficialContextRows activity={activity} />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-2 text-[10px] leading-tight text-[#66736C]">
        <span>商店／餐飲／娛樂 <strong className="text-[#1A2A22]">{activity.commercial} 處</strong></span>
        <span>其中娛樂場所 <strong className="text-[#1A2A22]">{activity.entertainment} 處</strong></span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 text-[10px] leading-tight text-[#66736C]">
        <span>近處 150m 商業場所 <strong className="text-[#1A2A22]">{activity.nearbyCommercial} 處</strong></span>
        <span>250m 住宅建物 <strong className="text-[#1A2A22]">{activity.residential} 棟</strong></span>
      </div>
      <OfficialContextRows activity={activity} />
    </>
  );
}

/**
 * 國土交通省官方圖層的依據列。
 *
 * 用途地域是市町村告示的法定分區，人口集中地區與 250m 網格人口出自國勢調查，
 * 三者都與地圖志工標記無關，因此即使 OSM 收錄稀疏也能如實說明街區性質。
 */
function OfficialContextRows({ activity }: { activity: NeighborhoodActivity }) {
  const landUse = activity.landUse;
  const population = activity.population;
  const careFacilities = activity.careFacilities ?? 0;
  if (!landUse && !population && !careFacilities) return null;
  const ratios = landUse
    ? [landUse.buildingCoverageRatio && `建蔽率 ${landUse.buildingCoverageRatio}`,
      landUse.floorAreaRatio && `容積率 ${landUse.floorAreaRatio}`].filter(Boolean).join("・")
    : "";
  return (
    <div className="mt-2 space-y-1 border-t border-dashed border-[#DDE3DF] pt-2 text-[10px] leading-normal text-[#66736C]">
      {landUse && <div>
        法定用途地域 <strong className="text-[#1A2A22]">{landUse.zone}</strong>
        {ratios ? <span className="text-[#8A9590]">（{ratios}）</span> : null}
      </div>}
      {population && <div>
        {population.denselyInhabited ? "位於人口集中地區（DID）" : "非人口集中地區"}
        {population.densityPerSquareKm ? <>・約 <strong className="text-[#1A2A22]">{population.densityPerSquareKm.toLocaleString()}</strong> 人／km²</> : null}
        {population.meshPopulation ? <>・所在 250m 網格推計 <strong className="text-[#1A2A22]">{population.meshPopulation.toLocaleString()}</strong> 人</> : null}
      </div>}
      {careFacilities > 0 && <div>
        1.2km 內托育・福祉設施 <strong className="text-[#1A2A22]">{careFacilities} 處</strong>
      </div>}
    </div>
  );
}

function ActivityNightInfo({ activity }: { activity?: NeighborhoodActivity }) {
  const unavailable = !activity || activity.status === "unavailable" || activity.status === "imprecise";
  const level = activity?.level;
  const accent = !level
    ? "#66736C"
    : level === 5
      ? SAFETY_PALETTE.purple
      : level >= 3
        ? SAFETY_PALETTE.blue
        : SAFETY_PALETTE.green;

  return <div className="mt-3 space-y-1 border-t border-dashed border-[#DDE3DF] pt-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
        <Moon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        <span>夜間環境與資料說明</span>
      </div>
      <div className="space-y-1.5 text-[11px] leading-relaxed text-[#3F5147]">
        <ul className="space-y-1.5 text-[#3F5147]">
          <li className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8A9590]" />
            <span>{!unavailable && activity.aroundTheClock > 0 ? `地圖標註 ${activity.aroundTheClock} 處全天營業；` : "深夜營業資訊尚不足；"}照明、人流及返家路線需要實地確認。</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8A9590]" />
            <span>依地圖收錄設施推估活動程度，可能漏登；不代表犯罪風險或隔音，實際環境需分時段現勘。</span>
          </li>
        </ul>
        {activity && <p className="pt-0.5 text-[10px] text-[#66736C]">
          來源：<a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
          {activity.landUse || activity.population || activity.careFacilities
            ? <>・<a className="underline" href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noreferrer">國土交通省 不動產資訊資料庫</a>（用途地域・國勢調查人口）</>
            : null}
          ・查詢 {activity.fetchedAt.slice(0, 10)}（非現場更新日期）
        </p>}
      </div>
    </div>;
}
