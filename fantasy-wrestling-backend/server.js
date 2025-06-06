const express = require("express");
const cors = require("cors");
const mysql = require("mysql2"); // Import mysql2
const app = express();
const port = 5000;

// Enable CORS for frontend access
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",        // Your MySQL server hostname
  user: "root",             // Your MySQL username
  password: "mike723",     // Your MySQL password
  database: "fantasy_wrestling"  // Your MySQL database name
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Endpoint to get the list of all available wrestlers (those not on a team)
app.get("/api/availableWrestlers", (req, res) => {
  const query = `
    SELECT w.wrestler_name
    FROM wrestlers w
    LEFT JOIN teams t ON w.team_id = t.id
    WHERE w.team_id IS NULL;
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching available wrestlers:", err);
      return res.status(500).send("Error fetching available wrestlers.");
    }
    
    console.log("Results from query:", results);  // Log the results before mapping
    const availableWrestlers = results.map(row => row.wrestler_name);
    
    // Check if availableWrestlers is being correctly populated
    console.log("Available Wrestlers:", availableWrestlers);  // Log the final array
    
    res.json(availableWrestlers);
  });
});

// Endpoint to get all teams (to display in the dropdown for team selection)
app.get("/api/teams", (req, res) => {
  const query = "SELECT id, team_name FROM teams";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching teams.");
    }

    res.json(results); // Return all teams
  });
});

// Add a wrestler to a team
app.post("/api/roster/add", (req, res) => {
  const { wrestlerName, teamName } = req.body;

  if (!wrestlerName || !teamName) {
    return res.status(400).send("Missing wrestler name or team name.");
  }

app.get("/api/roster/:teamName", (req, res) => {
  const { teamName } = req.params;  // Get the team name from the URL parameter
  
  const query = `
    SELECT w.wrestler_name 
    FROM wrestlers w
    JOIN teams t ON w.team_id = t.id
    WHERE t.team_name = ?;
  `;
  
  db.query(query, [teamName], (err, results) => {
    if (err) {
      console.error("Error fetching team roster:", err);
      return res.status(500).send("Error fetching team roster.");
    }
    
    // Map the results to an array of wrestler names
    const roster = results.map(row => row.wrestler_name);
    res.json(roster);  // Return the roster data to the frontend
  });
});

// Add wrestler to a team's roster
app.post("/api/addWrestler", (req, res) => {
  const { teamName, wrestlerName } = req.body;

  // Ensure that the teamName and wrestlerName are provided
  if (!teamName || !wrestlerName) {
    return res.status(400).send("Team name or wrestler name is missing.");
  }

  // Check if the wrestler is available (not assigned to any team)
  const query = `SELECT * FROM wrestlers WHERE wrestler_name = ? AND team_id IS NULL`;

  db.query(query, [wrestlerName], (err, results) => {
    if (err) {
      console.error("Error checking wrestler availability:", err);
      return res.status(500).send("Error checking wrestler availability.");
    }

    if (results.length === 0) {
      return res.status(400).send("Wrestler is either already assigned or doesn't exist.");
    }

    // Assign the wrestler to the team
    const updateQuery = `
      UPDATE wrestlers
      SET team_id = (SELECT id FROM teams WHERE team_name = ?)
      WHERE wrestler_name = ?
    `;

    db.query(updateQuery, [teamName, wrestlerName], (err, updateResults) => {
      if (err) {
        console.error("Error adding wrestler to team:", err);
        return res.status(500).send("Error adding wrestler to the team.");
      }

      res.json({ message: `Wrestler ${wrestlerName} added to team ${teamName}.` });
    });
  });
});

  // Find the team ID from the team name
  const teamQuery = `SELECT id FROM teams WHERE team_name = ?`;
  db.query(teamQuery, [teamName], (err, teamResults) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching team data.");
    }

    if (teamResults.length === 0) {
      return res.status(404).send("Team not found.");
    }

    const teamId = teamResults[0].id;

    // Find the wrestler ID from the wrestler name
    const wrestlerQuery = `SELECT id FROM wrestlers WHERE name = ?`;
    db.query(wrestlerQuery, [wrestlerName], (err, wrestlerResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching wrestler data.");
      }

      if (wrestlerResults.length === 0) {
        return res.status(404).send("Wrestler not found.");
      }

      const wrestlerId = wrestlerResults[0].id;

      // Update the wrestler's team ID to the new team ID
      const updateQuery = `UPDATE wrestlers SET team_id = ? WHERE id = ?`;
      db.query(updateQuery, [teamId, wrestlerId], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error adding wrestler to team.");
        }

        res.status(200).send(`${wrestlerName} has been added to the ${teamName} team.`);
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});