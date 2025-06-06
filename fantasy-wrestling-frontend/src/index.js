import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated import for React 18+
import App from './App'; // Import your App component

// Create a root element and render your app component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App /> {/* No need for BrowserRouter here */}
  </React.StrictMode>
);