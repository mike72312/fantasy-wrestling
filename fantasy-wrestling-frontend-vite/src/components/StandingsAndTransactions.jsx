import React, { useEffect, useState } from "react";

const StandingsAndTransactions = () => {
  const teams = ["Mike", "Jon", "Buddy", "Sully"];
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchTeamPoints = async (team) => {
      try {
        const response = await fetch(`https://fantasy-wrestling-backend.onrender.com/api/teamPoints/${team}`);
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        return { team, points: data.total_points || 0 };
      } catch (err) {
        console.error(`❌ Failed to fetch points for ${team}:`, err);
        return { team, points: 0 }; // Default to 0 if error
      }
    };

    const fetchAllPoints = async () => {
      const results = await Promise.all(teams.map(fetchTeamPoints));
      const sorted = results.sort((a, b) => b.points - a.points);
      setPoints(sorted);
    };

    fetchAllPoints();
  }, []);

  return (
    <div className="container">
      <h2>Standings</h2>
      <ol>
        {points.map((entry, idx) => (
          <li key={idx}>
            {entry.team}: {entry.points} points
          </li>
        ))}
      </ol>
    </div>
  );
};

export default StandingsAndTransactions;