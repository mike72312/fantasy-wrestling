// src/components/EventSummary.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

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
      .then(setEvents)
      .catch((err) => console.error("❌ Error loading event summary:", err));
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
          onChange={e => {
            setSearchWrestler(e.target.value);
            setCurrentPage(1);
          }}
          style={{ marginRight: "1rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Search Event"
          value={searchEvent}
          onChange={e => {
            setSearchEvent(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: "0.5rem" }}
        />
      </div>

      <table className="styled-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Wrestler</th>
            <th>Team</th>
            <th>Points</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((entry, idx) => (
            <tr key={idx}>
              <td>{new Date(entry.event_date).toLocaleDateString()}</td>
              <td>{entry.event_name}</td>
              <td>{entry.wrestler_name}</td>
              <td>{entry.team_name ?? "Free Agent"}</td>
              <td>{entry.points}</td>
              <td>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventSummary;