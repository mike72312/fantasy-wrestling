import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const StandingsAndTransactions = () => {
  const [standings, setStandings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    axios
      .get("https://wrestling-backend2.onrender.com/api/standings")
      .then((response) => setStandings(response.data))
      .catch((error) => {
        console.error("Error fetching standings:", error);
        alert("Error loading standings.");
      });

    axios
      .get("https://wrestling-backend2.onrender.com/api/transactions")
      .then((response) => setTransactions(response.data))
      .catch((error) => {
        console.error("Error fetching transactions:", error);
        alert("Error loading transactions.");
      });
  }, []);

  return (
    <div className="container">
      <h2>Standings</h2>
      <table className="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr key={index}>
              <td>
                <Link to={`/roster/${team.team_name}`}>
                  {team.team_name}
                </Link>
              </td>
              <td>{team.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Recent Transactions</h2>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Wrestler</th>
            <th>Team</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td>{tx.wrestler_name}</td>
              <td>{tx.team_name}</td>
              <td>{tx.action}</td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsAndTransactions;