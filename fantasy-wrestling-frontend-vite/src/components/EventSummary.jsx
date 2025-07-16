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
    console.log("📡 Fetching event summary...");
    fetch("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Data received:", data);
        setEvents(data);
      })
      .catch((err) => console.error("❌ Error loading event summary:", err));
  }, []);

  const filtered = events.filter((e) =>
    e.wrestler_name.toLowerCase().includes(searchWrestler.toLowerCase()) &&
    e.event_name.toLowerCase().includes(searchEvent.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const { key, direction } = sortConfig;
    const aValue = a[key] ?? "";
    const bValue = b[key] ?? "";

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  return (
    <div className="container">
      <h2>Event Summary</h2>

      <input
        type="text"
        placeholder="Search by wrestler name..."
        value={searchWrestler}
        onChange={(e) => {
          setSearchWrestler(e.target.value);
          setCurrentPage(1);
        }}
        style={{ marginBottom: "0.5rem", padding: "0.5rem", width: "100%" }}
      />

      <input
        type="text"
        placeholder="Search by event name..."
        value={searchEvent}
        onChange={(e) => {
          setSearchEvent(e.target.value);
          setCurrentPage(1);
        }}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      {paginated.length === 0 ? (
        <p>No matching results.</p>
      ) : (
        <table className="wrestler-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("event_name")}>Event</th>
              <th onClick={() => handleSort("event_date")}>Date</th>
              <th onClick={() => handleSort("wrestler_name")}>Wrestler</th>
              <th onClick={() => handleSort("points")}>Points</th>
              <th onClick={() => handleSort("description")}>Description</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.event_name}</td>
                <td>{new Date(entry.event_date).toLocaleDateString()}</td>
                <td>{entry.wrestler_name}</td>
                <td>{entry.points}</td>
                <td>{entry.description?.trim() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                backgroundColor: pageNum === currentPage ? "#333" : "#eee",
                color: pageNum === currentPage ? "#fff" : "#000",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventSummary;