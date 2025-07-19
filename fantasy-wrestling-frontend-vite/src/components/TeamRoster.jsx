import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./TeamRoster.css";

const TeamRoster = () => {
  const { teamName } = useParams();
  const [teamroster, setteamroster] = useState([]);
  const [sortBy, setSortBy] = useState("wrestler_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const navigate = useNavigate();
  const userTeam = localStorage.getItem("teamName")?.toLowerCase();

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
      .then((res) => res.json())
      .then((data) => {
        const starters = data.filter(w => w.starter).sort((a, b) => b.points - a.points);
        const bench = data.filter(w => !w.starter).sort((a, b) => b.points - a.points);
        setteamroster([...starters, ...bench]);
      })
      .catch((err) => console.error("❌ Error loading teamroster:", err));
  }, [teamName]);

  const handleDrop = async (wrestlerName) => {
    try {
      const res = await fetch("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, wrestlerName }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          alert(data.error || "Restricted hours: Cannot drop a wrestler right now.");
        } else {
          alert(data.error || "Failed to drop wrestler.");
        }
        return;
      }

      setteamroster(teamroster.filter((w) => w.wrestler_name !== wrestlerName));
    } catch (err) {
      console.error("Error dropping wrestler:", err);
      alert("Failed to drop wrestler.");
    }
  };

  const handleToggleStarter = async (wrestlerName, newStatus) => {
    try {
      if (newStatus) {
        const starterCount = teamroster.filter((w) => w.starter).length;
        if (starterCount >= 6) {
          alert("You already have 6 starters. Move someone to the bench before promoting another.");
          return;
        }
      }

      const res = await fetch("https://fantasy-wrestling-backend.onrender.com/api/setStarterStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wrestlerName, isStarter: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 403) {
          alert(error.error || "Restricted hours: Cannot change starter status.");
        } else {
          alert(error.error || "Error updating starter status");
        }
        return;
      }

      const updatedRoster = await fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`).then(res => res.json());
      const starters = updatedRoster.filter(w => w.starter).sort((a, b) => b.points - a.points);
      const bench = updatedRoster.filter(w => !w.starter).sort((a, b) => b.points - a.points);
      setteamroster([...starters, ...bench]);
    } catch (err) {
      console.error("Error toggling starter status:", err);
      alert("Failed to update starter status.");
    }
  };

  const sortedRoster = [...teamroster].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="container">
      <h2>{teamName}'s Roster</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Sort by: </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="wrestler_name">Name</option>
          <option value="points">Points</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {sortedRoster.length === 0 ? (
        <p>Roster is empty.</p>
      ) : (
        <table className="roster-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Name</th>
              <th>Points</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRoster.map((wrestler, i) => (
              <tr key={i}>
                <td>
                  <Link to={`/wrestler/${encodeURIComponent(wrestler.wrestler_name)}`}>
                    {wrestler.wrestler_name}
                  </Link>
                </td>
                <td>{wrestler.points}</td>
                <td><strong>{wrestler.starter ? "Starter" : "Bench"}</strong></td>
                <td>
                  {userTeam === teamName.toLowerCase() ? (
                    <>
                      <button onClick={() => handleDrop(wrestler.wrestler_name)}>Drop</button>{" "}
                      <button onClick={() => handleToggleStarter(wrestler.wrestler_name, !wrestler.starter)}>
                        Set {wrestler.starter ? "Bench" : "Starter"}
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/trade/${teamName}/${encodeURIComponent(wrestler.wrestler_name)}`}
                      className="propose-trade-btn"
                    >
                      Propose Trade
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeamRoster;