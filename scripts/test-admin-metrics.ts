import assert from "node:assert/strict";
import { monthRange, totalsFromEnvironmentAggregate } from "../api/vercel-analytics";
import { monthOptions, monthlyFeatureTotals } from "../src/components/UsageDashboard";
import { isTrackableAction } from "../src/lib/usageMetrics";

const septemberFirstJst = new Date("2026-08-31T15:30:00.000Z");
assert.deepEqual(monthOptions(septemberFirstJst), ["2026-09", "2026-08"]);

const august = monthRange("2026-08", septemberFirstJst);
const september = monthRange("2026-09", septemberFirstJst);

assert.equal(
  august.since,
  String(Date.parse("2026-07-31T15:00:00.000Z")),
  "8 月應從東京時間 8/1 00:00 開始",
);
assert.equal(
  august.until,
  String(Date.parse("2026-08-31T14:59:59.999Z")),
  "8 月應在東京時間 8/31 23:59:59.999 結束",
);
assert.equal(
  september.since,
  String(Date.parse("2026-08-31T15:00:00.000Z")),
  "9 月應從東京時間 9/1 00:00 開始",
);
assert.equal(september.until, String(septemberFirstJst.getTime()), "本月應查到現在");
assert.equal(Number(august.until) + 1, Number(september.since), "相鄰月份不可重疊或缺漏");
assert.equal(isTrackableAction("wechat-copy"), true, "複製 WeChat ID 應列入聯絡意圖");

assert.deepEqual(
  totalsFromEnvironmentAggregate({
    data: [{ environment: "production", visitors: 1, pageviews: 2 }],
  }),
  { visitors: 1, pageviews: 2 },
  "網站總計應使用保留東京時間邊界的 production aggregate",
);

assert.deepEqual(
  monthlyFeatureTotals({
    "01": { chat: 2, "rent-analysis": 1 },
    "02": { chat: 3 },
  }),
  { chat: 5, "rent-analysis": 1 },
);

console.log("admin metrics tests passed");
