// app/api/admin/registrations/[id]/verify/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { createRemoteStudentIfNotExists } from "@/lib/userProvision";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = await (await import("next/headers")).cookies();
    const token = c.get(process.env.COOKIE_NAME || "token")?.value;
    if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    let payload: any;
    try {
      payload = verifyToken(token);
      if (!payload || payload.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    } catch (err) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "").toLowerCase();
    const notes = body.verificationNotes ?? "";
    const paidOverride = typeof body.paid === "boolean" ? body.paid : undefined;

    await connect();

    const now = new Date();
    const adminIdOrEmail = payload.email ?? payload.name ?? payload.sub ?? String(payload.id ?? "admin");

    const update: any = {};

    if (action === "verify") {
      update.status = "verified";
      update.paid = paidOverride === undefined ? true : !!paidOverride;
      update["paymentProof.verifiedAt"] = now;
      update["paymentProof.verifiedBy"] = adminIdOrEmail;
      if (notes) update["paymentProof.verificationNotes"] = notes;
    } else if (action === "reject") {
      update.status = "rejected";
      update.paid = false;
      update["paymentProof.verificationNotes"] = notes || "Rejected by admin";
      update["paymentProof.verifiedAt"] = now;
      update["paymentProof.verifiedBy"] = adminIdOrEmail;
    } else {
      return NextResponse.json({ error: "invalid_action", message: "action must be 'verify' or 'reject'" }, { status: 422 });
    }

    // update registration
    const doc = await Registration.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // send verification email (existing behavior)
    let emailResult: any = { ok: false, error: "not_sent" };
    try {
      if (doc.email) {
        emailResult = await sendVerificationEmail(doc.email, doc, action === "verify" ? "verified" : "rejected", adminIdOrEmail, notes);
      }
    } catch (e: any) {
      console.error("email send failed", e);
      emailResult = { ok: false, error: String(e?.message ?? e) };
    }

    // persist email meta
    try {
      const emailMeta: any = {
        sentAt: new Date(),
        ok: !!emailResult.ok,
        error: emailResult.ok ? null : (emailResult.error ?? null),
        raw: emailResult.resp ?? null,
      };
      const sgHeaders = emailResult?.resp?.[0]?.headers;
      if (sgHeaders) {
        emailMeta.messageId = sgHeaders["x-message-id"] ?? null;
      }
      await Registration.findByIdAndUpdate(id, { $set: { "paymentProof.email": emailMeta } }).exec();
    } catch (e) {
      console.error("persist email meta failed", e);
    }

    // ---- NEW: create remote student in other cluster when verified ----
    let createResult: any = null;
    if (action === "verify" && doc.email) {
      try {
        createResult = await createRemoteStudentIfNotExists(doc.email, doc.name ?? "", { registrationId: doc._id });
        // store info in registration metadata for audit
        await Registration.findByIdAndUpdate(id, {
          $set: { "paymentProof.createdRemoteUser": { createdAt: new Date(), result: createResult } },
        }).exec();
      } catch (e: any) {
        console.error("create remote student failed", e);
        createResult = { created: false, error: String(e?.message ?? e) };
        // persist the error
        await Registration.findByIdAndUpdate(id, { $set: { "paymentProof.createdRemoteUser": { createdAt: new Date(), error: createResult.error } } }).exec();
      }
    }

    const updated = await Registration.findById(id).lean();
    return NextResponse.json({ ok: true, registration: updated, email: emailResult, createUser: createResult });
  } catch (err: any) {
    console.error("admin verify error:", err);
    return NextResponse.json({ error: "server_error", message: String(err?.message ?? err) }, { status: 500 });
  }
}
