// models/RemoteUser.ts
import mongoose, { Schema, Document, Model, Connection } from "mongoose";
import { getRemoteConnection } from "@/lib/remoteDb";

/**
 * Remote user document interface
 * Allow _id to be ObjectId or string (string after toJSON transform).
 */
export interface IRemoteUser extends Document {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  roles: string[];
  verified: boolean;
  refreshToken: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  hasRole(role: string): boolean;
  isStudent(): boolean;
  isAdmin(): boolean;
  addMetadata(key: string, value: unknown): void;
}

/** Interface for metadata object (optional helper) */
export interface UserMetadata {
  registrationId?: string;
  source?: string;
  lastLogin?: Date;
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Schema */
const RemoteUserSchema = new Schema<IRemoteUser>(
  {
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    roles: {
      type: [String],
      default: ["student"],
      validate: {
        validator: function (roles: unknown) {
          if (!Array.isArray(roles)) return false;
          const allowedRoles = ["student", "admin", "instructor", "moderator"];
          return roles.every((role) => allowedRoles.includes(String(role)));
        },
        message: "Invalid role specified",
      },
    },
    verified: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
      validate: {
        validator: function (metadata: unknown) {
          return typeof metadata === "object" && metadata !== null;
        },
        message: "Metadata must be an object",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      /**
       * Avoid `any` — use unknown for incoming doc and an indexable object for `ret`.
       * This allows safe narrowing and deletion while keeping strict typing.
       */
      transform: function (_doc: unknown, ret: Record<string, unknown>) {
        // convert _id to string if present
        if ("_id" in ret) {
          const rawId = ret["_id"];
          try {
            if (typeof rawId === "string") {
              ret["_id"] = rawId;
            } else if (rawId && typeof (rawId as { toString?: unknown }).toString === "function") {
              try {
                ret["_id"] = (rawId as { toString: () => string }).toString();
              } catch {
                ret["_id"] = String(rawId);
              }
            } else {
              ret["_id"] = String(rawId);
            }
          } catch {
            ret["_id"] = String(ret["_id"]);
          }
        }

        // remove sensitive/internal fields if present
        if ("password" in ret) {
          delete ret["password"];
        }
        if ("refreshToken" in ret) {
          delete ret["refreshToken"];
        }
        if ("__v" in ret) {
          delete ret["__v"];
        }

        return ret;
      },
    },
  }
);

/** Indexes */
RemoteUserSchema.index({ email: 1 }, { unique: true });
RemoteUserSchema.index({ roles: 1 });
RemoteUserSchema.index({ verified: 1 });
RemoteUserSchema.index({ createdAt: -1 });

/** Virtual displayName */
RemoteUserSchema.virtual("displayName").get(function (this: IRemoteUser) {
  return this.name || this.email.split("@")[0];
});

/** Instance methods */
RemoteUserSchema.methods.hasRole = function (this: IRemoteUser, role: string): boolean {
  return Array.isArray(this.roles) && this.roles.includes(role);
};

RemoteUserSchema.methods.isStudent = function (this: IRemoteUser): boolean {
  return this.hasRole("student");
};

RemoteUserSchema.methods.isAdmin = function (this: IRemoteUser): boolean {
  return this.hasRole("admin");
};

RemoteUserSchema.methods.addMetadata = function (this: IRemoteUser, key: string, value: unknown): void {
  if (!this.metadata || typeof this.metadata !== "object") {
    this.metadata = {};
  }
  (this.metadata as Record<string, unknown>)[key] = value;
};

/** Static methods typing */
interface IRemoteUserModel extends Model<IRemoteUser> {
  findByEmail(email: string): Promise<IRemoteUser | null>;
  findVerified(): mongoose.Query<IRemoteUser[], IRemoteUser>;
  findByRole(role: string): mongoose.Query<IRemoteUser[], IRemoteUser>;
}

/** Statics
 *
 * NOTE: do NOT annotate the `this` parameter here. Let TypeScript infer `this`
 * from the assignment to RemoteUserSchema.statics so the Mongoose Model type and
 * our IRemoteUserModel stay compatible.
 */
RemoteUserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

RemoteUserSchema.statics.findVerified = function () {
  return this.find({ verified: true });
};

RemoteUserSchema.statics.findByRole = function (role: string) {
  return this.find({ roles: role });
};

/** Model cache */
let RemoteUserModel: IRemoteUserModel | null = null;

/**
 * Get RemoteUser model bound to remote connection (cached).
 */
export async function getRemoteUserModel(): Promise<IRemoteUserModel> {
  try {
    if (RemoteUserModel) return RemoteUserModel;

    const remoteConnection: Connection = await getRemoteConnection();

    if ("User" in remoteConnection.models) {
      RemoteUserModel = remoteConnection.models.User as IRemoteUserModel;
    } else {
      RemoteUserModel = remoteConnection.model<IRemoteUser, IRemoteUserModel>("User", RemoteUserSchema);
    }

    return RemoteUserModel;
  } catch (error) {
    console.error("Failed to get RemoteUser model:", error);
    throw new Error(`Unable to initialize RemoteUser model: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Create a remote user (expects password pre-hashed)
 */
export async function createRemoteUser(userData: {
  name?: string;
  email: string;
  password: string;
  roles?: string[];
  verified?: boolean;
  metadata?: UserMetadata;
}): Promise<IRemoteUser> {
  const RemoteUser = await getRemoteUserModel();

  const user = new RemoteUser({
    name: userData.name || "",
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    roles: userData.roles || ["student"],
    verified: userData.verified ?? true,
    metadata: userData.metadata || {},
  });

  return await user.save();
}

/**
 * Find or create remote user
 */
export async function findOrCreateRemoteUser(
  email: string,
  userData: Partial<{
    name: string;
    password: string;
    roles: string[];
    verified: boolean;
    metadata: UserMetadata;
  }>
): Promise<{ user: IRemoteUser; created: boolean }> {
  const RemoteUser = await getRemoteUserModel();

  let user = await RemoteUser.findByEmail(email);

  if (user) {
    return { user, created: false };
  }

  if (!userData.password) {
    throw new Error("Password is required for new user creation");
  }

  user = await createRemoteUser({
    email,
    name: userData.name,
    password: userData.password,
    roles: userData.roles,
    verified: userData.verified,
    metadata: userData.metadata,
  });

  return { user, created: true };
}

/** Export types */
export type { IRemoteUserModel, UserMetadata as RemoteUserMetadata };
