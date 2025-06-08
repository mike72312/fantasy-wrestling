import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AvailableWrestlers = () => {
  const [availableWrestlers, setAvailableWrestlers] = useState([]);

  useEffect(() => {
    // Fetch available wrestlers from the backend API
    axios
      .get("https://wrestling-backend2.onrender.com/api/availableWrestlers")
      .then((response) => {
        setAvailableWrestlers(response.data);  // Update state with fetched wrestlers
      })
      .catch((error) => {
        console.error("Error fetching available wrestlers:", error);
      });
  }, []);

  const handleAddWrestler = (wrestlerName) => {
    const teamName = localStorage.getItem('teamName');  // Get the team name from localStorage
    
    if (!teamName) {
      alert("You need to be logged in to add a wrestler.");
      return;
    }

    axios
      .post("https://wrestling-backend2.onrender.com/api/addWrestler", {
        teamName: teamName,
        wrestlerName: wrestlerName
      })
      .then((response) => {
        alert(response.data.message);
        setAvailableWrestlers((prevWrestlers) =>
          prevWrestlers.filter((wrestler) => wrestler !== wrestlerName)
        );
      })
      .catch((error) => {
        console.error("Error adding wrestler:", error);
        alert("There was an error adding the wrestler.");
      });
  };

  return (
    <div className="container">
      <h2>Available Wrestlers</h2>
      <div className="wrestler-list">
        {availableWrestlers.length === 0 ? (
          <p>No available wrestlers at the moment.</p>
        ) : (
          availableWrestlers.map((wrestler, index) => (
            <div className="card" key={index}>
              <div className="card-content">
                <h4>{wrestler}</h4>
                <button className="add-button" onClick={() => handleAddWrestler(wrestler)}>
                  Add
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableWrestlers;