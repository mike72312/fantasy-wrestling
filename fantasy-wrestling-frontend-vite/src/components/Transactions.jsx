import React, { useEffect, useState } from "react";
import "./Transactions.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch((err) => console.error("Error loading transactions:", err));
  }, []);

  return (
    <div className="transactions-container">
      <h2>Transactions</h2>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Wrestler</th>
            <th>Team</th>
            <th>Action</th>
            <th>Timestamp</th>
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

export default Transactions;
