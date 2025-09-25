// models/Registration.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export interface IPaymentProofEmail {
  ok?: boolean;
  error?: string | null;
  sentAt?: Date | null;
  messageId?: string | null;
  lastEvent?: string | null;
  lastEventRaw?: any | null;
  bounceInfo?: any | null;
}

export interface IPaymentProof {
  method?: string | null;
  txnId?: string | null;
  screenshot?: string | null;
  verificationNotes?: string | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  email?: IPaymentProofEmail | null;
}

export interface IRegistration extends Document {
  name: string;
  email: string;
  phone?: string | null;
  course?: string | null; // slug or id
  promoCode?: string | null;
  amount: number;
  paid: boolean;
  status: string;
  notes?: string | null;
  paymentProof?: IPaymentProof | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentProofEmailSchema = new Schema<IPaymentProofEmail>(
  {
    ok: { type: Boolean },
    error: { type: String },
    sentAt: { type: Date },
    messageId: { type: String },
    lastEvent: { type: String },
    lastEventRaw: { type: Schema.Types.Mixed },
    bounceInfo: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
    method: { type: String },
    txnId: { type: String },
    screenshot: { type: String },
    verificationNotes: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    email: { type: PaymentProofEmailSchema, default: null },
  },
  { _id: false }
);

const RegistrationSchema = new Schema<IRegistration>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: null },
    course: { type: String, default: null },
    promoCode: { type: String, default: null },
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    status: { type: String, default: "awaiting_verification", index: true },
    notes: { type: String, default: null },
    paymentProof: { type: PaymentProofSchema, default: null },
  },
  { timestamps: true }
);

// Avoid model overwrite issues in dev with Next.js Hot Reloading
const Registration: Model<IRegistration> = mongoose.models.Registration || mongoose.model<IRegistration>("Registration", RegistrationSchema);
export default Registration;
