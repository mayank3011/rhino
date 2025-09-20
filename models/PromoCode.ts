// models/PromoCode.ts
import mongoose, { Schema } from "mongoose";

const PromoSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percent", "fixed"], required: true },
  amount: { type: Number, required: true },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
}, { timestamps: true });

export default (mongoose.models.PromoCode as mongoose.Model<any>) || mongoose.model("PromoCode", PromoSchema);
