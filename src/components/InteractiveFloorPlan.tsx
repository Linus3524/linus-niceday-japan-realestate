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
    desc: "主要起居與社交空間，通常連同採光窗戶或戶外陽台，採光良好。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳",
    jpName: "食事室",
    desc: "用餐區域，日本 1LDK 物件多與客廳及廚房結合為 LDK 開放式連貫空間。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房",
    jpName: "台所",
    desc: "烹飪專用區，配置洗滌水槽、雙火瓦斯爐/IH電磁爐與料理檯面。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room",
    nameZh: "納戶 (多功能室)",
    jpName: "納戸・サービスルーム",
    desc: "因採光或通風面積未達法定房間標準（建築基準法），故標示為納戶，常作書房、儲藏室或客房。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet",
    nameZh: "獨立廁所",
    jpName: "トイレ",
    desc: "獨立分隔的馬桶間，日本採「衛浴分離（バストイレ別）」，多配備溫水洗淨便座。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室",
    jpName: "ユニットバス",
    desc: "一體成型防水浴室，包含深型泡澡浴缸、淋浴區與洗面設備，保溫防漏性能佳。",
    category: "bath"
  },
  CL: {
    code: "CL",
    nameEn: "Closet",
    nameZh: "壁櫥 / 衣櫥",
    jpName: "クローゼット",
    desc: "標準內嵌式壁櫥，設有折疊門與掛衣桿，提供基礎收納容量。",
    category: "storage"
  },
  WIC: {
    code: "WIC",
    nameEn: "Walk-in Closet",
    nameZh: "步入式衣帽間",
    jpName: "ウォークインクローゼット",
    desc: "可直接步入的大型獨立衣帽間，配置雙側層架與吊衣桿，極具收納優勢。",
    category: "storage"
  },
  SB: {
    code: "SB",
    nameEn: "Shoes Box",
    nameZh: "鞋櫃 / 下駄箱",
    jpName: "シューズボックス",
    desc: "玄關處的專用鞋櫃，部分高階物件包含可存放雨傘與靴子的大型 Schuh-Cloak。",
    category: "storage"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機放置處",
    jpName: "洗濯機置場",
    desc: "室內專用防水盤（洗濯機パン）、獨立給排水龍頭與電源插座。",
    category: "equipment"
  },
  R: {
    code: "R",
    nameEn: "Refrigerator Space",
    nameZh: "冰箱預留位",
    jpName: "冷蔵庫置場",
    desc: "廚房檯面旁邊預留的專用冰箱電源插座與置放空間。",
    category: "equipment"
  },
  AC: {
    code: "AC",
    nameEn: "Air Conditioner",
    nameZh: "冷氣預留位 / 變頻冷氣",
    jpName: "エアコン",
    desc: "牆面上方預留的冷氣專用插座、冷媒管穿牆孔與安裝位置。",
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
            方正型日式住宅平面圖（1LDK + S）
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500 font-sans">
            游標移至圖紙代號或下方標籤即可檢視空間細節與房仲解析
          </p>
        </div>
        <span className="rounded bg-[#e6f6f1] px-2 py-0.5 font-mono text-[11px] font-medium text-[#007d5a]">
          Interactive 1LDK Floor Plan
        </span>
      </div>

      {/* Main Content Grid: SVG + Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* SVG Floor Plan Canvas */}
        <div className="lg:col-span-8 overflow-hidden rounded-md border border-zinc-300 bg-white p-2 shadow-inner">
          <div className="relative w-full aspect-[600/400]">
            <svg
              viewBox="0 0 600 400"
              className="h-full w-full select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {/* Grid Background Pattern */}
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00a174" floodOpacity="0.6" />
                </filter>
              </defs>

              <rect width="600" height="400" fill="url(#gridPattern)" />

              {/* Square Perimeter Blueprint Box (25, 25) to (575, 375) */}
              <rect x="25" y="25" width="550" height="350" fill="#fafafa" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

              {/* --- ROOM ZONES & INTERACTIVE HIGHLIGHTS --- */}

              {/* 1. UB (Unit Bath / 整體浴室) - Top Left */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("UB")}
                onClick={() => setActiveCode("UB")}
              >
                <rect
                  x="30"
                  y="30"
                  width="110"
                  height="90"
                  fill={activeCode === "UB" ? "#e0f2fe" : "#ffffff"}
                  stroke={activeCode === "UB" ? "#0284c7" : "#334155"}
                  strokeWidth={activeCode === "UB" ? "2.5" : "1.5"}
                  filter={activeCode === "UB" ? "url(#glow)" : undefined}
                />
                {/* Bathtub shape */}
                <rect x="38" y="38" width="94" height="46" rx="8" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="52" cy="61" r="4" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <rect x="68" y="94" width="34" height="20" rx="3" fill={activeCode === "UB" ? "#0284c7" : "#38bdf8"} />
                <text x="85" y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff">
                  UB
                </text>
              </g>

              {/* 2. WC (Water Closet / 獨立廁所) - Top Mid-Left */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("WC")}
                onClick={() => setActiveCode("WC")}
              >
                <rect
                  x="140"
                  y="30"
                  width="70"
                  height="90"
                  fill={activeCode === "WC" ? "#e0f2fe" : "#ffffff"}
                  stroke={activeCode === "WC" ? "#0284c7" : "#334155"}
                  strokeWidth={activeCode === "WC" ? "2.5" : "1.5"}
                  filter={activeCode === "WC" ? "url(#glow)" : undefined}
                />
                {/* Toilet Bowl */}
                <ellipse cx="175" cy="58" rx="12" ry="16" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="165" y="36" width="20" height="8" rx="2" fill="#cbd5e1" />
                <rect x="158" y="94" width="34" height="20" rx="3" fill={activeCode === "WC" ? "#0284c7" : "#38bdf8"} />
                <text x="175" y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff">
                  WC
                </text>
              </g>

              {/* 3. 洗面室 & W (Washing Machine Space / 洗衣機位) - Mid Left */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("W")}
                onClick={() => setActiveCode("W")}
              >
                <rect
                  x="30"
                  y="120"
                  width="180"
                  height="70"
                  fill={activeCode === "W" ? "#f3e8ff" : "#ffffff"}
                  stroke={activeCode === "W" ? "#9333ea" : "#334155"}
                  strokeWidth={activeCode === "W" ? "2.5" : "1.5"}
                />
                {/* Washing Machine Pan */}
                <rect x="40" y="130" width="50" height="50" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
                <text x="65" y="160" textAnchor="middle" fontSize="15" fontWeight="bold" fill={activeCode === "W" ? "#9333ea" : "#7e22ce"}>
                  W
                </text>
                {/* Washbasin Sink */}
                <rect x="110" y="130" width="85" height="50" rx="4" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <ellipse cx="152.5" cy="155" rx="20" ry="14" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                <text x="152.5" y="184" textAnchor="middle" fontSize="9" fill="#64748b">洗面所</text>
              </g>

              {/* 4. S (Service Room / 納戶) - Lower Left */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("S")}
                onClick={() => setActiveCode("S")}
              >
                <rect
                  x="30"
                  y="190"
                  width="180"
                  height="125"
                  fill={activeCode === "S" ? "#ecfdf5" : "#f0fdf4"}
                  stroke={activeCode === "S" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "S" ? "2.5" : "1.5"}
                  filter={activeCode === "S" ? "url(#glow)" : undefined}
                />
                <rect x="90" y="235" width="60" height="28" rx="4" fill={activeCode === "S" ? "#00a174" : "#10b981"} />
                <text x="120" y="254" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#ffffff">
                  S
                </text>
                <text x="120" y="280" textAnchor="middle" fontSize="11" fill="#047857" fontWeight="500">
                  納戶 (Service Room)
                </text>
              </g>

              {/* 5. CL (Closet / 衣櫥) - Bottom Left */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("CL")}
                onClick={() => setActiveCode("CL")}
              >
                <rect
                  x="30"
                  y="315"
                  width="180"
                  height="55"
                  fill={activeCode === "CL" ? "#fef3c7" : "#fffbe6"}
                  stroke={activeCode === "CL" ? "#d97706" : "#334155"}
                  strokeWidth={activeCode === "CL" ? "2.5" : "1.5"}
                  filter={activeCode === "CL" ? "url(#glow)" : undefined}
                />
                {/* Bifold door line */}
                <path d="M 30 315 L 75 325 L 120 315 L 165 325 L 210 315" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <rect x="103" y="335" width="34" height="20" rx="3" fill={activeCode === "CL" ? "#d97706" : "#f59e0b"} />
                <text x="120" y="349" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff">
                  CL
                </text>
              </g>

              {/* 6. 玄關 & SB (Shoes Box) - Top Mid-Right */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("SB")}
                onClick={() => setActiveCode("SB")}
              >
                {/* Entrance Area */}
                <rect x="210" y="30" width="80" height="90" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
                <text x="250" y="60" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">玄關</text>
                
                {/* SB Shoes Box */}
                <rect
                  x="215"
                  y="75"
                  width="70"
                  height="26"
                  rx="3"
                  fill={activeCode === "SB" ? "#d97706" : "#fef3c7"}
                  stroke={activeCode === "SB" ? "#b45309" : "#d97706"}
                  strokeWidth="1.5"
                />
                <text x="250" y="92" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "SB" ? "#ffffff" : "#92400e"}>
                  SB
                </text>
              </g>

              {/* Entrance Front Door Swing Arc */}
              <path d="M 210 30 A 40 40 0 0 1 210 70" fill="none" stroke="#00a174" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="210" y1="30" x2="210" y2="70" stroke="#1A2A22" strokeWidth="2.5" />

              {/* 7. K (Kitchen) & R (Refrigerator Space) - Top Center */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("K")}
                onClick={() => setActiveCode("K")}
              >
                <rect
                  x="290"
                  y="30"
                  width="150"
                  height="90"
                  fill={activeCode === "K" ? "#ecfdf5" : "#ffffff"}
                  stroke={activeCode === "K" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "K" ? "2.5" : "1.5"}
                />
                {/* Kitchen Sink & Stove Counter */}
                <rect x="300" y="38" width="100" height="42" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <circle cx="318" cy="59" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="340" cy="59" r="8" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="360" y="48" width="32" height="22" rx="2" fill="none" stroke="#475569" strokeWidth="1" />
                
                <rect x="332" y="92" width="36" height="20" rx="3" fill={activeCode === "K" ? "#00a174" : "#10b981"} />
                <text x="350" y="106" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ffffff">
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
                  x="405"
                  y="38"
                  width="30"
                  height="42"
                  rx="3"
                  fill={activeCode === "R" ? "#f3e8ff" : "#faf5ff"}
                  stroke={activeCode === "R" ? "#9333ea" : "#a855f7"}
                  strokeWidth={activeCode === "R" ? "2.5" : "1.5"}
                  strokeDasharray="2 2"
                />
                <text x="420" y="64" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "R" ? "#9333ea" : "#7e22ce"}>
                  R
                </text>
              </g>

              {/* 8. WIC (Walk-in Closet) - Top Right */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("WIC")}
                onClick={() => setActiveCode("WIC")}
              >
                <rect
                  x="440"
                  y="30"
                  width="130"
                  height="90"
                  fill={activeCode === "WIC" ? "#fef3c7" : "#fffbe6"}
                  stroke={activeCode === "WIC" ? "#d97706" : "#334155"}
                  strokeWidth={activeCode === "WIC" ? "2.5" : "1.5"}
                  filter={activeCode === "WIC" ? "url(#glow)" : undefined}
                />
                {/* Hanger rack lines */}
                <line x1="450" y1="40" x2="560" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x="483" y="60" width="44" height="22" rx="3" fill={activeCode === "WIC" ? "#d97706" : "#fde68a"} />
                <text x="505" y="75" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "WIC" ? "#ffffff" : "#78350f"}>
                  WIC
                </text>
              </g>

              {/* 9. D (Dining Area) - Center Area */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("D")}
                onClick={() => setActiveCode("D")}
              >
                <rect
                  x="210"
                  y="120"
                  width="230"
                  height="110"
                  fill={activeCode === "D" ? "#ecfdf5" : "#ffffff"}
                  stroke={activeCode === "D" ? "#00a174" : "none"}
                  strokeWidth="2"
                />
                {/* Dining Table Graphic */}
                <rect x="275" y="140" width="80" height="50" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="262" cy="165" r="5" fill="#e2e8f0" />
                <circle cx="368" cy="165" r="5" fill="#e2e8f0" />
                <rect x="300" y="198" width="30" height="22" rx="3" fill={activeCode === "D" ? "#00a174" : "#10b981"} />
                <text x="315" y="214" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ffffff">
                  D
                </text>
              </g>

              {/* 10. L (Living Area) - Center-Bottom & Right Area */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("L")}
                onClick={() => setActiveCode("L")}
              >
                <rect
                  x="210"
                  y="230"
                  width="360"
                  height="140"
                  fill={activeCode === "L" ? "#ecfdf5" : "#ffffff"}
                  stroke={activeCode === "L" ? "#00a174" : "#334155"}
                  strokeWidth={activeCode === "L" ? "2.5" : "1.5"}
                  filter={activeCode === "L" ? "url(#glow)" : undefined}
                />
                {/* Sofa & TV Graphic */}
                <rect x="330" y="305" width="130" height="42" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="330" y1="248" x2="460" y2="248" stroke="#94a3b8" strokeWidth="3" />
                <rect x="375" y="268" width="40" height="26" rx="4" fill={activeCode === "L" ? "#00a174" : "#059669"} />
                <text x="395" y="286" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#ffffff">
                  L
                </text>
                <text x="395" y="358" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#047857">
                  LDK 15.2 帖 (方正 1LDK)
                </text>
              </g>

              {/* 11. AC (Air Conditioner) - Mounted on Right Wall */}
              <g
                className="cursor-pointer transition-opacity hover:opacity-90"
                onMouseEnter={() => setActiveCode("AC")}
                onClick={() => setActiveCode("AC")}
              >
                <rect
                  x="520"
                  y="235"
                  width="48"
                  height="22"
                  rx="3"
                  fill={activeCode === "AC" ? "#f3e8ff" : "#faf5ff"}
                  stroke={activeCode === "AC" ? "#9333ea" : "#a855f7"}
                  strokeWidth={activeCode === "AC" ? "2.5" : "1.5"}
                />
                <path d="M 530 262 Q 535 266 540 262 T 550 262" fill="none" stroke="#c084fc" strokeWidth="1" />
                <text x="544" y="250" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "AC" ? "#9333ea" : "#7e22ce"}>
                  AC
                </text>
              </g>

              {/* --- MAIN THICK STRUCTURAL WALLS --- */}
              {/* Outer Boundary Wall (Square) */}
              <rect x="25" y="25" width="550" height="350" fill="none" stroke="#1A2A22" strokeWidth="4" />
              {/* Vertical Dividers */}
              <line x1="210" y1="25" x2="210" y2="375" stroke="#1A2A22" strokeWidth="3.5" />
              <line x1="440" y1="25" x2="440" y2="120" stroke="#1A2A22" strokeWidth="3" />
              {/* Horizontal Dividers */}
              <line x1="25" y1="120" x2="210" y2="120" stroke="#1A2A22" strokeWidth="3" />
              <line x1="25" y1="190" x2="210" y2="190" stroke="#1A2A22" strokeWidth="3" />
              <line x1="25" y1="315" x2="210" y2="315" stroke="#1A2A22" strokeWidth="3" />
              <line x1="210" y1="120" x2="575" y2="120" stroke="#1A2A22" strokeWidth="3" />

              {/* Balcony Label Outside Bottom Window */}
              <text x="395" y="392" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="500">
                バルコニー (陽台 / 南向採光)
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
                💡 <strong>房仲提示</strong>：方正型 1LDK 動線流暢，LDK 與臥室/納戶分明，是日本單身上班族與小夫妻最喜愛的經典熱門格局。
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
