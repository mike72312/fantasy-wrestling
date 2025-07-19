import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AvailableWrestlers.css";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const userTeam = localStorage.getItem("teamName");

  useEffect(() => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/allWrestlers")
      .then((res) => res.json())
      .then((data) => {
        const wrestlersArray = Array.isArray(data) ? data : data.wrestlers;
        setWrestlers(wrestlersArray || []);
      })
      .catch((err) => console.error("❌ Error fetching wrestlers:", err));
  }, []);

  const fetchWrestlers = () => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/allWrestlers")
      .then((res) => res.json())
      .then((data) => {
        const wrestlersArray = Array.isArray(data) ? data : data.wrestlers;
        setWrestlers(wrestlersArray || []);
      })
      .catch((err) => console.error("❌ Error fetching wrestlers:", err));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleAdd = async (wrestlerName) => {
    try {
      const response = await fetch("https://fantasy-wrestling-backend.onrender.com/api/addWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: userTeam, wrestlerName })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add wrestler.");

      alert(`${wrestlerName} added to your team.`);
      fetchWrestlers();
    } catch (err) {
      console.error("Add error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDrop = async (wrestlerName) => {
    try {
      const response = await fetch("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: userTeam, wrestlerName })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to drop wrestler.");

      alert(`${wrestlerName} dropped from your team.`);
      fetchWrestlers();
    } catch (err) {
      console.error("Drop error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const filteredWrestlers = wrestlers
    .filter((w) => w.wrestler_name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => (showOnlyAvailable ? !w.team_name : true));

  const sortedWrestlers = [...filteredWrestlers].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (sortBy === "points") {
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

  return (
    <div className="aw-container">
      <h2>All Wrestlers</h2>

      <input
        type="text"
        className="aw-search"
        placeholder="Search wrestlers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="aw-controls">
        <label>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={() => setShowOnlyAvailable((prev) => !prev)}
          />
          {" "}Show only free agents
        </label>
        <span className="aw-hint">Click a column header to sort</span>
      </div>

      <table className="aw-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("wrestler_name")}>
              Wrestler Name {sortBy === "wrestler_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("brand")}>
              Brand {sortBy === "brand" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("points")}>
              Points {sortBy === "points" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("team_name")}>
              Team Name {sortBy === "team_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedWrestlers.map((w, idx) => {
            const isFreeAgent = w.team_name === null;
            const isMyTeam = w.team_name?.toLowerCase() === userTeam?.toLowerCase();

            return (
              <tr key={idx}>
                <td>
                  <Link to={`/wrestler/${encodeURIComponent(w.wrestler_name)}`}>
                    {w.wrestler_name}
                  </Link>
                </td>
                <td>{w.brand ?? "N/A"}</td>
                <td>{w.points ?? "N/A"}</td>
                <td>
                  {w.team_name ? (
                    <Link to={`/roster/${encodeURIComponent(w.team_name)}`}>
                      {w.team_name}
                    </Link>
                  ) : (
                    "Free Agent"
                  )}
                </td>
                <td>
                  {isFreeAgent ? (
                    <button className="aw-add" onClick={() => handleAdd(w.wrestler_name)}>Add</button>
                  ) : isMyTeam ? (
                    <button className="aw-drop" onClick={() => handleDrop(w.wrestler_name)}>Drop</button>
                  ) : (
                    <Link
                      to={`/trade/${encodeURIComponent(w.team_name)}/${encodeURIComponent(w.wrestler_name)}`}
                      className="aw-trade"
                    >
                      Propose Trade
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AvailableWrestlers;