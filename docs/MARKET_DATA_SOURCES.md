# 租金與買賣行情資料來源

## 實作結論

本站把「刊登行情」與「實際交易」分開處理：

- 租屋概算：以 At Home 最近 3 個月刊登平均為主，每季更新一次。
- 交叉檢查：SUUMO 與 LIFULL HOME'S 目前只作人工比較，不把數字寫入正式模型。
- 買房概算：以國土交通省「不動產資訊資料庫」XIT001 交易價格為第一順位；樣本不足時，畫面會明示改用租金收益率模型。
- At Home、SUUMO、HOME'S 的二手屋相場都是刊登／募集價格，不是實際成交價，不能取代國交省交易資料。

## 更新矩陣

| 來源 | 涵蓋資料 | 來源期間／更新節奏 | 本站節奏 | 自動匯入狀態 |
| --- | --- | --- | --- | --- |
| At Home 公開相場 | 租金、二手公寓、二手住宅等刊登平均 | 最近 3 個月；未承諾固定更新日 | 每季（1、4、7、10 月） | 自動建立靜態快照 |
| SUUMO 公開相場 | 租金、二手公寓等 SUUMO 刊登／登錄集計 | 頁面標示資料時點 | 每季同日人工抽樣 | 目前不自動匯入 |
| LIFULL HOME'S 公開相場 | 租金與二手公寓刊登平均 | 租金頁通常每週五；二手公寓頁每月 | 每季同日人工抽樣 | 目前不自動匯入 |
| 國交省不動產資訊資料庫 API | 實際交易價格、成約價格 | 季度資料；實際更新日看官方公告 | 每季更新 | 已啟用靜態快照 |

程式中的機器可讀版本在 `src/data/marketDataSources.ts`，執行 `npm run data:review` 可同時檢查來源狀態與資料新鮮度。

## At Home 租金更新

每季執行下列指令建立新的 At Home 靜態快照：

```bash
npm run data:update:athome
npm run test:athome-rent
npm run data:review
```

每次更新都必須人工檢查資料差異、缺值與異常跳動。建議差異門檻：行政區／間取り相較前次快照變動超過 10% 時，回到來源頁複核，不直接發布。

快照保留 1R、1K、1DK、1LDK、2K、2DK、2LDK、3K、3DK、3LDK、4K、4DK、4LDK以上共 13 個細項。主地圖顯示 5 個相近格局群組，採群組內可用行情中位數；`4LDK以上` 因容易混入超大型豪宅，只保留細項而不納入 `3LDK+` 群組。

## 國交省買賣成交資料更新

把金鑰存入伺服器端 `.env.local`，每季執行：

```bash
npm run data:update:mlit-buy
npm run test:buy-market
npm run test:market-sources
npm run lint
```

更新程式會讀取 XIT001 的「不動產交易價格」資料，篩選公寓交易，按本站行政區及 1R／1K／1LDK／2LDK／3LDK+ 集計中位數。每組優先採最新四季；四季不足 5 筆時擴大至最新八季，八季仍不足才回退租金收益率模型。間取り缺值時，才以文件化的面積帶分類。API 金鑰不會進入前端 bundle。

2026-09-01 快照最新季度為 2026-Q1，共有 761 組行政區／格局成交中位數：663 組採最新四季，98 組因近期樣本不足採最新八季。本站 210 個地區均至少有一種格局具備合格成交樣本；格局層級不是全面覆蓋，缺少合格樣本的組合仍使用租金收益率模型。

只要買房試算實際用到國交省快照，畫面就會顯示規約要求的 credit：

> このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません

## 官方連結

- [At Home 租金相場](https://www.athome.co.jp/chintai/souba/)
- [SUUMO 利用規約](https://cdn.p.recruit.co.jp/terms/suu-t-1003/index.html)
- [LIFULL HOME'S 利用規約](https://www.homes.co.jp/kiyaku/)
- [國交省 XIT001 API 說明](https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/)
- [國交省 API 利用規約](https://www.reinfolib.mlit.go.jp/help/termsOfUse/)
