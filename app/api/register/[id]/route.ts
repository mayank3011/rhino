// app/api/register/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import mongoose from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    await connect();
    const doc = await Registration.findById(id).lean();

    if (!doc) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, registration: doc });
  } catch (err) {
    console.error("register GET error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
