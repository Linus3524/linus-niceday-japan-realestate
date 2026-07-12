const fs = require('fs');
let content = fs.readFileSync('src/components/RentMap.tsx', 'utf8');

// Update roomType interface
content = content.replace(
  'roomType: "r1" | "k1" | "ldk1";',
  'roomType: "r1" | "k1" | "ldk1" | "ldk2";'
);
content = content.replace(
  'onSelectRoomType: (type: "r1" | "k1" | "ldk1") => void;',
  'onSelectRoomType: (type: "r1" | "k1" | "ldk1" | "ldk2") => void;'
);

// Add LDK2 to the map room types selector
const roomMapSelectorTarget = `{[
            { id: "r1", label: "1R" },
            { id: "k1", label: "1K" },
            { id: "ldk1", label: "1LDK" }
          ].map`;

const roomMapSelectorReplacement = `{[
            { id: "r1", label: "1R" },
            { id: "k1", label: "1K" },
            { id: "ldk1", label: "1LDK" },
            { id: "ldk2", label: "2LDK" }
          ].map`;

content = content.replace(roomMapSelectorTarget, roomMapSelectorReplacement);

// Check if there is 2025
content = content.replace(/2025/g, '2026');

fs.writeFileSync('src/components/RentMap.tsx', content);
