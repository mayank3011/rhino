// scripts/backfill-slugs.js
// Plain Node script — does NOT require your TypeScript model files.
// Usage:
//   MONGODB_URI="mongodb+srv://..." node scripts/backfill-slugs.js
// or ensure MONGODB_URI is in .env and run: node scripts/backfill-slugs.js

require("dotenv").config();
const mongoose = require("mongoose");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function makeUniqueSlug(baseSlug, excludeId) {
  baseSlug = slugify(baseSlug || "course");
  let candidate = baseSlug;
  let i = 0;
  while (true) {
    const q = { slug: candidate };
    // use string id in query (MongoDB accepts string for _id comparison)
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await CourseModel.findOne(q).lean().exec();
    if (!exists) return candidate;
    i++;
    candidate = `${baseSlug}-${i}`;
    if (i > 10000) throw new Error("Could not generate unique slug after 10000 attempts");
  }
}

const MONGO_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGODB_URI not set. Put it in your environment or .env file.");
  process.exit(1);
}

let CourseModel;

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, { });
  console.log("Connected.");

  // Loose schema so we can read & update the existing "courses" collection.
  const AnySchema = new mongoose.Schema({}, { strict: false, collection: "courses" });
  CourseModel = mongoose.models.CourseBackfill || mongoose.model("CourseBackfill", AnySchema, "courses");

  const total = await CourseModel.countDocuments().exec();
  console.log("Total course documents:", total);

  const cursor = CourseModel.find().lean().cursor();
  let processed = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    processed++;
    const id = doc._id;
    const existingSlug = doc.slug && String(doc.slug || "").trim();
    if (existingSlug) {
      // verify uniqueness; if duplicate with other doc, we'll generate unique based on title
      const dup = await CourseModel.findOne({ slug: existingSlug, _id: { $ne: id } }).lean().exec();
      if (!dup) {
        if (processed % 50 === 0) console.log(`Skipping ${id} (slug exists and unique): ${existingSlug}`);
        continue;
      }
      console.log(`Slug collision for ${id} -> ${existingSlug}. Will regenerate from title.`);
    }

    // generate from title (fall back to id)
    const source = doc.title || doc.name || String(id).slice(-6);
    const unique = await makeUniqueSlug(source, String(id));
    try {
      await CourseModel.updateOne({ _id: id }, { $set: { slug: unique } }).exec();
      console.log(`Updated ${id} -> ${unique}`);
    } catch (err) {
      console.error("Failed to update", id, err && err.message ? err.message : err);
    }

    // progress log occasionally
    if (processed % 100 === 0) console.log(`Processed ${processed}/${total}`);
  }

  console.log("Done backfilling slugs. Processed:", processed);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(2);
});
