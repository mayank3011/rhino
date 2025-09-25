// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User"; // adjust path to your User model
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    // get token cookie (server-side)
    const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload?.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name } = body || {};
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 422 });

    await connect();
    await User.updateOne({ _id: payload.id }, { $set: { name } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("profile update error", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
