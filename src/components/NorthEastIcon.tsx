/**
 * Material Symbols「north_east」右上箭頭。
 *
 * 為什麼不是用文字或圖示字型：
 * - 原本寫「↗」這個 Unicode 字元，iOS 會當成 emoji 上色渲染。
 * - 這顆箭頭也用在 innerHTML 注入的輪播卡片上，不能只提供 React 元件，
 *   所以同時輸出一份 SVG 原始字串。
 *
 * 路徑取自 Google 官方 Material Symbols Outlined（24px、wght 400），
 * 是填色圖形（不是線條描邊），因此用 fill="currentColor" 跟著文字顏色走。
 */
const NORTH_EAST_PATH = "m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z";

/** 給 innerHTML 用的原始 SVG 字串；尺寸用 1em，跟著所在文字的字級縮放 */
export const NORTH_EAST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" focusable="false" style="width:1em;height:1em;display:inline-block;vertical-align:-0.125em;flex-shrink:0"><path d="${NORTH_EAST_PATH}"/></svg>`;

export function NorthEastIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={NORTH_EAST_PATH} />
    </svg>
  );
}
