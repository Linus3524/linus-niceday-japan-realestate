import {
  ADJUSTABLE_OPTIONS, IF_NOT_FOUND_OPTIONS, LAYOUT_OPTIONS, MOVE_IN_OPTIONS, MUST_HAVE_OPTIONS, ON_MATCH_OPTIONS,
  OTHER_AGENTS_OPTIONS, REASON_OPTIONS, RESIDENCE_OPTIONS, VISA_OPTIONS, VISA_TYPE_OPTIONS, labelOf, labelsOf,
  type ContactChannel, type ContactTime, type Decision, type LeadSource, type Requirement,
} from "./schema.js";

/**
 * 客戶需求（Lead）的資料形狀、後台狀態與「三個維度」的規則。
 *
 * 前後端共用：後台畫面顯示的標籤文字與後端存的代號都從這裡來。
 */

export const LEAD_STATUSES = [
  { id: "new", label: "新進" },
  { id: "to-contact", label: "待聯絡" },
  { id: "clarifying", label: "需求確認中" },
  { id: "active", label: "積極找房" },
  { id: "waiting", label: "等待新物件" },
  { id: "applying", label: "申請中" },
  { id: "won", label: "已成交" },
  { id: "closed", label: "已結案" },
  { id: "unreachable", label: "無法聯絡" },
  { id: "paused", label: "暫停服務" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];

export const FEASIBILITY_OPTIONS = [
  { id: "unknown", label: "未判斷" },
  { id: "feasible", label: "可行" },
  { id: "needs-adjust", label: "需調整" },
  { id: "not-feasible", label: "目前不可行" },
] as const;
export type Feasibility = (typeof FEASIBILITY_OPTIONS)[number]["id"];

export const LEAD_TAGS = [
  { id: "A", label: "A 積極成交" },
  { id: "B", label: "B 條件調整" },
  { id: "C", label: "C 長期等待" },
  { id: "D", label: "D 投入多進展少" },
] as const;
export type LeadTag = (typeof LEAD_TAGS)[number]["id"];

export type Level = "high" | "mid" | "low";
export const LEVEL_LABEL: Record<Level, string> = { high: "高", mid: "中", low: "低" };

export interface Dimensions {
  urgency: Level;
  readiness: Level;
  flexibility: Level;
  reasons: string[];
  ruleVersion: string;
}

export interface Revision {
  at: string;
  by: "client" | "admin";
  changes: { field: string; label: string; before: string; after: string }[];
}

export interface ContactEvent {
  at: string;
  type: "note" | "contact-removed" | "status" | "resubmitted" | "notify";
  text: string;
}

export interface ConsentRecord {
  at: string;
  policyVersion: string;
  privacyAck: true;
  channel: "form";
}

export interface Lead {
  id: string;
  refCode: string;
  ver: number;
  createdAt: string;
  updatedAt: string;
  source: LeadSource;
  dealType: "rent";
  nickname: string;
  /** 聯絡方式：聯絡上或送出 30 天後刪除，刪除後為 null。 */
  contact: { channel: ContactChannel; value: string } | null;
  contactRemovedAt?: string;
  contactRemovedReason?: "contacted" | "expired";
  contactTimes: ContactTime[];
  requirement: Requirement;
  decision: Decision;
  admin: {
    status: LeadStatus;
    nextFollowUpAt?: string; // YYYY-MM-DD
    lastContactAt?: string;
    feasibility: Feasibility;
    tags: LeadTag[];
    /** 你手動覆寫的維度；沒有覆寫就用系統建議。 */
    dimsOverride?: Partial<Pick<Dimensions, "urgency" | "readiness" | "flexibility">>;
    notes: string;
  };
  dims: Dimensions;
  notify: { status: "pending" | "sent" | "failed" | "skipped"; at?: string; error?: string };
  revisions: Revision[];
  events: ContactEvent[];
  consents: ConsentRecord[];
}

/** 給後台列表用的摘要（不含聯絡方式的值，只標示有沒有）。 */
export interface LeadSummary {
  id: string;
  refCode: string;
  createdAt: string;
  updatedAt: string;
  source: LeadSource;
  nickname: string;
  hasContact: boolean;
  contactChannel: ContactChannel | null;
  status: LeadStatus;
  feasibility: Feasibility;
  nextFollowUpAt?: string;
  tags: LeadTag[];
  dims: Pick<Dimensions, "urgency" | "readiness" | "flexibility">;
  notifyStatus: Lead["notify"]["status"];
  moveIn: string;
  residence: Requirement["residence"];
  entryDate?: string;
  areas: string;
  layouts: string;
  rentMaxMan: number;
}

export const CONTACT_RETENTION_DAYS = 30;
export const DIMENSION_RULE_VERSION = "2026-11-10";

/** 以東京日期計算「今天」：後台的追蹤日、入住日判斷都用東京時間。 */
export function tokyoToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000);
}

/**
 * 系統建議的三個維度。只是提醒，不是成交機率；每個判斷都附原因，後台可以手動改。
 * 規則改了就改 DIMENSION_RULE_VERSION，舊資料保留當時的判斷與版本。
 */
export function computeDimensions(req: Requirement, decision: Decision, now = new Date()): Dimensions {
  const reasons: string[] = [];

  let urgency: Level;
  if (req.moveIn === "1m") urgency = "high";
  else if (req.moveIn === "date" && req.moveInDate) {
    const days = daysBetween(tokyoToday(now), req.moveInDate);
    urgency = days <= 45 ? "high" : days <= 100 ? "mid" : "low";
  } else if (req.moveIn === "2m" || req.moveIn === "3m") urgency = "mid";
  else urgency = "low";
  reasons.push(`急迫${LEVEL_LABEL[urgency]}：入住${req.moveIn === "date" ? ` ${req.moveInDate}` : labelOf(MOVE_IN_OPTIONS, req.moveIn)}`);

  const readiness: Level = decision.onMatch === "apply-asap" ? "high" : decision.onMatch === "view-first" ? "mid" : "low";
  reasons.push(`準備${LEVEL_LABEL[readiness]}：找到時${labelOf(ON_MATCH_OPTIONS, decision.onMatch)}`);

  let flexibility: Level;
  const gap = req.rentIdealMan > 0 ? (req.rentMaxMan - req.rentIdealMan) / req.rentIdealMan : 0;
  const adjustableCount = req.adjustable.filter(id => id !== "keep").length;
  if (req.adjustable.includes("keep")) flexibility = "low";
  else if (gap >= 0.1 && adjustableCount >= 2) flexibility = "high";
  else flexibility = "mid";
  reasons.push(
    req.adjustable.includes("keep")
      ? "彈性低：選了維持原條件"
      : `彈性${LEVEL_LABEL[flexibility]}：預算差 ${Math.round(gap * 100)}%、可調整 ${adjustableCount} 項`,
  );

  return { urgency, readiness, flexibility, reasons, ruleVersion: DIMENSION_RULE_VERSION };
}

export function effectiveDims(lead: Pick<Lead, "dims" | "admin">): Pick<Dimensions, "urgency" | "readiness" | "flexibility"> {
  return { ...pickDims(lead.dims), ...(lead.admin.dimsOverride || {}) };
}

function pickDims(dims: Dimensions) {
  return { urgency: dims.urgency, readiness: dims.readiness, flexibility: dims.flexibility };
}

export function toSummary(lead: Lead): LeadSummary {
  const req = lead.requirement;
  return {
    id: lead.id,
    refCode: lead.refCode,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    source: lead.source,
    nickname: lead.nickname,
    hasContact: Boolean(lead.contact),
    contactChannel: lead.contact?.channel ?? null,
    status: lead.admin.status,
    feasibility: lead.admin.feasibility,
    nextFollowUpAt: lead.admin.nextFollowUpAt,
    tags: lead.admin.tags,
    dims: effectiveDims(lead),
    notifyStatus: lead.notify.status,
    moveIn: req.moveIn === "date" && req.moveInDate ? req.moveInDate : labelOf(MOVE_IN_OPTIONS, req.moveIn),
    residence: req.residence,
    entryDate: req.entryDate,
    areas: req.areas,
    layouts: labelsOf(LAYOUT_OPTIONS, req.layouts),
    rentMaxMan: req.rentMaxMan,
  };
}

const yen = (man: number | undefined) => (man ? `¥${Math.round(man * 10000).toLocaleString("en-US")}` : "—");

/** 需求欄位的顯示方式：變更紀錄與後台個案頁共用。 */
export const REQUIREMENT_FIELDS: { key: keyof Requirement; label: string; format: (req: Requirement) => string }[] = [
  { key: "moveIn", label: "入住時間", format: r => (r.moveIn === "date" ? `指定 ${r.moveInDate ?? "—"}` : labelOf(MOVE_IN_OPTIONS, r.moveIn)) },
  { key: "reasons", label: "搬家原因", format: r => labelsOf(REASON_OPTIONS, r.reasons) + (r.reasonOther ? `（${r.reasonOther}）` : "") },
  { key: "residence", label: "目前住在", format: r => labelOf(RESIDENCE_OPTIONS, r.residence) },
  { key: "visaType", label: "簽證種類", format: r => (r.visaType ? (r.visaType === "other" ? `其他（${r.visaTypeOther || "—"}）` : labelOf(VISA_TYPE_OPTIONS, r.visaType)) : "—") },
  { key: "nationality", label: "國籍", format: r => r.nationality || "—" },
  { key: "entryDate", label: "預計入境", format: r => r.entryDate || "—" },
  { key: "visa", label: "簽證辦理進度", format: r => (r.visa ? labelOf(VISA_OPTIONS, r.visa) : "—") },
  { key: "areas", label: "希望地區", format: r => r.areas || "—" },
  { key: "commuteTarget", label: "每天要去", format: r => r.commuteTarget || "—" },
  { key: "occupants", label: "入住人數", format: r => `${r.occupants} 人` },
  { key: "layouts", label: "房型", format: r => labelsOf(LAYOUT_OPTIONS, r.layouts) },
  { key: "minAreaSqm", label: "最小面積", format: r => (r.minAreaSqm ? `${r.minAreaSqm} ㎡` : "—") },
  { key: "rentIdealMan", label: "理想月租", format: r => yen(r.rentIdealMan) },
  { key: "rentMaxMan", label: "最高月租", format: r => yen(r.rentMaxMan) },
  { key: "initialCostMaxMan", label: "初期費用上限", format: r => yen(r.initialCostMaxMan) },
  { key: "mustHaves", label: "想要的條件", format: r => labelsOf(MUST_HAVE_OPTIONS, r.mustHaves) },
  { key: "top3", label: "最不能妥協", format: r => labelsOf(MUST_HAVE_OPTIONS, r.top3) },
  { key: "adjustable", label: "可以調整", format: r => labelsOf(ADJUSTABLE_OPTIONS, r.adjustable) },
];

export const DECISION_FIELDS: { key: keyof Decision; label: string; format: (d: Decision) => string }[] = [
  { key: "onMatch", label: "找到合適物件時", format: d => labelOf(ON_MATCH_OPTIONS, d.onMatch) },
  { key: "ifNotFound", label: "一個月內找不到", format: d => (d.ifNotFound ? labelOf(IF_NOT_FOUND_OPTIONS, d.ifNotFound) : "—") },
  { key: "otherAgents", label: "其他仲介", format: d => (d.otherAgents ? labelOf(OTHER_AGENTS_OPTIONS, d.otherAgents) : "—") },
  { key: "note", label: "補充說明", format: d => d.note || "—" },
];

/**
 * 需求清單文字：通知信、客人完成頁的「複製我的需求」、後台的「複製需求」共用。
 * 沒填的欄位略過，貼到 LINE 比較精簡。不含稱呼與聯絡方式。
 */
export function requirementLines(req: Requirement, decision?: Decision): string[] {
  const lines = REQUIREMENT_FIELDS
    .map(field => [field.label, field.format(req)] as const)
    .filter(([, value]) => value && value !== "—");
  const decisionLines = decision
    ? DECISION_FIELDS.map(field => [field.label, field.format(decision)] as const).filter(([, value]) => value && value !== "—")
    : [];
  return [...lines, ...decisionLines].map(([label, value]) => `${label}：${value}`);
}

export function requirementText(refCode: string | null, req: Requirement, decision?: Decision): string {
  return [`【找房需求${refCode ? ` ${refCode}` : ""}】`, ...requirementLines(req, decision)].join("\n");
}

/** 比對兩份需求，列出有變的欄位（前值、後值都是顯示用文字）。 */
export function diffRequirement(before: Requirement, after: Requirement, beforeDecision?: Decision, afterDecision?: Decision): Revision["changes"] {
  const changes: Revision["changes"] = [];
  for (const field of REQUIREMENT_FIELDS) {
    const a = field.format(before);
    const b = field.format(after);
    if (a !== b) changes.push({ field: field.key, label: field.label, before: a, after: b });
  }
  if (beforeDecision && afterDecision) {
    for (const field of DECISION_FIELDS) {
      const a = field.format(beforeDecision);
      const b = field.format(afterDecision);
      if (a !== b) changes.push({ field: field.key, label: field.label, before: a, after: b });
    }
  }
  return changes;
}
