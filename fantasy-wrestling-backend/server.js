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

// Import event results and update points
app.post("/api/importEvent", async (req, res) => {
  const { html, url, event_name, event_date } = req.body;

  if (!event_name || !event_date) {
    return res.status(400).json({ error: "Missing event name or date" });
  }

  let eventHtml = html;

  if (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch URL");
      eventHtml = await response.text();
    } catch (err) {
      console.error("❌ Error fetching URL:", err);
      return res.status(500).json({ error: "Failed to fetch event HTML from URL" });
    }
  }

  if (!eventHtml) {
    return res.status(400).json({ error: "No HTML provided or fetched" });
  }

  try {
    const $ = cheerio.load(eventHtml);
    const wrestlerPoints = {};

    $(".result").each((_, el) => {
      const text = $(el).text().trim();

      const winMatch = text.match(/^(.+?) defeated (.+?) via/);
      const drawMatch = text.match(/^(.+?) fought (.+?) to a draw/i);
      const titleMatch = /title/i.test(text);
      const isElimination = /eliminated/i.test(text);
      const pinfall = /pinfall/i.test(text);
      const submission = /submission/i.test(text);
      const signatureMoves = (text.match(/signature move/gi) || []).length;
      const special = /confronts|returns|cash-in|turns|debuts/i.test(text);
      const titleChange = /new champion/i.test(text);

      if (winMatch) {
        const winner = winMatch[1].trim();
        const loser = winMatch[2].trim();
        wrestlerPoints[winner] = (wrestlerPoints[winner] || 0) + 5;
        if (titleMatch) wrestlerPoints[winner] += 7;
        if (pinfall || submission) wrestlerPoints[winner] += 3;
        if (titleChange) wrestlerPoints[winner] += 10;
        if (signatureMoves) wrestlerPoints[winner] += 2 * signatureMoves;
        if (special) wrestlerPoints[winner] += 5;

        wrestlerPoints[loser] = (wrestlerPoints[loser] || 0) - 2;
      } else if (drawMatch) {
        const wrestler1 = drawMatch[1].trim();
        const wrestler2 = drawMatch[2].trim();
        wrestlerPoints[wrestler1] = (wrestlerPoints[wrestler1] || 0) + 2;
        wrestlerPoints[wrestler2] = (wrestlerPoints[wrestler2] || 0) + 2;
      }

      const eliminationMatches = text.match(/(.+?) eliminated (.+?)$/i);
      if (eliminationMatches) {
        const eliminator = eliminationMatches[1].trim();
        wrestlerPoints[eliminator] = (wrestlerPoints[eliminator] || 0) + 3;
      }
    });

    const summary = [];

    for (const [name, points] of Object.entries(wrestlerPoints)) {
      const wrestlerRes = await pool.query(
        "SELECT id, team_id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
        [name.toLowerCase()]
      );
      if (wrestlerRes.rows.length === 0) continue;

      const { id: wrestlerId, team_id } = wrestlerRes.rows[0];

      // 1. Update total points in wrestlers table
      await pool.query("UPDATE wrestlers SET points = points + $1 WHERE id = $2", [points, wrestlerId]);

      // 2. Log event points in event_points table
      await pool.query(
        `INSERT INTO event_points (wrestler_id, team_id, event_name, event_date, points)
         VALUES ($1, $2, $3, $4, $5)`,
        [wrestlerId, team_id, event_name, event_date, points]
      );

      summary.push({ wrestler: name, points });
    }

    res.json({ message: "Event imported and points updated", updated: summary.length, details: summary });
  } catch (err) {
    console.error("❌ Error processing event:", err);
    res.status(500).json({ error: "Error processing event" });
  }
});

app.get("/api/eventPoints/wrestler/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const wrestlerRes = await pool.query(
      "SELECT id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
      [name.toLowerCase()]
    );
    if (wrestlerRes.rows.length === 0) return res.status(404).json({ error: "Wrestler not found" });

    const wrestlerId = wrestlerRes.rows[0].id;
    const result = await pool.query(
      `SELECT event_name, event_date, points, teams.team_name
       FROM event_points
       LEFT JOIN teams ON event_points.team_id = teams.id
       WHERE wrestler_id = $1
       ORDER BY event_date DESC`,
      [wrestlerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching event points:", err);
    res.status(500).json({ error: "Error fetching event points" });
  }
});

app.get("/api/eventPoints/team/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const teamRes = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName.toLowerCase()]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const teamId = teamRes.rows[0].id;
    const result = await pool.query(`
      SELECT ep.event_name, ep.event_date, ep.points, w.wrestler_name
      FROM event_points ep
      JOIN wrestlers w ON ep.wrestler_id = w.id
      WHERE ep.team_id = $1
      ORDER BY ep.event_date DESC
    `, [teamId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching team event points:", err);
    res.status(500).json({ error: "Error fetching team event points" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});