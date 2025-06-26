import React, { useState, useEffect } from 'react';
import axios from 'axios';

const teamroster = () => {
  const [teamroster, setteamroster] = useState([]);
  
  useEffect(() => {
    const teamName = localStorage.getItem('teamName');
    if (teamName) {
      // Fetch teamroster for the logged-in user (team)
      axios
        .get(`https://fantasy-wrestling-backend.onrender.com/api/roster/${teamName}`)
        .then((response) => {
          setteamroster(response.data);  // Set the teamroster for the team
        })
        .catch((error) => {
          console.error("Error fetching team teamroster:", error);
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
        setteamroster((prevteamroster) =>
          prevteamroster.filter((wrestlerName) => wrestlerName !== wrestler)
        );
      })
      .catch((error) => {
        console.error("Error dropping wrestler:", error);
        alert("There was an error dropping the wrestler.");
      });
  };

  return (
    <div className="container">
      <h2>Your teamroster</h2>
      <div className="wrestler-list">
        {teamroster.length === 0 ? (
          <p>Your teamroster is empty.</p>
        ) : (
          teamroster.map((wrestler, index) => (
            <div className="card" key={index}>
              <div className="card-content">
                <h4>{wrestler}</h4>
                <button className="drop-button" onClick={() => handleDropWrestler(wrestler)}>
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

export default teamroster;