const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<span>2025 東京 23 區租金行情 ╳ 條件增減估算</span>',
  '<span>2026 關東/關西地區 行情估算 ╳ 條件增減 (SUUMO/HOME\'S 最新行情)</span>'
);

fs.writeFileSync('src/App.tsx', content);
