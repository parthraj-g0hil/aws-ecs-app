const express = require("express");
const { Pool } = require("pg");
const path = require('path');

// Enhanced console logging with request correlation
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`${timestamp} [INFO] ${args.join(' ')}\n`);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  process.stderr.write(`${timestamp} [ERROR] ${args.join(' ')}\n`);
};

const app = express();

// Set up EJS templating
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware with correlation ID
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  // Add request ID to all logs
  req.log = (...args) => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`${timestamp} [REQ:${requestId}] ${args.join(' ')}\n`);
  };
  
  req.log(`Started ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.log(`Completed ${res.statusCode} in ${duration}ms`);
  });
  
  // Set response headers
  res.set('X-Request-ID', requestId);
  
  next();
});

// DB Configuration
console.log("Database configuration:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: 5432
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { 
    rejectUnauthorized: false // Required for RDS connection
  }
});

// Route for homepage
app.get("/", async (req, res) => {
  try {
    req.log("Fetching database version...");
    const dbResult = await pool.query("SELECT version()");
    const dbVersion = dbResult.rows[0].version;
    
    req.log(`Database version: ${dbVersion}`);
    
    res.render('index', {
      appName: "AWS ECS Demo",
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      dbVersion: dbVersion,
      region: process.env.AWS_REGION || "ap-south-1"
    });
  } catch (err) {
    req.log("Database connection failed:", err.message);
    res.render('index', {
      appName: "AWS ECS Demo",
      error: "Database Connection Failed: " + err.message
    });
  }
});

// Route for DB status
app.get("/db-status", async (req, res) => {
  try {
    req.log("Checking database health...");
    const start = Date.now();
    await pool.query("SELECT 1");
    const latency = Date.now() - start;
    
    req.log(`Database health check passed in ${latency}ms`);
    
    res.json({
      status: 'success',
      message: 'DB is connected to the app ✅',
      latency: latency,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME
    });
  } catch (err) {
    req.log("Database health check failed:", err.message);
    res.status(500).json({
      status: 'error',
      message: 'Database Connection Failed ❌: ' + err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Application environment: ${process.env.NODE_ENV || 'development'}`);
});