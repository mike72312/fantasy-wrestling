import React, { useEffect, useState } from "react";
import "./Transactions.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch((err) => console.error("Error loading transactions:", err));
  }, []);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="transactions-container">
      <h2>Transactions</h2>
      <table className="transactions-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("wrestler_name")}>Wrestler</th>
            <th onClick={() => handleSort("team_name")}>Team</th>
            <th onClick={() => handleSort("action")}>Action</th>
            <th onClick={() => handleSort("timestamp")}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(paginatedTransactions) && paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((tx, index) => (
              <tr key={index}>
                <td>{tx.wrestler_name}</td>
                <td>{tx.team_name}</td>
                <td>{tx.action}</td>
                <td>{new Date(tx.timestamp).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="transactions-pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Transactions;