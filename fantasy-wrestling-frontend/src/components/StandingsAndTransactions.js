import React, { useEffect, useState } from "react";

const StandingsAndTransactions = () => {
  const [standings, setStandings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Fetch team standings
    fetch("https://wrestling-backend2.onrender.com/api/standings")
      .then((res) => res.json())
      .then((data) => setStandings(data))
      .catch((err) => console.error("❌ Failed to fetch standings", err));

    // Fetch transactions
    fetch("https://wrestling-backend2.onrender.com/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error("❌ Failed to fetch transactions", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Team Standings</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Rank</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Team Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr key={team.team_name}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{index + 1}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{team.team_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{team.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Recent Transactions</h2>
<ul style={{ listStyleType: "none", padding: 0 }}>
  {transactions.map((txn, idx) => (
    <li
      key={idx}
      style={{
        marginBottom: "12px",
        padding: "10px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <strong>{new Date(txn.timestamp).toLocaleString()}</strong> —{" "}
      <strong>{txn.team_name}</strong> {txn.action} <strong>{txn.wrestler_name}</strong>
    </li>
  ))}
</ul>

export default StandingsAndTransactions;