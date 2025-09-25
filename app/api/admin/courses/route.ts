// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import Category from "@/models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { serializeArray } from "@/utils/serialize";
import { z } from "zod";
import mongoose from "mongoose";

/** --- Types --- **/

interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface DatabaseQuery {
  slug: string;
  _id?: { $ne: string };
}

interface CourseCreateData {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  niche: string;
  price: number;
  published: boolean;
  startTime: Date | null;
  duration: string;
  keyOutcomes: string[];
  mentor: {
    name: string;
    image: string;
    imagePublicId: string;
  };
  image: string;
  imagePublicId: string;
  modules: Array<{
    title: string;
    order: number;
    topics: Array<{
      text: string;
      order: number;
    }>;
  }>;
  category?: mongoose.Types.ObjectId;
}

/**
 * Shape returned by Course.create().toObject()
 * Only include fields we use below.
 */
interface CreatedCourseDto {
  _id: mongoose.Types.ObjectId | string;
  title?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  niche?: string;
  price?: number;
  image?: string | null;
  imagePublicId?: string | null;
  mentor?: {
    name?: string;
    image?: string;
    imagePublicId?: string;
  } | null;
  startTime?: Date | string | null;
  duration?: string | null;
  keyOutcomes?: string[] | null;
  published?: boolean | null;
  modules?: unknown[] | null;
  createdAt?: Date | string | null;
}

/** --- Helpers --- */

/** Simple slugify */
function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/** Auth helper */
async function ensureAdmin(): Promise<AuthPayload> {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") throw new Error("forbidden");

  return payload;
}

/** Unique slug generator */
async function makeUniqueSlug(baseSlug: string, excludeId?: string | null): Promise<string> {
  baseSlug = slugify(baseSlug || "course");
  let candidate = baseSlug;
  let counter = 0;

  while (counter <= 1000) {
    const query: DatabaseQuery = { slug: candidate };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: excludeId };
    }
    const exists = await Course.findOne(query).lean();
    if (!exists) return candidate;
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  throw new Error("Could not generate unique slug after 1000 attempts");
}

/** Error handler */
function handleError(error: unknown, defaultMessage = "An error occurred"): NextResponse {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("API Error:", error);

  if (message === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (message === "forbidden") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

/** Safe converters */
function toStringSafe(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      // mongoose ObjectId has toString()
      // cast via unknown to avoid 'any'
      return (v as { toString?: () => string }).toString?.() ?? String(v);
    } catch {
      return null;
    }
  }
  return String(v);
}

function toISOStringSafe(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === "object") {
    const obj = v as { toISOString?: () => string };
    try {
      return obj.toISOString ? obj.toISOString() : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** --- GET (list) --- */
export async function GET() {
  try {
    await ensureAdmin();
    await connect();

    const courses = await Course.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(serializeArray(courses));
  } catch (error) {
    return handleError(error, "Failed to fetch courses");
  }
}

/** --- POST (create) --- */

const TopicSchema = z.object({
  text: z.string().optional().or(z.literal("")).default(""),
  order: z.number().optional().default(0),
});

const ModuleSchema = z.object({
  title: z.string().optional().or(z.literal("")).default(""),
  order: z.number().optional().default(0),
  topics: z.array(TopicSchema).optional().default([]),
});

const CreateCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative").optional().default(0),
  published: z.boolean().optional().default(true),
  categoryId: z.string().optional().nullable(),
  modules: z.array(ModuleSchema).optional().default([]),
  startTime: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  keyOutcomes: z.array(z.string()).optional().default([]),
  mentor: z
    .object({
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      imagePublicId: z.string().optional().nullable(),
    })
    .optional()
    .default({}),
  image: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await ensureAdmin();

    // parse body robustly
    let requestBody: unknown = {};
    try {
      const text = await req.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch {
      try {
        requestBody = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
      }
    }

    const validation = CreateCourseSchema.safeParse(requestBody);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", issues: validation.error.format() }, { status: 422 });
    }
    await connect();
    const data = validation.data;

    // category
    let categoryDoc = null;
    if (data.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(data.categoryId)) {
        return NextResponse.json({ error: "Invalid category ID format" }, { status: 422 });
      }
      categoryDoc = await Category.findById(data.categoryId).lean();
      if (!categoryDoc) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    // slug
    const baseSlug = data.slug && data.slug.trim() !== "" ? data.slug : data.title;
    const finalSlug = await makeUniqueSlug(baseSlug);

    const courseData: CourseCreateData = {
      title: data.title,
      slug: finalSlug,
      metaTitle: data.metaTitle ?? "",
      metaDescription: data.metaDescription ?? "",
      description: data.description ?? "",
      niche: data.niche ?? "",
      price: data.price ?? 0,
      published: data.published ?? true,
      startTime: data.startTime ? new Date(data.startTime) : null,
      duration: data.duration ?? "",
      keyOutcomes: data.keyOutcomes ?? [],
      mentor: {
        name: data.mentor?.name ?? "",
        image: data.mentor?.image ?? "",
        imagePublicId: data.mentor?.imagePublicId ?? "",
      },
      image: data.image ?? "",
      imagePublicId: data.imagePublicId ?? "",
      modules: (data.modules || []).map((module, moduleIndex) => ({
        title: module.title ?? "",
        order: typeof module.order === "number" ? module.order : moduleIndex,
        topics: (module.topics || []).map((topic, topicIndex) => ({
          text: topic.text ?? "",
          order: typeof topic.order === "number" ? topic.order : topicIndex,
        })),
      })),
    };

    if (categoryDoc) {
      courseData.category = new mongoose.Types.ObjectId((categoryDoc as { _id: mongoose.Types.ObjectId | string })._id);
    }

    // create
    const createdCourseDoc = await Course.create(courseData);

    // Convert to plain object and assert shape via unknown -> CreatedCourseDto
    const createdCoursePlain = createdCourseDoc && typeof (createdCourseDoc as { toObject?: () => unknown }).toObject === "function"
      ? ((createdCourseDoc as { toObject: () => unknown }).toObject() as unknown as CreatedCourseDto)
      : (createdCourseDoc as unknown as CreatedCourseDto);

    // build response using safe converters
    const response = {
      _id: toStringSafe(createdCoursePlain._id),
      title: createdCoursePlain.title ?? "",
      slug: createdCoursePlain.slug ?? "",
      metaTitle: createdCoursePlain.metaTitle ?? "",
      metaDescription: createdCoursePlain.metaDescription ?? "",
      description: createdCoursePlain.description ?? "",
      niche: createdCoursePlain.niche ?? "",
      price: typeof createdCoursePlain.price === "number" ? createdCoursePlain.price : 0,
      image: createdCoursePlain.image ?? "",
      imagePublicId: createdCoursePlain.imagePublicId ?? "",
      mentor: createdCoursePlain.mentor ?? { name: "", image: "", imagePublicId: "" },
      startTime: toISOStringSafe(createdCoursePlain.startTime),
      duration: createdCoursePlain.duration ?? "",
      keyOutcomes: Array.isArray(createdCoursePlain.keyOutcomes) ? createdCoursePlain.keyOutcomes : [],
      published: Boolean(createdCoursePlain.published),
      modules: Array.isArray(createdCoursePlain.modules) ? createdCoursePlain.modules : [],
      createdAt: toISOStringSafe(createdCoursePlain.createdAt),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleError(error, "Failed to create course");
  }
}
