import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './App.css';

// ✅ Global error handler for runtime JS errors
window.addEventListener("error", (e) => {
  console.error("🌐 Global JS Error:", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error
  });
});

// ✅ Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  console.error("💥 Unhandled Promise Rejection:", {
    reason: e.reason,
    stack: e.reason?.stack,
    message: e.reason?.message
  });
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);