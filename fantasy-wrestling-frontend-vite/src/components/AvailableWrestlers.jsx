// src/components/AvailableWrestlers.jsx
// src/components/AvailableWrestlers.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const wrestlersPerPage = 25;
  const teamName = localStorage.getItem("teamName");

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/allWrestlers?page=${currentPage}&limit=${wrestlersPerPage}`)
      .then((res) => res.json())
      .then((data) => {
        setWrestlers(data.wrestlers || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => console.error("❌ Error fetching wrestlers:", err));
  }, [currentPage]);

  const handleAdd = async (wrestlerName) => {
    if (!teamName) return alert("No team selected.");

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const restrictedHours = [
      { day: 1, start: 20, end: 23 },
      { day: 5, start: 20, end: 23 },
      { day: 6, start: 20, end: 23 },
    ];
    const isRestricted = restrictedHours.some(
      (r) => r.day === currentDay && currentHour >= r.start && currentHour < r.end
    );
    if (isRestricted) {
      return alert("Add/drop is not allowed during event hours (Mon/Fri/Sat 8–11pm ET).");
    }

    try {
      const rosterRes = await fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`);
      const roster = await rosterRes.json();

      if (roster.length >= 8) {
        alert("You already have 8 wrestlers. Drop someone before adding a new one.");
        return;
      }
    } catch (err) {
      console.error("Error checking team size:", err);
      alert("Could not verify team size.");
      return;
    }

    try {
      const response = await fetch("https://fantasy-wrestling-backend.onrender.com/api/addWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, wrestlerName }),
      });

      if (!response.ok) throw new Error("Add failed");

      // Refresh the page of data after adding
      fetch(`https://fantasy-wrestling-backend.onrender.com/api/allWrestlers?page=${currentPage}&limit=${wrestlersPerPage}`)
        .then((res) => res.json())
        .then((data) => {
          setWrestlers(data.wrestlers || []);
          setTotalPages(data.totalPages || 1);
        });
    } catch (err) {
      console.error("❌ Error adding wrestler:", err);
      alert("Failed to add wrestler.");
    }
  };

  const handleDrop = async (wrestlerName) => {
    if (!teamName) return alert("No team selected.");

    try {
      const response = await fetch("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, wrestlerName }),
      });

      if (!response.ok) throw new Error("Drop failed");

      // Refresh page data after drop
      fetch(`https://fantasy-wrestling-backend.onrender.com/api/allWrestlers?page=${currentPage}&limit=${wrestlersPerPage}`)
        .then((res) => res.json())
        .then((data) => {
          setWrestlers(data.wrestlers || []);
          setTotalPages(data.totalPages || 1);
        });
    } catch (err) {
      console.error("❌ Error dropping wrestler:", err);
      alert("Failed to drop wrestler.");
    }
  };

  const handleProposeTrade = (wrestlerName) => {
    navigate(`/trade-proposal?requested=${encodeURIComponent(wrestlerName)}`);
  };

  const filteredWrestlers = wrestlers
    .filter((w) => w.wrestler_name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => (showOnlyAvailable ? !w.team_name : true));

  const sortedWrestlers = [...filteredWrestlers].sort((a, b) => {
    const aVal = a[sortBy] ?? "";
    const bVal = b[sortBy] ?? "";
    if (typeof aVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
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
        <label>Sort by: </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="wrestler_name">Name</option>
          <option value="points">Points</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <label style={{ marginLeft: "1rem" }}>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={() => {
              setShowOnlyAvailable((prev) => !prev);
            }}
          />
          {" "}Show only free agents
        </label>
      </div>

      <table className="wrestler-table">
        <thead>
          <tr>
            <th>Wrestler Name</th>
            <th>Brand</th>
            <th>Points</th>
            <th>Team Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedWrestlers.map((w, idx) => {
            const isFreeAgent = w.team_name === null;
            const isMyTeam = w.team_name?.toLowerCase() === teamName?.toLowerCase();

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
                    <button onClick={() => handleAdd(w.wrestler_name)}>Add</button>
                  ) : isMyTeam ? (
                    <button onClick={() => handleDrop(w.wrestler_name)}>Drop</button>
                  ) : (
                    <button onClick={() => handleProposeTrade(w.wrestler_name)}>Propose Trade</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span style={{ margin: "0 1rem" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AvailableWrestlers;