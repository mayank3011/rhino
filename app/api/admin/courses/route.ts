// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import Course from "../../../../models/Course";
import Category from "../../../../models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";
import { serializeArray } from "../../../../utils/serialize";
import { z } from "zod";
import mongoose from "mongoose";

/** simple slugify */
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

/** Ensure slug unique by checking DB and appending -1, -2, ... */
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

/** GET - list */
export async function GET() {
  try { await ensureAdmin(); } catch (e:any) { return NextResponse.json({ error: e?.message || "Not authorized" }, { status: 403 }); }
  await connect();
  const docs = await Course.find().sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json(serializeArray(docs));
}

/** POST - create */
const TopicSchema = z.object({ text: z.string().optional().or(z.literal("")).default(""), order: z.number().optional().default(0) });
const ModuleSchema = z.object({ title: z.string().optional().or(z.literal("")).default(""), order: z.number().optional().default(0), topics: z.array(TopicSchema).optional().default([]) });
const schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  price: z.number().optional().default(0),
  published: z.boolean().optional().default(true),
  categoryId: z.string().optional().nullable(),
  modules: z.array(ModuleSchema).optional().default([]),
  startTime: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  keyOutcomes: z.array(z.string()).optional().default([]),
  mentor: z.object({
    name: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    imagePublicId: z.string().optional().nullable(),
  }).optional().default({}),
  image: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try { await ensureAdmin(); } catch (e:any) { return NextResponse.json({ error: e?.message || "Not authorized" }, { status: 403 }); }

  let body: any = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.format() }, { status: 422 });

  await connect();

  // category lookup
  let category = null;
  if (parsed.data.categoryId) {
    if (!mongoose.Types.ObjectId.isValid(parsed.data.categoryId)) return NextResponse.json({ error: "Invalid categoryId" }, { status: 422 });
    category = await Category.findById(parsed.data.categoryId).lean();
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // compute slug
  const userSlug = parsed.data.slug && String(parsed.data.slug).trim() !== "" ? parsed.data.slug : parsed.data.title;
  let finalSlug: string;
  try {
    finalSlug = await makeUniqueSlug(userSlug);
  } catch (err: any) {
    return NextResponse.json({ error: "Slug generation failed", details: String(err) }, { status: 500 });
  }

  const createDoc: any = {
    title: parsed.data.title,
    slug: finalSlug,
    metaTitle: parsed.data.metaTitle ?? "",
    metaDescription: parsed.data.metaDescription ?? "",
    description: parsed.data.description ?? "",
    niche: parsed.data.niche ?? "",
    price: parsed.data.price ?? 0,
    published: parsed.data.published ?? true,
    startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : null,
    duration: parsed.data.duration ?? "",
    keyOutcomes: parsed.data.keyOutcomes ?? [],
    mentor: {
      name: parsed.data.mentor?.name ?? "",
      image: parsed.data.mentor?.image ?? "",
      imagePublicId: parsed.data.mentor?.imagePublicId ?? "",
    },
    image: parsed.data.image ?? "",
    imagePublicId: parsed.data.imagePublicId ?? "",
    modules: (parsed.data.modules || []).map((m: any, i: number) => ({
      title: m.title ?? "",
      order: typeof m.order === "number" ? m.order : i,
      topics: (m.topics || []).map((t: any, j: number) => ({ text: t.text ?? "", order: typeof t.order === "number" ? t.order : j })),
    })),
  };

  if (category) createDoc.category = category._id;

  try {
    const created = await Course.create(createDoc);
    return NextResponse.json({
      _id: created._id.toString(),
      title: created.title,
      slug: created.slug,
      metaTitle: created.metaTitle,
      metaDescription: created.metaDescription,
      description: created.description,
      niche: created.niche,
      price: created.price,
      image: created.image || "",
      imagePublicId: created.imagePublicId || "",
      mentor: created.mentor || {},
      startTime: created.startTime ? created.startTime.toISOString() : null,
      duration: created.duration || "",
      keyOutcomes: created.keyOutcomes || [],
      published: Boolean(created.published),
      modules: created.modules || [],
      createdAt: created.createdAt?.toISOString() || null,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Create error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
