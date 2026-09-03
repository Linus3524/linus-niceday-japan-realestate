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
    updatedAt: "2026 年 7 月 26 日",
    eyebrow: "SITE POLICY",
    title: "網站使用條款",
    introduction:
      "歡迎使用 LINUS 住好日。本網站以日本租屋、買房與在日生活的實務資訊為主，使用本站即表示您理解並同意以下規範。",
    sections: [
      {
        title: "網站內容與使用範圍",
        paragraphs: [
          "本站提供知識文章、費用試算、行情整理與 AI 顧問等功能，協助使用者建立初步方向。內容可能隨法規、市場與服務調整而更新。",
        ],
      },
      {
        title: "著作權與合理使用",
        paragraphs: [
          "除另有標示外，本站原創文字、資料整理、估算邏輯、版面設計與品牌視覺之著作權，均歸 CHANG CHIN WEI（Linus・@linus3524）所有，並以「LINUS 住好日」品牌發布及管理。第三方名稱、商標與資料之權利仍屬原權利人所有。",
        ],
        items: [
          "可供個人閱讀、收藏，或在清楚標示來源並附上本站連結的前提下合理引用少量內容。",
          "未經事前同意，不得大量轉載、改寫重製、商業使用、建立競業資料庫，或將本站內容作為 AI 訓練與生成素材。",
        ],
      },
      {
        title: "禁止行為",
        items: [
          "干擾網站運作、規避使用次數限制、批次抓取內容，或嘗試取得未公開資料。",
          "利用 AI 顧問處理與日本不動產及在日生活無關的內容，或以提示注入等方式繞過服務限制。",
          "冒用他人身分、侵害第三方權利，或從事違法及不當行為。",
        ],
      },
      {
        title: "外部服務與條款調整",
        paragraphs: [
          "本站可能連結至 LINE、社群平台及其他第三方網站，其內容與資料處理由各服務自行負責。本站得因服務、法規或安全需求調整本條款，更新後將公布於本頁。",
        ],
      },
    ],
  },
  privacy: {
    updatedAt: "2026 年 7 月 26 日",
    eyebrow: "PRIVACY POLICY",
    title: "隱私權政策",
    introduction:
      "我們只在提供網站功能、維護服務安全與了解整體使用狀況所需的範圍內處理資料，並盡量避免蒐集不必要的個人資訊。",
    sections: [
      {
        title: "可能處理的資料",
        items: [
          "訪客識別碼 Cookie：用於辨識不重複訪客與顯示累計瀏覽人次，本身不包含姓名或聯絡方式。",
          "AI 顧問輸入內容與對話脈絡：用於產生本次回答；請勿輸入護照號碼、在留卡號、金融帳戶或其他敏感資料。",
          "IP 位址、請求時間與使用次數：用於防止濫用、維護安全及執行服務頻率限制。",
          "瀏覽器內的使用紀錄：部分頻率限制會在您的裝置中暫存必要時間資訊。",
        ],
      },
      {
        title: "使用目的",
        items: [
          "提供訪客統計、費用試算、AI 顧問與網站必要功能。",
          "排除異常請求、防止 API 濫用並改善服務穩定性。",
          "回覆使用者主動透過 LINE、WeChat 或電子郵件提出的諮詢。",
        ],
      },
      {
        title: "第三方服務",
        paragraphs: [
          "AI 顧問內容會送至 Google Gemini 服務產生回答；若您點選 LINE、WeChat、電子郵件或社群連結，後續資料處理則適用各平台的隱私規範。",
        ],
      },
      {
        title: "保存與您的選擇",
        paragraphs: [
          "訪客識別資料會在統計服務所需期間保存，識別 Cookie 最長約一年。您可在瀏覽器中清除 Cookie 與網站儲存資料，但可能影響訪客辨識或使用次數判定。",
          "本政策如因功能或法規調整而更新，將以本頁公布的版本為準。如對資料使用有疑問，可由網站的「聯絡 Linus」頁面與我聯繫。",
        ],
      },
    ],
  },
  disclaimer: {
    updatedAt: "2026 年 9 月 3 日",
    eyebrow: "DISCLAIMER",
    title: "資訊免責聲明",
    introduction:
      "本站希望把複雜的日本不動產資訊說得更清楚，但網頁內容不能取代針對個案提供的正式專業意見。",
    sections: [
      {
        title: "一般資訊性質",
        paragraphs: [
          "本站文章、問答與 AI 顧問回覆僅供一般資訊與初步規劃參考，不構成法律、稅務、金融、融資、簽證、投資或不動產鑑價建議。",
        ],
      },
      {
        title: "試算與市場資料",
        paragraphs: [
          "租金、購屋費用、初期費用及房源供給等結果，是依公開資訊、本站資料與固定模型估算，不是即時物件報價、正式鑑價或成交保證。實際金額與空室狀況應以當期募集資料、契約及個案確認為準。",
        ],
      },
      {
        title: "租金行情的資料來源",
        paragraphs: [
          "租金行情取自 At Home 公開家賃相場的刊登資料，以行政區與格局分類，採直近 3 個月刊登物件的代表值。行情地圖標題會標示該批資料的快照日期，非即時查詢結果。部分格局因樣本不足，會沿用前一版推估值並於資料中註記。",
          "此為刊登階段的募集條件，非實際成交金額；各筆刊登是否計入管理費、共益費亦不一致。同一行政區內，屋齡、車站距離、樓層與座向均會造成顯著價差。實際租金請以個別物件的當期募集資料與契約條件為準。",
        ],
      },
      {
        title: "買房行情的資料來源",
        paragraphs: [
          "成交價資料取自日本國土交通省「不動產資訊資料庫」（不動産情報ライブラリ）公開 API，以行政區與格局分類，採近 4 個季度的成交價中位數；該分類成交筆數不足時，改以近 8 個季度計算。這是政府登錄的實際成交紀錄，非刊登開價。",
          "部分行政區與格局的組合成交筆數過少，無法取得具代表性的中位數，則改以當地租金水準與假設收益率回推總價概算，畫面會另行標示為概算值。",
          "兩種數值均為區域層級的參考基準，不等同於個別物件的鑑價。實際成交價仍受面積、樓層、座向、屋齡、管理與修繕狀況、土地權利、災害風險及交易背景影響，同一棟建物的不同戶亦可能有明顯差距。實際交易請以物件正式資料、現場確認及專業評估為準。",
        ],
      },
      {
        title: "AI 回覆的限制",
        paragraphs: [
          "AI 可能誤解輸入、遺漏條件或產生不完整資訊。涉及重要決策時，請以政府機關、金融機構、管理公司、契約文件及合格專業人士的最新正式資訊為準。",
        ],
      },
      {
        title: "審查與交易結果",
        paragraphs: [
          "入居審查、貸款、簽證、許可、價格、收益與交易完成與否，均由個別機構、房東、市場及契約條件決定，本站無法保證特定結果。使用外部網站或服務所產生的風險，亦應依其條款個別判斷。",
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
