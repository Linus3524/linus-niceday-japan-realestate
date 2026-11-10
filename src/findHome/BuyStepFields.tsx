import {
  ADJUSTABLE_OPTIONS,
  AGE_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  LIMITS,
  RESIDENCE_OPTIONS,
  WALK_OPTIONS,
  type FieldErrors,
  type Option,
} from "../lib/findHome/schema";
import {
  BUY_BUDGET_SCOPE_OPTIONS,
  BUY_FUNDING_OPTIONS,
  BUY_LAYOUT_OPTIONS,
  BUY_LOAN_OPTIONS,
  BUY_MUST_HAVE_OPTIONS,
  BUY_PROPERTY_OPTIONS,
  BUY_PURPOSE_OPTIONS,
  BUY_STRUCTURE_OPTIONS,
  BUY_TIMING_OPTIONS,
  BUY_VIEWING_OPTIONS,
  BUY_VISA_OPTIONS,
} from "../lib/findHome/buySchema";
import type { BuyFormRequirement } from "../lib/findHome/buyDraft";
import { Chips, Field, inputClass, ManInput, SelectBox } from "./FormFields";

export function BuyStepFields({
  step,
  requirement: r,
  onChange,
  errors,
}: {
  step: 1 | 2;
  requirement: BuyFormRequirement;
  onChange: (patch: Partial<BuyFormRequirement>) => void;
  errors: FieldErrors;
}) {
  const select = (field: keyof BuyFormRequirement, value: string) =>
    onChange({ [field]: value } as Partial<BuyFormRequirement>);
  const one = (field: keyof BuyFormRequirement, options: readonly Option[]) => (
    <Chips
      options={options}
      selected={
        typeof r[field] === "string" && r[field] ? [r[field] as string] : []
      }
      onToggle={(id) => select(field, id)}
    />
  );
  const multiple = (
    field: "propertyTypes" | "layouts" | "mustHaves" | "adjustable",
    options: readonly Option[],
    exclusive?: string,
  ) => (
    <Chips
      options={options}
      selected={r[field]}
      onToggle={(id) => {
        const old = r[field] as string[];
        const next = old.includes(id)
          ? old.filter((v) => v !== id)
          : id === exclusive
            ? [id]
            : [...old.filter((v) => v !== exclusive), id];
        onChange({ [field]: next } as Partial<BuyFormRequirement>);
      }}
    />
  );
  if (step === 1)
    return (
      <>
        <Field id="gender" label="性別" error={errors.gender}>
          {one("gender", GENDER_OPTIONS)}
        </Field>
        <Field
          id="ageRange"
          label="年齡層"
          hint="只需選年齡層，不用填出生日期。"
          error={errors.ageRange}
        >
          {one("ageRange", AGE_RANGE_OPTIONS)}
        </Field>
        <Field id="residence" label="你現在住在" error={errors.residence}>
          {one("residence", RESIDENCE_OPTIONS)}
        </Field>
        <Field
          id="visaType"
          label="你的日本簽證種類"
          hint="協助確認購屋及貸款諮詢方向；沒有日本簽證也可以填寫。"
          error={errors.visaType}
        >
          {one("visaType", BUY_VISA_OPTIONS)}
          {r.visaType === "other" && (
            <Field
              id="visaTypeOther"
              label="其他簽證種類"
              error={errors.visaTypeOther}
            >
              <input
                aria-label="其他簽證種類"
                className={inputClass}
                maxLength={LIMITS.visaTypeOther}
                value={r.visaTypeOther || ""}
                onChange={(e) => select("visaTypeOther", e.target.value)}
              />
            </Field>
          )}
        </Field>
        {r.residence === "overseas" && (
          <Field id="nationality" label="國籍" error={errors.nationality}>
            <input
              aria-label="國籍"
              className={inputClass}
              placeholder="例：台灣"
              maxLength={LIMITS.nationality}
              value={r.nationality || ""}
              onChange={(e) => select("nationality", e.target.value)}
            />
          </Field>
        )}
        <Field
          id="funding"
          label="全款現金，還是需要貸款？"
          error={errors.funding}
        >
          {one("funding", BUY_FUNDING_OPTIONS)}
        </Field>
        {r.funding && r.funding !== "cash" && (
          <div className="space-y-6 border-l-2 border-[#00A174] pl-3">
            <Field id="loanStatus" label="貸款準備進度" optional>
              {one("loanStatus", BUY_LOAN_OPTIONS)}
            </Field>
            <Field
              id="ownFundsMan"
              label="預計可投入的自有資金"
              optional
              hint="只填大概的購屋資金，不用提供收入或帳戶資料。"
              error={errors.ownFundsMan}
            >
              <ManInput
                maxDigits={7}
                id="buy-own-funds"
                value={r.ownFundsMan}
                onChange={(v) => select("ownFundsMan", v)}
                placeholder="1000"
              />
            </Field>
            <p className="text-[12px] leading-relaxed text-[#66736C]">
              Linus 會先和你確認資金與貸款諮詢方向，實際貸款條件由銀行審查。
            </p>
          </div>
        )}
        <Field id="viewing" label="你打算怎麼看房？" error={errors.viewing}>
          {one("viewing", BUY_VIEWING_OPTIONS)}
        </Field>
        {r.viewing && r.viewing !== "online" && (
          <Field
            id="visitTiming"
            label="預計來日本／方便看房的時間"
            optional
            hint="大概月份、日期或「還沒決定」都可以。"
          >
            <input
              aria-label="預計來日本／方便看房的時間"
              className={inputClass}
              maxLength={80}
              placeholder="例：明年 3 月來日本，或週末可看房"
              value={r.visitTiming || ""}
              onChange={(e) => select("visitTiming", e.target.value)}
            />
          </Field>
        )}
        <Field
          id="purchaseTiming"
          label="目標什麼時候買房？"
          error={errors.purchaseTiming}
        >
          {one("purchaseTiming", BUY_TIMING_OPTIONS)}
        </Field>
        {r.purchaseTiming === "date" && (
          <Field
            id="purchaseDate"
            label="目標購買日期"
            error={errors.purchaseDate}
          >
            <input
              aria-label="目標購買日期"
              type="date"
              className={inputClass}
              value={r.purchaseDate || ""}
              onChange={(e) => select("purchaseDate", e.target.value)}
            />
          </Field>
        )}
      </>
    );
  return (
    <>
      <Field
        id="budgetIdealMan"
        label="購屋預算（總價，單位萬円）"
        hint="這裡填購屋總價，不是每月還款金額。"
        error={errors.budgetIdealMan || errors.budgetMaxMan}
      >
        <div className="grid grid-cols-2 gap-2">
          <ManInput
            maxDigits={7}
            id="buy-budget-ideal"
            label="理想"
            value={r.budgetIdealMan}
            onChange={(v) => select("budgetIdealMan", v)}
            placeholder="3000"
          />
          <ManInput
            maxDigits={7}
            id="buy-budget-max"
            label="最高"
            value={r.budgetMaxMan}
            onChange={(v) => select("budgetMaxMan", v)}
            placeholder="5000"
          />
        </div>
        <span id="field-budgetMaxMan" />
      </Field>
      <Field
        id="budgetScope"
        label="上面的預算包含購屋費用嗎？"
        hint="購屋費用例如仲介費、登記、稅費及貸款相關費用。"
        error={errors.budgetScope}
      >
        {one("budgetScope", BUY_BUDGET_SCOPE_OPTIONS)}
      </Field>
      <Field id="purpose" label="投資，還是自住？" error={errors.purpose}>
        {one("purpose", BUY_PURPOSE_OPTIONS)}
      </Field>
      <Field
        id="propertyTypes"
        label="想找哪一類物件？"
        hint="可複選；還沒決定也可以。"
        error={errors.propertyTypes}
      >
        {multiple("propertyTypes", BUY_PROPERTY_OPTIONS, "undecided")}
      </Field>
      <Field
        id="areas"
        label="希望購買的地區、路線或車站"
        error={errors.areas}
        hint="還沒決定地點，可以填「未定」，Linus 會再和你討論。"
      >
        <input
          aria-label="希望購買的地區、路線或車站"
          className={inputClass}
          maxLength={LIMITS.areas}
          value={r.areas}
          onChange={(e) => select("areas", e.target.value)}
          placeholder="例：中野、山手線沿線、橫濱"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="walkMaxMin" label="徒步到車站" error={errors.walkMaxMin}>
          <SelectBox
            id="buy-walk"
            value={r.walkMaxMin}
            options={WALK_OPTIONS}
            onChange={(v) => select("walkMaxMin", v)}
          />
        </Field>
        <Field id="ageMaxYears" label="屋齡上限" error={errors.ageMaxYears}>
          <SelectBox
            id="buy-age"
            value={r.ageMaxYears}
            options={AGE_OPTIONS}
            onChange={(v) => select("ageMaxYears", v)}
          />
        </Field>
      </div>
      <Field
        id="layouts"
        label="希望房型"
        optional
        hint="可複選。整棟或土地需求可先略過。"
      >
        {multiple("layouts", BUY_LAYOUT_OPTIONS)}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="minAreaSqm"
          label="最小面積（㎡）"
          optional
          error={errors.minAreaSqm}
        >
          <input
            aria-label="最小面積（㎡）"
            inputMode="numeric"
            className={inputClass}
            placeholder="例：50"
            value={r.minAreaSqm}
            onChange={(e) =>
              select("minAreaSqm", e.target.value.replace(/\D/g, ""))
            }
          />
        </Field>
        <Field id="floorMin" label="最低樓層" optional error={errors.floorMin}>
          <input
            aria-label="最低樓層"
            inputMode="numeric"
            className={inputClass}
            placeholder="例：2"
            value={r.floorMin}
            onChange={(e) =>
              select("floorMin", e.target.value.replace(/\D/g, ""))
            }
          />
        </Field>
      </div>
      <Field id="structure" label="建築結構">
        <SelectBox
          id="buy-structure"
          value={r.structure || "any"}
          options={BUY_STRUCTURE_OPTIONS}
          onChange={(v) => select("structure", v)}
        />
      </Field>
      <Field
        id="mustHaves"
        label="其他對房子的要求"
        optional
        hint="可複選，詳細需求也可以在下一步補充。"
      >
        {multiple("mustHaves", BUY_MUST_HAVE_OPTIONS)}
      </Field>
      <Field id="adjustable" label="找不到合適物件時，可以調整哪些？" optional>
        {multiple("adjustable", ADJUSTABLE_OPTIONS, "keep")}
      </Field>
    </>
  );
}
