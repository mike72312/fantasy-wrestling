// src/components/Roster.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Roster = () => {
  const [teamroster, setteamroster] = useState([]);

  useEffect(() => {
    const teamName = localStorage.getItem('teamName');
    if (teamName) {
      axios
        .get(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
        .then((response) => {
          setteamroster(response.data);
        })
        .catch((error) => {
          console.error("Error fetching team roster:", error);
        });
    }
  }, []);

  const handleDropWrestler = (wrestler) => {
    const teamName = localStorage.getItem('teamName');
    if (!teamName) {
      alert("You need to be logged in to drop a wrestler.");
      return;
    }

    axios
      .post("https://fantasy-wrestling-backend.onrender.com/api/dropWrestler", {
        teamName: teamName,
        wrestlerName: wrestler
      })
      .then((response) => {
        alert(response.data.message);
        setteamroster((prev) => prev.filter((w) => w.wrestler_name !== wrestler));
      })
      .catch((error) => {
        console.error("Error dropping wrestler:", error);
        alert("There was an error dropping the wrestler.");
      });
  };

  return (
    <div className="container">
      <h2>Your Roster</h2>
      <div className="wrestler-list">
        {teamroster.length === 0 ? (
          <p>Your roster is empty.</p>
        ) : (
          teamroster.map((wrestler, index) => (
            <div className="card" key={index}>
              <div className="card-content">
                <h4>
                  {wrestler.wrestler_name} ({wrestler.points} pts) – <strong>{wrestler.starter ? "Starter" : "Bench"}</strong>
                </h4>
                <button className="drop-button" onClick={() => handleDropWrestler(wrestler.wrestler_name)}>
                  Drop
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Roster;