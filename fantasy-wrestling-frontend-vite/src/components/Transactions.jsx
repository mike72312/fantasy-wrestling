import React, { useEffect, useState } from "react";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error("❌ Error fetching transactions:", err));
  }, []);

  return (
    <div className="container">
      <h2>Recent Transactions</h2>
      <ul>
        {transactions.map((t, idx) => (
          <li key={idx}>
            {t.timestamp.split("T")[0]} — {t.team_name} {t.action}ed{" "}
            {t.wrestler_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Transactions;