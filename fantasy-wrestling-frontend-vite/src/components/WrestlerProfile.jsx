// src/components/WrestlerProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const WrestlerProfile = () => {
  const { wrestlerName } = useParams();
  const [wrestler, setWrestler] = useState(null);
  const [error, setError] = useState(false);

  const userTeam = localStorage.getItem("teamName")?.toLowerCase();

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/wrestler/${encodeURIComponent(wrestlerName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setWrestler(data))
      .catch(() => setError(true));
  }, [wrestlerName]);

  if (error) return <p>❌ Wrestler not found.</p>;
  if (!wrestler) return <p>Loading wrestler...</p>;

  const isTradeEligible =
    wrestler.team_name &&
    wrestler.team_name.toLowerCase() !== userTeam;

  return (
    <div className="container">
      <h2>{wrestler.wrestler_name}</h2>
      <p>Brand: {wrestler.brand}</p>
      <p>Points: {wrestler.points}</p>
      <p>
        Team:{" "}
        {wrestler.team_name
          ? wrestler.team_name
          : "Free Agent"}
      </p>

      {isTradeEligible && (
        <Link
          to={`/trade/${wrestler.team_name}/${wrestler.wrestler_name}`}
          className="propose-trade-btn"
        >
          Propose Trade
        </Link>
      )}
    </div>
  );
};

export default WrestlerProfile;