export interface RentalConditionGroup {
  id: string;
  title: string;
  items: string[];
}

const groupOrder = [
  ["lease", "租期與續約"],
  ["moveIn", "入住與優惠"],
  ["pet", "寵物條件"],
  ["guarantee", "保證公司"],
  ["fees", "其他費用"],
  ["moveOut", "退租與房屋提醒"],
  ["optional", "選配設施"],
] as const;

export function rentalConditionGroups(raw?: string | null, optionalFacilities?: string | null): RentalConditionGroup[] {
  const grouped = new Map<string, string[]>();
  const clauses = (raw || "")
    .normalize("NFKC")
    .replace(/[,、・]\s*(?=(?:普通賃貸借|契約期間|解約予告|★?キャンペーン|入居日|ペット|M保証|木下グループ保証|木下の賃貸|24Hサポート|鍵交換|消毒代|定額ルーム|室内抗菌|事務手数料|当社指定|12ヵ月|CATV|実入居者|※?退去時))/gu, "。")
    .split(/[。\n]+/u)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    const id = classifyClause(clause);
    const translated = translateRentalClause(clause);
    const items = grouped.get(id) || [];
    if (!items.includes(translated)) items.push(translated);
    grouped.set(id, items);
  }

  if (optionalFacilities?.trim()) {
    const items = optionalFacilities
      .normalize("NFKC")
      .split(/[、，\n]+|(?<!\d),(?!\d)/u)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(translateOptionalFacility);
    if (items.length) grouped.set("optional", [...new Set(items)]);
  }

  return groupOrder.flatMap(([id, title]) => {
    const items = grouped.get(id);
    return items?.length ? [{ id, title, items }] : [];
  });
}

function classifyClause(clause: string) {
  if (/退去|清掃|クリーニング|解約予告|違約金|地平面|見守りサービス/.test(clause)) return "moveOut";
  if (/敷金|礼金|キャンペーン|入居日/.test(clause)) return "moveIn";
  if (/ペット|小型犬|猫\d*匹/.test(clause)) return "pet";
  if (/保証/.test(clause)) return "guarantee";
  if (/賃貸借|契約|更新|賃料改定/.test(clause)) return "lease";
  return "fees";
}

function translateRentalClause(source: string) {
  let text = source.replace(/^[※■●◆\s]+/u, "").trim();
  text = text
    .replace(/^契約条件\s*[：:]\s*/gu, "")
    .replace(/ペット可\s*[：:]\s*小型犬[・、]猫1匹迄敷金2ヶ月預かり/gu, "可養寵物：小型犬或貓限 1 隻，另收 2 個月押金")
    .replace(/敷金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?\s*[・、]?\s*礼金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?(?:キャンペーン中)?/gu, "免押金、免禮金優惠中")
    .replace(/敷金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?/gu, "免押金")
    .replace(/礼金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?/gu, "免禮金")
    .replace(/敷金\s*(\d+)ヶ月\s*礼金\s*(\d+)ヶ月/gu, "押金 $1 個月、禮金 $2 個月")
    .replace(/敷金\s*(\d+)ヶ月/gu, "押金 $1 個月")
    .replace(/礼金\s*(\d+)ヶ月/gu, "禮金 $1 個月")
    .replace(/普通賃貸借\s*(\d+)年契約\s*[（(]更新型[）)]/gu, "普通租賃契約，租期 $1 年（可續約）")
    .replace(/契約期間\s*(\d+)年/gu, "普通租賃契約，租期 $1 年")
    .replace(/更新料\s*新賃料\s*(\d+(?:\.\d+)?)ヶ月/gu, "續約費：新租金 $1 個月")
    .replace(/解約予告\s*(\d+)ヶ月前(?:に当社宛に通知)?/gu, "退租須於 $1 個月前通知")
    .replace(/1、2回目の更新時\s*(\d+(?:\.\d+)?)%の賃料改定あり/gu, "第 1、2 次續約時，租金調整 $1%")
    .replace(/更新料は1回のみ/gu, "續約費僅收取 1 次")
    .replace(/2回目以降の更新料は無い為、安心して永くお住まいいただけます/gu, "第 2 次起不再收取續約費")
    .replace(/入居日\s*[：:]\s*/gu, "可入住日：")
    .replace(/可入住日：即[、,]?内見可/gu, "可立即入住，且可安排看屋")
    .replace(/敷金0[・\s]*礼金0キャンペーン中/gu, "零押金、零禮金優惠中")
    .replace(/[（(]キャンペーンは(\d+)月末日迄の成約となります[）)]/gu, "（須於 $1 月底前完成簽約）")
    .replace(/★?キャンペーンは(\d+)月末日迄の成約となります/gu, "優惠期限：須於 $1 月底前完成簽約")
    .replace(/M保証システム利用料\s*[（(]家賃総額の(\d+)%[〜~～][）)]/gu, "M 保證系統初回費：租金總額 $1% 起")
    .replace(/木下グループ保証\s*[：:]\s*初回保証料(\d+)%[、,]?利用手数料月額([\d,]+円)[、,]?継続保証委託料([\d,]+円)[（(](\d+)年毎[）)]/gu, "木下集團保證：初回費為月租總額 $1%；月額手續費 $2；持續保證委託費 $3（每 $4 年）")
    .replace(/木下の賃貸友の会加入必須[。]?友の会費([\d,]+円)[（(]税込[）)]\s*[/／]月額[。]?入居者補償制度[（(]火災保険[）)]、緊急サポートを含む/gu, "須加入木下租賃友之會：月費 $1（含稅），包含租客補償制度（火災保險）與緊急支援")
    .replace(/木下の賃貸友の会加入必須/gu, "須加入木下租賃友之會")
    .replace(/友の会費([\d,]+円)[（(]税込[）)]\s*[/／]月額/gu, "木下租賃友之會月費：$1（含稅）")
    .replace(/入居者補償制度[（(]火災保険[）)]、緊急サポートを含む/gu, "包含租客補償制度（火災保險）與緊急支援")
    .replace(/[↑→]?エポス保証にて成約となった場合、年次保証料(\d+)万円/gu, "；若使用 Epos 保證簽約，年度保證費 $1 萬円")
    .replace(/24Hサポート料\s*([\d,]+円)\s*[/／]\s*1年/gu, "24 小時生活支援費：$1／年")
    .replace(/鍵交換代\s*([\d,]+円)/gu, "換鎖費：$1")
    .replace(/消毒代\s*([\d,]+円)/gu, "室內消毒費：$1")
    .replace(/定額ルームクリーニング代\s*([\d,]+円)[^。]*/gu, "定額室內清潔費：$1（簽約時支付）")
    .replace(/室内抗菌処理代\s*([\d,]+円)/gu, "室內抗菌處理費：$1")
    .replace(/事務手数料\s*([\d,]+円)/gu, "簽約事務手續費：$1")
    .replace(/当社指定賃貸入居者総合保険加入の事\s*[（(]別途費用[）)]/gu, "須加入指定租客綜合保險，費用另計")
    .replace(/退去時清掃費用、更新時更新費用等がございます/gu, "另有退租清潔費及續約相關費用，金額待確認")
    .replace(/地平面より下がる住居が一部ございます/gu, "部分住宅空間低於地面，須確認本戶位置、採光與通風")
    .replace(/12ヵ月未満の解約時、?賃料1ヵ月分の違約金/gu, "租期未滿 12 個月解約時，須支付 1 個月租金作為違約金")
    .replace(/CATV[・、]?BS・CS110°[・、]?インターネットは利用可否確認のうえ別途契約・費用/gu, "CATV、BS／CS 與網路須先確認能否使用，並另行簽約付費")
    .replace(/実入居者が61歳以上の場合、指定見守りサービス加入必須[（(]費用要確認[）)]/gu, "實際入住者年滿 61 歲時，須加入指定守護服務，費用待確認")
    .replace(/ペット飼育不可/gu, "不可飼養寵物")
    .replace(/(\d+)ヶ月/gu, "$1 個月")
    .replace(/(\d+)万円/gu, "$1 萬円")
    .replace(/賃料/gu, "租金")
    .replace(/更新料/gu, "續約費")
    .replace(/保証料/gu, "保證費")
    .replace(/別途費用/gu, "費用另計")
    .replace(/税込/gu, "含稅")
    .replace(/[※★]/gu, "")
    .replace(/）(?=第)/gu, "）；")
    .replace(/\s+/gu, " ")
    .trim();

  return /[\u3040-\u30ff]/u.test(text)
    ? "圖紙另有個別日文特約，簽約前請核對中文契約譯本。"
    : text;
}

function translateOptionalFacility(source: string) {
  const text = source
    .replace(/バイク置き場/gu, "機車停車位")
    .replace(/地下駐輪場/gu, "地下自行車停車場")
    .replace(/登録料/gu, "登錄費")
    .replace(/要確認/gu, "需確認")
    .replace(/サイズ制限有/gu, "有尺寸限制")
    .replace(/駐車場\s*[：:]\s*施設なし[・、]空きなし/gu, "無停車場，且無空位")
    .replace(/駐輪場\s*[：:]\s*施設なし[・、]空きなし/gu, "無自行車停車場，且無空位")
    .replace(/ペット飼育不可/gu, "不可飼養寵物")
    .replace(/([\d,]+円)\s*[/／]\s*月/gu, "$1／月")
    .replace(/機車停車位\s*[（(]([^）)]+)[）)]\s*※?需確認/gu, "機車停車位：$1（需確認）")
    .replace(/\s*:\s*/gu, "：")
    .replace(/登錄費(?=\d)/gu, "登錄費 ")
    .replace(/\(([^)]+)\)/gu, "（$1）")
    .replace(/\s+/gu, " ")
    .trim();
  return /[\u3040-\u30ff]/u.test(text)
    ? "另有選配設施，費用與使用條件待核對。"
    : text;
}
