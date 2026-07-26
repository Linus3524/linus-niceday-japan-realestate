import { motion } from "motion/react";
import { useState } from "react";
import { Search, MapPin, ArrowRight, Lightbulb, ReceiptText, Smile, FileText, X, Building, Landmark, Percent, Map, ChevronDown } from "lucide-react";
import {
  buyHouseCashSteps, buyHouseLoanSteps, signingDocuments, taiwaneseBanks,
  japaneseBanks, minpakuRules, ryokanRules, BuyHouseTermItem, BuyHouseQAItem
} from "../data/buyHouseData";
import { renderFormattedText } from "../lib/format";
import { QACard } from "./QACard";
import { SectionHeading } from "./SectionHeading";
import { matchesAllTokens, tokenizeQuery } from "../lib/search";
import { JapaneseRuby } from "./JapaneseRuby";

interface BuyGuideTabProps {
  buyCategory: string;
  setBuyCategory: (c: any) => void;
  buySearchQuery: string;
  setBuySearchQuery: (q: string) => void;
  buyFiltered: { drawing: BuyHouseTermItem[]; fee: BuyHouseTermItem[]; qa: BuyHouseQAItem[] };
  selectedFlowType: "cash" | "loan";
  setSelectedFlowType: (t: "cash" | "loan") => void;
  setSelectedFee: (fee: any) => void;
  handleTabChange: (tab: any) => void;
}

const minpakuWardOrder = [
  "千代田區", "中央區", "港區", "新宿區", "文京區", "台東區", "墨田區", "江東區", "品川區", "目黑區", "大田區", "世田谷區",
  "澀谷區", "中野區", "杉並區", "豐島區", "北區", "荒川區", "板橋區", "練馬區", "足立區", "葛飾區", "江戶川區"
];

const getMinpakuLimitLabel = (daysLimit: string) => {
  if (/週末|週五正午|週六正午|104 天/.test(daysLimit)) return "週末為主";
  if (/假期|指定期間/.test(daysLimit)) return "指定期間營業";
  if (/個案確認|依.*確認|需.*確認/.test(daysLimit)) return "依區域個別確認";
  if (/限制/.test(daysLimit)) return "180 天＋區域限制";
  return "最多 180 天／年";
};

const getMinpakuAreaLabel = (areaLimit: string) => {
  if (/^全區/.test(areaLimit)) return "全區";
  if (/商業地域除外/.test(areaLimit)) return "商業區以外";
  if (/學校/.test(areaLimit) && /住居|文教/.test(areaLimit)) return "住宅區／學校周邊";
  if (/文教/.test(areaLimit) && /住居/.test(areaLimit)) return "住宅區／文教區";
  if (/住居專用/.test(areaLimit)) return "住居專用區";
  if (/文教/.test(areaLimit)) return "文教區";
  return "依物件所在地確認";
};

const taiwanJapanComparisons = [
  {
    id: "area",
    number: "01",
    title: "房屋面積怎麼算",
    taiwan: "權狀總面積通常包含主建物、附屬建物及共有部分；看房時還會再用公設比推算實際室內空間。",
    japan: "買賣廣告主要標示專有面積，不把大廳、公共走廊與電梯等共有部分加進房屋面積。陽台通常也不列入專有面積。",
    advice: "日本廣告標示的多半是壁芯面積（從牆壁中心線計算），登記簿則是內法面積（從牆壁內側計算）。所以同一間房的登記面積通常會比廣告小一些，這是量測基準不同，不是面積短少。"
  },
  {
    id: "price",
    number: "02",
    title: "坪數與單價怎麼換算",
    taiwan: "市場習慣直接使用「坪」與每坪單價比較房價。",
    japan: "物件圖紙與登記使用平方公尺。換算方式為「平方公尺 × 0.3025＝坪」；例如50㎡約為15.1坪。",
    advice: "日本的每坪單價是用專有面積換算，台灣的權狀坪數則含公設。兩者基準不同，直接比較容易高估或低估日本的房價。"
  },
  {
    id: "condition",
    number: "03",
    title: "新屋交屋時有什麼",
    taiwan: "建案可能採毛胚、標準配備或客變後交屋，室內裝修通常需要另外確認。",
    japan: "新築公寓一般已完成地板、牆面、廚房、浴室、廁所與收納等基本內裝，可直接安排入住。",
    advice: "基本內裝雖然已經完成，但冷氣、照明、窗簾與家具不一定包含。簽約前可以先看設備表與選配清單，確認哪些是附的、哪些要另外添購，入住預算會比較好抓。"
  },
  {
    id: "management",
    number: "04",
    title: "管理費與修繕積立金",
    taiwan: "社區通常按月收取管理費，大型修繕的基金籌措與收費方式由各社區決定。",
    japan: "公寓每月通常分開收取「管理費」與「修繕積立金」：前者支付日常管理，後者專門準備外牆、防水、管線與電梯等大型修繕。",
    advice: "除了每月金額，建議一併看長期修繕計畫、積立金餘額與最近一次總會紀錄。積立金存得不夠時，未來可能會調漲或臨時分攤。"
  },
  {
    id: "transaction",
    number: "05",
    title: "出價、訂金與仲介費",
    taiwan: "常透過斡旋或要約提出價格，訂金的金額與支付方式依交易及仲介契約而定。仲介服務費依《不動產經紀業管理條例》規定，買賣雙方合計不得超過成交價的 6%，實務上多為賣方 4%、買方 1%～2%。",
    japan: "通常先提交買付申込書表達出價，這個階段一般不用付款；正式簽訂買賣契約時，才支付約房價 5%～10% 的手付金。仲介費另有法定上限，中古屋常用的速算是「成交價 × 3% ＋ 6 萬日圓，再加消費稅」。",
    advice: "手付金與仲介費的實際付款時間、是否分次支付，各家做法不同。這兩筆都是交屋前就要準備的現金，建議在簽約前先確認清楚。"
  }
];

const taxLifecycle = [
  {
    stage: "買進",
    tone: "bg-[#F4E8CB] text-[#75571E]",
    summary: "簽約、登記與取得時產生的一次性稅費。",
    details: [
      {
        title: "印紙稅",
        points: ["1,000萬～5,000萬日圓：1萬日圓", "5,000萬～1億日圓：3萬日圓", "1億～5億日圓：6萬日圓"]
      },
      {
        title: "登錄免許稅",
        points: ["土地移轉：固定資產稅評價額 × 1.5%", "建物一般移轉：評價額 × 2%", "住宅特例：移轉0.3%／保存0.15%／抵押權設定0.1%"]
      },
      {
        title: "不動產取得稅",
        points: ["住宅建物：固定資產稅評價額 × 3%", "土地：評價額 × 1/2 × 3%", "符合條件的新築住宅：課稅標準扣除1,200萬日圓"]
      }
    ],
    note: "印紙稅與不動產取得稅的輕減措施適用到 2027 年 3 月 31 日，之後是否延長要看政策。住宅特例也不是每間都適用，還要看面積、屋齡、耐震條件與辦理期限。"
  },
  {
    stage: "持有",
    tone: "bg-[#DDE7EC] text-[#31576A]",
    summary: "年度稅負與大樓持有成本要分開計算。",
    details: [
      {
        title: "固定資產稅",
        points: ["固定資產稅評價額 × 1.4%", "納稅人：每年1月1日的登記所有權人", "稅單通常於4～6月寄出"]
      },
      {
        title: "都市計畫稅",
        points: ["固定資產稅評價額 × 最高0.3%", "僅課徵於市街化區域等適用範圍", "通常與固定資產稅一併繳納"]
      },
      {
        title: "管理費與修繕積立金",
        points: ["管理費：日常管理與公共設備運作", "修繕積立金：大型修繕準備金", "兩項皆非稅金，但屬每月固定持有成本"]
      }
    ],
    note: "固定資產稅是向每年 1 月 1 日的登記所有權人課徵，交屋那一年通常由買賣雙方按持有天數分攤，在交屋時一併結算。中古公寓建議另外確認修繕積立金餘額、住戶欠繳情形與調漲計畫，這些會直接影響每月的持有成本。"
  },
  {
    stage: "出租",
    tone: "bg-[#DCEFE8] text-[#16634D]",
    summary: "租金收入要扣除必要經費後，再依屋主身分申報。",
    details: [
      {
        title: "不動產所得",
        points: ["課稅所得＝租金等收入－必要經費", "常見經費：管理、修繕、稅金、保險、建物折舊與借款利息", "土地不能提列折舊"]
      },
      {
        title: "海外房東的20.42%源泉扣繳",
        points: ["法人租客：租金先扣20.42%", "個人供本人或親屬居住：免辦租金扣繳", "20.42%是預繳，不是最終稅率"]
      },
      {
        title: "確定申告與納稅管理人",
        points: ["按實際所得重新計算稅額", "已扣20.42%可抵稅，超扣可退、不足須補", "海外屋主通常指定日本納稅管理人"]
      }
    ],
    note: "是否預扣 20.42%，看的是屋主在日本的稅務身分與租客的實際用途，不是只看有沒有在留卡。條件相近的房東也可能適用不同處理，實務上建議個案確認。"
  },
  {
    stage: "出售／繼承",
    tone: "bg-[#F3DFD5] text-[#8A4329]",
    summary: "出售利益、持有期間及跨境繼承都要依身分判斷。",
    details: [
      {
        title: "出售利益",
        points: ["讓渡所得＝售價－取得費－出售費用－適用控除", "建物取得費須扣除持有期間折舊", "不能只用售價減原始買價"]
      },
      {
        title: "持有期間與稅率",
        points: ["長期讓渡所得：20.315%", "短期讓渡所得：39.63%", "以出售年度1月1日是否持有超過5年判斷"]
      },
      {
        title: "海外賣方與繼承",
        points: ["非居住者出售：成交總價原則先扣10.21%", "之後以確定申告按實際利益結算", "相續稅申報期限：得知繼承開始翌日起10個月"]
      }
    ],
    note: "買方是個人、而且買來自住，符合條件時可以免扣 10.21%。自住房 3,000 萬日圓的特別控除則是另一套條件，要看持有期間與實際居住情形個別判斷。"
  }
];

export function BuyGuideTab(props: BuyGuideTabProps) {
  const { buyCategory, setBuyCategory, buySearchQuery, setBuySearchQuery, buyFiltered, selectedFlowType, setSelectedFlowType, setSelectedFee, handleTabChange } = props;
  const normalizedBuyQuery = buySearchQuery.trim().toLowerCase();
  // 多關鍵字查詢（例如「民泊 天數」）要全部命中才算，避免空白被當成比對字元
  const buyQueryTokens = tokenizeQuery(buySearchQuery);
  const isBuySearchActive = normalizedBuyQuery.length > 0;
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedMinpakuWards, setExpandedMinpakuWards] = useState<Set<string>>(new Set());
  const [ryokanExpanded, setRyokanExpanded] = useState(false);
  // 「買房流程」底下四個大區塊做成可摺疊，整頁才不會過長。
  // 預設只展開第一塊（觀念），其餘收合，讓使用者一進來就看得到內容又能快速掃到標題。
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(["concepts"]));
  const isStepOpen = (key: string) => openSteps.has(key);
  const toggleStep = (key: string) => setOpenSteps(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const toggleBank = (key: string) => setExpandedBanks(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const toggleMinpakuWard = (district: string) => setExpandedMinpakuWards(current => {
    const next = new Set(current);
    if (next.has(district)) next.delete(district);
    else next.add(district);
    return next;
  });
  const staticBuySearchItems = [
    ...taiwanJapanComparisons.map(item => ({
      category: "台日買房差異",
      title: item.title,
      text: `台灣：${item.taiwan} 日本：${item.japan} Linus 實務提醒：${item.advice}`
    })),
    ...buyHouseCashSteps.map(step => ({
      category: "現金買房流程",
      title: step.title,
      text: [step.description, step.timing, step.payment, step.documents, ...(step.points || []), step.warning].filter(Boolean).join(" ")
    })),
    ...buyHouseLoanSteps.map(step => ({
      category: "貸款買房流程",
      title: step.title,
      text: [step.description, step.timing, step.payment, step.documents, ...(step.points || []), step.warning].filter(Boolean).join(" ")
    })),
    ...taxLifecycle.flatMap(stage => stage.details.map(detail => ({
      category: `稅務與持有・${stage.stage}`,
      title: detail.title,
      text: `${stage.summary} ${detail.points.join(" ")} 實務提醒：${stage.note}`
    }))),
    {
      category: "買房流程與文件",
      title: signingDocuments.residenceGroup.title,
      text: signingDocuments.residenceGroup.items.join(" ")
    },
    {
      category: "買房流程與文件",
      title: signingDocuments.nonResidenceGroup.title,
      text: signingDocuments.nonResidenceGroup.items.join(" ")
    },
    ...taiwaneseBanks.map(bank => ({
      category: "海外買方融資",
      title: bank.name,
      text: Object.values(bank).flat().join(" ")
    })),
    ...japaneseBanks.map(bank => ({
      category: "在日工作者融資",
      title: bank.name,
      text: Object.values(bank).flat().join(" ")
    })),
    ...minpakuRules.map(rule => ({
      category: "東京都民泊法規",
      title: rule.district,
      text: `${rule.rules} ${rule.daysLimit} ${rule.areaLimit} ${rule.managerReq}`
    })),
    {
      category: "旅館業／簡易宿所",
      title: "東京都特別區旅館業與簡易宿所確認重點",
      text: JSON.stringify(ryokanRules)
    }
  ].filter(item =>
    matchesAllTokens(`${item.category} ${item.title} ${item.text}`, buyQueryTokens)
  );
  const searchResultCount =
    buyFiltered.drawing.length +
    buyFiltered.fee.length +
    buyFiltered.qa.length +
    staticBuySearchItems.length;

  return (
            <motion.div
              key="buyHouse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-buy-house"
            >
              {/* Preface Section */}
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 md:p-8 relative transition-all duration-300 hover:shadow-colored-soft" id="buy-house-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#00a174] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  置產 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#DDE3DF] pb-3 mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded shrink-0 select-none text-[22px] leading-none text-[#00a174]" aria-hidden="true">real_estate_agent</span>
                  <span>日本買房置產</span>
                  <span className="text-[#00a174] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#00a174] first-letter:mr-1">
                  許多台灣朋友在日本生活逐漸安定後，也開始規劃買房自住、長期出租，或研究住宿事業。外國人原則上可以取得日本不動產，但產權登記、匯款、融資、稅務與住宿營業各有不同程序；除了房價與表面投報率，還有不少細節需要先釐清。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  為了協助您更有方向地了解日本房市，我整理了物件資料與費用術語、現金與貸款買房流程、金融機構方案示例，以及民宿與旅館業的確認重點。無論是想自住還是置產規劃，都歡迎直接查閱或透過 AI 顧問向我諮詢！❀
                </p>
 
                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">smart_toy</span>
                      <span>需要為您評估買房方案或試算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      AI 會優先參考本站整理資料，並在貸款、稅務與住宿法規問題中提示適用條件及確認單位。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                    >
                      <span>開始 AI 買房諮詢</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
 
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                      <Smile className="w-4 h-4" />
                      <span>需要直接進行日本物件配對？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      直接聯絡 Linus，我們將為您在尋找在網上公開或未公開的獨家優質房源。
                    </p>
                    <button 
                      onClick={() => handleTabChange("contact")}
                      className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                    >
                      <span>取得 Linus 聯繫管道</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
 
              {/* Grid Control & Search Block */}
              <div className="border border-[#DDE3DF] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center" id="buy-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "drawing", label: "圖紙與物件" },
                    { id: "fee", label: "交易與費用" },
                    { id: "steps", label: "買房流程與文件" },
                    { id: "loans", label: "在日貸款條件" },
                    { id: "minpaku", label: "民宿與旅館法規" },
                    { id: "qa", label: "買房問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setBuyCategory(cat.id as any);
                        setBuySearchQuery("");
                      }}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        buyCategory === cat.id 
                          ? "bg-[#00a174] text-white border-[#00a174]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#00a174]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
 
                {/* Filter Search Field */}
                <div className="relative w-full md:w-72 font-sans">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="搜尋買房知識（如：貸款）..."
                    value={buySearchQuery}
                    onChange={(e) => {
                      setBuySearchQuery(e.target.value);
                      if (!["all", "drawing", "fee", "qa"].includes(buyCategory) && e.target.value.trim()) {
                        setBuyCategory("all");
                      }
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#DDE3DF] hover:border-[#00a174] focus:outline-none focus:ring-1 focus:ring-[#00a174]"
                  />
                  {buySearchQuery && (
                    <button 
                      onClick={() => setBuySearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isBuySearchActive && (
                <section className="border border-[#DDE3DF] bg-white p-5 md:p-8">
                  <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#DDE3DF] pb-4">
                    <div>
                      <h3 className="border-l-4 border-[#00a174] pl-3 text-xl font-bold text-[#1A2A22]">買房知識搜尋結果</h3>
                      <p className="mt-2 pl-4 font-sans text-xs text-zinc-500">
                        「{buySearchQuery.trim()}」共找到 {searchResultCount} 筆相關內容
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuySearchQuery("")}
                      className="shrink-0 font-sans text-xs font-bold text-[#007D5A] hover:text-[#00a174]"
                    >
                      清除搜尋
                    </button>
                  </div>

                  {searchResultCount === 0 ? (
                    <div className="bg-[#F5F8F6] px-5 py-10 text-center font-sans">
                      <p className="text-sm font-bold text-[#1A2A22]">找不到符合的內容</p>
                      <p className="mt-2 text-xs text-zinc-500">可改用較短的關鍵字，例如「取得稅」、「貸款」、「非居住者」或「修繕」。</p>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      {(buyFiltered.drawing.length > 0 || buyFiltered.fee.length > 0) && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關術語</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[...buyFiltered.drawing, ...buyFiltered.fee].map(term => (
                              <button
                                key={`${term.category}-${term.name}`}
                                type="button"
                                onClick={() => setSelectedFee(term)}
                                className="border border-[#DDE3DF] bg-[#F8FAF9] p-4 text-left transition-colors hover:border-[#00a174]"
                              >
                                <strong className="font-serif text-sm text-[#1A2A22]">{term.name}</strong>
                                {term.jpName && <span className="ml-2 font-sans text-[10px] text-zinc-500">{term.jpName}</span>}
                                <p className="mt-2 line-clamp-3 font-sans text-xs leading-6 text-zinc-600">{term.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {staticBuySearchItems.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">指南與流程</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {staticBuySearchItems.map((item, index) => (
                              <article key={`${item.category}-${item.title}-${index}`} className="border border-[#DDE3DF] bg-white p-4">
                                <span className="font-sans text-[10px] font-bold text-[#007d5a]">{item.category}</span>
                                <h5 className="mt-1 font-serif text-base font-bold text-[#1A2A22]">{item.title}</h5>
                                <p className="mt-2 line-clamp-5 font-sans text-xs leading-6 text-zinc-600">{item.text}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {buyFiltered.qa.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關買房問答</h4>
                          <div className="space-y-3">
                            {buyFiltered.qa.map((qa, idx) => (
                              <QACard key={idx} question={qa.question} answer={qa.answer} sources={qa.sources} table={qa.table} number={idx + 1} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* SECTION: TERMS */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "drawing" || buyCategory === "fee") && (
                <div className="space-y-6">
                  {/* Drawing terms */}
                  {buyFiltered.drawing.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                        <span>圖紙與物件術語</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.drawing.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {buyFiltered.drawing.map((term, idx) => (
                          <div 
                            key={idx} 
                            className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>圖紙／物件</span>
                              <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174]">查看說明 →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Fee terms */}
                  {buyFiltered.fee.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                        <span>交易與費用術語</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.fee.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {buyFiltered.fee.map((term, idx) => (
                          <div 
                            key={idx} 
                            className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>交易／費用</span>
                              <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174]">查看說明 →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <section className="border border-[#DDE3DF] bg-white p-5 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft md:p-6">
                  <SectionHeading
                    icon={Lightbulb}
                    title="台灣人在日本買房前，先轉換這五個觀念"
                    description="從實坪計算到出價文化——看懂 5 個關鍵差異，切換日本置產思維。"
                    open={isStepOpen("concepts")}
                    onToggle={() => toggleStep("concepts")}
                  />

                  {/* 用站內既有的卡片語彙：灰底卡片 + 白色子欄位 + 小方塊綠標題 + 左側綠條提醒，
                      與「簽約文件」「流程步驟」等區塊同一套寫法。 */}
                  {isStepOpen("concepts") && (
                  <div className="space-y-4">
                    {taiwanJapanComparisons.map((item) => (
                      <article key={item.id} className="border border-zinc-200 bg-[#F5F8F6] p-5">
                        <h4 className="mb-4 flex items-center gap-2 border-b border-zinc-300 pb-3 font-serif text-base font-bold text-[#1A2A22] md:text-lg">
                          <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">
                            {item.number.replace(/^0/, "")}
                          </span>
                          <span>{item.title}</span>
                        </h4>

                        <div className="grid grid-cols-1 gap-4 font-sans md:grid-cols-2">
                          <div className="border border-zinc-200 bg-white p-4">
                            <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#66736C]">
                              <span className="h-2 w-2 bg-[#8A9590]" />
                              <span>台灣常見理解</span>
                            </h5>
                            <p className="text-xs leading-relaxed text-zinc-700 md:text-sm">{item.taiwan}</p>
                          </div>
                          <div className="border border-zinc-200 bg-white p-4">
                            <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#00a174]">
                              <span className="h-2 w-2 bg-[#00a174]" />
                              <span>日本實務</span>
                            </h5>
                            <p className="text-xs leading-relaxed text-zinc-700 md:text-sm">{item.japan}</p>
                          </div>
                        </div>

                        <p className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 font-sans text-xs leading-relaxed text-[#3F5147] md:text-sm">
                          <strong className="mr-2 text-[#007d5a]">Linus 實務提醒</strong>
                          {item.advice}
                        </p>
                      </article>
                    ))}
                  </div>
                  )}
                </section>
              )}

              {/* SECTION: STEPS & FLOWS */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <div className="space-y-6">
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 md:p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={MapPin}
                      title="日本買房交易完整流程"
                      description="全款與貸款兩條路：掌握出價、審查到交屋的時間節奏，安心完成跨國置產。"
                      open={isStepOpen("flow")}
                      onToggle={() => toggleStep("flow")}
                      action={
                        /* Flow Type Switcher */
                        <div className="flex border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1 font-sans text-xs">
                        <button
                          onClick={() => setSelectedFlowType("cash")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-all ${
                            selectedFlowType === "cash" 
                              ? "bg-[#00a174] text-white" 
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          現金全款交易流程
                        </button>
                        <button
                          onClick={() => setSelectedFlowType("loan")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-all ${
                            selectedFlowType === "loan" 
                              ? "bg-[#00a174] text-white" 
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          銀行貸款交易流程
                        </button>
                        </div>
                      }
                    />

                    {/* Render Stepper */}
                    {isStepOpen("flow") && (
                    <div className="space-y-6">
                      {selectedFlowType === "cash" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          {buyHouseCashSteps.map((step, sIdx) => (
                            <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                              <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">{step.step}</span>
                                <span>{step.title}</span>
                              </h4>
                              <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                {step.description}
                              </p>
                              <div className="mt-4 grid gap-2 border-t border-dashed border-zinc-300 pt-3 font-sans text-[11px] leading-relaxed">
                                {step.timing && <p><strong className="text-[#007d5a]">時間｜</strong>{step.timing}</p>}
                                {step.payment && <p><strong className="text-[#007d5a]">付款｜</strong>{step.payment}</p>}
                                {step.documents && <p><strong className="text-[#007d5a]">文件｜</strong>{step.documents}</p>}
                              </div>
                              {step.warning && (
                                <p className="mt-2 text-[11px] text-[#00a174] bg-red-50 p-2 border-l-2 border-[#00a174] leading-normal font-sans">
                                  {step.warning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {buyHouseLoanSteps.map((step, sIdx) => (
                              <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                                <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                  <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">{step.step}</span>
                                  <span>{step.title}</span>
                                </h4>
                                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                  {step.description}
                                </p>
                                <div className="mt-4 grid gap-2 border-t border-dashed border-zinc-300 pt-3 font-sans text-[11px] leading-relaxed">
                                  {step.timing && <p><strong className="text-[#007d5a]">時間｜</strong>{step.timing}</p>}
                                  {step.payment && <p><strong className="text-[#007d5a]">付款｜</strong>{step.payment}</p>}
                                  {step.documents && <p><strong className="text-[#007d5a]">文件｜</strong>{step.documents}</p>}
                                </div>
                                {step.warning && (
                                  <p className="mt-2 text-[11px] text-[#00a174] bg-red-50 p-2 border-l-2 border-[#00a174] leading-normal font-sans">
                                    {step.warning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </section>

                  {/* Signing documents requirements */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 md:p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={FileText}
                      title={signingDocuments.title}
                      description="清單式整理台日身分必備文件！按身分與付款方式超前部署，過戶登記不卡關。"
                      open={isStepOpen("documents")}
                      onToggle={() => toggleStep("documents")}
                    />

                    {isStepOpen("documents") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#00a174] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#00a174]"></span>
                          <span>{signingDocuments.residenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.residenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#00a174] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#00a174]"></span>
                          <span>{signingDocuments.nonResidenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.nonResidenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    )}
                  </section>
                </div>
              )}

              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <section className="border border-[#DDE3DF] bg-white p-5 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft md:p-6">
                  <SectionHeading
                    icon={ReceiptText}
                    title="日本房產稅務與持有成本整理"
                    description="釐清評價額與市價差異：一手掌握購入規費、年度持稅與賣房資本利得稅。"
                    open={isStepOpen("tax")}
                    onToggle={() => toggleStep("tax")}
                  />

                  {isStepOpen("tax") && (
                  <>
                  {/* 與上面「五個觀念」比較表同一套卡片語彙 */}
                  <div className="space-y-4">
                    {taxLifecycle.map((item, index) => (
                      <article key={item.stage} className="border border-zinc-200 bg-[#F5F8F6] p-5">
                        <div className="mb-4 border-b border-zinc-300 pb-3">
                          <h4 className="flex items-center gap-2 font-serif text-base font-bold text-[#1A2A22] md:text-lg">
                            <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">
                              {index + 1}
                            </span>
                            <span>{item.stage}</span>
                          </h4>
                          <p className="mt-2 font-sans text-xs leading-relaxed text-zinc-600 md:text-sm">{item.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 font-sans md:grid-cols-3">
                          {item.details.map(detail => (
                            <div key={detail.title} className="border border-zinc-200 bg-white p-4">
                              <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#00a174]">
                                <span className="h-2 w-2 shrink-0 bg-[#00a174]" />
                                <span>{detail.title}</span>
                              </h5>
                              <ul className="space-y-2 text-xs leading-relaxed text-zinc-700 md:text-sm">
                                {detail.points.map(point => (
                                  <li key={point} className="flex items-start gap-2">
                                    <span className="font-bold text-[#00a174]">✓</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        <p className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 font-sans text-xs leading-relaxed text-[#3F5147] md:text-sm">
                          <strong className="mr-2 text-[#007d5a]">Linus 實務提醒</strong>
                          {item.note}
                        </p>
                      </article>
                    ))}
                  </div>

                  <p className="mt-4 font-sans text-[10px] leading-relaxed text-zinc-400">
                    制度基準：2026年7月。上方先以現行一般稅率與常見住宅特例說明；正式精算時，再以物件的固定資產稅評價證明、用途、面積、屋齡及買方稅務身分計算。
                  </p>
                  </>
                  )}
                </section>
              )}

              {/* SECTION: LOAN COMPARISON */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "loans") && (
                <div className="space-y-6">
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Landmark}
                      title="海外買方融資方案整理"
                      description="非在日居住也能貸！精選台系銀行日本分行融資條件，掌握成數、利率與門檻。"
                    />

                    <div className="space-y-5">
                      {taiwaneseBanks.map((bank, bIdx) => (
                        <div key={bIdx} className="border border-[#DDE3DF] hover:border-[#00a174] bg-white transition-all duration-300 hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`overseas-${bIdx}`)}
                            aria-expanded={expandedBanks.has(`overseas-${bIdx}`)}
                            className="w-full bg-[#F5F8F6] hover:bg-[#e6f6f1] text-[#1A2A22] px-5 py-4 flex justify-between items-center flex-wrap gap-3 text-left border-none cursor-pointer transition-colors"
                          >
                            <h4 className="font-extrabold text-base md:text-lg leading-tight font-serif text-[#1A2A22]">{bank.name}</h4>
                            <span className="flex items-center gap-3">
                              <span className="bg-[#00a174] text-white px-2.5 py-1 text-xs font-bold font-sans">利率約 {bank.interestRate}</span>
                              <span className="text-xs font-bold font-sans text-zinc-500">{expandedBanks.has(`overseas-${bIdx}`) ? "收合" : "查看條件"}</span>
                              <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${expandedBanks.has(`overseas-${bIdx}`) ? "rotate-180" : ""}`} />
                            </span>
                          </button>

                          {expandedBanks.has(`overseas-${bIdx}`) && (<>
                          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-zinc-200 font-sans">
                            <div className="p-4 bg-[#F5F8F6] border-b sm:border-b-0 sm:border-r border-zinc-200">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">申貸對象</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1A2A22]">{bank.object}</p>
                            </div>
                            <div className="p-4 border-b sm:border-b-0 sm:border-r border-zinc-200">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">起貸金額／最高成數</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#00a174]">{bank.amountLimit}</p>
                            </div>
                            <div className="p-4 bg-[#F5F8F6]">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">最長貸款期限</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1A2A22]">{bank.termLimit}</p>
                            </div>
                          </div>

                          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans text-xs">
                            <div className="border border-zinc-200">
                              <p className="bg-[#F5F8F6] px-3 py-2 font-bold text-[#1A2A22]">申請人條件</p>
                              <dl className="divide-y divide-zinc-100">
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">年齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.ageLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">收入／資產</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.incomeAsset}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">對保／開戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.signingReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">還款／租金帳戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.rentAccount}</dd></div>
                              </dl>
                            </div>
                            <div className="border border-zinc-200">
                              <p className="bg-[#F5F8F6] px-3 py-2 font-bold text-[#1A2A22]">物件與貸款條件</p>
                              <dl className="divide-y divide-zinc-100">
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">物件／屋齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.propertyReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">承作區域</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.areaLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">還款方式</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.repayment}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">提前清償費</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.prepayFee}</dd></div>
                              </dl>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 border-t border-amber-100 font-sans text-xs space-y-1.5">
                            <span className="font-bold text-amber-900 block">實務提醒</span>
                            {bank.others.map((other, oIdx) => (
                              <div key={oIdx} className="flex items-start gap-1.5 text-amber-950 leading-relaxed text-justify">
                                <span className="text-amber-700 font-bold">•</span>
                                <span>{other}</span>
                              </div>
                            ))}
                          </div>
                          </>)}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Japanese Banks */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Percent}
                      title="在日工作者融資方案整理"
                      description="在日本就業的安心購屋指南：評估正社員年收門檻、在留資格與低利率住宅貸款。"
                    />

                    <div className="grid grid-cols-1 items-start gap-5 font-sans md:grid-cols-2 xl:grid-cols-3">
                      {japaneseBanks.map((bank, idx) => (
                        <article key={idx} className="w-full border border-[#DDE3DF] bg-[#F5F8F6] transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`japan-${idx}`)}
                            aria-expanded={expandedBanks.has(`japan-${idx}`)}
                            className="grid min-h-[132px] w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-left border-none cursor-pointer bg-transparent"
                          >
                            <span className="min-w-0 self-center">
                              <h4 className="line-clamp-2 min-h-10 font-bold text-sm leading-5 text-[#1A2A22]">{bank.name}</h4>
                              <div className="mt-2 line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#00a174]">{bank.rate}</div>
                            </span>
                            <span className="flex shrink-0 flex-col items-center gap-1.5 text-[10px] font-bold text-[#3F5147]">
                              <span>{expandedBanks.has(`japan-${idx}`) ? "收合" : "詳情"}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedBanks.has(`japan-${idx}`) ? "rotate-180" : ""}`} />
                            </span>
                          </button>

                          {expandedBanks.has(`japan-${idx}`) && (
                          <div className="border-t border-zinc-300 p-5 pt-4 md:min-h-[420px] xl:min-h-[470px]">
                            <div className="space-y-2 text-xs text-zinc-600">
                              <p><strong>在留簽證：</strong>{bank.visaReq}</p>
                              <p><strong>工作年資：</strong>{bank.workYears}</p>
                              <p><strong>年收入門檻：</strong>{bank.incomeReq}</p>
                              <p><strong>放貸成數：</strong>{bank.downPayment}</p>
                              <p><strong>放貸額度：</strong>{bank.amountLimit}</p>
                              <p><strong>年齡限制：</strong>{bank.ageLimit}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-[11px] text-zinc-500 leading-relaxed text-justify space-y-2">
                            {bank.note.split('\n').filter(line => line.trim()).map((line, lIdx) => {
                              const cleanedLine = line.replace(/^[•·\-\s\*\u2022\u00b7]+/, '').trim();
                              return (
                                <div key={lIdx} className="flex items-start gap-2">
                                  <span className="text-[#00a174] text-[7px] mt-[4.5px] shrink-0 select-none">●</span>
                                  <span className="flex-1">{cleanedLine}</span>
                                </div>
                              );
                            })}
                            </div>
                          </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* SECTION: MINPAKU & RYOKAN */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "minpaku") && (
                <div className="space-y-6">
                  {/* Minpaku District Rules */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Map}
                      title="東京都 23 區住宅宿泊事業條例整理"
                      description="180 天營業上限與區域天條！看懂東京都 23 區民泊新法規範，避開限制地雷區。"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 font-sans text-xs">
                      <div className="p-4 bg-[#F5F8F6] border-b sm:border-b-0 sm:border-r border-zinc-200">
                        <p className="text-zinc-500">全國共同上限</p>
                        <p className="mt-1 text-lg font-bold text-[#00a174]">180 天／年</p>
                      </div>
                      <div className="p-4 border-b sm:border-b-0 sm:border-r border-zinc-200">
                        <p className="text-zinc-500">本表怎麼看</p>
                        <p className="mt-1 font-medium text-zinc-800 leading-relaxed">先看「營業限制」，再確認受限區域與管理／周知要求。</p>
                      </div>
                      <div className="p-4 bg-amber-50">
                        <p className="text-amber-700">重要提醒</p>
                        <p className="mt-1 font-medium text-amber-900 leading-relaxed">家主居住型與不在型，適用規則可能不同。</p>
                      </div>
                    </div>

                    <div className="columns-1 gap-4 font-sans xl:columns-2">
                      {[...minpakuRules].sort((a, b) => minpakuWardOrder.indexOf(a.district) - minpakuWardOrder.indexOf(b.district)).map((item) => (
                        <article key={item.district} className="mb-4 inline-block w-full break-inside-avoid border border-[#DDE3DF] bg-white align-top overflow-hidden transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft">
                          <button
                            type="button"
                            onClick={() => toggleMinpakuWard(item.district)}
                            aria-expanded={expandedMinpakuWards.has(item.district)}
                            className="grid min-h-[58px] w-full grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-3 bg-[#F5F8F6] hover:bg-[#e6f6f1] px-4 py-2.5 text-left border-none cursor-pointer transition-colors"
                          >
                            <h4 className="text-base font-bold text-[#1A2A22]">{item.district}</h4>
                            <span className="min-w-0 justify-self-end whitespace-nowrap bg-[#DDF3EA] px-2.5 py-1 text-[11px] font-bold leading-4 text-[#087154]">
                              {getMinpakuLimitLabel(item.daysLimit)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                              <span>{expandedMinpakuWards.has(item.district) ? "收合" : "詳情"}</span>
                              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-zinc-500 ${expandedMinpakuWards.has(item.district) ? "rotate-180" : ""}`} />
                            </span>
                          </button>
                          {expandedMinpakuWards.has(item.district) && (
                          <dl className="divide-y divide-zinc-200 border-t border-[#DDE3DF] text-xs leading-relaxed">
                            <div className="grid grid-cols-[76px_1fr] gap-3 bg-[#F2F8F5] px-4 py-3">
                              <dt className="font-bold text-[#087154]">營業天數</dt>
                              <dd className="font-medium text-zinc-700">{item.daysLimit}</dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3">
                              <dt className="font-bold text-[#00a174]">營業限制</dt>
                              <dd className="text-zinc-700">{item.rules}</dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3 bg-[#F9FBFA]">
                              <dt className="font-bold text-zinc-600">受限區域</dt>
                              <dd className="min-w-0 text-zinc-600">
                                <span className="inline-flex bg-[#E9F3EE] px-2 py-1 font-bold leading-none text-[#315E50]">
                                  {getMinpakuAreaLabel(item.areaLimit)}
                                </span>
                                <p className="mt-2 leading-relaxed">{item.areaLimit}</p>
                              </dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3">
                              <dt className="font-bold text-zinc-600">管理／周知</dt>
                              <dd className="text-zinc-600">{item.managerReq}</dd>
                            </div>
                          </dl>
                          )}
                        </article>
                      ))}
                    </div>

                    <div className="bg-amber-50 p-4 border-l-4 border-amber-500 text-xs text-amber-950 leading-relaxed font-sans">
                      <strong>投資前必查：</strong>最新區條例、用途地域、建築與消防條件、管理規約及管理體制。上方內容是快速篩選用摘要，不能取代自治體就個別物件作出的確認。
                    </div>
                  </section>

                  {/* Ryokan requirements */}
                  <section className="border border-[#DDE3DF] bg-white p-5 md:p-6 space-y-3 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft">
                    <button
                      type="button"
                      onClick={() => setRyokanExpanded(current => !current)}
                      aria-expanded={ryokanExpanded}
                      className={`flex w-full items-start justify-between gap-4 text-left ${ryokanExpanded ? "border-b border-zinc-200 pb-3" : ""}`}
                    >
                      <span className="flex items-start gap-2">
                        <Building className="mt-0.5 h-5 w-5 shrink-0 text-[#00a174]" />
                        <span>
                          <span className="block text-xl font-bold text-[#1A2A22]">{ryokanRules.title}</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-zinc-500 font-sans">全年經營所需的用途、建築、消防與許可確認重點</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#00a174] font-sans">
                        {ryokanExpanded ? "收合" : "展開查看"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${ryokanExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </button>

                    {ryokanExpanded && (<>
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      如果您希望合法全年經營、且不受住宅宿泊事業 180 天上限限制，可評估向保健所申請「簡易宿所」等旅館業營業許可；但須先完成用途、建築、消防與所在地自治體的個案確認：
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
                      {/* Left side Steps */}
                      <div className="md:col-span-7 space-y-4">
                        <span className="font-bold text-sm text-[#1A2A22] block">◎ 旅館業許可申請 5 個核心階段：</span>
                        <div className="space-y-3 text-xs">
                          {ryokanRules.steps.map((step, sIdx) => (
                            <div key={sIdx} className="bg-[#F5F8F6] p-3 border border-zinc-200 flex gap-3">
                              <span className="font-bold text-[#00a174] shrink-0 text-sm font-sans">0{sIdx+1}</span>
                              <div className="space-y-0.5">
                                <strong className="text-zinc-800 text-[13px]">{step.name}</strong>
                                <div className="text-zinc-500 leading-relaxed text-justify">{renderFormattedText(step.desc)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side requirements */}
                      <div className="md:col-span-5 space-y-4">
                        <span className="font-bold text-sm text-[#1A2A22] block">◎ 簡易宿所硬體與消防規範：</span>
                        <div className="bg-[#F5F8F6] p-5 border border-zinc-200 space-y-4 text-xs">
                          {ryokanRules.requirements.map((req, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-2 text-zinc-700 leading-relaxed text-justify">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {ryokanRules.warnings.map((warn, wIdx) => (
                        <div key={wIdx} className="bg-yellow-50 border-l-4 border-yellow-600 p-3 text-xs text-yellow-800 font-sans leading-relaxed text-justify">
                          {warn}
                        </div>
                      ))}
                    </div>
                    </>)}
                  </section>
                </div>
              )}

              {/* SECTION: QA */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "qa") && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>常見日本買房與投資問題 Q&A</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.qa.length} 問</span>
                  </h3>
                  
                  {buyFiltered.qa.length === 0 ? (
                    <div className="border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500 text-xs font-sans">
                      找不到符合「{buySearchQuery}」的 Q&A 內容。請更換關鍵字重新搜尋。
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {buyFiltered.qa.map((qa, idx) => <QACard key={idx} question={qa.question} answer={qa.answer} sources={qa.sources} table={qa.table} number={idx + 1} />)}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
  );
}
