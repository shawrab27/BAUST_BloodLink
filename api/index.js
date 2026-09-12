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
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://baust-bloodlink.vercel.app',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
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
app.get('/api/health', require('./health'));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
// Phase 2: Auth
app.use('/api/auth', require('./routes/auth'));
// Phase 3: Blood Hub
app.use('/api/blood-requests', require('./routes/bloodRequests'));
app.use('/api/donors', require('./routes/donors'));
// Phase 4: Emergency SOS
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/notifications', require('./routes/notifications'));
// Phase 5: Feed, Helpline, Messenger
app.use('/api/posts', require('./routes/posts'));
app.use('/api/helpline', require('./routes/helpline'));
app.use('/api/messages', require('./routes/messages'));
// Phase 6: Admin
app.use('/api/admin', require('./routes/admin'));

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
