import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const WrestlerProfile = () => {
  const { name } = useParams();
  const [wrestler, setWrestler] = useState(null);

  useEffect(() => {
    fetch(`https://wrestling-backend2.onrender.com/api/wrestler/${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => setWrestler(data))
      .catch((err) => console.error("❌ Error loading wrestler:", err));
  }, [name]);

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
