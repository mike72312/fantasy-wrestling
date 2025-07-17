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

// Get team roster
app.get("/api/roster/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const teamRes = await pool.query(
      "SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)",
      [teamName]
    );
    if (teamRes.rows.length === 0) return res.status(404).send("Team not found.");

    const teamId = teamRes.rows[0].id;
    const result = await pool.query(
      "SELECT wrestler_name, points FROM wrestlers WHERE team_id = $1 ORDER BY wrestler_name",
      [teamId]
    );
    res.json(result.rows);
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

// ✅ Propose a trade
app.post("/api/proposeTrade", async (req, res) => {
  const { offeringTeam, receivingTeam, offeredWrestlers, requestedWrestlers } = req.body;
  if (!offeringTeam || !receivingTeam || !Array.isArray(offeredWrestlers) || !Array.isArray(requestedWrestlers)) {
    return res.status(400).json({ error: "Invalid trade proposal payload" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO trade_proposals (offering_team, receiving_team, offered_wrestlers, requested_wrestlers, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *;
    `, [offeringTeam, receivingTeam, offeredWrestlers, requestedWrestlers]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error proposing trade:", err);
    res.status(500).json({ error: "Failed to propose trade." });
  }
});

// ✅ Respond to a trade (accept or reject)
app.post("/api/trades/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const tradeRes = await pool.query("SELECT * FROM trade_proposals WHERE id = $1", [id]);
    if (tradeRes.rows.length === 0) return res.status(404).json({ error: "Trade not found" });

    const trade = tradeRes.rows[0];

    if (action === "accept") {
      // Get team IDs
      const sendTeam = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [trade.offering_team]);
      const recvTeam = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [trade.receiving_team]);
      if (sendTeam.rows.length === 0 || recvTeam.rows.length === 0) return res.status(400).json({ error: "Invalid team" });

      const sendTeamId = sendTeam.rows[0].id;
      const recvTeamId = recvTeam.rows[0].id;

      for (const name of trade.offered_wrestlers) {
        await pool.query("UPDATE wrestlers SET team_id = $1 WHERE LOWER(wrestler_name) = LOWER($2)", [recvTeamId, name]);
        await pool.query("INSERT INTO transactions (wrestler_name, team_name, action, timestamp) VALUES ($1, $2, 'trade_out', NOW())", [name, trade.offering_team]);
      }

      for (const name of trade.requested_wrestlers) {
        await pool.query("UPDATE wrestlers SET team_id = $1 WHERE LOWER(wrestler_name) = LOWER($2)", [sendTeamId, name]);
        await pool.query("INSERT INTO transactions (wrestler_name, team_name, action, timestamp) VALUES ($1, $2, 'trade_out', NOW())", [name, trade.receiving_team]);
      }

      await pool.query("UPDATE trade_proposals SET status = 'accepted', responded_at = NOW() WHERE id = $1", [id]);
      res.json({ message: "Trade accepted and processed." });
    } else if (action === "reject") {
      await pool.query("UPDATE trade_proposals SET status = 'rejected', responded_at = NOW() WHERE id = $1", [id]);
      res.json({ message: "Trade rejected." });
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("Error processing trade response:", err);
    res.status(500).json({ error: "Failed to process trade response." });
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

// Import event results and update points from raw text
app.post("/api/importEvent", async (req, res) => {
  const { rawText, event_name, event_date } = req.body;

  if (!rawText || !event_name || !event_date) {
    return res.status(400).json({ error: "Missing event name, date, or raw text" });
  }

  try {
    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
    let mode = null;
    const eventDetails = [];

    for (const line of lines) {
      const normalized = line.replace(/\s+/g, " ").trim();

      if (/^matches$/i.test(normalized)) {
        mode = "matches";
        continue;
      } else if (/^bonus points$/i.test(normalized)) {
        mode = "bonus";
        continue;
      }

      if (mode === "matches") {
        const matchRegex = /^(.+?) (\d+) pts/i;
        const match = normalized.match(matchRegex);
        if (match) {
          const name = match[1].trim();
          const points = parseInt(match[2]);
          const description = normalized.split("pts")[1].trim();
          eventDetails.push({ name, points, description });
        }
      } else if (mode === "bonus") {
        const bonusRegex = /^(.+?) — (\d+) pts — (.+)$/i;
        const match = normalized.match(bonusRegex);
        if (match) {
          const name = match[1].trim();
          const points = parseInt(match[2]);
          const description = match[3].trim();
          eventDetails.push({ name, points, description });
        }
      }
    }

    if (eventDetails.length === 0) {
      return res.status(400).json({ error: "No valid matches or bonus points found." });
    }

    const summary = [];
    for (const detail of eventDetails) {
      const { name, points, description } = detail;

      const wrestlerRes = await pool.query(
        "SELECT id, team_id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
        [name.toLowerCase()]
      );
      if (wrestlerRes.rows.length === 0) continue;

      const { id: wrestlerId, team_id } = wrestlerRes.rows[0];

      await pool.query("UPDATE wrestlers SET points = points + $1 WHERE id = $2", [points, wrestlerId]);

      await pool.query(
        `INSERT INTO event_points (wrestler_id, team_id, event_name, event_date, points, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [wrestlerId, team_id, event_name, event_date, points, description]
      );

      summary.push({ wrestler: name, points, description });
    }

    res.json({
      message: "✅ Event imported and points updated",
      updated: summary.length,
      details: summary
    });
  } catch (err) {
    console.error("❌ Error processing event:", err);
    res.status(500).json({ error: "Error processing event" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});