// src/components/WrestlerProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const WrestlerProfile = () => {
  const { wrestler_name } = useParams();
  const [wrestler, setWrestler] = useState(null);
  const [events, setEvents] = useState([]);
  const [sortBy, setSortBy] = useState("event_date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/wrestler/${wrestler_name}`)
      .then(res => res.json())
      .then(setWrestler);

    fetch(`https://fantasy-wrestling-backend.onrender.com/api/eventPoints/wrestler/${wrestler_name}`)
      .then(res => res.json())
      .then(setEvents);
  }, [wrestler_name]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (sortBy === "event_date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (sortBy === "points") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = aVal?.toString().toLowerCase() || "";
      bVal = bVal?.toString().toLowerCase() || "";
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  if (!wrestler) return <div>Loading...</div>;

  const getColumnStyle = (column, align = "left") => ({
    borderBottom: "2px solid #ccc",
    padding: "8px",
    textAlign: align,
    cursor: column !== "team_name" ? "pointer" : "default",
    backgroundColor: sortBy === column ? "#f0f8ff" : "transparent",
  });

  const getCellStyle = (column, align = "left") => ({
    borderBottom: "1px solid #eee",
    padding: "8px",
    textAlign: align,
    backgroundColor: sortBy === column ? "#f9f9f9" : "transparent",
  });

  return (
    <div className="container">
      <h2>{wrestler.wrestler_name}</h2>
      <p><strong>Brand:</strong> {wrestler.brand}</p>
      <p><strong>Current Team:</strong> {wrestler.team_name || "Free Agent"}</p>
      <p><strong>Total Points:</strong> {wrestler.points}</p>

      <h3>Event Points History</h3>

      {events.length === 0 ? (
        <p>No scoring history.</p>
      ) : (
        <>
          <p style={{ fontStyle: "italic", marginBottom: "0.5rem" }}>
            Click table headers to sort
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr>
                <th style={getColumnStyle("event_date")} onClick={() => handleSort("event_date")}>
                  Date {sortBy === "event_date" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={getColumnStyle("event_name")} onClick={() => handleSort("event_name")}>
                  Event {sortBy === "event_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={getColumnStyle("team_name")}>
                  Team
                </th>
                <th style={getColumnStyle("points", "right")} onClick={() => handleSort("points")}>
                  Points {sortBy === "points" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e, idx) => (
                <tr key={idx}>
                  <td style={getCellStyle("event_date")}>
                    {new Date(e.event_date).toLocaleDateString()}
                  </td>
                  <td style={getCellStyle("event_name")}>{e.event_name}</td>
                  <td style={getCellStyle("team_name")}>
                    {e.team_name || "Free Agent"}
                  </td>
                  <td style={getCellStyle("points", "right")}>
                    {e.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default WrestlerProfile;