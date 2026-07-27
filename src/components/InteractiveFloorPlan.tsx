import { useState } from "react";

export interface RoomDetail {
  code: string;
  nameEn: string;
  nameZh: string;
  jpName?: string;
  desc: string;
  category: "room" | "bath" | "storage" | "equipment";
}

export const FLOOR_PLAN_ITEMS: Record<string, RoomDetail> = {
  L: {
    code: "L",
    nameEn: "Living Room",
    nameZh: "客廳",
    jpName: "居間",
    desc: "主要生活與起居空間，通常設有大面積採光窗戶或連接戶外陽台。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳",
    jpName: "食事室",
    desc: "用餐專用區域，日本物件多與客廳及廚房結合為 LDK 開放格局。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房",
    jpName: "台所",
    desc: "獨立或中島開放式廚房，包含洗滌水槽、瓦斯爐/IH電磁爐與料理檯面。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room",
    nameZh: "納戶 (多功能室)",
    jpName: "納戸・サービスルーム",
    desc: "因採光或通風窗戶面積未達法定房間標準（建築基準法），故標示為納戶，常用作書房或大型儲藏室。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet",
    nameZh: "獨立廁所",
    jpName: "トイレ",
    desc: "獨立分隔的馬桶間，日本多數中高階大廈為「衛浴分離（バストイレ別）」，多配置溫水洗淨便座。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室",
    jpName: "ユニットバス",
    desc: "太空艙型一體成型防水浴室，集深型泡澡浴缸、淋浴區與洗面設備於一室，防水性與保溫極佳。",
    category: "bath"
  },
  CL: {
    code: "CL",
    nameEn: "Closet",
    nameZh: "壁櫥 / 衣櫥",
    jpName: "クローゼット",
    desc: "標準牆面內嵌式衣櫃，配有二折或雙開拉門與掛衣桿。",
    category: "storage"
  },
  WIC: {
    code: "WIC",
    nameEn: "Walk-in Closet",
    nameZh: "步入式衣帽間",
    jpName: "ウォークインクローゼット",
    desc: "人可直接走進去的獨立衣帽間，設有層架與雙側掛衣區，收納容量極大。",
    category: "storage"
  },
  SB: {
    code: "SB",
    nameEn: "Shoes Box",
    nameZh: "鞋櫃 / 下駄箱",
    jpName: "シューズボックス",
    desc: "位於玄關進門處的收納鞋櫃，高階物件多為可置放落地方傘的大容量 Schuh-Cloak。",
    category: "storage"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機放置處",
    jpName: "洗濯機置場",
    desc: "室內專用防水盤（洗濯機パン）與專用給排水龍頭與電源插座。",
    category: "equipment"
  },
  R: {
    code: "R",
    nameEn: "Refrigerator Space",
    nameZh: "冰箱預留位",
    jpName: "冷蔵庫置場",
    desc: "廚房檯面旁邊預留的專用冰箱安裝位置與插座。",
    category: "equipment"
  },
  AC: {
    code: "AC",
    nameEn: "Air Conditioner",
    nameZh: "冷氣預留位 / 變頻冷氣",
    jpName: "エアコン",
    desc: "牆面上方預留的冷氣機專用插座、冷媒管穿牆孔與室內機掛位。",
    category: "equipment"
  }
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; highlight: string }> = {
  room: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", highlight: "#00a174" },
  bath: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", highlight: "#0284c7" },
  storage: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", highlight: "#d97706" },
  equipment: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", highlight: "#9333ea" }
};

export function InteractiveFloorPlan() {
  const [activeCode, setActiveCode] = useState<string | null>("L");

  const currentItem = activeCode ? FLOOR_PLAN_ITEMS[activeCode] : null;

  return (
    <div className="my-4 rounded-lg border border-[#DDE3DF] bg-[#F9FBF9] p-3 md:p-5 shadow-sm">
      {/* Header title */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
        <div>
          <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-[#1A2A22] md:text-base">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00a174] text-[11px] text-white">
              📐
            </span>
            日本住宅平面圖互動導覽（1LDK + S）
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500 font-sans">
            游標移至圖紙代號或下方標籤即可檢視空間細節與房仲解析
          </p>
        </div>
        <span className="rounded bg-[#e6f6f1] px-2 py-0.5 font-mono text-[11px] font-medium text-[#007d5a]">
          Interactive Floor Plan
        </span>
      </div>

      {/* Main Content Grid: SVG + Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* SVG Floor Plan Canvas */}
        <div className="lg:col-span-8 overflow-hidden rounded-md border border-zinc-300 bg-white p-2 shadow-inner">
          <div className="relative w-full aspect-[600/380]">
            <svg
              viewBox="0 0 600 380"
              className="h-full w-full select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {/* Grid Background Pattern */}
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00a174" floodOpacity="0.6" />
                </filter>
              </defs>

              <rect width="600" height="380" fill="url(#gridPattern)" />

              {/* Floor Plan Perimeter Outer Line */}
              <rect x="20" y="20" width="560" height="340" fill="none" stroke="#1A2A22" strokeWidth="1" strokeDasharray="3 3" />

              {/* --- ROOM ZONES & INTERACTIVE HIGHLIGHTS --- */}

              {/* 1. UB (Unit Bath) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("UB")}
                onClick={() => setActiveCode("UB")}
              >
                <rect
                  x="30"
                  y="30"
                  width="90"
                  height="80"
                  fill={activeCode === "UB" ? "#e0f2fe" : "#f8fafc"}
                  stroke={activeCode === "UB" ? "#0284c7" : "#334155"}
                  strokeWidth={activeCode === "UB" ? "2.5" : "1.5"}
                  filter={activeCode === "UB" ? "url(#glow)" : undefined}
                />
                {/* Bathtub graphic */}
                <rect x="36" y="36" width="78" height="42" rx="10" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="48" cy="57" r="4" fill="none" stroke="#94a3b8" strokeWidth="1" />
                {/* Label */}
                <rect x="58" y="84" width="34" height="18" rx="3" fill={activeCode === "UB" ? "#0284c7" : "#e2e8f0"} />
                <text x="75" y="97" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "UB" ? "#ffffff" : "#1e293b"}>
                  UB
                </text>
              </g>

              {/* 2. WC (Water Closet) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("WC")}
                onClick={() => setActiveCode("WC")}
              >
                <rect
                  x="120"
                  y="30"
                  width="60"
                  height="80"
                  fill={activeCode === "WC" ? "#e0f2fe" : "#f8fafc"}
                  stroke={activeCode === "WC" ? "#0284c7" : "#334155"}
                  strokeWidth={activeCode === "WC" ? "2.5" : "1.5"}
                  filter={activeCode === "WC" ? "url(#glow)" : undefined}
                />
                {/* Toilet Bowl graphic */}
                <ellipse cx="150" cy="55" rx="12" ry="16" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="140" y="34" width="20" height="8" rx="2" fill="#cbd5e1" />
                {/* Label */}
                <rect x="133" y="84" width="34" height="18" rx="3" fill={activeCode === "WC" ? "#0284c7" : "#e2e8f0"} />
                <text x="150" y="97" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "WC" ? "#ffffff" : "#1e293b"}>
                  WC
                </text>
              </g>

              {/* 3. Wash Basin & 洗衣機位 W */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("W")}
                onClick={() => setActiveCode("W")}
              >
                <rect
                  x="30"
                  y="110"
                  width="150"
                  height="70"
                  fill={activeCode === "W" ? "#f3e8ff" : "#fafafa"}
                  stroke={activeCode === "W" ? "#9333ea" : "#334155"}
                  strokeWidth={activeCode === "W" ? "2.5" : "1.5"}
                />
                {/* Washing machine Pan */}
                <rect x="40" y="120" width="45" height="45" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 2" />
                <text x="62.5" y="147" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "W" ? "#9333ea" : "#475569"}>
                  W
                </text>
                {/* Washbasin sink */}
                <rect x="100" y="120" width="65" height="45" rx="4" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <ellipse cx="132.5" cy="142.5" rx="18" ry="12" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                <text x="132.5" y="174" textAnchor="middle" fontSize="9" fill="#64748b">洗面室</text>
              </g>

              {/* 4. S (Service Room / 納戶) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("S")}
                onClick={() => setActiveCode("S")}
              >
                <rect
                  x="30"
                  y="180"
                  width="150"
                  height="170"
                  fill={activeCode === "S" ? "#ecfdf5" : "#f0fdf4"}
                  stroke={activeCode === "S" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "S" ? "2.5" : "1.5"}
                  filter={activeCode === "S" ? "url(#glow)" : undefined}
                />
                <rect x="75" y="245" width="60" height="30" rx="4" fill={activeCode === "S" ? "#00a174" : "#10b981"} />
                <text x="105" y="265" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#ffffff">
                  S
                </text>
                <text x="105" y="290" textAnchor="middle" fontSize="11" fill="#047857" fontWeight="500">
                  納戶 (Service Room)
                </text>
              </g>

              {/* 5. Entrance & SB (Shoes Box) & Hallway */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("SB")}
                onClick={() => setActiveCode("SB")}
              >
                {/* Hallway area */}
                <rect x="180" y="30" width="70" height="150" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
                <text x="215" y="70" textAnchor="middle" fontSize="10" fill="#64748b">廊下</text>
                
                {/* Entrance (玄關) */}
                <rect x="180" y="180" width="70" height="70" fill="#f1f5f9" stroke="#334155" strokeWidth="1.5" />
                <text x="215" y="210" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">玄關</text>
                
                {/* SB Shoe Box */}
                <rect
                  x="185"
                  y="220"
                  width="60"
                  height="24"
                  rx="3"
                  fill={activeCode === "SB" ? "#d97706" : "#fef3c7"}
                  stroke={activeCode === "SB" ? "#b45309" : "#d97706"}
                  strokeWidth="1.5"
                />
                <text x="215" y="236" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "SB" ? "#ffffff" : "#92400e"}>
                  SB
                </text>
              </g>

              {/* Entrance Front Door Arc */}
              <path d="M 250 210 A 40 40 0 0 1 250 250" fill="none" stroke="#00a174" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="250" y1="210" x2="250" y2="250" stroke="#1A2A22" strokeWidth="2" />

              {/* 6. WIC (Walk-in Closet) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("WIC")}
                onClick={() => setActiveCode("WIC")}
              >
                <rect
                  x="180"
                  y="250"
                  width="70"
                  height="100"
                  fill={activeCode === "WIC" ? "#fef3c7" : "#fffbe6"}
                  stroke={activeCode === "WIC" ? "#d97706" : "#334155"}
                  strokeWidth={activeCode === "WIC" ? "2.5" : "1.5"}
                  filter={activeCode === "WIC" ? "url(#glow)" : undefined}
                />
                {/* Hanger Rack line */}
                <line x1="190" y1="260" x2="190" y2="340" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x="198" y="285" width="44" height="24" rx="3" fill={activeCode === "WIC" ? "#d97706" : "#fde68a"} />
                <text x="220" y="301" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "WIC" ? "#ffffff" : "#78350f"}>
                  WIC
                </text>
              </g>

              {/* 7. K (Kitchen) & R (Refrigerator) */}
              {/* K Area */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("K")}
                onClick={() => setActiveCode("K")}
              >
                <rect
                  x="250"
                  y="30"
                  width="190"
                  height="80"
                  fill={activeCode === "K" ? "#ecfdf5" : "#f8fafc"}
                  stroke={activeCode === "K" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "K" ? "2.5" : "1.5"}
                />
                {/* Kitchen Counter & Stove */}
                <rect x="260" y="35" width="120" height="40" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <circle cx="280" cy="55" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="305" cy="55" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="330" y="45" width="35" height="22" rx="2" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="310" y="85" width="36" height="20" rx="3" fill={activeCode === "K" ? "#00a174" : "#10b981"} />
                <text x="328" y="99" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ffffff">
                  K
                </text>
              </g>

              {/* R Area (Refrigerator Box) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("R")}
                onClick={() => setActiveCode("R")}
              >
                <rect
                  x="390"
                  y="35"
                  width="42"
                  height="42"
                  rx="3"
                  fill={activeCode === "R" ? "#f3e8ff" : "#faf5ff"}
                  stroke={activeCode === "R" ? "#9333ea" : "#a855f7"}
                  strokeWidth={activeCode === "R" ? "2.5" : "1.5"}
                  strokeDasharray="2 2"
                />
                <text x="411" y="60" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "R" ? "#9333ea" : "#7e22ce"}>
                  R
                </text>
              </g>

              {/* 8. D (Dining Area) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("D")}
                onClick={() => setActiveCode("D")}
              >
                <rect
                  x="250"
                  y="110"
                  width="190"
                  height="110"
                  fill={activeCode === "D" ? "#ecfdf5" : "#ffffff"}
                  stroke={activeCode === "D" ? "#00a174" : "none"}
                  strokeWidth="2"
                />
                {/* Dining Table Graphic */}
                <rect x="300" y="130" width="70" height="45" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="290" cy="152.5" r="5" fill="#e2e8f0" />
                <circle cx="380" cy="152.5" r="5" fill="#e2e8f0" />
                <rect x="320" y="185" width="30" height="22" rx="3" fill={activeCode === "D" ? "#00a174" : "#10b981"} />
                <text x="335" y="201" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ffffff">
                  D
                </text>
              </g>

              {/* 9. L (Living Area) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("L")}
                onClick={() => setActiveCode("L")}
              >
                <rect
                  x="250"
                  y="220"
                  width="330"
                  height="130"
                  fill={activeCode === "L" ? "#ecfdf5" : "#ffffff"}
                  stroke={activeCode === "L" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "L" ? "2.5" : "1.5"}
                  filter={activeCode === "L" ? "url(#glow)" : undefined}
                />
                {/* Sofa & TV Graphic */}
                <rect x="380" y="295" width="110" height="40" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="380" y1="240" x2="490" y2="240" stroke="#94a3b8" strokeWidth="3" />
                <rect x="420" y="260" width="40" height="26" rx="4" fill={activeCode === "L" ? "#00a174" : "#059669"} />
                <text x="440" y="278" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#ffffff">
                  L
                </text>
                <text x="440" y="343" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#047857">
                  LDK 14.5 帖
                </text>
              </g>

              {/* 10. CL (Closet) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("CL")}
                onClick={() => setActiveCode("CL")}
              >
                <rect
                  x="440"
                  y="30"
                  width="140"
                  height="80"
                  fill={activeCode === "CL" ? "#fef3c7" : "#fffbe6"}
                  stroke={activeCode === "CL" ? "#d97706" : "#334155"}
                  strokeWidth={activeCode === "CL" ? "2.5" : "1.5"}
                  filter={activeCode === "CL" ? "url(#glow)" : undefined}
                />
                {/* Bifold door line */}
                <path d="M 440 110 L 470 95 L 500 110 L 530 95 L 560 110" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <rect x="495" y="50" width="34" height="20" rx="3" fill={activeCode === "CL" ? "#d97706" : "#f59e0b"} />
                <text x="512" y="64" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff">
                  CL
                </text>
              </g>

              {/* 11. AC (Air Conditioner) */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("AC")}
                onClick={() => setActiveCode("AC")}
              >
                <rect
                  x="525"
                  y="225"
                  width="48"
                  height="22"
                  rx="3"
                  fill={activeCode === "AC" ? "#f3e8ff" : "#faf5ff"}
                  stroke={activeCode === "AC" ? "#9333ea" : "#a855f7"}
                  strokeWidth={activeCode === "AC" ? "2.5" : "1.5"}
                />
                {/* Airflow waves */}
                <path d="M 535 252 Q 540 256 545 252 T 555 252" fill="none" stroke="#c084fc" strokeWidth="1" />
                <text x="549" y="240" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "AC" ? "#9333ea" : "#7e22ce"}>
                  AC
                </text>
              </g>

              {/* Main Structural Thick Walls */}
              <rect x="20" y="20" width="560" height="340" fill="none" stroke="#1A2A22" strokeWidth="4" />
              <line x1="180" y1="20" x2="180" y2="350" stroke="#1A2A22" strokeWidth="3" />
              <line x1="250" y1="20" x2="250" y2="350" stroke="#1A2A22" strokeWidth="3" />
              <line x1="20" y1="180" x2="250" y2="180" stroke="#1A2A22" strokeWidth="3" />

              {/* Balcony Label Outside Window */}
              <text x="440" y="367" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="500">
                バルコニー (陽台)
              </text>
            </svg>
          </div>
        </div>

        {/* Floating Detail Explanation Card */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          {currentItem ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block border px-2 py-0.5 font-mono text-xs font-bold rounded ${
                      CATEGORY_COLORS[currentItem.category].bg
                    } ${CATEGORY_COLORS[currentItem.category].text} ${
                      CATEGORY_COLORS[currentItem.category].border
                    }`}
                  >
                    {currentItem.code}
                  </span>
                  <h5 className="font-bold text-sm text-[#1A2A22]">{currentItem.nameZh}</h5>
                </div>
                {currentItem.jpName && (
                  <span className="text-[11px] font-sans font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {currentItem.jpName}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-mono font-medium text-zinc-400 mb-1">
                  {currentItem.nameEn}
                </p>
                <p className="text-xs leading-relaxed text-zinc-700 text-justify font-sans">
                  {currentItem.desc}
                </p>
              </div>

              <div className="rounded border border-[#bce8dc] bg-[#f0faf7] p-2.5 text-[11px] text-[#007d5a] font-sans leading-normal">
                💡 <strong>房仲提示</strong>：圖紙上的代號能幫助您快速解讀空間規格，租屋與看房時可與經紀人確認相關設備狀況。
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
              <span className="text-2xl mb-1">👆</span>
              <p className="text-xs">請將游標移至左側平面圖區域，或點擊下方標籤查看詳細說明</p>
            </div>
          )}

          {/* Quick Filter Pill Buttons (for mobile touch friendliness) */}
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <p className="text-[11px] font-bold text-zinc-500 mb-2 font-sans">
              快速切換解說標籤：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(FLOOR_PLAN_ITEMS).map((code) => {
                const item = FLOOR_PLAN_ITEMS[code];
                const isActive = activeCode === code;
                return (
                  <button
                    key={code}
                    onClick={() => setActiveCode(code)}
                    onMouseEnter={() => setActiveCode(code)}
                    className={`px-2 py-0.5 font-mono text-xs font-bold rounded transition-all ${
                      isActive
                        ? "bg-[#00a174] text-white shadow-sm scale-105"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {item.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
