import {
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  ExternalLink,
  FileText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { buildSpecialSaleDetails, parseRevenueCalculationBasis, type SpecialSaleFields } from "../lib/specialSaleAnalysis";
import { consumerListingFields } from "../lib/consumerListingText";

export function SpecialSaleReport({ fields: sourceFields }: { fields: SpecialSaleFields }) {
  const fields = consumerListingFields(sourceFields);
  const d = buildSpecialSaleDetails(fields);
  if (!d.excludeCondoComparison) return null;

  const renovation = presentRenovation(fields.renovationDetails);
  const handoverDate = presentHandoverDate(fields.handoverDetails);
  const otherConditions = presentOtherConditions(fields.specialNotes);
  const revenueDetails = parseRevenueCalculationBasis(fields.revenueDetails || fields.annualIncome);
  const revenueScope = presentRevenueScope(fields.revenueScope, d.kind);
  const hospitalityInfo = parseHospitalityInfo(fields.hospitalityDetails);

  const standardRows: Array<[string, string]> = [
    ...(fields.priceDetails ? [["售價（版本與稅金範圍）", fields.priceDetails]] as [string, string][] : []),
    ["土地面積／私道負擔", fields.landArea || "未載明，待查謄本"],
    [
      d.kind === "land" ? "現存建物面積" : "建物總面積／各樓層",
      fields.buildingArea || (d.kind === "land" ? "" : fields.area) || "未載明",
    ],
    ["接道與建築限制", fields.roadDetails || "未載明，需核對道路及建築資料"],
    ...(fields.buildingCondition ? [["建物完成／新舊記載", fields.buildingCondition]] as [string, string][] : []),
    ...(fields.unitBreakdown ? [["用途與戶數組成", fields.unitBreakdown]] as [string, string][] : []),
    ...(fields.optionalFacilities ? [["停車／選配設施", fields.optionalFacilities]] as [string, string][] : []),
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

  return (
    <section aria-label="特殊買賣物件分析" className="space-y-6">

      {/* ── 物件條件表格（透天住宅／整棟／土地規格） ── */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
            <Building2 className="h-4 w-4 text-[#007D5A]" />
            <span>{d.kindLabel}・物件條件</span>
          </div>
          {d.marketNote && (
            <p className="border-[#D6DDD9] text-xs leading-relaxed text-[#3F5147] sm:border-l sm:pl-4">
              {d.marketNote}
            </p>
          )}
        </div>

        <div className="overflow-hidden border border-[#DDE3DF] bg-white">
          <dl className="grid sm:grid-cols-2">
            {standardRows.map(([label, value], index) => (
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
            {/* 若標準項目為奇數，補齊右側邊界與線條 */}
            {standardRows.length % 2 === 1 && (
              <div className="hidden border-t border-[#DDE3DF] sm:block sm:border-l bg-[#FAFCFB]" />
            )}
            {/* 年度稅額：獨立橫跨兩欄 (sm:col-span-2)，上方有完整 border-t，徹底解決「停車那個表格下方少了線」的問題 */}
            {/* 這列橫跨兩欄，標題欄寬必須與上方 2-up 的標題欄完全一致。
                舊版另外給 0.36fr / 1.64fr，換算後比上方的標題欄寬，看起來就像表頭凸出去。
                改成直接沿用同一組軌道（複製兩次），值欄再跨 3 格。 */}
            <div className="grid min-w-0 border-t border-[#DDE3DF] sm:col-span-2 sm:grid-cols-[minmax(8rem,0.72fr)_minmax(0,1.55fr)_minmax(8rem,0.72fr)_minmax(0,1.55fr)]">
              <dt className="bg-[#F5F8F6] px-3 py-2.5 text-[11px] leading-relaxed text-[#58685F]">
                年度稅額
              </dt>
              <dd className="whitespace-pre-line break-words px-3 py-2.5 text-xs font-semibold leading-relaxed text-[#1A2A22] sm:col-span-3">
                {fields.taxDetails || "圖紙未載明年度稅額，其他稅費數字屬概算"}
              </dd>
            </div>
          </dl>

          {(d.illustrativePhotos || d.renovationExtra) && (
            <div className="space-y-1.5 border-t border-[#EAB879] bg-[#FFF8E9] px-4 py-3 text-xs leading-relaxed text-[#76511F]">
              {d.illustrativePhotos && <p className="font-bold">室內照片為翻新後示意圖，不能作為已完工現況。</p>}
              {d.renovationExtra && (
                <p className="font-bold">刊載售價為翻新前／現況價格；另估翻新費未含在售價及交屋費用小計。投報率是否包含翻新成本，需另核對計算分母。</p>
              )}
            </div>
          )}

          {/* 這列的分隔線要落在與上方欄位相同的位置，所以沿用同一組軌道（複製兩次），
              內容欄再跨 3 格；標籤在自己的格子裡上下左右置中。 */}
          <div className="grid border-t border-[#DDE3DF] bg-white sm:grid-cols-[minmax(8rem,0.72fr)_minmax(0,1.55fr)_minmax(8rem,0.72fr)_minmax(0,1.55fr)]">
            <div className="flex items-center justify-center gap-2 border-[#DDE3DF] px-3 py-3 text-xs font-bold text-[#007D5A] sm:border-r">
              <CircleAlert className="h-4 w-4 shrink-0" />
              注意事項
            </div>
            <ul className="list-disc space-y-1.5 px-3 py-3 pl-7 text-[11px] leading-relaxed text-[#58685F] sm:col-span-3">
              {propertyCautions.map((item) => <li key={item}>{item}</li>)}
              {/客室/.test(fields.unitBreakdown || "") && (
                <li className="text-[#76511F]">客室數、管理室／備品室與總戶數的計數方式可能不同，需逐室核對。</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 1. 交付與契約條件 ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
            <FileText className="h-4 w-4 text-[#007D5A]" />
            <span>交付與契約條件</span>
          </div>
          <span className="text-[10px] text-[#66736C]">交屋時程、翻新履歷與契約規範</span>
        </div>

        <div className="border border-[#DDE3DF] bg-white">
          {/* 交付時程與現況雙欄指標 */}
          <div className="grid divide-y divide-[#DDE3DF] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#66736C]">
                <CalendarDays className="h-4 w-4 text-[#007D5A]" />
                <span>交付預定日期（引渡時期）</span>
              </div>
              <p className="mt-2 text-xl font-black tabular-nums text-[#1A2A22]">
                {handoverDate}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8A9590]">
                圖面記載預定引渡時程，確切交屋與產權移轉日依買賣契約協議。
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#66736C]">
                <Wrench className="h-4 w-4 text-[#007D5A]" />
                <span>交屋現況與工程狀態</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/リフォーム中|改装中|工事中|翻[新修]中|裝修|内装中/.test(fields.occupancyStatus || "") && (
                  <span className="border border-[#EAB879] bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#D97706]">
                    裝修進行中
                  </span>
                )}
                {/空室|空き|空屋|空置/.test(fields.occupancyStatus || "") && (
                  <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-xs font-bold text-[#007D5A]">
                    現況空室
                  </span>
                )}
                <p className="text-base font-bold text-[#1A2A22]">
                  {fields.occupancyStatus || "未載明，待確認"}
                </p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8A9590]">
                完工驗收、現場修繕品質與交屋清點需核對工單與保固項目。
              </p>
            </div>
          </div>

          {/* 翻修工程詳細記載 */}
          {fields.renovationDetails && (
            <div className="border-t border-[#DDE3DF] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A2A22]">
                  <Sparkles className="h-4 w-4 text-[#007D5A]" />
                  <span>翻新記載與施作項目</span>
                </div>
                {renovation.summary && (
                  <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2.5 py-0.5 text-[11px] font-bold text-[#007D5A]">
                    {renovation.summary}
                  </span>
                )}
              </div>

              {renovation.items.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {renovation.items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-1 text-[11px] font-bold text-[#007D5A]"
                    >
                      <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-line break-words text-xs font-semibold leading-relaxed text-[#1A2A22]">
                  {fields.renovationDetails}
                </p>
              )}
            </div>
          )}

          {/* 圖紙特約與補充條件 */}
          {otherConditions.length > 0 && (
            <div className="border-t border-[#DDE3DF] p-4 sm:p-5">
              <div className="flex items-center gap-2 pb-2 text-xs font-bold text-[#1A2A22]">
                <ScrollText className="h-4 w-4 text-[#007D5A]" />
                <span>圖紙特約與補充約定</span>
              </div>
              <ul className="grid gap-2 text-xs text-[#3F5147] sm:grid-cols-2">
                {otherConditions.map((condition) => (
                  <li
                    key={condition.raw}
                    className="flex items-start gap-2 border border-[#E8ECE9] bg-white p-2.5"
                    title={condition.translated ? `圖面原文：${condition.raw}` : undefined}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#007D5A]" />
                    <span className="leading-relaxed">{condition.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 交付與契約核對重點注意事項 */}
          <div className="border-t border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:p-5">
            <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[#3F5147]">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#007D5A]" />
              <div className="space-y-1">
                <p className="font-bold text-[#007D5A]">買賣契約核對重點：</p>
                <ul className="list-disc space-y-1 pl-4 text-[11px] text-[#58685F]">
                  <li>預定完工、退去或交付日期仍需核對現場目前進度與實際交屋協議。</li>
                  <li>買方用途與登記資料尚未確認，不能僅以建物總面積判定自住減稅適用。</li>
                  {d.handoverConflict && (
                    <li className="font-bold text-[#B13818]">
                      交付條件矛盾：同時記載更地交付與現況交付／解體協商。拆除責任、費用、交屋狀態與期限尚未確認。
                    </li>
                  )}
                  {d.kind === "land" && (
                    <li>
                      「建築条件なし」仍須核對用途地域、建蔽率、容積率、接道及防火限制。古屋拆除、整地與新建費用未列入交屋費用小計；契約不適合責任免責範圍須核對合約特約。
                    </li>
                  )}
                  {(d.illustrativePhotos || d.renovationExtra) && (
                    <>
                      {d.illustrativePhotos && <li className="font-bold text-[#D97706]">室內照片為翻新後示意圖，不能作為已完工驗收現況。</li>}
                      {d.renovationExtra && <li className="font-bold text-[#D97706]">刊載售價為翻新前／現況價格；另估翻新費未含在售價及交屋費用小計。投報率是否包含翻新成本，需另核對計算分母。</li>}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 住宿用途與許可 ── */}
      {d.hospitality && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
              <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
              <span>住宿用途與許可核對</span>
            </div>
            <span className="text-[10px] text-[#66736C]">旅館業法・住宅宿泊事業法（民泊）</span>
          </div>

          <div className="border border-[#DDE3DF] bg-white">
            {/* 上半部：狀態判定與營運規模並列 */}
            <div className="grid divide-y divide-[#DDE3DF] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* 許可狀態判定 */}
              <div className="min-w-0 p-4 sm:p-5">
                <p className="text-[11px] font-bold text-[#66736C]">許可狀態判定</p>
                <div className="mt-2">
                  <span className={`inline-block border px-2.5 py-1 text-xs font-bold ${
                    d.permitStatus === "approved_claim"
                      ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                      : d.permitStatus === "pending"
                        ? "border-[#EAB879] bg-[#FFFBEB] text-[#D97706]"
                        : "border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]"
                  }`}>
                    {d.permitLabel}
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[#3F5147]">
                  {d.permitStatus === "approved_claim" && "圖紙標示已取得營業許可，但日本民泊／旅館業許可原則屬於經營主體名義，不隨不動產產權自動過戶，買方承接營業需確認能否辦理名義變更或需重新申請。"}
                  {d.permitStatus === "pending" && "「申請済」表示前手或業者已向主管機關遞件，但尚未正式取得核准番號或許可書，仍有被退件補正或增設消防設備之風險。"}
                  {d.permitStatus === "support_only" && "圖紙僅表示可協助取得許可，目前尚無任何已送件或核准依據，不得視為合法營業中資產。"}
                  {d.permitStatus === "possibility_only" && "圖紙僅載明住宿用途可能，尚未確認是否符合消防設備標準、自治體條例限制及申請許可。"}
                  {d.permitStatus === "conflicting" && "圖紙上同時出現申請中與已取得許可等矛盾記載，必須取得官方文件證明核實。"}
                  {d.permitStatus === "unconfirmed" && "圖紙未載明具體許可證明，需向仲介確認現有許可狀態與文件。"}
                </p>
              </div>

              {/* 營運規模與圖面記載 */}
              <div className="min-w-0 p-4 sm:p-5">
                <p
                  className="text-[11px] font-bold text-[#66736C]"
                  title={fields.hospitalityDetails ? `圖面原文：${fields.hospitalityDetails}` : undefined}
                >
                  營運條件與規模
                </p>
                <dl className="mt-2.5 space-y-2 text-xs">
                  <div className="flex items-baseline justify-between border-b border-[#E8ECE9] pb-1.5">
                    <dt className="text-[#66736C]">最大容納人數</dt>
                    <dd className="font-black tabular-nums text-[#1A2A22]">
                      {hospitalityInfo.capacity ? `${hospitalityInfo.capacity} 名` : "圖面未標明"}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-[#E8ECE9] pb-1.5">
                    <dt className="text-[#66736C]">許可形式記載</dt>
                    <dd className="font-bold text-[#1A2A22]">
                      {hospitalityInfo.licenseType || "民泊／旅館業"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* 下半部：核對要點與法規指引按鈕 */}
            <div className="border-t border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-xs leading-relaxed text-[#3F5147]">
                  <p className="font-bold text-[#007D5A]">買方接手核對清單：</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-[#58685F]">
                    <li>索取「住宅宿泊事業屆出番號」或「旅館業許可書」正本影本，核對所有人名義與登記地址。</li>
                    <li>確認管轄消防署核發之「消防法令適合通知書」，檢視火警自動警報設備與避難指示燈。</li>
                    <li>確認所在行政區之條例限制（如東京都豊島區對於住居專用地域平日營運、管理業者常駐等特別規定）。</li>
                  </ul>
                </div>
                <a
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 border border-[#007D5A] bg-white px-3.5 py-2 text-xs font-bold text-[#007D5A] shadow-2xs transition-colors hover:bg-[#E6F6F1]"
                  href="https://www.mlit.go.jp/kankocho/minpaku/overview/minpaku/index.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>觀光廳：許可種類說明</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. 營業收入與投報率 ── */}
      {(d.hospitality || d.kind === "whole_building" || (typeof d.annualRevenueYen === "number" && !isNaN(d.annualRevenueYen)) || (typeof d.statedYieldPercent === "number" && !isNaN(d.statedYieldPercent))) && (() => {
        const breakdownItems = revenueDetails.filter(
          (item) => !["圖紙刊載年營收", "年營收合計", "圖紙刊載投報率", "計算前提"].includes(item.label)
        );

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
                <TrendingUp className="h-4 w-4 text-[#007D5A]" />
                <span>營業收入與投報率</span>
              </div>
              <span className="text-[10px] text-[#66736C]">圖紙刊載年營收・投報率驗算與成本風險核對</span>
            </div>

            <div className="border border-[#DDE3DF] bg-white">
              {/* 核心營收與投報率指標（三欄緊湊設計，無重複數字） */}
              <div className="grid divide-y divide-[#DDE3DF] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {/* 欄 1：預估年營收 */}
                <div className="p-4 sm:p-5">
                  <p className="text-[11px] font-bold text-[#66736C]">預估年營收（圖面刊載）</p>
                  <p className="mt-1.5 text-2xl font-black tabular-nums text-[#1A2A22]">
                    {typeof d.annualRevenueYen === "number" && !isNaN(d.annualRevenueYen)
                      ? `${d.annualRevenueYen.toLocaleString()} 円`
                      : "未載明"}
                  </p>
                  {typeof d.annualRevenueYen === "number" && !isNaN(d.annualRevenueYen) && (
                    <p className="mt-1 text-[11px] tabular-nums text-[#66736C]">
                      換算月平均：約 <strong className="font-bold text-[#1A2A22]">{Math.round(d.annualRevenueYen / 12).toLocaleString()}</strong> 円/月
                    </p>
                  )}
                </div>

                {/* 欄 2：表面投報率與驗算 */}
                <div className="p-4 sm:p-5">
                  <p className="text-[11px] font-bold text-[#66736C]">圖紙刊載投報率（表面）</p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-black tabular-nums text-[#1A2A22]">
                      {typeof d.statedYieldPercent === "number" && !isNaN(d.statedYieldPercent)
                        ? `${d.statedYieldPercent.toFixed(2)}%`
                        : typeof d.calculatedYieldPercent === "number" && !isNaN(d.calculatedYieldPercent)
                          ? `${d.calculatedYieldPercent.toFixed(2)}%`
                          : "未載明"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] leading-tight">
                    {d.yieldMismatch ? (
                      <span className="font-bold text-[#B13818]">
                        ⚠ 與售價驗算不符{typeof d.calculatedYieldPercent === "number" && !isNaN(d.calculatedYieldPercent) ? `（驗算為 ${d.calculatedYieldPercent.toFixed(2)}%）` : ""}
                      </span>
                    ) : typeof d.calculatedYieldPercent === "number" && typeof d.statedYieldPercent === "number" ? (
                      <span className="font-semibold text-[#007D5A]">
                        ✓ 營收 ÷ 售價 算術驗算吻合
                      </span>
                    ) : (
                      <span className="text-[#8A9590]">依刊載參數推估</span>
                    )}
                  </div>
                </div>

                {/* 欄 3：收益涵蓋範圍與性質 */}
                <div className="p-4 sm:p-5">
                  <p className="text-[11px] font-bold text-[#66736C]">收益範圍與性質</p>
                  <p className="mt-1.5 text-base font-bold text-[#1A2A22]">
                    {revenueScope}
                    {d.partialIncome && <span className="ml-1 text-xs text-[#D97706]">（部分房號／樓層）</span>}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-block border border-[#EAB879] bg-[#FFFBEB] px-2 py-0.5 text-[11px] font-bold text-[#D97706]">
                      {d.revenueBasisLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* 提示警語 */}
              {d.yieldMismatch && (
                <p className="border-t border-[#DDE3DF] bg-[#FEE2E2] p-3 text-xs font-bold text-[#B13818]">
                  刊載投報率與年營收／售價計算不一致，請確認分母是否包含翻新費、營業權或含稅價格。
                </p>
              )}
              {d.annualRevenueYen == null && typeof d.statedYieldPercent === "number" && !isNaN(d.statedYieldPercent) && (
                <p className="border-t border-[#DDE3DF] bg-[#FFFBEB] p-3 text-xs font-bold text-[#76511F]">
                  圖紙只刊載投報率，未載年收入；未用售價反推收入。空室物件需取得招租假設與租金明細。
                </p>
              )}
              {d.mixedUse && (
                <p className="border-t border-[#DDE3DF] bg-[#FFFBEB] p-3 text-xs leading-relaxed text-[#76511F]">
                  店鋪與住宅混合用途：請分別核對各用途面積、租金、空置與修繕支出，整棟戶數不能當作單一住宅格局。
                </p>
              )}

              {/* 算式拆解：僅在有具體細項拆解時呈現，不重複顯示總額 */}
              {breakdownItems.length > 0 && (
                <div className="border-t border-[#DDE3DF] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#DDE3DF] pb-2.5">
                    <span className="text-xs font-bold text-[#1A2A22]">營收算式細項拆解</span>
                    <span className="text-[10px] text-[#8A9590]">按圖面公式還原組成項目</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {breakdownItems.map((detail) => (
                      <div key={`${detail.label}-${detail.value}`} className="border border-[#E8ECE9] bg-[#F9FBFA] p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-[#007D5A]">{detail.label}</span>
                          {detail.formula && <span className="font-mono text-[11px] text-[#66736C]">{detail.formula}</span>}
                        </div>
                        <p className="mt-1.5 text-lg font-black tabular-nums text-[#1A2A22]">{detail.value}</p>
                      </div>
                    ))}
                    {typeof d.annualRevenueYen === "number" && !isNaN(d.annualRevenueYen) && (
                      <div className="border border-[#9EE2CF] bg-[#F4FBF7] p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-[#007D5A]">年營收合計</span>
                          <span className="text-[10px] font-bold text-[#007D5A]">各項營收加總</span>
                        </div>
                        <p className="mt-1.5 text-lg font-black tabular-nums text-[#007D5A]">
                          {d.annualRevenueYen.toLocaleString()} 円
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 實質收益核算提醒 */}
              <div className="border-t border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:p-5">
                <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[#3F5147]">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#007D5A]" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#007D5A]">實質收益核算要點：</p>
                    <ul className="list-disc space-y-1 pl-4 text-[11px] text-[#58685F]">
                      <li>以上為營收與售價之表面比例（表面投報率），尚未扣除清掃費、訂房平台佣金（約 15%~18%）、代管營運費（約 20%）、水電瓦斯、固都稅、火災保險與修繕預備金。</li>
                      <li>這不是扣除各項持有營運成本後的實質淨投報率（NOI 淨收益率）。</li>
                      <li>以房價×天數或假設稼動率計算者屬情境推估；即使標示「實績」，仍須核對過往 1~2 年之報稅帳務與月度報表。</li>
                      <li>民泊與月租（中長期出租）收入混合運營時，需確認淡旺季轉換機制與最短租期規範。</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

function Metric({ label, value, className = "", sub }: { label: string; value: string; className?: string; sub?: string }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      <p className="text-[11px] font-bold text-[#66736C]">{label}</p>
      <p className="mt-1.5 text-2xl font-black leading-none tabular-nums text-[#1A2A22]">{value}</p>
      {sub && <p className="mt-1.5 text-[10px] text-[#8A9590]">{sub}</p>}
    </div>
  );
}

function presentHandoverDate(raw?: string | null) {
  if (!raw || typeof raw !== "string" || !raw.trim()) return "圖紙未載明，待確認";
  return raw.trim().replace(/^(?:引渡予定|引渡時期|交付日期|交屋日期)\s*[：:]\s*/u, "");
}

function presentRenovation(raw?: string | null) {
  if (!raw || typeof raw !== "string" || !raw.trim()) return { summary: "", items: [] as string[] };
  const value = raw.trim();
  const match = value.match(/^(.{1,100}?)[：:]\s*(.+)$/su);
  let summary = "";
  let body = value;

  if (match) {
    summary = match[1].replace(/^[-\s]+|[-\s]+$/g, "").trim();
    body = match[2];
  } else if (value.includes("フルリフォーム") || value.includes("リフォーム") || value.includes("翻新") || value.includes("翻修")) {
    const lines = value.split(/[\n\r]+/);
    if (lines.length > 1 && /リフォーム|翻[新修]/.test(lines[0])) {
      summary = lines[0].replace(/^[-\s]+|[-\s]+$/g, "").trim();
      body = lines.slice(1).join("、");
    }
  }

  // 分割施作項目。括號內的頓號不能當分隔符，否則「車庫塗裝與室內改裝（內裝中，預計7/25完工）」
  // 會被切成「…（內裝中」與「預計7/25完工）」兩張括號不成對的碎片。
  // 先把括號內容換成佔位符，切完再還原。
  const parens: string[] = [];
  const masked = body.replace(/[（(][^（()）]*[)）]/gu, (m) => {
    parens.push(m);
    return `\u0000${parens.length - 1}\u0000`;
  });
  const rawItems = masked
    .split(/[、，,\n・]+/u)
    .flatMap((item) => item.split(/[。；;]+/u))
    .map((item) => item.replace(/\u0000(\d+)\u0000/g, (_, i) => parens[Number(i)] ?? ""))
    .map((item) => item.trim().replace(/^[-・•*※\s]+|[-・•*※\s]+$/g, ""))
    // 「以及外牆」這種承接詞開頭的碎片，去掉連接詞才讀得通
    .map((item) => item.replace(/^(?:以及|及|並|與|および|及び)\s*/u, "").trim())
    .filter(Boolean);

  const cleanItems = rawItems.map((item) => {
    return item
      .replace(/壁紙重點/g, "全室壁紙重貼")
      .replace(/壁紙の?張替え/g, "全室壁紙重貼")
      .replace(/フルリフォーム済?/g, "全室翻新完成");
  });

  // 圖面寫「フルリフォーム済」是已完成，但擷取時常被冠上「預計／予定」，
  // 結果畫面同時出現兩個「預計完工日」（翻新履歷 vs 現場工程），看起來自相矛盾。
  // 含「済／完成」的敘述一律剝掉預計字樣。
  const normalizeSummary = (text: string) => {
    const done = /済|完成/.test(text);
    let out = text
      .replace(/壁紙重點/g, "全室壁紙重貼")
      .replace(/フルリフォーム済?/g, "全室翻新完成");
    if (done) out = out.replace(/預計|預定|予定/g, "").trim();
    return out.replace(/\s{2,}/g, " ");
  };

  return {
    summary: normalizeSummary(summary),
    items: cleanItems.length > 0 ? cleanItems : (body ? [body] : []),
  };
}

/** 圖紙特約常見日文寫法的中文對照；找不到規則時保留原文，不硬翻。 */
const CONDITION_RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^約?\s*([\d.]+)\s*帖\s*サービスルーム\s*[（(]?納戸[)）]?\s*付き?$/u, (m) => `附約 ${m[1]} 帖多功能室（納戸，建築法規上不計入居室）`],
  [/^サービスルーム\s*[（(]?納戸[)）]?/u, () => "附多功能室（納戸，建築法規上不計入居室）"],
  [/^現況\s*[：:]\s*内装中\s*[（(]\s*(.+?)\s*完工予定\s*[)）]$/u, (m) => `現況：內裝工程中（預計 ${m[1]} 完工）`],
  [/^現況\s*[：:]\s*内装中/u, () => "現況：內裝工程中"],
  [/^現況\s*[：:]\s*空室/u, () => "現況：空屋"],
  [/^現況\s*[：:]\s*賃貸中/u, () => "現況：出租中（帶租約）"],
  [/^都市計画\s*[：:]\s*市街化区域/u, () => "都市計畫：市街化區域（可建築區域）"],
  [/^都市計画\s*[：:]\s*市街化調整区域/u, () => "都市計畫：市街化調整區域（原則限制建築）"],
  [/^引渡[しズ]?\s*[：:]\s*(.+)$/u, (m) => `交屋時期：${m[1]}`],
  [/^取引[様態]*\s*[：:]\s*(.+)$/u, (m) => `交易形態：${m[1]}`],
  [/^地目\s*[：:]\s*宅地/u, () => "地目：宅地（住宅用地）"],
  [/^接道\s*[：:]\s*(.+)$/u, (m) => `接道狀況：${m[1]}`],
  [/^私道負担\s*[：:]?\s*(.*)$/u, (m) => `私道負擔：${m[1] || "詳圖面"}`],
  [/^民泊運営許可取得済/u, () => "已取得民泊營運許可（許可屬經營主體，不隨產權自動移轉）"],
  [/^外壁[・･]?車庫塗装から室内リフォーム実施/u, () => "自外牆、車庫塗裝到室內全面翻修"],
  [/^フルリフォーム済/u, () => "全室翻新完成"],
  [/^即入居可/u, () => "可立即入住"],
  [/^広告掲載\s*[：:]\s*不可/u, () => "廣告刊登：不可"],
];

export interface PresentedCondition {
  text: string;
  raw: string;
  translated: boolean;
}

function presentOtherConditions(raw?: string | null): PresentedCondition[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(/[。\n]+/u)
    .map((condition) => condition.trim().replace(/^[-・•*※\s]+|[-・•*※\s]+$/g, ""))
    .filter(Boolean)
    .filter((condition) => !/預定完工|退去或交屋|自住減稅|登記資料尚未確認/i.test(condition))
    .map((condition) => {
      const normalized = condition.normalize("NFKC");
      for (const [pattern, render] of CONDITION_RULES) {
        const m = normalized.match(pattern);
        if (m) return { text: render(m), raw: condition, translated: true };
      }
      return { text: condition, raw: condition, translated: false };
    });
}

function presentRevenueScope(raw?: string | null, kind?: string) {
  if (raw && typeof raw === "string" && raw.trim()) {
    return raw.trim()
      .replace(/一棟全体|一棟全棟/gu, "整棟")
      .replace(/(\d+)号室/gu, "$1號室")
      .replace(/(\d+)Fのみ/gu, "僅 $1 樓");
  }
  if (kind === "detached") return "整棟住宅（全戶）";
  if (kind === "whole_building") return "整棟建物";
  if (kind === "land") return "全筆土地";
  return "全戶／整棟推估";
}

function parseHospitalityInfo(raw?: string | null) {
  if (!raw || typeof raw !== "string") return { capacity: null, licenseType: null };
  const text = raw.normalize("NFKC");
  const capacityMatch = text.match(/(?:宿泊|収容|收容|定員)?\s*(?:人数|人數|定員)\s*[:：]?\s*(\d+)\s*名?/u);
  const capacity = capacityMatch ? Number(capacityMatch[1]) : null;
  const licenseType = /旅館業/.test(text) ? "旅館業營業許可" : /民泊/.test(text) ? "住宅宿泊事業（民泊）" : null;
  return { capacity, licenseType };
}
