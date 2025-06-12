import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const WrestlerProfile = () => {
  const { wrestlerName } = useParams();
  const [wrestler, setWrestler] = useState(null);
  const [error, setError] = useState(false);

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

  return (
    <div className="container">
      <h2>{wrestler.wrestler_name}</h2>
      <p>Brand: {wrestler.brand ?? "N/A"}</p>
      <p>Current Team: {wrestler.team_id ?? "Free Agent"}</p>
      <p>Total Points: {wrestler.points ?? 0}</p>
    </div>
  );
};

export default WrestlerProfile;
