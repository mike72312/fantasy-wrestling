import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [events, setEvents] = useState([]);
  const [selectedWrestler, setSelectedWrestler] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "event_date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    axios.get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then(res => setEvents(res.data))
      .catch(err => console.error("Error loading event summary:", err));
  }, []);

  const wrestlerOptions = [...new Set(events.map(e => e.wrestler_name))].sort();
  const eventOptions = [...new Set(events.map(e => e.event_name))].sort();

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filtered = events.filter(e =>
    (selectedWrestler === "" || e.wrestler_name === selectedWrestler) &&
    (selectedEvent === "" || e.event_name === selectedEvent)
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

      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <select
          value={selectedWrestler}
          onChange={e => {
            setSelectedWrestler(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: "0.5rem", minWidth: "200px" }}
        >
          <option value="">All Wrestlers</option>
          {wrestlerOptions.map((wrestler, idx) => (
            <option key={idx} value={wrestler}>{wrestler}</option>
          ))}
        </select>

        <select
          value={selectedEvent}
          onChange={e => {
            setSelectedEvent(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: "0.5rem", minWidth: "200px" }}
        >
          <option value="">All Events</option>
          {eventOptions.map((event, idx) => (
            <option key={idx} value={event}>{event}</option>
          ))}
        </select>
      </div>

      <table className="styled-table">
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <style>{`
        .styled-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 1rem;
          text-align: left;
        }

        .styled-table th {
          background-color: #f4f4f4;
          cursor: pointer;
          padding: 0.6rem;
          border-bottom: 2px solid #ccc;
        }

        .styled-table td {
          padding: 0.6rem;
          border-bottom: 1px solid #eee;
        }

        .styled-table tr:hover {
          background-color: #f9f9f9;
        }

        .pagination {
          margin: 1rem 0;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .pagination button {
          padding: 0.4rem 0.8rem;
          border: 1px solid #ccc;
          background-color: white;
          cursor: pointer;
        }

        .pagination button.active {
          background-color: #007bff;
          color: white;
          font-weight: bold;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
      {pageNumbers.map(num => (
        <button
          key={num}
          className={currentPage === num ? "active" : ""}
          onClick={() => onPageChange(num)}
        >
          {num}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
    </div>
  );
};

export default EventSummary;