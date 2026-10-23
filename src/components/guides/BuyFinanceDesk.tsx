import { useState } from "react";
import { ArrowRight, Building2, ClipboardCheck, Globe2, Landmark, MapPin, Search } from "lucide-react";
import { japaneseBanks, taiwaneseBanks, minpakuRules } from "../../data/buyHouseData";
import { AdviceNote } from "../AdviceNote";
import { RyokanPermitDesk } from "./RyokanPermitDesk";

function Facts({ items }: { items: [string, string][] }) {
  return <dl className="finance-facts">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function LodgingFacts({ items }: { items: [string, string][] }) {
  return <dl className="lodging-rule-facts">{items.map(([label, value]) => <div key={label}>
    <dt>{label}</dt>
    <dd>{value.split(/(?<=[。；])\s*(?=\S)/u).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</dd>
  </div>)}</dl>;
}

function Notes({ items, title = "Linus 實務提醒" }: { items: string[]; title?: string }) {
  return <AdviceNote className="mt-6" title={title}><ul>{items.map((item, i) => <li key={i}>{item.replace(/^[⚠️•·\-\s*]+/u, "")}</li>)}</ul></AdviceNote>;
}

export function BuyLoanDesk() {
  const [mode, setMode] = useState<"japan" | "overseas">("japan");
  const [japanIndex, setJapanIndex] = useState(0);
  const [overseasIndex, setOverseasIndex] = useState(0);
  const overseas = mode === "overseas";
  const japanBank = japaneseBanks[japanIndex];
  const overseasBank = taiwaneseBanks[overseasIndex];
  const selectedIndex = overseas ? overseasIndex : japanIndex;
  const banks = overseas ? taiwaneseBanks.map(b => ({ name: b.name, rate: b.interestRate })) : japaneseBanks;
  const selectedName = overseas ? overseasBank.name : japanBank.name;
  return <div className="finance-desk">
    <div className="finance-intro"><span>找到適合自己的貸款路徑</span><p>先依居住與工作狀況選擇，再逐家比較資格、資金與物件條件。</p></div>
    <div className="finance-switch" aria-label="融資對象">
      <button className="ui-switch-large" type="button" aria-pressed={!overseas} onClick={() => setMode("japan")}><Landmark /><span><strong>在日工作者</strong><small>在留資格・年收・工作年資</small></span><ArrowRight /></button>
      <button className="ui-switch-large" type="button" aria-pressed={overseas} onClick={() => setMode("overseas")}><Globe2 /><span><strong>海外買方</strong><small>台系銀行・資產・物件條件</small></span><ArrowRight /></button>
    </div>
    <div className="finance-workspace">
      <nav className="finance-bank-list" aria-label="選擇銀行"><p className="finance-eyebrow">金融機構 <span>{banks.length} 家方案</span></p>{banks.map((bank, index) => <button key={bank.name} type="button" aria-pressed={selectedIndex === index} onClick={() => overseas ? setOverseasIndex(index) : setJapanIndex(index)}><strong>{bank.name}</strong><small>{bank.rate}</small><ArrowRight aria-hidden="true" /></button>)}</nav>
      <section className="finance-bank-detail" aria-label={`${selectedName}融資條件`}>
        <header><span className="finance-eyebrow">{overseas ? "海外買方融資" : "在日工作者融資"}</span><h3>{selectedName}</h3><p className="finance-rate">{overseas ? overseasBank.interestRate : japanBank.rate}</p><small>利率與審核條件請以銀行最新公告及個別審查為準。</small></header>
        {overseas ? <>
          <div className="finance-keyfacts"><Facts items={[["申貸對象", overseasBank.object], ["起貸金額／最高成數", overseasBank.amountLimit], ["最長貸款期限", overseasBank.termLimit]]} /></div>
          <div className="finance-detail-grid"><section><h4><ClipboardCheck />申請人條件</h4><Facts items={[["年齡", overseasBank.ageLimit], ["收入／資產", overseasBank.incomeAsset], ["對保／開戶", overseasBank.signingReq], ["還款／租金帳戶", overseasBank.rentAccount]]} /></section><section><h4><Building2 />物件與貸款</h4><Facts items={[["物件／屋齡", overseasBank.propertyReq], ["承作區域", overseasBank.areaLimit], ["還款方式", overseasBank.repayment], ["提前清償費", overseasBank.prepayFee]]} /></section></div>
          <Notes items={overseasBank.others} />
        </> : <>
          <div className="finance-keyfacts"><Facts items={[["年收入門檻", japanBank.incomeReq], ["自備款／成數", japanBank.downPayment], ["貸款額度", japanBank.amountLimit]]} /></div>
          <section className="finance-eligibility"><h4><ClipboardCheck />申請資格與審查條件</h4><Facts items={[["在留資格", japanBank.visaReq], ["工作年資", japanBank.workYears], ["年齡／其他限制", japanBank.ageLimit]]} /></section>
          <Notes items={japanBank.note.split("\n").filter(line => line.trim())} />
        </>}
      </section>
    </div>
  </div>;
}

interface LodgingProps {
  minpakuWardOrder: string[];
  getMinpakuLimitLabel: (value: string) => string;
  getMinpakuAreaLabel: (value: string) => string;
}

export function BuyLodgingDesk({ minpakuWardOrder, getMinpakuLimitLabel, getMinpakuAreaLabel }: LodgingProps) {
  const [mode, setMode] = useState<"minpaku" | "ryokan">("minpaku");
  const [district, setDistrict] = useState(minpakuWardOrder[0] || minpakuRules[0].district);
  const [query, setQuery] = useState("");
  const selected = minpakuRules.find(item => item.district === district) || minpakuRules[0];
  const wards = [...minpakuRules].sort((a, b) => minpakuWardOrder.indexOf(a.district) - minpakuWardOrder.indexOf(b.district)).filter(item => item.district.includes(query.trim()));
  return <div className="finance-desk lodging-desk">
    <div className="finance-intro"><span>先分清制度，再確認物件能不能做</span><p>住宅宿泊事業看各區營業限制；旅館業則看許可、建築與消防條件。</p></div>
    <div className="finance-switch" aria-label="住宿營業制度">
      <button className="ui-switch-large" type="button" aria-pressed={mode === "minpaku"} onClick={() => setMode("minpaku")}><MapPin /><span><strong>住宅宿泊事業・民宿</strong><small>180 天上限・東京都 23 區規則</small></span><ArrowRight /></button>
      <button className="ui-switch-large" type="button" aria-pressed={mode === "ryokan"} onClick={() => setMode("ryokan")}><Building2 /><span><strong>旅館業・簡易宿所</strong><small>營業許可・建築與消防要求</small></span><ArrowRight /></button>
    </div>
    {mode === "minpaku" ? <>
      <div className="lodging-overview">
        <div className="lodging-annual-limit"><small>住宅宿泊事業・全國共同上限</small><strong>180<span>天／年</span></strong></div>
        <div className="lodging-overview-copy"><h3>180 天是上限，實際還要看各區規定</h3><p>先看營業天數與期間，再確認物件所在地的受限區域、管理及周知要求。</p><p className="lodging-overview-caption">家主居住型與不在型，適用規則可能不同。</p></div>
      </div>
      <div className="finance-workspace lodging-workspace">
        <nav className="lodging-ward-list" aria-label="選擇行政區"><label className="lodging-search"><Search aria-hidden="true" /><input aria-label="搜尋行政區" placeholder="搜尋行政區" value={query} onChange={event => setQuery(event.target.value)} /></label><div>{wards.map(item => <button type="button" key={item.district} aria-pressed={selected.district === item.district} onClick={() => setDistrict(item.district)}><strong>{item.district}</strong><small>{getMinpakuLimitLabel(item.daysLimit)}</small><ArrowRight aria-hidden="true" /></button>)}{wards.length === 0 && <p className="lodging-empty">找不到這個行政區，請試試其他名稱。</p>}</div></nav>
        <section className="finance-bank-detail lodging-ward-detail" aria-label={`${selected.district}民宿規定`}>
          <header><div><span className="finance-eyebrow">住宅宿泊事業 · 區條例摘要</span><h3><MapPin />{selected.district}</h3></div><p className="lodging-limit"><span>限制摘要</span><strong>{getMinpakuLimitLabel(selected.daysLimit)}</strong></p></header>
          <LodgingFacts items={[["營業天數", selected.daysLimit], ["營業限制", selected.rules], ["受限區域", selected.areaLimit], ["管理／周知", selected.managerReq]]} />
          <div className="lodging-area"><MapPin /><span>區域分類</span><strong>{getMinpakuAreaLabel(selected.areaLimit)}</strong></div>
        </section>
      </div>
      <Notes title="投資前必查" items={["最新區條例、用途地域、建築與消防條件、管理規約及管理體制。上方內容是快速篩選用摘要，不能取代自治體就個別物件作出的確認。"]} />
    </> : <RyokanPermitDesk />}
  </div>;
}
