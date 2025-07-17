// src/components/WrestlerProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const WrestlerProfile = () => {
  const { wrestlername } = useParams();
  const [wrestler, setWrestler] = useState(null);
  const [events, setEvents] = useState([]);
  const [sortBy, setSortBy] = useState("event_date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/wrestler/${werestlername}`)
      .then(res => res.json())
      .then(setWrestler);

    fetch(`https://fantasy-wrestling-backend.onrender.com/api/eventPoints/wrestler/${wrestlername}`)
      .then(res => res.json())
      .then(setEvents);
  }, [wrestlername]);

  if (!wrestler) return <div>Loading...</div>;

  const sortedEvents = [...events].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortBy === "event_date") {
      return sortOrder === "asc"
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    }
    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="container">
      <h2>{wrestler.wrestler_name}</h2>
      <p><strong>Brand:</strong> {wrestler.brand}</p>
      <p><strong>Current Team:</strong> {wrestler.team_id || "Free Agent"}</p>
      <p><strong>Total Points:</strong> {wrestler.points}</p>

      <h3>Event Points History</h3>

      {events.length === 0 ? (
        <p>No scoring history.</p>
      ) : (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="event_date">Date</option>
              <option value="event_name">Event</option>
              <option value="points">Points</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Team</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e, idx) => (
                <tr key={idx}>
                  <td>{new Date(e.event_date).toLocaleDateString()}</td>
                  <td>{e.event_name}</td>
                  <td>{e.team_name || "Free Agent"}</td>
                  <td>{e.points}</td>
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