import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const [roster, setRoster] = useState([]);
  const [availableWrestlers, setAvailableWrestlers] = useState([]);
  const teamName = localStorage.getItem('teamName');  // Get the team name from localStorage

  useEffect(() => {
    if (teamName) {
      // Fetch the team roster
      axios
        .get(`http://localhost:5000/api/roster/${teamName}`)
        .then((response) => {
          setRoster(response.data);  // Set the roster data
        })
        .catch((error) => {
          console.error("Error fetching team roster:", error);
          alert("There was an error fetching the team roster.");
        });

      // Fetch the available wrestlers
      axios
        .get("http://localhost:5000/api/availableWrestlers")
        .then((response) => {
          setAvailableWrestlers(response.data);  // Set available wrestlers
        })
        .catch((error) => {
          console.error("Error fetching available wrestlers:", error);
          alert("There was an error fetching available wrestlers.");
        });
    } else {
      alert("Please log in to view your team roster.");
    }
  }, [teamName]);

  const handleDropWrestler = (wrestlerName) => {
    const teamName = localStorage.getItem('teamName');

    if (!teamName) {
      alert("You need to be logged in to drop a wrestler.");
      return;
    }

    axios
      .post("http://localhost:5000/api/dropWrestler", {
        teamName: teamName,
        wrestlerName: wrestlerName
      })
      .then((response) => {
        alert(response.data.message);
        // Update the UI by removing the dropped wrestler
        setRoster((prevRoster) =>
          prevRoster.filter((wrestler) => wrestler !== wrestlerName)
        );
        // Add the dropped wrestler back to the available pool
        setAvailableWrestlers((prevAvailable) => [
          ...prevAvailable,
          wrestlerName
        ]);
      })
      .catch((error) => {
        console.error("Error dropping wrestler:", error);
        alert("There was an error dropping the wrestler.");
      });
  };

  return (
    <div className="container">
      <h2>Your Roster</h2>
      <div className="roster-list">
        {roster.length === 0 ? (
          <p className="empty-roster">Your roster is empty.</p>
        ) : (
          roster.map((wrestler, index) => (
            <div className="card" key={index}>
              <div className="card-content">
                <h4>{wrestler}</h4>
                <button onClick={() => handleDropWrestler(wrestler)}>
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

export default Home;