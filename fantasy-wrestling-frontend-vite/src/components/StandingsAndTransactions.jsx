import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const StandingsAndTransactions = () => {
  const [standings, setStandings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    axios.get("https://wrestling-backend2.onrender.com/api/standings")
      .then(res => setStandings(res.data))
      .catch(err => console.error("Error loading standings:", err));

    axios.get("https://wrestling-backend2.onrender.com/api/transactions")
      .then(res => setTransactions(res.data))
      .catch(err => console.error("Error loading transactions:", err));

    axios.get("https://wrestling-backend2.onrender.com/api/trades")
      .then(res => setTrades(res.data))
      .catch(err => console.error("Error loading trades:", err));
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    return (!filter || tx.action === filter) &&
           (!search || tx.wrestler_name.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="container">
      <h2>Standings</h2>
      <ul>
        {standings.map((team, idx) => (
          <li key={idx}>
            <Link to={`/roster/${team.team_name}`}>{team.team_name}</Link> — {team.score} pts
          </li>
        ))}
      </ul>

      <h2>Transactions</h2>
      <input
        type="text"
        placeholder="Search Wrestler"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">All Types</option>
        <option value="add">Add</option>
        <option value="drop">Drop</option>
      </select>
      <table>
        <thead>
          <tr>
            <th>Wrestler</th>
            <th>Team</th>
            <th>Action</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((tx, idx) => (
            <tr key={idx}>
              <td>{tx.wrestler_name}</td>
              <td>{tx.team_name}</td>
              <td>{tx.action}</td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Trades</h2>
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Offered</th>
            <th>Requested</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => (
            <tr key={idx}>
              <td>{trade.from_team}</td>
              <td>{trade.to_team}</td>
              <td>{trade.offered_wrestler}</td>
              <td>{trade.requested_wrestler}</td>
              <td>{trade.status}</td>
              <td>{new Date(trade.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsAndTransactions;
