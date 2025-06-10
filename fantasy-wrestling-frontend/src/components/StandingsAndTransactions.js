import React, { useEffect, useState } from "react";

function StandingsAndTransactions() {
  const [standings, setStandings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Fetch standings
    fetch("https://wrestling-backend2.onrender.com/api/standings")
      .then((res) => res.json())
      .then(setStandings)
      .catch((err) => console.error("Error loading standings:", err));

    // Fetch transactions
    fetch("https://wrestling-backend2.onrender.com/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch((err) => console.error("Error loading transactions:", err));
  }, []);

  return (
    <div className="standings-transactions">
      <h2>League Standings</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr key={team.team_id}>
              <td>{index + 1}</td>
              <td>{team.team_id}</td>
              <td>{team.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "2rem" }}>Recent Transactions</h2>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>
            [{new Date(t.timestamp).toLocaleString()}]{" "}
            <strong>{t.team_name}</strong> {t.action} <strong>{t.wrestler_name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StandingsAndTransactions;