import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './components/NavBar';

const App = () => {
  return (
    <BrowserRouter>
      <NavBar />
      <h2>Test Render OK</h2>
    </BrowserRouter>
  );
};

export default App;