# 交通動線型別重構（TransitLeg）

分支：`refactor/transit-leg-type`
前置：`8f723e7 fix(transit): 同站多路線全面防漏、站體對位重構與交通格式迴歸測試`

---

## 1. 為什麼要做

上一個 commit 修掉了「同一車站多條路線只顯示一條」的漏失，但**只修了症狀**。
根因還在：交通資訊在整條流水線裡是用**兩個平行字串陣列靠 index 對齊**傳遞的。

```ts
extracted.station  = "両国,両国"   // 站名
extracted.walkTime = "1,6"        // 步行時間
// 第三個維度「路線」完全不在型別裡
```

這個表示法有三個結構性問題：

1. **路線資訊無處可放。** `lineName` 只存在於 `parseTransitStations()` 的回傳值裡，
   一旦序列化成 `extracted` 就丟失，下游要用時得再 parse 一次。
2. **任何一層去重都會讓兩個陣列錯位，而且是靜默的。** 這正是原 bug 的成因——
   `reconcileTransitAccess` 的 `pairs.some(p => p.station === station)` 砍掉
   `station` 的第二筆，但 `walkTime` 沒同步砍，index 就對不上了。
3. **無法表達「同站不同線」。** `"両国,両国"` 這種寫法本身就是在用重複字串
   硬塞一個它表達不了的概念，任何看到它的程式碼都會很合理地想去重。

目前靠 `test:transit-formats` 的 32 個 fixture 守住行為，但那是防迴歸，不是修根因。

---

## 2. 目標型別

```ts
/** 一條獨立的交通動線：路線 × 車站 × 步行時間，三者不可分離。 */
export interface TransitLeg {
  readonly lineName: string;        // 原文路線名，顯示用（如「中央・総武線各停」）
  readonly lineKey: string;         // normalizeLineKey() 結果，去重用
  readonly stationName: string;     // 正規化站名（不含「駅」）
  readonly walkMin: number | null;  // 圖紙刊載步行分鐘
  readonly source: "flyer" | "inferred";  // 圖紙刊載 vs 圖資補足
  readonly rawText?: string;        // 原文子句，供稽核比對
}
```

`ExtractedListingFields` 增加 `transitLegs?: TransitLeg[]`，成為**唯一事實來源**。
`station` / `walkTime` 兩個字串欄位降級為「對外相容的序列化結果」，
只在 API 邊界與既有 baseline fixture 需要時才由 `transitLegs` 產生。

---

## 3. 影響範圍（已實測）

`walkTime` 在 `src` / `api` / `scripts` 共 **117 處引用、23 個檔案**。
因此這必須是獨立 PR，不可混進 bug fix。

### 核心（必改）
| 檔案 | 工作 |
|---|---|
| `src/lib/transitParser.ts` | `parseTransitStations` 回傳 `TransitLeg[]` |
| `src/lib/listingAudit.ts` | `station?: string; walkTime?: string` → 加 `transitLegs` |
| `src/lib/listing/types.ts`、`src/lib/server/listing/types.ts` | 型別擴充 |
| `api/analyze-listing.ts` | `reconcileTransitAccess` 產生 legs，序列化為相容欄位 |
| `src/lib/rentalListingReconciliation.ts` | 同上 |

### 下游消費者（需確認語意）
| 檔案 | 注意事項 |
|---|---|
| `src/lib/server/listing/saleAnalysis.ts` | `evaluateTransitHub(stations, walkTimes)` 改吃 legs；**注意目前它靠 `Math.min` 取最近站，改型別後要保持同語意** |
| `src/lib/listing/reportModel.ts`、`rentalMarketPresentation.ts`、`saleMarketPresentation.ts` | 顯示層 |
| `src/components/listingPdf/document.tsx` | PDF 匯出 |
| `src/hooks/createListingLocationActions.ts` | 目前已呼叫 `parseTransitStations` 產生 `stationLines`，重構後可直接傳 legs |

### 邊界相容（不可破壞）
- **分享連結**：`listingShare` 的序列化格式若變動，舊連結會打不開 → `transitLegs` 必須是
  **可選欄位**，讀取舊資料時由 `station`/`walkTime` 回填。
- **baseline fixtures**：`controller-flows-baseline.json`、`refactor-baseline.json`
  設計為 immutable。沿用 `test-controller-flows.ts` 既有慣例——新欄位單獨斷言後，
  從歷史比對中正規化移除。
- **`api/listing-location.ts`**：`stationLines` 參數目前是 `string[]`，
  可改為接收 legs 或保持現狀（後者變動更小）。

---

## 進度

| 階段 | 狀態 | commit |
|---|---|---|
| 1. 先加不拆（型別 + 可選欄位） | ✅ 完成 | `06a24e0` |
| 2. 雙寫（產生端同時輸出 legs 與舊欄位） | ✅ 完成 | `06a24e0` |
| 3. 下游切換到讀 legs | ✅ 完成 | `06a24e0` `3daa5c1` |
| 4. 收斂舊欄位為純序列化產物 | ⬜ 未開始（非必要，見下） |

**已切換到 legs 的消費者**：`reportModel`、`createListingLocationActions`、
`saleMarketPresentation`、`listingPdf/document`、`analyze-listing`
（`evaluateTransitHub` 輸入）。

**刻意不切換**：
- `rentalMarketPresentation` — 只取第一個數字當代表步行時間，不做 index 配對。
- `reportModel` 的 `stationSummary` — 只列站名、不配對時間。
- `rentalListingReconciliation` — 它是**產生端**（PDF 文字層 → 欄位），
  輸出字串給 `analyze-listing` 再解析，不是消費端。

階段 3 過程中實測抓到一個尚未被發現的錯位 bug（`3daa5c1`）：
`walkTime="1,,8"` 的空格是「未刊載」的有意義佔位，四處程式碼都把它
`filter(Boolean)` 濾掉後再用 index 配對，導致後續動線全部位移。
與 2026-09 的漏失 bug 同源。

**階段 4 的評估**：目前 legs 已是事實來源、舊欄位由 `serializeTransitLegs`
產生，**錯位風險已經消除**。真正刪掉 `station`/`walkTime` 需要：
1. 分享連結格式升版與舊連結遷移；
2. 兩個 immutable baseline fixture 重新產生；
3. `listingAudit` 的 `auditKeys` 移除這兩個 key（會影響稽核報表欄位）。

成本高而收益低（風險已消除），建議**維持現狀**，除非日後要改分享格式時
順手一起做。

---

## 4. 建議施作順序

1. **先加不拆**：`TransitLeg` 型別 + `transitLegs` 可選欄位，`station`/`walkTime` 完全不動。
   此步應該 0 行為變化，`npm run lint` 與全部測試必須直接綠。
2. **雙寫**：`parseTransitStations` / `reconcileTransitAccess` 同時產生 legs 與舊欄位，
   新增一致性斷言（`legs.length === station.split(",").length`）。
3. **下游逐個切換**到讀 legs，每切一個跑一次完整測試。
4. **最後才收斂**舊欄位為純序列化產物，並在 `listingAudit` 加上「legs 與舊欄位不一致」的稽核項。

每一步都應是可獨立 commit、可獨立回滾的。

---

## 5. 驗收標準

```bash
npm run lint
npm run test:transit-formats      # 32 格式 + 正規化 + PDF對位 + 地圖對位
npm run test:transit
npm run test:listing-commute
npm run test:rental-conditions
npm run test:listing-audit
npm run test:consumer-listing
npm run test:controller-flows     # baseline fixture 不可修改
npm run test:refactor-contracts
npm run test:special-sale
npm run test:listing-upload
npm run build
```

**額外要驗**：
- 舊分享連結（無 `transitLegs` 欄位）仍能正確渲染交通區塊。
- `両国` 雙路線案例在 UI、PDF、地圖三處都顯示 2 條動線。
- 售價多因子的「交通樞紐」`ratePercent` 與重構前完全一致。
  （注意：該因子目前不參與最終估價計算，詳見第 6 節——所以此項只需驗
  `ratePercent` 顯示值不變，不必驗估價金額。）

---

## 6. 本次未處理、留給後續的項目

- **區位類因子不參與估價計算 —— 這是刻意設計，不可「修復」。**
  （`src/lib/requirementVerdicts/salePrice.ts`，原始碼註解已寫明理由。）

  ```js
  appliedRate      = (1 + occupancyRate) * (1 + incomeRate) - 1;
  expectedPriceYen = areaBaseline * (1 + appliedRate);
  ```

  **重複計算的具體來源**：比較基準 `areaBaseline` 是「同區 × 同房型（×同屋齡帶）
  的實價登錄成交㎡單價 × 本案面積」。這個母體**本身就混合了各種徒步距離、樓層、
  朝向**，其中位數已經隱含了該區的平均區位條件。再乘一次 `walkRate` 等於對同一件事
  收費兩次。

  **屋齡**另有更嚴謹的處理：`ageControlledByMarket` 為真時（官方估價帶有 `ageBand`），
  屋齡直接由「同屋齡帶的實際成交單價」控制，比任何經驗係數都準，此時連因子都不列出
  （見 L146-151 註解：列成 +0% 會讓使用者誤以為系統沒考慮屋齡）。

  **有實測數據支撐**（L582-588 註解）—— 日本橋横山町一案：
  | 算法 | 預期價 | 判定開價 |
  |---|---|---|
  | 乘上區位係數 | 10,196 萬 | 低 21.5% |
  | 只用資料（現行） | 8,790 萬 | 低 9% |
  | At Home 同區同房型公開開價平均 | 8,320 萬 | 低 3.8% |

  兩條**獨立資料路徑**（實價登錄成交、At Home 刊登）彼此接近，加了係數的版本明顯偏離。

  另一個判準：這些百分比是**業界經驗值而非回歸結果**。徒步係數之所以只能用經驗值，
  是因為國交省成交資料的 `TimeToNearestStation` 對中古マンション **0% 有值**
  （實測東京 2025 年 16,353 筆全部空白，見 L170-175），無法回歸。
  `basis: "estimate"` vs `"data"` 就是在標示這個差別。

  ⚠️ **不要據此去改 UI。** 曾一度以為網頁版該依 `applied` 標示「未計入」，
  實測後確認是錯的（`a2c852f` 已 revert）：

  - **網頁買賣頁不顯示估價金額。** `expectedPriceMan` 只在 PDF
    （`listingPdf/sale.tsx`、`priceReasonableness.tsx`）出現；網頁的
    `SalePriceFactors` 只給百分比，即「賣方開價 vs 同區成交基準」的差距。
    產品定位是評估溢價／折讓幅度，不是報一個估價數字。
  - **在「優勢條件加總」這張卡裡，這些因子確實被使用了。**
    `posSum` 加總所有 `ratePercent > 0` 的因子，**不分 `applied`**，
    用來對照賣方開價。PDF 的 `ReasonablenessCard` 同一套邏輯。

  `applied` 的適用範圍僅限 `FactorTable`（PDF 的預期價金額情境）——
  那裡確實只乘現況／租約收益。搬到網頁的加總情境會與實際行為相反。
- ~~通勤路由重複呼叫~~ **經實測確認不存在，無需處理。**
  `routeFootDistance` 已有座標級快取（`foot:{from}:{to}`，5 位小數 ≈ 1m）：
  - 共構站（兩路線同一站體）→ 座標相同 → 快取命中，只呼叫 1 次。
  - 両国（JR 與都営相距約 450m）→ 兩個站體座標不同 → 各呼叫 1 次，
    但兩者的實際步行距離本來就不同，屬**必要查詢**而非浪費。

  先前在報告中把此項列為「浪費配額」是錯誤推測，已由 `tmp` 探針實測推翻。
- ~~`SUBWAY_LINE_KEYWORDS` / `SURFACE_LINE_KEYWORDS` 硬編碼~~ **已處理。**
  改由 `scripts/build-line-modes.ts` 從 `tokyoTransitGraph.json` 推導
  `src/data/railLineModes.json`（171 條路線 / 49 家業者，16 地下鐵 + 155 地面鐵）。
  指令：`npm run data:build:line-modes`。

  判定順序**不可調換**（路線名優先於業者名）：都電荒川線與日暮里・舎人ライナー
  的 `operator` 是「都営地下鉄」，純看業者會誤判成地下鐵。
  已保留 `SUBWAY_FALLBACK` / `SURFACE_FALLBACK` 處理圖資未覆蓋的關西線名。

  實作時實測抓到一個 bug：雙向包含比對讓單字「線」命中大量正式線名而誤判
  運輸型態，已加 `MIN_LINE_FRAGMENT = 3`（最短實際簡稱如「南北線」）。
