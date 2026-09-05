# 買賣圖紙健檢：價格模型待辦交接

這份文件寫給**接手的開發者／AI**，假設你沒有參與先前的討論。所有背景、已知數據與地雷都寫在裡面。

專案：`linus-niceday-japan-realestate`（日本不動產資訊網站，經營者是持牌仲介）
相關功能：使用者上傳日文物件販売図面（PDF／圖片）→ Gemini vision 抽取欄位 → 與國交省實價比對開價是否合理。

---

## 現況：已完成的部分

買賣側的價格判定在 `buildSalePriceVerdict()`（[src/lib/requirementVerdict.ts](../src/lib/requirementVerdict.ts)），由 `buildSaleAnalysis()`（[api/analyze-listing.ts](../api/analyze-listing.ts)）呼叫。

流程是兩段式校準：

1. **面積校準**：實價快照每一列是「行政區 × 房型分桶」的成交中位**總價**，而一個 `ldk2` 分桶涵蓋 45～75㎡，同分桶內合理總價可差六成以上。用建立快照時的同一組面積帶中點（`LAYOUT_AREA_BANDS`，定義在 [src/data/buyMarket.ts](../src/data/buyMarket.ts)）把中位總價還原成這一戶實際面積對應的基準價。
2. **條件校準**：屋齡、車站徒步（取最近站）、樓層（含總樓層）、翻新，各給一個溢價／折價率，加總後夾在 −40%～+50%，乘上面積校準後的基準價，得到「預期價」。再依樣本數給容許區間（面積可校準時 ±15%，否則 ±22%；樣本 < 30 筆再放寬 3～6 個百分點）。

資料來源是國交省「不動産情報ライブラリ」XIT001 API 的成約實價，快照檔 [src/data/mlitBuySnapshot.ts](../src/data/mlitBuySnapshot.ts) 由 [scripts/update-mlit-buy-data.ts](../scripts/update-mlit-buy-data.ts) 產生（**自動產生，不要手改**），已設每月自動更新的 GitHub Actions 排程。

---

## 待辦 1（最優先）：加入「開價 vs 成約價」第二次比較

### 問題

國交省實價是**成約価**（實際成交價），但販売図面上寫的是**開價**（売り出し価格）。兩者直接相比會系統性地讓每一件物件看起來都買貴。

用 4 張真實販売図面實測，全部落在「高於預期價」：

| 物件 | 開價 | 面積 | 屋齡 | 相對成約中位 |
| --- | --- | --- | --- | --- |
| アイルカナーレ浅草（台東区） | 6,300 萬 | 40.95㎡ | 築11年 | +17.7% |
| THE Grande regalo 東日暮里（荒川区） | 5,980 萬 | 50.55㎡ | 築13年 | +28.9% |
| ツインタワー住利住吉館（江東区） | 6,790 萬 | 46.33㎡ | 築32年 | +37.9% |
| ナビウス高円寺南（杉並区） | 7,799 萬 | 46.92㎡ | 築28年 | +41.0% |

網站的使用者是要買房的客人。全部顯示「偏高 2～4 成」，客人會以為自己一定被坑，這是**誤導**。

### 已查證的公開資料（可直接用，不必再查）

**東日本レインズ（REINS）月例 Market Watch** — 每月公布首都圏中古マンション的成約㎡単価與新規登録㎡単価（＝賣方開價），兩者並列：

| 2026年3月・首都圏 | ㎡単価 |
| --- | --- |
| 成約㎡単価 | 86.34 萬円 |
| 新規登録㎡単価（開價） | 111.40 萬円 |
| **乖離率** | **+29.0%** |

且乖離在擴大：2015年4月僅 +6.2%，十年間拉到 +29.0%。

**這正好解釋了上表的結果。** 市場上開價普遍比成約價高約 29%，所以相對於「正常開價水準」：

| 物件 | vs 成約中位 | vs 市場典型開價（+29%） |
| --- | --- | --- |
| アイルカナーレ浅草 | +17.7% | **−11.3pt（開價偏便宜）** |
| THE Grande regalo | +28.9% | **−0.1pt（完全是典型開價）** |
| ツインタワー住利 | +37.9% | +8.9pt |
| ナビウス高円寺南 | +41.0% | +12.0pt |

結論完全不同。

### 要做什麼

在現有的成約價比對之外，加上第二層「開價行情基準」＝ 成約中位數 × (1 + 乖離率)，畫面上兩層並陳。目標呈現大致像：

> **成約行情基準**（客人實際會付的錢）：預期 4,640 萬
> **開價行情基準**（市場上同類物件的開價水準）：約 5,986 萬
> 本案開價 5,980 萬 → 與市場典型開價水準相當

同時要讓客人理解「成約價通常比開價低約兩成，這就是議價空間所在」——這對仲介談判是有利資訊，不是壞消息。

### 實作注意

- **不要串接 SUUMO／at home／LIFULL HOME'S**。這在專案早期已明確排除：這類平台的使用條款通常禁止自動化存取，對持牌仲介的自有品牌網站是不必要的法律與商譽風險。REINS 已完整覆蓋這個需求，不需要碰它們。
- REINS 只有 PDF，沒有 API。乖離率只是少數幾個數字，建議做成手工維護的小常數表（含資料期間與來源 URL），跟著季度更新即可，不要寫 PDF parser。
- **口徑選擇待決定**：首都圏單一數字最簡單；REINS 也有都県別（東京都／神奈川／埼玉／千葉），準確度較好但要多維護幾個數字。經營者尚未拍板。
- **東京カンテイ 有更細的資料但有版權限制**：每月發布「売り希望価格」，細分到東京23区（2026年3月：23区 70㎡換算 12,425 萬円、平均築26.5年，換算約 177.5 萬/㎡）。URL 格式固定為 `https://www.kantei.ne.jp/wp-content/uploads/c{YYYYMM}.pdf`。**但 PDF 頁尾明寫「※本記事の無断転用を禁じます」**，要把數字放上網站需先取得授權。當作內部參考可以，直接搬上線不行。
- 經營者本人有 REINS 會員權限（持牌仲介），可能可取得比公開版更細的資料，但是否允許用於對外網站要看其加盟契約，**不要自行假設可用**。

### 參考來源

- <https://www.rbayakyu.jp/rbay-kodawari/item/8610-10>（乖離率十年變化的具體數字）
- <https://www.reins.or.jp/library/>（REINS 統計首頁）
- <https://www.reins.or.jp/pdf/trend/mw/mw_202604_summary.pdf>（月例 Market Watch 範例）
- <https://www.kantei.ne.jp/wp-content/uploads/c202603.pdf>（東京カンテイ，注意版權）

---

## 待辦 2：校準係數權重

`buildSalePriceVerdict()` 裡的屋齡／徒步／樓層係數是**依日本市場常識估的，不是從資料回歸出來的**：

- 屋齡：≤3年 +25%、≤5年 +20%、≤10年 +12%、≤15年 +6%、≤25年 0%、≤30年 −8%、≤40年 −18%、>40年 −28%（基準為中古主力屋齡 20～25 年）
- 徒步：≤3分 +12%、≤5分 +8%、≤7分 +4%、≤10分 0%、≤15分 −6%、>15分 −12%（基準 8～10 分）
- 樓層：地下 −8%、1樓 −5%、15層以上建物且位於上段80% +10%、過半樓層 +4%、3樓以上 +2%
- 翻新：+5%

做完待辦 1 之後要重新檢視。有可能大部分偏差來自口徑差異而非係數本身，屆時係數不需要大改。**先做待辦 1 再回頭看這個，順序不要顛倒。**

另有一個小問題：最上階（例如 7 層建物的 7 樓）目前只落在「過半樓層 +4%」，沒有單獨的頂樓處理。

---

## 待辦 3（根本解法）：擴充快照欄位，用資料取代手估係數

[scripts/update-mlit-buy-data.ts](../scripts/update-mlit-buy-data.ts) 目前只保留 6 個欄位：

```
Type / Municipality / TradePrice / FloorPlan / Area / Period
```

但國交省 XIT001 API 同時回傳 **`BuildingYear`（建築年）、`TimeToNearestStation`（最寄駅徒歩分）、`UnitPrice`、`Structure`** 等欄位，目前全部被丟棄。

把這些存進快照就能做到「同區 × 同房型 × 同屋齡帶 × 同徒步帶的 ㎡単価中位數」，比較基準本身就控制了面積、屋齡與距離，不必再靠待辦 2 那些手估係數事後硬修。

**這不需要新的 API 權限**，只要改抓取腳本重跑。金鑰是 `MLIT_REINFOLIB_API_KEY`（已設在 `.env.local` 與 GitHub Actions secret）。

注意：切太細會讓每個分桶的樣本數暴跌（目前已有 46% 的分桶樣本少於 20 筆、24% 少於 10 筆，採計下限是 5 筆）。要設計成階層式回退——細分桶樣本不足時退回較粗的分桶，並如實標示實際使用的口徑。

---

## 這個專案的地雷（會踩到的請先看）

1. **`tsconfig.json` 沒有開 `strict`／`strictNullChecks`**。所以 `{ ok: true } | { ok: false; error: string }` 這種 discriminated union 靠 `if (!r.ok) return r.error` 收斂**不會過型別檢查**。改用自訂 Error 子類別 + `catch` 裡 `instanceof` 收斂（這個可以正常運作）。

2. **`normalizeRoomType()` 對 4LDK 以上刻意回傳 `null`**——實價資料本身不收錄這個級距。**絕對不要 fallback 成任何一桶**。曾經 fallback 成 `ldk1`，導致新宿一間 4LDK 85㎡ 開價 1.28 億被拿去比 1LDK 的 5,800 萬中位數，判成「高於行情 +120%」，而比對正確的 ldk3（中位 1.5 億）其實是低於行情約 15%——結論剛好相反。寧可不給結論也不能給反的。

3. **`server.ts` 一律薄薄地委派給 `api/*.ts` 的 default export handler**。這個專案歷史上反覆出現「本機與線上邏輯分岔」的 bug，不要在 `server.ts` 裡另外實作邏輯。

4. **Express 全域 `express.json()` 比路由先跑**。圖紙上傳需要較大的 body 上限，放寬必須在 body parser 那一層依路徑判斷（`/api/analyze-listing` 用 5mb，其餘維持預設 100kb）；在路由那一行再掛一個 `express.json({limit})` **沒有作用**，請求早就被回 413 了。

5. **Vercel 的 request body 硬上限是 4.5MB，不可調**。base64 會讓體積膨脹約 1.37 倍，因此上傳合計上限設為 3MB，前端會先自動縮圖（長邊 2000px、JPEG quality 0.8、依 EXIF 轉正）。

6. **`npm run dev` 是 `tsx server.ts`，沒有 watch**。改了 `server.ts` 或 `api/*.ts` 一定要重啟才會生效；前端有 Vite HMR 不用。經營者固定使用 `localhost:5302`。

7. **`src/data/mlitBuySnapshot.ts` 是自動產生的**，不要手改，改了會被下次排程覆蓋。

8. 真實日文図面的寫法比想像中髒：全形加號（`1SLDK＋WIC`）、和曆（`平成10年7月30日`）、`7階部分`、多站多徒步時間、總樓層混在構造欄位（`鉄筋コンクリート造21階建/地下1階`）。改解析邏輯後請務必用真實図面回歸測試，不要只用合成範例。

---

## 怎麼測

不需要起 server，直接呼叫 handler 最快：

```ts
import dotenv from "dotenv"; dotenv.config({ path: [".env.local", ".env"] });
import { readFileSync } from "fs";
import handler from "./api/analyze-listing";

const out: any = { code: 200 };
const res: any = {
  setHeader: () => {},
  status(c: number) { out.code = c; return res; },
  json(b: any) { out.body = b; return res; },
  end() { return res; },
};
await handler({
  method: "POST",
  headers: { "x-forwarded-for": "10.0." + Math.random() }, // 避開限流
  body: { files: [{ mimeType: "application/pdf", data: readFileSync(PDF_PATH).toString("base64") }] },
}, res);
console.log(out.body.saleAnalysis.mlitComparison);
```

用 `npx tsx` 執行。注意 `/api/analyze-listing` 有獨立限流（每 5 分鐘 3 次），測試時每次換一個 `x-forwarded-for` 即可。

驗證指令：`npm run lint`（＝`tsc --noEmit`）、`npm run test:requirement-verdict`、`npm run build`。

> 目前 `npx tsc --noEmit` 會報 `scratch/test_negative_cases.ts` 的既有錯誤，與上述工作無關，可忽略或順手清掉。
