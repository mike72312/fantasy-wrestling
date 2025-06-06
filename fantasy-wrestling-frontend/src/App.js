import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';  // Import the NavBar component
import Home from './components/Home';  // Home page component
import AvailableWrestlers from './components/AvailableWrestlers';  // Available Wrestlers page
import Scoreboard from './components/Scoreboard';  // Scoreboard page
import Login from './components/Login';  // Login page component
import './App.css';  // Import global styles from App.css

const App = () => {
  return (
    <Router>
      {/* NavBar renders on all pages */}
      <NavBar /> 

      {/* Set up routing with the Routes component */}
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home page route */}
        <Route path="/available-wrestlers" element={<AvailableWrestlers />} />  {/* Available Wrestlers page */}
        <Route path="/scoreboard" element={<Scoreboard />} />  {/* Scoreboard page */}
        <Route path="/login" element={<Login />} />  {/* Login page route */}
      </Routes>
    </Router>
  );
};

export default App;