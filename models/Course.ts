// models/Course.ts
import mongoose, { Schema } from "mongoose";

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  niche: String,
  category: String,
  price: { type: Number, default: 0 },
  image: String,
  imagePublicId: String,
  published: { type: Boolean, default: true },
}, { timestamps: true });

export default (mongoose.models.Course as mongoose.Model<any>) || mongoose.model("Course", CourseSchema);
