import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker for PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('App needs refresh');
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
