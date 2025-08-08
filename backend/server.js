const express = require("express");
const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');

const app = express();

// Enhanced DB Configuration Logging
console.log("DB Configuration:", {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  database: process.env.DB_NAME || "testdb",
  port: 5432
});

// Load RDS root certificate (for ap-south-1 region)
const rdsCa = process.env.RDS_CA_CERT || fs.readFileSync(path.resolve(__dirname, 'certs/rds-ca-2019-root.pem')).toString();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "testdb",
  port: 5432,
  ssl: {
    rejectUnauthorized: true,
    ca: rdsCa
  }
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