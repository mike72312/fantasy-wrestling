import React, { useEffect, useState } from "react";

const EventSummary = () => {
  const [grouped, setGrouped] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => res.json())
      .then((data) => {
        const groupedEvents = {};
        data.forEach((entry) => {
          const key = `${entry.event_name}__${entry.event_date}`;
          if (!groupedEvents[key]) groupedEvents[key] = [];
          groupedEvents[key].push(entry);
        });
        setGrouped(groupedEvents);
      })
      .catch((err) => console.error("❌ Error fetching event summary:", err));
  }, []);

  const filteredGrouped = {};
  Object.entries(grouped).forEach(([key, wrestlers]) => {
    const filtered = wrestlers.filter((w) =>
      w.wrestler_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) filteredGrouped[key] = filtered;
  });

  return (
    <div className="container">
      <h2>Event Scoring Summary</h2>
      <input
        type="text"
        placeholder="Search by wrestler name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      {Object.keys(filteredGrouped).length === 0 ? (
        <p>No results found.</p>
      ) : (
        Object.entries(filteredGrouped).map(([key, wrestlers], i) => {
          const [eventName, eventDate] = key.split("__");
          return (
            <div key={i} style={{ marginBottom: "2rem" }}>
              <h3>{eventName}</h3>
              <p><strong>Date:</strong> {new Date(eventDate).toLocaleDateString()}</p>
              <table className="wrestler-table">
                <thead>
                  <tr>
                    <th>Wrestler</th>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {wrestlers.map((w, idx) => (
                    <tr key={idx}>
                      <td>{w.wrestler_name}</td>
                      <td>{w.team_name || "Free Agent"}</td>
                      <td>{w.points}</td>
                      <td>{w.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
};

export default EventSummary;