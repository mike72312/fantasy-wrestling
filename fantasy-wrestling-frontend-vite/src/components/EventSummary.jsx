// src/components/EventSummary.jsx
// src/components/EventSummary.jsx
import React, { useEffect, useState } from "react";

const EventSummary = () => {
  const [events, setEvents] = useState([]);
  const [searchWrestler, setSearchWrestler] = useState("");
  const [searchEvent, setSearchEvent] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "event_date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
        else setEvents([]);
      })
      .catch(err => {
        console.error("❌ Error loading event summary:", err);
        setEvents([]);
      });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const filtered = events.filter(e =>
    e.wrestler_name.toLowerCase().includes(searchWrestler.toLowerCase()) &&
    e.event_name.toLowerCase().includes(searchEvent.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container">
      <h2>Event Summary</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search Wrestler"
          value={searchWrestler}
          onChange={(e) => {
            setSearchWrestler(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Search Event"
          value={searchEvent}
          onChange={(e) => {
            setSearchEvent(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: "0.5rem" }}
        />
      </div>

      <table className="styled-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th onClick={() => handleSort("event_date")} style={{ cursor: "pointer" }}>
              Date {getSortIndicator("event_date")}
            </th>
            <th onClick={() => handleSort("event_name")} style={{ cursor: "pointer" }}>
              Event {getSortIndicator("event_name")}
            </th>
            <th onClick={() => handleSort("wrestler_name")} style={{ cursor: "pointer" }}>
              Wrestler {getSortIndicator("wrestler_name")}
            </th>
            <th onClick={() => handleSort("team_name")} style={{ cursor: "pointer" }}>
              Team {getSortIndicator("team_name")}
            </th>
            <th onClick={() => handleSort("points")} style={{ cursor: "pointer" }}>
              Points {getSortIndicator("points")}
            </th>
            <th onClick={() => handleSort("description")} style={{ cursor: "pointer" }}>
              Description {getSortIndicator("description")}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((entry, idx) => (
            <tr key={idx}>
              <td>{new Date(entry.event_date).toLocaleDateString()}</td>
              <td>{entry.event_name}</td>
              <td>{entry.wrestler_name}</td>
              <td>{entry.team_name ?? "Free Agent"}</td>
              <td>{entry.points}</td>
              <td>{entry.description || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ marginTop: "1rem" }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                margin: "0 0.25rem",
                padding: "0.5rem",
                backgroundColor: currentPage === i + 1 ? "#333" : "#eee",
                color: currentPage === i + 1 ? "#fff" : "#000"
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventSummary;