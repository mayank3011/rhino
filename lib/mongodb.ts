// lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Please add MONGODB_URI to .env.local");

declare global {
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

if (!global._mongoose) global._mongoose = { conn: null, promise: null };

async function connect() {
  if (global._mongoose!.conn) return global._mongoose!.conn;
  if (!global._mongoose!.promise) {
    global._mongoose!.promise = mongoose.connect(MONGODB_URI).then(m => m);
  }
  global._mongoose!.conn = await global._mongoose!.promise;
  return global._mongoose!.conn;
}

export default connect;
