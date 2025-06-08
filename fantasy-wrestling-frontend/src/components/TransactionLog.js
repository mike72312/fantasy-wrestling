import React, { useEffect, useState } from "react";

const TransactionLog = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true); // For loading indicator

  useEffect(() => {
    fetch("https://your-backend-name.onrender.com/api/transactions")
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        console.log("Fetched transactions:", data);
        setTransactions(data);
      })
      .catch(err => {
        console.error("Error fetching transactions:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="transaction-log">
      <h2>Transaction History</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul>
          {transactions.map((t, idx) => (
            <li key={idx}>
              [{new Date(t.timestamp).toLocaleString()}] —
              <strong> {t.team_name}</strong> {t.action === 'add' ? 'added' : 'dropped'}
              <strong> {t.wrestler_name}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionLog;