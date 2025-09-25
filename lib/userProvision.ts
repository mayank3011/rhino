// lib/userProvision.ts
import bcrypt from "bcryptjs";
import { getRemoteUserModel, IRemoteUser } from "@/models/RemoteUser";
import { sendWelcomeEmail } from "@/lib/email";

interface EmailResult {
  ok: boolean;
  error?: string;
  resp?: unknown;
}

interface CreateUserResult {
  created: boolean;
  existed?: boolean;
  user?: IRemoteUser | Record<string, unknown>;
  passwordPlain?: string;
  error?: string;
  emailResult?: EmailResult;
}

/**
 * createRemoteStudentIfNotExists
 * Creates a user in the remote cluster with proper error handling and type safety
 */
export async function createRemoteStudentIfNotExists(
  email: string,
  name?: string,
  sourceInfo?: Record<string, unknown>
): Promise<CreateUserResult> {
  try {
    const User = await getRemoteUserModel();
    const normalized = String(email).trim().toLowerCase();

    // Check existing user by email
    const existing = await User.findOne({ email: normalized }).lean();
    if (existing) {
      return { created: false, existed: true, user: existing };
    }

    // Derive first name only for password
    const firstName = name?.trim()?.split(/\s+/)?.[0] ?? normalized.split("@")[0];

    // Build predictable password (use invite flow in production)
    const suffix = process.env.PASSWORD_SUFFIX ?? "@rhinogeeks";
    const plain = `${firstName}${suffix}`;

    const saltRounds = 10;
    const hash = await bcrypt.hash(plain, saltRounds);

    const doc = await User.create({
      name: name ?? "",
      email: normalized,
      password: hash,
      roles: ["student"],
      verified: true,
      refreshToken: null,
      metadata: { 
        createdFrom: "registration_verification", 
        sourceInfo: sourceInfo ?? {} 
      },
    });

    // Send welcome email with password (non-critical)
    let emailResult: EmailResult = { ok: false };
    try {
      emailResult = await sendWelcomeEmail(normalized, {
        passwordPlain: plain,
        name: name,
        sourceInfo: sourceInfo ?? {},
      });
    } catch (error) {
      console.error("sendWelcomeEmail error:", error);
      const err = error as Error;
      emailResult = { ok: false, error: String(err?.message ?? err) };
    }

    return {
      created: true,
      user: doc.toObject ? doc.toObject() : doc,
      passwordPlain: plain,
      emailResult,
    };
  } catch (error) {
    console.error("createRemoteStudentIfNotExists error:", error);
    const err = error as Error;
    return { created: false, error: String(err?.message ?? err) };
  }
}

/**
 * Helper function to validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Helper function to generate secure password
 */
export function generateSecurePassword(firstName: string, suffix?: string): string {
  const cleanFirstName = firstName.trim().replace(/[^a-zA-Z0-9]/g, '');
  const passwordSuffix = suffix ?? process.env.PASSWORD_SUFFIX ?? "@rhinogeeks";
  return `${cleanFirstName}${passwordSuffix}`;
}

/**
 * Helper function to hash password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Helper function to verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}