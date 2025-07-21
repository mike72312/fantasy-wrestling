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

// Shared restriction logic
  const isRestrictedTime = async () => {
  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const local = new Date(now);
  const day = local.getDay();
  const hour = local.getHours();

  try {
    const result = await pool.query(`
      SELECT 1 FROM restricted_windows
      WHERE day = $1 AND $2 BETWEEN start_hour AND end_hour - 1
    `, [day, hour]);

    return result.rows.length > 0;
  } catch (err) {
    console.error("Error checking restricted time:", err);
    return false;
  }
};

// League settings: restricted hours
app.get("/api/restrictedWindows", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM restricted_windows ORDER BY day, start_hour");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching restricted windows:", err);
    res.status(500).json({ error: "Failed to fetch restricted windows" });
  }
});

app.post("/api/restrictedWindows", async (req, res) => {
  const { day, start_hour, end_hour } = req.body;

  if (day < 0 || day > 6 || start_hour < 0 || start_hour > 23 || end_hour <= start_hour || end_hour > 24) {
    return res.status(400).json({ error: "Invalid day or hour range" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO restricted_windows (day, start_hour, end_hour) VALUES ($1, $2, $3) RETURNING *",
      [day, start_hour, end_hour]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding restricted window:", err);
    res.status(500).json({ error: "Failed to add restricted window" });
  }
});

app.delete("/api/restrictedWindows/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM restricted_windows WHERE id = $1", [id]);
    res.json({ message: "Restricted window deleted" });
  } catch (err) {
    console.error("Error deleting restricted window:", err);
    res.status(500).json({ error: "Failed to delete restricted window" });
  }
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
      "SELECT wrestler_name, points, starter FROM wrestlers WHERE team_id = $1 ORDER BY wrestler_name",
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

  if (await isRestrictedTime()) {
    return res.status(403).json({ error: "Cannot add wrestler during restricted hours." });
  }

  try {
    const teamRes = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName]);
    if (teamRes.rows.length === 0) {
      return res.status(400).json({ error: "Team not found" });
    }
    const teamId = teamRes.rows[0].id;

    const checkWrestler = await pool.query(
      "SELECT team_id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
      [wrestlerName]
    );
    if (checkWrestler.rows.length === 0) {
      return res.status(400).json({ error: "Wrestler not found" });
    }
    if (checkWrestler.rows[0].team_id !== null) {
      return res.status(403).json({ error: "Wrestler is already on a team" });
    }

    const rosterCountRes = await pool.query(
      "SELECT COUNT(*) FROM wrestlers WHERE team_id = $1",
      [teamId]
    );
    if (parseInt(rosterCountRes.rows[0].count) >= 9) {
      return res.status(403).json({ error: "Team already has 9 wrestlers" });
    }

    await pool.query(
      "UPDATE wrestlers SET team_id = $1, starter = false WHERE LOWER(wrestler_name) = LOWER($2)",
      [teamId, wrestlerName]
    );

    // ✅ Log the transaction
    await pool.query(
      "INSERT INTO transactions (team_name, wrestler_name, action, timestamp) VALUES ($1, $2, 'add', NOW())",
      [teamName, wrestlerName]
    );

    res.json({ message: "Wrestler added to team" });
  } catch (err) {
    console.error("Error adding wrestler:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Drop a wrestler from a team
app.post("/api/dropWrestler", async (req, res) => {
  const { teamName, wrestlerName } = req.body;
  
  if (await isRestrictedTime()) {
    return res.status(403).json({ error: "Cannot drop wrestler during restricted hours." });
  }

  try {
    const teamIdResult = await pool.query("SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)", [teamName]);
    if (teamIdResult.rows.length === 0) {
      return res.status(400).json({ error: "Team not found" });
    }
    const teamId = teamIdResult.rows[0].id;

    const update = await pool.query(
      "UPDATE wrestlers SET team_id = NULL, starter = FALSE WHERE LOWER(wrestler_name) = LOWER($1) AND team_id = $2",
      [wrestlerName, teamId]
    );

    if (update.rowCount === 0) {
      return res.status(403).json({ error: "Wrestler not on that team or already dropped" });
    }

    // ✅ Log the transaction
    await pool.query(
      "INSERT INTO transactions (team_name, wrestler_name, action, timestamp) VALUES ($1, $2, 'drop', NOW())",
      [teamName, wrestlerName]
    );

    res.json({ message: "Wrestler dropped" });
  } catch (err) {
    console.error("Error dropping wrestler:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set starter/bench status
app.post("/api/setStarterStatus", async (req, res) => {
  const { wrestlerName, isStarter } = req.body;

  if (await isRestrictedTime()) {
    return res.status(403).json({ error: "Cannot change starter status during restricted hours." });
  }

  try {
    // Update starter status
    await pool.query(
      "UPDATE wrestlers SET starter = $1 WHERE LOWER(wrestler_name) = LOWER($2)",
      [isStarter, wrestlerName.toLowerCase()]
    );

    // Get wrestler ID and team ID
    const result = await pool.query(
      "SELECT id, team_id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
      [wrestlerName.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Wrestler not found" });
    }

    const { id: wrestlerId, team_id: teamId } = result.rows[0];

    // Log the change in roster_changes
    await pool.query(
      `INSERT INTO roster_changes (wrestler_id, team_id, is_starter)
       VALUES ($1, $2, $3)`,
      [wrestlerId, teamId, isStarter]
    );

    res.json({ message: `Wrestler ${wrestlerName} set to ${isStarter ? "starter" : "bench"}` });
  } catch (err) {
    console.error("Error updating starter status:", err);
    res.status(500).json({ error: "Failed to update starter status." });
  }
});

// Get a specific wrestler by name
app.get("/api/wrestler/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query(
      `SELECT w.*, t.team_name
       FROM wrestlers w
       LEFT JOIN teams t ON w.team_id = t.id
       WHERE LOWER(w.wrestler_name) = LOWER($1)`,
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

// Get team points (only count starters)
app.get("/api/teamPoints/:teamName", async (req, res) => {
  const { teamName } = req.params;
  try {
    const result = await pool.query(`
      SELECT SUM(points) AS total_points
      FROM wrestlers
      WHERE team_id = (SELECT id FROM teams WHERE LOWER(team_name) = LOWER($1)) AND starter = true
    `, [teamName]);
    res.json({ team: teamName, points: result.rows[0].total_points || 0 });
  } catch (err) {
    console.error("Error fetching team points:", err);
    res.status(500).json({ error: "Error fetching team points" });
  }
});

// Propose a trade
app.post("/api/proposeTrade", async (req, res) => {
  const { offeringTeam, receivingTeam, offeredWrestlers, requestedWrestlers } = req.body;
  if (!offeringTeam || !receivingTeam || !Array.isArray(offeredWrestlers) || !Array.isArray(requestedWrestlers)) {
    return res.status(400).json({ error: "Invalid trade proposal payload" });
  }

  if (await isRestrictedTime()) {
    return res.status(403).json({ error: "Trades are restricted during show hours." });
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

// Respond to a trade
app.post("/api/trades/:id/respond", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const tradeRes = await pool.query("SELECT * FROM trade_proposals WHERE id = $1", [id]);
    if (tradeRes.rows.length === 0) return res.status(404).json({ error: "Trade not found" });

    const trade = tradeRes.rows[0];

    if (action === "accept") {
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
// Import Event
app.post("/api/importEvent", async (req, res) => {
  const { rawText, event_name, event_date } = req.body;

  if (!rawText || !event_name || !event_date) {
    return res.status(400).json({ error: "Missing event name, date, or raw text" });
  }

  try {
    // Force the event time to 8:00 PM Eastern Time
    const eventDateTime = new Date(
      new Date(`${event_date}T20:00:00`).toLocaleString("en-US", {
        timeZone: "America/New_York",
      })
    );

    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
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
        const bonusRegex = /^(.+?) [-—] (\d+) pts [-—] (.+)$/i;
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

    // Remove previously imported points for this event (by name and date)
    await pool.query(
      "DELETE FROM event_points WHERE event_name = $1 AND event_date = $2",
      [event_name, event_date]
    );

    const summary = [];

    for (const detail of eventDetails) {
      const { name, points, description } = detail;

      // Lookup wrestler ID
      const wrestlerRes = await pool.query(
        "SELECT id FROM wrestlers WHERE LOWER(wrestler_name) = LOWER($1)",
        [name.toLowerCase()]
      );
      if (wrestlerRes.rows.length === 0) continue;

      const wrestlerId = wrestlerRes.rows[0].id;

      // Check roster_changes for most recent status at or before event time
      const snapshotRes = await pool.query(
        `SELECT team_id, is_starter
         FROM roster_changes
         WHERE wrestler_id = $1 AND changed_at <= $2
         ORDER BY changed_at DESC
         LIMIT 1`,
        [wrestlerId, eventDateTime]
      );

      let teamId, isStarter;

      if (snapshotRes.rows.length > 0) {
        teamId = snapshotRes.rows[0].team_id;
        isStarter = snapshotRes.rows[0].is_starter;
      } else {
        // Fallback to current status in wrestlers table
        const fallbackRes = await pool.query(
          "SELECT team_id, starter FROM wrestlers WHERE id = $1",
          [wrestlerId]
        );
        if (fallbackRes.rows.length === 0) continue;

        teamId = fallbackRes.rows[0].team_id;
        isStarter = fallbackRes.rows[0].starter;
      }

      if (!isStarter) continue; // Only score points for starters

      // Update wrestler total points
      await pool.query(
        "UPDATE wrestlers SET points = points + $1 WHERE id = $2",
        [points, wrestlerId]
      );

      // Insert into event_points with is_starter and team_id
      await pool.query(
        `INSERT INTO event_points (wrestler_id, team_id, is_starter, event_name, event_date, points, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [wrestlerId, teamId, isStarter, event_name, event_date, points, description]
      );

      summary.push({ wrestler: name, points, description });
    }

    res.json({
      message: "✅ Event imported and points updated",
      updated: summary.length,
      details: summary,
    });
  } catch (err) {
    console.error("❌ Error processing event:", err);
    res.status(500).json({ error: "Error processing event" });
  }
});

// Get full event summary
app.get("/api/eventSummary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ep.event_name,
        ep.event_date,
        w.wrestler_name,
        t.team_name,
        ep.points,
        ep.description
      FROM event_points ep
      JOIN wrestlers w ON ep.wrestler_id = w.id
      LEFT JOIN teams t ON ep.team_id = t.id
      ORDER BY ep.event_date DESC, ep.event_name, ep.points DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching detailed event summary:", err);
    res.status(500).json({ error: "Failed to fetch event summary" });
  }
});

// Get event history for a wrestler
app.get("/api/eventPoints/wrestler/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        ep.event_name,
        ep.event_date,
        ep.points,
        ep.description,
        t.team_name
      FROM event_points ep
      JOIN wrestlers w ON ep.wrestler_id = w.id
      LEFT JOIN teams t ON ep.team_id = t.id
      WHERE LOWER(w.wrestler_name) = LOWER($1)
      ORDER BY ep.event_date DESC;
    `, [name]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching event history for wrestler:", err);
    res.status(500).json({ error: "Failed to fetch event history." });
  }
});

// Get all wrestlers, including team assignment
app.get("/api/allWrestlers", async (req, res) => {
  try {
    const query = `
      SELECT w.wrestler_name, w.brand, w.points, t.team_name
      FROM wrestlers w
      LEFT JOIN teams t ON w.team_id = t.id
      ORDER BY w.points DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all wrestlers:", err);
    res.status(500).json({ error: "Failed to fetch all wrestlers." });
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

app.get("/api/standings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.team_name, COALESCE(SUM(ep.points), 0) AS score
      FROM teams t
      LEFT JOIN event_points ep ON ep.team_id = t.id AND ep.is_starter = true
      GROUP BY t.team_name
      ORDER BY score DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching standings:", err);
    res.status(500).json({ error: "Failed to fetch standings." });
  }
});

app.get("/api/weeklyWinners", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH weekly_scores AS (
        SELECT
          ep.team_id,
          DATE_TRUNC('week', ep.event_date) AS week_start,
          SUM(ep.points) AS total_points
        FROM event_points ep
        WHERE ep.is_starter = true
        GROUP BY ep.team_id, week_start
      ),
      weekly_ranks AS (
        SELECT
          ws.*,
          RANK() OVER (PARTITION BY ws.week_start ORDER BY ws.total_points DESC) AS rank
        FROM weekly_scores ws
      )
      SELECT
        t.team_name,
        wr.week_start::date,
        wr.total_points,
        wr.rank
      FROM weekly_ranks wr
      JOIN teams t ON t.id = wr.team_id
      WHERE wr.rank = 1
      ORDER BY wr.week_start;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching weekly winners:", err);
    res.status(500).json({ error: "Failed to fetch weekly winners." });
  }
});

app.get("/api/weeklyWinTally", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.team_name, COUNT(*) AS weekly_wins
      FROM weekly_wins ww
      JOIN teams t ON ww.team_id = t.id
      GROUP BY t.team_name
      ORDER BY weekly_wins DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching weekly win tally:", err);
    res.status(500).json({ error: "Failed to fetch weekly win tally." });
  }
});

// Get all weekly scores for every team
app.get("/api/weeklyScores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.team_name,
        DATE_TRUNC('week', ep.event_date)::date AS week_start,
        SUM(ep.points) AS total_points
      FROM event_points ep
      JOIN teams t ON t.id = ep.team_id
      WHERE ep.is_starter = true
      GROUP BY t.team_name, week_start
      ORDER BY week_start, t.team_name;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching weekly scores:", err);
    res.status(500).json({ error: "Failed to fetch weekly scores." });
  }
});


//Calculate weekly wins
app.post("/api/calculateWeeklyWins", async (req, res) => {
  const { week } = req.body;
  if (!week) {
    return res.status(400).json({ error: "Missing 'week' in request body." });
  }

  const weekStart = new Date(week);
  if (isNaN(weekStart)) {
    return res.status(400).json({ error: "Invalid week format. Use YYYY-MM-DD." });
  }

  try {
    const alreadyRecorded = await pool.query(
      "SELECT 1 FROM weekly_wins WHERE week_start = $1 LIMIT 1",
      [weekStart]
    );
    if (alreadyRecorded.rows.length > 0) {
      return res.status(409).json({ error: "Wins already recorded for this week." });
    }

    const scores = await pool.query(`
      SELECT team_id, SUM(points) AS total_points
      FROM event_points
      WHERE is_starter = true
        AND DATE_TRUNC('week', event_date) = $1
        AND team_id IS NOT NULL
      GROUP BY team_id
    `, [weekStart]);

    if (scores.rows.length === 0) {
      return res.status(404).json({ error: "No starter scores found for this week." });
    }

    const maxPoints = Math.max(...scores.rows.map(row => parseFloat(row.total_points)));
    const winners = scores.rows.filter(row => parseFloat(row.total_points) === maxPoints);

    for (const winner of winners) {
      await pool.query(
        "INSERT INTO weekly_wins (week_start, team_id) VALUES ($1, $2)",
        [weekStart, winner.team_id]
      );
    }

    res.json({
      message: `✅ Win(s) recorded for week starting ${week}`,
      winners: winners.map(w => w.team_id),
    });
  } catch (err) {
    console.error("Error calculating weekly wins:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/teamRank/:teamName", async (req, res) => {
  const { teamName } = req.params;

  try {
    // Get total points and rank
    const standingsResult = await pool.query(`
      SELECT team_name, SUM(w.points) AS total_points
      FROM teams t
      JOIN wrestlers w ON t.id = w.team_id
      GROUP BY team_name
      ORDER BY total_points DESC
    `);

    const standings = standingsResult.rows;
    const rank = standings.findIndex(t => t.team_name.toLowerCase() === teamName.toLowerCase()) + 1;
    const teamData = standings.find(t => t.team_name.toLowerCase() === teamName.toLowerCase());

    if (!teamData) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Get total wins
      const winsResult = await pool.query(
        `SELECT COUNT(*) AS count FROM weekly_wins WHERE LOWER(winning_team) = LOWER($1)`,
        [teamName.toLowerCase()]
      );

      const total_wins = parseInt(winsResult.rows[0].count, 10);

    res.json({
      rank,
      total_wins,
      total_points: Number(teamData.total_points)
    });
  } catch (err) {
    console.error("Error fetching team rank/wins:", err);
    res.status(500).json({ error: "Failed to fetch team rank/wins" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});