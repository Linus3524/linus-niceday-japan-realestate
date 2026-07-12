const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/budgetModifiers\[cur\]\.price/g, 'getModifierPrice(budgetModifiers[cur].price)');

fs.writeFileSync('src/App.tsx', content);
