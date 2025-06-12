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

const App = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/available-wrestlers" element={<AvailableWrestlers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/standings" element={<StandingsAndTransactions />} />
        <Route path="/roster/:teamName" element={<TeamRoster />} />
        <Route path="/wrestler/:name" element={<WrestlerProfile />} />
        <Route path="/import-event" element={<EventForm />} />
      </Routes>
    </Router>
  );
};

export default App;