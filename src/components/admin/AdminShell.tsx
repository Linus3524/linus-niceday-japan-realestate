import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { UsageDashboard } from "../UsageDashboard";
import { LeadsAdmin } from "./LeadsAdmin";

/**
 * 後台外框：#admin（網站統計）與 #admin/leads（客戶需求）。
 * 整個後台用 React.lazy 載入（見 App.tsx），一般訪客不會下載這些程式碼。
 */

function parseAdminHash(hash = window.location.hash) {
  const match = hash.match(/^#admin\/leads(?:\/([A-HJ-NP-Z2-9]{16}))?$/);
  if (match) return { view: "leads" as const, leadId: match[1] ?? null };
  return { view: "stats" as const, leadId: null };
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
          {([["stats", "網站統計", "admin"], ["leads", "客戶需求", "admin/leads"]] as const).map(([view, label, hash]) => (
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
      ) : (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1080px] space-y-5">
            {!route.leadId && (
              <div>
                <button type="button" onClick={onBack} className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#3F5147] hover:text-[#00A174]"><ArrowLeft className="h-3.5 w-3.5" /> 返回 LINUS 住好日</button>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">客戶需求</h1>
                <p className="mt-1 text-xs text-[#66736C]">找房問卷 linusniceday.com/find-home 送出的資料。聯絡上之後請按「已聯絡上」刪除聯絡方式。</p>
              </div>
            )}
            <LeadsAdmin leadId={route.leadId} onOpen={id => go(`admin/leads/${id}`)} onBackToList={() => go("admin/leads")} />
          </div>
        </div>
      )}
    </div>
  );
}
