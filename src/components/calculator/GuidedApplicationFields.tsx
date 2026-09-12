import type { CalculatorViewModel } from "../../hooks/useCalculatorController";

type Props = Pick<CalculatorViewModel, "setGuidedApplicationChannel" | "guidedApplicationChannel" | "guidedVisaType">;
export function GuidedApplicationFields({ setGuidedApplicationChannel, guidedApplicationChannel, guidedVisaType }: Props) {
  return (<><fieldset>
          <legend className="text-xs font-bold text-zinc-700">希望審查方式</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2 font-sans">
            <button
              type="button"
              onClick={() => setGuidedApplicationChannel("domestic")}
              className={`flex min-h-12 flex-col items-center justify-center border px-3 py-2 text-center transition-all cursor-pointer ${guidedApplicationChannel === "domestic"
                  ? "border-[#007D5A] bg-[#00A174] text-white shadow-xs"
                  : "border-[#D4DDD8] bg-white text-zinc-700 hover:border-[#7DBEAA] hover:bg-[#F3FAF7]"
                }`}
            >
              <span className="text-xs font-bold">日本境內審查</span>
              <span className={`text-[9px] mt-0.5 ${guidedApplicationChannel === "domestic" ? "text-white/80" : "text-zinc-400"}`}>
                已在日 · 可看房／房源選擇較多
              </span>
            </button>
            <button
              type="button"
              onClick={() => setGuidedApplicationChannel("overseas")}
              className={`flex min-h-12 flex-col items-center justify-center border px-3 py-2 text-center transition-all cursor-pointer ${guidedApplicationChannel === "overseas"
                  ? "border-[#007D5A] bg-[#00A174] text-white shadow-xs"
                  : "border-[#D4DDD8] bg-white text-zinc-700 hover:border-[#7DBEAA] hover:bg-[#F3FAF7]"
                }`}
            >
              <span className="text-xs font-bold">海外跨國審查</span>
              <span className={`text-[9px] mt-0.5 ${guidedApplicationChannel === "overseas" ? "text-white/80" : "text-zinc-400"}`}>
                人在海外 · 限支援海審／遠端簽約
              </span>
            </button>
          </div>
          {guidedApplicationChannel === "overseas" && (
            <div className="mt-2 border-l-4 border-[#007D5A] bg-[#F5F8F6] p-2.5 text-[10px] leading-relaxed text-[#1A2A22]">
              <strong className="text-[#007D5A]">Linus 實務提醒：</strong>
              {!guidedVisaType ? (
                <span>人在海外申請租屋時，管理公司需先確認在留資格種類才能判定受理審查；建議先於上方選擇您的身分／簽證種類。</span>
              ) : guidedVisaType.includes("打工度假") ? (
                <span>打工度假簽證期限多為 1 年，走海外審查通常嚴格要求租金 12～15 個月以上之存款餘額證明，且強烈建議等物件審查通過後再行訂購機票。</span>
              ) : guidedVisaType.includes("留學") ? (
                <span>留學生海外審查需備妥入學許可書、在留資格認定證明書（COE）與經費支付人財力證明，建議提早由顧問協助鎖定學生友善物件。</span>
              ) : guidedVisaType.includes("日本籍") || guidedVisaType.includes("永住") ? (
                <span>具備日本籍或永住資格，審查不受在留資格限制；海外申請主要需配合管理公司之線上 IT 重說與跨國支付初期費用手續。</span>
              ) : (
                <span>人在海外需挑選支援「線上 IT 重說、接受 COE 審查、海外匯款初期費用」之管理公司。可申請房源相對受限，建議由顧問直接協助篩選可海審物件。</span>
              )}
            </div>
          )}
        </fieldset></>);
}
