// scripts/seedAdmin.js
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

async function run() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    name: String, email: { type: String, unique: true }, passwordHash: String, role: String
  }));
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const pass = process.env.ADMIN_PASS || "Admin@123";
  const existing = await User.findOne({ email }).lean();
  if (existing) { console.log("Admin exists:", existing.email); process.exit(0); }
  const hash = await bcrypt.hash(pass, 10);
  const u = await User.create({ name: "Site Admin", email, passwordHash: hash, role: "admin" });
  console.log("Created admin:", u.email, "password:", pass);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
