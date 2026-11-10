import {
  questionnaireHref,
  type QuestionnaireType,
} from "../lib/findHome/routes";
export function QuestionnaireSwitch({
  selected,
}: {
  selected: QuestionnaireType;
}) {
  return (
    <nav
      className="mb-5 grid grid-cols-2 border border-[#C9D2CD] bg-white"
      aria-label="找房問卷類型"
    >
      {(
        [
          ["rent", "租房需求"],
          ["buy", "買房需求"],
        ] as const
      ).map(([type, label]) => (
        <a
          key={type}
          href={questionnaireHref(type, window.location.search)}
          aria-current={selected === type ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A174] ${selected === type ? "bg-[#00A174] font-bold text-white" : "text-[#3F5147] hover:bg-[#F0FAF6]"}`}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
