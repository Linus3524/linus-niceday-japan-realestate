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
    desc: "日本物件圖上的 L 是 Living Room，指客廳或主要起居區，也是放鬆、看電視與接待訪客的生活空間。與 D、K 組合成 LDK 時，代表客廳、餐廳與廚房共同構成一個完整的起居區域。",
    practicalNote: "✦ 空間判讀：確認 L 區的實際帖數、形狀與可用牆面，不只看 LDK 的總帖數。\n✦ 家具動線：估算沙發、電視與通往窗戶或陽台的通道是否互相干涉。\n✦ 插座位置：看屋時確認電視端子、網路端子與電源插座的數量及位置。",
    category: "room"
  },
  D: {
    code: "D",
    nameEn: "Dining Room",
    nameZh: "餐廳",
    jpName: "食事室・ダイニング",
    desc: "日本物件圖上的 D 是 Dining，指規劃作為用餐的區域，通常位於廚房與客廳之間。與 K 組合為 DK，與 L、K 組合則為 LDK，是日本住宅格局中常見的餐廚與起居空間標示。",
    practicalNote: "✦ 尺寸確認：依預計使用的餐桌尺寸，確認拉開椅子後仍有足夠通行空間。\n✦ 料理動線：留意餐桌位置是否會擋住廚房、客廳或其他房間的主要通道。\n✦ 照明電源：確認天花板燈具接口及附近插座位置是否符合使用方式。",
    category: "room"
  },
  K: {
    code: "K",
    nameEn: "Kitchen",
    nameZh: "廚房",
    jpName: "台所・キッチン",
    desc: "日本物件圖上的 K 是 Kitchen，指廚房或料理區，通常由水槽、料理檯面、爐具與收納櫃組成。常見熱源包括都市瓦斯、LP 瓦斯與 IH 電磁爐。",
    practicalNote: "✦ 熱源種類：確認使用都市瓦斯、LP 瓦斯或 IH，並核對爐具是否隨屋附帶。\n✦ 料理空間：查看水槽、工作檯面、爐口數與抽油煙設備是否符合需求。\n✦ 家電用電：確認冰箱、微波爐與電鍋等家電的插座位置及可用迴路。",
    category: "room"
  },
  S: {
    code: "S",
    nameEn: "Service Room / Storeroom",
    nameZh: "納戶 / 服務室",
    jpName: "納戸・サービスルーム",
    desc: "日本物件圖上的 S 多指 Service Room，也常寫作納戶。通常是因採光或通風等條件未達法規上的「居室」標準，因此不能標示為一般臥室，常作為收納、書房、工作室或其他多功能空間。",
    practicalNote: "✦ 法規標示：S／納戶不列入一般居室或臥室數量，但仍會計入專有面積。\n✦ 空間用途：可依面積與生活需求規劃為收納、書房或工作空間。\n✦ 使用條件：留意窗戶、通風、冷氣安裝條件與電源插座。",
    category: "room"
  },
  WC: {
    code: "WC",
    nameEn: "Water Closet / Toilet",
    nameZh: "獨立廁所",
    jpName: "独立トイレ",
    desc: "日本物件圖上的 WC 是 Water Closet，指廁所空間。日本住宅常將廁所與浴室分開配置，募集資訊通常以「バス・トイレ別」表示，是租屋時常見的衛浴格局條件。",
    practicalNote: "✦ 空間尺寸：確認座下後的膝部空間、入口寬度與門扇開啟方向。\n✦ 便座設備：確認是否有溫水洗淨便座，以及該設備屬房東設備或殘置物。\n✦ 收納換氣：查看吊櫃、衛生紙收納、窗戶或換氣扇是否存在。",
    category: "bath"
  },
  VANITY: {
    code: "洗面台",
    nameEn: "Independent Vanity",
    nameZh: "獨立洗面台",
    jpName: "独立洗面化粧台",
    desc: "「独立洗面化粧台」指洗面台設在浴室之外，可供洗臉、刷牙、吹髮或整理儀容。常見由洗面盆與鏡面組成，部分款式也會結合收納櫃、伸縮龍頭或電源插座。",
    practicalNote: "✦ 檯面設備：確認洗面盆尺寸、龍頭形式、鏡面及收納空間。\n✦ 設置位置：留意洗面台是否位於脫衣區，以及使用時會不會阻擋通道或洗衣機。\n✦ 插座換氣：確認吹風機用插座、照明與洗面區換氣條件。",
    category: "bath"
  },
  UB: {
    code: "UB",
    nameEn: "Unit Bath",
    nameZh: "整體浴室",
    jpName: "ユニットバス",
    desc: "日本物件圖上的 UB 是 Unit Bath，指將浴缸、牆面、地板與排水等部件以一體化方式施工的防水浴室。日文的 Unit Bath 是施工形式名稱，並不等同於廁所、洗面盆與浴缸全部合在一起的三點式浴室。",
    practicalNote: "✦ 浴室規格：確認浴室尺寸代號，以及浴缸與洗澡區的實際大小。\n✦ 熱水功能：確認是否有追焚、自動放水或保溫等功能。\n✦ 換氣乾燥：確認一般換氣扇或浴室換氣乾燥暖房機的配置與操作狀況。",
    category: "bath"
  },
  CL: {
    code: "CL",
    nameEn: "Closet",
    nameZh: "壁櫥 / 衣櫥",
    jpName: "クローゼット",
    desc: "日本物件圖上的 CL 是 Closet，指設置在房間內的衣櫥或壁櫥，是日本住宅常見的基本收納空間，主要用來吊掛衣物及收納日常用品。",
    practicalNote: "✦ 內部尺寸：實際確認寬度、深度與高度，判斷能否吊掛衣物或收納行李。\n✦ 內部配置：查看吊衣桿、層板與上方收納是否存在且方便使用。\n✦ 開門空間：確認摺疊門或拉門開啟後不會碰到床或其他家具。",
    category: "storage"
  },
  WIC: {
    code: "WIC",
    nameEn: "Walk-in Closet",
    nameZh: "步入式衣帽間",
    jpName: "ウォークインクローゼット",
    desc: "日本物件圖上的 WIC 是 Walk-in Closet，指可讓人直接走入並整理物品的衣帽間。相較一般 CL，內部活動空間更完整，適合集中收納衣物、行李箱、棉被與季節用品。",
    practicalNote: "✦ 有效收納：區分走道與實際可放置衣物、行李的範圍。\n✦ 內部配置：確認吊桿、層板、轉角與高處空間是否符合收納需求。\n✦ 通風防潮：查看是否有換氣口，並留意牆角、地板與衣物附近的潮濕痕跡。",
    category: "storage"
  },
  SB: {
    code: "SB",
    nameEn: "Shoes Box",
    nameZh: "鞋櫃",
    jpName: "シューズボックス・下駄箱",
    desc: "日本物件圖上的 SB 是 Shoes Box，指設於玄關附近的鞋類收納櫃，日文也常稱為「下駄箱」。主要用來集中收納室外鞋，讓玄關與換鞋區保持整齊。",
    practicalNote: "✦ 收納容量：確認鞋櫃內部寬度、深度、層板數量及能否調整。\n✦ 長物收納：如需放置長靴或雨傘，查看是否有足夠高度與專用空間。\n✦ 玄關動線：確認鞋櫃與大門開啟時不會壓縮換鞋及進出空間。",
    category: "storage"
  },
  ENT: {
    code: "ENT",
    nameEn: "Entrance / Genkan",
    nameZh: "玄關",
    jpName: "玄関",
    desc: "玄關是住宅入口內側的換鞋與過渡空間，通常由可穿鞋踩踏的土間與抬高的室內地板組成，是日本住宅用來區分室外與室內的重要空間。",
    practicalNote: "✦ 搬運尺寸：確認大門淨寬、走道轉角及大型家具家電能否通過。\n✦ 換鞋空間：查看土間大小、地板段差與開門後可站立的位置。\n✦ 門鎖設備：確認門鎖、門鏡、防盜鏈及感應照明等設備是否存在。",
    category: "room"
  },
  W: {
    code: "W",
    nameEn: "Washing Machine Space",
    nameZh: "洗衣機放置處",
    jpName: "室内洗濯機置場",
    desc: "日本物件圖上的 W 常表示 Washing Machine Space，也就是洗衣機放置處。室內洗衣機位通常集中配置防水盤、給水龍頭、排水口與電源插座。",
    practicalNote: "✦ 防水盤尺寸：量測外框與內部有效寬深，確認洗衣機腳座能否放入。\n✦ 機身空間：同時確認機身寬深、門蓋開啟、牆面及上方層架的限制。\n✦ 給排水位置：查看水龍頭高度、排水口方向、接地插座與搬入路線。",
    category: "equipment"
  },
  R: {
    code: "R",
    nameEn: "Refrigerator Space",
    nameZh: "冰箱放置處",
    jpName: "冷蔵庫置場",
    desc: "日本物件圖上的 R 常表示 Refrigerator Space，也就是冰箱放置處。通常安排在廚房附近，方便串連取用食材、清洗與料理的日常動線。",
    practicalNote: "✦ 設置尺寸：量測可用寬度、深度與高度，再依冰箱規格保留散熱間距。\n✦ 開門方向：確認冰箱門開啟後不會碰牆、廚房櫃體或阻擋通道。\n✦ 插座動線：查看專用插座高度，以及冰箱搬入玄關與走道的最窄處。",
    category: "equipment"
  },
  AC: {
    code: "AC",
    nameEn: "Air Conditioner",
    nameZh: "冷氣／冷氣安裝位",
    jpName: "エアコン",
    desc: "日本物件圖上的 AC 是 Air Conditioner，常用來標示冷氣設備或冷氣安裝位置。日本租屋不一定每個房間都配有冷氣；依物件設備而定，租客也可能需要自行購買與安裝。",
    practicalNote: "✦ 設備性質：確認冷氣是契約設備、前住戶留下的殘置物，或僅有安裝條件。\n✦ 安裝同意：自行安裝前須先取得房東或管理公司同意，再確認專用插座、冷媒管孔與可施工位置。\n✦ 室外機位置：查看陽台或外牆是否有合法且足夠的室外機放置空間。",
    category: "equipment"
  },
  BALCONY: {
    code: "BALCONY",
    nameEn: "Balcony",
    nameZh: "陽台",
    jpName: "バルコニー",
    desc: "日本物件圖上的 Balcony 指建物外側的平台空間，常用於採光、通風或晾衣。集合住宅的陽台通常屬共用部分中的專用使用區域，使用方式仍受管理規約與避難要求限制。",
    practicalNote: "✦ 使用規約：確認是否可晾衣、放置物品，以及吸菸等行為的限制。\n✦ 避難設備：避難梯、避難艙口與隔板前不得堆放阻礙逃生的物品。\n✦ 環境確認：查看朝向、遮蔽物、排水、晾衣架及室外機對可用空間的影響。",
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
          <div className="relative aspect-[1070/965] w-full overflow-hidden">
            <svg
              viewBox="175 35 1070 965"
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
              <rect x="175" y="35" width="1070" height="965" fill="#fbfaf8" />
              <rect x="175" y="35" width="1070" height="965" fill="url(#cadGrid)" opacity=".83" />

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

              {/* doors: door leaf bars across wall openings aligned 100% with wall thickness */}
              <g>
                {/* WC door: wall y=277..288 (height=11) */}
                <rect x="435" y="277" width="86" height="11" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M435 288V374A86 86 0 0 0 521 288" fill="none" stroke={line} strokeWidth="1.4" />

                {/* S room door: wall y=385..396 (height=11) */}
                <rect x="624" y="385" width="86" height="11" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M624 385V299A86 86 0 0 1 710 385" fill="none" stroke={line} strokeWidth="1.4" />

                {/* Entrance door: exterior wall y=839..852 (height=13), swing arc extends 86px from outer face y=852 */}
                <rect x="301" y="839" width="86" height="13" fill={paper} stroke={line} strokeWidth="1.5" />
                <path d="M301 852V938A86 86 0 0 0 387 852" fill="none" stroke={line} strokeWidth="1.4" />
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
              <text x="352.5" y="777.5" textAnchor="middle" dominantBaseline="central" fontSize="27" fontWeight="600" fill="#202727">ENT</text>

              {/* S room single bed, desk, and AC unit */}
              <g fill={paper} stroke="#777b79" strokeWidth="1.5">
                <rect x="625" y="80" width="240" height="120" />
                <rect x="635" y="96" width="44" height="88" rx="6" />
                <line x1="695" y1="80" x2="695" y2="200" />
                <rect x="846" y="325" width="140" height="60" />
                <rect x="891" y="338" width="50" height="30" />
                <circle cx="916" cy="298" r="17" />
                <rect x="890" y="65" width="88" height="34" strokeDasharray="5 4" />
              </g>

              {/* S, closets and closet rails */}
              <text x="842" y="265" textAnchor="middle" fontSize="36" fontWeight="600" fill="#202727">S</text>
              <text x="934" y="82" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="600" fill="#202727">AC</text>
              <text x="1138" y="148" textAnchor="middle" fontSize="30" fontWeight="600" fill="#202727">CL</text>
              <text x="1139" y="325" textAnchor="middle" fontSize="29" fontWeight="600" fill="#202727">WIC</text>
              <g fill="none" stroke={line} strokeWidth="1.4" strokeDasharray="6 5">
                <path d="M1061 216V302M1072 216V302" />
                <path d="M1075 241H1190V382M1181 250V382" />
              </g>

              {/* dining table and chairs */}
              <g fill={paper} stroke="#797d7b" strokeWidth="1.4">
                <rect x="519" y="531" width="88" height="184" />
                <rect x="477" y="559" width="34" height="48" rx="7" />
                <rect x="477" y="639" width="34" height="48" rx="7" />
                <rect x="615" y="559" width="35" height="48" rx="7" />
                <rect x="615" y="639" width="35" height="48" rx="7" />
                <path d="M487 560V606M487 640V686M639 560V606M639 640V686" />
              </g>
              <text x="698" y="646" textAnchor="middle" fontSize="35" fontWeight="600" fill="#202727">D</text>

              {/* living furniture */}
              <g fill={paper} stroke="#777b79" strokeWidth="1.4">
                <rect x="849" y="502" width="86" height="241" rx="5" />
                <rect x="868" y="516" width="66" height="62" />
                <rect x="868" y="578" width="66" height="86" />
                <rect x="868" y="664" width="66" height="65" />
                <rect x="849" y="510" width="19" height="222" rx="7" />
                <rect x="976" y="563" width="70" height="130" />
                <rect x="1184" y="525" width="30" height="190" />
                <path d="M1197 560V675M1201 560V675" />
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
              <g transform="translate(490 930)">
                <circle r="30" fill={paper} stroke="#596472" strokeWidth="1.6" />
                <circle r="24" fill="none" stroke="#c2cac6" strokeWidth="0.9" />
                <g stroke="#7c8782" strokeWidth="1">
                  <path d="M0-30V-25M30 0H25M0 30V25M-30 0H-25" />
                </g>
                <path d="M0-21L6 4L0 1L-6 4Z" fill={ink} />
                <path d="M0 19L-4 2L0 4L4 2Z" fill="#aeb8b3" />
                <circle r="1.6" fill={ink} />
                <text y="-36" textAnchor="middle" fontSize="16" fontWeight="700" fill={ink} letterSpacing="0.8">N</text>
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
              <g {...interaction("AC")}>
                <rect x="1178" y="406" width="36" height="88" fill={zoneFill("AC")} />
                <rect x="890" y="65" width="88" height="34" fill={zoneFill("AC")} />
              </g>
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
                      const content = trimmed.slice(1).trim();
                      const colonIdx = content.indexOf("：") !== -1 ? content.indexOf("：") : content.indexOf(":");
                      if (colonIdx !== -1) {
                        const title = content.slice(0, colonIdx + 1);
                        const body = content.slice(colonIdx + 1);
                        return (
                          <div key={idx} className="flex items-start gap-2 text-justify leading-relaxed">
                            <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#00a174]" aria-hidden="true" />
                            <span>
                              <span className="font-semibold text-[#1A2A22]">{title}</span>
                              <span className="text-zinc-600">{body}</span>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex items-start gap-2 font-semibold text-[#1A2A22] text-justify leading-relaxed">
                          <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#00a174]" aria-hidden="true" />
                          <span>{content}</span>
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
