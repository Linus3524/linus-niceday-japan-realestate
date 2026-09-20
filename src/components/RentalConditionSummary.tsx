import { buildRentalConditionSections } from "../lib/rentalConditionDisplay";
import type { RentalConditionItem, SpecialNoteItem } from "../lib/rentalConditions";
import { Car, CheckCircle2, Clock3, Coins, FileWarning, House, ShieldCheck, type LucideIcon } from "lucide-react";

const sectionIcons: Record<string, LucideIcon> = {
  "契約與入住": House,
  "合約與入住": House,
  "保證、保險與附加費用": Coins,
  "費用、保證與保險": Coins,
  "費用與保證": Coins,
  "退租與違約": FileWarning,
  "附加條件與備考": Car,
};

const rowIcons: Record<string, LucideIcon> = {
  "租期與契約更新": Clock3,
  "租期與續約": Clock3,
  "入住與優惠": House,
  "其他入住與契約條件": FileWarning,
  "保證費與火災保險": ShieldCheck,
  "保證與保險": ShieldCheck,
  "附加費用與服務": Coins,
  "敷引約定": CheckCircle2,
  "退租與提前解約": FileWarning,
  "停車、駐輪與其他條件": Car,
};

export function RentalConditionSummary({
  rentalConditions,
  rentalConditionItems,
  optionalFacilities,
  specialNotes,
  specialNoteItems,
  shikibiki,
  guaranteeFee,
  insuranceFee,
  renewalFee,
  totalMonthlyCost,
  hasCancellationPenalty,
}: {
  rentalConditions?: string | null;
  rentalConditionItems?: RentalConditionItem[] | null;
  optionalFacilities?: string | null;
  specialNotes?: string | null;
  specialNoteItems?: SpecialNoteItem[] | null;
  shikibiki?: string | null;
  guaranteeFee?: string | null;
  insuranceFee?: string | null;
  renewalFee?: string | null;
  totalMonthlyCost?: number | null;
  hasCancellationPenalty?: boolean;
}) {
  const sections = buildRentalConditionSections({
    rentalConditions,
    rentalConditionItems,
    optionalFacilities,
    specialNotes,
    specialNoteItems,
    shikibiki,
    guaranteeFee,
    insuranceFee,
    renewalFee,
    totalMonthlyCost,
  });
  if (!sections.length) return null;

  return (
    <section aria-label="租賃契約重點條款" className="font-sans [font-family:var(--font-sans)]">
      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => {
          const SectionIcon = sectionIcons[section.title] ?? House;
          return (
            <div key={section.title} className="border border-[#DDE3DF] bg-white px-4 py-3.5">
              <div className="flex items-center gap-2 border-b border-[#ECEFEC] pb-2.5 font-sans text-sm font-bold text-[#00A174] [font-family:var(--font-sans)]">
                <SectionIcon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <p>{section.title}</p>
              </div>
              <div>
                {section.rows.map((row, index) => {
                  const RowIcon = rowIcons[row.title] ?? FileWarning;
                  return (
                    <div key={row.title} className={`grid gap-2 py-3 font-sans [font-family:var(--font-sans)] sm:grid-cols-[9.5rem_1fr] ${index > 0 ? "border-t border-[#ECEFEC]" : ""}`}>
                      <div className="flex items-start gap-2 font-sans text-xs font-bold text-[#1A2A22] [font-family:var(--font-sans)]">
                        <RowIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00A174]" strokeWidth={1.8} />
                        <span>{row.title}</span>
                      </div>
                      <ul className="list-disc space-y-1.5 pl-4 font-sans text-xs leading-relaxed text-[#3F5147] marker:text-[#00A174] [font-family:var(--font-sans)]">
                        {row.items.map((item) => <li key={item} className="break-words pl-0.5">{item}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
