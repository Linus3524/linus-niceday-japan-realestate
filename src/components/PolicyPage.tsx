export type PolicyPageId = "site-policy" | "privacy" | "disclaimer";

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
    /** 各頁獨立的更新日期：只改了免責聲明卻讓三頁日期一起跳，
        會讓使用者以為條款也變了，也稀釋了「有更新」這個訊號。 */
    updatedAt: string;
  }
> = {
  "site-policy": {
    updatedAt: "2026 年 9 月 10 日",
    eyebrow: "SITE POLICY",
    title: "網站使用條款",
    introduction:
      "歡迎使用 LINUS 住好日。本網站以日本租屋、買房與在日生活的實務資訊為主，提供實價大數據行情比對、圖紙 AI 辨識健康檢查與專業試算功能。使用本站即表示您理解並同意以下規範。",
    sections: [
      {
        title: "網站內容與使用範圍",
        paragraphs: [
          "本站提供知識文章、費用試算、實價登錄成交行情整理、市場在售開價比對、圖紙（マイソク／販売図面）AI 辨識健康檢查與 AI 諮詢等功能，協助使用者在台日跨國決策中建立客觀方向。各項內容可能隨日本法規、稅制、市場實況與服務演進而動態更新。",
        ],
      },
      {
        title: "圖紙分析功能之使用規範",
        paragraphs: [
          "本站提供之圖紙辨識與健康檢查功能，僅供個人自住購屋規劃、租賃評估與合法研究使用。",
        ],
        items: [
          "使用者保證所上傳之圖紙或文件未侵害他人著作權、商業秘密或違反委託契約規範。",
          "禁止利用腳本、爬蟲或任何自動化工具惡意大量批次上傳圖紙，或進行任何意圖癱瘓、耗損本站運算與 API 資源之行為。",
          "AI 解析產生之大樓體質診斷、行情落點與稅費試算，僅供個人決策輔助，未經本站書面授權，不得轉載用於商業收費諮詢或競業資料庫建置。",
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
          "未經事前書面同意，不得大量轉載、改寫重製、商業使用、建立競業資料庫，或將本站內容作為 AI 訓練與生成素材。",
        ],
      },
      {
        title: "禁止行為",
        items: [
          "干擾網站運作、規避使用次數限制、批次抓取內容，或嘗試取得未公開資料與系統金鑰。",
          "利用 AI 顧問或圖紙辨識處理與日本不動產及在日生活無關的內容，或以提示注入（Prompt Injection）等方式繞過服務安全限制。",
          "冒用他人身分、侵害第三方權利，或從事任何違法、不當或損害本站商譽之行為。",
        ],
      },
      {
        title: "外部服務與條款調整",
        paragraphs: [
          "本站可能連結至 LINE、社群平台及其他第三方官方機構網站，其內容與資料處理由各該服務自行負責。本站得因服務擴充、法規修訂或安全維護需求調整本條款，更新後將公布於本頁並標明修訂日期。",
        ],
      },
    ],
  },
  privacy: {
    updatedAt: "2026 年 9 月 10 日",
    eyebrow: "PRIVACY POLICY",
    title: "隱私權政策",
    introduction:
      "我們只在提供網站功能、維護服務安全與了解整體使用狀況所需的必要範圍內處理資料，並嚴格落實資料最小化原則，保護使用者之隱私權益。",
    sections: [
      {
        title: "可能處理的資料範疇",
        items: [
          "使用者上傳之圖紙與文件資料：當您使用圖紙辨識或健康檢查功能時，系統會暫存您所上傳之 PDF 或圖檔，用於執行光學字元辨識（OCR）、格局與條件萃取、大樓體質診斷與買賣/租賃分析。",
          "訪客識別碼 Cookie：用於辨識不重複訪客與顯示累計瀏覽人次，本身不包含姓名、電話或聯絡方式。",
          "AI 顧問輸入內容與對話脈絡：用於即時產生本次回答；請勿主動輸入護照號碼、在留卡號、金融帳戶或敏感個人隱私。",
          "IP 位址、請求時間與呼叫頻率：用於防止惡意攻擊與濫用、維護伺服器安全及執行服務速率限制（Rate Limiting）。",
          "瀏覽器端本機紀錄：部分操作偏好與頻率標記會暫存於您的瀏覽器本機儲存空間（Local Storage / Cookies）。",
        ],
      },
      {
        title: "圖紙上傳資料處理與隱私防護",
        paragraphs: [
          "不動產銷售圖面（マイソク／販売図面）多為日本不動產流通市場之公開或仲介募集文件。若您上傳之圖檔或合約草案中載有特定個人資訊（如原所有權人姓名、現住戶個資、私人聯絡電話或手寫簽名），強烈建議您於上傳前先行塗黑或遮蔽。",
          "本站絕不會利用圖面內之個人資訊進行個人身分比對或建立個人檔案。本站亦絕不將您上傳之圖紙、物件資料或對話紀錄出售、轉讓或出租給任何第三方不動產仲介業者、金融機構或行銷廣告商。",
          "上傳之暫存檔案僅保留於伺服器端完成分析所需之最短時間，系統會依排程定期自動清理暫存快取，確保資料不長期滯留。",
        ],
      },
      {
        title: "使用目的",
        items: [
          "提供不動產圖紙 OCR 解析、格局與持有成本試算、大樓健康診斷與買賣行情落點比對。",
          "提供訪客統計、初期費用試算、AI 顧問與網站各項核心功能。",
          "監控異常流量、排除系統錯誤、防範 API 惡意刷取並提升跨國連線穩定性。",
          "回覆使用者主動透過 LINE、WeChat、社群或電子郵件提出之個案諮詢與回饋。",
        ],
      },
      {
        title: "第三方服務與 AI 資料處理條款",
        paragraphs: [
          "本站之 AI 對話與圖紙多模態解析功能，係透過安全加密連線傳輸至 Google Gemini API 商業服務端點。本站採用 Google Cloud 企業級服務協議，使用者的輸入內容與上傳圖檔絕不會被用於 Google 基礎模型之公開訓練或產品改善。",
          "若您透過本站點選 LINE、WeChat、社群平台或外部政府機構連結，後續之資料處理與互動均適用各該平台獨立之隱私權規範。",
        ],
      },
      {
        title: "保存期間與您的權利選擇",
        paragraphs: [
          "訪客統計資料於服務存續期間妥善保存，識別 Cookie 最長約一年。您可隨時透過瀏覽器設定清除 Cookies 與網站暫存資料，此舉不會影響網站公開資訊之瀏覽，但可能會重設您的操作頻率計算。",
          "本政策將配合本站新增功能、資料來源或台日個人資料保護法令調整而隨時修訂，更新後之版本將於本頁公布。若您對本站之資料處理或隱私政策有任何疑問，歡迎隨時透過「聯絡 Linus」與我們聯繫。",
        ],
      },
    ],
  },
  disclaimer: {
    updatedAt: "2026 年 9 月 10 日",
    eyebrow: "DISCLAIMER",
    title: "資訊免責聲明",
    introduction:
      "本站致力於透過實價大數據、官方査定基準與演算法模型，將複雜的日本不動產市況與交易規則透明化，但網頁所有內容、試算與 AI 診斷均為初步研究與決策輔助性質，不能取代日本法定專業人士針對個案提供之正式專業意見與現場調查。",
    sections: [
      {
        title: "一般資訊與非專業意見性質",
        paragraphs: [
          "本站所有文章、試算工具、圖紙健檢、行情落點與 AI 顧問回覆，僅供一般客觀資訊、購屋租屋方向規劃與個人評估參考，不構成法律、稅務、金融融資、移民簽證、投資回報保證或正式不動產鑑價報告。",
        ],
      },
      {
        title: "買賣實價成交行情的資料來源",
        paragraphs: [
          "中古公寓、透天戶建與土地的成約行情，取自日本國土交通省「不動產資訊資料庫」（不動産情報ライブラリ）官方 API，以都道府縣、行政區、房型格局及屋齡帶進行分層統計，採直近 4 個季度之實際成約單價中位數直接換算本案專有面積。此為日本政府登錄之真實成交紀錄，非仲介刊登開價。",
          "依國土交通省不動產資訊資料庫使用規約，本站正式揭示法定免責聲明：『このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません。』",
          "部分冷門地區或特殊格局因成約樣本較少，統計視窗可能依序往前滑動採計；成約筆數過少時畫面會明確標註警語，提醒使用者中位數易受極值影響。",
        ],
      },
      {
        title: "日本二手公寓價格査定教科書與大數據智庫依據",
        paragraphs: [
          "本站針對個別物件規格之價格影響幅度（包含角部屋、陽台開口部朝向、樓層垂直與最上階、專用景觀露台、私人庭院、土地權利借地權、大樓管理體制、電梯配置等），絕非隨意推估，其計算係依據：",
        ],
        items: [
          "公益財團法人 不動產流通推進中心（前國土交通省轄下之不動産流通近代化センター）所編訂之《中古マンション価格査定マニュアル》（二手公寓價格査定手冊）：此為日本不動產仲介業界唯一官方估價教科書，為三井、住友、東急、野村等各大仲介及銀行採用之官方査定基準。",
          "東京カンテイ（Tokyo Kantei）不動產大數據研究所：引用日本最大公寓大數據資料庫之百萬筆成約特徵價格回歸統計，包含同棟大樓角部屋溢價率（平均 +4.2%）、首都圈南北向成交價差（7%～9%）、車站徒步時間與保值率（リセールバリュー）相關性、百戶以上大規模社區規模效應，以及超高層塔樓住宅（タワーマンション）之規格溢價。",
        ],
      },
      {
        title: "市場在售開價行情之資料來源與校準",
        paragraphs: [
          "本站呈現之「市場同規模在售行情」與「典型開價區間」，係整合日本四大指定流通機構（東日本 / 中部 / 近畿 / 西日本 REINS）定期發布之公開市況 Market Watch（新規登錄開價相對於成約價之市場溢價率），以及 At Home、SUUMO 等公開在售行情快照，依本案實際專有面積、同屋齡帶成約走勢及都會區合理開價天花板動態換算而成。",
          "市場在售開價反映的是賣方當前之掛牌開價（Asking Price），包含賣方利潤與常態議價空間，非最終成交價。本站並列成約實價與在售開價雙軌基準，目的在協助買方客觀辨識賣方開價是否存在超額溢價。",
        ],
      },
      {
        title: "租金相場之資料來源",
        paragraphs: [
          "租金行情資料取自 At Home 全國各行政區與格局之公開家賃相場，採直近 3 個月刊登物件之代表值建立靜態快照。資料反映刊登階段之募集條件，非最終契約租金。同一行政區內，屋齡、站距、樓層、座向及設備均會造成顯著價差，實際租金請以當期招租圖面為準。",
        ],
      },
      {
        title: "圖紙 AI 辨識分析與大樓體質診斷之限制",
        paragraphs: [
          "本站圖紙體檢與健康檢查功能，係由光學字元辨識（OCR）結合大型語言模型進行圖面自動化解析：",
        ],
        items: [
          "辨識精度受限於原始圖紙（マイソク）之掃描解析度、印刷對比、特殊手寫批註或行業縮寫，系統無法保證 100% 無誤讀或無遺漏，使用者應以圖紙原文為最終依據。",
          "非宅建業法之重要事項說明書：大樓修繕積立金充足度評估、長期修繕計畫解析、管理體制檢驗及持分稅費概算，均為演算法模型之初步篩檢，絕不能取代日本宅地建物取引業法第 35 條規定由合格「宅地建物取引士」交付並面對面說明之《重要事項說明書（35條書面）》、管委會總會議事錄、重要事項調査報告書，亦不能取代合格建築士之耐震診斷與建物劣化檢查。",
          "開價合理性對照卡片所載之「優勢條件累計」與「開價溢價比率」，係提供賣方開價是否有客觀條件支撐之剖析，不代表不動產鑑定評價額，亦非任何成交價格或議價成功之保證。",
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
};

const POLICY_LINKS: Array<{ id: PolicyPageId; label: string }> = [
  { id: "site-policy", label: "網站使用條款" },
  { id: "privacy", label: "隱私權政策" },
  { id: "disclaimer", label: "資訊免責聲明" },
];

export function PolicyPage({ page, onBack }: { page: PolicyPageId; onBack: () => void }) {
  const content = POLICY_CONTENT[page];

  return (
    <div className="min-h-screen bg-[#F5F8F6] text-[#1A2A22]">
      <header className="border-b border-[#D4DDD8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="font-sans text-sm font-semibold text-[#31443A] transition-colors hover:text-[#009670]"
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
          <p className="font-jost text-[11px] font-semibold tracking-[0.18em] text-[#68756E]">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[0.03em] sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-3xl font-sans text-[15px] leading-8 text-[#526159] sm:text-base">
            {content.introduction}
          </p>
        </div>

        <div className="mt-10 border border-[#D4DDD8] bg-white px-5 sm:px-9">
          {content.sections.map((section, index) => (
            <section
              key={section.title}
              className={`py-7 sm:py-9 ${index > 0 ? "border-t border-[#E1E6E3]" : ""}`}
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
                    <p key={paragraph} className="mt-3 font-sans text-[14px] leading-7 text-[#536159] sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="mt-3 space-y-2.5 font-sans text-[14px] leading-7 text-[#536159] sm:text-[15px]">
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

        <p className="mt-5 text-right font-sans text-xs text-[#7A847E]">最後更新：{content.updatedAt}</p>
      </main>

      <footer className="border-t border-[#1A2A22] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
          <p className="font-jost text-[10px] tracking-[0.08em] text-[#7A847E]">
            © 2026 LINUS 住好日 · CHANG CHIN WEI（Linus・@linus3524）· ALL RIGHTS RESERVED
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-sans text-xs font-medium text-[#526159]" aria-label="政策頁面">
            {POLICY_LINKS.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={page === link.id ? "page" : undefined}
                className={page === link.id ? "text-[#009670]" : "transition-colors hover:text-[#009670]"}
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
