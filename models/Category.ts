// models/Category.ts
import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

export default (mongoose.models.Category as mongoose.Model<any>) || mongoose.model("Category", CategorySchema);
