import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initWindowStorage } from './storage';

// Initialize window.storage for failsafe system compatibility
initWindowStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
