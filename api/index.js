/**
 * index.js — Unified Express API Handler
 *
 * Works as both:
 *   - A Vercel Serverless Function (exports `module.exports = app` handler)
 *   - A standard Express app imported by dev-server.js for local development
 *
 * All future route modules (auth, bloodRequests, feed, emergency, etc.)
 * will be mounted here as the project grows through later phases.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://baust-blood-link.vercel.app',
      'https://baust-bloodlink.vercel.app',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.baust.edu.bd')
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── BODY PARSERS ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HEALTH (also handled by /api/health.js in Vercel, but available here for local dev)
app.get('/api/health', require('./_src/health'));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
// Phase 2: Auth
app.use('/api/auth', require('./_src/routes/auth'));
// Phase 3: Blood Hub
app.use('/api/blood-requests', require('./_src/routes/bloodRequests'));
app.use('/api/donors', require('./_src/routes/donors'));
// Phase 4: Emergency SOS
app.use('/api/emergency', require('./_src/routes/emergency'));
app.use('/api/notifications', require('./_src/routes/notifications'));
// Phase 5: Feed, Helpline, Messenger
app.use('/api/posts', require('./_src/routes/posts'));
app.use('/api/helpline', require('./_src/routes/helpline'));
app.use('/api/messages', require('./_src/routes/messages'));
// Phase 6: Admin
app.use('/api/admin', require('./_src/routes/admin'));
// Guest CRUD Operations
app.use('/api/guests', require('./_src/routes/guests'));

// ─── 404 FALLBACK ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist.`,
    timestamp: new Date().toISOString(),
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// Export as Vercel serverless handler
module.exports = app;
