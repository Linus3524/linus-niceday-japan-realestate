import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { UsageDashboard } from "../UsageDashboard";
import { LeadsAdmin } from "./LeadsAdmin";
import { ApplicationsAdmin } from "./ApplicationsAdmin";

/**
 * 後台外框：#admin（網站統計）、#admin/leads（客戶需求）與 #admin/apply（租屋申請資料）。
 * 整個後台用 React.lazy 載入（見 App.tsx），一般訪客不會下載這些程式碼。
 */

function parseAdminHash(hash = window.location.hash) {
  const match = hash.match(/^#admin\/leads(?:\/([A-HJ-NP-Z2-9]{16}))?$/);
  if (match) return { view: "leads" as const, leadId: match[1] ?? null, notice: null };
  // #admin/apply?drive=ok 是 Google Drive 授權完成後導回來的。
  const apply = hash.match(/^#admin\/apply(?:\/([A-HJ-NP-Z2-9]{16}))?(?:\?drive=(\w+))?$/);
  if (apply) {
    const drive = apply[2];
    const notice = drive === "ok" ? "Google Drive 已連結，客人上傳的文件會存進你的雲端硬碟。"
      : drive === "failed" ? "Google Drive 連結失敗，請再按一次「連結 Google Drive」。"
      : drive === "cancelled" ? "已取消連結 Google Drive。" : null;
    return { view: "apply" as const, leadId: apply[1] ?? null, notice };
  }
  return { view: "stats" as const, leadId: null, notice: null };
}

export function isAdminHash(hash = window.location.hash) {
  return hash === "#admin" || hash.startsWith("#admin/");
}

export default function AdminShell({ onBack }: { onBack: () => void }) {
  const [route, setRoute] = useState(() => parseAdminHash());
  useEffect(() => {
    const update = () => setRoute(parseAdminHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const go = (hash: string) => { window.location.hash = hash; };

  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]">
      <nav className="sticky top-0 z-20 border-b border-[#DDE3DF] bg-white" aria-label="後台分頁">
        <div className="mx-auto flex max-w-[1080px] items-stretch px-4 sm:px-6 lg:px-8">
          {([["stats", "網站統計", "admin"], ["leads", "客戶需求", "admin/leads"], ["apply", "申請資料", "admin/apply"]] as const).map(([view, label, hash]) => (
            <button
              key={view}
              type="button"
              onClick={() => go(hash)}
              aria-current={route.view === view ? "page" : undefined}
              className={`h-11 px-4 text-sm ${route.view === view ? "font-bold text-[#00A174] shadow-[inset_0_-2px_0_#00A174]" : "text-[#66736C] hover:text-[#1A2A22]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
      {route.view === "stats" ? (
        <UsageDashboard onBack={onBack} />
      ) : route.view === "apply" ? (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1080px] space-y-5">
            {!route.leadId && (
              <div>
                <button type="button" onClick={onBack} className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#3F5147] hover:text-[#00A174]"><ArrowLeft className="h-3.5 w-3.5" /> 返回 LINUS 住好日</button>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">申請資料</h1>
              </div>
            )}
            <ApplicationsAdmin appId={route.leadId} notice={route.notice} onOpen={id => go(`admin/apply/${id}`)} onBackToList={() => go("admin/apply")} />
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1080px] space-y-5">
            {!route.leadId && (
              <div>
                <button type="button" onClick={onBack} className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#3F5147] hover:text-[#00A174]"><ArrowLeft className="h-3.5 w-3.5" /> 返回 LINUS 住好日</button>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">客戶需求</h1>
              </div>
            )}
            <LeadsAdmin leadId={route.leadId} onOpen={id => go(`admin/leads/${id}`)} onBackToList={() => go("admin/leads")} />
          </div>
        </div>
      )}
    </div>
  );
}
