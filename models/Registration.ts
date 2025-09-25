// models/Registration.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export interface IPaymentProofEmail {
  ok?: boolean;
  error?: string | null;
  sentAt?: Date | null;
  messageId?: string | null;
  lastEvent?: string | null;
  lastEventRaw?: Record<string, unknown> | null;
  bounceInfo?: Record<string, unknown> | null;
}

export interface ICreatedRemoteUser {
  result?: {
    created: boolean;
    passwordPlain?: string;
    error?: string;
    user?: Record<string, unknown>;
  };
}

export interface IPaymentProof {
  method?: string | null;
  txnId?: string | null;
  screenshot?: string | null;
  screenshots?: string[];
  verificationNotes?: string | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  email?: IPaymentProofEmail | null;
  createdRemoteUser?: ICreatedRemoteUser | null;
}

export interface IRegistration extends Document {
  name: string;
  email: string;
  phone?: string | null;
  course?: string | null;
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

const CreatedRemoteUserSchema = new Schema<ICreatedRemoteUser>(
  {
    result: {
      created: { type: Boolean },
      passwordPlain: { type: String },
      error: { type: String },
      user: { type: Schema.Types.Mixed },
    }
  },
  { _id: false }
);

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
    method: { type: String },
    txnId: { type: String },
    screenshot: { type: String },
    screenshots: [{ type: String }],
    verificationNotes: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    email: { type: PaymentProofEmailSchema, default: null },
    createdRemoteUser: { type: CreatedRemoteUserSchema, default: null },
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

interface IRegistrationModel extends Model<IRegistration> {
  findByStatus(status: string): Promise<IRegistration[]>;
  findByEmail(email: string): Promise<IRegistration | null>;
}

const Registration: IRegistrationModel = (mongoose.models.Registration as IRegistrationModel) || 
  mongoose.model<IRegistration, IRegistrationModel>("Registration", RegistrationSchema);

export default Registration;