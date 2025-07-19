import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Transactions.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    axios
      .get("https://fantasy-wrestling-backend.onrender.com/api/transactions")
      .then((res) => setTransactions(res.data))
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

  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type.toLowerCase() === filterType);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
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

      <div className="transactions-filters">
        <label>
          Filter:
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="add">Add</option>
            <option value="drop">Drop</option>
            <option value="trade">Trade</option>
          </select>
        </label>
      </div>

      <table className="transactions-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("timestamp")}>Timestamp</th>
            <th onClick={() => handleSort("type")}>Type</th>
            <th onClick={() => handleSort("details")}>Details</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTransactions.map((transaction, index) => (
            <tr key={index}>
              <td>{new Date(transaction.timestamp).toLocaleString()}</td>
              <td>{transaction.type}</td>
              <td>{transaction.details}</td>
            </tr>
          ))}
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