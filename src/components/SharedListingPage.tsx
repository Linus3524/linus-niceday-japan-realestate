import { ListingHealthCheck } from "./ListingHealthCheck";

/**
 * 圖紙分析結果的分享頁（#listing/XXXXXXXX）。
 *
 * 外框沿用 PolicyPage 的樣式：獨立於主站的分頁流程，上方只有返回與 logo，
 * 收件人不需要先理解整個網站就能看結果。內容直接重用 ListingHealthCheck 的
 * 唯讀模式，分析畫面只維護一份。
 */
export function SharedListingPage({ shareId, onBack }: { shareId: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#F5F8F6] text-[#1A2A22]">
      <header className="border-b border-[#D4DDD8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="font-sans text-sm font-semibold text-[#31443A] transition-colors hover:text-[#009670]"
          >
            <span aria-hidden="true">←</span> 前往 LINUS 住好日
          </button>
          <button type="button" onClick={onBack} aria-label="前往 LINUS 住好日">
            <img src="/logo-text.svg" alt="LINUS 住好日" className="h-5 w-auto sm:h-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <ListingHealthCheck sharedId={shareId} />
        <p className="mt-6 text-center font-sans text-[11px] leading-relaxed text-[#66736C]">
          想分析自己手上的圖紙？到 LINUS 住好日的「費用試算」上傳仲介給的物件圖紙，即可取得同樣的分析。
        </p>
      </main>
    </div>
  );
}
