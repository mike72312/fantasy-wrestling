import React, { useEffect, useState } from "react";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("https://wrestling-backend2.onrender.com/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        alert("Failed to load transaction history.");
      });
  }, []);

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString(); // Format to readable date/time
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Transaction History</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={thStyle}>Wrestler</th>
              <th style={thStyle}>Team</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{txn.wrestler_name}</td>
                <td style={tdStyle}>{txn.team_name}</td>
                <td style={tdStyle}>{txn.action}</td>
                <td style={tdStyle}>{formatTimestamp(txn.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

export default Transactions;