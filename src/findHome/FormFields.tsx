import {
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import { linusContact } from "../data/rentGuideData";
import { trackAction } from "../lib/trackView";
import {
  CONTACT_CHANNEL_OPTIONS,
  CONTACT_PLACEHOLDER,
  CONTACT_TIME_OPTIONS,
  LIMITS,
  type FieldErrors,
  type Option,
} from "../lib/findHome/schema";
import type { FindHomeFormState } from "../lib/findHome/draft";
export const LINE_URL = `https://line.me/ti/p/~${linusContact.lineId}`;
const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
export function Field({
  label,
  optional,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div
      className="space-y-2"
      id={`field-${id}`}
      data-error={error ? "true" : undefined}
    >
      <p className="text-[14px] font-bold text-[#1A2A22]">
        {label}
        {optional && (
          <span className="ml-1 text-[12px] font-normal text-[#66736C]">
            （選填）
          </span>
        )}
      </p>
      {children}
      {hint && !error && (
        <p className="text-[12px] leading-relaxed text-[#66736C]">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] font-bold text-[#B42318]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Chips({
  options,
  selected,
  onToggle,
  disabled,
}: {
  options: readonly Option[];
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: (id: string) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            disabled={disabled?.(option.id)}
            onClick={() => onToggle(option.id)}
            className={`min-h-10 border px-3.5 text-[13px] transition-colors disabled:opacity-40 ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF] bg-white text-[#3F5147] hover:border-[#00A174]"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function OptionList({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-2" role="radiogroup">
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.id)}
            className={`flex min-h-11 items-center gap-3 border px-3.5 text-left text-[14px] transition-colors ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#1A2A22]" : "border-[#DDE3DF] bg-white text-[#3F5147] hover:border-[#00A174]"}`}
          >
            <span
              className={`h-3.5 w-3.5 shrink-0 border ${on ? "border-[4px] border-[#00A174]" : "border-[#B7C0BB]"}`}
              aria-hidden="true"
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const inputClass =
  "h-11 w-full border border-[#C9D2CD] bg-white px-3 text-[15px] text-[#1A2A22] placeholder:text-[#9AA59F] focus:border-[#00A174] focus:outline-none";

export function ManInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  maxDigits = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
  id: string;
  maxDigits?: number;
}) {
  return (
    <label
      className="flex h-11 items-center border border-[#C9D2CD] bg-white focus-within:border-[#00A174]"
      htmlFor={id}
    >
      {label && (
        <span className="shrink-0 pl-3 text-[12px] text-[#66736C]">
          {label}
        </span>
      )}
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/[^\d.]/g, "").slice(0, maxDigits))
        }
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-right font-jost text-[16px] text-[#1A2A22] placeholder:text-[#9AA59F] focus:outline-none"
      />
      <span className="shrink-0 pr-3 text-[12px] text-[#66736C]">萬円</span>
    </label>
  );
}

export function SelectBox({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none border border-[#C9D2CD] bg-white pl-3 pr-9 text-[15px] text-[#1A2A22] focus:border-[#00A174] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736C]"
        aria-hidden="true"
      />
    </div>
  );
}

export function LineButton({
  label = "點我加 LINE 好友",
  small,
}: {
  label?: string;
  small?: boolean;
}) {
  return (
    <a
      href={LINE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAction("line-add")}
      className={`flex items-center justify-center bg-[#00A174] font-bold text-white transition-colors hover:bg-[#008F67] ${small ? "min-h-10 px-4 text-[13px]" : "min-h-12 px-5 text-[15px]"}`}
    >
      {label}
    </a>
  );
}

/** 複製按鈕。瀏覽器擋住複製時，改顯示文字框讓客人長按複製，不會「按了沒反應」。 */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  return (
    <div
      className={`flex flex-col gap-2 ${state === "manual" ? "w-full basis-full" : ""}`}
    >
      <button
        type="button"
        onClick={async () => {
          if (await copyToClipboard(text)) {
            setState("copied");
            window.setTimeout(() => setState("idle"), 2000);
          } else {
            setState("manual");
          }
        }}
        className="flex min-h-10 items-center justify-center gap-1.5 self-start border border-[#00A174] bg-white px-4 text-[13px] font-bold text-[#00A174]"
      >
        {state === "copied" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {state === "copied" ? "已複製" : label}
      </button>
      {state === "manual" && (
        <div className="space-y-1.5 text-left">
          <p className="text-[12px] text-[#854D0E]">
            這個瀏覽器不允許自動複製，請長按下面的文字，選「全選」再「拷貝」。
          </p>
          <textarea
            readOnly
            value={text}
            rows={Math.min(10, text.split("\n").length + 1)}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full border border-[#C9D2CD] bg-[#FAFCFB] p-2.5 text-[13px] leading-relaxed text-[#1A2A22]"
            aria-label="要複製的文字"
          />
        </div>
      )}
    </div>
  );
}

type ContactForm = Pick<
  FindHomeFormState,
  "nickname" | "contact" | "contactTimes" | "privacyAck"
>;
export function ContactStep<T extends ContactForm>({
  form,
  setForm,
  errors,
  honeypot,
  setHoneypot,
  submitError,
  summary,
}: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  errors: FieldErrors;
  honeypot: string;
  setHoneypot: (v: string) => void;
  submitError: string | null;
  summary: string;
}) {
  return (
    <>
      <Field
        id="nickname"
        label="怎麼稱呼你？"
        hint="用綽號也可以。"
        error={errors.nickname}
      >
        <input
          className={inputClass}
          maxLength={LIMITS.nickname}
          value={form.nickname}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, nickname: e.target.value }))
          }
          placeholder="例：小林"
          autoComplete="nickname"
        />
      </Field>
      <Field
        id="contact"
        label="用什麼聯絡你？"
        hint="選一種就好。"
        error={errors.contact}
      >
        <div
          className="grid grid-cols-3 border border-[#DDE3DF]"
          role="tablist"
          aria-label="聯絡方式"
        >
          {CONTACT_CHANNEL_OPTIONS.map((option, index) => {
            const on = form.contact.channel === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    contact: { channel: option.id, value: "" },
                  }))
                }
                className={`min-h-10 text-[12px] sm:text-[13px] ${index ? "border-l border-[#DDE3DF]" : ""} ${on ? "bg-[#F0FAF6] font-bold text-[#00A174]" : "text-[#3F5147]"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <input
          className={inputClass}
          value={form.contact.value}
          maxLength={LIMITS.contact}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              contact: { ...prev.contact, value: e.target.value },
            }))
          }
          placeholder={CONTACT_PLACEHOLDER[form.contact.channel]}
          inputMode={
            form.contact.channel === "email"
              ? "email"
              : form.contact.channel === "whatsapp"
                ? "tel"
                : "text"
          }
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {form.contact.channel === "line" && (
          <p className="text-[12px] leading-relaxed text-[#66736C]">
            LINE ID 在「主頁 → 設定 → 個人檔案」。如果你關掉了「允許利用 ID
            加入好友」，Linus 會搜尋不到，建議送出後直接加 Linus 的 LINE。
          </p>
        )}
      </Field>
      <Field id="contactTimes" label="方便聯絡的時間" optional>
        <Chips
          options={CONTACT_TIME_OPTIONS}
          selected={form.contactTimes}
          onToggle={(id) =>
            setForm((prev) => ({
              ...prev,
              contactTimes: toggle(prev.contactTimes, id),
            }))
          }
        />
      </Field>

      {/* 給機器人填的欄位：真人看不到，有值就當成機器人 */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label>
          網站
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            name="website"
          />
        </label>
      </div>

      <div className="space-y-3 border-t border-[#DDE3DF] pt-5">
        <p className="bg-[#F0FAF6] px-3.5 py-3 text-[12px] leading-relaxed text-[#3F5147]">
          聯絡方式只用來和你聯絡找房。<b>聯絡上之後，系統會刪除你的聯絡方式</b>
          ，只保留稱呼和找房需求；送出 30 天內沒聯絡上，也會自動刪除。
        </p>
        <div id="field-privacyAck">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed">
            <input
              type="checkbox"
              checked={form.privacyAck}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, privacyAck: e.target.checked }))
              }
              className="mt-1 h-4 w-4 shrink-0 accent-[#00A174]"
            />
            <span>
              我已閱讀
              <a
                href="/#privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#00A174] underline"
              >
                隱私權政策
              </a>
              ，同意 Linus 用以上資料聯絡我找房。
            </span>
          </label>
          {errors.privacyAck && (
            <p
              className="mt-1.5 text-[12px] font-bold text-[#B42318]"
              role="alert"
            >
              {errors.privacyAck}
            </p>
          )}
        </div>
      </div>

      {submitError && (
        <div
          className="space-y-3 border border-[#FDE047] bg-[#FEF9C3] p-4 text-[13px] text-[#854D0E]"
          role="alert"
        >
          <p>
            <b>{submitError}</b>
            你填的內容都還在，可以稍後再按一次送出；或是複製內容，直接用 LINE
            傳給 Linus。
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={summary} label="複製填好的內容" />
            <LineButton small label="加 LINE 傳給 Linus" />
          </div>
        </div>
      )}
    </>
  );
}
