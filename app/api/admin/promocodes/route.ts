// app/api/admin/promocodes/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Promo from "../../../../models/PromoCode";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";
import { z } from "zod";

async function ensureAdmin() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

/**
 * Accepts:
 *  - code (string)
 *  - discountType ('percent' | 'fixed')
 *  - amount (string or number) -> coerced to number
 *  - active (boolean) optional
 *  - expiresAt (string ISO/datetime or empty) -> preprocessed to Date | null
 */
const createSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").transform((s) => s.toUpperCase().trim()),
  discountType: z.enum(["percent", "fixed"]),
  amount: z.coerce.number().nonnegative("Amount must be >= 0"),
  active: z.boolean().optional().default(true),
  expiresAt: z.preprocess((v) => {
    // accept empty string, null, or an ISO string
    if (v === "" || v === null || v === undefined) return null;
    // if it's already a Date, pass through
    if (v instanceof Date) return v;
    // if string, try to parse
    return new Date(String(v));
  }, z.union([z.date(), z.null()]).nullable()),
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

export async function GET() {
  try {
    await ensureAdmin();
  } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connect();
  const list = await Promo.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();
  } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: formatZodErrors(parsed.error) }, { status: 422 });
  }

  await connect();
  try {
    const created = await Promo.create(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Create failed" }, { status: 500 });
  }
}
