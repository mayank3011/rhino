// models/PromoCode.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  discountType: "percent" | "flat" | "fixed";
  amount: number;
  expiresAt?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, index: true },
    discountType: { type: String, enum: ["percent", "flat", "fixed"], default: "percent" },
    amount: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keep model across reloads
const PromoCode: Model<IPromoCode> = mongoose.models.PromoCode || mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);
export default PromoCode;
