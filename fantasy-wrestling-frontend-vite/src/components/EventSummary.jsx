import React, { useEffect, useState } from "react";

const EventSummary = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Loaded event summary:", data);
        setEvents(data);
      })
      .catch((err) => {
        console.error("❌ Error loading event summary:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) =>
    (e.wrestler_name || "").toLowerCase().includes(search.toLowerCase())
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

      {loading ? (
        <p>Loading event data...</p>
      ) : filtered.length === 0 ? (
        <p>No matching results.</p>
      ) : (
        <table className="wrestler-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid black" }}>Event</th>
              <th style={{ borderBottom: "1px solid black" }}>Date</th>
              <th style={{ borderBottom: "1px solid black" }}>Wrestler</th>
              <th style={{ borderBottom: "1px solid black" }}>Points</th>
              <th style={{ borderBottom: "1px solid black" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.event_name}</td>
                <td>{new Date(entry.event_date).toLocaleDateString()}</td>
                <td>{entry.wrestler_name}</td>
                <td>{entry.points}</td>
                <td>{entry.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EventSummary;