// lib/remoteDb.ts
import mongoose from "mongoose";

type MaybeConnection = mongoose.Connection | null;

declare global {
  // Cache connection across module reloads / HMR in development
  // eslint-disable-next-line no-var
  var _remoteMongooseConnection: {
    conn: MaybeConnection;
    promise: Promise<mongoose.Connection> | null;
  } | undefined;
}

if (!global._remoteMongooseConnection) {
  global._remoteMongooseConnection = { conn: null, promise: null };
}

/**
 * Get a dedicated remote mongoose Connection.
 *
 * - Uses mongoose.createConnection so this is separate from the default connection.
 * - Reuses cached connection across hot reloads.
 * - Throws if REMOTE_MONGODB_URI is not set when invoked.
 */
export async function getRemoteConnection(): Promise<mongoose.Connection> {
  const cache = global._remoteMongooseConnection!;

  // If already connected, return immediately
  if (cache.conn && cache.conn.readyState === 1) {
    return cache.conn;
  }

  // If a connection promise is in-flight, await it
  if (cache.promise) {
    return cache.promise;
  }

  const uri = process.env.REMOTE_MONGODB_URI;
  if (!uri) {
    throw new Error("REMOTE_MONGODB_URI not set in environment");
  }

  // Create a promise and store it so concurrent callers share the same connection attempt
  cache.promise = (async (): Promise<mongoose.Connection> => {
    // connection options — keep them explicit and reasonably safe
    const opts: mongoose.ConnectOptions = {
      // modern drivers default these, but be explicit for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // fail fast if server is unreachable
    } as mongoose.ConnectOptions;

    // createConnection returns a Connection (separate from mongoose.connect)
    const conn = mongoose.createConnection(uri, opts);

    // Wait for 'open' or 'error' (wrap with a promise)
    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        conn.off("open", onOpen);
        conn.off("error", onError);
      };

      conn.once("open", onOpen);
      conn.once("error", onError);
    });

    // cache the live connection and clear the promise (we'll reuse conn directly)
    cache.conn = conn;
    cache.promise = null;

    return conn;
  })();

  return cache.promise;
}
