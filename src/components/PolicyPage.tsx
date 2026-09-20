export type PolicyPageId = "site-policy" | "privacy" | "disclaimer" | "cookie";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const POLICY_CONTENT: Record<
  PolicyPageId,
  {
    eyebrow: string;
    title: string;
    introduction: string;
    sections: PolicySection[];
    /** 各頁獨立的更新日期 */
    updatedAt: string;
  }
> = {
  "site-policy": {
    updatedAt: "2026 年 9 月 15 日",
    eyebrow: "SITE POLICY",
    title: "網站使用條款",
    introduction:
      "歡迎使用 LINUS 住好日（以下簡稱「本網站」或「本服務」）。本網站專注於日本不動產（包含租屋、中古公寓、透天戶建、土地、一棟建物與民宿物業）市場實況、實價大數據分析、圖紙（マイソク／販売図面）多模態 AI 健檢與初期/持分費用專業精算。使用本服務即表示您已詳閱並同意本條款之全部規範。",
    sections: [
      {
        title: "服務內容與適用範圍",
        paragraphs: [
          "本服務提供日本不動產知識庫指南、跨國搬遷與在日置產 SOP、費用與持分稅費精算、國土交通省成約實價與 At Home 在售/租金行情雙軌對照、圖紙 OCR 與多模態 AI 辨識健檢、交通動線多因子換算（含車站步行與巴士接駁）、PDF 診斷報告生成與分享、Threads 精選文庫及 AI 顧問對話諮詢。",
          "本網站各項內容與估算邏輯將隨日本法令稅制、市場實況、各公部門 API 與演算法模型持續演進與動態更新。",
        ],
      },
      {
        title: "圖紙分析與 AI 健康檢查功能規範",
        paragraphs: [
          "本站提供之圖紙辨識、租賃與買賣雙軌健康檢查功能，僅供個人自住購屋規劃、租賃評估、物業研究或合法學術參考使用。",
        ],
        items: [
          "使用者保證所上傳之圖紙、物件概要書或契約草案未侵害他人著作權、商業秘密或違反委託經紀契約規範。",
          "禁止利用腳本、爬蟲或任何自動化工具惡意大量批次上傳圖紙，或進行任何意圖癱瘓、耗損本站運算與 API 資源之行為。",
          "AI 解析產生之大樓體質診斷、行情落點、防呆稽核與稅費試算，僅供個人決策輔助；未經本站書面授權，不得轉載用於商業收費諮詢、二次轉售或競業資料庫建置。",
        ],
      },
      {
        title: "著作權與第三方權利聲明",
        paragraphs: [
          "除另有標示外，本站原創文字、資料整理、估算邏輯、演算法架構、版面設計與品牌視覺之著作權，均歸 CHANG CHIN WEI（Linus・@linus3524）所有，並以「LINUS 住好日」品牌發布及管理。",
          "本站所引用之日本國土交通省（不動產資訊資料庫）、公益財團法人 不動產流通推進中心（中古マンション価格査定マニュアル）、東京カンテイ（Tokyo Kantei）、東日本不動產流通機構（REINS）及 At Home、SUUMO、LIFULL HOME'S 等第三方機構之公開統計、指標名稱、商標或資料，其智慧財產權與權利均屬原權利人所有。本站僅於法定合理使用與各機構資料規約下進行分析引用與比對呈現。",
        ],
        items: [
          "可供個人閱讀、收藏，或在清楚標示來源並附上本站連結的前提下合理引用少量內容。",
          "未經事前書面同意，不得大量轉載、改寫重製、商業使用、建立競業資料庫，或將本站內容作為公開 AI 訓練與生成素材。",
        ],
      },
      {
        title: "外部資料來源法定標示",
        paragraphs: [
          "本服務之部分內容使用下列外部公共資料與大數據智庫。各資料之著作權歸屬原提供機關，本服務顯示之內容為本站彙整加工後之成果，非由各機關直接提供或背書：",
        ],
        items: [
          "日本國土交通省「不動産情報ライブラリ」API（成約實價與物件周邊區域資訊）：このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません。（中譯：本服務使用國土交通省不動產資訊圖書館之 API 功能，惟所提供資訊之即時性、正確性與完整性等不受保證。）",
          "公益財團法人 不動產流通推進中心《中古マンション価格査定マニュアル》：日本不動產流通推進中心編訂之官方查定基準。",
          "公益財團法人 東日本不動產流通機構（REINS）及 At Home、SUUMO 等公開市況資料庫。",
        ],
      },
      {
        title: "禁止行為",
        items: [
          "干擾網站運作、規避使用次數與速率限制（Rate Limiting）、批次抓取內容，或嘗試取得未公開資料與系統金鑰。",
          "利用 AI 顧問或圖紙辨識處理與日本不動產及在日生活無關的內容，或以提示注入（Prompt Injection）等方式繞過服務安全限制。",
          "冒用他人身分、侵害第三方權利，或從事任何違法、不當或損害本站商譽之行為。",
        ],
      },
      {
        title: "服務變更、中斷與條款調整",
        paragraphs: [
          "本站得因系統維護、伺服器擴充、法規修訂或安全需求調整本條款或暫停服務。修訂後之內容將公告於本網站，公告後繼續使用本服務即視為同意修改後之條款。",
        ],
      },
      {
        title: "準據法與管轄法院",
        paragraphs: [
          "本條款之解釋與適用，以中華民國或日本國相關法令為準據法。因本服務所生之爭議，雙方合意以臺灣臺北地方法院或日本東京地方裁判所為第一審管轄法院。",
        ],
      },
    ],
  },
  privacy: {
    updatedAt: "2026 年 9 月 15 日",
    eyebrow: "PRIVACY POLICY",
    title: "隱私權政策",
    introduction:
      "LINUS 住好日（以下簡稱「我們」）高度重視您的個人隱私。我們嚴格遵循資料最小化原則（Data Minimization），只在提供網站功能、維護服務安全與了解整體使用狀況所需的必要範圍內處理資料，並落實嚴密的保護措施。",
    sections: [
      {
        title: "可能處理的資料範疇",
        items: [
          "使用者上傳之圖紙與文件資料：當您使用圖紙辨識或健康檢查功能時，系統僅在記憶體與分析流程中處理您所上傳之 PDF 或圖檔，用於執行光學文字辨識（OCR）、格局與條件萃取、大樓體質診斷與買賣/租賃分析。",
          "訪客識別碼（Cookie）：用於辨識不重複訪客與計算全站累計瀏覽人次，本身不包含姓名、電話、身分證號或電子郵件等個人可識別資訊（PII）。",
          "AI 顧問輸入內容與對話脈絡：用於即時產生本次回答；請勿主動輸入護照號碼、在留卡號、金融帳戶或敏感個人隱私。",
          "連線安全與請求標頭：IP 位址國別標頭、請求時間戳記與呼叫頻率，用於防止惡意攻擊與濫用、維護伺服器安全及執行服務速率限制（Rate Limiting）。",
          "瀏覽器本機儲存（Local / Session Storage）：部分操作偏好、計算機篩選值與後台管理權杖會暫存於您的瀏覽器端（管理權杖於分頁關閉即自動抹除）。",
        ],
      },
      {
        title: "圖紙上傳資料處理與隱私防護保證",
        paragraphs: [
          "不動產銷售圖紙（マイソク／販売図面）多為日本不動產流通市場之公開或仲介募集文件。若您上傳之圖檔或契約草案中載有特定個人私密資訊（如原所有權人姓名、現住戶個資、私人聯絡電話或手寫簽名），強烈建議您於上傳前先行塗黑或遮蔽。",
          "絕不建立個人檔案：本站絕不會利用圖紙內之個人資訊進行個人身分比對或建立個人檔案。本站亦絕不將您上傳之圖紙、物件資料或對話紀錄出售、轉讓或出租給任何第三方不動產仲介業者、金融機構或行銷廣告商。",
          "記憶體處理與自動清理：上傳之暫存檔案僅保留於伺服器端完成分析所需之最短時間（秒級），系統會依排程定期自動清理暫存快取，確保資料不長期滯留。",
        ],
      },
      {
        title: "使用目的",
        items: [
          "提供不動產圖紙 OCR 解析、格局與持有成本試算、大樓健康診斷與買賣/租賃行情落點比對。",
          "提供訪客統計、初期費用精算、AI 顧問與網站各項核心功能。",
          "監控異常流量、排除系統錯誤、防範 API 惡意刷取並提升跨國連線穩定性。",
          "回覆使用者主動透過 LINE、WeChat、社群或電子郵件提出之個案諮詢與回饋。",
        ],
      },
      {
        title: "第三方服務與 AI 資料處理條款（Google Gemini）",
        paragraphs: [
          "本站之 AI 對話與圖紙多模態解析功能，係透過安全加密連線傳輸至 Google Gemini API 商業服務端點。本站採用 Google Cloud 企業級服務協議（Enterprise Terms of Service），使用者的輸入內容與上傳圖檔絕不會被用於 Google 基礎模型之公開訓練或產品改善。",
          "若您透過本站點選 LINE、WeChat、社群平台或外部政府機構連結，後續之資料處理與互動均適用各該平台獨立之隱私權規範。",
        ],
      },
      {
        title: "個人資料之不提供第三方原則與例外",
        paragraphs: [
          "除下列法定例外情形外，本站未經使用者事前同意，絕不將個人資料提供予第三方：",
        ],
        items: [
          "基於法律法規之明文規定或司法警察機關依法執行公務之調查要求。",
          "為維護使用者或公眾之生命、身體、財產等重大權益，且難以取得本人同意時。",
          "受委託處理系統維護、伺服器託管之技術協力廠商（受嚴格保密協議規範）。",
        ],
      },
      {
        title: "保存期間與您的當事人權利",
        paragraphs: [
          "訪客統計資料於服務存續期間妥善保存，匿名識別 Cookie 最長約一年。您可隨時透過瀏覽器設定清除 Cookies 與網站暫存資料。",
          "若您曾主動提供聯絡資訊，您有權向我們請求查詢、閱覽、補充、更正或刪除您的個人資訊。若對本隱私權政策有任何疑問，歡迎隨時透過「聯絡 Linus」與我們聯繫。",
        ],
      },
    ],
  },
  disclaimer: {
    updatedAt: "2026 年 9 月 15 日",
    eyebrow: "DISCLAIMER",
    title: "資訊免責聲明",
    introduction:
      "本站致力於透過日本官方實價大數據、查定基準教科書與演算法模型，將複雜的日本不動產市況與交易規則透明化；但網頁所有內容、試算與 AI 診斷均為初步研究與決策輔助性質，絕不能取代日本法定專業人士針對個案提供之正式專業意見與現場調查。",
    sections: [
      {
        title: "一般資訊與非專業意見性質",
        paragraphs: [
          "本站所有文章、試算工具、圖紙健檢、行情落點與 AI 顧問回覆，僅供一般客觀資訊、購屋租屋方向規劃與個人評估參考，不構成法律、稅務、金融融資、移民簽證、投資回報保證或正式不動產鑑價報告。",
        ],
      },
      {
        title: "非宅建業法之「重要事項說明書」",
        paragraphs: [
          "本站為資訊科技與數據分析工具，非日本宅地建物取引業者。",
          "本站圖紙健檢、大樓修繕積立金充足度評估、管理體制檢驗及持分稅費概算，均為演算法模型之初步篩檢，絕不能取代日本《宅地建物取引業法》第 35 條規定由合格「宅地建物取引士」交付並面對面說明之《重要事項說明書（35條書面）》、管委會總會議事錄、重要事項調查報告書，亦不能取代合格「一級建築士」之耐震診斷與建物劣化檢查。",
        ],
      },
      {
        title: "買賣實價成交行情的資料來源",
        paragraphs: [
          "中古公寓、透天戶建與土地的成約行情，取自日本國土交通省「不動產資訊資料庫」（不動産情報ライブラリ）官方 API，以都道府縣、506 個市區町村、房型格局及屋齡帶進行分層統計，採直近 4 個季度之實際成約單價中位數直接換算本案專有面積。此為日本政府登錄之真實成交紀錄，非仲介刊登開價。",
          "依國土交通省不動產資訊資料庫使用規約，本站正式揭示法定免責聲明：『このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません。』",
          "部分冷門地區或特殊格局因成約樣本較少，統計視窗可能依序往前滑動採計；成約筆數過少時畫面會明確標註警語，提醒使用者中位數易受極值影響。",
        ],
      },
      {
        title: "二手公寓價格查定教科書與大數據智庫依據",
        paragraphs: [
          "本站針對個別物件規格之價格影響幅度（包含角部屋、陽台開口部朝向、樓層垂直與最上階、專用景觀露台、私人庭院、土地權利借地權、大樓管理體制、電梯配置等），計算依據包含：",
        ],
        items: [
          "公益財團法人 不動產流通推進中心（前國土交通省轄下之不動産流通近代化センター）所編訂之《中古マンション価格査定マニュアル》（二手公寓價格查定手冊）：此為日本不動產仲介業界唯一官方估價教科書，為三井、住友、東急、野村等各大仲介及銀行採用之官方查定基準。",
          "東京カンテイ（Tokyo Kantei）不動產大數據研究所：引用日本最大公寓大數據資料庫之百萬筆成約特徵價格回歸統計，包含同棟大樓角部屋溢價率（平均 +4.2%）、首都圈南北向成交價差（7%～9%）、車站徒步時間與保值率（リセールバリュー）相關性、百戶以上大規模社區規模效應，以及超高層塔樓住宅（タワーマンション）之規格溢價。",
        ],
      },
      {
        title: "市場在售開價行情之資料來源與校準",
        paragraphs: [
          "本站呈現之「市場同規模在售行情」與「典型開價區間」，係整合日本指定流通機構（東日本 / 中部 / 近畿 / 西日本 REINS）定期發布之公開市況 Market Watch，以及 At Home、SUUMO 等公開在售行情快照，依本案實際專有面積、同屋齡帶成約走勢及都會區合理開價天花板動態換算而成。",
          "市場在售開價反映的是賣方當前之掛牌開價（Asking Price），包含賣方利潤與常態議價空間，非最終成交價。本站並列成約實價與在售開價雙軌基準，目的在協助買方客觀辨識賣方開價是否存在超額溢價。",
        ],
      },
      {
        title: "租金行情之資料來源",
        paragraphs: [
          "租金行情資料取自 At Home 全國各行政區與格局之公開租金行情數據，採直近刊登物件之代表值建立快照。資料反映刊登階段之募集條件，非最終契約租金。同一行政區內，屋齡、站距、樓層、座向及設備均會造成價差，實際租金請以當期招租圖紙為準。",
        ],
      },
      {
        title: "住宅貸款減稅與壁芯／內法面積限制",
        paragraphs: [
          "圖紙（マイソク）刊載之專有面積通常為「壁芯面積」（以牆壁中心線起算）。",
          "日本住宅貸款減稅（住宅ローン控除）與不動產取得稅減免之法定專有面積門檻（40㎡ 或 50㎡ 以上）一律以法務局「登記簿謄本內法面積」為準。若圖紙壁芯面積為 40.0～42.0㎡，扣除牆厚後登記簿內法面積極可能跌破 40㎡ 而無法適用減稅。交易前務必向經紀人調閱建物登記謄本確認。",
        ],
      },
      {
        title: "審查、融資與交易結果",
        paragraphs: [
          "日本不動產之入居審查、保證公司承保、銀行貸款成數與利率、簽證核發、購屋出價買付與契約簽署，均由各該獨立金融機構、房東、賣方、管理公司及締約各方依照個案實況全權決定，本站無法亦不對任何交易結果負保證或法律責任。交易前請務必委託合格不動產仲介經紀人（宅地建物取引士）與專業司法書士進行個案確認。",
        ],
      },
    ],
  },
  cookie: {
    updatedAt: "2026 年 9 月 15 日",
    eyebrow: "COOKIE POLICY",
    title: "Cookie 政策",
    introduction:
      "本政策說明 LINUS 住好日（以下簡稱「我們」）如何在網站上使用 Cookie、本機儲存空間（Local Storage / Session Storage）及類似技術，以維持系統運作、強化安全性並提升您的瀏覽體驗。",
    sections: [
      {
        title: "什麼是 Cookie 與類似儲存技術",
        paragraphs: [
          "Cookie 是您造訪網站時儲存在電腦或行動裝置上的小型文字檔案。此外，現代瀏覽器亦支援 Local Storage 與 Session Storage 等本機快取技術。這些技術讓網站能夠記住您的操作與偏好，免除每次切換頁面時重複輸入的困擾，並提供更流暢的互動體驗。",
        ],
      },
      {
        title: "我們使用的 Cookie 分類與用途",
        paragraphs: [
          "我們依據功能將本網站使用的 Cookie 與本機儲存技術分為以下四類：",
        ],
        items: [
          "必要性 Cookie（Essential）：維持網站基本運作所必需。包含分散式連線管理、防範 CSRF 攻擊與執行 API 呼叫速率限制（Rate Limiting），確保伺服器穩定不被惡意癱瘓。",
          "效能與分析 Cookie（Performance & Analytics）：包含第一方匿名訪客識別標記（visitorId），用於計算不重複訪客與分頁瀏覽量（Pageviews）。所有統計數據均經匿名聚合處理，絕不收集姓名、電話或帳號密碼等個人資料。",
          "功能性與偏好儲存（Functional Preferences）：用於記住您在各功能頁面的篩選狀態（例如費用試算機的預設地區、格局偏好、圖卡分類標籤等），提供個性化操作體驗。",
          "安全性工作階段權杖（Session Storage）：用於管理後台使用量查詢之臨時驗證（Token），該權杖僅存於當前瀏覽器分頁之記憶體中，分頁一旦關閉即自動抹除，確保安全性。",
        ],
      },
      {
        title: "第三方技術與外部連結",
        paragraphs: [
          "本網站可能包含指向 LINE、WeChat、Threads 精選貼文或政府公開資料庫之外部連結。當您點選跳轉至該等第三方平台時，第三方平台可能依其自身之 Cookie 政策設置相關追蹤標籤，建議您查閱各該服務之政策說明。",
        ],
      },
      {
        title: "如何管理與停用 Cookie",
        paragraphs: [
          "您可以透過網頁瀏覽器（如 Google Chrome、Apple Safari、Microsoft Edge、Mozilla Firefox 等）之設定隨時檢查、封鎖或刪除已儲存之 Cookie：",
        ],
        items: [
          "從瀏覽器設定中清除歷史瀏覽紀錄與所有 Cookie 快取。",
          "設定瀏覽器在收到 Cookie 時跳出提示，或開啟無痕/私密瀏覽模式。",
          "請注意：若您選擇完全停用必要性 Cookie 或本機儲存，可能導致部分進階試算工具或身分驗證無法正常運作，但一般公開圖文內容仍可正常閱覽。",
        ],
      },
      {
        title: "政策更新與聯絡我們",
        paragraphs: [
          "本 Cookie 政策可能隨網站功能擴充或法規要求不定期修訂，修訂後將於本頁公告並更新生效日期。如有任何疑問，歡迎隨時與我們聯繫。",
        ],
      },
    ],
  },
};

const POLICY_LINKS: Array<{ id: PolicyPageId; label: string }> = [
  { id: "site-policy", label: "網站使用條款" },
  { id: "privacy", label: "隱私權政策" },
  { id: "disclaimer", label: "資訊免責聲明" },
  { id: "cookie", label: "Cookie 政策" },
];

export function PolicyPage({ page, onBack }: { page: PolicyPageId; onBack: () => void }) {
  const content = POLICY_CONTENT[page];

  return (
    <div className="min-h-screen bg-[#F5F8F6] text-[#1A2A22]">
      <header className="border-b border-[#DDE3DF] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="font-sans text-sm font-semibold text-[#1A2A22] transition-colors hover:text-[#009670]"
          >
            <span aria-hidden="true">←</span> 返回網站
          </button>
          <button type="button" onClick={onBack} aria-label="返回 LINUS 住好日">
            <img src="/logo-text.svg" alt="LINUS 住好日" className="h-5 w-auto sm:h-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="border-l-2 border-[#009670] pl-5 sm:pl-7">
          <p className="font-jost text-[11px] font-semibold tracking-[0.18em] text-[#66736C]">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[0.03em] sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-3xl font-sans text-[15px] leading-8 text-[#3F5147] sm:text-base">
            {content.introduction}
          </p>
        </div>

        {/* 政策快速切換 Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-[#DDE3DF] pb-3">
          {POLICY_LINKS.map(link => {
            const isActive = page === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`px-3.5 py-1.5 font-sans text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#1A2A22] text-white shadow-sm"
                    : "border border-[#DDE3DF] bg-white text-[#3F5147] hover:border-[#009670] hover:text-[#009670]"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="mt-8 border border-[#DDE3DF] bg-white px-5 sm:px-9">
          {content.sections.map((section, index) => (
            <section
              key={section.title}
              className={`py-7 sm:py-9 ${index > 0 ? "border-t border-[#DDE3DF]" : ""}`}
            >
              <div className="grid gap-4 sm:grid-cols-[3rem_1fr] sm:gap-5">
                <span className="font-jost text-xs font-semibold tracking-[0.12em] text-[#009670]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold tracking-[0.02em]">
                    {section.title}
                  </h2>
                  {section.paragraphs?.map(paragraph => (
                    <p key={paragraph} className="mt-3 font-sans text-[14px] leading-7 text-[#3F5147] sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="mt-3 space-y-2.5 font-sans text-[14px] leading-7 text-[#3F5147] sm:text-[15px]">
                      {section.items.map(item => (
                        <li key={item} className="grid grid-cols-[0.7rem_1fr] gap-2">
                          <span className="mt-[0.68rem] h-1.5 w-1.5 bg-[#D7A64A]" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-5 text-right font-sans text-xs text-[#8A9590]">最後更新：{content.updatedAt}</p>
      </main>

      <footer className="border-t border-[#1A2A22] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
          <p className="font-jost text-[10px] tracking-[0.08em] text-[#8A9590]">
            © 2026 LINUS 住好日 · CHANG CHIN WEI（Linus・@linus3524）· ALL RIGHTS RESERVED
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-sans text-xs font-medium text-[#3F5147]" aria-label="政策頁面">
            {POLICY_LINKS.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={page === link.id ? "page" : undefined}
                className={page === link.id ? "font-semibold text-[#009670]" : "transition-colors hover:text-[#009670]"}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
