// src/components/RosterManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RosterManagement = () => {
  const [rosters, setRosters] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");
  const [wrestlerName, setWrestlerName] = useState("");
  const [message, setMessage] = useState("");

  // Fetch rosters from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/rosters")
      .then((response) => setRosters(response.data))
      .catch((error) => console.error("Error fetching rosters:", error));
  }, []);

  const handleAddWrestler = async () => {
    if (!selectedTeam || !wrestlerName) {
      setMessage("Please select a team and provide a wrestler's name.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/roster/add", {
        wrestlerName,
        teamName: selectedTeam,
      });
      setMessage(response.data);
      setWrestlerName("");  // Reset the form
    } catch (error) {
      setMessage("Error adding wrestler to team.");
    }
  };

  const handleRemoveWrestler = async () => {
    if (!wrestlerName) {
      setMessage("Please provide a wrestler's name.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/roster/remove", {
        wrestlerName,
      });
      setMessage(response.data);
      setWrestlerName("");  // Reset the form
    } catch (error) {
      setMessage("Error removing wrestler from team.");
    }
  };

  return (
    <div>
      <h2>Roster Management</h2>

      <div>
        <h3>Teams and Their Rosters</h3>
        <ul>
          {Object.keys(rosters).map((team) => (
            <li key={team}>
              <strong>{team}</strong>: {rosters[team].join(", ")}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Add Wrestler to a Team</h3>
        <label>
          Select Team:
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">--Select a Team--</option>
            {Object.keys(rosters).map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label>
          Wrestler Name:
          <input
            type="text"
            value={wrestlerName}
            onChange={(e) => setWrestlerName(e.target.value)}
          />
        </label>
        <button onClick={handleAddWrestler}>Add Wrestler</button>
      </div>

      <div>
        <h3>Remove Wrestler from a Team</h3>
        <label>
          Wrestler Name:
          <input
            type="text"
            value={wrestlerName}
            onChange={(e) => setWrestlerName(e.target.value)}
          />
        </label>
        <button onClick={handleRemoveWrestler}>Remove Wrestler</button>
      </div>

      {message && <div>{message}</div>}
    </div>
  );
};

export default RosterManagement;