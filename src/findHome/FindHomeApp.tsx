import { Field, Chips, OptionList, inputClass, ManInput, SelectBox, LineButton, CopyButton, ContactStep } from "./FormFields";
import { QuestionnaireSwitch } from "./QuestionnaireSwitch";
import { isBuyRequirement, type AnyRequirement } from "../lib/findHome/buySchema";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CircleHelp, Minus, Plus, QrCode, X } from "lucide-react";
import { applicationRoutes } from "../data/rentStaticSearchData";
import { linusContact } from "../data/rentGuideData";
import { requirementLines, requirementText } from "../lib/findHome/lead";
import { writeCalculatorHandoff } from "../lib/findHome/handoff";
import { FIND_HOME_DRAFT_KEY, emptyFindHomeForm, newIdempotencyKey, type FindHomeDraft, type FindHomeFormState } from "../lib/findHome/draft";
import { trackAction } from "../lib/trackView";
import {
  ADJUSTABLE_OPTIONS, FIELD_STEP, IF_NOT_FOUND_OPTIONS,
  AGE_OPTIONS, AGE_RANGE_OPTIONS, APPLICATION_ROUTE_OPTIONS, MIN_AREA_OPTIONS, GENDER_OPTIONS, LAYOUT_OPTIONS, LIMITS, MOVE_IN_OPTIONS, MUST_HAVE_LABEL_OPTIONS, MUST_HAVE_OPTIONS, STRUCTURE_OPTIONS, WALK_OPTIONS, ON_MATCH_OPTIONS, OTHER_AGENTS_OPTIONS, REASON_OPTIONS,
  NO_VISA_PROCESS, RESIDENCE_OPTIONS, VISA_OPTIONS, VISA_TYPE_OPTIONS, labelOf, validateContactStep, validateDecision, validateRequirement,
  type ContactChannel, type FieldErrors, type Option, type Requirement, type StepId,
} from "../lib/findHome/schema";

/**
 * 找房需求問卷（/find-home）。
 *
 * 兩條路一直開著：填問卷讓 Linus 聯絡，或右上角「直接 LINE 我」。
 * 每一步存在客人自己的手機（localStorage），中途關掉回來可以接著填；送出成功才清掉。
 * 伺服器收不到時不丟資料：保留填好的內容，並提供「複製內容改用 LINE 傳送」。
 */

const DRAFT_KEY = FIND_HOME_DRAFT_KEY;
const LINE_URL = `https://line.me/ti/p/~${linusContact.lineId}`;
const STEP_TITLES: Record<StepId, string> = { 1: "找房基本資訊", 2: "預算與條件", 3: "找房進度", 4: "怎麼聯絡你" };

type FormState = FindHomeFormState;
type Draft = FindHomeDraft;
const emptyForm = emptyFindHomeForm;
const newKey = newIdempotencyKey;

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    return draft?.form && draft.idempotencyKey ? draft : null;
  } catch { return null; }
}

function saveDraft(draft: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* 無痕模式等存不進去時，照樣可以填 */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function readSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get("from") || params.get("source") || params.get("utm_source") || "direct";
}

/** 客人複製用的需求清單（送不出去時、完成頁都用同一份格式，與通知信一致）。 */
function buildSummary(form: FormState, refCode: string | null = null) {
  const requirement = validateRequirement(form.requirement, undefined, true).value;
  const decision = validateDecision(form.decision).value;
  return requirementText(refCode, requirement, decision);
}


// ───────────────────────── 小元件 ─────────────────────────

/** 申請方式複選，每一項可以點「說明」展開網站上「租屋指南 → 申請方式」的同一份解釋（電腦滑過也會顯示）。 */
function ApplicationRoutePicker({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      {APPLICATION_ROUTE_OPTIONS.map(option => {
        const on = selected.includes(option.id);
        const route = applicationRoutes.find(item => item.title === option.label);
        const explanation = route ? `${route.condition}。${route.body}\n房源：${route.availability}。${route.market}` : "";
        return (
          <div key={option.id} className={`border ${on ? "border-[#00A174] bg-[#F0FAF6]" : "border-[#DDE3DF] bg-white"}`}>
            <div className="flex items-stretch">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(option.id)}
                title={explanation}
                className="flex min-h-11 flex-1 items-center gap-3 px-3.5 text-left"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${on ? "border-[#00A174] bg-[#00A174]" : "border-[#B7C0BB]"}`} aria-hidden="true">
                  {on && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[14px] ${on ? "font-bold text-[#1A2A22]" : "text-[#3F5147]"}`}>{option.label}</span>
                  {route && <span className="block text-[12px] text-[#66736C]">{route.condition}・{route.availability}</span>}
                </span>
              </button>
              {route && (
                <button
                  type="button"
                  aria-expanded={open === option.id}
                  aria-label={`${option.label}是什麼？`}
                  onClick={() => setOpen(current => (current === option.id ? null : option.id))}
                  title={explanation}
                  className="flex shrink-0 items-center gap-1 border-l border-[#DDE3DF] px-3 text-[12px] font-bold text-[#00A174]"
                >
                  <CircleHelp className="h-4 w-4" />說明
                </button>
              )}
            </div>
            {route && open === option.id && (
              <div className="space-y-1.5 border-t border-[#DDE3DF] bg-white px-3.5 py-3 text-[12px] leading-relaxed text-[#3F5147]">
                <p>{route.body}</p>
                <p className="text-[#66736C]">例：{route.example}</p>
                <p><b className="text-[#1A2A22]">房源多寡：</b>{route.market}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────── 主畫面 ─────────────────────────

export function FindHomeApp() {
  const restored = useMemo(loadDraft, []);
  const [form, setForm] = useState<FormState>(() => restored?.form ?? emptyForm());
  const [step, setStep] = useState<StepId>(() => restored?.step ?? 1);
  const [idempotencyKey] = useState(() => restored?.idempotencyKey ?? newKey());
  const [startedAt] = useState(() => restored?.startedAt ?? Date.now());
  const [showResume, setShowResume] = useState(Boolean(restored && (restored.step > 1 || restored.form.requirement.areas)));
  const prefilledFromCalculator = restored?.prefilledFrom === "calculator";
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const source = useMemo(readSource, []);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!refCode) saveDraft({ form, step, idempotencyKey, startedAt, ...(prefilledFromCalculator ? { prefilledFrom: "calculator" as const } : {}) });
  }, [form, step, idempotencyKey, startedAt, refCode, prefilledFromCalculator]);

  const r = form.requirement;
  const d = form.decision;
  const setReq = (patch: Partial<FormState["requirement"]>) => setForm(prev => ({ ...prev, requirement: { ...prev.requirement, ...patch } }));
  const setDec = (patch: Partial<FormState["decision"]>) => setForm(prev => ({ ...prev, decision: { ...prev.decision, ...patch } }));
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(item => item !== id) : [...list, id]);

  const scrollToError = (nextErrors: FieldErrors) => {
    const first = Object.keys(nextErrors)[0];
    requestAnimationFrame(() => {
      const target = first ? document.getElementById(`field-${first}`) : topRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const validateStep = (target: StepId): FieldErrors => {
    if (target === 1 || target === 2) return validateRequirement(r, target).errors;
    if (target === 3) return validateDecision(d).errors;
    return validateContactStep(form).errors;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return scrollToError(stepErrors);
    if (step === 1) trackAction("find-home-start");
    setStep(prev => (prev + 1) as StepId);
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    setErrors({});
    setStep(prev => Math.max(1, prev - 1) as StepId);
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    if (submitting) return;
    const allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3), ...validateStep(4) };
    if (Object.keys(allErrors).length) {
      const firstStep = Math.min(...Object.keys(allErrors).map(key => FIELD_STEP[key] ?? 4)) as StepId;
      setStep(firstStep);
      setErrors(allErrors);
      return scrollToError(allErrors);
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/find-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source, idempotencyKey, startedAt, website: honeypot }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 201 && body.refCode) {
        trackAction("find-home-submit");
        clearDraft();
        setRefCode(body.refCode);
        window.scrollTo({ top: 0 });
        return;
      }
      if (response.status === 400 && body.fieldErrors) {
        const serverErrors = body.fieldErrors as FieldErrors;
        const firstStep = Math.min(...Object.keys(serverErrors).map(key => FIELD_STEP[key] ?? 4)) as StepId;
        setStep(firstStep);
        setErrors(serverErrors);
        return scrollToError(serverErrors);
      }
      setSubmitError(body.error || "系統暫時無法收件。");
    } catch {
      setSubmitError("網路連線中斷，沒有送出。");
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    clearDraft();
    setForm(emptyForm());
    setStep(1);
    setErrors({});
    setShowResume(false);
  };

  if (refCode) {
    const requirement = validateRequirement(form.requirement, undefined, true).value;
    const decision = validateDecision(form.decision).value;
    return (
      <SuccessView
        refCode={refCode}
        nickname={form.nickname}
        channel={form.contact.channel}
        lines={requirementLines(requirement, decision)}
        copyText={requirementText(refCode, requirement, decision)}
        requirement={requirement}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]">
      <header className="sticky top-0 z-10 border-b border-[#DDE3DF] bg-white" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-12 max-w-[560px] items-center justify-between px-4">
          <a href="/" className="flex items-center gap-1 text-[13px] text-[#66736C] hover:text-[#00A174]"><X className="h-4 w-4" />離開</a>
          <img src="/logo-text.svg" alt="LINUS 住好日" width={144} height={22} className="h-auto w-36 shrink-0" />
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackAction("line-add")} className="text-[13px] font-bold text-[#00A174]">直接 LINE 我</a>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4 pb-32 pt-5" ref={topRef}>
        <QuestionnaireSwitch selected="rent" />
        {step === 1 && (
          <div className="mb-5 space-y-2">
            <h1 className="font-serif text-[22px] font-bold leading-snug">告訴我你的日本租房需求，<br />讓 Linus 協助確認方向</h1>
            <p className="text-[13px] leading-relaxed text-[#3F5147]">約 3 分鐘，用綽號也可以。填完 Linus 會主動聯絡你；不想填，也可以按右上角直接加 LINE。</p>
          </div>
        )}

        {showResume && (
          <div className="mb-4 flex items-center justify-between gap-3 border border-[#DDE3DF] bg-white px-3.5 py-2.5 text-[12px] text-[#3F5147]">
            <span>{prefilledFromCalculator ? "已帶入你在費用試算選的條件，請確認並補上其他題目。" : "已幫你接著上次填寫的內容。"}</span>
            <button type="button" onClick={startOver} className="shrink-0 font-bold text-[#66736C] underline">重新開始</button>
          </div>
        )}

        <div className="mb-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map(n => <span key={n} className={`h-1 ${n <= step ? "bg-[#00A174]" : "bg-[#DDE3DF]"}`} />)}
        </div>
        <p className="mb-5 text-[12px] text-[#66736C]"><span className="font-jost">{step} / 4</span>　{STEP_TITLES[step]}</p>

        <div className="space-y-7 border border-[#DDE3DF] bg-white p-4 sm:p-6">
          {step === 1 && (
            <>
              <Field id="gender" label="性別" hint="部分房東對入住者有條件，Linus 會先幫你確認。" error={errors.gender}>
                <Chips options={GENDER_OPTIONS} selected={r.gender ? [r.gender] : []} onToggle={id => setReq({ gender: id })} />
              </Field>
              <Field id="ageRange" label="年齡層" error={errors.ageRange}>
                <Chips options={AGE_RANGE_OPTIONS} selected={r.ageRange ? [r.ageRange] : []} onToggle={id => setReq({ ageRange: id })} />
              </Field>
              <Field id="moveIn" label="預計什麼時候入住？" error={errors.moveIn}>
                <Chips options={MOVE_IN_OPTIONS} selected={r.moveIn ? [r.moveIn] : []} onToggle={id => setReq({ moveIn: id })} />
              </Field>
              {r.moveIn === "date" && (
                <div className="border-l-2 border-[#00A174] pl-3">
                  <Field id="moveInDate" label="入住日期" error={errors.moveInDate}>
                    <input type="date" className={inputClass} value={r.moveInDate || ""} onChange={e => setReq({ moveInDate: e.target.value })} />
                  </Field>
                </div>
              )}
              <Field id="reasons" label="為什麼想搬家？" optional>
                <Chips options={REASON_OPTIONS} selected={r.reasons} onToggle={id => setReq({ reasons: toggle(r.reasons, id) })} />
                {r.reasons.includes("other") && (
                  <input className={inputClass} maxLength={LIMITS.reasonOther} placeholder="其他原因" value={r.reasonOther || ""} onChange={e => setReq({ reasonOther: e.target.value })} />
                )}
              </Field>
              <Field id="residence" label="你現在住在" error={errors.residence}>
                <Chips options={RESIDENCE_OPTIONS} selected={r.residence ? [r.residence] : []} onToggle={id => setReq({ residence: id })} />
              </Field>
              <Field id="visaType" label="你的簽證種類" hint="入住審查會看在留資格。還在申請中，就選預計拿到的簽證。" error={errors.visaType}>
                <Chips options={VISA_TYPE_OPTIONS} selected={r.visaType ? [r.visaType] : []} onToggle={id => setReq({ visaType: id })} />
                {r.visaType === "other" && (
                  <div id="field-visaTypeOther" className="space-y-1.5">
                    <input className={inputClass} maxLength={LIMITS.visaTypeOther} value={r.visaTypeOther || ""} onChange={e => setReq({ visaTypeOther: e.target.value })} placeholder="例：配偶簽證、經營管理簽證" aria-label="其他簽證種類" />
                    {errors.visaTypeOther && <p className="text-[12px] font-bold text-[#B42318]" role="alert">{errors.visaTypeOther}</p>}
                  </div>
                )}
              </Field>
              {r.residence === "overseas" && (
                <div className="space-y-6 border-l-2 border-[#00A174] pl-3">
                  <Field id="nationality" label="國籍" error={errors.nationality}>
                    <input className={inputClass} maxLength={LIMITS.nationality} value={r.nationality || ""} onChange={e => setReq({ nationality: e.target.value })} placeholder="例：台灣" />
                  </Field>
                  <Field id="entryDate" label="預計入境日期" hint="大概的日期也可以。海外入住的審查條件跟入境時間有關。" error={errors.entryDate}>
                    <input type="date" className={inputClass} value={r.entryDate || ""} onChange={e => setReq({ entryDate: e.target.value })} />
                  </Field>
                  {!(r.visaType && NO_VISA_PROCESS.includes(r.visaType)) && (
                    <Field id="visa" label="簽證辦理進度" error={errors.visa}>
                      <Chips options={VISA_OPTIONS} selected={r.visa ? [r.visa] : []} onToggle={id => setReq({ visa: id })} />
                    </Field>
                  )}
                </div>
              )}
              <Field id="areas" label="想住哪裡？" hint="地區、路線或車站都可以，例如：中野、高圓寺、中央線。" error={errors.areas}>
                <input className={inputClass} maxLength={LIMITS.areas} value={r.areas} onChange={e => setReq({ areas: e.target.value })} placeholder="例：中野、中央線沿線" />
              </Field>
              <Field id="commuteTarget" label="通勤地點" optional hint="公司、學校或最近的車站，Linus 會幫你看通勤時間。">
                <input className={inputClass} maxLength={LIMITS.commuteTarget} value={r.commuteTarget} onChange={e => setReq({ commuteTarget: e.target.value })} placeholder="例：新宿站、早稻田大學" />
              </Field>
              <Field id="layouts" label="想要的房型" hint="可複選。" error={errors.layouts}>
                <Chips options={LAYOUT_OPTIONS} selected={r.layouts} onToggle={id => setReq({ layouts: toggle(r.layouts, id) })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="occupants" label="幾個人住？" error={errors.occupants}>
                  <div className="flex h-11 items-stretch border border-[#C9D2CD] bg-white">
                    <button type="button" aria-label="減少人數" onClick={() => setReq({ occupants: Math.max(1, r.occupants - 1) })} className="flex w-11 shrink-0 items-center justify-center text-[#3F5147] hover:text-[#00A174]"><Minus className="h-4 w-4" /></button>
                    <span className="flex flex-1 items-center justify-center border-x border-[#DDE3DF] font-jost text-[16px]">{r.occupants} 人</span>
                    <button type="button" aria-label="增加人數" onClick={() => setReq({ occupants: Math.min(LIMITS.maxOccupants, r.occupants + 1) })} className="flex w-11 shrink-0 items-center justify-center text-[#3F5147] hover:text-[#00A174]"><Plus className="h-4 w-4" /></button>
                  </div>
                </Field>
                <Field id="minAreaSqm" label="最小面積" error={errors.minAreaSqm}>
                  <SelectBox id="min-area" value={r.minAreaSqm || ""} options={MIN_AREA_OPTIONS} onChange={v => setReq({ minAreaSqm: v })} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field id="rentIdealMan" label="月租金（含管理費、共益費）" error={errors.rentIdealMan || errors.rentMaxMan}>
                <div className="grid grid-cols-2 gap-2">
                  <ManInput id="rent-ideal" label="理想" value={r.rentIdealMan} onChange={v => setReq({ rentIdealMan: v })} placeholder="11.5" />
                  <ManInput id="rent-max" label="最高" value={r.rentMaxMan} onChange={v => setReq({ rentMaxMan: v })} placeholder="15" />
                </div>
              </Field>
              <span id="field-rentMaxMan" />
              <Field id="initialCostMaxMan" label="初期費用上限" optional hint="押金、禮金、仲介費等搬入時一次付清的費用。" error={errors.initialCostMaxMan}>
                <div className="w-48"><ManInput id="initial-cost" value={r.initialCostMaxMan} onChange={v => setReq({ initialCostMaxMan: v })} placeholder="80" /></div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="walkMaxMin" label="徒步到車站">
                  <SelectBox id="walk-max" value={r.walkMaxMin || "0"} options={WALK_OPTIONS} onChange={v => setReq({ walkMaxMin: v })} />
                </Field>
                <Field id="ageMaxYears" label="屋齡上限">
                  <SelectBox id="age-max" value={r.ageMaxYears || "0"} options={AGE_OPTIONS} onChange={v => setReq({ ageMaxYears: v })} />
                </Field>
              </div>
              <Field id="structure" label="建築結構" hint="怕吵或在意隔音，建議選非木造以上。">
                <SelectBox id="structure" value={r.structure || "any"} options={STRUCTURE_OPTIONS} onChange={v => setReq({ structure: v })} />
              </Field>
              <Field id="mustHaves" label="想要的條件" optional hint="可複選。">
                <Chips
                  options={MUST_HAVE_OPTIONS}
                  selected={r.mustHaves}
                  onToggle={id => {
                    const mustHaves = toggle(r.mustHaves, id);
                    setReq({ mustHaves, top3: r.top3.filter(item => mustHaves.includes(item)) });
                  }}
                />
              </Field>
              {r.mustHaves.length > 0 && (
                <Field id="top3" label="其中最不能妥協的 3 項" optional hint={`已選 ${r.top3.length} / 3。照重要順序點選。`}>
                  <div className="flex flex-wrap gap-2">
                    {r.mustHaves.map(id => {
                      const order = r.top3.indexOf(id);
                      const on = order >= 0;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={on}
                          disabled={!on && r.top3.length >= 3}
                          onClick={() => setReq({ top3: on ? r.top3.filter(item => item !== id) : [...r.top3, id] })}
                          className={`flex min-h-10 items-center gap-1.5 border px-3 text-[13px] disabled:opacity-40 ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF] text-[#3F5147]"}`}
                        >
                          {on && <span className="flex h-4 w-4 items-center justify-center bg-[#00A174] font-jost text-[11px] text-white">{order + 1}</span>}
                          {labelOf(MUST_HAVE_LABEL_OPTIONS, id)}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
              <Field id="adjustable" label="找不到時，可以調整哪些？" hint="可複選。選「維持原條件」會取消其他選項。" error={errors.adjustable}>
                <Chips
                  options={ADJUSTABLE_OPTIONS}
                  selected={r.adjustable}
                  onToggle={id => {
                    if (id === "keep") setReq({ adjustable: r.adjustable.includes("keep") ? [] : ["keep"] });
                    else setReq({ adjustable: toggle(r.adjustable.filter(item => item !== "keep"), id) });
                  }}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field id="onMatch" label="找到符合主要條件的房子時，你會？" error={errors.onMatch}>
                <OptionList options={ON_MATCH_OPTIONS} value={d.onMatch} onChange={id => setDec({ onMatch: id })} />
              </Field>
              <Field id="applicationRoutes" label="可以接受哪些申請方式？" optional hint="可複選。租金合理、地段好的熱門物件，多半在前租客退租前就以「先行契約」租出；只接受一般申請，能選的房子會少很多。不確定可以先跳過，Linus 會再說明。">
                <ApplicationRoutePicker selected={d.applicationRoutes || []} onToggle={id => setDec({ applicationRoutes: toggle(d.applicationRoutes || [], id) })} />
              </Field>
              <Field id="ifNotFound" label="如果一個月內還找不到？" optional>
                <Chips options={IF_NOT_FOUND_OPTIONS} selected={d.ifNotFound ? [d.ifNotFound] : []} onToggle={id => setDec({ ifNotFound: d.ifNotFound === id ? undefined : id })} />
              </Field>
              <Field id="otherAgents" label="也有請其他仲介幫忙找嗎？" optional hint="這題不影響 Linus 是否幫你找房。">
                <Chips options={OTHER_AGENTS_OPTIONS} selected={d.otherAgents ? [d.otherAgents] : []} onToggle={id => setDec({ otherAgents: d.otherAgents === id ? undefined : id })} />
              </Field>
              <Field id="note" label="還有想補充的嗎？" optional hint="請不要填護照號碼、在留卡號或收入等資料。">
                <textarea value={d.note} maxLength={LIMITS.note} onChange={e => setDec({ note: e.target.value })} rows={4} placeholder="例：會帶一隻貓、想要朝南" className="w-full border border-[#C9D2CD] bg-white px-3 py-2.5 text-[15px] placeholder:text-[#9AA59F] focus:border-[#00A174] focus:outline-none" />
                <p className="text-right font-jost text-[11px] text-[#9AA59F]">{d.note.length} / {LIMITS.note}</p>
              </Field>
            </>
          )}

          {step === 4 && <ContactStep form={form} setForm={setForm} errors={errors} honeypot={honeypot} setHoneypot={setHoneypot} submitError={submitError} summary={buildSummary(form)} />}
        </div>

        {step === 4 && (
          <p className="mt-4 text-center text-[12px] text-[#66736C]">不想留資料？也可以<a href={LINE_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackAction("line-add")} className="font-bold text-[#00A174]">直接加 Linus 的 LINE</a>。</p>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#DDE3DF] bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">
          {step > 1 && (
            <button type="button" onClick={goBack} className="flex min-h-12 items-center gap-1 border border-[#DDE3DF] px-4 text-[14px] text-[#3F5147]">
              <ArrowLeft className="h-4 w-4" />上一步
            </button>
          )}
          {step < 4 ? (
            <button type="button" onClick={goNext} className="min-h-12 flex-1 bg-[#00A174] text-[15px] font-bold text-white hover:bg-[#008F67]">下一步</button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="min-h-12 flex-1 bg-[#00A174] px-3 text-[14px] font-bold text-white hover:bg-[#008F67] disabled:opacity-60 sm:text-[15px]">
              {submitting ? "送出中…" : "送出找房需求，請 Linus 聯絡我"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

const CHANNEL_NAME: Record<ContactChannel, string> = { line: "LINE", wechat: "WeChat", email: "Email", whatsapp: "WhatsApp" };

export function SuccessView({ refCode, nickname, channel, lines, copyText: summary, requirement }: { refCode: string; nickname: string; channel: ContactChannel; lines: string[]; copyText: string; requirement: AnyRequirement }) {
  const [showWechat, setShowWechat] = useState(false);
  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <main className="mx-auto max-w-[560px] space-y-4 px-4 py-8">
        <div className="space-y-2">
          <span className="flex h-10 w-10 items-center justify-center bg-[#00A174] text-white"><Check className="h-5 w-5" /></span>
          <h1 className="font-serif text-[24px] font-bold">已收到你的{isBuyRequirement(requirement) ? "買房" : "租房"}需求</h1>
          <p className="text-[14px] leading-relaxed text-[#3F5147]">{nickname || "你"}好，Linus 會用你留下的 {CHANNEL_NAME[channel]} 和你聯絡。</p>
          <p className="text-[12px] leading-relaxed text-[#66736C]">此頁即為送出確認，系統不會另外寄送確認信。建議複製參考碼，方便後續聯絡。</p>
        </div>

        <section className="border border-[#DDE3DF] bg-white p-5 text-center">
          <p className="text-[12px] tracking-widest text-[#66736C]">你的參考碼</p>
          <p className="mt-1 font-jost text-[34px] font-semibold tracking-[0.12em]" aria-label={`參考碼 ${refCode}`}>{refCode}</p>
          <div className="mt-2 flex justify-center"><CopyButton text={refCode} label="複製參考碼" /></div>
        </section>

        <section className="space-y-3 border-2 border-[#00A174] bg-white p-5">
          <h2 className="text-[16px] font-bold">{channel === "line" ? "下一步：加 LINE，避免漏接訊息" : "想更快開始？"}</h2>
          <p className="text-[13px] leading-relaxed text-[#3F5147]">加 Linus 的 LINE，再把參考碼傳過去，就能對上你的問卷，接著確認找房需求。</p>
          {channel === "line" && (
            <div className="space-y-2 border-l-2 border-[#00A174] bg-[#F5F8F6] px-3 py-3 text-left text-[13px] leading-relaxed text-[#3F5147]">
              <p className="font-bold">請留意好友與訊息通知</p>
              <p>Linus 會依你留下的 LINE ID 嘗試加入好友並聯絡。若你開啟「阻擋訊息」，可能收不到非好友的訊息。</p>
              <p>建議先主動加入 Linus 好友，傳送上方參考碼；若一直沒收到聯絡，也可以直接傳訊息詢問。</p>
            </div>
          )}
          <LineButton label="加 LINE 好友" />
          <button type="button" onClick={() => setShowWechat(value => !value)} aria-expanded={showWechat} className="flex min-h-11 w-full items-center justify-center gap-2 border border-[#00A174] text-[14px] font-bold text-[#00A174]">
            <QrCode className="h-4 w-4" />WeChat 掃碼加好友
          </button>
          {showWechat && (
            <div className="flex flex-col items-center gap-2 border border-[#DDE3DF] p-3">
              <img src="/wechat-add-friend-qr-branded.svg" alt="WeChat 加好友 QR Code" className="h-40 w-40" />
              <span className="text-[12px] text-[#66736C]">WeChat ID：{linusContact.wechatId}</span>
            </div>
          )}
        </section>

        <section className="space-y-3 border border-[#DDE3DF] bg-white p-5" aria-labelledby="my-requirements">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="my-requirements" className="text-[16px] font-bold">你填的找房需求</h2>
            <CopyButton text={summary} label="複製" />
          </div>
          <ul className="divide-y divide-[#ECEFEC] text-[13px] leading-relaxed">
            {lines.map(line => {
              const index = line.indexOf("：");
              return (
                <li key={line} className="grid grid-cols-[6.5em_minmax(0,1fr)] gap-2 py-1.5">
                  <span className="text-[#66736C]">{line.slice(0, index)}</span>
                  <span className="whitespace-pre-wrap break-words">{line.slice(index + 1)}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-[12px] text-[#66736C]">可以複製下來自己留存，或貼到 LINE 跟 Linus 確認。</p>
        </section>

        {!isBuyRequirement(requirement) && (
        <section className="space-y-3 border border-[#DDE3DF] bg-white p-5" aria-labelledby="check-market">
          <h2 id="check-market" className="text-[16px] font-bold">等 Linus 聯絡前，先看看行情</h2>
          <p className="text-[13px] leading-relaxed text-[#3F5147]">把你的條件帶進網站的「租屋預算健檢」，看看這個預算在你想住的地區合不合理、哪些條件會讓房子變少。</p>
          <button
            type="button"
            onClick={() => {
              writeCalculatorHandoff({ requirement, label: `你的找房需求 ${refCode}` });
              window.location.assign("/");
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 border border-[#00A174] text-[14px] font-bold text-[#00A174] hover:bg-[#F0FAF6]"
          >
            用這些條件看行情
          </button>
        </section>
        )}

        <p className="text-[13px] leading-relaxed text-[#66736C]">條件有變的話，直接在 LINE 告訴 Linus 就可以。</p>
        <a href="/" className="inline-block text-[13px] font-bold text-[#00A174] underline">回到 LINUS 住好日首頁</a>
      </main>
    </div>
  );
}
