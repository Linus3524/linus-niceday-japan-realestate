import type { Requirement } from "./schema.js";

/**
 * 「打開費用試算並帶入條件」的交接資料（輕量模組：問卷頁也會用，不能引入費用試算的大型資料）。
 *
 * 新分頁拿不到原分頁的 sessionStorage，所以放 localStorage，只在 2 分鐘內有效、讀到就刪除。
 * 寫入端可以放：
 *   - criteria：已經是費用試算格式的條件（後台用）
 *   - requirement：問卷格式的需求，由費用試算那邊轉換（問卷完成頁用，避免問卷頁載入轉換用的行政區資料）
 */
export const CALCULATOR_HANDOFF_KEY = "linus-calculator-handoff";
export const CALCULATOR_HANDOFF_TTL_MS = 2 * 60 * 1000;

export interface RawCalculatorHandoff {
  criteria?: unknown;
  requirement?: Requirement;
  label: string; // 顯示在費用試算的提示，例如「FH-7K3Q 小林」
  createdAt: number;
}

export function writeCalculatorHandoff(handoff: Omit<RawCalculatorHandoff, "createdAt">): boolean {
  try {
    localStorage.setItem(CALCULATOR_HANDOFF_KEY, JSON.stringify({ ...handoff, createdAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
