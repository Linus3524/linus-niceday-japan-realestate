# 租金與買賣行情資料來源

## 實作結論

本站把「刊登行情」與「實際交易」分開處理：

- 租賃圖紙：以 At Home 全國最近 3 個月刊登平均為主；目前 47 都道府縣、1,192 個至少有一種格局行情的市區町村。
- 租金地圖／車站推薦：維持 210 個已有交通資料的精選地區，避免把沒有車站與路線資料的城市冒充可推薦範圍。
- 交叉檢查：SUUMO 與 LIFULL HOME'S 提供全國公開相場入口，但統計維度不同，目前不把三站數字硬平均。
- 買房成交基準：以國土交通省 XIT001 為第一順位，涵蓋全 47 都道府縣；只對至少 5 筆的市區町村／格局出結論。
- 買房公開開價：優先使用 At Home 同市區町村／格局公開刊登平均；缺值時才使用東日本、中部、近畿 REINS 的區域「新規登錄㎡單價 ÷ 成約㎡單價」備援。西日本公開 REINS 摘要無新規登錄價，不補造數值。
- At Home、SUUMO、HOME'S 的二手屋相場都是刊登／募集價格，不是實際成交價，不能取代國交省交易資料。

## 更新矩陣

| 來源 | 涵蓋資料 | 來源期間／更新節奏 | 本站節奏 | 自動匯入狀態 |
| --- | --- | --- | --- | --- |
| At Home 公開相場 | 租金、二手公寓、二手住宅等刊登平均 | 最近 3 個月；未承諾固定更新日 | 每季（1、4、7、10 月） | 自動建立靜態快照 |
| SUUMO 公開相場 | 租金、二手公寓等 SUUMO 刊登／登錄集計 | 頁面標示資料時點 | 每季同日人工抽樣 | 目前不自動匯入 |
| LIFULL HOME'S 公開相場 | 租金與二手公寓刊登平均 | 租金頁通常每週五；二手公寓頁每月 | 每季同日人工抽樣 | 目前不自動匯入 |
| 國交省不動產資訊資料庫 API | 實際交易價格、成約價格 | 季度資料；實際更新日看官方公告 | 每季更新 | 已啟用靜態快照 |
| 東日本／中部／近畿／西日本 REINS | 中古公寓成約；前三者適用區域另有新規登錄㎡單價 | 每月 | 每月人工複核 | 小型常數表；西日本不推算開價 |

## 三家公開租金行情頁（2026-09-05 複核）

三家都有不需登入即可瀏覽的租金行情頁，但統計口徑不能直接混合：

| 平台 | 公開入口 | 可查維度 | 頁面揭露口徑 |
| --- | --- | --- | --- |
| At Home | <https://www.athome.co.jp/chintai/souba/> | 都道府縣、市區郡、沿線、車站、細格局 | 掲載した直近 3 個月物件資訊算出的平均家賃；本站正式快照來源 |
| SUUMO | <https://suumo.jp/chintai/soba/> | 都道府縣、市區郡、沿線、車站、建物種別、格局群組 | 以 SUUMO 登錄賃貸物件按獨自邏輯集計，頁面標示更新日；不保證等同目前刊登物件的簡單平均 |
| LIFULL HOME'S | <https://www.homes.co.jp/chintai/tokyo/price/> | 都道府縣、市區町村、沿線、車站、單身／家庭群組 | 由 HOME'S 刊登賃貸資料算出平均；搜尋入口另揭露基準以徒步 10 分內、排除管理費與停車費並結合過去資料，每週五更新 |

因此 SUUMO 與 HOME'S 適合在同一日期抽樣做偏差警報，不適合與 At Home 三者直接平均。若未來要正式納入模型，必須先建立格局映射、管理費口徑與更新日期欄位，並分開保存各來源值。

程式中的機器可讀版本在 `src/data/marketDataSources.ts`，執行 `npm run data:review` 可同時檢查來源狀態與資料新鮮度。

## At Home 租金更新

每季執行下列指令建立新的 At Home 靜態快照：

```bash
npm run data:update:athome
npm run data:update:athome-rent-national
npm run test:athome-rent
npm run data:review
```

每次更新都必須人工檢查資料差異、缺值與異常跳動。建議差異門檻：行政區／間取り相較前次快照變動超過 10% 時，回到來源頁複核，不直接發布。

快照保留 1R、1K、1DK、1LDK、2K、2DK、2LDK、3K、3DK、3LDK、4K、4DK、4LDK以上共 13 個細項。主地圖顯示 5 個相近格局群組，採群組內可用行情中位數；`4LDK以上` 因容易混入超大型豪宅，只保留細項而不納入 `3LDK+` 群組。

租賃圖紙另讀取 `src/data/atHomeNationwideRentSnapshot.ts`。2026-09-05 快照涵蓋全 47 都道府縣、1,192 個至少有一種格局公開行情的市區町村，共 4,785 個有效格局值。缺少指定格局時維持查無行情，不用鄰市或其他格局補值；行情卡會直接連回該行政區的 At Home 來源頁與快照日期。

## 國交省買賣成交資料更新

把金鑰存入伺服器端 `.env.local`，每季執行：

```bash
npm run data:update:mlit-buy
npm run test:buy-market
npm run test:market-sources
npm run lint
```

更新程式會讀取 XIT001 的「不動產交易價格」資料，篩選公寓交易，按本站行政區及 1R／1K／1LDK／2LDK／3LDK+ 集計中位數。每組優先採最新四季；四季不足 5 筆時擴大至最新八季，八季仍不足才回退租金收益率模型。間取り缺值時，才以文件化的面積帶分類。API 金鑰不會進入前端 bundle。

2026-09-05 快照最新季度為 2026-Q1，共有 1,389 組市區町村／格局成交中位數：1,133 組採最新四季，256 組因近期樣本不足採最新八季。涵蓋全 47 都道府縣、506 個有合格成交樣本的市區町村，並保留原有 210 個地區的相容聚合；沒有至少 5 筆的組合不冒充官方行情。

快照同時保存成交㎡單價、代表面積、建築年有效樣本數、構造計數，以及每帶至少 5 筆的屋齡分層㎡單價。953／1,389 個粗分桶至少有一個合格屋齡子分桶，共 2,460 個屋齡分層，建築年欄位覆蓋約 96.7%。XIT001 目前沒有回傳最寄站／徒步欄位，不能用這支 API 建立徒步分層；`UnitPrice` 多為空值時以 `TradePrice / Area` 計算。

## 全國公開販售行情更新

`npm run data:update:athome-sale` 會以國交省快照中的市區町村為目標，建立 `src/data/atHomeSaleSnapshot.ts`。目前 506 個目標中對應 498 個，保存 1,689 個有效格局值；8 個無法對應的市場與個別缺格局維持 `null`。正式 API 只讀本地快照，不在使用者上傳圖紙時即時抓取外站。

畫面同時提供 [At Home](https://www.athome.co.jp/mansion/chuko/souba/)、[SUUMO](https://suumo.jp/ms/chuko/soba/) 與 [LIFULL HOME'S](https://www.homes.co.jp/mansion/chuko/price/) 全國中古公寓相場入口。只有 At Home 的市區町村／格局平均進入第二基準；SUUMO 偏向車站 × 面積帶中位數，HOME'S 亦有自己的面積維度，不能在未正規化前直接平均。

只要買房試算實際用到國交省快照，畫面就會顯示規約要求的 credit：

> このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません

## REINS 市場典型開價更新

`src/data/reinsSaleMarket.ts` 保存目前採用的少數數字。2026-07 成約／新規登錄㎡單價：首都圈 84.17／117.86、中部圈 32.22／36.18、近畿圈 47.94／55.27 萬円/㎡。西日本 2026-07 公開摘要僅有中國 34.0、四國 27.0、九州 42.3 萬円/㎡成約價，沒有新規登錄價，因此不建立 REINS 開價倍率。

這不是同一批物件從開價一路追到成交的配對資料，不能對客人說「每一戶都能砍 28.6%」。本站只拿它把成約行情換算成市場層級的典型開價基準，並在畫面明示限制。

## 官方連結

- [At Home 租金相場](https://www.athome.co.jp/chintai/souba/)
- [SUUMO 租金相場](https://suumo.jp/chintai/soba/)
- [LIFULL HOME'S 租金相場](https://www.homes.co.jp/chintai/tokyo/price/)
- [SUUMO 利用規約](https://cdn.p.recruit.co.jp/terms/suu-t-1003/index.html)
- [LIFULL HOME'S 利用規約](https://www.homes.co.jp/kiyaku/)
- [國交省 XIT001 API 說明](https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/)
- [國交省 API 利用規約](https://www.reinfolib.mlit.go.jp/help/termsOfUse/)
- [At Home 中古公寓價格相場](https://www.athome.co.jp/mansion/chuko/souba/)
- [SUUMO 中古公寓價格相場](https://suumo.jp/ms/chuko/soba/)
- [LIFULL HOME'S 中古公寓價格相場](https://www.homes.co.jp/mansion/chuko/price/)
