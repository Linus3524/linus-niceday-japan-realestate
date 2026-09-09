import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="應用程式載入遇到暫時性問題" fallbackMessage="系統已保護現有頁面狀態，請點擊下方按鈕重新載入。">
      <App />
    </ErrorBoundary>
    <Analytics />
  </StrictMode>,
);

