// lib/userProvision.ts
import bcrypt from "bcryptjs";
import { getRemoteUserModel } from "@/models/RemoteUser";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * createRemoteStudentIfNotExists
 * - Creates a user in the remote cluster with the schema you provided.
 *
 * Returns: { created: boolean, user?: doc, passwordPlain?: string, error?: string, existed?: boolean }
 */
export async function createRemoteStudentIfNotExists(
  email: string,
  name?: string,
  sourceInfo?: any
) {
  try {
    const User = await getRemoteUserModel();

    const normalized = String(email).trim().toLowerCase();

    // check existing user by email
    const existing = await User.findOne({ email: normalized }).lean();
    if (existing) {
      return { created: false, existed: true, user: existing };
    }

    // Derive first name only for password
    const firstName = name?.trim()?.split(/\s+/)?.[0] ?? normalized.split("@")[0];

    // Build predictable password (⚠️ use invite flow in prod)
    const suffix = process.env.PASSWORD_SUFFIX ?? "@rhinogeeks";
    const plain = `${firstName}${suffix}`;

    const saltRounds = 10;
    const hash = await bcrypt.hash(plain, saltRounds);

    const doc = await User.create({
      name: name ?? "", // keep full name
      email: normalized,
      password: hash,
      roles: ["student"],
      verified: true,
      refreshToken: null,
      metadata: { createdFrom: "registration_verification", sourceInfo },
    });

    // Send welcome email with password (non-critical)
    let emailResult: any = null;
    try {
      emailResult = await sendWelcomeEmail(normalized, {
        passwordPlain: plain,
        name: name, // keep full name in email greeting
        sourceInfo,
      });
    } catch (err: any) {
      console.error("sendWelcomeEmail error:", err);
      emailResult = { ok: false, error: String(err?.message ?? err) };
    }

    return {
      created: true,
      user: doc.toObject ? doc.toObject() : doc,
      passwordPlain: plain,
      emailResult,
    };
  } catch (err: any) {
    console.error("createRemoteStudentIfNotExists error:", err);
    return { created: false, error: String(err?.message ?? err) };
  }
}
