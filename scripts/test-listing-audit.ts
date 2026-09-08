import assert from "node:assert/strict";
import { buildListingAudit, type AuditFields } from "../src/lib/listingAudit.js";

const rent: AuditFields = { rent: "179,000円", managementFee: "20,000円", area: "31.27㎡", deposit: "0ヶ月", keyMoney: "0ヶ月", address: "東京都文京区", station: "後楽園", walkTime: "8", rentalConditions: "普通賃貸借1年契約", insuranceFee: "別途費用" };
const sale: AuditFields = { propertyType: "区分マンション", salePrice: "3,680万円", buildingArea: "66.30㎡", landRights: "所有権", station: "川口", walkTime: "14", address: "埼玉県川口市", managementFee: "13,090円", repairReserve: "19,990円" };
assert.equal(buildListingAudit(rent, "rent").blocksComparison, false);
assert.equal(buildListingAudit({ ...rent, managementFee: "" }, "rent").blocksComparison, true);
assert.equal(buildListingAudit({ ...rent, managementFee: "0円" }, "rent").blocksComparison, false);
assert.equal(buildListingAudit({ ...rent, rent: "" }, "rent").blocksComparison, true);
assert.equal(buildListingAudit({ ...rent, area: "" }, "rent").blocksComparison, true);
assert.ok(buildListingAudit(rent, "rent").issues.some(i => i.code === "amount-insuranceFee"));
assert.equal(buildListingAudit(sale, "sale").blocksComparison, false);
assert.ok(buildListingAudit({ ...sale, buildingArea: "192.78㎡(約59.31坪)" }, "sale").issues.some(i => i.code === "buildingArea-unit-conflict"));
assert.equal(buildListingAudit({ ...sale, buildingArea: "66.30㎡(約20.06坪)" }, "sale").blocksComparison, false);
assert.equal(buildListingAudit({ ...sale, propertyType: "", buildingName: "" }, "sale").blocksComparison, true);
assert.ok(buildListingAudit({ ...sale, buildingArea: "合計70㎡ 1階40㎡ 2階40㎡" }, "sale").issues.some(i => i.code === "floor-area-conflict"));
assert.equal(buildListingAudit({ ...sale, buildingArea: "合計103.5㎡ 1階37.26㎡ 2階37.26㎡ 3階28.98㎡" }, "sale").blocksComparison, false);
assert.equal(buildListingAudit({ ...sale, buildingArea: "合計200㎡ 1階40㎡ 2階40㎡" }, "sale").blocksComparison, false, "部分樓層不可誤判矛盾");
assert.ok(buildListingAudit({ ...sale, handoverDetails: "更地渡し 古屋付・現況渡し" }, "sale").issues.some(i => i.code === "handover-conflict"));
assert.ok(buildListingAudit({ ...sale, salePrice: "8180万円", priceDetails: "旧価格8180万円 新価格6980万円" }, "sale").blocksComparison);
const corrected = buildListingAudit({ ...sale, salePrice: "69800000円", sourceValues: { salePrice: "8180万円" }, priceDetails: "新価格6980万円" }, "sale");
assert.equal(corrected.entries.find(e => e.key === "salePrice")?.status, "calculated");
assert.equal(corrected.entries.find(e => e.key === "salePrice")?.source, "8180万円");
assert.equal(buildListingAudit({ ...sale, fixedAssetTax: 100000 }, "sale").entries.find(e => e.key === "fixedAssetTax")?.status, "estimated");
assert.ok(buildListingAudit({ ...sale, annualIncome: "100万円", grossYield: "10%" }, "sale").issues.some(i => i.code === "yield-conflict"));
assert.ok(buildListingAudit({ ...sale, hospitalityDetails: "民泊申請中 許可取得済" }, "sale").issues.some(i => i.code === "permit-conflict"));
for (const variant of ["合計７０㎡ １階４０㎡ ２階４０㎡", "合計70m² 1F:40m² 2F:40m²"]) {
  assert.ok(buildListingAudit({ ...sale, buildingArea: variant }, "sale").issues.some(i => i.code === "floor-area-conflict"));
}
console.log("Listing audit: provenance, missing/zero, conflicts, full-width units and safe comparison gates passed.");
