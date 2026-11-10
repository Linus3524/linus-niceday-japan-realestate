import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import {
  ContactStep,
  Chips,
  Field,
  inputClass,
  LINE_URL,
  OptionList,
} from "./FormFields";
import { SuccessView } from "./FindHomeApp";
import { BuyStepFields } from "./BuyStepFields";
import { QuestionnaireSwitch } from "./QuestionnaireSwitch";
import {
  BUY_FIELD_STEP,
  BUY_ON_MATCH_OPTIONS,
  validateBuyRequirement,
} from "../lib/findHome/buySchema";
import {
  BUY_HOME_DRAFT_KEY,
  emptyBuyForm,
  loadBuyDraft,
  type BuyFormRequirement,
} from "../lib/findHome/buyDraft";
import {
  IF_NOT_FOUND_OPTIONS,
  LIMITS,
  OTHER_AGENTS_OPTIONS,
  validateContactStep,
  validateDecision,
  type FieldErrors,
  type StepId,
} from "../lib/findHome/schema";
import { requirementLines, requirementText } from "../lib/findHome/lead";
import { trackAction } from "../lib/trackView";
const TITLES = {
  1: "個人資訊與購屋計畫",
  2: "購屋預算與物件條件",
  3: "看房進度與補充",
  4: "怎麼聯絡你",
};
export function BuyHomeApp() {
  const restored = useMemo(loadBuyDraft, []);
  const [form, setForm] = useState(restored.form);
  const [step, setStep] = useState<StepId>(restored.step);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [showResume, setShowResume] = useState(
    Boolean(restored.form.requirement.areas || restored.step > 1),
  );
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!refCode)
      try {
        localStorage.setItem(
          BUY_HOME_DRAFT_KEY,
          JSON.stringify({ ...restored, form, step }),
        );
      } catch {
        /* 可以繼續填寫 */
      }
  }, [form, step, refCode, restored]);
  const setReq = (patch: Partial<BuyFormRequirement>) =>
    setForm((prev) => ({
      ...prev,
      requirement: { ...prev.requirement, ...patch },
    }));
  const setDec = (patch: Partial<typeof form.decision>) =>
    setForm((prev) => ({ ...prev, decision: { ...prev.decision, ...patch } }));
  const validate = (target: StepId) =>
    target === 1 || target === 2
      ? validateBuyRequirement(form.requirement, target).errors
      : target === 3
        ? validateDecision(form.decision).errors
        : validateContactStep(form).errors;
  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    requestAnimationFrame(() =>
      document
        .getElementById(`field-${Object.keys(next)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) return showErrors(e);
    setErrors({});
    if (step === 1) trackAction("find-home-start");
    setStep((step + 1) as StepId);
    window.scrollTo({ top: 0 });
  };
  const normalized = validateBuyRequirement(form.requirement).value;
  const decision = validateDecision(form.decision).value;
  const summary = requirementText(refCode, normalized, decision);
  const submit = async () => {
    if (submitting) return;
    const e = {
      ...validate(1),
      ...validate(2),
      ...validate(3),
      ...validate(4),
    };
    if (Object.keys(e).length) {
      setStep(
        Math.min(
          ...Object.keys(e).map((k) => BUY_FIELD_STEP[k] || 4),
        ) as StepId,
      );
      return showErrors(e);
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const source =
        params.get("from") ||
        params.get("source") ||
        params.get("utm_source") ||
        "direct";
      const response = await fetch("/api/find-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source,
          idempotencyKey: restored.idempotencyKey,
          startedAt: restored.startedAt,
          website: honeypot,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 201 && body.refCode) {
        trackAction("find-home-submit");
        try {
          localStorage.removeItem(BUY_HOME_DRAFT_KEY);
        } catch {}
        setRefCode(body.refCode);
        window.scrollTo({ top: 0 });
        return;
      }
      if (body.fieldErrors) {
        setStep(
          Math.min(
            ...Object.keys(body.fieldErrors).map((k) => BUY_FIELD_STEP[k] || 4),
          ) as StepId,
        );
        showErrors(body.fieldErrors);
      } else setSubmitError(body.error || "系統暫時無法收件。");
    } catch {
      setSubmitError("網路連線中斷，沒有送出。");
    } finally {
      setSubmitting(false);
    }
  };
  if (refCode)
    return (
      <SuccessView
        refCode={refCode}
        nickname={form.nickname}
        channel={form.contact.channel}
        lines={requirementLines(normalized, decision)}
        copyText={summary}
        requirement={normalized}
      />
    );
  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]">
      <header
        className="sticky top-0 z-10 border-b border-[#DDE3DF] bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-12 max-w-[560px] items-center justify-between px-4">
          <a
            href="/"
            className="flex items-center gap-1 text-[13px] text-[#66736C]"
          >
            <X className="h-4 w-4" />
            離開
          </a>
          <span className="font-serif text-[14px] font-bold">LINUS 住好日</span>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-bold text-[#00A174]"
          >
            直接 LINE 我
          </a>
        </div>
      </header>
      <main ref={top} className="mx-auto max-w-[560px] px-4 pb-32 pt-5">
        <QuestionnaireSwitch selected="buy" />
        {step === 1 && (
          <div className="mb-5 space-y-2">
            <h1 className="font-serif text-[22px] font-bold leading-snug">
              告訴我你的日本買房計畫，
              <br />讓 Linus 協助確認方向
            </h1>
            <p className="text-[13px] leading-relaxed text-[#3F5147]">
              約 3
              分鐘。從現金或貸款、看房安排，到自住或投資，先把需求整理好，再一起找合適的物件。
            </p>
          </div>
        )}
        {showResume && (
          <div className="mb-4 flex items-center justify-between gap-3 border border-[#DDE3DF] bg-white p-3 text-[12px]">
            <span>已接著上次填寫的買房需求。</span>
            <button
              type="button"
              className="shrink-0 underline"
              onClick={() => {
                setForm(emptyBuyForm());
                setStep(1);
                setErrors({});
                setShowResume(false);
              }}
            >
              重新開始
            </button>
          </div>
        )}
        <div className="mb-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`h-1 ${n <= step ? "bg-[#00A174]" : "bg-[#DDE3DF]"}`}
            />
          ))}
        </div>
        <p className="mb-5 text-[12px] text-[#66736C]">
          <span className="font-jost">{step} / 4</span>　{TITLES[step]}
        </p>
        <div className="space-y-7 border border-[#DDE3DF] bg-white p-4 sm:p-6">
          {(step === 1 || step === 2) && (
            <BuyStepFields
              step={step}
              requirement={form.requirement}
              onChange={setReq}
              errors={errors}
            />
          )}
          {step === 3 && (
            <>
              <Field
                id="onMatch"
                label="找到符合主要條件的物件時，你會？"
                error={errors.onMatch}
              >
                <OptionList
                  options={BUY_ON_MATCH_OPTIONS}
                  value={form.decision.onMatch}
                  onChange={(id) => setDec({ onMatch: id })}
                />
              </Field>
              <Field id="ifNotFound" label="如果暫時找不到合適物件？" optional>
                <Chips
                  options={IF_NOT_FOUND_OPTIONS}
                  selected={
                    form.decision.ifNotFound ? [form.decision.ifNotFound] : []
                  }
                  onToggle={(id) =>
                    setDec({
                      ifNotFound:
                        form.decision.ifNotFound === id ? undefined : id,
                    })
                  }
                />
              </Field>
              <Field id="otherAgents" label="也有請其他仲介幫忙找嗎？" optional>
                <Chips
                  options={OTHER_AGENTS_OPTIONS}
                  selected={
                    form.decision.otherAgents ? [form.decision.otherAgents] : []
                  }
                  onToggle={(id) =>
                    setDec({
                      otherAgents:
                        form.decision.otherAgents === id ? undefined : id,
                    })
                  }
                />
              </Field>
              <Field
                id="note"
                label="還有其他物件要求或想補充的嗎？"
                optional
                hint="請不要填護照號碼、在留卡號、收入或銀行帳戶資料。"
              >
                <textarea
                  aria-label="補充說明"
                  className={`${inputClass} h-auto w-full py-3`}
                  rows={4}
                  maxLength={LIMITS.note}
                  value={form.decision.note}
                  placeholder="例：想找可養貓的自住公寓、希望先討論貸款方向"
                  onChange={(e) => setDec({ note: e.target.value })}
                />
              </Field>
            </>
          )}
          {step === 4 && (
            <ContactStep
              form={form}
              setForm={setForm}
              errors={errors}
              honeypot={honeypot}
              setHoneypot={setHoneypot}
              submitError={submitError}
              summary={summary}
            />
          )}
        </div>
      </main>
      <footer
        className="fixed inset-x-0 bottom-0 z-10 border-t border-[#DDE3DF] bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep((step - 1) as StepId);
                window.scrollTo({ top: 0 });
              }}
              className="flex min-h-12 items-center gap-1 border border-[#DDE3DF] px-4 text-[14px]"
            >
              <ArrowLeft className="h-4 w-4" />
              上一步
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={step === 4 ? submit : next}
            className="min-h-12 flex-1 bg-[#00A174] px-3 text-[14px] font-bold text-white hover:bg-[#008F67] disabled:opacity-60"
          >
            {submitting
              ? "送出中…"
              : step === 4
                ? "送出買房需求，請 Linus 聯絡我"
                : "下一步"}
          </button>
        </div>
      </footer>
    </div>
  );
}
