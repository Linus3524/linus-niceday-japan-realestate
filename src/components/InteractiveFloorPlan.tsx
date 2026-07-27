import { useState, type KeyboardEvent } from "react";
import { MousePointerClick } from "lucide-react";

export interface RoomDetail {
  code: string;
  nameEn: string;
  nameZh: string;
  jpName?: string;
  desc: string;
  practicalNote: string;
  category: "room" | "bath" | "storage" | "equipment";
}

export const FLOOR_PLAN_ITEMS: Record<string, RoomDetail> = {
  L: {
    code: "L",
    nameEn: "Living Room",
    nameZh: "客廳 (Living Room)",
    jpName: "居間（リビング）",
    desc: "日常起居與社交核心空間。在日本 1LDK 構造中，通常與餐廚區無縫連通（開放式 LDK），並透過大面落地窗銜接戶外陽台，提供主要採光與通風。",
    practicalNote: "實務看屋重點：需確認電視主牆到沙發的視距（建議至少 2 公尺）、插座與網路壁孔位置，以及前往陽台的步行通道是否會被大型沙發擺設阻擋。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳 (Dining Room)",
    jpName: "食事室（ダイニング）",
    desc: "擺放餐桌椅並專用於用餐與家庭交流的區域，介於廚房料理區與客廳起居區之間，構成日本現代住宅常見的高效「動線黃金三角」。",
    practicalNote: "實務看屋重點：勿僅看平面圖空間；需預留座椅向後拉開與後方行走的通行淨寬（建議座椅後方留 60-80cm），避免餐桌放妥後擠壓到廚房進出路徑。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房 (Kitchen)",
    jpName: "台所（キッチン）",
    desc: "料理與洗滌區域，配置水槽、切菜工作檯面與雙口/三口瓦斯爐或 IH 爐。旁側緊鄰冰箱預留位 (R)，實現短距離的洗切炒烹飪動線。",
    practicalNote: "實務看屋重點：確認熱源類別（都市瓦斯/LP丙烷瓦斯/IH）、工作檯面寬度（是否好切菜）、抽油煙機風量，以及料理小家電（微波爐/電鍋）所需的專用迴路插座。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room / Storeroom",
    nameZh: "納戶 / 服務室 (Service Room)",
    jpName: "納戸・サービスルーム",
    desc: "因採光口（窗戶）面積未達日本《建築基準法》第 28 條規定之居室標準（採光面積小於地板面積 1/7），故法規上標示為 S (Service Room) 或納戶，實務上常作為書房、影音室、儲藏室或彈性多功能空間。",
    practicalNote: "實務看屋重點：若預計當臥室使用，需特別確認是否有冷氣穿牆管孔 (貫通孔) 與獨立電壓插座；且未來此房屋欲出租或轉售時，法規上不可直接標示為標準臥室 (Bed Room)。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet / Toilet",
    nameZh: "獨立廁所 (Toilet)",
    jpName: "トイレ（独立トイレスペース）",
    desc: "完全獨立於浴室與洗面所之外的廁所空間（日本衛浴分離主流規格）。讓家人或同居者在有人泡澡淋浴時，仍可完全獨立且安心地如廁。",
    practicalNote: "實務看屋重點：親自坐上馬桶測試膝蓋與前門的距離、確認是否標配溫水洗淨便座 (免治馬桶)、上方有無衛生紙儲藏吊櫃，並注意門扇開合方向是否會與浴室門撞擊。",
    category: "bath"
  },
  VANITY: {
    code: "洗面台",
    nameEn: "Independent Vanity",
    nameZh: "獨立洗面台 (Vanity)",
    jpName: "独立洗面化粧台",
    desc: "獨立設於脫衣過道的梳洗設備，整合洗臉盆、三面鏡櫃、單手彈開伸縮龍頭與電源插座，無須進入濕漉漉的浴室即可快速完成早晚洗漱、吹髮與化妝。",
    practicalNote: "實務看屋重點：確認鏡櫃內部收納深度、龍頭是否為可拉出沖洗頭皮的蓮蓬頭龍頭（シャンプー水栓）、防濺檯面設計，以及吹風機/電動牙刷所需的防水插座。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室 (Unit Bath)",
    jpName: "ユニットバス（浴室）",
    desc: "工廠預製成型的一體化防漏防水浴室，整合浴缸、獨立淋浴區與專用排水孔。具備極高的熱絕緣保溫性與優異的氣密防潮性能。",
    practicalNote: "實務看屋重點：確認浴室尺寸代號（如 1616 或 1418）、是否配備自動追焚加熱功能（追炊き），以及浴室換氣乾燥暖房機（梅雨季室內晾衣與冬天防熱休克必備）。",
    category: "bath"
  },
  CL: {
    code: "CL",
    nameEn: "Closet",
    nameZh: "壁櫥 / 衣櫥 (Closet)",
    jpName: "クローゼット",
    desc: "內嵌於牆體內部的收納衣櫃，配有橫向金屬吊衣桿與頂部天袋置物層板，完全不占用房間實際行走與擺放床鋪的地板面積。",
    practicalNote: "實務看屋重點：平面圖僅呈現長度，看屋時務必測量有效深度（懸掛大衣與西裝至少需 60cm），並確認摺疊門或拉門完全開啟時，是否會卡到鄰近的床頭櫃或家具。",
    category: "storage"
  },
  WIC: {
    code: "WIC",
    nameEn: "Walk-in Closet",
    nameZh: "步入式衣帽間 (Walk-in Closet)",
    jpName: "ウォークインクローゼット",
    desc: "人可直接走入的大容量獨立收納空間，內部四周設有多層隔板、吊衣桿與層架，能同時集中收納四季衣物、大型行李箱、棉被與季節性家電。",
    practicalNote: "實務看屋重點：WIC 的記載面積包含內部行走通道；看屋時需確認轉角處與高處層板是否好拿取、內部是否有通風換氣孔，以防台灣/日本夏季潮濕發霉。",
    category: "storage"
  },
  SB: {
    code: "SB",
    nameEn: "Shoes Box",
    nameZh: "鞋櫃 / 下駄箱 (Shoes Box)",
    jpName: "シューズボックス（下駄箱）",
    desc: "緊貼玄關牆面設置的高容量鞋類收納櫃，內設可自由調整高度的層板，底部常留有懸空區供擺放當天常穿的室外鞋。",
    practicalNote: "實務看屋重點：確認層板是否能彈性拆卸調整高度（用以擺放高跟鞋或長靴）、內部有無雨傘掛放架與長傘排水溝，以及櫃門打開時是否會阻擋玄關的行走動線。",
    category: "storage"
  },
  ENT: {
    code: "玄",
    nameEn: "Entrance / Genkan",
    nameZh: "玄關 (Entrance)",
    jpName: "玄関（上がり框）",
    desc: "連通室外與內部的換鞋緩衝空間。設有落塵土間與抬高之地板段差（上がり框），在傳統與現代日本文化中均為明確區隔乾淨室內的衛生防線。",
    practicalNote: "實務看屋重點：量測高低差高度、大門開啟淨寬度與轉角迴旋半徑，確保雙門雙開冰箱、大尺寸沙發與雙人床墊能順利搬運進房。",
    category: "room"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機預留位 (Washing Space)",
    jpName: "室内洗濯機置場（防水パン）",
    desc: "室內專用洗衣機擺放區，配有防溢水保護盤（防水パン）、專用防冷凝給水龍頭與防漏電接地保護插座。",
    practicalNote: "實務看屋重點：務必測量防水パン的內部淨尺寸（如常見 64cm×64cm 規格），並確認給水龍頭高度是否會阻擋歐規/日規滾筒式洗衣機的上開蓋或上方機身。",
    category: "equipment"
  },
  R: {
    code: "R",
    nameEn: "Refrigerator Space",
    nameZh: "冰箱預留位 (Refrigerator Space)",
    jpName: "冷蔵庫置場",
    desc: "廚房料理區旁專門預留的冰箱擺設位置，緊鄰電源插座，方便在備餐與料理過程中無縫取用冷凍與冷藏食材。",
    practicalNote: "實務看屋重點：除了機身寬深外，兩側與後方需預留 1-2cm 的散熱空間；並需特別確認冰箱門開啟方向（左開/右開/對開）是否會撞擊旁邊的牆壁或廚房走道。",
    category: "equipment"
  },
  AC: {
    code: "AC",
    nameEn: "Air Conditioner",
    nameZh: "冷氣預留位 / 變頻冷氣 (Air Conditioner)",
    jpName: "エアコン（エアコン置場）",
    desc: "牆面上方專用的變頻壁掛冷氣安裝位，配置冷媒管/排水管穿牆貫通孔以及大功率專用單獨迴路插座 (100V/200V)。",
    practicalNote: "實務看屋重點：平面圖標示 AC 不代表隨屋附贈冷氣機！看屋/簽約前必須與仲介確認該冷氣屬於「設備（故障由房東修繕）」還是「前房客殘留物（故障自理）」，並核對插座電壓。",
    category: "equipment"
  },
  BALCONY: {
    code: "BALCONY",
    nameEn: "Balcony",
    nameZh: "陽台 (Balcony)",
    jpName: "バルコニー（専有使用部分）",
    desc: "自客廳延伸出去的對外戶外空間，主要提供日常採光、通風與晾曬衣物。在日本法律上屬於社區全體共有、但授權該戶獨佔的「專有使用部分」。",
    practicalNote: "實務看屋重點：親自至陽台觀察座向採光、周邊遮蔽物、冷氣室外機擺放位置，並特別注意避難隔板與避難梯（避難ハッチ）周圍依《消防法》嚴禁堆放雜物。",
    category: "room"
  }
};

export function InteractiveFloorPlan() {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const activeCode = selectedCode ?? hoveredCode;
  const currentItem = activeCode ? FLOOR_PLAN_ITEMS[activeCode] : null;
  const ink = "#17271f";
  const line = "#4d5658";
  const paper = "#fbfaf7";

  const interaction = (code: string) => ({
    className: "cursor-pointer outline-none",
    role: "button",
    tabIndex: 0,
    "aria-label": `${FLOOR_PLAN_ITEMS[code].code} ${FLOOR_PLAN_ITEMS[code].nameZh}`,
    "aria-pressed": selectedCode === code,
    onMouseEnter: () => setHoveredCode(code),
    onMouseLeave: () => setHoveredCode(null),
    onFocus: () => setHoveredCode(code),
    onBlur: () => setHoveredCode(null),
    onClick: () => setSelectedCode((current) => current === code ? null : code),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectedCode((current) => current === code ? null : code);
      }
    }
  });

  const zoneFill = (code: string) =>
    activeCode === code ? "rgba(0, 161, 116, 0.13)" : "rgba(255,255,255,0.001)";

  return (
    <div className="font-sans space-y-3 pt-1">
      <div className="flex items-center justify-between text-xs text-zinc-500 font-sans pb-0.5">
        <div className="flex items-center gap-1.5 font-medium text-zinc-700">
          <span className="inline-block h-2 w-2 rounded-full bg-[#00a174]" />
          <span className="font-semibold text-[#1A2A22]">標準 1LDK + S 互動平面圖解</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12 md:items-stretch">
        <div className="border border-zinc-200 bg-[#faf9f6] md:col-span-7 lg:col-span-8">
          <div className="relative aspect-[1450/1030] w-full overflow-hidden">
            <svg
              viewBox="0 0 1450 1030"
              className="h-full w-full select-none"
              style={{ fontFamily: "'Jost', 'Noto Sans', Arial, sans-serif" }}
              aria-label="日本住宅 1LDK 加服務室平面圖"
            >
              <defs>
                <pattern id="cadGrid" width="46" height="47" patternUnits="userSpaceOnUse">
                  <path d="M 46 0H0V47" fill="none" stroke="#dbe4e9" strokeWidth="1.2" />
                </pattern>
                <pattern id="floorBoards" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M0 0V32" fill="none" stroke="#ddd9d0" strokeWidth="1" />
                </pattern>
                <pattern id="genkanTiles" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0H0V25" fill="none" stroke="#c0c8c4" strokeWidth="1" />
                </pattern>
                <filter id="paperShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#81918a" floodOpacity=".08" />
                </filter>
              </defs>
              <rect width="1450" height="1086" fill="#fbfaf8" />
              <rect width="1450" height="1086" fill="url(#cadGrid)" opacity=".83" />

              {/* paper and room fields */}
              <path d="M211 62H1217V841H211Z" fill={paper} filter="url(#paperShadow)" />
              <rect x="280" y="716" width="145" height="123" fill="url(#genkanTiles)" opacity=".85" />
              <path d="M632 62H1066V389H632Z" fill="url(#floorBoards)" opacity=".75" />
              <path d="M425 390H1217V840H425Z" fill="url(#floorBoards)" opacity=".34" />

              {/* balcony and entrance landing */}
              <path d="M760 852V978H1218V852M771 852V966H1206V852" fill="none" stroke={line} strokeWidth="2" />
              <text x="989" y="925" textAnchor="middle" fontSize="29" fontWeight="500" fill="#1f2525" letterSpacing="1">BALCONY</text>

              {/* major structural walls */}
              <path d="M201 52H1227V852H201ZM214 65V839H1214V65Z" fill={ink} fillRule="evenodd" />
              <path d="M401 62H411V281H401Z" fill={ink} />
              <path d="M211 277H401V288H211Z" fill={ink} />
              <path d="M401 277H624V288H401Z" fill={ink} />
              <path d="M613 62H624V390H613Z" fill={ink} />
              <path d="M613 385H1072V396H613Z" fill={ink} />
              <path d="M1061 62H1072V390H1061Z" fill={ink} />
              <path d="M1067 205H1218V216H1067Z" fill={ink} />
              <path d="M1059 385H1218V396H1059Z" fill={ink} />

              {/* wall openings erase + framed jambs */}
              <g fill={paper}>
                <rect x="751" y="52" width="87" height="13" />
                <rect x="398" y="184" width="17" height="93" />
                <rect x="1058" y="76" width="18" height="120" />
                <rect x="1058" y="224" width="18" height="156" />
                <rect x="435" y="274" width="86" height="18" />
                <rect x="624" y="382" width="86" height="18" />
                <rect x="301" y="829" width="86" height="24" />
                <rect x="511" y="839" width="170" height="13" />
                <rect x="846" y="839" width="235" height="13" />
              </g>

              {/* windows */}
              <g fill={paper} stroke={line} strokeWidth="1.5">
                <rect x="751" y="52" width="87" height="13" />
                <path d="M794.5 52V65" />
                <rect x="511" y="839" width="170" height="13" />
                <path d="M596 839V852" />
                <rect x="846" y="839" width="235" height="13" />
                <path d="M963.5 839V852" />
                <path d="M1059 76H1074V196H1059M1066 76V196" />
                <path d="M1059 224H1074V380H1059M1066 224V380" />
                <path d="M401 184H411V277H401M406 184V277" />
              </g>

              {/* doors */}
              <g fill="none" stroke={line} strokeWidth="1.7">
                <path d="M401 185L388 207L401 230M401 231L388 253L401 276" />
                <path d="M435 288V374A86 86 0 0 0 521 288" />
                <path d="M624 385V299A86 86 0 0 1 710 385" />
                <path d="M1059 77L1036 106L1059 136M1059 137L1036 166L1059 195" />
                <path d="M1059 225L1036 263L1059 302M1059 303L1036 341L1059 379" />
                <path d="M301 839V925A86 86 0 0 0 387 839" />
              </g>

              {/* UB bathtub */}
              <g fill="none" stroke={line} strokeWidth="1.5">
                <path d="M214 171H401M234 171V277" />
                <rect x="230" y="79" width="155" height="78" rx="29" />
                <circle cx="315" cy="145" r="4" />
              </g>
              <text x="313" y="229" textAnchor="middle" fontSize="29" fontWeight="600" fill="#202727">UB</text>

              {/* toilet — purple annotation position */}
              <g fill={paper} stroke={line} strokeWidth="1.5">
                <rect x="432" y="77" width="48" height="21" />
                <path d="M436 98H476V110C476 134 468 148 456 148C444 148 436 134 436 110Z" />
                <ellipse cx="456" cy="119" rx="15" ry="21" />
              </g>
              <text x="484" y="216" textAnchor="middle" fontSize="27" fontWeight="600" fill="#202727">WC</text>

              {/* washing machine space — swapped into the upper position */}
              <g fill="none" stroke={line} strokeWidth="1.5">
                <rect x="534" y="72" width="72" height="72" strokeDasharray="6 6" />
              </g>
              <text x="570" y="108" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="600" fill="#202727">W</text>

              {/* washstand — rotated 90 degrees and mounted to the right wall */}
              <g fill="none" stroke={line} strokeWidth="1.5">
                <rect x="553" y="176" width="60" height="90" />
                <rect x="562" y="187" width="42" height="68" rx="7" />
                <path d="M613 221H596M605 214V228" />
              </g>

              {/* kitchen counter */}
              <g fill={paper} stroke={line} strokeWidth="1.5">
                <rect x="214" y="288" width="84" height="269" />
                <rect x="232" y="313" width="53" height="71" />
                <circle cx="250" cy="336" r="11" />
                <circle cx="268" cy="359" r="11" />
                <rect x="238" y="457" width="45" height="75" rx="6" />
                <rect x="244" y="465" width="32" height="59" rx="5" />
                <path d="M236 493H253M244 484V505" />
              </g>
              <text x="354" y="469" textAnchor="middle" fontSize="34" fontWeight="600" fill="#202727">K</text>

              {/* refrigerator and shoe cabinet */}
              <g fill={paper} stroke={line} strokeWidth="1.5">
                <rect x="223" y="573" width="68" height="72" strokeDasharray="6 6" />
                <rect x="214" y="716" width="66" height="123" />
              </g>
              <text x="257" y="618" textAnchor="middle" fontSize="26" fontWeight="600" fill="#202727">R</text>
              <text x="247" y="783" textAnchor="middle" fontSize="26" fontWeight="600" fill="#202727">SB</text>
              <text x="352.5" y="777.5" textAnchor="middle" dominantBaseline="central" fontSize="27" fontWeight="600" fill="#202727">玄</text>

              {/* S room single bed and desk */}
              <g fill={paper} stroke="#777b79" strokeWidth="1.5">
                <rect x="625" y="80" width="240" height="120" />
                <rect x="635" y="96" width="44" height="88" rx="6" />
                <line x1="695" y1="80" x2="695" y2="200" />
                <rect x="846" y="325" width="140" height="60" />
                <rect x="891" y="338" width="50" height="30" />
                <circle cx="916" cy="298" r="17" />
              </g>

              {/* S, closets and closet rails */}
              <text x="842" y="265" textAnchor="middle" fontSize="36" fontWeight="600" fill="#202727">S</text>
              <text x="1138" y="148" textAnchor="middle" fontSize="30" fontWeight="600" fill="#202727">CL</text>
              <text x="1139" y="325" textAnchor="middle" fontSize="29" fontWeight="600" fill="#202727">WIC</text>
              <g fill="none" stroke={line} strokeWidth="1.3" strokeDasharray="6 5">
                <path d="M1075 241H1190V382M1181 250V382" />
              </g>

              {/* dining table and chairs */}
              <g fill={paper} stroke="#797d7b" strokeWidth="1.4">
                <rect x="489" y="531" width="88" height="184" />
                <rect x="447" y="559" width="34" height="48" rx="7" />
                <rect x="447" y="639" width="34" height="48" rx="7" />
                <rect x="585" y="559" width="35" height="48" rx="7" />
                <rect x="585" y="639" width="35" height="48" rx="7" />
                <path d="M457 560V606M457 640V686M609 560V606M609 640V686" />
              </g>
              <text x="678" y="646" textAnchor="middle" fontSize="35" fontWeight="600" fill="#202727">D</text>

              {/* living furniture */}
              <g fill={paper} stroke="#777b79" strokeWidth="1.4">
                <rect x="849" y="502" width="86" height="241" rx="5" />
                <rect x="868" y="516" width="66" height="62" />
                <rect x="868" y="578" width="66" height="86" />
                <rect x="868" y="664" width="66" height="65" />
                <rect x="849" y="510" width="19" height="222" rx="7" />
                <rect x="976" y="563" width="70" height="130" />
                <rect x="1172" y="550" width="30" height="150" />
                <path d="M1185 580V670M1189 580V670" />
                <rect x="1178" y="406" width="36" height="88" strokeDasharray="5 4" />
              </g>
              <text x="1108" y="646" textAnchor="middle" fontSize="36" fontWeight="600" fill="#202727">L</text>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16"
                fontWeight="600"
                fill="#202727"
                transform="translate(1196 450) rotate(90)"
              >
                AC
              </text>

              {/* compass */}
              <g transform="translate(1335 104)">
                <circle r="44" fill={paper} stroke="#596472" strokeWidth="2.2" />
                <circle r="36" fill="none" stroke="#c2cac6" strokeWidth="1" />
                <g stroke="#7c8782" strokeWidth="1.3">
                  <path d="M0-44V-38M44 0H38M0 44V38M-44 0H-38" />
                </g>
                <path d="M0-32L9 7L0 2L-9 7Z" fill={ink} />
                <path d="M0 28L-6 3L0 7L6 3Z" fill="#aeb8b3" />
                <circle r="2.2" fill={ink} />
                <text y="-53" textAnchor="middle" fontSize="22" fontWeight="700" fill={ink} letterSpacing="1">N</text>
              </g>

              {/* interactive hit regions and active tint */}
              <g {...interaction("UB")}><rect x="214" y="65" width="187" height="212" fill={zoneFill("UB")} /></g>
              <g {...interaction("WC")}><rect x="411" y="65" width="202" height="212" fill={zoneFill("WC")} /></g>
              <g {...interaction("W")}><rect x="534" y="72" width="72" height="72" fill={zoneFill("W")} /></g>
              <g {...interaction("VANITY")}><rect x="553" y="176" width="60" height="90" fill={zoneFill("VANITY")} /></g>
              <g {...interaction("K")}><rect x="214" y="288" width="211" height="428" fill={zoneFill("K")} /></g>
              <g {...interaction("R")}><rect x="223" y="573" width="68" height="72" fill={zoneFill("R")} /></g>
              <g {...interaction("ENT")}><rect x="280" y="716" width="145" height="123" fill={zoneFill("ENT")} /></g>
              <g {...interaction("SB")}><rect x="214" y="716" width="66" height="123" fill={zoneFill("SB")} /></g>
              <g {...interaction("S")}><rect x="624" y="65" width="437" height="320" fill={zoneFill("S")} /></g>
              <g {...interaction("CL")}><rect x="1072" y="65" width="142" height="140" fill={zoneFill("CL")} /></g>
              <g {...interaction("WIC")}><rect x="1072" y="216" width="142" height="169" fill={zoneFill("WIC")} /></g>
              <g {...interaction("D")}><path d="M425 288H613V396H736V839H425Z" fill={zoneFill("D")} /></g>
              <g {...interaction("L")}><rect x="736" y="396" width="478" height="443" fill={zoneFill("L")} /></g>
              <g {...interaction("AC")}><rect x="1178" y="406" width="36" height="88" fill={zoneFill("AC")} /></g>
              <g {...interaction("BALCONY")}><rect x="760" y="852" width="458" height="126" fill={zoneFill("BALCONY")} /></g>
            </svg>
          </div>
        </div>

        <div className="min-h-[220px] border border-zinc-200 bg-[#F8FAF9] p-4 font-sans md:col-span-5 lg:col-span-4 md:min-h-0 flex flex-col justify-between">
          {currentItem ? (
            <div className="flex h-full flex-col space-y-3.5">
              <div>
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2.5">
                  <span className="bg-[#00a174] text-white px-2 py-0.5 font-mono text-xs font-bold">
                    {currentItem.code}
                  </span>
                  <h5 className="font-bold text-base text-[#1A2A22]">{currentItem.nameZh}</h5>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400 font-medium">{currentItem.nameEn}</span>
                    {currentItem.jpName && (
                      <span className="bg-white border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                        {currentItem.jpName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-700 text-justify">
                    {currentItem.desc}
                  </p>
                </div>
              </div>

              <div className="mt-auto border-l-2 border-[#00a174] bg-white p-3 space-y-1">
                <strong className="text-xs font-bold text-[#007d5a] block font-sans">Linus 實務說明：</strong>
                <p className="text-xs text-zinc-600 leading-relaxed text-justify">
                  {currentItem.practicalNote}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[188px] flex-col items-center justify-center text-center text-zinc-400 md:min-h-0 space-y-2 p-4">
              <MousePointerClick className="w-6 h-6 text-[#00a174]/70" />
              <p className="text-xs leading-relaxed text-zinc-500 font-sans">
                移動游標預覽左側 CAD 圖紙區劃<br />
                或點擊區域固定解說面板
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
