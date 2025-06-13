const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.post("/api/proposeTrade", async (req, res) => {
  const { from_team, to_team, offered_wrestler, requested_wrestler } = req.body;
  try {
    await pool.query(
      `INSERT INTO trades (from_team, to_team, offered_wrestler, requested_wrestler, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [from_team, to_team, offered_wrestler, requested_wrestler]
    );
    res.json({ message: "Trade proposed successfully." });
  } catch (err) {
    console.error("Error proposing trade:", err);
    res.status(500).send("Error processing trade proposal.");
  }
});

app.get("/api/trades", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM trades ORDER BY timestamp DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).send("Error fetching trade data.");
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(\`Server running on port \${port}\`);
});
