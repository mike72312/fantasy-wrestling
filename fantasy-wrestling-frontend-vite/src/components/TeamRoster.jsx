import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./TeamRoster.css"; // 👈 Make sure to create and include this CSS file

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
      .then((data) => setteamroster(data))
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
        alert(data.error || "Drop failed.");
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
        alert(error.error || "Error updating starter status");
        return;
      }

      const updatedRoster = await fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`).then(res => res.json());
      setteamroster(updatedRoster);
    } catch (err) {
      console.error("Error toggling starter status:", err);
      alert("Failed to update starter status.");
    }
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
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

    return sortOrder === "asc"
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  return (
    <div className="roster-container">
      <h2>{teamName}'s Roster</h2>

      {sortedRoster.length === 0 ? (
        <p className="empty-roster">Roster is empty.</p>
      ) : (
        <table className="roster-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("wrestler_name")}>
                Name {sortBy === "wrestler_name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => toggleSort("points")}>
                Points {sortBy === "points" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRoster.map((wrestler, i) => (
              <tr key={i} className={userTeam === teamName.toLowerCase() ? "own-team-row" : ""}>
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
                      <button className="drop-btn" onClick={() => handleDrop(wrestler.wrestler_name)}>Drop</button>{" "}
                      <button
                        className="starter-btn"
                        onClick={() => handleToggleStarter(wrestler.wrestler_name, !wrestler.starter)}
                      >
                        Set {wrestler.starter ? "Bench" : "Starter"}
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/trade/${teamName}/${encodeURIComponent(wrestler.wrestler_name)}`}
                      className="trade-btn"
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