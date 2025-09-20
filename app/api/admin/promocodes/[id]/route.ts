// app/api/admin/promocodes/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../../lib/mongodb";
import Promo from "../../../../../models/PromoCode";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth";

async function ensureAdmin() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: unknown = verifyToken(token);
  if (!payload || (payload as any).role !== "admin") throw new Error("forbidden");
  return payload;
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAdmin();
  } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connect();
  try {
    const r = await Promo.findByIdAndDelete(params.id).lean();
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
