import { buildRentRecommendations, type RentSearchCriteria } from "../src/lib/rentAnalysis";
import { buildAxisVerdicts, buildOverallVerdict } from "../src/lib/requirementVerdict";

const testCases: Array<{ title: string; criteria: RentSearchCriteria }> = [
  {
    title: "【真實測試 1】打工度假 + 海外跨國審查 + 新宿區 1K (8~12萬円)",
    criteria: {
      roomType: "k1",
      minBudget: 80000,
      maxBudget: 120000,
      budgetIncludesFees: true,
      district: "新宿區",
      districts: ["新宿區"],
      visaType: "打工度假簽證",
      applicationChannel: "overseas",
    }
  },
  {
    title: "【真實測試 2】留學簽證 + 海外跨國審查 + 豐島區 1R (7~10萬円)",
    criteria: {
      roomType: "r1",
      minBudget: 70000,
      maxBudget: 100000,
      budgetIncludesFees: true,
      district: "豐島區",
      districts: ["豐島區"],
      visaType: "留學簽證",
      applicationChannel: "overseas",
    }
  },
  {
    title: "【真實測試 3】工作簽證 + 日本境內審查 + 澀谷區 1K (10~14萬円)",
    criteria: {
      roomType: "k1",
      minBudget: 100000,
      maxBudget: 140000,
      budgetIncludesFees: true,
      district: "澀谷區",
      districts: ["澀谷區"],
      visaType: "技術・人文知識・國際業務（工作簽證）",
      applicationChannel: "domestic",
    }
  },
  {
    title: "【真實測試 4】日本籍 + 海外跨國審查 + 目黑區 1LDK (16~22萬円)",
    criteria: {
      roomType: "ldk1",
      minBudget: 160000,
      maxBudget: 220000,
      budgetIncludesFees: true,
      district: "目黑區",
      districts: ["目黑區"],
      visaType: "日本籍",
      applicationChannel: "overseas",
    }
  },
  {
    title: "【防呆測試 5】未選擇簽證 + 海外跨國審查",
    criteria: {
      roomType: "k1",
      minBudget: 80000,
      maxBudget: 120000,
      budgetIncludesFees: true,
      district: "中野區",
      districts: ["中野區"],
      visaType: null,
      applicationChannel: "overseas",
    }
  },
  {
    title: "【極限防呆測試 6】打工度假 + 海外跨國審查 + 超低預算港區 (4萬円 1LDK)",
    criteria: {
      roomType: "ldk1",
      minBudget: 30000,
      maxBudget: 40000,
      budgetIncludesFees: true,
      district: "港區",
      districts: ["港區"],
      visaType: "打工度假簽證",
      applicationChannel: "overseas",
    }
  }
];

console.log("===============================================================");
console.log("🚀 簽證與審查方式：全情境多維度實測結果輸出");
console.log("===============================================================\n");

for (const testCase of testCases) {
  const recommendations = buildRentRecommendations(testCase.criteria);
  const axes = buildAxisVerdicts(testCase.criteria, recommendations);
  const overall = buildOverallVerdict(axes);
  const visaAxis = axes.find(a => a.key === "visa");
  const budgetAxis = axes.find(a => a.key === "budget");

  console.log(`📌 ${testCase.title}`);
  console.log(`   綜合可行性評等：【${overall.level}】（${overall.headline}）`);
  if (overall.reasons.length > 0) {
    console.log(`   取捨與限制原因：${overall.reasons.join("；")}`);
  }
  if (visaAxis) {
    console.log(`   ▶ [在留與審查] 狀態: ${visaAxis.status} | 摘要: ${visaAxis.detail || "未指定"}`);
    console.log(`      說明: ${visaAxis.headline}`);
    console.log(`      關鍵門檻: ${visaAxis.drivers.join(" | ")}`);
    if (visaAxis.nextStep) {
      console.log(`      下一步建議: 💡 ${visaAxis.nextStep}`);
    }
    console.log(`      供給限制係數: ${visaAxis.supplyImpact}`);
  }
  if (budgetAxis) {
    console.log(`   ▶ [預算對標] 狀態: ${budgetAxis.status} | 估計區間: ${budgetAxis.detail || "N/A"}`);
  }
  console.log(`   ▶ 推薦車站數: ${recommendations.length} 個 (${recommendations.slice(0, 3).map(r => `${r.station}(約¥${(r.estimate / 10000).toFixed(1)}萬)`).join("、")})`);
  console.log("---------------------------------------------------------------\n");
}
