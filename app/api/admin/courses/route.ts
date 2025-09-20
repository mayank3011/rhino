// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";
import { z } from "zod";

async function ensureAdmin() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

const schema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  description: z.string().optional(),
  niche: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative().optional().default(0),
  image: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  published: z.boolean().optional().default(true),
});

export async function GET() {
  try { await ensureAdmin(); } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not auth" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connect();
  const list = await Course.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try { await ensureAdmin(); } catch (err: any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not auth" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.format() }, { status: 422 });
  await connect();
  try {
    const created = await Course.create(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Slug exists" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Create failed" }, { status: 500 });
  }
}
