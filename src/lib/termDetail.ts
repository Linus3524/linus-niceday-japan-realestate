export interface ParsedTermDetail {
  /** 圖紙上會看到的短代號，例如 W造、RC造、LDK 的 L。抽不出來時為 undefined。 */
  code?: string;
  /** 代號對應的中文／英文全名，例如「鋼筋混凝土結構」。 */
  label?: string;
  /** 冒號後的說明本文；沒有解析出代號時，這裡就是整條原文。 */
  body: string;
}

// 資料的既有格式有兩種方向：
//   「木造 (W造)：說明」→ 代號在括號裡
//   「L (Living room)：客廳」→ 代號在前，括號裡是全名
// 只有前段是短的半形代號時才視為第二種，其餘一律當第一種。
const PAREN_PATTERN = /^([^（(]+?)\s*[（(]([^）)]+)[）)]\s*[:：]\s*(.+)$/s;
// 沒有括號的「W：洗衣機放置處」。限制 4 字以內，避免把「定期借家契約：…」這種
// 完整詞當成代號，做出一整排長色塊。
const BARE_PATTERN = /^([^:：（(]{1,4})\s*[:：]\s*(.+)$/s;
const LATIN_CODE = /^[A-Za-z0-9/\s.x-]+$/;

export function parseTermDetail(detail: string): ParsedTermDetail {
  const withParen = detail.match(PAREN_PATTERN);
  if (withParen) {
    const [, head, paren, body] = withParen;
    const headIsCode = head.trim().length <= 4 && LATIN_CODE.test(head.trim());
    return headIsCode
      ? { code: head.trim(), label: paren.trim(), body: body.trim() }
      : { code: paren.trim(), label: head.trim(), body: body.trim() };
  }

  const bare = detail.match(BARE_PATTERN);
  if (bare) return { code: bare[1].trim(), body: bare[2].trim() };

  return { body: detail };
}

// 刻意採白名單而非自動判斷：這幾張卡的條列本來就是「代號 ↔ 全名」對照表，
// 拉成一欄才有掃描價值；其他卡片的條列是完整句子，自動套用只會變成一排色塊。
// 要擴充就把名稱加進來，解析邏輯不用動。
const CODE_TAG_TERMS = new Set([
  "間取り",
  "建築構造",
  "建物種別",
  "賃貸借契約",
  "ガスの種類",
  "インターネット対応・ネット無料",
  "テレビ端子（BS／CS／CATV）",
]);

export function usesCodeTags(termName: string): boolean {
  return CODE_TAG_TERMS.has(termName);
}
