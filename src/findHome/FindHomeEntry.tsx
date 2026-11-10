import { useEffect } from "react";
import { trackSource } from "../lib/trackView";
import { Home, KeyRound } from "lucide-react";
import { FindHomeApp } from "./FindHomeApp";
import { BuyHomeApp } from "./BuyHomeApp";
import { questionnaireHref, questionnaireType } from "../lib/findHome/routes";
import { LINE_URL } from "./FormFields";
export function FindHomeEntry() {
  const type = questionnaireType(window.location.search);
  useEffect(() => {
    trackSource();
    document.title =
      type === "buy"
        ? "日本買房需求問卷｜LINUS住好日"
        : type === "rent"
          ? "日本租房需求問卷｜LINUS住好日"
          : "日本租房・買房需求問卷｜LINUS住好日";
  }, [type]);
  if (type === "rent") return <FindHomeApp />;
  if (type === "buy") return <BuyHomeApp />;
  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]">
      <header
        className="border-b border-[#DDE3DF] bg-white"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-14 max-w-[560px] items-center justify-between px-4">
          <a href="/" className="font-serif text-[15px] font-bold">
            LINUS 住好日
          </a>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-bold text-[#00A174]"
          >
            直接 LINE 我
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] space-y-6 px-4 py-10 sm:py-14">
        <div className="space-y-3">
          <h1 className="font-serif text-[28px] font-bold leading-snug">
            你想在日本租房，
            <br />
            還是買房？
          </h1>
          <p className="text-[14px] leading-relaxed text-[#3F5147]">
            選擇你的找房需求，填好條件與聯絡方式，Linus 會主動和你確認方向。
          </p>
        </div>
        <div className="space-y-3">
          {(
            [
              {
                type: "rent",
                title: "我要租房",
                body: "入住時間、月租預算、通勤與生活條件。",
                Icon: KeyRound,
              },
              {
                type: "buy",
                title: "我要買房",
                body: "現金或貸款、自住或投資、購屋預算與看房安排。",
                Icon: Home,
              },
            ] as const
          ).map(({ type, title, body, Icon }) => (
            <a
              key={type}
              href={questionnaireHref(type, window.location.search)}
              className="group flex min-h-28 items-center gap-4 border border-[#C9D2CD] bg-white px-5 py-6 hover:border-[#00A174] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A174]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#F0FAF6] text-[#00A174]">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-[19px] font-bold group-hover:text-[#00A174]">
                  {title}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[#66736C]">
                  {body}
                </span>
              </span>
            </a>
          ))}
        </div>
        <p className="text-[12px] leading-relaxed text-[#66736C]">
          約 3
          分鐘，用綽號也可以。兩種問卷會各自保留進度，中途離開也能回來繼續填寫。
        </p>
      </main>
    </div>
  );
}
