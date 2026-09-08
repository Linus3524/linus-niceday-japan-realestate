/** 去除同業流通／分帳資訊，保留租客與買方需負擔的契約費用。 */
export function consumerListingText(value: string): string {
  const parts = value
    .split(/([、，,。；;\n])/)
    .reduce<string[]>((clauses, part, index, parts) => {
      if (index % 2) return clauses;
      // 數字千分位逗號不能切斷金額。
      if (index > 0 && parts[index - 1] === "," && /\d$/.test(parts[index - 2]) && /^\d{3}(?:\D|$)/.test(part)) {
        if (clauses.length) clauses[clauses.length - 1] += `,${part}`;
      } else clauses.push(part);
      return clauses;
    }, []);
  const filtered = parts.filter(part => {
      const text = part.normalize("NFKC").trim();
      if (/取引態[様樣]|取引形態|交易態[樣様]|交易形態|引取態[樣様]|定休日|定休[:：]|ネット掲載|ネット転載|網路刊登|刊登限制|広告(?:掲載|転載)|廣告(?:刊登|轉載)|客付|元付|仲介会社様|業者様|物確|内見予約|內見預約|内見方法|司法書士.*(?:指定|弊社)|(?:指定|弊社).*司法書士/i.test(text)) return false;
      if (/(?:^|\s)AD\s*[:：]?\s*\d|広告料|廣告費|手[数數]料(?:負担|割合)|(?:仲介|佣金|報酬).*\d+\s*%/i.test(text)) return false;
      if (/^(?:[■●◆※]\s*)?手[数數]料\s*[:：]/.test(text)) return false;
      return Boolean(text);
    });
  return filtered.length === parts.filter(part => part.trim()).length ? value.trim() : filtered.join("。").trim();
}

export function consumerListingFields<T extends object>(fields: T): T {
  const copy = { ...fields };
  for (const key of ["specialNotes", "handoverDetails", "rentalConditions", "renovationDetails", "optionalFacilities", "priceDetails", "hospitalityDetails", "revenueDetails", "unitBreakdown"]) {
    const record = copy as Record<string, unknown>;
    if (typeof record[key] === "string") record[key] = consumerListingText(record[key]);
  }
  return copy;
}
