const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Example data for rosters
let availableWrestlers = [
  { id: 1, name: "John Cena" },
  { id: 2, name: "Roman Reigns" },
  { id: 3, name: "Becky Lynch" },
  { id: 4, name: "Seth Rollins" }
];

let teams = {
  "Team A": ["John Cena", "Roman Reigns"],
  "Team B": ["Becky Lynch", "Seth Rollins"]
};

// Endpoint to get available wrestlers
app.get("/api/availableWrestlers", (req, res) => {
  const usedWrestlers = Object.values(teams).flat();
  const available = availableWrestlers.filter(
    (wrestler) => !usedWrestlers.includes(wrestler.name)
  );
  res.json(available);
});

// Endpoint to get a team's roster
app.get("/api/roster/:team", (req, res) => {
  const teamName = req.params.team;
  const roster = teams[teamName] || [];
  res.json(roster);
});

// Endpoint to add a wrestler to a team
app.post("/api/addWrestler", (req, res) => {
  const { team, wrestler } = req.body;
  if (!teams[team]) {
    teams[team] = [];
  }
  if (!teams[team].includes(wrestler)) {
    teams[team].push(wrestler);
    res.status(200).send("Wrestler added!");
  } else {
    res.status(400).send("Wrestler already on the team.");
  }
});

// Endpoint to drop a wrestler from a team
app.post("/api/dropWrestler", (req, res) => {
  const { team, wrestler } = req.body;
  if (teams[team]) {
    const index = teams[team].indexOf(wrestler);
    if (index !== -1) {
      teams[team].splice(index, 1);
      res.status(200).send("Wrestler dropped!");
    } else {
      res.status(400).send("Wrestler not found on the team.");
    }
  } else {
    res.status(400).send("Team not found.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
