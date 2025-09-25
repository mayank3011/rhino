// app/api/admin/registrations/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { createRemoteStudentIfNotExists } from "@/lib/userProvision";
import { cookies } from "next/headers";

/** Local types for clarity (lean() result shape) */
interface PaymentProofLean {
  txnId?: string | null;
  screenshot?: string | null;
  verifiedAt?: Date | string | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  email?: unknown;
  createdRemoteUser?: unknown;
}

interface RegistrationLean {
  _id: string | mongoose.Types.ObjectId;
  name?: string | null;
  email?: string | null;
  course?: string | null;
  amount?: number | null;
  paymentProof?: PaymentProofLean | null;
  status?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** Types used in this file */
interface AuthPayload {
  role: string;
  userId?: string;
  email?: string;
  name?: string;
  sub?: string;
  id?: string;
}

interface VerificationRequest {
  action?: string;
  verificationNotes?: string;
  paid?: boolean;
}

interface RegistrationUpdate {
  status?: string;
  paid?: boolean;
  "paymentProof.verifiedAt"?: Date;
  "paymentProof.verifiedBy"?: string;
  "paymentProof.verificationNotes"?: string;
}

interface EmailResult {
  ok: boolean;
  error?: string;
  resp?: Array<{ headers?: Record<string, string> }>;
}

interface EmailMetadata {
  sentAt: Date;
  ok: boolean;
  error: string | null;
  raw: unknown;
  messageId?: string | null;
}

interface CreateUserResult {
  created: boolean;
  error?: string;
  userId?: string;
}

/** Authentication middleware */
async function ensureAdmin(): Promise<AuthPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.COOKIE_NAME || "token")?.value;

  if (!token) {
    throw new Error("unauthenticated");
  }

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") {
    throw new Error("forbidden");
  }

  return payload;
}

/** Error handler that always returns a NextResponse */
function handleError(error: unknown, defaultMessage = "An error occurred"): NextResponse {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Registration verification error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (message === "invalid_token") {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  return NextResponse.json({ error: "server_error", message }, { status: 500 });
}

/**
 * Small payload type for email helper (contains only fields sendVerificationEmail expects)
 * We keep it narrow to avoid passing lean document with nullable fields directly.
 */
interface EmailPayloadForHelper {
  name?: string | null;
  course?: string | null;
  amount?: number | null;
  paymentProof?: { txnId?: string | null; screenshot?: string | null };
}

/** Main API handler */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Auth
    const payload = await ensureAdmin();

    // Validate ID param
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    // Parse body
    const body = (await req.json().catch(() => ({}))) as VerificationRequest;
    const action = String(body.action ?? "").toLowerCase();
    const notes = String(body.verificationNotes ?? "");
    const paidOverride = typeof body.paid === "boolean" ? body.paid : undefined;

    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json({ error: "invalid_action", message: "action must be 'verify' or 'reject'" }, { status: 422 });
    }

    await connect();

    const now = new Date();
    const adminIdentifier = payload.email ?? payload.name ?? payload.sub ?? String(payload.id ?? "admin");

    // Build update object
    const update: RegistrationUpdate = {};
    if (action === "verify") {
      update.status = "verified";
      update.paid = paidOverride === undefined ? true : paidOverride;
      update["paymentProof.verifiedAt"] = now;
      update["paymentProof.verifiedBy"] = adminIdentifier;
      if (notes) update["paymentProof.verificationNotes"] = notes;
    } else {
      // reject
      update.status = "rejected";
      update.paid = false;
      update["paymentProof.verificationNotes"] = notes || "Rejected by admin";
      update["paymentProof.verifiedAt"] = now;
      update["paymentProof.verifiedBy"] = adminIdentifier;
    }

    // Update registration and return the updated lean document
    const updatedDoc = (await Registration.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()) as RegistrationLean | null;

    if (!updatedDoc) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Prepare email result
    let emailResult: EmailResult = { ok: false, error: "not_sent" };

    // Build a narrow payload for the email helper (avoid passing nullable DB object directly)
    const emailPayload: EmailPayloadForHelper = {
      name: updatedDoc.name ?? null,
      course: updatedDoc.course ?? null,
      amount: updatedDoc.amount ?? null,
      paymentProof: {
        txnId: updatedDoc.paymentProof?.txnId ?? null,
        screenshot: updatedDoc.paymentProof?.screenshot ?? null,
      },
    };

    if (updatedDoc.email) {
      try {
        // sendVerificationEmail expects (to:string, registration: { ... }, action, admin, notes)
        // we pass a narrow typed payload above
        emailResult = (await sendVerificationEmail(
          String(updatedDoc.email),
          emailPayload as unknown as Record<string, unknown>, // helper accepts a loose shape; cast to keep TS satisfied
          action === "verify" ? "verified" : "rejected",
          adminIdentifier,
          notes
        )) as EmailResult;
      } catch (err) {
        console.error("Email send failed:", err);
        emailResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Persist email metadata (best-effort)
    try {
      const emailMeta: EmailMetadata = {
        sentAt: new Date(),
        ok: emailResult.ok,
        error: emailResult.ok ? null : (emailResult.error ?? null),
        raw: emailResult.resp ?? null,
        messageId: null,
      };

      const sgHeaders = emailResult.resp?.[0]?.headers;
      if (sgHeaders) {
        emailMeta.messageId = sgHeaders["x-message-id"] ?? null;
      }

      await Registration.findByIdAndUpdate(id, {
        $set: { "paymentProof.email": emailMeta },
      }).exec();
    } catch (err) {
      console.error("Failed to persist email metadata:", err);
    }

    // Create remote student when verified
    let createResult: CreateUserResult | null = null;
    if (action === "verify" && updatedDoc.email) {
      try {
        createResult = (await createRemoteStudentIfNotExists(
          String(updatedDoc.email),
          updatedDoc.name ?? "",
          { registrationId: String(updatedDoc._id) }
        )) as CreateUserResult;

        // Store creation info for audit
        await Registration.findByIdAndUpdate(id, {
          $set: {
            "paymentProof.createdRemoteUser": {
              createdAt: new Date(),
              result: createResult,
            },
          },
        }).exec();
      } catch (err) {
        console.error("Failed to create remote student:", err);
        createResult = { created: false, error: err instanceof Error ? err.message : String(err) };

        await Registration.findByIdAndUpdate(id, {
          $set: {
            "paymentProof.createdRemoteUser": {
              createdAt: new Date(),
              error: createResult.error,
            },
          },
        }).exec();
      }
    }

    // Final registration snapshot
    const finalRegistration = (await Registration.findById(id).lean()) as RegistrationLean | null;

    return NextResponse.json({
      ok: true,
      registration: finalRegistration,
      email: emailResult,
      createUser: createResult,
    });
  } catch (error) {
    // handleError returns NextResponse
    return handleError(error, "Failed to process registration verification");
  }
}
