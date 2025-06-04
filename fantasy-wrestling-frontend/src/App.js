import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const storedTeam = localStorage.getItem("teamName");
    if (storedTeam) {
      setTeam(storedTeam);
    }
  }, []);

  const handleLogin = (name) => {
    setTeam(name);
    localStorage.setItem("teamName", name); 
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            team ? (
              <RosterPage team={team} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

function LoginPage({ onLogin }) {
  const [teamName, setTeamName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(teamName);
  };

  return (
    <div>
      <h2>Login to Your Team</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function RosterPage({ team }) {
  return <div>Welcome {team}, this is your roster page!</div>;
}

export default App;
