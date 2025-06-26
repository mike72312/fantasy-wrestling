const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const cheerio = require("cheerio");
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
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching available wrestlers:", err);
    res.status(500).send("Error fetching available wrestlers");
  }
});

// Get teamroster for a specific team
app.get("/api/roster/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const teamRes = await pool.query(
      "SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)",
      [teamName]
    );
    if (teamRes.rows.length === 0) return res.status(404).send("Team not found.");

    const teamId = teamRes.rows[0].id;
    const teamrosterRes = await pool.query(
      "SELECT wrestler_name, points FROM wrestlers WHERE team_id = $1",
      [teamId]
    );
    res.json(teamrosterRes.rows);
  } catch (err) {
    console.error("Error fetching team teamroster:", err);
    res.status(500).send("Error fetching team teamroster.");
  }
});

// Add a wrestler to a team
app.post("/api/addWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  try {
    const teamRes = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const teamId = teamRes.rows[0].id;

    const updateResult = await pool.query(
      "UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2 AND team_id IS NULL",
      [teamId, wrestlerName]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ error: "Wrestler already on a team or not found." });
    }

    await pool.query(
      "INSERT INTO transactions (wrestler_name, team_name, action, timestamp) VALUES ($1, $2, 'add', NOW())",
      [wrestlerName, teamName]
    );

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

    const updateResult = await pool.query(
      "UPDATE wrestlers SET team_id = NULL WHERE wrestler_name = $1 AND team_id = $2",
      [wrestlerName, teamId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ error: "Wrestler not on this team or not found." });
    }

    await pool.query(
      "INSERT INTO transactions (wrestler_name, team_name, action, timestamp) VALUES ($1, $2, 'drop', NOW())",
      [wrestlerName, teamName]
    );

    res.json({ message: `${wrestlerName} dropped from ${teamName}` });
  } catch (err) {
    console.error("Error dropping wrestler:", err);
    res.status(500).json({ error: "Error dropping wrestler" });
  }
});

// Get a specific wrestler by name
app.get("/api/wrestler/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
      [name.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Wrestler not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching wrestler profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/roster/:teamName", async (req, res) => {
  const { teamName } = req.params;

  try {
    const teamRes = await pool.query(
      "SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)",
      [teamName]
    );
    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const teamId = teamRes.rows[0].id;
    const result = await pool.query(
      "SELECT wrestler_name FROM wrestlers WHERE team_id = $1 ORDER BY wrestler_name",
      [teamId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching roster:", err);
    res.status(500).json({ error: "Failed to fetch team roster" });
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

// Get standings
app.get("/api/standings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.team_name, COALESCE(SUM(w.points), 0) AS score
      FROM teams t
      LEFT JOIN wrestlers w ON t.id = w.team_id
      GROUP BY t.team_name
      ORDER BY score DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching standings:", err);
    res.status(500).json({ error: "Failed to fetch standings." });
  }
});

// Import event results
app.post("/api/importEvent", async (req, res) => {
  const { html, event_name, event_date } = req.body;

  if (!html || !event_name || !event_date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const $ = cheerio.load(html);
    const results = [];

    $(".result").each((_, el) => {
      const text = $(el).text().trim();

      // Match pattern like "Becky Lynch defeated Bayley via pinfall"
      const winMatch = text.match(/^(.+?) defeated (.+?) via/);
      const drawMatch = text.match(/^(.+?) fought (.+?) to a draw/i);
      const titleMatch = /title/i.test(text);
      const isElimination = /eliminated/i.test(text);
      const pinfall = /pinfall/i.test(text);
      const submission = /submission/i.test(text);
      const signatureMoves = (text.match(/signature move/gi) || []).length;
      const special = /confronts|returns|cash-in|turns|debuts/i.test(text);

      if (winMatch) {
        const winner = winMatch[1].trim();
        const loser = winMatch[2].trim();
        results.push({ name: winner, points: 5 });
        results.push({ name: loser, points: -2 });

        if (titleMatch) {
          results.find(r => r.name === winner).points += 7;
        }
        if (pinfall || submission) {
          results.find(r => r.name === winner).points += 3;
        }
        if (signatureMoves) {
          results.find(r => r.name === winner).points += signatureMoves * 2;
        }
      } else if (drawMatch) {
        const [one, two] = [drawMatch[1].trim(), drawMatch[2].trim()];
        results.push({ name: one, points: 2 });
        results.push({ name: two, points: 2 });
      } else if (isElimination) {
        const match = text.match(/^(.+?) eliminated/i);
        if (match) {
          results.push({ name: match[1].trim(), points: 3 });
        }
      }

      if (special) {
        const match = text.match(/^(.+?) /);
        if (match) {
          results.push({ name: match[1].trim(), points: 5 });
        }
      }
    });

    // Aggregate points by wrestler
    const pointsMap = {};
    for (const { name, points } of results) {
      const key = name.trim().toLowerCase();
      if (!pointsMap[key]) pointsMap[key] = { name, points: 0 };
      pointsMap[key].points += points;
    }

    // Update wrestlers in the DB
    for (const { name, points } of Object.values(pointsMap)) {
      await pool.query(
        `UPDATE wrestlers SET points = COALESCE(points, 0) + $1 WHERE LOWER(wrestler_name) = LOWER($2)`,
        [points, name]
      );
    }

    res.json({ message: `Event '${event_name}' imported and points updated.` });
  } catch (err) {
    console.error("Error importing event:", err);
    res.status(500).json({ error: "Failed to process event." });
  }
});
// Must be at the very end of server.js
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});