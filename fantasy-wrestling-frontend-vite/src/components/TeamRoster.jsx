// src/components/TeamRoster.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const TeamRoster = () => {
  const { teamName } = useParams();
  const [teamroster, setteamroster] = useState([]);
  const navigate = useNavigate();
  const userTeam = localStorage.getItem("teamName")?.toLowerCase();

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
      .then((res) => res.json())
      .then((data) => setteamroster(data))
      .catch((err) => console.error("❌ Error loading teamroster:", err));
  }, [teamName]);

  const handleDrop = async (wrestlerName) => {
    const restrictedHours = [
      { day: 1, start: 20, end: 23 },
      { day: 5, start: 20, end: 23 },
      { day: 6, start: 20, end: 23 },
    ];
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const isRestricted = restrictedHours.some(
      (r) => r.day === currentDay && currentHour >= r.start && currentHour < r.end
    );

    if (isRestricted) {
      alert("Dropping wrestlers is restricted during show hours.");
      return;
    }

    try {
      const res = await fetch("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, wrestlerName }),
      });

      if (!res.ok) throw new Error("Drop failed");

      setteamroster(teamroster.filter((w) => w.wrestler_name !== wrestlerName));
    } catch (err) {
      console.error("Error dropping wrestler:", err);
      alert("Failed to drop wrestler.");
    }
  };

  const proposeTrade = (requestedWrestler) => {
    const params = new URLSearchParams({ requestedWrestler });
    navigate(`/trade-center?${params.toString()}`);
  };

  return (
    <div className="container">
      <h2>{teamName}'s Roster</h2>
      <ul className="wrestler-list">
        {teamroster.map((wrestler, i) => (
          <li key={i}>
            <Link to={`/wrestler/${encodeURIComponent(wrestler.wrestler_name)}`}>
              {wrestler.wrestler_name}
            </Link>
            {" — "}
            {userTeam === teamName.toLowerCase() ? (
              <button onClick={() => handleDrop(wrestler.wrestler_name)}>Drop</button>
            ) : (
              <button onClick={() => proposeTrade(wrestler.wrestler_name)}>Propose Trade</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamRoster;