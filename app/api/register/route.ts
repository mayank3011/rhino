// app/api/register/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";

// --- Type Definitions ---

// Interface for the incoming request body
interface RequestBody {
  name?: string;
  email?: string;
  course?: string;
  phone?: string;
  promoCode?: string;
  amount?: number;
  paid?: boolean;
  notes?: string;
  paymentProof?: {
    method?: string;
    txnId?: string;
    screenshot?: string;
    notes?: string;
  };
}

// Interface for the payload sent to Mongoose (based on IRegistration model)
interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  course: string;
  promoCode: string;
  amount: number;
  paid: boolean;
  notes: string;
  status: string;
  paymentProof: {
    method: string;
    txnId: string;
    screenshot: string;
    notes: string;
    submittedAt: Date;
    verifiedAt: null;
    verifiedBy: null;
    verificationNotes: null;
  } | null;
}

export async function POST(req: Request) {
  try {
    // Safely parse body, implicitly typed as unknown
    const body: RequestBody = await req.json().catch(() => ({}));

    // Basic validation
    if (!body.name || !body.email || !body.course) {
      return NextResponse.json(
        { error: "missing_fields", message: "name, email and course are required" },
        { status: 422 }
      );
    }

    // 1. FIXED: Replaced 'any' with a defined interface (RegistrationPayload)
    const payload: RegistrationPayload = {
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
  } catch (err) {
    // 2. FIXED: Replaced 'any' in catch block
    console.error("register API error:", err);
    
    const message = err instanceof Error 
      ? err.message 
      : String(err);
      
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}