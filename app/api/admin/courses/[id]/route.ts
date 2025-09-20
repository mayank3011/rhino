// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../../lib/mongodb";
import Course from "../../../../../models/Course";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth";
import { z } from "zod";

async function ensureAdmin() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.number().nonnegative().optional(),
  image: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  published: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try { await ensureAdmin(); } catch (err:any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not auth" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.format() }, { status: 422 });

  await connect();
  try {
    const updated = await Course.findByIdAndUpdate(params.id, parsed.data, { new: true, runValidators: true }).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Slug conflict" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try { await ensureAdmin(); } catch (err:any) {
    if (err.message === "unauthenticated") return NextResponse.json({ error: "Not auth" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connect();
  try {
    const r = await Course.findByIdAndDelete(params.id).lean();
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
