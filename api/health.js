/**
 * health.js — /api/health Serverless Function
 *
 * Returns server status, database connection state, memory usage, and
 * environment information. Designed for Vercel Serverless deployment.
 * Gracefully degrades: returns 503 if DB is unreachable but never crashes.
 */

require('dotenv').config();
const { connectDB, getConnectionState } = require('./config/db');

module.exports = async (req, res) => {
  // Allow CORS for health check polling from the client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbError = null;

  // Attempt DB connection — never let DB failure crash the health endpoint
  try {
    await connectDB();
    const { state } = getConnectionState();
    dbStatus = state;
  } catch (err) {
    dbError = err.message;
    dbStatus = 'error';
  }

  const { readyState, state } = getConnectionState();
  const isHealthy = readyState === 1;
  const httpStatus = isHealthy ? 200 : 503;

  const memoryUsage = process.memoryUsage();

  return res.status(httpStatus).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startTime,
    service: 'BAUST BloodLink API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      state,
      readyState,
      uri: process.env.MONGODB_URI
        ? `mongodb+srv://***@${process.env.MONGODB_URI.split('@')[1] || 'atlas'}`
        : 'not configured',
      ...(dbError && { error: dbError }),
    },
    memory: {
      heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
    },
  });
};
