// src/components/WrestlerProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const WrestlerProfile = () => {
  const { wrestlerName } = useParams();
  const [wrestler, setWrestler] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`https://wrestling-backend2.onrender.com/api/wrestler/${encodeURIComponent(wrestlerName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setWrestler(data))
      .catch(() => setError(true));
  }, [wrestlerName]);

  const proposeTrade = () => {
    const params = new URLSearchParams({
      requestedWrestler: wrestler.wrestler_name
    });
    navigate(`/trade-center?${params.toString()}`);
  };

  const userTeam = localStorage.getItem("teamName")?.toLowerCase();

  if (error) return <p>❌ Wrestler not found.</p>;
  if (!wrestler) return <p>Loading wrestler...</p>;

  return (
    <div className="container">
      <h2>{wrestler.wrestler_name}</h2>
      <p>Brand: {wrestler.brand}</p>
      <p>Points: {wrestler.points}</p>
      <p>Team: {wrestler.team_id || "Free Agent"}</p>

      {/* ✅ Show trade button if wrestler is on another team */}
      {wrestler.team_id && wrestler.team_id.toLowerCase() !== userTeam && (
        <button onClick={proposeTrade}>Propose Trade</button>
      )}
    </div>
  );
};

export default WrestlerProfile;
