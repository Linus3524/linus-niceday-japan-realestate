export interface BuyHouseTermItem {
  name: string;
  jpName?: string;
  description: string;
  category: "drawing" | "fee";
  warning?: string;
}

export interface BuyHouseFlowStep {
  step: string;
  title: string;
  description: string;
  points?: string[];
  warning?: string;
}

export interface TaiwaneseBankItem {
  name: string;
  object: string;
  ageLimit: string;
  incomeAsset: string;
  signingReq: string;
  rentAccount: string;
  propertyReq: string;
  areaLimit: string;
  amountLimit: string;
  termLimit: string;
  interestRate: string;
  repayment: string;
  prepayFee: string;
  others: string[];
  verification?: "official" | "user-provided" | "pending";
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface JapaneseBankItem {
  name: string;
  rate: string;
  visaReq: string;
  workYears: string;
  incomeReq: string;
  amountLimit: string;
  downPayment: string;
  ageLimit: string;
  note: string;
  verification?: "official" | "user-provided" | "pending";
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface MinpakuRuleItem {
  district: string;
  rules: string;
  daysLimit: string;
  areaLimit: string;
  managerReq: string;
  verification?: "official" | "user-provided" | "pending";
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface BuyHouseQAItem {
  question: string;
  answer: string;
  points?: string[];
}

export const buyKnowledgeMeta = {
  reviewedAt: "2026-07-14",
  scope: "日本住宅買賣、融資與住宿營業的一般資訊",
  notice: "銀行條件、稅額與自治體規則會變動，且依申請人與物件個別審查。簽約或投資前應向金融機構、自治體、司法書士、稅理士、建築士及消防單位確認最新書面條件。",
  officialSources: [
    { label: "國土交通省｜不動產資訊資料庫", url: "https://www.reinfolib.mlit.go.jp/" },
    { label: "民泊制度入口網站", url: "https://www.mlit.go.jp/kankocho/minpaku/" },
    { label: "法務省｜不動產登記", url: "https://www.moj.go.jp/MINJI/minji02.html" }
  ]
};

export const verificationLabels = {
  official: "官方來源已核驗",
  "user-provided": "使用者提供，待交叉核驗",
  pending: "待提供官方或書面來源"
} as const;

export const buyHouseDrawingTerms: BuyHouseTermItem[] = [
  {
    name: "マンション",
    jpName: "集合住宅、大樓住宅",
    description: "不動產廣告中通常指較堅固結構的集合住宅，常見 RC、SRC 或鋼骨造，但「マンション」並非代表高級、一定耐震或必然附有電梯與管理員。結構、設備與管理品質仍須逐案確認。",
    category: "drawing"
  },
  {
    name: "アパート",
    jpName: "公寓（木造、輕鋼構公寓）",
    description: "不動產廣告中常指木造或輕鋼骨造的低層集合住宅，但名稱本身不是法律上的結構或性能保證。隔音、耐震、樓層與設備應以建築資料及現場狀況確認。",
    category: "drawing"
  },
  {
    name: "一戸建て",
    jpName: "透天厝、獨棟住宅",
    description: "指獨棟住宅，常見木造，但不代表一定同時擁有土地所有權；仍可能是借地權、土地與建物權利人不同或有共有持分。",
    category: "drawing"
  },
  {
    name: "権利",
    jpName: "權利種類、產權類型",
    description: "指土地的持有權利，通常分為「所有權（所有権）」和「借地權（借地権）」。所有權即擁有土地與建物所有權，而借地權則僅擁有地上建物的權利，土地是租賃而非自有。在台灣多數為所有權，因此需特別留意。",
    category: "drawing"
  },
  {
    name: "敷地面積",
    jpName: "基地面積、土地面積",
    description: "指該房屋或建物所佔用的土地總面積。",
    category: "drawing"
  },
  {
    name: "共有持分",
    jpName: "土地持分",
    description: "在マンション等集合住宅中，指各戶在整塊基地土地上所擁有的比例，類似台灣的土地持分。",
    category: "drawing"
  },
  {
    name: "用途地域",
    jpName: "土地使用分區",
    description: "根據都市計畫法，將土地劃分為不同用途的區域，例如住宅區、商業區、工業區等，規範了建築物的種類、高度、容積率等限制，類似台灣的土地使用分區管制。",
    category: "drawing"
  },
  {
    name: "専有面積",
    jpName: "室內專有面積（不含陽台）",
    description: "指區分所有建物中個別住戶可專有使用的面積，通常不含陽台與共用部分。廣告常採壁芯面積，登記可能採內法面積，兩者數值不同，貸款與稅務判斷時須確認採用基準。",
    category: "drawing"
  },
  {
    name: "バルコニー面積",
    jpName: "陽台面積",
    description: "指房屋陽台的面積。在日本，陽台面積通常不計入専有面積。",
    category: "drawing"
  },
  {
    name: "専用庭面積",
    jpName: "專屬庭院面積",
    description: "指集合住宅一樓住戶等，可專屬使用的庭院面積。",
    category: "drawing"
  },
  {
    name: "共用部",
    jpName: "公設部分、公共設施",
    description: "指マンション等集合住宅中，所有住戶共同使用的部分，例如大廳、走廊、電梯、樓梯、垃圾場等。",
    category: "drawing"
  },
  {
    name: "間取り",
    jpName: "房型格局",
    description: "表示房屋的格局配置，例如「1LDK」代表一房、一個客廳、一個餐廳、一個廚房；「2SLDK」則代表兩房、一個儲藏室（Service Room）、一個客廳、一個餐廳、一個廚房。S通常指無窗的儲藏室。",
    category: "drawing"
  },
  {
    name: "構造・階数",
    jpName: "建築結構與樓層數",
    description: "建築物的結構類型（如RC鋼筋混凝土、SRC鋼骨鋼筋混凝土、S鋼骨、木造等）以及總樓層數。",
    category: "drawing"
  },
  {
    name: "総戸数",
    jpName: "總戶數",
    description: "指該マンション或アパート的總戶數。",
    category: "drawing"
  },
  {
    name: "建築年月",
    jpName: "建築年份",
    description: "指建築物完成的年份與月份。",
    category: "drawing"
  },
  {
    name: "分譲会社",
    jpName: "建商、建設公司",
    description: "指負責規劃、銷售與興建該集合住宅的開發商。",
    category: "drawing"
  },
  {
    name: "施工会社",
    jpName: "營造公司",
    description: "指實際負責興建工程的營造廠商。",
    category: "drawing"
  },
  {
    name: "設計会社",
    jpName: "建築設計公司",
    description: "指負責建築設計的單位或公司。",
    category: "drawing"
  },
  {
    name: "建物管理会社",
    jpName: "物業管理公司",
    description: "負責該建築物日常營運、維護和管理的專業公司。",
    category: "drawing"
  },
  {
    name: "管理形態",
    jpName: "物業管理方式",
    description: "通常指由管理公司負責的範圍，例如全部委託（全部委託管理）、部分委託等。",
    category: "drawing"
  },
  {
    name: "管理員の勤務形態",
    jpName: "管理員勤務方式",
    description: "管理員的上班模式，常見的有：常駐（全天候）、日勤（白天固定時段）、巡回（定期巡視多個物業）、無人管理（無人管理，僅保全系統）。",
    category: "drawing"
  },
  {
    name: "管理費",
    jpName: "管理費",
    description: "每月向住戶收取的費用，用於維護公共設施、支付管理員薪資等日常營運開銷。",
    category: "drawing"
  },
  {
    name: "修繕積立金",
    jpName: "修繕基金、公共基金",
    description: "每月向住戶收取的費用，專門用於未來建築物的大型修繕工程，例如外牆翻新、屋頂修繕、電梯更新等，類似台灣的「公共基金」。",
    category: "drawing"
  },
  {
    name: "固定資産税",
    jpName: "固定資產稅",
    description: "地方政府依土地與建物的固定資產稅評價額，向每年課稅基準日的所有權人課徵。可概略類比台灣持有不動產的年度稅負，但課稅標準與減免制度不同。",
    category: "drawing"
  },
  {
    name: "都市計画税",
    jpName: "都市計畫稅",
    description: "針對都市計畫區域內的土地與房屋課徵的稅金，用於都市建設，會與固定資產稅一併徵收。",
    category: "drawing"
  },
  {
    name: "敷地内駐車場",
    jpName: "基地內停車場、社區內停車位",
    description: "位於該不動產基地範圍內的停車空間。",
    category: "drawing"
  },
  {
    name: "トランクルーム",
    jpName: "置物空間、儲藏室",
    description: "部分集合住宅提供的，供住戶額外儲存物品的獨立空間。",
    category: "drawing"
  },
  {
    name: "ガス",
    jpName: "瓦斯供應方式",
    description: "主要分為都市瓦斯（天然氣，管線供應）和 LPG 桶裝瓦斯（液化石油氣，需更換瓦斯桶）。",
    category: "drawing"
  },
  {
    name: "エレベーター",
    jpName: "電梯",
    description: "說明建築物是否有電梯設施。",
    category: "drawing"
  },
  {
    name: "現状",
    jpName: "現況",
    description: "指房屋目前的狀態，例如「空室（空屋）」、「賃貸中（出租中）」、「居住中（所有者自住中）」等。",
    category: "drawing"
  },
  {
    name: "引渡",
    jpName: "交屋時間、點交",
    description: "指買賣雙方完成所有手續後，房屋產權和實體正式移交的日期。",
    category: "drawing"
  },
  {
    name: "リフォーム・リノベーション",
    jpName: "翻修、重新裝潢",
    description: "Reform 通常指局部的修繕或更新（如更換壁紙、衛浴設備）；Renovation 指大規模的改造，涉及格局變更、管線重拉等，使其機能提升（老屋翻新）。",
    category: "drawing"
  },
  {
    name: "ペット相談",
    jpName: "可飼養寵物",
    description: "代表您可以與屋主或管理處商量飼養寵物事宜。在日本，許多集合住宅（公寓）為了環境安寧與衛生，在管理規約中是嚴格禁止飼養寵物的。若有此標示，則代表可在規定範圍內（如限制大小、隻數）飼養寵物。",
    category: "drawing"
  }
];

export const buyHouseFeeTerms: BuyHouseTermItem[] = [
  {
    name: "仲介手数料",
    jpName: "仲介服務費",
    description: "支付給不動產仲介公司的報酬。常見的「成交價 3%＋6 萬日圓再加消費稅」是成交價超過 400 萬日圓時的速算方式；低價物件及特殊情況適用不同上限。付款時間依媒介契約與公司規定。",
    category: "fee"
  },
  {
    name: "登録免許税",
    jpName: "登記規費、註冊許可稅",
    description: "在法務局進行土地和建物所有權轉移登記、或抵押權設定登記時，向國家繳納的稅金。稅率依物件類型及是否符合減免政策而定。",
    category: "fee"
  },
  {
    name: "司法書士報酬",
    jpName: "司法書士代書費",
    description: "支付給承辦過戶與抵押權設定登記之司法書士（地政士）的專業服務報酬。通常約為 8 萬至 15 萬日圓不等。",
    category: "fee"
  },
  {
    name: "不動産取得税",
    jpName: "不動產取得稅（契稅）",
    description: "購屋取得不動產產權後，由地方政府一次性課徵的稅金。一般在交屋後數個月至半年內會收到繳稅單，類似台灣的契稅。",
    category: "fee"
  },
  {
    name: "重要事項説明書",
    jpName: "重要事項說明書",
    description: "不動產仲介在簽訂買賣契約前，必須向買主詳細解釋關於該不動產的重要資訊，例如土地使用分區、法規限制、物件現況、管理規定等。這是為了保障買主權益，避免資訊不對等。",
    category: "fee"
  },
  {
    name: "火災保険料",
    jpName: "火災保險費",
    description: "房屋的火災保險及地震保險費。在日本，購屋並申請房貸時，金融機構通常會強制要求投保火災保險以保障抵押物安全。",
    category: "fee"
  },
  {
    name: "融資事務手数料",
    jpName: "貸款手續費、銀行作業費",
    description: "向金融機構申請房貸時，銀行收取的行政處理手續費。有些銀行採固定收費（如 3 萬至 5 萬日圓），有些則按貸款金額的 2.2%（含稅）收取。",
    category: "fee"
  },
  {
    name: "ローン保証料",
    jpName: "貸款保證費",
    description: "申請房貸時，支付給「保證公司」的費用。若貸款人未來無法償還貸款，保證公司會代為償還給銀行。通常是一次性支付或分期計入每月還款中。純海外台商在台系銀行辦理房貸時，通常不需此項，而是要求台灣保證人。",
    category: "fee"
  },
  {
    name: "物件調査費用",
    jpName: "物件調查費用、鑑界費",
    description: "在買賣或過戶前，針對土地邊界、建物結構耐震等進行的實地調查費用。某些公股台系銀行會強制要求買方支付外部估價公司的鑑定費（約 20 萬日圓）。",
    category: "fee"
  },
  {
    name: "仮審査",
    jpName: "貸款事前審查、初審",
    description: "正式申請房貸前的初步、簡易審查。金融機構會根據申請人提供的基本資料（年齡、年收入、工作單位等）快速審核，以判斷借款人的基本還款能力與信用度。",
    category: "fee"
  },
  {
    name: "本審査",
    jpName: "貸款正式審查、本審",
    description: "事前審查（假審）通過且買賣雙方簽署正式「不動產買賣契約書」後進行的最終、詳細審查。此階段，金融機構會對實際交易物件進行實地鑑價，並對借款人資格進行最嚴格、全面的審查。",
    category: "fee"
  }
];

export const buyHouseCashSteps: BuyHouseFlowStep[] = [
  {
    step: "➊",
    title: "釐清買房目的",
    description: "確定購買日本不動產的目標：自住需求（若持有日本長期簽證，購房自住能有效節省租金）或投資需求（無長期簽證，看好日本市場，傾向投資出租房產獲取租金回報）。"
  },
  {
    step: "➋",
    title: "尋找專業仲介與篩選物件",
    description: "聯繫在日不動產仲介，根據預算、區域、交通等條件協助尋屋，並隨時與仲介討論溝通，讓資產效益最大化。"
  },
  {
    step: "➌",
    title: "赴日或線上看房",
    description: "可親自來日本由仲介帶領實地看房。若無法赴日，空置物件可使用視訊即時導覽、房屋錄影與 Google Maps 評估；帶租約物件因保護房客隱私，通常不允許內部看房，只能評估外觀與周邊環境。"
  },
  {
    step: "➍",
    title: "遞交買付申請書（購屋意向書）",
    description: "選定物件後，透過仲介遞交「買付申請書」。列出期望價格、付款方式、希望簽約與交屋日期。賣主會審核並決定是否接受講價，在多人競爭時，現金全款買主往往會被優先考慮。"
  },
  {
    step: "➎",
    title: "準備登記與簽約（重要事項說明）",
    description: "如果在簽約前就將在留卡地址遷入新居，可以直接以新地址辦理產權登記，免去日後變更登記地址的手續。簽約時，由領有國家證照的不動產交易專員（宅地建物取引士）向您進行「重要事項說明」，確認產權無誤後，正式簽署「不動產買賣契約書」，並支付 5%〜10% 的手付金（訂金）。"
  },
  {
    step: "➏",
    title: "匯入尾款（殘代金）與交易規費",
    description: "在交屋日（決算日）前，買方需依照精算書金額，將剩餘的購屋尾款（殘代金）、登記許可稅等稅費、代書費以及仲介服務費尾款匯入指定帳戶，確保資金全數到位。"
  },
  {
    step: "➐",
    title: "產權移轉登記與交屋點交（引渡し）",
    description: "過戶當天，買雙方、仲介與司法書士（地政士）會合。司法書士現場確認所有權狀等產權移轉文件完整、且尾款已全額入帳後，會即時向法務局送件辦理所有權移轉登記。隨後賣方點交房屋並交付實體鑰匙，交易正式完成。"
  }
];

export const buyHouseLoanSteps: BuyHouseFlowStep[] = [
  {
    step: "➊",
    title: "初步諮詢與貸款「假審查」（事前審査）",
    description: "在挑選物件前或看到中意物件時，先向銀行提出基本資料（年收、公司背景、在留資格等）進行假審查。假審查通常在 3-7 個工作天內核准，可以提早確認您的借貸額度與利率區間，保障交易安全。",
    points: [
      "準備文件：個人所得證明（源泉徵收票）、在留卡、護照、年收證明等。",
      "假審核通過代表銀行初步認可借款人的還款能力與資質。"
    ]
  },
  {
    step: "➋",
    title: "遞交買付與簽訂買賣契約",
    description: "假審查通過後，透過仲介向賣方提出買付申請書。條件談成後，雙方簽署「不動產買賣契約書」，並由宅建士進行「重要事項說明」。此時需支付 5%〜10% 訂金。",
    warning: "⚠️ 重要：合約中必須載明「融資特約（貸款特約）」，約定若最終銀行貸款本審查未通過，買方可以無條件解約並退還全額手付金，避免訂金被沒收的風險！"
  },
  {
    step: "➌",
    title: "正式申請貸款「本審查」（本審査）",
    description: "簽約完成後，正式向銀行提交本審查申請。本審查比假審更為嚴格，銀行會對買方個人信用、以及交易物件的實際「擔保評價（鑑定估價）」進行全面性的實質審查，通常需時 2 至 3 週。",
    points: [
      "準備文件：正式買賣契約書、重要事項說明書、謄本、土地公圖及大樓管理規約等。"
    ]
  },
  {
    step: "➍",
    title: "簽訂貸款契約（金消契約）",
    description: "貸款本審查順利核准後，借款人需與撥款銀行簽署正式的「金錢消費貸借契約（簡稱金消契約）」，這是一份具有法律效益的借貸合約，詳細約定放款金額、還款利率、期限與撥款日期（決算日）。"
  },
  {
    step: "➎",
    title: "銀行撥款、支付尾款與辦理過戶",
    description: "撥款當天，買賣雙方、仲介、銀行專員及司法書士會在貸款銀行會合。銀行將貸款資金撥入買方帳戶，買方隨即將購屋尾款（殘代金）、仲介費、司法書士代書費、登記稅費等轉帳給賣方與相關單位。司法書士現場確認無誤後，會即時送件辦理塗銷賣方原抵押權及移轉所有權登記。",
    points: [
      "資金通常在 1-2 小時內完成清算與入帳確認。"
    ]
  },
  {
    step: "➏",
    title: "交屋點交與領取鑰匙",
    description: "過戶手續完成且資金入帳確認後，賣方現場移交實體鑰匙、大樓設備說明書。約 2-3 週後，買方會收到由法務局核發的「登記識別情報（產權所有權狀）」，正式完成日本購屋置產！"
  }
];

export const signingDocuments = {
  title: "日本購屋過戶必備證明文件要求",
  residenceGroup: {
    title: "在日居民（持有在留卡 / 具中長期簽證者）",
    items: [
      "住民票（需全體家族記載，且發行於 3 個月內。含個人編號 My Number 的通常不需提供）",
      "在留卡正本（需確認在留資格種類與有效期限）及護照正本",
      "印鑑證明書（向地方區役所登記之正式實印證明，發行於 3 個月內）",
      "印章（向區役所登記之「實印」，用於重要買賣合約與所有權轉移登記）",
      "課稅證明書 / 源泉徵收票（若辦理貸款，需提供最近 1-3 年的所得、繳稅及扣繳憑單紀錄）"
    ]
  },
  nonResidenceGroup: {
    title: "非在日居民（純海外投資人 / 台灣買方）",
    items: [
      "宣誓書 Affidavit（等同於日本住民票與印鑑證明。需詳細記載姓名、台灣戶籍住址、身分證字號，並在台灣的地方法院公證處或民間公證人辦理公證手續，簽約與過戶需各提供一份）",
      "台灣護照正本及影本（司法書士當面核對身份專用）",
      "印章（過戶與簽約蓋印使用，雖然已有宣誓書，實務上仍會準備一枚便章備用）",
      "台灣身分證正本（公證或授權書辦理時必備備查）",
      "在職證明、扣繳憑單與綜合所得稅扣繳稅額證明（若需向在日台系銀行申請房貸，必須提供近 2-3 年之完整財力、納稅證明文件）"
    ]
  }
};

export const taiwaneseBanks: TaiwaneseBankItem[] = [
  {
    name: "中國信託銀行 (CTBC Bank / 東京之星)",
    object: "個人：具中華民國國籍，且在台灣有穩定工作與資產者。法人：於日本設立法人持有者。",
    ageLimit: "借款人年紀 + 貸款年限不超過 75 歲。",
    incomeAsset: "年收入要求：須達 1,000 萬日圓以上（約合新台幣 215 萬元以上）；或在台淨資產達 3,000 萬日圓以上（約新台幣 640 萬元以上）。",
    signingReq: "中信在台灣設有「海外對保服務」，借款人可在中信台灣指定分行直接對保簽約，無須親飛東京。",
    rentAccount: "帳戶為東京之星銀行（旗下），可提供全中文客服諮詢，有提款卡與簡易網銀，適合後續收租與出入金。",
    propertyReq: "新耐震基準（1981年6月後建）。不承作木造一戶建或築齡過老公寓，對物件擔保價值評估較嚴。",
    areaLimit: "以首都圈（東京、神奈川、千葉、埼玉）及大阪市區為主。",
    amountLimit: "最低申貸金額：3,000 萬日圓起。融資成數最高可達買賣價或鑑定價孰低之 6~7 成。",
    termLimit: "最長 25 年（台系銀行中最長）。",
    interestRate: "變動利率，目前約 2.0% ~ 2.4% 左右（視個人信用資質加碼）。",
    repayment: "本息均攤清償。",
    prepayFee: "提前還款手續費：3 年內提早清償會有 1%~2% 的違約金。",
    others: [
      "優點是還款期限最長可達 25 年，對純海外投資人最友善；且與東京之星整合，享有全中文客服、提款卡與網銀服務。",
      "缺點是財務門檻較高（年收 1,000 萬日圓或淨資產 3,000 萬日圓），且對太老舊或木造物件非常挑剔。"
    ]
  },
  {
    name: "第一商業銀行 (First Bank)",
    object: "具中華民國國籍，或具有台灣居留權。在日本設有分行，可提供海外對保與審查。",
    ageLimit: "借款終止時年齡不得超過 65 歲（較一般規定的 75 歲嚴格）。",
    incomeAsset: "年收入要求：須達 1,500 萬日圓以上。淨資產要求：須達 4,500 萬日圓以上（約新台幣 950 萬至 1,000 萬元）。",
    signingReq: "借款人需親自前往東京分行簽約與對保。",
    rentAccount: "無簽證海外人士屬於還款專用帳戶，出入金多屬於國外匯款，無網路銀行。",
    propertyReq: "新耐震基準（1984年後）。木造建物限築齡 35 年內（對木造屋齡容忍度最長）。",
    areaLimit: "關東首都圈、大阪、福岡。",
    amountLimit: "最低貸款金額門檻最低：2,000 萬日圓起。融資成數約為買賣價或鑑定價孰低之 6~7 成。",
    termLimit: "最長 20 年。",
    interestRate: "變動利率，目前約 2.7% 起，處於中高水平。",
    repayment: "本息均攤清償。",
    prepayFee: "需視個別合約規定，通常 3 年內提前還款會有手續費。",
    others: [
      "優點是申貸金額門檻極低（2,000萬日圓即可承作），且木造屋齡最長可接受 35 年，貸款區域廣。",
      "缺點是財力審核嚴格（年收 1500 萬、資產 4500 萬日圓門檻較高），且利率 2.7% 起屬於中高水平。"
    ]
  },
  {
    name: "玉山銀行 (E.Sun Bank)",
    object: "個人：具中華民國國籍。法人：於日本合法設立註冊法人。",
    ageLimit: "借款人與保證人年紀 + 貸款年限在 80 歲以內（年齡限制較有彈性）。",
    incomeAsset: "不設死板的固定資產數字，但極度注重借款人與保證人在台灣的總資產證明與聯徵紀錄，並要求高自備款比例。",
    signingReq: "核准後需親臨東京分行對保開戶。",
    rentAccount: "若是出租物件，租金需匯入本行指定帳戶。若是自用或未出租，帳上需存放 6 個月本息金額。",
    propertyReq: "物件售價必須在 1 億日圓以上。限鋼筋混凝土（RC）、鋼骨（S）結構，木造僅限築齡 5 年內極新物件。",
    areaLimit: "首都圈涵蓋完整（東京、神奈川、千葉、埼玉）。",
    amountLimit: "最低申貸金額門檻高：6,000 萬日圓起。融資成數最高約 7 成。",
    termLimit: "最長 20 年。",
    interestRate: "採 1 個月 Tibor 個案加碼變動計息，利率每月重新議價，不確定性較高。",
    repayment: "本息均攤清償。",
    prepayFee: "1 年內提前還款有 1% 的違約金。",
    others: [
      "優點是年齡上限高（借款人年齡+貸款年限可達80歲），首都圈涵蓋廣。",
      "缺點是「物件門檻極高」，物件價格必須在 1 億日圓以上，且申貸金額至少 6,000 萬日圓，利率每月重新議價變動大。"
    ]
  },
  {
    name: "台新商業銀行 (Taishin Bank)",
    object: "具中華民國國籍，或具有台灣居留權。支援海外對保。",
    ageLimit: "需配合還款期限與借款人年紀綜合評估。",
    incomeAsset: "不設死板的固定資產數字，採個案審查，需提供完整的扣繳憑單與財力明細。",
    signingReq: "正式核准後，借款人須親臨東京分行簽約開戶。",
    rentAccount: "無簽證海外人士屬於還款專用帳戶，出入金均為國外匯款，不提供網銀。",
    propertyReq: "屋齡限制非常嚴格，限築齡 20 年內的新耐震 RC 結構公寓。",
    areaLimit: "東京 23 區、大阪、福岡市部。",
    amountLimit: "最低貸款金額門檻最高：需貸款 1.5 億日圓以上（換算房價約需 2 億日圓以上）。",
    termLimit: "最長 20 年。",
    interestRate: "變動利率，目前約 2.3% ~ 2.6% 起。",
    repayment: "本息均攤清償。",
    prepayFee: "提前還款手續費依合約個別約定。",
    others: [
      "優點是利率在台系銀行中相對有競爭力（2.3%起），且可承作大阪和福岡市中心的高價物件。",
      "缺點是「貸款門檻高達 1.5 億日圓」，幾乎只承作高淨值的豪宅、整棟公寓或高資產法人，且屋齡限制嚴格在 20 年內。"
    ]
  },
  {
    name: "兆豐商業銀行",
    object: "個人：具中華民國或日本國籍，或具台灣居留權／日本永住權者。法人：於日本合法設立註冊法人。",
    ageLimit: "未列固定年齡上限，通常與還款期限一併評估。",
    incomeAsset: "未列統一固定門檻；須提供完整財力、所得與信用資料，由銀行評估自備款及還款能力。",
    signingReq: "正式核准後，借款人須親自前往東京分行簽約。",
    rentAccount: "無日本在留資格者為還款帳戶，出入金以海外匯款為主，且不提供網路銀行。",
    propertyReq: "建物限 1982 年後完工；投資物件的建物謄本面積須達 50㎡以上。",
    areaLimit: "東京都、橫濱市、川崎市等首都圈主要都會區的住宅、店面或辦公室為主。",
    amountLimit: "自用住宅以外，最低申貸金額 5,000 萬日圓；融資成數為買賣價與鑑估價孰低的 7 成。",
    termLimit: "最長 20 年。",
    interestRate: "變動利率，原始資料記載約 2.5% 起。",
    repayment: "本息均攤清償。",
    prepayFee: "2 年內提前清償，依借款餘額收取至少 1.1% 手續費。",
    others: [
      "個人申請通常須備近 3 年所得稅報稅資料、護照、身分或在留文件、信用調查報告及交易確認資料。",
      "原始資料指出，對非居住者開戶與物件審查較嚴謹，尤其應在申請前確認獨棟與物件用途是否受理。"
    ],
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/212189b7866b80c9b38cd1a408b3bed4",
    verifiedAt: "2026-04-25"
  },
  {
    name: "彰化銀行",
    object: "個人：具中華民國或日本國籍，或具台灣居留權／日本永住權者。法人：於日本合法設立註冊法人。",
    ageLimit: "未列固定年齡上限，通常與還款期限一併評估。",
    incomeAsset: "未列統一固定門檻；須提供完整財力、所得與信用資料，由銀行個案審查。",
    signingReq: "一般要求親自前往東京分行辦理。",
    rentAccount: "無日本在留資格者為還款帳戶，出入金以海外匯款為主，且不提供網路銀行。",
    propertyReq: "原始資料記載新耐震（約 1984 年後）並須具確認／檢查相關文件，臨接道路寬度等條件亦會審查；建物面積未達 10 坪者另議。",
    areaLimit: "目前東京分行承作不動產以東京都 23 區為主。",
    amountLimit: "個人戶最低 5,000 萬日圓；法人戶最低 6,000 萬日圓。買賣價與鑑估價孰低約 6～7 成，新成屋可個案爭取較高成數。",
    termLimit: "原則 15 年；依屋齡等條件，新成屋可個案爭取 20 年。",
    interestRate: "變動利率，依借款人財力、信用與物件評價加減碼；原始資料記載約 2.5%～2.9%。",
    repayment: "本息均攤清償。",
    prepayFee: "原始資料記載原則 5 年不得提前還款，可依個案規劃 3 年；應以實際契約確認。",
    others: [
      "鑑估費約 20 萬日圓加消費稅起，依鑑估師報價，並可能另有作業、開戶、設定、保險及匯款費用。",
      "原始資料為個案資訊，申請前應向東京分行確認物件文件、費用與可承作範圍。"
    ],
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/212189b7866b80c9b38cd1a408b3bed4",
    verifiedAt: "2026-04-25"
  },
  {
    name: "臺灣中小企業銀行",
    object: "個人：具中華民國或日本國籍，或具台灣居留權／日本永住權者。法人：於日本合法設立註冊法人。",
    ageLimit: "未列固定年齡上限，通常與還款期限一併評估。",
    incomeAsset: "銀行依借保人資信、財力與不動產條件進行最終審查，原始資料未列固定數字門檻。",
    signingReq: "一般要求親自前往東京分行辦理。",
    rentAccount: "無日本在留資格者為還款帳戶，出入金以海外匯款為主，且不提供網路銀行。",
    propertyReq: "公寓限築齡 30 年內；木造限築齡 5 年內；原始資料未列尺寸限制。",
    areaLimit: "東京、大阪、福岡市部。",
    amountLimit: "最低申貸金額 5,000 萬日圓；融資成數為買賣價與鑑估價孰低的 7 成。",
    termLimit: "最長 20 年。",
    interestRate: "變動利率，原始資料記載約 2.5%～3%。",
    repayment: "本息均攤清償。",
    prepayFee: "原始資料未列明，應以個別契約確認。",
    others: [
      "申請時通常須備所得、資產、存款與信用資料；最終條件由借保人及物件個案決定。"
    ],
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/212189b7866b80c9b38cd1a408b3bed4",
    verifiedAt: "2026-04-25"
  },
  {
    name: "臺灣銀行",
    object: "個人：具中華民國或日本國籍，或具台灣居留權／日本永住權者。法人：於日本合法設立註冊法人。",
    ageLimit: "未列固定年齡上限，通常與還款期限一併評估。",
    incomeAsset: "未列統一固定門檻；須提供完整財力、所得與信用資料，由銀行個案審查。",
    signingReq: "一般要求親自前往東京分行辦理。",
    rentAccount: "無日本在留資格者為還款帳戶，出入金以海外匯款為主，且不提供網路銀行。",
    propertyReq: "原始資料記載新耐震（約 1984 年後）、專有面積 40㎡起，太老舊物件通常不承作。",
    areaLimit: "目前東京分行承作不動產以東京都 23 區為主。",
    amountLimit: "未列統一最低金額；原始資料記載貸款金額不能過低，依物件個別溝通。",
    termLimit: "含寬限期最長 30 年。",
    interestRate: "變動利率，原始資料記載約 2%～3%。",
    repayment: "本息均攤清償。",
    prepayFee: "3 年內提前還款可能有手續費，應以實際契約確認。",
    others: [
      "原始資料將臺灣銀行與其他公股行庫的實務說明併列；個別費用、鑑估與提前清償條款請直接向東京分行確認。"
    ],
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/212189b7866b80c9b38cd1a408b3bed4",
    verifiedAt: "2026-04-25"
  }
];

export const japaneseBanks: JapaneseBankItem[] = [
  {
    name: "三井住友銀行 (SMBC)",
    rate: "變動 0.925%～ / 固定 2.68%～",
    visaReq: "技術簽證 / 1年以上工作簽證 (必須正社員且非永住)",
    workYears: "同公司3個月以上(限2成首付)；同公司3年以上(可挑戰0首付)",
    incomeReq: "300萬日圓以上",
    downPayment: "1～3成（視信用條件，可挑戰 0 首付）",
    amountLimit: "年收入 6.5 - 8 倍",
    ageLimit: "借款終止未滿 75 歲",
    note: "• 限來日3年以上。非永住者必須結婚（配偶不限國籍）才受理，單身者不適用。\n• 【首付減免條件】若滿足以下5個條件中的3個可申請 0 首付，僅滿足2個需 2-3 成首付：1. 來日滿5年 2. 同一家公司滿3年 3. 持有5年期簽證 4. 現居住地滿3年 5. 在日持有自己名下且無貸款的房產。"
  },
  {
    name: "三菱UFJ銀行 (MUFG)",
    rate: "變動 0.595%～ / 固定 1.36%～",
    visaReq: "技術簽證 / 1年以上工作簽證",
    workYears: "同公司 3 年以上",
    incomeReq: "300萬日圓以上",
    downPayment: "約 2 成起",
    amountLimit: "年收入 6.5 - 7 倍",
    ageLimit: "限新耐震（築年要求 1994 年後建）",
    note: "• 要求來日滿 5 年以上才可受理。\n• 接受單身者申請，沒有結婚限制，對大企業在日正社員審批友善。"
  },
  {
    name: "みずほ銀行 (Mizuho)",
    rate: "變動 0.525%～0.725% / 固定 1.8%～",
    visaReq: "高度人才簽證 / 高度人才分數70分以上 / 永住申請中 (必須永住申請回執單)",
    workYears: "同公司 1 年以上 (轉職需過試用期)",
    incomeReq: "700萬日圓以上 (要求偏高)",
    downPayment: "0 ～ 1 成起",
    amountLimit: "年收入 7 - 8 倍",
    ageLimit: "借款終止未滿 80 歲",
    note: "• 必須為正社員並加入日本社保與厚生年金。\n• 需提供 1-2 年在日源泉徵收票，對轉職次數及雇主企業規模審查較傳統與嚴格。"
  },
  {
    name: "SMBC信託銀行 (PRESTIA)",
    rate: "變動 0.88%～1.77% / 固定 1.89%～2.79%",
    visaReq: "1年以上工作簽證",
    workYears: "同公司 1 年以上",
    incomeReq: "500萬日圓以上",
    downPayment: "約 2 成起",
    amountLimit: "年收入 7 - 8 倍",
    ageLimit: "限新耐震（築年要求平成1年/1989年後建）",
    note: "• 最低利率需貸款額 5000 萬日圓以上。\n• 接受單身人士申請，來日滿 1 年即可受理。\n• 雇主公司資金需在 2000 萬日圓以上且擁有獨立辦公層。\n• 若所在公司與該行有戰略合作，在日工作滿 1 個月即可提前申請。"
  },
  {
    name: "東京STAR銀行 (東京之星)",
    rate: "變動 1.65%～",
    visaReq: "1年以上工作簽證（對個人事業主或經營者亦可受理）",
    workYears: "同公司 1 年以上",
    incomeReq: "400萬日圓以上",
    downPayment: "約 2 - 5 成",
    amountLimit: "年收入 6.5 - 7 倍",
    ageLimit: "限新耐震（築年要求西元 2000 年後建）",
    note: "• 要求在日雇主公司成立滿 5 年以上。\n• 作為中信金控旗下子行，對大中華區背景客戶支持度高。後續取得永住權後，利率有機會申請下調至一般日籍居民水平。"
  },
  {
    name: "スルガ銀行 (Suruga)",
    rate: "變動 1.60%～",
    visaReq: "1年以上工作簽證（對非永住者及個人事業主極為友善）",
    workYears: "同公司 2 年以上（未滿可個案諮詢）",
    incomeReq: "500萬日圓以上",
    downPayment: "0 ～ 1 成起（成數審查極富彈性）",
    amountLimit: "年收入 7 - 8 倍",
    ageLimit: "無特別要求 / 舊耐震可談",
    note: "• 接受單身人士申請，來日需滿 3 年。\n• 極度看重借款人在日本帳戶的存款餘額（必須是在日工作合法所得，從海外大量匯入的資金不可認列）。"
  },
  {
    name: "三井住友信託L&F (SM Trust)",
    rate: "變動 4.05%～",
    visaReq: "1年以上工作簽證 / 個人事業主 / 公司經營者",
    workYears: "提供 3 個月以上工資流水證明即可",
    incomeReq: "200萬日圓以上（門檻極低）",
    downPayment: "約 3 - 5 成",
    amountLimit: "年收入 8 - 9 倍",
    ageLimit: "無特別要求 / 舊耐震可談",
    note: "• 無特別在日年限或配偶限制，屬於融資型信託公司。利息偏高但審核極快，適合不符合大銀行資格的置產客戶。"
  },
  {
    name: "セゾンファンデックス (Saison)",
    rate: "變動 4.15%～",
    visaReq: "1年以上工作簽證 / 個人事業主 / 公司經營者",
    workYears: "提供 3 個月以上工資與扣稅流水證明",
    incomeReq: "200萬日圓以上",
    downPayment: "約 3 - 5 成（若公司有合作可降至 2 成）",
    amountLimit: "年收入 7 - 8 倍",
    ageLimit: "配合還款年限綜合審查",
    note: "• 審查門檻低，不限單身或在日年限。一般作為初期在日購屋過渡，待後續取得永住或個人信用提升後，再轉貸至三菱、三井等低息日系大銀行。"
  },
  {
    name: "あすか信用金庫 (Asuka)",
    rate: "變動 2.0%～",
    visaReq: "1年以上工作簽證 / 個人事業主 / 公司經營者均可",
    workYears: "同公司 2 年以上",
    incomeReq: "400萬日圓以上",
    downPayment: "約 2 成起",
    amountLimit: "年收入 7 - 8 倍",
    ageLimit: "無特別要求 / 舊耐震可承作",
    note: "• 接受單身人士申請，來日需滿 3 年以上。\n• 作為信用金庫，對在日華人的中小型企業及商務經營者審查更具彈性與理解力。"
  }
];

export const minpakuRules: MinpakuRuleItem[] = [
  {
    district: "千代田區",
    rules: "2026/7/1 起規則依營業型態與區域細分。家主居住型在文教地區及學校周邊，週日正午至週五正午不得實施；家主不在型在文教地區、學校周邊及人口密集區的限制更嚴格，部分情況全年不得實施。",
    daysLimit: "最多 180 天／年；限制區域與型態可能另有週間或全年限制",
    areaLimit: "文教地區、學校周邊（約 100 公尺）、人口密集區及人口非密集區，依型態適用不同限制",
    managerReq: "家主不在型須符合管理者常駐或駆け付け等區別；應依千代田區現行指南確認。",
    verification: "official",
    sourceUrl: "https://www.city.chiyoda.lg.jp/koho/kurashi/jutakushukuhakujigyo/jorei.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "中央區",
    rules: "全區僅允許週六正午～週一正午營業（平日全禁）。需事前 7 天書面告知居民。",
    daysLimit: "實質約 104 天/年（受週末限制）",
    areaLimit: "全區適用限制",
    managerReq: "須於申報 7 天前對周邊住民周知，並建立可迅速駆け付け處理苦情的體制。",
    verification: "official",
    sourceUrl: "https://www.city.chuo.lg.jp/a0030/kenkouiryou/eisei/seikatsueisei/minpaku/jyutakujyukuhakujigyojyorei.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "港區",
    rules: "限制區域內的家主不在型，僅可於 3/20～4/10、7/10～8/31、12/20～1/10 的指定期間營業；其他情況仍受中央 180 天上限及個別義務規範。",
    daysLimit: "限制區域內依指定期間計算；其他情況最多 180 天／年",
    areaLimit: "第一、二種低層住居專用地域、第一、二種中高層住居專用地域及文教地區",
    managerReq: "家主不在型需依住宅宿泊事業法及港區指引配置管理；申請前向港區確認。",
    verification: "official",
    sourceUrl: "https://www.city.minato.tokyo.jp/kankyoueiseishidou/minpaku2.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "新宿區",
    rules: "住居專用地域：僅週五正午～週一正午可營業（平日禁）。其他商業用途地域無平日禁令。",
    daysLimit: "住居專用區實質約 104 天/年；商業區最多 180 天/年",
    areaLimit: "住居專用地域（第一/二種低層、中高層、住居地域）受限",
    managerReq: "需於提出申報 7 天前，以書面向鄰近居民周知。",
    verification: "official",
    sourceUrl: "https://www.city.shinjuku.lg.jp/kenkou/eisei03_002086.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "墨田區",
    rules: "2026/4/1 起適用修訂後的區條例與執行指引；具體可營業期間、周知與管理要求應依該區最新指南及物件所在地確認。",
    daysLimit: "最多 180 天／年；區條例可能再限制，需個案確認",
    areaLimit: "依墨田區現行條例與指南確認",
    managerReq: "依墨田區現行指南辦理事前周知與管理安排。",
    verification: "official",
    sourceUrl: "https://www.city.sumida.lg.jp/kenko_fukushi/eisei/juutaku_syukuhaku/kunotorikumi/kiseikentou.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "台東區",
    rules: "現行規則與 2026/10/1 起的新規則適用範圍不同。自 2026/10/1 起受理的新申報，家主居住型與不在型都將受平日限制；既有設施是否適用請依台東區公告確認。",
    daysLimit: "最多 180 天／年；平日限制與既存設施例外需依申報日確認",
    areaLimit: "全區；新舊規則的適用依申報受理日區分",
    managerReq: "申報前至少 15 天向周邊住民及學校等周知，並依區規定建立管理體制。",
    verification: "official",
    sourceUrl: "https://www.city.taito.lg.jp/kenchiku/jutaku/eisei/jutakulaw/minpanku20180613_003.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "江東區",
    rules: "全區自週一正午至週六正午不得實施；國定假日的正午至隔日正午為例外，適用日數依實際曆日計算。",
    daysLimit: "中央上限 180 天／年，另受全區週間限制",
    areaLimit: "全區",
    managerReq: "須依江東區條例對鄰近住民進行書面事前周知，並完成申報程序。",
    verification: "official",
    sourceUrl: "https://www.city.koto.lg.jp/260403/fukushi/ese/kankyo/minpaku_index.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "目黑區",
    rules: "全區週日正午～週五正午禁止營業（平日全禁）。",
    daysLimit: "實質上限約 104 天/年",
    areaLimit: "全區適用同限制",
    managerReq: "須於申報日前至少 15 天，張貼並以書面向周邊住民周知；苦情處理紀錄須保存 3 年。",
    verification: "official",
    sourceUrl: "https://www.city.meguro.tokyo.jp/seikatsueisei/kenkoufukushi/eisei/minpaku.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "豐島區",
    rules: "區條例已於 2025/12/15 改正並施行，現行限制區域、限制期間及申報附件已變更；應以豐島區最新說明與物件所在地確認，不以舊版「寒暑假限定」概括。",
    daysLimit: "最多 180 天／年；另依豐島區現行限制區域與期間確認",
    areaLimit: "依豐島區改正後條例及現行申報說明確認",
    managerReq: "依現行條例、施行細則與申報說明辦理周知、標識及管理安排。",
    verification: "official",
    sourceUrl: "https://www.city.toshima.lg.jp/214/kurashi/ese/kankyoese/minpaku/kaisei.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "大田區",
    rules: "家主不在型在指定用途地域、特別用途地區、流通業務地區及部分地區計畫範圍受區域限制；新申報且位於中小學校用地周邊 100 公尺內者，週一正午至週五正午不得實施。家主居住型原則上不適用這些區域與期間限制。",
    daysLimit: "最多 180 天／年；另依家主是否不在、用途地域與學校周邊條件限制",
    areaLimit: "指定住居專用地域、工業地域、文教／特別業務地區、流通業務地區及部分地區計畫範圍",
    managerReq: "應依大田區條例、規則與 2026/4 修訂指引確認；特區民泊為不同制度，不能與住宅宿泊事業混用。",
    verification: "official",
    sourceUrl: "https://www.city.ota.tokyo.jp/seikatsu/hoken/eisei/riyoubiyou/minpaku_shinpou.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "澀谷區",
    rules: "2026/3 公布的改正擴大了限制區域，並調整限制期間與例外條件；新申報物件應依澀谷區最新條例、規則及實施要綱逐案判斷。",
    daysLimit: "最多 180 天／年；限制區域與特例是否適用依現行規定確認",
    areaLimit: "文教地區、住居專用地域及改正後新增的住居地域／準住居地域等，依物件所在地確認",
    managerReq: "申報、管理業者變更與住民周知要求依澀谷區最新文件辦理。",
    verification: "official",
    sourceUrl: "https://www.city.shibuya.tokyo.jp/kenko/eisei/kankyo/minpaku.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "世田谷區",
    rules: "住居專用地域原則上於週一正午至週六正午不得實施；法定假日的正午至隔日正午為例外，另有條例規定的變更可能。",
    daysLimit: "最多 180 天／年；住居專用地域另受週間限制",
    areaLimit: "住居專用地域",
    managerReq: "申報前須依世田谷區手引完成消防等事前諮詢與必要紀錄，並依區指引建立管理與廢棄物處理安排。",
    verification: "official",
    sourceUrl: "https://www.city.setagaya.lg.jp/02245/3247.html",
    verifiedAt: "2026-07-14"
  },
  {
    district: "文京區",
    rules: "住居專用地域、住居地域、準工業地域及文教地區：週日正午至週五正午不得實施；其他用途地域無額外週間禁令。",
    daysLimit: "受限區域僅週五正午～週日正午可營業；其他區域最多 180 天／年",
    areaLimit: "住居專用地域、住居地域、準工業地域及文教地區",
    managerReq: "須事前以書面向周邊住民說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "品川區",
    rules: "非文教用途地域最多 180 天／年、無額外週間禁令；包含文教地區等受限區域，僅週六正午至週一正午可營業。",
    daysLimit: "非受限區域最多 180 天／年；受限區域僅週末可營業",
    areaLimit: "依用途地域判斷；文教地區及特殊住居區受限",
    managerReq: "須向鄰里周知，並建立可迅速處理投訴的體制。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "中野區",
    rules: "住居專用地域於週一正午至週五正午不得實施；其他區域依中央法上限辦理。",
    daysLimit: "受限區域僅週五正午～週日正午可營業；其他區域最多 180 天／年",
    areaLimit: "住居專用地域",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "杉並區",
    rules: "家主不在型且位於住居專用地域時，週一正午至週五正午不得實施；其他情況無額外週間禁令。",
    daysLimit: "受限情況僅週末可營業；其他情況最多 180 天／年",
    areaLimit: "第一、二種低層住居專用地域及第一、二種中高層住居專用地域",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "北區",
    rules: "文教地區及住居專用地域於 1/11～3/20、4/11～7/10、9/1～12/20 不得實施；原始表格記載僅春假、暑假、冬假可營業。",
    daysLimit: "受限區域依學校假期的指定期間營業；其他區域最多 180 天／年",
    areaLimit: "文教地區及住居專用地域",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "荒川區",
    rules: "全區週一正午至週六正午不得實施。",
    daysLimit: "僅週六正午～週一正午可營業，另受 180 天／年上限",
    areaLimit: "全區",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "板橋區",
    rules: "住居專用地域於週日正午至週五正午不得實施。",
    daysLimit: "受限區域僅週五正午～週日正午可營業；其他區域最多 180 天／年",
    areaLimit: "住居專用地域",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "練馬區",
    rules: "住居專用地域僅週五正午至週一正午（含假日前後）可營業；其他區域適用每年 180 天上限。",
    daysLimit: "受限區域僅週末及假日前後可營業；其他區域最多 180 天／年",
    areaLimit: "住居專用地域",
    managerReq: "家主不在型須配置常駐管理者。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "足立區",
    rules: "住居專用地域於週一正午至週五正午不得實施；週末及例假日可營業，另於 12/31 正午至 1/3 正午禁止。",
    daysLimit: "受限區域依週間、例假日及年末年初限制；其他區域最多 180 天／年",
    areaLimit: "住居專用地域",
    managerReq: "須向鄰里周知說明。",
    verification: "user-provided",
    sourceUrl: "https://app.notion.com/p/295189b7866b800ca1f1d52830f772c7",
    verifiedAt: "2025-10-23"
  },
  {
    district: "葛飾區",
    rules: "自 2026/4/1 起的新申報，除商業地域及符合常駐例外者外，週一正午至週六正午不得實施；國定假日與 12/29 正午至 1/4 正午不列入此限制。2026/3/31 前已完成申報者暫不適用此新限制。",
    daysLimit: "受限物件主要僅週末營業；商業地域或符合常駐例外者可在 180 天／年上限內含平日營業",
    areaLimit: "商業地域除外；其餘全區為限制區域。跨區域基地以過半面積判定。",
    managerReq: "例外須由業者或住宅宿泊管理業者常駐於物件內、同棟、同一基地或相鄰建物；申報前也須向規定範圍的周邊住民周知。",
    verification: "official",
    sourceUrl: "https://www.city.katsushika.lg.jp/_res/projects/default_project/_page_/001/039/684/08032500.pdf",
    verifiedAt: "2026-07-14"
  },
  {
    district: "江戶川區",
    rules: "自 2026/7/1 起，限制區域內須同時符合家主近距居住、住宿期間不離開，以及居室數合計 5 室以下且自行管理，才可新設；因此委託住宅宿泊管理業者的管理型民泊，原則上不得在限制區域新設。2026/6/30 前已完成申報者適用過渡措施。",
    daysLimit: "符合限制區域例外條件者仍受 180 天／年上限；非限制區域依中央法上限辦理",
    areaLimit: "第一、二種低層住居專用、第一、二種中高層住居專用、第一、二種住居、準住居及田園住居地域",
    managerReq: "業者須已連續 3 個月居住於物件同棟、同一基地或相鄰住宅，且住客期間不得離開；另須事前向周邊住民周知並處理苦情。",
    verification: "official",
    sourceUrl: "https://www.city.edogawa.tokyo.jp/e055/kenko/eisei/kankyo/syukuhakujigyoho/juutakusyukuhakujigyou-kaishi.html",
    verifiedAt: "2026-07-14"
  }
];

export const ryokanRules = {
  title: "東京都特別區旅館業／簡易宿所許可確認重點",
  institution: "各區保健所（例如新宿保健所、澀谷保健所等）",
  cost: "申請費與審查期間依設施所在地自治體及案件補正情況而異，應在規劃初期向轄區保健所確認。",
  steps: [
    { name: "事前諮詢", desc: "在簽約、施工或變更用途前，持設計圖向轄區保健所、消防署確認；同時由建築士查核用途地域、建築基準法、既存不適格與用途變更程序。" },
    { name: "標識與周知", desc: "標識設置、周邊住民周知及等待期間依所在地自治體規定辦理，不能以單一全東京天數概括。例如新宿區新規許可申請前須設置標識至少 14 天。" },
    { name: "正式提出申請", desc: "向轄區保健所提出旅館業營業許可申請，通常需附構造設備概要、客室資料、周邊圖、建築／設備圖、權原文件及法人文件等；實際清單依各區而異。" },
    { name: "現場與消防確認", desc: "保健所會進行現場檢查；消防法令適合性也須經轄區消防署確認。兩者的時程與檢查方式依案件及自治體安排，勿假設一定是聯合檢查。" },
    { name: "獲得許可與開業", desc: "通過檢查後，核發「旅館業營業許可證」，即可全年 365 天營運，不受 180 天天數限制。" }
  ],
  requirements: [
    "客室延床面積原則須達 33㎡ 以上；申請時收容人數未滿 10 人，則可按每人 3.3㎡ 以上計算。",
    "簡易宿所在東京都條例下沒有一律的玄關帳場構造設備要求；但仍須能妥善辦理身分確認、名簿、鑰匙交付與緊急應對。前台、遠端設備或駆け付け體制是否足夠，須向轄區確認。",
    "消防設備不是全東京單一清單：自動火災報知設備、誘導燈、滅火器、避難設備等，會依用途、規模、樓層、構造與收容人數由消防署判定；施工前必須先諮詢。",
    "客室須有足夠面積、通風、採光、照明、防濕及排水等衛生條件；浴室、廁所、洗面與給排水設備也須符合東京都條例及個案審查。",
    "營業場所須在公眾易見處掲示設施名稱；若提供餐飲、設置共用浴池等，還可能另涉食品衛生或公眾浴場等規範。"
  ],
  warnings: [
    "⚠️ 土地用途地域：旅館或簡易宿所能否設置，須依用途地域、自治體條例、建築基準法與既有建物用途逐案確認；不可只憑住宅或商業區名稱判斷。購入前應由建築士、保健所與消防單位進行事前確認。",
    "⚠️ 建築物用途變更：住宅改作旅館時，是否須辦理確認申請取決於用途、規模、改修內容與既有建物狀態；特殊建築物的用途變更達 200㎡以上通常涉及確認申請，但未滿 200㎡也不代表可免除建築或消防法規。建築士資格種類亦依案件而定，並非一律限定一級建築士。"
  ]
};

export const buyHouseQAs: BuyHouseQAItem[] = [
  {
    question: "沒簽證也可以在日本買房嗎？日本買房會不會送簽證？",
    answer: "外國人原則上可以在日本取得土地與建物所有權，買房本身通常不要求持有日本長期簽證；但仍可能涉及重要土地等調查法、農地法、外匯法令申報、本人確認與匯款審查等個別程序。購買不動產本身不會自動取得居留或永住資格；任何簽證規劃都應依實際活動內容向入管專業人士確認。"
  },
  {
    question: "房產登記時可以由兩個人共同持分產權嗎？",
    answer: "可以的！日本的不動產登記買賣允許多人共同持有同一筆土地或建物產權。您可以根據出資比例或雙方協議，設定每個人擁有的所有權持分比例（例如夫妻各持分 50%）。\n\n實務提醒：未來申報固定資產稅、所得稅（若有出租）或未來出售、繼承時，皆需全體持有人同意並按持分比例申報，建議在共同持分前詳細約定費用分攤與權利義務。"
  },
  {
    question: "日本買房有類似台灣的「履約保證」制度嗎？",
    answer: "日本沒有跟台灣完全一樣的「建商/仲介履約保證專戶」，但有一套非常嚴格且完備的法律防範機制：\n\n1. 司法書士把關：日本在交易過戶當天（決算日），買方的尾款是直接在銀行或仲介法人帳戶進行。司法書士（地政士）會親自在現場核對賣方的所有權狀、印鑑證明等所有過戶文件，確認無誤、可以「即時送件過戶」後，才會由銀行撥款，幾乎不存在付了錢卻拿不到產權的漏洞。\n\n2. 營業保證金制度：日本所有的宅建業者（仲介/建商）依法都必須向政府繳存高額的「營業保證金」或加入「保證協會」。如果因為仲介不法或破產導致客戶受損，買方可以獲得政府協會的弁濟賠償，保障度極高。"
  },
  {
    question: "日本有沒有「斡旋金」？出價可以講價講多少？",
    answer: "1. 沒有斡旋金：日本交易「沒有」台灣收取斡旋金的習慣。在表達購買意願時，只需填寫並提交一份書面的「買付申込書（購屋意向書）」，上面填寫您希望的出價與付款條件，不需要先拿出一筆現金給仲介。這份文件在簽訂正式買賣契約前不具法律約束力。\n\n2. 講價空間：一般而言，日本的開價相對實在，合理的講價空間大約在 1% ~ 5% 左右。如果是屋齡高、需要大翻修或賣方急售的物件，講價空間可能稍大；若是剛上市、地段極佳且多人競爭的熱門物件，往往「完全沒有講價空間」，甚至需要原價或加價競爭才能買到。"
  },
  {
    question: "買有租客的「帶租約投資房（オーナーチェンジ）」，可以進去看看屋內狀況嗎？",
    answer: "不能。帶租約投資房在出售時不安排買方進入室內看房；現租客仍在居住，買方不能要求進屋確認。購入前只能以租賃契約、修繕紀錄、過往照片、設備表、管理文件與收益資料查核，並把無法完整確認室內狀況列入價格與修繕風險。"
  },
  {
    question: "買了帶租客的房子，我可以要求漲租金，或要求房客搬走改為自住嗎？",
    answer: "租金增減可依租稅負擔、價格變動、周邊行情及契約內容協議；無法達成共識時可能需要調停或訴訟，不能由房東單方面任意變更。普通借家契約下，出租人拒絕更新或提出解約通常需要正當事由，搬遷補償只是綜合判斷因素之一，沒有固定為幾個月租金。購入帶租約物件前，應以承接既有租約並長期持有的前提評估。"
  },
  {
    question: "為什麼地段越好、越新蓋的房子，算下來的利潤投報率（利回り）反而越低？",
    answer: "這是房地產市場的鐵律：\n\n1. 房價分母大：熱門黃金地段（如港區、澀谷、新宿）的土地地價高昂，新築或極新物件的造價與溢價高，這使得「購入價格（分母）」非常龐大，雖然租金也貴，但租金的漲幅跟不上房價的溢價，計算下來的表面投報率自然偏低（通常在 3% ~ 4.5% 之間）。\n\n2. 資產保值與抗跌性：高投報率（例如 8% ~ 10%）的物件往往位於偏遠郊區、人口流出嚴重、或是屋齡 40 年以上的木造老屋。這類物件雖然租金投報高，但面臨「空置期長、轉手極難、資產價值快速貶值」的巨大風險。市中心的新屋雖然投報率低，但空置率極低、極易轉手、且土地資產具備強大的保值與未來增值空間，適合追求資金安全與穩定資產配置的投資者。"
  },
  {
    question: "為什麼越新的房子，投報率 (利回り) 好像越低？",
    answer: "日本新房購入成本高昂，折舊率少、設施新。高購屋成本 (分母大) 會直接拉低租金回報率百分比。\n\n日本房產價值隨屋齡折舊，但租金下降速度不如房價跌速快。因此中高屋齡 (約20-30年) 的房子若維護得當，因為購置價格低，算下來的利潤投報率往往會比新蓋的房子高。但要注意老房有較高的維護修繕基金支出。"
  },
  {
    question: "想投資帶租客的物件，可以親自去屋內看房嗎？",
    answer: "不能。帶租約投資房在出售時不開放買方進入室內看房，必須以無法內見為前提評估。請查核格局、過往照片、租賃契約、入金紀錄、修繕紀錄、管理費與修繕積立金等資料，並為無法完整確認的室內狀況保留風險預算。"
  },
  {
    question: "貸款的「假審查」和「本審查」通過後，還可以隨意更換想買的物件嗎？",
    answer: "事前審查與正式審查通常都是針對申請人及特定物件條件進行；更換物件後，金融機構可能要求重新審查或補件。若已簽買賣契約，能否取消及手付金如何處理，須依融資特約、解除期限與其他契約條款判斷，不能只因貸款或物件改變就假設一定可無條件解除。"
  },
  {
    question: "想買一間自住公寓，但沒有長期簽證不能一直待在日本，空置時可以經營 Airbnb 民宿嗎？",
    answer: "是否可行須同時確認管理規約、住宅宿泊事業法、自治體條例、用途地域、建築與消防要求，不能只看房屋類型。區分所有大樓常限制住宿營業，但比例會依地區與社區而異，不宜用 99% 概括。屋主不在型通常涉及委託住宅宿泊管理業者；簡易宿所則是另一套許可制度，並非只要獨棟住宅就能經營。"
  },
  {
    question: "想買一戶建經營民宿，哪種民宿經營的法源最適合我？",
    answer: "在日本經營民宿主要有三大法律框架：\n\n1. 住宅宿泊事業法 (民泊新法)：全國適用，手續為申報制，住居專用區可營運，但「一年限制營運最多 180 天」，且屋主不在需委託合格管理業者。適合自住為主、空置期偶爾出租的買主。\n2. 旅館業法 (簡易宿所)：手續為許可制，無營運天數限制 (365天)，但「住居專用區絕對禁止開設」，且硬體消防設施 (自動火報、連動煙感、指示燈、面積等) 審查極嚴苛。適合純投資、全年營運追求最大租金回報的買主。\n3. 國家戰略特區民泊：手續為認定制，無營運天數限制，但僅限特定特區（如大田區），且規定「最低住宿天數必須在 2 晚 3 天以上」。"
  }
];

export interface BuyBudgetModifier {
  text: string;
  multiplier: number;
  type: "plus" | "minus";
  category: "condition" | "occupancy" | "earthquake" | "ownership" | "building" | "location" | "age" | "others";
  description: string;
}

export const buyBudgetModifiers: BuyBudgetModifier[] = [
  // Condition/Renovation
  {
    text: "全新完工成屋 (新築/未入居)",
    multiplier: 0.35,
    type: "plus",
    category: "condition",
    description: "日本全新完工建案溢價極高，品質、設備均屬頂尖，且享有10年瑕疵擔保，但購入即折舊"
  },
  {
    text: "全面現代化翻新 (リノベーション済み)",
    multiplier: 0.20,
    type: "plus",
    category: "condition",
    description: "針對中古屋進行室內骨架重組、管線重拉與廚衛翻新，內部狀況如同新成屋，極受買家喜愛"
  },
  {
    text: "局部基礎翻修 (リフォーム済み)",
    multiplier: 0.08,
    type: "plus",
    category: "condition",
    description: "進行壁紙更換、部分地板、廚具或衛浴更新，適合無大型改動需求"
  },
  {
    text: "現況不翻修直接過戶 (現状渡し)",
    multiplier: -0.15,
    type: "minus",
    category: "condition",
    description: "保留前屋主原狀，通常伴隨明顯折舊與髒污，買方需自行撥付約 200萬～500萬日圓進行翻新"
  },

  // Occupancy Status
  {
    text: "空室 (即時點交，自住首選)",
    multiplier: 0.08,
    type: "plus",
    category: "occupancy",
    description: "房屋現況為空屋，買方可實地看房點交、過戶後即可隨時裝潢自住，市面自住買方溢價高"
  },
  {
    text: "帶租約出售 (オーナーチェンジ - 投資房)",
    multiplier: -0.10,
    type: "minus",
    category: "occupancy",
    description: "房屋附帶租約，買主買下後直接成為房東收租，因無法看屋內狀況且無法收回自住，房價有折價"
  },

  // Earthquake Resistance Standard
  {
    text: "舊耐震基準建物 (1981年5月以前建)",
    multiplier: -0.25,
    type: "minus",
    category: "earthquake",
    description: "舊耐震標準之結構。通常銀行極難承作房貸、耐震保險費高，且未來都更或轉手難度大"
  },

  // Land Ownership Type
  {
    text: "借地權 (非所有權 - 僅擁有地上物權利)",
    multiplier: -0.30,
    type: "minus",
    category: "ownership",
    description: "僅租用土地、不持有土地產權。每月需向地主支付地租，且期限屆滿可能需拆屋還地"
  },

  // Building Structure / Amenities
  {
    text: "高級塔樓公寓 (タワーマンション)",
    multiplier: 0.25,
    type: "plus",
    category: "building",
    description: "20層以上超高層地標性豪宅，公設極度豪華（如24小時管理員、高空大廳、客房服務），資產保值性極強"
  },
  {
    text: "低層木造/輕鋼構公寓 (アパート)",
    multiplier: -0.20,
    type: "minus",
    category: "building",
    description: "通常不設電梯，隔音與耐震度次於鋼筋混凝土(RC)，雖總價便宜但折舊快，土地持分相對關鍵"
  },
  {
    text: "步行 5 分鐘內超精華地段",
    multiplier: 0.12,
    type: "plus",
    category: "location",
    description: "離地鐵站步行在 5 分鐘內，無論自用、出租或轉售皆是市場最搶手的抗跌物件"
  },
  {
    text: "步行 15 分鐘以上較遠地段",
    multiplier: -0.10,
    type: "minus",
    category: "location",
    description: "離捷運站較遠，出租空置風險較高，但對於喜愛清靜自住的買方而言，能以更划算的價格購入更大空間"
  },

  // Building Age
  {
    text: "屋齡 5 年內 (築5年以內)",
    multiplier: 0.18,
    type: "plus",
    category: "age",
    description: "折舊率極低，內部裝潢與建材均保持極佳狀態，且高機率享有長期新蓋瑕疵擔保"
  },
  {
    text: "屋齡 10 年內 (築10年以內)",
    multiplier: 0.10,
    type: "plus",
    category: "age",
    description: "整體硬體仍極新穎，折舊速度開始趨緩，自住與出租皆是市場高流通物件"
  },
  {
    text: "屋齡 15 年內 (築15年以內)",
    multiplier: 0.04,
    type: "plus",
    category: "age",
    description: "設備與外觀維護尚佳，多數尚未進行第一次大樓大修繕，入手總價相對平衡"
  },
  {
    text: "屋齡 20 年內 (築20年以內)",
    multiplier: -0.08,
    type: "minus",
    category: "age",
    description: "折舊已達一定幅度，設備可能開始出現部分老化，買方常需預留部分小修繕預算"
  },
  {
    text: "屋齡 25 年內 (築25年以內)",
    multiplier: -0.15,
    type: "minus",
    category: "age",
    description: "大樓多已進行或即將進行第一次大規模修繕（通常在12-15年），管理費與修繕金可能隨之調漲"
  },
  {
    text: "屋齡 30 年內 (築30年以內)",
    multiplier: -0.22,
    type: "minus",
    category: "age",
    description: "外觀與公共區域有歲月痕跡，設備多已過保或經歷多次更換，但通常公設比低、使用坪數實在"
  },
  {
    text: "屋齡 40 年內 (築40年以內)",
    multiplier: -0.30,
    type: "minus",
    category: "age",
    description: "折舊接近底部，土地持分價值高於地上建物價值，多數大樓管線需要大幅拉皮或更新，入手價格極具優勢"
  }
];
