import React, { useEffect, useState } from "react";

const StandingsAndTransactions = () => {
  const teams = ["Mike", "Jon", "Buddy", "Sully"];
  const [points, setPoints] = useState([]);

  useEffect(() => {
    Promise.all(
      teams.map((team) =>
        fetch(`https://fantasy-wrestling-backend.onrender.com/api/teamPoints/${team}`)
          .then((res) => res.json())
          .then((data) => ({ team, points: data.total_points || 0 }))
      )
    ).then((results) => {
      const sorted = results.sort((a, b) => b.points - a.points);
      setPoints(sorted);
    });
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