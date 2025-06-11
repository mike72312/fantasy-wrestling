import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [roster, setRoster] = useState([]);
  const [availableWrestlers, setAvailableWrestlers] = useState([]);
  const teamName = localStorage.getItem('teamName');

  useEffect(() => {
    if (teamName) {
      axios
        .get(`https://wrestling-backend2.onrender.com/api/roster/${teamName}`)
        .then((response) => {
          setRoster(response.data);
        })
        .catch((error) => {
          console.error("Error fetching team roster:", error);
          alert("There was an error fetching the team roster.");
        });

      axios
        .get("https://wrestling-backend2.onrender.com/api/availableWrestlers")
        .then((response) => {
          setAvailableWrestlers(response.data);
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
      .post("https://wrestling-backend2.onrender.com/api/dropWrestler", {
        teamName: teamName,
        wrestlerName: wrestlerName
      })
      .then((response) => {
        alert(response.data.message);
        setRoster((prevRoster) =>
          prevRoster.filter((wrestler) => wrestler.wrestler_name !== wrestlerName)
        );
        setAvailableWrestlers((prevAvailable) => [
          ...prevAvailable,
          { wrestler_name: wrestlerName, points: 0 }
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
                <h4>
                  <Link to={`/wrestler/${encodeURIComponent(wrestler.wrestler_name)}`}>
                    {wrestler.wrestler_name}
                  </Link> — {wrestler.points} pts
                </h4>
                <button onClick={() => handleDropWrestler(wrestler.wrestler_name)}>
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
