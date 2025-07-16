// src/components/EventSummary.jsx
import React, { useEffect, useState } from "react";

const EventSummary = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

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
    e.wrestler_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Event Summary</h2>
      <input
        type="text"
        placeholder="Search by wrestler name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />
      {filtered.length === 0 ? (
        <p>No matching results.</p>
      ) : (
        <table className="wrestler-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Wrestler</th>
              <th>Points</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.event_name}</td>
                <td>{new Date(entry.event_date).toLocaleDateString()}</td>
                <td>{entry.wrestler_name}</td>
                <td>{entry.points}</td>
                <td>{entry.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EventSummary;