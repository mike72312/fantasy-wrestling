import React, { useEffect, useState } from "react";

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

  const handleAdd = (wrestlerNameRaw) => {
    const teamName = localStorage.getItem("teamName");
    if (!teamName) return alert("No team selected.");

    const wrestlerName = wrestlerNameRaw || "Unnamed";

    const payload = {
      team_name: teamName,
      wrestler_name: wrestlerName,
    };

    console.log("🚀 Submitting to backend:", payload);

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
          prev.filter((w) => {
            const current = w.wrestler_name || w.name;
            return current !== wrestlerName;
          })
        );
        console.log(`✅ Successfully added ${wrestlerName} to ${teamName}`);
      })
      .catch((err) => {
        console.error("❌ Error adding wrestler:", err);
        alert("Failed to add wrestler.");
      });
  };

  const getCardColor = (points) => {
    if (points >= 30) return "#d4edda"; // green
    if (points >= 10) return "#fff3cd"; // yellow
    return "#f8d7da"; // red
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Wrestlers</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {wrestlers.map((wrestler, idx) => {
          const name = wrestler.wrestler_name || wrestler.name || "Unnamed";

          return (
            <div
              key={idx}
              style={{
                backgroundColor: getCardColor(wrestler.points),
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                width: "200px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0" }}>{name}</h3>
              <p style={{ margin: "0 0 12px 0" }}>
                Points: {wrestler.points ?? "N/A"}
              </p>
              <button onClick={() => handleAdd(name)}>Add</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableWrestlers;