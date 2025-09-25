// models/RemoteUser.ts
import mongoose, { Schema, Model } from "mongoose";
import { getRemoteConnection } from "@/lib/remoteDb";

/**
 * RemoteUser model bound to the remote connection.
 * Schema fields intentionally match your existing remote user documents:
 *  - password: bcrypt hash
 *  - roles: array of strings
 *  - verified: boolean
 *  - refreshToken: string | null
 */

const UserSchema = new Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, index: true },
    password: { type: String, required: true }, // bcrypt hash
    roles: { type: [String], default: ["student"] },
    verified: { type: Boolean, default: true },
    refreshToken: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export async function getRemoteUserModel(): Promise<Model<any>> {
  const conn = await getRemoteConnection();
  // Avoid re-defining the model on hot reloads
  return conn.models.User || conn.model("User", UserSchema);
}
