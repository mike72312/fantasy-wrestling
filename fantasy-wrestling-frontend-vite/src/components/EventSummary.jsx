// src/components/EventSummary.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [grouped, setGrouped] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    console.log("📡 Fetching event summary...");
    fetch("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => res.json())
      .then(setEvents)
      .catch((err) => console.error("❌ Error loading event summary:", err));
  }, []);

  const filteredEvents = events.filter((entry) =>
    entry.wrestler_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Event Scoring Summary</h2>
      <input
        type="text"
        placeholder="Search by wrestler name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <table className="wrestler-table">
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