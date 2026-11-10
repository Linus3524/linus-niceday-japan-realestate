export type QuestionnaireType = "rent" | "buy";
export function questionnaireType(search: string): QuestionnaireType | null {
  const type = new URLSearchParams(search).get("type");
  return type === "rent" || type === "buy" ? type : null;
}
export function questionnaireHref(type: QuestionnaireType, search = "") {
  const params = new URLSearchParams(search);
  params.set("type", type);
  return `/find-home?${params.toString()}`;
}
