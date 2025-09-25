// app/api/register/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    await connect();
    const doc = await Registration.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, registration: doc });
  } catch (err: any) {
    console.error("register GET error:", err);
    return NextResponse.json({ error: "server_error", message: String(err?.message ?? err) }, { status: 500 });
  }
}
