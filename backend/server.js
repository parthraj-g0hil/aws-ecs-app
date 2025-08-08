const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Connect to PostgreSQL (RDS)
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "testdb",
  port: 5432
});

// ECS Health Check route (always returns 200 if app is alive)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// DB test route (JSON)
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DB status route (HTML page)
app.get("/db-status", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    res.send(`
      <h1>Database Connected ✅</h1>
      <p>Time: ${result.rows[0].now}</p>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("<h1>Database Connection Failed ❌</h1>");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
