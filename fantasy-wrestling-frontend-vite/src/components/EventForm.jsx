const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route is working" });
});

// Get available wrestlers (not on a team)
app.get("/api/availableWrestlers", async (req, res) => {
  try {
    const query = `
      SELECT wrestler_name, brand, points
      FROM wrestlers
      WHERE team_id IS NULL;
    `;
    const result = await pool.query(query);
    res.json(result.rows); // ✅ Send full objects
  } catch (err) {
    console.error("Error fetching available wrestlers:", err);
    res.status(500).send("Error fetching available wrestlers");
  }
});

// Get roster for a specific team
app.get("/api/roster/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const teamRes = await pool.query(
      "SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", 
      [teamName]
    );
    if (teamRes.rows.length === 0) return res.status(404).send("Team not found.");

    const teamId = teamRes.rows[0].id;
    const rosterRes = await pool.query(
      "SELECT wrestler_name, points FROM wrestlers WHERE team_id = $1",
      [teamId]
    );
    res.json(rosterRes.rows);
  } catch (err) {
    console.error("Error fetching team roster:", err);
    res.status(500).send("Error fetching team roster.");
  }
});

// Add a wrestler to a team
app.post("/api/addWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  try {
    const teamRes = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const teamId = teamRes.rows[0].id;
    await pool.query("UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2 AND team_id IS NULL", [teamId, wrestlerName]);
    res.json({ message: `${wrestlerName} added to ${teamName}` });
  } catch (err) {
    console.error("Error adding wrestler:", err);
    res.status(500).json({ error: "Error adding wrestler" });
  }
});

// Drop a wrestler from a team
app.post("/api/dropWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  try {
    const teamRes = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const teamId = teamRes.rows[0].id;
    await pool.query("UPDATE wrestlers SET team_id = NULL WHERE wrestler_name = $1 AND team_id = $2", [wrestlerName, teamId]);
    res.json({ message: `${wrestlerName} dropped from ${teamName}` });
  } catch (err) {
    console.error("Error dropping wrestler:", err);
    res.status(500).json({ error: "Error dropping wrestler" });
  }
});

// Get team points
app.get("/api/teamPoints/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const result = await pool.query(`
      SELECT SUM(points) AS total_points
      FROM wrestlers
      WHERE team_id = (SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1))
    `, [teamName]);
    res.json({ team: teamName, points: result.rows[0].total_points || 0 });
  } catch (err) {
    console.error("Error fetching team points:", err);
    res.status(500).json({ error: "Error fetching team points" });
  }
});

// Propose a trade
app.post("/api/proposeTrade", async (req, res) => {
  const { offeringTeam, receivingTeam, offeredWrestler, requestedWrestler } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO trade_proposals (offering_team, receiving_team, offered_wrestler, requested_wrestler, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *;
    `, [offeringTeam, receivingTeam, offeredWrestler, requestedWrestler]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error proposing trade:", err);
    res.status(500).json({ error: "Failed to propose trade." });
  }
});

// Get all trades
app.get("/api/trades", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM trade_proposals ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).json({ error: "Failed to fetch trades." });
  }
});

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transactions ORDER BY timestamp DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// Import Event
app.post("/api/importEvent", async (req, res) => {
  const { html, event_name, event_date } = req.body;

  if (!html || !event_name || !event_date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const $ = cheerio.load(html);
    const results = [];

    $(".match").each((i, el) => {
      const winner = $(el).find(".winner").text().trim();
      const losers = $(el).find(".loser").map((i, e) => $(e).text().trim()).get();

      if (winner) {
        results.push({ name: winner, points: 5 });
        for (const loser of losers) {
          results.push({ name: loser, points: -2 });
        }
      }
    });

    for (const result of results) {
      const wrestlerRes = await pool.query(
        `UPDATE wrestlers
         SET points = COALESCE(points, 0) + $1
         WHERE LOWER(wrestler_name) = LOWER($2)
         RETURNING wrestler_name, team_id`,
        [result.points, result.name]
      );

      const updated = wrestlerRes.rows[0];
      if (updated?.team_id) {
        await pool.query(
          `INSERT INTO transactions (team_name, action, wrestler_name, timestamp)
           VALUES (
             (SELECT team_name FROM teams WHERE id = $1),
             'score',
             $2,
             NOW()
           )`,
          [updated.team_id, updated.wrestler_name]
        );
      }
    }

    res.json({ message: `Event '${event_name}' imported successfully.` });
  } catch (err) {
    console.error("Error importing event:", err);
    res.status(500).json({ error: "Failed to process event" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default EventForm;