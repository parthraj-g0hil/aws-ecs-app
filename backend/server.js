const express = require("express");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "testdb",
  port: 5432
});

// Route for homepage
app.get("/", (req, res) => {
  res.send("<h1>This is the demo application</h1>");
});

// Route for DB status
app.get("/db-status", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.send("<h1>DB is connected to the app ✅</h1>");
  } catch (err) {
    console.error("DB Connection Error:", err);
    res.status(500).send("<h1>Database Connection Failed ❌</h1>");
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
