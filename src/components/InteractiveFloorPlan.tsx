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
    desc: "主要起居與社交空間，通常連同大面積採光窗戶或戶外陽台。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳",
    jpName: "食事室",
    desc: "用餐區域，日本 1LDK 物件多與客廳及廚房結合為 LDK 開放連貫空間。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房",
    jpName: "台所",
    desc: "獨立或中島廚房，配置洗滌水槽、雙火瓦斯爐/IH電磁爐與料理檯面。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room",
    nameZh: "納戶 (多功能室)",
    jpName: "納戸・サービスルーム",
    desc: "因採光或通風窗戶面積未達法定房間標準（建築基準法），故標示為納戶，常作書房、儲藏室或客房。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet",
    nameZh: "獨立廁所",
    jpName: "トイレ",
    desc: "獨立分隔的馬桶間，日本採「衛浴分離（バストイレ別）」，多配置溫水洗淨便座。",
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
    desc: "標準內嵌式壁櫥，設有雙開拉門與掛衣桿，提供基礎收納容量。",
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

export function InteractiveFloorPlan() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const currentItem = activeCode ? FLOOR_PLAN_ITEMS[activeCode] : null;

  return (
    <div className="border border-[#DDE3DF] bg-white p-4 md:p-6 font-sans">
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <div>
          <h4 className="flex items-center gap-2 font-serif text-base font-bold text-[#1A2A22]">
            <span className="inline-block h-2.5 w-2.5 bg-[#00a174]" />
            日本住宅平面圖 (間取り図 1LDK + S)
          </h4>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            移動游標至圖紙區域即可查看詳細空間定義與房仲提示
          </p>
        </div>
        <span className="border border-zinc-300 bg-zinc-50 px-2 py-1 font-mono text-[11px] font-semibold text-zinc-700">
          MAISOKU CAD
        </span>
      </div>

      {/* Main Layout: Monochromatic Blueprint CAD Canvas + Floating Hover Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG CAD Blueprint Canvas */}
        <div className="lg:col-span-8 border border-zinc-300 bg-[#FAF9F6] p-3">
          <div className="relative w-full aspect-[540/400]">
            <svg
              viewBox="0 0 540 400"
              className="h-full w-full select-none"
              style={{ fontFamily: "'Inter', 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif" }}
            >
              {/* CAD Blue Grid Pattern */}
              <defs>
                <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="540" height="400" fill="url(#cadGrid)" />

              {/* Japanese Architectural Compass Rose (指北針 N) - Top Right Corner */}
              <g transform="translate(500, 45)">
                <circle cx="0" cy="0" r="16" fill="none" stroke="#475569" strokeWidth="1" />
                <path d="M 0 -14 L 5 0 L 0 -4 L -5 0 Z" fill="#1A2A22" />
                <text x="0" y="-18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1A2A22">N</text>
              </g>

              {/* Floor Plan Perimeter Guidelines */}
              <rect x="30" y="30" width="450" height="340" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />

              {/* --- MONOCHROMATIC ROOM SECTIONS (HOVER TRANSITION TO EMERALD) --- */}

              {/* 1. UB (Unit Bath / 浴室) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("UB")}
                onClick={() => setActiveCode("UB")}
              >
                <rect
                  x="30"
                  y="30"
                  width="100"
                  height="90"
                  fill={activeCode === "UB" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "UB" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "UB" ? "2.5" : "1.5"}
                />
                {/* Bathtub CAD contour */}
                <rect x="38" y="38" width="84" height="46" fill="none" stroke={activeCode === "UB" ? "#00a174" : "#475569"} strokeWidth="1" />
                <circle cx="50" cy="61" r="3" fill="none" stroke={activeCode === "UB" ? "#00a174" : "#475569"} strokeWidth="1" />
                <text x="80" y="105" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "UB" ? "#00a174" : "#1e293b"}>
                  UB
                </text>
              </g>

              {/* 2. WC (Water Closet / 獨立廁所) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("WC")}
                onClick={() => setActiveCode("WC")}
              >
                <rect
                  x="130"
                  y="30"
                  width="70"
                  height="90"
                  fill={activeCode === "WC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "WC" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "WC" ? "2.5" : "1.5"}
                />
                {/* Toilet Bowl CAD Contour */}
                <path d="M 155 42 L 175 42 L 175 52 L 155 52 Z" fill={activeCode === "WC" ? "#a7f3d0" : "#e2e8f0"} stroke={activeCode === "WC" ? "#00a174" : "#475569"} strokeWidth="1" />
                <path d="M 153 52 C 153 72, 177 72, 177 52 Z" fill="none" stroke={activeCode === "WC" ? "#00a174" : "#475569"} strokeWidth="1.2" />
                <text x="165" y="105" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "WC" ? "#00a174" : "#1e293b"}>
                  WC
                </text>
              </g>

              {/* 3. 洗面室 & W (Washing Machine / 洗衣機位) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("W")}
                onClick={() => setActiveCode("W")}
              >
                <rect
                  x="30"
                  y="120"
                  width="170"
                  height="70"
                  fill={activeCode === "W" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "W" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "W" ? "2.5" : "1.5"}
                />
                {/* Washing Machine Pan W */}
                <rect x="40" y="130" width="50" height="50" fill="none" stroke={activeCode === "W" ? "#00a174" : "#475569"} strokeWidth="1" strokeDasharray="2 2" />
                <text x="65" y="160" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "W" ? "#00a174" : "#1e293b"}>
                  W
                </text>
                {/* Washbasin Sink */}
                <rect x="105" y="130" width="80" height="50" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="120" y="140" width="50" height="30" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x="145" y="184" textAnchor="middle" fontSize="9" fill="#64748b">洗面脱衣室</text>
              </g>

              {/* 4. S (Service Room / 納戶) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("S")}
                onClick={() => setActiveCode("S")}
              >
                <rect
                  x="30"
                  y="190"
                  width="170"
                  height="120"
                  fill={activeCode === "S" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "S" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "S" ? "2.5" : "1.5"}
                />
                <text x="115" y="250" textAnchor="middle" fontSize="16" fontWeight="bold" fill={activeCode === "S" ? "#00a174" : "#1A2A22"}>
                  S
                </text>
                <text x="115" y="270" textAnchor="middle" fontSize="11" fill="#475569">
                  納戶 4.5帖
                </text>
              </g>

              {/* 5. CL (Closet / 壁櫥) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("CL")}
                onClick={() => setActiveCode("CL")}
              >
                <rect
                  x="30"
                  y="310"
                  width="170"
                  height="60"
                  fill={activeCode === "CL" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "CL" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "CL" ? "2.5" : "1.5"}
                />
                <path d="M 30 310 L 72 320 L 115 310 L 157 320 L 200 310" fill="none" stroke={activeCode === "CL" ? "#00a174" : "#475569"} strokeWidth="1" />
                <text x="115" y="348" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "CL" ? "#00a174" : "#1e293b"}>
                  CL (クローゼット)
                </text>
              </g>

              {/* 6. 玄關 & SB (Shoes Box) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("SB")}
                onClick={() => setActiveCode("SB")}
              >
                <rect x="200" y="30" width="75" height="90" fill={activeCode === "SB" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"} stroke="#1A2A22" strokeWidth="1.5" />
                <text x="237" y="55" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">玄關</text>
                
                {/* SB Shoes Box */}
                <rect
                  x="205"
                  y="70"
                  width="65"
                  height="35"
                  fill="none"
                  stroke={activeCode === "SB" ? "#00a174" : "#1A2A22"}
                  strokeWidth="1.5"
                />
                <text x="237" y="92" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "SB" ? "#00a174" : "#1e293b"}>
                  SB
                </text>
              </g>

              {/* Entrance Door Swing Arc */}
              <path d="M 200 30 A 40 40 0 0 1 200 70" fill="none" stroke="#00a174" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="200" y1="30" x2="200" y2="70" stroke="#1A2A22" strokeWidth="2.5" />

              {/* 7. K (Kitchen) & R (Refrigerator) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("K")}
                onClick={() => setActiveCode("K")}
              >
                <rect
                  x="275"
                  y="30"
                  width="125"
                  height="90"
                  fill={activeCode === "K" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "K" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "K" ? "2.5" : "1.5"}
                />
                {/* Countertop Sink & 2 Burners */}
                <rect x="285" y="38" width="95" height="45" fill="none" stroke={activeCode === "K" ? "#00a174" : "#475569"} strokeWidth="1" />
                <circle cx="302" cy="60" r="7" fill="none" stroke={activeCode === "K" ? "#00a174" : "#334155"} strokeWidth="1" />
                <circle cx="322" cy="60" r="7" fill="none" stroke={activeCode === "K" ? "#00a174" : "#334155"} strokeWidth="1" />
                <rect x="342" y="48" width="30" height="25" stroke={activeCode === "K" ? "#00a174" : "#334155"} fill="none" strokeWidth="1" />
                <text x="332" y="105" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "K" ? "#00a174" : "#1A2A22"}>
                  K
                </text>
              </g>

              {/* R Area (Refrigerator Box) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("R")}
                onClick={() => setActiveCode("R")}
              >
                <rect
                  x="370"
                  y="38"
                  width="25"
                  height="45"
                  fill={activeCode === "R" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "R" ? "#00a174" : "#475569"}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text x="382.5" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "R" ? "#00a174" : "#1e293b"}>
                  R
                </text>
              </g>

              {/* 8. WIC (Walk-in Closet) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("WIC")}
                onClick={() => setActiveCode("WIC")}
              >
                <rect
                  x="400"
                  y="30"
                  width="80"
                  height="90"
                  fill={activeCode === "WIC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "WIC" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "WIC" ? "2.5" : "1.5"}
                />
                <line x1="410" y1="42" x2="470" y2="42" stroke={activeCode === "WIC" ? "#00a174" : "#475569"} strokeWidth="1" strokeDasharray="3 3" />
                <text x="440" y="75" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "WIC" ? "#00a174" : "#1e293b"}>
                  WIC
                </text>
              </g>

              {/* 9. D (Dining Area) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("D")}
                onClick={() => setActiveCode("D")}
              >
                <rect
                  x="200"
                  y="120"
                  width="200"
                  height="110"
                  fill={activeCode === "D" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "D" ? "#00a174" : "none"}
                  strokeWidth="2"
                />
                {/* Dining Table Sharp Outline */}
                <rect x="250" y="145" width="80" height="45" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                <rect x="235" y="158" width="10" height="20" stroke="#cbd5e1" fill="#f8fafc" strokeWidth="1" />
                <rect x="335" y="158" width="10" height="20" stroke="#cbd5e1" fill="#f8fafc" strokeWidth="1" />
                <text x="290" y="210" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "D" ? "#00a174" : "#1A2A22"}>
                  D
                </text>
              </g>

              {/* 10. L (Living Area) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("L")}
                onClick={() => setActiveCode("L")}
              >
                <rect
                  x="200"
                  y="230"
                  width="280"
                  height="140"
                  fill={activeCode === "L" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "L" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "L" ? "2.5" : "1.5"}
                />
                {/* Sofa & TV sharp CAD icons */}
                <rect x="280" y="300" width="120" height="45" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                <line x1="280" y1="245" x2="400" y2="245" stroke="#475569" strokeWidth="3" />
                <text x="340" y="280" textAnchor="middle" fontSize="18" fontWeight="bold" fill={activeCode === "L" ? "#00a174" : "#1A2A22"}>
                  L
                </text>
                <text x="340" y="360" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "L" ? "#00a174" : "#475569"}>
                  LDK 12 帖 (居間・食事室・台所)
                </text>
              </g>

              {/* 11. AC (Air Conditioner) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("AC")}
                onClick={() => setActiveCode("AC")}
              >
                <rect
                  x="430"
                  y="235"
                  width="45"
                  height="22"
                  fill={activeCode === "AC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "AC" ? "#00a174" : "#475569"}
                  strokeWidth="1.5"
                />
                <text x="452.5" y="250" textAnchor="middle" fontSize="11" fontWeight="bold" fill={activeCode === "AC" ? "#00a174" : "#1e293b"}>
                  AC
                </text>
              </g>

              {/* --- STRUCTURAL THICK SOLID WALLS (#1A2A22) --- */}
              {/* Outer Boundary Wall (Square, 4px) */}
              <rect x="30" y="30" width="450" height="340" fill="none" stroke="#1A2A22" strokeWidth="4" />
              {/* Interior Partition Walls */}
              <line x1="200" y1="30" x2="200" y2="370" stroke="#1A2A22" strokeWidth="3" />
              <line x1="400" y1="30" x2="400" y2="120" stroke="#1A2A22" strokeWidth="3" />
              <line x1="30" y1="120" x2="200" y2="120" stroke="#1A2A22" strokeWidth="3" />
              <line x1="30" y1="190" x2="200" y2="190" stroke="#1A2A22" strokeWidth="3" />
              <line x1="30" y1="310" x2="200" y2="310" stroke="#1A2A22" strokeWidth="3" />
              <line x1="200" y1="120" x2="480" y2="120" stroke="#1A2A22" strokeWidth="3" />

              {/* Balcony Label Outside Window */}
              <text x="340" y="388" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="500">
                ベランダ / バルコニー (陽台)
              </text>
            </svg>
          </div>
        </div>

        {/* Floating Detail Explanation Card (Side Column) */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full border border-zinc-200 bg-white p-5 min-h-[360px]">
          {currentItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block border border-[#00a174] bg-[#00a174] px-2 py-0.5 font-mono text-xs font-bold text-white">
                    {currentItem.code}
                  </span>
                  <h5 className="font-bold text-base text-[#1A2A22]">{currentItem.nameZh}</h5>
                </div>
                {currentItem.jpName && (
                  <span className="text-xs font-sans font-medium text-zinc-500 border border-zinc-200 px-2 py-0.5">
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

              <div className="border border-[#bce8dc] bg-[#f0faf7] p-3 text-xs text-[#007d5a] font-sans leading-normal">
                💡 <strong>房仲提示</strong>：方正型 1LDK 格局動線流暢，採光區域與衛浴/收納分明，為日本上班族與小家庭的經典首選。
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <span className="text-2xl mb-2">👆</span>
              <p className="text-xs font-sans leading-relaxed">請將游標移至左側平面圖區域，<br />即可查看詳細空間說明</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
