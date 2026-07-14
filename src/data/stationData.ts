export interface StationInfo {
  name: string;
  type: "major" | "regular" | "minor";
  lines: string[];
}

export const districtStations: Record<string, StationInfo[]> = {
  // === 東京都 23 區 ===
  "千代田區": [
    { name: "東京", type: "major", lines: ["JR山手線", "JR中央線", "丸之內線", "新幹線"] },
    { name: "秋葉原", type: "major", lines: ["JR山手線", "JR總武線", "日比谷線", "筑波快線"] },
    { name: "神田", type: "major", lines: ["JR山手線", "銀座線", "JR中央線"] },
    { name: "御茶之水", type: "major", lines: ["JR中央線", "JR總武線", "丸之內線", "千代田線"] },
    { name: "有樂町", type: "major", lines: ["JR山手線", "有樂町線", "日比谷線"] },
    { name: "市谷", type: "major", lines: ["JR總武線", "有樂町線", "南北線", "新宿線"] },
    { name: "神保町", type: "regular", lines: ["半藏門線", "三田線", "新宿線"] },
    { name: "半藏門", type: "regular", lines: ["半藏門線"] },
    { name: "九段下", type: "regular", lines: ["東西線", "半藏門線", "新宿線"] },
    { name: "大手町", type: "regular", lines: ["丸之內線", "東西線", "千代田線", "半藏門線", "三田線"] },
    { name: "日比谷", type: "regular", lines: ["日比谷線", "千代田線", "三田線"] },
    { name: "霞關", type: "regular", lines: ["丸之內線", "日比谷線", "千代田線"] },
    { name: "永田町", type: "regular", lines: ["有樂町線", "南北線", "半藏門線"] },
    { name: "竹橋", type: "minor", lines: ["東西線"] },
    { name: "二重橋前", type: "minor", lines: ["千代田線"] },
    { name: "麴町", type: "minor", lines: ["有樂町線"] },
    { name: "櫻田門", type: "minor", lines: ["有樂町線"] }
  ],
  "港區": [
    { name: "品川", type: "major", lines: ["JR山手線", "JR東海道線", "京急本線", "新幹線"] },
    { name: "新橋", type: "major", lines: ["JR山手線", "銀座線", "淺草線", "百合海鷗線"] },
    { name: "六本木", type: "major", lines: ["日比谷線", "大江戶線"] },
    { name: "表參道", type: "major", lines: ["銀座線", "千代田線", "半藏門線"] },
    { name: "田町", type: "major", lines: ["JR山手線", "JR京濱東北線"] },
    { name: "濱松町", type: "major", lines: ["JR山手線", "東京單軌電車", "大江戶線"] },
    { name: "赤坂見附", type: "major", lines: ["丸之內線", "銀座線"] },
    { name: "赤坂", type: "regular", lines: ["千代田線"] },
    { name: "青山一丁目", type: "regular", lines: ["銀座線", "半藏門線", "大江戶線"] },
    { name: "麻布十番", type: "regular", lines: ["南北線", "大江戶線"] },
    { name: "白金高輪", type: "regular", lines: ["南北線", "三田線"] },
    { name: "泉岳寺", type: "regular", lines: ["淺草線", "京急本線"] },
    { name: "汐留", type: "regular", lines: ["大江戶線", "百合海鷗線"] },
    { name: "廣尾", type: "regular", lines: ["日比谷線"] },
    { name: "乃木坂", type: "regular", lines: ["千代田線"] },
    { name: "日出", type: "minor", lines: ["百合海鷗線"] },
    { name: "竹芝", type: "minor", lines: ["百合海鷗線"] },
    { name: "御成門", type: "minor", lines: ["三田線"] },
    { name: "神谷町", type: "minor", lines: ["日比谷線"] },
    { name: "虎之門之丘", type: "minor", lines: ["日比谷線"] }
  ],
  "中央區": [
    { name: "日本橋", type: "major", lines: ["銀座線", "東西線", "淺草線"] },
    { name: "銀座", type: "major", lines: ["丸之內線", "銀座線", "日比谷線"] },
    { name: "八丁堀", type: "major", lines: ["JR京葉線", "日比谷線"] },
    { name: "月島", type: "major", lines: ["有樂町線", "大江戶線"] },
    { name: "茅場町", type: "regular", lines: ["東西線", "日比谷線"] },
    { name: "築地", type: "regular", lines: ["日比谷線"] },
    { name: "人形町", type: "regular", lines: ["日比谷線", "淺草線"] },
    { name: "新富町", type: "regular", lines: ["有樂町線"] },
    { name: "水天宮前", type: "regular", lines: ["半藏門線"] },
    { name: "東日本橋", type: "regular", lines: ["淺草線"] },
    { name: "勝鬨", type: "regular", lines: ["大江戶線"] },
    { name: "築地市場", type: "regular", lines: ["大江戶線"] },
    { name: "濱町", type: "minor", lines: ["新宿線"] },
    { name: "馬喰橫山", type: "minor", lines: ["新宿線"] },
    { name: "新日本橋", type: "minor", lines: ["JR總武快速線"] },
    { name: "寶町", type: "minor", lines: ["淺草線"] }
  ],
  "澀谷區": [
    { name: "澀谷", type: "major", lines: ["JR山手線", "東京地下鐵各線", "東急各線", "京王井之頭線"] },
    { name: "惠比壽", type: "major", lines: ["JR山手線", "日比谷線", "JR埼京線"] },
    { name: "原宿", type: "major", lines: ["JR山手線", "千代田線"] },
    { name: "代代木", type: "major", lines: ["JR山手線", "大江戶線", "JR中央總武線"] },
    { name: "代代木上原", type: "regular", lines: ["千代田線", "小田急小田原線"] },
    { name: "笹塚", type: "regular", lines: ["京王線", "京王新線"] },
    { name: "幡谷", type: "regular", lines: ["京王新線"] },
    { name: "初台", type: "regular", lines: ["京王新線"] },
    { name: "千駄谷", type: "regular", lines: ["JR中央總武線"] },
    { name: "廣尾", type: "regular", lines: ["日比谷線"] },
    { name: "北參道", type: "minor", lines: ["副都心線"] },
    { name: "代代木八幡", type: "minor", lines: ["小田急小田原線"] },
    { name: "參宮橋", type: "minor", lines: ["小田急小田原線"] },
    { name: "神泉", type: "minor", lines: ["京王井之頭線"] }
  ],
  "目黑區": [
    { name: "中目黑", type: "major", lines: ["東急東橫線", "日比谷線"] },
    { name: "目黑", type: "major", lines: ["JR山手線", "南北線", "三田線", "東急目黑線"] },
    { name: "自由之丘", type: "major", lines: ["東急東橫線", "東急大井町線"] },
    { name: "祐天寺", type: "regular", lines: ["東急東橫線"] },
    { name: "學藝大學", type: "regular", lines: ["東急東橫線"] },
    { name: "都立大學", type: "regular", lines: ["東急東橫線"] },
    { name: "洗足", type: "minor", lines: ["東急目黑線"] },
    { name: "駒場東大前", type: "minor", lines: ["京王井之頭線"] },
    { name: "池尻大橋", type: "minor", lines: ["東急田園都市線"] },
    { name: "綠丘", type: "minor", lines: ["東急大井町線"] }
  ],
  "新宿區": [
    { name: "新宿", type: "major", lines: ["JR山手線/中央線", "東京地下鐵各線", "都營新宿/大江戶線", "小田急", "京王"] },
    { name: "高田馬場", type: "major", lines: ["JR山手線", "東西線", "西武新宿線"] },
    { name: "四谷", type: "major", lines: ["JR中央總武線", "丸之內線", "南北線"] },
    { name: "信濃町", type: "major", lines: ["JR中央總武線"] },
    { name: "新大久保", type: "regular", lines: ["JR山手線"] },
    { name: "西武新宿", type: "regular", lines: ["西武新宿線"] },
    { name: "落合", type: "regular", lines: ["東西線"] },
    { name: "新宿三丁目", type: "regular", lines: ["丸之內線", "副都心線", "新宿線"] },
    { name: "都廳前", type: "regular", lines: ["大江戶線"] },
    { name: "曙橋", type: "regular", lines: ["新宿線"] },
    { name: "神樂坂", type: "regular", lines: ["東西線"] },
    { name: "新宿御苑前", type: "regular", lines: ["丸之內線"] },
    { name: "下落合", type: "minor", lines: ["西武新宿線各停"] },
    { name: "中井", type: "minor", lines: ["西武新宿線", "大江戶線"] },
    { name: "若松河田", type: "minor", lines: ["大江戶線各停"] },
    { name: "面影橋", type: "minor", lines: ["都電荒川線"] },
    { name: "牛込神樂坂", type: "minor", lines: ["大江戶線"] }
  ],
  "台東區": [
    { name: "上野", type: "major", lines: ["JR山手線/常磐線", "銀座線", "日比谷線", "新幹線"] },
    { name: "淺草", type: "major", lines: ["銀座線", "淺草線", "東武伊勢崎線"] },
    { name: "日暮里", type: "major", lines: ["JR山手線", "京成本線", "日暮里舍人線"] },
    { name: "御徒町", type: "regular", lines: ["JR山手線", "大江戶線"] },
    { name: "鶯谷", type: "regular", lines: ["JR山手線"] },
    { name: "藏前", type: "regular", lines: ["淺草線", "大江戶線"] },
    { name: "田原町", type: "regular", lines: ["銀座線"] },
    { name: "三之輪", type: "regular", lines: ["日比谷線"] },
    { name: "稻荷町", type: "regular", lines: ["銀座線"] },
    { name: "淺草橋", type: "minor", lines: ["JR總武線", "淺草線各停"] },
    { name: "入谷", type: "minor", lines: ["日比谷線各停"] },
    { name: "新御徒町", type: "minor", lines: ["筑波快線", "大江戶線"] }
  ],
  "江東區": [
    { name: "豐洲", type: "major", lines: ["有樂町線", "百合海鷗線"] },
    { name: "門前仲町", type: "major", lines: ["東西線", "大江戶線"] },
    { name: "清澄白河", type: "major", lines: ["半藏門線", "大江戶線"] },
    { name: "龜戶", type: "major", lines: ["JR總武線", "東武龜戶線"] },
    { name: "東陽町", type: "regular", lines: ["東西線"] },
    { name: "森下", type: "regular", lines: ["新宿線", "大江戶線"] },
    { name: "木場", type: "regular", lines: ["東西線"] },
    { name: "辰巳", type: "regular", lines: ["有樂町線"] },
    { name: "有明", type: "regular", lines: ["百合海鷗線", "臨海線"] },
    { name: "新木場", type: "regular", lines: ["JR京葉線", "有樂町線", "臨海線"] },
    { name: "潮見", type: "minor", lines: ["JR京葉線各停"] },
    { name: "南砂町", type: "minor", lines: ["東西線各停"] },
    { name: "越中島", type: "minor", lines: ["JR京葉線各停"] },
    { name: "住吉", type: "minor", lines: ["半藏門線", "新宿線各停"] }
  ],
  "品川區": [
    { name: "五反田", type: "major", lines: ["JR山手線", "淺草線", "東急池上線"] },
    { name: "大崎", type: "major", lines: ["JR山手線", "JR埼京線", "湘南新宿線", "臨海線"] },
    { name: "大井町", type: "major", lines: ["JR京濱東北線", "東急大井町線", "臨海線"] },
    { name: "武藏小山", type: "regular", lines: ["東急目黑線急行"] },
    { name: "戶越銀座", type: "regular", lines: ["東急池上線"] },
    { name: "青物橫丁", type: "regular", lines: ["京急本線急行"] },
    { name: "北品川", type: "regular", lines: ["京急本線"] },
    { name: "天王洲島", type: "regular", lines: ["東京單軌電車", "臨海線"] },
    { name: "戶越", type: "minor", lines: ["淺草線各停"] },
    { name: "新馬場", type: "minor", lines: ["京急本線各停"] },
    { name: "荏原中延", type: "minor", lines: ["東急池上線各停"] },
    { name: "下神明", type: "minor", lines: ["東急大井町線各停"] }
  ],
  "文京區": [
    { name: "後樂園", type: "major", lines: ["丸之內線", "南北線"] },
    { name: "本鄉三丁目", type: "major", lines: ["丸之內線", "大江戶線"] },
    { name: "根津", type: "major", lines: ["千代田線"] },
    { name: "春日", type: "regular", lines: ["三田線", "大江戶線"] },
    { name: "茗荷谷", type: "regular", lines: ["丸之內線"] },
    { name: "千石", type: "regular", lines: ["三田線"] },
    { name: "白山", type: "regular", lines: ["三田線"] },
    { name: "湯島", type: "regular", lines: ["千代田線"] },
    { name: "東大前", type: "regular", lines: ["南北線"] },
    { name: "江戶川橋", type: "regular", lines: ["有樂町線"] },
    { name: "護國寺", type: "minor", lines: ["有樂町線各停"] },
    { name: "千駄木", type: "minor", lines: ["千代田線各停"] },
    { name: "本駒込", type: "minor", lines: ["南北線各停"] }
  ],
  "墨田區": [
    { name: "錦糸町", type: "major", lines: ["JR總武線", "半藏門線"] },
    { name: "押上 (晴空塔前)", type: "major", lines: ["半藏門線", "淺草線", "京成押上線", "東武本線"] },
    { name: "兩國", type: "major", lines: ["JR總武線", "大江戶線"] },
    { name: "菊川", type: "regular", lines: ["新宿線"] },
    { name: "本所吾妻橋", type: "regular", lines: ["淺草線"] },
    { name: "東向島", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "曳舟", type: "regular", lines: ["東武本線", "東武龜戶線"] },
    { name: "鐘淵", type: "minor", lines: ["東武伊勢崎線各停"] },
    { name: "八廣", type: "minor", lines: ["京成押上線各停"] },
    { name: "小村井", type: "minor", lines: ["東武龜戶線各停"] },
    { name: "東京晴空塔", type: "minor", lines: ["東武本線"] }
  ],
  "大田區": [
    { name: "蒲田", type: "major", lines: ["JR京濱東北線", "東急多摩川線", "東急池上線"] },
    { name: "大森", type: "major", lines: ["JR京濱東北線"] },
    { name: "田園調布", type: "major", lines: ["東急東橫線", "東急目黑線"] },
    { name: "京急蒲田", type: "regular", lines: ["京急本線空港線"] },
    { name: "平和島", type: "regular", lines: ["京急本線急行"] },
    { name: "羽田機場第1・第2航廈", type: "regular", lines: ["東京單軌電車", "京急線"] },
    { name: "池上", type: "regular", lines: ["東急池上線"] },
    { name: "雪谷大塚", type: "regular", lines: ["東急池上線"] },
    { name: "雜色", type: "minor", lines: ["京急本線各停"] },
    { name: "糀谷", type: "minor", lines: ["京急空港線各停"] },
    { name: "大鳥居", type: "minor", lines: ["京急空港線"] },
    { name: "穴守稻荷", type: "minor", lines: ["京急空港線各停"] },
    { name: "昭和島", type: "minor", lines: ["東京單軌電車各停"] }
  ],
  "世田谷區": [
    { name: "三軒茶屋", type: "major", lines: ["東急田園都市線", "世田谷線"] },
    { name: "二子玉川", type: "major", lines: ["東急田園都市線", "東急大井町線"] },
    { name: "下北澤", type: "major", lines: ["小田急小田原線", "京王井之頭線"] },
    { name: "經堂", type: "regular", lines: ["小田急小田原線急行"] },
    { name: "明大前", type: "regular", lines: ["京王線", "京王井之頭線"] },
    { name: "豪德寺", type: "regular", lines: ["小田急小田原線"] },
    { name: "櫻新町", type: "regular", lines: ["東急田園都市線"] },
    { name: "成城學園前", type: "regular", lines: ["小田急小田原線"] },
    { name: "蘆花公園", type: "minor", lines: ["京王線各停"] },
    { name: "千歲烏山", type: "minor", lines: ["京王線各停"] },
    { name: "東松原", type: "minor", lines: ["京王井之頭線各停"] },
    { name: "宮之坂", type: "minor", lines: ["東急世田谷線路面電車"] }
  ],
  "中野區": [
    { name: "中野", type: "major", lines: ["JR中央線", "東西線"] },
    { name: "東中野", type: "major", lines: ["JR中央總武線", "大江戶線"] },
    { name: "中野坂上", type: "major", lines: ["丸之內線", "大江戶線"] },
    { name: "新井藥師前", type: "regular", lines: ["西武新宿線"] },
    { name: "野方", type: "regular", lines: ["西武新宿線急行"] },
    { name: "鷺之宮", type: "regular", lines: ["西武新宿線急行"] },
    { name: "中野新橋", type: "regular", lines: ["丸之內線支線"] },
    { name: "沼袋", type: "minor", lines: ["西武新宿線各停"] },
    { name: "都立家政", type: "minor", lines: ["西武新宿線各停"] },
    { name: "中野富士見町", type: "minor", lines: ["丸之內線支線各停"] }
  ],
  "豐島區": [
    { name: "池袋", type: "major", lines: ["JR山手線/埼京線", "丸之內/有樂町/副都心線", "西武池袋線", "東武東上線"] },
    { name: "大塚", type: "major", lines: ["JR山手線", "都電荒川線"] },
    { name: "巢鴨", type: "major", lines: ["JR山手線", "三田線"] },
    { name: "目白", type: "regular", lines: ["JR山手線"] },
    { name: "西巢鴨", type: "regular", lines: ["三田線"] },
    { name: "東池袋", type: "regular", lines: ["有樂町線"] },
    { name: "千川", type: "regular", lines: ["有樂町線", "副都心線"] },
    { name: "要町", type: "regular", lines: ["有樂町線", "副都心線"] },
    { name: "駒込", type: "regular", lines: ["JR山手線", "南北線"] },
    { name: "北池袋", type: "minor", lines: ["東武東上線各停"] },
    { name: "大山", type: "minor", lines: ["東武東上線各停"] },
    { name: "椎名町", type: "minor", lines: ["西武池袋線各停"] },
    { name: "東長崎", type: "minor", lines: ["西武池袋線各停"] },
    { name: "鬼子母神前", type: "minor", lines: ["都電荒川線路面電車"] }
  ],
  "北區": [
    { name: "赤羽", type: "major", lines: ["JR京濱東北線/宇都宮線/高崎線/埼京線"] },
    { name: "王子", type: "major", lines: ["JR京濱東北線", "南北線", "都電荒川線"] },
    { name: "田端", type: "major", lines: ["JR山手線", "JR京濱東北線"] },
    { name: "東十條", type: "regular", lines: ["JR京濱東北線"] },
    { name: "尾久", type: "regular", lines: ["JR宇都宮線/高崎線"] },
    { name: "十條", type: "regular", lines: ["JR埼京線"] },
    { name: "王子神谷", type: "regular", lines: ["南北線"] },
    { name: "赤羽岩淵", type: "minor", lines: ["南北線", "埼玉高速鐵道"] },
    { name: "志茂", type: "minor", lines: ["南北線各停"] },
    { name: "梶原", type: "minor", lines: ["都電荒川線路面電車"] },
    { name: "飛鳥山", type: "minor", lines: ["都電荒川線路面電車"] }
  ],
  "荒川區": [
    { name: "日暮里", type: "major", lines: ["JR山手線/常磐線", "京成線", "日暮里舍人線"] },
    { name: "西日暮里", type: "major", lines: ["JR山手線", "千代田線", "日暮里舍人線"] },
    { name: "町屋", type: "major", lines: ["千代田線", "京成本線", "都電荒川線"] },
    { name: "三河島", type: "regular", lines: ["JR常磐線"] },
    { name: "南千住", type: "regular", lines: ["JR常磐線", "日比谷線", "筑波快線"] },
    { name: "新三河島", type: "regular", lines: ["京成本線"] },
    { name: "荒川遊園地前", type: "minor", lines: ["都電荒川線路面電車"] },
    { name: "東尾久三丁目", type: "minor", lines: ["都電荒川線路面電車"] },
    { name: "熊野前", type: "minor", lines: ["都電荒川線", "日暮里舍人線"] }
  ],
  "杉並區": [
    { name: "荻窪", type: "major", lines: ["JR中央總武線", "丸之內線始發"] },
    { name: "高圓寺", type: "major", lines: ["JR中央總武線"] },
    { name: "阿佐谷", type: "major", lines: ["JR中央總武線"] },
    { name: "西荻窪", type: "regular", lines: ["JR中央總武線"] },
    { name: "八幡山", type: "regular", lines: ["京王線"] },
    { name: "永福町", type: "regular", lines: ["京王井之頭線急行"] },
    { name: "方南町", type: "regular", lines: ["丸之內線支線"] },
    { name: "濱田山", type: "regular", lines: ["京王井之頭線"] },
    { name: "高井戶", type: "minor", lines: ["京王井之頭線各停"] },
    { name: "久我山", type: "minor", lines: ["京王井之頭線"] },
    { name: "井之頭公園", type: "minor", lines: ["京王井之頭線各停"] }
  ],
  "板橋區": [
    { name: "板橋", type: "major", lines: ["JR埼京線"] },
    { name: "大山", type: "major", lines: ["東武東上線"] },
    { name: "成增", type: "major", lines: ["東武東上線"] },
    { name: "新板橋", type: "regular", lines: ["三田線"] },
    { name: "板橋區役所前", type: "regular", lines: ["三田線"] },
    { name: "志村坂上", type: "regular", lines: ["三田線"] },
    { name: "地下鐵成增", type: "regular", lines: ["有樂町線", "副都心線"] },
    { name: "中板橋", type: "minor", lines: ["東武東上線各停"] },
    { name: "常盤台", type: "minor", lines: ["東武東上線各停"] },
    { name: "上板橋", type: "minor", lines: ["東武東上線各停"] },
    { name: "西台", type: "minor", lines: ["三田線各停"] }
  ],
  "練馬區": [
    { name: "練馬", type: "major", lines: ["西武池袋線", "都營大江戶線", "西武有樂町線"] },
    { name: "光丘", type: "major", lines: ["都營大江戶線始發"] },
    { name: "石神井公園", type: "major", lines: ["西武池袋線急行"] },
    { name: "江古田", type: "regular", lines: ["西武池袋線"] },
    { name: "小竹向原", type: "regular", lines: ["有樂町線", "副都心線", "西武有樂町線"] },
    { name: "豐島園", type: "regular", lines: ["西武豐島線", "大江戶線"] },
    { name: "櫻台", type: "regular", lines: ["西武池袋線"] },
    { name: "中村橋", type: "regular", lines: ["西武池袋線"] },
    { name: "富士見台", type: "minor", lines: ["西武池袋線各停"] },
    { name: "練馬高野台", type: "minor", lines: ["西武池袋線各停"] },
    { name: "大泉學園", type: "minor", lines: ["西武池袋線"] }
  ],
  "足立區": [
    { name: "北千住", type: "major", lines: ["JR常磐線", "日比谷線", "千代田線", "東武線", "筑波快線"] },
    { name: "西新井", type: "major", lines: ["東武伊勢崎線大師線"] },
    { name: "綾瀨", type: "major", lines: ["千代田線", "JR常磐線"] },
    { name: "竹之塚", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "五反野", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "梅島", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "牛田", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "谷塚", type: "minor", lines: ["東武線各停"] },
    { name: "舍人公園", type: "minor", lines: ["日暮里舍人線"] },
    { name: "扇大橋", type: "minor", lines: ["日暮里舍人線"] }
  ],
  "葛飾區": [
    { name: "青砥", type: "major", lines: ["京成本線", "京成押上線"] },
    { name: "新小岩", type: "major", lines: ["JR總武快速線", "JR總武緩行線"] },
    { name: "京成高砂", type: "major", lines: ["京成本線", "京成成田空港線", "北總線"] },
    { name: "龜有", type: "regular", lines: ["JR常磐緩行線"] },
    { name: "金町", type: "regular", lines: ["JR常磐緩行線", "京成金町線"] },
    { name: "四木", type: "regular", lines: ["京成押上線"] },
    { name: "京成立石", type: "regular", lines: ["京成押上線"] },
    { name: "柴又", type: "minor", lines: ["京成金町線各停"] },
    { name: "堀切菖蒲園", type: "minor", lines: ["京成本線各停"] },
    { name: "お花茶屋", type: "minor", lines: ["京成本線各停"] }
  ],
  "江戶川區": [
    { name: "葛西", type: "major", lines: ["東西線快速"] },
    { name: "船堀", type: "major", lines: ["新宿線急行"] },
    { name: "小岩", type: "major", lines: ["JR總武線"] },
    { name: "西葛西", type: "regular", lines: ["東西線"] },
    { name: "瑞江", type: "regular", lines: ["新宿線"] },
    { name: "一之江", type: "regular", lines: ["新宿線"] },
    { name: "平井", type: "regular", lines: ["JR總武線"] },
    { name: "篠崎", type: "minor", lines: ["新宿線各停"] },
    { name: "京成小岩", type: "minor", lines: ["京成本線各停"] }
  ],

  // === 東京都多摩地區 ===
  "武藏野市": [
    { name: "吉祥寺", type: "major", lines: ["JR中央總武線", "京王井之頭線"] },
    { name: "武藏境", type: "major", lines: ["JR中央線", "西武多摩川線"] },
    { name: "三鷹 (北口)", type: "regular", lines: ["JR中央線"] }
  ],
  "三鷹市": [
    { name: "三鷹 (南口)", type: "major", lines: ["JR中央線快速特快/東西線直通"] },
    { name: "三鷹台", type: "regular", lines: ["京王井之頭線"] },
    { name: "井之頭公園", type: "minor", lines: ["京王井之頭線各停"] }
  ],
  "立川市": [
    { name: "立川", type: "major", lines: ["JR中央線", "JR青梅線", "JR南武線"] },
    { name: "立川北", type: "major", lines: ["多摩都市單軌電車"] },
    { name: "西立川", type: "regular", lines: ["JR青梅線"] },
    { name: "柴崎體育館", type: "regular", lines: ["多摩單軌電車"] },
    { name: "砂川七番", type: "regular", lines: ["多摩單軌電車"] },
    { name: "武藏砂川", type: "minor", lines: ["西武拝島線各停"] },
    { name: "泉體育館", type: "minor", lines: ["多摩單軌電車"] }
  ],
  "八王子市": [
    { name: "八王子", type: "major", lines: ["JR中央線", "JR橫濱線", "JR八高線"] },
    { name: "京王八王子", type: "major", lines: ["京王線始發"] },
    { name: "高尾", type: "major", lines: ["JR中央線", "京王高尾線"] },
    { name: "西八王子", type: "regular", lines: ["JR中央線"] },
    { name: "南大澤", type: "regular", lines: ["京王相模原線特急"] },
    { name: "めじろ台", type: "regular", lines: ["京王高尾線"] },
    { name: "高尾山口", type: "minor", lines: ["京王高尾線觀光各停"] },
    { name: "片倉", type: "minor", lines: ["JR橫濱線各停"] },
    { name: "北八王子", type: "minor", lines: ["JR八高線各停"] }
  ],
  "日野市": [
    { name: "高幡不動", type: "major", lines: ["京王線", "多摩單軌線"] },
    { name: "日野", type: "major", lines: ["JR中央線"] },
    { name: "豐田", type: "regular", lines: ["JR中央線始發"] },
    { name: "百草園", type: "regular", lines: ["京王線"] },
    { name: "甲州街道", type: "minor", lines: ["多摩單軌線"] },
    { name: "萬願寺", type: "minor", lines: ["多摩單軌線各停"] }
  ],
  "府中市": [
    { name: "府中", type: "major", lines: ["京王線特急"] },
    { name: "分倍河原", type: "major", lines: ["京王線", "JR南武線"] },
    { name: "東府中", type: "regular", lines: ["京王線競馬場線"] },
    { name: "府中本町", type: "regular", lines: ["JR武藏野線", "JR南武線"] },
    { name: "多磨", type: "regular", lines: ["西武多摩川線"] },
    { name: "競艇場前", type: "minor", lines: ["西武多摩川線各停"] },
    { name: "是政", type: "minor", lines: ["西武多摩川線終點"] }
  ],
  "調布市": [
    { name: "調布", type: "major", lines: ["京王線特急", "京王相模原線"] },
    { name: "仙川", type: "major", lines: ["京王線區間急行"] },
    { name: "國領", type: "regular", lines: ["京王線"] },
    { name: "柴崎", type: "regular", lines: ["京王線"] },
    { name: "杜鵑丘", type: "regular", lines: ["京王線急行"] },
    { name: "京王多摩川", type: "minor", lines: ["京王相模原線各停"] },
    { name: "飛田給", type: "minor", lines: ["京王線各停 (味之素體育場)"] }
  ],
  "町田市": [
    { name: "町田", type: "major", lines: ["JR橫濱線快速", "小田急小田原線快速急行"] },
    { name: "鶴川", type: "regular", lines: ["小田急小田原線"] },
    { name: "玉川學園前", type: "regular", lines: ["小田急小田原線各停"] },
    { name: "成瀨", type: "minor", lines: ["JR橫濱線各停"] },
    { name: "多摩境", type: "minor", lines: ["京王相模原線各停"] }
  ],
  "西東京市": [
    { name: "田無", type: "major", lines: ["西武新宿線急行"] },
    { name: "保谷", type: "regular", lines: ["西武池袋線"] },
    { name: "東伏見", type: "regular", lines: ["西武新宿線各停"] },
    { name: "西武柳澤", type: "minor", lines: ["西武新宿線各停"] }
  ],
  "小平市": [
    { name: "小平", type: "major", lines: ["西武新宿線", "西武拝島線"] },
    { name: "花小金井", type: "major", lines: ["西武新宿線急行"] },
    { name: "一橋學園", type: "regular", lines: ["西武多摩湖線"] },
    { name: "新小平", type: "regular", lines: ["JR武藏野線"] },
    { name: "鷹之台", type: "minor", lines: ["西武國分寺線各停"] },
    { name: "青梅街道", type: "minor", lines: ["西武多摩湖線各停"] }
  ],
  "多摩市": [
    { name: "多摩中心", type: "major", lines: ["小田急多摩線", "京王相模原線", "多摩單軌線"] },
    { name: "聖蹟櫻丘", type: "major", lines: ["京王線特急"] },
    { name: "唐木田", type: "regular", lines: ["小田急多摩線終點"] },
    { name: "京王多摩中心", type: "regular", lines: ["京王線"] },
    { name: "小田急多摩中心", type: "minor", lines: ["小田急線單軌聯絡各停"] }
  ],
  "狛江市": [
    { name: "狛江", type: "major", lines: ["小田急小田原線準急"] },
    { name: "和泉多摩川", type: "regular", lines: ["小田急小田原線各停"] },
    { name: "喜多見", type: "minor", lines: ["小田急小田原線各停"] }
  ],

  // === 神奈川縣 ===
  "橫濱市西區": [
    { name: "橫濱", type: "major", lines: ["JR各線", "東急東橫線", "相鐵線", "京急本線", "橫濱地鐵"] },
    { name: "港未來", type: "major", lines: ["港未來線"] },
    { name: "櫻木町", type: "major", lines: ["JR京濱東北根岸線", "橫濱市營地下鐵藍線"] },
    { name: "平沼橋", type: "regular", lines: ["相鐵本線各停"] },
    { name: "高島町", type: "regular", lines: ["橫濱地下鐵藍線"] },
    { name: "戶部", type: "regular", lines: ["京急本線各停"] },
    { name: "西橫濱", type: "minor", lines: ["相鐵本線各停"] }
  ],
  "橫濱市中區": [
    { name: "關內", type: "major", lines: ["JR京濱東北線", "橫濱地下鐵藍線"] },
    { name: "元町・中華街", type: "major", lines: ["港未來線始發"] },
    { name: "石川町", type: "major", lines: ["JR京濱東北根岸線"] },
    { name: "山手", type: "regular", lines: ["JR京濱東北根岸線"] },
    { name: "日本大通", type: "regular", lines: ["港未來線"] },
    { name: "馬車道", type: "regular", lines: ["港未來線"] },
    { name: "伊勢佐木長者町", type: "minor", lines: ["橫濱地下鐵藍線各停"] },
    { name: "阪東橋", type: "minor", lines: ["橫濱地下鐵藍線各停"] }
  ],
  "橫濱市港北區": [
    { name: "新橫濱", type: "major", lines: ["東海道新幹線", "JR橫濱線", "橫濱地鐵藍線", "相鐵東急直通線"] },
    { name: "菊名", type: "major", lines: ["東急東橫線特急", "JR橫濱線快速"] },
    { name: "日吉", type: "major", lines: ["東急東橫線", "東急目黑線", "東急新橫濱線", "橫濱地鐵綠線"] },
    { name: "綱島", type: "regular", lines: ["東急東橫線急行"] },
    { name: "大倉山", type: "regular", lines: ["東急東橫線各停"] },
    { name: "妙蓮寺", type: "regular", lines: ["東急東橫線各停"] },
    { name: "小机", type: "regular", lines: ["JR橫濱線"] },
    { name: "高田", type: "minor", lines: ["橫濱地下鐵綠線各停"] },
    { name: "岸根公園", type: "minor", lines: ["橫濱地下鐵藍線各停"] }
  ],
  "橫濱市神奈川區": [
    { name: "東神奈川", type: "major", lines: ["JR京濱東北線", "JR橫濱線"] },
    { name: "京急東神奈川", type: "major", lines: ["京急本線急行"] },
    { name: "反町", type: "regular", lines: ["東急東橫線各停"] },
    { name: "三澤上町", type: "regular", lines: ["橫濱地鐵藍線"] },
    { name: "片倉町", type: "regular", lines: ["橫濱地鐵藍線"] },
    { name: "大口", type: "regular", lines: ["JR橫濱線"] },
    { name: "白樂", type: "regular", lines: ["東急東橫線各停 (神奈川大學)"] },
    { name: "子安", type: "minor", lines: ["京急本線各停"] },
    { name: "神奈川新町", type: "minor", lines: ["京急本線各停"] }
  ],
  "橫濱市青葉區": [
    { name: "青葉台", type: "major", lines: ["東急田園都市線急行"] },
    { name: "市尾", type: "major", lines: ["東急田園都市線"] },
    { name: "藤之丘", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "江田", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "田奈", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "恩田", type: "minor", lines: ["東急兒童之國線各停"] },
    { name: "兒童之國", type: "minor", lines: ["東急兒童之國線各停"] }
  ],
  "橫濱市戶塚區": [
    { name: "戶塚", type: "major", lines: ["JR東海道線/橫須賀線/湘南新宿線", "橫濱地鐵藍線"] },
    { name: "東戶塚", type: "regular", lines: ["JR橫須賀線/湘南新宿線各停"] },
    { name: "舞岡", type: "minor", lines: ["橫濱地下鐵藍線各停"] }
  ],
  "橫濱市港南區": [
    { name: "上大岡", type: "major", lines: ["京急本線快特", "橫濱地下鐵藍線快速"] },
    { name: "港南中央", type: "regular", lines: ["橫濱地下鐵藍線"] },
    { name: "上永谷", type: "regular", lines: ["橫濱地下鐵藍線快速車輛基地"] },
    { name: "下永谷", type: "minor", lines: ["橫濱地下鐵藍線各停"] },
    { name: "野庭", type: "minor", lines: ["橫濱藍線邊界各停"] }
  ],
  "川崎市川崎區": [
    { name: "川崎", type: "major", lines: ["JR東海道線", "JR京濱東北線", "JR南武線"] },
    { name: "京急川崎", type: "major", lines: ["京急本線", "京急大師線"] },
    { name: "八丁畷", type: "regular", lines: ["京急本線", "JR南武支線"] },
    { name: "港町", type: "regular", lines: ["京急大師線"] },
    { name: "鈴木町", type: "regular", lines: ["京急大師線各停"] },
    { name: "昭和", type: "minor", lines: ["JR鶴見線各停"] },
    { name: "扇町", type: "minor", lines: ["JR鶴見線臨海各停"] },
    { name: "小島新田", type: "minor", lines: ["京急大師線各停終點"] }
  ],
  "川崎市中原區": [
    { name: "武藏小杉", type: "major", lines: ["JR湘南新宿線/橫須賀線/南武線", "東急東橫線/目黑線"] },
    { name: "元住吉", type: "major", lines: ["東急東橫線各停", "東急目黑線"] },
    { name: "武藏新城", type: "regular", lines: ["JR南武線"] },
    { name: "新丸子", type: "regular", lines: ["東急東橫線", "東急目黑線各停"] },
    { name: "向河原", type: "regular", lines: ["JR南武線"] },
    { name: "平間", type: "minor", lines: ["JR南武線各停"] }
  ],
  "川崎市高津區": [
    { name: "溝之口", type: "major", lines: ["東急田園都市線", "東急大井町線"] },
    { name: "武藏溝之口", type: "major", lines: ["JR南武線"] },
    { name: "高津", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "二子新地", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "梶谷", type: "regular", lines: ["東急田園都市線各停"] },
    { name: "津田山", type: "minor", lines: ["JR南武線各停"] }
  ],
  "藤澤市": [
    { name: "藤澤", type: "major", lines: ["JR東海道線", "小田急江之島線快速急行", "江之電"] },
    { name: "辻堂", type: "major", lines: ["JR東海道線"] },
    { name: "鵠沼海岸", type: "regular", lines: ["小田急江之島線各停"] },
    { name: "片瀨江之島", type: "regular", lines: ["小田急江之島線特急終點"] },
    { name: "湘南台", type: "regular", lines: ["小田急江之島線", "相鐵泉野線", "橫濱地下鐵藍線"] },
    { name: "善行", type: "minor", lines: ["小田急江之島線各停"] },
    { name: "六會日大前", type: "minor", lines: ["小田急江之島線各停"] }
  ],
  "鎌倉市": [
    { name: "鎌倉", type: "major", lines: ["JR橫須賀線", "江之島電鐵"] },
    { name: "大船", type: "major", lines: ["JR東海道線/京濱東北線/橫須賀線", "湘南單軌電車"] },
    { name: "北鎌倉", type: "regular", lines: ["JR橫須賀線"] },
    { name: "長谷", type: "regular", lines: ["江之電 (大佛觀光)"] },
    { name: "極樂寺", type: "minor", lines: ["江之島電鐵各停"] },
    { name: "由比濱", type: "minor", lines: ["江之島電鐵各停"] },
    { name: "湘南深澤", type: "minor", lines: ["湘南單軌電車各停"] }
  ],

  // === 埼玉縣 ===
  "埼玉市大宮區": [
    { name: "大宮", type: "major", lines: ["JR各線", "東北/北陸新幹線", "東武野田線", "埼玉新都市交通"] },
    { name: "鐵道博物館", type: "major", lines: ["埼玉新都市交通"] },
    { name: "北大宮", type: "regular", lines: ["東武野田線"] },
    { name: "さいたま新都心", type: "regular", lines: ["JR京濱東北線", "宇都宮線", "高崎線"] },
    { name: "與野公園", type: "minor", lines: ["埼京線邊界各停"] }
  ],
  "埼玉市浦和區": [
    { name: "浦和", type: "major", lines: ["JR高崎線/宇都宮線/湘南新宿線", "JR京濱東北線"] },
    { name: "北浦和", type: "major", lines: ["JR京濱東北線"] },
    { name: "與野", type: "regular", lines: ["JR京濱東北線"] },
    { name: "東浦和", type: "minor", lines: ["JR武藏野線各停"] }
  ],
  "埼玉市中央區": [
    { name: "南與野", type: "major", lines: ["JR埼京線快速"] },
    { name: "與野本町", type: "regular", lines: ["JR埼京線"] },
    { name: "北與野", type: "minor", lines: ["JR埼京線各停"] }
  ],
  "川口市": [
    { name: "川口", type: "major", lines: ["JR京濱東北線快速"] },
    { name: "西川口", type: "major", lines: ["JR京濱東北線"] },
    { name: "東川口", type: "regular", lines: ["JR武藏野線", "埼玉高速鐵道"] },
    { name: "川口元鄉", type: "regular", lines: ["埼玉高速鐵道"] },
    { name: "戶塚安行", type: "minor", lines: ["埼玉高速鐵道各停"] },
    { name: "新井宿", type: "minor", lines: ["埼玉高速鐵道各停"] }
  ],
  "所澤市": [
    { name: "所澤", type: "major", lines: ["西武池袋線特急/急行", "西武新宿線特急/急行"] },
    { name: "小手指", type: "major", lines: ["西武池袋線始發"] },
    { name: "新所澤", type: "regular", lines: ["西武新宿線始發"] },
    { name: "航空公園", type: "regular", lines: ["西武新宿線"] },
    { name: "東所澤", type: "regular", lines: ["JR武藏野線"] },
    { name: "西武球場前", type: "minor", lines: ["西武狹山線", "西武山口線"] },
    { name: "下山口", type: "minor", lines: ["西武狹山線各停"] }
  ],
  "草加市": [
    { name: "草加", type: "major", lines: ["東武伊勢崎線急行 (半藏門線/日比谷線直通)"] },
    { name: "獨協大學前", type: "major", lines: ["東武伊勢崎線"] },
    { name: "谷塚", type: "regular", lines: ["東武線"] },
    { name: "新田", type: "minor", lines: ["東武伊勢崎線各停"] }
  ],
  "越谷市": [
    { name: "南越谷", type: "major", lines: ["JR武藏野線"] },
    { name: "新越谷", type: "major", lines: ["東武伊勢崎線急行"] },
    { name: "越谷", type: "regular", lines: ["東武伊勢崎線"] },
    { name: "越谷Laketown", type: "regular", lines: ["JR武藏野線 (永旺商城)"] },
    { name: "大袋", type: "minor", lines: ["東武線各停"] },
    { name: "蒲生", type: "minor", lines: ["東武線各停"] }
  ],
  "朝霞市": [
    { name: "朝霞", type: "major", lines: ["東武東上線準急"] },
    { name: "朝霞台", type: "major", lines: ["東武東上線急行", "JR武藏野線聯絡"] },
    { name: "北朝霞", type: "regular", lines: ["JR武藏野線"] },
    { name: "內田", type: "minor", lines: ["朝霞各停邊界"] }
  ],
  "戶田市": [
    { name: "戶田公園", type: "major", lines: ["JR埼京線快速"] },
    { name: "戶田", type: "regular", lines: ["JR埼京線各停"] },
    { name: "北戶田", type: "minor", lines: ["JR埼京線各停"] }
  ],
  "和光市": [
    { name: "和光市", type: "major", lines: ["東武東上線急行", "有樂町線/副都心線始發"] },
    { name: "白子", type: "regular", lines: ["和光周邊巴士聯絡各停"] },
    { name: "新倉", type: "minor", lines: ["和光市外圍各停區域"] }
  ],
  "八潮市": [
    { name: "八潮", type: "major", lines: ["筑波快線區間快速"] },
    { name: "大瀨", type: "regular", lines: ["筑波快線沿線"] },
    { name: "八條", type: "minor", lines: ["八潮市偏遠各停區域"] }
  ],
  "三鄉市": [
    { name: "三鄉", type: "major", lines: ["JR武藏野線"] },
    { name: "三鄉中央", type: "major", lines: ["筑波快線"] },
    { name: "新三鄉", type: "regular", lines: ["JR武藏野線 (Costco/IKEA)"] },
    { name: "吉川美南", type: "minor", lines: ["JR武藏野線各停"] }
  ],

  // === 千葉縣 ===
  "浦安市": [
    { name: "浦安", type: "major", lines: ["東西線快速"] },
    { name: "舞濱", type: "major", lines: ["JR京葉線快速 (迪士尼)"] },
    { name: "新浦安", type: "regular", lines: ["JR京葉線快速"] },
    { name: "日之出", type: "minor", lines: ["浦安沿海新市鎮各停"] }
  ],
  "市川市": [
    { name: "市川", type: "major", lines: ["JR總武快速線", "JR總武緩行線"] },
    { name: "本八幡", type: "major", lines: ["JR總武線", "新宿線始發", "京成本線"] },
    { name: "行德", type: "major", lines: ["東西線"] },
    { name: "妙典", type: "regular", lines: ["東西線始發各停"] },
    { name: "國府台", type: "regular", lines: ["京成本線"] },
    { name: "市川真間", type: "regular", lines: ["京成本線"] },
    { name: "菅野", type: "minor", lines: ["京成本線各停"] },
    { name: "大野", type: "minor", lines: ["JR武藏野線各停"] },
    { name: "二俣新町", type: "minor", lines: ["JR京葉線各停"] }
  ],
  "船橋市": [
    { name: "船橋", type: "major", lines: ["JR總武快速線", "東武野田線", "京成船橋"] },
    { name: "西船橋", type: "major", lines: ["東西線始發", "JR總武線", "JR京葉線", "JR武藏野線", "東葉高速鐵道"] },
    { name: "津田沼", type: "major", lines: ["JR總武快速線始發", "JR總武緩行線"] },
    { name: "東船橋", type: "regular", lines: ["JR總武線"] },
    { name: "南船橋", type: "regular", lines: ["JR京葉線快速", "武藏野線"] },
    { name: "船橋法典", type: "regular", lines: ["JR武藏野線 (中山競馬場)"] },
    { name: "下總中山", type: "regular", lines: ["JR總武緩行線各停"] },
    { name: "馬込澤", type: "minor", lines: ["東武野田線各停"] },
    { name: "二和向台", type: "minor", lines: ["新京成線各停"] }
  ],
  "松戶市": [
    { name: "松戶", type: "major", lines: ["JR常磐線快速/各停", "新京成線始發"] },
    { name: "新松戶", type: "major", lines: ["JR常磐緩行線", "JR武藏野線", "流鐵流山線"] },
    { name: "八柱", type: "regular", lines: ["新京成線", "JR武藏野線 (新八柱)"] },
    { name: "東松戶", type: "regular", lines: ["北總線", "JR武藏野線", "京成成田SkyAccess"] },
    { name: "馬橋", type: "regular", lines: ["JR常磐緩行線各停", "流鐵流山線始發"] },
    { name: "北小金", type: "minor", lines: ["JR常磐緩行線各停"] },
    { name: "常盤平", type: "minor", lines: ["新京成線各停"] },
    { name: "五香", type: "minor", lines: ["新京成線各停"] }
  ],
  "千葉市中央區": [
    { name: "千葉", type: "major", lines: ["JR總武快速線", "外房/內房線", "千葉都市單軌電車", "京成千葉"] },
    { name: "蘇我", type: "major", lines: ["JR京葉線始發", "JR內房/外房線"] },
    { name: "本千葉", type: "regular", lines: ["JR外房線各停"] },
    { name: "東千葉", type: "regular", lines: ["JR總武本線各停"] },
    { name: "西登戶", type: "regular", lines: ["京成千葉線各停"] },
    { name: "市役所前", type: "minor", lines: ["千葉都市單軌電車"] },
    { name: "葭川公園", type: "minor", lines: ["千葉單軌電車路面各停"] }
  ],
  "千葉市美濱區": [
    { name: "海濱幕張", type: "major", lines: ["JR京葉線快速 (幕張展覽館)"] },
    { name: "稻毛海岸", type: "regular", lines: ["JR京葉線快速"] },
    { name: "檢見川濱", type: "regular", lines: ["JR京葉線"] },
    { name: "幕張豐砂", type: "minor", lines: ["JR京葉線各停"] }
  ],
  "千葉市花見川區": [
    { name: "幕張本鄉", type: "major", lines: ["JR總武線各停", "京成千葉線"] },
    { name: "幕張", type: "regular", lines: ["JR總武緩行線"] },
    { name: "新檢見川", type: "regular", lines: ["JR總武線各停"] },
    { name: "檢見川", type: "minor", lines: ["京成千葉線各停"] }
  ],
  "柏市": [
    { name: "柏", type: "major", lines: ["JR常磐線快速/各停", "東武野田線急行"] },
    { name: "柏之葉校園", type: "major", lines: ["筑波快線區間快速 (東京大學柏校區)"] },
    { name: "南柏", type: "regular", lines: ["JR常磐緩行線"] },
    { name: "逆井", type: "regular", lines: ["東武野田線各停"] },
    { name: "增尾", type: "regular", lines: ["東武野田線各停"] },
    { name: "高柳", type: "minor", lines: ["東武野田線各停"] },
    { name: "北柏", type: "minor", lines: ["JR常磐緩行線各停"] }
  ],
  "習志野市": [
    { name: "津田沼", type: "major", lines: ["JR總武快速線始發", "JR總武緩行線"] },
    { name: "京成津田沼", type: "major", lines: ["京成本線", "京成千葉線", "新京成線始發"] },
    { name: "谷津", type: "regular", lines: ["京成本線各停"] },
    { name: "實籾", type: "regular", lines: ["京成本線"] },
    { name: "新習志野", type: "minor", lines: ["JR京葉線各停"] },
    { name: "東習志野", type: "minor", lines: ["習志野巴士工業各停區域"] }
  ],
  "流山市": [
    { name: "流山大鷹之森", type: "major", lines: ["筑波快線快速", "東武野田線急行"] },
    { name: "南流山", type: "major", lines: ["JR武藏野線", "筑波快線"] },
    { name: "初石", type: "regular", lines: ["東武野田線各停"] },
    { name: "江戶川台", type: "regular", lines: ["東武野田線各停"] },
    { name: "流山", type: "minor", lines: ["流鐵流山線終點"] },
    { name: "鰭崎", type: "minor", lines: ["流鐵流山線各停"] }
  ],
  "我孫子市": [
    { name: "我孫子", type: "major", lines: ["JR常磐線快速/各停始發", "JR成田線始發"] },
    { name: "天王台", type: "regular", lines: ["JR常磐快速線", "常磐緩行線各停"] },
    { name: "新木", type: "regular", lines: ["JR成田線各停"] },
    { name: "湖北", type: "minor", lines: ["JR成田線各停"] },
    { name: "東我孫子", type: "minor", lines: ["JR成田線各停"] }
  ],
  "八千代市": [
    { name: "八千代綠丘", type: "major", lines: ["東葉高速鐵道快速始發"] },
    { name: "八千代中央", type: "major", lines: ["東葉高速鐵道"] },
    { name: "勝田台", type: "regular", lines: ["京成本線快速特急"] },
    { name: "東葉勝田台", type: "regular", lines: ["東葉高速鐵道終點"] },
    { name: "村上", type: "minor", lines: ["東葉高速鐵道各停"] },
    { name: "京成大和田", type: "minor", lines: ["京成本線各停"] }
  ],

  // === 大阪府 ===
  "大阪市北區": [
    { name: "大阪", type: "major", lines: ["JR各線", "阪急線", "阪神線"] },
    { name: "梅田", type: "major", lines: ["御堂筋線"] },
    { name: "天滿", type: "major", lines: ["JR大阪環狀線"] },
    { name: "中津", type: "major", lines: ["御堂筋線", "阪急神戶寶塚線"] },
    { name: "東梅田", type: "regular", lines: ["谷町線"] },
    { name: "西梅田", type: "regular", lines: ["四橋線始發"] },
    { name: "南森町", type: "regular", lines: ["堺筋線", "谷町線"] },
    { name: "天神橋筋六丁目", type: "regular", lines: ["堺筋線始發", "谷町線", "阪急京都線直通"] },
    { name: "扇町", type: "minor", lines: ["堺筋線各停"] },
    { name: "中崎町", type: "minor", lines: ["谷町線各停"] }
  ],
  "大阪市中央區": [
    { name: "心齋橋", type: "major", lines: ["御堂筋線", "長堀鶴見綠地線"] },
    { name: "難波", type: "major", lines: ["御堂筋線", "千日前線", "四橋線", "南海線", "近鐵線"] },
    { name: "本町", type: "major", lines: ["御堂筋線", "中央線", "四橋線"] },
    { name: "淀屋橋", type: "major", lines: ["御堂筋線", "京阪本線"] },
    { name: "谷町四丁目", type: "regular", lines: ["谷町線", "中央線"] },
    { name: "日本橋", type: "regular", lines: ["堺筋線", "千日前線", "近鐵奈良線"] },
    { name: "天滿橋", type: "regular", lines: ["谷町線", "京阪本線"] },
    { name: "森之宮", type: "regular", lines: ["JR大阪環狀線", "中央線", "長堀鶴見綠地線"] },
    { name: "堺筋本町", type: "regular", lines: ["堺筋線", "中央線"] },
    { name: "松屋町", type: "minor", lines: ["長堀鶴見綠地線各停"] },
    { name: "長堀橋", type: "minor", lines: ["堺筋線", "長堀鶴見線各停"] },
    { name: "谷町六丁目", type: "minor", lines: ["谷町線", "長堀鶴見線各停"] }
  ],
  "大阪市西區": [
    { name: "肥後橋", type: "major", lines: ["四橋線"] },
    { name: "阿波座", type: "regular", lines: ["中央線", "千日前線"] },
    { name: "西長堀", type: "regular", lines: ["千日前線", "長堀鶴見綠地線"] },
    { name: "櫻川", type: "regular", lines: ["千日前線", "阪神難波線"] },
    { name: "九條", type: "regular", lines: ["中央線", "阪神難波線"] },
    { name: "汐見橋", type: "minor", lines: ["南海高野線支線各停"] },
    { name: "木津川", type: "minor", lines: ["南海高野線支線各停"] }
  ],
  "大阪市浪速區": [
    { name: "難波 (南海)", type: "major", lines: ["南海本線/高野線始發特急"] },
    { name: "大國町", type: "major", lines: ["御堂筋線", "四橋線"] },
    { name: "蘆原橋", type: "major", lines: ["JR大阪環狀線各停"] },
    { name: "惠美須町", type: "regular", lines: ["堺筋線", "阪堺電軌路面電車"] },
    { name: "今宮", type: "regular", lines: ["JR大和路線", "大阪環狀線各停"] },
    { name: "今宮戎", type: "minor", lines: ["南海本線各停"] }
  ],
  "大阪市淀川區": [
    { name: "新大阪", type: "major", lines: ["東海道/山陽新幹線", "JR御堂筋線", "JR京都線"] },
    { name: "十三", type: "major", lines: ["阪急神戶線/寶塚線/京都線特急"] },
    { name: "東三国", type: "major", lines: ["御堂筋線各停"] },
    { name: "西中島南方", type: "regular", lines: ["御堂筋線", "阪急京都線 (南方)"] },
    { name: "塚本", type: "regular", lines: ["JR神戶線各停"] },
    { name: "三國", type: "regular", lines: ["阪急寶塚線各停"] },
    { name: "加島", type: "minor", lines: ["JR東西線各停"] },
    { name: "神崎川", type: "minor", lines: ["阪急神戶線各停"] }
  ],
  "大阪市天王寺區": [
    { name: "天王寺", type: "major", lines: ["JR各線", "御堂筋線", "谷町線", "阪堺電軌", "近鐵阿倍野橋"] },
    { name: "鶴橋", type: "major", lines: ["JR大阪環狀線", "近鐵大阪/奈良線", "千日前線"] },
    { name: "大阪上本町", type: "major", lines: ["近鐵難波/大阪線特急始發", "谷町九丁目聯絡"] },
    { name: "桃谷", type: "regular", lines: ["JR大阪環狀線各停"] },
    { name: "玉造", type: "regular", lines: ["JR大阪環狀線", "長堀鶴見綠地線各停"] },
    { name: "四天王寺前夕陽之丘", type: "minor", lines: ["谷町線各停"] }
  ],
  "大阪市都島區": [
    { name: "京橋", type: "major", lines: ["JR大阪環狀線/學研都市線/東西線", "京阪本線特急", "長堀鶴見綠地線"] },
    { name: "都島", type: "regular", lines: ["谷町線始發各停"] },
    { name: "野江內代", type: "regular", lines: ["谷町線各停"] },
    { name: "櫻之宮", type: "minor", lines: ["JR大阪環狀線各停"] }
  ],
  "大阪市福島區": [
    { name: "福島", type: "major", lines: ["JR大阪環狀線", "JR東西線 (新福島)", "阪神本線"] },
    { name: "野田阪神", type: "major", lines: ["千日前線始發", "JR野田", "阪神野田"] },
    { name: "海老江", type: "regular", lines: ["JR東西線各停"] },
    { name: "新福島", type: "regular", lines: ["JR東西線各停"] },
    { name: "野田", type: "regular", lines: ["JR大阪環狀線各停"] },
    { name: "淀川", type: "minor", lines: ["阪神本線各停"] }
  ],
  "吹田市": [
    { name: "江坂", type: "major", lines: ["御堂筋線/北大阪急行 (始發/終點各停)"] },
    { name: "吹田 (JR)", type: "major", lines: ["JR京都線各停"] },
    { name: "千里山", type: "regular", lines: ["阪急千里線"] },
    { name: "關大前", type: "regular", lines: ["阪急千里線 (關西大學)"] },
    { name: "南千里", type: "regular", lines: ["阪急千里線"] },
    { name: "萬博紀念公園", type: "minor", lines: ["大阪單軌電車"] },
    { name: "豐津", type: "minor", lines: ["阪急千里線各停"] }
  ],
  "豐中市": [
    { name: "豐中", type: "major", lines: ["阪急寶塚線急行"] },
    { name: "千里中央", type: "major", lines: ["北大阪急行急行", "大阪單軌電車"] },
    { name: "螢池", type: "regular", lines: ["阪急寶塚線", "大阪單軌電車 (大阪伊丹機場聯絡)"] },
    { name: "庄內", type: "regular", lines: ["阪急寶塚線各停"] },
    { name: "服部天神", type: "regular", lines: ["阪急寶塚線各停"] },
    { name: "柴原阪大前", type: "minor", lines: ["大阪單軌電車各停"] },
    { name: "少路", type: "minor", lines: ["大阪單軌電車各停"] }
  ],
  "堺市堺區": [
    { name: "堺東", type: "major", lines: ["南海高野線快速急行/特急"] },
    { name: "堺", type: "major", lines: ["南海本線急行/特急"] },
    { name: "三國丘", type: "regular", lines: ["JR阪和線快速", "南海高野線聯絡"] },
    { name: "百舌鳥", type: "regular", lines: ["JR阪和線各停 (大仙陵古墳)"] },
    { name: "淺香山", type: "minor", lines: ["南海高野線各停"] },
    { name: "妙國寺前", type: "minor", lines: ["阪堺電軌阪堺線路面電車"] }
  ],
  "東大阪市": [
    { name: "布施", type: "major", lines: ["近鐵大阪線急行", "近鐵奈良線急行"] },
    { name: "長田", type: "major", lines: ["中央線/近鐵京阪奈線 (始發各停)"] },
    { name: "河內小阪", type: "regular", lines: ["近鐵奈良線準急"] },
    { name: "八戶之里", type: "regular", lines: ["近鐵奈良線各停"] },
    { name: "鴻池新田", type: "regular", lines: ["JR學研都市線各停"] },
    { name: "彌刀", type: "minor", lines: ["近鐵大阪線各停"] },
    { name: "額田", type: "minor", lines: ["近鐵奈良線各停"] },
    { name: "新石切", type: "minor", lines: ["近鐵京阪奈線各停"] }
  ],
  "箕面市": [
    { name: "箕面", type: "major", lines: ["阪急箕面線終點"] },
    { name: "箕面萱野", type: "major", lines: ["北大阪急行延伸終點站"] },
    { name: "牧落", type: "regular", lines: ["阪急箕面線各停"] },
    { name: "櫻井", type: "regular", lines: ["阪急箕面線各停"] },
    { name: "箕面船場阪大前", type: "minor", lines: ["北大阪急行延伸各停"] }
  ],
  "高槻市": [
    { name: "高槻", type: "major", lines: ["JR京都線新快速/特急"] },
    { name: "高槻市", type: "major", lines: ["阪急京都線快速特急/始發"] },
    { name: "攝津富田", type: "regular", lines: ["JR京都線各停"] },
    { name: "富田", type: "minor", lines: ["阪急京都線各停"] }
  ],
  "枚方市": [
    { name: "枚方市", type: "major", lines: ["京阪本線特急", "京阪交野線始發"] },
    { name: "樟葉", type: "major", lines: ["京阪本線特急始發"] },
    { name: "光善寺", type: "regular", lines: ["京阪本線各停"] },
    { name: "宮之阪", type: "regular", lines: ["京阪交野線"] },
    { name: "星之丘", type: "minor", lines: ["京阪交野線各停"] },
    { name: "村野", type: "minor", lines: ["京阪交野線各停"] }
  ],
  "八尾市": [
    { name: "近鐵八尾", type: "major", lines: ["近鐵大阪線準急"] },
    { name: "八尾 (JR)", type: "major", lines: ["JR大和路線各停"] },
    { name: "久寶寺", type: "regular", lines: ["JR大和路線快速", "JR大和路快速始發"] },
    { name: "志紀", type: "regular", lines: ["JR大和路線各停"] },
    { name: "河內山本", type: "minor", lines: ["近鐵大阪線", "近鐵信貴線各停"] },
    { name: "高安", type: "minor", lines: ["近鐵大阪線各停車輛基地"] }
  ],
  "札幌市（市平均）": [
    { name: "札幌", type: "major", lines: ["JR函館本線", "JR千歲線", "札幌地下鐵南北線", "札幌地下鐵東豐線"] },
    { name: "大通", type: "major", lines: ["札幌地下鐵南北線", "東西線", "東豐線"] },
    { name: "琴似", type: "regular", lines: ["JR函館本線", "札幌地下鐵東西線"] }
  ],
  "仙台市（市平均）": [
    { name: "仙台", type: "major", lines: ["JR東北本線", "JR仙石線", "仙台地下鐵南北線", "東西線"] },
    { name: "長町", type: "regular", lines: ["JR東北本線", "仙台地下鐵南北線"] },
    { name: "泉中央", type: "regular", lines: ["仙台地下鐵南北線"] }
  ],
  "名古屋市（市平均）": [
    { name: "名古屋", type: "major", lines: ["JR東海道本線", "JR中央本線", "名古屋地下鐵東山線", "櫻通線", "新幹線"] },
    { name: "金山", type: "major", lines: ["JR東海道本線", "名鐵名古屋本線", "名城線", "名港線"] },
    { name: "今池", type: "regular", lines: ["名古屋地下鐵東山線", "櫻通線"] }
  ],
  "京都市（市平均）": [
    { name: "京都", type: "major", lines: ["JR京都線", "JR奈良線", "京都地下鐵烏丸線", "近鐵京都線", "新幹線"] },
    { name: "烏丸御池", type: "major", lines: ["京都地下鐵烏丸線", "東西線"] },
    { name: "山科", type: "regular", lines: ["JR琵琶湖線", "京都地下鐵東西線", "京阪京津線"] }
  ],
  "神戶市（市平均）": [
    { name: "三之宮", type: "major", lines: ["JR神戶線", "阪急神戶線", "阪神本線", "神戶地下鐵西神山手線"] },
    { name: "神戶", type: "major", lines: ["JR神戶線", "神戶高速線"] },
    { name: "新長田", type: "regular", lines: ["JR神戶線", "神戶地下鐵西神山手線", "海岸線"] }
  ],
  "廣島市（市平均）": [
    { name: "廣島", type: "major", lines: ["JR山陽本線", "JR藝備線", "廣島電鐵", "新幹線"] },
    { name: "橫川", type: "regular", lines: ["JR山陽本線", "JR可部線", "廣島電鐵"] },
    { name: "西廣島", type: "regular", lines: ["JR山陽本線", "廣島電鐵宮島線"] }
  ],
  "福岡市（市平均）": [
    { name: "博多", type: "major", lines: ["JR鹿兒島本線", "福岡地下鐵機場線", "七隈線", "新幹線"] },
    { name: "天神", type: "major", lines: ["福岡地下鐵機場線", "西鐵天神大牟田線"] },
    { name: "西新", type: "regular", lines: ["福岡地下鐵機場線"] }
  ]
};
