import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState([]);

  // UseEffect to retrieve logged-in team name from localStorage
  useEffect(() => {
    const storedTeamName = localStorage.getItem('teamName');
    if (storedTeamName) {
      setTeamName(storedTeamName);
    }

    // Fetch roster based on the logged-in team name
    if (storedTeamName) {
      axios
        .get(`http://localhost:5000/api/roster/${storedTeamName}`)
        .then((response) => {
          setRoster(response.data);  // Set the team's roster
        })
        .catch((error) => {
          console.error("Error fetching roster:", error);
        });
    }
  }, []);

  return (
    <div>
      <h2>Welcome to the Fantasy Wrestling League!</h2>
      {teamName ? (
        <>
          <h3>You are logged in as: {teamName}</h3>
          <h4>Your Roster:</h4>
          <ul>
            {roster.length === 0 ? (
              <li>Your roster is empty.</li>
            ) : (
              roster.map((wrestler, index) => (
                <li key={index}>{wrestler}</li>
              ))
            )}
          </ul>
        </>
      ) : (
        <p>Please log in to see your team and roster.</p>
      )}
    </div>
  );
};

export default Home;