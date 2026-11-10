import { useState } from "react";
import { BuyStepFields } from "../../findHome/BuyStepFields";
import { buyRequirementToForm } from "../../lib/findHome/buyDraft";
import {
  validateBuyRequirement,
  type BuyRequirement,
} from "../../lib/findHome/buySchema";
import type { FieldErrors } from "../../lib/findHome/schema";
export function BuyRequirementEditor({
  requirement,
  busy,
  onSave,
  onCancel,
}: {
  requirement: BuyRequirement;
  busy: boolean;
  onSave: (next: BuyRequirement) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => buyRequirementToForm(requirement));
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = () => {
    const parsed = validateBuyRequirement(draft);
    setErrors(parsed.errors);
    if (!Object.keys(parsed.errors).length) onSave(parsed.value);
  };
  return (
    <div className="space-y-6">
      <BuyStepFields
        step={1}
        requirement={draft}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        errors={errors}
      />
      <hr className="border-[#DDE3DF]" />
      <BuyStepFields
        step={2}
        requirement={draft}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        errors={errors}
      />
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-xs text-[#B42318]">
          請確認上方標示的欄位。
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="min-h-11 bg-[#00A174] px-5 text-sm font-bold text-white disabled:opacity-50"
        >
          儲存買房需求
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 border border-[#C9D2CD] px-5 text-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}
