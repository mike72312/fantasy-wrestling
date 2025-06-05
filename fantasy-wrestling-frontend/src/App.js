import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

// List of available wrestlers (Men's and Women's Divisions)
const availableWrestlersList = [
  // Men's Division
  "AJ Styles", "Akira Tozawa", "Austin Theory", "Bron Breakker", "Bronson Reed", "Brutus Creed", "Carlito", "Chad Gable",
  "CM Punk", "Cruz Del Toro", "Dominik Mysterio", "Dragon Lee", "Erik", "Finn Bálor", "Grayson Waller", "Gunther",
  "Ilja Dragunov", "Ivar", "JD McDonagh", "Jey Uso", "Joaquin Wilde", "Julius Creed", "Karrion Kross", "Kofi Kingston",
  "Logan Paul", "Ludwig Kaiser", "Otis", "Penta", "Pete Dunne", "Rey Mysterio", "Rusev", "Sami Zayn", "Seth Rollins",
  "Sheamus", "Tyler Bate", "Xavier Woods",
  
  // Women's Division
  "Asuka", "Bayley", "Becky Lynch", "Ivy Nile", "Iyo Sky", "Kairi Sane", "Kiana James", "Liv Morgan", "Lyra Valkyria",
  "Maxxine Dupri", "Natalya", "Raquel Rodriguez", "Rhea Ripley", "Roxanne Perez", "Scarlett", "Stephanie Vaquer", "Zoey Stark"
];

// Function to generate random points between 0 and 100
const generateRandomPoints = () => Math.floor(Math.random() * 101);

// Navbar Component
function Navbar({ team, onLogout }) {
  return (
    <nav className="navbar">
      <span>Welcome, {team}</span>
      <div>
        <Link to="/" className="highlight-button">Home</Link>
        <Link to="/available-wrestlers" className="highlight-button">Available Wrestlers</Link>
        <Link to="/all-rosters" className="highlight-button">All Team Rosters</Link>
        <Link to="/standings" className="highlight-button">Standings</Link>
      </div>
      <button onClick={onLogout}>Logout</button>
    </nav>
  );
}

function App() {
  const [team, setTeam] = useState(null);
  const [availableWrestlers, setAvailableWrestlers] = useState(availableWrestlersList); // Prepopulate the full list of available wrestlers
  const [roster, setRoster] = useState([]);
  const [points, setPoints] = useState({});
  const [teamTotalPoints, setTeamTotalPoints] = useState(0);
  const [allRosters, setAllRosters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedTeam = localStorage.getItem('teamName');
    if (storedTeam) {
      setTeam(storedTeam);
      loadRosterFromLocalStorage(storedTeam);
      initializeWrestlerPoints();
    }
    fetchAllRosters(); // Fetch all team rosters on initial load
  }, []);

  // Initialize wrestlers with random points
  const initializeWrestlerPoints = () => {
    let wrestlerPoints = {};
    availableWrestlersList.forEach((wrestler) => {
      wrestlerPoints[wrestler] = generateRandomPoints();
    });
    setPoints(wrestlerPoints);
  };

  const loadRosterFromLocalStorage = (teamName) => {
    const storedRoster = JSON.parse(localStorage.getItem(`roster-${teamName}`)) || [];
    setRoster(storedRoster);
    calculateTeamTotalPoints(storedRoster); 
  };

  const fetchAllRosters = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/allRosters");
      const data = await response.json();
      setAllRosters(data); // Set the fetched team rosters from the backend
    } catch (error) {
      console.error("Failed to fetch rosters:", error);
    }
  };

  const handleLogin = (name) => {
    setTeam(name);
    localStorage.setItem('teamName', name);
    loadRosterFromLocalStorage(name);
    initializeWrestlerPoints();
  };

  const handleLogout = () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem(`roster-${team}`);
    setTeam(null);
    setRoster([]);
    setAvailableWrestlers(availableWrestlersList);
    setPoints({});
    setTeamTotalPoints(0);
    navigate('/');
  };

  const handleAddWrestler = async (wrestler) => {
    const newRoster = [...roster, wrestler];
    setRoster(newRoster);
    localStorage.setItem(`roster-${team}`, JSON.stringify(newRoster));
    setAvailableWrestlers(availableWrestlers.filter(w => w !== wrestler));
    calculateTeamTotalPoints(newRoster);
  };

  const handleDropWrestler = async (wrestler) => {
    const newRoster = roster.filter(w => w !== wrestler);
    setRoster(newRoster);
    localStorage.setItem(`roster-${team}`, JSON.stringify(newRoster));
    setAvailableWrestlers([...availableWrestlers, wrestler]);
    calculateTeamTotalPoints(newRoster);
  };

  // New function to handle adding points
  const handleAddPoints = (wrestler) => {
    const pointsToAdd = 10; // Add 10 points for simplicity, can be adjusted
    setPoints((prevPoints) => ({
      ...prevPoints,
      [wrestler]: (prevPoints[wrestler] || 0) + pointsToAdd
    }));

    // Recalculate total points for the team
    const newRoster = [...roster, wrestler];
    calculateTeamTotalPoints(newRoster);
  };

  const calculateTeamTotalPoints = (roster) => {
    const total = roster.reduce((sum, wrestler) => sum + points[wrestler], 0);
    setTeamTotalPoints(total);
  };

  return (
    <div className="container">
      {team && <Navbar team={team} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={team ? <RosterPage roster={roster} onDropWrestler={handleDropWrestler} onAddPoints={handleAddPoints} teamTotalPoints={teamTotalPoints} points={points} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/available-wrestlers" element={team ? <AvailableWrestlers wrestlers={availableWrestlers.filter(w => !roster.includes(w))} onAddWrestler={handleAddWrestler} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/all-rosters" element={<AllRostersPage allRosters={allRosters} />} />
        <Route path="/standings" element={<StandingsPage />} />
      </Routes>
    </div>
  );
}

// All Team Rosters Page
function AllRostersPage({ allRosters }) {
  return (
    <div className="container">
      <h2>All Team Rosters</h2>
      {allRosters.length === 0 ? (
        <p>No team rosters available.</p>
      ) : (
        <ul>
          {allRosters.map((team) => (
            <li key={team.team}>
              <h3>{team.team}'s Roster</h3>
              <ul>
                {team.roster.map((wrestler) => (
                  <li key={wrestler}>{wrestler}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Login Page
function LoginPage({ onLogin }) {
  const [teamName, setTeamName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(teamName);
  };

  return (
    <div className="container">
      <h1>Login to Your Fantasy Wrestling Team</h1>
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

// Roster Page (Home)
function RosterPage({ roster, onDropWrestler, onAddPoints, teamTotalPoints, points }) {
  return (
    <div className="container">
      <h2>Your Roster</h2>
      <p>Total Points: {teamTotalPoints}</p>
      {roster.length === 0 ? (
        <p>Your roster is empty. Please add wrestlers from the available list.</p>
      ) : (
        <ul>
          {roster.map((wrestler) => (
            <li key={wrestler}>
              {wrestler} 
              <span> Points: {points[wrestler] || 0} </span>
              <button onClick={() => onAddPoints(wrestler)}>Add Points</button>
              <button onClick={() => onDropWrestler(wrestler)}>Drop</button>
            </li>
          ))}
        </ul>
      )}
      <Link to="/available-wrestlers">Go to Available Wrestlers</Link>
    </div>
  );
}

// Available Wrestlers Page
function AvailableWrestlers({ wrestlers, onAddWrestler }) {
  return (
    <div className="container">
      <h2>Available Wrestlers</h2>
      {wrestlers.length === 0 ? (
        <p>No available wrestlers at the moment.</p>
      ) : (
        <ul>
          {wrestlers.map((wrestler) => (
            <li key={wrestler}>
              {wrestler} <button onClick={() => onAddWrestler(wrestler)}>Add</button>
            </li>
          ))}
        </ul>
      )}
      <Link to="/">Go to Your Roster</Link>
    </div>
  );
}

// Standings Page
function StandingsPage() {
  const [standings, setStandings] = useState([
    { team: 'Mike', totalPoints: 25 },
    { team: 'Jon', totalPoints: 30 },
    { team: 'Buddy', totalPoints: 15 },
    { team: 'Sully', totalPoints: 20 }
  ]); // Sample data

  return (
    <div className="container">
      <h2>Team Standings</h2>
      <ul>
        {standings.map((team) => (
          <li key={team.team}>
            {team.team}: {team.totalPoints} points
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
