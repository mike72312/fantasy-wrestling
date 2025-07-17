import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "event_date", direction: "desc" });

  useEffect(() => {
    axios.get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then(res => setData(res.data))
      .catch(err => {
        console.error("❌ Error loading event summary:", err);
        alert("Failed to load event summary");
      });
  }, []);

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="container">
      <h2>Event Summary</h2>
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => requestSort("event_name")}>Event</th>
            <th onClick={() => requestSort("event_date")}>Date</th>
            <th onClick={() => requestSort("wrestler_name")}>Wrestler</th>
            <th onClick={() => requestSort("team_name")}>Team</th>
            <th onClick={() => requestSort("points")}>Points</th>
            <th onClick={() => requestSort("description")}>Description</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i}>
              <td>{row.event_name}</td>
              <td>{row.event_date}</td>
              <td>{row.wrestler_name}</td>
              <td>{row.team_name || "Free Agent"}</td>
              <td>{row.points}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventSummary;