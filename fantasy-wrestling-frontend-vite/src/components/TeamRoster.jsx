import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

const roster = () => {
  const { teamName } = useParams();
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
      .then((res) => res.json())
      .then((data) => setRoster(data))
      .catch((err) => console.error("❌ Error loading roster:", err));
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
    if (isRestricted) return alert("Cannot drop during event hours (Mon/Fri/Sat 8-11pm ET).");

    try {
      const res = await fetch("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: teamName, wrestler_name: wrestlerName }),
      });
      if (!res.ok) throw new Error("Drop failed");
      setRoster((prev) => prev.filter((w) => w.wrestler_name !== wrestlerName));
    } catch (err) {
      console.error("❌ Error dropping wrestler:", err);
      alert("Failed to drop wrestler.");
    }
  };

  return (
    <div className="container">
      <h2>{teamName}'s Roster</h2>
      <ul>
        {roster.map((w, idx) => (
          <li key={idx}>
            <Link to={`/wrestler/${encodeURIComponent(w.wrestler_name)}`}>
              {w.wrestler_name}
            </Link>{" "}
            <button onClick={() => handleDrop(w.wrestler_name)}>Drop</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default roster;