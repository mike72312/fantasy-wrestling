// src/components/Scoreboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Scoreboard = () => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    // Fetch the scores when the component mounts
    axios
      .get('http://localhost:5000/api/allRosters')  // Endpoint for team rosters
      .then((response) => {
        setScores(response.data);
      })
      .catch((error) => {
        console.error('Error fetching scores:', error);
      });
  }, []);

  return (
    <div>
      <h2>Scoreboard</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Roster</th>
            <th>Total Points</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((team) => (
            <tr key={team.team}>
              <td>{team.team}</td>
              <td>{team.roster.join(', ')}</td>
              <td>{team.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;