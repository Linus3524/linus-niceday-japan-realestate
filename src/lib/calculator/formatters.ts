export const formatManYenNumber = (value: number, maximumFractionDigits = 1) =>
  (value / 10000).toLocaleString("zh-TW", { maximumFractionDigits });

export const formatManYen = (value: number, maximumFractionDigits = 1) =>
  `${formatManYenNumber(value, maximumFractionDigits)} 萬円`;
