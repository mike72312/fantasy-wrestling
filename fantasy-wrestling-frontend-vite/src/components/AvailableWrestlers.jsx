import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);

  useEffect(() => {
    fetch("https://wrestling-backend2.onrender.com/api/availableWrestlers")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => b.points - a.points);
        setWrestlers(sorted);
      })
      .catch((err) =>
        console.error("❌ Error fetching available wrestlers:", err)
      );
  }, []);

  const handleAdd = (wrestlerName) => {
    const teamName = localStorage.getItem("teamName");
    if (!teamName) return alert("No team selected.");

    const payload = {
      team_name: teamName,
      wrestler_name: wrestlerName,
    };

    fetch("https://wrestling-backend2.onrender.com/api/addWrestler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Add failed");
        return res.json();
      })
      .then(() => {
        setWrestlers((prev) =>
          prev.filter((w) => w.wrestler_name !== wrestlerName)
        );
      })
      .catch((err) => {
        console.error("❌ Error adding wrestler:", err);
        alert("Failed to add wrestler.");
      });
  };

  return (
    <div className="container">
      <h2>Available Wrestlers</h2>
      <div className="roster-list">
        {wrestlers.map((wrestler, idx) => (
          <div className="card" key={idx}>
            <h3>
              <Link to={`/wrestler/${encodeURIComponent(wrestler.wrestler_name)}`}>
                {wrestler.wrestler_name}
              </Link>
            </h3>
            <p>Points: {wrestler.points ?? "N/A"}</p>
            <button onClick={() => handleAdd(wrestler.wrestler_name)}>Add</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableWrestlers;
