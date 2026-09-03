import assert from "node:assert/strict";
import { recommendThreadsForAnswer, sanitizeRelatedThreads, searchThreads } from "../src/lib/threadSearch";

const checkout = searchThreads("退房", { context: "rent", limit: 3 });
assert.equal(checkout.results.length, 3, "退房搜尋應顯示三篇高相關文章");
assert.deepEqual(
  new Set(checkout.results.map(result => result.id)),
  new Set(["DLj01-nyFbR", "Dcz1JlXAWOX", "DYwX2kyk97_"]),
  "退房搜尋前三篇應為退房注意事項、原狀恢復爭議與扣款專文",
);
assert.ok(checkout.total > checkout.results.length, "搜尋卡片應保留查看全部結果的總數");

const synonymCheckout = searchThreads("退租", { context: "rent", limit: 3 });
assert.ok(synonymCheckout.results.some(result => result.id === "DLj01-nyFbR"), "退租應能透過同義詞找到退房注意事項");
assert.ok(synonymCheckout.results.some(result => result.id === "DYwX2kyk97_"), "退租應優先找到標題直接命中的扣款專文");

const combined = searchThreads("退房 原狀回復", { context: "rent", limit: 3 });
assert.equal(combined.results[0]?.id, "Dcz1JlXAWOX", "多關鍵字搜尋應把兩個概念都在標題的文章排第一");

const buy = searchThreads("貸款", { context: "buy", limit: 10 });
assert.ok(buy.results.length > 0, "買房搜尋應能找到貸款文章");
assert.ok(buy.results.every(result => ["日本買房", "日本租屋買房生活知識系列"].includes(result.category)));

const aiCheckout = recommendThreadsForAnswer("退房時被扣清潔費合理嗎？", "請先確認契約與清潔費約定。", { limit: 2 });
assert.equal(aiCheckout[0]?.id, "DLj01-nyFbR", "AI 問句應辨識自然語句中的退房與清潔費概念");
assert.ok(aiCheckout.length <= 2, "AI 推薦最多兩篇");

const exactCheckoutQuestion = recommendThreadsForAnswer("日本租屋退房要注意什麼", "應確認解約預告與原狀回復。", { limit: 2 });
assert.deepEqual(
  exactCheckoutQuestion.map(result => result.id),
  ["DLj01-nyFbR", "DYwX2kyk97_"],
  "AI 顧問的退房常見問法應固定回傳兩篇核心文章",
);

const workingHoliday = recommendThreadsForAnswer("打工度假來日本租房要準備什麼？", "請先確認簽證與審查資料。", { limit: 2 });
assert.ok(workingHoliday.some(result => result.id === "DaJ5NIDkww9"), "AI 應辨識打工度假完整問句並推薦準備指南");
assert.equal(workingHoliday.find(result => result.id === "DaJ5NIDkww9")?.imageUrl, "/thread-images/DaJ5NIDkww9.jpg", "原 Threads 有圖時推薦卡應包含本機封面圖");

const roommate = recommendThreadsForAnswer("可以跟朋友一起合租公寓嗎？", "朋友合租要確認物件是否接受ルームシェア。", { limit: 2 });
assert.ok(roommate.some(result => ["DSR1VDDkjC1", "DauNyUnk2z5"].includes(result.id)), "AI 應推薦朋友合租限制的實務文章");

const internet = recommendThreadsForAnswer("免費網路的房子好嗎？", "免費網路可能是共享回線，請先確認速度。", { limit: 2 });
assert.equal(internet[0]?.id, "DXRInxEk55A", "AI 應找到租屋網路專文，不能被『房子』這種泛用詞帶偏");

const renewal = recommendThreadsForAnswer("更新租約要付多少錢？", "費用要依租約中的更新料約定。", { limit: 2 });
assert.equal(renewal[0]?.id, "DHxJwStynj7", "AI 應讓標題未寫更新料、但正文有完整解說的文章通過保守備援");

const foreignBuyer = recommendThreadsForAnswer("外國人買日本房需要簽證嗎？", "購屋與房貸的簽證條件不同。", { limit: 2 });
assert.ok(foreignBuyer.length > 0, "外國人買房簽證問題應有相關文章");
assert.ok(foreignBuyer.every(result => ["日本買房", "日本租屋買房生活知識系列"].includes(result.category)), "買房問題不可推薦租屋文章");

const negotiation = recommendThreadsForAnswer("日本買房可以殺價嗎？", "可用買付申込書提出議價，但幅度通常有限。", { limit: 2 });
assert.ok(negotiation.some(result => ["DBsKR0ITnxk", "DUpxf86Ek5I"].includes(result.id)), "AI 應辨識殺價、議價等自然問法");

const unavailableListings = recommendThreadsForAnswer("為什麼租屋網站上的房子看得到租不到？", "網站可能有過期物件或不接受外國人的房源。", { limit: 2 });
assert.deepEqual(
  unavailableListings.map(result => result.id),
  ["C8D8aOgvNlx", "DFNOWSzTnYg"],
  "AI 應直接辨識『看得到租不到』並推薦網站房源限制專文",
);

const advanceContract = recommendThreadsForAnswer("日本租屋的先行契約是什麼？", "先行契約通常是在尚未內見時完成簽約。", { limit: 2 });
assert.ok(advanceContract.some(result => ["C_mQriiTjHF", "DSUd9NVEj_-"].includes(result.id)), "AI 應辨識先行契約並推薦不內見簽約文章");

const termHandoff = recommendThreadsForAnswer(
  "想深入了解關於「先行契約」這個租屋名詞的內容與實務細節",
  "先行契約是在未內見時完成簽約。",
  { limit: 2 },
);
assert.ok(termHandoff.length > 0, "其他分頁用引號帶入的專有名詞應能直接搜尋 Threads 正文");

const rentBudgetHandoff = recommendThreadsForAnswer(
  "您好，我剛才使用租金預算計算器，地區：目黑區，格局：1K，推估月租：100,000 日圓，請分析找房難度。",
  "東京租金預算應依市場行情與格局評估。",
  { limit: 2 },
);
assert.ok(rentBudgetHandoff.length > 0, "租屋預算計算器帶入 AI 時應推薦相關文章");
assert.ok(rentBudgetHandoff.every(result => result.category !== "日本買房"), "租屋預算不可推薦買房文章");

const buyBudgetHandoff = recommendThreadsForAnswer(
  "您好，我剛才使用買房預算計算器，地區：世田谷區，物件總價：6000 萬日圓，預計貸款比例：70%，請分析買房可行性。",
  "需要評估房貸、自備款與初期費用。",
  { limit: 2 },
);
assert.ok(buyBudgetHandoff.length > 0, "買房預算計算器帶入 AI 時應推薦相關文章");
assert.ok(buyBudgetHandoff.every(result => ["日本買房", "日本租屋買房生活知識系列"].includes(result.category)), "買房預算只可推薦買房相關文章");

const unrelated = recommendThreadsForAnswer("日本有沒有推薦的美食？", "這與日本住宅無關。", { limit: 2 });
assert.deepEqual(unrelated, [], "離題問題不應推薦 Threads 文章");

assert.deepEqual(searchThreads("   ", { context: "rent" }), { results: [], total: 0 }, "空白搜尋不可誤回全部文章");
assert.doesNotThrow(() => searchThreads("退房 ".repeat(1_000), { context: "rent" }), "超長搜尋字串應安全截斷");

const validCard = exactCheckoutQuestion[0];
assert.ok(validCard, "測試前提：退房問題至少有一張有效卡片");
assert.deepEqual(
  sanitizeRelatedThreads([validCard, { ...validCard, id: "evil", url: "javascript:alert(1)" }, validCard], 2),
  [validCard],
  "前端只接受官方 Threads 網址，並移除重複文章",
);
assert.deepEqual(sanitizeRelatedThreads({ relatedThreads: [] }), [], "API 回傳非陣列時應安全忽略");

console.log("Threads search tests passed.");
