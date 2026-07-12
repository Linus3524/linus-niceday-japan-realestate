const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetCalc = `  const getSelectedDistrictData = () => {
    return tokyoRentRates.find(d => d.district === calcDistrict) || tokyoRentRates[5]; // Default to Shinjuku
  };

  const getCalculatedRent = () => {
    const dData = getSelectedDistrictData();
    const rateString = calcRoomType === "r1" ? dData.r1 : calcRoomType === "k1" ? dData.k1 : dData.ldk1;
    let rent = parseFloat(rateString) * 10000; // in Yen
    
    calcModifiers.forEach(idx => {
      const mod = budgetModifiers[idx];
      rent += getModifierPrice(mod.price);
    });

    return Math.max(rent, 20000); // Ensure rent doesn't go below 20,000 yen
  };`;

const replaceCalc = `  const getSelectedDistrictData = () => {
    return rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區") || rentRates[0];
  };

  const getDistrictScale = () => {
    const rate = getSelectedDistrictData();
    // Scale modifier prices based on the district's average 1K rent compared to overall avg ~9.0
    // Keep it between 0.5 and 1.5
    return Math.max(0.5, Math.min(1.5, parseFloat(rate.k1) / 9.0));
  };
  
  const getModifierPrice = (modPrice: number) => {
    const scale = getDistrictScale();
    // Round to nearest 1000
    return Math.round((modPrice * scale) / 1000) * 1000;
  };

  const getCalculatedRent = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    let rent = parseFloat(rateString) * 10000; // in Yen
    
    calcModifiers.forEach(idx => {
      const mod = budgetModifiers[idx];
      rent += getModifierPrice(mod.price);
    });

    return Math.max(rent, 20000); // Ensure rent doesn't go below 20,000 yen
  };`;

content = content.replace(targetCalc, replaceCalc);

// I need to find the `getModifierPrice` usages and replace them if I used them elsewhere or just let them bind to the function
fs.writeFileSync('src/App.tsx', content);
