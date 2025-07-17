import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "event_date", direction: "desc" });

  const [eventFilter, setEventFilter] = useState("");
  const [wrestlerFilter, setWrestlerFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    axios.get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then(res => setData(res.data))
      .catch(err => console.error("❌ Error loading event summary:", err));
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(row => {
    return (
      (!eventFilter || row.event_name === eventFilter) &&
      (!wrestlerFilter || row.wrestler_name === wrestlerFilter) &&
      (!descriptionFilter || row.description === descriptionFilter)
    );
  });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const unique = (field) => [...new Set(data.map(row => row[field]))];

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2>Event Summary</h2>

      {/* Filters */}
      <div className="filters" style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="">All Events</option>
          {unique("event_name").map(event => (
            <option key={event} value={event}>{event}</option>
          ))}
        </select>

        <select value={wrestlerFilter} onChange={(e) => setWrestlerFilter(e.target.value)}>
          <option value="">All Wrestlers</option>
          {unique("wrestler_name").map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select value={descriptionFilter} onChange={(e) => setDescriptionFilter(e.target.value)}>
          <option value="">All Descriptions</option>
          {unique("description").map(desc => (
            <option key={desc} value={desc}>{desc}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table className="event-summary-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["event_date", "event_name", "wrestler_name", "team_name", "points", "description"].map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{ cursor: "pointer", padding: "10px", textAlign: "left", background: "#f0f0f0", borderBottom: "2px solid #ccc" }}
                >
                  {col.replace("_", " ").toUpperCase()} {sortConfig.key === col ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.event_date}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.event_name}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.wrestler_name}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.team_name}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.points}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination" style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default EventSummary;