// app/api/admin/promocodes/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connect();
    const id = params.id;
    await PromoCode.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin promo delete error:", err);
    return NextResponse.json({ error: "server_error", message: err?.message ?? String(err) }, { status: 500 });
  }
}
