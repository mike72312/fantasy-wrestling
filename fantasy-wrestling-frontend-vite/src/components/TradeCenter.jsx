import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import "./TradeCenter.css";

const TradeCenter = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestedWrestler = queryParams.get("requestedWrestler");

  const [availableWrestlers, setAvailableWrestlers] = useState([]);
  const [teamWrestlers, setTeamWrestlers] = useState([]);
  const [form, setForm] = useState({
    offeringTeam: localStorage.getItem("teamName") || '',
    receivingTeam: '',
    offeredWrestlers: [],
    requestedWrestlers: requestedWrestler ? [requestedWrestler] : []
  });
  const [status, setStatus] = useState('');
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchTrades();
    fetchAllWrestlers();
  }, []);

  useEffect(() => {
    if (form.offeringTeam) fetchTeamWrestlers(form.offeringTeam);
  }, [form.offeringTeam]);

  useEffect(() => {
    if (form.requestedWrestlers.length > 0) {
      autoDetectReceivingTeam(form.requestedWrestlers[0]);
    }
  }, [form.requestedWrestlers]);

  const fetchTrades = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/trades");
      setTrades(res.data);
    } catch (err) {
      console.error("Error fetching trades:", err);
    }
  };

  const fetchAllWrestlers = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/allWrestlers");
      setAvailableWrestlers(res.data);
    } catch (err) {
      console.error("Error fetching all wrestlers:", err);
    }
  };

  const fetchTeamWrestlers = async (teamName) => {
    try {
      const res = await axios.get(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`);
      setTeamWrestlers(res.data);
    } catch (err) {
      console.error("Error fetching team wrestlers:", err);
    }
  };

  const autoDetectReceivingTeam = async (wrestlerName) => {
    try {
      const res = await axios.get(`https://fantasy-wrestling-backend.onrender.com/api/wrestler/${encodeURIComponent(wrestlerName)}`);
      const teamId = res.data.team_id;
      if (!teamId) return;

      const teams = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/standings");
      const match = teams.data.find(t => t.id === teamId);
      if (match) {
        setForm(prev => ({ ...prev, receivingTeam: match.team_name }));
      }
    } catch (err) {
      console.error("Error detecting team for wrestler:", err);
    }
  };

  const handleMultiSelectChange = (e, key) => {
    const selected = Array.from(e.target.selectedOptions, o => o.value);
    setForm(prev => ({ ...prev, [key]: selected }));
  };

  const submitTrade = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://fantasy-wrestling-backend.onrender.com/api/proposeTrade", form);
      setStatus('✅ Trade proposed!');
      setForm({
        offeringTeam: localStorage.getItem("teamName") || '',
        receivingTeam: '',
        offeredWrestlers: [],
        requestedWrestlers: []
      });
      fetchTrades();
    } catch (err) {
      console.error("Trade proposal failed:", err);
      setStatus('❌ Trade proposal failed.');
    }
  };

  return (
    <div className="trade-center-container">
      <h2>Trade Center</h2>

      <form onSubmit={submitTrade} className="trade-form">
        <fieldset>
          <legend>Trade Details</legend>

          <label>Offering Team:</label>
          <input value={form.offeringTeam} readOnly />

          <label>Offered Wrestlers:</label>
          <select multiple value={form.offeredWrestlers} onChange={(e) => handleMultiSelectChange(e, "offeredWrestlers")}>
            {teamWrestlers.map(w => (
              <option key={w.wrestler_name} value={w.wrestler_name}>{w.wrestler_name}</option>
            ))}
          </select>

          <label>Requested Wrestlers:</label>
          <select multiple value={form.requestedWrestlers} onChange={(e) => handleMultiSelectChange(e, "requestedWrestlers")}>
            {availableWrestlers
              .filter(w => w.team_id !== null && w.team_id !== form.offeringTeam)
              .map(w => (
                <option key={w.wrestler_name} value={w.wrestler_name}>
                  {w.wrestler_name}
                </option>
              ))}
          </select>

          <label>Receiving Team:</label>
          <input value={form.receivingTeam} readOnly />

          <button type="submit">Propose Trade</button>
        </fieldset>
      </form>

      {status && <p className="trade-status">{status}</p>}

      <h3>Past Trades</h3>
      <table className="trade-history-table">
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
              <td>{Array.isArray(trade.offered_wrestlers) ? trade.offered_wrestlers.join(", ") : trade.offered_wrestler}</td>
              <td>{Array.isArray(trade.requested_wrestlers) ? trade.requested_wrestlers.join(", ") : trade.requested_wrestler}</td>
              <td>{trade.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeCenter;
