import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // 這幾個套件只在「上傳後才走到」的程式路徑被 import（分析走 @google/genai、
    // 匯出 PDF 走 @react-pdf/renderer、計數走 @upstash/redis）。Vite 的預先打包
    // 是「發現才做」的，所以首頁載入時不會處理它們，等到你按下分析、瀏覽器第一次
    // 動態載入時才觸發，Vite 打包完會送出 full-reload。
    //
    // 問題是：那個 reload 發生在 fetch 還在飛的時候。頁面一重載，request 被瀏覽器
    // 中止，前端 catch 到的就是原生的 TypeError: Failed to fetch——看起來像後端掛了，
    // 其實後端連請求都還沒收完。日誌裡的「optimized dependencies changed. reloading」
    // 就是現場證據。
    //
    // 在這裡預先宣告，啟動時就一次優化完，之後不會再有中途 reload。
    // 註：清掉 node_modules/.vite 後的「第一次」分析最容易中獎，因為快取是空的。
    optimizeDeps: {
      include: ['@google/genai', '@react-pdf/renderer', '@upstash/redis', '@vercel/analytics/react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
