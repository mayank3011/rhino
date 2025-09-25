// scripts/migrate-courses.js
// Usage: node scripts/migrate-courses.js
// This script connects to MongoDB using MONGODB_URI in .env and backfills missing course fields.

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") }); // fallback to .env.local
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") }); // then .env

async function main() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("No MongoDB connection string found in env (MONGODB_URI). Add it to .env.local or .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // Minimal Course schema to allow updates. We only need to target the collection.
  const CourseSchema = new mongoose.Schema({}, { strict: false, collection: "courses" });
  const Course = mongoose.models.Course || mongoose.model("CourseMigration", CourseSchema, "courses");

  try {
    console.log("1) Adding mentor object where missing...");
    const r1 = await Course.updateMany(
      { $or: [{ mentor: { $exists: false } }, { mentor: null }] },
      { $set: { "mentor": { name: "", image: "", imagePublicId: "" } } }
    );
    console.log("mentor update:", r1.nModified ?? r1.modifiedCount ?? r1);

    console.log("2) Ensuring startTime exists (set to null where missing)...");
    const r2 = await Course.updateMany(
      { startTime: { $exists: false } },
      { $set: { startTime: null } }
    );
    console.log("startTime update:", r2.nModified ?? r2.modifiedCount ?? r2);

    console.log("3) Ensuring duration exists (empty string where missing)...");
    const r3 = await Course.updateMany(
      { duration: { $exists: false } },
      { $set: { duration: "" } }
    );
    console.log("duration update:", r3.nModified ?? r3.modifiedCount ?? r3);

    console.log("4) Ensuring keyOutcomes exists (empty array where missing)...");
    const r4 = await Course.updateMany(
      { keyOutcomes: { $exists: false } },
      { $set: { keyOutcomes: [] } }
    );
    console.log("keyOutcomes update:", r4.nModified ?? r4.modifiedCount ?? r4);

    console.log("5) Ensuring modules exists (empty array where missing)...");
    const r5 = await Course.updateMany(
      { modules: { $exists: false } },
      { $set: { modules: [] } }
    );
    console.log("modules update:", r5.nModified ?? r5.modifiedCount ?? r5);

    console.log("Done. Closing connection.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
