import React, { useEffect, useState } from "react";
import axios from "axios";

const EventSummary = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [wrestlerFilter, setWrestlerFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary");
        setData(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("❌ Error loading event summary:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let temp = [...data];

    if (eventFilter) temp = temp.filter(row => row.event_name === eventFilter);
    if (wrestlerFilter) temp = temp.filter(row => row.wrestler_name === wrestlerFilter);
    if (descFilter) temp = temp.filter(row => row.description === descFilter);
    if (teamFilter) temp = temp.filter(row => row.team_name === teamFilter);

    if (sortConfig.key) {
      temp.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "event_date") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(temp);
    setCurrentPage(1); // reset pagination on filter change
  }, [eventFilter, wrestlerFilter, descFilter, teamFilter, sortConfig, data]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const uniqueValues = (key) =>
    [...new Set(data.map(row => row[key]).filter(Boolean))].sort();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Event Summary</h2>

      <div style={{ marginBottom: "15px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="">All Events</option>
          {uniqueValues("event_name").map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>

        <select value={wrestlerFilter} onChange={(e) => setWrestlerFilter(e.target.value)}>
          <option value="">All Wrestlers</option>
          {uniqueValues("wrestler_name").map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>

        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {uniqueValues("team_name").map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>

        <select value={descFilter} onChange={(e) => setDescFilter(e.target.value)}>
          <option value="">All Descriptions</option>
          {uniqueValues("description").map((desc, i) => (
            <option key={i} value={desc}>{desc}</option>
          ))}
        </select>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["event_name", "event_date", "wrestler_name", "team_name", "points", "description"].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer", background: "#f0f0f0" }}
              >
                {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                {sortConfig.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.event_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{formatDate(row.event_date)}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.wrestler_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.team_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.points}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default EventSummary;