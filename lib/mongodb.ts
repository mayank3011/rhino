// lib/mongodb.ts
import mongoose from "mongoose";

/**
 * Defensive MongoDB connect helper
 * - does not throw when module is imported (avoids Turbopack import-time failures)
 * - throws when connect() is invoked without a configured MONGODB_URI
 * - caches connection across hot reloads / serverless invocations
 */

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  // do not throw here — some build steps import modules without runtime envs
  // but log a visible warning so devs notice.
  // If you want to fail fast locally, uncomment the next line.
  // throw new Error("Please add MONGODB_URI to .env.local");
  // eslint-disable-next-line no-console
  console.warn("lib/mongodb: MONGODB_URI not set. connect() will fail until configured.");
}

// reduce mongoose autoIndex in prod to avoid build-time index creation
mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

// keep a cached global to avoid creating multiple connections in dev/hot-reload
declare global {
  // eslint-disable-next-line no-var
  var _mongooseGlobal?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global._mongooseGlobal) {
  global._mongooseGlobal = { conn: null, promise: null };
}

async function connect(): Promise<typeof mongoose> {
  if (global._mongooseGlobal!.conn) {
    return global._mongooseGlobal!.conn!;
  }

  if (!MONGODB_URI) {
    // throw here so runtime callers get an explicit error
    throw new Error(
      "Please add MONGODB_URI to your environment (e.g. .env.local or CI secrets)."
    );
  }

  if (!global._mongooseGlobal!.promise) {
    global._mongooseGlobal!.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  global._mongooseGlobal!.conn = await global._mongooseGlobal!.promise;
  return global._mongooseGlobal!.conn;
}

export default connect;
