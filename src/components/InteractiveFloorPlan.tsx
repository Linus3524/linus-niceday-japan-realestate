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
    desc: "主要起居與社交空間，通常連同大面積採光落地窗與陽台。",
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
    desc: "因採光或通風窗戶面積未達法定房間標準（建築基準法），故標示為納戶，常作獨立書房、儲藏室或臥室。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet",
    nameZh: "獨立廁所",
    jpName: "トイレ",
    desc: "獨立分隔的馬桶間，與洗面室及浴室獨立分離（バストイレ別），多配置溫水洗淨便座。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室",
    jpName: "ユニットバス",
    desc: "一體成型防水浴室，包含深型泡澡浴缸、淋浴區與自動追焚設備，保溫防漏性能佳。",
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
    desc: "玄關處的貼牆式專用鞋櫃，部分高階物件包含可存放雨傘與靴子的大型 Schuh-Cloak。",
    category: "storage"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機放置處",
    jpName: "洗濯機置場",
    desc: "洗面脫衣室專用防水盤（洗濯機パン）、獨立給排水龍頭與電源插座。",
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
            日本住宅平面圖 (1LDK + S)
          </h4>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            移動游標至圖紙代號區域即可查看詳細空間定義與房仲提示
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
          <div className="relative w-full aspect-[560/400]">
            <svg
              viewBox="0 0 560 400"
              className="h-full w-full select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {/* CAD Blue Grid Pattern */}
              <defs>
                <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="560" height="400" fill="url(#cadGrid)" />

              {/* Compass Rose N - Top Right */}
              <g transform="translate(525, 45)">
                <circle cx="0" cy="0" r="15" fill="none" stroke="#475569" strokeWidth="1" />
                <path d="M 0 -13 L 4 0 L 0 -3 L -4 0 Z" fill="#1A2A22" />
                <text x="0" y="-17" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1A2A22">N</text>
              </g>

              {/* Outer Guideline Box */}
              <rect x="30" y="30" width="470" height="340" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />

              {/* --- REALISTIC CAD PROPORTIONS (SLEEK WALL-MOUNTED SHOE BOX SB) --- */}

              {/* 1. UB */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("UB")}
                onClick={() => setActiveCode("UB")}
              >
                <rect
                  x="30"
                  y="30"
                  width="100"
                  height="120"
                  fill={activeCode === "UB" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "UB" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "UB" ? "2.5" : "1.5"}
                />
                {/* Bathtub CAD contour */}
                <rect x="38" y="38" width="84" height="60" fill="none" stroke={activeCode === "UB" ? "#00a174" : "#475569"} strokeWidth="1" />
                <circle cx="52" cy="68" r="4" fill="none" stroke={activeCode === "UB" ? "#00a174" : "#475569"} strokeWidth="1" />
                <text x="80" y="118" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "UB" ? "#00a174" : "#1e293b"}>
                  UB
                </text>
              </g>

              {/* 2. WC */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("WC")}
                onClick={() => setActiveCode("WC")}
              >
                <rect
                  x="130"
                  y="30"
                  width="70"
                  height="120"
                  fill={activeCode === "WC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "WC" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "WC" ? "2.5" : "1.5"}
                />
                {/* Toilet Bowl CAD Contour */}
                <path d="M 155 42 L 175 42 L 175 52 L 155 52 Z" fill={activeCode === "WC" ? "#a7f3d0" : "#e2e8f0"} stroke={activeCode === "WC" ? "#00a174" : "#475569"} strokeWidth="1" />
                <path d="M 153 52 C 153 78, 177 78, 177 52 Z" fill="none" stroke={activeCode === "WC" ? "#00a174" : "#475569"} strokeWidth="1.2" />
                <text x="165" y="118" textAnchor="middle" fontSize="14" fontWeight="bold" fill={activeCode === "WC" ? "#00a174" : "#1e293b"}>
                  WC
                </text>
              </g>

              {/* 3. W */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("W")}
                onClick={() => setActiveCode("W")}
              >
                <rect
                  x="30"
                  y="150"
                  width="170"
                  height="120"
                  fill={activeCode === "W" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "W" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "W" ? "2.5" : "1.5"}
                />
                {/* Washing Machine Pan W */}
                <rect x="40" y="165" width="55" height="55" fill="none" stroke={activeCode === "W" ? "#00a174" : "#475569"} strokeWidth="1" strokeDasharray="2 2" />
                <text x="67.5" y="198" textAnchor="middle" fontSize="16" fontWeight="bold" fill={activeCode === "W" ? "#00a174" : "#1e293b"}>
                  W
                </text>
                {/* Washbasin Sink Outline */}
                <rect x="110" y="165" width="80" height="55" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="125" y="175" width="50" height="35" fill="none" stroke="#94a3b8" strokeWidth="1" />
              </g>

              {/* 4. Entrance Hall & SB (Sleek Wall-mounted Shoe Box) */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("SB")}
                onClick={() => setActiveCode("SB")}
              >
                {/* Entrance Floor Hall */}
                <rect
                  x="30"
                  y="270"
                  width="170"
                  height="100"
                  fill={activeCode === "SB" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "SB" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "SB" ? "2.5" : "1.5"}
                />
                {/* Sleek Wall-Mounted Shoes Box SB (Realistic Slim Cabinet along Left Wall) */}
                <rect
                  x="35"
                  y="280"
                  width="35"
                  height="80"
                  fill="none"
                  stroke={activeCode === "SB" ? "#00a174" : "#1A2A22"}
                  strokeWidth="1.5"
                />
                <text x="52.5" y="325" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "SB" ? "#00a174" : "#1e293b"}>
                  SB
                </text>
              </g>

              {/* Front Door Swing Arc at Bottom Entrance */}
              <path d="M 80 370 A 50 50 0 0 1 130 370" fill="none" stroke="#00a174" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="80" y1="370" x2="130" y2="370" stroke="#1A2A22" strokeWidth="3" />

              {/* 5. K */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("K")}
                onClick={() => setActiveCode("K")}
              >
                <rect
                  x="200"
                  y="30"
                  width="140"
                  height="110"
                  fill={activeCode === "K" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "K" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "K" ? "2.5" : "1.5"}
                />
                {/* Countertop Sink & 2 Burners */}
                <rect x="210" y="38" width="90" height="50" fill="none" stroke={activeCode === "K" ? "#00a174" : "#475569"} strokeWidth="1" />
                <circle cx="225" cy="63" r="7" fill="none" stroke={activeCode === "K" ? "#00a174" : "#334155"} strokeWidth="1" />
                <circle cx="245" cy="63" r="7" fill="none" stroke={activeCode === "K" ? "#00a174" : "#334155"} strokeWidth="1" />
                <rect x="265" y="50" width="30" height="26" stroke={activeCode === "K" ? "#00a174" : "#334155"} fill="none" strokeWidth="1" />
                <text x="270" y="115" textAnchor="middle" fontSize="16" fontWeight="bold" fill={activeCode === "K" ? "#00a174" : "#1A2A22"}>
                  K
                </text>
              </g>

              {/* 6. R */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("R")}
                onClick={() => setActiveCode("R")}
              >
                <rect
                  x="305"
                  y="38"
                  width="30"
                  height="50"
                  fill={activeCode === "R" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "R" ? "#00a174" : "#475569"}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text x="320" y="68" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "R" ? "#00a174" : "#1e293b"}>
                  R
                </text>
              </g>

              {/* 7. S */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("S")}
                onClick={() => setActiveCode("S")}
              >
                <rect
                  x="340"
                  y="30"
                  width="160"
                  height="150"
                  fill={activeCode === "S" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "S" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "S" ? "2.5" : "1.5"}
                />
                <text x="420" y="125" textAnchor="middle" fontSize="20" fontWeight="bold" fill={activeCode === "S" ? "#00a174" : "#1A2A22"}>
                  S
                </text>
              </g>

              {/* 8. CL */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("CL")}
                onClick={() => setActiveCode("CL")}
              >
                <rect
                  x="345"
                  y="35"
                  width="70"
                  height="50"
                  fill={activeCode === "CL" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "CL" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "CL" ? "2" : "1"}
                />
                <path d="M 345 35 L 380 43 L 415 35" fill="none" stroke={activeCode === "CL" ? "#00a174" : "#475569"} strokeWidth="1" />
                <text x="380" y="65" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "CL" ? "#00a174" : "#1e293b"}>
                  CL
                </text>
              </g>

              {/* 9. WIC */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("WIC")}
                onClick={() => setActiveCode("WIC")}
              >
                <rect
                  x="420"
                  y="35"
                  width="75"
                  height="50"
                  fill={activeCode === "WIC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "WIC" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "WIC" ? "2" : "1"}
                />
                <line x1="425" y1="42" x2="490" y2="42" stroke={activeCode === "WIC" ? "#00a174" : "#475569"} strokeWidth="1" strokeDasharray="3 3" />
                <text x="457.5" y="65" textAnchor="middle" fontSize="13" fontWeight="bold" fill={activeCode === "WIC" ? "#00a174" : "#1e293b"}>
                  WIC
                </text>
              </g>

              {/* 10. D */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("D")}
                onClick={() => setActiveCode("D")}
              >
                <rect
                  x="200"
                  y="140"
                  width="140"
                  height="100"
                  fill={activeCode === "D" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "D" ? "#00a174" : "none"}
                  strokeWidth="2"
                />
                {/* Dining Table CAD Outline */}
                <rect x="230" y="160" width="75" height="45" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                <rect x="215" y="172" width="10" height="20" stroke="#cbd5e1" fill="#f8fafc" strokeWidth="1" />
                <rect x="310" y="172" width="10" height="20" stroke="#cbd5e1" fill="#f8fafc" strokeWidth="1" />
                <text x="270" y="222" textAnchor="middle" fontSize="18" fontWeight="bold" fill={activeCode === "D" ? "#00a174" : "#1A2A22"}>
                  D
                </text>
              </g>

              {/* 11. L */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("L")}
                onClick={() => setActiveCode("L")}
              >
                <rect
                  x="200"
                  y="240"
                  width="300"
                  height="130"
                  fill={activeCode === "L" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "L" ? "#00a174" : "#1A2A22"}
                  strokeWidth={activeCode === "L" ? "2.5" : "1.5"}
                />
                {/* Sofa & TV CAD Outline */}
                <rect x="290" y="295" width="120" height="45" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                <line x1="290" y1="252" x2="410" y2="252" stroke="#475569" strokeWidth="3" />
                <text x="350" y="280" textAnchor="middle" fontSize="22" fontWeight="bold" fill={activeCode === "L" ? "#00a174" : "#1A2A22"}>
                  L
                </text>
              </g>

              {/* 12. AC */}
              <g
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveCode("AC")}
                onClick={() => setActiveCode("AC")}
              >
                <rect
                  x="450"
                  y="245"
                  width="45"
                  height="22"
                  fill={activeCode === "AC" ? "rgba(0, 161, 116, 0.14)" : "#ffffff"}
                  stroke={activeCode === "AC" ? "#00a174" : "#475569"}
                  strokeWidth="1.5"
                />
                <text x="472.5" y="260" textAnchor="middle" fontSize="12" fontWeight="bold" fill={activeCode === "AC" ? "#00a174" : "#1e293b"}>
                  AC
                </text>
              </g>

              {/* --- STRUCTURAL THICK SOLID CAD WALLS (#1A2A22) --- */}
              {/* Outer Boundary Wall (Square 4px) */}
              <rect x="30" y="30" width="470" height="340" fill="none" stroke="#1A2A22" strokeWidth="4" />
              {/* Interior Partition Walls */}
              <line x1="200" y1="30" x2="200" y2="370" stroke="#1A2A22" strokeWidth="3.5" />
              <line x1="340" y1="30" x2="340" y2="180" stroke="#1A2A22" strokeWidth="3" />
              <line x1="30" y1="150" x2="200" y2="150" stroke="#1A2A22" strokeWidth="3" />
              <line x1="30" y1="270" x2="200" y2="270" stroke="#1A2A22" strokeWidth="3" />
              <line x1="200" y1="140" x2="340" y2="140" stroke="#1A2A22" strokeWidth="3" />
              <line x1="340" y1="180" x2="500" y2="180" stroke="#1A2A22" strokeWidth="3" />

              {/* Balcony Outer Window Designation */}
              <text x="350" y="388" textAnchor="middle" fontSize="11" fill="#475569" fontMono letterSpacing="1">
                BALCONY
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
                💡 <strong>房仲提示</strong>：標準日本 1LDK 將「水圍水區（衛浴脫衣）」與「動態 LDK（客餐廳廚房）」及「獨立納戶 S」完美分區，是東京與關西最主流熱門的高品質單身/雙人住宅格局。
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <span className="text-2xl mb-2">👆</span>
              <p className="text-xs font-sans leading-relaxed">請將游標移至左側圖紙代號區域，<br />即可查看詳細空間解說</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
