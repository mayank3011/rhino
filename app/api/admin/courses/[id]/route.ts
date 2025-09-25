// app/api/admin/courses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "../../../../../lib/mongodb";
import Course from "../../../../../models/Course";
import Category from "../../../../../models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth";
import { serializeDoc } from "../../../../../utils/serialize";
import mongoose from "mongoose";

// Types
interface AuthPayload {
  role: string;
  userId: string;
  email: string;
}

interface CourseUpdateBody {
  title?: string;
  description?: string;
  niche?: string;
  price?: number | string;
  published?: boolean;
  startTime?: string;
  duration?: string;
  keyOutcomes?: string[];
  mentor?: {
    name?: string;
    image?: string;
    imagePublicId?: string;
  };
  image?: string;
  imagePublicId?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryId?: string | null;
  slug?: string;
  modules?: Array<{
    title?: string;
    order?: number;
    topics?: Array<{
      text?: string;
      order?: number;
    }>;
  }>;
}

interface CourseUpdate {
  title?: string;
  description?: string;
  niche?: string;
  price?: number;
  published?: boolean;
  startTime?: Date;
  duration?: string;
  keyOutcomes?: string[];
  mentor?: {
    name: string;
    image: string;
    imagePublicId: string;
  };
  image?: string;
  imagePublicId?: string;
  metaTitle?: string;
  metaDescription?: string;
  category?: mongoose.Types.ObjectId | null;
  slug?: string;
  modules?: Array<{
    title: string;
    order: number;
    topics: Array<{
      text: string;
      order: number;
    }>;
  }>;
}

interface DatabaseQuery {
  slug: string;
  _id?: { $ne: string };
}

/** Utility function to create URL-friendly slugs */
function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/** Authentication middleware */
async function ensureAdmin(): Promise<AuthPayload> {
  const token = (await cookies()).get(process.env.COOKIE_NAME || "token")?.value;
  if (!token) throw new Error("unauthenticated");
  
  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload || payload.role !== "admin") throw new Error("forbidden");
  
  return payload;
}

/** Generate unique slug for courses */
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

/** Error handler for API responses */
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id } = await params;
    
    await connect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 422 });
    }
    
    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    return NextResponse.json(serializeDoc(course));
    
  } catch (error) {
    return handleError(error, "Failed to fetch course");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id } = await params;
    
    await connect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 422 });
    }

    const body = await req.json().catch(() => ({})) as CourseUpdateBody;
    const update: CourseUpdate = {};

    // Basic field updates with validation
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.niche !== undefined) update.niche = body.niche;
    if (body.duration !== undefined) update.duration = body.duration;
    if (body.metaTitle !== undefined) update.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) update.metaDescription = body.metaDescription;
    if (body.image !== undefined) update.image = body.image;
    if (body.imagePublicId !== undefined) update.imagePublicId = body.imagePublicId;

    // Price handling with validation
    if (body.price !== undefined) {
      if (typeof body.price === "number") {
        update.price = body.price;
      } else if (typeof body.price === "string" && body.price.trim()) {
        const parsedPrice = Number(body.price);
        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
          update.price = parsedPrice;
        }
      }
    }

    // Boolean field handling
    if (typeof body.published === "boolean") {
      update.published = body.published;
    }

    // Date handling
    if (body.startTime) {
      const startDate = new Date(body.startTime);
      if (!isNaN(startDate.getTime())) {
        update.startTime = startDate;
      }
    }

    // Array handling
    if (Array.isArray(body.keyOutcomes)) {
      update.keyOutcomes = body.keyOutcomes.filter(outcome => 
        typeof outcome === "string" && outcome.trim().length > 0
      );
    }

    // Mentor object handling
    if (body.mentor && typeof body.mentor === "object") {
      update.mentor = {
        name: body.mentor.name ?? "",
        image: body.mentor.image ?? "",
        imagePublicId: body.mentor.imagePublicId ?? ""
      };
    }

    // Modules handling with proper typing
    if (Array.isArray(body.modules)) {
      update.modules = body.modules.map((module, moduleIndex) => ({
        title: module.title ?? "",
        order: typeof module.order === "number" ? module.order : moduleIndex,
        topics: (module.topics || []).map((topic, topicIndex) => ({
          text: topic.text ?? "",
          order: typeof topic.order === "number" ? topic.order : topicIndex
        }))
      }));
    }

    // Category handling
    if (body.categoryId !== undefined) {
      if (body.categoryId === null) {
        update.category = null;
      } else if (typeof body.categoryId === "string" && body.categoryId.trim()) {
        if (!mongoose.Types.ObjectId.isValid(body.categoryId)) {
          return NextResponse.json({ error: "Invalid category ID format" }, { status: 422 });
        }
        
        const category = await Category.findById(body.categoryId).lean();
        if (!category) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        update.category = new mongoose.Types.ObjectId(body.categoryId);
      }
    }

    // Slug handling
    if (typeof body.slug === "string" && body.slug.trim()) {
      try {
        update.slug = await makeUniqueSlug(body.slug, id);
      } catch (slugError) {
        return NextResponse.json({ 
          error: "Failed to generate unique slug", 
          details: slugError instanceof Error ? slugError.message : "Unknown error"
        }, { status: 500 });
      }
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      id, 
      { $set: update }, 
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(serializeDoc(updatedCourse));

  } catch (error) {
    return handleError(error, "Failed to update course");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id } = await params;
    
    await connect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 422 });
    }

    const deletedCourse = await Course.findByIdAndDelete(id);
    
    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Course deleted successfully",
      deletedId: id 
    });

  } catch (error) {
    return handleError(error, "Failed to delete course");
  }
}