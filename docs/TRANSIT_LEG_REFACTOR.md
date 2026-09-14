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
- 售價多因子的「交通樞紐」`ratePercent` 與重構前完全一致
  （目前 `applied: false`，僅顯示不參與計算——若要讓它生效是另一個決策，不屬本次範圍）。

---

## 6. 本次未處理、留給後續的項目

- **交通樞紐因子未生效**：`salePrice.ts` 的「交通樞紐」`factors.push({ applied: false })`，
  代表 `ratePercent` 只顯示不計算。新增的「雙鐵路優勢 `ratePercent: 2`」分支因此
  不會改變任何估價數字。要讓它生效需要產品決策 + 回歸估價 baseline。
- **通勤路由重複呼叫**：同站多路線時會對同一站體重複呼叫路由 API，
  結果正確但浪費配額。可在 `getListingLocationContext` 依站體座標做 memo。
- **`SUBWAY_LINE_KEYWORDS` / `SURFACE_LINE_KEYWORDS` 仍是硬編碼**。
  中長期應改為由 `src/data/tokyoTransitGraph.json`（已含 2,116 站的路線資料）
  推導路線 → 運輸型態的對照表，讓新路線自動支援。
