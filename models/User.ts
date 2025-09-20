// models/User.ts
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
}, { timestamps: true });

export default (mongoose.models.User as mongoose.Model<any>) || mongoose.model("User", UserSchema);
