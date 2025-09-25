// app/api/promocodes/apply/route.ts

import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";
import { Document } from "mongoose";

// --- Type Definitions ---

// Define the shape of the POST request body
interface ApplyPromoBody {
  code: string;
  amount: number;
}

// Define the essential fields from the PromoCode Mongoose Document needed for logic
interface IPromoCode extends Document {
  code: string;
  type: "flat" | "percent" | "fixed"; // assuming 'fixed' might be used, but logic only handles flat/percent
  amount: number; // The discount value (e.g., 50 for flat, 10 for percent)
  value: number; // Alias for amount in some cases, keeping both safe
  expiresAt?: Date | string;
  minAmount?: number;
  usesLimit?: number;
  usesCount: number;
  // Add other properties that are accessed on the promo object to complete the interface
}

// --- Utility Functions ---

// 1. Fixed 'any' in safeNum function
function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- API Handler ---
export async function POST(req: Request) {
  try {
    // 2. Fixed 'any' for body and destructuring for type safety
    const body: Partial<ApplyPromoBody> = await req.json().catch(() => ({}));
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

    const code = codeRaw.toUpperCase();

    // The result from Mongoose will be cast to IPromoCode for type checking
    let promo: IPromoCode | null = await PromoCode.findOne({ code }).lean() as IPromoCode | null;

    if (!promo) {
      // Try case-insensitive fallback if DB codes differ
      const promoFallback = await PromoCode.findOne({ code: { $regex: `^${escapeRegExp(codeRaw)}$`, $options: "i" } }).lean() as IPromoCode | null;
      
      if (!promoFallback) {
        return NextResponse.json({ error: "invalid_code", message: "Promo code not found" }, { status: 404 });
      }
      
      // Use fallback
      promo = promoFallback;
    }

    // Since we check for `promo` above, TypeScript knows it's not null here
    
    // validate promo (expiry / min amount / uses left)
    const now = new Date();
    if (promo.expiresAt && new Date(promo.expiresAt) < now) {
      return NextResponse.json({ error: "expired", message: "Promo code expired" }, { status: 400 });
    }
    
    // Ensure minAmount is safely converted to number before comparison
    const minAmount = safeNum(promo.minAmount);
    if (Number.isFinite(minAmount) && amount < minAmount) {
      return NextResponse.json({ error: "min_amount", message: `Minimum amount is ${minAmount}` }, { status: 400 });
    }
    
    if (promo.usesLimit && promo.usesCount >= promo.usesLimit) {
      return NextResponse.json({ error: "no_uses_left", message: "Promo uses exhausted" }, { status: 400 });
    }

    // compute discount
    let discountAmount = 0;
    const pType = String(promo.type ?? "").toLowerCase();
    // Use Math.round to safely get the integer value
    const pVal = Math.round(safeNum(promo.amount ?? promo.value ?? 0));

    if (pType === "flat" || pType === "fixed") {
      // Use 'fixed' case as 'flat' based on logic
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
  } catch (err) {
    // 3. Fixed 'any' in catch block
    console.error("PROMO APPLY ERR:", err);
    // Safely extract error message
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}