import React, { useEffect, useState } from "react";

const Home = () => {
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("teamName");
    if (stored) setTeamName(stored);
  }, []);

  return (
    <div className="container">
      <h1>Fantasy Wrestling League</h1>
      {teamName ? (
        <p>Welcome, {teamName}! You can view your <a href={`/roster/${encodeURIComponent(teamName)}`}>roster here</a>.</p>
      ) : (
        <p>Please log in or select a team to get started.</p>
      )}
    </div>
  );
};

export default Home;
