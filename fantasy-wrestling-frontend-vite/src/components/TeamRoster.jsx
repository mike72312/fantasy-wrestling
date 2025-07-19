import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeamRoster.css";

const TeamRoster = () => {
  const { teamName } = useParams();
  const [wrestlers, setWrestlers] = useState([]);

  useEffect(() => {
    fetch(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
      .then((res) => res.json())
      .then((data) => {
        const starters = data
          .filter((w) => w.is_starter)
          .sort((a, b) => b.points - a.points);
        const bench = data
          .filter((w) => !w.is_starter)
          .sort((a, b) => b.points - a.points);
        setWrestlers([...starters, ...bench]);
      })
      .catch((err) => console.error("Error loading roster:", err));
  }, [teamName]);

  return (
    <div className="team-roster-container">
      <h2>{teamName}'s Roster</h2>
      <table className="team-roster-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Points</th>
            <th>Starter</th>
          </tr>
        </thead>
        <tbody>
          {wrestlers.map((wrestler, index) => (
            <tr key={index}>
              <td>
                <a href={`/wrestler/${encodeURIComponent(wrestler.wrestler_name)}`}>
                  {wrestler.wrestler_name}
                </a>
              </td>
              <td>{wrestler.points}</td>
              <td>{wrestler.is_starter ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamRoster;