const express = require("express");
const { Pool } = require("pg");

const app = express();

// Add this debug logging (no credentials hardcoded)
console.log("DB Connection Details:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: 5432
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,  // Still from env
  database: process.env.DB_NAME,
  port: 5432,
  ssl: true,  // Add SSL for AWS RDS
  connectionTimeoutMillis: 5000
});

// Route for homepage
app.get("/", (req, res) => {
  res.send("<h1>This is the demo application</h1>");
});

// Enhanced DB status route
app.get("/db-status", async (req, res) => {
  try {
    console.log("Attempting database connection...");
    const result = await pool.query("SELECT 1");
    console.log("Database connection successful:", result.rows);
    res.send("<h1>DB is connected to the app ✅</h1>");
  } catch (err) {
    console.error("DB Connection Error:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).send(`
      <h1>Database Connection Failed ❌</h1>
      <p>Error: ${err.message}</p>
      <p>Check application logs for details</p>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});