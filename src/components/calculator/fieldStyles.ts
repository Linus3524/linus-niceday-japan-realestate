export const guidedChoiceClass = (selected: boolean) =>
  `inline-flex items-center justify-center border px-3 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] focus-visible:ring-offset-2 ${selected
    ? "border-[#007D5A] bg-[#00A174] text-white shadow-[0_4px_10px_rgba(0,161,116,0.20)] hover:bg-[#008F67]"
    : "border-[#D4DDD8] bg-white text-zinc-600 hover:border-[#7DBEAA] hover:bg-[#F3FAF7] hover:text-[#007D5A]"
  }`;

export const guidedSelectChevronClass =
  "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 peer-disabled:text-zinc-400";
