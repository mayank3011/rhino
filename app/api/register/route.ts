// app/api/register/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Basic validation
    if (!body.name || !body.email || !body.course) {
      return NextResponse.json({ error: "missing_fields", message: "name, email and course are required" }, { status: 422 });
    }

    const payload: any = {
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: body.phone ? String(body.phone).trim() : "",
      course: String(body.course),
      promoCode: body.promoCode ?? "",
      amount: Number(body.amount ?? 0),
      paid: !!body.paid,
      notes: body.notes ?? "",
      status: "pending",
      paymentProof: null,
    };

    // If paymentProof present, attach and set status appropriately
    if (body.paymentProof && body.paymentProof.txnId && body.paymentProof.screenshot) {
      payload.paymentProof = {
        method: body.paymentProof.method ?? "",
        txnId: body.paymentProof.txnId ?? "",
        screenshot: body.paymentProof.screenshot ?? "",
        notes: body.paymentProof.notes ?? "",
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
      };
      payload.status = "awaiting_verification";
    } else {
      // if paid true and no proof, mark verified (careful)
      if (payload.paid) payload.status = "verified";
    }

    await connect();
    const doc = await Registration.create(payload);

    return NextResponse.json({ ok: true, registrationId: String(doc._id), registration: doc });
  } catch (err: any) {
    console.error("register API error:", err);
    return NextResponse.json({ error: "server_error", message: String(err?.message ?? err) }, { status: 500 });
  }
}
