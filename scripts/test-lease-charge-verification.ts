import assert from "node:assert/strict";
import { applyLeaseChargeVerification, type LeaseChargeFields } from "../api/analyze-listing";

/**
 * 租賃費用欄位二次確認的採納規則回歸測試。
 *
 * 二次確認（verifyLeaseCharges）針對敷金／礼金／更新料／保証会社費用四格，
 * 以窄問題重問一次 Gemini。這裡測的是「拿到回答之後要不要採用」的決策邏輯——
 * 模型輸出本身無法在單元測試中重現，但採納規則是純函式，而且每一條都對應
 * 一種實際看過的錯法，必須守住。
 *
 * 核心原則：不確定就沿用第一次結果。二次確認的職責是修正明確的誤讀，
 * 不是在沒把握時另外生出一個新的錯誤答案。
 */

const current: LeaseChargeFields = {
  deposit: "1ヶ月",
  keyMoney: "1ヶ月",
  renewalFee: "新賃料1ヶ月",
  guaranteeFee: "50%",
};

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "四格都讀到明確值時全部採用",
    run: () => {
      const result = applyLeaseChargeVerification(
        { deposit: "無", keyMoney: "無", renewalFee: "なし", guaranteeFee: "総賃料50%" },
        current,
      );
      assert.deepEqual(result, { deposit: "無", keyMoney: "無", renewalFee: "なし", guaranteeFee: "総賃料50%" });
    },
  },
  {
    name: "敷金／礼金讀到「新賃料」是抓到隔壁更新料格，沿用原值",
    run: () => {
      // アクアリガーレ西日暮里的實際錯法：礼金格被隔壁「更新料 1.5ヶ月(新賃料)」污染。
      const result = applyLeaseChargeVerification(
        { deposit: "1ヶ月", keyMoney: "1.5ヶ月(新賃料)", renewalFee: "", guaranteeFee: "" },
        current,
      );
      assert.equal(result.keyMoney, "1ヶ月", "串格值不得覆蓋原本的礼金");
    },
  },
  {
    name: "更新料含「新賃料」是正確值，不可套用串格過濾",
    run: () => {
      // 這是本次新增欄位最關鍵的一條：更新料的正確答案本來就長這樣，
      // 若沿用敷金礼金那套過濾會把正確答案丟掉。
      const result = applyLeaseChargeVerification(
        { deposit: "", keyMoney: "", renewalFee: "新賃料1ヶ月", guaranteeFee: "" },
        { ...current, renewalFee: "" },
      );
      assert.equal(result.renewalFee, "新賃料1ヶ月");
    },
  },
  {
    name: "更新料寫「1ヶ月(新賃料)」倒裝也照樣採用",
    run: () => {
      const result = applyLeaseChargeVerification(
        { renewalFee: "1ヶ月(新賃料)" },
        { ...current, renewalFee: "" },
      );
      assert.equal(result.renewalFee, "1ヶ月(新賃料)");
    },
  },
  {
    name: "更新料讀到敷金／礼金等其他費用標籤時不採用",
    run: () => {
      // 更新料原本用 pickRaw（只擋空字串），敷金那格的值被錯填進來時毫無防線。
      // 敷金礼金側有 /新賃料|更新/ 擋反向串格，這裡是補上正向的那一半。
      for (const polluted of ["敷金1ヶ月", "礼金2ヶ月", "保証金20万円", "敷引1ヶ月", "償却1ヶ月"]) {
        const result = applyLeaseChargeVerification({ renewalFee: polluted }, current);
        assert.equal(result.renewalFee, "新賃料1ヶ月", `${polluted} 不得覆蓋更新料`);
      }
    },
  },
  {
    name: "更新料與保証料同為百分比且完全相同時不採用",
    run: () => {
      // 更新料慣例以月數或金額計；與保証料一字不差的比例值幾乎必然是串格。
      const result = applyLeaseChargeVerification(
        { renewalFee: "総賃料50%", guaranteeFee: "総賃料50%" },
        current,
      );
      assert.equal(result.renewalFee, "新賃料1ヶ月", "保証料的比例不得污染更新料");
      assert.equal(result.guaranteeFee, "総賃料50%", "保証料自己那格仍應正常採用");
    },
  },
  {
    name: "敷1・礼1・更新1 同值不得被誤判為串格",
    run: () => {
      // 這是日本賃貸最常見的組合之一。若用「值與敷金相同就當串格」的作法，
      // 會把大量正確資料誤殺，因此防線刻意只看標籤而不看值是否重複。
      const result = applyLeaseChargeVerification(
        { deposit: "1ヶ月", keyMoney: "1ヶ月", renewalFee: "1ヶ月", guaranteeFee: "50%" },
        { ...current, renewalFee: "" },
      );
      assert.equal(result.renewalFee, "1ヶ月", "與敷金礼金同值的正當更新料必須採用");
    },
  },
  {
    name: "更新料自帶「更新」字樣一律採用",
    run: () => {
      for (const value of ["更新料1ヶ月", "更新時 新賃料1ヶ月", "更新事務手数料11,000円"]) {
        const result = applyLeaseChargeVerification({ renewalFee: value }, { ...current, renewalFee: "" });
        assert.equal(result.renewalFee, value);
      }
    },
  },
  {
    name: "定期借家的「再契約料」視為更新料本身的內容",
    run: () => {
      // 定期借家の図面は「更新料」ではなく「再契約料」と印字される
      // （XEBEC大手町201 など）。「更新」の二文字が無いため、放行規則に
      // 入れておかないと下の他項目ラベル検査に落ちる。
      for (const value of ["再契約料 新賃料の1ヶ月", "再契約手数料55,000円", "再契約料（礼金1ヶ月相当）"]) {
        const result = applyLeaseChargeVerification({ renewalFee: value }, { ...current, renewalFee: "" });
        assert.equal(result.renewalFee, value, `${value} 應被採用`);
      }
    },
  },
  {
    name: "保証料只有公司名稱沒有數字時不採用",
    run: () => {
      // 「GTN」是保證公司名，不是費用。填進去會讓初期費用試算多一筆算不出來的項目。
      const result = applyLeaseChargeVerification(
        { guaranteeFee: "GTN" },
        { ...current, guaranteeFee: "50%" },
      );
      assert.equal(result.guaranteeFee, "50%", "公司名稱不得當成費用覆蓋原值");
    },
  },
  {
    name: "保証料含公司名與比例時採用",
    run: () => {
      const result = applyLeaseChargeVerification({ guaranteeFee: "GTN100%" }, current);
      assert.equal(result.guaranteeFee, "GTN100%");
    },
  },
  {
    name: "保証料外国人プラン比例照原文採用",
    run: () => {
      const result = applyLeaseChargeVerification({ guaranteeFee: "外国人プラン80%" }, current);
      assert.equal(result.guaranteeFee, "外国人プラン80%");
    },
  },
  {
    name: "保証料免收的「なし」要採用，不可當成無數字而丟棄",
    run: () => {
      // 免收與未記載必須能區分：前者是確定不用付，後者是待確認。
      const result = applyLeaseChargeVerification(
        { guaranteeFee: "なし" },
        { ...current, guaranteeFee: "50%" },
      );
      assert.equal(result.guaranteeFee, "なし");
    },
  },
  {
    name: "全部回空字串時四格都沿用原值",
    run: () => {
      const result = applyLeaseChargeVerification(
        { deposit: "", keyMoney: "", renewalFee: "", guaranteeFee: "" },
        current,
      );
      assert.deepEqual(result, current);
    },
  },
  {
    name: "回傳非物件或缺欄位時不炸，一律沿用原值",
    run: () => {
      assert.deepEqual(applyLeaseChargeVerification(null, current), current);
      assert.deepEqual(applyLeaseChargeVerification({}, current), current);
      assert.deepEqual(applyLeaseChargeVerification({ deposit: 123 }, current), current);
    },
  },
  {
    name: "前後空白一律修掉",
    run: () => {
      const result = applyLeaseChargeVerification(
        { deposit: "  無  ", renewalFee: "  なし  ", guaranteeFee: "  50%  " },
        current,
      );
      assert.equal(result.deposit, "無");
      assert.equal(result.renewalFee, "なし");
      assert.equal(result.guaranteeFee, "50%");
    },
  },
  {
    name: "全形數字的保証料視為有效費用",
    run: () => {
      const result = applyLeaseChargeVerification(
        { guaranteeFee: "５０％" },
        { ...current, guaranteeFee: "" },
      );
      assert.equal(result.guaranteeFee, "５０％");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
  } catch (error) {
    failed++;
    console.error(`✗ ${test.name}\n  ${error instanceof Error ? error.message : error}`);
  }
}
if (failed) {
  console.error(`test-lease-charge-verification: ${failed}/${tests.length} 項失敗`);
  process.exit(1);
}
console.log(`test-lease-charge-verification: ${tests.length} 項全部通過（敷金／礼金串格、更新料新賃料、保証料公司名與外国人プラン）`);
