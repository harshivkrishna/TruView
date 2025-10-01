import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportWebVitals } from './hooks/usePerformanceMonitor';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Report web vitals for performance monitoring
reportWebVitals();

// Register service worker for PWA support (production only)
registerServiceWorker();
