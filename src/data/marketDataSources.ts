export type MarketDataSourceId =
  | "mlit-reinfolib"
  | "athome-public"
  | "suumo-public"
  | "homes-public";

export type MarketDataKind = "rent_listing" | "sale_listing" | "transaction";
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
    statistic: "不動產交易價格與成約價格",
    publicationCadence: "按季發布；實際資料更新日以官方公告為準",
    reviewCadenceDays: 100,
    ingestionStatus: "enabled",
    automatedIngestionAllowed: true,
    sourceUrl: "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/",
    termsUrl: "https://www.reinfolib.mlit.go.jp/help/termsOfUse/",
    note: "每季建立交易價格靜態快照；金鑰只放伺服器端，使用成交快照時顯示規約指定 credit。"
  },
  {
    id: "athome-public",
    label: "At Home 公開相場頁",
    kinds: ["rent_listing", "sale_listing"],
    statistic: "最近 3 個月刊登物件平均",
    publicationCadence: "最近 3 個月滾動平均；本站每季更新一次",
    reviewCadenceDays: 100,
    ingestionStatus: "enabled",
    automatedIngestionAllowed: true,
    sourceUrl: "https://www.athome.co.jp/chintai/souba/",
    termsUrl: "https://www.athome.co.jp/",
    note: "每季建立靜態快照；正式站不會在使用者請求期間即時抓取 At Home。"
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
  }
];

export const getMarketDataSource = (id: MarketDataSourceId) =>
  marketDataSources.find(source => source.id === id)!;
