// src/components/AvailableWrestlers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const userTeam = localStorage.getItem("teamName");

  const fetchWrestlers = () => {
    fetch("https://fantasy-wrestling-backend.onrender.com/api/allWrestlers")
      .then((res) => res.json())
      .then((data) => {
        const wrestlersArray = Array.isArray(data) ? data : data.wrestlers;
        setWrestlers(wrestlersArray || []);
      })
      .catch((err) => console.error("❌ Error fetching wrestlers:", err));
  };

  useEffect(() => {
    fetchWrestlers();
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
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

  const buttonStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    cursor: "pointer"
  };

  const getColumnStyle = (column, align = "left") => ({
    borderBottom: "2px solid #ccc",
    padding: "8px",
    textAlign: align,
    cursor: "pointer",
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
      <h2>All Wrestlers</h2>

      <input
        type="text"
        placeholder="Search wrestlers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "1rem" }}>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={() => setShowOnlyAvailable((prev) => !prev)}
          />
          {" "}Show only free agents
        </label>
        <span style={{ fontStyle: "italic" }}>Click a column header to sort</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={getColumnStyle("wrestler_name")} onClick={() => handleSort("wrestler_name")}>
              Wrestler Name {sortBy === "wrestler_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={getColumnStyle("brand")} onClick={() => handleSort("brand")}>
              Brand {sortBy === "brand" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={getColumnStyle("points", "right")} onClick={() => handleSort("points")}>
              Points {sortBy === "points" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={getColumnStyle("team_name")} onClick={() => handleSort("team_name")}>
              Team Name {sortBy === "team_name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ borderBottom: "2px solid #ccc", padding: "8px" }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedWrestlers.map((w, idx) => {
            const isFreeAgent = w.team_name === null;
            const isMyTeam = w.team_name?.toLowerCase() === userTeam?.toLowerCase();

            return (
              <tr key={idx}>
                <td style={getCellStyle("wrestler_name")}>
                  <Link to={`/wrestler/${encodeURIComponent(w.wrestler_name)}`}>
                    {w.wrestler_name}
                  </Link>
                </td>
                <td style={getCellStyle("brand")}>{w.brand ?? "N/A"}</td>
                <td style={getCellStyle("points", "right")}>{w.points ?? "N/A"}</td>
                <td style={getCellStyle("team_name")}>
                  {w.team_name ? (
                    <Link to={`/roster/${encodeURIComponent(w.team_name)}`}>
                      {w.team_name}
                    </Link>
                  ) : (
                    "Free Agent"
                  )}
                </td>
                <td style={{ padding: "8px" }}>
                  {isFreeAgent ? (
                    <button
                      style={{ ...buttonStyle, backgroundColor: "green" }}
                      onClick={() => handleAdd(w.wrestler_name)}
                    >
                      Add
                    </button>
                  ) : isMyTeam ? (
                    <button
                      style={{ ...buttonStyle, backgroundColor: "red" }}
                      onClick={() => handleDrop(w.wrestler_name)}
                    >
                      Drop
                    </button>
                  ) : (
                    <Link
                      to={`/trade/${encodeURIComponent(w.team_name)}/${encodeURIComponent(w.wrestler_name)}`}
                      style={{
                        ...buttonStyle,
                        backgroundColor: "blue",
                        textDecoration: "none",
                        display: "inline-block",
                        textAlign: "center"
                      }}
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