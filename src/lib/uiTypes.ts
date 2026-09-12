import type { FormEvent } from "react";
import type { BuyHouseTermItem } from "../data/buyHouseData";
import type { InitialFeeItem, ProcessStep, SpecialTermItem } from "../data/rentGuideData";

export type AppTab = "cards" | "buyHouse" | "calculator" | "chat" | "contact";
export type RentGuideCategory = "all" | "initial" | "terms" | "steps" | "qa";
export type BuyGuideCategory = "all" | "drawing" | "fee" | "steps" | "loans" | "minpaku" | "qa";
export type SendMessage = (event?: FormEvent, customMessage?: string) => void;
// Modal rows share these fields; individual sources may omit optional details.
export type TermDetail = Pick<InitialFeeItem, "name" | "jpName" | "description" | "warning" | "keyPoints" | "category"> &
  Pick<SpecialTermItem, "details"> & Partial<Pick<ProcessStep, "duration">> & { step?: string };
export type SelectTerm = (item: InitialFeeItem | SpecialTermItem | ProcessStep | BuyHouseTermItem | TermDetail | null) => void;
