// src/components/TradeCenter.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const TradeCenter = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({
    offeringTeam: localStorage.getItem("teamName") || '',
    receivingTeam: '',
    offeredWrestler: '',
    requestedWrestler: queryParams.get("requestedWrestler") || ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/trades");
      setTrades(res.data);
    } catch (err) {
      console.error("Error fetching trades:", err);
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
        <input
          placeholder="Offering Team"
          value={form.offeringTeam}
          readOnly
        />
        <input
          placeholder="Receiving Team"
          value={form.receivingTeam}
          onChange={(e) => setForm({ ...form, receivingTeam: e.target.value })}
          required
        />
        <input
          placeholder="Offered Wrestler"
          value={form.offeredWrestler}
          onChange={(e) => setForm({ ...form, offeredWrestler: e.target.value })}
          required
        />
        <input
          placeholder="Requested Wrestler"
          value={form.requestedWrestler}
          onChange={(e) => setForm({ ...form, requestedWrestler: e.target.value })}
          required
        />
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