import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./TeamRoster.css";

const TeamRoster = () => {
  const { teamName } = useParams();
  const [teamroster, setteamroster] = useState([]);
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rankInfo, setRankInfo] = useState(null);
  const [eventPoints, setEventPoints] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState([]);
  const navigate = useNavigate();
  const userTeam = localStorage.getItem("teamName")?.toLowerCase();

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
      .then(res => res.json())
      .then(setteamroster)
      .catch(err => console.error("❌ Error loading teamroster:", err));

    fetch(`https://fantasy-wrestling-backend.onrender.com/api/teamRank/${teamName}`)
      .then(res => res.json())
      .then(setRankInfo)
      .catch(err => console.error("❌ Error loading rank:", err));

    fetch(`https://fantasy-wrestling-backend.onrender.com/api/eventPoints/team/${teamName}`)
      .then(res => res.json())
      .then(setEventPoints)
      .catch(err => console.error("❌ Error loading team event points:", err));
  }, [teamName]);

  const toggleExpand = (date) => {
    setExpandedEvents((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

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

  const handleSort = (key) => {
    setSortBy(key === sortBy ? key : key);
    setSortOrder(sortBy === key && sortOrder === "asc" ? "desc" : "asc");
  };

  const sortGroup = (group) => {
    return [...group].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const starters = sortGroup(teamroster.filter((w) => w.starter));
  const bench = sortGroup(teamroster.filter((w) => !w.starter));
  const sortedRoster = [...starters, ...bench];

  return (
    <div className="container">
      <h2>{teamName}'s Roster</h2>

      {rankInfo && (
        <div className="team-rank-summary">
          <p><strong>Rank:</strong> #{rankInfo.rank}</p>
          <p><strong>Total Wins:</strong> {rankInfo.total_wins}</p>
          <p><strong>Total Points:</strong> {rankInfo.total_points}</p>
        </div>
      )}

      {sortedRoster.length === 0 ? (
        <p>Roster is empty.</p>
      ) : (
        <table className="roster-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th onClick={() => handleSort("wrestler_name")}>Name</th>
              <th onClick={() => handleSort("points")}>Points</th>
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

      <h3 style={{ marginTop: "2rem" }}>Team Event Points</h3>
      <table className="event-summary-table" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Total Points</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {eventPoints.map((event, i) => (
            <React.Fragment key={i}>
              <tr>
                <td>{new Date(event.event_date).toLocaleDateString()}</td>
                <td>{event.event_name}</td>
                <td>{event.total_points}</td>
                <td>
                  <button onClick={() => toggleExpand(event.event_date)}>
                    {expandedEvents.includes(event.event_date) ? "Hide" : "Show"} Breakdown
                  </button>
                </td>
              </tr>
              {expandedEvents.includes(event.event_date) && event.breakdown && (
                <tr>
                  <td colSpan="4">
                    <ul>
                      {event.breakdown.map((pt, idx) => (
                        <li key={idx}>
                          {pt.wrestler_name}: {pt.points} points — {pt.description}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamRoster;