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

// Test route
app.get("/", (req, res) => {
  res.send("Hello from ECS App!");
});

// DB test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

