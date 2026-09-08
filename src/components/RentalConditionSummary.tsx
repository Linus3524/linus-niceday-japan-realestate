import { rentalConditionGroups } from "../lib/rentalConditionDisplay";
import { parseAndExplainSpecialNotes } from "../lib/specialNotesParser";
import { Car, CheckCircle2, Clock3, Coins, FileWarning, House, ShieldCheck } from "lucide-react";

const noteTopics = [
  /寵物|ペット|小型犬|貓|猫/u,
  /清潔|清掃|クリーニング/u,
  /換鎖|鍵交換/u,
  /保證|保証/u,
  /保險|保険/u,
  /24\s*小時|24時間|生活支援|緊急支援|サポート/u,
  /停車|駐車/u,
  /自行車|駐輪/u,
  /違約|解約/u,
] as const;

function topicsOf(text: string) {
  return noteTopics.flatMap((pattern, index) => pattern.test(text) ? [index] : []);
}

export function RentalConditionSummary({
  rentalConditions,
  optionalFacilities,
  specialNotes,
  shikibiki,
  hasCancellationPenalty,
}: {
  rentalConditions?: string | null;
  optionalFacilities?: string | null;
  specialNotes?: string | null;
  shikibiki?: string | null;
  hasCancellationPenalty?: boolean;
}) {
  const groups = rentalConditionGroups(rentalConditions, optionalFacilities);
  const coveredTopics = new Set(topicsOf(`${rentalConditions || ""} ${optionalFacilities || ""}`));
  const extraNotes = parseAndExplainSpecialNotes(specialNotes).filter((item) => {
    const topics = topicsOf(`${item.title} ${item.explanation} ${item.rawJapanese || ""}`);
    return topics.length === 0 || topics.some((topic) => !coveredTopics.has(topic));
  });
  if (!groups.length && !extraNotes.length) return null;

  const getItems = (id: string, fallback: string) => groups.find((group) => group.id === id)?.items || [fallback];
  const lease = getItems("lease", "圖紙未載明租期與續約條件，待核對正式契約。");
  const moveIn = [...getItems("moveIn", "圖紙未載明入住日或優惠條件。"), ...(groups.find((group) => group.id === "pet")?.items || [])];
  const guarantee = getItems("guarantee", "圖紙未載明保證公司方案與費用。");
  const fees = getItems("fees", "圖紙未載明其他一次性或年度費用。");
  const moveOut = getItems("moveOut", "圖紙未載明退租清潔費或房屋個別提醒。");
  const optional = getItems("optional", "圖紙未載明停車或駐輪選配條件。");
  const extraContract = extraNotes.filter((item) => ["合約特約", "入住條件"].includes(item.category)).map((item) => `${item.title}：${item.explanation}`);
  const extraFees = extraNotes.filter((item) => item.category === "費用約定" || /支援|保險|保證/u.test(`${item.title}${item.explanation}`)).map((item) => `${item.title}：${item.explanation}`);
  const usedExtra = new Set([...extraContract, ...extraFees]);
  const extraOther = extraNotes.map((item) => `${item.title}：${item.explanation}`).filter((item) => !usedExtra.has(item));

  const sections = [
    {
      title: "合約與入住",
      icon: House,
      rows: [
        { title: "租期與續約", icon: Clock3, items: lease },
        { title: "入住與優惠", icon: House, items: [...new Set(moveIn)] },
        ...(extraContract.length ? [{ title: "其他入住與契約條件", icon: FileWarning, items: extraContract }] : []),
      ],
    },
    {
      title: "費用與保證",
      icon: Coins,
      rows: [
        { title: "保證與保險", icon: ShieldCheck, items: guarantee },
        { title: "附加費用與服務", icon: Coins, items: [...fees, ...extraFees] },
      ],
    },
    {
      title: "退租與違約",
      icon: FileWarning,
      rows: [
        {
          title: "敷引約定",
          icon: CheckCircle2,
          items: [shikibiki
            ? `圖紙載明 ${shikibiki}，退租時依約扣抵。`
            : "圖紙未載明敷引；押金扣除承租人修繕責任後，餘額依契約返還。"],
        },
        { title: "退租與提前解約", icon: FileWarning, items: moveOut },
      ],
    },
    {
      title: "附加條件與備考",
      icon: Car,
      rows: [{ title: "停車、駐輪與其他條件", icon: Car, items: [...optional, ...extraOther] }],
    },
  ];

  return (
    <section aria-label="租賃契約重點條款" className="font-sans [font-family:var(--font-sans)]">
      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.title} className="border border-[#DDE3DF] bg-white px-4 py-3.5">
              <div className="flex items-center gap-2 border-b border-[#E7ECE9] pb-2.5 font-sans text-sm font-bold text-[#007D5A] [font-family:var(--font-sans)]">
                <SectionIcon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <p>{section.title}</p>
              </div>
              <div>
                {section.rows.map((row, index) => {
                  const RowIcon = row.icon;
                  return (
                    <div key={row.title} className={`grid gap-2 py-3 font-sans [font-family:var(--font-sans)] sm:grid-cols-[9.5rem_1fr] ${index > 0 ? "border-t border-[#EEF1EF]" : ""}`}>
                      <div className="flex items-start gap-2 font-sans text-xs font-bold text-[#1A2A22] [font-family:var(--font-sans)]">
                        <RowIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#007D5A]" strokeWidth={1.8} />
                        <span>{row.title}</span>
                      </div>
                      <ul className="list-disc space-y-1.5 pl-4 font-sans text-xs leading-relaxed text-[#55635B] marker:text-[#007D5A] [font-family:var(--font-sans)]">
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
