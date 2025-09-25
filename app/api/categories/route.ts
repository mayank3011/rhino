// app/api/categories/route.ts
import { NextResponse } from "next/server";
import connect from "../../../lib/mongodb";
import Category from "../../../models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth";
import process from "process";

async function ensureAdmin() {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

export async function GET() {
  await connect();
  const cats = await Category.find().sort({ name: 1 }).lean();
  return NextResponse.json(cats.map(c => ({ _id: c._id.toString(), name: c.name })));
}

export async function POST(req: Request) {
  // admin only
  try {
    await ensureAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Not authorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 422 });

  await connect();
  try {
    const created = await Category.create({ name });
    return NextResponse.json({ _id: created._id.toString(), name: created.name }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Category exists" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Create failed" }, { status: 500 });
  }
}
