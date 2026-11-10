import { newIdempotencyKey, type FindHomeFormState } from "./draft.js";
import type { BuyRequirement } from "./buySchema.js";
import type { StepId } from "./schema.js";
export const BUY_HOME_DRAFT_KEY = "linus-buy-home-draft-v1";
export type BuyFormRequirement = Omit<
  Partial<BuyRequirement>,
  | "budgetIdealMan"
  | "budgetMaxMan"
  | "ownFundsMan"
  | "minAreaSqm"
  | "floorMin"
  | "walkMaxMin"
  | "ageMaxYears"
> & {
  budgetIdealMan: string;
  budgetMaxMan: string;
  ownFundsMan: string;
  minAreaSqm: string;
  floorMin: string;
  walkMaxMin: string;
  ageMaxYears: string;
  areas: string;
  propertyTypes: BuyRequirement["propertyTypes"];
  layouts: string[];
  mustHaves: BuyRequirement["mustHaves"];
  adjustable: string[];
};
export type BuyFormState = Omit<FindHomeFormState, "requirement"> & {
  dealType: "buy";
  requirement: BuyFormRequirement;
};
export interface BuyDraft {
  form: BuyFormState;
  step: StepId;
  idempotencyKey: string;
  startedAt: number;
}
export const emptyBuyForm = (): BuyFormState => ({
  dealType: "buy",
  requirement: {
    kind: "buy",
    areas: "",
    propertyTypes: [],
    layouts: [],
    mustHaves: [],
    adjustable: [],
    budgetIdealMan: "",
    budgetMaxMan: "",
    ownFundsMan: "",
    minAreaSqm: "",
    floorMin: "",
    walkMaxMin: "0",
    ageMaxYears: "0",
  },
  decision: { note: "" },
  nickname: "",
  contact: { channel: "line", value: "" },
  contactTimes: [],
  privacyAck: false,
});
export function buyRequirementToForm(req: BuyRequirement): BuyFormRequirement {
  return {
    ...req,
    budgetIdealMan: String(req.budgetIdealMan),
    budgetMaxMan: String(req.budgetMaxMan),
    ownFundsMan: req.ownFundsMan ? String(req.ownFundsMan) : "",
    minAreaSqm: req.minAreaSqm ? String(req.minAreaSqm) : "",
    floorMin: req.floorMin ? String(req.floorMin) : "",
    walkMaxMin: String(req.walkMaxMin || 0),
    ageMaxYears: String(req.ageMaxYears || 0),
  };
}
export function loadBuyDraft(): BuyDraft {
  const fresh = () => ({
    form: emptyBuyForm(),
    step: 1 as StepId,
    idempotencyKey: newIdempotencyKey(),
    startedAt: Date.now(),
  });
  try {
    const raw = localStorage.getItem(BUY_HOME_DRAFT_KEY);
    if (!raw) return fresh();
    const draft = JSON.parse(raw) as BuyDraft;
    if (
      draft?.form?.dealType !== "buy" ||
      !draft.form.requirement ||
      !draft.form.contact ||
      !draft.form.decision ||
      ![1, 2, 3, 4].includes(draft.step) ||
      typeof draft.idempotencyKey !== "string" ||
      !Array.isArray(draft.form.requirement.mustHaves) ||
      !Array.isArray(draft.form.requirement.propertyTypes)
    )
      return fresh();
    return draft;
  } catch {
    return fresh();
  }
}
