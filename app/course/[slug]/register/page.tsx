// app/course/[slug]/register/page.tsx
import React from "react";
import connect from "@/lib/mongodb";
import Course from "@/models/Course";
import { notFound, redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

type Props = { params: { slug: string } };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Robust nested register page:
 * - Looks up by slug (exact, decoded, case-insensitive), then by _id fallback
 * - If not found, redirects to the global /register?course=slug fallback (so users get a working page)
 * - Returns a sanitized course JSON for the client RegisterForm
 */
export default async function Page({ params }: Props) {
  const slugOrId = String(params?.slug ?? "").trim();

  if (!slugOrId) {
    // no slug: redirect to global register page
    return redirect(`/register`);
  }

  // connect to DB
  try {
    await connect();
  } catch (err: any) {
    console.error("Mongo connect failed:", err);
    // if DB not reachable, show 404 (or redirect)
    return notFound();
  }

  let course: any = null;

  try {
    // 1) exact slug match
    course = await Course.findOne({ slug: slugOrId }).lean();

    // 2) try decoded slug (sometimes incoming values are encoded)
    if (!course) {
      const decoded = decodeURIComponent(slugOrId);
      if (decoded !== slugOrId) {
        course = await Course.findOne({ slug: decoded }).lean();
      }
    }

    // 3) case-insensitive slug match
    if (!course) {
      // use a regex anchored to start/end, escaped
      const rx = new RegExp(`^${escapeRegExp(slugOrId)}$`, "i");
      course = await Course.findOne({ slug: rx }).lean();
    }

    // 4) fallback: if slug looks like a 24-hex ObjectId, try findById
    if (!course) {
      if (/^[a-fA-F0-9]{24}$/.test(slugOrId)) {
        try {
          course = await Course.findById(slugOrId).lean();
        } catch (e) {
          course = null;
        }
      }
    }
  } catch (err: any) {
    console.error("Course lookup error:", err);
    course = null;
  }

  if (!course) {
    // Helpful fallback: redirect to global register page which accepts ?course=<slugOrId>
    // This prevents a dead 404 and still lets users register.
    console.warn(`Course not found for slugOrId="${slugOrId}". Redirecting to global /register fallback.`);
    return redirect(`/register?course=${encodeURIComponent(slugOrId)}`);
  }

  // sanitize / stringify fields we forward to client (no BSON objects)
  const courseJson = {
    _id: String(course._id),
    title: course.title ?? "",
    slug: course.slug ?? "",
    description: course.description ?? "",
    price: Number(course.price ?? 0),
    duration: course.duration ?? "",
    image: course.image ?? "",
    mentor: course.mentor ? {
      name: course.mentor.name ?? "",
      image: course.mentor.image ?? "",
      role: course.mentor.role ?? "",
    } : null,
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <RegisterForm course={courseJson} />
      </div>
    </div>
  );
}
