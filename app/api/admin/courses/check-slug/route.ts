// app/api/admin/courses/check-slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import mongoose from "mongoose";

// Types
interface CheckSlugRequest {
  slug?: string;
  title?: string;
  excludeId?: string;
}

interface DatabaseQuery {
  slug: string;
  _id?: { $ne: string };
}

interface CheckSlugResponse {
  ok: boolean;
  available: boolean;
  slug?: string;
  message?: string;
}

/** Create URL-friendly slug from text */
function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/** Check if slug is available */
export async function POST(req: NextRequest): Promise<NextResponse<CheckSlugResponse>> {
  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({})) as CheckSlugRequest;
    
    const rawText = body.slug || body.title || "";
    if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
      return NextResponse.json({
        ok: false,
        available: false,
        message: "Slug or title is required"
      }, { status: 400 });
    }

    // Generate slug from input
    const slug = slugify(rawText);
    if (!slug) {
      return NextResponse.json({
        ok: false,
        available: false,
        message: "Could not generate valid slug from input"
      }, { status: 400 });
    }

    // Handle exclude ID for updates
    const excludeId = body.excludeId && 
      typeof body.excludeId === "string" && 
      mongoose.Types.ObjectId.isValid(body.excludeId) 
        ? body.excludeId 
        : null;

    // Connect to database
    await connect();

    // Build query
    const query: DatabaseQuery = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Check if slug exists
    const existingCourse = await Course.findOne(query).lean();

    if (!existingCourse) {
      return NextResponse.json({
        ok: true,
        available: true,
        slug
      });
    }

    return NextResponse.json({
      ok: true,
      available: false,
      slug,
      message: "Slug is already in use"
    });

  } catch (error) {
    console.error("Check slug error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json({
      ok: false,
      available: false,
      message: `Failed to check slug availability: ${errorMessage}`
    }, { status: 500 });
  }
}