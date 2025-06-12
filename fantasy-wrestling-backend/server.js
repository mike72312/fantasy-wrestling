const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const cheerio = require("cheerio");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🟢 Add Wrestler (with server-side restriction)
app.post("/api/addWrestler", async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const restricted = (day === 1 || day === 5 || day === 6) && hour >= 20 && hour < 23;
  if (restricted) {
    return res.status(403).json({ error: "Add/drop not allowed during event hours (Mon/Fri/Sat 8–11pm ET)" });
  }

  const { team_name, wrestler_name } = req.body;
  try {
    await pool.query(
      `INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'add')`,
      [team_name, wrestler_name]
    );
    await pool.query(
      `UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2`,
      [team_name, wrestler_name]
    );
    res.status(200).json({ message: "Wrestler added" });
  } catch (err) {
    console.error("❌ Error adding wrestler:", err);
    res.status(500).send("Failed to add wrestler");
  }
});

// 🔴 Drop Wrestler (with restriction)
app.post("/api/dropWrestler", async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const restricted = (day === 1 || day === 5 || day === 6) && hour >= 20 && hour < 23;
  if (restricted) {
    return res.status(403).json({ error: "Add/drop not allowed during event hours (Mon/Fri/Sat 8–11pm ET)" });
  }

  const { team_name, wrestler_name } = req.body;
  try {
    await pool.query(
      `INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'drop')`,
      [team_name, wrestler_name]
    );
    await pool.query(
      `UPDATE wrestlers SET team_id = NULL WHERE wrestler_name = $1`,
      [wrestler_name]
    );
    res.status(200).json({ message: "Wrestler dropped" });
  } catch (err) {
    console.error("❌ Error dropping wrestler:", err);
    res.status(500).send("Failed to drop wrestler");
  }
});

// 🔄 Get Available Wrestlers
app.get("/api/availableWrestlers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wrestler_name, brand, points FROM wrestlers WHERE team_id IS NULL`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching available wrestlers:", err);
    res.status(500).send("Error");
  }
});

// 📊 Get Team Points
app.get("/api/teamPoints/:team", async (req, res) => {
  const team = req.params.team;
  try {
    const result = await pool.query(`
      SELECT SUM(es.points) as total_points
      FROM event_scores es
      JOIN transactions t ON es.wrestler_name = t.wrestler_name
      WHERE t.team_name = $1
        AND es.event_date >= t.timestamp
        AND NOT EXISTS (
          SELECT 1 FROM transactions d
          WHERE d.wrestler_name = t.wrestler_name
            AND d.team_name = $1
            AND d.action = 'drop'
            AND d.timestamp > t.timestamp
            AND es.event_date >= d.timestamp
        )
    `, [team]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error calculating team points:", err);
    res.status(500).send("Error");
  }
});

// 🔁 Propose Trade (with restriction)
app.post("/api/proposeTrade", async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const restricted = (day === 1 || day === 5 || day === 6) && hour >= 20 && hour < 23;
  if (restricted) {
    return res.status(403).json({ error: "Trades are not allowed during event hours (Mon/Fri/Sat 8–11pm ET)" });
  }

  const { proposing_team, receiving_team, offered_wrestlers, requested_wrestlers } = req.body;
  try {
    await pool.query(
      `INSERT INTO trade_requests (proposing_team, receiving_team, offered_wrestlers, requested_wrestlers)
       VALUES ($1, $2, $3, $4)`,
      [proposing_team, receiving_team, offered_wrestlers, requested_wrestlers]
    );
    res.status(200).json({ message: "Trade proposed" });
  } catch (err) {
    console.error("❌ Error proposing trade:", err);
    res.status(500).send("Trade error");
  }
});

// ✅ Respond to Trade (with restriction)
app.post("/api/respondToTrade", async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const restricted = (day === 1 || day === 5 || day === 6) && hour >= 20 && hour < 23;
  if (restricted) {
    return res.status(403).json({ error: "Trades are not allowed during event hours (Mon/Fri/Sat 8–11pm ET)" });
  }

  const { trade_id, accepted } = req.body;
  try {
    const trade = await pool.query(`SELECT * FROM trade_requests WHERE id = $1`, [trade_id]);
    if (trade.rows.length === 0) return res.status(404).send("Trade not found");

    if (accepted) {
      const t = trade.rows[0];
      for (const wrestler of t.offered_wrestlers) {
        await pool.query(`UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2`, [t.receiving_team, wrestler]);
        await pool.query(`INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'drop')`, [t.proposing_team, wrestler]);
        await pool.query(`INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'add')`, [t.receiving_team, wrestler]);
      }
      for (const wrestler of t.requested_wrestlers) {
        await pool.query(`UPDATE wrestlers SET team_id = $1 WHERE wrestler_name = $2`, [t.proposing_team, wrestler]);
        await pool.query(`INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'drop')`, [t.receiving_team, wrestler]);
        await pool.query(`INSERT INTO transactions (team_name, wrestler_name, action) VALUES ($1, $2, 'add')`, [t.proposing_team, wrestler]);
      }
    }

    await pool.query(`UPDATE trade_requests SET status = $1 WHERE id = $2`, [accepted ? "accepted" : "rejected", trade_id]);
    res.status(200).json({ message: `Trade ${accepted ? "accepted" : "rejected"}` });
  } catch (err) {
    console.error("❌ Error responding to trade:", err);
    res.status(500).send("Error");
  }
});

// 📥 Import Event (DropTheBelt compatible)
app.post("/api/importEvent", async (req, res) => {
  const { html, event_name, event_date } = req.body;
  try {
    const $ = cheerio.load(html);
    const eventResult = await pool.query(
      `INSERT INTO events (event_name, event_date) VALUES ($1, $2) RETURNING id`,
      [event_name, event_date]
    );
    const event_id = eventResult.rows[0].id;

    const matches = $("ol li");
    if (!matches.length) {
      console.warn("❌ No match list items found");
      return res.status(400).json({ error: "No matches found in uploaded HTML." });
    }

    for (const el of matches) {
      const text = $(el).text().trim();
      const nameMatch = text.match(/^(\\D+?)\\s+(\\d+)\\s+pts/i);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        const pts = parseInt(nameMatch[2]);
        if (name && pts) {
          await pool.query(
            `INSERT INTO event_scores (event_id, wrestler_name, points) VALUES ($1, $2, $3)`,
            [event_id, name, pts]
          );
        }
      }
    }

    res.status(200).json({ message: "Event imported" });
  } catch (err) {
    console.error("❌ Error importing event:", err);
    res.status(500).send("Error");
  }
});

// 📤 Get Event Archive
app.get("/api/events", async (req, res) => {
  try {
    const events = await pool.query(`SELECT * FROM events ORDER BY event_date DESC`);
    res.json(events.rows);
  } catch (err) {
    console.error("❌ Error getting events:", err);
    res.status(500).send("Error");
  }
});

// 📤 Get Scores for One Event
app.get("/api/eventScores/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const scores = await pool.query(
      `SELECT wrestler_name, points FROM event_scores WHERE event_id = $1 ORDER BY points DESC`,
      [eventId]
    );
    res.json(scores.rows);
  } catch (err) {
    console.error("❌ Error getting scores:", err);
    res.status(500).send("Error");
  }
});

// 🧾 Get Team Roster
app.get("/api/teamRoster/:team", async (req, res) => {
  const team = req.params.team;
  try {
    const result = await pool.query(
      `SELECT wrestler_name, brand, points FROM wrestlers WHERE team_id = $1`,
      [team]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching team roster:", err);
    res.status(500).send("Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});