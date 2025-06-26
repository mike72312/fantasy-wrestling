import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const StandingsAndTransactions = () => {
  const [standings, setStandings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [trades, setTrades] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Pagination
  const [txPage, setTxPage] = useState(1);
  const [tradePage, setTradePage] = useState(1);
  const itemsPerPage = 10;

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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStandings = [...standings].sort((a, b) => {
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredTransactions = transactions.filter(tx =>
    (!filter || tx.action === filter) &&
    (!search || tx.wrestler_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedTx = filteredTransactions.slice(
    (txPage - 1) * itemsPerPage,
    txPage * itemsPerPage
  );
  const paginatedTrades = trades.slice(
    (tradePage - 1) * itemsPerPage,
    tradePage * itemsPerPage
  );

  const totalTxPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const totalTradePages = Math.ceil(trades.length / itemsPerPage);

  return (
    <div className="container">
      <h2>Standings</h2>
      <table className="styled-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("team_name")}>Team</th>
            <th onClick={() => handleSort("score")}>Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map((team, idx) => (
            <tr key={idx}>
              <td><Link to={`/teamroster/${team.team_name}`}>{team.team_name}</Link></td>
              <td>{team.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Transactions</h2>
      <div style={{ margin: "10px 0" }}>
        <input
          type="text"
          placeholder="Search Wrestler"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: "1rem", padding: "0.4rem" }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "0.4rem" }}>
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

      <Pagination
        currentPage={txPage}
        totalPages={totalTxPages}
        onPageChange={setTxPage}
      />

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

      <Pagination
        currentPage={tradePage}
        totalPages={totalTradePages}
        onPageChange={setTradePage}
      />

      <style>{`
        .styled-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 1rem;
          text-align: left;
        }

        .styled-table th {
          background-color: #f4f4f4;
          cursor: pointer;
          padding: 0.6rem;
          border-bottom: 2px solid #ccc;
        }

        .styled-table td {
          padding: 0.6rem;
          border-bottom: 1px solid #eee;
        }

        .styled-table tr:hover {
          background-color: #f9f9f9;
        }

        .pagination {
          margin: 1rem 0;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .pagination button {
          padding: 0.4rem 0.8rem;
          border: 1px solid #ccc;
          background-color: white;
          cursor: pointer;
        }

        .pagination button.active {
          background-color: #007bff;
          color: white;
          font-weight: bold;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
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