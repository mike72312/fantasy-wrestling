// src/components/StandingsAndTransactions.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./StandingsAndTransactions.css";

const StandingsAndTransactions = () => {
  const [weeklyScores, setWeeklyScores] = useState([]);
  const [weeklyWins, setWeeklyWins] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [tradePage, setTradePage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axios.get("https://fantasy-wrestling-backend.onrender.com/api/weeklyScores")
      .then(res => setWeeklyScores(res.data))
      .catch(err => console.error("Error loading weekly scores:", err));

    axios.get("https://fantasy-wrestling-backend.onrender.com/api/weeklyWinTally")
      .then(res => setWeeklyWins(res.data))
      .catch(err => console.error("Error loading win tally:", err));

    axios.get("https://fantasy-wrestling-backend.onrender.com/api/transactions")
      .then(res => setTransactions(res.data))
      .catch(err => console.error("Error loading transactions:", err));

    axios.get("https://fantasy-wrestling-backend.onrender.com/api/trades")
      .then(res => setTrades(res.data))
      .catch(err => console.error("Error loading trades:", err));
  }, []);

  const allWeeks = [...new Set(weeklyScores.map(row => row.week_start))].sort();
  const allTeams = [...new Set(weeklyScores.map(row => row.team_name))];

  const scoresByTeam = {};
  weeklyScores.forEach(row => {
    if (!scoresByTeam[row.team_name]) scoresByTeam[row.team_name] = {};
    scoresByTeam[row.team_name][row.week_start] = row.total_points;
  });

  const winMap = {};
  weeklyWins.forEach(row => {
    winMap[row.team_name.toLowerCase()] = parseInt(row.weekly_wins);
  });

  const filteredTransactions = transactions.filter(tx =>
    (!filter || tx.action === filter) &&
    (!search || tx.wrestler_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedTx = filteredTransactions.slice((txPage - 1) * itemsPerPage, txPage * itemsPerPage);
  const paginatedTrades = trades.slice((tradePage - 1) * itemsPerPage, tradePage * itemsPerPage);

  const totalTxPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const totalTradePages = Math.ceil(trades.length / itemsPerPage);

  return (
    <div className="container">
      <h2>Standings (Weekly Wins)</h2>
      <div className="scroll-wrapper">
        <table className="weekly-standings-table">
          <thead>
            <tr>
              <th className="frozen-col">Team</th>
              <th className="frozen-col">Wins</th>
              {allWeeks.map((week, idx) => (
                <th key={idx}>
                  {(() => {
                    const start = new Date(week);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    return `${start.toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                  })} – ${end.toLocaleDateString(undefined, {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                   })}`;
                  })()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTeams.map((team, i) => (
              <tr key={i}>
                <td className="frozen-col"><Link to={`/roster/${team}`}>{team}</Link></td>
                <td className="frozen-col">{winMap[team.toLowerCase()] || 0}</td>
                {allWeeks.map((week, j) => {
                  const score = scoresByTeam[team]?.[week] ?? "";
                  const maxScore = Math.max(...allTeams.map(t => scoresByTeam[t]?.[week] ?? 0));
                  const isWinner = score === maxScore && score !== "";
                  return (
                    <td key={j} className={isWinner ? "highlight" : ""}>{score}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Transactions</h2>
      <div className="transactions-filter">
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
      </div>

      <table className="styled-table">
        <thead>
          <tr>
            <th>Wrestler</th>
            <th>Team</th>
            <th>Action</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTx.map((tx, idx) => (
            <tr key={idx}>
              <td>{tx.wrestler_name}</td>
              <td>{tx.team_name}</td>
              <td>{tx.action}</td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination currentPage={txPage} totalPages={totalTxPages} onPageChange={setTxPage} />

      <h2>Trades</h2>
      <table className="styled-table">
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
          {paginatedTrades.map((trade, idx) => (
            <tr key={idx}>
              <td>{trade.offering_team}</td>
              <td>{trade.receiving_team}</td>
              <td>{trade.offered_wrestler}</td>
              <td>{trade.requested_wrestler}</td>
              <td>{trade.status}</td>
              <td>{new Date(trade.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination currentPage={tradePage} totalPages={totalTradePages} onPageChange={setTradePage} />
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
      {pageNumbers.map(num => (
        <button
          key={num}
          className={currentPage === num ? "active" : ""}
          onClick={() => onPageChange(num)}
        >
          {num}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
    </div>
  );
};

export default StandingsAndTransactions;