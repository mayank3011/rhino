// app/api/admin/registrations/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // IMPORTANT: await cookies() in App Router server code
    const c = await (await import("next/headers")).cookies();
    const token = c.get(process.env.COOKIE_NAME || "token")?.value;
    if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    let payload: any;
    try {
      payload = verifyToken(token);
      if (!payload || payload.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    } catch (err) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    await connect();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit") ?? 12)));

    const query: any = {};
    if (status) query.status = status;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { "paymentProof.txnId": { $regex: q, $options: "i" } },
        { course: { $regex: q, $options: "i" } },
      ];
    }

    const total = await Registration.countDocuments(query);
    const docs = await Registration.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ ok: true, registrations: docs, total, page, limit });
  } catch (err: any) {
    console.error("admin registrations GET error:", err);
    return NextResponse.json({ error: "server_error", message: String(err?.message ?? err) }, { status: 500 });
  }
}
