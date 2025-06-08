import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import AvailableWrestlers from './components/AvailableWrestlers';
import Scoreboard from './components/Scoreboard';
import Login from './components/Login';
import TransactionLog from './components/TransactionLog';  // ✅ Import the new component
import './App.css';

const App = () => {
  return (
    <Router>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/available-wrestlers" element={<AvailableWrestlers />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/transactions" element={<TransactionLog />} />  {/* ✅ Add the new route */}
      </Routes>
    </Router>
  );
};

export default App;