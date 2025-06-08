import React, { useEffect, useState } from "react";

const TransactionLog = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error("Error fetching transactions:", err));
  }, []);

  return (
    <div className="transaction-log">
      <h2>Transaction History</h2>
      <ul>
        {transactions.map((t, idx) => (
          <li key={idx}>
            [{new Date(t.timestamp).toLocaleString()}] — 
            <strong> {t.team_name}</strong> {t.action === 'add' ? 'added' : 'dropped'} 
            <strong> {t.wrestler_name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionLog;