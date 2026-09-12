/**
 * db.js — Cached Mongoose Connection for Vercel Serverless Functions
 *
 * On Vercel (and all FaaS), each function invocation may reuse the same
 * Node.js runtime (warm start) or spin up a fresh one (cold start).
 * Without caching we'd exhaust MongoDB Atlas M0's 500-connection limit fast.
 *
 * Strategy:
 *   - Store the connection promise on the Node.js global object.
 *   - Warm invocations find `global.mongoose.conn` and return immediately.
 *   - Cold starts create one new MongooseConnection and cache it.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Attach cache to `global` so it survives across serverless invocations
// in the same lambda container (Node module cache doesn't re-run on warm starts).
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

const cached = global.mongoose;

// Throttle retries on persistent connection failure so offline/in-memory mode doesn't stall requests
let lastFailureTime = 0;
const FAILURE_COOLDOWN_MS = 10000;

async function connectDB() {
  // If already connected, return cached connection immediately
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI environment variable is not set. ' +
        'Add it to your .env file (local) or Vercel environment variables (production).'
    );
  }

  // If we recently failed to connect, fail fast to allow in-memory dataset to respond instantly
  if (Date.now() - lastFailureTime < FAILURE_COOLDOWN_MS) {
    throw new Error('MongoDB connection is temporarily unavailable. Using in-memory fallback.');
  }

  // If a connection is already being established, wait for it
  if (!cached.promise) {
    const isLocalhost = MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');
    const opts = {
      bufferCommands: false,   // Fail fast if not connected (don't queue ops)
      maxPoolSize: 10,          // Limit connections on Atlas M0 (500 total limit)
      serverSelectionTimeoutMS: isLocalhost ? 1200 : 3000,
      socketTimeoutMS: 20000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[DB] MongoDB connected successfully.');
        lastFailureTime = 0;
        return mongooseInstance;
      })
      .catch((err) => {
        // Clear promise and set failure cooldown
        cached.promise = null;
        lastFailureTime = Date.now();
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    lastFailureTime = Date.now();
    throw err;
  }

  return cached.conn;
}

/**
 * Returns the current Mongoose readyState as a human-readable string.
 * 0: disconnected | 1: connected | 2: connecting | 3: disconnecting
 */
function getConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const rs = mongoose.connection.readyState;
  return { readyState: rs, state: states[rs] || 'unknown' };
}

module.exports = { connectDB, getConnectionState };
