/**
 * 複製文字到剪貼簿。
 *
 * LINE、Instagram、Threads 的內建瀏覽器與部分手機瀏覽器會擋 navigator.clipboard，
 * 只用它的話按鈕會「按了沒反應」。擋掉時改用舊式的 textarea + execCommand("copy")；
 * 兩種都失敗就回傳 false，由畫面改成顯示文字讓使用者長按複製。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 往下改用舊方法 */
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.fontSize = "16px"; // 避免 iOS 聚焦時自動放大畫面
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
