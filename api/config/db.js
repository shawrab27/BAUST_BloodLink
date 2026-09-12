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

  // If a connection is already being established, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,   // Fail fast if not connected (don't queue ops)
      maxPoolSize: 10,          // Limit connections on Atlas M0 (500 total limit)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[DB] MongoDB Atlas connected successfully.');
        return mongooseInstance;
      })
      .catch((err) => {
        // Clear promise so next cold start can retry
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
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
