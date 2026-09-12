import { requestRentAnalysis } from '../lib/calculator/apiClient';
import {
  RentSearchCriteria,
  buildRentRecommendations
} from "../lib/rentAnalysis";
import { trackAction } from "../lib/trackView";
import type { CalculatorState } from './useCalculatorState';

type Context = Pick<CalculatorState,
  "analysisLoading"
  | "setLocationGuardNotice"
  | "setAppliedNotice"
  | "setAnalysisNotice"
  | "setAiResult"
  | "setAnalysisLoading"
  | "aiPrompt"
  | "aiInputLoading"
  | "setAiInputLoading"
  | "setAiInputError"> & {
    validateCommuteCompatibility: (commuteStation?: string) => string;
    buildStructuredRentCriteria: () => RentSearchCriteria;
    syncCriteriaToForm: (criteria: RentSearchCriteria) => void;
  };

/** 自然語言與結構化分析；保留兩組獨立 loading 與本地推薦備援。 */
export function createRentAnalysisActions(context: Context) {
  const {
    analysisLoading,
    validateCommuteCompatibility,
    setLocationGuardNotice,
    buildStructuredRentCriteria,
    setAppliedNotice,
    setAnalysisNotice,
    setAiResult,
    setAnalysisLoading,
    aiPrompt,
    aiInputLoading,
    setAiInputLoading,
    setAiInputError,
    syncCriteriaToForm,
  } = context;

  const analyzeStructuredRent = async () => {
    if (analysisLoading) return;
    const compatibilityNotice = validateCommuteCompatibility();
    if (compatibilityNotice) {
      setLocationGuardNotice(compatibilityNotice);
      return;
    }
    const criteria = buildStructuredRentCriteria();
    const baseRecommendations = buildRentRecommendations(criteria);
    setAppliedNotice(null);
    setAnalysisNotice(null);
    setAiResult(current => current ? { ...current, advisorAdvice: null } : current);
    // 埋點放在 setLoading 之前：這行若拋錯，會跳過下面的 try，
    // 連帶 finally 的 setAnalysisLoading(false) 也不會執行，按鈕就永遠卡在讀取中。
    trackAction("rent-analysis-submitted-structured-form");
    setAnalysisLoading(true);
    try {
      const response = await requestRentAnalysis({ criteria });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.criteria || !Array.isArray(data?.recommendations)) {
        throw new Error(data?.error || "AI 顧問暫時無法完成分析");
      }
      setAiResult({ criteria: data.criteria, recommendations: data.recommendations, advisorAdvice: data.advisorAdvice || null });
    } catch (error: any) {
      setAiResult({ criteria, recommendations: baseRecommendations, advisorAdvice: null });
      setAnalysisNotice(`${error?.message || "AI 顧問暫時無法完成分析"}；已先保留可行性與車站推薦，不顯示固定文字冒充 AI 意見。`);
    } finally {
      setAnalysisLoading(false);
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("guided-rent-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const analyzeNaturalLanguageRent = async () => {
    if (!aiPrompt.trim() || aiInputLoading) return;
    // 同上：埋點必須在 setAiInputLoading(true) 之前，才不會把讀取狀態卡死。
    trackAction("rent-analysis-submitted-natural-language");
    setAiInputLoading(true);
    setAiInputError(null);
    setAnalysisNotice(null);
    setAppliedNotice(null);
    setAiResult(current => current ? { ...current, advisorAdvice: null } : current);
    try {
      const response = await requestRentAnalysis({ prompt: aiPrompt });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.criteria || !Array.isArray(data?.recommendations)) {
        throw new Error(data?.error || "AI 暫時無法整理需求，請稍後再試。");
      }
      syncCriteriaToForm(data.criteria);
      setAiResult({ criteria: data.criteria, recommendations: data.recommendations, advisorAdvice: data.advisorAdvice || null });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById("guided-rent-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    } catch (error: any) {
      setAiInputError(error?.message || "AI 暫時無法整理需求，請稍後再試。");
    } finally {
      setAiInputLoading(false);
    }
  };
  return { analyzeStructuredRent, analyzeNaturalLanguageRent };
}
