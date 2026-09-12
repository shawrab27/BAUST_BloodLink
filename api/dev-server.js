/**
 * dev-server.js — Local Development HTTP Server
 *
 * Wraps the Express app (api/index.js) in a standalone HTTP server
 * running on port 5000 for concurrent local development alongside
 * the Vite dev server (port 5173).
 *
 * Run: node dev-server.js  OR  npm run dev (from /api)
 */

require('dotenv').config();
const http = require('http');
const app = require('./index');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Attempt DB connection on startup (non-fatal for local dev without Atlas)
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      console.log('[Server] Database connection established.');
    } catch (err) {
      console.warn(
        '[Server] Warning: Could not connect to MongoDB on startup:',
        err.message
      );
      console.warn('[Server] Continuing without DB — /api/health will report degraded status.');
    }
  } else {
    console.warn(
      '[Server] MONGODB_URI not set. Create api/.env with MONGODB_URI=<your Atlas URI>.'
    );
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`\n🩸 BAUST BloodLink API running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    console.log('\n[Server] SIGINT received. Shutting down...');
    server.close(() => process.exit(0));
  });
}

startServer();
