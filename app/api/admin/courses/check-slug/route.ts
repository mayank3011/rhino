// app/api/admin/courses/check-slug/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../../../lib/mongodb";
import Course from "../../../../../../models/Course";
import mongoose from "mongoose";

function slugify(s: string) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = body.slug || body.title || "";
  if (!raw) return NextResponse.json({ ok: false, available: false, message: "Slug or title required" }, { status: 400 });
  const slug = slugify(raw);
  const excludeId = body.excludeId && mongoose.Types.ObjectId.isValid(body.excludeId) ? body.excludeId : null;

  await connect();
  const q: any = { slug };
  if (excludeId) q._id = { $ne: excludeId };
  const exists = await Course.findOne(q).lean();
  if (!exists) return NextResponse.json({ ok: true, available: true, slug });
  return NextResponse.json({ ok: true, available: false, slug });
}
