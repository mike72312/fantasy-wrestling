import React, { useEffect, useState } from "react";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);

  useEffect(() => {
    fetch("https://your-backend-name.onrender.com/api/availableWrestlers")
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => b.points - a.points); // Sort by points
        setWrestlers(sorted);
      })
      .catch(err => console.error("Error fetching available wrestlers:", err));
  }, []);

  const handleAdd = (wrestlerName) => {
    const teamName = localStorage.getItem("teamName");
    if (!teamName) return alert("No team selected.");

    fetch("https://your-backend-name.onrender.com/api/addWrestler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, wrestlerName }),
    })
      .then(res => res.json())
      .then(() => {
        setWrestlers(prev => prev.filter(w => w.wrestler_name !== wrestlerName));
      })
      .catch(err => console.error("Error adding wrestler:", err));
  };

  const getRowColor = (points) => {
    if (points >= 30) return "#d4edda"; // green
    if (points >= 10) return "#fff3cd"; // yellow
    return "#f8d7da"; // red
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Wrestlers</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={cellStyle}>Wrestler</th>
            <th style={cellStyle}>Points</th>
            <th style={cellStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {wrestlers.map((w, idx) => (
            <tr key={idx} style={{ backgroundColor: getRowColor(w.points) }}>
              <td style={cellStyle}>{w.wrestler_name}</td>
              <td style={cellStyle}>{w.points}</td>
              <td style={cellStyle}>
                <button onClick={() => handleAdd(w.wrestler_name)}>Add</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};

export default AvailableWrestlers;