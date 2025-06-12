import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import AvailableWrestlers from './components/AvailableWrestlers';
import Login from './components/Login';
import Transactions from './components/Transactions';
import StandingsAndTransactions from './components/StandingsAndTransactions';
import TeamRoster from './components/TeamRoster';
import WrestlerProfile from './components/WrestlerProfile';
import EventHistory from './components/EventHistory';

const App = () => {
  return (
    <Router>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<StandingsAndTransactions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/available-wrestlers" element={<AvailableWrestlers />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/standings" element={<StandingsAndTransactions />} />
          <Route path="/roster/:teamName" element={<TeamRoster />} />
          <Route path="/wrestler/:wrestlerName" element={<WrestlerProfile />} />
          <Route path="/events" element={<EventHistory />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;