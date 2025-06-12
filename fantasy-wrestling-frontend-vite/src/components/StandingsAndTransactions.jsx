import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const StandingsAndTransactions = () => {
  const teams = ["Mike", "Jon", "Buddy", "Sully"];
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchTeamPoints = async (team) => {
      try {
        const response = await fetch(`https://fantasy-wrestling-backend.onrender.com/api/teamPoints/${team}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        return { team, points: data.total_points || 0 };
      } catch (err) {
        console.error("❌", team, err);
        return { team, points: 0 };
      }
    };

    Promise.all(teams.map(fetchTeamPoints)).then((results) => {
      const sorted = results.sort((a, b) => b.points - a.points);
      setPoints(sorted);
    });
  }, []);

  return (
    <div className="container">
      <h2>🏆 Team Standings</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Team</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {points.map(({ team, points }, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/roster/${encodeURIComponent(team)}`}>{team}</Link>
              </td>
              <td>{points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsAndTransactions;
