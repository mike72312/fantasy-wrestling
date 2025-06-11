import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TeamRoster = () => {
  const { teamName } = useParams();
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    fetch(`https://wrestling-backend2.onrender.com/api/roster/${encodeURIComponent(teamName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRoster(data.filter(w => w && w.wrestler_name)); // ✅ Defensive check
        } else {
          console.error("Unexpected response format:", data);
          setRoster([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching team roster:", err);
        setRoster([]);
      });
  }, [teamName]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>{teamName} Roster</h2>
      <ul>
        {roster.length === 0 ? (
          <li>No wrestlers found for this team.</li>
        ) : (
          roster.map((wrestler, idx) => (
            <li key={idx}>
              {wrestler.wrestler_name} — {wrestler.points} pts
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default TeamRoster;