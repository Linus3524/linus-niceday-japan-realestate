const fs = require('fs');

let content = fs.readFileSync('src/data/rentGuideData.ts', 'utf8');

const regexRates = /export const tokyoRentRates: RentRate\[\] = \[[\s\S]*?\];/;

const newRates = `export const rentRates: RentRate[] = [
  // 東京23區
  { region: "東京23區", district: "千代田區", r1: "11.8", k1: "12.2", ldk1: "21.0", ldk2: "35.0" },
  { region: "東京23區", district: "港區", r1: "12.5", k1: "12.8", ldk1: "24.5", ldk2: "40.0" },
  { region: "東京23區", district: "中央區", r1: "11.2", k1: "11.5", ldk1: "19.8", ldk2: "30.0" },
  { region: "東京23區", district: "澀谷區", r1: "11.5", k1: "12.0", ldk1: "22.5", ldk2: "36.0" },
  { region: "東京23區", district: "目黑區", r1: "9.8", k1: "11.0", ldk1: "18.5", ldk2: "26.0" },
  { region: "東京23區", district: "新宿區", r1: "9.2", k1: "10.8", ldk1: "18.0", ldk2: "28.0" },
  { region: "東京23區", district: "台東區", r1: "9.0", k1: "10.5", ldk1: "16.8", ldk2: "23.0" },
  { region: "東京23區", district: "江東區", r1: "8.9", k1: "9.8", ldk1: "15.0", ldk2: "21.0" },
  { region: "東京23區", district: "品川區", r1: "9.2", k1: "10.4", ldk1: "17.2", ldk2: "24.0" },
  { region: "東京23區", district: "文京區", r1: "8.9", k1: "10.2", ldk1: "17.5", ldk2: "24.0" },
  { region: "東京23區", district: "墨田區", r1: "8.8", k1: "9.6", ldk1: "15.5", ldk2: "20.0" },
  { region: "東京23區", district: "大田區", r1: "7.8", k1: "8.8", ldk1: "13.5", ldk2: "18.0" },
  { region: "東京23區", district: "世田谷區", r1: "8.1", k1: "9.5", ldk1: "15.8", ldk2: "21.0" },
  { region: "東京23區", district: "中野區", r1: "7.9", k1: "9.2", ldk1: "14.8", ldk2: "20.0" },
  { region: "東京23區", district: "豐島區", r1: "8.2", k1: "9.6", ldk1: "15.2", ldk2: "22.0" },
  { region: "東京23區", district: "北區", r1: "7.6", k1: "8.9", ldk1: "13.2", ldk2: "18.0" },
  { region: "東京23區", district: "荒川區", r1: "8.0", k1: "8.9", ldk1: "13.0", ldk2: "17.5" },
  { region: "東京23區", district: "杉並區", r1: "7.5", k1: "8.8", ldk1: "14.0", ldk2: "19.0" },
  { region: "東京23區", district: "板橋區", r1: "7.2", k1: "8.4", ldk1: "12.0", ldk2: "15.5" },
  { region: "東京23區", district: "練馬區", r1: "7.1", k1: "8.2", ldk1: "12.2", ldk2: "15.0" },
  { region: "東京23區", district: "足立區", r1: "7.2", k1: "8.0", ldk1: "10.5", ldk2: "13.5" },
  { region: "東京23區", district: "葛飾區", r1: "6.6", k1: "7.9", ldk1: "9.8", ldk2: "12.5" },
  { region: "東京23區", district: "江戶川區", r1: "6.8", k1: "7.8", ldk1: "10.2", ldk2: "13.0" },
  
  // 東京23區外 (熱門市)
  { region: "東京市部", district: "武藏野市", r1: "7.0", k1: "8.0", ldk1: "13.0", ldk2: "18.0" },
  { region: "東京市部", district: "三鷹市", r1: "6.5", k1: "7.5", ldk1: "12.0", ldk2: "16.0" },
  { region: "東京市部", district: "立川市", r1: "6.0", k1: "7.0", ldk1: "11.0", ldk2: "14.0" },
  { region: "東京市部", district: "町田市", r1: "5.5", k1: "6.5", ldk1: "10.0", ldk2: "13.0" },
  { region: "東京市部", district: "八王子市", r1: "5.0", k1: "5.8", ldk1: "9.0", ldk2: "11.0" },
  
  // 神奈川
  { region: "神奈川", district: "橫濱市", r1: "6.5", k1: "7.5", ldk1: "12.0", ldk2: "15.0" },
  { region: "神奈川", district: "川崎市", r1: "6.8", k1: "7.8", ldk1: "12.5", ldk2: "16.0" },
  { region: "神奈川", district: "相模原市", r1: "5.0", k1: "5.5", ldk1: "8.5", ldk2: "11.0" },
  
  // 埼玉
  { region: "埼玉", district: "埼玉市", r1: "6.0", k1: "7.0", ldk1: "11.0", ldk2: "14.0" },
  { region: "埼玉", district: "川口市", r1: "6.5", k1: "7.5", ldk1: "11.5", ldk2: "14.5" },
  { region: "埼玉", district: "川越市", r1: "5.5", k1: "6.0", ldk1: "9.0", ldk2: "11.0" },
  
  // 千葉
  { region: "千葉", district: "千葉市", r1: "5.5", k1: "6.5", ldk1: "10.0", ldk2: "12.5" },
  { region: "千葉", district: "船橋市", r1: "6.0", k1: "7.0", ldk1: "10.5", ldk2: "13.5" },
  { region: "千葉", district: "市川市", r1: "6.5", k1: "7.5", ldk1: "11.0", ldk2: "14.0" },
  { region: "千葉", district: "柏市", r1: "5.5", k1: "6.2", ldk1: "9.5", ldk2: "12.0" },
  
  // 大阪
  { region: "大阪", district: "大阪市", r1: "6.5", k1: "7.2", ldk1: "11.0", ldk2: "16.0" },
  { region: "大阪", district: "堺市", r1: "5.0", k1: "5.5", ldk1: "8.5", ldk2: "11.0" },
  { region: "大阪", district: "東大阪市", r1: "4.8", k1: "5.4", ldk1: "8.0", ldk2: "10.0" },
  { region: "大阪", district: "吹田市", r1: "5.5", k1: "6.2", ldk1: "9.5", ldk2: "12.5" },
  { region: "大阪", district: "豐中市", r1: "5.5", k1: "6.2", ldk1: "9.5", ldk2: "12.5" }
];`;

content = content.replace(regexRates, newRates);

const regexModifiers = /export const budgetModifiers: BudgetModifier\[\] = \[[\s\S]*?\];/;

const newModifiers = `export const budgetModifiers: BudgetModifier[] = [
  { text: "同時具備獨立洗面台與免治馬桶", price: 10000, type: "plus", category: "equipment" },
  { text: "僅有獨立洗面台 (無免治馬桶)", price: 3000, type: "plus", category: "equipment" },
  { text: "僅有免治馬桶 (無獨立洗面台)", price: 3000, type: "plus", category: "equipment" },
  
  { text: "1K房型 25平方米以上", price: 5000, type: "plus", category: "equipment", applicableLayouts: ["r1", "k1"] },
  { text: "1K房型 30平方米以上", price: 10000, type: "plus", category: "equipment", applicableLayouts: ["r1", "k1"] },
  
  { text: "1LDK房型 35平方米以上", price: 5000, type: "plus", category: "equipment", applicableLayouts: ["ldk1"] },
  { text: "1LDK房型 40平方米以上", price: 10000, type: "plus", category: "equipment", applicableLayouts: ["ldk1"] },
  
  { text: "2LDK房型 50平方米以上", price: 10000, type: "plus", category: "equipment", applicableLayouts: ["ldk2"] },
  { text: "2LDK房型 60平方米以上", price: 20000, type: "plus", category: "equipment", applicableLayouts: ["ldk2"] },
  
  { text: "附自動門電梯大樓", price: 5000, type: "plus", category: "building" },
  { text: "屋齡 5 年內新房", price: 10000, type: "plus", category: "building" },
  { text: "屋齡 5〜10 年內次新房", price: 5000, type: "plus", category: "building" },
  { text: "熱門大站 (2條線路以上)", price: 10000, type: "plus", category: "location" },
  { text: "熱門小站 (1條線路)", price: 5000, type: "plus", category: "location" },
  { text: "徒步車站 5 分鐘內", price: 5000, type: "plus", category: "location" },
  { text: "管理公司提供家具家電 (外國人向)", price: 20000, type: "plus", category: "others" },
  
  { text: "徒步車站 11〜15 分鐘", price: -5000, type: "minus", category: "subtraction" },
  { text: "徒步車站 15〜20 分鐘", price: -10000, type: "minus", category: "subtraction" },
  { text: "屋齡 30 年以上", price: -5000, type: "minus", category: "subtraction" },
  { text: "屋齡 40 年以上", price: -10000, type: "minus", category: "subtraction" },
  { text: "4 樓以上無電梯", price: -5000, type: "minus", category: "subtraction" },
  { text: "房間位於一樓", price: -3000, type: "minus", category: "subtraction" }
];`;

content = content.replace(regexModifiers, newModifiers);

fs.writeFileSync('src/data/rentGuideData.ts', content);
