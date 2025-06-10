const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Test Route
app.get("/test", (req, res) => {
  res.json({ message: "Test route is working" });
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// PostgreSQL connection (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Get all available wrestlers (not on a team)
app.get("/api/availableWrestlers", async (req, res) => {
  try {
    const query = `
      SELECT wrestler_name, points
      FROM wrestlers
      WHERE team_id IS NULL;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching available wrestlers:", err);
    res.status(500).send("Error fetching available wrestlers.");
  }
});

// ✅ Get transaction log
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wrestler_name, team_name, action, timestamp
      FROM transactions
      ORDER BY timestamp DESC
      LIMIT 100;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).send("Error fetching transactions.");
  }
});

// ✅ Get all teams
app.get("/api/teams", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, team_name FROM teams");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).send("Error fetching teams.");
  }
});

// ✅ Add a wrestler to a team
app.post("/api/addWrestler", async (req, res) => {
  const { team_name, wrestler_name } = req.body;
  console.log("📩 Received POST /api/addWrestler:", req.body);

  if (!team_name || !wrestler_name) {
    return res.status(400).send("Team name or wrestler name is missing.");
  }

  try {
    // Log all currently available wrestlers
    const debugAvailable = await pool.query(
      `SELECT wrestler_name FROM wrestlers WHERE team_id IS NULL`
    );
    console.log("🧪 Available wrestlers:", debugAvailable.rows.map(r => r.wrestler_name));

    // Use case-insensitive match for wrestler_name
    const available = await pool.query(
      `SELECT * FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1) AND team_id IS NULL`,
      [wrestler_name]
    );
    if (available.rows.length === 0) {
      return res.status(400).send("Wrestler is already assigned or doesn't exist.");
    }

    const teamRes = await pool.query(
      `SELECT id FROM teams WHERE team_name = $1`,
      [team_name]
    );
    if (teamRes.rows.length === 0) {
      return res.status(400).send("Team does not exist.");
    }

    const teamId = teamRes.rows[0].id;

    await pool.query(
      `UPDATE wrestlers SET team_id = $1 WHERE LOWER(wrestler_name) = LOWER($2)`,
      [teamId, wrestler_name]
    );

    await pool.query(
      `INSERT INTO transactions (wrestler_name, team_name, action) VALUES ($1, $2, 'add')`,
      [wrestler_name, team_name]
    );

    res.json({ message: `Wrestler ${wrestler_name} added to team ${team_name}.` });
  } catch (err) {
    console.error("Error adding wrestler:", err);
    res.status(500).send("Error adding wrestler to the team.");
  }
});

// ✅ Drop a wrestler from a team
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

    const dropRes = await pool.query(
      `UPDATE wrestlers SET team_id = NULL WHERE LOWER(wrestler_name) = LOWER($1) AND team_id = $2`,
      [wrestlerName, teamId]
    );

    if (dropRes.rowCount === 0) {
      return res.status(400).send("Wrestler not found on this team's roster.");
    }

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

// ✅ Get roster for a specific team
app.get("/api/roster/:teamName", async (req, res) => {
  const { teamName } = req.params;
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

    res.json(rosterRes.rows.map(r => r.wrestler_name));
  } catch (err) {
    console.error("Error fetching team roster:", err);
    res.status(500).send("Error fetching team roster.");
  }
});

// Get team standings (include teams with zero points)
app.get("/api/standings", async (req, res) => {
  try {
    const query = `
      SELECT t.name AS team_name, COALESCE(SUM(w.points), 0) AS score
      FROM teams t
      LEFT JOIN wrestlers w ON w.team_id = t.id
      GROUP BY t.name
      ORDER BY score DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
  console.error("Error fetching standings:", err);
  res.status(500).json({ error: "Error fetching standings" });
  }
});

// ✅ Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});