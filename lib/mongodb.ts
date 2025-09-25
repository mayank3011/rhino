// lib/mongodb.ts
import mongoose from "mongoose";

/**
 * Safe MongoDB connect helper.
 *
 * - Does NOT throw during module import. It throws only when connect() is called
 *   and MONGODB_URI is missing, so builds won't fail at import time.
 * - Caches connection across hot reloads using a global object.
 * - Exposes async connect() which returns the mongoose connection.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseGlobal: MongooseCache | undefined;
}

// Initialize global cache if missing (helps with HMR in dev)
if (!global._mongooseGlobal) {
  global._mongooseGlobal = { conn: null, promise: null };
}

const cache = global._mongooseGlobal;

/**
 * Connect to MongoDB using MONGODB_URI env var.
 * Throws if called and MONGODB_URI is not set.
 */
async function connect(): Promise<typeof mongoose> {
  // If already connected, return immediately
  if (cache.conn) {
    return cache.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    // Throw only when connect() is actually called (not on import)
    throw new Error("Please add MONGODB_URI to .env.local or environment variables");
  }

  // If a connection attempt is in progress, await it
  if (cache.promise) {
    await cache.promise;
    // after promise resolves, cache.conn should be set
    return cache.conn!;
  }

  // Set mongoose options explicitly
  mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

  cache.promise = mongoose
    .connect(MONGODB_URI, {
      // modern drivers default these; included for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // optional: set a server selection timeout so connection attempts fail fast
      serverSelectionTimeoutMS: 5000,
    } as mongoose.ConnectOptions)
    .then((m) => {
      cache.conn = m;
      cache.promise = null;
      return m;
    })
    .catch((err) => {
      cache.promise = null;
      // rethrow so callers can handle
      throw err;
    });

  await cache.promise;
  return cache.conn!;
}

export default connect;
