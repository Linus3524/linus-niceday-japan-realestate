export type MarketDataSourceId =
  | "mlit-reinfolib"
  | "reins-market-watch"
  | "athome-public"
  | "suumo-public"
  | "homes-public"
  | "retpc-appraisal-manual"
  | "tokyo-kantei-research";

export type MarketDataKind = "rent_listing" | "sale_listing" | "transaction" | "appraisal_standard";
export type IngestionStatus = "enabled" | "manual_only";

export interface MarketDataSourcePolicy {
  id: MarketDataSourceId;
  label: string;
  kinds: MarketDataKind[];
  statistic: string;
  publicationCadence: string;
  reviewCadenceDays: number;
  ingestionStatus: IngestionStatus;
  automatedIngestionAllowed: boolean;
  sourceUrl: string;
  termsUrl: string;
  note: string;
}

export const MLIT_API_CREDIT =
  "このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません";

export const marketDataSources: MarketDataSourcePolicy[] = [
  {
    id: "mlit-reinfolib",
    label: "國土交通省 不動產資訊資料庫 API",
    kinds: ["transaction"],
    statistic: "中古公寓、戶建與土地的不動產交易價格／成約價格",
    publicationCadence: "按季發布；實際資料更新日以官方公告為準",
    reviewCadenceDays: 100,
    ingestionStatus: "enabled",
    automatedIngestionAllowed: true,
    sourceUrl: "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/",
    termsUrl: "https://www.reinfolib.mlit.go.jp/help/termsOfUse/",
    note: "每季分別建立中古公寓、戶建與土地交易價格靜態快照；金鑰只放伺服器端，使用成交快照時顯示規約指定 credit。"
  },
  {
    id: "reins-market-watch",
    label: "東日本／中部／近畿／西日本 REINS 公開市況",
    kinds: ["transaction", "sale_listing"],
    statistic: "區域中古公寓成約㎡單價；有公開新規登錄㎡單價的區域並列使用",
    publicationCadence: "每月發布；本站人工複核後更新小型常數",
    reviewCadenceDays: 40,
    ingestionStatus: "manual_only",
    automatedIngestionAllowed: false,
    sourceUrl: "https://www.reins.or.jp/library/",
    termsUrl: "https://www.reins.or.jp/",
    note: "首都圈、中部圈、近畿圈建立市場典型開價備援；西日本公開摘要只有成約統計，不臆造新規開價。兩組物件的市場平均差距不等於個案可議價幅度。"
  },
  {
    id: "athome-public",
    label: "At Home 公開相場頁",
    kinds: ["rent_listing", "sale_listing"],
    statistic: "租金、中古公寓、中古戶建與土地的公開刊登相場",
    publicationCadence: "最近 3 個月滾動平均；本站每季更新一次",
    reviewCadenceDays: 100,
    ingestionStatus: "enabled",
    automatedIngestionAllowed: true,
    sourceUrl: "https://www.athome.co.jp/souba/",
    termsUrl: "https://www.athome.co.jp/",
    note: "租金、中古公寓、中古戶建與土地公開刊登行情各自建立靜態快照；正式站不會在使用者請求期間即時抓取 At Home。"
  },
  {
    id: "suumo-public",
    label: "SUUMO 公開相場頁",
    kinds: ["rent_listing", "sale_listing"],
    statistic: "SUUMO 刊登／登錄資料的獨自集計",
    publicationCadence: "頁面會標示資料時點，但未承諾本站可依固定頻率再利用",
    reviewCadenceDays: 100,
    ingestionStatus: "manual_only",
    automatedIngestionAllowed: false,
    sourceUrl: "https://suumo.jp/chintai/soba/",
    termsUrl: "https://cdn.p.recruit.co.jp/terms/suu-t-1003/index.html",
    note: "每季與 At Home 同日抽樣，用於發現地區或格局口徑差異；不直接寫入正式模型。"
  },
  {
    id: "homes-public",
    label: "LIFULL HOME'S 公開相場頁",
    kinds: ["rent_listing", "sale_listing"],
    statistic: "刊登物件平均；租金頁通常每週五更新、二手公寓價格頁每月更新",
    publicationCadence: "租金每週、二手公寓每月（依各頁標示）",
    reviewCadenceDays: 100,
    ingestionStatus: "manual_only",
    automatedIngestionAllowed: false,
    sourceUrl: "https://www.homes.co.jp/chintai/price/",
    termsUrl: "https://www.homes.co.jp/kiyaku/",
    note: "每季與 At Home 同日抽樣，用於發現短期供給與高低價偏差；不直接寫入正式模型。"
  },
  {
    id: "retpc-appraisal-manual",
    label: "公益財團法人 不動產流通推進中心《中古マンション価格査定マニュアル》",
    kinds: ["appraisal_standard"],
    statistic: "日本仲介公會中古公寓官方價格査定基準點數（位置・開口部方位・階層・專有使用權・借地權）",
    publicationCadence: "定期修訂；日本不動產經紀業官方標準",
    reviewCadenceDays: 180,
    ingestionStatus: "manual_only",
    automatedIngestionAllowed: false,
    sourceUrl: "https://www.retpc.jp/chousa/satei/",
    termsUrl: "https://www.retpc.jp/",
    note: "日本各大仲介（三井、住友、東急等）與銀行採用的二手公寓査定標準：角部屋（+3%～+5%）、開口部南向（+3%～+5%）、北向（-3%～-5%）、最上階（+3%～+5%）、1階（-5%）、借地權折價（-20%～-35%）。定期由 scripts/review-appraisal-standards.ts 複核更新。"
  },
  {
    id: "tokyo-kantei-research",
    label: "東京カンテイ（Tokyo Kantei）不動產大數據研究所",
    kinds: ["appraisal_standard", "transaction"],
    statistic: "首都圈與各大都市圈中古公寓百萬筆成約特徵價格回歸統計（角住戶溢價、南北向單價差、規模效應保值率）",
    publicationCadence: "每月／每季發布研究報告",
    reviewCadenceDays: 90,
    ingestionStatus: "manual_only",
    automatedIngestionAllowed: false,
    sourceUrl: "https://www.kantei.ne.jp/report/",
    termsUrl: "https://www.kantei.ne.jp/",
    note: "日本最大公寓資料庫實證統計：同一大樓角部屋平均單價高出 +4.2%、南北向成交單價差 7%～9%、大規模社區（100戶以上）相對小社區（20戶以下）築20年保值率高出 5%～8%。定期由 scripts/review-appraisal-standards.ts 追蹤爬取最新市場研究報告。"
  }
];

export const getMarketDataSource = (id: MarketDataSourceId) =>
  marketDataSources.find(source => source.id === id)!;

