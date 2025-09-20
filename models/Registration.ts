// models/Registration.ts
import mongoose, { Schema } from "mongoose";

const RegSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  course: { type: Schema.Types.ObjectId, ref: "Course" },
  notes: String,
  paid: { type: Boolean, default: false },
  promoCode: String,
  amount: Number,
}, { timestamps: true });

export default (mongoose.models.Registration as mongoose.Model<any>) || mongoose.model("Registration", RegSchema);
