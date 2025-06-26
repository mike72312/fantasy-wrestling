// src/components/TradeCenter.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const TradeCenter = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [trades, setTrades] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rosters, setRosters] = useState({});

  const [form, setForm] = useState({
    offeringTeam: localStorage.getItem("teamName") || '',
    receivingTeam: '',
    offeredWrestler: '',
    requestedWrestler: queryParams.get("requestedWrestler") || ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchTrades();
    fetchTeams();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/trades");
      setTrades(res.data);
    } catch (err) {
      console.error("Error fetching trades:", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/standings");
      const teamNames = res.data.map(t => t.team_name);
      setTeams(teamNames);

      // Fetch rosters for each team
      const rosterMap = {};
      for (const team of teamNames) {
        const rosterRes = await axios.get(`https://fantasy-wrestling-backend.onrender.com/api/roster/${team}`);
        rosterMap[team] = rosterRes.data.map(w => w.wrestler_name);
      }
      setRosters(rosterMap);
    } catch (err) {
      console.error("Error fetching team rosters:", err);
    }
  };

  const submitTrade = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://fantasy-wrestling-backend.onrender.com/api/proposeTrade", form);
      setStatus('✅ Trade proposed!');
      setForm({
        offeringTeam: localStorage.getItem("teamName") || '',
        receivingTeam: '',
        offeredWrestler: '',
        requestedWrestler: ''
      });
      fetchTrades();
    } catch (err) {
      console.error("Trade proposal failed:", err);
      setStatus('❌ Trade proposal failed.');
    }
  };

  return (
    <div className="container">
      <h2>Trade Center</h2>

      <form onSubmit={submitTrade} className="trade-form">
        <label>Your Team (Offering):</label>
        <input value={form.offeringTeam} readOnly />

        <label>Team You Want to Trade With:</label>
        <select
          value={form.receivingTeam}
          onChange={(e) => setForm({ ...form, receivingTeam: e.target.value, requestedWrestler: '' })}
          required
        >
          <option value="">Select a team</option>
          {teams.filter(t => t !== form.offeringTeam).map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>

        <label>Wrestler You're Offering:</label>
        <select
          value={form.offeredWrestler}
          onChange={(e) => setForm({ ...form, offeredWrestler: e.target.value })}
          required
        >
          <option value="">Select your wrestler</option>
          {(rosters[form.offeringTeam] || []).map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <label>Wrestler You Want:</label>
        <select
          value={form.requestedWrestler}
          onChange={(e) => setForm({ ...form, requestedWrestler: e.target.value })}
          required
        >
          <option value="">Select their wrestler</option>
          {(rosters[form.receivingTeam] || []).map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <button type="submit">Propose Trade</button>
      </form>

      {status && <p>{status}</p>}

      <h3>Past Trades</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Offered</th>
            <th>Requested</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr key={i}>
              <td>{new Date(trade.created_at).toLocaleString()}</td>
              <td>{trade.offering_team}</td>
              <td>{trade.receiving_team}</td>
              <td>{trade.offered_wrestler}</td>
              <td>{trade.requested_wrestler}</td>
              <td>{trade.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeCenter;