import type { ContactChannel, StepId } from "./schema.js";

/**
 * 問卷草稿（存在客人自己瀏覽器的 localStorage）。
 * 問卷頁與「費用試算 → 交給 Linus」共用同一個格式：費用試算把條件寫成草稿，問卷頁打開就接著填。
 */

export const FIND_HOME_DRAFT_KEY = "linus-find-home-draft-v1";

export interface FindHomeFormState {
  requirement: {
    gender?: string; ageRange?: string;
    moveIn?: string; moveInDate?: string; reasons: string[]; reasonOther?: string;
    residence?: string; entryDate?: string; visa?: string; visaType?: string; visaTypeOther?: string; nationality?: string;
    areas: string; commuteTarget: string; occupants: number; layouts: string[]; minAreaSqm: string;
    rentIdealMan: string; rentMaxMan: string; initialCostMaxMan: string; walkMaxMin?: string; ageMaxYears?: string; structure?: string;
    mustHaves: string[]; top3: string[]; adjustable: string[];
  };
  decision: { onMatch?: string; applicationRoutes?: string[]; ifNotFound?: string; otherAgents?: string; note: string };
  nickname: string;
  contact: { channel: ContactChannel; value: string };
  contactTimes: string[];
  privacyAck: boolean;
}

export interface FindHomeDraft {
  form: FindHomeFormState;
  step: StepId;
  idempotencyKey: string;
  startedAt: number;
  /** 從哪裡帶入的條件（例如費用試算），問卷頁用來顯示提示。 */
  prefilledFrom?: "calculator";
}

export const emptyFindHomeForm = (): FindHomeFormState => ({
  requirement: {
    reasons: [], areas: "", commuteTarget: "", occupants: 1, layouts: [], minAreaSqm: "",
    rentIdealMan: "", rentMaxMan: "", initialCostMaxMan: "", mustHaves: [], top3: [], adjustable: [],
  },
  decision: { note: "" },
  nickname: "",
  contact: { channel: "line", value: "" },
  contactTimes: [],
  privacyAck: false,
});

export function newIdempotencyKey() {
  try { return crypto.randomUUID().replace(/-/g, ""); } catch { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.padEnd(20, "x"); }
}
