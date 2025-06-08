
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Serve static files from React frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// API routes
app.get("/api/availableWrestlers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT wrestler_name, points FROM wrestlers WHERE team_id IS NULL"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching available wrestlers:", err);
    res.status(500).send("Error fetching available wrestlers.");
  }
});

// Fallback to frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
