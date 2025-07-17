import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [summary, setSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [filterEvent, setFilterEvent] = useState("");
  const [filterWrestler, setFilterWrestler] = useState("");
  const [filterDescription, setFilterDescription] = useState("");

  const itemsPerPage = 25;

  useEffect(() => {
    axios
      .get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("❌ Error loading event summary:", err));
  }, []);

  const sortedData = React.useMemo(() => {
    let sortable = [...summary];

    if (filterEvent) {
      sortable = sortable.filter(item => item.event_name === filterEvent);
    }
    if (filterWrestler) {
      sortable = sortable.filter(item => item.wrestler_name === filterWrestler);
    }
    if (filterDescription) {
      sortable = sortable.filter(item => item.description === filterDescription);
    }

    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sortable;
  }, [summary, sortConfig, filterEvent, filterWrestler, filterDescription]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueEvents = [...new Set(summary.map(s => s.event_name))];
  const uniqueWrestlers = [...new Set(summary.map(s => s.wrestler_name))];
  const uniqueDescriptions = [...new Set(summary.map(s => s.description))];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Event Summary</h2>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div>
          <label>Filter by Event:</label><br />
          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
            <option value="">All</option>
            {uniqueEvents.map((e, i) => <option key={i} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label>Filter by Wrestler:</label><br />
          <select value={filterWrestler} onChange={(e) => setFilterWrestler(e.target.value)}>
            <option value="">All</option>
            {uniqueWrestlers.map((w, i) => <option key={i} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label>Filter by Description:</label><br />
          <select value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)}>
            <option value="">All</option>
            {uniqueDescriptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th onClick={() => handleSort("event_name")}>Event Name</th>
            <th onClick={() => handleSort("event_date")}>Event Date</th>
            <th onClick={() => handleSort("wrestler_name")}>Wrestler</th>
            <th onClick={() => handleSort("team_name")}>Team</th>
            <th onClick={() => handleSort("points")}>Points</th>
            <th onClick={() => handleSort("description")}>Description</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((row, i) => (
            <tr key={i}>
              <td>{row.event_name}</td>
              <td>{formatDate(row.event_date)}</td>
              <td>{row.wrestler_name}</td>
              <td>{row.team_name || "Free Agent"}</td>
              <td>{row.points}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default EventSummary;