const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const [calcModifiers, setCalcModifiers] = useState<number[]>([]); // Selected index array from budgetModifiers`;
const replacement = `const [calcModifiers, setCalcModifiers] = useState<number[]>([]); // Selected index array from budgetModifiers

  React.useEffect(() => {
    setCalcModifiers(prev => prev.filter(idx => {
      const mod = budgetModifiers[idx];
      return !mod.applicableLayouts || mod.applicableLayouts.includes(calcRoomType);
    }));
  }, [calcRoomType, budgetModifiers]);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
