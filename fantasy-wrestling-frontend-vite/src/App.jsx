// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import AvailableWrestlers from './components/AvailableWrestlers';
import Login from './components/Login';
import Transactions from './components/Transactions';
import StandingsAndTransactions from './components/StandingsAndTransactions';
import TeamRoster from './components/TeamRoster';
import WrestlerProfile from './components/WrestlerProfile';
import EventForm from './components/EventForm';
import TradeCenter from './components/TradeCenter'; // ✅ NEW
import TradeProposal from './components/TradeProposal'; // ✅ NEW
import TradeInbox from './components/TradeInbox'; // ✅ NEW
import EventSummary from "./components/EventSummary";

const App = () => {
  return (
    <Router>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/available-wrestlers" element={<AvailableWrestlers />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/standings" element={<StandingsAndTransactions />} />
          <Route path="/roster/:teamName" element={<TeamRoster />} />
          <Route path="/wrestler/:wrestlerName" element={<WrestlerProfile />} />
          <Route path="/import-event" element={<EventForm />} />
          <Route path="/trade-center" element={<TradeCenter />} /> {/* ✅ NEW */}
          <Route path="/trade/:opponentTeam/:requestedWrestler" element={<TradeProposal />} /> {/* ✅ NEW */}
          <Route path="/trade-inbox" element={<TradeInbox />} /> {/* ✅ NEW */}
          <Route path="/event-summary" element={<EventSummary />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;