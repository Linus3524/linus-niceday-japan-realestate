// 章節與子主題分頁的編號用羅馬數字（I、II、III⋯），避免整頁都是 01、02 這類阿拉伯數字。
const NUMERALS: Array<[number, string]> = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

export function toRoman(n: number): string {
  let out = "";
  for (const [value, symbol] of NUMERALS) {
    while (n >= value) { out += symbol; n -= value; }
  }
  return out;
}
