import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './App.css';

// ✅ Global error handler for runtime JS errors
window.addEventListener("error", (e) => {
  console.error("🌐 Global JS Error:", e.message, e.filename, `Line: ${e.lineno}`);
});

// ✅ Global error handler for unhandled promise rejections (e.g. failed fetch)
window.addEventListener("unhandledrejection", (e) => {
  console.error("💥 Unhandled Promise Rejection:", e.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);