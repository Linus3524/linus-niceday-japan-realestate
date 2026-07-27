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
    nameZh: "客廳",
    jpName: "居間・リビング",
    desc: "日常起居與社交核心空間。在日本 1LDK 構造中，通常與餐廚區無縫連通（開放式 LDK），並透過大面落地窗銜接戶外陽台，提供主要採光與通風。",
    practicalNote: "✦ 視距與動線淨寬：電視主牆至沙發建議至少留 2 公尺視距。\n✦ 落地窗擺設：前往陽台的步行動線勿被大型沙發或茶邊桌遮擋。\n✦ 壁孔機能：看屋時需核對電視壁孔、網路出線口與電源插座位置。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳",
    jpName: "食事室・ダイニング",
    desc: "擺放餐桌椅並專用於用餐與家庭交流的區域，介於廚房料理區與客廳起居區之間，構成日本現代住宅常見的高效「動線黃金三角」。",
    practicalNote: "✦ 動線淨寬：餐桌椅後方需預留 60-80cm 通行淨寬。\n✦ 黃金動線：確認餐桌擺妥後不擠壓廚房料理與出菜通道。\n✦ 燈具插座：留意餐桌上方吊燈線路與便攜式電磁爐插座。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房",
    jpName: "台所・キッチン",
    desc: "料理與洗滌區域，配置水槽、切菜工作檯面與雙口/三口瓦斯爐或 IH 爐。旁側緊鄰冰箱預留位 (R)，實現短距離的洗切炒烹飪動線。",
    practicalNote: "✦ 熱源種類：確認屬都市瓦斯 (都市ガス)、LP丙烷瓦斯或 IH 爐。\n✦ 料理空間：確認切菜檯面淨寬、水槽大小與抽油煙機風量。\n✦ 專用迴路：確認微波爐、電鍋等高功率家電之專用插座。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room / Storeroom",
    nameZh: "納戶 / 服務室",
    jpName: "納戸・サービスルーム",
    desc: "因採光口（窗戶）面積未達日本《建築基準法》第 28 條規定之居室標準（採光面積小於地板面積 1/7），法規標示為 S (Service Room) 或納戶，實務上常作為獨立書房、影音室或擺放單身床墊之多功能空間。",
    practicalNote: "✦ 日本常見床墊尺寸代號：\n  • S (Single 單人床)：97 × 195cm\n  • SD (Semi-Double 單人加大)：120 × 195cm\n  • D (Double 標準雙人床)：140 × 195cm\n  • Q (Queen 雙人加大床)：160 × 195cm\n✦ 實務提醒：確認是否有冷氣貫通孔與插座；轉售時不可標為標準臥室。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet / Toilet",
    nameZh: "獨立廁所",
    jpName: "独立トイレ",
    desc: "完全獨立於浴室與洗面所之外的廁所空間（日本衛浴分離主流規格）。讓家人或同居者在有人泡澡淋浴時，仍可完全獨立且安心地如廁。",
    practicalNote: "✦ 淨寬與門扇：親自坐下測試膝蓋與前門淨寬度（避免過窄擠壓）。\n✦ 標配設備：確認是否標配溫水洗淨便座 (免治馬桶) 與上層吊櫃。\n✦ 門扇干涉：注意廁所門開啟方向是否會與浴室門相互碰撞。",
    category: "bath"
  },
  VANITY: {
    code: "洗面台",
    nameEn: "Independent Vanity",
    nameZh: "獨立洗面台",
    jpName: "独立洗面化粧台",
    desc: "獨立設於脫衣過道的梳洗設備，整合洗臉盆、三面鏡櫃、單手彈開伸縮龍頭與電源插座，無須進入濕漉漉的浴室即可快速完成早晚洗漱、吹髮與化妝。",
    practicalNote: "✦ 鏡櫃龍頭：確認鏡櫃內部收納深度與伸縮蓮蓬頭龍頭（シャンプー水栓）。\n✦ 防濺設計：檯面防濺邊界與水槽洗滌深度。\n✦ 用電配備：確認吹風機、電動牙刷必備之防水電源插座。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室",
    jpName: "ユニットバス",
    desc: "工廠預製成型的一體化防漏防水浴室，整合浴缸、獨立淋浴區與專用排水孔。具備極高的熱絕緣保溫性與優異的氣密防潮性能。",
    practicalNote: "✦ 浴室尺寸：確認浴室尺寸代號（如 1616 或 1418 規格）。\n✦ 追焚功能：確認是否配備自動追焚加熱功能（追炊き）。\n✦ 換氣乾燥：確認是否有浴室換氣乾燥暖房機（室內晾衣與冬季防熱休克）。",
    category: "bath"
  },
  CL: {
    code: "CL",
    nameEn: "Closet",
    nameZh: "壁櫥 / 衣櫥",
    jpName: "クローゼット",
    desc: "內嵌於牆體內部的收納衣櫃，配有橫向金屬吊衣桿與頂部天袋置物層板，完全不占用房間實際行走與擺放床鋪的地板面積。",
    practicalNote: "✦ 有效深度：吊掛西裝/大衣內部深度建議至少留 60cm。\n✦ 天袋收納：頂部天袋層板收納大型棉被與季節物品。\n✦ 門扇迴旋：確認摺疊門或拉門開啟時是否卡到床頭櫃。",
    category: "storage"
  },
  WIC: {
    code: "WIC",
    nameEn: "Walk-in Closet",
    nameZh: "步入式衣帽間",
    jpName: "ウォークインクローゼット",
    desc: "人可直接走入的大容量獨立收納空間，內部四周設有多層隔板、吊衣桿與層架，能同時集中收納四季衣物、大型行李箱、棉被與季節性家電。",
    practicalNote: "✦ 空間淨寬：WIC 標示面積含內部走道，需實測有效掛衣深度。\n✦ 轉角高處：確認轉角吊桿與高處層板是否便於拿取。\n✦ 通風防霉：確認內部設有換氣風門或抽風孔以防潮濕。",
    category: "storage"
  },
  SB: {
    code: "SB",
    nameEn: "Shoes Box",
    nameZh: "鞋櫃",
    jpName: "シューズボックス・下駄箱",
    desc: "緊貼玄關牆面設置的高容量鞋類收納櫃，內設可自由調整高度的層板，底部常留有懸空區供擺放當天常穿的室外鞋。",
    practicalNote: "✦ 層板調整：層板需能自由拆卸（以擺放高跟鞋或長靴）。\n✦ 長傘收納：內部設有傘架與底層瀝水溝槽。\n✦ 玄關動線：門扇全開時不阻擋玄關落塵區進出動線。",
    category: "storage"
  },
  ENT: {
    code: "玄",
    nameEn: "Entrance / Genkan",
    nameZh: "玄關",
    jpName: "玄関",
    desc: "連通室外與內部的換鞋緩衝空間。設有落塵土間與抬高之地板段差（上がり框），在傳統與現代日本文化中均為明確區隔乾淨室內的衛生防線。",
    practicalNote: "✦ 搬運淨寬：測量玄關大門開啟淨寬與迴旋半徑（搬運大家電必查）。\n✦ 落塵段差：確認室外土間與室內上がり框的高低差高度。\n✦ 燈光感應：玄關是否配備自動人感感應照明。",
    category: "room"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機預留位",
    jpName: "室内洗濯機置場",
    desc: "室內專用洗衣機擺放區，配有固定尺寸防溢水保護盤（防水パン）、防冷凝高位給水龍頭與防漏電接地插座。日本單身公寓最常見標配規格為正方形 64cm×64cm 防水盤（內部淨寬約 58-59cm）。",
    practicalNote: "✦ 單身標準防水盤：正方形 64×64cm 規格（內部淨寬約 58-59cm）。\n✦ 適用機型尺寸：\n  • 直立式 5~7kg（機身寬約 52~55cm）\n  • 滾筒式（機身寬 60cm 內超薄款）\n✦ 看屋必查重點：水龍頭高度不阻擋上蓋開啟、排水孔位置好接管。",
    category: "equipment"
  },
  R: {
    code: "R",
    nameEn: "Refrigerator Space",
    nameZh: "冰箱預留位",
    jpName: "冷蔵庫置場",
    desc: "廚房料理區旁專門預留的冰箱擺設空間，緊鄰電源插座與廚房備餐動線。日本現代單身套房/1LDK 多設計為適合擺放單身主流「高瘦型冰箱（高身スリム冷蔵庫）」之空間。",
    practicalNote: "✦ 家電尺寸：單身主流 150L~200L 雙門高瘦型（寬 48~54cm、深 55~60cm）。\n✦ 散熱淨寬：預留兩側各 0.5~1cm 散熱淨寬與前方開門迴旋空間。\n✦ 門扇開向：確認門扇左開/右開/雙開不撞牆面或廚房櫃體。",
    category: "equipment"
  },
  AC: {
    code: "AC",
    nameEn: "Air Conditioner",
    nameZh: "冷氣預留位 / 變頻冷氣",
    jpName: "エアコン",
    desc: "牆面上方專用的變頻壁掛冷氣安裝位，配置冷媒管/排水管穿牆貫通孔以及大功率專用單獨迴路插座 (100V/200V)。",
    practicalNote: "✦ 權屬確認：確認標示 AC 屬於「設備（房東修）」還是「殘留物（自理）」。\n✦ 專用迴路：核對變頻冷氣牆面專用插座電壓 (100V / 200V)。\n✦ 室外機位：確認冷媒管穿牆貫通孔與室外機擺放陽台位置。",
    category: "equipment"
  },
  BALCONY: {
    code: "BALCONY",
    nameEn: "Balcony",
    nameZh: "陽台",
    jpName: "バルコニー",
    desc: "自客廳延伸出去的對外戶外空間，主要提供日常採光、通風與晾曬衣物。在日本法律上屬於社區全體共有、但授權該戶獨佔的「專有使用部分」。",
    practicalNote: "✦ 專有使用權：法律上屬全體共有、但授權該戶獨佔使用。\n✦ 消防規範：避難梯 (避難ハッチ) 與避難隔板周圍嚴禁堆放雜物。\n✦ 採光與晾衣：觀察戶外採光座向、遮蔽物與曬衣架安裝高度。",
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
                <rect x="1058" y="224" width="18" height="78" />
                <rect x="435" y="274" width="86" height="18" />
                <rect x="624" y="382" width="86" height="18" />
                <rect x="301" y="829" width="86" height="24" />
                <rect x="511" y="839" width="170" height="13" />
                <rect x="846" y="839" width="235" height="13" />
              </g>

              {/* windows */}
              <g fill={paper} stroke={line} strokeWidth="1.5">
                {/* windows */}
                <rect x="751" y="52" width="87" height="13" />
                <path d="M794.5 52V65" />
                <rect x="511" y="839" width="170" height="13" />
                <path d="M596 839V852" />
                <rect x="846" y="839" width="235" height="13" />
                <path d="M963.5 839V852" />
              </g>

              {/* Single-swing CAD doors (WC, S room, Entrance): unified 86px wall opening, 5px slim 90° open door panel, jamb lines, and 86px arc radius */}
              <g>
                {/* WC door: opening x=435..521 (width=86), wall y=277..288 */}
                <line x1="435" y1="277" x2="435" y2="288" stroke={line} strokeWidth="1.5" />
                <line x1="521" y1="277" x2="521" y2="288" stroke={line} strokeWidth="1.5" />
                <rect x="430" y="288" width="5" height="86" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M430 374 A86 86 0 0 0 521 288" fill="none" stroke={line} strokeWidth="1.4" />

                {/* S room door: opening x=624..710 (width=86), wall y=385..396 */}
                <line x1="624" y1="385" x2="624" y2="396" stroke={line} strokeWidth="1.5" />
                <line x1="710" y1="385" x2="710" y2="396" stroke={line} strokeWidth="1.5" />
                <rect x="619" y="299" width="5" height="86" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M619 299 A86 86 0 0 1 710 385" fill="none" stroke={line} strokeWidth="1.4" />

                {/* Entrance door: opening x=301..387 (width=86), exterior wall y=839..852 */}
                <line x1="301" y1="839" x2="301" y2="852" stroke={line} strokeWidth="1.5" />
                <line x1="387" y1="839" x2="387" y2="852" stroke={line} strokeWidth="1.5" />
                <rect x="296" y="839" width="5" height="86" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M296 925 A86 86 0 0 0 387 839" fill="none" stroke={line} strokeWidth="1.4" />
              </g>

              {/* Bi-fold doors (UB, CL): clean hollow frame rect matching wall thickness (11px/10px) + V-folding panels folding left */}
              <g>
                {/* UB bi-fold door: wall x=401..411 (width=10), y=184..277 */}
                <rect x="401" y="184" width="10" height="93" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M401 184 L388 207 L401 230.5 L388 254 L401 277" fill="none" stroke={line} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

                {/* CL bi-fold closet door: wall x=1061..1072 (width=11), y=76..196 */}
                <rect x="1061" y="76" width="11" height="120" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M1061 76 L1036 106 L1061 136 L1036 166 L1061 196" fill="none" stroke={line} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
              <g fill="none" stroke={line} strokeWidth="1.4" strokeDasharray="6 5">
                <path d="M1061 216V302M1072 216V302" />
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
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-2.5">
                  <span className="bg-[#00a174] text-white px-2 py-0.5 font-mono text-xs font-bold">
                    {currentItem.code}
                  </span>
                  <h5 className="font-bold text-base text-[#1A2A22]">{currentItem.jpName || currentItem.nameZh}</h5>
                  <span className="bg-white border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 font-sans">
                    {currentItem.nameZh}
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <p className="font-mono text-xs text-zinc-400 font-medium">{currentItem.nameEn}</p>
                  <p className="text-xs leading-relaxed text-zinc-700 text-justify">
                    {currentItem.desc}
                  </p>
                </div>
              </div>

              <div className="mt-auto border-l-2 border-[#00a174] bg-white p-3.5 space-y-2 rounded-r shadow-xs">
                <strong className="text-xs font-bold text-[#007d5a] block font-sans">Linus 實務說明：</strong>
                <div className="text-xs text-zinc-600 leading-relaxed font-sans space-y-1.5">
                  {currentItem.practicalNote.split("\n").map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("✦")) {
                      const colonIdx = line.indexOf("：") !== -1 ? line.indexOf("：") : line.indexOf(":");
                      if (colonIdx !== -1) {
                        const title = line.slice(0, colonIdx + 1);
                        const body = line.slice(colonIdx + 1);
                        return (
                          <div key={idx} className="text-justify leading-relaxed">
                            <span className="font-semibold text-[#1A2A22]">{title}</span>
                            <span className="text-zinc-600">{body}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="font-semibold text-[#1A2A22] text-justify leading-relaxed">
                          {line}
                        </div>
                      );
                    }
                    if (trimmed.startsWith("•")) {
                      return (
                        <div key={idx} className="pl-3.5 text-zinc-600 text-justify leading-relaxed">
                          {line}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="whitespace-pre-line text-justify leading-relaxed">
                        {line}
                      </div>
                    );
                  })}
                </div>
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
