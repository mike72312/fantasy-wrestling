import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ event: "", wrestler: "", description: "" });
  const [sortConfig, setSortConfig] = useState({ key: "event_date", direction: "desc" });

  useEffect(() => {
    axios
      .get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary")
      .then((res) => {
        setEvents(res.data);
        setFiltered(res.data);
      })
      .catch((err) => {
        console.error("❌ Error loading event summary:", err);
      });
  }, []);

  useEffect(() => {
    let filteredData = [...events];
    if (filters.event) {
      filteredData = filteredData.filter(e => e.event_name === filters.event);
    }
    if (filters.wrestler) {
      filteredData = filteredData.filter(e => e.wrestler_name === filters.wrestler);
    }
    if (filters.description) {
      filteredData = filteredData.filter(e => e.description === filters.description);
    }
    setFiltered(filteredData);
  }, [filters, events]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filtered].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFiltered(sorted);
  };

  const unique = (key) => [...new Set(events.map(e => e[key]).filter(Boolean))];

  return (
    <div className="container mt-4">
      <h2>Event Summary</h2>

      {/* Filter Controls */}
      <div className="row mb-3">
        <div className="col-md-4">
          <label>Filter by Event</label>
          <select className="form-control" onChange={(e) => setFilters(f => ({ ...f, event: e.target.value }))}>
            <option value="">All</option>
            {unique("event_name").map((name, i) => <option key={i} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label>Filter by Wrestler</label>
          <select className="form-control" onChange={(e) => setFilters(f => ({ ...f, wrestler: e.target.value }))}>
            <option value="">All</option>
            {unique("wrestler_name").map((name, i) => <option key={i} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label>Filter by Description</label>
          <select className="form-control" onChange={(e) => setFilters(f => ({ ...f, description: e.target.value }))}>
            <option value="">All</option>
            {unique("description").map((desc, i) => <option key={i} value={desc}>{desc}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="thead-dark">
            <tr>
              <th onClick={() => handleSort("event_name")} style={{ cursor: "pointer" }}>Event Name</th>
              <th onClick={() => handleSort("event_date")} style={{ cursor: "pointer" }}>Date</th>
              <th onClick={() => handleSort("wrestler_name")} style={{ cursor: "pointer" }}>Wrestler</th>
              <th onClick={() => handleSort("team_name")} style={{ cursor: "pointer" }}>Team</th>
              <th onClick={() => handleSort("points")} style={{ cursor: "pointer" }}>Points</th>
              <th onClick={() => handleSort("description")} style={{ cursor: "pointer" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={index}>
                <td>{row.event_name}</td>
                <td>{new Date(row.event_date).toLocaleDateString()}</td>
                <td>{row.wrestler_name}</td>
                <td>{row.team_name || "—"}</td>
                <td>{row.points}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventSummary;