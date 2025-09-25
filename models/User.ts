// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * User interface (document)
 * _id may be ObjectId or string (string after toJSON transform),
 * timestamps are present (createdAt/updatedAt).
 */
interface IUser extends Document {
  _id: mongoose.Types.ObjectId | string;
  name?: string;
  email: string;
  passwordHash?: string;
  role: "student" | "admin";
  createdAt: Date;
  updatedAt: Date;
  displayName: string;
  isAdmin(): boolean;
  hasRole(role: string): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
    toJSON: {
      /**
       * Use unknown for the incoming document and a loose indexable object for 'ret'
       * so we can safely mutate and delete fields while avoiding `any`.
       */
      transform: function (_doc: unknown, ret: Record<string, unknown>) {
        // Normalize _id -> string if present
        if ("_id" in ret) {
          const rawId = ret["_id"];
          try {
            if (typeof rawId === "string") {
              // already a string — keep as-is
              ret["_id"] = rawId;
            } else if (rawId && typeof (rawId as { toString?: unknown }).toString === "function") {
              // call toString if available (covers ObjectId)
              // cast to a well-typed function rather than using `any`
              const toStr = (rawId as { toString: () => string }).toString;
              try {
                ret["_id"] = toStr.call(rawId);
              } catch {
                ret["_id"] = String(rawId);
              }
            } else {
              ret["_id"] = String(rawId);
            }
          } catch {
            // best-effort fallback
            ret["_id"] = String(ret["_id"]);
          }
        }

        // Remove sensitive/internal fields if present
        if ("passwordHash" in ret) {
          // delete via index access on the indexable type
          delete ret["passwordHash"];
        }

        if ("__v" in ret) {
          delete ret["__v"];
        }

        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Virtual displayName
UserSchema.virtual("displayName").get(function (this: IUser) {
  return this.name || this.email.split("@")[0];
});

// Methods
UserSchema.methods.hasRole = function (this: IUser, role: string): boolean {
  return this.role === role;
};

UserSchema.methods.isAdmin = function (this: IUser): boolean {
  return this.hasRole("admin");
};

// Statics interface
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Static helper
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User: IUserModel =
  (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
export type { IUser, IUserModel };
