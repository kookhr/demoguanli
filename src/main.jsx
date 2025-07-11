import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 在生产环境中加载诊断工具
if (import.meta.env.PROD) {
  import('./utils/productionDiagnostic.js').then(({ runProductionDiagnostic }) => {
    console.log('生产环境诊断工具已加载，可在控制台运行 runDiagnostic() 进行诊断');
    // 自动运行一次诊断
    setTimeout(() => {
      runProductionDiagnostic();
    }, 2000);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
