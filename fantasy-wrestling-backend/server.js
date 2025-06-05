const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;

// Enable CORS for frontend access
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Sample in-memory data for teams and wrestlers
let teams = {
  Mike: {
    roster: ["AJ Styles", "Seth Rollins", "Finn Bálor"],
    totalPoints: 0
  },
  Jon: {
    roster: ["Rhea Ripley", "Liv Morgan", "Sami Zayn"],
    totalPoints: 0
  },
  Buddy: {
    roster: ["CM Punk", "Rey Mysterio", "Kofi Kingston"],
    totalPoints: 0
  },
  Sully: {
    roster: ["Logan Paul", "Tyler Bate", "Xavier Woods"],
    totalPoints: 0
  }
};

let wrestlers = {
  "AJ Styles": {
    points: 0
  },
  "Seth Rollins": {
    points: 0
  },
  "Finn Bálor": {
    points: 0
  },
  "Rhea Ripley": {
    points: 0
  },
  "Liv Morgan": {
    points: 0
  },
  "Sami Zayn": {
    points: 0
  },
  "CM Punk": {
    points: 0
  },
  "Rey Mysterio": {
    points: 0
  },
  "Kofi Kingston": {
    points: 0
  },
  "Logan Paul": {
    points: 0
  },
  "Tyler Bate": {
    points: 0
  },
  "Xavier Woods": {
    points: 0
  }
};

// Endpoint to get the list of all available wrestlers
app.get("/api/availableWrestlers", (req, res) => {
  const available = Object.keys(wrestlers).filter(
    (wrestler) => !Object.values(teams).some((team) => team.roster.includes(wrestler))
  );
  res.json(available);
});

// Endpoint to get all team rosters
app.get("/api/allRosters", (req, res) => {
  const allRosters = Object.keys(teams).map((teamName) => ({
    team: teamName,
    roster: teams[teamName].roster
  }));
  res.json(allRosters);
});

// Endpoint to add points to a wrestler's score
app.post("/api/addPoints", (req, res) => {
  const { wrestler, points } = req.body;

  if (!wrestlers[wrestler]) {
    return res.status(404).json({ error: "Wrestler not found" });
  }

  wrestlers[wrestler].points += points;

  for (let teamName in teams) {
    if (teams[teamName].roster.includes(wrestler)) {
      teams[teamName].totalPoints += points;
    }
  }

  res.json({ message: "Points added successfully" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});