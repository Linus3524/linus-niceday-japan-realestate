const fs = require('fs');

let content = fs.readFileSync('src/data/rentGuideData.ts', 'utf8');

content = content.replace(
`export interface RentRate {
  district: string;
  r1: string; // 1R Average Rent (in万円)
  k1: string; // 1K/1DK Average Rent (in万円)
  ldk1: string; // 1LDK/2K/2DK Average Rent (in万円)
}`,
`export interface RentRate {
  region: string;
  district: string;
  r1: string; // 1R Average Rent (in万円)
  k1: string; // 1K/1DK Average Rent (in万円)
  ldk1: string; // 1LDK/2K/2DK Average Rent (in万円)
  ldk2: string; // 2LDK Average Rent (in万円)
}`
);

content = content.replace(
`export interface BudgetModifier {
  text: string;
  price: number;
  type: "plus" | "minus";
  category: "equipment" | "building" | "location" | "subtraction" | "others";
}`,
`export interface BudgetModifier {
  text: string;
  price: number;
  type: "plus" | "minus";
  category: "equipment" | "building" | "location" | "subtraction" | "others";
  applicableLayouts?: string[];
}`
);

fs.writeFileSync('src/data/rentGuideData.ts', content);
