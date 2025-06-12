
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AvailableWrestlers = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://wrestling-backend2.onrender.com/api/availableWrestlers")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => b.points - a.points);
        setWrestlers(sorted);
      })
      .catch((err) => console.error("❌ Error fetching wrestlers:", err));
  }, []);

  const handleAdd = async (wrestlerName) => {
    const teamName = localStorage.getItem("teamName");
    if (!teamName) return alert("No team selected.");

    const restrictedHours = [
      { day: 1, start: 20, end: 23 }, // Monday
      { day: 5, start: 20, end: 23 }, // Friday
      { day: 6, start: 20, end: 23 }, // Saturday
    ];
    const now = new Date();
    const currentDay = now.getDay(); // Sunday = 0
    const currentHour = now.getHours();
    const isRestricted = restrictedHours.some(
      (r) => r.day === currentDay && currentHour >= r.start && currentHour < r.end
    );
    if (isRestricted) {
      return alert("Add/drop is not allowed during event hours (Mon/Fri/Sat 8-11pm ET).");
    }

    try {
      const response = await fetch("https://wrestling-backend2.onrender.com/api/addWrestler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: teamName, wrestler_name: wrestlerName }),
      });

      if (!response.ok) throw new Error("Add failed");
      setWrestlers((prev) => prev.filter((w) => w.wrestler_name !== wrestlerName));
    } catch (err) {
      console.error("❌ Error adding wrestler:", err);
      alert("Failed to add wrestler.");
    }
  };

  const filteredWrestlers = wrestlers.filter((w) =>
    w.wrestler_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Available Wrestlers</h2>
      <input
        type="text"
        placeholder="Search wrestlers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />
      <table className="wrestler-table">
        <thead>
          <tr>
            <th>Wrestler Name</th>
            <th>Brand</th>
            <th>Points</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredWrestlers.map((w, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/wrestler/${encodeURIComponent(w.wrestler_name)}`}>
                  {w.wrestler_name}
                </Link>
              </td>
              <td>{w.brand ?? "N/A"}</td>
              <td>{w.points ?? "N/A"}</td>
              <td>
                <button onClick={() => handleAdd(w.wrestler_name)}>Add</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AvailableWrestlers;
