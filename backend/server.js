const express = require("express");
const { Pool } = require("pg");
const path = require('path');
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

// Initialize Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || 'ECS-App-Logs',
      logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'app',
      awsRegion: process.env.AWS_REGION || 'ap-south-1',
      jsonMessage: true,
      retentionInDays: 14
    })
  ]
});

// Add correlation ID to all logs
logger.addCorrelationId = function(correlationId) {
  return this.child({ correlationId });
};

const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 
                       Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  req.logger = logger.addCorrelationId(correlationId);
  
  req.logger.info('Request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers
  });
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info('Response sent', {
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || '0'
    });
  });
  
  next();
});

// Set up EJS templating
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// DB Configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  database: process.env.DB_NAME || "testdb",
  port: 5432
};

logger.info('Database configuration', dbConfig);

// Load RDS root certificate
const rdsCa = process.env.RDS_CA_CERT || '';

const pool = new Pool({
  ...dbConfig,
  password: process.env.DB_PASS || "password",
  ssl: rdsCa ? {
    rejectUnauthorized: true,
    ca: rdsCa
  } : false
});

// Log DB connection events
pool.on('connect', () => {
  logger.debug('Database client connected');
});

pool.on('error', (err) => {
  logger.error('Database connection error', { error: err.message, stack: err.stack });
});

// Route for homepage
app.get("/", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT version()");
    const dbVersion = dbResult.rows[0].version;
    
    req.logger.info('Database version retrieved', { dbVersion });
    
    res.render('index', {
      appName: "AWS ECS Demo",
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      dbVersion: dbVersion,
      region: process.env.AWS_REGION || "ap-south-1"
    });
  } catch (err) {
    req.logger.error('Database connection failed', { 
      error: err.message, 
      stack: err.stack,
      code: err.code
    });
    res.render('index', {
      appName: "AWS ECS Demo",
      error: "Database Connection Failed: " + err.message
    });
  }
});

// Route for DB status
app.get("/db-status", async (req, res) => {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    const latency = Date.now() - start;
    
    req.logger.debug('Database health check successful', { latency });
    
    res.json({
      status: 'success',
      message: 'DB is connected to the app ✅',
      latency: latency,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME
    });
  } catch (err) {
    req.logger.error('Database health check failed', { 
      error: err.message, 
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      status: 'error',
      message: 'Database Connection Failed ❌: ' + err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  req.logger.error('Application error', {
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    correlationId: req.logger.correlationId
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});