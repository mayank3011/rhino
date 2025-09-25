// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../../lib/mongodb";
import Course from "../../../../../models/Course";
import Category from "../../../../../models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth";
import { serializeDoc } from "../../../../../utils/serialize";
import mongoose from "mongoose";

/** same slugify + unique helper used in parent route */
function slugify(s: string) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function ensureAdmin() {
  const token = cookies().get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  const payload: any = verifyToken(token);
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  return payload;
}

async function makeUniqueSlug(baseSlug: string, excludeId?: string | null) {
  baseSlug = slugify(baseSlug || "course");
  let candidate = baseSlug;
  let i = 0;
  while (true) {
    const q: any = { slug: candidate };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) q._id = { $ne: excludeId };
    const exists = await Course.findOne(q).lean();
    if (!exists) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
    if (i > 1000) throw new Error("Could not generate unique slug");
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try { await ensureAdmin(); } catch (e:any) { return NextResponse.json({ error: e.message || "Not authorized" }, { status: 403 }); }
  const { id } = params;
  await connect();
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
  const doc = await Course.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeDoc(doc));
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try { await ensureAdmin(); } catch (e:any) { return NextResponse.json({ error: e.message || "Not authorized" }, { status: 403 }); }
  const { id } = params;
  await connect();
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));

  const update: any = {
    title: body.title ?? undefined,
    description: body.description ?? undefined,
    niche: body.niche ?? undefined,
    price: typeof body.price === "number" ? body.price : body.price ? Number(body.price) : undefined,
    published: typeof body.published === "boolean" ? body.published : undefined,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    duration: body.duration ?? undefined,
    keyOutcomes: Array.isArray(body.keyOutcomes) ? body.keyOutcomes : undefined,
    mentor: body.mentor ? { name: body.mentor.name ?? "", image: body.mentor.image ?? "", imagePublicId: body.mentor.imagePublicId ?? "" } : undefined,
    image: body.image ?? undefined,
    imagePublicId: body.imagePublicId ?? undefined,
    metaTitle: body.metaTitle ?? undefined,
    metaDescription: body.metaDescription ?? undefined,
  };

  // modules handling
  if (Array.isArray(body.modules)) {
    update.modules = body.modules.map((m: any, i: number) => ({ title: m.title ?? "", order: typeof m.order === "number" ? m.order : i, topics: (m.topics || []).map((t: any, j: number) => ({ text: t.text ?? "", order: typeof t.order === "number" ? t.order : j })) }));
  }

  // category
  if (body.categoryId) {
    if (!mongoose.Types.ObjectId.isValid(body.categoryId)) return NextResponse.json({ error: "Invalid categoryId" }, { status: 422 });
    const cat = await Category.findById(body.categoryId).lean();
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    update.category = cat._id;
  } else if (body.categoryId === null) {
    update.category = null;
  }

  // slug handling: if slug present in body and changed, compute unique slug
  if (typeof body.slug === "string") {
    try {
      const unique = await makeUniqueSlug(body.slug, id);
      update.slug = unique;
    } catch (err:any) {
      return NextResponse.json({ error: "Slug generation failed", details: String(err) }, { status: 500 });
    }
  }

  try {
    const updated = await Course.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeDoc(updated));
  } catch (err: any) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try { await ensureAdmin(); } catch (e:any) { return NextResponse.json({ error: e.message || "Not authorized" }, { status: 403 }); }
  const { id } = params;
  await connect();
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
  try {
    await Course.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
