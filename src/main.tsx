import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';

// Vercel Web Analytics 負責流量面（瀏覽數、國家、裝置、來源、停留與跳出）。
// 業務事件（AI 顧問、AI 分析用了幾次）另外記在 Redis，見 src/lib/usageMetrics.ts：
// 那些發生在伺服器端，用前端事件會漏掉並且可被擋廣告的外掛擋掉。
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);
