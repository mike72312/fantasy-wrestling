import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import AvailableWrestlers from './components/AvailableWrestlers';
import Login from './components/Login';
import './App.css';

const App = () => {
  return (
    <Router>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/available-wrestlers" element={<AvailableWrestlers />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;