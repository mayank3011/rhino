// lib/remoteDb.ts
import mongoose from "mongoose";

let remoteConn: mongoose.Connection | null = null;

export async function getRemoteConnection() {
  if (remoteConn && remoteConn.readyState === 1) return remoteConn;
  const uri = process.env.REMOTE_MONGODB_URI;
  if (!uri) throw new Error("REMOTE_MONGODB_URI not set");

  // createConnection returns a Connection separate from the default mongoose connection
  const conn = mongoose.createConnection(uri, {
    // useUnifiedTopology/useNewUrlParser are default in modern drivers; options omitted
  });

  // wait for connected or error
  await new Promise<void>((resolve, reject) => {
    conn.once("open", () => resolve());
    conn.on("error", (err) => reject(err));
  });

  remoteConn = conn;
  return conn;
}
