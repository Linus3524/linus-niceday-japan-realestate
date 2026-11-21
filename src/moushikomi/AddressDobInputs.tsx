import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { addrRegion, type FieldDef, type FormValues } from "../lib/moushikomi/schema";

/**
 * 申請資料表單的兩種輸入：
 * - DobInput：出生年月日用「年／月／日」三格數字輸入，叫出數字鍵盤、填滿自動跳下一格，
 *   不用在日曆選單裡往回捲幾十年。
 * - AddressInput：地址可切換日本／海外。日本照一般日文表單的格式分行：郵遞區號 → 自動帶出
 *   都道府縣、市區町村、町名，客人補番地與建物名；海外就是一格自由填寫。
 *   郵遞區號查詢直接從客人瀏覽器呼叫 zipcloud（免費、允許跨網域），不經過網站主機。
 */

const box = "h-11 w-full border bg-white px-3 text-[15px] text-[#1A2A22] placeholder:text-[#9AA59F] focus:border-[#00A174] focus:outline-none disabled:bg-[#F5F8F6] disabled:text-[#9AA59F]";

export function DobInput({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [y = "", m = "", d = ""] = value ? value.split("-") : [];
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const emit = (ny: string, nm: string, nd: string) => onChange(ny || nm || nd ? `${ny}-${nm}-${nd}` : "");
  const digits = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max);
  const border = invalid ? "border-[#B42318] bg-[#FEF3F2]" : "border-[#C9D2CD]";

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="出生年月日">
      <input id={`in-${id}`} ref={yearRef} value={y} inputMode="numeric" autoComplete="bday-year" placeholder="1995" aria-label="出生年（西元）"
        className={`${box} ${border} w-[5.5rem] text-center font-jost`}
        onChange={e => { const ny = digits(e.target.value, 4); emit(ny, m, d); if (ny.length === 4) monthRef.current?.focus(); }} />
      <span className="text-[14px] text-[#3F5147]">年</span>
      <input ref={monthRef} value={m} inputMode="numeric" autoComplete="bday-month" placeholder="6" aria-label="出生月"
        className={`${box} ${border} w-[3.75rem] text-center font-jost`}
        onKeyDown={e => { if (e.key === "Backspace" && !m) yearRef.current?.focus(); }}
        onChange={e => { const nm = digits(e.target.value, 2); emit(y, nm, d); if (nm.length === 2 || (nm.length === 1 && Number(nm) > 1)) dayRef.current?.focus(); }} />
      <span className="text-[14px] text-[#3F5147]">月</span>
      <input ref={dayRef} value={d} inputMode="numeric" autoComplete="bday-day" placeholder="1" aria-label="出生日"
        className={`${box} ${border} w-[3.75rem] text-center font-jost`}
        onKeyDown={e => { if (e.key === "Backspace" && !d) monthRef.current?.focus(); }}
        onChange={e => emit(y, m, digits(e.target.value, 2))} />
      <span className="text-[14px] text-[#3F5147]">日</span>
    </div>
  );
}

type ZipState = { status: "idle" | "loading" | "found" | "notfound" | "error"; zip?: string };

export function AddressInput({ field, values, disabled, onValue, invalid }: {
  field: FieldDef; values: FormValues; disabled?: boolean; invalid?: boolean;
  onValue: (id: string, value: string) => void;
}) {
  const id = field.id;
  const region = addrRegion(field, values);
  const get = (key: string) => values[`${id}${key}`] ?? "";
  const set = (key: string, v: string) => onValue(`${id}${key}`, v);
  const [zip, setZip] = useState<ZipState>({ status: "idle" });
  const lastAutoTown = useRef("");
  const townRef = useRef<HTMLInputElement>(null);
  const border = invalid ? "border-[#B42318]" : "border-[#C9D2CD]";

  async function lookup(digits: string) {
    setZip({ status: "loading", zip: digits });
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`, { signal: AbortSignal.timeout(6000) });
      const body = await response.json();
      const hit = body?.results?.[0];
      if (!hit) { setZip({ status: "notfound", zip: digits }); return; }
      set("Pref", hit.address1 || "");
      set("City", hit.address2 || "");
      // 町名：客人還沒自己改過才覆蓋，避免把已經打好的番地洗掉。
      const town = get("Town");
      if (!town || town === lastAutoTown.current) {
        set("Town", hit.address3 || "");
        lastAutoTown.current = hit.address3 || "";
      }
      setZip({ status: "found", zip: digits });
      requestAnimationFrame(() => { const el = townRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });
    } catch {
      setZip({ status: "error", zip: digits });
    }
  }

  const tab = (value: "jp" | "overseas", label: string) => (
    <button type="button" role="radio" aria-checked={region === value} disabled={disabled} onClick={() => set("Region", value)}
      className={`min-h-9 flex-1 border px-3 text-[13px] ${region === value ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#1A2A22]" : "border-[#DDE3DF] bg-white text-[#66736C]"} disabled:opacity-50`}>
      {label}
    </button>
  );

  const row = (label: string, control: React.ReactNode, optional?: boolean) => (
    <div className="grid grid-cols-[5.5em_minmax(0,1fr)] items-center gap-2 border-t border-[#DDE3DF] px-3 py-2 first:border-t-0">
      <span className="text-[12px] font-bold leading-tight text-[#3F5147]">{label}{optional && <span className="block font-normal text-[#66736C]">（選填）</span>}</span>
      {control}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2" role="radiogroup" aria-label={`${field.label}在哪裡`}>
        {tab("jp", "日本")}
        {tab("overseas", "海外")}
      </div>
      {region === "overseas" ? (
        <textarea id={`in-${id}`} value={get("Overseas")} disabled={disabled} rows={2} maxLength={300}
          placeholder="例：台北市大安區忠孝東路四段 1 號 5 樓"
          onChange={e => set("Overseas", e.target.value)}
          className={`w-full border ${border} bg-white px-3 py-2.5 text-[15px] placeholder:text-[#9AA59F] focus:border-[#00A174] focus:outline-none disabled:bg-[#F5F8F6]`} />
      ) : (
        <div className={`border ${border} bg-white`}>
          {row("郵遞區號", (
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[#3F5147]">〒</span>
              <input id={`in-${id}`} value={get("Zip")} disabled={disabled} inputMode="numeric" autoComplete="postal-code" placeholder="1600023" maxLength={8}
                aria-label="郵遞區號（7 位數字）"
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d-]/g, "");
                  set("Zip", raw);
                  const digits = raw.replace(/\D/g, "");
                  if (digits.length === 7 && digits !== zip.zip) lookup(digits);
                }}
                className={`${box} border-[#C9D2CD] w-32 font-jost`} />
              <span className="min-w-0 text-[12px] text-[#66736C]" role="status">
                {zip.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : zip.status === "found" ? "已帶入地址" : zip.status === "notfound" ? "查無此郵遞區號，請直接填下面" : zip.status === "error" ? "暫時查不到，請直接填下面" : "填 7 位數字會自動帶出地址"}
              </span>
            </div>
          ))}
          {row("都道府縣", <input value={get("Pref")} disabled={disabled} autoComplete="address-level1" placeholder="東京都" onChange={e => set("Pref", e.target.value)} className={`${box} border-[#C9D2CD]`} />)}
          {row("市區町村", <input value={get("City")} disabled={disabled} autoComplete="address-level2" placeholder="新宿区" onChange={e => set("City", e.target.value)} className={`${box} border-[#C9D2CD]`} />)}
          {row("町名・番地", <input ref={townRef} value={get("Town")} disabled={disabled} autoComplete="address-line1" placeholder="西新宿 1-2-3" onChange={e => set("Town", e.target.value)} className={`${box} border-[#C9D2CD]`} />)}
          {row("建物名・房號", <input value={get("Bldg")} disabled={disabled} autoComplete="address-line2" placeholder="○○マンション 101（獨棟填「一戶建」）" onChange={e => set("Bldg", e.target.value)} className={`${box} border-[#C9D2CD]`} />)}
        </div>
      )}
    </div>
  );
}
