// app/api/admin/promocodes/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";

export async function GET() {
  await connect();
  const docs = await PromoCode.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code) return NextResponse.json({ error: "missing_code" }, { status: 422 });

    await connect();
    const normalized = String(body.code).trim().toUpperCase();
    // avoid duplicates (simple check)
    const existing = await PromoCode.findOne({ code: normalized }).lean();
    if (existing) return NextResponse.json({ error: "exists", message: "Promo code already exists" }, { status: 409 });

    const doc = await PromoCode.create({
      code: normalized,
      discountType: body.discountType ?? "percent",
      amount: Number(body.amount ?? 0),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      active: body.active !== false,
      minAmount: body.minAmount ? Number(body.minAmount) : undefined,
      usesLimit: body.usesLimit ? Number(body.usesLimit) : undefined,
    });

    return NextResponse.json({ ok: true, promo: doc });
  } catch (err: any) {
    console.error("admin promo create error:", err);
    return NextResponse.json({ error: "server_error", message: err?.message ?? String(err) }, { status: 500 });
  }
}
