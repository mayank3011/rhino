// lib/mongodb.ts
import mongoose from "mongoose";

/**
 * Safe MongoDB connect helper.
 *
 * - Does NOT throw during module import. It throws only when connect() is called
 *   and MONGODB_URI is missing, so builds won't fail at import time.
 * - Caches connection across hot reloads using a global object.
 * - Exposes async connect() which returns the mongoose connection (mongoose.Mongoose).
 */

type MongooseCache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
};

declare global {
  var _mongooseGlobal: MongooseCache | undefined;
}

// Initialize global cache if missing (helps with HMR in dev)
if (!global._mongooseGlobal) {
  global._mongooseGlobal = { conn: null, promise: null };
}

const cache = global._mongooseGlobal!;

/**
 * Connect to MongoDB using MONGODB_URI env var.
 * Throws if called and MONGODB_URI is not set.
 */
async function connect(): Promise<mongoose.Mongoose> {
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
    return cache.conn!;
  }

  // Mongoose settings (run once)
  // Only enable autoIndex in non-production to avoid expensive index builds in prod.
  mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

  // Note: useNewUrlParser and useUnifiedTopology are deprecated / ignored with Node Driver v4+
  // serverSelectionTimeoutMS is still useful (it comes from MongoClient options) to fail fast.
  const connectOptions: mongoose.ConnectOptions = {
    // Keep options minimal. Add tls, replicaSet, authSource etc. here if required.
    serverSelectionTimeoutMS: 5000,
  };

  cache.promise = mongoose
    .connect(MONGODB_URI, connectOptions)
    .then((m) => {
      cache.conn = m;
      cache.promise = null;
      return m;
    })
    .catch((err) => {
      cache.promise = null;
      throw err;
    });

  await cache.promise;
  return cache.conn!;
}

export default connect;
