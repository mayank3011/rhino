// app/api/promocodes/apply/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const codeRaw = String(body.code ?? "").trim();
    const amountRaw = body.amount;

    if (!codeRaw) {
      return NextResponse.json({ error: "missing_code", message: "Promo code is required" }, { status: 400 });
    }
    const amount = safeNum(amountRaw);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "invalid_amount", message: "Invalid amount provided" }, { status: 400 });
    }

    await connect();

    // Normalize code to uppercase — ensure DB stores normalized code or query with regex.
    const code = codeRaw.toUpperCase();

    // Adjust query if your DB stores code as lowercase — change to { code: code.toLowerCase() } etc.
    const promo = await PromoCode.findOne({ code }).lean();

    if (!promo) {
      // Try case-insensitive fallback if DB codes differ
      const promoFallback = await PromoCode.findOne({ code: { $regex: `^${escapeRegExp(codeRaw)}$`, $options: "i" } }).lean();
      if (!promoFallback) return NextResponse.json({ error: "invalid_code", message: "Promo code not found" }, { status: 404 });
      // use fallback
      Object.assign(promo ?? {}, promoFallback);
    }

    // validate promo (expiry / min amount / uses left)
    const now = new Date();
    if (promo.expiresAt && new Date(promo.expiresAt) < now) {
      return NextResponse.json({ error: "expired", message: "Promo code expired" }, { status: 400 });
    }
    if (promo.minAmount && amount < Number(promo.minAmount)) {
      return NextResponse.json({ error: "min_amount", message: `Minimum amount is ${promo.minAmount}` }, { status: 400 });
    }
    if (promo.usesLimit && promo.usesCount >= promo.usesLimit) {
      return NextResponse.json({ error: "no_uses_left", message: "Promo uses exhausted" }, { status: 400 });
    }

    // compute discount
    let discountAmount = 0;
    const pType = String(promo.type ?? "").toLowerCase();
    const pVal = Number(promo.amount ?? promo.value ?? 0);

    if (pType === "flat") {
      discountAmount = Math.min(pVal, amount);
    } else if (pType === "percent") {
      discountAmount = Math.round((amount * pVal) / 100);
    } else {
      // unknown type -> fallback
      discountAmount = 0;
    }

    const finalAmount = Math.max(0, Math.round(amount - discountAmount));

    // return standard response
    return NextResponse.json({
      ok: true,
      code: promo.code ?? codeRaw,
      discountType: pType,
      discountAmount,
      finalAmount,
    });
  } catch (err: any) {
    console.error("PROMO APPLY ERR:", err);
    return NextResponse.json({ error: "server_error", message: String(err?.message ?? err) }, { status: 500 });
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
