import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./EventSummary.css";

const EventSummary = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [wrestlerFilter, setWrestlerFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/eventSummary");
        const normalizedData = res.data.map(row => ({
          ...row,
          team_name: row.team_name || "Free Agent"
        }));
        setData(normalizedData);
        setFiltered(normalizedData);
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
    if (dateFilter) temp = temp.filter(row => formatDate(row.event_date) === dateFilter);

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
    setCurrentPage(1);
  }, [eventFilter, wrestlerFilter, descFilter, teamFilter, dateFilter, sortConfig, data]);

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
    <div className="event-summary-container">
      <h2>Event Summary</h2>

      <div className="event-summary-filters">
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

        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="">All Dates</option>
          {uniqueValues("event_date").map((dateStr, i) => (
            <option key={i} value={formatDate(dateStr)}>{formatDate(dateStr)}</option>
          ))}
        </select>
      </div>

      <table className="event-summary-table">
        <thead>
          <tr>
            {["event_name", "event_date", "wrestler_name", "team_name", "points", "description"].map((key) => (
              <th key={key} onClick={() => handleSort(key)}>
                {key.replace(/_/g, " ").replace(/\w/g, l => l.toUpperCase())}
                {sortConfig.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row, i) => (
            <tr key={i}>
              <td>{row.event_name}</td>
              <td>{formatDate(row.event_date)}</td>
              <td>
                <Link to={`/wrestler/${encodeURIComponent(row.wrestler_name)}`}>
                  {row.wrestler_name}
                </Link>
              </td>
              <td>{row.team_name}</td>
              <td>{row.points}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="event-summary-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default EventSummary;
