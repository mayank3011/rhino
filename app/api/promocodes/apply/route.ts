// app/api/promocodes/apply/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import connect from "../../../../lib/mongodb";
import Promo from "../../../../models/PromoCode";

const applySchema = z.object({
  code: z.string().min(1, "Code is required"),
  amount: z.coerce.number().nonnegative().optional().default(0),
});

function formatZodErrors(err: z.ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.length ? String(issue.path.join(".")) : "_error";
    out[key] = out[key] || [];
    out[key].push(issue.message);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    // parse + validate payload
    const body = await req.json().catch(() => ({}));
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: formatZodErrors(parsed.error) }, { status: 422 });
    }
    const { code, amount } = parsed.data;

    // ensure DB connection
    try {
      await connect();
    } catch (dbErr: any) {
      console.error("[promocodes.apply] Mongo connect failed:", dbErr);
      return NextResponse.json({ error: "db_connect_failed", detail: String(dbErr?.message ?? dbErr) }, { status: 500 });
    }

    // find promo
    let promo;
    try {
      promo = await Promo.findOne({ code: code.toUpperCase(), active: true }).lean();
    } catch (err: any) {
      console.error("[promocodes.apply] findOne error:", err);
      return NextResponse.json({ error: "db_query_failed", detail: String(err?.message ?? err) }, { status: 500 });
    }

    if (!promo) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }

    // check expiry: convert to Date safely
    try {
      if (promo.expiresAt) {
        const expires = new Date(promo.expiresAt);
        if (isNaN(expires.getTime())) {
          console.warn("[promocodes.apply] promo.expiresAt invalid:", promo.expiresAt);
        } else if (expires.getTime() < Date.now()) {
          return NextResponse.json({ error: "expired" }, { status: 410 });
        }
      }
    } catch (dateErr: any) {
      console.error("[promocodes.apply] expiresAt check error:", dateErr);
    }

    // compute discount
    let discountValue = 0;
    if (promo.discountType === "percent") {
      discountValue = Math.round(((promo.amount / 100) * amount) * 100) / 100;
    } else {
      discountValue = promo.amount;
    }
    const final = Math.max(0, Math.round((amount - discountValue) * 100) / 100);

    return NextResponse.json({
      ok: true,
      code: promo.code,
      discountType: promo.discountType,
      discountAmount: discountValue,
      finalAmount: final,
    });
  } catch (err: any) {
    console.error("[promocodes.apply] Unexpected error:", err);
    return NextResponse.json({ error: "internal_error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
