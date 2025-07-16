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
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
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
    const eventDetails = [];

    $(".matchlist .result").each((_, el) => {
      const fullText = $(el).text().trim();
      const winnerLoserMatch = fullText.match(/^(.+?) defeated (.+?) via/);
      const drawMatch = fullText.match(/^(.+?) fought (.+?) to a draw/i);
      const titleMatch = /title/i.test(fullText);
      const eliminations = (fullText.match(/eliminated/gi) || []).length;
      const pinfall = /pinfall/i.test(fullText);
      const submission = /submission/i.test(fullText);
      const signatureMoves = (fullText.match(/signature move/gi) || []).length;
      const special = /confronts|returns|cash-in|turns|debuts/i.test(fullText);
      const desc = fullText.length < 300 ? fullText : "Match Result";

      if (winnerLoserMatch) {
        const winner = winnerLoserMatch[1].trim();
        const loser = winnerLoserMatch[2].trim();
        eventDetails.push({ name: winner, points: 5, description: desc });
        if (titleMatch) {
          eventDetails.push({ name: winner, points: 7, description: "Title Match Win" });
        }
        eventDetails.push({ name: loser, points: -2, description: desc });
      } else if (drawMatch) {
        const name1 = drawMatch[1].trim();
        const name2 = drawMatch[2].trim();
        eventDetails.push({ name: name1, points: 2, description: "Draw" });
        eventDetails.push({ name: name2, points: 2, description: "Draw" });
      }

      if (eliminations) {
        const match = fullText.match(/^(.+?) eliminated/);
        if (match) {
          const name = match[1].trim();
          eventDetails.push({ name, points: 3 * eliminations, description: `${eliminations} Eliminations` });
        }
      }

      if (pinfall || submission) {
        const name = fullText.split(" ")[0].trim();
        const moveDesc = pinfall ? "Pinfall" : "Submission";
        eventDetails.push({ name, points: 3, description: moveDesc });
      }

      if (signatureMoves) {
        const name = fullText.split(" ")[0].trim();
        eventDetails.push({ name, points: 2 * signatureMoves, description: `${signatureMoves} Signature Moves` });
      }

      if (special) {
        const name = fullText.split(" ")[0].trim();
        eventDetails.push({ name, points: 5, description: "Special Appearance" });
      }
    });

    // ✅ Bonus Points section
    $("h2:contains('Bonus Points') + ol > li").each((_, el) => {
      const text = $(el).text().trim();
      const nameMatch = text.match(/^(.+?) — (\d+) pts/i);
      const linkText = $(el).find("a[href^='/OtherPoint']").text().trim();
      const desc = linkText || text.split("—")[1]?.trim() || "Bonus";

      if (nameMatch) {
        const name = nameMatch[1].trim();
        const points = parseInt(nameMatch[2]);
        eventDetails.push({ name, points, description: desc });
      }
    });

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
  `SELECT ep.event_name, ep.event_date, ep.points, t.team_name, ep.description
   FROM event_points ep
   JOIN wrestlers w ON ep.wrestler_id = w.id
   LEFT JOIN teams t ON ep.team_id = t.id
   WHERE LOWER(w.wrestler_name) = LOWER($1)
   ORDER BY ep.event_date DESC`,
  [name]
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

// Get detailed event summary: wrestler points by event
app.get("/api/eventSummary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT event_name, event_date, wrestler_name, team_name, points, description
      FROM event_points
      ORDER BY event_date DESC, event_name, points DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching detailed event summary:", err);
    res.status(500).json({ error: "Failed to fetch event summary" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});