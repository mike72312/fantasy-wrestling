const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// 🛡️ CORS Configuration
const corsOptions = {
  origin: "https://wrestling-frontend2.onrender.com", // Replace with your frontend URL
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight for all routes before route definitions

app.use(express.json());

// PostgreSQL connection using Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
});

// Get all available wrestlers (not on a team)
app.get("/api/availableWrestlers", async (req, res) => {
  try {
    const query = `
      SELECT wrestler_name
      FROM wrestlers
      WHERE team_id IS NULL;
    `;
    const result = await pool.query(query);
    res.json(result.rows.map((row) => row.wrestler_name));
  } catch (err) {
    console.error("Error fetching available wrestlers:", err);
    res.status(500).send("Error fetching available wrestlers.");
  }
});

// Get all teams
app.get("/api/teams", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, team_name FROM teams");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).send("Error fetching teams.");
  }
});

// Add a wrestler to a team
app.post("/api/addWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  if (!teamName || !wrestlerName) {
    return res.status(400).send("Team name or wrestler name is missing.");
  }

  try {
    // Check if the wrestler is available
    const available = await pool.query(
      `SELECT * FROM wrestlers WHERE wrestler_name = $1 AND team_id IS NULL`,
      [wrestlerName]
    );
    if (available.rows.length === 0) {
      return res.status(400).send("Wrestler is already assigned or doesn't exist.");
    }

    // Get the team ID
    const teamRes = await pool.query(
      `SELECT id FROM teams WHERE team_name = $1`,
      [teamName]
    );
    if (teamRes.rows.length === 0) {
      return res.status(400).send("Team does not exist.");
    }

    const teamId = teamRes.rows[0].id;

    // Assign wrestler to team
    await pool.query(
      `UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2`,
      [teamId, wrestlerName]
    );

    // Log the transaction
    await pool.query(
      `INSERT INTO transactions (wrestler_name, team_name, action) VALUES ($1, $2, 'add')`,
      [wrestlerName, teamName]
    );

    res.json({ message: `Wrestler ${wrestlerName} added to team ${teamName}.` });
  } catch (err) {
    console.error("Error adding wrestler:", err);
    res.status(500).send("Error adding wrestler to the team.");
  }
});

// Drop a wrestler from a team
app.post("/api/dropWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  if (!teamName || !wrestlerName) {
    return res.status(400).send("Team name or wrestler name is missing.");
  }

  try {
    const teamRes = await pool.query(
      `SELECT id FROM teams WHERE team_name = $1`,
      [teamName]
    );
    if (teamRes.rows.length === 0) {
      return res.status(400).send("Team does not exist.");
    }

    const teamId = teamRes.rows[0].id;

    // Drop the wrestler from the team
    const dropRes = await pool.query(
      `UPDATE wrestlers SET team_id = NULL WHERE wrestler_name = $1 AND team_id = $2`,
      [wrestlerName, teamId]
    );

    if (dropRes.rowCount === 0) {
      return res.status(400).send("Wrestler not found on this team's roster.");
    }

    // Log the transaction
    await pool.query(
      `INSERT INTO transactions (wrestler_name, team_name, action) VALUES ($1, $2, 'drop')`,
      [wrestlerName, teamName]
    );

    res.json({ message: `Wrestler ${wrestlerName} dropped from team ${teamName}.` });
  } catch (err) {
    console.error("Error dropping wrestler:", err);
    res.status(500).send("Error dropping wrestler from the team.");
  }
});

// Get roster for a specific team
app.get("/api/roster/:teamName", async (req, res) => {
  const teamName = req.params.teamName;
  try {
    const teamRes = await pool.query(
      "SELECT id FROM teams WHERE team_name = $1",
      [teamName]
    );
    if (teamRes.rows.length === 0) {
      return res.status(404).send("Team not found.");
    }
    const teamId = teamRes.rows[0].id;
    const rosterRes = await pool.query(
      "SELECT wrestler_name FROM wrestlers WHERE team_id = $1",
      [teamId]
    );
    if (rosterRes.rows.length === 0) {
      return res.status(404).send("Team roster not found.");
    }
    res.json(rosterRes.rows.map((r) => r.wrestler_name));
  } catch (err) {
    console.error("Error fetching team roster:", err);
    res.status(500).send("Error fetching team roster.");
  }
});

// Get all add/drop transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const query = `
      SELECT wrestler_name, team_name, action, timestamp
      FROM transactions
      ORDER BY timestamp DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).send("Error fetching transactions");
  }
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});